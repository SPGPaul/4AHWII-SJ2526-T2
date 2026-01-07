import Tesseract from "tesseract.js";

/* --------------------------------------------------------------
   Bild‑Vorverarbeitung (wie vorher)
   -------------------------------------------------------------- */
export async function preprocessCanvas(canvas) {
  // --------------------------------------------------------------
  // 1️⃣ Skalieren auf ca. 1240 px Breite (entspricht ~300 dpi)
  // --------------------------------------------------------------
  const targetWidth = 1240;
  const scale = targetWidth / canvas.width;
  const width = canvas.width * scale;
  const height = canvas.height * scale;

  const scaled = document.createElement("canvas");
  scaled.width = width;
  scaled.height = height;
  const sCtx = scaled.getContext("2d");
  sCtx.drawImage(canvas, 0, 0, width, height);

  // --------------------------------------------------------------
  // 2️⃣ Graustufen‑Umwandlung
  // --------------------------------------------------------------
  const imgData = sCtx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  sCtx.putImageData(imgData, 0, 0);

  // --------------------------------------------------------------
  // 3️⃣ Kontrast + Helligkeit erhöhen
  // --------------------------------------------------------------
  sCtx.filter = "contrast(150%) brightness(110%)";
  sCtx.drawImage(scaled, 0, 0);

  // --------------------------------------------------------------
  // 4️⃣ Binarisierung (einfacher Schwellenwert)
  // --------------------------------------------------------------
  const binData = sCtx.getImageData(0, 0, width, height);
  const d = binData.data;
  for (let i = 0; i < d.length; i += 4) {
    const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
    const val = avg > 127 ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = val;
  }
  sCtx.putImageData(binData, 0, 0);

  // Das vorverarbeitete Canvas zurückgeben
  return scaled;
}

/* --------------------------------------------------------------
   OCR mit sicherer Block‑Sortierung
   -------------------------------------------------------------- */
export async function ocrSorted(canvas) {
  const { data } = await Tesseract.recognize(canvas, "deu", {
    logger: (m) => console.log(m),
    tessedit_pageseg_mode: "1", // Automatic page segmentation
    preserve_interword_spaces: "1",
  });

  // Wenn keine Blöcke erkannt wurden, nutze den reinen Text‑String
  if (!data.blocks || data.blocks.length === 0) {
    console.warn("Tesseract: no text blocks detected");
    return data.text ? data.text.trim() : "";
  }

  // Sortiere erkannte Blöcke nach ihrer y‑Position (oben‑nach‑unten)
  const sorted = data.blocks
    .sort((a, b) => a.bbox.y0 - b.bbox.y0)
    .map((b) => b.text.trim())
    .join("\n");

  return sorted;
}

export function extractEndsumme(text) {
  // Regex‑Erklärung:
  // - Endsumme (optionales "EUR" oder "€")
  // - optionales Leerzeichen / Tab
  // - Betrag: 1+ Ziffern, optional Komma + 2 Ziffern
  const regex = /Endsumme\s*(?:EUR|€)?\s*([0-9]+(?:[.,][0-9]{2})?)/i;
  const match = text.match(regex);
  if (match) {
    return match;
    // Komma in Punkt umwandeln, dann zu Number
    const amount = parseFloat(match[1].replace(",", "."));
    return amount;
  }
  return null; // kein Treffer
}
