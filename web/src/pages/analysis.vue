<script setup lang="ts">
import Layout from '@/components/Layout.vue'
import AnalysisArea from '@/components/Analysis_area.vue'
</script>

<template>
  <Layout>
    <v-container fluid class="pa-0">
      <v-row class="ma-0">
        <v-col cols="12" class="pa-0">
          <div style="padding-top:24px; padding-bottom:24px; padding-left:24px;">
            <br>
            <br>
            <br>
            <br>
            <AnalysisArea />
          </div>
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
