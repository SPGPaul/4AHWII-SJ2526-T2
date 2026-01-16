<template>
  <v-container>
    <div
      id="remote-log"
      style="
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
      "
    ></div>

    <div style="display: flex; align-items: center">
      <video ref="video" autoplay></video>

      <v-btn
        class="camera-button"
        @click="captureImage"
        color="secondary"
        fab
        depressed
        dark
        icon="mdi-camera"
      ></v-btn>

      <v-btn @click="startCamera" color="secondary">Kamera starten</v-btn>
    </div>

    <!-- Roh‑OCR‑Text (optional, zum Debuggen) -->
    <div v-if="extractedText">
      <h3>Extrahierter Text (OCR)</h3>
      <pre>{{ extractedText }}</pre>
    </div>

    <!-- Ergebnis des LLM -->
    <div v-if="receiptInfo">
      <h3>Erkannte Felder</h3>
      <p><strong>Endsumme:</strong> {{ receiptInfo.total }}</p>
      <p><strong>Datum:</strong> {{ receiptInfo.date }}</p>
    </div>

    <canvas ref="canvas" style="display: none"></canvas>
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
video {
  width: 100%;
  height: 400px;
}
</style>
