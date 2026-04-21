from fastapi import FastAPI, UploadFile, File, HTTPException
from transformers import DonutProcessor, VisionEncoderDecoderModel
from PIL import Image, UnidentifiedImageError
import torch
import re
import logging
from PIL import ImageEnhance

MODEL_NAME = "naver-clova-ix/donut-base-finetuned-cord-v2"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
logger = logging.getLogger(__name__)

def enhance_receipt(image):
    image = image.resize((1024, 1024), Image.LANCZOS)
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)      # Kontrast x2
    
    enhancer = ImageEnhance.Sharpness(image)
    image = enhancer.enhance(1.2)      # Schärfe +20%
    
    return image

def parse_price_value(raw_price):
    if not isinstance(raw_price, str):
        return None

    cleaned = re.sub(r"[^\d.,-]", "", raw_price)
    if not cleaned:
        return None

    is_negative = cleaned.startswith("-")
    cleaned = cleaned.lstrip("-")

    if "," in cleaned and "." in cleaned:
        last_dot = cleaned.rfind(".")
        last_comma = cleaned.rfind(",")
        decimal_index = max(last_dot, last_comma)
        integer_part = re.sub(r"[.,]", "", cleaned[:decimal_index])
        decimal_part = re.sub(r"[.,]", "", cleaned[decimal_index + 1:])
        cleaned = f"{integer_part}.{decimal_part}" if decimal_part else integer_part
    elif "," in cleaned:
        parts = cleaned.split(",")
        cleaned = "".join(parts[:-1]) + f".{parts[-1]}" if len(parts) > 1 else parts[0]
    elif "." in cleaned:
        parts = cleaned.split(".")
        cleaned = "".join(parts[:-1]) + f".{parts[-1]}" if len(parts) > 1 else parts[0]

    if is_negative and cleaned:
        cleaned = f"-{cleaned}"

    try:
        return float(cleaned)
    except ValueError as exc:
        logger.debug("Unable to parse price value '%s': %s", raw_price, exc)
        return None

def clean_receipt_data(raw_data):
    if not isinstance(raw_data, list):
        return {"items": [], "totals": {}}

    items = []
    totals = {}
    all_prices = []

    for item in raw_data:
        if not isinstance(item, dict):
            continue

        name = ""
        price = ""

        price_data = item.get("price")

        # Name finden
        if isinstance(item.get("nm"), str):
            name = item["nm"].upper()
        elif isinstance(price_data, dict) and isinstance(price_data.get("nm"), str):
            name = price_data["nm"].upper()

        # Price finden  
        if isinstance(price_data, str):
            price = item["price"]
        elif isinstance(price_data, dict) and isinstance(price_data.get("unitprice"), str):
            price = price_data["unitprice"]
        elif isinstance(item.get("unitprice"), str):
            price = item["unitprice"]
            
        if not name or not price:
            continue

        parsed_price = parse_price_value(price)
        if parsed_price is not None:
            all_prices.append((parsed_price, price.strip()))
            
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
        totals["summe"] = max(all_prices, key=lambda entry: entry[0])[1]
    
    return {
        "items": items,
        "totals": totals
    }

# 1x beim Start laden (bleibt im RAM)
# processor = DonutProcessor.from_pretrained("jinhybr/OCR-Donut-CORD")
# model = VisionEncoderDecoderModel.from_pretrained("jinhybr/OCR-Donut-CORD")
processor = DonutProcessor.from_pretrained(MODEL_NAME)
model = VisionEncoderDecoderModel.from_pretrained(MODEL_NAME).to(DEVICE)
model.eval()

app = FastAPI()

@app.post("/receipt")  # ← Dein Vue fetcht hierhin
async def parse_receipt(file: UploadFile = File(...)):
    # 1. Bild laden
    try:
        image = Image.open(file.file).convert('RGB')
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid image file. Please upload a valid receipt image.") from exc
    
    #Bild vorverarbeiten
    image = enhance_receipt(image)

    # 2. Donut "task prompt" (sagt: "parse receipt")
    task_prompt = "<s_cord-v2>"  
    decoder_input_ids = processor.tokenizer(task_prompt, return_tensors="pt").input_ids.to(DEVICE)
    
    # 3. Bild verarbeiten
    pixel_values = processor(image, return_tensors="pt").pixel_values.to(DEVICE)
    
    # 4. Modell generiert JSON-String
    with torch.inference_mode():
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
    try:
        json_result = processor.token2json(sequence)
    except (ValueError, TypeError, KeyError) as exc:
        logger.warning("Failed to convert model output to JSON: %s", exc)
        json_result = []
    if not isinstance(json_result, list):
        json_result = []
    processed = clean_receipt_data(json_result)

    return {"data": processed}
