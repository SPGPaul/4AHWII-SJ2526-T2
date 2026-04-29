export async function getSavingsRecommendations(payload) {
  const resp = await fetch("/api/llm/savings-recommendations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Savings AI request failed: ${resp.status} ${body}`);
  }

  return resp.json();
}