import { enrichReceiptsWithCategories } from "./receipt-category";
import { STRAPI_URL } from "./strapi";

export async function loadUserData() {
  const token = localStorage.getItem("token");
  if (!token) return;
  const res = await fetch(
    `${STRAPI_URL}/api/users/me?populate=receipts`,
    {
      headers: { Authorization: `Bearer ${token}` },
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

  const receipts = enrichReceiptsWithCategories(
    Array.isArray(body?.receipts) ? body.receipts : [],
  );

  return {
    ...body,
    receipts,
  };
}
