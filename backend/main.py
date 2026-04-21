from fastapi import FastAPI, UploadFile, File
from transformers import DonutProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch
import re
from PIL import Image, ImageEnhance

def enhance_receipt(image):
    image = image.resize((1024, 1024), Image.LANCZOS)
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)      # Kontrast x2
    
    enhancer = ImageEnhance.Sharpness(image)
    image = enhancer.enhance(1.2)      # Schärfe +20%
    
    return image

def clean_receipt_data(raw_data):
    items = []
    totals = {}
    all_prices = []

    for item in raw_data:
        name = ""
        price = ""
        
        # Name finden
        if isinstance(item.get("nm"), str):
            name = item["nm"].upper()
        elif isinstance(item.get("price", {}).get("nm"), str):
            name = item["price"]["nm"].upper()
            
        # Price finden  
        if isinstance(item.get("price"), str):
            price = item["price"]
        elif isinstance(item.get("price", {}).get("unitprice"), str):
            price = item["price"]["unitprice"]
        elif isinstance(item.get("unitprice"), str):
            price = item["unitprice"]
            
        if not name or not price:
            continue
            
        # SUMME = GRÖSSTER Betrag mit "SUMME"/"TOTAL"
        if "SUMME" in name or "TOTAL" in name:
            totals["summe"] = price
        elif "RÜCKGELD" in name or "CHANGE" in name:
            totals["rueckgeld"] = price
        elif "GEG" in name or "PAID" in name:
            totals["gezahlt"] = price
        else:
            # Item
            items.append({"name": name.strip(), "price": price.strip()})
    
    # FALLBACK: GRÖSSTER Preis = Summe (wenn "SUMME" fehlt)
    if not totals.get("summe") and all_prices:
            cleaned_prices = [float(re.sub(r'[^\d.,]', '', p.replace(',', '.'))) for p in all_prices]
            totals["summe"] = max(cleaned_prices)
    
    return {
        "items": items,
        "totals": totals
    }

# 1x beim Start laden (bleibt im RAM)
# processor = DonutProcessor.from_pretrained("jinhybr/OCR-Donut-CORD")
# model = VisionEncoderDecoderModel.from_pretrained("jinhybr/OCR-Donut-CORD")
processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
model = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")

app = FastAPI()

@app.post("/receipt")  # ← Dein Vue fetcht hierhin
async def parse_receipt(file: UploadFile = File(...)):
    # 1. Bild laden
    image = Image.open(file.file).convert('RGB')
    print("[RECEIPT] Received file:", file.filename)
    # Bild vorverarbeiten
    image = enhance_receipt(image)

    # 2. Donut "task prompt" (sagt: "parse receipt")
    task_prompt = "<s_cord-v2>"
    decoder_input_ids = processor.tokenizer(task_prompt, return_tensors="pt").input_ids

    # 3. Bild verarbeiten
    pixel_values = processor(image, return_tensors="pt").pixel_values

    # 4. Modell generiert JSON-String
    outputs = model.generate(
        pixel_values,
        decoder_input_ids=decoder_input_ids,
        max_length=2048,      # ← Mehr Platz!
        num_beams=5,          # ← Beam Search
        temperature=0.1,      # ← Deterministischer
        do_sample=False,
        pad_token_id=processor.tokenizer.pad_token_id
    )

    # 5. JSON extrahieren
    sequence = processor.batch_decode(outputs, skip_special_tokens=True)[0]
    sequence = re.sub(r"<.*?>", "", sequence, count=1).strip()
    json_result = processor.token2json(sequence)
    print("🔍 RAW JSON:", json_result)  # ← DEBUG 1
    processed = clean_receipt_data(json_result)
    print("🔍 CLEANED:", processed)    # ← DEBUG 2
    # Log all received receipts (items)
    if processed and processed.get("items"):
        print("[RECEIPT] Items received:")
        for item in processed["items"]:
            print(item)
    else:
        print("[RECEIPT] No items found in receipt.")

    return {"data": processed}