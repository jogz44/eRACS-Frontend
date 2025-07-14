import { ref } from 'vue'

export function useChartData() {
  // Enhanced Summary Cards Data
  const summaryCards = ref([
    {
      label: 'Total Appropriation',
      value: '₱50,000,000.00',
      icon: 'account_balance',
      color: 'secondary',
      trend: 'up',
      change: '2.5%',
    },
    {
      label: 'Total Obligation',
      value: '₱21,000,000.00',
      icon: 'assignment',
      color: 'secondary',
      trend: 'down',
      change: '1.2%',
    },
    {
      label: 'Total Balance',
      value: '₱29,000,000.00',
      icon: 'balance',
      color: 'secondary',
      trend: 'up',
      change: '3.8%',
    },
  ])
  // Modern Doughnut Chart Data
  const doughnutChartData = ref({
    labels: [
      'MOOE',
      'Personal Services',
      'Capital Outlay',
      'MOOE',
      'Personal Services',
      'Capital Outlay',
      'MOOE',
      'Personal Services',
    ],
    datasets: [
      {
        data: [35000, 25000, 40000, 35000, 25000, 40000, 35000, 25000],
        backgroundColor: [
          '#2E7D32', // Green
          '#1565C0', // Blue
          '#FFA000', // Amber
        ],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  })

  // Chart Options (New)
  const chartOptions = {
    line: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return ` ${context.dataset.label}: ₱${context.raw.toLocaleString()}`
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => `₱${value.toLocaleString()}`,
          },
        },
      },
    },
    doughnut: {
      responsive: true,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
        },
      },
    },
  }

  return {
    summaryCards,
    doughnutChartData,
    chartOptions, // Include the new options
  }
}
