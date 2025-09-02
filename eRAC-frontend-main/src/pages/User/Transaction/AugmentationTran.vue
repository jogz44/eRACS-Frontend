<template>
  <q-page class="q-pa-md augmentation-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">Augmentation Transaction</div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="loadPendingUsers"
          :loading="store.loadingAugmentations"
        />
      </div>
    </div>

    <!-- Budget Source Filter -->
    <div class="budget-source-filter q-mb-md">
      <q-tabs
        v-model="selectedBudgetSource"
        class="text-grey-8"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="all" label="All Budgets" icon="list" />
        <q-tab name="annual" label="Annual Budget" icon="calendar_today" />
        <q-tab name="supplemental" label="Supplemental Budget" icon="add_circle" />
      </q-tabs>
    </div>

    <!-- Augmentation Summary -->
    <div class="augmentation-summary q-mb-md">
      <div class="row q-col-gutter-md">
        <div class="col-md-3 col-sm-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h6 text-primary">{{ totalAugmentations }}</div>
              <div class="text-caption">Total Augmentations</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-3 col-sm-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h6 text-secondary">{{ crossBudgetTransfers }}</div>
              <div class="text-caption">Cross-Budget Transfers</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-3 col-sm-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h6 text-positive">₱{{ totalAmount.toLocaleString() }}</div>
              <div class="text-caption">Total Amount</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-3 col-sm-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h6 text-orange">₱{{ crossBudgetAmount.toLocaleString() }}</div>
              <div class="text-caption">Cross-Budget Amount</div>
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
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Search:</q-item-label>
            <q-input
              outlined
              dense
              v-model="searchQuery"
              placeholder="Search description..."
              clearable
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Date Range Filter -->
          <div class="col-md-2 col-sm-6 col-xs-12">
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
          <div class="col-md-1 col-sm-6 col-xs-12">
            <q-btn
              dense
              outlined
              color="red-10"
              icon="clear_all"
              label="Clear"
              @click="clearAllFilters"
              class="full-width"
            />
          </div>

          <!-- Spacer to push Add button to the right -->
          <div class="col-md-2 col-sm-0 col-xs-0"></div>

          <!-- Add Button -->
          <div class="col-md-1 col-sm-6 col-xs-12">
            <q-btn
              label="Add"
              color="primary"
              icon="add"
              @click="store.openDialog('augmentation')"
              class="full-width"
              v-permission="'add'"
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
import { ref, onMounted, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAugmentationStore } from 'stores/augmentation'
import AugmentationTable from 'components/augmentation/AugmentationTable.vue'

import AugmentationDialog from 'components/augmentation/AugmentationDialog.vue'
import AugExpenseSelecDial from 'components/augmentation/AugExpenseSelecDial.vue'
import AugExpenseDetailDial from 'components/augmentation/AugExpenseDetailDial.vue'
import { usePageLogging } from '../../../composables/usePageLogging'

const $q = useQuasar()
const store = useAugmentationStore()
const loading = ref(false)
const selectedBudgetSource = ref('all')
const searchQuery = ref('')
const dateRange = ref(null)

// Watch for budget source changes and sync with store
watch(selectedBudgetSource, async (newBudgetSource) => {
  store.setBudgetSourceFilter(newBudgetSource)
  // Refresh expense accounts when budget source filter changes
  await store.fetchExpenseAccounts()
})

// Computed properties for summary statistics (using filtered data)
const totalAugmentations = computed(() => {
  return filteredAugmentations.value?.length || 0
})

const crossBudgetTransfers = computed(() => {
  if (!filteredAugmentations.value) return 0

  return filteredAugmentations.value.reduce((count, augmentation) => {
    const hasCrossBudgetTransfer = augmentation.details?.some(detail => {
      const fromBudget = detail.from_budget_source || 'Annual Budget'
      const toBudget = detail.to_budget_source || 'Annual Budget'
      return fromBudget !== toBudget
    })
    return hasCrossBudgetTransfer ? count + 1 : count
  }, 0)
})

const totalAmount = computed(() => {
  if (!filteredAugmentations.value) return 0

  return filteredAugmentations.value.reduce((total, augmentation) => {
    return total + (augmentation.total_amount || 0)
  }, 0)
})

const crossBudgetAmount = computed(() => {
  if (!filteredAugmentations.value) return 0

  return filteredAugmentations.value.reduce((total, augmentation) => {
    const crossBudgetDetails = augmentation.details?.filter(detail => {
      const fromBudget = detail.from_budget_source || 'Annual Budget'
      const toBudget = detail.to_budget_source || 'Annual Budget'
      return fromBudget !== toBudget
    }) || []

    return total + crossBudgetDetails.reduce((detailTotal, detail) => {
      return detailTotal + (detail.amount || 0)
    }, 0)
  }, 0)
})

const loadPendingUsers = async () => {
  loading.value = true
  try {
    await store.fetchAugmentations()
    $q.notify({
      type: 'positive',
      message: 'Augmentations refreshed!',
      icon: 'refresh',
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to refresh augmentations',
      icon: 'error',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

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

const onDateRangeChange = (newRange) => {
  if (newRange && newRange.from && newRange.to) {
    const fromDate = new Date(newRange.from)
    const toDate = new Date(newRange.to)
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

const clearAllFilters = () => {
  // Clear any filters if needed
  selectedBudgetSource.value = 'all'
  searchQuery.value = ''
  dateRange.value = null
  store.setBudgetSourceFilter('all')
  store.searchQuery = ''
  store.dateFrom = ''
  store.dateTo = ''
}

// Watch for search query changes and sync with store
watch(searchQuery, (newQuery) => {
  store.searchQuery = newQuery
})

// Computed property for filtered augmentations
const filteredAugmentations = computed(() => {
  let filtered = store.augmentation || []
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(augmentation => 
      augmentation.description?.toLowerCase().includes(query) ||
      augmentation.reference_number?.toLowerCase().includes(query) ||
      augmentation.total_amount?.toString().includes(query)
    )
  }
  
  // Filter by date range
  if (store.dateFrom && store.dateTo) {
    filtered = filtered.filter(augmentation => {
      if (!augmentation.created_at) return false
      const augmentationDate = new Date(augmentation.created_at).toLocaleDateString('en-GB')
      return augmentationDate >= store.dateFrom && augmentationDate <= store.dateTo
    })
  }
  
  // Filter by budget source
  if (selectedBudgetSource.value !== 'all') {
    filtered = filtered.filter(augmentation => {
      return augmentation.details?.some(detail => {
        const fromBudget = detail.from_budget_source || 'Annual Budget'
        const toBudget = detail.to_budget_source || 'Annual Budget'
        return fromBudget.toLowerCase().includes(selectedBudgetSource.value) ||
               toBudget.toLowerCase().includes(selectedBudgetSource.value)
      })
    })
  }
  
  return filtered
})

onMounted(async () => {
  await store.fetchAugmentations()
  await store.fetchExpenseAccounts()

  // Log page visit
  const { logPageVisit } = usePageLogging()
  await logPageVisit('Current Augmentation')
})


</script>

<style scoped>
.augmentation-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.augmentation-summary {
  margin-bottom: 24px;
}

.summary-card {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.budget-source-filter {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.budget-source-badge {
  font-size: 0.75rem;
  font-weight: 500;
}

.filters-section {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }
}
</style>
