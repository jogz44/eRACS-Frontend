<template>
  <q-page class="q-pa-md augmentation-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-medium">Expense Class Augmentation</div>
          <div class="text-caption text-grey-7">
            Transfer budget allocations between expense classes
          </div>
        </div>
        <div class="q-gutter-xs">
          <q-btn
            icon="refresh"
            color="primary"
            flat
            dense
            @click="refreshData"
            :loading="isRefreshing"
            title="Refresh Data"
          />
          <q-btn
            icon="bug_report"
            color="orange"
            flat
            dense
            @click="forceUpdateIndicators"
            title="Debug Indicators"
          />
        </div>
      </div>
    </div>

    <!-- Augmentation Summary -->
    <div class="augmentation-summary q-mb-md">
      <div class="row q-col-gutter-md">
        <div class="col-md-4 col-sm-6">
          <q-card class="summary-card" :class="{ 'loading-state': store.loadingAugmentations }">
            <q-card-section class="text-center">
              <div class="summary-header">
                <q-icon name="swap_horiz" size="24px" class="q-mr-sm" />
                <div class="text-h6 text-grey-8">Total Augmentations</div>
              </div>
              <div class="summary-amount">
                <div class="text-h4 text-weight-bold text-primary">
                  {{ totalAugmentations }}
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  {{ filteredAugmentations.length }} currently visible
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-4 col-sm-6">
          <q-card class="summary-card" :class="{ 'loading-state': store.loadingAugmentations }">
            <q-card-section class="text-center">
              <div class="summary-header">
                <q-icon name="account_balance_wallet" size="24px" class="q-mr-sm" />
                <div class="text-h6 text-grey-8">Total Amount</div>
              </div>
              <div class="summary-amount">
                <div class="text-h4 text-weight-bold text-positive">
                  {{ formatCurrency(totalAmount) }}
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  Across all augmentations
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-4 col-sm-6">
          <q-card class="summary-card" :class="{ 'loading-state': store.loadingAugmentations }">
            <q-card-section class="text-center">
              <div class="summary-header">
                <q-icon name="category" size="24px" class="q-mr-sm" />
                <div class="text-h6 text-grey-8">Expense Classes</div>
              </div>
              <div class="summary-amount">
                <div class="text-h4 text-weight-bold text-info text-black">
                  {{ totalExpenseClasses }}
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  Affected classes
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <q-card flat bordered class="q-mb-md filters-section">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Search Input -->
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Search:</q-item-label>
            <q-input
              outlined
              dense
              v-model="searchQuery"
              placeholder="Search description, reference number..."
              clearable
              @update:model-value="onSearchChange"
              debounce="300"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Date Range Filter -->
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Date Range:</q-item-label>
            <q-input
              outlined
              dense
              v-model="dateRangeDisplay"
              placeholder="Select date range..."
              readonly
              clearable
              @clear="onDateRangeClear"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="dateRange"
                      range
                      @update:model-value="onDateRangeChange"
                    >
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Clear Button -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-btn
              dense
              outlined
              color="red-10"
              icon="clear_all"
              label="Clear Filters"
              @click="clearAllFilters"
              class="full-width"
            />
          </div>

          <!-- Flexible spacer to push Add button to the right -->
          <div class="col"></div>

          <!-- Add Button -->
          <div class="col-auto">
            <q-btn
              label="Add Augmentation"
              color="primary"
              icon="add"
              @click="openAddDialog"
              class="btn-match-input"
              v-permission="'add'"
              :disable="store.loadingAugmentations"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="q-mb-sm">
      <AugmentationTable :filtered-data="filteredAugmentations" />
      <AugmentationDialog />
      <AugExpenseSelecDial />
      <AugExpenseDetailDial />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useAugmentationStore } from 'stores/augmentation'
import AugmentationTable from 'components/augmentation/AugmentationTable.vue'
import AugmentationDialog from 'components/augmentation/AugmentationDialog.vue'
import AugExpenseSelecDial from 'components/augmentation/AugExpenseSelecDial.vue'
import AugExpenseDetailDial from 'components/augmentation/AugExpenseDetailDial.vue'
import { usePageLogging } from '../../../composables/usePageLogging'

const $q = useQuasar()
const store = useAugmentationStore()

// Local state
const isRefreshing = ref(false)
const searchQuery = ref('')
const dateRange = ref(null)
const lastRefreshTime = ref(null)

// Hooks must be called at the top level
const { logPageVisit } = usePageLogging()


// Utility function for currency formatting
const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '₱0.00'
  return `₱${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

// Helper function to get augmentations data safely
const getAugmentationsData = () => {
  // Try multiple ways to access the data
  let data = null

  if (store.augmentation?.value) {
    data = store.augmentation.value
  } else if (store.augmentation) {
    data = store.augmentation
  } else if (store.filteredAugmentations) {
    data = store.filteredAugmentations
  }

  console.log('Getting augmentations data:', {
    'store.augmentation': store.augmentation,
    'store.augmentation?.value': store.augmentation?.value,
    'store.filteredAugmentations': store.filteredAugmentations,
    'result': data
  })

  return Array.isArray(data) ? data : []
}

// Computed properties for summary statistics (using store data, not filtered)
const totalAugmentations = computed(() => {
  // Force reactivity by accessing store properties
  store.augmentation // Access store property for reactivity
  const augmentations = getAugmentationsData()
  console.log('Total augmentations computed:', augmentations.length, augmentations)
  return augmentations.length
})

const totalExpenseClasses = computed(() => {
  // Force reactivity by accessing store properties
  store.augmentation // Access store property for reactivity
  const augmentations = getAugmentationsData()
  if (!augmentations || augmentations.length === 0) return 0

  const expenseClasses = new Set()
  augmentations.forEach(augmentation => {
    if (augmentation.details && Array.isArray(augmentation.details)) {
      augmentation.details.forEach(detail => {
        // Extract expense class from account names
        if (detail.from_account) {
          const fromParts = detail.from_account.split(' > ')
          if (fromParts.length >= 1) {
            expenseClasses.add(fromParts[0].trim())
          }
        }
        if (detail.to_account) {
          const toParts = detail.to_account.split(' > ')
          if (toParts.length >= 1) {
            expenseClasses.add(toParts[0].trim())
          }
        }
      })
    }
  })
  console.log('Total expense classes computed:', expenseClasses.size, Array.from(expenseClasses))
  return expenseClasses.size
})

const totalAmount = computed(() => {
  // Force reactivity by accessing store properties
  store.augmentation // Access store property for reactivity
  const augmentations = getAugmentationsData()
  if (!augmentations || augmentations.length === 0) return 0

  const total = augmentations.reduce((sum, augmentation) => {
    const amount = Number(augmentation.total_amount) || 0
    console.log('Augmentation amount:', augmentation.ref_number || augmentation.id, amount)
    return sum + amount
  }, 0)

  console.log('Total amount computed:', total, 'from', augmentations.length, 'augmentations')
  return total
})

// Use store's filtered augmentations for display
const filteredAugmentations = computed(() => {
  return store.filteredAugmentations || []
})


// Enhanced refresh function with better error handling
const refreshData = async (showNotification = true) => {
  isRefreshing.value = true
  try {
    await store.fetchAugmentations()
    lastRefreshTime.value = new Date()

    // Force reactivity update after data fetch
    await nextTick()

    if (showNotification) {
      $q.notify({
        type: 'positive',
        message: 'Augmentations refreshed successfully!',
        icon: 'refresh',
        position: 'top',
        timeout: 2000
      })
    }
  } catch (error) {
    console.error('Error refreshing augmentations:', error)

    if (showNotification) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to refresh augmentations. Please try again.',
        icon: 'error',
        position: 'top',
        timeout: 5000
      })
    }
  } finally {
    isRefreshing.value = false
  }
}

// Force update computed properties
const forceUpdateIndicators = () => {
  console.log('=== DEBUGGING INDICATORS ===')
  console.log('Store object:', store)
  console.log('Store augmentation:', store.augmentation)
  console.log('Store filteredAugmentations:', store.filteredAugmentations)
  console.log('Store loadingAugmentations:', store.loadingAugmentations)

  const data = getAugmentationsData()
  console.log('Augmentations data:', data)
  console.log('Data length:', data.length)

  if (data.length > 0) {
    console.log('First augmentation:', data[0])
    console.log('Total amount of first:', data[0].total_amount)
  }

  // Force reactivity by accessing the computed properties
  console.log('Total augmentations:', totalAugmentations.value)
  console.log('Total amount:', totalAmount.value)
  console.log('Total expense classes:', totalExpenseClasses.value)
  console.log('=== END DEBUG ===')
}

// Date range display formatting
const dateRangeDisplay = computed(() => {
  if (!dateRange.value || !dateRange.value.from || !dateRange.value.to) {
    return ''
  }
  const fromDate = new Date(dateRange.value.from).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
  const toDate = new Date(dateRange.value.to).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
  return `${fromDate} - ${toDate}`
})

// Enhanced date range change handler
const onDateRangeChange = (newRange) => {
  if (newRange && newRange.from && newRange.to) {
    const fromDate = new Date(newRange.from)
    const toDate = new Date(newRange.to)

    // Validate date range
    if (fromDate > toDate) {
      $q.notify({
        type: 'warning',
        message: 'Start date cannot be after end date',
        icon: 'warning',
        position: 'top'
      })
      return
    }

    store.dateFrom = fromDate.toLocaleDateString('en-GB')
    store.dateTo = toDate.toLocaleDateString('en-GB')
  } else {
    store.dateFrom = ''
    store.dateTo = ''
  }
}

const onDateRangeClear = () => {
  dateRange.value = null
  store.dateFrom = ''
  store.dateTo = ''
}

// Enhanced search change handler with debouncing
const onSearchChange = (newQuery) => {
  store.searchQuery = newQuery
}

// Enhanced clear all filters function
const clearAllFilters = () => {
  searchQuery.value = ''
  dateRange.value = null
  store.searchQuery = ''
  store.dateFrom = ''
  store.dateTo = ''

  $q.notify({
    type: 'info',
    message: 'All filters cleared',
    icon: 'clear_all',
    position: 'top',
    timeout: 1500
  })
}

// Open add dialog with validation
const openAddDialog = () => {
  if (store.loadingAugmentations) {
    $q.notify({
      type: 'warning',
      message: 'Please wait for data to finish loading',
      icon: 'hourglass_empty',
      position: 'top'
    })
    return
  }

  store.openDialog('augmentation')
}

// Watch for search query changes and sync with store
watch(searchQuery, (newQuery) => {
  store.searchQuery = newQuery
}, { debounce: 300 })

// Watch for store data changes to trigger reactive updates
watch(() => store.augmentation, (newData) => {
  console.log('Store augmentation data changed:', newData)
}, { deep: true })

// Force reactivity update when store data changes
watch(() => store.filteredAugmentations, (newData) => {
  console.log('Store filtered augmentations changed:', newData)
}, { deep: true })

// Debug watcher to see what's in the store
watch(() => store, (newStore) => {
  console.log('Store state:', {
    augmentation: newStore.augmentation,
    filteredAugmentations: newStore.filteredAugmentations,
    loadingAugmentations: newStore.loadingAugmentations
  })
}, { deep: true, immediate: true })

// Enhanced onMounted with better error handling
onMounted(async () => {
  try {
    // Load data in parallel for better performance
    await Promise.allSettled([
      store.fetchAugmentations(),
      store.fetchExpenseAccounts()
    ])

    // Force update indicators after data is loaded
    await nextTick()
    forceUpdateIndicators()

    // Log page visit
    await logPageVisit('Expense Class Augmentation')
  } catch (error) {
    console.error('Error initializing AugmentationTran page:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to initialize page. Please refresh.',
      icon: 'error',
      position: 'top',
    })
  }
})
</script>

<style scoped>
.augmentation-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.augmentation-summary {
  margin-bottom: 24px;
}

.summary-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.summary-card.loading-state {
  opacity: 0.7;
  pointer-events: none;
}

.summary-card.loading-state::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.summary-header .q-icon {
  color: #6c757d;
}

.summary-amount {
  margin: 16px 0;
}

.summary-amount .text-h4 {
  font-size: 2.2rem;
  line-height: 1.2;
  margin-bottom: 4px;
}

.filters-section {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Button styling to match input height */
.btn-match-input {
  height: 40px;
  padding: 0 16px;
  border-radius: 4px;
}

.btn-match-input :deep(.q-btn__content) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }

  .summary-card {
    margin-bottom: 12px;
  }

  .summary-amount .text-h4 {
    font-size: 1.8rem;
  }

  .summary-header {
    flex-direction: column;
    gap: 8px;
  }

  .summary-header .q-icon {
    margin-right: 0;
  }

  .row.items-end {
    flex-direction: column;
    align-items: stretch;
  }

  .row.items-end > * {
    margin-bottom: 8px;
    width: 100%;
  }
}

/* Tablet adjustments */
@media (min-width: 769px) and (max-width: 1023px) {
  .summary-amount .text-h4 {
    font-size: 2rem;
  }
}

/* Loading state animations */
.loading-state {
  position: relative;
  overflow: hidden;
}

.loading-state::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 1.5s infinite;
}

/* Enhanced card hover effects */
.summary-card:hover .summary-header .q-icon {
  color: #1976d2;
  transform: scale(1.1);
  transition: all 0.3s ease;
}

/* Improved spacing and typography */
.text-caption {
  font-size: 0.75rem;
  line-height: 1.4;
}

.text-h6 {
  font-size: 1.1rem;
  font-weight: 600;
}

.text-h4 {
  font-weight: 700;
  letter-spacing: -0.02em;
}
</style>

