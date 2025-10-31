<script setup lang="ts">
import Layout from '@/components/Layout.vue'
import AnalysisArea from '@/components/Analysis_area.vue'
</script>

<template>
  <Layout>
    <v-container class="py-8; color: white;">
      <v-row>
        <v-col cols="12" class="align-center">
          <AnalysisArea />
        </v-col>
      </v-row>
    </v-container>
  </Layout>
</template>


<style lang="scss">
.v-container {
  align-items: center;
}
</style>
