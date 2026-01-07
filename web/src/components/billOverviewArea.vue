<template>
    //Rechnungsübersicht Bereich
    
    <v-table>
      <thead>
        <tr>
          <h1>Rechnungsübersicht</h1>
        </tr>
        <tr>
            <v-text-field v-model="searchQuery" label="Suche" width="10000"></v-text-field>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in filteredRechnung"
          :key="item.img"
        >
          <td>
            <v-img
              :src="item.img"
              max-width="300"
              max-height="300"
            />
          </td>
          <td>{{ item.transaktion }}</td>
          
        </tr>  
      </tbody>
  </v-table>
</template>

<script>
  export default {
    data () {
      return {
        searchQuery: '',
        desserts: [
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            transaktion: 'AMZ - GGL',
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            transaktion: 237,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            transaktion: 262,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            transaktion: 305,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            transaktion: 356,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            transaktion: 375,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            transaktion: 392,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            transaktion: 408,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            transaktion: 452,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            transaktion: 518,
          },
        ],
      }
    },
    computed: {
      filteredRechnung() {
        if (!this.searchQuery) {
          return this.desserts;
        }
        return this.desserts.filter(item =>
          item.transaktion.toString().toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
    }
  }
</script>

