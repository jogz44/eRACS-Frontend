<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
      <div class="text-h5 text-weight-bold">Particulars</div>
    </div>

    <!-- Search and Date Filter -->
    <div class="q-mb-md">
      <div class="row items-center justify-between q-gutter-sm">
        <!-- Search Input -->
        <q-input
          outlined
          dense
          placeholder="Search..."
          class="col-md-3 col-sm-5 custom-search-input"
          style="min-width: 450px"
          v-model="searchTerm"
          @update:model-value="filterParticulars"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <div class="t q-px-xl"></div>

        <!-- Add Button -->
        <q-btn label="Add" icon="add" class="add-table-btn" @click="showAddDialog" />
      </div>

      <!-- Add/Edit Dialog -->
      <q-dialog v-model="showDialog">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">{{ dialogTitle }}</div>
          </q-card-section>
          <div><br /></div>
          <q-card-section class="q-pt-none">
            <div class="q-mb-md">
              <strong>Particular:</strong><br />
              <q-input
                filled
                v-model="currentParticular.particular_name"
                placeholder="Enter particular name"
              />
            </div>
          </q-card-section>
          <q-card-actions align="right" class="custom-actions">
            <q-btn flat label="Cancel" v-close-popup class="modal-cancel-btn" />
            <q-btn label="Save" class="modal-save-btn" @click="saveParticular" />
          </q-card-actions>
          <div><br /></div>
        </q-card>
      </q-dialog>
    </div>

    <!-- Data Table -->
    <q-card>
      <q-table
        :rows="filteredParticulars"
        :columns="store.particularColumns"
        row-key="id"
        :pagination="pagination"
        :loading="store.loading"
      >
        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="button-group">
              <q-btn class="edit-btn" icon="edit" @click="editParticular(props.row)" />
              <q-btn class="delete-btn" icon="delete" @click="confirmDeleteParticular(props.row)" />
            </div>
          </q-td>
        </template>
        <template v-slot:loading>
          <q-inner-loading showing color="primary" />
        </template>
        <template v-slot:no-data>
          <div class="full-width row flex-center q-gutter-sm">
            <q-icon size="2em" name="sentiment_dissatisfied" />
            <span>No data available</span>
          </div>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { useParticularStore } from 'src/stores/particularStore'
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const store = useParticularStore()

// Data
const showDialog = ref(false)
const dialogTitle = ref('Add Particular')
const currentParticular = ref({
  id: null,
  particular_name: '',
})
const searchTerm = ref('')

// Pagination settings
const pagination = ref({
  rowsPerPage: 10,
})

// Computed properties
const filteredParticulars = computed(() => {
  // Ensure particularRow is an array before filtering
  const particulars = Array.isArray(store.particularRow) ? store.particularRow : []

  if (!searchTerm.value) {
    return particulars
  }

  const search = searchTerm.value.toLowerCase()
  return particulars.filter(
    (p) => p && p.particular_name && p.particular_name.toLowerCase().includes(search),
  )
})

// Initialize data
onMounted(() => {
  fetchData()
})

const fetchData = async () => {
  try {
    await store.fetchParticulars()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error loading particulars: ' + (error.message || 'Unknown error'),
      position: 'top',
    })
  }
}

// Methods
const showAddDialog = () => {
  currentParticular.value = { id: null, particular_name: '' }
  dialogTitle.value = 'Add Particular'
  showDialog.value = true
}

const editParticular = (particular) => {
  currentParticular.value = { ...particular }
  dialogTitle.value = 'Edit Particular'
  showDialog.value = true
}

const filterParticulars = () => {
  // This function is called when the search input changes
  // The filtering is handled by the computed property
}

const saveParticular = async () => {
  if (!currentParticular.value.particular_name.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Particular cannot be empty',
      position: 'top',
    })
    return
  }

  try {
    if (currentParticular.value.id) {
      // Wait for the update to complete
      await store.updateParticular(currentParticular.value.id, {
        particular_name: currentParticular.value.particular_name,
      })
      $q.notify({
        type: 'positive',
        message: 'Particular updated successfully',
        position: 'top',
      })
    } else {
      await store.addParticular({
        particular_name: currentParticular.value.particular_name,
      })
      $q.notify({
        type: 'positive',
        message: 'Particular added successfully',
        position: 'top',
      })
    }
    showDialog.value = false

    await store.fetchParticulars()
    // Optional: Force refresh if needed
    // await store.fetchParticulars()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || store.error || 'Operation failed',
      position: 'top',
    })
  }
}
const confirmDeleteParticular = async (particular) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete "${particular.particular_name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await store.deleteParticular(particular.id)
      $q.notify({
        type: 'positive',
        message: 'Particular deleted successfully',
        position: 'top',
      })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.message || store.error || 'Delete failed',
        position: 'top',
      })
    }
  })
}
</script>

<style scoped>
/* Your existing styles remain unchanged */
</style>
