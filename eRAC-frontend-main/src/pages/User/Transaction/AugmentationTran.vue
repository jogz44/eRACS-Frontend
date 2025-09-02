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

    <div class="q-mb-sm">
      <SearchFilters />
      <AugmentationTable />
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
import SearchFilters from 'components/augmentation/SearchFilters.vue'
import AugmentationDialog from 'components/augmentation/AugmentationDialog.vue'
import AugExpenseSelecDial from 'components/augmentation/AugExpenseSelecDial.vue'
import AugExpenseDetailDial from 'components/augmentation/AugExpenseDetailDial.vue'
import { usePageLogging } from '../../../composables/usePageLogging'

const $q = useQuasar()
const store = useAugmentationStore()
const loading = ref(false)
const selectedBudgetSource = ref('all')

// Watch for budget source changes and sync with store
watch(selectedBudgetSource, async (newBudgetSource) => {
  store.setBudgetSourceFilter(newBudgetSource)
  // Refresh expense accounts when budget source filter changes
  await store.fetchExpenseAccounts()
})

// Computed properties for summary statistics
const totalAugmentations = computed(() => {
  return store.augmentation?.length || 0
})

const crossBudgetTransfers = computed(() => {
  if (!store.augmentation) return 0

  return store.augmentation.reduce((count, augmentation) => {
    const hasCrossBudgetTransfer = augmentation.details?.some(detail => {
      const fromBudget = detail.from_budget_source || 'Annual Budget'
      const toBudget = detail.to_budget_source || 'Annual Budget'
      return fromBudget !== toBudget
    })
    return hasCrossBudgetTransfer ? count + 1 : count
  }, 0)
})

const totalAmount = computed(() => {
  if (!store.augmentation) return 0

  return store.augmentation.reduce((total, augmentation) => {
    return total + (augmentation.total_amount || 0)
  }, 0)
})

const crossBudgetAmount = computed(() => {
  if (!store.augmentation) return 0

  return store.augmentation.reduce((total, augmentation) => {
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

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }
}
</style>
