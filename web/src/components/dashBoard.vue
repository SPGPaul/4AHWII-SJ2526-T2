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
import { onMounted, ref, onBeforeUnmount } from "vue";
import { loadUserData } from "@/utils/loadUser";
import { STRAPI_URL } from "@/utils/strapi";

async function parseChartData(): Promise<any[]> {
  const data = await loadUserData();
  let items = Array.isArray(data?.receipts) ? data.receipts : [];
  // Filter to unique receipts by documentId
  const seen = new Set();
  items = items.filter(item => {
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
const currentMonth = new Date().toLocaleString("de-DE", {
  month: "long",
  year: "numeric",
});

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
    const cat = it.categoryLabel ?? it.category_name ?? it.category ?? "Unbekannt";
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
  try {
    const base = STRAPI_URL;
    // first fetch metadata to get the file URL
    const metaRes = await fetch(`${base}/api/download/files/${assetId}`);
    if (!metaRes.ok)
      throw new Error(`HTTP ${metaRes.status} ${metaRes.statusText}`);
    const fileMeta = await metaRes.json();

    const possibleUrl =
      fileMeta?.url ||
      fileMeta?.data?.attributes?.url ||
      fileMeta?.data?.attributes?.formats?.thumbnail?.url ||
      null;

    if (!possibleUrl) {
      console.warn("No url found for asset", assetId, fileMeta);
      return null;
    }

    // build absolute URL if needed
    const fullUrl = possibleUrl.startsWith("http")
      ? possibleUrl
      : `${base.replace(/\/$/, "")}${
          possibleUrl.startsWith("/") ? "" : "/"
        }${possibleUrl}`;

    // fetch the binary image
    const fileRes = await fetch(fullUrl);
    if (!fileRes.ok)
      throw new Error(
        `Failed to download file: HTTP ${fileRes.status} ${fileRes.statusText}`
      );
    const blob = await fileRes.blob();

    if (!blob.type.startsWith("image/")) {
      console.warn("Downloaded file is not an image", blob.type);
    }

    // return an object URL that can be used as src in <img>
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Failed to download image asset:", err);
    return null;
  }
}

const palette = ["#ffa726", "#ffccbc", "#4dd0e1", "#aed581", "#ba68c8"];

onMounted(async () => {
  await refreshStats();
  // Bar chart
  const chartData = await getBarChartData();
  if (barChartDiv.value) {
    use([
      CanvasRenderer,
      BarChart,
      TitleComponent,
      TooltipComponent,
      GridComponent,
      UniversalTransition,
    ]);
    const chart = echarts.init(barChartDiv.value);
    chart.setOption({
      color: palette,
      grid: {
        left: "2%",
        right: "2%",
        top: 30,
        bottom: 30,
        containLabel: true,
      },
      xAxis: {
        type: "value",
        axisLabel: {
          formatter: (val: number) => formatEuro(val),
          color: "#222",
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "category",
        data: chartData.map((d) => d.category),
        axisLabel: { color: "#222", fontWeight: "bold" },
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
            color: "#222",
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
        backgroundColor: "#fff",
        textStyle: { color: "#222" },
      },
      title: { text: "", left: "center", top: 0 },
    });
    // store instance and ensure it resizes when viewport or layout changes
    (barChartDiv as any)._echartsInstance = chart;
    // small async resize to ensure proper initial rendering
    setTimeout(() => chart.resize(), 50);
    // keep reference for cleanup
    barChart = chart;
  }
});

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
    try { barChart.dispose(); } catch (e) {}
    barChart = null;
  }
});
</script>

<template>
  <div class="dashboard-root">
    <h1 class="dashboard-title">Dashboard</h1>
    <div class="dashboard-stats-row">
      <div class="dashboard-total">
        Gesamtausgaben {{ currentMonth }}: {{ formatEuro(expensesThisMonth) }}
      </div>
      <div class="dashboard-change" :style="{ color: changeColor }">
        {{ changeRate }}
      </div>
    </div>
    <div class="dashboard-main-row">
      <div class="dashboard-bar">
        <div ref="barChartDiv" class="dashboard-bar-chart"></div>
      </div>
      <div class="dashboard-count">
        <div class="dashboard-receipt-count">{{ receiptCount }}</div>
        <div class="dashboard-receipt-label">Belege gesamt gescannt</div>
      </div>
      <div class="dashboard-scan">
        <button type="button" class="dashboard-scan-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-3h6l2 3h3a2 2 0 0 1 2 2z"
            ></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          Scan
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* filepath: c:\Users\Paul Fiala\Schule\Spengergasse\SWP\4AHWII\4AHWII-SJ2526-T2\web\src\components\dashBoard.vue */
.dashboard-root {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 16px 0 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #222;
  margin-bottom: 0.5em;
  text-align: left;
}

.dashboard-stats-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5em;
  flex-wrap: wrap;
  gap: 16px;
}

.dashboard-total {
  font-size: 1.5rem;
  font-weight: 500;
  color: #222;
}

.dashboard-change {
  font-size: 1.5rem;
  font-weight: 500;
}

.dashboard-main-row {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr;
  gap: 32px;
  align-items: stretch;
  grid-auto-rows: 1fr; /* make columns equal height so side panels stretch */
  width: 100%;
}

.dashboard-bar {
  display: flex;
  flex-direction: column;
  justify-content: center; /* center chart vertically */
  align-items: center; /* center horizontally */
  min-width: 0;
}

.dashboard-bar-chart {
  height: 100%;
  min-height: 300px; /* larger desktop default */
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.dashboard-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.dashboard-receipt-count {
  font-size: 4rem;
  font-weight: 700;
  color: #222;
  line-height: 1;
}

.dashboard-receipt-label {
  font-size: 1.2rem;
  color: #222;
  text-align: center;
}

.dashboard-scan {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.dashboard-scan-btn {
  padding: 14px 28px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  background-color: #4caf50;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.08);
  transition: background 0.15s;
}
.dashboard-scan-btn:hover {
  background-color: #388e3c;
}

/* Responsive styles */
@media (max-width: 900px) {
  .dashboard-main-row {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .dashboard-scan {
    grid-column: span 2;
    margin-top: 18px;
  }
}

@media (max-width: 700px) {
  .dashboard-root {
    padding: 18px 4vw 0 4vw;
  }
  .dashboard-title {
    font-size: 2rem;
  }
  .dashboard-main-row {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .dashboard-bar-chart {
    height: 100%;
    min-height: 360px; /* larger desktop default */
    width: 90%;
    max-width: 100%;
    min-width: 0;
    margin: 0 auto;
  }

  .dashboard-count {
  }
  .dashboard-scan {
    margin-top: 10px;
  }
  .dashboard-receipt-count {
    font-size: 2.5rem;
  }
}

@media (max-width: 480px) {
  .dashboard-root {
    padding: 8px 2vw 0 2vw;
  }
  .dashboard-title {
    font-size: 1.3rem;
  }
  .dashboard-total,
  .dashboard-change {
    font-size: 1.1rem;
  }
  .dashboard-bar-chart {
    height: 140px;
  }
  .dashboard-receipt-label {
    font-size: 1rem;
  }
  .dashboard-scan-btn {
    font-size: 1rem;
    padding: 10px 16px;
  }
}
</style>
