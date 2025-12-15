<template>
<div class="page-bg">
<form class="align-center jutifyy-center " @submit.prevent="handleSubmit">
  <v-container class="my-5">
    <v-row>
      <v-col>
        <v-card elevation="12" variant="outlined" class="align center justify-center bg-white" color="black" min-height="250">
            <v-card-item class="align-center justify-center">
              <v-text-field
                class="text-black"
                v-model="state.name"
                :counter="10"
                :error-messages="v$.name.$errors.map(e => e.$message)"
                label="Name"
                required
                @blur="v$.name.$touch"
                @input="v$.name.$touch"
              ></v-text-field>
            </v-card-item>
            <v-card-item class="align-center justify-center">
              <v-text-field
                class="text-black"
                v-model="state.email"
                :error-messages="v$.email.$errors.map(e => e.$message)"
                label="E-mail"
                required
                @blur="v$.email.$touch"
                @input="v$.email.$touch"
              ></v-text-field>
            </v-card-item>
            <v-card-item class="align-center justify-center">
              <v-text-field
                class="text-black"
                v-model="state.password"
                :error-messages="v$.password.$errors.map(e => e.$message)"
                label="Password"
                required
                @blur="v$.password.$touch"
                @input="v$.password.$touch"
              ></v-text-field>
            </v-card-item>
            <v-card-actions class=" algin-center justify-center">
              <v-btn type="submit" class="justify-center" color="Black" @click="postData()">
                Submit
              </v-btn>
            </v-card-actions>
          
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  </form>
   <div class="wave" aria-hidden>
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,0 C300,100 900,100 1200,0 L1200,120 L0,120 Z" fill="#ffffff" opacity="0.9"></path>
      </svg>
    </div>
  </div>
</template>
<script setup>
  import { reactive } from 'vue'
  import { useVuelidate } from '@vuelidate/core'
  import { email, required } from '@vuelidate/validators'
import { routeLocationKey, RouterLink, useLink } from 'vue-router';
  
  const password = String;

  const initialState = {
    name: '',
    email: '',
    password:'',
  }

  const state = reactive({
    ...initialState,
  })


  const rules = {
    name: { required },
    email: { required, email },
    password: { required, password },
  }

  const v$ = useVuelidate(rules, state)

  async function handleSubmit () {
    const isValid = await v$.$validate()
    if (!isValid) return
    await postData()
  }

  function clear () {
    v$.value.$reset()

    for (const [key, value] of Object.entries(initialState)) {
      state[key] = value
    }
  }


  async function postData() {
        const apiUrl =
          "https://elegant-eggs-b247740f2b.strapiapp.com/api/Rechnungs-Radar-Users";
        const token =
          "54a258000325fcbff04e65b292fecd2ca70258552324762fd2520e1932269765803183eb47586c2203f12b3abd7c7dbbe3dffe729c8334508eeba14656a85aa5bb7441ec939788a76a8a7e6066b1973362e5cdb6770a50dbecf0d74a4bcebe7c650eb54f08b757e0770003032e5817aa26dc6664c373e2c2e8667888d2d3f2c1";
        const payload = {
          data: {
            name: state.name,
            email: state.email,
            password: state.password,
          },
        }
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        console.log("Fetch response:", res);
        if (!res.ok)
          throw new Error("HTTP " + res.status + " " + res.statusText);
        return await res.json();
        
      
      }
</script>

<style>
.page-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  /* sanfter Gradient von Weiß zu Blau */
  background: linear-gradient(180deg, #ffffff 0%, #e6fff0 30%, #b3ffd9 60%, #bcefc2 100%);
}

/* weiße Wellenform unten */
.wave {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 120px;
  pointer-events: none;
}
.wave svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Card/Inputs responsive und zentriert */
.v-card {
  max-width: 420px;
  width: 330px;
  margin: 0;
  box-shadow: 0 10px 30px rgba(188, 239, 194, 0.12);
  background-color: #ffffff;
}
.v-text-field {
  width: 280px;
  background-color: #ffffff;
}
</style>