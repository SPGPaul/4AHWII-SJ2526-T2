import { enrichReceiptsWithCategories } from "./receipt-category";

export async function loadUserData() {
  const token = localStorage.getItem("token");
  if (!token) return;
  const res = await fetch(
    "https://elegant-eggs-b247740f2b.strapiapp.com/api/users/me?populate=receipts",
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
