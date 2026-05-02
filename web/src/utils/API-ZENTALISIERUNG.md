# API-Zentralisierung - Dokumentation

## Übersicht

Die Daten-Fetching-Logik der Vue-App wurde zentralisiert. Dies ermöglicht:

- **Einfache Änderungen**: API-URLs, Strapi-Host, etc. zentral änderbar
- **Konsistente Error-Handling**: Einheitliches Fehler-Handling über die ganze App
- **Token-Management**: Zentrale Token-Verwaltung in `localStorage`
- **Keine Duplizierungen**: Jede API-Operation ist nur einmal definiert

## Datei-Struktur

### Core HTTP Layer

**`src/utils/http.js`** - Niedrigstufige HTTP-Funktionen

```javascript
// Hauptfunktionen:
- fetchJson(url, options) - Standard JSON Requests
- fetchFormData(url, formData, options) - File Uploads
- fetchBlob(url, options) - Binary Downloads
- getHeaders(options) - Header-Generierung mit Token
- getAuthToken() / setAuthToken() / clearAuthToken() - Token-Management
- isAuthenticated() - Auth-Status prüfen
```

**Besonderheiten:**

- Setzt automatisch `Authorization` Header wenn Token vorhanden
- Setzt automatisch `Content-Type: application/json` für JSON Requests
- Konsistentes Error-Handling mit aussagekräftigen Error-Messages
- FormData Uploads funktionieren ohne Content-Type (Browser setzt das automatisch)

### API Layer

**`src/utils/api.js`** - Alle API-Endpoints der App

Struktur:

```javascript
// AUTHENTIFICATION
- apiLogin(identifier, password)
- apiRegister(username, email, password)

// USER DATA
- apiGetCurrentUser()
- apiGetAllUsers()

// RECEIPTS
- apiGetReceipts()

// FILE UPLOADS
- apiUploadReceipt(file)
- apiUploadFile(file, token?)

// DOWNLOADS
- apiDownloadImage(assetId)

// LOCATIONS
- apiSearchLocations(search)

// LLM / BACKEND API
- apiExtractFieldsFromText(ocrText)
- apiGetSavingsRecommendations(receipts)
```

### Auth Layer

**`src/utils/auth.js`** - Authentifizierungswrapper

```javascript
// Diese setzen Token automatisch nach erfolgreichem Auth
-login({ identifier, password }) - register({ username, email, password });
```

### User Data Layer

**`src/utils/loadUser.js`** - User-Daten Loader

```javascript
-loadUserData(); // Lädt User mit Receipts
```

## Wie man neue API-Calls hinzufügt

### 1. Endpoint in `api.js` hinzufügen

```javascript
// Am Ende der entsprechenden Section hinzufügen

/**
 * Neue API-Operation
 * @param {string} param1 - Beschreibung
 * @returns {Promise<Object>}
 */
export async function apiNewOperation(param1) {
  const data = await fetchJson(`${STRAPI_URL}/api/new-endpoint`, {
    method: "POST",
    body: JSON.stringify({ param1 }),
  });
  return data;
}
```

### 2. In Komponente verwenden

```javascript
// In der Komponente
import { apiNewOperation } from "@/utils/api";

// Im Code
const result = await apiNewOperation("value");
```

## Best Practices

### ✅ DO's

1. **Immer über `api.js` abrufen**

   ```javascript
   // ✓ Richtig
   import { apiGetReceipts } from "@/utils/api";
   const receipts = await apiGetReceipts();
   ```

2. **Token wird automatisch hinzugefügt**

   ```javascript
   // ✓ Richtig - Token wird automatisch hinzugefügt
   await apiGetReceipts();

   // Kein lokales Token-Handling nötig!
   ```

3. **Error-Handling in Komponenten**

   ```javascript
   try {
     const data = await apiGetReceipts();
   } catch (err) {
     console.error("Error:", err.message);
     this.notify(err.message);
   }
   ```

4. **Zentrale Strapi-URL nutzen**

   ```javascript
   // ✓ Richtig - STRAPI_URL wird automatisch verwendet
   const data = await apiGetReceipts();

   // Die URL ist in api.js zentral konfiguriert
   ```

### ❌ DON'Ts

1. **Nicht direkt `fetch()` aufrufen**

   ```javascript
   // ✗ Falsch
   const res = await fetch("/api/something", {...});

   // ✓ Richtig
   import { apiSomething } from "@/utils/api";
   await apiSomething();
   ```

2. **Nicht manuell Token hinzufügen**

   ```javascript
   // ✗ Falsch
   const token = localStorage.getItem("token");
   headers["Authorization"] = `Bearer ${token}`;

   // ✓ Richtig - wird automatisch gemacht
   await fetchJson("/api/something");
   ```

3. **Nicht `STRAPI_URL` direkt verwenden (außer in api.js)**

   ```javascript
   // ✗ Falsch - in Komponenten
   import { STRAPI_URL } from "@/utils/strapi";
   fetch(`${STRAPI_URL}/api/something`);

   // ✓ Richtig - über api.js
   import { apiSomething } from "@/utils/api";
   ```

4. **Nicht unterschiedliche Error-Handling-Muster**

   ```javascript
   // ✗ Falsch - Fehler werden bereits in http.js/api.js gehandhabt
   if (!response.ok) { ... }

   // ✓ Richtig - einfach try/catch
   try {
     await apiSomething();
   } catch (err) {
     // Error-Message ist bereits aussagekräftig
   }
   ```

## URL-Änderungen

Wenn sich die Strapi-Host-URL ändert:

1. In `src/utils/strapi.js` anpassen:

   ```javascript
   export const STRAPI_URL = "https://new-url.com";
   ```

2. Oder per `.env` Datei in `web/` :
   ```
   VITE_STRAPI_URL=https://new-url.com
   ```

Das war's! Alle API-Calls aktualisieren sich automatisch, da sie zentral über `api.js` laufen.

## Debugging

### Token-Probleme

```javascript
import { getAuthToken, isAuthenticated } from "@/utils/http";

console.log("Token:", getAuthToken());
console.log("Is Authenticated:", isAuthenticated());
```

### API-Response debuggen

```javascript
// In api.js eine `console.log` vor dem Return hinzufügen
export async function apiGetReceipts() {
  const data = await apiGetCurrentUser();
  console.log("DEBUG - Receipts Response:", data); // ← Hinzufügen
  return data;
}
```

### Error-Messages inspizieren

```javascript
try {
  await apiSomething();
} catch (err) {
  console.error("Full error:", err); // ← Zeigt den kompletten Error
  console.error("Message:", err.message); // ← Nur die Message
}
```

## Changelog

### Version 1.0 (Initial Refactor)

- ✅ Zentralisiertes HTTP-Layer (`http.js`)
- ✅ Alle API-Endpoints in `api.js`
- ✅ Token-Management zentral
- ✅ Alle Komponenten angepasst
- ✅ Error-Handling konsistent
