<template>
  <q-card>
    <q-table
      :rows="tableData"
      :columns="columns"
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
            <!-- Only show delete button for barangay users, not admin users -->
            <q-btn
              v-if="!isAdminUser"
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

      <!-- Admin-only Remarks column with Review button -->
      <template v-if="isAdminUser" #body-cell-remarks="props">
        <q-td :props="props">
          <q-btn
            dense
            :icon="isReviewed(props.row.id) ? 'check' : 'rate_review'"
            :label="isReviewed(props.row.id) ? 'Reviewed' : 'Review'"
            :color="isReviewed(props.row.id) ? 'positive' : 'primary'"
            :outline="!isReviewed(props.row.id)"
            :disable="isReviewed(props.row.id)"
            :unelevated="!isReviewed(props.row.id)"
            rounded
            @click="!isReviewed(props.row.id) && handleReviewClick(props.row)"
          />
        </q-td>
      </template>

    </q-table>
  </q-card>
</template>

<script setup>
import { useAugmentationStore } from 'stores/augmentation'
import { useAuthStore } from 'stores/auth'
import { computed, ref } from 'vue'
import { useActivityLogging } from 'src/composables/useActivityLogging'
import { useQuasar } from 'quasar'

// Define props
const props = defineProps({
  filteredData: {
    type: Array,
    default: () => []
  }
})

const store = useAugmentationStore()
const $q = useQuasar()
const authStore = useAuthStore()

// Check if current user is admin
const isAdminUser = computed(() => authStore.admin)
const reviewedSet = ref(new Set())
const isReviewed = (id) => reviewedSet.value.has(id)
const { logAdminActivity } = useActivityLogging()

// Always use prop data if provided, even if it's empty
const tableData = computed(() => {
  // Always use the prop data, even if it's an empty array
  return props.filteredData || []
})

const handleReviewClick = (row) => {
  reviewedSet.value.add(row.id)
  logAdminActivity('Reviewed Item', `Admin reviewed Augmentation Ref ${row.ref_number || row.refNo || ''} (Barangay: ${row.barangay_name || 'Unknown Barangay'})`)
}

// Build columns dynamically to include admin-only remarks column
const columns = computed(() => {
  const base = store.augmentationColumns
  if (!isAdminUser.value) return base
  return [
    ...base,
    {
      name: 'remarks',
      label: 'Remarks',
      field: '',
      align: 'center',
      sortable: false,
    },
  ]
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
