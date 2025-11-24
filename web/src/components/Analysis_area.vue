<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { UniversalTransition } from 'echarts/features'
import * as echarts from 'echarts/core'
import { onMounted, ref, watch, onBeforeUnmount } from 'vue'

use([
    CanvasRenderer,
    PieChart,
    BarChart,
    LineChart,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    UniversalTransition
])

// waiting on proper implementation of API tokens...
async function loadChartData(){
    const apiUrl = "https://elegant-eggs-b247740f2b.strapiapp.com/api/Receipts";
    const token = "54a258000325fcbff04e65b292fecd2ca70258552324762fd2520e1932269765803183eb47586c2203f12b3abd7c7dbbe3dffe729c8334508eeba14656a85aa5bb7441ec939788a76a8a7e6066b1973362e5cdb6770a50dbecf0d74a4bcebe7c650eb54f08b757e0770003032e5817aa26dc6664c373e2c2e8667888d2d3f2c1";
    const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    return await res.json();
}

function monthKey(d: Date) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return `${y}-${String(m).padStart(2, '0')}`;
}
function monthLabelFromKey(key: string) {
    // key = YYYY-MM
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString(undefined, { month: 'short' });
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
        const raw = it?.date ?? '';
        const amtRaw = it?.amount;
        const amt = typeof amtRaw === 'number' ? amtRaw : (amtRaw ? Number(amtRaw) : 0);
        const d = new Date(raw);
        if (isNaN(d.getTime())) continue;
        const key = monthKey(d);
        // only keep last N months
        if (!months.includes(key)) continue;
        const cat = it?.category ?? 'Unbekannt';
        agg[cat] = agg[cat] || {};
        agg[cat][key] = (agg[cat][key] || 0) + amt;
    }

    const categories = Object.keys(agg).sort();
    const result = categories.map(name => {
        const values = months.map(m => Number((agg[name][m] || 0).toFixed(2)));
        return { name, months: months.slice(), values };
    });
    return { months, trends: result };
}

/* --- existing charts are still rendered (pie + bar) --- */
async function renderPieChart() {
    const data = await loadChartData();
    const items = Array.isArray(data?.data) ? data.data : [];

    const dataTime = items.map((it: any) => it?.date ?? '');
    const dataValue = items.map((it: any) => {
        const v = it?.amount;
        return typeof v === 'number' ? v : (v ? Number(v) : 0);
    });
    const category = items.map((it: any) => it?.category ?? 'Unbekannt');

    const displayedTimeRaw = dataTime.slice(0, 7);
    const displayedValue = dataValue.slice(0, 7);
    const displayedCategory = category.slice(0, 7);
    const formatDateShort = (iso: any) => {
        try {
            const d = new Date(iso)
            if (isNaN(d.getTime())) return String(iso)
            return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
        } catch {
            return String(iso)
        }
    }
    const displayedTime = displayedTimeRaw.map(formatDateShort);

    const agg: Record<string, number> = {};
    for (let i = 0; i < displayedCategory.length; i++) {
        const name = displayedCategory[i] ?? 'Unbekannt';
        const val = Number(displayedValue[i] ?? 0) || 0;
        agg[name] = (agg[name] || 0) + val;
    }
    const palette = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#b07aa1', '#ff9da7'];
    const pieData = Object.keys(agg).map((name, idx) => ({
        name,
        value: agg[name],
        itemStyle: { color: palette[idx % palette.length] }
    }));

    const series = [
        {
            name: 'Ausgaben',
            type: 'pie',
            radius: '50%',
            center: ['50%', '55%'],
            data: pieData,
            label: { formatter: '{b}: {c} ({d}%)' }
        }
    ];

    const options = {
        color: ['lightblue', 'lightgreen', 'lightcoral', 'lightsalmon', 'lightseagreen', 'lightpink', 'lightgray'],
        backgroundColor: '#FFFFFF',
        title: { text: 'Ausgaben (nach Kategorie)', left: 'center' },
        tooltip: { trigger: 'item', formatter: '{b}: {c}€ ({d}%)' },
        legend: { orient: 'vertical', left: 'left', data: pieData.map(d => d.name) },
        series
    };

    return { options };
}

async function renderBarChart(){
    const data = await loadChartData();
    const items = Array.isArray(data?.data) ? data.data : [];

    const dataTime = items.map((it: any) => it?.date ?? '');
    const dataValue = items.map((it: any) => {
        const v = it?.amount;
        return typeof v === 'number' ? v : (v ? Number(v) : 0);
    });

    const displayedTimeRaw = dataTime.slice(0, 7);
    const displayedValue = dataValue.slice(0, 7);

    const formatDateShort = (iso: any) => {
        try {
            const d = new Date(iso)
            if (isNaN(d.getTime())) return String(iso)
            return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
        } catch {
            return String(iso)
        }
    }
    const formatDateFull = (iso: any) => {
        try {
            const d = new Date(iso)
            if (isNaN(d.getTime())) return String(iso)
            return d.toLocaleString()
        } catch {
            return String(iso)
        }
    }
    const displayedTime = displayedTimeRaw.map(formatDateShort);

    const series = [{ data: displayedValue, type: 'bar' }];

    const options = {
        color: ['lightblue', 'lightgreen', 'lightcoral', 'lightsalmon', 'lightseagreen', 'lightpink', 'lightgray'],
        backgroundColor: '#FFFFFF',
        title: { text: 'Ausgaben' },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            formatter: (params: any) => {
                const p = Array.isArray(params) ? params[0] : params
                const idx = p?.dataIndex ?? 0
                const dateLabel = formatDateFull(displayedTimeRaw[idx]  )
                return `${dateLabel}<br/>Wert: ${p.value} €`
            }
        },
        grid: { left: '5%', right: '5%', bottom: '5%', containLabel: true },
        xAxis: { type: 'category', data: displayedTime, axisLabel: { rotate: 25 } },
        yAxis: { type: 'value' },
        series
    }

    return { options };
}

/* --- New: mini-trend carousel --- */
const nativeChartDiv = ref<HTMLElement | null>(null)
const miniChartDiv = ref<HTMLElement | null>(null)
const categoriesRef = ref<{ name: string, months: string[], values: number[] }[]>([])
const monthsRef = ref<string[]>([])
const currentIndex = ref(0)
let miniChart: echarts.ECharts | null = null
let leftEchart: echarts.ECharts | null = null
let rightEchart: echarts.ECharts | null = null
let resizeHandler = () => {}

// New items for carousel behavior
let autoplayInterval: number | null = null
let touchStartX: number | null = null
let keyHandler: ((e: KeyboardEvent) => void) | null = null
let dotsDiv: HTMLElement | null = null
const dotButtons: HTMLElement[] = []

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeHandler)
    miniChart?.dispose()
    leftEchart?.dispose()
    rightEchart?.dispose()
    if (autoplayInterval !== null) {
        clearInterval(autoplayInterval)
        autoplayInterval = null
    }
    if (keyHandler) document.removeEventListener('keydown', keyHandler)
})

onMounted(async () => {
    if (!nativeChartDiv.value) return
    try {
        const apiData = await loadChartData()
        const items = Array.isArray(apiData?.data) ? apiData.data : []

        // Build category trends for last 3 months
        const { months, trends } = await buildCategoryTrends(items, 3)
        monthsRef.value = months
        categoriesRef.value = trends

        // Initialize the two main charts (pie and bar) side-by-side
        const { options: pieOptions } = await renderPieChart()
        const { options: barOptions } = await renderBarChart()

        const container = nativeChartDiv.value as HTMLElement
        container.className = 'analysis-container'               // added class
        container.style.display = 'flex'
        container.style.flexDirection = 'column'
        container.style.alignItems = 'stretch'
        container.innerHTML = ''
        container.style.background = '#FFFFFF'

        // top: two big charts
        const topRow = document.createElement('div')
        topRow.style.display = 'flex'
        topRow.style.width = '100%'
        topRow.style.height = '320px'
        topRow.style.boxSizing = 'border-box'
        topRow.style.padding = '8px'

        const leftDiv = document.createElement('div')
        const rightDiv = document.createElement('div')
        leftDiv.style.flex = '1'
        rightDiv.style.flex = '1'
        leftDiv.style.height = '100%'
        rightDiv.style.height = '100%'
        leftDiv.style.minWidth = '0'
        rightDiv.style.minWidth = '0'
        leftDiv.style.marginRight = '8px'

        topRow.appendChild(leftDiv)
        topRow.appendChild(rightDiv)
        container.appendChild(topRow)

        leftEchart = echarts.init(leftDiv)
        rightEchart = echarts.init(rightDiv)
        leftEchart.setOption(pieOptions)
        rightEchart.setOption(barOptions)

        // bottom: carousel controls + mini chart
        const bottomRow = document.createElement('div')
        bottomRow.className = 'carousel-row'                    
        bottomRow.style.display = 'flex'
        bottomRow.style.alignItems = 'center'
        bottomRow.style.justifyContent = 'center'
        bottomRow.style.width = '100%'
        bottomRow.style.padding = '8px'
        bottomRow.style.boxSizing = 'border-box'
        bottomRow.style.gap = '12px'

        const prevBtn = document.createElement('button')
        prevBtn.className = 'trend-btn prev-btn'            
        prevBtn.textContent = '◀'
        // make buttons larger for bigger carousel look
        prevBtn.style.padding = '12px 16px'
        prevBtn.style.fontSize = '20px'

        const nextBtn = document.createElement('button')
        nextBtn.className = 'trend-btn next-btn'            
        nextBtn.textContent = '▶'
        nextBtn.style.padding = '12px 16px'
        nextBtn.style.fontSize = '20px'

        const label = document.createElement('div')
        label.className = 'trend-label'                       
        label.style.minWidth = '220px'     // increased
        label.style.maxWidth = '420px'
        label.style.textAlign = 'center'
        label.style.fontWeight = '600'
        label.style.fontSize = '15px'

        const chartWrapper = document.createElement('div')
        chartWrapper.className = 'chart-wrapper'               
        chartWrapper.style.boxSizing = 'border-box'
        chartWrapper.style.position = 'relative'
        // make wrapper bigger
        chartWrapper.style.maxWidth = '920px'
        chartWrapper.style.width = '100%'
        chartWrapper.style.height = '320px'

        chartWrapper.appendChild(document.createElement('div')) // inner div where echarts will mount
        bottomRow.appendChild(prevBtn)
        bottomRow.appendChild(label)
        bottomRow.appendChild(chartWrapper)
        bottomRow.appendChild(nextBtn)

        // Dots indicator (below chart)
        dotsDiv = document.createElement('div')
        dotsDiv.className = 'dots'                             // added clas
        dotsDiv.style.width = '100%'
        dotsDiv.style.marginTop = '12px'
        container.appendChild(bottomRow)
        container.appendChild(dotsDiv)

        miniChartDiv.value = chartWrapper.firstElementChild as HTMLElement
        if (miniChartDiv.value) {
            miniChartDiv.value.style.width = '100%'
            miniChartDiv.value.style.height = '100%'
            miniChart = echarts.init(miniChartDiv.value)
        }

        // Helper actions
        const prevAction = () => {
            if (!categoriesRef.value || categoriesRef.value.length === 0) return
            currentIndex.value = (currentIndex.value - 1 + categoriesRef.value.length) % categoriesRef.value.length
            updateMini(currentIndex.value)
        }
        const nextAction = () => {
            if (!categoriesRef.value || categoriesRef.value.length === 0) return
            currentIndex.value = (currentIndex.value + 1) % categoriesRef.value.length
            updateMini(currentIndex.value)
        }

        // replace style-based dot activation with class toggling
        const updateDotsActive = (i: number) => {
            dotButtons.forEach((btn, idx) => {
            if (idx === i) btn.classList.add('active')
            else btn.classList.remove('active')
            })
        }

        const updateMini = (idx: number) => {
            const cats = categoriesRef.value
            if (!cats || cats.length === 0) {
            label.textContent = 'Keine Kategorien'
            miniChart?.clear()
            return
            }
            const i = ((idx % cats.length) + cats.length) % cats.length
            const cat = cats[i]
            label.textContent = `${cat.name} — ${cat.values.map(v => v ? v.toFixed(2) : '0').join(' / ')}`
            const option = {
            title: { text: `${cat.name} — ${monthLabelFromKey(monthsRef.value[0])} → ${monthLabelFromKey(monthsRef.value[monthsRef.value.length - 1])}`, left: 'center', textStyle: { fontSize: 13 } },
            tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].axisValue}<br/>${p[0].value} €` },
            xAxis: { type: 'category', data: monthsRef.value.map(monthLabelFromKey), axisTick: {show:false}, axisLine: {show:false}, axisLabel:{fontSize:11} },
            yAxis: { type: 'value', axisLine: {show:false}, axisTick: {show:false}, splitLine:{show:false}, axisLabel:{fontSize:11} },
            grid: { left: 10, right: 10, top: 36, bottom: 10, containLabel: true },
            series: [{ data: cat.values, type: 'line', smooth: true, symbol: 'circle', symbolSize: 8, lineStyle:{width:2.5}, itemStyle:{color:'#4e79a7'} }]
            }
            miniChart?.setOption(option)
            updateDotsActive(i)
        }

        // Build dots (use class-based styling)
        dotButtons.length = 0
        dotsDiv.innerHTML = ''
        const cats = categoriesRef.value || []
        for (let i = 0; i < cats.length; i++) {
            const b = document.createElement('button')
            b.className = 'dot'                                   // use dot class
            // enlarge dot visually
            b.style.width = '16px'
            b.style.height = '16px'
            b.style.margin = '0 4px'
            b.title = cats[i].name
            b.onclick = () => {
            currentIndex.value = i
            updateMini(i)
            resetAutoplay()
            }
            dotsDiv.appendChild(b)
            dotButtons.push(b)
        }

        // Wire buttons
        prevBtn.onclick = () => { prevAction(); resetAutoplay() }
        nextBtn.onclick = () => { nextAction(); resetAutoplay() }

        // touch swipe
        chartWrapper.addEventListener('touchstart', (ev) => {
            if (ev.touches && ev.touches[0]) touchStartX = ev.touches[0].clientX
        }, { passive: true })
        chartWrapper.addEventListener('touchend', (ev) => {
            if (touchStartX === null) return
            const x = ev.changedTouches && ev.changedTouches[0] ? ev.changedTouches[0].clientX : null
            if (x === null) { touchStartX = null; return }
            const dx = x - touchStartX
            touchStartX = null
            if (Math.abs(dx) > 40) {
            if (dx > 0) prevAction(); else nextAction()
            resetAutoplay()
            }
        }, { passive: true })

        // keyboard support
            keyHandler = (e: KeyboardEvent) => {
                if (e.key === 'ArrowLeft') { prevAction(); resetAutoplay(); }
                if (e.key === 'ArrowRight') { nextAction(); resetAutoplay(); }
            }
            document.addEventListener('keydown', keyHandler)

        // pause on hover
        const pauseOn = () => { stopAutoplay() }
        const resumeOn = () => { startAutoplay() }
        chartWrapper.addEventListener('mouseenter', pauseOn)
        chartWrapper.addEventListener('mouseleave', resumeOn)
        prevBtn.addEventListener('mouseenter', pauseOn)
        prevBtn.addEventListener('mouseleave', resumeOn)
        nextBtn.addEventListener('mouseenter', pauseOn)
        nextBtn.addEventListener('mouseleave', resumeOn)
        dotsDiv.addEventListener('mouseenter', pauseOn)
        dotsDiv.addEventListener('mouseleave', resumeOn)

        // autoplay
        const startAutoplay = () => {
            if (autoplayInterval !== null) return
            autoplayInterval = window.setInterval(() => {
            nextAction()
            }, 4000)
        }
        const stopAutoplay = () => {
            if (autoplayInterval !== null) {
            clearInterval(autoplayInterval)
            autoplayInterval = null
            }
        }
        const resetAutoplay = () => {
            stopAutoplay()
            startAutoplay()
        }

        // init view
        currentIndex.value = 0
        updateMini(0)

        // init dots active
        updateDotsActive(0)

        // start autoplay
        startAutoplay()

        // handle resize
        resizeHandler = () => {
            leftEchart?.resize()
            rightEchart?.resize()
            miniChart?.resize()
        }
        window.addEventListener('resize', resizeHandler)

    } catch (err) {
        console.error('Failed to initialize charts:', err)
    }
})
</script>

<template>
    <h2>Analysis Area Component</h2>
    <div ref="nativeChartDiv" style="width: 100%; margin-top: 16px;">Loading charts…</div>
</template>

<style scoped>
/* filepath: c:\Users\Paul Fiala\Schule\Spengergasse\SWP\4AHWII\4AHWII-SJ2526-T2\web\src\components\Analysis_area.vue */
/* Carousel styling */
.analysis-container { background: #fff; color: #222; }

.carousel-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px;
  box-sizing: border-box;
  flex-wrap: wrap;
}

/* Prev/Next buttons - enlarged */
.trend-btn {
  background: #f3f4f6;
  border: 1px solid #e3e6ea;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  transition: background .12s, transform .08s;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.trend-btn:hover { background: #e8eaee; transform: translateY(-1px); }

/* Center label - a bit larger */
.trend-label {
  min-width: 200px;
  max-width: 360px;
  text-align: center;
  font-weight: 700;
  color: #222;
  word-break: break-word;
  font-size: 14px;
}

/* Chart wrapper: make carousel bigger */
.chart-wrapper {
  width: 100%;
  max-width: 680px;    /* increased width */
  height: 220px;       /* increased height */
  box-sizing: border-box;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

/* Ensure the inner echarts div fills the wrapper */
.chart-wrapper > div {
  width: 100% !important;
  height: 100% !important;
}

/* Dots - larger and more visible */
.dots {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  width: 100%;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #bbb;
  border: none;
  padding: 0;
  cursor: pointer;
  opacity: 0.75;
  transition: transform .12s, opacity .12s, background .12s;
}
.dot.active {
  background: #4e79a7;
  opacity: 1;
  transform: scale(1.25);
}

@media (max-width: 900px) {
  .carousel-row { gap: 10px; padding: 8px; }
  .trend-label { order: 3; width: 100%; text-align: center; font-size: 13px; }
  .chart-wrapper { max-width: 100%; height: 200px; }
  .trend-btn { padding: 8px; font-size: 16px; min-width: 40px; min-height: 40px; }
  .dot { width: 11px; height: 11px; }
}

@media (max-width: 560px) {
  .carousel-row { gap: 8px; }
  .trend-label { order: 3; width: 100%; text-align: center; }
  .chart-wrapper { max-width: 100%; height: 180px; }
  .trend-btn { padding: 8px; }
}
</style>
