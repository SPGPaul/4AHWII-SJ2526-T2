<script setup>
import { computed, onMounted, ref } from "vue";
import Layout from "@/components/Layout.vue";
import { loadUserData } from "@/utils/loadUser";
import { getSavingsRecommendations } from "@/utils/savings-ai";

const loading = ref(false);
const monthlyBudget = ref(1200);
const receipts = ref([]);
const snapshot = ref(null);
const result = ref(null);
const error = ref("");

const receiptsCount = computed(() => receipts.value.length);

function toNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(",", ".").replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalizeReceipt(entry) {
  const amount =
    toNumber(entry?.amount) ??
    toNumber(entry?.summe) ??
    toNumber(entry?.total) ??
    toNumber(entry?.totals?.summe);

  return {
    id: entry?.id,
    amount,
    categoryLabel: entry?.categoryLabel || entry?.category_name || null,
    date: entry?.date || entry?.createdAt || null,
    title: entry?.title || entry?.transaktion || null,
  };
}

async function loadReceipts() {
  const user = await loadUserData();
  receipts.value = (user?.receipts || []).map(normalizeReceipt);
}

async function generateRecommendations() {
  loading.value = true;
  error.value = "";

  try {
    const payload = {
      monthlyBudget: Number(monthlyBudget.value) || null,
      currency: "EUR",
      receipts: receipts.value,
    };
    const response = await getSavingsRecommendations(payload);
    snapshot.value = response?.snapshot || null;
    result.value = response?.data || null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "AI Empfehlungen fehlgeschlagen.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadReceipts();
});
</script>

<template>
  <Layout>
    <br>
    <br>
    <br>
    <br>
    <v-container class="savings-page" fluid>
      <div class="savings-content">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">AI Finanzcoach</p>
            <h1>Spar-Empfehlungen</h1>
            <p>
              Lass deine Belege analysieren und erhalte konkrete Sparvorschlaege pro Monat.
            </p>
          </div>
          <div class="hero-stat">
            <span>Belege geladen</span>
            <strong>{{ receiptsCount }}</strong>
          </div>
        </section>

        <section class="control-card">
          <v-row align="end">
            <v-col cols="12" md="5">
              <v-text-field
                v-model.number="monthlyBudget"
                label="Monatsbudget (EUR)"
                type="number"
                min="0"
                step="10"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-btn
                color="primary"
                size="large"
                block
                :loading="loading"
                :disabled="loading || receiptsCount === 0"
                @click="generateRecommendations"
              >
                Empfehlungen generieren
              </v-btn>
            </v-col>
            <v-col cols="12" md="3">
              <div class="mini-note">Analyse auf Basis deiner importierten Backend-Belege.</div>
            </v-col>
          </v-row>

          <v-alert v-if="error" class="mt-3" type="error" variant="tonal" :text="error" />
        </section>

        <v-row v-if="snapshot" class="metric-grid">
          <v-col cols="12" md="4">
            <v-card class="stat-card pa-4" elevation="0">
              <p class="text-caption mb-1">Ausgaben gesamt</p>
              <p class="text-h5 font-weight-bold mb-0">{{ snapshot.total_spend }} EUR</p>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="stat-card pa-4" elevation="0">
              <p class="text-caption mb-1">Belege mit Betrag</p>
              <p class="text-h5 font-weight-bold mb-0">{{ snapshot.receipts_with_amount }}</p>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="stat-card pa-4" elevation="0">
              <p class="text-caption mb-1">Top Kategorie</p>
              <p class="text-h5 font-weight-bold mb-0">
                {{ snapshot.top_categories?.[0]?.category || "-" }}
              </p>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-if="result" class="result-grid">
          <v-col cols="12">
            <v-card class="result-summary pa-6" elevation="0">
              <p class="eyebrow">Zusammenfassung</p>
              <p class="mb-0">{{ result.summary || "Keine Zusammenfassung erhalten." }}</p>
            </v-card>
          </v-col>

          <v-col
            v-for="(item, index) in result.recommendations || []"
            :key="`${index}-${item.title || 'tip'}`"
            cols="12"
            md="6"
          >
            <v-card class="recommendation pa-5" elevation="0">
              <div class="d-flex justify-space-between align-start ga-3 mb-2">
                <h3 class="text-subtitle-1 font-weight-bold mb-0">{{ item.title || "Empfehlung" }}</h3>
                <v-chip size="small" color="secondary" variant="flat">
                  {{ item.difficulty || "medium" }}
                </v-chip>
              </div>
              <p class="text-body-2 mb-3">{{ item.reason || "Keine Begruendung." }}</p>
              <v-chip color="success" variant="tonal">
                Potenzial: {{ item.estimated_saving_per_month ?? 0 }} EUR / Monat
              </v-chip>
            </v-card>
          </v-col>

          <v-col v-if="(result.risk_notes || []).length > 0" cols="12">
            <v-card class="result-notes pa-5" elevation="0">
              <h2 class="text-h6 mb-2">Hinweise</h2>
              <v-list lines="one" density="compact">
                <v-list-item
                  v-for="(note, idx) in result.risk_notes"
                  :key="`note-${idx}`"
                  prepend-icon="mdi-information-outline"
                  :title="note"
                />
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-container>
  </Layout>
</template>

<style scoped>
/* Full-width container so the gradient fills the entire background */
.savings-page {
  min-height: 100%;
  background:
    radial-gradient(circle at 10% 10%, rgba(90, 180, 120, 0.16), transparent 35%),
    radial-gradient(circle at 90% 20%, rgba(70, 140, 255, 0.12), transparent 38%);
}

/* Inner wrapper: constrain content width and centre it so it stays clear of the sidebar */
.savings-content {
  max-width: 1180px;
  margin: 0 auto;
  padding: 12px 8px 32px;
  box-sizing: border-box;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-end;
  padding: 28px;
  border-radius: 30px;
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.86), rgba(238, 248, 241, 0.96));
  border: 1px solid rgba(40, 40, 43, 0.08);
}

.eyebrow {
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1d6f3b;
}

.hero-copy h1 {
  margin: 8px 0 10px;
  font-size: clamp(2rem, 3.8vw, 3.4rem);
}

.hero-copy p {
  margin: 0;
  max-width: 62ch;
  color: var(--app-muted);
}

.hero-stat {
  min-width: 160px;
  padding: 20px 22px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(40, 40, 43, 0.08);
  text-align: right;
}

.hero-stat span {
  display: block;
  color: var(--app-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
}

.hero-stat strong {
  display: block;
  font-size: 2.5rem;
  line-height: 1;
  margin-top: 8px;
}

.control-card,
.result-summary,
.result-notes,
.recommendation,
.stat-card {
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(40, 40, 43, 0.08);
  box-shadow: 0 16px 36px rgba(24, 47, 32, 0.08);
}

.control-card,
.result-grid,
.metric-grid {
  margin-top: 16px;
}

.mini-note {
  color: var(--app-muted);
  line-height: 1.5;
  padding-top: 10px;
}

.metric-grid {
  margin-top: 2px;
}

.recommendation {
  border-top: 4px solid #3b82f6;
}

.result-summary {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(236, 248, 240, 0.98));
}

.result-notes {
  background: rgba(255, 255, 255, 0.72);
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-stat {
    text-align: left;
    width: 100%;
  }
}

@media (max-width: 600px) {
  .hero,
  .control-card,
  .result-summary,
  .result-notes,
  .recommendation,
  .stat-card {
    border-radius: 22px;
  }

  .savings-content {
    padding: 6px 0 28px;
  }
}
</style>