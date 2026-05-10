/**
 * Zentrale API-Endpoints
 * Alle Daten-Fetching-Operationen für das gesamte Projekt
 *
 * WICHTIG: Wenn sich eine API-URL ändert, nur hier ändern!
 */

import { fetchJson, fetchFormData, fetchBlob, setAuthToken } from "./http";
import { enrichReceiptsWithCategories } from "./receipt-category";
import { STRAPI_URL } from "./strapi";

const OLLAMA_GENERATE_URL = "/ollama/api/generate";

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(",", ".").replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractOllamaText(payload) {
  return String(
    payload?.response ??
      payload?.message?.content ??
      payload?.output ??
      payload?.result ??
      "",
  );
}

function parseJsonFromText(text) {
  const match = String(text).match(/\{[\s\S]*\}$/);
  if (!match) {
    throw new Error("Keine JSON-Struktur im Modelloutput gefunden");
  }

  return JSON.parse(match[0]);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };

    reader.onerror = () => {
      reject(reader.error || new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

async function callOllamaGenerate({
  prompt,
  images = [],
  model = "minicpm-v",
  stream = false,
  options = {},
}) {
  const response = await fetch(OLLAMA_GENERATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      images: images.length > 0 ? images : undefined,
      stream,
      options,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => null);
    console.error("ollama error", response.status, text);
    throw new Error(`ollama ${response.status}`);
  }

  return await response.json();
}

function makeOcrPrompt() {
  return (
    "Extrahiere den sichtbaren Text exakt 1:1 aus dem Bild. " +
    "Nicht umschreiben, nichts ergänzen, nur den Text ausgeben."
  );
}

function makeParseReceiptPrompt(ocrText, context = {}) {
  const categoriesText = Array.isArray(context.categories)
    ? context.categories.map((entry) => `- ${entry}`).join("\n")
    : "";
  const paymentTypesText = Array.isArray(context.paymentTypes)
    ? context.paymentTypes.map((entry) => `- ${entry}`).join("\n")
    : "";

  return (
    "Du bist ein präziser Assistent zur Beleg- und Rechnungsanalyse. " +
    "Aus dem folgenden Rohtext des Belegs extrahierst du ausschließlich ein gültiges JSON-Objekt ohne zusätzliche Erklärungen. " +
    "Gib nur das JSON zurück. Verwende Punkt als Dezimaltrennzeichen. Wenn ein Feld nicht gefunden wird, setze es auf null oder ein leeres Array.\n\n" +
    "Das JSON-Objekt muss genau die folgenden Felder enthalten:\n" +
    "{\n" +
    '  "purchaseDate": string|null,          // Datum des Kaufs, Format YYYY-MM-DD wenn möglich\n' +
    '  "scanDate": string|null,              // Datum des Scans, falls bekannt/null sonst null\n' +
    '  "store": string|null,                 // Name/Geschäft/Unternehmen\n' +
    '  "postcodePlace": string|null,         // PLZ und Ort in einem Feld (z.B. "1010 Wien")\n' +
    '  "streetHouseNum": string|null,        // Straße + Hausnummer in einem Feld\n' +
    '  "totals": { "summe": number|null, "gezahlt": number|null, "rueckgeld": number|null },\n' +
    '  "payment_type": string|null,          // z.B. "Barzahlung", "Kartenzahlung"\n' +
    '  "category": string|null,              // Breitere Kategorie: z.B. "Lebensmittel & Supermarkt" oder null\n' +
    '  "items": [ { "name": string, "quantity": number|null, "unitprice": number|null } ],\n' +
    '  "items_text": string|null             // Vollständige Artikel-Liste als editierbarer Fließtext, eine Zeile pro Artikel\n' +
    "}\n\n" +
    "Die Adresse steht meistens im oberen Teil des Belegs direkt unter dem Firmennamen. " +
    "Achte besonders dort auf Straße, Hausnummer sowie PLZ und Ort.\n\n" +
    "KATEGORISIERUNG (wichtig!):\n" +
    "1. Bestehe die folgenden verfügbaren Kategorien aus der Datenbank:\n" +
    `${categoriesText || "Keine Kategorien verfügbar"}\n\n` +
    "2. Versuche aus dem Firmennamen / Kontext eine sinnvolle Kategorie zu erkennen.\n" +
    "3. WENN eine Kategorie aus der Liste oben semantisch passt (auch mit leicht anderem Wortlaut), verwende exakt diesen Namen aus der Liste.\n" +
    "4. NUR wenn keine Kategorie aus der Liste passt, erfinde eine sinnvolle neue Kategorie.\n\n" +
    "ZAHLUNGSART (wichtig!):\n" +
    "1. Verfügbare Zahlungsarten aus der Datenbank:\n" +
    `${paymentTypesText || "Keine Zahlungsarten verfügbar"}\n\n` +
    "2. Erkenne die Zahlungsart vom Beleg (z.B. 'Bar', 'Cash', 'Kartenzahlung', 'Kreditkarte', 'Überweisung').\n" +
    "3. WENN eine Zahlungsart aus der Liste oben semantisch passt (z.B. 'Bar' ≈ 'Barzahlung', 'Karte' ≈ 'Kartenzahlung'), verwende exakt diesen Namen aus der Liste.\n" +
    "4. NUR wenn wirklich keine Zahlungsart aus der Liste passt, erfinde eine sinnvolle neue Zahlungsart.\n" +
    "5. Priorität: Bestehende DB-Einträge vor neuen Erfindungen!\n\n" +
    `Belegtext:\n"""${ocrText}"""`
  );
}

function buildSavingsSnapshot(receipts) {
  const totals = receipts.reduce(
    (accumulator, receipt) => {
      const amount =
        toNumber(receipt?.amount) ??
        toNumber(receipt?.summe) ??
        toNumber(receipt?.total) ??
        toNumber(receipt?.totals?.summe);

      if (amount !== null) {
        accumulator.totalSpend += amount;
        accumulator.receiptsWithAmount += 1;

        const category =
          String(
            receipt?.categoryLabel ||
              receipt?.category_name ||
              receipt?.category ||
              "",
          ).trim() || "Unkategorisiert";

        accumulator.categories.set(
          category,
          (accumulator.categories.get(category) || 0) + amount,
        );
      }

      return accumulator;
    },
    {
      totalSpend: 0,
      receiptsWithAmount: 0,
      categories: new Map(),
    },
  );

  return {
    total_spend: Number(totals.totalSpend.toFixed(2)),
    receipts_with_amount: totals.receiptsWithAmount,
    top_categories: Array.from(totals.categories.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([category, total]) => ({
        category,
        total: Number(total.toFixed(2)),
      })),
  };
}

function makeSavingsRecommendationsPrompt(payload, snapshot) {
  return (
    "Du bist ein Assistent für Haushaltsanalyse. Analysiere die folgenden Belege und gib nur ein gültiges JSON-Objekt zurück. " +
    "Das JSON muss genau diese Form haben:\n" +
    "{\n" +
    '  "summary": string,\n' +
    '  "recommendations": [ { "title": string, "reason": string, "difficulty": "easy"|"medium"|"hard", "estimated_saving_per_month": number } ],\n' +
    '  "risk_notes": [ string ]\n' +
    "}\n" +
    "Keine zusätzliche Erklärung, nur das JSON. Verwende Euro-Beträge als Zahlen.\n\n" +
    `Snapshot:\n${JSON.stringify(snapshot, null, 2)}\n\n` +
    `Eingabedaten:\n${JSON.stringify(payload, null, 2)}`
  );
}

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
  const data = await fetchJson(
    `${STRAPI_URL}/api/users/me?populate[receipts][populate]=picture&populate[receipts][populate]=category`,
  );
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
    "pagination[pageSize]=200&sort[0]=scanDate:desc&publicationState=preview",
    "pagination[pageSize]=200&publicationState=preview",
    "pagination[pageSize]=200&sort[0]=scanDate:desc",
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
export async function apiUploadReceipt(file, context = {}) {
  const isPdf =
    file?.type === "application/pdf" ||
    String(file?.name || "")
      .toLowerCase()
      .endsWith(".pdf");

  if (isPdf) {
    throw new Error("PDF-Uploads werden ohne Backend nicht unterstützt.");
  }

  const ocrResponse = await callOllamaGenerate({
    prompt: makeOcrPrompt(),
    images: [await fileToBase64(file)],
    stream: false,
    options: {
      temperature: 0,
      num_predict: 2048,
    },
  });

  const ocrText = extractOllamaText(ocrResponse);
  if (!ocrText) {
    return {
      data: {
        items: [],
        totals: { summe: null, gezahlt: null, rueckgeld: null },
      },
      ocrText: "",
      raw: ocrResponse,
      model_text: ocrText,
    };
  }

  const parsedData = await apiParseReceiptText(ocrText, context);

  return {
    ...parsedData,
    ocrText,
    raw: ocrResponse,
    model_text: ocrText,
  };
}

export async function apiParseReceiptText(ocrText, context = {}) {
  const response = await callOllamaGenerate({
    prompt: makeParseReceiptPrompt(ocrText, context),
    stream: false,
    options: {
      temperature: 0,
      num_predict: 1024,
    },
  });

  const text = extractOllamaText(response);
  const data = parseJsonFromText(text);

  return { ok: true, data, model_text: text, raw: response };
}

/**
 * Kategorien / Zahlungsarten helper
 */
export async function apiGetCategories() {
  const data = await fetchJson(
    `${STRAPI_URL}/api/categories?pagination[pageSize]=200&populate=*`,
  );
  const items = extractCollectionItems(data);
  return items.map(normalizeStrapiEntity);
}

export async function apiGetPaymentTypes() {
  const data = await fetchJson(
    `${STRAPI_URL}/api/payment-types?pagination[pageSize]=200&populate=*`,
  );
  const items = extractCollectionItems(data);
  return items.map(normalizeStrapiEntity);
}

export async function apiCreateCategory(name) {
  const body = { data: { name } };
  const res = await fetchJson(`${STRAPI_URL}/api/categories`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res?.data || null;
}

export async function apiCreatePaymentType(name) {
  const body = { data: { name } };
  const res = await fetchJson(`${STRAPI_URL}/api/payment-types`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res?.data || null;
}

/**
 * Prüft, ob eine Kategorie mit diesem Namen bereits existiert.
 * Wenn nicht, erstellt sie. Gibt die ID zurück.
 */
export async function apiCheckOrCreateCategory(name) {
  if (!name || typeof name !== "string") return null;
  const trimmedName = String(name).trim();
  if (!trimmedName) return null;

  try {
    const existing = await apiGetCategories();
    const found = (existing || []).find((c) => {
      const catName = c?.attributes?.name || c?.name || "";
      return catName.trim().toLowerCase() === trimmedName.toLowerCase();
    });
    if (found) {
      return found.id;
    }
    const created = await apiCreateCategory(trimmedName);
    return created?.id || null;
  } catch (err) {
    console.error("apiCheckOrCreateCategory error:", err);
    return null;
  }
}

/**
 * Prüft, ob eine Zahlungsart mit diesem Namen bereits existiert.
 * Wenn nicht, erstellt sie. Gibt die ID zurück.
 */
export async function apiCheckOrCreatePaymentType(name) {
  if (!name || typeof name !== "string") return null;
  const trimmedName = String(name).trim();
  if (!trimmedName) return null;

  try {
    const existing = await apiGetPaymentTypes();
    const found = (existing || []).find((p) => {
      const payName = p?.attributes?.name || p?.name || "";
      return payName.trim().toLowerCase() === trimmedName.toLowerCase();
    });
    if (found) {
      return found.id;
    }
    const created = await apiCreatePaymentType(trimmedName);
    return created?.id || null;
  } catch (err) {
    console.error("apiCheckOrCreatePaymentType error:", err);
    return null;
  }
}

/**
 * Wenn in der DB noch keine Kategorie/PaymentType vorhanden ist,
 * frage das LLM nach sinnvollen Default-Einträgen und lege sie an.
 */
export async function apiEnsureDefaultCategoriesAndPaymentTypes() {
  try {
    const existingCats = await apiGetCategories();
    const existingPays = await apiGetPaymentTypes();

    if (
      existingCats &&
      existingCats.length > 0 &&
      existingPays &&
      existingPays.length > 0
    ) {
      return { categories: existingCats, paymentTypes: existingPays };
    }

    const prompt =
      `Gib ein JSON-Objekt mit zwei Arrays zurück: {"categories": [...], "paymentTypes": [...] }.` +
      ` Nenne typische deutsche Kategorien und Zahlungsarten, jeweils ca. 8 Einträge. Gib nur das JSON zurück.`;

    const resp = await callOllamaGenerate({
      prompt,
      stream: false,
      options: { temperature: 0, num_predict: 512 },
    });
    const text = extractOllamaText(resp);
    let parsed = null;
    try {
      parsed = parseJsonFromText(text);
    } catch (err) {
      console.warn("LLM-Defaults konnten nicht geparst werden", err);
      return { categories: existingCats, paymentTypes: existingPays };
    }

    const createdCats = [];
    const createdPays = [];

    if (Array.isArray(parsed.categories)) {
      for (const name of parsed.categories) {
        try {
          const exists = (existingCats || []).find((c) => {
            const n = c?.attributes?.name || c?.name || "";
            return n.trim().toLowerCase() === String(name).trim().toLowerCase();
          });
          if (!exists) {
            const created = await apiCreateCategory(String(name).trim());
            if (created) createdCats.push(created);
          }
        } catch (e) {
          console.warn("Kategorie erstellen fehlgeschlagen", name, e);
        }
      }
    }

    if (Array.isArray(parsed.paymentTypes)) {
      for (const name of parsed.paymentTypes) {
        try {
          const exists = (existingPays || []).find((p) => {
            const n = p?.attributes?.name || p?.name || "";
            return n.trim().toLowerCase() === String(name).trim().toLowerCase();
          });
          if (!exists) {
            const created = await apiCreatePaymentType(String(name).trim());
            if (created) createdPays.push(created);
          }
        } catch (e) {
          console.warn("PaymentType erstellen fehlgeschlagen", name, e);
        }
      }
    }

    // Rückgabe der aktuellen Zustände
    const finalCats = await apiGetCategories();
    const finalPays = await apiGetPaymentTypes();
    return { categories: finalCats, paymentTypes: finalPays };
  } catch (err) {
    console.warn("apiEnsureDefaultCategoriesAndPaymentTypes failed", err);
    return { categories: [], paymentTypes: [] };
  }
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

/**
 * Hole Sparempfehlungen vom Backend
 * @param {Array<Object>} receipts - Array von Receipt-Objekten
 * @returns {Promise<Object>}
 */
export async function apiGetSavingsRecommendations(input) {
  const payload = Array.isArray(input)
    ? { receipts: input }
    : input && typeof input === "object"
      ? input
      : { receipts: [] };
  const receipts = Array.isArray(payload.receipts) ? payload.receipts : [];
  const snapshot = buildSavingsSnapshot(receipts);

  const response = await callOllamaGenerate({
    prompt: makeSavingsRecommendationsPrompt(payload, snapshot),
    stream: false,
    options: {
      temperature: 0.2,
      num_predict: 1024,
    },
  });

  const text = extractOllamaText(response);
  const data = parseJsonFromText(text);
  return { snapshot, data, raw: response, model_text: text };
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
