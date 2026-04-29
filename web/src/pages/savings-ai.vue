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
    <v-container class="py-8 savings-page" fluid>
      <v-row>
        <v-col cols="12">
          <v-card class="hero pa-6" elevation="8">
            <div class="d-flex flex-wrap align-center justify-space-between ga-4">
              <div>
                <p class="eyebrow mb-2">AI Finanzcoach</p>
                <h1 class="text-h4 font-weight-bold mb-2">Spar-Empfehlungen</h1>
                <p class="text-body-1 text-medium-emphasis mb-0">
                  Lass deine Belege analysieren und erhalte konkrete Sparvorschlaege pro Monat.
                </p>
              </div>
              <v-chip color="primary" variant="elevated" size="large">
                {{ receiptsCount }} Belege geladen
              </v-chip>
            </div>

            <v-row class="mt-4" align="end">
              <v-col cols="12" md="4">
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
            </v-row>

            <v-alert
              v-if="error"
              class="mt-3"
              type="error"
              variant="tonal"
              :text="error"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="snapshot" class="mt-3">
        <v-col cols="12" md="4">
          <v-card class="stat-card pa-4" elevation="2">
            <p class="text-caption mb-1">Ausgaben gesamt</p>
            <p class="text-h5 font-weight-bold mb-0">{{ snapshot.total_spend }} EUR</p>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="stat-card pa-4" elevation="2">
            <p class="text-caption mb-1">Belege mit Betrag</p>
            <p class="text-h5 font-weight-bold mb-0">{{ snapshot.receipts_with_amount }}</p>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="stat-card pa-4" elevation="2">
            <p class="text-caption mb-1">Top Kategorie</p>
            <p class="text-h5 font-weight-bold mb-0">
              {{ snapshot.top_categories?.[0]?.category || "-" }}
            </p>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="result" class="mt-1">
        <v-col cols="12">
          <v-card class="pa-5" elevation="4">
            <h2 class="text-h6 mb-2">Zusammenfassung</h2>
            <p class="mb-0">{{ result.summary || "Keine Zusammenfassung erhalten." }}</p>
          </v-card>
        </v-col>

        <v-col
          v-for="(item, index) in result.recommendations || []"
          :key="`${index}-${item.title || 'tip'}`"
          cols="12"
          md="6"
        >
          <v-card class="recommendation pa-5" elevation="3">
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
          <v-card class="pa-5" elevation="2">
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
    </v-container>
  </Layout>
</template>

<style scoped>
.savings-page {
  padding-top: 150px;
  background:
    radial-gradient(circle at 10% 10%, rgba(90, 180, 120, 0.12), transparent 35%),
    radial-gradient(circle at 90% 20%, rgba(70, 140, 255, 0.08), transparent 40%);
}

.hero {
  border: 1px solid rgba(40, 40, 43, 0.08);
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.96), rgba(236, 248, 240, 0.95));
}

.eyebrow {
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1d6f3b;
}

.stat-card {
  border-left: 4px solid #3d915e;
}

.recommendation {
  border-top: 4px solid #3b82f6;
}

@media (max-width: 700px) {
  .savings-page {
    padding-top: 120px;
  }
}
</style>