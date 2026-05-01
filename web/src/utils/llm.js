// src/utils/llm.js
export async function extractFieldsFromText(ocrText) {
  const resp = await fetch("/api/llm/extract-fields", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ocrText,
    }),
  });

  if (!resp.ok) {
    const errorBody = await resp.text();
    throw new Error(`LLM request failed: ${resp.status} ${errorBody}`);
  }

  const json = await resp.json();
  return json?.data ?? { total: null, date: null };
}
