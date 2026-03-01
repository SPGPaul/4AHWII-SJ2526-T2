<template>
  <v-container
    style="z-index: 10; position: relative; padding: 140px; min-height: 500px"
  >
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
          <v-select
            v-model="formData.location"
            :items="locations"
            item-text="attributes.city"
            item-value="id"
            label="🏪 Location *"
            dense
            outlined
            clearable
          />

          <!-- CATEGORY -->
          <v-select
            v-model="formData.category"
            :items="categories"
            item-text="attributes.name"
            item-value="id"
            label="🏷️ Kategorie *"
            dense
            outlined
            clearable
          />

          <!-- PAYMENT TYPE -->
          <v-select
            v-model="formData.payment_type"
            :items="paymentTypes"
            item-text="attributes.name"
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
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      selectedFile: null,
      result: null,
      loading: false,
      saving: false,

      // Tabs
      activeTab: 0,

      // Bearbeitbares Form-Objekt
      formData: {
        items: [],
        totals: {
          summe: 0,
          gezahlt: 0,
          rueckgeld: 0,
        },
        location: null,
        category: null,
        payment_type: null,
      },

      // Listen für Dropdowns
      locations: [],
      categories: [],
      paymentTypes: [],

      // Neue Einträge Dialogs
      newLocation: { city: "", country: "" },
      newCategory: { name: "" },
      newPaymentType: { name: "" },
      showLocationDialog: false,
      showCategoryDialog: false,
      showPaymentDialog: false,

      newProduct: {
        name: "",
        unitprice: null,
        quantity: 1,
      },
    };
  },

  computed: {
    formReady() {
      return this.formData.items.length > 0 || this.formData.totals.summe;
    },

    calculatedItemsTotal() {
      return this.formData.items
        .reduce((sum, item) => {
          return (
            sum +
            parseFloat(item.unitprice || 0) * parseFloat(item.quantity || 1)
          );
        }, 0)
        .toFixed(2);
    },

    formValid() {
      return (
        this.formData.totals.summe &&
        this.formData.items.length > 0 &&
        this.formData.location &&
        this.formData.category &&
        this.formData.payment_type
      );
    },

    canAddProduct() {
      return this.newProduct.name && this.newProduct.unitprice;
    },

    calculatedRueckgeld() {
      const summe = parseFloat(this.formData.totals.summe || 0);
      const gezahlt = parseFloat(this.formData.totals.gezahlt || 0);
      return (gezahlt - summe).toFixed(2);
    },
  },

  async mounted() {
    // Listen laden
    await Promise.all([
      this.fetchLocations(),
      this.fetchCategories(),
      this.fetchPaymentTypes(),
      this.fetchDropdownData(),
    ]);
  },

  methods: {
    // === UPLOAD (unverändert) ===
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

      const formData = new FormData();
      formData.append("file", this.selectedFile);

      try {
        const response = await fetch("/api/receipt", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log("✅ Backend Response:", data);

        this.fillFormFromRawData(data.data);
      } catch (error) {
        console.error("❌ Upload Fehler:", error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } finally {
        this.loading = false;
      }
    },

    // === FETCH LISTS ===
    async fetchLocations(search = "") {
      try {
        const response = await fetch(
          `https://elegant-eggs-b247740f2b.strapiapp.com/api/locations?filters[city][$containsi]=${search}&populate=*`,
        );
        const data = await response.json();
        this.locations = data.data || [];
      } catch (error) {
        console.error("Locations laden fehlgeschlagen:", error);
      }
    },

    async fetchCategories(search = "") {
      try {
        const response = await fetch(
          `https://elegant-eggs-b247740f2b.strapiapp.com/api/categories?filters[name][$containsi]=${search}`,
        );
        const data = await response.json();
        this.categories = data.data || [];
      } catch (error) {
        console.error("Categories laden fehlgeschlagen:", error);
      }
    },

    async fetchPaymentTypes(search = "") {
      try {
        const response = await fetch(
          `https://elegant-eggs-b247740f2b.strapiapp.com/api/payment-types?filters[name][$containsi]=${search}`,
        );
        const data = await response.json();
        this.paymentTypes = data.data || [];
      } catch (error) {
        console.error("PaymentTypes laden fehlgeschlagen:", error);
      }
    },

    // === SAVE NEW ENTRIES ===
    async saveNewLocation() {
      try {
        const response = await fetch(
          "https://elegant-eggs-b247740f2b.strapiapp.com/api/locations",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: this.newLocation,
            }),
          },
        );

        const result = await response.json();
        this.formData.location = result.data.id;
        await this.fetchLocations();
        this.showLocationDialog = false;
        this.newLocation = { city: "", country: "" };
      } catch (error) {
        alert("Location konnte nicht gespeichert werden");
      }
    },

    async saveNewCategory() {
      try {
        const response = await fetch(
          "https://elegant-eggs-b247740f2b.strapiapp.com/api/categories",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: this.newCategory,
            }),
          },
        );

        const result = await response.json();
        this.formData.category = result.data.id;
        await this.fetchCategories();
        this.showCategoryDialog = false;
        this.newCategory = { name: "" };
      } catch (error) {
        alert("Kategorie konnte nicht gespeichert werden");
      }
    },

    async saveNewPaymentType() {
      try {
        const response = await fetch(
          "https://elegant-eggs-b247740f2b.strapiapp.com/api/payment-types",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: this.newPaymentType,
            }),
          },
        );

        const result = await response.json();
        this.formData.payment_type = result.data.id;
        await this.fetchPaymentTypes();
        this.showPaymentDialog = false;
        this.newPaymentType = { name: "" };
      } catch (error) {
        alert("Zahlungsart konnte nicht gespeichert werden");
      }
    },

    // === FILL FORM (unverändert + Auto-Fill Location/Category) ===
    fillFormFromRawData(rawData) {
      console.log("🔍 Parsing raw data:", rawData);

      const items = [];
      let maxPrice = 0;

      if (Array.isArray(rawData)) {
        rawData.forEach((item) => {
          let name = item.nm || item.price?.nm || "Unbekannt";
          let price =
            item.price || item.unitprice || item.price?.unitprice || "";

          price = price
            .toString()
            .replace(/[^\d.,]/g, "")
            .replace(",", ".");
          const priceNum = parseFloat(price) || 0;

          if (priceNum > maxPrice) {
            maxPrice = priceNum;
          }

          if (
            name &&
            priceNum > 0 &&
            !String(name).toUpperCase().includes("SUMME")
          ) {
            items.push({
              name: name.toString().trim(),
              unitprice: priceNum.toFixed(2),
              quantity: parseFloat(item.cnt) || 1,
            });
          }
        });
      }

      this.formData.totals.summe = maxPrice.toFixed(2);
      this.formData.items = items;

      // Auto-Fill (wenn Backend metadata liefert)
      if (this.result?.metadata) {
        if (this.result.metadata.category) {
          const cat = this.categories.find((c) =>
            c.attributes.name
              .toLowerCase()
              .includes(this.result.metadata.category.toLowerCase()),
          );
          if (cat) this.formData.category = cat.id;
        }
        if (this.result.metadata.location?.city) {
          const loc = this.locations.find((l) =>
            l.attributes.city
              .toLowerCase()
              .includes(this.result.metadata.location.city.toLowerCase()),
          );
          if (loc) this.formData.location = loc.id;
        }
      }

      console.log("✅ Formular gefüllt:", this.formData);
    },

    // === ITEMS (unverändert) ===
    itemTotal(item) {
      const total =
        parseFloat(item.unitprice || 0) * parseFloat(item.quantity || 1);
      return total.toFixed(2).replace(".", ",");
    },

    addProduct() {
      this.formData.items.push({
        name: this.newProduct.name,
        unitprice: this.newProduct.unitprice.toFixed(2),
        quantity: this.newProduct.quantity,
      });

      this.newProduct = { name: "", unitprice: null, quantity: 1 };
    },

    removeItem(index) {
      this.formData.items.splice(index, 1);
    },

    // === SAVE RECEIPT (angepasst an deine Strapi Schemas) ===
    async saveReceipt() {
      if (!this.formValid) {
        alert("Bitte alle Pflichtfelder ausfüllen!");
        return;
      }

      try {
        this.saving = true;

        // ✅ STRAPI-FORMAT!
        const payload = {
          data: {
            // ←← HIER data-Wrapper!
            location: this.formData.location,
            category: this.formData.category,
            payment_type: this.formData.payment_type,
            items: this.formData.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitprice,
            })),
            // totals: {
            //   summe: this.formData.totals.summe,
            //   gezahlt: this.formData.totals.gezahlt,
            //   rueckgeld: this.formData.totals.rueckgeld,
            // },
          },
        };

        console.log("🔄 Sende:", JSON.stringify(payload, null, 2));

        const response = await fetch(
          "https://elegant-eggs-b247740f2b.strapiapp.com/api/receipts",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Falls Auth nötig:
              // 'Authorization': 'Bearer DEIN_TOKEN'
            },
            body: JSON.stringify(payload),
          },
        );

        const result = await response.json();

        if (response.ok && result.data?.id) {
          alert("✅ Beleg gespeichert! ID: " + result.data.id);
          this.resetForm();
        } else {
          console.error("Backend Response:", result);
          alert("❌ Server Fehler: " + JSON.stringify(result.error));
        }
      } catch (error) {
        console.error("💥 Fehler:", error);
        alert("❌ Speichern fehlgeschlagen");
      } finally {
        this.saving = false;
      }
    },

    async fetchDropdownData() {
      try {
        const [locRes, catRes, payRes] = await Promise.all([
          fetch(
            "https://elegant-eggs-b247740f2b.strapiapp.com/api/locations?populate=*",
          ),
          fetch(
            "https://elegant-eggs-b247740f2b.strapiapp.com/api/categories?populate=*",
          ),
          fetch(
            "https://elegant-eggs-b247740f2b.strapiapp.com/api/payment-types?populate=*",
          ),
        ]);

        this.locations = (await locRes.json()).data || [];
        this.categories = (await catRes.json()).data || [];
        this.paymentTypes = (await payRes.json()).data || [];
      } catch (error) {
        console.error("Dropdown Fehler:", error);
        // Fallback
        this.locations = [{ id: 1, attributes: { city: "Wien" } }];
        this.categories = [{ id: 1, attributes: { name: "Supermarkt" } }];
        this.paymentTypes = [{ id: 1, attributes: { name: "Cash" } }];
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
</style>
