<template>
  <div class="profile-page">
    <v-container>
        
      <!-- HEADER -->
      <v-card class="profile-header" elevation="4">
        
        <div class="header-left">
 <v-btn icon variant="text" class="back-btn bg-white text-black" to="dashboard">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
          <v-avatar size="60" class="avatar">
            <span>{{ userInitials }}</span>
          </v-avatar>
            
          <div class="text-black">
            <h2>Mein Account</h2>
            <p>{{ userEmail }}</p>
            <small>{{ userName }}</small>
          </div>
        </div>

        <div class="header-right">
          <v-btn variant="text">Zurück zum Dashboard</v-btn>
          <v-btn class="text-black bg-white  user-info" rounded to="/">Logout
              <v-icon end>mdi-logout</v-icon></v-btn>
        </div>
      </v-card>

      <!-- CONTENT -->
      <v-row class="mt-6">
        <!-- Persönliche Daten -->
        <v-col cols="12" md="7">
          <v-card class="content-card" elevation="2">
            <h3>Persönliche Daten</h3>

            <v-row>
              <v-col cols="6">
                <v-text-field label="Vorname" block rounded  variant="outlined" class="text-black" />
              </v-col>
              <v-col cols="6">
                <v-text-field label="Nachname" block rounded variant="outlined" class="text-black" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="state.name" label="Benutzername" block rounded variant="outlined" class="text-black" clearable model-value=' '> {{ userName }}</v-text-field>
              </v-col>
              <v-col cols="6">
                
                <v-text-field label="E-Mail" v-model="state.email" block rounded variant="outlined" class="text-black" model-value=' '>   {{ userEmail }}</v-text-field>
              </v-col>
               <v-col cols="6">
                <v-text-field label="Password" v-model="state.password"
                  :error-messages="v$.password.$errors.map((e) => e.$message)" :type="show1 ? 'text' : 'password'"
                  variant="outlined" class="text-black" required @blur="v$.password.$touch"
                  @input="v$.password.$touch" :append-inner-icon="show1 ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="show1 = !show1" rounded block />
              </v-col>
               <v-col cols="6">
                <v-text-field label="Standort" block rounded variant="outlined" class="text-black" />
              </v-col>
            </v-row>

            <div class="actions">
              <v-btn color="primary" rounded dense @click="loadUser()" >Profil speichern</v-btn>
              <v-btn variant="outlined" class="bg-black" rounded dense  >Änderungen verwerfen</v-btn>
            </div>
          </v-card>
        </v-col>

        <!-- Account Aktionen -->
        <v-col cols="12" md="5">
          <v-card class="content-card danger-card" elevation="2">
            <h3>Account-Aktionen</h3>
            <p>Diese Aktionen betreffen deinen Zugang.</p>

            <div class="mt-6">
              <v-btn color="white bg-red" variant="outlined" block>
                Account löschen
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>

    </v-container>
  </div>
</template>

<script setup>
import { reactive,ref,computed,onMounted,onBeforeUnmount, onBeforeMount } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { email, required } from "@vuelidate/validators";
import { loadUserData } from "@/utils/loadUser";

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

const userName = ref("user");
const userInitials = ref("u");
const userEmail = ref("user@mail.com");
//const userPassword = ref("")

async function loadUser() {
    const user = await loadUserData();
    userName.value = user?.username || "user";
    userInitials.value = userName.value[0];
    userEmail.value = user?.email || "user@mail.com";
    
};
onBeforeMount(() => { 
  loadUser(userName); 
  loadUserData();
});
onMounted(() => {
  updateIsMobile();
  window.addEventListener("resize", updateIsMobile);


});
const updateIsMobile = () => {
  isMobile.value = window.matchMedia("(max-width: 700px)").matches;
  if (isMobile.value) drawer.value = false;
};
onBeforeUnmount(() => {
  window.removeEventListener("resize", updateIsMobile);
});

const show1 = ref(false)
const show2 = ref(true)


</script>

<style lang="scss" scoped>

/* proportions and colors */
$sidebar-bg: #a8e6b8;
$topbar-bg: #bcefc2;
$text-primary:	#28282B;
$border-dark: #28282B;
$farbe: #f6fbf9;

$topbar-height: 120px;
$profile-size: 48px;
$app-title-size: 38px;

.profile-page {
  min-height: 100vh;
  padding: 60px 0;

  background: linear-gradient(
    135deg,
    #f6fbf9 0%,
    #e8f6f1 50%,
    #d8eee6 100%
  );
}

/* HEADER */

.profile-header {
  padding: 25px 35px;
  border-radius: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;

    h2 {
      margin: 0;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: #666;
    }

    small {
      color: #999;
    }
  }

  .header-right {
    display: flex;
    gap: 15px;
  }
}

.avatar {
  background: linear-gradient(135deg, #4fc3a1, #2bbbad);
  color: white;
  font-weight: bold;
  font-size: 18px;
}

/* CONTENT CARDS */

.content-card {
  padding: 30px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.04);

  h3 {
    margin-bottom: 20px;
    font-weight: 600;
  }

  .actions {
    margin-top: 25px;
    display: flex;
    gap: 15px;
  }
}

/* Danger Card */

.danger-card {
  border: 1px solid #ffe5e5;
  background: #fffdfd;

  h3 {
    color: #c62828;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 25px;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.back-btn {
  margin-bottom: 8px;
  color: #333;
}

.avatar {
  background: linear-gradient(135deg, #4fc3a1, #2bbbad);
  color: white;
  font-weight: 600;
  font-size: 20px;
}

.user-info {
  h3 {
    margin: 0;
    font-weight: 500;
  }

  small {
    color: #777;
  }
}
</style>  