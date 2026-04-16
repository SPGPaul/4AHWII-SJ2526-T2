<template>
  <v-container
    style="z-index: 10; position: relative; padding: 140px; min-height: 500px"
  >
    <v-card class="mb-4 pa-4" elevation="2">
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
      <video ref="cameraVideo" class="scan-video mt-3" autoplay playsinline muted />
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

    <!-- UPLOAD -->
    <v-file-input
      v-model="selectedFile"
      label="📷 Beleg Foto hochladen"
      accept="image/*"
      @change="uploadReceipt"
      prepend-icon="mdi-camera"
    />

    <!-- LADE-ANIMATOR -->
    <v-progress-circular
      v-if="loading"
      indeterminate
      color="primary"
      size="64"
      class="mt-4 d-flex justify-center"
    />

    <!-- BEARBEITUNGS-FORMULAR (automatisch gefüllt) -->
    <v-card v-if="formReady" elevation="8" class="mt-6">
      <v-card-title class="primary white--text d-flex justify-space-between">
        <span>
          <v-icon left large>mdi-receipt-text-edit-outline</v-icon>
          Beleg bearbeiten
        </span>
        <v-chip color="success" class="white--text">
          {{ formData.items.length }} Artikel
        </v-chip>
      </v-card-title>

      <!-- PRODUKTE -->
      <v-list three-line class="pa-4">
        <v-list-item
          v-for="(item, index) in formData.items"
          :key="index"
          class="item-row"
        >
          <!-- Nummer -->
          <v-list-item-avatar color="primary" class="mr-3">
            {{ index + 1 }}
          </v-list-item-avatar>

          <!-- FIELDS -->
          <v-list-item-content>
            <v-text-field
              v-model="item.name"
              label="Produkt"
              dense
              hide-details="auto"
              placeholder="z.B. Milch 1L"
              @input="updateTotal"
            />

            <v-row no-gutters>
              <v-col cols="6">
                <v-text-field
                  v-model.number="item.quantity"
                  label="Menge"
                  type="number"
                  min="1"
                  step="0.1"
                  dense
                  hide-details="auto"
                  @input="updateTotal"
                />
              </v-col>
              <v-col cols="6" class="pl-2">
                <v-text-field
                  v-model.number="item.unitprice"
                  label="Einzelpreis"
                  prefix="€"
                  type="number"
                  step="0.01"
                  dense
                  hide-details="auto"
                  @input="updateTotal"
                />
              </v-col>
            </v-row>
          </v-list-item-content>

          <!-- TOTAL + LÖSCHEN -->
          <v-list-item-action class="align-self-center">
            <v-chip color="success" class="white--text mr-2">
              {{ itemTotal(item) }}
            </v-chip>
            <v-btn icon color="error" @click="removeItem(index)" size="small">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>

      <!-- NEUES PRODUKT HINZUFÜGEN -->
      <v-divider class="my-4"></v-divider>
      <v-row class="pa-4 align-center">
        <v-col cols="4">
          <v-text-field
            v-model="newProduct.name"
            label="Neues Produkt"
            clearable
            dense
            hide-details
          />
        </v-col>
        <v-col cols="3">
          <v-text-field
            v-model.number="newProduct.unitprice"
            label="Preis"
            prefix="€"
            type="number"
            step="0.01"
            dense
            hide-details
          />
        </v-col>
        <v-col cols="2">
          <v-text-field
            v-model.number="newProduct.quantity"
            label="Menge"
            type="number"
            min="1"
            dense
            hide-details
          />
        </v-col>
        <v-col cols="3">
          <v-btn
            color="primary"
            block
            @click="addProduct"
            :disabled="!canAddProduct"
          >
            <v-icon left>mdi-plus</v-icon>
            Hinzufügen
          </v-btn>
        </v-col>
      </v-row>

      <!-- 🆕 METADATEN (Location, Category, Payment Type) -->
      <v-divider class="my-4"></v-divider>
      <v-card class="pa-6" color="blue lighten-5" elevation="4">
        <v-card-title class="headline mb-4">
          <v-icon left color="primary" large>mdi-map-marker-outline</v-icon>
          Metadaten
        </v-card-title>

        <v-row>
          <!-- LOCATION -->
          <v-combobox
            v-model="formData.location"
            :items="locations"
            item-title="label"
            item-value="id"
            label="🏪 Location *"
            dense
            outlined
            clearable
          />

          <!-- CATEGORY -->
          <v-combobox
            v-model="formData.category"
            :items="categories"
            item-title="label"
            item-value="id"
            label="🏷️ Kategorie *"
            dense
            outlined
            clearable
          />

          <!-- PAYMENT TYPE -->
          <v-combobox
            v-model="formData.payment_type"
            :items="paymentTypes"
            item-title="label"
            item-value="id"
            label="💳 Zahlungsart *"
            dense
            outlined
            clearable
          />
        </v-row>
      </v-card>

      <!-- SUMMEN -->
      <v-divider class="my-4"></v-divider>
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="4">
            <v-text-field
              v-model.number="formData.totals.summe"
              label="Gesamtsumme *"
              prefix="€"
              type="number"
              step="0.01"
              dense
              :rules="[(v) => !!v || 'Pflichtfeld']"
            />
          </v-col>
          <v-col cols="4">
            <v-text-field
              v-model.number="formData.totals.gezahlt"
              label="Gezahlt"
              prefix="€"
              type="number"
              step="0.01"
              dense
            />
          </v-col>
          <v-col cols="4">
            <v-text-field
              v-model.number="formData.totals.rueckgeld"
              label="Rückgeld"
              prefix="€"
              type="number"
              step="0.01"
              dense
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <small class="text-muted">
              * Berechnete Summe: {{ calculatedItemsTotal }}€
              {{
                calculatedItemsTotal !== parseFloat(formData.totals.summe || 0)
                  ? "⚠️"
                  : "✅"
              }}
            </small>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- SPEICHERN -->
      <v-card-actions class="pa-4 justify-end">
        <v-btn color="grey" text @click="resetForm" class="mr-2">
          Neuen Beleg
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
      v-if="!loading && !formReady"
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
import { STRAPI_URL } from "@/utils/strapi";

export default {
  data() {
    return {
      apiBase: STRAPI_URL,
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
        totals: {
          summe: null,
          gezahlt: null,
          rueckgeld: null,
        },
        location: null,
        category: null,
        payment_type: null,
      },

      // Listen für Dropdowns
      locations: [],
      categories: [],
      paymentTypes: [],

      newProduct: {
        name: "",
        unitprice: null,
        quantity: 1,
      },
    };
  },

  computed: {
    formReady() {
      return (
        this.formData.items.length > 0 ||
        Number(this.formData.totals.summe || 0) > 0
      );
    },

    calculatedItemsTotalNumber() {
      const total = this.formData.items.reduce((sum, item) => {
        return (
          sum +
          Number(this.toNumber(item.unitprice) || 0) *
            Number(this.toNumber(item.quantity) || 0)
        );
      }, 0);
      return Math.round(total * 100) / 100;
    },

    calculatedItemsTotal() {
      return this.calculatedItemsTotalNumber.toFixed(2);
    },

    formValid() {
      return (
        Number(this.toNumber(this.formData.totals.summe) || 0) > 0 &&
        this.formData.items.length > 0 &&
        this.formData.location &&
        this.formData.category &&
        this.formData.payment_type
      );
    },

    canAddProduct() {
      return (
        this.newProduct.name && Number(this.toNumber(this.newProduct.unitprice)) > 0
      );
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
    "formData.items": {
      handler() {
        this.updateTotal();
      },
      deep: true,
    },
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
      if (typeof value === "number") return Number.isFinite(value) ? value : null;
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

    getAuthHeaders(withJson = true) {
      const token = localStorage.getItem("token");
      const headers = {};
      if (withJson) headers["Content-Type"] = "application/json";
      if (token) headers.Authorization = `Bearer ${token}`;
      return headers;
    },

    async fetchJson(path) {
      const response = await fetch(`${this.apiBase}${path}`, {
        headers: this.getAuthHeaders(false),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error?.message || "Fehler beim Laden");
      }
      return data;
    },

    syncRueckgeld() {
      const computed = Number(this.calculatedRueckgeld);
      this.formData.totals.rueckgeld = Number.isFinite(computed)
        ? computed.toFixed(2)
        : "0.00";
    },

    updateTotal() {
      const summe = this.toNumber(this.formData.totals.summe);
      if (summe === null || summe === 0) {
        this.formData.totals.summe = this.calculatedItemsTotal;
      }
      this.syncRueckgeld();
    },

    async uploadReceipt() {
      if (!this.selectedFile) return;

      this.loading = true;
      this.formData = {
        items: [],
        totals: { summe: null, gezahlt: null, rueckgeld: null },
        location: null,
        category: null,
        payment_type: null,
      };

      const uploadData = new FormData();
      uploadData.append("file", this.selectedFile);

      try {
        const response = await fetch("/api/receipt", {
          method: "POST",
          body: uploadData,
        });

        const data = await response.json();
        console.log("✅ Backend Response:", data);

        this.result = data;
        this.fillFormFromRawData(data.data);
      } catch (error) {
        console.error("❌ Upload Fehler:", error);
        this.notify("Beleg konnte nicht verarbeitet werden.");
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

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        this.cameraStream = stream;
        this.cameraRunning = true;
        this.$refs.cameraVideo.srcObject = stream;
        await this.$refs.cameraVideo.play();
      } catch (error) {
        console.error("Kamera konnte nicht gestartet werden:", error);
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
        canvas.toBlob((resultBlob) => {
          if (!resultBlob) {
            reject(new Error("Kein Bild erstellt"));
            return;
          }
          resolve(resultBlob);
        }, "image/jpeg", 0.95);
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      this.selectedFile = new File([blob], `camera-receipt-${timestamp}.jpg`, {
        type: "image/jpeg",
      });
      await this.uploadReceipt();
    },

    async fetchLocations(search = "") {
      try {
        const query = encodeURIComponent(search);
        const data = await this.fetchJson(
          `/api/locations?filters[city][$containsi]=${query}&populate=*`,
        );
        this.locations = this.normalizeEntities(data.data || [], "location");
      } catch (error) {
        console.error("Locations laden fehlgeschlagen:", error);
      }
    },

    async fetchCategories(search = "") {
      try {
        const query = encodeURIComponent(search);
        const data = await this.fetchJson(
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
        const data = await this.fetchJson(
          `/api/payment-types?filters[name][$containsi]=${query}&populate=*`,
        );
        this.paymentTypes = this.normalizeEntities(data.data || [], "payment");
      } catch (error) {
        console.error("PaymentTypes laden fehlgeschlagen:", error);
      }
    },

    async createEntity(path, payload) {
      const response = await fetch(`${this.apiBase}${path}`, {
        method: "POST",
        headers: this.getAuthHeaders(true),
        body: JSON.stringify({ data: payload }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.data?.id) {
        throw new Error(result?.error?.message || "Erstellen fehlgeschlagen");
      }
      return result.data;
    },

    findExistingByLabel(list, value) {
      const normalized = String(value || "").trim().toLowerCase();
      return list.find((entry) => entry.label.toLowerCase() === normalized) || null;
    },

    extractComboboxText(value) {
      if (value === null || value === undefined) return "";
      if (typeof value === "string" || typeof value === "number") return String(value);
      if (typeof value === "object") {
        if (value.title) return String(value.title);
        if (value.label) return String(value.label);
        if (value.value && Number.isNaN(Number(value.value))) return String(value.value);
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

    findCategoryMatchByLabel(label) {
      const target = this.normalizeText(label);
      if (!target) return null;

      const exact = this.categories.find(
        (entry) => this.normalizeText(entry.label) === target,
      );
      if (exact) return exact;

      return (
        this.categories.find(
          (entry) =>
            this.normalizeText(entry.label).includes(target) ||
            target.includes(this.normalizeText(entry.label)),
        ) || null
      );
    },

    applyAutomaticCategory(rawData) {
      if (this.formData.category) return;

      const predictedCategory = classifyReceiptCategory({
        raw: rawData,
        items: this.formData.items,
        metadata: this.result?.metadata,
        ocrText: this.result?.ocrText || this.result?.text,
        filename: this.selectedFile?.name,
      });

      const existingCategory = this.findCategoryMatchByLabel(predictedCategory);
      if (existingCategory) {
        this.formData.category = existingCategory.id;
        return;
      }

      if (PREDEFINED_CATEGORIES.includes(predictedCategory)) {
        this.formData.category = predictedCategory;
      }
    },

    async ensureLocation(value) {
      if (typeof value === "number") return value;
      if (!value) return null;
      if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value);
      if (typeof value === "object" && value.id) return value.id;
      if (typeof value === "object" && value.value && !Number.isNaN(Number(value.value))) {
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
      if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value);
      if (typeof value === "object" && value.id) return value.id;
      if (typeof value === "object" && value.value && !Number.isNaN(Number(value.value))) {
        return Number(value.value);
      }

      const freeText = this.extractComboboxText(value).trim();
      if (!freeText) return null;

      const existing = this.findExistingByLabel(this.categories, freeText);
      if (existing) return existing.id;

      const name = freeText;
      const created = await this.createEntity("/api/categories", { name });
      const normalized = {
        id: created.id,
        label: this.extractEntityLabel(created, "category"),
      };
      this.categories.push(normalized);
      return normalized.id;
    },

    async ensurePaymentType(value) {
      if (typeof value === "number") return value;
      if (!value) return null;
      if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value);
      if (typeof value === "object" && value.id) return value.id;
      if (typeof value === "object" && value.value && !Number.isNaN(Number(value.value))) {
        return Number(value.value);
      }

      const freeText = this.extractComboboxText(value).trim();
      if (!freeText) return null;

      const existing = this.findExistingByLabel(this.paymentTypes, freeText);
      if (existing) return existing.id;

      const name = freeText;
      const created = await this.createEntity("/api/payment-types", { name });
      const normalized = {
        id: created.id,
        label: this.extractEntityLabel(created, "payment"),
      };
      this.paymentTypes.push(normalized);
      return normalized.id;
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
          item.unitprice || item.unitPrice || item.price || item.price?.unitprice;
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

      const summeFromOcr = this.toNumber(rawData?.totals?.summe);
      const gezahltFromOcr = this.toNumber(rawData?.totals?.gezahlt);
      const rueckgeldFromOcr = this.toNumber(rawData?.totals?.rueckgeld);

      const fallbackSum = this.calculatedItemsTotalNumber;
      this.formData.totals.summe = (summeFromOcr ?? fallbackSum).toFixed(2);
      this.formData.totals.gezahlt = gezahltFromOcr !== null ? gezahltFromOcr.toFixed(2) : null;
      this.formData.totals.rueckgeld =
        rueckgeldFromOcr !== null ? rueckgeldFromOcr.toFixed(2) : null;

      this.syncRueckgeld();

      // Auto-Fill (wenn Backend metadata liefert)
      if (this.result?.metadata) {
        if (this.result.metadata.category) {
          const cat = this.categories.find((c) =>
            c.label.toLowerCase().includes(this.result.metadata.category.toLowerCase()),
          );
          if (cat) this.formData.category = cat.id;
        }
        if (this.result.metadata.location?.city) {
          const loc = this.locations.find((l) =>
            l.label.toLowerCase().includes(this.result.metadata.location.city.toLowerCase()),
          );
          if (loc) this.formData.location = loc.id;
        }
      }

      this.applyAutomaticCategory(rawData);

      console.log("✅ Formular gefüllt:", this.formData);
    },

    itemTotal(item) {
      const total =
        Number(this.toNumber(item.unitprice) || 0) *
        Number(this.toNumber(item.quantity) || 1);
      return total.toFixed(2).replace(".", ",");
    },

    addProduct() {
      this.formData.items.push({
        name: String(this.newProduct.name || "").trim(),
        unitprice: Number(this.toNumber(this.newProduct.unitprice) || 0).toFixed(2),
        quantity: Number(this.toNumber(this.newProduct.quantity) || 1),
      });

      this.newProduct = { name: "", unitprice: null, quantity: 1 };
      this.updateTotal();
    },

    removeItem(index) {
      this.formData.items.splice(index, 1);
      this.updateTotal();
    },

    async postReceiptPayload(payload) {
      const response = await fetch(`${this.apiBase}/api/receipts`, {
        method: "POST",
        headers: this.getAuthHeaders(true),
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      return { ok: response.ok, status: response.status, result };
    },

    async saveReceipt() {
      if (!this.formValid) {
        this.notify("Bitte alle Pflichtfelder ausfüllen!");
        return;
      }

      try {
        this.saving = true;

        const locationId = await this.ensureLocation(this.formData.location);
        const categoryId = await this.ensureCategory(this.formData.category);
        const paymentTypeId = await this.ensurePaymentType(this.formData.payment_type);

        const summe = Number(this.toNumber(this.formData.totals.summe) || 0);
        const gezahlt = Number(this.toNumber(this.formData.totals.gezahlt) || 0);
        const rueckgeld = Number(this.toNumber(this.formData.totals.rueckgeld) || 0);

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
        const categoryLabel =
          this.categories.find((entry) => entry.id === categoryId)?.label || "Unbekannt";

        const fullPayload = {
          data: {
            location: locationId,
            category: categoryId,
            payment_type: paymentTypeId,
            items: normalizedItems,
            totals: {
              summe,
              gezahlt,
              rueckgeld,
            },
            summe,
            gezahlt,
            rueckgeld,
            amount: summe,
            total: summe,
            date: nowIso,
            unix_time: unixTime,
            transaktion: `Beleg ${new Date().toLocaleDateString("de-AT")}`,
            title: "Beleg",
            category_name: categoryLabel,
          },
        };

        const fallbackPayload = {
          data: {
            location: locationId,
            category: categoryId,
            payment_type: paymentTypeId,
            items: normalizedItems,
            amount: summe,
            total: summe,
            date: nowIso,
            unix_time: unixTime,
            transaktion: `Beleg ${new Date().toLocaleDateString("de-AT")}`,
          },
        };

        console.log("🔄 Sende:", JSON.stringify(fullPayload, null, 2));

        let submission = await this.postReceiptPayload(fullPayload);
        if (!submission.ok) {
          submission = await this.postReceiptPayload(fallbackPayload);
        }

        if (submission.ok && submission.result.data?.id) {
          this.notify(`✅ Beleg gespeichert! ID: ${submission.result.data.id}`, "success");
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
          this.fetchJson("/api/locations?populate=*&pagination[pageSize]=100"),
          this.fetchJson("/api/categories?populate=*&pagination[pageSize]=100"),
          this.fetchJson("/api/payment-types?populate=*&pagination[pageSize]=100"),
        ]);

        this.locations = this.normalizeEntities(locationsData.data || [], "location");
        this.categories = this.normalizeEntities(categoriesData.data || [], "category");
        this.paymentTypes = this.normalizeEntities(paymentData.data || [], "payment");
      } catch (error) {
        console.error("Dropdown Fehler:", error);
        this.locations = [{ id: 1, label: "Wien, Österreich" }];
        this.categories = [{ id: 1, label: "Supermarkt" }];
        this.paymentTypes = [{ id: 1, label: "Cash" }];
      }
    },

    resetForm() {
      this.selectedFile = null;
      this.formData = {
        items: [],
        totals: { summe: null, gezahlt: null, rueckgeld: null },
        location: null,
        category: null,
        payment_type: null,
      };
      this.newProduct = { name: "", unitprice: null, quantity: 1 };
      this.result = null;
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
