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
              @click="handleEditAugmentation(props.row)"
              :loading="editLoading[props.row.id]"
              :disable="editLoading[props.row.id]"
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
import { ref } from 'vue'

const store = useAugmentationStore()
const $q = useQuasar()
const editLoading = ref({})

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

const handleEditAugmentation = async (row) => {
  editLoading.value[row.id] = true
  try {
    await store.editAugmentation(row)
  } catch (error) {
    console.error('Error opening edit augmentation:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open edit augmentation',
      icon: 'error',
      position: 'top',
      timeout: 3000
    })
  } finally {
    editLoading.value[row.id] = false
  }
}
</script>
