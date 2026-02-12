<<template>
  <v-app
    :class="{ 'is-mobile': isMobile }"
    :style="{ '--drawer-width': drawerWidth + 'px' }"
  >
    <!-- top bar -->
    <v-app-bar app class="top-bar text-black" flat>
      <v-btn icon @click="drawer = !drawer" class="mx-2">
        <v-icon>mdi-menu</v-icon>
      </v-btn>

      <v-toolbar-title class="app-title">
      
        Rechnungsradar
      </v-toolbar-title>


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

    <v-card>
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
 <v-layout>
    <v-navigation-drawer
      :app="!isMobile"
      v-model="drawer"
      class="left-drawer sidebar"
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
        <v-spacer></v-spacer>
      </v-list>
    </v-navigation-drawer>

      <!-- Content -->
      <v-main class="content">
        
        <v-container class="profile-container">

          <v-card class="profile-card" elevation="4">
            
            <v-card-title class="text-h5 font-weight-bold mb-4 text-black">
              Mein Profil
            </v-card-title>

            <v-divider class="mb-6" />

            <v-row>
              <v-col cols="12" md="4" class="text-center">
                <v-avatar size="120" class="big-avatar mb-4 bg-white" variant="outlined">
                  <span class="text-h4 text-black ">J</span>
                </v-avatar>

                <v-btn color="white" class="text-black" variant="flat">
                  Avatar ändern
                </v-btn>
              </v-col>

              <v-col cols="12" md="8">
                <v-form>
                  <v-text-field
                    label="Name"
                    variant="outlined"
                    class="mb-4 text-black  "
                    
                  />
                  <v-text-field
                    label="E-Mail"
                    variant="outlined"
                    class="mb-4 text-black"
                  />
                  <v-text-field
                    label="Standort"
                    variant="outlined"
                    class="mb-4 text-black"
                  />
                  <v-text-field
                    label="Neues Passwort"
                    type="password"
                    variant="outlined"
                    class="mb-4 text-black"
                  />

                  <v-btn
                    color="white"
                    size="large"
                    class="save-btn text-black"
                  >
                    Änderungen speichern
                  </v-btn>
                </v-form>
              </v-col>
            </v-row>

          </v-card>

        </v-container>
        
      </v-main>
</v-layout>
                                
  </v-app>

</template>
<script setup>
import { reactive,ref,computed,onMounted,onBeforeUnmount } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { email, required } from "@vuelidate/validators";

const password = String;
const drawer = ref(true);
const isMobile = ref(false);
const initialState = {
      name: "",
  email: "",
  password: "", 
  location:""
};


const state = reactive({
  ...initialState,
});

const rules = {
  name: { required },
  email: { required, email },
  password: { required, password },

};

const v$ = useVuelidate(rules, state);
const drawerWidth = computed(() => (isMobile.value ? 280 : 120));

function clear() {
  v$.value.$reset();

  for (const [key, value] of Object.entries(initialState)) {
    state[key] = value;
  }
}

// Alle verwendeten Methoden
async function fetchData() {
  const apiUrl =
    "https://elegant-eggs-b247740f2b.strapiapp.com/api/Rechnungs-Radar-Users";
  const token =
    "54a258000325fcbff04e65b292fecd2ca70258552324762fd2520e1932269765803183eb47586c2203f12b3abd7c7dbbe3dffe729c8334508eeba14656a85aa5bb7441ec939788a76a8a7e6066b1973362e5cdb6770a50dbecf0d74a4bcebe7c650eb54f08b757e0770003032e5817aa26dc6664c373e2c2e8667888d2d3f2c1";
  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  console.log("Fetch response:", res);
  if (!res.ok) throw new Error("HTTP " + res.status + " " + res.statusText);
  return await res.json();
}
</script>

<style lang="scss" scoped>

/* proportions and colors */
$sidebar-bg: #a8e6b8;
$topbar-bg: #bcefc2;
$text-primary:	#28282B;
$border-dark: #28282B;

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

  :deep(*) {
    color: $text-primary !important;
  }
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
  color: #bcefc2;
}

.left-drawer {
  background-color: $sidebar-bg !important;
  border-right: 2px solid rgba(0,0,0,0.08);
  padding-top: 80px;
  box-sizing: border-box;
  overflow: visible;
  color: $text-primary;
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



$app-green: #A8D5BA;
$app-light-green: #BFE3C8;
$app-very-light: #E8F5EC;
$app-background: #F3F4F6;

.app-bar {
  background: $app-green;
  color: #1f2937;
}

.sidebar {
  background: $app-green;
  color: #1f2937;

  .v-list-item {
    border-radius: 10px;
    margin: 6px 10px;

    &:hover {
      background: $app-light-green;
      transition: 0.3s ease;
    }
  }
}

.content {
  background: $app-background;
  min-height: 100vh;
  padding: 150px 0;
}

.profile-container {
  max-width: 900px;
}

.profile-card {
  background: $app-light-green;
  padding: 40px;
  border-radius: 20px;
}

.profile-avatar {
  background: white;
  color: #1f2937;
  font-weight: bold;
}

.big-avatar {
  background: $app-green;
  color: white;
}

.save-btn {
  border-radius: 12px;
  padding: 12px 32px;
}

.v-text-field {
  .v-field {
    border-radius: 12px;
    background: white;
  }
}
</style>

