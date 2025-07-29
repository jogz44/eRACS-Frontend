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
  background-color: #D9D9D9; /* Light gray background */
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
</style>
