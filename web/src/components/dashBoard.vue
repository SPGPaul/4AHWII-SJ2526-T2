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

function getUnixTime() {
    const unixSeconds = Math.floor(Date.now() / 1000);
    return unixSeconds;
}


function getLastMonthUnix(){
    const currentDate = getUnixTime();
    const lastMonthDate = currentDate - (30 * 24 * 60 * 60);
    return lastMonthDate;
}

function getPrevLastMonthUnix(){
    const currentDate = getUnixTime();
    const prevLastMonthDate = currentDate - (61 * 24 * 60 * 60);
    return prevLastMonthDate;
}

async function getExpnesesLastMonth(){
    const data = await parseChartData();
    let lastMonthList = [];
    let prevLastMonthList = [];
    for(let i = 0; i < data.length; i++){
        if(data[i].unix_time >= getLastMonthUnix()){
            lastMonthList.push(data[i]);
        } else if(data[i].unix_time >= getPrevLastMonthUnix() && data[i].unix_time < getLastMonthUnix()){
            prevLastMonthList.push(data[i]);
        }
    }
    console.log('Last month items:', lastMonthList);
    console.log('Previous month items:', prevLastMonthList);
       
}
getExpnesesLastMonth();
</script>


<template>
  <div class="dashboard">
    <h1 style="color:black">Dashboard</h1>
    
  </div>
</template>