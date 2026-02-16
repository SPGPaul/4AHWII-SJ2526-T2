<template>
  <div class="bill-overview">
    <div class="header-row">
      <h1>Rechnungsübersicht</h1>
      <v-text-field
        v-model="searchQuery"
        label="Suche"
        clearable
        hide-details
        append-inner-icon="mdi-magnify"
        class="search-field"
      />
    </div>

    <v-container fluid class="cards-wrap">
      <v-row>
        <v-col
          v-for="item in filteredRechnung"
          :key="item.id"
          cols="12" sm="6" md="4" lg="3"
        >
          <v-card class="bill-card" elevation="2" @click="openReceipt(item)" role="button" tabindex="0">
            <v-img :src="item.img" height="160" class="bill-card-img" contain />
            <v-card-text class="bill-card-body">
              <div class="trans-title">{{ item.transaktion }}</div>
              <div class="trans-description">
                 {{ item.description || 'Keine Beschreibung' }}
              </div>
              <!-- hier können beliebig weitere Felder eingebaut werden: -->
              <div class="trans-meta">Betrag: {{ item.betrag }} €</div>
              <div class="trans-meta">Datum: {{ item.datum }}</div>
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
      receipts: [],
      loading: false,
      token: "54a258000325fcbff04e65b292fecd2ca70258552324762fd2520e1932269765803183eb47586c2203f12b3abd7c7dbbe3dffe729c8334508eeba14656a85aa5bb7441ec939788a76a8a7e6066b1973362e5cdb6770a50dbecf0d74a4bcebe7c650eb54f08b757e0770003032e5817aa26dc6664c373e2c2e8667888d2d3f2c1",
    };
  },
  async mounted() {
    await this.fetchReceipts();
  },
  computed: {
    filteredRechnung() {
      if (!this.searchQuery) return this.receipts;
      return this.receipts.filter((item) =>
        (item.transaktion || "").toString().toLowerCase()
          .includes(this.searchQuery.toLowerCase())
      );
    },
  },
  methods: {
    async fetchReceipts() {
      this.loading = true;
      try {
        const apiUrl = "https://elegant-eggs-b247740f2b.strapiapp.com/api/Receipts?populate=*";
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Receipts von API:", data);

        // Alle Receipts mit Bildern formatieren
        this.receipts = data.data
          .filter((receipt) => receipt.attributes) // Nur Receipts mit attributes
          .map((receipt) => {
            // picture ist direkt die Datei, nicht verschachtelt
            const imageUrl = receipt.attributes.picture?.url;
            console.log("ImageURL für ID", receipt.id, ":", imageUrl);
            
            const fullImageUrl = imageUrl
              ? `https://elegant-eggs-b247740f2b.strapiapp.com${imageUrl}`
              : null;

            return {
              id: receipt.id,
              transaktion: receipt.attributes.transaktion || "Beleg",
              img: fullImageUrl || "https://via.placeholder.com/300x400?text=Kein+Bild",
              ...receipt.attributes,
            };
          });
        
        console.log("Formatierte Receipts:", this.receipts);

        console.log("Formatierte Receipts:", this.receipts);
      } catch (error) {
        console.error("Fehler beim Laden der Belege:", error);
      } finally {
        this.loading = false;
      }
    },
    openReceipt(item) {
      this.selected = item;
      this.dialog = true;
    },
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
  width: 360px;
  max-width: 45%;
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
.trans-description {
  font-size: 0.8rem;
  color: #d0d0d0;
  margin-top: 8px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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

