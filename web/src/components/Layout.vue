<template>
  <v-app>
    <!-- top bar -->
    <v-app-bar app class="top-bar" flat>
      <v-btn icon @click="drawer = !drawer" class="mx-2">
        <v-icon>mdi-menu</v-icon>
      </v-btn>

      <v-toolbar-title class="app-title">Rechnungsradar</v-toolbar-title>

      <v-spacer />

      <!-- top-right rounded profile (moved from drawer) -->
      <v-btn
        class="rounded-profile top-profile-btn"
        elevation="2"
        icon
        :title="'Profil'"
      >
        <span class="profile">P</span>
      </v-btn>
    </v-app-bar>

    <!-- slim left sidebar -->
    <v-navigation-drawer
      app
      v-model="drawer"
      class="left-drawer"
      permanent
      width="80"
    >
      <v-list dense nav class="drawer-list">
        <v-list-item to="/dashboard" class="drawer-item">
          <v-list-item-icon>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Übersicht</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item to="/scan" class="drawer-item">
          <v-list-item-icon>
            <v-icon>mdi-camera</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Beleg scannen</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item to="/scans" class="drawer-item">
          <v-list-item-icon>
            <v-icon>mdi-file-document</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>gescannte Belege</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item to="/analysis" class="drawer-item">
          <v-list-item-icon>
            <v-icon>mdi-poll</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Analysen</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-spacer />
        <!-- removed bottom profile from drawer -->
      </v-list>
    </v-navigation-drawer>

    <v-main class="main-area">
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";

const drawer = ref(true);
</script>

<style lang="scss" scoped>
/* proportions and colors */
$sidebar-bg: #a8e6b8; /* light green */
$topbar-bg: #bcefc2;
$text-primary: #0b2b18;
$border-dark: #222;

/* adjusted proportions */
$topbar-height: 64px;
$drawer-width: 80px;
$profile-size: 40px;
$app-title-size: 36px;

.top-bar {
  background-color: $topbar-bg !important;
  border-bottom: 4px solid $border-dark;
  height: $topbar-height;
  align-items: center;
  position: relative; /* needed for absolute positioned top-profile-btn */
}

/* center title visually */
.app-title {
  margin: 0 auto;
  font-size: $app-title-size;
  font-weight: 700;
  color: $text-primary !important;
  text-align: center;
}

/* top-right profile button (moved from drawer) */
.top-profile-btn {
  position: absolute;
  right: 12px;
  top: calc((#{$topbar-height} - #{$profile-size}) / 2);
}

/* round profile shared style */
.rounded-profile {
  background: linear-gradient(#f5fff8, #e9fff0);
  border-radius: 999px;
  width: $profile-size;
  height: $profile-size;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.12);
  padding: 0;
}

.profile{
  font-size: 18px;
  line-height: 1;
  color: black;
}

/* left drawer */
.left-drawer {
  background-color: $sidebar-bg !important;
  border-right: 2px solid rgba(0,0,0,0.08);
  padding-top: 12px;
  box-sizing: border-box;
  width: $drawer-width !important;
}

/* smaller icons and compact text */
.drawer-list {
  width: 100%;
  padding-left: 6px;
  padding-right: 6px;
}

.drawer-item {
  color: $text-primary !important;
  min-height: 40px;
  padding-left: 4px;
  padding-right: 4px;

  .v-list-item-title {
    font-size: 11px;
    line-height: 1;
    color: $text-primary !important;
  }

  .v-icon {
    color: $text-primary !important;
    font-size: 20px;
  }
}

/* main area spacing adjusted for new topbar height */
.main-area {
  background: white;
  min-height: calc(100vh - #{$topbar-height});
  padding: 24px;
}
</style>
