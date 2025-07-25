<template>
  <q-page class="q-pa-lg banklib-page">
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">Bank Library</div>
  <q-btn
          icon="refresh"
          color="primary"
          flat
          round
          @click="loadPendingUsers"
          :loading="loading"
          title="Refresh pending users"
        />
        </div>
        </div>
    <div class="q-mb-md">
      <div class="row items-center justify-between q-gutter-sm">
        <q-input
          bg-color="white"
          outlined
          dense
          placeholder="Search banks..."
          class="col-md-3 col-sm-5 custom-search-input"
          style="min-width: 450px"
          v-model="searchTerm"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn label="Add" icon="add" class="add-table-btn" @click="showAddDialog = true" />
      </div>
    </div>

    <q-card>
      <q-table
        :key="tableRefreshKey"
        :rows="filteredBanks"
        :columns="bankStore.columns"
        row-key="id"
        flat
        bordered
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

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-xs">
            <q-btn
              flat
              icon="list"
              dense
              round
              class="allocate-btn"
              @click="showBookletDetails(props.row)"
              title="View Cheques"
            />
            <q-btn
              flat
              icon="edit"
              class="edit-btn"
              @click="editBank(props.row)"
              title="Edit Bank"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Add Bank Dialog -->
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add New Bank</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="addBank">
            <q-input
              filled
              v-model="newBankName"
              label="Bank Name"
              outlined
              :rules="[
                (val) => !!val || 'Bank name is required',
                (val) => val.length >= 3 || 'Name must be at least 3 characters',
              ]"
              lazy-rules
            />

            <q-card-actions align="right" class="q-mt-md">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                label="Save"
                type="submit"
                class="modal-save-btn"
                :disable="!newBankName || newBankName.length < 3"
              />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Add Edit Bank Dialog -->
    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Edit Bank</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveEditBank">
            <q-input
              v-model="editingBank.name"
              label="Bank Name"
              outlined
              :rules="[
                (val) => !!val || 'Bank name is required',
                (val) => val.length >= 3 || 'Name must be at least 3 characters',
              ]"
              lazy-rules
            />

            <q-card-actions align="right" class="q-mt-md">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                label="Save"
                type="submit"
                class="modal-save-btn"
                :disable="!editingBank.name || editingBank.name.length < 3"
              />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Booklet Details Dialog -->

    <q-dialog v-model="showBookletDialog" persistent>
      <q-card style="min-width: 950px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Booklets: {{ selectedBank?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
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
              style="width: 400px"
              class="q-mr-sm"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>

            <q-space />
            <q-btn
              label="Add"
              class="add-table-btn"
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
    <q-dialog v-model="showAddBookletDialog">
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Add New Booklet</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="addBooklet">
            <q-input
              v-model="newBooklet.starting_cheque_numb"
              filled
              label="Starting Cheque Number"
              outlined
              class="q-mb-sm"
              :rules="[
                (val) => !!val || 'Starting number is required',
                (val) => val.length === 8 || 'Must be exactly 8 digits',
              ]"
              maxlength="8"
              mask="########"
            />

            <q-input
              v-model="newBooklet.ending_cheque_numb"
              filled
              label="Ending Cheque Number"
              outlined
              class="q-mb-sm"
              :rules="[
                (val) => !!val || 'Ending number is required',
                (val) => val.length === 8 || 'Must be exactly 8 digits',
              ]"
              maxlength="8"
              mask="########"
            />

            <q-card-actions align="right">
              <q-btn label="Cancel" flat color="" v-close-popup />
              <q-btn
                label="Save"
                type="submit"
                class="modal-save-btn"
                v-close-popup
                :loading="bankStore.loading"
              />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Cheque Details Dialog -->
    <!-- Cheque Dialog (shows when clicking a booklet) -->
    <q-dialog v-model="showChequeDialog" persistent>
      <q-card style="min-width: 800px">
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
                  :label="(props.row.status || '').toLowerCase() === 'unused' ? 'Unused' : 'Used'"
                />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Add Cheque Dialog -->
    <q-dialog v-model="showAddChequeDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Add New Cheque</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="addCheque">
            <q-input
              v-model="newCheque.chequeNo"
              filled
              label="Cheque Number"
              outlined
              class="q-mb-sm"
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
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-card-actions align="right">
              <q-btn label="Cancel" flat color="" v-close-popup />
              <q-btn
                label="Save"
                type="submit"
                class="modal-save-btn"
                v-close-popup
                :loading="bankStore.loading"
              />
            </q-card-actions>
          </q-form>
        </q-card-section>
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
import { useBankStore } from 'src/stores/bankStore'
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const bankStore = useBankStore()

const tableRefreshKey = ref(0)

// Initialize data
onMounted(async () => {
  try {
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
const editingBank = ref({ id: null, name: '' })

//Booklet
const showBookletDialog = ref(false)
const showAddBookletDialog = ref(false)
const newBooklet = ref({
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

    // Refresh the list after successful addition
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

    // Refresh the list to ensure consistency with server
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
    // Initialize with empty array
    selectedBank.value = {
      ...bank,
      booklets: [],
    }

    // Fetch and await the booklets
    const booklets = await bankStore.fetchBankBooklets(bank.id)

    // Assign the booklets directly
    selectedBank.value.booklets = [...booklets]

    // Debug: verify the final data
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
    // Validate before submitting
    const start = parseInt(newBooklet.value.starting_cheque_numb)
    const end = parseInt(newBooklet.value.ending_cheque_numb)

    if (start > end) {
      throw new Error('Starting number must be less than ending number')
    }

    await bankStore.addBooklet(selectedBank.value.id, newBooklet.value)
    resetBookletForm()
    showAddBookletDialog.value = false

    // Refresh the booklet list
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

  // Search by booklet number or other fields
  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    results = results.filter(
      (booklet) =>
        booklet.booklet_numb.toLowerCase().includes(searchTerm) ||
        booklet.starting_cheque_numb.toLowerCase().includes(searchTerm) ||
        booklet.ending_cheque_numb.toLowerCase().includes(searchTerm),
    )
  }

  // Additional search by specific cheque number
  if (chequeNumberSearch.value) {
    const chequeTerm = chequeNumberSearch.value.toLowerCase()
    results = results.filter((booklet) => {
      // Check if cheque number falls within this booklet's range
      const start = booklet.starting_cheque_numb
      const end = booklet.ending_cheque_numb
      const target = chequeTerm.padStart(8, '0')

      return target >= start && target <= end
    })
  }

  return results
})

// Cheque Actions
// Cheque Actions
// Update your showChequeDetails function
const showChequeDetails = async (booklet) => {
  try {
    console.log('Booklet object received:', booklet) // Debug the booklet object

    if (!booklet?.id) {
      throw new Error(`Invalid booklet data: ${JSON.stringify(booklet)}`)
    }

    selectedBooklet.value = {
      id: Number(booklet.id), // Ensure numeric ID
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

    // Refresh the cheque list after adding
    const response = await bankStore.fetchBankCheques(selectedBank.value.id)
    selectedBank.value.cheques = (response.cheques || []).map((cheque) => ({
      chequeNo: cheque.chequeNo, // ✅ Use the normalized key
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

// Add this watcher
watch(
  () => bankStore.banks,
  (newVal) => {
    console.log('Banks changed:', newVal)
  },
  { deep: true },
)
// DV Numbers Actions
</script>
<style scoped>
.banklib-page {
  background-color: #D9D9D9; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
}
</style>
