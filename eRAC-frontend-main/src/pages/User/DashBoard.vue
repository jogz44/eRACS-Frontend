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

    <!-- Year Filter Section -->
    <div class="year-filter-section q-mb-lg">
      <q-card class="filter-card">
        <!-- Main Filter Controls -->
        <q-card-section class="filter-main-section">
          <!-- Desktop/Tablet Layout -->
          <div class="filter-desktop-layout row items-center justify-between">
            <!-- Left Section: Filter Controls -->
            <div class="filter-controls-section row items-center q-gutter-md">
              <div class="filter-label text-subtitle2 text-weight-medium">Year Filter:</div>
              <div class="filter-input-section">
                <q-select
                  v-model="chartStore.selectedYear"
                  :options="chartStore.availableYears"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  dense
                  outlined
                  class="year-select"
                  :loading="chartStore.isYearFilterLoading"
                  :disable="chartStore.isYearFilterLoading"
                  @update:model-value="onYearChange"
                >
                  <template v-slot:prepend>
                    <q-icon name="calendar_today" />
                  </template>
                  <template v-slot:loading>
                    <q-spinner color="primary" size="20px" />
                  </template>
                </q-select>
              </div>
              
              <!-- Refresh years button -->
              <q-btn
                icon="refresh"
                color="primary"
                flat
                dense
                size="sm"
                class="refresh-years-btn"
                @click="refreshYears"
                :loading="chartStore.isYearFilterLoading"
                :disable="chartStore.isYearFilterLoading"
              >
                <q-tooltip>Refresh available years</q-tooltip>
              </q-btn>
            </div>
            
            <!-- Right Section: Action Buttons -->
            <div class="filter-actions-section row items-center q-gutter-sm">
              <q-btn
                icon="refresh"
                label="Reset to Current Year"
                color="secondary"
                outline
                dense
                size="sm"
                class="reset-year-btn"
                @click="resetToCurrentYear"
                :loading="chartStore.isLoading"
                :disable="chartStore.selectedYear === new Date().getFullYear()"
              >
                <q-tooltip>Reset to current year view</q-tooltip>
              </q-btn>
              
              <q-btn
                icon="refresh"
                color="primary"
                flat
                dense
                size="sm"
                class="refresh-data-btn"
                @click="refreshAllData"
                :loading="chartStore.isLoading"
              >
                <q-tooltip>Refresh all data for selected year</q-tooltip>
              </q-btn>
            </div>
          </div>
          
          <!-- Mobile Layout -->
          <div class="filter-mobile-layout column q-gutter-md">
            <!-- Mobile Header -->
            <div class="row items-center justify-between">
              <div class="text-subtitle2 text-weight-medium">Year Filter</div>
              <q-btn
                icon="refresh"
                color="primary"
                flat
                dense
                size="sm"
                @click="refreshYears"
                :loading="chartStore.isYearFilterLoading"
                :disable="chartStore.isYearFilterLoading"
              >
                <q-tooltip>Refresh years</q-tooltip>
              </q-btn>
            </div>
            
            <!-- Mobile Year Select -->
            <div class="mobile-year-select">
              <q-select
                v-model="chartStore.selectedYear"
                :options="chartStore.availableYears"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                outlined
                class="full-width"
                :loading="chartStore.isYearFilterLoading"
                :disable="chartStore.isYearFilterLoading"
                @update:model-value="onYearChange"
              >
                <template v-slot:prepend>
                  <q-icon name="calendar_today" />
                </template>
                <template v-slot:loading>
                  <q-spinner color="primary" size="20px" />
                </template>
              </q-select>
            </div>
            
            <!-- Mobile Action Buttons -->
            <div class="mobile-actions row q-gutter-sm">
              <q-btn
                icon="refresh"
                label="Reset"
                color="secondary"
                outline
                dense
                size="sm"
                class="col"
                @click="resetToCurrentYear"
                :loading="chartStore.isLoading"
                :disable="chartStore.selectedYear === new Date().getFullYear()"
              />
              
              <q-btn
                icon="refresh"
                label="Refresh Data"
                color="primary"
                outline
                dense
                size="sm"
                class="col"
                @click="refreshAllData"
                :loading="chartStore.isLoading"
              />
            </div>
          </div>
          
          <!-- Status Indicators -->
          <div class="filter-status-section">
            <!-- Loading indicator for year filter -->
            <div v-if="chartStore.isYearFilterLoading" class="text-caption text-grey-6 text-center">
              <q-spinner color="primary" size="16px" class="q-mr-xs" />
              Loading years...
            </div>
            
            <!-- Error state for year filter -->
            <div v-if="chartStore.availableYears.length === 0 && !chartStore.isYearFilterLoading" class="text-caption text-negative text-center">
              <q-icon name="warning" size="16px" class="q-mr-xs" />
              No years available
            </div>
          </div>
        </q-card-section>
        
        <!-- Year Filter Summary -->
        <q-card-section class="year-filter-summary">
          <div class="summary-content row items-center q-gutter-md">
            <q-icon 
              name="info" 
              color="primary" 
              size="sm"
              class="summary-icon"
            />
            <div class="text-caption text-grey-7 summary-text">
              <span class="text-weight-medium">Currently viewing:</span>
              {{ chartStore.selectedYear === 'all' ? 'Data from all available years' : `Data for the year ${chartStore.selectedYear}` }}
              <span v-if="chartStore.selectedYear === new Date().getFullYear()" class="text-positive q-ml-sm">
                (Current Year)
              </span>
            </div>
          </div>
        </q-card-section>
      </q-card>
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
            <div class="text-caption text-grey-6">
              {{ chartStore.selectedYear === 'all' ? 'All Years' : chartStore.selectedYear }}
            </div>
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

            <div class="text-caption text-grey-6">
              {{ chartStore.selectedYear === 'all' ? 'All Years' : chartStore.selectedYear }}
            </div>

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
    <div v-if="unliquidatedocationError" class="q-mb-md text-negative text-bold">
      {{ unliquidatedocationError }}
    </div>
    
    <!-- Loading Overlay for Year Changes -->
    <q-inner-loading :showing="chartStore.isLoading && isYearChanging" color="primary">
      <q-spinner size="50px" color="primary" />
      <div class="text-center q-mt-md">
        <div class="text-h6">Loading Data</div>
        <div class="text-caption">Please wait while we fetch data for the selected year...</div>
      </div>
    </q-inner-loading>
  </q-page>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useChartDataStore } from 'src/stores/chartDataStore'
import PieChart from 'components/PieChart.vue'
import { useAuthStore } from 'stores/auth'
import { useQuasar } from 'quasar'
import { usePageLogging } from '../../composables/usePageLogging'
import { onUnmounted } from 'vue'
const chartStore = useChartDataStore()
const unliquidatedocationError = ref('')
const authStore = useAuthStore()
const $q = useQuasar()
const { logPageVisit } = usePageLogging()

// Year change state
const isYearChanging = ref(false)

// Page visibility handler for refreshing years
let visibilityChangeHandler = null

// Disbursement filtering
const selectedDisbursementFilter = ref('unliquidated')

const disbursementFilters = ref([
  { label: 'Unliquidated', value: 'unliquidated' },
  { label: 'Liquidated', value: 'Liquidated' },
])

// Computed properties for filtered disbursements
const filteredDisbursementRows = computed(() => {
  let rows = []

  if (selectedDisbursementFilter.value === 'unliquidated') {
    rows = chartStore.disbursementOverviewRows.filter(
      (row) =>
        (row.status === 'Pending' || row.status === 'Partial') &&
        row.aging &&
        row.aging > 0
    )
  } else {
    rows = chartStore.disbursementOverviewRows.filter(
      (row) => row.status === selectedDisbursementFilter.value
    )
  }
    return rows.sort((a, b) => (b.aging || 0) - (a.aging || 0))
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
    return value === 'unliquidated' ? 'primary' : 'primary'
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

// Year filter methods
const onYearChange = async (newYear) => {
  try {
    console.log('Year changed to:', newYear)
    
    // Set year changing state
    isYearChanging.value = true
    
    // Show loading notification
    $q.notify({
      type: 'info',
      message: `Loading data for ${newYear === 'all' ? 'all years' : newYear}...`,
      icon: 'hourglass_empty',
      position: 'top',
      timeout: 2000,
    })
    
    // Update the store's selected year
    chartStore.setSelectedYear(newYear)
    
    // Refresh all dashboard data for the new year
    await refreshAllData()
    
    // Show success notification
    $q.notify({
      type: 'positive',
      message: `Data loaded for ${newYear === 'all' ? 'all years' : newYear}!`,
      icon: 'check_circle',
      position: 'top',
      timeout: 2000,
    })
  } catch (error) {
    console.error('Error changing year:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load data for selected year',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
  } finally {
    // Clear year changing state
    isYearChanging.value = false
  }
}

const resetToCurrentYear = async () => {
  try {
    const currentYear = new Date().getFullYear()
    console.log('Resetting to current year:', currentYear)
    
    // Update the store
    chartStore.resetToCurrentYear()
    
    // Refresh all data
    await refreshAllData()
    
    $q.notify({
      type: 'positive',
      message: `Reset to current year (${currentYear})`,
      icon: 'restore',
      position: 'top',
      timeout: 2000,
    })
  } catch (error) {
    console.error('Error resetting to current year:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to reset to current year',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
  }
}

const refreshAllData = async () => {
  try {
    isYearChanging.value = true
    await loadDashboardData()
    $q.notify({
      type: 'positive',
      message: 'Dashboard data refreshed successfully',
      position: 'top',
    })
  } catch (error) {
    console.error('Error refreshing data:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to refresh dashboard data',
      position: 'top',
    })
  } finally {
    isYearChanging.value = false
  }
}

const refreshYears = async () => {
  try {
    await chartStore.fetchAvailableYears()
    $q.notify({
      type: 'positive',
      message: 'Available years refreshed successfully',
      position: 'top',
    })
  } catch (error) {
    console.error('Error refreshing years:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to refresh available years',
      position: 'top',
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
      cunliquidatedbacks: {
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
    unliquidatedocationError.value = 'Failed to load dashboard data. Please try again.'
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
  try {
    // First fetch available years and set default
    await chartStore.fetchAvailableYears()
    
    // Set default to current year
    chartStore.setSelectedYear(new Date().getFullYear())
    
    // Then load dashboard data
    await loadDashboardData()
    
    // Log page visit
    await logPageVisit('Dashboard')
  } catch (error) {
    console.error('Error initializing dashboard:', error)
    
    // Try to set fallback year and load data
    try {
      chartStore.selectedYear = new Date().getFullYear()
      await loadDashboardData()
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      unliquidatedocationError.value = 'Failed to initialize dashboard. Please refresh the page and try again.'
    }
  }
  
  // Add page visibility listener to refresh years when user returns to dashboard
  visibilityChangeHandler = async () => {
    if (!document.hidden && chartStore.availableYears.length > 0) {
      // User returned to the dashboard tab, refresh years to catch any newly added fiscal years
      try {
        await chartStore.fetchAvailableYears()
        console.log('Years refreshed due to page visibility change')
      } catch (error) {
        console.error('Error refreshing years on visibility change:', error)
      }
    }
  }
  
  document.addEventListener('visibilitychange', visibilityChangeHandler)
})

onUnmounted(() => {
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler)
  }
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

.year-filter-section {
  .filter-card {
    background-color: white;
    border-radius: 12px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(88, 178, 101, 0.15);
    }
    
    .q-card__section {
      padding: 16px 20px;
      
      &:last-child {
        padding-top: 0;
        padding-bottom: 16px;
        border-top: 1px solid #f0f0f0;
        background-color: #fafafa;
        border-radius: 0 0 12px 12px;
      }
    }
  }
  
  // Main filter section styling
  .filter-main-section {
    padding: 20px !important;
    
    // Desktop/Tablet layout
    .filter-desktop-layout {
      display: flex;
      width: 100%;
      
      .filter-controls-section {
        flex: 1;
        min-width: 0; // Allow flex shrinking
        
        .filter-label {
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .filter-input-section {
          flex: 1;
          min-width: 150px;
          
          .year-select {
            min-width: 150px;
            max-width: 200px;
            
            .q-field__control {
              border-radius: 8px;
            }
          }
        }
        
        .refresh-years-btn {
          flex-shrink: 0;
        }
      }
      
      .filter-actions-section {
        flex-shrink: 0;
        
        .reset-year-btn,
        .refresh-data-btn {
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
          
          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }
    
    // Mobile layout
    .filter-mobile-layout {
      display: none;
      
      .mobile-year-select {
        .q-select {
          .q-field__control {
            border-radius: 8px;
          }
        }
      }
      
      .mobile-actions {
        .q-btn {
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
          
          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }
    
    // Status section
    .filter-status-section {
      margin-top: 12px;
      
      .text-caption {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }
    }
  }
  
  // Summary section
  .year-filter-summary {
    .summary-content {
      .summary-icon {
        flex-shrink: 0;
      }
      
      .summary-text {
        line-height: 1.4;
        word-break: break-word;
        
        .text-weight-medium {
          color: #424242;
        }
        
        .text-positive {
          font-weight: 500;
        }
      }
    }
  }
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
// Large tablets and small desktops (1024px and below)
@media (max-width: 1024px) {
  .year-filter-section {
    .filter-main-section {
      .filter-desktop-layout {
        .filter-controls-section {
          .filter-input-section .year-select {
            min-width: 140px;
            max-width: 180px;
          }
        }
        
        .filter-actions-section {
          .reset-year-btn {
            .q-btn__content {
              .q-btn__label {
                display: none;
              }
            }
          }
        }
      }
    }
  }
}

// Tablets (768px and below)
@media (max-width: 768px) {
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
  
  .year-filter-section {
    .filter-main-section {
      padding: 16px !important;
      
      // Hide desktop layout, show mobile layout
      .filter-desktop-layout {
        display: none;
      }
      
      .filter-mobile-layout {
        display: flex;
        
        .mobile-year-select {
          .q-select {
            width: 100%;
          }
        }
        
        .mobile-actions {
          .q-btn {
            min-height: 40px;
          }
        }
      }
    }
    
    .year-filter-summary {
      .summary-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        
        .summary-text {
          text-align: left;
          width: 100%;
        }
      }
    }
  }
}

// Small tablets and large phones (600px and below)
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
  
  .year-filter-section {
    .filter-card {
      margin: 0 4px;
      border-radius: 8px;
      
      .q-card__section {
        padding: 12px 16px;
        
        &:last-child {
          padding: 12px 16px;
        }
      }
    }
    
    .filter-main-section {
      padding: 12px !important;
      
      .filter-mobile-layout {
        gap: 12px;
        
        .mobile-actions {
          gap: 8px;
          
          .q-btn {
            min-height: 36px;
            font-size: 12px;
            
            .q-btn__content {
              .q-btn__label {
                font-size: 12px;
              }
            }
          }
        }
      }
      
      .filter-status-section {
        margin-top: 8px;
        
        .text-caption {
          font-size: 11px;
        }
      }
    }
    
    .year-filter-summary {
      .summary-content {
        .summary-text {
          font-size: 11px;
          line-height: 1.3;
        }
      }
    }
  }
}

// Small phones (480px and below)
@media (max-width: 480px) {
  .year-filter-section {
    .filter-main-section {
      padding: 8px !important;
      
      .filter-mobile-layout {
        gap: 10px;
        
        .mobile-actions {
          flex-direction: column;
          gap: 6px;
          
          .q-btn {
            width: 100%;
            min-height: 40px;
          }
        }
      }
    }
    
    .year-filter-summary {
      .summary-content {
        .summary-text {
          font-size: 10px;
        }
      }
    }
  }
}

// Extra small phones (360px and below)
@media (max-width: 360px) {
  .year-filter-section {
    .filter-main-section {
      .filter-mobile-layout {
        .mobile-actions {
          .q-btn {
            .q-btn__content {
              .q-btn__label {
                font-size: 11px;
              }
            }
          }
        }
      }
    }
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
  transition: unliquidated 0.2s ease;
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

  /* Special styling for "unliquidated" button when selected */
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
  transition: unliquidated 0.2s ease;

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
  transition: unliquidated 0.2s ease;

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
