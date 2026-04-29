<template>
  <v-app :class="{ 'theme-dark': isDark }">
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
.theme-dark {
  color-scheme: dark;
}

.theme-dark,
.theme-dark * {
  color: #ffffff !important;
}

.theme-dark :where(input, textarea, select, option, button) {
  caret-color: #ffffff;
}
</style>
