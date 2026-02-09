<template>
  <div class="page-bg">
    <form class="align-center jutifyy-center" @submit.prevent="handleSubmit">
       <v-btn variant="circle"  color="secondary" class="backbtn">
              <h2>
            <v-icon>mdi-keyboard-backspace</v-icon>
</h2>
          </v-btn>  
      <v-container class="my-5">
        
          
       
        <v-row>
          <v-col class="align-top-right justify-right ">
            
            <v-card 
              elevation="12"
              variant="outlined"
              class="align center justify-center bg-white"
              color="black"
              min-height="250"
            > 
              <v-card-item class="align-center justify-center">
                <v-text-field
                  class="text-black"
                  v-model="state.name"
                  :counter="10"
                  :error-messages="v$.name.$errors.map((e) => e.$message)"
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
                  :error-messages="v$.email.$errors.map((e) => e.$message)"
                  label="E-mail"
                  required
                  @blur="v$.email.$touch"
                  @input="v$.email.$touch"
                  pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                ></v-text-field>
              </v-card-item>
              <v-card-item class="align-center justify-center">
                  class="text-black"
                  v-model="state.password"
                  :error-messages="v$.password.$errors.map((e) => e.$message)"
                  label="Password"
                  required
                  @blur="v$.password.$touch"
                  @input="v$.password.$touch"
                ></v-text-field>
                <v-text-field
                  class="text-black"
                  v-model="state.password"
                  :error-messages="v$.password.$errors.map((e) => e.$message)"
                  label="Password"
                  type="password"
                  required
                  @blur="v$.password.$touch"
                  @input="v$.password.$touch"
                ></v-text-field>
              </v-card-item>
              <v-card-actions class="algin-center justify-center">
                <v-btn type="submit" class="justify-center" color="Black">
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
        <path
          d="M0,0 C300,100 900,100 1200,0 L1200,120 L0,120 Z"
          fill="#ffffff"
          opacity="0.9"
        ></path>
      </svg>
    </div>
  </div>
</template>
<script setup>
import { reactive } from "vue";
import useVuelidate from "@vuelidate/core";
import { email, required, minLength } from "@vuelidate/validators";
import { login } from "@/utils/auth";
import { useRouter } from "vue-router";
//import { V } from "dist/assets/VContainer-RfKRV4UQ";

const router = useRouter();

const initialState = {
  name: "",
  email: "",
  password: "",
};

const state = reactive({
  ...initialState,
});

const rules = {
  name: { required },
  email: { required, email },
  password: { required, minLength: minLength(6) }, // z.B. mind. 6 Zeichen
};

const v$ = useVuelidate(rules, state);

async function handleSubmit() {
  const isValid = await v$.value.$validate();
  if (!isValid) return;
  await register();
}

function clear() {
  v$.value.$reset();

  for (const [key, value] of Object.entries(initialState)) {
    state[key] = value;
  }
}

async function register() {
  const res = await fetch(
    "https://elegant-eggs-b247740f2b.strapiapp.com/api/auth/local/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: state.name,
        email: state.email,
        password: state.password,
      }),
    }
  );
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message || res.statusText);
  try {
    const data = await login({
      identifier: state.email,
      password: state.password,
    });
    if (data?.jwt) {
      localStorage.setItem("token", data.jwt);
      await router.push("/dashboard");
    } else {
      console.warn("Login succeeded but no jwt:", data);
    }
  } catch (err) {
    console.error("Login failed:", err.message);
  }
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
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #e6fff0 30%,
    #b3ffd9 60%,
    #bcefc2 100%
  );
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
