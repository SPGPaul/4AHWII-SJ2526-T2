<template>
  <v-container class="scan-root d-flex align-center justify-center">
    <v-row class="justify-center align-center" style="min-height: 90vh;">
      <v-col cols="12" md="10" lg="8" class="d-flex justify-center align-center">
        <v-card class="scan-card scan-card-large pa-8">
          <v-card-title class="text-center mb-4 scan-title">Beleg scannen</v-card-title>
          <v-card-text>
            <div class="scan-video-row d-flex flex-column align-center justify-center mb-4">
              <video ref="video" class="scan-video mb-2" autoplay></video>
              <div class="scan-btn-row d-flex align-center justify-center gap-3">
                <v-btn class="scan-btn" @click="startCamera" color="secondary" variant="tonal">
                  <v-icon left>mdi-video</v-icon> Kamera starten
                </v-btn>
                <v-btn class="scan-btn" @click="captureImage" color="primary" variant="elevated">
                  <v-icon left>mdi-camera</v-icon> Foto aufnehmen
                </v-btn>
              </div>
            </div>
            <div v-if="extractedText" class="scan-ocr-box mb-3">
              <h3 class="scan-section-title">Extrahierter Text (OCR)</h3>
              <pre class="scan-ocr-text">{{ extractedText }}</pre>
            </div>
            <div v-if="receiptInfo" class="scan-result-box mb-2">
              <h3 class="scan-section-title">Erkannte Felder</h3>
              <v-list dense class="scan-result-list">
                <v-list-item>
                  <v-list-item-title><strong>Endsumme:</strong> {{ receiptInfo.total }}</v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title><strong>Datum:</strong> {{ receiptInfo.date }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
            <canvas ref="canvas" style="display: none"></canvas>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <div id="remote-log" class="scan-log"></div>
  </v-container>
</template>

<script>
/* --------------------------------------------------------------
   1️⃣ Hilfs‑module importieren (müssen im Ordner src/utils liegen)
   -------------------------------------------------------------- */
import {
  preprocessCanvas,
  ocrSorted,
  extractEndsumme,
} from "@/utils/ocr-helpers";
import { extractFieldsFromText } from "@/utils/llm";

/* --------------------------------------------------------------
   2️⃣ Logging‑Hilfsfunktion (bleibt unverändert)
   -------------------------------------------------------------- */
function showLog(msg) {
  const el = document.getElementById("remote-log");
  if (el) {
    const p = document.createElement("div");
    p.textContent = new Date().toISOString() + " — " + msg;
    el.appendChild(p);
  }
  console.log(msg);
}
window.addEventListener("error", (e) =>
  showLog(
    "ERROR: " + e.message + " @ " + (e.filename || "") + ":" + (e.lineno || "")
  )
);
window.addEventListener("unhandledrejection", (e) =>
  showLog("UNHANDLED REJECTION: " + (e.reason && e.reason.message) || e.reason)
);

/* --------------------------------------------------------------
   3️⃣ Vue‑Komponente
   -------------------------------------------------------------- */
export default {
  data() {
    return {
      extractedText: "", // roher OCR‑Text (nur zum Debuggen)
      receiptInfo: null, // { total: "...", date: "..." }
    };
  },

  mounted() {
    showLog("mounted");
  },

  methods: {
    /* --------------------------------------------------------------
       Kamera starten – unverändert
       -------------------------------------------------------------- */
    startCamera() {
      showLog("requesting camera");
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          showLog("camera stream OK");
          this.$refs.video.srcObject = stream;
          this.$refs.video
            .play()
            .catch((e) => showLog("video.play() error: " + e.message));
        })
        .catch((err) =>
          showLog("getUserMedia ERR: " + (err && err.name + ": " + err.message))
        );
    },

    /* --------------------------------------------------------------
       Bild aufnehmen, vorverarbeiten, OCR, LLM‑Extraktion
       -------------------------------------------------------------- */
    async captureImage() {
      const canvas = this.$refs.canvas;
      const video = this.$refs.video;

      if (!video.videoWidth || !video.videoHeight) {
        showLog("ERROR: video dimensions not ready");
        return;
      }

      // 1️⃣ Bild vom Video auf das Canvas kopieren
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      // 2️⃣ Vorverarbeitung (Skalieren, Graustufen, Kontrast, Binarisierung)
      const processedCanvas = await preprocessCanvas(canvas);

      // 3️⃣ OCR mit Block‑Sortierung (oben‑nach‑unten)
      const ocrText = await ocrSorted(processedCanvas);
      this.extractedText = ocrText; // optionales Debug‑Feld
      showLog(this.extractedText);
      showLog("OCR fertig");

      const endsumme = extractEndsumme(this.extractedText);
      if (endsumme !== null) {
        showLog(endsumme);
      } else {
        showLog('Kein Betrag nach "Endsumme" gefunden.');
      }
      // 4️⃣ LLM‑Extraktion (Endsumme + Datum)
      /*try {
        const info = await extractFieldsFromText(ocrText);
        this.receiptInfo = info;
        showLog(`LLM‑Ergebnis: ${JSON.stringify(info)}`);
      } catch (e) {
        showLog("LLM‑Fehler: " + e.message);
      }*/
    },
  },
};
</script>

<style scoped>
.scan-card-large {
  max-width: 900px;
  width: 100%;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.scan-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f8fafc 0%, #e0f7fa 100%);
}
.scan-root {
  min-height: 90vh;
  background: linear-gradient(180deg, #f8fafc 0%, #e0f7fa 100%);
}
.scan-card {
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(80, 200, 180, 0.10);
  background: #fff;
}
.scan-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1976d2;
}
.scan-video-row {
  width: 100%;
}
.scan-video {
  width: 100%;
  max-width: 480px;
  height: 320px;
  border-radius: 10px;
  background: #222;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.scan-btn-row {
  gap: 16px;
}
.scan-btn {
  min-width: 160px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
}
.scan-ocr-box, .scan-result-box {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px 12px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(80, 200, 180, 0.04);
}
.scan-section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 8px;
}
.scan-ocr-text {
  font-size: 0.95rem;
  color: #333;
  background: none;
  margin: 0;
}
.scan-result-list {
  background: none;
}
.scan-log {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 35vh;
  overflow: auto;
  background: #111;
  color: #fff;
  z-index: 9999;
  font-size: 12px;
  padding: 6px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  opacity: 0.95;
}
</style>
