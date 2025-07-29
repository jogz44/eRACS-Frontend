<template>
  <q-card>
    <q-table
      :rows="store.augmentation"
      :columns="store.augmentationColumns"
      row-key="id"
      :pagination="store.pagination"
    >
      <template v-slot:body-cell-action="props">
        <q-td :props="props">
          <div class="button-group">
            <q-btn class="edit-btn" icon="edit" @click="store.editAugmentation(props.row)" />
            <q-btn
              outlined
              class="view-btn"
              icon="delete"
              @click="handleDelete(props.row.id)"
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

const handleDelete = async (id) => {
  try {
    const result = await store.deleteAugmentation(id)
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Augmentation deleted successfully',
        position: 'top'
      })
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Failed to delete augmentation',
        position: 'top'
      })
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'An error occurred while deleting',
      position: 'top'
    })
  }
}
</script>
