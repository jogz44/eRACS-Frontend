<template>
  <q-page class="q-pa-md augmentation-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">Expense Class Augmentation</div>
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

    <!-- Expense Class Augmentation Info -->


    <!-- Augmentation Summary -->
    <div class="augmentation-summary q-mb-md">
      <div class="row q-col-gutter-md">
        <div class="col-md-4 col-sm-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h6 text-primary">{{ totalAugmentations }}</div>
              <div class="text-caption">Total Augmentations</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-4 col-sm-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h6 text-positive">₱{{ totalAmount.toLocaleString() }}</div>
              <div class="text-caption">Total Amount</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-4 col-sm-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h6 text-info">{{ totalExpenseClasses }}</div>
              <div class="text-caption">Affected Expense Classes</div>
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

          <!-- Flexible spacer to push Add button to the right -->
          <div class="col"></div>

          <!-- Add Button -->
          <div class="col-auto">
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
const searchQuery = ref('')
const dateRange = ref(null)

// Hooks must be called at the top level
const { logPageVisit } = usePageLogging()


// Computed properties for summary statistics (using filtered data)
const totalAugmentations = computed(() => {
  return filteredAugmentations.value?.length || 0
})

const totalExpenseClasses = computed(() => {
  if (!filteredAugmentations.value) return 0

  const expenseClasses = new Set()
  filteredAugmentations.value.forEach(augmentation => {
    if (augmentation.details && Array.isArray(augmentation.details)) {
      augmentation.details.forEach(detail => {
        // Try to extract expense class from account names
        // Account names typically follow: "EXPENSE CLASS > EXPENSE TYPE > EXPENSE ITEM"
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
  return expenseClasses.size
})

const totalAmount = computed(() => {
  if (!filteredAugmentations.value) return 0

  return filteredAugmentations.value.reduce((total, augmentation) => {
    return total + (augmentation.total_amount || 0)
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
  searchQuery.value = ''
  dateRange.value = null
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


  return filtered
})

onMounted(async () => {
  await store.fetchAugmentations()
  await store.fetchExpenseAccounts()

  // Log page visit
  await logPageVisit('Expense Class Augmentation')
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

.augmentation-info {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.info-card {
  border-radius: 8px;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border: 1px solid #bbdefb;
}

.filters-section {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }

  .augmentation-info {
    padding: 12px;
  }

  .info-card .q-card-section {
    padding: 12px;
  }
}

/* Tablet styles */
@media (min-width: 769px) and (max-width: 1023px) {
  .augmentation-info {
    padding: 14px;
  }

  .info-card .q-card-section {
    padding: 14px;
  }
}
</style>
