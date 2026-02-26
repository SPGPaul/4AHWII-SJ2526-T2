<template>
  <div class="page-bg">
    <div class="bg-layer"></div>
    <form class="align-center jutifyy-center" @submit.prevent="handleSubmit">
      <v-container class="my-5">
        <v-row>
          <v-col>
            <v-card elevation="12" width="350" class="align-center justify-center bg-white" color="#bcefc2"
              min-height="250" rounded>
              <v-card-title class="d-flex align-center justify-center">
                <span class="pr-20">Rechnungsradar</span>

                <v-img src="@/assets/RechnungsradarLogo.png" max-width="50" contain class="ml-3"></v-img>

              </v-card-title>
              <v-divider class="my-1 "></v-divider>


              <v-card-item class="align-center justify-center">
                <v-text-field class="text-black mb-1 my-2" variant="outlined" v-model="state.email"
                  :error-messages="v$.email.$errors.map((e) => e.$message)" label="E-Mail" required
                  @blur="v$.email.$touch" @input="v$.email.$touch" pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                  width="250"></v-text-field>
              </v-card-item>
              <v-card-item class="align-center justify-center my-0">
                <v-text-field label="Password" v-model="state.password"
                  :error-messages="v$.password.$errors.map((e) => e.$message)" :type="show1 ? 'text' : 'password'"
                  variant="outlined" class="mb-1 text-black my-2" required @blur="v$.password.$touch"
                  @input="v$.password.$touch" width="250" :append-inner-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="show1 = !show1" />

              </v-card-item>
              <v-card-item class="align-center justify-center" rounded flat>
                <v-btn type="submit" class="justify-center login mb-1" rounded block outlined width="250"
                  color="#f2fbf6">Login </v-btn>
              </v-card-item>
              <v-card-item class="align-center justify-center " rounded flat>

                <v-btn class="justify-center mb-1" color="white" to="Register" flat @click="Test()"> Don't have an
                  Account? Register</v-btn>
              </v-card-item>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </form>

    <!-- dekorative weiße Welle -->
    <div class="wave" aria-hidden>
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,0 C300,100 900,100 1200,0 L1200,120 L0,120 Z" fill="#ffffff" opacity="0.9"></path>
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
  email: "",
  password: "",
};
const state = reactive({
  ...initialState,
});
const rules = {
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

  background: linear-gradient(135deg,
      hsl(145, 60%, 94%) 0%,
      hsl(150, 55%, 80%) 40%,
      hsl(160, 55%, 70%) 70%,
      hsl(170, 60%, 60%) 100%);

  background-size: 200% 200%;
  animation: gradientBreathing 25s ease-in-out infinite alternate;
}

/* ===== Premium Glow Layers ===== */

.page-bg::before,
.page-bg::after,
.page-bg .bg-layer {
  content: "";
  position: absolute;
  width: 850px;
  height: 850px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.85;
  z-index: 0;

  animation: hueShift 25s ease-in-out infinite alternate;
}

/* obere linke Fläche */
.page-bg::before {
  background: hsl(155, 70%, 60%);
  top: -250px;
  left: -250px;
}

/* untere rechte Fläche */
.page-bg::after {
  background: hsl(170, 70%, 50%);
  bottom: -250px;
  right: -250px;
  animation-delay: 10s;
}

/* mittlere Fläche */
.page-bg .bg-layer {
  width: 950px;
  height: 950px;
  background: hsl(160, 58%, 50%);
  top: 15%;
  left: 35%;
  animation-delay: 18s;
}

/* ===== Haupt Gradient Bewegung ===== */

@keyframes gradientBreathing {
  0% {
    background-position: 0% 50%;
  }

  100% {
    background-position: 100% 50%;
  }
}

/* ===== Sanfte HSL Rotation ===== */

@keyframes hueShift {
  0% {
    filter: blur(80px) hue-rotate(0deg);
  }

  50% {
    filter: blur(60px) hue-rotate(15deg);
  }

  100% {
    filter: blur(40px) hue-rotate(-10deg);
  }
}

.v-field__append-inner {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.v-field__append-inner:hover {
  transform: scale(1.1);
}




.v-text-field {
  width: 100%;
}

.v-text-field .v-field {
  border-radius: 14px;
  background: #f2fbf6;
  min-height: 60px;
  transition: all 0.25s ease;
}

.v-text-field .v-field:focus-within {
  background: #e8f8ef;
  box-shadow: 0 0 0 3px rgba(168, 213, 186, 0.25);
}

.login-btn {
  height: 56px;
  border-radius: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  ;

  background: linear-gradient(135deg,
      #a8e6b8,
      #7fd8a3);

  color: #f2fbf6;
  box-shadow: 0 8px 20px rgba(127, 216, 163, 0.35);

  transition: all 0.25s ease;
}

.login-btn:hover {
  border-radius: 12px;
  transform: translateY(-2px);

}

.v-btn:hover {
  transform: translateY(-1px);
}
</style>
