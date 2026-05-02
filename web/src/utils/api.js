/**
 * Zentrale API-Endpoints
 * Alle Daten-Fetching-Operationen für das gesamte Projekt
 *
 * WICHTIG: Wenn sich eine API-URL ändert, nur hier ändern!
 */

import { fetchJson, fetchFormData, fetchBlob, setAuthToken } from "./http";
import { enrichReceiptsWithCategories } from "./receipt-category";
import { STRAPI_URL } from "./strapi";

/**
 * ============== AUTHENTIFICATION ==============
 */

/**
 * Login-Anfrage
 * @param {string} identifier - Email oder Username
 * @param {string} password - Password
 * @returns {Promise<{jwt: string, user: Object}>}
 */
export async function apiLogin(identifier, password) {
  const data = await fetchJson(`${STRAPI_URL}/api/auth/local`, {
    method: "POST",
    includeAuth: false,
    body: JSON.stringify({ identifier, password }),
  });
  return data;
}

/**
 * Registrierung
 * @param {string} username - Username
 * @param {string} email - Email
 * @param {string} password - Password (mind. 6 Zeichen)
 * @returns {Promise<{jwt: string, user: Object}>}
 */
export async function apiRegister(username, email, password) {
  const data = await fetchJson(`${STRAPI_URL}/api/auth/local/register`, {
    method: "POST",
    includeAuth: false,
    body: JSON.stringify({ username, email, password }),
  });
  // Automatically save token after successful registration
  if (data?.jwt) {
    setAuthToken(data.jwt);
  }
  return data;
}

/**
 * ============== USER DATA ==============
 */

/**
 * Lade aktuellen User mit allen Daten
 * @returns {Promise<Object>} User-Object mit allen Feldern
 */
export async function apiGetCurrentUser() {
  const data = await fetchJson(`${STRAPI_URL}/api/users/me?populate=receipts`);
  return data;
}

/**
 * Fetch alle User (Admin-Funktion)
 * @returns {Promise<Array>}
 */
export async function apiGetAllUsers() {
  const data = await fetchJson(`${STRAPI_URL}/api/Rechnungs-Radar-Users`);
  return data;
}

/**
 * ============== RECEIPTS ==============
 */

/**
 * Lade Receipts mit Fallback-Strategie
 * Versucht mehrere Endpoints bis einer funktioniert
 * @param {string} token - Auth-Token
 * @param {Object} me - User-Objekt (optional)
 * @returns {Promise<Array>} Normalisierte Receipt-Liste
 */
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
      candidates.push(`${STRAPI_URL}/api/receipts?${withFilters}`);
      candidates.push(
        `${STRAPI_URL}/api/receipts?${withPermissionsUserFilter}`,
      );
    }
  }

  for (const url of candidates) {
    try {
      const response = await fetch(url, { headers });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        console.warn("Fallback receipts request failed", {
          url,
          status: response.status,
        });
        continue;
      }

      const list = extractCollectionItems(body);
      if (list.length > 0) {
        const normalized = list.map(normalizeStrapiEntity);
        normalized.sort((a, b) => {
          const ta = new Date(a?.date || a?.createdAt || 0).getTime();
          const tb = new Date(b?.date || b?.createdAt || 0).getTime();
          return (
            (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0)
          );
        });
        return normalized;
      }
    } catch (err) {
      console.warn("Fallback error:", err);
    }
  }

  return [];
}

/**
 * Lade alle Receipts des Benutzers (mit User-Daten)
 * Falls nicht authentifiziert, Demo-Daten zurückgeben
 * @returns {Promise<Array>}
 */
export async function apiGetReceipts() {
  const token = localStorage.getItem("token");

  // Demo-Daten wenn nicht eingeloggt
  if (!token) {
    return enrichReceiptsWithCategories(buildDemoReceipts());
  }

  try {
    const me = await apiGetCurrentUser();
    let receipts = extractReceiptsFromMeResponse(me);

    if (receipts.length === 0) {
      receipts = await fetchReceiptsFallback(token, me);
    }

    if (receipts.length === 0) {
      receipts = buildDemoReceipts();
    }

    return enrichReceiptsWithCategories(receipts);
  } catch (err) {
    console.error("Failed to load receipts:", err);
    return enrichReceiptsWithCategories(buildDemoReceipts());
  }
}

/**
 * ============== FILE UPLOADS ==============
 */

/**
 * Upload Receipt-Bild zum Backend
 * @param {File} file - Die Bild-Datei
 * @returns {Promise<Object>} Backend-Antwort mit OCR-Daten
 */
export async function apiUploadReceipt(file) {
  const formData = new FormData();
  formData.append("file", file);

  // No auth needed for this endpoint
  const data = await fetchFormData("/api/receipt", formData, {
    includeAuth: false,
  });
  return data;
}

/**
 * Upload Datei zur Strapi-Dateibank
 * @param {File} file - Datei zum Upload
 * @param {string} token - Auth-Token (optional, aus localStorage wenn nicht angegeben)
 * @returns {Promise<Object>}
 */
export async function apiUploadFile(file, token = null) {
  const authToken = token || localStorage.getItem("token");
  const formData = new FormData();
  formData.append("files", file);

  const headers = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return await fetchFormData(`${STRAPI_URL}/api/upload`, formData, {
    headers,
    includeAuth: false,
    includeJson: false,
  });
}

/**
 * ============== DOWNLOADS ==============
 */

/**
 * Download Asset-Bild
 * @param {number|string} assetId - Die Asset-ID
 * @returns {Promise<string|null>} Object-URL zum Bild oder null
 */
export async function apiDownloadImage(assetId) {
  try {
    const fileMeta = await fetchJson(
      `${STRAPI_URL}/api/download/files/${assetId}`,
      { includeAuth: false },
    );

    const possibleUrl =
      fileMeta?.url ||
      fileMeta?.data?.attributes?.url ||
      fileMeta?.data?.attributes?.formats?.thumbnail?.url ||
      null;

    if (!possibleUrl) {
      console.warn("No url found for asset", assetId);
      return null;
    }

    const fullUrl = possibleUrl.startsWith("http")
      ? possibleUrl
      : `${STRAPI_URL.replace(/\/$/, "")}${
          possibleUrl.startsWith("/") ? "" : "/"
        }${possibleUrl}`;

    const blob = await fetchBlob(fullUrl, { includeAuth: false });

    if (!blob.type.startsWith("image/")) {
      console.warn("Downloaded file is not an image", blob.type);
    }

    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Failed to download image:", err);
    return null;
  }
}

/**
 * ============== LOCATIONS ==============
 */

/**
 * Suche Locations
 * @param {string} search - Suchstring
 * @returns {Promise<Array>}
 */
export async function apiSearchLocations(search = "") {
  const query = encodeURIComponent(search);
  const data = await fetchJson(
    `${STRAPI_URL}/api/locations?filters[city][$containsi]=${query}&populate=*`,
  );
  return extractCollectionItems(data);
}

/**
 * ============== LLM / BACKEND API ==============
 */

/**
 * Extrahiere Felder aus OCR-Text mittels LLM
 * @param {string} ocrText - Der erkannte Text vom Receipt
 * @returns {Promise<Object>} {total, date, ...}
 */
export async function apiExtractFieldsFromText(ocrText) {
  const data = await fetchJson("/api/llm/extract-fields", {
    method: "POST",
    includeAuth: false,
    body: JSON.stringify({ ocrText }),
  });
  return data?.data ?? { total: null, date: null };
}

/**
 * Hole Sparempfehlungen vom Backend
 * @param {Array<Object>} receipts - Array von Receipt-Objekten
 * @returns {Promise<Object>}
 */
export async function apiGetSavingsRecommendations(receipts) {
  const data = await fetchJson("/api/llm/savings-recommendations", {
    method: "POST",
    includeAuth: false,
    body: JSON.stringify({ receipts }),
  });
  return data;
}

/**
 * ============== HELPER FUNCTIONS ==============
 */

/**
 * Normalisiere Strapi-Entity (mit nested attributes)
 */
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

/**
 * Extrahiere Receipts aus User-Me-Response
 */
function extractReceiptsFromMeResponse(body) {
  const direct = body?.receipts;
  if (Array.isArray(direct)) return direct.map(normalizeStrapiEntity);
  if (Array.isArray(direct?.data))
    return direct.data.map(normalizeStrapiEntity);

  const nested = body?.data?.receipts;
  if (Array.isArray(nested)) return nested.map(normalizeStrapiEntity);
  if (Array.isArray(nested?.data))
    return nested.data.map(normalizeStrapiEntity);

  return [];
}

/**
 * Extrahiere Collection-Items aus verschiedenen Response-Formaten
 */
function extractCollectionItems(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.receipts)) return body.receipts;
  if (Array.isArray(body?.receipts?.data)) return body.receipts.data;
  if (body?.data && typeof body.data === "object") return [body.data];
  return [];
}

/**
 * Demo-Receipts für nicht-authentifizierte Benutzer
 */
function buildDemoReceipts() {
  const now = Date.now();
  const demoRows = [
    { daysAgo: 1, amount: 19.8, category: "Gastronomie", title: "Lunch Bowl" },
    {
      daysAgo: 2,
      amount: 64.35,
      category: "Supermarkt",
      title: "Wocheneinkauf",
    },
    { daysAgo: 3, amount: 12.4, category: "Mobilität", title: "U-Bahn Ticket" },
    { daysAgo: 4, amount: 33.9, category: "Freizeit", title: "Kinoabend" },
    { daysAgo: 5, amount: 89.99, category: "Shopping", title: "Kopfhörer" },
    { daysAgo: 7, amount: 27.6, category: "Gastronomie", title: "Pizza" },
    {
      daysAgo: 9,
      amount: 45.2,
      category: "Supermarkt",
      title: "Billa Einkauf",
    },
    { daysAgo: 12, amount: 16.75, category: "Gesundheit", title: "Apotheke" },
    { daysAgo: 14, amount: 58.0, category: "Mobilität", title: "Tankstelle" },
    { daysAgo: 18, amount: 24.5, category: "Bildung", title: "Schulmaterial" },
    { daysAgo: 21, amount: 74.2, category: "Wohnen", title: "Haushalt" },
    {
      daysAgo: 24,
      amount: 13.9,
      category: "Gastronomie",
      title: "Kaffee & Snack",
    },
    {
      daysAgo: 27,
      amount: 41.8,
      category: "Supermarkt",
      title: "Hofer Einkauf",
    },
    { daysAgo: 32, amount: 59.9, category: "Freizeit", title: "Fitness Abo" },
    { daysAgo: 36, amount: 22.4, category: "Mobilität", title: "Parkhaus" },
    { daysAgo: 41, amount: 101.5, category: "Wohnen", title: "Baumarkt" },
    { daysAgo: 47, amount: 18.6, category: "Gastronomie", title: "Burger" },
    { daysAgo: 53, amount: 49.7, category: "Shopping", title: "Kleidung" },
    { daysAgo: 58, amount: 29.3, category: "Bildung", title: "Fachbuch" },
    {
      daysAgo: 64,
      amount: 67.45,
      category: "Supermarkt",
      title: "Monatseinkauf",
    },
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
