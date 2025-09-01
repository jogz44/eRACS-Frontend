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


const store = useAugmentationStore()
const $q = useQuasar()

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
