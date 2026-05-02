<script setup lang="ts">
import Layout from '@/components/Layout.vue';
import DirectoryArea from '@/components/DirectoryArea.vue';
</script>

<template>
  <Layout>
    <v-container fluid class="pa-0">
      <v-row class="ma-0">
        <v-col cols="12" class="pa-0">
          <DirectoryArea />
        </v-col>
      </v-row>
    </v-container>
  </Layout>
</template>
