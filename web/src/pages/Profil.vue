<template class="bg-primary">
  <layout>
    <v-container class="profile-bg-2 fill-height d-flex align-center justify-center">
      <v-row class="justify-center align-center" style="min-height: 90vh;">
        <v-col cols="12" sm="10" md="8" lg="6" class="d-flex justify-center align-center">
          <v-card variant="flat" class="profile-card-large pa-10" color="white">
            <v-card-title class="text-center profile-title mb-6">Profil</v-card-title>
            <v-form>
              <v-card-item class="align-center justify-center">
                <v-text-field
                  class="profile-input-large mb-4"
                  v-model="state.name"
                  :counter="20"
                  :error-messages="v$.name.$errors.map((e) => e.$message)"
                  label="Name"
                  required
                  @blur="v$.name.$touch"
                  @input="v$.name.$touch"
                ></v-text-field>
              </v-card-item>
              <v-card-item class="align-center justify-center">
                <v-text-field
                  class="profile-input-large mb-4"
                  v-model="state.email"
                  :error-messages="v$.email.$errors.map((e) => e.$message)"
                  label="E-Mail"
                  required
                  @blur="v$.email.$touch"
                  @input="v$.email.$touch"
                ></v-text-field>
              </v-card-item>
              <v-card-item class="align-center justify-center">
                <v-text-field
                  class="profile-input-large mb-5"
                  v-model="state.password"
                  :error-messages="v$.password.$errors.map((e) => e.$message)"
                  label="Passwort"
                  type="password"
                  required
                  @blur="v$.password.$touch"
                  @input="v$.password.$touch"
                ></v-text-field>
              </v-card-item>
              <v-card-item class="align-center justify-center">
                <v-btn color="primary" class="profile-btn-large">Speichern</v-btn>
              </v-card-item>
            </v-form>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </layout>
</template>
<script setup>


import useVuelidate from '@vuelidate/core';
import { required, email } from '@vuelidate/validators';
import { reactive, onMounted } from 'vue';
import { loadUserData } from '@/utils/loadUser';

const password = String;

const initialState = {
  name: "",
  email: "",
  password: "",
};

const state = reactive({
  ...initialState,
});

// Prefill form with user data on mount
onMounted(async () => {
  try {
    const user = await loadUserData();
    if (user) {
      state.name = user.username || user.name || "";
      state.email = user.email || "";
      // Never prefill password for security reasons
    }
  } catch (e) {
    // Optionally handle error
    console.error("Failed to load user data", e);
  }
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
</script>

<style>
.profile-bg-2 {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #e0f7fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-card-large {
  max-width: 700px;
  width: 100%;
  min-height: 500px;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(80, 200, 180, 0.12);
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.profile-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: #1976d2;
  letter-spacing: 1px;
}
.profile-input-large {
  width: 350px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 1.15rem;
  padding: 10px 0;
  box-shadow: none !important;
}
.profile-btn-large {
  min-width: 180px;
  font-size: 1.15rem;
  font-weight: 600;
  border-radius: 8px;
  margin-top: 12px;
  padding: 12px 0;
}
.profile-bg-centered {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #e0f7fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-card-centered {
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(80, 200, 180, 0.10);
  background: #fff;
  padding: 24px 18px 18px 18px;
  margin: 0 auto;
}
.profile-title {
  font-size: 1.6rem;
  font-weight: 600;
  color: #1976d2;
  letter-spacing: 0.5px;
}
.profile-input {
  width: 220px;
  background: #f8fafc;
  border-radius: 6px;
}
.profile-btn-centered {
  min-width: 120px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 6px;
  margin-top: 6px;
}
.profile-card {
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(80, 200, 180, 0.10);
  background: #fff;
  padding: 24px 18px 18px 18px;
}
.profile-title {
  font-size: 1.6rem;
  font-weight: 600;
  color: #1976d2;
  letter-spacing: 0.5px;
}
.profile-input {
  width: 220px;
  background: #f8fafc;
  border-radius: 6px;
}
.profile-btn {
  min-width: 120px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 6px;
  margin-top: 6px;
}
</style>
