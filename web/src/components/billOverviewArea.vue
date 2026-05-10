<template>
  <div class="bill-overview">
    <div class="header-row">
      <h1>Rechnungsübersicht</h1>
    </div>

    <v-container fluid class="cards-wrap">
      <v-row class="mb-2">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="searchQuery"
            label="Suche"
            clearable
            hide-details
            append-inner-icon="mdi-magnify"
            class="search-field"
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="selectedCategory"
            :items="categoryOptions"
            label="Kategorie filtern"
            hide-details
            clearable
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="sortBy"
            :items="sortOptions"
            label="Sortieren"
            hide-details
            variant="outlined"
            density="comfortable"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col
          v-for="item in filteredRechnung"
          :key="item.documentId || item.img + item.transaktion + item.date"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            class="bill-card"
            elevation="2"
            @click="openReceipt(item)"
            role="button"
            tabindex="0"
          >
            <div class="bill-card-media">
              <v-img
                :src="item.img || placeholderImage"
                height="180"
                class="bill-card-img"
                cover
              >
                <template #placeholder>
                  <div class="bill-card-placeholder">
                    <v-icon size="44">mdi-receipt-text-outline</v-icon>
                    <span>Beleg wird geladen</span>
                  </div>
                </template>
                <div class="bill-card-overlay">
                  <v-chip
                    size="small"
                    color="white"
                    variant="elevated"
                    class="bill-card-chip"
                  >
                    {{ item.categoryLabel || "Sonstiges" }}
                  </v-chip>
                </div>
              </v-img>
            </div>
            <v-card-text class="bill-card-body">
              <div class="trans-title">{{ getReceiptTitle(item) }}</div>
              <div class="trans-meta">
                {{ formatAddress(item) }}
              </div>
              <div class="trans-meta">
                {{ formatDate(item.scanDate || item.date || item.purchaseDate) }}
                <span v-if="getAmount(item) !== null"
                  >· {{ formatAmount(getAmount(item)) }}</span
                >
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" v-if="filteredRechnung.length === 0">
          <div class="no-data">Keine Belege gefunden.</div>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="dialog" max-width="900px">
      <v-card>
        <v-toolbar flat>
          <v-toolbar-title>Details ansehen</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="dialog-body">
          <div v-if="selected" class="dialog-image-shell">
            <v-img
              :src="selected.img || placeholderImage"
              class="dialog-image"
              height="72vh"
              contain
            >
              <template #placeholder>
                <div class="bill-card-placeholder dialog-placeholder">
                  <v-icon size="56">mdi-receipt-text-outline</v-icon>
                  <span>Beleg wird geladen</span>
                </div>
              </template>
            </v-img>
          </div>
          <div v-else class="no-data">Kein Beleg ausgewählt.</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { STRAPI_URL } from "@/utils/strapi";
export default {
  name: "BillOverviewArea",
  data() {
    return {
      placeholderImage:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
            <defs>
              <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#f1fff4"/>
                <stop offset="100%" stop-color="#d8f3df"/>
              </linearGradient>
            </defs>
            <rect width="800" height="520" rx="36" fill="url(#g)"/>
            <circle cx="650" cy="110" r="70" fill="#bcefc2" opacity="0.65"/>
            <circle cx="130" cy="400" r="95" fill="#ffffff" opacity="0.45"/>
            <g transform="translate(250 96)">
              <rect x="0" y="0" width="300" height="328" rx="24" fill="#ffffff" stroke="#8ec99b" stroke-width="8"/>
              <rect x="38" y="44" width="224" height="24" rx="12" fill="#bcefc2"/>
              <rect x="38" y="90" width="184" height="16" rx="8" fill="#d6eedd"/>
              <rect x="38" y="126" width="224" height="16" rx="8" fill="#d6eedd"/>
              <rect x="38" y="170" width="224" height="18" rx="9" fill="#e7f4ea"/>
              <rect x="38" y="206" width="184" height="18" rx="9" fill="#e7f4ea"/>
              <rect x="38" y="248" width="124" height="28" rx="14" fill="#67a96f"/>
            </g>
            <text x="400" y="468" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#3f6f48">Gescannte Belege</text>
          </svg>
        `),
      searchQuery: "",
      selectedCategory: null,
      sortBy: "date-newest",
      dialog: false,
      selected: null,
      bills: [],
      loading: false,
      error: null,
      sortOptions: [
        { title: "Neueste zuerst", value: "date-newest" },
        { title: "Älteste zuerst", value: "date-oldest" },
        { title: "Betrag absteigend", value: "amount-desc" },
        { title: "Betrag aufsteigend", value: "amount-asc" },
        { title: "Name A-Z", value: "name-asc" },
        { title: "Name Z-A", value: "name-desc" },
      ],
    };
  },
  computed: {
    categoryOptions() {
      const categories = this.bills
        .map((item) => item.categoryLabel || "Sonstiges")
        .filter(Boolean);
      return [...new Set(categories)].sort((a, b) =>
        String(a).localeCompare(String(b), "de"),
      );
    },
    filteredRechnung() {
      const query = this.searchQuery.trim().toLowerCase();

      let items = [...this.bills];
      if (this.selectedCategory) {
        items = items.filter(
          (item) =>
            (item.categoryLabel || "Sonstiges") === this.selectedCategory,
        );
      }

      if (query) {
        items = items.filter((item) => {
          const fields = [
            item.purchaseDate ? this.formatDate(item.purchaseDate) : "",
            item.scanDate ? this.formatDate(item.scanDate) : "",
            item.store,
            item.categoryLabel,
            item.items,
            item.postcodePlace,
            item.streetHouseNum,
            item.totalAmount !== null
              ? this.formatAmount(item.totalAmount)
              : "",
            item.paidAmount !== null ? this.formatAmount(item.paidAmount) : "",
            item.changeAmount !== null
              ? this.formatAmount(item.changeAmount)
              : "",
            item.date ? this.formatDate(item.date) : "",
          ];
          return fields.some((field) =>
            String(field || "")
              .toLowerCase()
              .includes(query),
          );
        });
      }

      const sorted = [...items].sort((a, b) => {
        switch (this.sortBy) {
          case "date-oldest":
            return this.toTimestamp(a.date) - this.toTimestamp(b.date);
          case "date-newest":
            return this.toTimestamp(b.date) - this.toTimestamp(a.date);
          case "amount-asc":
            if (a.amount === null && b.amount === null) return 0;
            if (a.amount === null) return 1;
            if (b.amount === null) return -1;
            return a.amount - b.amount;
          case "amount-desc":
            if (a.amount === null && b.amount === null) return 0;
            if (a.amount === null) return 1;
            if (b.amount === null) return -1;
            return b.amount - a.amount;
          case "name-desc":
            return String(b.transaktion || "").localeCompare(
              String(a.transaktion || ""),
              "de",
            );
          case "name-asc":
          default:
            return String(a.transaktion || "").localeCompare(
              String(b.transaktion || ""),
              "de",
            );
        }
      });

      return sorted;
    },
  },
  methods: {
    toTimestamp(value) {
      const parsed = new Date(value || 0).getTime();
      return Number.isFinite(parsed) ? parsed : 0;
    },
    formatDate(value) {
      if (!value) return "Kein Datum";
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return "Kein Datum";
      return parsed.toLocaleDateString("de-AT");
    },
    formatAmount(value) {
      const amount = Number(value);
      if (!Number.isFinite(amount)) return "—";
      return new Intl.NumberFormat("de-AT", {
        style: "currency",
        currency: "EUR",
      }).format(amount);
    },
    async fetchBills() {
      this.loading = true;
      this.error = null;
      try {
        const { loadUserData } = await import("@/utils/loadUser");
        const data = await loadUserData();
        let items = Array.isArray(data?.receipts) ? data.receipts : [];
        const seen = new Set();
        items = items.filter((item) => {
          if (!item.documentId) return true;
          if (seen.has(item.documentId)) return false;
          seen.add(item.documentId);
          return true;
        });

        const fetchFile = async (id) => {
          const res = await fetch(`${STRAPI_URL}/api/upload/files/${id}`);
          if (!res.ok) throw new Error("Fetch failed");
          return res.json();
        };

        const billPromises = items.map(async (item) => {
          const normalized = this.normalizeReceipt(item);
          let imgSrc = normalized.img || this.placeholderImage;
          const pictureId = normalized?.picture?.id || normalized?.picture?.data?.id;
          if (pictureId) {
            const json = await fetchFile(pictureId);
            imgSrc = json?.url ? `${STRAPI_URL}${json.url}` : imgSrc;
          }

          return {
            img: imgSrc,
            ...normalized,
          };
        });

        this.bills = await Promise.all(billPromises);
      } catch (e) {
        this.error = e.message || "Fehler beim Laden der Rechnungen.";
      } finally {
        this.loading = false;
      }
    },
    openReceipt(item) {
      this.selected = item;
      this.dialog = true;
    },
    normalizeReceipt(item) {
      const source = this.unwrapReceipt(item);
      const amount = this.pickFirstAmount(source, [
        "totalAmount",
        "amount",
        "summe",
        "total",
        ["totals", "summe"],
        ["totals", "gezahlt"],
        ["totals", "rueckgeld"],
        "paidAmount",
        "changeAmount",
        "gezahlt",
        "rueckgeld",
      ]);
      const title = this.pickFirstText(source, [
        "store",
        "title",
        "transaktion",
        "merchant",
        "name",
        "business",
        "vendor",
        "receiptName",
        "shop",
        "categoryLabel",
        "category_name",
        "ocrText",
        "itemsText",
        "items_text",
        ["attributes", "store"],
        ["attributes", "title"],
        ["attributes", "transaktion"],
        ["attributes", "ocrText"],
        ["attributes", "itemsText"],
      ]);
      const fallbackTitle = this.firstNonEmptyLine(source?.ocrText || source?.itemsText || source?.items || source?.items_text);
      const postcodePlace = this.pickFirstText(source, [
        "postcodePlace",
        "postcode",
        "postalPlace",
        ["attributes", "postcodePlace"],
      ]);
      const streetHouseNum = this.pickFirstText(source, [
        "streetHouseNum",
        "street",
        "houseNumber",
        ["attributes", "streetHouseNum"],
      ]);

      return {
        id: source?.id || null,
        documentId: source?.documentId || null,
        img:
          source?.img ||
          source?.picture?.url ||
          source?.picture?.data?.attributes?.url ||
          null,
        title: title || fallbackTitle || null,
        transaktion: title || fallbackTitle || null,
        store: title || fallbackTitle || null,
        categoryLabel: this.pickFirstText(source, [
          "categoryLabel",
          "category_name",
          "category",
          ["attributes", "categoryLabel"],
          ["attributes", "category_name"],
          ["attributes", "category"],
        ]) || "Sonstiges",
        items: source?.items || source?.itemsText || source?.items_text || null,
        postcodePlace: postcodePlace || null,
        streetHouseNum: streetHouseNum || null,
        purchaseDate: source?.purchaseDate || source?.purchase_date || null,
        scanDate: source?.scanDate || source?.date || source?.createdAt || null,
        totalAmount: amount,
        amount,
        paidAmount: this.pickFirstAmount(source, ["paidAmount", "gezahlt", ["totals", "gezahlt"]]),
        changeAmount: this.pickFirstAmount(source, ["changeAmount", "rueckgeld", ["totals", "rueckgeld"]]),
        picture: source?.picture || null,
        date: source?.date || source?.scanDate || source?.createdAt || null,
      };
    },
    unwrapReceipt(item) {
      return item?.attributes ? { ...item.attributes, id: item.id, documentId: item.documentId } : item?.data?.attributes ? { ...item.data.attributes, id: item.data.id, documentId: item.data.documentId } : item;
    },
    pickFirstText(source, paths) {
      for (const path of paths) {
        const value = Array.isArray(path)
          ? path.reduce((current, key) => (current && typeof current === "object" ? current[key] : undefined), source)
          : source?.[path];
        if (typeof value === "string" && value.trim()) return value.trim();
      }
      const recursiveText = this.findRecursiveValue(
        source,
        (key, value) => {
          if (typeof value !== "string") return false;
          if (!value.trim()) return false;
          if (/^(id|documentId|url|createdAt|updatedAt)$/i.test(key)) return false;
          return /store|title|transaktion|merchant|name|business|vendor|shop|location|adresse|address/i.test(key) || value.trim().length > 2;
        },
      );
      if (typeof recursiveText === "string" && recursiveText.trim()) {
        return recursiveText.trim();
      }
      return "";
    },
    pickFirstAmount(source, paths) {
      for (const path of paths) {
        const value = Array.isArray(path)
          ? path.reduce((current, key) => (current && typeof current === "object" ? current[key] : undefined), source)
          : source?.[path];
        const amount = this.toNumber(value);
        if (amount !== null) return amount;
      }
      const recursiveAmount = this.findRecursiveValue(
        source,
        (key, value) => {
          if (!/amount|summe|total|price|value|gezahlt|rueckgeld|balance/i.test(key)) {
            return false;
          }
          return this.toNumber(value) !== null;
        },
      );
      const parsedAmount = this.toNumber(recursiveAmount);
      if (parsedAmount !== null) {
        return parsedAmount;
      }
      return null;
    },
    findRecursiveValue(source, predicate, visited = new Set()) {
      if (!source || typeof source !== "object" || visited.has(source)) return null;
      visited.add(source);

      for (const [key, value] of Object.entries(source)) {
        if (predicate(key, value)) {
          return value;
        }
        if (value && typeof value === "object") {
          const nested = this.findRecursiveValue(value, predicate, visited);
          if (nested !== null && nested !== undefined) {
            return nested;
          }
        }
      }

      return null;
    },
    firstNonEmptyLine(value) {
      if (typeof value !== "string") return "";
      return value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.length > 0)
        || "";
    },
    getReceiptTitle(item) {
      return (
        item?.store ||
        item?.title ||
        item?.transaktion ||
        item?.merchant ||
        item?.receiptName ||
        item?.categoryLabel ||
        this.firstNonEmptyLine(item?.itemsText || item?.items || item?.ocrText || item?.items_text) ||
        "Unbekannter Beleg"
      );
    },
    formatAddress(item) {
      const parts = [item?.postcodePlace, item?.streetHouseNum].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
      return item?.store || item?.title || item?.transaktion || "Kein Standort";
    },
    getAmount(item) {
      return item?.amount ?? item?.totalAmount ?? item?.summe ?? item?.total ?? item?.paidAmount ?? null;
    },
    toNumber(value) {
      const parsed = Number(String(value ?? "").replace(",", "."));
      return Number.isFinite(parsed) ? parsed : null;
    },
  },
  mounted() {
    this.fetchBills();
  },
};
</script>

<style scoped>
.bill-overview {
  max-width: 1180px;
  margin: 0 auto;
  padding: 12px 8px 28px;
  box-sizing: border-box;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: 24px 24px 22px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(255,255,255,0.84), rgba(237, 248, 240, 0.96));
  border: 1px solid rgba(96, 143, 108, 0.12);
}
.header-row h1 {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: clamp(1.7rem, 3vw, 2.6rem);
  font-weight: 800;
}
.search-field {
  width: 100%;
}
.cards-wrap {
  padding: 4px 2px 0;
}
.bill-card {
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
  box-shadow: 0 2px 8px rgba(11, 43, 24, 0.06);
}
.bill-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 34px rgba(11, 43, 24, 0.12);
}
.bill-card {
  cursor: pointer;
}
.bill-card-media {
  position: relative;
  overflow: hidden;
}
.bill-card-img {
  background: #f5fff8; /* soft greenish background to match theme */
  object-fit: cover;
}
.bill-card-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px;
  display: flex;
  justify-content: flex-start;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(11, 43, 24, 0.55));
}
.bill-card-chip {
  font-weight: 600;
}
.bill-card-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(var(--v-theme-on-surface), 0.65);
  background: linear-gradient(135deg, #f5fff8 0%, #e4f4e8 100%);
}
.bill-card-placeholder .v-icon {
  color: rgba(67, 124, 76, 0.88);
}
.dialog-body {
  padding: 16px;
  background: linear-gradient(180deg, rgba(247,255,248,0.96) 0%, rgba(238,248,240,0.98) 100%);
}
.dialog-image-shell {
  min-height: 72vh;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 26px;
  overflow: hidden;
  background: linear-gradient(135deg, #f5fff8 0%, #e2f1e6 100%);
  border: 1px solid rgba(67, 124, 76, 0.12);
}
.dialog-image {
  width: 100%;
}
.dialog-placeholder {
  height: 72vh;
}
.bill-card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1 1 auto;
}
.trans-title {
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  font-size: 1rem;
}
.trans-meta {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.72);
  margin-top: 6px;
}
.no-data {
  padding: 28px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

@media (max-width: 900px) {
  .search-field {
    max-width: 100%;
    width: 100%;
  }
}

@media (max-width: 700px) {
  .bill-overview {
    padding: 6px 0 0;
  }
  .header-row {
    flex-direction: column;
    align-items: stretch;
    padding: 18px;
  }
  .search-field {
    width: 100%;
    max-width: 100%;
  }
  .header-row h1 {
    font-size: 1.4rem;
  }
}
</style>
