<template>
  <v-app
    :class="{ 'is-mobile': isMobile, 'theme-dark': isDark }"
    :style="{ '--drawer-width': drawerWidth + 'px' }"
  >
    <!-- top bar -->
    <v-app-bar app class="top-bar" flat>
      <v-btn icon @click="drawer = !drawer" class="mx-2">
        <v-icon>mdi-menu</v-icon>
      </v-btn>

      <v-toolbar-title class="app-title">
      
        Rechnungsradar
      </v-toolbar-title>

      <v-btn
        icon
        variant="text"
        :title="isDark ? 'Hellmodus aktivieren' : 'Dunkelmodus aktivieren'"
        @click="toggleTheme"
        style="position: absolute; right: 72px; top: 50%; transform: translateY(-50%); z-index: 10;"
      >
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

       <!-- Avatar menu ersetzt den runden Button -->
  <v-menu min-width="240" offset-y>
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        class="rounded-profile top-profile-btn"
        elevation="2"
        icon
        :title="'Profil'"
      >
        <v-avatar color="green" size="40">
          <span class="text-white profile">{{ userInitials }}</span>
        </v-avatar>
      </v-btn>
    </template>

    <v-card class="profile-menu-card">
      <v-card-text>
        <div class="mx-auto text-center" style="width:220px">
          <v-avatar color="green" size="56" class="mb-2">
            <span class="text-h6 text-white">{{ userInitials }}</span>
          </v-avatar>
          <h3 style="margin:4px 0;">{{ userName }}</h3>
          <p class="text-caption mt-1">{{ userEmail }}</p>
          <v-divider class="my-3"></v-divider>
          <v-btn to="/profil" variant="text"  color="secondary" rounded block>Account bearbeiten</v-btn>
          <v-divider class="my-3"></v-divider>
          <v-btn variant="text" rounded block color="error" @click="logout">Abmelden</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
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
        <v-list-item to="/billOverview" class="drawer-item" @click="isMobile && (drawer = false)">
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
        <v-list-item to="/savings-ai" class="drawer-item" @click="isMobile && (drawer = false)">
          <v-list-item-icon class="drawer-item-icon">
            <v-icon>mdi-piggy-bank-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>AI Spartipps</v-list-item-title>
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useTheme } from "vuetify";
import { useRouter } from "vue-router";
import { loadUserData } from "@/utils/loadUser";
import { clearAuthToken } from "@/utils/http";

const THEME_STORAGE_KEY = "rechnungsradar-theme";

const router = useRouter();
const drawer = ref(true);
const theme = useTheme();

const isDarkMode = computed(() => theme.global.name.value === "dark");

const isMobile = ref(false);
const drawerWidth = computed(() => (isMobile.value ? 280 : 120));

const userName = ref("user");
const userInitials = ref("u");
const userEmail = ref("user@mail.com");

function setTheme(name: "light" | "dark") {
  theme.global.name.value = name;
  localStorage.setItem(THEME_STORAGE_KEY, name);
}

function toggleTheme() {
  const nextTheme = isDarkMode.value ? "light" : "dark";
  setTheme(nextTheme);
}

async function loadUser() {
  try {
    const user = await loadUserData();
    userName.value = user?.username || "user";
    userInitials.value = userName.value[0] || "U";
    userEmail.value = user?.email || "user@mail.com";
  } catch (err) {
    console.error("Failed to load user:", err);
  }
}

function logout() {
  clearAuthToken();
  router.push("/");
}

const updateIsMobile = () => {
  isMobile.value = window.matchMedia("(max-width: 700px)").matches;
  if (isMobile.value) drawer.value = false;
};

onMounted(() => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    theme.global.name.value = savedTheme;
  }

  updateIsMobile();
  window.addEventListener("resize", updateIsMobile);
  loadUser();
});

watch(
  () => theme.global.name.value,
  (value) => {
    if (value === "light" || value === "dark") {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    }
  }
);

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateIsMobile);
});
</script>

<style lang="scss" scoped>
  
/* proportions and colors */
$topbar-height: 120px;
$profile-size: 48px;
$app-title-size: 38px;

:global(.v-theme--light) {
  --layout-page-bg: var(--app-page-bg);
  --layout-surface: var(--app-surface);
  --layout-surface-strong: var(--app-surface-strong);
  --layout-surface-soft: var(--app-surface-soft);
  --layout-text: var(--app-text);
  --layout-border: var(--app-border);
}

:global(.v-theme--dark) {
  --layout-page-bg: var(--app-page-bg);
  --layout-surface: var(--app-surface);
  --layout-surface-strong: var(--app-surface-strong);
  --layout-surface-soft: var(--app-surface-soft);
  --layout-text: var(--app-text);
  --layout-border: var(--app-border);
}

.top-bar {
  background-color: var(--layout-surface-strong) !important;
  border-bottom: 5px solid var(--layout-border);
  height: $topbar-height;
  --v-toolbar-height: #{$topbar-height};
  align-items: center;
  position: relative;
  padding-left: 12px;
  padding-right: 12px;
  overflow: visible;
  color: green//$text-primary !important;
}

.app-title {
  margin: 0 auto;
  font-size: $app-title-size;
  font-weight: 700;
  color: var(--layout-text) !important;
  text-align: center;
  line-height: 1.2;

  :deep(*) {
    color: var(--layout-text) !important;
  }
}

.theme-toggle-btn {
  position: absolute;
  right: 72px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
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
  background: linear-gradient(var(--layout-surface), var(--layout-surface-strong));
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
  color: var(--layout-surface);
}

.left-drawer {
  background-color: var(--layout-surface) !important;
  border-right: 2px solid var(--layout-border);
  padding-top: 16px;
  box-sizing: border-box;
  overflow: visible;
  color: var(--layout-text);
  /* IMPORTANT: keine feste width hier erzwingen, sonst kollidiert es mit :width */
}

.drawer-list {
  width: 100%;
  padding-left: 8px;
  padding-right: 8px;
}

/* Desktop: icon over text */
.drawer-item {
  color: var(--layout-text) !important;
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
    color: var(--layout-text) !important;
    margin-top: 6px;
    white-space: normal;
    word-break: keep-all;
  }

  .v-icon {
    color: var(--layout-text) !important;
    font-size: 28px;
    line-height: 1;
  }
}

/* IMPORTANT:
   Do NOT override v-main padding (Vuetify uses it for layout offsets).
   Put your spacing into the inner wrap instead.
*/
.main-area {
  background: var(--layout-page-bg);
  color: var(--layout-text);
  box-sizing: border-box;
  /* remove the old calculated paddings */
  padding: unset;
  min-height: 100%;
}

.theme-dark {
  .top-bar {
    background-color: #1f2a1f !important;
    border-bottom-color: rgba(255, 255, 255, 0.2);
    color: #ffffff !important;
  }

  .app-title {
    color: #e9f3eb !important;
  }

  .left-drawer {
    background-color: #253025 !important;
    border-right-color: rgba(255, 255, 255, 0.12);
    color: #ffffff !important;
  }

  .drawer-item,
  .drawer-item .v-list-item-title,
  .drawer-item .v-icon {
    color: #e9f3eb !important;
  }
}

.profile-menu-card {
  background: var(--layout-surface);
  color: var(--layout-text);
}

.profile-menu-card p {
  color: var(--app-muted);
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

  .theme-toggle-btn {
    right: 64px;
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
