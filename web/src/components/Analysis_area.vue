<script setup lang="ts">
import VChart from 'vue-echarts'

// Register required ECharts renderers / charts / components
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { UniversalTransition } from 'echarts/features'
import * as echarts from 'echarts/core'
import { onMounted, ref } from 'vue'
import { watch } from 'vue'
import { useBackgroundColor } from 'vuetify/lib/composables/color.mjs'
import { collect } from 'echarts/types/src/component/axisPointer/modelHelper.js'

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
            color: 'red'
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
        data: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
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
</script>

<template>
    <h2>Analysis Area Component</h2>
    <div ref="nativeChartDiv" style="height: 400px; width: 40%; background: #444; margin-top: 16px;">Ausgaben </div>
</template>
