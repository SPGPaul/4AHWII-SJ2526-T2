export async function login({ identifier, password }) {
  const res = await fetch(
    "https://elegant-eggs-b247740f2b.strapiapp.com/api/auth/local",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    }
  );

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      body?.error?.message ||
      body?.message ||
      body?.data?.[0]?.messages?.[0]?.message ||
      res.statusText;
    throw new Error(message || "Login failed");
  }
  return body; // { jwt, user }
}
