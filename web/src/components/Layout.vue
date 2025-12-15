<template>
  <v-app>
    <v-app-bar class="bg-white">
      <v-btn icon @click="toggleDrawer">
        <v-icon class="text-primary">mdi-menu</v-icon>
      </v-btn>
      <v-toolbar-title class="text-primary"
        >Rechnungsradar ändern</v-toolbar-title
      >
      <v-spacer></v-spacer>

      <v-btn icon color="primary">
        <v-icon class="text-primary">mdi-account</v-icon>

        <v-menu activator="parent">
          <v-list>
            <v-list-item>
              <v-list-item-title>Profil</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary class="bg-white">
      <v-list density="compact" nav>
        <v-list-item
          class="text-primary"
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          to="/dashboard"
        ></v-list-item>
        <v-list-item
          class="text-primary"
          prepend-icon="mdi-camera"
          title="Beleg scannen"
          to="/scan"
        ></v-list-item>
        <v-list-item
          class="text-primary"
          prepend-icon="mdi-file-document"
          title="gescannte Belege"
          to=""
        ></v-list-item>
        <v-list-item
          class="text-primary"
          prepend-icon="mdi-poll"
          title="Analysen"
          to="/analysis"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main style="height: 870px">
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";

const drawer = ref(false); // Zustand des Navigationsdrawers

function toggleDrawer() {
  drawer.value = !drawer.value; // Toggle-Funktion
}
</script>

<style lang="scss">
.v-navigation-drawer {
  background-color: #e1f5fe;
}
</style>
