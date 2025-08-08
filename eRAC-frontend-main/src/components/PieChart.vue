<template>
  <div class="chart-container" style="height: 100%; width: 100%">
    <canvas ref="chartCanvas"></canvas>
    <div v-if="chartError" class="text-center q-pa-md text-negative">{{ chartError }}</div>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref, watch, nextTick } from 'vue'
import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js'

// Register Chart.js components
Chart.register(PieController, ArcElement, Tooltip, Legend)

export default defineComponent({
  name: 'PieChart',
  props: {
    chartData: {
      type: Object,
      required: true,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const chartCanvas = ref(null)
    const chartError = ref(null)
    let chartInstance = null

    const renderChart = () => {
      try {
        if (!chartCanvas.value) {
          console.warn('Canvas element not available')
          return
        }

        // Validate data
        if (!props.chartData.labels || !props.chartData.datasets || !props.chartData.datasets[0]) {
          console.error('Invalid chart data structure')
          chartError.value = 'Invalid chart data'
          return
        }

        // Destroy previous instance if exists
        if (chartInstance) {
          chartInstance.destroy()
        }

        // Create new chart instance
        chartInstance = new Chart(chartCanvas.value, {
          type: 'pie',
          data: props.chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            ...props.options,
            elements: {
              arc: {
                borderWidth: 0,
                hoverBorderWidth: 2,
                hoverBorderColor: '#ffffff',
                hoverOffset: 15,
              },
            },
          },
        })

        chartError.value = null
      } catch (error) {
        console.error('Error rendering chart:', error)
        chartError.value = 'Error rendering chart: ' + error.message
      }
    }

    // Watch for data changes
    watch(
      () => props.chartData,
      () => {
        nextTick(() => {
          renderChart()
        })
      },
      { deep: true },
    )

    // Initialize on mount
    onMounted(() => {
      nextTick(() => {
        renderChart()
      })
    })

    return { chartCanvas, chartError }
  },
})
</script>

<style scoped>
.chart-container {
  padding-left: 20px; /* Adjust based on your legend width */
}

/* Enhanced hover effects */
:deep(.chartjs-render-monitor) {
  transition: transform 0.3s ease;
}

:deep(.chartjs-render-monitor:hover) {
  transform: scale(1.02);
}
</style>
