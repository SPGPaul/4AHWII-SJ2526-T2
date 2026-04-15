<template>
  <div class="bill-overview">
    <div class="header-row">
      <h1>Rechnungsübersicht</h1>
      
    </div>

    <v-container fluid class="cards-wrap">
      <v-text-field
        v-model="searchQuery"
        label="Suche"
        clearable
        hide-details
        append-inner-icon="mdi-magnify"
        class="search-field"
      />
      <v-row>
        <v-col
          v-for="item in filteredRechnung"
          :key="item.img + item.transaktion"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card class="bill-card" elevation="2" @click="openReceipt(item)" role="button" tabindex="0">
            <v-img :src="item.img" height="160" class="bill-card-img" contain />
            <v-card-text class="bill-card-body">
              <div class="trans-title">{{ item.transaktion }}</div>
              <div class="trans-meta">{{ item.categoryLabel || "Sonstiges" }}</div>
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
        <v-toolbar-title>Beleg anzeigen</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>
      <v-card-text class="dialog-body">
        <v-img v-if="selected" :src="selected.img" max-height="80vh" contain />
        <div v-else class="no-data">Kein Beleg ausgewählt.</div>
      </v-card-text>
    </v-card>
  </v-dialog>
  </div>
</template>

<script>
export default {
  name: "BillOverviewArea",
  data() {
    return {
      searchQuery: "",
      dialog: false,
      selected: null,
      bills: [],
      loading: false,
      error: null,
    };
  },
  computed: {
    filteredRechnung() {
      if (!this.searchQuery) return this.bills;
      return this.bills.filter((item) =>
        item.transaktion?.toString().toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
  },
  methods: {
    async fetchBills() {
      this.loading = true;
      this.error = null;
      try {
        // Nutze loadUserData wie in Analysis_area.vue
        const { loadUserData } = await import('@/utils/loadUser');
        const data = await loadUserData();
        let items = Array.isArray(data?.receipts) ? data.receipts : [];
        // Doppelte filtern
        const seen = new Set();
        items = items.filter(item => {
          if (!item.documentId) return true;
          if (seen.has(item.documentId)) return false;
          seen.add(item.documentId);
          return true;
        });
        // Mapping für img
        const baseUrl = "https://elegant-eggs-b247740f2b.strapiapp.com";
        this.bills = items.map(item => {
          let imgSrc = '';
          if (item.img) {
            if (typeof item.img === 'string') {
              imgSrc = item.img.startsWith('http') ? item.img : `${baseUrl}${item.img}`;
            } else if (typeof item.img === 'object' && item.img.url) {
              imgSrc = item.img.url.startsWith('http') ? item.img.url : `${baseUrl}${item.img.url}`;
            }
          }
          return {
            img: imgSrc,
            transaktion: item.transaktion || item.title || '',
            categoryLabel: item.categoryLabel || item.category_name || item.category || 'Sonstiges',
            documentId: item.documentId || null
          };
        });
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
  },
  mounted() {
    this.fetchBills();
  },
};
</script>

<style scoped>
.bill-overview {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
  background: #ffffff;
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 4px solid #bcefc2; /* matches topbar accent */
}
.header-row h1 {
  margin: 0;
  color: #0b2b18;
  font-size: 2rem;
  font-weight: 700;
}
.search-field {
  width: 1130px;
  color: #0b2b18;
  padding-bottom: 12px;
}
.cards-wrap {
  padding: 8px 2px;
}
.bill-card {
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  box-shadow: 0 2px 8px rgba(11, 43, 24, 0.06);
}
.bill-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(11, 43, 24, 0.12);
}
.bill-card { cursor: pointer; }
.bill-card-img {
  background: #f5fff8; /* soft greenish background to match theme */
  object-fit: cover;
}
.bill-card-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1 1 auto;
}
.trans-title {
  font-weight: 700;
  color: #f1f1f1;
  font-size: 1rem;
}
.trans-meta {
  font-size: 0.85rem;
  color: #ffffff;
  margin-top: 6px;
}
.no-data {
  padding: 28px;
  text-align: center;
  color: #fafafa;
}

@media (max-width: 900px) {
  .search-field {
    max-width: 50%;
    width: 240px;
  }
}

@media (max-width: 700px) {
  .bill-overview { padding: 12px; }
  .header-row {
    flex-direction: column;
    align-items: stretch;
    border-bottom: 3px solid #e9fff0;
  }
  .search-field {
    width: 100%;
    max-width: 100%;
  }
  .header-row h1 { font-size: 1.4rem; }
}

</style>
