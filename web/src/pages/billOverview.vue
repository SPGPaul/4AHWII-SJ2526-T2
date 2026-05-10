<script setup lang="ts">
import Layout from '@/components/Layout.vue'
import BillOverviewArea from '@/components/billOverviewArea.vue'
</script>

<template>
  <Layout>
    <BillOverviewArea />
  </Layout>
</template>

<style lang="scss">
/* ensure the app and Vuetify root elements can grow to full viewport height */
html, body, #app, .v-application {
  height: 100%;
  min-height: 100%;
}
</style>