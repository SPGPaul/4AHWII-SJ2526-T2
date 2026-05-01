import { enrichReceiptsWithCategories } from "./receipt-category";
import { STRAPI_URL } from "./strapi";

function buildDemoReceipts() {
  const now = Date.now();
  const demoRows = [
    { daysAgo: 1, amount: 19.8, category: "Gastronomie", title: "Lunch Bowl" },
    { daysAgo: 2, amount: 64.35, category: "Supermarkt", title: "Wocheneinkauf" },
    { daysAgo: 3, amount: 12.4, category: "Mobilität", title: "U-Bahn Ticket" },
    { daysAgo: 4, amount: 33.9, category: "Freizeit", title: "Kinoabend" },
    { daysAgo: 5, amount: 89.99, category: "Shopping", title: "Kopfhörer" },
    { daysAgo: 7, amount: 27.6, category: "Gastronomie", title: "Pizza" },
    { daysAgo: 9, amount: 45.2, category: "Supermarkt", title: "Billa Einkauf" },
    { daysAgo: 12, amount: 16.75, category: "Gesundheit", title: "Apotheke" },
    { daysAgo: 14, amount: 58.0, category: "Mobilität", title: "Tankstelle" },
    { daysAgo: 18, amount: 24.5, category: "Bildung", title: "Schulmaterial" },
    { daysAgo: 21, amount: 74.2, category: "Wohnen", title: "Haushalt" },
    { daysAgo: 24, amount: 13.9, category: "Gastronomie", title: "Kaffee & Snack" },
    { daysAgo: 27, amount: 41.8, category: "Supermarkt", title: "Hofer Einkauf" },
    { daysAgo: 32, amount: 59.9, category: "Freizeit", title: "Fitness Abo" },
    { daysAgo: 36, amount: 22.4, category: "Mobilität", title: "Parkhaus" },
    { daysAgo: 41, amount: 101.5, category: "Wohnen", title: "Baumarkt" },
    { daysAgo: 47, amount: 18.6, category: "Gastronomie", title: "Burger" },
    { daysAgo: 53, amount: 49.7, category: "Shopping", title: "Kleidung" },
    { daysAgo: 58, amount: 29.3, category: "Bildung", title: "Fachbuch" },
    { daysAgo: 64, amount: 67.45, category: "Supermarkt", title: "Monatseinkauf" },
  ];

  return demoRows.map((row, index) => {
    const ts = now - row.daysAgo * 24 * 60 * 60 * 1000;
    const iso = new Date(ts).toISOString();
    const id = index + 1;
    return {
      id,
      documentId: `demo-${id}`,
      transaktion: row.title,
      title: row.title,
      amount: row.amount,
      total: row.amount,
      summe: row.amount,
      category_name: row.category,
      categoryLabel: row.category,
      date: iso,
      createdAt: iso,
      unix_time: Math.floor(ts / 1000),
      img: "/vite.svg",
    };
  });
}

function normalizeStrapiEntity(entity) {
  if (!entity || typeof entity !== "object") return entity;
  const attrs = entity.attributes;
  if (attrs && typeof attrs === "object") {
    return {
      id: entity.id,
      documentId: entity.documentId,
      ...attrs,
    };
  }
  return entity;
}

function extractReceiptsFromMeResponse(body) {
  const direct = body?.receipts;
  if (Array.isArray(direct)) return direct.map(normalizeStrapiEntity);
  if (Array.isArray(direct?.data)) return direct.data.map(normalizeStrapiEntity);

  const nested = body?.data?.receipts;
  if (Array.isArray(nested)) return nested.map(normalizeStrapiEntity);
  if (Array.isArray(nested?.data)) return nested.data.map(normalizeStrapiEntity);

  return [];
}

function extractCollectionItems(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.receipts)) return body.receipts;
  if (Array.isArray(body?.receipts?.data)) return body.receipts.data;
  if (body?.data && typeof body.data === "object") return [body.data];
  return [];
}

async function fetchReceiptsFallback(token, me = null) {
  const headers = { Authorization: `Bearer ${token}` };
  const userId = me?.id ?? me?.data?.id ?? null;
  const baseCandidates = [
    "pagination[pageSize]=200&sort[0]=date:desc&publicationState=preview",
    "pagination[pageSize]=200&publicationState=preview",
    "pagination[pageSize]=200&sort[0]=date:desc",
    "pagination[pageSize]=200",
    "",
  ];

  const candidates = [];
  for (const q of baseCandidates) {
    candidates.push(`${STRAPI_URL}/api/receipts${q ? `?${q}` : ""}`);
    if (userId) {
      const withFilters = q
        ? `${q}&filters[user][id][$eq]=${encodeURIComponent(String(userId))}`
        : `filters[user][id][$eq]=${encodeURIComponent(String(userId))}`;
      const withPermissionsUserFilter = q
        ? `${q}&filters[users_permissions_user][id][$eq]=${encodeURIComponent(String(userId))}`
        : `filters[users_permissions_user][id][$eq]=${encodeURIComponent(String(userId))}`;
      candidates.push(
        `${STRAPI_URL}/api/receipts?${withFilters}`,
      );
      candidates.push(
        `${STRAPI_URL}/api/receipts?${withPermissionsUserFilter}`,
      );
    }
  }

  for (const url of candidates) {
    const res = await fetch(url, { headers });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      console.warn("Fallback receipts request failed", {
        url,
        status: res.status,
        error: body?.error?.message || body?.message || res.statusText,
      });
      continue;
    }

    const list = extractCollectionItems(body);
    if (list.length > 0) {
      const normalized = list.map(normalizeStrapiEntity);
      normalized.sort((a, b) => {
        const ta = new Date(a?.date || a?.createdAt || 0).getTime();
        const tb = new Date(b?.date || b?.createdAt || 0).getTime();
        return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
      });
      return normalized;
    }
  }

  return [];
}

export async function loadUserData() {
  const token = localStorage.getItem("token");
  if (!token) {
    return {
      username: "Demo User",
      receipts: enrichReceiptsWithCategories(buildDemoReceipts()),
    };
  }
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

  let receipts = extractReceiptsFromMeResponse(body);
  if (receipts.length === 0) {
    receipts = await fetchReceiptsFallback(token, body);
  }
  if (receipts.length === 0) {
    receipts = buildDemoReceipts();
  }

  receipts = enrichReceiptsWithCategories(receipts);

  return {
    ...body,
    receipts,
  };
}
