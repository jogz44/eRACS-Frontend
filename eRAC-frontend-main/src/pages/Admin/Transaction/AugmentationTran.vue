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

          <div class="q-mb-sm">
        <SearchFilters />
        <AugmentationTable />
      </div>
      
      <!-- Augmentation Dialog for viewing details -->
      <AugmentationDialog />
    </q-page>
  </template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAugmentationStore } from 'stores/augmentation'
import { useAuthStore } from 'stores/auth'
import AugmentationTable from 'components/augmentation/AugmentationTable.vue'
import SearchFilters from 'components/augmentation/SearchFilters.vue'
import AugmentationDialog from 'components/augmentation/AugmentationDialog.vue'
import { usePageLogging } from '../../../composables/usePageLogging'

const $q = useQuasar()
const store = useAugmentationStore()
const authStore = useAuthStore()
const loading = ref(false)
const { logPageVisit } = usePageLogging()

const loadPendingUsers = async () => {
  loading.value = true
  try {
    console.log('Refreshing augmentations for admin user')
    console.log('Current admin state:', {
      isAdmin: authStore.admin,
      hasAdminToken: !!authStore.adminToken
    })
    
    await store.fetchAugmentations()
    $q.notify({
      type: 'positive',
      message: 'Augmentations refreshed!',
      icon: 'refresh',
      position: 'top',
    })
  } catch (error) {
    console.error('Error refreshing augmentations:', error)
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
  try {
    
    // For admin users, only fetch augmentations (view-only)
    // fetchAvailableBudgets is only needed for creating augmentations, which admins don't do
    await store.fetchAugmentations()
    // Log page visit
    await logPageVisit('Current Augmentation')
  } catch (error) {
    console.error('Error in admin augmentation page onMounted:', error)
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

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }
}
</style>
