<template>
  <q-page class="q-pa-lg dashboard-page">
    <!-- Header Section -->
    <div class="page-header q-mb-lg">
      <template v-if="authStore.isLoading">
        <q-skeleton type="text" width="200px" />
      </template>
      <!-- Loaded State -->
      <div class="text-h5 text-weight-bold">
        <!-- Use barangay_name instead of barangay.name -->

      </div>
<div class="welcome-user"> Welcome Back, {{ authStore.user?.first_name || 'Guest'   }}<span>
  <br>
  <span class="text-caption text-white">Here's a quick overview of your dashboard</span>

</span>

</div>


    </div>


    <div class="row q-col-gutter-lg q-mb-lg">
      <div
        class="col-xl-3 col-lg-4 col-md-6 col-sm-12"
        v-for="(card, index) in summaryCards"
        :key="index"
      >

        <q-card class="summary-card" :class="`card-${index}`">
          <q-card-section class="row items-center justify-center q-pa-md" style="height: 100%">
            <div class="row items-center" style="max-width: 90%">
              <q-avatar
                :icon="card.icon"
                size="45px"
                :color="card.color || 'primary'"
                text-color="white"
                class="q-mr-md"
              />
              <div class="text-left">
                <div class="text-caption text-grey">{{ card.label }}</div>
                <div class="text-h5 text-weight-bold">{{ card.value }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-lg-6 col-md-12">
        <q-card class="chart-card">
          <q-card-section>
            <div class="text-h6 text-weight-medium">Commitment Distribution</div>
            <div class="text-caption text-grey-6">Current Year</div>
          </q-card-section>
          <q-separator />
          <q-card-section style="height: 350px; position: relative">
            <div v-if="chartLoading" class="absolute-center">
              <q-spinner color="primary" size="3em" />
            </div>
            <PieChart v-else :chart-data="pieChartData" :options="chartOptions" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-lg-6 col-md-12">
        <q-card class="chart-card">
          <q-card-section>
            <div class="text-h6 text-weight-medium">Recent Liquidated Disbursements</div>
            <div class="text-caption text-grey-6">Current year</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-table
              :rows="recentDisbursementRows"
              :columns="recentDisbursementColumns"
              row-key="id"
              flat
              bordered
              :pagination="{ rowsPerPage: 4 }"
              class="disbursement-table"
            >
              <!-- Highlight fully liquidated rows -->
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useChartDataStore } from 'src/stores/chartDataStore'
import { useAppropriationStore } from 'stores/appropriationStore'
import { storeToRefs } from 'pinia'
import PieChart from 'components/PieChart.vue' // Update the import
import { useAuthStore } from 'stores/auth'
import { api } from 'boot/axios'
//import { useQuasar } from 'quasar'
const chartLoading = ref(true)
const appropriationStore = useAppropriationStore()
const authStore = useAuthStore()
//const $q = useQuasar()
// 1. Date Pickers UI State

// 2. Store Connection
const chartStore = useChartDataStore()
const { summaryCards, recentDisbursementRows, recentDisbursementColumns } = storeToRefs(chartStore)

/// Pie chart data
const pieChartData = ref({
  labels: [],
  datasets: [
    {
      data: [],
      backgroundColor: [
        '#2E7D32',
        '#1565C0',
        '#FFA000',
        '#C62828',
        '#6A1B9A',
        '#00838F',
        '#EF6C00',
        '#4E342E',
        '#AD1457', // deep pink
        '#00796B', // teal green
        '#5D4037', // brown
        '#4527A0', // deep purple
        '#689F38', // lime green
        '#D84315', // burnt orange
        '#283593', // indigo
        '#F4511E', // vibrant orange
        '#00695C', // dark cyan
        '#512DA8',
      ],
      borderWidth: 0,
      hoverOffset: 12,
    },
  ],
})

// Chart options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'left', // Changed from 'center' to match the example
      labels: {
        position: 'left',
        boxWidth: 12,
        boxHeight: 12,

        fontColor: '#fff',
        padding: 15,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: '#1e1e1e',
      titleFont: {
        size: 14,
        weight: 'bold',
      },
      bodyFont: {
        size: 12,
      },
      callbacks: {
        label: (context) => {
          const label = context.label || ''
          const value = context.raw
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = Math.round((value / total) * 100)
          return `${label}: ${appropriationStore.formatCurrency(value)} (${percentage}%)`
        },
      },
    },
  },
}))

// Load data for pie chart
const loadPieChartData = async () => {
  chartLoading.value = true

  try {
    // 1. Load expense hierarchy first
    if (!appropriationStore.expenseHierarchy?.length) {
      await appropriationStore.fetchExpenseHierarchy()
    }

    // 2. Load budgets if needed
    if (appropriationStore.appropriations.length === 0) {
      await appropriationStore.fetchBudgets()
    }

    // 3. Process allocations if we have budgets
    if (appropriationStore.appropriations.length > 0) {
      const authConfig = {
        headers: { Authorization: `Bearer ${authStore.token}` },
      }

      // Fetch allocations for all budgets
      const responses = await Promise.all(
        appropriationStore.appropriations.map((budget) =>
          api.get(`/api/barangay/budgets/${budget.id}/allocations`, authConfig),
        ),
      )

      // Combine and process allocations
      const allAllocations = responses.flatMap((r) => r.data.data || [])
      await appropriationStore.processCombinedAllocations(allAllocations)
    }

    updateChartFromStore()
  } catch (error) {
    console.error('Error loading chart data:', error)
    // Show error state in chart
    pieChartData.value = {
      labels: ['Error Loading Data'],
      datasets: [
        {
          data: [1],
          backgroundColor: ['#C62828'],
          borderWidth: 0,
        },
      ],

    }
  } finally {
    chartLoading.value = false
  }
} // Track loading state

// Update chart when store data changes
const updateChartFromStore = () => {
  const classTotals = appropriationStore.expenseClassTotals

  if (!classTotals?.length) {
    console.warn('No data available')
    pieChartData.value = {
      labels: ['No Data'],
      datasets: [
        {
          data: [1],
          backgroundColor: ['#FFA000'],
          borderWidth: 0,
        },
      ],
    }
    return
  }

  pieChartData.value = {
    labels: classTotals.map((c) => c.name),
    datasets: [
      {
        data: classTotals.map((c) => c.total),
        backgroundColor: pieChartData.value.datasets[0].backgroundColor,
        borderWidth: 0,
      },
    ],
  }
}

// Watch for changes in allocations
watch(
  () => appropriationStore.expenseClassTotals,
  (newVal) => {
    console.log('Updated class totals:', newVal)
  },
  { deep: true },
)

// Load data when component mounts
onMounted(() => {
  loadPieChartData()
})
</script>

<style lang="scss" scoped>
.dashboard-header {
  .text-h5 {
    color: #bddabe;
  }
}

.filter-card {
  border-radius: 1px;
  box-shadow: 0 2px 15px rgba(102, 96, 96, 0.05);
}

.summary-card {
  position: sticky;
  min-height: 120px !important; /* Override any defaults */
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  height: 100%;
    background-color: #C2FFC2;
    overflow-y: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(88, 178, 101, 0.321);
  }

  &.card-0 {
    border-top: 4px solid rgba(88, 178, 101, 1);
    background-color: white;
  }
  &.card-1 {
    border-top: 4px solid rgba(88, 178, 101, 1);
      background-color: white;
  }
  &.card-2 {
    border-top: 4px solid rgba(88, 178, 101, 1);
      background-color: white;
  }
}

.chart-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
  background-color: white;


  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(88, 178, 101, 0.321);
  }

  .q-card__section {
    &:first-child {
      padding-bottom: 7px;
    }
    &:last-child {
      height: 350px;
      padding-top: 1;
    }
  }
}

// Responsive adjustments
@media (max-width: $breakpoint-xs-max) {
  .summary-card {
    margin-bottom: 16px;
  }
}

.custom-rounded-input :deep(.q-field__control) {
  border-radius: 10px;
  width: 250px;
}

/* Legend adjustments */
:deep(.chartjs-legend) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 10px;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  li {
    display: flex;
    align-items: center;
    cursor: pointer;

    span {
      display: inline-block;
      width: 12px;
      height: 12px;
      margin-right: 8px;
      border-radius: 50%;
    }
  }
}
.welcome-user {

  font-weight: bold;
  color: Black; /* Dark green */
  margin-top: -10px;


}
.dashboard-page{
  background: #D9D9D9;
}
</style>
