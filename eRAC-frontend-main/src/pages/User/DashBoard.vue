<template>
  <q-page class="q-pa-lg dashboard-page">
    <!-- Header Section -->
    <div class="page-header q-mb-lg row items-center">
      <div class="col-12 col-md">
        <div class="welcome-user text-accent">
          Welcome Back, {{ authStore.user?.first_name || 'Guest' }}
          <div class="Custom-caption text-caption text-black">
            Here's a quick overview of your dashboard
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Cards Row -->
    <div class="row q-col-gutter-lg q-mb-lg">
      <div
        v-for="(card, index) in chartStore.summaryCards"
        :key="index"
        class="col-xs-12 col-sm-6 col-md-4 q-mb-md"
      >
        <q-card class="summary-card" :class="`card-${index}`">
          <q-card-section class="row items-center justify-evenly q-pa-md" style="height: 100%">
            <div class="row items-center" style="max-width: 90%">
              <q-avatar
                :icon="card.icon"
                size="45px"
                :color="card.color || 'primary'"
                text-color="white"
                class="q-mr-md"
              />
              <div class="text-left">
                <div class="Custome-text text-caption text-grey">{{ card.label }}</div>
                <div class="text-h5 text-weight-bold">{{ card.value }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="row q-col-gutter-lg chart-section">
      <div class="col-xs-12 col-md-6 q-mb-md">
        <q-card class="chart-card responsive-card">
          <q-card-section>
            <div class="text-h6 text-weight-medium">Commitment Distribution</div>
            <div class="text-caption text-grey-6">Current year</div>
          </q-card-section>
          <q-separator />
          <q-card-section style="height: 350px; position: relative; width: 100%; overflow-x: auto">
            <div v-if="chartStore.chartLoading" class="absolute-center">
              <q-spinner color="primary" size="3em" />
            </div>
            <PieChart v-else :chart-data="chartStore.pieChartData" :options="chartOptions" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-xs-12 col-md-6 q-mb-md">
        <q-card class="chart-card responsive-card">
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="text-h6 text-weight-medium">Disbursement Overview</div>
              <div class="row q-gutter-sm ">
                <div
                  v-for="status in ['Pending', 'Partial', 'Liquidated']"
                  :key="status"
                  class="status-count-chip"
                  :class="{ active: selectedDisbursementFilter === status }"
                  @click="selectedDisbursementFilter = status"
                >
                  <q-chip
                    :color="getStatusColor(status)"
                    text-color="white"
                    size="sm"
                    :label="`${status}: ${getStatusCount(status)}`"
                    clickable
                  />
                </div>
              </div>
            </div>

            <div class="text-caption text-grey-6">Current year</div>

            <!-- Filter Controls and Refresh -->
            <div class="row q-gutter-sm q-mt-md items-center justify-between">
              <div class="row q-gutter-sm">
                <q-btn
                  v-for="filter in disbursementFilters"
                  :key="filter.value"
                  :label="filter.label"
                  :color="getFilterButtonColor(filter.value)"
                  :text-color="getFilterButtonTextColor(filter.value)"
                  :outline="selectedDisbursementFilter !== filter.value"
                  size="sm"
                  @click="selectedDisbursementFilter = filter.value"
                  class="filter-btn"
                />
              </div>

              <q-btn
                icon="refresh"
                color="primary"
                flat
                dense
                size="sm"
                @click="refreshDisbursements"
                :loading="chartStore.isLoading"
                class="refresh-btn"
              >
                <q-tooltip>Refresh Disbursements</q-tooltip>
              </q-btn>
            </div>

            <!-- Status Count Summary -->
          </q-card-section>

          <q-separator />

          <q-card-section style="height: 350px; position: relative; width: 100%; overflow-x: auto">
            <div v-if="chartStore.isLoading" class="absolute-center">
              <q-spinner color="primary" size="3em" />
            </div>

            <q-table
              v-else
              :rows="filteredDisbursementRows"
              :columns="chartStore.disbursementOverviewColumns"
              row-key="id"
              flat
              bordered
              :pagination="{ rowsPerPage: 5 }"
              class="disbursement-table responsive-table"
              style="height: 100%"
            >
              <!-- Status column with color coding -->
              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <q-chip
                    :color="getStatusColor(props.value)"
                    text-color="white"
                    size="sm"
                    :label="props.value"
                  />
                </q-td>
              </template>

              <!-- Amount column with currency formatting -->
              <template v-slot:body-cell-dv_amount="props">
                <q-td :props="props">
                  {{ chartStore.formatCurrency(props.value) }}
                </q-td>
              </template>

              <!-- Aging column with color coding -->
              <template v-slot:body-cell-aging="props">
                <q-td :props="props">
                  <!-- Debug info (remove in production) -->

                  <div
                    v-if="props.value !== '-' && props.row.status !== 'Liquidated'"
                    class="aging-display"
                  >
                    <q-chip
                      :color="getAgingColor(props.value)"
                      text-color="white"
                      size="sm"
                      :label="`${props.value} days`"
                    >
                      <q-tooltip>
                        <div class="text-center">
                          <div class="text-weight-bold">Aging Information</div>
                          <div>Created: {{ getAgingTooltipText(props.value) }}</div>
                          <div class="text-caption q-mt-xs">
                            {{ getAgingDescription(props.value) }}
                          </div>
                        </div>
                      </q-tooltip>
                    </q-chip>
                  </div>
                </q-td>
              </template>

              <!-- Liquidated amount column with currency formatting -->
              <template v-slot:body-cell-liquidated_amount="props">
                <q-td :props="props">
                  {{ props.value ? chartStore.formatCurrency(props.value) : '-' }}
                </q-td>
              </template>
            </q-table>

            <!-- Empty state when no data -->
            <div
              v-if="!chartStore.isLoading && filteredDisbursementRows.length === 0"
              class="text-center q-pa-lg"
            >
              <q-icon name="inbox" size="3em" color="grey-4" />
              <div class="text-grey-6 q-mt-sm">No disbursements found for the selected filter</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <div v-if="allocationError" class="q-mb-md text-negative text-bold">
      {{ allocationError }}
    </div>
  </q-page>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useChartDataStore } from 'src/stores/chartDataStore'
import PieChart from 'components/PieChart.vue'
import { useAuthStore } from 'stores/auth'
import { useQuasar } from 'quasar'
import { usePageLogging } from '../../composables/usePageLogging'
const chartStore = useChartDataStore()
const allocationError = ref('')
const authStore = useAuthStore()
const $q = useQuasar()
const { logPageVisit } = usePageLogging()

// Disbursement filtering
const selectedDisbursementFilter = ref('all')

const disbursementFilters = ref([
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Liquidated', value: 'Liquidated' },
])

// Computed properties for filtered disbursements
const filteredDisbursementRows = computed(() => {
  if (selectedDisbursementFilter.value === 'all') {
    return chartStore.disbursementOverviewRows
  }
  return chartStore.disbursementOverviewRows.filter(
    (row) => row.status === selectedDisbursementFilter.value,
  )
})

// Helper function to get status color
const getStatusColor = (status) => {
  const statusColors = {
    Pending: 'orange',
    Partial: 'blue',
    Liquidated: 'green',
  }
  return statusColors[status] || 'grey'
}

// Helper function to get aging color based on days
const getAgingColor = (days) => {
  if (days <= 7) return 'green' // 0-7 days: Green (Good)
  if (days <= 14) return 'orange' // 8-14 days: Orange (Warning)
  if (days <= 30) return 'deep-orange' // 15-30 days: Deep Orange (Caution)
  return 'red' // 31+ days: Red (Critical)
}

// Helper function to get aging tooltip text
const getAgingTooltipText = (days) => {
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

// Helper function to get aging description
const getAgingDescription = (days) => {
  if (days <= 7) return 'Good - Within normal processing time'
  if (days <= 14) return 'Warning - Should be processed soon'
  if (days <= 30) return 'Caution - Requires attention'
  return 'Critical - Immediate action needed'
}

// Helper function to get filter button color
const getFilterButtonColor = (value) => {
  if (selectedDisbursementFilter.value === value) {
    return value === 'all' ? 'primary' : 'primary'
  }
  return 'grey-3'
}

// Helper function to get filter button text color
const getFilterButtonTextColor = (value) => {
  if (selectedDisbursementFilter.value === value) {
    return 'white'
  }
  return 'dark'
}

// Helper function to get status count
const getStatusCount = (status) => {
  return filteredDisbursementRows.value.filter((row) => row.status === status).length
}

// Refresh disbursement data
const refreshDisbursements = async () => {
  try {
    await chartStore.fetchDisbursementOverview()
    $q.notify({
      type: 'positive',
      message: 'Disbursement data refreshed!',
      icon: 'refresh',
      position: 'top',
      timeout: 2000,
    })
  } catch (error) {
    console.error('Error refreshing disbursements:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to refresh disbursement data',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
  }
}

// Chart options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'left',
      labels: {
        position: 'left',
        boxWidth: 12,
        boxHeight: 12,
        fontColor: '#fff',
        padding: 10,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          size: 10,
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
          return `${label}: ${chartStore.formatCurrency(value)} (${percentage}%)`
        },
      },
    },
  },
}))

// Load dashboard data
const loadDashboardData = async () => {
  try {
    await chartStore.loadDashboardData()
    // Also fetch disbursement overview data
    await chartStore.fetchDisbursementOverview()
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    allocationError.value = 'Failed to load dashboard data. Please try again.'
  }
}

// Watch for changes in chart data
watch(
  () => chartStore.pieChartData,
  (newVal) => {
    console.log('Updated pie chart data:', newVal)
    console.log('Pie chart labels:', newVal.labels)
    console.log('Pie chart data:', newVal.datasets?.[0]?.data)
  },
  { deep: true },
)

// Load data when component mounts
onMounted(async () => {
  loadDashboardData()
  // Log page visit
  await logPageVisit('Dashboard')
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
  min-width: unset !important;
  width: 100%;
  position: sticky;
  min-height: 150px !important; /* Override any defaults */
  align-items: center;
  justify-content: space-evenly;
  border-radius: 12px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  height: 100%;
  background-color: #c2ffc2;
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

.chart-section {
  .col-md-6 {
    display: flex;
    flex-direction: column;
  }

  .chart-card {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

.chart-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
  background-color: white;
  width: 100%;
  min-width: unset;
  height: 100%;
  min-height: 500px;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(88, 178, 101, 0.321);
  }

  .q-card__section {
    &:first-child {
      padding-bottom: 7px;
      flex-shrink: 0;
    }
    &:last-child {
      height: 350px;
      padding-top: 1;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  }
}

.responsive-card {
  width: 100%;
  min-width: unset !important;
}

.responsive-table {
  width: 100%;
  min-width: unset !important;
}

// Responsive adjustments
@media (max-width: 900px) {
  .summary-card {
    min-width: unset !important;
    width: 100% !important;
  }
  .chart-card,
  .responsive-card,
  .responsive-table {
    width: 100% !important;
    min-width: unset !important;
  }
}
@media (max-width: 600px) {
  .summary-card {
    padding: 10px;
    min-width: unset !important;
    width: 100% !important;
  }
  .chart-card,
  .responsive-card,
  .responsive-table {
    width: 100% !important;
    min-width: unset !important;
  }
  .dashboard-page {
    padding: 8px !important;
  }
  .welcome-user {
    font-size: 18px !important;
    text-align: left;
  }
  .Custom-caption {
    font-size: 10px !important;
  }
  .Custome-text {
    font-size: 12px;
  }
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

/* Filter button styling */
.filter-btn {
  transition: all 0.2s ease;
  border-radius: 8px;
  font-weight: 500;
  min-width: 80px;
  border: 2px solid transparent;
  margin: 2px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Unselected state styling */
  &.q-btn--outline {
    border-color: #e0e0e0;
    background: white;
    color: #424242;

    &:hover {
      border-color: #1976d2;
      color: #1976d2;
    }
  }

  /* Selected state styling */
  &.q-btn--standard.q-btn--standard {
    &.q-btn--primary {
      background: #1976d2 !important;
      color: white !important;
      border-color: #1976d2;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
      font-weight: 600;
    }
  }

  /* Special styling for "All" button when selected */
  &.q-btn--primary {
    background: #1976d2 !important;
    color: white !important;
    border-color: #1976d2;
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
    font-weight: 600;
  }

  /* Ensure text is always readable */
  .q-btn__content {
    color: inherit !important;
    font-weight: inherit;
  }
}

.refresh-btn {
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
}

/* Disbursement table improvements */
.disbursement-table {
  .q-table__top {
    padding: 8px 16px;
  }

  .q-table__bottom {
    padding: 8px 16px;
  }
}

/* Status count chips styling */
.status-count-chip {
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &.active {
    .q-chip {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  }
}

/* Aging display styling */
.aging-display {
  display: flex;
  justify-content: center;
  align-items: center;

  .q-chip {
    font-weight: 500;
    min-width: 70px;
    justify-content: center;
  }
}

/* Info icon styling */
.text-caption .q-icon {
  vertical-align: middle;
  opacity: 0.7;
}

.welcome-user {
  font-weight: bold;
  color: Black; /* Dark green */
  margin-top: -10px;
}
.dashboard-page {
  background: whitesmoke;
}
</style>
