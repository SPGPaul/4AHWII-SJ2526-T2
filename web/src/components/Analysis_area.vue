<script setup lang="ts">
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, PieChart, LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from "echarts/components";
import { UniversalTransition } from "echarts/features";
import * as echarts from "echarts/core";
import { onMounted, ref, watch, onBeforeUnmount } from "vue";
import { loadUserData } from "@/utils/loadUser";

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  UniversalTransition,
]);

function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}
function monthLabelFromKey(key: string) {
  // key = YYYY-MM
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short" });
}

function lastNMonthKeys(n: number) {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

async function buildCategoryTrends(items: any[], monthsCount = 3) {
  const months = lastNMonthKeys(monthsCount); // e.g. ['2025-09','2025-10','2025-11']
  const agg: Record<string, Record<string, number>> = {};
  for (const it of items) {
    const raw = it?.date ?? "";
    const amtRaw = it?.amount;
    const amt =
      typeof amtRaw === "number" ? amtRaw : amtRaw ? Number(amtRaw) : 0;
    const d = new Date(raw);
    if (isNaN(d.getTime())) continue;
    const key = monthKey(d);
    // only keep last N months
    if (!months.includes(key)) continue;
    const cat = it?.categoryLabel ?? it?.category_name ?? it?.category ?? "Unbekannt";
    agg[cat] = agg[cat] || {};
    agg[cat][key] = (agg[cat][key] || 0) + amt;
  }

  const categories = Object.keys(agg).sort();
  const result = categories.map((name) => {
    const values = months.map((m) => Number((agg[name][m] || 0).toFixed(2)));
    return { name, months: months.slice(), values };
  });
  return { months, trends: result };
}

/* --- existing charts are still rendered (pie + bar) --- */
async function renderPieChart() {
  const data = await loadUserData();
  let items = Array.isArray(data?.receipts) ? data.receipts : [];
  // Deduplicate by documentId
  const seen = new Set();
  items = items.filter(item => {
    if (!item.documentId) return true;
    if (seen.has(item.documentId)) return false;
    seen.add(item.documentId);
    return true;
  });
  // Sort by date descending and take last 7
  items = items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);
  const displayedTimeRaw = items.map((it: any) => it?.date ?? "");
  const displayedValue = items.map((it: any) => {
    const v = it?.amount;
    return typeof v === "number" ? v : v ? Number(v) : 0;
  });
  const displayedCategory = items.map(
    (it: any) => it?.categoryLabel ?? it?.category_name ?? it?.category ?? "Unbekannt",
  );
  const formatDateShort = (iso: any) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso);
      return d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return String(iso);
    }
  };
  const displayedTime = displayedTimeRaw.map(formatDateShort);

  const agg: Record<string, number> = {};
  for (let i = 0; i < displayedCategory.length; i++) {
    const name = displayedCategory[i] ?? "Unbekannt";
    const val = Number(displayedValue[i] ?? 0) || 0;
    agg[name] = (agg[name] || 0) + val;
  }
  const palette = [
    "#4e79a7",
    "#f28e2b",
    "#e15759",
    "#76b7b2",
    "#59a14f",
    "#b07aa1",
    "#ff9da7",
  ];
  const pieData = Object.keys(agg).map((name, idx) => ({
    name,
    value: agg[name],
    itemStyle: { color: palette[idx % palette.length] },
  }));

  const series = [
    {
      name: "Ausgaben",
      type: "pie",
      radius: "50%",
      center: ["50%", "55%"],
      data: pieData,
      label: { formatter: "{b}: {c} ({d}%)" },
    },
  ];

  const options = {
    color: [
      "lightblue",
      "lightgreen",
      "lightcoral",
      "lightsalmon",
      "lightseagreen",
      "lightpink",
      "lightgray",
    ],
    backgroundColor: "#FFFFFF",
    title: { text: "Ausgaben (nach Kategorie)", left: "center" },
    // Make legend mobile-safe (prevents overlap into the pie)
    legend: {
      type: "scroll",
      orient: "horizontal",
      bottom: 0,
      left: "center",
      data: pieData.map((d) => d.name),
    },
    tooltip: { trigger: "item", formatter: "{b}: {c}€ ({d}%)" },
    series,
  };

  return { options };
}

async function renderBarChart() {
  const data = await loadUserData();
  let items = Array.isArray(data?.receipts) ? data.receipts : [];
  // Deduplicate by documentId
  const seen = new Set();
  items = items.filter(item => {
    if (!item.documentId) return true;
    if (seen.has(item.documentId)) return false;
    seen.add(item.documentId);
    return true;
  });
  // Sort by date descending and take last 7
  items = items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);
  const displayedTimeRaw = items.map((it: any) => it?.date ?? "");
  const displayedValue = items.map((it: any) => {
    const v = it?.amount;
    return typeof v === "number" ? v : v ? Number(v) : 0;
  });

  const formatDateShort = (iso: any) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso);
      return d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return String(iso);
    }
  };
  const formatDateFull = (iso: any) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso);
      return d.toLocaleString();
    } catch {
      return String(iso);
    }
  };
  const displayedTime = displayedTimeRaw.map(formatDateShort);

  const series = [{ data: displayedValue, type: "bar" }];

  const options = {
    color: [
      "lightblue",
      "lightgreen",
      "lightcoral",
      "lightsalmon",
      "lightseagreen",
      "lightpink",
      "lightgray",
    ],
    backgroundColor: "#FFFFFF",
    title: { text: "Ausgaben" },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        const idx = p?.dataIndex ?? 0;
        const dateLabel = formatDateFull(displayedTimeRaw[idx]);
        return `${dateLabel}<br/>Wert: ${p.value} €`;
      },
    },
    grid: { left: "5%", right: "5%", bottom: "5%" },
    xAxis: { type: "category", data: displayedTime, axisLabel: { rotate: 25 } },
    yAxis: { type: "value" },
    series,
  };

  return { options };
}

/* --- New: mini-trend carousel --- */
const nativeChartDiv = ref<HTMLElement | null>(null);
const miniChartDiv = ref<HTMLElement | null>(null);
const categoriesRef = ref<
  { name: string; months: string[]; values: number[] }[]
>([]);
const monthsRef = ref<string[]>([]);
const currentIndex = ref(0);
let miniChart: echarts.ECharts | null = null;
let leftEchart: echarts.ECharts | null = null;
let rightEchart: echarts.ECharts | null = null;
let resizeHandler = () => {};

// New items for carousel behavior
let autoplayInterval: number | null = null;
let touchStartX: number | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;
let dotsDiv: HTMLElement | null = null;
const dotButtons: HTMLElement[] = [];
let containerResizeObserver: ResizeObserver | null = null;

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeHandler);
  containerResizeObserver?.disconnect();
  containerResizeObserver = null;
  miniChart?.dispose();
  leftEchart?.dispose();
  rightEchart?.dispose();
  if (autoplayInterval !== null) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }
  if (keyHandler) document.removeEventListener("keydown", keyHandler);
});

onMounted(async () => {
  if (!nativeChartDiv.value) return;
  try {
    const apiData = await loadUserData();
    const items = Array.isArray(apiData?.receipts) ? apiData.receipts : [];

    // Build category trends for last 3 months
    const { months, trends } = await buildCategoryTrends(items, 3);
    monthsRef.value = months;
    categoriesRef.value = trends;

    // Initialize the two main charts (pie and bar) side-by-side
    const { options: pieOptions } = await renderPieChart();
    const { options: barOptions } = await renderBarChart();

    const container = nativeChartDiv.value as HTMLElement;
    container.className = "analysis-container";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "stretch";
    container.innerHTML = "";
    container.style.background = "#FFFFFF";

    // top: two big charts
    const topRow = document.createElement("div");
    topRow.className = "analysis-toprow";
    topRow.innerHTML = ""; // keep deterministic
    // remove fixed height; CSS handles responsive sizes
    topRow.style.display = "";
    topRow.style.width = "100%";
    topRow.style.height = "";
    topRow.style.boxSizing = "border-box";
    topRow.style.padding = "";

    const leftDiv = document.createElement("div");
    const rightDiv = document.createElement("div");
    leftDiv.className = "analysis-chart";
    rightDiv.className = "analysis-chart";
    leftDiv.style.marginRight = ""; // let gap handle it

    topRow.appendChild(leftDiv);
    topRow.appendChild(rightDiv);
    container.appendChild(topRow);

    leftEchart = echarts.init(leftDiv);
    rightEchart = echarts.init(rightDiv);
    leftEchart.setOption(pieOptions);
    rightEchart.setOption(barOptions);

    // bottom: carousel controls + mini chart
    const bottomRow = document.createElement("div");
    bottomRow.className = "carousel-row";

    const prevBtn = document.createElement("button");
    prevBtn.className = "trend-btn prev-btn";
    prevBtn.textContent = "◀";

    const nextBtn = document.createElement("button");
    nextBtn.className = "trend-btn next-btn";
    nextBtn.textContent = "▶";

    const label = document.createElement("div");
    label.className = "trend-label";

    const chartWrapper = document.createElement("div");
    chartWrapper.className = "chart-wrapper";

    chartWrapper.appendChild(document.createElement("div")); // inner div where echarts will mount
    bottomRow.appendChild(prevBtn);
    bottomRow.appendChild(label);
    bottomRow.appendChild(chartWrapper);
    bottomRow.appendChild(nextBtn);

    // Dots indicator (below chart)
    dotsDiv = document.createElement("div");
    dotsDiv.className = "dots"; // added clas
    container.appendChild(bottomRow);
    container.appendChild(dotsDiv);

    miniChartDiv.value = chartWrapper.firstElementChild as HTMLElement;
    if (miniChartDiv.value) {
      miniChart = echarts.init(miniChartDiv.value);
    }

    // Helper actions
    const prevAction = () => {
      if (!categoriesRef.value || categoriesRef.value.length === 0) return;
      currentIndex.value =
        (currentIndex.value - 1 + categoriesRef.value.length) %
        categoriesRef.value.length;
      updateMini(currentIndex.value);
    };
    const nextAction = () => {
      if (!categoriesRef.value || categoriesRef.value.length === 0) return;
      currentIndex.value =
        (currentIndex.value + 1) % categoriesRef.value.length;
      updateMini(currentIndex.value);
    };

    // replace style-based dot activation with class toggling
    const updateDotsActive = (i: number) => {
      dotButtons.forEach((btn, idx) => {
        if (idx === i) btn.classList.add("active");
        else btn.classList.remove("active");
      });
    };

    const updateMini = (idx: number) => {
      const cats = categoriesRef.value;
      if (!cats || cats.length === 0) {
        label.textContent = "Keine Kategorien";
        miniChart?.clear();
        return;
      }
      const i = ((idx % cats.length) + cats.length) % cats.length;
      const cat = cats[i];
      label.textContent = `${cat.name} — ${cat.values
        .map((v) => (v ? v.toFixed(2) : "0"))
        .join(" / ")}`;
      const option = {
        title: {
          text: `${cat.name} — ${monthLabelFromKey(
            monthsRef.value[0]
          )} → ${monthLabelFromKey(
            monthsRef.value[monthsRef.value.length - 1]
          )}`,
          left: "center",
          textStyle: { fontSize: 13 },
        },
        tooltip: {
          trigger: "axis",
          formatter: (p: any) => `${p[0].axisValue}<br/>${p[0].value} €`,
        },
        xAxis: {
          type: "category",
          data: monthsRef.value.map(monthLabelFromKey),
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: { fontSize: 11 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { fontSize: 11 },
        },
        grid: { left: 10, right: 10, top: 36, bottom: 10 },
        series: [
          {
            data: cat.values,
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 8,
            lineStyle: { width: 2.5 },
            itemStyle: { color: "#4e79a7" },
          },
        ],
      };
      miniChart?.setOption(option);
      updateDotsActive(i);
    };

    // Build dots (use class-based styling)
    dotButtons.length = 0;
    dotsDiv.innerHTML = "";
    const cats = categoriesRef.value || [];
    for (let i = 0; i < cats.length; i++) {
      const b = document.createElement("button");
      b.className = "dot"; // use dot class
      b.title = cats[i].name;
      b.onclick = () => {
        currentIndex.value = i;
        updateMini(i);
        resetAutoplay();
      };
      dotsDiv.appendChild(b);
      dotButtons.push(b);
    }

    // Wire buttons
    prevBtn.onclick = () => {
      prevAction();
      resetAutoplay();
    };
    nextBtn.onclick = () => {
      nextAction();
      resetAutoplay();
    };

    // touch swipe
    chartWrapper.addEventListener(
      "touchstart",
      (ev) => {
        if (ev.touches && ev.touches[0]) touchStartX = ev.touches[0].clientX;
      },
      { passive: true }
    );
    chartWrapper.addEventListener(
      "touchend",
      (ev) => {
        if (touchStartX === null) return;
        const x =
          ev.changedTouches && ev.changedTouches[0]
            ? ev.changedTouches[0].clientX
            : null;
        if (x === null) {
          touchStartX = null;
          return;
        }
        const dx = x - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) > 40) {
          if (dx > 0) prevAction();
          else nextAction();
          resetAutoplay();
        }
      },
      { passive: true }
    );

    // keyboard support
    keyHandler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevAction();
        resetAutoplay();
      }
      if (e.key === "ArrowRight") {
        nextAction();
        resetAutoplay();
      }
    };
    document.addEventListener("keydown", keyHandler);

    // pause on hover
    const pauseOn = () => {
      stopAutoplay();
    };
    const resumeOn = () => {
      startAutoplay();
    };
    chartWrapper.addEventListener("mouseenter", pauseOn);
    chartWrapper.addEventListener("mouseleave", resumeOn);
    prevBtn.addEventListener("mouseenter", pauseOn);
    prevBtn.addEventListener("mouseleave", resumeOn);
    nextBtn.addEventListener("mouseenter", pauseOn);
    nextBtn.addEventListener("mouseleave", resumeOn);
    dotsDiv.addEventListener("mouseenter", pauseOn);
    dotsDiv.addEventListener("mouseleave", resumeOn);

    // autoplay
    const startAutoplay = () => {
      if (autoplayInterval !== null) return;
      autoplayInterval = window.setInterval(() => {
        nextAction();
      }, 4000);
    };
    const stopAutoplay = () => {
      if (autoplayInterval !== null) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    };
    const resetAutoplay = () => {
      stopAutoplay();
      startAutoplay();
    };

    // init view
    currentIndex.value = 0;
    updateMini(0);

    // init dots active
    updateDotsActive(0);

    // start autoplay
    startAutoplay();

    // handle resize
    resizeHandler = () => {
      leftEchart?.resize();
      rightEchart?.resize();
      miniChart?.resize();
    };
    window.addEventListener("resize", resizeHandler);

    // ResizeObserver catches drawer toggles / wrap padding changes / orientation changes
    if ("ResizeObserver" in window) {
      containerResizeObserver = new ResizeObserver(() => {
        resizeHandler();
      });
      containerResizeObserver.observe(container);
      containerResizeObserver.observe(chartWrapper);
    }
  } catch (err) {
    console.error("Failed to initialize charts:", err);
  }
});
</script>

<template>
  <div class="analysis-page">
    <section class="analysis-hero">
      <div class="analysis-hero__copy">
        <span class="analysis-kicker">Ausgabenanalyse</span>
        <h1>Transaktionen schneller lesen und Muster klarer sehen.</h1>
        <p>
          Zwei Kerncharts und ein Monatsvergleich zeigen, wie sich Ausgaben entwickeln und wo Kategorien dominieren.
        </p>
      </div>

      <div class="analysis-hero__stats" aria-label="Analyse-Highlights">
        <article class="analysis-stat-card">
          <span>Charts</span>
          <strong>2</strong>
          <p>Kategorie und Betrag im Direktvergleich</p>
        </article>
        <article class="analysis-stat-card">
          <span>Trend</span>
          <strong>3 Monate</strong>
          <p>Monatliche Entwicklung je Kategorie</p>
        </article>
        <article class="analysis-stat-card">
          <span>Fokus</span>
          <strong>7 Belege</strong>
          <p>Die letzten Einträge kompakt aufbereitet</p>
        </article>
      </div>
    </section>

    <section class="analysis-surface">
      <div class="analysis-surface__header">
        <div>
          <p class="analysis-surface__eyebrow">Visuelle Übersicht</p>
          <h2>Ausgaben, Kategorien und Verlauf</h2>
        </div>
        <p class="analysis-surface__copy">
          Die Karte unten bündelt die bestehenden Diagramme in einer ruhigeren, klareren Oberfläche.
        </p>
      </div>

      <div ref="nativeChartDiv" class="analysis-mount">
        Loading charts…
      </div>
    </section>
  </div>
</template>

<style scoped>
/* filepath: c:\Users\Paul Fiala\Schule\Spengergasse\SWP\4AHWII\4AHWII-SJ2526-T2\web\src\components\Analysis_area.vue */
/* Carousel styling */
:deep(.analysis-container) {
  background: #fff;
  color: #222;
  max-width: 1280px;
  margin: 0 auto;
  padding: 18px 12px;
  box-sizing: border-box;
}

:deep(.carousel-row) {
  display: grid;
  grid-template-columns: 52px minmax(180px, 280px) 1fr 52px;
  grid-template-areas: "prev label chart next";
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  box-sizing: border-box;
  width: 100%;
}

:deep(.prev-btn) {
  grid-area: prev;
}
:deep(.next-btn) {
  grid-area: next;
}
:deep(.trend-label) {
  grid-area: label;
}
:deep(.chart-wrapper) {
  grid-area: chart;
}

/* Prev/Next buttons - enlarged */
:deep(.trend-btn) {
  background: #f3f4f6;
  border: 1px solid #e3e6ea;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  transition: background 0.12s, transform 0.08s;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
:deep(.trend-btn:hover) {
  background: #e8eaee;
  transform: translateY(-1px);
}

/* Center label - a bit larger */
:deep(.trend-label) {
  min-width: 0;
  max-width: 100%;
  text-align: center;
  font-weight: 700;
  color: #222;
  word-break: break-word;
  font-size: 14px;
}

/* Chart wrapper: make carousel bigger */
:deep(.chart-wrapper) {
  width: 100%;
  max-width: 1200px;
  height: min(56vh, 520px);
  box-sizing: border-box;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Ensure the inner echarts div fills the wrapper */
:deep(.chart-wrapper > div) {
  width: 100% !important;
  height: 100% !important;
}

/* Dots - larger and more visible */
:deep(.dots) {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  width: 100%;
}
:deep(.dot) {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #bbb;
  border: none;
  padding: 0;
  cursor: pointer;
  opacity: 0.75;
  transition: transform 0.12s, opacity 0.12s, background 0.12s;
}
:deep(.dot.active) {
  background: #4e79a7;
  opacity: 1;
  transform: scale(1.25);
}

/* NEW: responsive layout for the two main charts */
:deep(.analysis-toprow) {
  display: flex;
  gap: 20px;
  width: 100%;
  padding: 8px 4px 16px 4px;
  box-sizing: border-box;
  align-items: stretch; /* stretch charts to fill row */
  justify-content: center; /* center the two charts */
}

:deep(.analysis-chart) {
  flex: 1 1 48%;
  max-width: 48%;
  min-width: 280px;
  height: min(48vh, 440px); /* desktop default, responsive to viewport */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* stack charts on smaller screens */
@media (max-width: 900px) {
  :deep(.analysis-toprow) {
    flex-direction: column;
    padding: 8px 0;
  }
  :deep(.analysis-chart) {
    height: 280px;
  }
}

@media (max-width: 700px) {
  :deep(.carousel-row) {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "label label"
      "chart chart"
      "prev next";
    padding: 10px 0;
    gap: 10px;
  }

  :deep(.trend-label) {
    font-size: 13px;
  }

  :deep(.chart-wrapper) {
    height: 210px;
    padding: 6px;
  }
}

/* very small screens */
@media (max-width: 560px) {
  :deep(.analysis-chart) {
    height: 240px;
  }

  :deep(.chart-wrapper) {
    height: 190px;
  }
}

:deep(.analysis-page) {
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px 20px 36px;
  box-sizing: border-box;
  display: grid;
  gap: 20px;
}

:deep(.analysis-hero) {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
  gap: 18px;
  align-items: stretch;
}

:deep(.analysis-hero__copy),
:deep(.analysis-hero__stats),
:deep(.analysis-surface) {
  border-radius: 28px;
  border: 1px solid rgba(96, 143, 108, 0.12);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(237, 248, 240, 0.9));
  box-shadow: 0 18px 50px rgba(24, 47, 32, 0.08);
  backdrop-filter: blur(14px);
}

:deep(.analysis-hero__copy) {
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

:deep(.analysis-kicker),
:deep(.analysis-surface__eyebrow) {
  display: inline-flex;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(76, 146, 94, 0.12);
  color: #2f7444;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

:deep(.analysis-hero__copy h1) {
  margin: 16px 0 12px;
  font-size: clamp(2rem, 3.8vw, 3.5rem);
  line-height: 1.02;
  letter-spacing: -0.04em;
}

:deep(.analysis-hero__copy p),
:deep(.analysis-surface__copy) {
  margin: 0;
  color: var(--app-muted);
  line-height: 1.65;
  font-size: 1rem;
}

:deep(.analysis-hero__stats) {
  padding: 18px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

:deep(.analysis-stat-card) {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(96, 143, 108, 0.12);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 148px;
}

:deep(.analysis-stat-card span) {
  color: var(--app-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  font-weight: 700;
}

:deep(.analysis-stat-card strong) {
  font-size: 1.6rem;
  line-height: 1.1;
}

:deep(.analysis-stat-card p) {
  margin: 0;
  color: var(--app-muted);
  line-height: 1.5;
}

:deep(.analysis-surface) {
  padding: 22px;
}

:deep(.analysis-surface__header) {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

:deep(.analysis-surface__header h2) {
  margin: 10px 0 0;
  font-size: clamp(1.35rem, 2vw, 1.8rem);
}

:deep(.analysis-surface__copy) {
  max-width: 48ch;
  text-align: right;
}

:deep(.analysis-mount) {
  width: 100%;
  margin-top: 8px;
  min-height: 720px;
}

:deep(.analysis-container) {
  color: #222;
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background: transparent;
}

:deep(.carousel-row) {
  display: grid;
  grid-template-columns: 56px minmax(200px, 280px) 1fr 56px;
  grid-template-areas: "prev label chart next";
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 14px 0 0;
  box-sizing: border-box;
  width: 100%;
}

:deep(.trend-btn) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(241, 248, 243, 0.96));
  border: 1px solid rgba(96, 143, 108, 0.14);
  padding: 10px 14px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  transition: background 0.12s, transform 0.08s, box-shadow 0.12s;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

:deep(.trend-btn:hover) {
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(24, 47, 32, 0.08);
}

:deep(.trend-label) {
  min-width: 0;
  max-width: 100%;
  text-align: center;
  font-weight: 700;
  color: #1f2b24;
  word-break: break-word;
  font-size: 14px;
}

:deep(.chart-wrapper) {
  width: 100%;
  max-width: 1200px;
  height: min(56vh, 520px);
  box-sizing: border-box;
  border: 1px solid rgba(96, 143, 108, 0.12);
  border-radius: 22px;
  padding: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 251, 246, 0.96));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 10px 24px rgba(24, 47, 32, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.chart-wrapper > div) {
  width: 100% !important;
  height: 100% !important;
}

:deep(.dots) {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  width: 100%;
}

:deep(.dot) {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #bbb;
  border: none;
  padding: 0;
  cursor: pointer;
  opacity: 0.75;
  transition: transform 0.12s, opacity 0.12s, background 0.12s;
}

:deep(.dot.active) {
  background: #4e79a7;
  opacity: 1;
  transform: scale(1.25);
}

:deep(.analysis-toprow) {
  display: flex;
  gap: 20px;
  width: 100%;
  padding: 10px 0 18px 0;
  box-sizing: border-box;
  align-items: stretch;
  justify-content: center;
}

:deep(.analysis-chart) {
  flex: 1 1 48%;
  max-width: 48%;
  min-width: 280px;
  height: min(48vh, 440px);
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 900px) {
  :deep(.analysis-hero) {
    grid-template-columns: 1fr;
  }

  :deep(.analysis-hero__stats) {
    grid-template-columns: 1fr;
  }

  :deep(.analysis-surface__header) {
    grid-template-columns: 1fr;
    display: grid;
    align-items: start;
  }

  :deep(.analysis-surface__copy) {
    text-align: left;
  }

  :deep(.analysis-toprow) {
    flex-direction: column;
    padding: 8px 0;
  }

  :deep(.analysis-chart) {
    height: 280px;
    max-width: 100%;
  }
}

@media (max-width: 700px) {
  :deep(.analysis-page) {
    padding: 18px 12px 28px;
  }

  :deep(.analysis-hero__copy),
  :deep(.analysis-surface) {
    padding: 18px;
    border-radius: 22px;
  }

  :deep(.analysis-mount) {
    min-height: 640px;
  }

  :deep(.carousel-row) {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "label label"
      "chart chart"
      "prev next";
    padding: 10px 0;
    gap: 10px;
  }

  :deep(.trend-label) {
    font-size: 13px;
  }

  :deep(.chart-wrapper) {
    height: 210px;
    padding: 6px;
  }
}

@media (max-width: 560px) {
  :deep(.analysis-hero__copy h1) {
    font-size: 1.9rem;
  }

  :deep(.analysis-mount) {
    min-height: 600px;
  }

  :deep(.analysis-chart) {
    height: 240px;
  }

  :deep(.chart-wrapper) {
    height: 190px;
  }
}
</style>
