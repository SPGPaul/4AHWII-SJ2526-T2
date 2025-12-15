<script setup lang="ts">
import Layout from '@/components/Layout.vue'
import Dashboard from '@/components/dashBoard.vue'
</script>


<template>
  <Layout>
    <v-container class="py-8" fluid>
      <v-row>
        <v-col cols="12">
          <Dashboard />
        </v-col>
      </v-row>
    </v-container>
  </Layout>
</template>
