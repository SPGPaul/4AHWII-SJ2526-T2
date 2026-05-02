/**
 * Zentrale HTTP-Fetch-Funktionen
 * Alle API-Requests sollten über diese Funktionen laufen
 * - Zentrale Token-Verwaltung
 * - Konsistentes Error-Handling
 * - Header-Generierung
 */

/**
 * Hole den Auth-Token aus localStorage
 */
export function getAuthToken() {
  return localStorage.getItem("token");
}

/**
 * Generiere Standard-Header mit optional Auth-Token
 * @param {Object} options - { includeAuth: bool, includeJson: bool }
 * @returns {Object} Header-Object
 */
export function getHeaders(options = {}) {
  const { includeAuth = true, includeJson = true } = options;
  const headers = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Zentralisiertes Fetch mit automatischem Error-Handling
 * @param {string} url - Vollständige URL oder relatives Pfad
 * @param {Object} options - fetch options (method, body, headers, etc)
 * @returns {Promise<Object>} Response als JSON
 * @throws {Error} Bei HTTP-Fehler oder Parse-Error
 */
export async function fetchJson(url, options = {}) {
  const fetchOptions = {
    ...options,
    headers: {
      ...getHeaders({
        includeAuth: options.includeAuth !== false,
        includeJson: options.includeJson !== false,
      }),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, fetchOptions);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      data?.data?.[0]?.messages?.[0]?.message ||
      response.statusText ||
      "Request failed";
    throw new Error(message);
  }

  return data;
}

/**
 * Fetch mit FormData (z.B. für File-Uploads)
 * Setzt automatisch Auth-Header, aber nicht Content-Type
 * (wird von Browser automatisch gesetzt bei FormData)
 * @param {string} url
 * @param {FormData} formData
 * @param {Object} options - zusätzliche fetch options
 * @returns {Promise<Object>}
 */
export async function fetchFormData(url, formData, options = {}) {
  const fetchOptions = {
    method: "POST",
    ...options,
    headers: {
      ...(getHeaders({
        includeAuth: options.includeAuth !== false,
        includeJson: false,
      }) || {}),
      ...(options.headers || {}),
    },
    body: formData,
  };

  const response = await fetch(url, fetchOptions);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      data?.data?.[0]?.messages?.[0]?.message ||
      response.statusText ||
      "Upload failed";
    throw new Error(message);
  }

  return data;
}

/**
 * Fetch Binary (z.B. für Bilder)
 * @param {string} url
 * @param {Object} options
 * @returns {Promise<Blob>}
 */
export async function fetchBlob(url, options = {}) {
  const fetchOptions = {
    ...options,
    headers: {
      ...getHeaders({
        includeAuth: options.includeAuth !== false,
        includeJson: false,
      }),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch: HTTP ${response.status} ${response.statusText}`,
    );
  }

  return response.blob();
}

/**
 * Setze den Auth-Token
 * @param {string} token
 */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

/**
 * Logout - entferne Token
 */
export function clearAuthToken() {
  localStorage.removeItem("token");
}

/**
 * Prüfe ob User authentifiziert ist
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getAuthToken();
}
