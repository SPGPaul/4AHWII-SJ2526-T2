<script setup lang="ts">
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
} from "echarts/components";
import { UniversalTransition } from "echarts/features";
import * as echarts from "echarts/core";
import { onMounted, ref, onBeforeUnmount, watch } from "vue";
import { useTheme } from "vuetify";
import { loadUserData } from "@/utils/loadUser";
import { apiDownloadImage } from "@/utils/api";

async function parseChartData(): Promise<any[]> {
  const data = (await loadUserData()) as { receipts?: any[] };
  let items = Array.isArray(data?.receipts) ? [...data.receipts] : [];
  // Filter to unique receipts by documentId
  const seen = new Set();
  items = items.filter((item: any) => {
    if (!item.documentId) return true;
    if (seen.has(item.documentId)) return false;
    seen.add(item.documentId);
    return true;
  });
  console.log("Parsed unique items:", items);
  return items;
}

function toUnixSeconds(dateStr: string | number | Date) {
  const d =
    typeof dateStr === "number" || dateStr instanceof Date
      ? new Date(dateStr)
      : new Date(String(dateStr));
  const t = Math.floor(d.getTime() / 1000);
  return Number.isFinite(t) ? t : NaN;
}

function getUnixTime() {
  return Math.floor(Date.now() / 1000);
}

function getLastMonthUnix() {
  return getUnixTime() - 30 * 24 * 60 * 60;
}

function getPrevLastMonthUnix() {
  return getUnixTime() - 61 * 24 * 60 * 60;
}

async function getExpnesesLastMonth() {
  const data = await parseChartData();
  const lastMonthList: any[] = [];
  const prevLastMonthList: any[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const itemUnix = item.unix_time ?? toUnixSeconds(item.date);

    if (Number.isNaN(itemUnix)) {
      console.warn("Skipping item with invalid date/unix_time:", item);
      continue;
    }

    if (itemUnix >= getLastMonthUnix()) {
      lastMonthList.push(item);
    } else if (
      itemUnix >= getPrevLastMonthUnix() &&
      itemUnix < getLastMonthUnix()
    ) {
      prevLastMonthList.push(item);
    }
  }

  return { lastMonthList, prevLastMonthList };
}

async function calculateChangeRate() {
  const expensesLastMonth = await getExpnesesLastMonth();
  const expensesPrevLastMonth = expensesLastMonth.prevLastMonthList;

  const lastCount = expensesLastMonth.lastMonthList.length;
  const prevCount = expensesPrevLastMonth.length || 1;

  const rawPercent = ((lastCount - prevCount) / prevCount) * 100;
  const percentailChange = Math.round(rawPercent * 100) / 100;
  return percentailChange;
}

async function getAllExpensesMonth(): Promise<number> {
  try {
    const expenses = await parseChartData();
    let expensesThisMonth = 0;
    for (const item of expenses) {
      const itemUnix = item.unix_time ?? toUnixSeconds(item.date);
      if (Number.isNaN(itemUnix)) continue;
      if (itemUnix >= getLastMonthUnix()) {
        const raw = item.amount ?? item.total ?? 0;
        const amount =
          typeof raw === "number"
            ? raw
            : Number(String(raw).replace(",", ".")) || 0;
        expensesThisMonth += amount;
      }
    }
    // round to 2 decimals
    console.log("Expenses this month:", expensesThisMonth);
    return Math.round(expensesThisMonth * 100) / 100;
  } catch (e) {
    console.error(e);
    return 0;
  }
}

const expensesThisMonth = ref<number>(0);
const changeRate = ref<string>("...");
const changeColor = ref<string>("black");
const receiptCount = ref<number>(0);
const barChartDiv = ref(null);
const theme = useTheme();
const chartDataRef = ref<any[]>([]);
const chartReady = ref(false);
const currentMonth = new Date().toLocaleString("de-DE", {
  month: "long",
  year: "numeric",
});

function isDarkMode() {
  return theme.global.current.value.dark;
}

function chartTextColor() {
  return isDarkMode() ? "#ffffff" : "#222222";
}

function chartTooltipBackground() {
  return isDarkMode() ? "rgba(22, 30, 22, 0.96)" : "#ffffff";
}

function chartTooltipBorder() {
  return isDarkMode() ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.08)";
}

function buildChartOption(chartData: any[]) {
  return {
    color: palette,
    grid: {
      left: "2%",
      right: "2%",
      top: 30,
      bottom: 30,
    },
    xAxis: {
      type: "value",
      axisLabel: {
        formatter: (val: number) => formatEuro(val),
        color: chartTextColor(),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "category",
      data: chartData.map((d) => d.category),
      axisLabel: { color: chartTextColor(), fontWeight: "bold" },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      {
        type: "bar",
        data: chartData.map((d, i) => ({
          value: d.value,
          itemStyle: { color: palette[i % palette.length] },
        })),
        barWidth: 30,
        label: {
          show: true,
          position: "right",
          formatter: (params: any) => formatEuro(params.value),
          fontWeight: "bold",
          color: chartTextColor(),
        },
      },
    ],
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        return `${p.name}: ${formatEuro(p.value)}`;
      },
      backgroundColor: chartTooltipBackground(),
      borderColor: chartTooltipBorder(),
      textStyle: { color: chartTextColor() },
    },
    title: { text: "", left: "center", top: 0 },
  };
}

function renderChart(chartData: any[]) {
  if (!barChartDiv.value) return;

  use([
    CanvasRenderer,
    BarChart,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    UniversalTransition,
  ]);

  if (!barChart) {
    barChart = echarts.init(barChartDiv.value);
  }

  chartDataRef.value = chartData;
  barChart.setOption(buildChartOption(chartData), true);
  chartReady.value = true;

  (barChartDiv as any)._echartsInstance = barChart;
  setTimeout(() => barChart?.resize?.(), 50);
}

function formatEuro(val: number) {
  return `${val.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}€`;
}

async function getBarChartData() {
  const data = await parseChartData();
  // Only current month
  const filtered = data.filter((it) => {
    const itemUnix = it.unix_time ?? toUnixSeconds(it.date);
    return !Number.isNaN(itemUnix) && itemUnix >= getLastMonthUnix();
  });
  // Aggregate by category
  const agg: Record<string, number> = {};
  for (const it of filtered) {
    const cat =
      it.categoryLabel ?? it.category_name ?? it.category ?? "Unbekannt";
    const raw = it.amount ?? it.total ?? 0;
    const val =
      typeof raw === "number"
        ? raw
        : Number(String(raw).replace(",", ".")) || 0;
    agg[cat] = (agg[cat] || 0) + val;
  }
  // Sort by value descending
  const sorted = Object.entries(agg).sort((a, b) => b[1] - a[1]);
  // Top 5 biggest categories
  const top = sorted.slice(0, 5);
  return top.map(([cat, val]) => ({
    category: cat,
    value: Math.round(val * 100) / 100,
  }));
}

async function refreshStats() {
  const data = await parseChartData();
  receiptCount.value = data.length;
  // Expenses this month
  const filtered = data.filter((it) => {
    const itemUnix = it.unix_time ?? toUnixSeconds(it.date);
    return !Number.isNaN(itemUnix) && itemUnix >= getLastMonthUnix();
  });
  expensesThisMonth.value = filtered.reduce((sum, it) => {
    const raw = it.amount ?? it.total ?? 0;
    const val =
      typeof raw === "number"
        ? raw
        : Number(String(raw).replace(",", ".")) || 0;
    return sum + val;
  }, 0);
  // Previous month
  const prevFiltered = data.filter((it) => {
    const itemUnix = it.unix_time ?? toUnixSeconds(it.date);
    return (
      !Number.isNaN(itemUnix) &&
      itemUnix >= getPrevLastMonthUnix() &&
      itemUnix < getLastMonthUnix()
    );
  });
  const prevSum = prevFiltered.reduce((sum, it) => {
    const raw = it.amount ?? it.total ?? 0;
    const val =
      typeof raw === "number"
        ? raw
        : Number(String(raw).replace(",", ".")) || 0;
    return sum + val;
  }, 0);
  // Change rate
  const prev = prevSum || 1;
  const rawPercent = ((expensesThisMonth.value - prev) / prev) * 100;
  const percentailChange = Math.round(rawPercent * 10) / 10;
  const prefix = percentailChange > 0 ? "Δ +" : "∇ ";
  changeRate.value = `${prefix}${percentailChange}% im Vergleich zum Vormonat`;
  changeColor.value = percentailChange > 0 ? "#f44336" : "#4caf50";
}

async function downloadImage(assetId = 1): Promise<string | null> {
  return apiDownloadImage(assetId);
}

const palette = ["#ffa726", "#ffccbc", "#4dd0e1", "#aed581", "#ba68c8"];

onMounted(async () => {
  await refreshStats();
  // Bar chart
  const chartData = await getBarChartData();
  renderChart(chartData);
});

watch(
  () => theme.global.current.value.dark,
  () => {
    if (chartReady.value) {
      renderChart(chartDataRef.value);
    }
  },
);

let barChart: any = null;

const resizeHandler = () => {
  try {
    if (barChart && typeof barChart.resize === "function") barChart.resize();
  } catch (e) {
    /* ignore resize errors */
  }
};

onMounted(() => {
  window.addEventListener("resize", resizeHandler);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeHandler);
  if (barChart && typeof barChart.dispose === "function") {
    try {
      barChart.dispose();
    } catch (e) {}
    barChart = null;
  }
});
</script>

<template>
  <div class="dashboard-root">
    <section class="dashboard-hero">
      <div>
        <p class="dashboard-kicker">Finanzcockpit</p>
        <h1 class="dashboard-title">Dashboard</h1>
        <p class="dashboard-subtitle">
          Ein schneller Blick auf aktuelle Ausgaben, Belegvolumen und die stärksten Kategorien.
        </p>
      </div>
      <router-link to="/scan" custom v-slot="{ navigate }">
        <button type="button" class="dashboard-scan-btn" @click="navigate">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-3h6l2 3h3a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          Beleg scannen
        </button>
      </router-link>
    </section>

    <section class="dashboard-metrics">
      <article class="metric-card metric-card--accent">
        <span>Gesamtausgaben {{ currentMonth }}</span>
        <strong>{{ formatEuro(expensesThisMonth) }}</strong>
      </article>
      <article class="metric-card">
        <span>Veränderung</span>
        <strong :style="{ color: changeColor }">{{ changeRate }}</strong>
      </article>
      <article class="metric-card">
        <span>Belege gesamt</span>
        <strong>{{ receiptCount }}</strong>
      </article>
    </section>

    <section class="dashboard-grid">
      <div class="dashboard-chart-card">
        <div class="dashboard-chart-header">
          <div>
            <p class="dashboard-kicker">Kategorieverteilung</p>
            <h2>Top Kategorien im aktuellen Monat</h2>
          </div>
        </div>
        <div ref="barChartDiv" class="dashboard-bar-chart"></div>
      </div>
      <aside class="dashboard-side-stack">
        <div class="dashboard-side-card">
          <span class="dashboard-side-label">Belege gescannt</span>
          <div class="dashboard-receipt-count">{{ receiptCount }}</div>
          <p class="dashboard-side-copy">Alle importierten Belege werden hier gesammelt und für Analysen vorbereitet.</p>
        </div>
        <div class="dashboard-side-card dashboard-side-card--soft">
          <span class="dashboard-side-label">Nächster Schritt</span>
          <p class="dashboard-side-copy">Scanne neue Belege oder öffne AI Spartipps für konkrete Optimierungsvorschläge.</p>
        </div>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.dashboard-root {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 12px 8px 28px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dashboard-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
  padding: 28px;
  border-radius: 30px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(237, 248, 240, 0.9));
  border: 1px solid rgba(96, 143, 108, 0.14);
}

.dashboard-kicker {
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
  font-size: 0.75rem;
  color: #4f8e61;
}

.dashboard-title {
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 800;
  margin: 0 0 10px;
  text-align: left;
}

.dashboard-subtitle {
  max-width: 60ch;
  margin: 0;
  color: var(--app-muted);
  font-size: 1rem;
}

.dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  padding: 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(96, 143, 108, 0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-card span,
.dashboard-side-label {
  color: var(--app-muted);
  font-size: 0.84rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.metric-card strong {
  font-size: 1.55rem;
  line-height: 1.2;
}

.metric-card--accent {
  background: linear-gradient(135deg, rgba(78, 150, 92, 0.14), rgba(255, 255, 255, 0.84));
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 0.9fr);
  gap: 18px;
  align-items: stretch;
}

.dashboard-chart-card,
.dashboard-side-card {
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(96, 143, 108, 0.12);
  box-shadow: 0 18px 50px rgba(24, 47, 32, 0.08);
}

.dashboard-chart-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.dashboard-bar-chart {
  min-height: 360px;
  width: 100%;
  margin-top: 12px;
}

.dashboard-side-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dashboard-receipt-count {
  font-size: 3.6rem;
  font-weight: 800;
  line-height: 1;
}

.dashboard-receipt-label {
  font-size: 1rem;
  color: var(--app-muted);
}

.dashboard-side-copy {
  margin: 0;
  color: var(--app-muted);
  line-height: 1.6;
}

.dashboard-scan-btn {
  padding: 14px 22px;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #2f7b45, #56a36b);
  border: none;
  border-radius: 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 18px 34px rgba(47, 123, 69, 0.22);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  text-transform: none;
}
.dashboard-scan-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 40px rgba(47, 123, 69, 0.26);
}

/* Responsive styles */
@media (max-width: 900px) {
  .dashboard-hero,
  .dashboard-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .dashboard-metrics {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .dashboard-root {
    padding: 8px 0 0;
  }
  .dashboard-title {
    font-size: 1.8rem;
  }
  .dashboard-bar-chart {
    min-height: 300px;
  }
  .dashboard-hero,
  .dashboard-chart-card,
  .dashboard-side-card {
    padding: 18px;
  }
  .dashboard-receipt-count {
    font-size: 2.8rem;
  }
}

@media (max-width: 480px) {
  .dashboard-root {
    padding: 4px 0 0;
  }
  .dashboard-title {
    font-size: 1.5rem;
  }
  .dashboard-bar-chart {
    min-height: 260px;
  }
  .dashboard-scan-btn {
    width: 100%;
    justify-content: center;
  }
  .dashboard-side-card,
  .metric-card {
    border-radius: 20px;
  }
}
</style>
