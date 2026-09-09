<template>
    <q-page class="q-pa-md payeeslib-page">
        <div class="page-header q-mb-md">
            <div class="row items-center justify-between">
                <div class="text-h6 text-weight-medium">Payees Library</div>
                <q-btn icon="refresh" color="primary" flat dense @click="refreshPayees" :loading="loading" />
            </div>
        </div>

        <div class="q-mb-sm">
            <div class="row items-center q-gutter-sm">
                <q-input outlined dense placeholder="Search payee..." v-model="searchTerm" style="min-width: 300px">
                    <template v-slot:append>
                        <q-icon name="search" />
                    </template>
                </q-input>

                <q-btn-toggle
                    v-model="typeFilter"
                    dense
                    no-caps
                    unelevated
                    toggle-color="primary"
                    color="white"
                    text-color="primary"
                    :options="[
                        { label: 'All', value: 'All' },
                        { label: 'Local', value: 'Local' },
                        { label: 'Foreign', value: 'Foreign' },
                    ]"
                    @update:model-value="onTypeFilterChange"
                />

                <q-btn dense outlined color="negative" icon="clear" @click="clearAllFilters" />
                <q-space />
                <q-btn label="Add" icon="add" color="primary" @click="openAddDialog" />
            </div>
        </div>

        <q-card flat bordered>
            <q-table :key="tableRefreshKey" :rows="filteredPayees" :columns="store.columns" row-key="id" flat
                :loading="store.loading">
                <template v-slot:body-cell-status="props">
                    <q-td :props="props">
                        <q-badge
                            :color="props.row.status?.toLowerCase() === 'active' ? 'green' : 'grey'"
                            :label="props.row.status || 'Unknown'" />
                    </q-td>
                </template>

                <template v-slot:body-cell-type="props">
                    <q-td :props="props">
                        <q-badge
                            :color="props.row.type === 'Foreign' ? 'blue' : 'teal'"
                            :label="props.row.type || 'Local'" />
                    </q-td>
                </template>

                <template v-slot:body-cell-action="props">
                    <q-td :props="props" class="q-gutter-xs">
                        <q-btn dense icon="edit" color="orange" @click="editPayee(props.row)" />
                        <q-btn dense icon="delete" color="red" @click="deletePayee(props.row)" />
                    </q-td>
                </template>
            </q-table>
        </q-card>

        <!-- Add Payee Dialog -->
        <q-dialog v-model="showAddDialog">
            <q-card style="min-width: 960px; max-width: 96vw">
                <q-card-section class="q-pb-xs">
                    <div class="row items-center q-gutter-sm">
                        <div class="text-h6">Add New Payee</div>
                    </div>
                </q-card-section>

                <q-card-section>
                    <div class="row q-col-gutter-md">
                        <div class="col-md-4 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Payee: <strong class="text-red">*</strong></q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.payee" @keydown.enter="handleEnterKey" label="Payee Name" />
                        </div>
                        <div class="col-md-4 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Payee 2:</q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.payee2" @keydown.enter="handleEnterKey" label="Payee 2 Name" />
                        </div>

                        <div class="col-md-4 col-sm-12">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Taxpayer type: <strong class="text-red">*</strong></q-item-label>
                            <q-select outlined dense v-model="store.forms.payee.taxpayerType"
                                :options="taxpayerTypeOptions" use-input fill-input hide-selected input-debounce="0"
                                new-value-mode="add-unique" label="Select Taxpayer Type" option-label="label"
                                option-value="label" map-options emit-value @keydown.enter="handleEnterKey">
                            </q-select>
                        </div>
                    </div>
                    <div class="row q-col-gutter-sm q-mb-lg q-mt-xs">
                        <div class="col-md-4 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">TIN: <strong class="text-red">*</strong></q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.tin" @keydown.enter="handleEnterKey" label="TIN" />
                        </div>
                        <div class="col-md-8 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Description: </q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.description" @keydown.enter="handleEnterKey" label="Description" />
                        </div>
                    </div>

                    <q-separator />

                    <div class="row items-center q-gutter-sm q-mt-xs q-mb-xs justify-end">
                        <q-toggle
                            :model-value="store.forms.payee.type === 'Foreign'"
                            @update:model-value="(val) => (store.forms.payee.type = val ? 'Foreign' : 'Local')"
                            label="Foreign Address"
                            color="primary"
                            style="font-weight: bold; font-size: 13px;"
                        />
                    </div>

                    <!-- Local Address -->
                    <template v-if="store.forms.payee.type !== 'Foreign'">
                        <div class="row q-col-gutter-sm q-mb-sm">
                            <div class="col-md-8 col-sm-6">
                                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Address:</q-item-label>
                                <q-input outlined dense v-model="store.forms.payee.address" @keydown.enter="handleEnterKey" label="Address" />
                            </div>
                            <div class="col-md-4 col-sm-6">
                                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Zip Code:</q-item-label>
                                <q-input outlined dense v-model="store.forms.payee.zipCode" @keydown.enter="handleEnterKey" label="Zip Code" />
                            </div>
                        </div>
                    </template>

                    <!-- Foreign Address -->
                    <template v-else>
                        <div class="row q-col-gutter-sm q-mb-sm">
                            <div class="col-md-8 col-sm-6">
                                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Foreign Address:</q-item-label>
                                <q-input outlined dense v-model="store.forms.payee.foreignAddress" @keydown.enter="handleEnterKey" label="Foreign Address" />
                            </div>
                            <div class="col-md-4 col-sm-6">
                                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Foreign Zip Code:</q-item-label>
                                <q-input outlined dense v-model="store.forms.payee.foreignZipCode" @keydown.enter="handleEnterKey" label="Zip Code" />
                            </div>
                        </div>
                    </template>

                    <div class="row q-col-gutter-sm q-mb-sm q-mt-xs">
                        <div class="col-md-4 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">First Name:</q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.firstName" @keydown.enter="handleEnterKey" label="First Name" />
                        </div>
                        <div class="col-md-4 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Middle Name:</q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.middleName" @keydown.enter="handleEnterKey" label="Middle Name" />
                        </div>
                        <div class="col-md-4 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Last Name:</q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.lastName" @keydown.enter="handleEnterKey" label="Last Name" />
                        </div>
                    </div>
                </q-card-section>

                <q-card-actions align="right" class="q-pa-md">
                    <q-btn flat label="Cancel" v-close-popup @click="store.resetForm()" />
                    <q-btn
                        label="Add"
                        color="primary"
                        style="min-width: 145px"
                        @click="handleAddPayee"
                        :loading="store.isLoading"
                        :disable="!isAddFormValid"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Edit Payee Dialog -->
        <q-dialog v-model="showEditDialog">
            <q-card style="min-width: 960px; max-width: 96vw">
                <q-card-section class="q-pb-none">
                    <div class="row items-center q-gutter-sm">
                        <q-icon name="edit" color="primary" size="sm" />
                        <div class="text-h6">Edit Payee</div>
                    </div>
                </q-card-section>

                <q-card-section>
                    <div class="row q-col-gutter-md">
                        <div class="col-md-4 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Payee: <strong class="text-red">*</strong></q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.payee" @keydown.enter="handleEnterKey" label="Payee Name" />
                        </div>
                        <div class="col-md-4 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Payee 2:</q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.payee2" @keydown.enter="handleEnterKey" label="Payee 2 Name" />
                        </div>

                        <div class="col-md-4 col-sm-12">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Taxpayer type: <strong class="text-red">*</strong></q-item-label>
                            <q-select outlined dense v-model="store.forms.payee.taxpayerType"
                                :options="taxpayerTypeOptions" use-input fill-input hide-selected input-debounce="0"
                                new-value-mode="add-unique" label="Select Taxpayer Type" option-label="label"
                                option-value="label" map-options emit-value @keydown.enter="handleEnterKey">
                            </q-select>
                        </div>
                    </div>
                    <div class="row q-col-gutter-sm q-mb-sm q-mt-xs">
                        <div class="col-md-4 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">TIN: <strong class="text-red">*</strong></q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.tin" @keydown.enter="handleEnterKey" label="TIN" />
                        </div>
                        <div class="col-md-8 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Description: </q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.description" @keydown.enter="handleEnterKey" label="Description" />
                        </div>
                    </div>

                    <q-separator />

                    <div class="row items-center q-gutter-sm q-mt-xs q-mb-xs justify-end">
                        <q-toggle
                            :model-value="store.forms.payee.type === 'Foreign'"
                            @update:model-value="(val) => (store.forms.payee.type = val ? 'Foreign' : 'Local')"
                            label="Foreign Address"
                            color="primary"
                            style="font-weight: bold; font-size: 13px;"
                        />
                    </div>

                    <template v-if="store.forms.payee.type !== 'Foreign'">
                        <div class="row q-col-gutter-sm q-mb-sm">
                            <div class="col-md-8 col-sm-6">
                                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Address: <strong class="text-red">*</strong></q-item-label>
                                <q-input outlined dense v-model="store.forms.payee.address" @keydown.enter="handleEnterKey" label="Address" />
                            </div>
                            <div class="col-md-4 col-sm-6">
                                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Zip Code: <strong class="text-red">*</strong></q-item-label>
                                <q-input outlined dense v-model="store.forms.payee.zipCode" @keydown.enter="handleEnterKey" label="Zip Code" />
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="row q-col-gutter-sm q-mb-sm">
                            <div class="col-md-8 col-sm-6">
                                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Foreign Address: <strong class="text-red">*</strong></q-item-label>
                                <q-input outlined dense v-model="store.forms.payee.foreignAddress" @keydown.enter="handleEnterKey" label="Foreign Address" />
                            </div>
                            <div class="col-md-4 col-sm-6">
                                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Foreign Zip Code: <strong class="text-red">*</strong></q-item-label>
                                <q-input outlined dense v-model="store.forms.payee.foreignZipCode" @keydown.enter="handleEnterKey" label="Zip Code" />
                            </div>
                        </div>
                    </template>

                    <div class="row q-col-gutter-sm q-mb-sm q-mt-xs">
                        <div class="col-md-4 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">First Name: <strong class="text-red">*</strong></q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.firstName" @keydown.enter="handleEnterKey" label="First Name" />
                        </div>
                        <div class="col-md-4 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Middle Name:</q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.middleName" @keydown.enter="handleEnterKey" label="Middle Name" />
                        </div>
                        <div class="col-md-4 col-sm-6">
                            <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px;">Last Name: <strong class="text-red">*</strong></q-item-label>
                            <q-input outlined dense v-model="store.forms.payee.lastName" @keydown.enter="handleEnterKey" label="Last Name" />
                        </div>
                    </div>
                </q-card-section>

                <q-card-actions align="right" class="q-pa-md">
                    <q-btn flat label="Cancel" v-close-popup @click="store.resetForm()" />
                    <q-btn
                        label="Save"
                        color="primary"
                        style="min-width: 145px"
                        @click="handleEditPayeeSaveClick"
                        :loading="store.isLoading"
                        :disable="!isEditFormValid"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Delete Payee Dialog -->
        <q-dialog v-model="showDeleteDialog">
            <q-card style="min-width: 400px">
                <q-card-section class="text-center">
                    <q-icon name="delete" size="48px" color="negative" />
                </q-card-section>

                <q-card-section class="text-center q-pt-none">
                    <div class="text-h6">Delete Payee</div>
                </q-card-section>

                <q-card-section class="text-center q-pt-none">
                    Are you sure you want to delete the payee "<strong>{{ deletingPayee.name }}</strong>"? This action cannot be undone.
                </q-card-section>

                <q-card-actions align="center" class="q-pa-md">
                    <q-btn flat label="Cancel" v-close-popup />
                    <q-btn label="Delete" color="negative" @click="confirmDeletePayee" :loading="store.loading" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { usePayeeStore } from 'src/stores/payeeStore'

const $q = useQuasar()
const store = usePayeeStore()

const loading = ref(false)
const searchTerm = ref('')
const typeFilter = ref('All')
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const editingPayeeId = ref(null)
const deletingPayee = ref({ id: null, name: '' })
const tableRefreshKey = ref(0)

// Fetch real data as soon as the page loads
onMounted(() => {
  refreshPayees()
})

const filteredPayees = computed(() => {
  const search = searchTerm.value.toLowerCase()
  return store.payees.filter((payee) => (payee.payee_name || '').toLowerCase().includes(search))
})

const isAddFormValid = computed(() => {
  const f = store.forms.payee
  return !!f.payee && f.payee.trim().length >= 3 && !!f.taxpayerType && !!f.tin
})

const isEditFormValid = computed(() => {
  const f = store.forms.payee
  return (
    !!f.payee &&
    f.payee.trim().length >= 3 &&
    !!f.taxpayerType &&
    !!f.tin &&
    !!f.firstName &&
    !!f.lastName &&
    (f.type === 'Foreign' ? !!f.foreignAddress && !!f.foreignZipCode : !!f.address && !!f.zipCode)
  )
})

const handleEnterKey = (e) => { if (e) e.preventDefault() }

const refreshPayees = async () => {
  loading.value = true
  try {
    const type = typeFilter.value === 'All' ? null : typeFilter.value
    await store.fetchPayees(type)
    tableRefreshKey.value++
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || error.message || 'Failed to refresh data',
      icon: 'error',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const onTypeFilterChange = () => {
  refreshPayees()
}

const clearAllFilters = () => {
  searchTerm.value = ''
  typeFilter.value = 'All'
  refreshPayees()
}

const openAddDialog = () => {
  store.resetForm()
  showAddDialog.value = true
}

const handleAddPayee = async () => {
  if (!isAddFormValid.value) return

  try {
    await store.addPayee(store.forms.payee)
    showAddDialog.value = false
    store.resetForm()
    tableRefreshKey.value++

    $q.notify({
      type: 'positive',
      message: 'Payee added successfully',
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || error.message || 'Failed to add payee',
      position: 'top',
    })
  }
}

const handleEditPayeeSaveClick = async () => {
  if (!isEditFormValid.value || !editingPayeeId.value) return

  try {
    await store.editPayee(editingPayeeId.value, store.forms.payee)
    showEditDialog.value = false
    store.resetForm()
    await refreshPayees()

    $q.notify({
      type: 'positive',
      message: 'Payee updated successfully',
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || error.message || 'Failed to update payee',
      position: 'top',
    })
  }
}

const editPayee = (payee) => {
  editingPayeeId.value = payee.id
  store.loadIntoForm(payee)
  showEditDialog.value = true
}

const deletePayee = (payee) => {
  deletingPayee.value = {
    id: payee.id,
    name: payee.payee_name || '',
  }
  showDeleteDialog.value = true
}

const confirmDeletePayee = async () => {
  if (!deletingPayee.value.id) return

  try {
    await store.deletePayee(deletingPayee.value.id)
    showDeleteDialog.value = false
    deletingPayee.value = { id: null, name: '' }
    await refreshPayees()

    $q.notify({
      type: 'positive',
      message: 'Payee deleted successfully',
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || error.message || 'Failed to delete payee',
      position: 'top',
    })
  }
}

const taxpayerTypeOptions = [
  { label: 'Individual', value: 'individual' },
  { label: 'Non-Individual', value: 'nonIndividual' },
]
</script>
<style scoped>
.payeeslib-page {
    background-color: #fafafa;
    min-height: 100vh;
}

.page-header {
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 8px;
}

@media (max-width: 768px) {
    .q-pa-md {
        padding: 8px;
    }

    .row.items-center.q-gutter-sm {
        flex-direction: column;
        align-items: stretch;
    }

    .row.items-center.q-gutter-sm>* {
        margin-bottom: 8px;
        width: 100%;
    }
}
</style>
