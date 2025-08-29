<template>
  <q-card>
    <q-table
      :rows="store.augmentation"
      :columns="store.augmentationColumns"
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
            <q-btn
              color="negative"
               dense
                  icon="delete"
              size="md"
              @click="confirmDelete(props.row)"
              title="Delete"
              v-permission="'delete'"
            />
          </div>
        </q-td>
      </template>

      <template #body-cell-remarks="props">
        <q-td :props="props">
          <q-btn
            dense
            :icon="isAugmentationReviewed(props.row.id) ? 'check' : 'rate_review'"
            :label="isAugmentationReviewed(props.row.id) ? 'Reviewed' : 'Review'"
            :color="isAugmentationReviewed(props.row.id) ? 'positive' : 'primary'"
            :outline="!isAugmentationReviewed(props.row.id)"
            :disable="isAugmentationReviewed(props.row.id)"
            :unelevated="!isAugmentationReviewed(props.row.id)"
            rounded
            @click="!isAugmentationReviewed(props.row.id) && handleAugmentationReviewClick(props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
import { useAugmentationStore } from 'stores/augmentation'
import { useQuasar } from 'quasar'
import { ref } from 'vue'

const store = useAugmentationStore()
const $q = useQuasar()

// Local reviewed state for augmentation rows
const augmentationReviewedSet = ref(new Set())

const isAugmentationReviewed = (id) => augmentationReviewedSet.value.has(id)

const handleAugmentationReviewClick = (row) => {
  // Add the augmentation to reviewed set
  augmentationReviewedSet.value.add(row.id)

  $q.notify({
    type: 'positive',
    message: 'Augmentation reviewed successfully!',
    icon: 'check_circle',
    position: 'top',
  })
}

const viewAugmentation = (row) => {
  store.editAugmentation(row)
}

const confirmDelete = (row) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete augmentation ${row.ref_number}?`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative'
    }
  }).onOk(async () => {
    try {
      const result = await store.deleteAugmentation(row.id)
      if (result.success) {
        $q.notify({
          type: 'positive',
          message: 'Augmentation deleted successfully!',
          icon: 'check_circle',
          position: 'top',
        })
      } else {
        $q.notify({
          type: 'negative',
          message: result.error || 'Failed to delete augmentation',
          icon: 'error',
          position: 'top',
        })
      }
    } catch (error) {
    //   $q.notify({
    //     type: 'negative',
    //     message: 'An error occurred while deleting the augmentation',
    //     icon: 'error',
    //     position: 'top',
    //   })
    // }
      console.error('Error deleting augmentation:', error)
    }
  })

}
</script>
