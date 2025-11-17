<script setup lang="ts">
import Dashboard from '@/components/dashBoard.vue'
</script>


<template>
  <Layout>
    <v-container class="py-8; color: white;">
      <v-row>
        <v-col cols="12" class="align-center">
          <DashBoard />
        </v-col>
      </v-row>
    </v-container>
  </Layout>
</template>
