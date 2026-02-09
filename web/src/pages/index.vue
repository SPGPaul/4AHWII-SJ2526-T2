<template>
  <div class="page-bg">
    <form class="align-center jutifyy-center" @submit.prevent="handleSubmit">
      <v-container class="my-5">
        <v-row>
          <v-col>
            <v-card
              elevation="12"
              variant="outlined"
              class="align-center justify-center bg-white"
              color="#bcefc2"
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

                    <v-text-field
                      v-model="state.password"
                      
                      :rules="[rules.required, rules.min]"
                      :type="show1 ? 'text' : 'password'"
                      hint="At least 8 characters"
                      label="Passwort"
                      name="input-10-1"
                      :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                      :error-messages="v$.password.$errors.map((e) => e.$message)"
                      @click:append="show1 = !show1"  
                      @blur="v$.password.$touch"
                      @input="v$.password.$touch"
                    ></v-text-field>
              </v-card-item>
              <v-card-item class="align-center justify-center">
                <v-btn type="submit" class="justify-center" color="white"
                  >Submit </v-btn
                >
              </v-card-item>
              <v-card-item class="align-center justify-center">
                <v-btn class="justify-center" color="white" to="/Register" @click="Test()"
                  >Register</v-btn
                >
              </v-card-item>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </form>

    <!-- dekorative weiße Welle -->
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
import { useVuelidate } from "@vuelidate/core";
import { email, required } from "@vuelidate/validators";
import { login } from "@/utils/auth";
import { useRouter } from "vue-router";
import { ref } from 'vue'

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
  password: { required },
};

const v$ = useVuelidate(rules, state);

async function handleSubmit() {
  const isValid = await v$.value.$validate();
  if (!isValid) return;
  await loginUser();
}

function clear() {
  v$.value.$reset();

  for (const [key, value] of Object.entries(initialState)) {
    state[key] = value;
  }
}


async function loginUser() {
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


  const show1 = ref(false)
  const show2 = ref(true)
</script>

<style lang="scss">
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
