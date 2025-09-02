<template>
  <q-card>
    <q-table
      :rows="store.filteredAugmentations"
      :columns="columns"
      row-key="id"
      :pagination="store.pagination"
      :loading="store.loadingAugmentations"
    >

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
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { computed, ref } from 'vue'
import { useActivityLogging } from 'src/composables/useActivityLogging'


const store = useAugmentationStore()
const $q = useQuasar()
const authStore = useAuthStore()

// Check if current user is admin
const isAdminUser = computed(() => authStore.admin)
const reviewedSet = ref(new Set())
const isReviewed = (id) => reviewedSet.value.has(id)
const { logAdminActivity } = useActivityLogging()

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
