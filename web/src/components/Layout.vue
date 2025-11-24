<template>
  <v-app>
    <!-- top bar -->
    <v-app-bar app class="top-bar" flat>
      <v-btn icon @click="drawer = !drawer" class="mx-2">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <br></br>
      <v-toolbar-title class="app-title">Rechnungsradar</v-toolbar-title>

      <v-spacer></v-spacer>

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
      width="120"
    >
      <v-list dense nav class="drawer-list">
        <v-list-item to="/dashboard" class="drawer-item">
          <v-list-item-icon class="drawer-item-icon">
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Übersicht</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item to="/scan" class="drawer-item">
          <v-list-item-icon class="drawer-item-icon">
            <v-icon>mdi-camera</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Beleg scannen</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item to="/scans" class="drawer-item">
          <v-list-item-icon class="drawer-item-icon">
            <v-icon>mdi-file-document</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>gescannte Belege</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item to="/analysis" class="drawer-item">  
          <v-list-item-icon class="drawer-item-icon">
            <v-icon>mdi-poll</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Analysen</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-spacer></v-spacer>
        <!-- removed bottom profile from drawer -->
      </v-list>
    </v-navigation-drawer>

    <v-main class="main-area">
      <slot></slot>
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

/* adjusted proportions (thicker topbar and sidebar) */
$topbar-height: 120px; /* increased from 88px */
$drawer-width: 120px;
$profile-size: 48px;
$app-title-size: 38px;

/* Allow absolutely positioned elements (profile) to overflow the app-bar without clipping */
.top-bar {
  background-color: $topbar-bg !important;
  border-bottom: 5px solid $border-dark;
  height: $topbar-height;
  /* tell Vuetify the toolbar height so layout offsets are correct */
  --v-toolbar-height: #{$topbar-height};
  align-items: center;
  position: relative; /* needed for absolute positioned top-profile-btn */
  padding-left: 12px;
  padding-right: 12px;
  overflow: visible; /* <- allow the rounded profile to be fully visible */
}

/* center title visually */
.app-title {
  margin: 0 auto;
  font-size: $app-title-size;
  font-weight: 700;
  color: $text-primary !important;
  text-align: center;
  line-height: 2;
}

/* top-right profile button (moved from drawer)
   use top:50% + translateY(-50%) for robust vertical centering regardless of computed height */
.top-profile-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  overflow: visible;
}

/* ensure toolbar buttons vertically center and don't get clipped */
.top-bar .v-btn {
  min-width: 40px;
  height: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
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
  box-shadow: 0 3px 6px rgba(0,0,0,0.12);
  padding: 0;
}

.profile {
  font-size: 18px;
  line-height: 1;
  color: black;
}

/* left drawer - allow overflow so taller list items/icons are not clipped */
.left-drawer {
  background-color: $sidebar-bg !important;
  border-right: 2px solid rgba(0,0,0,0.08);
  padding-top: 16px;
  box-sizing: border-box;
  width: $drawer-width !important;
  overflow: visible; /* <- prevent vertical clipping of icons/text */
}

/* list layout tuned for wider sidebar */
/* make each drawer-item vertical: icon above text, centered */
.drawer-list {
  width: 100%;
  padding-left: 8px;
  padding-right: 8px;
}

.drawer-item {
  color: $text-primary !important;
  min-height: 96px; /* slightly increased so icons/text don't get cut */
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  /* override internal content alignment */
  .v-list-item__content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .drawer-item-icon {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .v-list-item-title {
    font-size: 12px;
    line-height: 1.2;
    color: $text-primary !important;
    margin-top: 6px;
    white-space: normal;
    word-break: keep-all;
  }

  .v-icon {
    color: $text-primary !important;
    font-size: 28px;
    line-height: 1;
  }
}

/* main area spacing adjusted for new topbar height */
.main-area {
  background: white;
  /* ensure main content starts below the taller top bar */
  padding: 24px;
  padding-top: calc(#{$topbar-height} + 24px);
  min-height: calc(100vh - #{$topbar-height});
}
</style>
