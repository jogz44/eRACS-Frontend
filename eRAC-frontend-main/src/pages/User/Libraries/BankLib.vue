<template>
  <q-page class="q-pa-md banklib-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">Bank Library</div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="loadPendingUsers"
          :loading="loading"
        />
      </div>
    </div>

    <div class="q-mb-sm">
      <div class="row items-center q-gutter-sm">
        <q-input
          outlined
          dense
          placeholder="Search banks..."
          v-model="searchTerm"
          style="min-width: 300px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-btn
          dense
          outlined
          color="negative"
          icon="clear"
          @click="clearAllFilters"
        />

        <q-space />

        <q-btn
          label="Add"
          icon="add"
          color="primary"
          @click="showAddDialog = true"
        />
      </div>
    </div>

    <q-card flat bordered>
      <q-table
        :key="tableRefreshKey"
        :rows="filteredBanks"
        :columns="bankStore.columns"
        row-key="id"
        flat
        :loading="bankStore.isLoading"
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.status === 'Available' ? 'green' : 'orange'"
              :label="props.row.status === 'Available' ? 'Available' : 'Consumed'"
            />
          </q-td>
        </template>

        <template #body-cell-view="props">
          <q-td :props="props">
            <q-btn
              dense
              label="Manage Cheques"
              color="primary"
              @click="showBookletDetails(props.row)"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-xs">
            <q-btn
              dense
              icon="edit"
              color="orange"
              @click="editBank(props.row)"
            />
            <q-btn
              dense
              icon="delete"
              color="red"
              @click="deleteBank(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Add Bank Dialog -->
    <q-dialog v-model="showAddDialog" @keydown.enter="handleAddBankEnterKey">
      <q-card style="min-width: 400px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Add New Bank</div>
        </q-card-section>

        <q-card-section>
          <q-form >
            <q-input
              v-model="newBankName"
              label="Bank Name"
              outlined

              :rules="[
                (val) => !!val || 'Bank name is required',
                (val) => val.length >= 3 || 'Name must be at least 3 characters',
              ]"
              lazy-rules
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup :disable="bankStore.isLoading" />
          <q-btn
            label="Save"
            color="primary"

            :disable="!newBankName || newBankName.length < 3 || bankStore.isLoading"
            :loading="bankStore.isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Bank Dialog -->
    <q-dialog v-model="showEditDialog" @keydown.enter="handleEditBankEnterKey">
      <q-card style="min-width: 400px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Edit Bank</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleEditBankSaveClick">
            <q-input
              v-model="editingBank.name"
              label="Bank Name"
              outlined
              @keydown.enter="handleEditBankEnterKey"
              :rules="[
                (val) => !!val || 'Bank name is required',
                (val) => val.length >= 3 || 'Name must be at least 3 characters',
              ]"
              lazy-rules
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            label="Save"
            color="primary"
            @click="handleEditBankSaveClick"
            :disable="!editingBank.name || editingBank.name.length < 3"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Bank Dialog -->
    <q-dialog v-model="showDeleteDialog" @keydown.enter="handleDeleteBankEnterKey">
      <q-card style="min-width: 400px">
        <q-card-section class="text-center">
          <q-icon name="delete" size="48px" color="negative" />
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          <div class="text-h6">Delete Bank</div>
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          Are you sure you want to delete the bank "<strong>{{ deletingBank.name }}</strong>"? This action cannot be undone.
        </q-card-section>

        <q-card-actions align="center" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            label="Delete"
            color="negative"
            @click="confirmDeleteBank"
            :loading="bankStore.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Booklet Details Dialog -->
    <q-dialog v-model="showBookletDialog" persistent>
      <q-card style="min-width: 800px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Booklets: {{ selectedBank?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup @click="loadPendingUsers" />
        </q-card-section>

        <q-card-section>
          <div class="row items-center q-mb-sm q-gutter-sm">
            <q-input
              dense
              debounce="300"
              v-model="search"
              placeholder="Search Booklet..."
              outlined
              clearable
              style="width: 300px"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>

            <q-space />
            <q-btn
              label="Add"
              color="primary"
              icon="add"
              @click="showAddBookletDialog = true"
            />
          </div>

          <q-table
            :rows="filteredBooklets"
            :columns="bankStore.bookletColumns"
            row-key="id"
            flat
            bordered
            @row-click="(evt, row) => showChequeDetails(row)"
            :pagination="{
              rowsPerPage: 20,
            }"
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="getStatusColor(props.row.status)"
                  :label="formatStatus(props.row.status)"
                />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Add Booklet Dialog -->
    <q-dialog v-model="showAddBookletDialog" @keydown.enter="handleAddBookletEnterKey">
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Add New Booklet</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleAddBookletSaveClick">

            <q-input
              v-model="newBooklet.booklet_numb"
              label="Booklet Number"
              outlined
              class="q-mb-sm"
              @keydown.enter="handleAddBookletEnterKey"
              :rules="[
                (val) => !!val || 'Booklet number is required',
                (val) => val.length === 8 || 'Must be exactly 8 digits',
              ]"
              maxlength="8"
              mask="########"
            />
            <q-input
              v-model="newBooklet.starting_cheque_numb"
              label="Starting Cheque Number"
              outlined
              class="q-mb-sm"
              @keydown.enter="handleAddBookletEnterKey"
              :rules="[
                (val) => !!val || 'Starting number is required',
                (val) => val.length === 8 || 'Must be exactly 8 digits',
              ]"
              maxlength="8"
              mask="########"
            />

            <q-input
            v-model="newBooklet.quantity"
            class="q-mb-sm quantity-input"
            label="Quantity"
            outlined
            style="width: 140px ;"
            :rules="[
              (val) => !!val || 'Quantity is required',
              (val) => val > 0 || 'Must be greater than 0',
            ]"
            />

            <q-input
              v-model="newBooklet.ending_cheque_numb"
              label="Ending Cheque Number"
              outlined
              :disable="true"
              class="q-mb-sm"
              @keydown.enter="handleAddBookletEnterKey"
              :rules="[
                (val) => !!val || 'Ending number is required',
                (val) => val.length === 8 || 'Must be exactly 8 digits',
              ]"
              maxlength="8"
              mask="########"
            />

          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="Cancel" flat v-close-popup />
          <q-btn
            label="Save"
            color="primary"
            @click="handleAddBookletSaveClick"
            v-close-popup
            :loading="bankStore.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Cheque Details Dialog -->
    <q-dialog v-model="showChequeDialog" persistent>
      <q-card style="min-width: 700px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Cheques: {{ selectedBooklet?.booklet_numb }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-table
            :rows="selectedBooklet?.cheques || []"
            :columns="bankStore.chequeColumns"
            row-key="chequeNo"
            flat
            bordered
            :pagination="{
              rowsPerPage: 50,
            }"
            wrap-cells
            virtual-scroll
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="(props.row.status || '').toLowerCase() === 'unused' ? 'green' : 'orange'"
                  :label="(props.row.status || '').toLowerCase() === 'unused' ? 'Unused' : 'Issued'"
                />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Add Cheque Dialog -->
    <q-dialog v-model="showAddChequeDialog" @keydown.enter="handleAddChequeEnterKey">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Add New Cheque</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleAddChequeSaveClick">
            <q-input
              v-model="newCheque.chequeNo"
              label="Cheque Number"
              outlined
              class="q-mb-sm"
              @keydown.enter="handleAddChequeEnterKey"
              :rules="[
                (val) => !!val || 'Cheque number is required',
                (val) => val.length === 6 || 'Must be exactly 6 digits',
              ]"
              maxlength="6"
              mask="######"
            />

            <q-input
              v-model="newCheque.date"
              label="Date"
              outlined
              mask="####/##/##"
              class="q-mb-md"
              @keydown.enter="handleAddChequeEnterKey"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="Cancel" flat v-close-popup />
          <q-btn
            label="Save"
            color="primary"
            @click="handleAddChequeSaveClick"
            v-close-popup
            :loading="bankStore.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
const loading = ref(false)

const loadPendingUsers = async () => {
  loading.value = true
  try {
    await bankStore.fetchBanks()
    tableRefreshKey.value++
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to refresh data',
      icon: 'error',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const clearAllFilters = () => {
  searchTerm.value = ''
}

import { useBankStore } from 'src/stores/bankStore'
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const bankStore = useBankStore()

const tableRefreshKey = ref(0)

onMounted(async () => {
  try {
    console.log('Columns:', bankStore.columns)
    console.log('Fetching banks...')
    await bankStore.fetchBanks()
    console.log('Banks after fetch:', bankStore.banks)
  } catch (error) {
    console.error('Error in onMounted:', error)
    $q.notify({
      type: 'negative',
      message: `Failed to load banks: ${error.message}`,
      position: 'top',
      timeout: 3000,
    })
  }
})

// Search and Bank Management
const searchTerm = ref('')
const showAddDialog = ref(false)
const newBankName = ref('')
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const editingBank = ref({ id: null, name: '' })
const deletingBank = ref({ id: null, name: '' })

//Booklet
const showBookletDialog = ref(false)
const showAddBookletDialog = ref(false)
const newBooklet = ref({
  quantity: 1,
  booklet_numb: '',
  starting_cheque_numb: '',
  ending_cheque_numb: '',
})

// Cheque Management
const showChequeDialog = ref(false)
const showAddChequeDialog = ref(false)
const selectedBank = ref(null)
const newCheque = ref({
  chequeNo: '',
  date: new Date().toISOString().split('T')[0],
})
const search = ref('')
const chequeNumberSearch = ref('')

const selectedBooklet = ref(null)

const filteredBanks = computed(() => {
  if (!bankStore.banks || !Array.isArray(bankStore.banks)) {
    return []
  }

  const searchTermLower = searchTerm.value.toLowerCase()
  return bankStore.banks.filter((bank) => bank.name.toLowerCase().includes(searchTermLower))
})

// Bank Actions
const addBank = async () => {
  if (!newBankName.value) return

  try {
    bankStore.loading = true
    await bankStore.addBank(newBankName.value)

    showAddDialog.value = false
    newBankName.value = ''

    await bankStore.fetchBanks()

    $q.notify({
      type: 'positive',
      message: 'Bank added successfully',
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to add bank: ' + (error.response?.data?.message || error.message),
      position: 'top',
    })
  } finally {
    bankStore.loading = false
  }
}

const deleteBank = (bank) => {
  deletingBank.value = {
    id: bank.id,
    name: bank.name
  }
  showDeleteDialog.value = true
}

const confirmDeleteBank = async () => {
  if (!deletingBank.value.id) return

  try {
    bankStore.loading = true
    await bankStore.deleteBank(deletingBank.value.id)

    showDeleteDialog.value = false
    deletingBank.value = { id: null, name: '' }

    await bankStore.fetchBanks()

    $q.notify({
      type: 'positive',
      message: 'Bank deleted successfully',
      position: 'top',
    })
  } catch (error) {
    let errorMessage = 'Failed to delete bank'

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
      timeout: 5000,
    })
  } finally {
    bankStore.loading = false
  }
}

const editBank = (bank) => {
  editingBank.value = {
    id: bank.id,
    name: bank.name,
  }
  showEditDialog.value = true
}

const saveEditBank = async () => {
  if (!editingBank.value.name || editingBank.value.name.length < 3) return

  try {
    await bankStore.editBank(editingBank.value.id, editingBank.value.name)
    showEditDialog.value = false

    await bankStore.fetchBanks()

    $q.notify({
      type: 'positive',
      message: 'Bank updated successfully',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to update bank',
    })
  }
}

//Booklet Actions
const showBookletDetails = async (bank) => {
  try {
    selectedBank.value = {
      ...bank,
      booklets: [],
    }

    const booklets = await bankStore.fetchBankBooklets(bank.id)

    selectedBank.value.booklets = [...booklets]

    console.log(
      'Final booklets to display:',
      JSON.parse(JSON.stringify(selectedBank.value.booklets)),
    )
    showBookletDialog.value = true
  } catch (error) {
    console.error('Error loading booklets:', error)
    $q.notify({
      type: 'negative',
      message: `Failed to load booklets: ${error.message}`,
    })
  }
}

const addBooklet = async () => {
  try {
    const start = parseInt(newBooklet.value.starting_cheque_numb)
    const end = parseInt(newBooklet.value.ending_cheque_numb)

    if (newBooklet.value.quantity > 50) {
      throw new Error('Quantity must not exceed 50')
    }
    if (newBooklet.value.quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    await bankStore.addBooklet(selectedBank.value.id, newBooklet.value)
    resetBookletForm()
    showAddBookletDialog.value = false

    const response = await bankStore.fetchBankBooklets(selectedBank.value.id)
    selectedBank.value.booklets = response

    $q.notify({
      type: 'positive',
      message: `Booklet added successfully with ${end - start + 1} cheques`,
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message,
      position: 'top',
    })
  }
}

const resetBookletForm = () => {
  newBooklet.value = {
    booklet_numb: '',
    starting_cheque_numb: '',
    ending_cheque_numb: '',
  }
}

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'unused':
      return 'green'
    case 'consumed':
      return 'orange'
    case 'not all consumed':
      return 'blue'
    default:
      return 'grey'
  }
}

const formatStatus = (status) => {
  switch (status?.toLowerCase()) {
    case 'unused':
      return 'Unused'
    case 'consumed':
      return 'Consumed'
    case 'not all consumed':
      return 'Not All Consumed'
    default:
      return status
  }
}

const filteredBooklets = computed(() => {
  if (!selectedBank.value?.booklets) return []

  let results = selectedBank.value.booklets

  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    results = results.filter(
      (booklet) =>
        booklet.booklet_numb.toLowerCase().includes(searchTerm) ||
        booklet.starting_cheque_numb.toLowerCase().includes(searchTerm) ||
        booklet.ending_cheque_numb.toLowerCase().includes(searchTerm),
    )
  }

  if (chequeNumberSearch.value) {
    const chequeTerm = chequeNumberSearch.value.toLowerCase()
    results = results.filter((booklet) => {
      const start = booklet.starting_cheque_numb
      const end = booklet.ending_cheque_numb
      const target = chequeTerm.padStart(8, '0')

      return target >= start && target <= end
    })
  }

  return results
})

// Cheque Actions
const showChequeDetails = async (booklet) => {
  try {
    console.log('Booklet object received:', booklet)

    if (!booklet?.id) {
      throw new Error(`Invalid booklet data: ${JSON.stringify(booklet)}`)
    }

    selectedBooklet.value = {
      id: Number(booklet.id),
      booklet_numb: booklet.booklet_numb,
      cheques: [],
    }

    console.log('Fetching cheques for booklet ID:', selectedBooklet.value.id)
    const response = await bankStore.fetchBookletCheques(selectedBooklet.value.id)

    selectedBooklet.value.cheques = response.cheques || response.data || []
    showChequeDialog.value = true
  } catch (error) {
    console.error('Error loading cheques:', {
      error: error.message,
      booklet: booklet,
      stack: error.stack,
    })
    $q.notify({
      type: 'negative',
      message: `Failed to load cheques: ${error.message}`,
    })
  }
}

const addCheque = async () => {
  if (!newCheque.value.chequeNo || newCheque.value.chequeNo.length !== 8) {
    $q.notify({
      type: 'negative',
      message: 'Cheque number must be 8 digits',
    })
    return
  }

  try {
    await bankStore.addCheque(selectedBank.value.id, newCheque.value)
    resetChequeForm()
    showAddChequeDialog.value = false

    const response = await bankStore.fetchBankCheques(selectedBank.value.id)
    selectedBank.value.cheques = (response.cheques || []).map((cheque) => ({
      chequeNo: cheque.chequeNo,
      status: cheque.status,
      date: cheque.date,
      dvs: cheque.dvs || [],
    }))

    $q.notify({
      type: 'positive',
      message: 'Cheque added successfully',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Failed to add cheque: ${error.message}`,
    })
  }
}

const resetChequeForm = () => {
  newCheque.value = {
    chequeNo: '',
    date: new Date().toISOString().split('T')[0],
  }
}

watch(
  () => bankStore.banks,
  (newVal) => {
    console.log('Banks changed:', newVal)
  },
  { deep: true },
)
watch(
  [() => newBooklet.value.starting_cheque_numb, () => newBooklet.value.quantity],
  ([start, qty]) => {
    const startNum = parseInt(start, 10);
    const quantityNum = parseInt(qty, 10);

    if (!isNaN(startNum) && !isNaN(quantityNum) && quantityNum > 0) {
      const end = startNum + quantityNum - 1;
      newBooklet.value.ending_cheque_numb = end.toString().padStart(8, '0');
    } else {
      newBooklet.value.ending_cheque_numb = '';
    }
  }
);

// Validation functions
const validateAddBank = () => {
  if (!newBankName.value) {
    $q.notify({
      type: 'negative',
      message: 'Bank name is required',
      position: 'top',
    })
    return false
  }
  if (newBankName.value.length < 3) {
    $q.notify({
      type: 'negative',
      message: 'Name must be at least 3 characters',
      position: 'top',
    })
    return false
  }
  return true
}

const handleAddBankEnterKey = () => {
  if (validateAddBank()) {
    addBank()
  }
}

// const handleAddBankSaveClick = () => {
//   if (validateAddBank()) {
//     addBank()
//   }
// }

const validateEditBank = () => {
  if (!editingBank.value.name) {
    $q.notify({
      type: 'negative',
      message: 'Bank name is required',
      position: 'top',
    })
    return false
  }
  if (editingBank.value.name.length < 3) {
    $q.notify({
      type: 'negative',
      message: 'Name must be at least 3 characters',
      position: 'top',
    })
    return false
  }
  return true
}

const handleDeleteBankEnterKey = () => {
  confirmDeleteBank()
}

const handleEditBankEnterKey = () => {
  if (validateEditBank()) {
    saveEditBank()
  }
}

const handleEditBankSaveClick = () => {
  if (validateEditBank()) {
    saveEditBank()
  }
}

const validateAddBooklet = () => {
  if (!newBooklet.value.starting_cheque_numb) {
    $q.notify({
      type: 'negative',
      message: 'Starting number is required',
      position: 'top',
    })
    return false
  }
  if (newBooklet.value.starting_cheque_numb.length !== 8) {
    $q.notify({
      type: 'negative',
      message: 'Starting number must be exactly 8 digits',
      position: 'top',
    })
    return false
  }
  if (!newBooklet.value.ending_cheque_numb) {
    $q.notify({
      type: 'negative',
      message: 'Ending number is required',
      position: 'top',
    })
    return false
  }
  if (newBooklet.value.ending_cheque_numb.length !== 8) {
    $q.notify({
      type: 'negative',
      message: 'Ending number must be exactly 8 digits',
      position: 'top',
    })
    return false
  }
  if (parseInt(newBooklet.value.starting_cheque_numb) > parseInt(newBooklet.value.ending_cheque_numb)) {
    $q.notify({
      type: 'negative',
      message: 'Starting number must be less than ending number',
      position: 'top',
    })
    return false
  }
  return true
}

const handleAddBookletEnterKey = () => {
  if (validateAddBooklet()) {
    addBooklet()
  }
}

const handleAddBookletSaveClick = () => {
  if (validateAddBooklet()) {
    addBooklet()
  }
}

const validateAddCheque = () => {
  if (!newCheque.value.chequeNo) {
    $q.notify({
      type: 'negative',
      message: 'Cheque number is required',
      position: 'top',
    })
    return false
  }
  if (newCheque.value.chequeNo.length !== 6) {
    $q.notify({
      type: 'negative',
      message: 'Cheque number must be exactly 6 digits',
      position: 'top',
    })
    return false
  }
  if (!newCheque.value.date) {
    $q.notify({
      type: 'negative',
      message: 'Date is required',
      position: 'top',
    })
    return false
  }
  return true
}

const handleAddChequeEnterKey = () => {
  if (validateAddCheque()) {
    addCheque()
  }
}

const handleAddChequeSaveClick = () => {
  if (validateAddCheque()) {
    addCheque()
  }
}
</script>

<style scoped>
.banklib-page {
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

  .row.items-center.q-gutter-sm > * {
    margin-bottom: 8px;
    width: 100%;
  }
}
</style>
