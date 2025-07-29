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
      <div class="row items-center justify-between q-gutter-sm">
        <!-- Search Input -->
        <q-input
        bg-color="white"
          dense
          outlined
          debounce="300"
          v-model="searchQuery"
          placeholder="Search Description..."
          style="width: 350px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <div class="t q-px-xl"></div>

        <!-- Date Range Group -->
        <!-- <div class="row items-center justify-between q-xs">
          <div>
            <q-input
              bg-color="white"
              outlined
              dense
              v-model="dateFrom"
              label="From"
              mask="##/##/####"
              style="width: 180px;"
            >
              <template v-slot:append>
                <q-icon name="event">
                  <q-popup-proxy cover transition-show="scale">
                    <q-date v-model="dateFrom" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div>
            <q-input
              bg-color="white"
              outlined
              dense
              v-model="dateTo"
              label="To"
              mask="##/##/####"
              style="width: 180px;"
            >
              <template v-slot:append>
                <q-icon name="event">
                  <q-popup-proxy cover transition-show="scale">
                    <q-date v-model="dateTo" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div> -->

        <q-btn label="Continue Accounts" @click="showContinueDialog = true" color="secondary" />
      </div>
    </div>

    <!-- Dialog for Selecting Accounts -->
    <q-dialog v-model="showContinueDialog">
      <q-card style="min-width: 900px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Select Accounts to Continue</div>
        </q-card-section>
        <q-card-section class="q-pa-sm q-mr-sm">
          <!-- Year Selection -->
          <div class="row items-center justify-between q-gutter-sm">
            <q-input
              dense
              outlined
              debounce="300"
              v-model="searchQuery"
              placeholder="Search accounts..."
              class="q-mb-sm"
              style="width: 450px; margin-top: 10px; margin-bottom: 0px; margin-left: 16px"
            />
            <q-select
              outlined
              dense
              v-model="selectedYear"
              :options="yearOptions"
              label="Select Year"
              style="
                width: 300px;

                margin-top: 10px;
                margin-bottom: 0px;
                margin-right: 7px;
              "
            />
          </div>
          <q-card-section class="q-pa-sm">
            <q-table
              bordered
              :rows="filteredAccounts"
              :columns="continueColumns"
              row-key="id"
              selection="multiple"
              v-model:selected="selectedAccounts"
              style="margin-top: 5px"
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
        <q-card-section>
          <q-input
            outlined
            filled
            dense
            v-model="description"
            label="Description"
            type="text"
            placeholder="e.g., Carried-over balances from previous year"
            style="width: 45%"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="secondary" v-close-popup />
          <q-btn
            label="Continue"
            class="modal-save-btn"
            @click="continueSelected"
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
    <q-dialog v-model="showAllocationDialog" persistent>
      <q-card class="allocation-card" style="min-width: 800px">
        <q-card-section class="q-pb-sm q-pt-sm">
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
        <q-card-section class="q-py-lg">
          <!-- Summary section -->
          <div class="row q-mb-sm q-col-gutter-md">
            <div class="col-4">
              <div class="text-weight-regular">Total Budget:</div>
              <strong>{{ formatCurrency(selectedRow.amount) }}</strong>
            </div>
            <div class="col-4">
              <div class="text-weight-regular">Return Amount:</div>
              <strong>{{ formatCurrency(selectedRow.returnAmount || 0) }}</strong>
            </div>
            <!--
            <div class="col-4">
              <div class="text-weight-regular">Augmentation Amount:</div>
              <strong>{{ formatCurrency(selectedRow.augmentationAmount || 0) }}</strong>
            </div>-->
            <div class="col-4">
              <div class="text-weight-regular">Available Budget:</div>
              <strong>{{ formatCurrency(availableBudget) }}</strong>
            </div>
          </div>
          <div class="justify-end q-mb-md"></div>

          <!-- Hierarchical Table -->
          <div class="hierarchical-table" style="border: 1px solid #e0e0e0; border-radius: 4px">
            <!-- Table Header -->
            <div class="row bg-grey-3 text-weight-bold" style="padding: 8px 12px">
              <div class="col-6">Account</div>
              <div class="col-6 text-right">Amount (₱)</div>
            </div>

            <!-- Table Body -->
            <div class="hierarchical-body" style="max-height: 400px; overflow-y: auto">
              <template v-for="category in displayAccounts" :key="'cat-' + category.id">
                <!-- Category Row -->
                <div class="row bg-grey-3 text-weight-bold" style="padding: 10px 12px">
                  <div class="col-6">CAPITAL OUTLAYS</div>
                  <div class="col-6 text-right">
                    {{ formatCurrency(calculateCategoryTotal(category)) }}
                  </div>
                </div>

                <!-- Subcategory Rows -->
                <template v-for="subcategory in category.children" :key="'sub-' + subcategory.id">
                  <div
                    class="row"
                    style="
                      padding: 8px 12px;
                      padding-top: 0px;
                      padding-bottom: 0px;
                      border-bottom: 1px solid #f0f0f0;
                    "
                  >
                    <div
                      class="col-6"
                      style="
                        padding-left: 24px;
                        text-align: left;
                        padding-top: 18px;
                        font-weight: normal;
                      "
                    >
                      <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                      {{ subcategory.name }}
                    </div>
                    <div class="col-6 text-right" style="padding-left: 144px">
                      <q-input
                        dense
                        v-model.number="subcategory.amount"
                        prefix="₱"
                        :rules="[(val) => validateAmount(val)]"
                        style="max-width: 200px"
                        :disable="availableBudget <= 0"
                      />
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="secondary" v-close-popup />
          <q-btn
            label="Save"
            class="modal-save-btn"
            @click="saveAllocation"
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
  background-color: #D9D9D9; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
}
</style>
