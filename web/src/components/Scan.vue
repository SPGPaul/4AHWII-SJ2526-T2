<template>
  <v-container>
    <div style="display: flex; align-items: center">
      <video ref="video" autoplay></video>
      <v-btn
        class="camera-button"
        @click="captureImage"
        color="primary"
        fab
        depressed
        dark
        icon="mdi-camera"
      >
      </v-btn>
    </div>
    <div v-if="extractedText">
      <h3>Extrahierter Text:</h3>
      <p>{{ extractedText }}</p>
    </div>
    <canvas ref="canvas" style="display: none"></canvas>
  </v-container>
</template>

<script>
import Tesseract from "tesseract.js";

export default {
  data() {
    return {
      extractedText: "", // Speichert den extrahierten Text
    };
  },
  mounted() {
    this.startCamera(); // camera starts when page is loaded
  },
  methods: {
    startCamera() {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          this.$refs.video.srcObject = stream;
        })
        .catch((err) => {
          console.error("Fehler beim Zugriff auf die Kamera: ", err);
        });
    },
    captureImage() {
      const canvas = this.$refs.canvas;
      const video = this.$refs.video;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0);

      //extract text:
      Tesseract.recognize(
        canvas.toDataURL(),
        "deu", // oder 'eng' für Englisch
        {
          logger: (info) => console.log(info), // Log-Informationen für Debugging
        }
      ).then(({ data: { text } }) => {
        this.extractedText = text; // Speichern des extrahierten Textes
        console.log(text); // Ausgabe in der Konsole
      });
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
