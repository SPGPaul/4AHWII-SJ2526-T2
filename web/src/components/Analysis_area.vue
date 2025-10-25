<script setup lang="ts">
import VChart from 'vue-echarts'

// Register required ECharts renderers / charts / components
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { UniversalTransition } from 'echarts/features'
import * as echarts from 'echarts/core'
import { onMounted, ref } from 'vue'
import { watch } from 'vue'
// removed unused imports (cleaner build)


async function loadChartData(){
    const apiUrl = "https://elegant-eggs-b247740f2b.strapiapp.com/api/Receipts";
    const token = "54a258000325fcbff04e65b292fecd2ca70258552324762fd2520e1932269765803183eb47586c2203f12b3abd7c7dbbe3dffe729c8334508eeba14656a85aa5bb7441ec939788a76a8a7e6066b1973362e5cdb6770a50dbecf0d74a4bcebe7c650eb54f08b757e0770003032e5817aa26dc6664c373e2c2e8667888d2d3f2c1";
    const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    console.log('Fetch response:', res);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    return await res.json();
}

async function renderPieChart() {
    const data = await loadChartData();
    const items = Array.isArray(data?.data) ? data.data : [];

    const dataTime = items.map((it: any) => it?.date ?? '');
    const dataValue = items.map((it: any) => {
        const v = it?.amount;
        return typeof v === 'number' ? v : (v ? Number(v) : 0);
    });
    const category = items.map((it: any) => it?.category ?? 'Unbekannt');

    const displayedTime = dataTime.slice(0, 7);
    const displayedValue = dataValue.slice(0, 7);
    const displayedCategory = category.slice(0, 7);

    use([
        CanvasRenderer,
        PieChart,
        TitleComponent,
        TooltipComponent,
        GridComponent,
        UniversalTransition
    ]);

    const chartRef = ref(null);

    const pieData = displayedCategory.map((name, idx) => ({
        name,
        value: displayedValue[idx] ?? 0
    }));

    const series = [
        {
            name: 'Ausgaben',
            type: 'pie',
            radius: '50%',
            center: ['50%', '55%'],
            data: pieData,
            label: {
                formatter: '{b}: {c} ({d}%)'
            },
          
        }
    ];

    const options = {
        color: ['lightblue', 'lightgreen', 'lightcoral', 'lightsalmon', 'lightseagreen', 'lightpink', 'lightgray'],
        backgroundColor: '#FFFFFF',
        title: {
            text: 'Ausgaben (nach Kategorie)',
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: displayedCategory
        },
        series
    };

    watch(() => options, (val) => {
        console.log('Pie chart options changed:', val);
    });

    return { options, chartRef };
}




async function renderBarChart(){
    const data = await loadChartData();
    const dataTime = Array.isArray(data?.date) ? data.date : [];
    const dataValue = Array.isArray(data?.amount) ? data.amount : [];
    const category = Array.isArray(data?.category) ? data.category : [];

    const displayedTime = dataTime.slice(0,7);
    const displayedValue = dataValue.slice(0,7);
    const displayedCategory = category.slice(0,7);

    use([
        CanvasRenderer,
        BarChart,
        TitleComponent,
        TooltipComponent,
        GridComponent,
        UniversalTransition
    ])
    const chartRef = ref(null)
    const series = [
        {
            data: displayedValue,
            type: 'bar',
            itemStyle: {
                color: 'blue'
            },
        }
    ]
    const options = {
        text:{
            color: "white"
        },
        title: {
            text: 'Ausgaben'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        grid: {
            left: '5%',
            right: '5%',
            bottom: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: displayedTime
        },
        yAxis: {
            type: 'value'
        },
        series
    }

    watch(() => options, (val) => {
        console.log('Chart options changed:', val)
    })
}


use([
    CanvasRenderer,
    BarChart,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    UniversalTransition
])

const chartRef = ref(null)
const series = [
    {
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'bar',
        itemStyle: {
            color: 'lightblue'
        },
    }
]

const options = {
    backgroundColor: '#FFFFFF',
    title: {
        text: 'Ausgaben'
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross'
        }
    },
    grid: {
        left: '5%',
        right: '5%',
        bottom: '5%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
    },
    yAxis: {
        type: 'value'
    },
    
    series
}

// Native ECharts test: initialize with pie chart options on mount
const nativeChartDiv = ref(null)
onMounted(async () => {
    if (!nativeChartDiv.value) return
    try {
        const { options: pieOptions } = await renderPieChart()
        const chart = echarts.init(nativeChartDiv.value)
        chart.setOption(pieOptions)
        console.log('Pie chart initialized')
    } catch (err) {
        console.error('Failed to initialize pie chart:', err)
    }
})
</script>

<template>
    <h2>Analysis Area Component</h2>
    <div ref="nativeChartDiv" style="height: 400px; width: 40%; background: #444; margin-top: 16px;">Ausgaben </div>
</template>
