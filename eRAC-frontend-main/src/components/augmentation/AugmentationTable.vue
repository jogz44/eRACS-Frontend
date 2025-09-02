<template>
  <q-card>
    <q-table
      :rows="filteredRows"
      :columns="store.augmentationColumns"
      row-key="id"
      :pagination="store.pagination"
      :loading="store.loadingAugmentations"
    >

      <template #body-cell-transfer_summary="props">
        <q-td :props="props">
          <div class="transfer-summary-container">
            <q-badge
              v-for="(transfer, index) in getTransferSummary(props.row)"
              :key="index"
              :color="getTransferTypeColor(transfer)"
              :label="transfer"
              class="transfer-summary-badge q-mr-xs q-mb-xs"
            />
          </div>
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <div class="row items-center justify-center q-gutter-xs">
            <q-btn
              dense
              icon="visibility"
              color="blue"
              size="md"
              @click="viewAugmentation(props.row)"
              title="View Details"
            />
            <q-btn
              dense
              icon="delete"
              color="negative"
              size="md"
              @click="deleteAugmentation(props.row)"
              title="Delete"
            />
          </div>
        </q-td>
      </template>

    </q-table>
  </q-card>
</template>

<script setup>
import { useAugmentationStore } from 'stores/augmentation'
import { useQuasar } from 'quasar'
import { computed } from 'vue'

const props = defineProps({
  filteredData: {
    type: Array,
    default: () => []
  }
})

const store = useAugmentationStore()
const $q = useQuasar()

// Use filtered data if provided, otherwise fall back to store data
const filteredRows = computed(() => {
  return props.filteredData.length > 0 ? props.filteredData : store.augmentation
})

// Helper function to get budget source label
const getBudgetSourceLabel = (budgetSource) => {
  if (budgetSource?.toLowerCase().includes('annual')) {
    return 'Annual'
  } else if (budgetSource?.toLowerCase().includes('supplemental')) {
    return 'Supplemental'
  }
  return 'Annual' // Default
}

// Helper function to get transfer type color
const getTransferTypeColor = (transferType) => {
  if (!transferType) return 'grey'
  
  if (transferType.includes('Annual → Annual')) {
    return 'primary'
  } else if (transferType.includes('Supplemental → Supplemental')) {
    return 'secondary'
  } else if (transferType.includes('Annual → Supplemental') || transferType.includes('Supplemental → Annual')) {
    return 'orange' // Cross-budget transfer
  }
  return 'grey'
}

// Helper function to get transfer summary for an augmentation
const getTransferSummary = (augmentation) => {
  if (!augmentation.details || !Array.isArray(augmentation.details)) {
    return []
  }
  
  const transferTypes = new Set()
  
  augmentation.details.forEach(detail => {
    const fromBudget = detail.from_budget_source || 'Annual Budget'
    const toBudget = detail.to_budget_source || 'Annual Budget'
    const transferType = `${getBudgetSourceLabel(fromBudget)} → ${getBudgetSourceLabel(toBudget)}`
    transferTypes.add(transferType)
  })
  
  return Array.from(transferTypes)
}

const viewAugmentation = (row) => {
  store.viewAugmentationOnly(row)
}

const deleteAugmentation = (row) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete this augmentation?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      // Call store method to delete augmentation
      await store.deleteAugmentation(row.id)
      $q.notify({
        type: 'positive',
        message: 'Augmentation deleted successfully!',
        icon: 'check_circle',
        position: 'top',
      })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to delete augmentation',
        icon: 'error',
        position: 'top',
      })
    }
  })
}
</script>

<style scoped>
.transfer-summary-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  align-items: center;
}

.transfer-summary-badge {
  font-size: 0.7rem;
  font-weight: 600;
  min-width: 80px;
  text-align: center;
}

/* Cross-budget transfer row highlighting */
.cross-budget-transfer-row {
  background-color: rgba(255, 152, 0, 0.1) !important;
}
</style>
