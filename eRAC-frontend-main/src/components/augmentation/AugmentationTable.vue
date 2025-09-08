<template>
  <q-card>
    <q-table
      :rows="store.filteredAugmentations"
      :columns="columns"
      row-key="id"
      :pagination="store.pagination"
      :loading="store.loadingAugmentations"
    >

      <template #body-cell-expense_class_summary="props">
        <q-td :props="props">
          <div class="expense-class-summary-container">
            <q-badge
              v-for="(expenseClass, index) in getExpenseClassSummary(props.row)"
              :key="index"
              :color="getExpenseClassColor(expenseClass)"
              :label="expenseClass"
              class="expense-class-summary-badge q-mr-xs q-mb-xs"
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
            :disable="isLoadingReview(props.row.id)"
            :loading="isLoadingReview(props.row.id)"
            :unelevated="!isReviewed(props.row.id)"
            rounded
            @click="isReviewed(props.row.id) ? showRemarksDialog(props.row.id) : handleReviewClick(props.row)"
          >
            <q-tooltip v-if="isReviewed(props.row.id)" class="bg-grey-8">
              Click to view admin remarks
            </q-tooltip>
            <q-tooltip v-else-if="isLoadingReview(props.row.id)" class="bg-grey-8">
              Loading review status...
            </q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <!-- Review Confirmation Dialog -->
      <q-dialog v-model="showReviewDialog" @keydown.enter="confirmReview">
        <q-card style="min-width: 400px">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Confirm Review</div>
          </q-card-section>

          <q-card-section>
            <div class="q-mb-md">
              <div class="text-body1 q-mb-sm">
                Mark Augmentation Ref <strong>{{ currentReviewRow?.ref_number || currentReviewRow?.refNo }}</strong> as reviewed?
              </div>
              <q-input
                outlined
                v-model="adminRemarks"
                label="Admin Remarks"
                placeholder="Enter your remarks here..."
                type="textarea"
                rows="3"
                :rules="[(val) => !!val || 'Remarks are required']"
                @keydown.enter="confirmReview"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="cancelReview" />
            <q-btn
              label="OK"
              color="primary"
              @click="confirmReview"
              :disable="!adminRemarks.trim()"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

    </q-table>
  </q-card>
</template>

<script setup>
import { useAugmentationStore } from 'stores/augmentation'
import { useAuthStore } from 'stores/auth'
import { computed, ref, watch } from 'vue'
import { useActivityLogging } from 'src/composables/useActivityLogging'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

// // Define props
// const props = defineProps({
//   filteredData: {
//     type: Array,
//     default: () => []
//   }
// })

const store = useAugmentationStore()
const $q = useQuasar()
const authStore = useAuthStore()

// Check if current user is admin
const isAdminUser = computed(() => authStore.admin)
const reviewedSet = ref(new Set())
const augmentationRemarks = ref(new Map()) // store remarks per augmentation id
const loadingReviews = ref(new Set()) // Track which items are loading reviews

const isReviewed = (id) => reviewedSet.value.has(id)
const getRemarks = (id) => augmentationRemarks.value.get(id) || ''
const isLoadingReview = (id) => loadingReviews.value.has(id)
const { logAdminActivity } = useActivityLogging()

// Load existing reviews for augmentations
const loadAugmentationReviews = async () => {
  try {
    const items = store.filteredAugmentations.map(item => ({
      reviewable_type: 'App\\Models\\BudgetAugmentation',
      reviewable_id: item.id
    }))
    
    if (items.length === 0) return
    
    // Mark all items as loading
    items.forEach(item => loadingReviews.value.add(item.reviewable_id))
    
    const response = await api.post('/api/admin/reviews/bulk', { items }, {
      headers: {
        Authorization: `Bearer ${authStore.adminToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    
    if (response.data.success) {
      response.data.data.forEach(review => {
        if (review.is_reviewed && review.review) {
          reviewedSet.value.add(review.reviewable_id)
          augmentationRemarks.value.set(review.reviewable_id, review.review.remarks)
        }
        // Remove from loading set
        loadingReviews.value.delete(review.reviewable_id)
      })
    }
  } catch (error) {
    console.error('Failed to load augmentation reviews:', error)
    // Clear loading state on error
    store.filteredAugmentations.forEach(item => {
      loadingReviews.value.delete(item.id)
    })
  }
}

// Review dialog state
const showReviewDialog = ref(false)
const adminRemarks = ref('')
const currentReviewRow = ref(null)
const handleReviewClick = (row) => {
  if (isReviewed(row.id)) return
  currentReviewRow.value = row
  adminRemarks.value = ''
  showReviewDialog.value = true
}

const confirmReview = async () => {
  if (!adminRemarks.value.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Please enter your remarks before confirming the review.',
      icon: 'warning',
      position: 'top',
    })
    return
  }

  if (currentReviewRow.value) {
    try {
      const response = await api.post('/api/admin/reviews', {
        reviewable_type: 'App\\Models\\BudgetAugmentation',
        reviewable_id: currentReviewRow.value.id,
        remarks: adminRemarks.value
      }, {
        headers: {
          Authorization: `Bearer ${authStore.adminToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      if (response.data.success) {
        reviewedSet.value.add(currentReviewRow.value.id)
        augmentationRemarks.value.set(currentReviewRow.value.id, adminRemarks.value)
        
        logAdminActivity('Reviewed Item', `Admin reviewed Augmentation Ref ${currentReviewRow.value.ref_number || currentReviewRow.value.refNo || ''} (Barangay: ${currentReviewRow.value.barangay_name || 'Unknown Barangay'}) - Remarks: ${adminRemarks.value}`)
        
        $q.notify({
          type: 'positive',
          message: 'Augmentation marked as reviewed successfully!',
          icon: 'check_circle',
          position: 'top',
        })
      } else {
        throw new Error(response.data.message || 'Failed to save review')
      }
    } catch (error) {
      console.error('Failed to save review:', error)
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to save review',
        icon: 'error',
        position: 'top',
      })
      return
    }
  }

  showReviewDialog.value = false
  adminRemarks.value = ''
  currentReviewRow.value = null
}

const cancelReview = () => {
  showReviewDialog.value = false
  adminRemarks.value = ''
  currentReviewRow.value = null
}

const showRemarksDialog = (id) => {
  const remarks = getRemarks(id)
  if (remarks) {
    $q.dialog({
      title: 'Admin Remarks',
      message: remarks,
      ok: { label: 'Close', color: 'primary' }
    })
  }
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


// Helper function to get expense class color
const getExpenseClassColor = (expenseClass) => {
  if (!expenseClass) return 'grey'
  
  // Color coding based on expense class
  const classColors = {
    'Sangguniang Kabataan': 'purple',
    'General Services': 'blue',
    'Social Services': 'green',
    'Economic Services': 'orange',
    'Environmental Services': 'teal',
    'Capital Outlay': 'indigo',
    'Disaster Risk Reduction': 'red',
    'Infrastructure': 'brown',
    'Peace and Order': 'deep-orange',
    'Sports and Recreation': 'pink',
    'Other': 'grey'
  }
  
  return classColors[expenseClass] || 'info'
}

// Helper function to get expense class summary for an augmentation
const getExpenseClassSummary = (augmentation) => {
  if (!augmentation.details || !Array.isArray(augmentation.details)) {
    return []
  }

  const expenseClasses = new Set()

  augmentation.details.forEach(detail => {
    if (detail.expense_class) {
      expenseClasses.add(detail.expense_class)
    }
  })

  return Array.from(expenseClasses)
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

// Watch for augmentations data to be available and load reviews immediately
watch(
  () => store.filteredAugmentations,
  async (newAugmentations) => {
    if (isAdminUser.value && newAugmentations && newAugmentations.length > 0) {
      // Only load if we haven't loaded reviews yet (prevent double loading)
      if (reviewedSet.value.size === 0 && loadingReviews.value.size === 0) {
        await loadAugmentationReviews()
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.expense-class-summary-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  align-items: center;
}

.expense-class-summary-badge {
  font-size: 0.7rem;
  font-weight: 600;
  min-width: 80px;
  text-align: center;
}

/* Cross-class transfer row highlighting */
.cross-class-transfer-row {
  background-color: rgba(255, 152, 0, 0.1) !important;
}
</style>
