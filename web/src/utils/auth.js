import { STRAPI_URL } from "./strapi";

export async function login({ identifier, password }) {
  const res = await fetch(
    `${STRAPI_URL}/api/auth/local`,
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
