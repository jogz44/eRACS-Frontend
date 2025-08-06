<template>
  <q-page class="q-pa-lg cont-appr">
    <div class="page-header q-mb-lg ">
        <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">Continuing Appropriation</div>
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
      <!-- Desktop & Mobile: All in one row -->
      <div class="row items-center justify-between q-gutter-sm all-in-one-row">
        <q-input
          bg-color="white"
          outlined
          dense
          placeholder="Search Description..."
          v-model="searchQuery"
          class="custom-search-input"
        >

          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
         <!-- Clear All Filters Button -->
        <q-btn
          dense
          outlined
          color="red-10"
          icon="clear_all"
          label="Clear All"
          @click="clearAllFilters"
          class="clear-all-btn"
        />
        <q-space />
        <!-- <q-input
          bg-color="white"
          outlined
          dense
          label="From"
          v-model="dateFrom"
          mask="##/##/####"
          class="custom-date-from"
        >
          <template v-slot:append>
            <q-icon name="event" class="calend-icon">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="dateFrom" mask="DD/MM/YYYY" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-input
          bg-color="white"
          outlined
          dense
          label="To"
          v-model="dateTo"
          mask="##/##/####"
          class="custom-date-to"
        >
          <template v-slot:append>
            <q-icon name="event" class="calend-icon">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="dateTo" mask="DD/MM/YYYY" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input> -->
        <q-btn label="Continue Accounts" @click="showContinueDialog = true" color="secondary" style="min-width: 180px;" />

      </div>
      <!-- iPad: Search input in one row, From/To/Add in a single row below -->
      <div class="ipad-search-row" style="display: none;">
        <q-input
          bg-color="white"
          outlined
          dense
          placeholder="Search Description..."
          v-model="searchQuery"
          class="custom-search-input"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="row items-center q-gutter-sm ipad-dateadd-row" style="display: none;">
        <!-- <q-input
          bg-color="white"
          outlined
          dense
          label="From"
          v-model="dateFrom"
          mask="##/##/####"
          class="custom-date-from"
        >
          <template v-slot:append>
            <q-icon name="event" class="calend-icon">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="dateFrom" mask="DD/MM/YYYY" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input> -->
        <q-input
          bg-color="white"
          outlined
          dense
          label="To"
          v-model="dateTo"
          mask="##/##/####"
          class="custom-date-to"
        >
          <template v-slot:append>
            <q-icon name="event" class="calend-icon">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="dateTo" mask="DD/MM/YYYY" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-btn label="Continue Accounts" @click="showContinueDialog = true" color="secondary" style="min-width: 180px;" />


      </div>
    </div>

    <!-- Dialog for Selecting Accounts -->
    <q-dialog v-model="showContinueDialog" @keydown.enter="handleEnterKey">
      <q-card class="responsive-dialog-card">
        <q-card-section class="dialog-header">
          <div class="text-h6">Select Accounts to Continue</div>
        </q-card-section>
        <q-card-section class="dialog-content q-pa-sm q-mr-sm">
          <!-- Year Selection -->
          <div class="row items-center justify-between q-gutter-sm responsive-search-row">
            <q-input
              dense
              outlined
              debounce="300"
              v-model="searchQuery"
              placeholder="Search accounts..."
              class="responsive-search-input"
              @keydown.enter="handleEnterKey"
            />
            <q-select
              outlined
              dense
              v-model="selectedYear"
              :options="yearOptions"
              label="Select Year"
              class="responsive-year-select"
              @keydown.enter="handleEnterKey"
            />
          </div>
          <q-card-section class="q-pa-sm table-container">
            <q-table
              bordered
              :rows="filteredAccounts"
              :columns="continueColumns"
              row-key="id"
              selection="multiple"
              v-model:selected="selectedAccounts"
              class="responsive-table"
              :pagination="{ rowsPerPage: 0 }"
            >
              <template v-slot:header-selection="scope">
                <q-checkbox color="secondary" v-model="scope.selected" />
              </template>
              <template v-slot:body-selection="scope">
                <q-checkbox color="secondary" v-model="scope.selected" />
              </template>
            </q-table>
          </q-card-section>
        </q-card-section>
        <q-card-section class="dialog-description">
          <q-input
            outlined
            filled
            dense
            v-model="description"
            label="Description"
            type="text"
            placeholder="e.g., Carried-over balances from previous year"
            class="responsive-description-input"
            @keydown.enter="handleEnterKey"
          />
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat label="Cancel" color="secondary" v-close-popup />
          <q-btn
            label="Continue"
            class="modal-save-btn"
            @click="handleContinueClick"
            :disable="selectedAccounts.length === 0 || !description"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Main Table -->
    <q-card>
      <q-table flat bordered :rows="filteredAppropriations" :columns="columns" row-key="id">
        <template v-slot:body-cell-amount="props">
          <q-td :props="props">{{ formatCurrency(props.row.amount) }}</q-td>
        </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="button-group">
              <q-btn icon="visibility" class="view-btn" @click="viewDetails(props.row)" />
              <q-btn label="Commit" class="allocate-btn" @click="openAllocationDialog(props.row)" />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Add this dialog to your main component -->
    <q-dialog v-model="showAllocationDialog" persistent @keydown.enter="handleAllocationEnterKey">
      <q-card class="allocation-card responsive-allocation-card">
        <q-card-section class="q-pb-sm q-pt-sm dialog-header">
          <div class="row items-center justify-between">
            <div class="text-h6">Allocate Amounts</div>
            <q-icon
              name="close"
              class="cursor-pointer"
              size="sm"
              @click="showAllocationDialog = false"
            />
          </div>
        </q-card-section>
        <q-card-section class="q-py-lg allocation-content">
          <!-- Summary section -->
          <div class="row q-mb-sm q-col-gutter-md responsive-summary">
            <div class="col-12 col-sm-4">
              <div class="text-weight-regular">Total Budget:</div>
              <strong>{{ formatCurrency(selectedRow.amount) }}</strong>
            </div>
            <div class="col-12 col-sm-4">
              <div class="text-weight-regular">Return Amount:</div>
              <strong>{{ formatCurrency(selectedRow.returnAmount || 0) }}</strong>
            </div>
            <div class="col-12 col-sm-4">
              <div class="text-weight-regular">Available Budget:</div>
              <strong>{{ formatCurrency(availableBudget) }}</strong>
            </div>
          </div>
          <div class="justify-end q-mb-md"></div>

          <!-- Hierarchical Table -->
          <div class="hierarchical-table responsive-hierarchical-table">
            <!-- Table Header -->
            <div class="row bg-grey-3 text-weight-bold table-header">
              <div class="col-6">Account</div>
              <div class="col-6 text-right">Amount (₱)</div>
            </div>

            <!-- Table Body -->
            <div class="hierarchical-body responsive-hierarchical-body">
              <template v-for="category in displayAccounts" :key="'cat-' + category.id">
                <!-- Category Row -->
                <div class="row bg-grey-3 text-weight-bold category-row">
                  <div class="col-6">CAPITAL OUTLAYS</div>
                  <div class="col-6 text-right">
                    {{ formatCurrency(calculateCategoryTotal(category)) }}
                  </div>
                </div>

                <!-- Subcategory Rows -->
                <template v-for="subcategory in category.children" :key="'sub-' + subcategory.id">
                  <div class="row subcategory-row">
                    <div class="col-6 subcategory-name">
                      <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                      {{ subcategory.name }}
                    </div>
                    <div class="col-6 text-right subcategory-input">
                      <q-input
                        dense
                        v-model.number="subcategory.amount"
                        prefix="₱"
                        :rules="[(val) => validateAmount(val)]"
                        class="responsive-amount-input"
                        :disable="availableBudget <= 0"
                        @keydown.enter="handleAllocationEnterKey"
                      />
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat label="Cancel" color="secondary" v-close-popup />
          <q-btn
            label="Save"
            class="modal-save-btn"
            @click="handleAllocationSaveClick"
            :disable="!canSaveAllocation"
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
    // TODO: Replace with actual API call to fetch continuing appropriations/accounts
    // Example: await store.fetchContinuingAppropriations()
    // For now, just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 500))
     $q.notify({
      type: 'positive',
      message: 'Appropriation refreshed!',
      icon: 'refresh',
      position: 'top',
    })
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
  searchQuery.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const showContinueDialog = ref(false)
const showAllocationDialog = ref(false)
const description = ref('')
const selectedAccounts = ref([])
const searchQuery = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const returnAmount = ref(0)
const augmentationAmount = ref(0)
const selectedYear = ref(null)




//const hasAdjustments = computed(() => returnAmount.value > 0 || augmentationAmount.value > 0)

const filteredAccounts = computed(() => {
  if (!searchQuery.value) return continueAccounts.value

  return continueAccounts.value.filter((account) =>
    Object.values(account).join(' ').toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const yearOptions = ['2023', '2024', '2025']
const continueAccounts = ref([
  { id: 1, accountName: 'Capital Outlays > OFFICE EQUIPMENT', balance: 12000 },
  { id: 2, accountName: 'Capital Outlays > IT EQUIPMENT AND SOFTWARE', balance: 7600 },
  { id: 3, accountName: 'Capital Outlays > VEHICLES', balance: 50000 },
  { id: 4, accountName: 'Capital Outlays > FURNITURE AND FIXTURES', balance: 8300 },
  { id: 5, accountName: 'Capital Outlays > BUILDING IMPROVEMENTS', balance: 42000 },
  { id: 6, accountName: 'Capital Outlays > MEDICAL EQUIPMENT', balance: 15000 },
])

const continueColumns = [
  { name: 'accountName', label: 'Accounts Name', field: 'accountName', align: 'left' },
  {
    name: 'balance',
    label: 'Remaining Balance',
    field: 'balance',
    align: 'right',
    format: (val) => `₱ ${val.toLocaleString()}`,
  },
]

const mergedAppropriations = ref([]) // Summary rows

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: 'true' },
  { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: 'true' },
  {
    name: 'description',
    label: 'Description',
    field: 'description',
    align: 'left',
    sortable: 'true',
  },
  { name: 'amount', label: 'Total Amount', field: 'amount', align: 'right', sortable: 'true' },
  { name: 'action', label: 'Action', field: 'action', align: 'center' },
]

const parseDate = (str) => {
  const [m, d, y] = str.split('/')
  return new Date(`${y}-${m.padStart?.(2, '0') ?? m}-${d.padStart?.(2, '0') ?? d}`)
}

// Add these computed properties
const availableBudget = computed(() => {
  const base = selectedRow.value.unappropriated || 0
  const returns = selectedRow.value.returnAmount || 0
  const augmentation = selectedRow.value.augmentationAmount || 0
  return base + returns + augmentation
})

const filteredAppropriations = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const from = dateFrom.value ? parseDate(dateFrom.value) : null
  const to = dateTo.value ? parseDate(dateTo.value) : null

  return mergedAppropriations.value.filter((row) => {
    const matchesQuery = row.description.toLowerCase().includes(query)

    if (from && to) {
      const rowDate = parseDate(row.date)
      return matchesQuery && rowDate >= from && rowDate <= to
    }

    return matchesQuery
  })
})

// Sample accounts structure
const sampleAccounts = [
  {
    id: 1,
    name: 'Capital Outlays',
    children: [
      { id: 11, name: 'OFFICE EQUIPMENT', amount: 12000 },
      { id: 12, name: 'IT EQUIPMENT AND SOFTWARE', amount: 7600 },
      { id: 13, name: 'VEHICLES', amount: 50000 },
      { id: 14, name: 'FURNITURE AND FIXTURES', amount: 8300 },
      { id: 15, name: 'BUILDING IMPROVEMENTS', amount: 42000 },
      { id: 16, name: 'MEDICAL EQUIPMENT', amount: 15000 },
    ],
  },
]

const validateAndContinue = () => {
  // Check if continue dialog is open
  if (showContinueDialog.value) {
    // Validate required fields before continuing
    const hasSelectedAccounts = selectedAccounts.value && selectedAccounts.value.length > 0
    const hasDescription = description.value && description.value.trim() !== ''

    if (!hasSelectedAccounts) {
      $q.notify({
        type: 'negative',
        message: 'Please select at least one account to continue',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    if (!hasDescription) {
      $q.notify({
        type: 'negative',
        message: 'Please provide a description before continuing',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    // If validation passes, proceed with continue
    continueSelected()
  }
}

const handleEnterKey = (event) => {
  // Prevent default behavior to avoid form submission
  event.preventDefault()
  validateAndContinue()
}

const handleContinueClick = () => {
  validateAndContinue()
}

// Handles merging and pushing the summary row
const continueSelected = () => {
  const totalAmount = selectedAccounts.value.reduce((sum, acc) => sum + acc.balance, 0)

  mergedAppropriations.value.push({
    id: mergedAppropriations.value.length + 1,
    date: new Date().toLocaleDateString(), // example: "5/15/2025"
    description: description.value,
    amount: totalAmount,
    accounts: [...selectedAccounts.value],
  })

  selectedAccounts.value = []
  description.value = ''
  showContinueDialog.value = false
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value)
}

const viewDetails = (row) => {
  console.log('Viewing details of row:', row)
  // You can open another dialog or route for detailed view
}

const selectedRow = ref({
  id: null,
  unappropriated: 100000, // Sample available budget
})
const displayAccounts = ref(JSON.parse(JSON.stringify(sampleAccounts))) // Deep copy

// Open dialog function (call this from your commit button)
const openAllocationDialog = (row) => {
  selectedRow.value = {
    ...row,
    returnAmount: row.returnAmount || 0,
    augmentationAmount: row.augmentationAmount || 0,
  }

  // Filter and structure accounts for display
  if (row.accounts && row.accounts.length > 0) {
    displayAccounts.value = [
      {
        id: 1,
        name: 'CAPITAL OUTLAYS',
        children: row.accounts.map((acc) => ({
          id: acc.id,
          name: acc.accountName.split('>')[1].trim(),
          amount: acc.balance, // Use the actual balance from continued accounts
        })),
      },
    ]
  } else {
    // Use sample data with actual amounts
    displayAccounts.value = [
      {
        id: 1,
        name: 'CAPITAL OUTLAYS',
        children: [
          { id: 11, name: 'OFFICE EQUIPMENT', amount: 12000 },
          { id: 12, name: 'IT EQUIPMENT AND SOFTWARE', amount: 7600 },
          { id: 13, name: 'VEHICLES', amount: 50000 },
          { id: 14, name: 'FURNITURE AND FIXTURES', amount: 8300 },
          { id: 15, name: 'BUILDING IMPROVEMENTS', amount: 42000 },
          { id: 16, name: 'MEDICAL EQUIPMENT', amount: 15000 },
        ],
      },
    ]
  }

  showAllocationDialog.value = true
}

// Calculate category total
const calculateCategoryTotal = (category) => {
  return category.children.reduce((sum, item) => sum + (item.amount || 0), 0)
}

// Calculate total allocated amount
const totalAllocated = computed(() => {
  return displayAccounts.value.reduce((total, category) => {
    return total + calculateCategoryTotal(category)
  }, 0)
})

// Validate amount input
const validateAmount = (val) => {
  if (val === null || val === '') return true
  const num = Number(val)
  return !isNaN(num) && num >= 0
}

const canSaveAllocation = computed(() => {
  return totalAllocated.value > 0 && totalAllocated.value <= availableBudget.value
})

const validateAndSaveAllocation = () => {
  // Check if allocation dialog is open
  if (showAllocationDialog.value) {
    // Validate that allocation is possible
    if (!canSaveAllocation.value) {
      $q.notify({
        type: 'negative',
        message: 'Please ensure total allocated amount is greater than 0 and within available budget',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    // If validation passes, proceed with save
    saveAllocation()
  }
}

const handleAllocationEnterKey = (event) => {
  // Prevent default behavior to avoid form submission
  event.preventDefault()
  validateAndSaveAllocation()
}

const handleAllocationSaveClick = () => {
  validateAndSaveAllocation()
}

// Save allocation
const saveAllocation = () => {
  const allocationData = {
    budgetId: selectedRow.value.id,
    returnAmount: returnAmount.value,
    augmentationAmount: augmentationAmount.value,
    allocations: displayAccounts.value,
    totalAllocated: totalAllocated.value,
  }

  console.log('Saving allocation:', allocationData)

  // Update the main table row
  const rowIndex = mergedAppropriations.value.findIndex((r) => r.id === selectedRow.value.id)
  if (rowIndex !== -1) {
    mergedAppropriations.value[rowIndex].unappropriated -= totalAllocated.value
  }

  showAllocationDialog.value = false
}

// Expose the open function to parent component
defineExpose({
  openAllocationDialog,
})
</script>

<style scoped>
.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}

.custom-actions {
  margin-right: 10px;
}
.custom-actions .q-btn:not(:last-child) {
  margin-right: 5px; /* Adjust this value as needed */
}

/* Using the deep selector (Vue 3 syntax) */
.q-mb-md :deep(.q-input .q-field__control) {
  border-radius: 8px;
}

/* Button styles */
.edit-btn {
  margin-right: 5px;
  background-color: #ffc107;
  color: black;
}

.modal-cancel-btn {
  color: #666;
}
.cont-appr{
  background-color: whitesmoke; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
}

.custom-search-input {
  min-width: 450px;
}

.clear-all-btn {
  min-width: 120px;
}
@media (max-width: 600px) {
  .custom-search-input {
    min-width: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
}
@media (max-width: 900px) {
  .row.q-gutter-sm {
    flex-wrap: wrap;
  }
  .row.q-gutter-sm > *:not(.q-space) {
    flex: 1 1 100%;
    max-width: 100%;
    margin-bottom: 8px;
  }
  .q-space {
    display: none !important;
  }
}
@media (min-width: 768px) and (max-width: 1024px) {
  .all-in-one-row {
    display: none !important;
  }
  .ipad-search-row {
    display: block !important;
    margin-bottom: 8px;
  }
  .ipad-dateadd-row {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
    margin-bottom: 8px;
  }
  .ipad-date-row {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
    margin-bottom: 8px;
  }
  .custom-date-from,
  .custom-date-to {
    flex: 1 1 0 !important;
    min-width: 120px !important;
    width: auto !important;
    max-width: 100% !important;
  }
}
@media (max-width: 767px), (min-width: 1025px) {
  .ipad-search-row,
  .ipad-dateadd-row {
    display: none !important;
  }
  .all-in-one-row {
    display: flex !important;
  }
  .ipad-date-row {
    display: none !important;
  }
}

/* Dialog Responsive Styles */
.responsive-dialog-card {
  min-width: 400px;
  max-width: 90vw;
  max-height: 85vh;
}

.responsive-allocation-card {
  min-width: 600px;
  max-width: 90vw;
  max-height: 85vh;
}

.dialog-header {
  border-bottom: 1px solid #e0e0e0;
  padding: 16px;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
}

.dialog-description {
  border-top: 1px solid #e0e0e0;
  padding: 16px;
}

.dialog-actions {
  border-top: 1px solid #e0e0e0;
  padding: 16px;
}

.responsive-search-row {
  margin-bottom: 16px;
}

.responsive-search-input {
  min-width: 200px;
  flex: 1;
}

.responsive-year-select {
  min-width: 150px;
  max-width: 200px;
}

.responsive-description-input {
  width: 100%;
  max-width: 500px;
}

.table-container {
  max-height: 400px;
  overflow-y: auto;
}

.responsive-table {
  font-size: 14px;
}

.responsive-summary {
  margin-bottom: 16px;
}

.responsive-hierarchical-table {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  padding: 8px 12px;
  font-size: 14px;
}

.category-row {
  padding: 10px 12px;
  font-size: 14px;
}

.subcategory-row {
  padding: 8px 12px;
  padding-top: 0px;
  padding-bottom: 0px;
  border-bottom: 1px solid #f0f0f0;
}

.subcategory-name {
  padding-left: 24px;
  text-align: left;
  padding-top: 18px;
  font-weight: normal;
  font-size: 14px;
}

.subcategory-input {
  padding-left: 144px;
}

.responsive-amount-input {
  max-width: 200px;
}

.responsive-hierarchical-body {
  max-height: 400px;
  overflow-y: auto;
}

.allocation-content {
  flex: 1;
  overflow-y: auto;
}

/* Mobile Styles (up to 768px) */
@media (max-width: 768px) {
  .responsive-dialog-card {
    min-width: 90vw;
    max-width: 90vw;
    max-height: 80vh;
  }

  .responsive-allocation-card {
    min-width: 90vw;
    max-width: 90vw;
    max-height: 80vh;
  }

  .responsive-search-row {
    flex-direction: column;
    gap: 12px;
  }

  .responsive-search-input,
  .responsive-year-select {
    width: 100%;
    max-width: 100%;
  }

  .responsive-description-input {
    max-width: 100%;
  }

  .responsive-table {
    font-size: 12px;
  }

  .table-header,
  .category-row {
    font-size: 12px;
    padding: 6px 8px;
  }

  .subcategory-name {
    padding-left: 16px;
    font-size: 12px;
  }

  .subcategory-input {
    padding-left: 8px;
  }

  .responsive-amount-input {
    max-width: 120px;
    font-size: 12px;
  }

  .responsive-summary {
    flex-direction: column;
    gap: 8px;
  }

  .responsive-summary .col-12 {
    margin-bottom: 8px;
  }

  /* Reduce table height on mobile to leave space for buttons */
  .table-container {
    max-height: 250px;
  }

  .responsive-hierarchical-body {
    max-height: 200px;
  }

  .allocation-content {
    max-height: 60vh;
  }

  /* Ensure dialog actions are always visible */
  .dialog-actions {
    position: sticky;
    bottom: 0;
    background: white;
    border-top: 1px solid #e0e0e0;
    padding: 12px 16px;
    z-index: 10;
  }

  /* Reduce padding in dialog sections for mobile */
  .dialog-header,
  .dialog-content,
  .dialog-description {
    padding: 12px;
  }

  /* Make buttons more prominent on mobile */
  .dialog-actions .q-btn {
    min-height: 40px;
    font-size: 14px;
    font-weight: 500;
  }
}

/* iPad Styles (768px to 1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
  .responsive-dialog-card {
    min-width: 85vw;
    max-width: 85vw;
    max-height: 80vh;
  }

  .responsive-allocation-card {
    min-width: 85vw;
    max-width: 85vw;
    max-height: 80vh;
  }

  .responsive-search-row {
    gap: 16px;
  }

  .responsive-search-input {
    min-width: 300px;
  }

  .responsive-year-select {
    min-width: 180px;
  }

  .responsive-table {
    font-size: 13px;
  }

  .table-header,
  .category-row {
    font-size: 13px;
  }

  .subcategory-name {
    font-size: 13px;
  }

  .responsive-amount-input {
    max-width: 150px;
  }
}

/* Small Monitor Styles (1025px to 1366px) */
@media (min-width: 1025px) and (max-width: 1366px) {
  .responsive-dialog-card {
    min-width: 800px;
    max-width: 85vw;
    max-height: 80vh;
  }

  .responsive-allocation-card {
    min-width: 900px;
    max-width: 85vw;
    max-height: 80vh;
  }

  .responsive-search-input {
    min-width: 350px;
  }

  .responsive-year-select {
    min-width: 200px;
  }
}

/* Large Monitor Styles (1367px and above) */
@media (min-width: 1367px) {
  .responsive-dialog-card {
    min-width: 900px;
    max-width: 80vw;
    max-height: 75vh;
  }

  .responsive-allocation-card {
    min-width: 1000px;
    max-width: 80vw;
    max-height: 75vh;
  }

  .responsive-search-input {
    min-width: 400px;
  }

  .responsive-year-select {
    min-width: 220px;
  }
}

/* Landscape Mobile Styles */
@media (max-width: 768px) and (orientation: landscape) {
  .responsive-hierarchical-body {
    max-height: 250px;
  }

  .allocation-content {
    max-height: 60vh;
  }
}

/* Portrait Mobile Styles */
@media (max-width: 768px) and (orientation: portrait) {
  .responsive-hierarchical-body {
    max-height: 300px;
  }

  .allocation-content {
    max-height: 70vh;
  }
}

/* Ensure proper scrolling on all devices */
.q-dialog__inner--minimized > div {
  max-height: 100vh;
  overflow-y: auto;
}

/* Button group responsive styles */
.button-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .button-group {
    flex-direction: column;
    gap: 2px;
  }

  .button-group .q-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Table responsive improvements */
@media (max-width: 768px) {
  .q-table {
    font-size: 12px;
  }

  .q-table th,
  .q-table td {
    padding: 4px 6px;
  }
}

/* Ensure proper spacing in dialogs */
.q-card-section {
  padding: 16px;
}

@media (max-width: 768px) {
  .q-card-section {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .q-card-section {
    padding: 8px;
  }
}.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}
</style>
