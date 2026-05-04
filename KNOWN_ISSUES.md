# Bekannte Probleme & offene Aufgaben

Diese Datei dokumentiert Probleme, die **nicht rein im Frontend** gelöst werden können und eine Backend- oder Infrastruktur-Änderung benötigen.

---

## 1. Profil-Seite: Benutzerdaten speichern funktioniert nicht

**Datei:** `web/src/pages/Profil.vue`

**Problem:** Die „Profil speichern"-Schaltfläche ruft aktuell nur `loadUser()` auf, speichert aber nichts. Es gibt keinen API-Aufruf, der die geänderten Felder (Vorname, Nachname, Benutzername, E-Mail, Passwort) zurück an Strapi schickt.

**Lösung:** PUT-Request an `/api/users/{id}` mit dem geänderten Payload unter Verwendung des JWT-Tokens. Strapi muss außerdem so konfiguriert sein, dass `users-permissions`-Benutzer ihre eigenen Daten aktualisieren dürfen.

**Aufwand:** Klein bis mittel (Backend-Berechtigungen + Frontend-Logik)

---

## 2. Ordner-Feature: Nur in localStorage gespeichert

**Datei:** `web/src/components/DirectoryArea.vue`

**Problem:** Verzeichnisse und Belegs-Zuweisungen werden aktuell nur im `localStorage` des Browsers gespeichert. Sie sind daher:
- **nicht geräteübergreifend** verfügbar
- **verloren**, wenn der Browser-Speicher geleert wird
- **nicht benutzerspezifisch** auf dem Server gespeichert

**Lösung:** Einen neuen Strapi Content-Type `directory` erstellen:
```
Directory {
  name: String (required)
  color: String
  user: Relation → users-permissions.user
  receipts: Relation → receipts (many-to-many)
}
```
Dann die Frontend-Komponente auf REST-API-Calls umstellen.

**Aufwand:** Mittel (Strapi Content-Type + Berechtigungen + Frontend-Umbau)

---

## 3. Beleg-Scan: Upload-Endpoint gibt 404 zurück (wenn Python-Backend nicht läuft)

**Datei:** `web/src/components/Scan.vue`, `backend/main.py`

**Problem:** Der `/api/receipt`-Endpunkt wird via Vite-Proxy an `http://backend:8000/receipt` weitergeleitet. Wenn der Python-Container nicht gestartet ist oder das Modell noch lädt, gibt der Upload einen Fehler aus, ohne eine hilfreiche Fehlermeldung anzuzeigen.

**Lösung:** 
- Frontend: Bessere Fehlerbehandlung mit benutzerfreundlicher Meldung
- Backend: Health-Check-Endpoint, Retry-Logik und Ladezeit-Hinweis beim Start

**Aufwand:** Klein

---

## 4. AI Spartipps: Modell muss in Ollama vorhanden sein

**Datei:** `backend/main.py`, `docker-compose.yml`, `Dockerfile`

**Problem:** Der AI-Spartipps-Endpunkt (`/llm/savings-recommendations`) und der OCR-Feldextraktor (`/llm/extract-fields`) verwenden das Modell `qwen3:0.6b`. Das direkte OCR über `server.js` nutzt `minicpm-v`. Beide Modelle müssen in Ollama vorhanden sein – sie werden **nicht** automatisch heruntergeladen.

**Lösung:** Im `Dockerfile` (Root-Verzeichnis, für Ollama-Container) den `ollama pull`-Befehl für beide Modelle ausführen:
```dockerfile
RUN ollama pull qwen3:0.6b
RUN ollama pull minicpm-v
```
Oder ein Entrypoint-Skript erstellen, das den Ollama-Dienst startet und dann die Modelle zieht.

**Aufwand:** Klein (Dockerfile anpassen)

---

## 5. Strapi-Konfiguration: Receipts sind nicht automatisch benutzerspezifisch

**Datei:** `web/src/utils/loadUser.js`

**Problem:** `loadUser.js` versucht mehrere Fallback-URLs um Belege zu laden, weil Strapi standardmäßig keine Filterung nach Benutzer vornimmt. Wenn die Berechtigungen nicht korrekt gesetzt sind, sieht jeder Benutzer alle Belege aller Benutzer.

**Lösung:** In Strapi unter `Settings → Roles → Authenticated`:
- `receipts.find`: Aktivieren + **nur eigene** erlauben (Policy)
- `receipts.create`: Aktivieren + `user`-Feld automatisch auf den eingeloggten Benutzer setzen

Alternativ eine eigene Strapi-Policy schreiben, die `ctx.state.user.id` als Filter erzwingt.

**Aufwand:** Mittel (Strapi-Konfiguration / Custom Policy)

---

## 6. Production Build: Vite `base` Pfad

**Datei:** `web/vite.config.mjs`

**Problem:** `base` ist auf `/4AHWII-SJ2526-T2/` gesetzt. Wenn die App auf einem anderen Pfad deployed wird (z.B. direkt auf `/`), sind alle Assets-Pfade falsch.

**Lösung:** `base` per Umgebungsvariable setzen:
```js
base: process.env.VITE_BASE_PATH ?? '/',
```

**Aufwand:** Sehr klein

---

## 7. Profil-Passwort-Änderung: Keine Validierung / kein API-Call

**Datei:** `web/src/pages/Profil.vue`

**Problem:** Das Passwort-Feld auf der Profilseite ist vorhanden, aber es gibt weder eine Bestätigungseingabe noch einen tatsächlichen API-Call an Strapi zur Passwortänderung.

**Lösung:** Zweites Passwortfeld für Bestätigung + API-Call an `/api/auth/change-password` (Strapi 4).

**Aufwand:** Klein bis mittel
