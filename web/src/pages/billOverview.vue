<script setup lang="ts">
import Layout from '@/components/Layout.vue'
import BillOverviewArea from '@/components/billOverviewArea.vue'
</script>

<template>
  <Layout>
    <v-container fluid class="pa-0">
      <v-row class="ma-0">
        <v-col cols="12" class="pa-0">
          <br>
          <BillOverviewArea />
        </v-col>
      </v-row>
    </v-container>
  </Layout>
</template>

<style lang="scss">
/* ensure the app and Vuetify root elements can grow to full viewport height */
html, body, #app, .v-application {
  height: 100%;
  min-height: 100%;
}
</style>