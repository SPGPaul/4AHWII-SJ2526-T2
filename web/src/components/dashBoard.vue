<script setup lang ="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { UniversalTransition } from 'echarts/features'
import * as echarts from 'echarts/core'
import { onMounted, ref } from 'vue'

async function loadChartData(){
    const apiUrl = "https://elegant-eggs-b247740f2b.strapiapp.com/api/Receipts";
    const token = "54a258000325fcbff04e65b292fecd2ca70258552324762fd2520e1932269765803183eb47586c2203f12b3abd7c7dbbe3dffe729c8334508eeba14656a85aa5bb7441ec939788a76a8a7e6066b1973362e5cdb6770a50dbecf0d74a4bcebe7c650eb54f08b757e0770003032e5817aa26dc6664c373e2c2e8667888d2d3f2c1";
    const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    return await res.json();
}

async function parseChartData(): Promise<any[]>{
    const data = await loadChartData();
    const items = Array.isArray(data?.data) ? data.data : [];
    console.log('Parsed items:', items);    
    return items;
}

function toUnixSeconds(dateStr: string | number | Date) {
    const d = typeof dateStr === 'number' || dateStr instanceof Date ? new Date(dateStr) : new Date(String(dateStr));
    const t = Math.floor(d.getTime() / 1000);
    return Number.isFinite(t) ? t : NaN;
}

function getUnixTime() {
    return Math.floor(Date.now() / 1000);
}

function getLastMonthUnix() {
    return getUnixTime() - (30 * 24 * 60 * 60);
}

function getPrevLastMonthUnix() {
    return getUnixTime() - (61 * 24 * 60 * 60);
}

async function getExpnesesLastMonth() {
    const data = await parseChartData();
    const lastMonthList: any[] = [];
    const prevLastMonthList: any[] = [];

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const itemUnix = item.unix_time ?? toUnixSeconds(item.date);

        if (Number.isNaN(itemUnix)) {
            console.warn('Skipping item with invalid date/unix_time:', item);
            continue;
        }

        if (itemUnix >= getLastMonthUnix()) {
            lastMonthList.push(item);
        } else if (itemUnix >= getPrevLastMonthUnix() && itemUnix < getLastMonthUnix()) {
            prevLastMonthList.push(item);
        }
    }

    return { lastMonthList, prevLastMonthList };
}


async function calculateChangeRate()
{
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
                const amount = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.')) || 0;
                expensesThisMonth += amount;
            }
        }
        // round to 2 decimals
        return Math.round(expensesThisMonth * 100) / 100;
    } catch (e) {
        console.error(e);
        return 0;
    }
}

const expensesThisMonth = ref<number>(0)
const changeRate = ref<string>('...')
const changeColor = ref<string>('black')
const receiptCount = ref<number>(0)
const barChartDiv = ref(null)

function formatEuro(val: number) {
    return `${val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
}

async function getBarChartData() {
    const data = await parseChartData();
    // Only current month
    const filtered = data.filter(it => {
        const itemUnix = it.unix_time ?? toUnixSeconds(it.date);
        return !Number.isNaN(itemUnix) && itemUnix >= getLastMonthUnix();
    });
    // Aggregate by category
    const agg: Record<string, number> = {};
    for (const it of filtered) {
        const cat = it.category ?? 'Unbekannt';
        const raw = it.amount ?? it.total ?? 0;
        const val = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.')) || 0;
        agg[cat] = (agg[cat] || 0) + val;
    }
    // Sort by value descending
    const sorted = Object.entries(agg).sort((a, b) => b[1] - a[1]);
    // Top 5 biggest categories
    const top = sorted.slice(0, 5);
    return top.map(([cat, val]) => ({ category: cat, value: Math.round(val * 100) / 100 }));
}

async function refreshStats() {
    const data = await parseChartData();
    receiptCount.value = data.length;
    // Expenses this month
    const filtered = data.filter(it => {
        const itemUnix = it.unix_time ?? toUnixSeconds(it.date);
        return !Number.isNaN(itemUnix) && itemUnix >= getLastMonthUnix();
    });
    expensesThisMonth.value = filtered.reduce((sum, it) => {
        const raw = it.amount ?? it.total ?? 0;
        const val = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.')) || 0;
        return sum + val;
    }, 0);
    // Previous month
    const prevFiltered = data.filter(it => {
        const itemUnix = it.unix_time ?? toUnixSeconds(it.date);
        return !Number.isNaN(itemUnix) && itemUnix >= getPrevLastMonthUnix() && itemUnix < getLastMonthUnix();
    });
    const prevSum = prevFiltered.reduce((sum, it) => {
        const raw = it.amount ?? it.total ?? 0;
        const val = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.')) || 0;
        return sum + val;
    }, 0);
    // Change rate
    const prev = prevSum || 1;
    const rawPercent = ((expensesThisMonth.value - prev) / prev) * 100;
    const percentailChange = Math.round(rawPercent * 10) / 10;
    const prefix = percentailChange > 0 ? 'Δ +' : '∇ ';
    changeRate.value = `${prefix}${percentailChange}% im Vergleich zum Vormonat`;
    changeColor.value = percentailChange > 0 ? '#f44336' : '#4caf50';
}

async function loadImages(){
    
}

const palette = ['#ffa726', '#ffccbc', '#4dd0e1', '#aed581', '#ba68c8'];

onMounted(async () => {
    await refreshStats();
    // Bar chart
    const chartData = await getBarChartData();
    if (barChartDiv.value) {
        use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent, UniversalTransition]);
        const chart = echarts.init(barChartDiv.value);
        chart.setOption({
            color: palette,
            grid: { left: '2%', right: '2%', top: 30, bottom: 30, containLabel: true },
            xAxis: {
                type: 'value',
                axisLabel: {
                    formatter: (val: number) => formatEuro(val),
                    color: '#222',
                },
                splitLine: { show: false },
            },
            yAxis: {
                type: 'category',
                data: chartData.map(d => d.category),
                axisLabel: { color: '#222', fontWeight: 'bold' },
                axisTick: { show: false },
                axisLine: { show: false },
            },
            series: [{
                type: 'bar',
                data: chartData.map((d, i) => ({
                    value: d.value,
                    itemStyle: { color: palette[i % palette.length] }
                })),
                barWidth: 30,
                label: {
                    show: true,
                    position: 'right',
                    formatter: (params: any) => formatEuro(params.value),
                    fontWeight: 'bold',
                    color: '#222'
                },
            }],
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params: any) => {
                    const p = Array.isArray(params) ? params[0] : params;
                    return `${p.name}: ${formatEuro(p.value)}`;
                },
                backgroundColor: '#fff',
                textStyle: { color: '#222' },
            },
            title: { text: '', left: 'center', top: 0 },
        });
    }
});
</script>



<template>
<div style="width:100%;max-width:900px;margin:0 auto;padding:32px 0;">
    <h1 style="font-size:2.5rem;font-weight:700;color:#222;margin-bottom:0.5em;">Dashboard</h1>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5em;">
        <div style="font-size:1.5rem;font-weight:500;color:#222;">Gesamtausgaben November: {{ formatEuro(expensesThisMonth) }}</div>
        <div :style="{fontSize:'1.5rem',fontWeight:'500',color:changeColor}">{{ changeRate }}</div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:32px;">
        <div style="flex:2;">
            <div ref="barChartDiv" style="height:220px;width:100%;"></div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="font-size:4rem;font-weight:700;color:#222;line-height:1;">{{ receiptCount }}</div>
            <div style="font-size:1.2rem;color:#222;">Belege gesamt gescannt</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <button type="button" style="padding:12px 24px;font-size:1rem;font-weight:600;color:#fff;background-color:#1976d2;border:none;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-3h6l2 3h3a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                </svg>
                Scan
            </button>
        </div>
    </div>
</div>
</template>
