<template>
  <q-page class="q-pa-lg augmentation-page">
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">Augmentation Transaction</div>
      <q-btn
          icon="refresh"
          color="primary"
          flat
          round
          @click="loadPendingUsers"
          :loading="loading"
          title="Refresh augmentations"
        />
        </div>
</div>
    <div class="q-mb-md">
      <SearchFilters />
      <AugmentationTable />
      <AugmentationDialog />
      <AugExpenseSelecDial />
      <AugExpenseDetailDial />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAugmentationStore } from 'stores/augmentation'
import AugmentationTable from 'components/augmentation/AugmentationTable.vue'
import SearchFilters from 'components/augmentation/SearchFilters.vue'
import AugmentationDialog from 'components/augmentation/AugmentationDialog.vue'
import AugExpenseSelecDial from 'components/augmentation/AugExpenseSelecDial.vue'
import AugExpenseDetailDial from 'components/augmentation/AugExpenseDetailDial.vue'

const $q = useQuasar()
const store = useAugmentationStore()
const loading = ref(false)

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
  await Promise.all([
    store.fetchAugmentations(),
    store.fetchAvailableBudgets()
  ])
})
</script>

<style scoped>
.augmentation-page{
  background-color: whitesmoke; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
}

@media (min-width: 1025px) {
  .custom-search-input {
    width: 300px !important;
    min-width: 0 !important;
    max-width: 600px !important;
  }
  .custom-date-from,
  .custom-date-to {
    width: 180px !important;
    min-width: 0 !important;
    max-width: 250px !important;
  }
}

/* Responsive Dialog - Only sizing adjustments for mobile and tablet */
@media (max-width: 600px) {
  /* Mobile View - Only size adjustments */
  .q-dialog .q-card {
    width: 95vw !important;
    min-width: 95vw !important;
    max-width: 95vw !important;
    margin: 8px !important;
  }

  .q-dialog .q-card-section {
    padding: 12px !important;
  }

  .q-dialog .q-gutter-md {
    gap: 8px !important;
  }

  .q-dialog .q-select,
  .q-dialog .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .q-dialog .q-btn {
    min-height: 44px !important;
  }

  /* Mobile Dialog Content Organization */
  .q-dialog .row.q-col-gutter-md {
    flex-direction: column !important;
    gap: 12px !important;
  }

  .q-dialog .col-md-4,
  .q-dialog .col-sm-6,
  .q-dialog .col-sm-12 {
    width: 100% !important;
    max-width: 100% !important;
    flex: 1 1 100% !important;
  }

  .q-dialog .q-item-label {
    font-size: 14px !important;
    margin-bottom: 4px !important;
  }

  .q-dialog .q-table {
    font-size: 12px !important;
  }

  .q-dialog .q-table th,
  .q-dialog .q-table td {
    padding: 8px 4px !important;
  }

  .q-dialog .button-group {
    display: flex !important;
    gap: 4px !important;
    flex-wrap: wrap !important;
  }

  .q-dialog .button-group .q-btn {
    min-width: 32px !important;
    height: 32px !important;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  /* Small Tablet View - Only size adjustments */
  .q-dialog .q-card {
    width: 90vw !important;
    min-width: 90vw !important;
    max-width: 90vw !important;
  }

  .q-dialog .q-card-section {
    padding: 16px !important;
  }

  .q-dialog .q-gutter-md {
    gap: 12px !important;
  }

  .q-dialog .q-select,
  .q-dialog .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .q-dialog .q-btn {
    min-height: 44px !important;
  }

  /* Small Tablet Dialog Content Organization */
  .q-dialog .row.q-col-gutter-md {
    gap: 16px !important;
  }

  .q-dialog .col-md-4 {
    width: 50% !important;
    max-width: 50% !important;
    flex: 1 1 50% !important;
  }

  .q-dialog .col-sm-6,
  .q-dialog .col-sm-12 {
    width: 100% !important;
    max-width: 100% !important;
    flex: 1 1 100% !important;
  }

  .q-dialog .q-item-label {
    font-size: 14px !important;
    margin-bottom: 6px !important;
  }

  .q-dialog .q-table {
    font-size: 13px !important;
  }

  .q-dialog .q-table th,
  .q-dialog .q-table td {
    padding: 10px 6px !important;
  }

  .q-dialog .button-group {
    display: flex !important;
    gap: 6px !important;
  }

  .q-dialog .button-group .q-btn {
    min-width: 36px !important;
    height: 36px !important;
  }
}

@media (min-width: 901px) and (max-width: 1200px) {
  /* Large Tablet View - Only size adjustments */
  .q-dialog .q-card {
    width: 80vw !important;
    min-width: 80vw !important;
    max-width: 80vw !important;
  }

  .q-dialog .q-card-section {
    padding: 20px !important;
  }

  .q-dialog .q-gutter-md {
    gap: 16px !important;
  }

  .q-dialog .q-select,
  .q-dialog .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  /* Large Tablet Dialog Content Organization */
  .q-dialog .row.q-col-gutter-md {
    gap: 20px !important;
  }

  .q-dialog .col-md-4 {
    width: 33.33% !important;
    max-width: 33.33% !important;
    flex: 1 1 33.33% !important;
  }

  .q-dialog .col-sm-6 {
    width: 50% !important;
    max-width: 50% !important;
    flex: 1 1 50% !important;
  }

  .q-dialog .col-sm-12 {
    width: 100% !important;
    max-width: 100% !important;
    flex: 1 1 100% !important;
  }

  .q-dialog .q-item-label {
    font-size: 15px !important;
    margin-bottom: 8px !important;
  }

  .q-dialog .q-table {
    font-size: 14px !important;
  }

  .q-dialog .q-table th,
  .q-dialog .q-table td {
    padding: 12px 8px !important;
  }

  .q-dialog .button-group {
    display: flex !important;
    gap: 8px !important;
  }

  .q-dialog .button-group .q-btn {
    min-width: 40px !important;
    height: 40px !important;
  }
}
.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}
</style>
