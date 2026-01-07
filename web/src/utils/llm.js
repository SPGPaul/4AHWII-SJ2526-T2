// src/utils/llm.js
export async function extractFieldsFromText(ocrText) {
  const prompt = `Du bist ein Assistent, der Rechnungen analysiert.
Extrahiere aus dem folgenden Text die Endsumme (inkl. Währung) und das Rechnungsdatum.
Gib das Ergebnis als JSON zurück.

Text:
"""${ocrText}"""

Ergebnis:`;

  const resp = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer YOUR_TOGETHER_API_KEY`, // <-- eintragen
    },
    body: JSON.stringify({
      model: "gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 200,
    }),
  });

  const json = await resp.json();
  const answer = json.choices[0].message.content.trim();
  // Erwartet ein JSON‑String, z. B. {"total":"23,45 €","date":"2024-11-02"}
  return JSON.parse(answer);
}
