<template>
  <div class="page-bg">
    <div class="bg-orb bg-orb--one"></div>
    <div class="bg-orb bg-orb--two"></div>
    <form class="login-layout" @submit.prevent="handleSubmit">
      <section class="login-hero">
        <div class="brand-badge">Rechnungsradar</div>
        <h1>Belege, Ausgaben und Sparpotenzial in einem Blick.</h1>
        <p>
          Eine ruhige, schnelle Oberfläche für Scan, Analyse und AI-basierte Spartipps.
        </p>

        <div class="hero-metrics">
          <div>
            <strong>Scannen</strong>
            <span>Belege in Sekunden erfassen</span>
          </div>
          <div>
            <strong>Analysieren</strong>
            <span>Ausgaben nach Kategorie verstehen</span>
          </div>
          <div>
            <strong>Sparen</strong>
            <span>Konkrete Tipps statt Bauchgefühl</span>
          </div>
        </div>
      </section>

      <v-card class="login-card">
        <div class="login-card__header">
          <v-avatar size="52" color="green-darken-2" class="login-card__avatar">
            <v-img src="@/assets/RechnungsradarLogo.png" contain />
          </v-avatar>
          <div>
            <p class="login-card__eyebrow">Willkommen zurück</p>
            <h2>Anmelden</h2>
          </div>
        </div>

        <v-text-field
          class="login-field"
          variant="outlined"
          v-model="state.email"
          :error-messages="v$.email.$errors.map((e) => e.$message)"
          label="E-Mail"
          required
          @blur="v$.email.$touch"
          @input="v$.email.$touch"
          pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
        />

        <v-text-field
          label="Password"
          v-model="state.password"
          :error-messages="v$.password.$errors.map((e) => e.$message)"
          :type="show1 ? 'text' : 'password'"
          variant="outlined"
          class="login-field"
          required
          @blur="v$.password.$touch"
          @input="v$.password.$touch"
          :append-inner-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="show1 = !show1"
        />

        <v-btn type="submit" class="login-btn" size="large" block>
          Login
        </v-btn>

        <v-btn class="login-link" to="Register" variant="text" block>
          Noch kein Konto? Registrieren
        </v-btn>
      </v-card>
    </form>
  </div>
</template>
<script setup>
import { reactive } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { email, required } from "@vuelidate/validators";
import { login } from "@/utils/auth";
import { useRouter } from "vue-router";
import { ref } from "vue";

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
      await router.push("/dashboard");
    } else {
      console.warn("Login succeeded but no jwt:", data);
    }
  } catch (err) {
    console.error("Login failed:", err.message);
  }
}

const show1 = ref(false);
const show2 = ref(true);
</script>

<style lang="scss">
.page-bg {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.page-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.12), transparent 22%),
    radial-gradient(circle at 80% 15%, rgba(73, 127, 92, 0.18), transparent 25%),
    linear-gradient(145deg, rgba(18, 30, 23, 0.12), rgba(18, 30, 23, 0));
  pointer-events: none;
}

.bg-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(18px);
  pointer-events: none;
}

.bg-orb--one {
  width: 36vw;
  height: 36vw;
  left: -8vw;
  top: -8vw;
  background: rgba(141, 214, 162, 0.35);
}

.bg-orb--two {
  width: 32vw;
  height: 32vw;
  right: -6vw;
  bottom: -10vw;
  background: rgba(82, 140, 255, 0.18);
}

.login-layout {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 460px);
  gap: 28px;
  align-items: center;
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 40px 0;
}

.login-hero {
  padding: 24px 12px;
  color: var(--app-text);
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.74rem;
  margin-bottom: 22px;
}

.login-hero h1 {
  font-size: clamp(2.8rem, 5vw, 5rem);
  line-height: 0.96;
  margin: 0 0 18px;
  max-width: 9ch;
}

.login-hero p {
  margin: 0;
  max-width: 42rem;
  font-size: 1.1rem;
  color: var(--app-muted);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 28px;
}

.hero-metrics > div {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid rgba(255, 255, 255, 0.48);
  backdrop-filter: blur(12px);
}

.hero-metrics strong {
  display: block;
  font-size: 1rem;
  margin-bottom: 6px;
}

.hero-metrics span {
  color: var(--app-muted);
  font-size: 0.95rem;
}

.login-card {
  padding: 28px;
  border-radius: 28px !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(245, 252, 247, 0.88));
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 24px 70px rgba(14, 30, 21, 0.16);
}

.login-card__header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}

.login-card__eyebrow {
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #5b8f67;
  font-size: 0.72rem;
  font-weight: 700;
}

.login-card h2 {
  margin: 0;
  font-size: 1.65rem;
}

.login-field {
  margin-bottom: 12px;
}

.login-btn {
  margin-top: 10px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2f7b45, #56a36b);
  color: #fff;
  box-shadow: 0 16px 30px rgba(47, 123, 69, 0.22);
  text-transform: none;
  font-weight: 700;
  min-height: 52px;
}

.login-link {
  margin-top: 8px;
  color: var(--app-muted);
  text-transform: none;
}

@media (max-width: 960px) {
  .login-layout {
    grid-template-columns: 1fr;
    width: min(720px, calc(100% - 28px));
    padding: 24px 0;
  }

  .login-hero {
    order: 2;
    padding: 12px 4px 0;
  }

  .hero-metrics {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .login-layout {
    width: calc(100% - 20px);
  }

  .login-card {
    padding: 20px;
  }

  .login-hero h1 {
    font-size: 2.3rem;
  }
}
</style>
