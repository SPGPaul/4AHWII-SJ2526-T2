<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { VChart } from 'vue-echarts';
import 'echarts/lib/echarts';
import * as echarts from 'echarts';

const options = ref({
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
    }
});

const series = ref([
    {
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'bar'
    }
]);

onMounted(() => {
});
</script>

<template>
    <h2>Analysis Area Component</h2>
    <v-chart
          :options="options"
          :series="series"
     />
</template>

<style scoped>
</style>