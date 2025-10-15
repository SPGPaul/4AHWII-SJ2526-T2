<script setup lang="ts">
import VChart from 'vue-echarts'

// Register required ECharts renderers / charts / components
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { UniversalTransition } from 'echarts/features'

use([
    CanvasRenderer,
    BarChart,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    UniversalTransition
])

import * as echarts from 'echarts/core'
import { onMounted, ref } from 'vue'
import { watch } from 'vue'
const chartRef = ref(null)
const series = [
    {
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'bar',
        itemStyle: {
            color: 'white'
        }
    }
]

const options = {
    title: {
        text: 'ECharts entry example'
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
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
        type: 'value'
    },
    series
}

// Native ECharts test
const nativeChartDiv = ref(null)
onMounted(() => {
    if (nativeChartDiv.value) {
        const chart = echarts.init(nativeChartDiv.value)
        chart.setOption(options)
        console.log('Native ECharts chart initialized:', chart)
    }
})

// Watch for changes to options
watch(() => options, (val) => {
    console.log('Chart options changed:', val)
})
onMounted(() => {
    console.log('echarts import:', echarts)
    console.log('VChart component should be mounted now')
    console.log('chartRef.value:', chartRef.value)
    if (chartRef.value && chartRef.value.echarts) {
        console.log('ECharts instance:', chartRef.value.echarts)
    } else {
        console.warn('VChart ref or echarts instance not found!')
    }
})
</script>

<template>
    <h2>Analysis Area Component</h2>
        <VChart ref="chartRef" :options="options" style="height: 400px; width: 100%; background: #222;" />
        <div ref="nativeChartDiv" style="height: 400px; width: 100%; background: #444; margin-top: 16px;">Native ECharts Test</div>
    <p>This is a paragraph below the chart.</p>
</template>
