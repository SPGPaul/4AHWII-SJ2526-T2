<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { UniversalTransition } from 'echarts/features'
import * as echarts from 'echarts/core'
import { onMounted, ref } from 'vue'
import { watch } from 'vue'

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

    use([
        CanvasRenderer,
        PieChart,
        TitleComponent,
        TooltipComponent,
        GridComponent,
        UniversalTransition
    ]);

    const chartRef = ref(null);

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
            label: {
                formatter: '{b}: {c} ({d}%)'
            }
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
            formatter: '{b}: {c}€ ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: pieData.map(d => d.name)
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
        }
    ]
    const options = {
        color: ['lightblue', 'lightgreen', 'lightcoral', 'lightsalmon', 'lightseagreen', 'lightpink', 'lightgray'],
        backgroundColor: '#FFFFFF',
        title: {
            text: 'Ausgaben'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            formatter: (params: any) => {
                const p = Array.isArray(params) ? params[0] : params
                const idx = p?.dataIndex ?? 0
                const dateLabel = formatDateFull(displayedTimeRaw[idx])
                return `${dateLabel}<br/>Wert: ${p.value} €`
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
            data: displayedTime,
            axisLabel: { rotate: 25 }
        },
        yAxis: {
            type: 'value'
        },
        series
    }

    watch(() => options, (val) => {
        console.log('Chart options changed:', val)
    })
    return { options, chartRef };
}

const nativeChartDiv = ref(null)
onMounted(async () => {
    if (!nativeChartDiv.value) return
    try {
        const { options: pieOptions } = await renderPieChart()
        const { options: barOptions } = await renderBarChart()

        const container = nativeChartDiv.value as HTMLElement
        container.style.display = 'flex'
        container.style.alignItems = 'stretch'
        container.innerHTML = ''

        const leftDiv = document.createElement('div')
        const rightDiv = document.createElement('div')

        leftDiv.style.flex = '1'
        rightDiv.style.flex = '1'
        leftDiv.style.height = '100%'
        rightDiv.style.height = '100%'
        leftDiv.style.minWidth = '0'
        rightDiv.style.minWidth = '0'
        leftDiv.style.padding = '8px'
        rightDiv.style.padding = '8px'

        container.appendChild(leftDiv)
        container.appendChild(rightDiv)

        const chartLeft = echarts.init(leftDiv)
        const chartRight = echarts.init(rightDiv)

        chartLeft.setOption(pieOptions)
        chartRight.setOption(barOptions)

        const resizeHandler = () => {
            chartLeft.resize()
            chartRight.resize()
        }
        window.addEventListener('resize', resizeHandler)

        console.log('Both charts initialized side-by-side')
    } catch (err) {
        console.error('Failed to initialize charts:', err)
    }
})
</script>

<template>
    <h2>Analysis Area Component</h2>
    <div ref="nativeChartDiv" style="height: 400px; width: 40%; background: #FFFFFF; margin-top: 16px;">Ausgaben </div>
</template>
