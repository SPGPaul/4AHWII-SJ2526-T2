<script setup lang ="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { UniversalTransition } from 'echarts/features'
import * as echarts from 'echarts/core'
import { onMounted, ref } from 'vue'
import { watch } from 'vue'

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

const changeRate = ref<string>('...');
const changeColor = ref<string>('black');

async function refreshChangeRate() {
    try {
        const rate = await calculateChangeRate();
        const prefix = rate > 0 ? 'Δ' : '∇';
        changeRate.value = `${prefix}${rate}%`;
        const color = rate > 0 ? 'red' : 'green';
        changeColor.value = color;
        return color;
    } catch (e) {
        console.error(e);
        changeRate.value = 'n/a';
        changeColor.value = 'black';
    }
}

const expensesThisMonth = ref<number | null>(null);

onMounted(async () => {
    await refreshChangeRate();
    expensesThisMonth.value = await getAllExpensesMonth();
});
</script>


<template>
<div>
    <h1 class="dashboard-card__header" style="color:black">Übersicht</h1>
    <div class="dashboard-card__body">
        <h3 style="color:black">{{ expensesThisMonth }}€ Ausgaben im letzten Monat</h3>
        <h3 style="color:black" id="changeRateLM" :style="{ color: changeColor }">{{ changeRate }} im Vergleich zum letzten Monat</h3>
    </div>
  </div>
</template>
