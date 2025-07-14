<template>
  <q-card flat class="q-pa-md">
    <canvas ref="chartCanvas"></canvas>
  </q-card>
</template>

<script>
import { defineComponent, onMounted, ref, watch } from 'vue'
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

export default defineComponent({
  props: {
    chartData: Object,
  },
  setup(props) {
    const chartCanvas = ref(null)
    let chartInstance = null

    const createChart = () => {
      if (chartInstance) {
        chartInstance.destroy()
      }
      chartInstance = new Chart(chartCanvas.value, {
        type: 'doughnut',
        data: props.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
          },
        },
      })
    }

    watch(() => props.chartData, createChart, { deep: true })
    onMounted(createChart)

    return { chartCanvas }
  },
})
</script>
