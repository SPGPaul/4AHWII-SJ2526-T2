from fastapi import FastAPI, UploadFile, File, HTTPException
from transformers import DonutProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch
import re
from PIL import Image, ImageEnhance
from pydantic import BaseModel
import httpx
import os
import json
from typing import Any

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


class LlmExtractRequest(BaseModel):
    ocrText: str


class SavingsRecommendationsRequest(BaseModel):
    receipts: list[dict[str, Any]] = []
    monthlyBudget: float | None = None
    currency: str = "EUR"


def parse_json_from_content(content: str):
    content = (content or "").strip()
    if not content:
        return {}

    # Prefer plain JSON output, but handle occasional fenced responses.
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?", "", content).strip()
        content = re.sub(r"```$", "", content).strip()

    return json.loads(content)


def extract_amount(receipt: dict[str, Any]) -> float | None:
    candidates = [
        receipt.get("amount"),
        receipt.get("summe"),
        receipt.get("total"),
        receipt.get("totals", {}).get("summe") if isinstance(receipt.get("totals"), dict) else None,
    ]

    for value in candidates:
        if value is None:
            continue
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            cleaned = value.strip().replace(",", ".")
            cleaned = re.sub(r"[^0-9.]", "", cleaned)
            if not cleaned:
                continue
            try:
                return float(cleaned)
            except ValueError:
                continue
    return None


def build_savings_snapshot(receipts: list[dict[str, Any]]) -> dict[str, Any]:
    total_spend = 0.0
    category_totals: dict[str, float] = {}
    counted = 0

    for receipt in receipts:
        amount = extract_amount(receipt)
        if amount is None:
            continue

        counted += 1
        total_spend += amount

        category = (
            receipt.get("categoryLabel")
            or receipt.get("category_name")
            or receipt.get("category")
            or "Sonstiges"
        )
        category_str = str(category).strip() or "Sonstiges"
        category_totals[category_str] = category_totals.get(category_str, 0.0) + amount

    top_categories = [
        {"category": key, "amount": round(value, 2)}
        for key, value in sorted(category_totals.items(), key=lambda item: item[1], reverse=True)[:5]
    ]

    return {
        "receipts_count": len(receipts),
        "receipts_with_amount": counted,
        "total_spend": round(total_spend, 2),
        "top_categories": top_categories,
    }

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


@app.post("/llm/extract-fields")
async def extract_fields_with_ollama(payload: LlmExtractRequest):
    ocr_text = payload.ocrText.strip()
    if not ocr_text:
        raise HTTPException(status_code=400, detail="ocrText must not be empty")

    ollama_host = os.getenv("OLLAMA_HOST", "http://ollama:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "qwen3:0.6b")

    prompt = (
        "Du bist ein Assistent fuer Rechnungsanalyse. "
        "Extrahiere Rechnungsdatum und Endsumme aus dem Text. "
        "Gib nur ein JSON-Objekt mit den Schluesseln 'total' und 'date' zurueck. "
        "Wenn ein Feld fehlt, setze es auf null.\n\n"
        f"Text:\n\"\"\"{ocr_text}\"\"\""
    )

    request_payload = {
        "model": ollama_model,
        "stream": False,
        "format": "json",
        "messages": [{"role": "user", "content": prompt}],
        "options": {"temperature": 0},
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{ollama_host}/api/chat", json=request_payload)
            resp.raise_for_status()
            body = resp.json()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text if exc.response is not None else str(exc)
        raise HTTPException(status_code=502, detail=f"Ollama error: {detail}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Cannot reach Ollama: {exc}") from exc

    content = body.get("message", {}).get("content", "")
    try:
        parsed = parse_json_from_content(content)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Invalid JSON from model: {content}",
        ) from exc

    return {
        "model": ollama_model,
        "data": {
            "total": parsed.get("total"),
            "date": parsed.get("date"),
        },
    }


@app.get("/llm/health")
async def llm_health():
    ollama_host = os.getenv("OLLAMA_HOST", "http://ollama:11434")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{ollama_host}/api/tags")
            resp.raise_for_status()
            tags = resp.json()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Cannot reach Ollama: {exc}") from exc

    return {"status": "ok", "ollama": tags}


@app.post("/llm/savings-recommendations")
async def savings_recommendations(payload: SavingsRecommendationsRequest):
    receipts = payload.receipts or []
    snapshot = build_savings_snapshot(receipts)

    ollama_host = os.getenv("OLLAMA_HOST", "http://ollama:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "qwen3:0.6b")

    prompt = (
        "Du bist ein Finanz-Assistent fuer private Ausgabenoptimierung. "
        "Erstelle konkrete, realistische Spartipps auf Basis der folgenden Zusammenfassung. "
        "Antworte nur als JSON mit exakt diesem Schema: "
        "{\"summary\": string, \"recommendations\": [{\"title\": string, \"reason\": string, "
        "\"estimated_saving_per_month\": number, \"difficulty\": \"easy\"|\"medium\"|\"hard\"}], "
        "\"risk_notes\": [string]}. "
        "Gib 3 bis 6 recommendations zurueck.\n\n"
        f"Currency: {payload.currency}\n"
        f"Monthly budget (optional): {payload.monthlyBudget}\n"
        f"Snapshot: {json.dumps(snapshot, ensure_ascii=True)}"
    )

    request_payload = {
        "model": ollama_model,
        "stream": False,
        "format": "json",
        "messages": [{"role": "user", "content": prompt}],
        "options": {"temperature": 0.2},
    }

    try:
        async with httpx.AsyncClient(timeout=40.0) as client:
            resp = await client.post(f"{ollama_host}/api/chat", json=request_payload)
            resp.raise_for_status()
            body = resp.json()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text if exc.response is not None else str(exc)
        raise HTTPException(status_code=502, detail=f"Ollama error: {detail}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Cannot reach Ollama: {exc}") from exc

    content = body.get("message", {}).get("content", "")
    try:
        parsed = parse_json_from_content(content)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Invalid JSON from model: {content}",
        ) from exc

    recommendations = parsed.get("recommendations")
    if not isinstance(recommendations, list):
        recommendations = []

    return {
        "model": ollama_model,
        "snapshot": snapshot,
        "data": {
            "summary": parsed.get("summary", ""),
            "recommendations": recommendations,
            "risk_notes": parsed.get("risk_notes", []),
        },
    }