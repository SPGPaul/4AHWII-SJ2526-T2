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

## 3. Strapi-Konfiguration: Receipts sind nicht automatisch benutzerspezifisch

**Datei:** `web/src/utils/loadUser.js`

**Problem:** `loadUser.js` versucht mehrere Fallback-URLs um Belege zu laden, weil Strapi standardmäßig keine Filterung nach Benutzer vornimmt. Wenn die Berechtigungen nicht korrekt gesetzt sind, sieht jeder Benutzer alle Belege aller Benutzer.

**Lösung:** In Strapi unter `Settings → Roles → Authenticated`:

- `receipts.find`: Aktivieren + **nur eigene** erlauben (Policy)
- `receipts.create`: Aktivieren + `user`-Feld automatisch auf den eingeloggten Benutzer setzen

Alternativ eine eigene Strapi-Policy schreiben, die `ctx.state.user.id` als Filter erzwingt.

**Aufwand:** Mittel (Strapi-Konfiguration / Custom Policy)

---

## 4. Production Build: Vite `base` Pfad

**Datei:** `web/vite.config.mjs`

**Problem:** Der Deploy-Pfad muss zum Build-Basis-Pfad passen.

**Lösung:** `base` per Umgebungsvariable setzen:

```js
base: process.env.VITE_BASE_PATH ?? '/4AHWII-SJ2526-T2/',
```

**Aufwand:** Sehr klein

---

## 5. Profil-Passwort-Änderung: Keine Validierung / kein API-Call

**Datei:** `web/src/pages/Profil.vue`

**Problem:** Das Passwort-Feld auf der Profilseite ist vorhanden, aber es gibt weder eine Bestätigungseingabe noch einen tatsächlichen API-Call an Strapi zur Passwortänderung.

**Lösung:** Zweites Passwortfeld für Bestätigung + API-Call an `/api/auth/change-password` (Strapi 4).

**Aufwand:** Klein bis mittel
