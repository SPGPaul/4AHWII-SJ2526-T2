<template>
  <v-app
    :class="{ 'is-mobile': isMobile }"
    :style="{ '--drawer-width': drawerWidth + 'px' }"
  >
    <!-- top bar -->
    <v-app-bar app class="top-bar" flat>
      <v-btn icon @click="drawer = !drawer" class="mx-2">
        <v-icon>mdi-menu</v-icon>
      </v-btn>

      <v-toolbar-title class="app-title">Rechnungsradar</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn class="rounded-profile top-profile-btn" elevation="2" icon :title="'Profil'">
        <span class="profile">P</span>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer
      :app="!isMobile"
      v-model="drawer"
      class="left-drawer"
      :permanent="!isMobile"
      :temporary="isMobile"
      :width="drawerWidth"
    >
      <v-list dense nav class="drawer-list">
        <br>
        <br></br>
        <v-list-item to="/dashboard" class="drawer-item" @click="isMobile && (drawer = false)">
          <v-list-item-icon class="drawer-item-icon">
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Übersicht</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item to="/scan" class="drawer-item" @click="isMobile && (drawer = false)">
          <v-list-item-icon class="drawer-item-icon">
            <v-icon>mdi-camera</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Beleg scannen</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item to="/scans" class="drawer-item" @click="isMobile && (drawer = false)">
          <v-list-item-icon class="drawer-item-icon">
            <v-icon>mdi-file-document</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>gescannte Belege</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item to="/analysis" class="drawer-item" @click="isMobile && (drawer = false)">
          <v-list-item-icon class="drawer-item-icon">
            <v-icon>mdi-poll</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Analysen</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-spacer></v-spacer>
      </v-list>
    </v-navigation-drawer>

    <v-main class="main-area">
      <slot></slot>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const drawer = ref(true);

const isMobile = ref(false);
const drawerWidth = computed(() => (isMobile.value ? 280 : 120));

const updateIsMobile = () => {
  isMobile.value = window.matchMedia("(max-width: 700px)").matches;
  if (isMobile.value) drawer.value = false;
};

onMounted(() => {
  updateIsMobile();
  window.addEventListener("resize", updateIsMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateIsMobile);
});
</script>

<style lang="scss" scoped>
/* proportions and colors */
$sidebar-bg: #a8e6b8;
$topbar-bg: #bcefc2;
$text-primary: #0b2b18;
$border-dark: #222;

$topbar-height: 120px;
$profile-size: 48px;
$app-title-size: 38px;

.top-bar {
  background-color: $topbar-bg !important;
  border-bottom: 5px solid $border-dark;
  height: $topbar-height;
  --v-toolbar-height: #{$topbar-height};
  align-items: center;
  position: relative;
  padding-left: 12px;
  padding-right: 12px;
  overflow: visible;
}

.app-title {
  margin: 0 auto;
  font-size: $app-title-size;
  font-weight: 700;
  color: $text-primary !important;
  text-align: center;
  line-height: 1.2;
}

.top-profile-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  overflow: visible;
}

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

.left-drawer {
  background-color: $sidebar-bg !important;
  border-right: 2px solid rgba(0,0,0,0.08);
  padding-top: 16px;
  box-sizing: border-box;
  overflow: visible;
  /* IMPORTANT: keine feste width hier erzwingen, sonst kollidiert es mit :width */
}

.drawer-list {
  width: 100%;
  padding-left: 8px;
  padding-right: 8px;
}

/* Desktop: icon over text */
.drawer-item {
  color: $text-primary !important;
  min-height: 96px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

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

/* IMPORTANT:
   Do NOT override v-main padding (Vuetify uses it for layout offsets).
   Put your spacing into the inner wrap instead.
*/
.main-area {
  background: white;
  box-sizing: border-box;
  /* remove the old calculated paddings */
  padding: unset;
  min-height: 100%;
}

/* add page padding inside the wrap (after drawer/appbar offset) */
.main-area :deep(.v-main__wrap) {
  padding: 24px;
  box-sizing: border-box;
}

/* Mobile: ignore any left layout offset to prevent "white strip"/overlap */
@media (max-width: 700px) {
  .top-bar {
    height: 64px;
    --v-toolbar-height: 64px;
  }

  .app-title {
    font-size: 22px;
  }

  .main-area :deep(.v-main__wrap) {
    padding: 12px 4vw;
  }

  /* Mobile drawer: bessere Lesbarkeit, größere Touch-Ziele */
  .drawer-item {
    min-height: 56px;
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
    padding: 10px 10px;

    .v-list-item__content {
      align-items: flex-start;
    }

    .v-list-item-title {
      margin-top: 0;
      font-size: 14px;
    }

    .v-icon {
      font-size: 24px;
    }
  }
}
</style>
