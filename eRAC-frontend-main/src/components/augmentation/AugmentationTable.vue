<template>
  <q-card>
    <q-table
      :rows="store.augmentation"
      :columns="store.augmentationColumns"
      row-key="id"
      :pagination="store.pagination"
      :loading="store.loadingAugmentations"
    >
      <template v-slot:body-cell-action="props">
        <q-td :props="props">
          <div class="button-group">
            <q-btn
              dense
              icon="edit"
              color="orange"
              @click="store.editAugmentation(props.row)"
              v-permission="'edit'"
            />
            <q-btn
              dense
              color="red"
              icon="delete"
              @click="handleDelete(props.row.id)"
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

const handleDelete = async (id) => {
  try {
    const result = await store.deleteAugmentation(id)
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Augmentation deleted successfully',
        position: 'top',
      })
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Failed to delete augmentation',
        position: 'top',
      })
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'An error occurred while deleting',
      position: 'top',
    })
  }
}
</script>
