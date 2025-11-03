<template>
  <div>
    <h1>Übersicht</h1>
    <v-text-field label="Label" variant="outlined" ></v-text-field>



    <v-table>
      <thead>
        <tr>
          
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in desserts"
          :key="item.img"
        >
          <td>
            <v-img
              :src="item.img"
              max-width="300"
              max-height="300"
            />
          </td>
          <td>{{ item.calories }}</td>
          
        </tr>
      </tbody>
  </v-table>
  </div>
</template>
<script>
  export default {
    data () {
      return {
        desserts: [
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            calories: 159,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            calories: 237,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            calories: 262,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            calories: 305,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            calories: 356,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            calories: 375,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            calories: 392,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            calories: 408,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            calories: 452,
          },
          {
            img: 'https://cdn.prod.website-files.com/65c9eb8b18a74904c71e4d8e/66a8889946d967cf63c780fa_6634971f1028e9a64325b236_rechnungsvorlage-kostenlos-word-pdf-excel.webp',
            calories: 518,
          },
        ],
      }
    },
  }
</script>