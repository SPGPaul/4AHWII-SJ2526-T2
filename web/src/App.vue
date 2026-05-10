<template>
  <v-app :class="{ 'theme-dark': isDark }" class="app-shell">
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { computed } from "vue";
import { useTheme } from "vuetify";

const theme = useTheme();

const isDark = computed(() => theme.global.current.value.dark);
</script>

<style>
.app-shell {
  min-height: 100vh;
}

.theme-dark {
  color-scheme: dark;
}

.theme-dark .v-main {
  color-scheme: dark;
}
</style>
