<template>
  <v-container
    style="z-index: 10; position: relative; padding: 140px; min-height: 500px"
  >
    <!-- TOGGLE: Beleg scannen vs Beleg hochladen -->
    <v-card v-if="scanMode === 'toggle'" class="mb-6 pa-6" elevation="2">
      <v-card-title class="text-center mb-4">Beleg hinzufügen</v-card-title>

      <v-row class="justify-center">
        <v-col cols="12" sm="8" md="6" class="text-center">
          <div class="d-flex align-center justify-center gap-2">
            <v-btn
              :color="selectedTab === 0 ? 'primary' : 'grey'"
              :variant="selectedTab === 0 ? 'elevated' : 'tonal'"
              @click="selectedTab = 0"
              size="large"
              class="px-4"
            >
              <v-icon start>mdi-camera</v-icon>
              Beleg scannen
            </v-btn>
            <v-btn
              :color="selectedTab === 1 ? 'primary' : 'grey'"
              :variant="selectedTab === 1 ? 'elevated' : 'tonal'"
              @click="selectedTab = 1"
              size="large"
              class="px-4"
            >
              <v-icon start>mdi-upload</v-icon>
              Beleg hochladen
            </v-btn>
          </div>

          <!-- START BUTTONS -->
          <v-row class="mt-8">
            <v-col cols="12">
              <v-btn
                v-if="selectedTab === 0"
                color="primary"
                size="x-large"
                block
                @click="startScanMode"
              >
                <v-icon start>mdi-camera</v-icon>
                Kamera starten
              </v-btn>
              <v-file-input
                v-else
                v-model="selectedFile"
                label="📷 Beleg Foto hochladen"
                accept="image/*,.pdf"
                @change="uploadFileReceipt"
                prepend-icon="mdi-camera"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card>

    <!-- CAMERA MODE -->
    <v-card v-if="scanMode === 'scanning'" class="mb-4 pa-4" elevation="2">
      <v-card-title class="d-flex align-center justify-space-between">
        <span><v-icon left>mdi-camera</v-icon>Beleg scannen</span>
        <v-btn icon="mdi-close" variant="text" @click="cancelScan" />
      </v-card-title>

      <v-row class="align-center">
        <v-col cols="12" md="6" class="d-flex ga-2 flex-wrap">
          <v-btn
            color="secondary"
            variant="tonal"
            @click="startCamera"
            :disabled="cameraRunning"
          >
            <v-icon start>mdi-video</v-icon>
            Kamera starten
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="captureImage"
            :disabled="!cameraRunning || loading"
          >
            <v-icon start>mdi-camera</v-icon>
            Foto aufnehmen
          </v-btn>
          <v-btn
            color="grey"
            variant="text"
            @click="stopCamera"
            :disabled="!cameraRunning"
          >
            Kamera stoppen
          </v-btn>
        </v-col>
      </v-row>
      <video
        ref="cameraVideo"
        class="scan-video mt-3"
        autoplay
        playsinline
        muted
      />
      <canvas ref="cameraCanvas" style="display: none" />
      <v-alert
        v-if="extractedText"
        type="info"
        variant="tonal"
        density="comfortable"
        class="mt-3"
      >
        <strong>Extrahierter Text (OCR):</strong>
        <pre class="ocr-preview">{{ extractedText }}</pre>
      </v-alert>
    </v-card>

    <!-- LADE-ANIMATOR -->
    <v-progress-circular
      v-if="loading"
      indeterminate
      color="primary"
      size="64"
      class="mt-4 d-flex justify-center"
    />

    <!-- BEARBEITUNGS-FORMULAR (automatisch gefüllt) -->
    <v-card
      v-if="formReady && (scanMode === 'form' || scanMode === 'uploading')"
      elevation="8"
      class="mt-6"
    >
      <v-card-title class="d-flex justify-space-between form-title">
        <span>
          <v-icon left large>mdi-receipt-text-edit-outline</v-icon>
          Beleg bearbeiten
        </span>
      </v-card-title>

      <v-card class="pa-6 mt-4 form-card" color="white" elevation="4">
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="formData.purchaseDate"
              label="Kaufdatum"
              type="date"
              dense
              outlined
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="formData.scanDate"
              label="Scan-Datum"
              type="date"
              dense
              outlined
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="formData.store"
              label="Geschäft / Firma"
              dense
              outlined
              clearable
            />
          </v-col>
        </v-row>

        <v-row class="mt-2">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="formData.postcodePlace"
              label="PLZ + Ort"
              placeholder="z.B. 1010 Wien"
              dense
              outlined
              clearable
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="formData.streetHouseNum"
              label="Straße + Hausnr."
              dense
              outlined
              clearable
            />
          </v-col>
        </v-row>

        <v-row class="mt-2">
          <v-col cols="12">
            <v-textarea
              v-model="formData.itemsText"
              label="Artikel"
              hint="Alle Produkte als Text, eine Zeile pro Artikel"
              rows="5"
              dense
              outlined
              clearable
            />
          </v-col>
        </v-row>

        <v-row class="mt-2">
          <v-col cols="12" md="6">
            <v-combobox
              v-model="formData.category"
              :items="categories"
              item-title="label"
              item-value="id"
              label="🏷️ Kategorie"
              dense
              outlined
              clearable
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-combobox
              v-model="formData.payment_type"
              :items="paymentTypes"
              item-title="label"
              item-value="id"
              label="💳 Zahlungsart"
              dense
              outlined
              clearable
            />
          </v-col>
        </v-row>
        <v-row class="mt-2">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="formData.summe"
              label="Summe"
              placeholder="z.B. 9,99"
              dense
              outlined
              clearable
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="formData.gezahlt"
              label="Gezahlt"
              placeholder="z.B. 10,00"
              dense
              outlined
              clearable
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="formData.rueckgeld"
              label="Rückgeld"
              placeholder="z.B. 0,01"
              dense
              outlined
              clearable
            />
          </v-col>
        </v-row>
      </v-card>

      <!-- SPEICHERN -->
      <v-card-actions class="pa-4 justify-end">
        <v-btn color="grey" text @click="backToToggle" class="mr-2">
          <v-icon left>mdi-arrow-left</v-icon>
          Zurück
        </v-btn>
        <v-btn
          color="success"
          x-large
          @click="saveReceipt"
          :loading="saving"
          :disabled="!formValid"
        >
          <v-icon left>mdi-content-save-all</v-icon>
          Beleg speichern
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- KEINE DATEN -->
    <v-card
      v-if="!loading && !formReady && scanMode !== 'toggle'"
      elevation="2"
      class="mt-6 text-center pa-8"
    >
      <v-icon size="64" color="grey">mdi-receipt</v-icon>
      <h3 class="mt-4 grey--text">Noch keinen Beleg hochgeladen</h3>
      <p>Wähle ein Foto aus, um zu starten</p>
    </v-card>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3500"
      location="top"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script>
import {
  classifyReceiptCategory,
  PREDEFINED_CATEGORIES,
} from "@/utils/receipt-category";
import { preprocessCanvas, ocrSorted } from "@/utils/ocr-helpers";
import { fetchJson } from "@/utils/http";
import { STRAPI_URL } from "@/utils/strapi";
import {
  apiGetCurrentUser,
  apiUploadReceipt,
  apiSearchLocations,
  apiUploadFile,
  apiEnsureDefaultCategoriesAndPaymentTypes,
  apiGetCategories,
  apiGetPaymentTypes,
  apiCheckOrCreateCategory,
  apiCheckOrCreatePaymentType,
} from "@/utils/api";
import { nextTick } from "vue";

export default {
  data() {
    return {
      // Mode Management
      scanMode: "toggle", // toggle, scanning, uploading, form
      selectedTab: 0, // 0 = camera, 1 = upload

      selectedFile: null,
      result: null,
      loading: false,
      saving: false,
      cameraStream: null,
      cameraRunning: false,
      extractedText: "",
      snackbar: {
        show: false,
        text: "",
        color: "error",
      },

      // Tabs
      activeTab: 0,

      // Bearbeitbares Form-Objekt
      formData: {
        items: [],
        itemsText: "",
        purchaseDate: null,
        scanDate: new Date().toISOString().split("T")[0],
        store: null,
        postcodePlace: null,
        streetHouseNum: null,
        totals: {
          summe: null,
          gezahlt: null,
          rueckgeld: null,
        },
        category: null,
        payment_type: null,
      },

      // Listen für Dropdowns
      locations: [],
      categories: [],
      paymentTypes: [],
    };
  },

  computed: {
    formReady() {
      return Boolean(this.formData.itemsText && this.formData.itemsText.trim());
      // return true;
    },

    formValid() {
      return (
        Number(this.toNumber(this.formData.totals.summe) || 0) > 0 &&
        Boolean(this.formData.itemsText && this.formData.itemsText.trim()) &&
        this.formData.category &&
        this.formData.payment_type
      );
      // return true;
    },

    calculatedRueckgeld() {
      const summe = Number(this.toNumber(this.formData.totals.summe) || 0);
      const gezahlt = Number(this.toNumber(this.formData.totals.gezahlt) || 0);
      const diff = gezahlt - summe;
      return (diff > 0 ? diff : 0).toFixed(2);
    },
  },

  watch: {
    "formData.totals.summe": "syncRueckgeld",
    "formData.totals.gezahlt": "syncRueckgeld",
  },

  async mounted() {
    await this.fetchDropdownData();
  },
  beforeUnmount() {
    this.stopCamera();
  },

  methods: {
    toNumber(value) {
      if (value === null || value === undefined || value === "") return null;
      if (typeof value === "number")
        return Number.isFinite(value) ? value : null;
      const normalized = String(value)
        .replace(/[^\d,.-]/g, "")
        .replace(/\.(?=.*\.)/g, "")
        .replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    },
    notify(text, color = "error") {
      this.snackbar = { show: true, text, color };
    },

    // Mode Management
    startScanMode() {
      this.scanMode = "scanning";
      this.resetFormData();
    },

    cancelScan() {
      this.stopCamera();
      this.scanMode = "toggle";
      this.resetFormData();
    },

    backToToggle() {
      this.stopCamera();
      this.scanMode = "toggle";
      this.resetFormData();
    },

    resetFormData() {
      this.selectedFile = null;
      this.formData = {
        items: [],
        itemsText: "",
        purchaseDate: null,
        scanDate: new Date().toISOString().split("T")[0],
        store: null,
        postcodePlace: null,
        streetHouseNum: null,
        totals: { summe: null, gezahlt: null, rueckgeld: null },
        category: null,
        payment_type: null,
      };
      this.result = null;
      this.extractedText = "";
    },

    uploadFileReceipt() {
      if (this.selectedFile) {
        this.scanMode = "uploading";
        this.uploadReceipt();
      }
    },

    extractEntityLabel(entity, type) {
      const attrs = entity?.attributes || {};
      if (type === "location") {
        const city = attrs.city || entity?.city || "";
        const country = attrs.country || entity?.country || "";
        return [city, country].filter(Boolean).join(", ") || "Unbekannt";
      }
      return attrs.name || entity?.name || "Unbekannt";
    },

    normalizeEntities(list = [], type) {
      return (list || []).map((entry) => {
        const id = entry?.id;
        return {
          id,
          label: this.extractEntityLabel(entry, type),
        };
      });
    },

    formatItemsText(items = []) {
      return items
        .map((item) => {
          const quantity = this.toNumber(item.quantity) ?? 1;
          const unitprice = this.toNumber(item.unitprice) ?? 0;
          return `${String(item.name || "").trim()}, ${quantity}x, ${unitprice.toFixed(2)}€`;
        })
        .filter((line) => line.trim().length > 0)
        .join("\n");
    },

    syncRueckgeld() {
      const computed = Number(this.calculatedRueckgeld);
      this.formData.totals.rueckgeld = Number.isFinite(computed)
        ? computed.toFixed(2)
        : "0.00";
    },

    async uploadReceipt() {
      if (!this.selectedFile) return;

      this.loading = true;
      this.formData = {
        items: [],
        itemsText: "",
        purchaseDate: null,
        scanDate: new Date().toISOString().split("T")[0],
        store: null,
        postcodePlace: null,
        streetHouseNum: null,
        totals: { summe: null, gezahlt: null, rueckgeld: null },
        category: null,
        payment_type: null,
      };

      try {
        // Lade ALLE verfügbaren Kategorien und Zahlungsarten
        const [categoriesData, paymentData] = await Promise.all([
          apiGetCategories(),
          apiGetPaymentTypes(),
        ]);

        console.log("zumersten:");
        console.log(categoriesData);
        this.categories = this.normalizeEntities(
          categoriesData || [],
          "category",
        );
        this.paymentTypes = this.normalizeEntities(
          paymentData || [],
          "payment",
        );

        console.log(this.categories);
        console.log(this.categories.length);
        console.log(`📋 ${this.categories.length} Kategorien geladen`);
        console.log(`💳 ${this.paymentTypes.length} Zahlungsarten geladen`);

        const data = await apiUploadReceipt(this.selectedFile, {
          categories: this.categories.map((entry) => entry.label),
          paymentTypes: this.paymentTypes.map((entry) => entry.label),
        });
        console.log("✅ Backend Response:", data);

        this.result = data;
        this.extractedText = data.ocrText || this.extractedText;
        this.fillFormFromRawData(data.data);
        await this.applyParsedSelections(data.data);
        this.scanMode = "form"; // Switch to form mode after upload
      } catch (error) {
        console.error("❌ Upload Fehler:", error);
        this.notify("Beleg konnte nicht verarbeitet werden.");
        this.scanMode = "toggle"; // Back to toggle on error
        window.scrollTo({ top: 0, behavior: "smooth" });
      } finally {
        this.loading = false;
      }
    },
    async startCamera() {
      if (!navigator?.mediaDevices?.getUserMedia) {
        this.notify("Kamera wird von diesem Browser nicht unterstützt.");
        return;
      }

      if (
        !window.isSecureContext &&
        !["localhost", "127.0.0.1"].includes(window.location.hostname)
      ) {
        this.notify("Kamera funktioniert nur auf HTTPS oder localhost.");
        return;
      }

      if (this.cameraStream) {
        this.stopCamera();
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        await nextTick();

        const video = this.$refs.cameraVideo;
        if (!video) {
          throw new Error("Kamera-Videoelement nicht verfügbar");
        }

        video.srcObject = stream;

        await new Promise((resolve, reject) => {
          const handleLoadedMetadata = () => {
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("error", handleVideoError);
            resolve();
          };

          const handleVideoError = (event) => {
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("error", handleVideoError);
            reject(
              event?.error || new Error("Video konnte nicht gestartet werden"),
            );
          };

          video.addEventListener("loadedmetadata", handleLoadedMetadata, {
            once: true,
          });
          video.addEventListener("error", handleVideoError, { once: true });
        });

        await video.play();

        this.cameraStream = stream;
        this.cameraRunning = true;
      } catch (error) {
        if (stream) {
          for (const track of stream.getTracks()) {
            track.stop();
          }
        }
        console.error("Kamera konnte nicht gestartet werden:", error);
        this.cameraStream = null;
        this.cameraRunning = false;
        this.notify("Kamera konnte nicht gestartet werden.");
      }
    },
    stopCamera() {
      if (this.cameraStream) {
        for (const track of this.cameraStream.getTracks()) {
          track.stop();
        }
      }
      this.cameraStream = null;
      this.cameraRunning = false;
      if (this.$refs.cameraVideo) {
        this.$refs.cameraVideo.pause();
        this.$refs.cameraVideo.srcObject = null;
      }
    },
    async captureImage() {
      const video = this.$refs.cameraVideo;
      const canvas = this.$refs.cameraCanvas;
      if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
        this.notify("Kamera ist noch nicht bereit.");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const processedCanvas = await preprocessCanvas(canvas);
        this.extractedText = await ocrSorted(processedCanvas);
      } catch (error) {
        console.error("OCR fehlgeschlagen:", error);
        this.extractedText = "";
      }

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (resultBlob) => {
            if (!resultBlob) {
              reject(new Error("Kein Bild erstellt"));
              return;
            }
            resolve(resultBlob);
          },
          "image/jpeg",
          0.95,
        );
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      this.selectedFile = new File([blob], `camera-receipt-${timestamp}.jpg`, {
        type: "image/jpeg",
      });
      this.scanMode = "uploading"; // Switch to uploading mode
      await this.uploadReceipt();
    },

    async fetchLocations(search = "") {
      try {
        const data = await apiSearchLocations(search);
        this.locations = this.normalizeEntities(data || [], "location");
      } catch (error) {
        console.error("Locations laden fehlgeschlagen:", error);
      }
    },

    async fetchCategories(search = "") {
      try {
        const query = encodeURIComponent(search);
        const data = await fetchJson(
          `/api/categories?filters[name][$containsi]=${query}&populate=*`,
        );
        this.categories = this.normalizeEntities(data.data || [], "category");
      } catch (error) {
        console.error("Categories laden fehlgeschlagen:", error);
      }
    },

    async fetchPaymentTypes(search = "") {
      try {
        const query = encodeURIComponent(search);
        const data = await fetchJson(
          `/api/payment-types?filters[name][$containsi]=${query}&populate=*`,
        );
        this.paymentTypes = this.normalizeEntities(data.data || [], "payment");
      } catch (error) {
        console.error("PaymentTypes laden fehlgeschlagen:", error);
      }
    },

    async createEntity(path, payload) {
      const endpoint = `${STRAPI_URL}${path}`;
      const response = await fetchJson(endpoint, {
        method: "POST",
        body: JSON.stringify({ data: payload }),
      });
      if (!response?.data?.id) {
        throw new Error(response?.error?.message || "Erstellen fehlgeschlagen");
      }
      return response.data;
    },

    findExistingByLabel(list, value) {
      const normalized = String(value || "")
        .trim()
        .toLowerCase();
      return (
        list.find((entry) => entry.label.toLowerCase() === normalized) || null
      );
    },

    extractComboboxText(value) {
      if (value === null || value === undefined) return "";
      if (typeof value === "string" || typeof value === "number")
        return String(value);
      if (typeof value === "object") {
        if (value.title) return String(value.title);
        if (value.label) return String(value.label);
        if (value.value && Number.isNaN(Number(value.value)))
          return String(value.value);
      }
      return "";
    },

    normalizeText(value) {
      return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    },
    // Levenshtein distance for fuzzy matching
    levenshtein(a = "", b = "") {
      const an = a.length;
      const bn = b.length;
      if (an === 0) return bn;
      if (bn === 0) return an;
      const matrix = Array.from({ length: an + 1 }, () => new Array(bn + 1));
      for (let i = 0; i <= an; i++) matrix[i][0] = i;
      for (let j = 0; j <= bn; j++) matrix[0][j] = j;
      for (let i = 1; i <= an; i++) {
        for (let j = 1; j <= bn; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost,
          );
        }
      }
      return matrix[an][bn];
    },

    findCategoryMatchByLabel(label) {
      const targetRaw = String(label || "");
      const target = this.normalizeText(targetRaw);
      if (!target) return null;

      // Exact normalized match
      const exact = this.categories.find(
        (entry) => this.normalizeText(entry.label) === target,
      );
      if (exact) return exact;

      // Prefer startsWith or contains with reasonable length checks
      const starts = this.categories.find(
        (entry) =>
          this.normalizeText(entry.label).startsWith(target) ||
          target.startsWith(this.normalizeText(entry.label)),
      );
      if (starts) return starts;

      // Fallback: choose best fuzzy match via Levenshtein distance
      let best = null;
      let bestScore = Infinity;
      for (const entry of this.categories || []) {
        const nl = this.normalizeText(entry.label);
        if (!nl) continue;
        const dist = this.levenshtein(nl, target);
        const relative = dist / Math.max(nl.length, target.length);
        // prefer small absolute and relative distance
        if (dist < bestScore && relative <= 0.4) {
          bestScore = dist;
          best = entry;
        }
      }
      return best || null;
    },

    findPaymentTypeMatchByLabel(label) {
      const targetRaw = String(label || "");
      const target = this.normalizeText(targetRaw);
      if (!target) return null;

      const exact = this.paymentTypes.find(
        (entry) => this.normalizeText(entry.label) === target,
      );
      if (exact) return exact;

      const starts = this.paymentTypes.find(
        (entry) =>
          this.normalizeText(entry.label).startsWith(target) ||
          target.startsWith(this.normalizeText(entry.label)),
      );
      if (starts) return starts;

      let best = null;
      let bestScore = Infinity;
      for (const entry of this.paymentTypes || []) {
        const nl = this.normalizeText(entry.label);
        if (!nl) continue;
        const dist = this.levenshtein(nl, target);
        const relative = dist / Math.max(nl.length, target.length);
        if (dist < bestScore && relative <= 0.4) {
          bestScore = dist;
          best = entry;
        }
      }
      return best || null;
    },

    async ensureLocation(value) {
      if (typeof value === "number") return value;
      if (!value) return null;
      if (typeof value === "string" && /^\d+$/.test(value.trim()))
        return Number(value);
      if (typeof value === "object" && value.id) return value.id;
      if (
        typeof value === "object" &&
        value.value &&
        !Number.isNaN(Number(value.value))
      ) {
        return Number(value.value);
      }

      const freeText = this.extractComboboxText(value).trim();
      if (!freeText) return null;

      const existing = this.findExistingByLabel(this.locations, freeText);
      if (existing) return existing.id;

      const raw = freeText;
      const [city, country] = raw.split(",").map((part) => part.trim());
      const created = await this.createEntity("/api/locations", {
        city,
        country: country || "",
      });

      const normalized = {
        id: created.id,
        label: this.extractEntityLabel(created, "location"),
      };
      this.locations.push(normalized);
      return normalized.id;
    },

    async ensureCategory(value) {
      if (typeof value === "number") return value;
      if (!value) return null;
      if (typeof value === "string" && /^\d+$/.test(value.trim()))
        return Number(value);
      if (typeof value === "object" && value.id) return value.id;
      if (
        typeof value === "object" &&
        value.value &&
        !Number.isNaN(Number(value.value))
      ) {
        return Number(value.value);
      }

      const freeText = this.extractComboboxText(value).trim();
      if (!freeText) return null;

      // Verwende die sichere Prüf-und-Erstelle-Funktion
      const categoryId = await apiCheckOrCreateCategory(freeText);
      if (categoryId) {
        // Aktualisiere die lokale Liste, falls neue Kategorie erstellt wurde
        const existing = this.categories.find((c) => c.id === categoryId);
        if (!existing) {
          this.categories.push({ id: categoryId, label: freeText });
        }
      }
      return categoryId;
    },

    async ensurePaymentType(value) {
      if (typeof value === "number") return value;
      if (!value) return null;
      if (typeof value === "string" && /^\d+$/.test(value.trim()))
        return Number(value);
      if (typeof value === "object" && value.id) return value.id;
      if (
        typeof value === "object" &&
        value.value &&
        !Number.isNaN(Number(value.value))
      ) {
        return Number(value.value);
      }

      const freeText = this.extractComboboxText(value).trim();
      if (!freeText) return null;

      // Verwende die sichere Prüf-und-Erstelle-Funktion
      const paymentTypeId = await apiCheckOrCreatePaymentType(freeText);
      if (paymentTypeId) {
        // Aktualisiere die lokale Liste, falls neue Zahlungsart erstellt wurde
        const existing = this.paymentTypes.find((p) => p.id === paymentTypeId);
        if (!existing) {
          this.paymentTypes.push({ id: paymentTypeId, label: freeText });
        }
      }
      return paymentTypeId;
    },

    fillFormFromRawData(rawData) {
      console.log("🔍 Parsing raw data:", rawData);

      const items = [];
      const parsedItems = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
          ? rawData.items
          : [];

      parsedItems.forEach((item) => {
        const name = item.name || item.nm || item.price?.nm || "Unbekannt";
        const unitPriceRaw =
          item.unitprice ||
          item.unitPrice ||
          item.price ||
          item.price?.unitprice;
        const quantityRaw = item.quantity || item.cnt || 1;

        const unitPrice = this.toNumber(unitPriceRaw);
        const quantity = this.toNumber(quantityRaw) || 1;

        if (!name || !unitPrice || unitPrice <= 0) return;

        items.push({
          name: String(name).trim(),
          unitprice: unitPrice.toFixed(2),
          quantity,
        });
      });

      this.formData.items = items;

      // Items raw text (editable block)
      this.formData.itemsText =
        rawData?.items_text ||
        (typeof rawData?.items === "string"
          ? rawData.items
          : items.length > 0
            ? this.formatItemsText(items)
            : "");

      // Purchase / scan dates
      this.formData.purchaseDate = rawData?.purchaseDate || null;
      this.formData.scanDate = rawData?.scanDate || this.formData.scanDate;

      // Store / address
      this.formData.store = rawData?.store || this.formData.store;
      this.formData.postcodePlace = rawData?.postcodePlace || null;
      this.formData.streetHouseNum = rawData?.streetHouseNum || null;

      const summeFromOcr = this.toNumber(rawData?.totals?.summe);
      const gezahltFromOcr = this.toNumber(rawData?.totals?.gezahlt);
      const rueckgeldFromOcr = this.toNumber(rawData?.totals?.rueckgeld);

      const fallbackSum = this.toNumber(rawData?.totalAmount);
      this.formData.totals.summe = Number(
        (summeFromOcr ?? fallbackSum ?? 0).toFixed(2),
      ).toFixed(2);
      this.formData.totals.gezahlt =
        gezahltFromOcr !== null ? gezahltFromOcr.toFixed(2) : null;
      this.formData.totals.rueckgeld =
        rueckgeldFromOcr !== null ? rueckgeldFromOcr.toFixed(2) : null;

      this.syncRueckgeld();

      // Speichere die vom LLM erkannte Kategorie/Zahlungsart temporär
      // Diese werden dann in applyParsedSelections in die Dropdowns übersetzt
      if (rawData?.category) {
        this.formData.category = rawData.category;
      }
      if (rawData?.payment_type) {
        this.formData.payment_type = rawData.payment_type;
      }

      console.log("✅ Formular gefüllt:", this.formData);
    },

    async applyParsedSelections(rawData) {
      if (!rawData?.category && !rawData?.payment_type) return;
      // Kategorie matchen (verwende zentrale Matching-Funktion)
      if (rawData?.category) {
        const match = this.findCategoryMatchByLabel(rawData.category);
        if (match) {
          this.formData.category = match.id;
          console.log(
            `✅ Kategorie vorselektiert: ${match.label} (ID: ${match.id})`,
          );
        } else {
          this.formData.category = rawData.category;
          console.log(
            `⚠️ Kategorie "${rawData.category}" nicht in Liste gefunden, verfügbar: [${(this.categories || []).map((c) => c.label).join(", ")}]`,
          );
        }
      }

      // Zahlungsart matchen
      if (rawData?.payment_type) {
        const match = this.findPaymentTypeMatchByLabel(rawData.payment_type);
        if (match) {
          this.formData.payment_type = match.id;
          console.log(
            `✅ Zahlungsart vorselektiert: ${match.label} (ID: ${match.id})`,
          );
        } else {
          this.formData.payment_type = rawData.payment_type;
          console.log(
            `⚠️ Zahlungsart "${rawData.payment_type}" nicht in Liste gefunden, verfügbar: [${(this.paymentTypes || []).map((p) => p.label).join(", ")}]`,
          );
        }
      }
    },

    async postReceiptPayload(payload) {
      return await fetchJson(`${STRAPI_URL}/api/receipts`, {
        method: "POST",
        body: JSON.stringify(payload),
      }).then(
        (result) => ({ ok: true, status: 200, result }),
        (err) => ({ ok: false, status: 500, result: { error: err.message } }),
      );
    },

    async saveReceipt() {
      if (!this.formValid) {
        this.notify("Bitte alle Pflichtfelder ausfüllen!");
        return;
      }

      try {
        this.saving = true;

        // Ensure category and payment type (will create if free-text provided)
        const categoryId = await this.ensureCategory(this.formData.category);
        const paymentTypeId = await this.ensurePaymentType(
          this.formData.payment_type,
        );

        // Upload file to Strapi (if any) and extract asset id
        let pictureId = null;
        if (this.selectedFile) {
          try {
            const uploadRes = await apiUploadFile(this.selectedFile);
            if (Array.isArray(uploadRes) && uploadRes[0]?.id) {
              pictureId = uploadRes[0].id;
            } else if (
              uploadRes?.data &&
              Array.isArray(uploadRes.data) &&
              uploadRes.data[0]?.id
            ) {
              pictureId = uploadRes.data[0].id;
            } else if (uploadRes?.id) {
              pictureId = uploadRes.id;
            }
          } catch (err) {
            console.warn("File upload failed:", err);
          }
        }

        const summe = Number(this.toNumber(this.formData.totals.summe) || 0);
        const gezahlt = Number(
          this.toNumber(this.formData.totals.gezahlt) || 0,
        );
        const rueckgeld = Number(
          this.toNumber(this.formData.totals.rueckgeld) || 0,
        );

        const normalizedItems = this.formData.items
          .map((item) => {
            const quantity = Number(this.toNumber(item.quantity) || 1);
            const unitPrice = Number(this.toNumber(item.unitprice) || 0);
            return {
              name: String(item.name || "").trim(),
              quantity,
              unitPrice: Number(unitPrice.toFixed(2)),
              lineTotal: Number((quantity * unitPrice).toFixed(2)),
            };
          })
          .filter((item) => item.name && item.unitPrice > 0);

        const nowIso = new Date().toISOString();
        const unixTime = Math.floor(Date.now() / 1000);
        const fullPayload = {
          data: {
            purchaseDate: this.formData.purchaseDate || null,
            scanDate: this.formData.scanDate || nowIso,
            store: this.formData.store || null,
            postcodePlace: this.formData.postcodePlace || null,
            streetHouseNum: this.formData.streetHouseNum || null,
            items: this.formData.itemsText || JSON.stringify(normalizedItems),
            totalAmount: summe,
            paidAmount: gezahlt,
            changeAmount: rueckgeld,
            category: categoryId,
            payment_type: paymentTypeId,
            picture: pictureId || null,
          },
        };

        const fallbackPayload = {
          data: {
            purchaseDate: this.formData.purchaseDate || null,
            scanDate: this.formData.scanDate || nowIso,
            store: this.formData.store || null,
            postcodePlace: this.formData.postcodePlace || null,
            streetHouseNum: this.formData.streetHouseNum || null,
            items: this.formData.itemsText || JSON.stringify(normalizedItems),
            totalAmount: summe,
            paidAmount: gezahlt,
            changeAmount: rueckgeld,
            category: categoryId,
            payment_type: paymentTypeId,
            picture: pictureId || null,
          },
        };

        console.log("🔄 Sende:", JSON.stringify(fullPayload, null, 2));

        let submission = await this.postReceiptPayload(fullPayload);
        if (!submission.ok) {
          submission = await this.postReceiptPayload(fallbackPayload);
        }

        if (submission.ok && submission.result.data?.id) {
          this.notify(
            `✅ Beleg gespeichert! ID: ${submission.result.data.id}`,
            "success",
          );
          // Aktualisiere die Benutzerdaten, um den neuen Beleg hinzuzufügen
          try {
            const me = await apiGetCurrentUser();
            const newId = submission.result.data.id; // numerische id, nicht documentId!

            // Bestehende numerische IDs sammeln (dedupliziert)
            const existingIds = [
              ...new Set((me.receipts ?? []).map((r) => r.id)),
            ];
            const updatedIds = [...new Set([...existingIds, newId])];

            const response = await fetch(`${STRAPI_URL}/api/users/${me.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                receipts: updatedIds, // Array von numerischen IDs, z.B. [1, 2, 3]
              }),
            });

            const result = await response.json();
            console.log(result);
          } catch (err) {
            console.error("Fehler beim Aktualisieren der Benutzerdaten:", err);
          }
          this.resetForm();
        } else {
          console.error("Backend Response:", submission.result);
          this.notify(
            "❌ Server Fehler: " +
              (submission.result?.error?.message || "Speichern nicht möglich"),
          );
        }
      } catch (error) {
        console.error("💥 Fehler:", error);
        this.notify("❌ Speichern fehlgeschlagen");
      } finally {
        this.saving = false;
      }
    },

    async fetchDropdownData() {
      try {
        const [locationsData, categoriesData, paymentData] = await Promise.all([
          fetchJson(
            `${STRAPI_URL}/api/locations?populate=*&pagination[pageSize]=100`,
          ),
          fetchJson(
            `${STRAPI_URL}/api/categories?populate=*&pagination[pageSize]=100`,
          ),
          fetchJson(
            `${STRAPI_URL}/api/payment-types?populate=*&pagination[pageSize]=100`,
          ),
        ]);

        this.locations = this.normalizeEntities(
          locationsData?.data || [],
          "location",
        );
        this.categories = this.normalizeEntities(
          categoriesData?.data || [],
          "category",
        );
        this.paymentTypes = this.normalizeEntities(
          paymentData?.data || [],
          "payment",
        );
        // Wenn keine Kategorien/Zahlungsarten in DB vorhanden sind, lasse das LLM Vorschläge
        if (
          !this.categories ||
          this.categories.length === 0 ||
          !this.paymentTypes ||
          this.paymentTypes.length === 0
        ) {
          try {
            await apiEnsureDefaultCategoriesAndPaymentTypes();
            // nochmal neu laden
            const [catsReload, paysReload] = await Promise.all([
              apiGetCategories(),
              apiGetPaymentTypes(),
            ]);
            this.categories = this.normalizeEntities(
              catsReload || [],
              "category",
            );
            this.paymentTypes = this.normalizeEntities(
              paysReload || [],
              "payment",
            );
          } catch (err) {
            console.warn("Defaults erzeugen fehlgeschlagen:", err);
          }
        }
      } catch (error) {
        console.error("Dropdown Fehler:", error);
        this.locations = [{ id: 1, label: "Wien, Österreich" }];
        this.categories = [{ id: 1, label: "Supermarkt" }];
        this.paymentTypes = [{ id: 1, label: "Cash" }];
      }
    },

    resetForm() {
      this.stopCamera();
      this.selectedFile = null;
      this.formData = {
        items: [],
        itemsText: "",
        purchaseDate: null,
        scanDate: new Date().toISOString().split("T")[0],
        store: null,
        postcodePlace: null,
        streetHouseNum: null,
        totals: { summe: null, gezahlt: null, rueckgeld: null },
        category: null,
        payment_type: null,
      };
      this.result = null;
      this.scanMode = "toggle"; // Back to toggle after reset
    },
  },
};
</script>

<style scoped>
.item-row:hover {
  background-color: #f5f5f5;
}

.scan-video {
  width: 100%;
  max-width: 520px;
  border-radius: 10px;
  background: #111;
  min-height: 240px;
}

.ocr-preview {
  white-space: pre-wrap;
  margin: 8px 0 0;
  font-size: 0.85rem;
}
</style>

<style scoped>
.form-card {
  background: #ffffff !important;
  color: #111 !important;
}
.form-card label,
.form-card .v-label,
.form-card input,
.form-card textarea,
.form-card .v-field__input {
  color: #111 !important;
}
.form-title {
  color: #111 !important;
}
</style>
