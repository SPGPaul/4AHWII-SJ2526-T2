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

<script setup>
import AnalysisArea from "/src/components/Analysis_area.vue";
</script>

<style lang="scss">
.v-container {
  align-items: center;
}
</style>
