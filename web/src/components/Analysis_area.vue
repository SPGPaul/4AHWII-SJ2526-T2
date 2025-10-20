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


function loadBarChartData(){
    const apiUrl = "https://blessed-egg-5bd7b2fc4f.strapiapp.com/api/articles";
    const token = "30bc7c7dae9e8436df20b65b13e31ae8c5bb8bd3781cf429029038cc46e7bfc3a915ef15b0f3ca510d7693fde5e6a5290412c36af4c97860ae444f35c371c3414fd09fe35a73b7fe5a2ca8e65108c5d61a6167d0c00ee6411f3bc935cc01ea977c72d26818f55f2905f3ac5aaab574e033a2d1ccaeae4ee12631fd5bcc673e0a";
          fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json", 
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Netzwerkantwort war nicht erfolgreich: " + response.statusText
            );
          }
          return response.json();
        })
        .then((data) => {
          return data;
        })
        .catch((error) => {
          console.error("Fehler bei der Fetch-Operation:", error);
        });
}
/*
function renderBarChart(){
    const data = loadBarChartData();
    const dataTime[] = data.Time;
    const dataValue[] = data.Value;
    const category[] = data.Category;

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



*/
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
