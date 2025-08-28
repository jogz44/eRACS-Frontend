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
    </q-table>
  </q-card>
</template>

<script setup>
import { useAugmentationStore } from 'stores/augmentation'
import { useQuasar } from 'quasar'


const store = useAugmentationStore()
const $q = useQuasar()

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
