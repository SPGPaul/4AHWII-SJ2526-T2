<script setup lang="ts">
import Layout from '@/components/Layout.vue'
import AnalysisArea from '@/components/Analysis_area.vue'
</script>

<template>
  <Layout>
    <!-- make the container take full height, then let the component fill that space -->
    <v-container class="py-0 fill-height" fluid>
      <v-row class="fill-height">
        <!-- use full width and full height -->
        <v-col cols="12" class="pa-0 fill-height">
          <!-- component fills all available space -->
          <div class="d-flex align-center justify-center" style="height:100%; width:100%;">
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
