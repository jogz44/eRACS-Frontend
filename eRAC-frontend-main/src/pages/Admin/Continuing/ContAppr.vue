<template>
  <q-page class="q-pa-md cont-appr">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">Continuing Appropriation</div>
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
          placeholder="Search Description..."
          v-model="searchQuery"
          style="min-width: 300px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- Fiscal Year Filter -->
        <q-select
          outlined
          dense
          v-model="selectedFiscalYear"
          :options="appropriationStore.fiscalYearOptions"
          label="Fiscal Year"
          class="col-auto"
          style="min-width: 180px; background-color: white;"
          emit-value
          map-options
          :loading="appropriationStore.loading"
          @update:model-value="onFiscalYearChange"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                No fiscal years found
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-btn
          dense
          outlined
          color="negative"
          icon="clear"
          @click="clearAllFilters"
        />

        <q-space />

        <!-- <q-btn
          label="Continue Accounts"
          @click="showContinueDialog = true"
          color="secondary"
        /> -->
      </div>
    </div>

    <!-- Dialog for Selecting Accounts -->
    <q-dialog v-model="showContinueDialog" @keydown.enter="handleEnterKey">
      <q-card style="min-width: 600px; max-width: 90vw">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Select Accounts to Continue</div>
        </q-card-section>

        <q-card-section>
          <div class="row items-center q-gutter-sm q-mb-md">
            <q-input
              dense
              outlined
              debounce="300"
              v-model="searchQuery"
              placeholder="Search accounts..."
              style="min-width: 250px"
              @keydown.enter="handleEnterKey"
            />
            <q-select
              outlined
              dense
              v-model="selectedYear"
              :options="yearOptions"
              label="Select Year"
              style="min-width: 150px"
              @keydown.enter="handleEnterKey"
            />
          </div>

          <q-table
            :rows="filteredAccounts"
            :columns="continueColumns"
            row-key="id"
            selection="multiple"
            v-model:selected="selectedAccounts"
            :pagination="{ rowsPerPage: 0 }"
            style="max-height: 400px"
            flat
            bordered
          >
            <template v-slot:header-selection="scope">
              <q-checkbox color="secondary" v-model="scope.selected" />
            </template>
            <template v-slot:body-selection="scope">
              <q-checkbox color="secondary" v-model="scope.selected" />
            </template>
          </q-table>

          <q-input
            outlined
            v-model="description"
            label="Description"
            type="text"
            placeholder="e.g., Carried-over balances from previous year"
            class="q-mt-md"
            @keydown.enter="handleEnterKey"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            label="Continue"
            color="primary"
            @click="handleContinueClick"
            :disable="selectedAccounts.length === 0 || !description"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Main Table -->
    <q-card flat bordered>
      <q-table flat :rows="filteredAppropriations" :columns="columns" row-key="id">
        <template v-slot:body-cell-amount="props">
          <q-td :props="props">{{ formatCurrency(props.row.amount) }}</q-td>
        </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-xs">
              <q-btn
                dense
                icon="visibility"
                color="blue"
                @click="viewDetails(props.row)"
              />
              <!-- <q-btn
                dense
                label="Commit"
                color="primary"
                @click="openAllocationDialog(props.row)"
              /> -->
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Allocation Dialog -->
    <q-dialog v-model="showAllocationDialog" persistent @keydown.enter="handleAllocationEnterKey">
      <q-card style="min-width: 700px; max-width: 90vw">
        <q-card-section class="q-pb-none">
          <div class="row items-center justify-between">
            <div class="text-h6">Allocate Amounts</div>
            <q-btn
              icon="close"
              flat
              round
              dense
              @click="showAllocationDialog = false"
            />
          </div>
        </q-card-section>

        <q-card-section>
          <!-- Summary section -->
          <div class="row q-mb-sm q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <div class="text-caption">Total Budget:</div>
              <strong>{{ formatCurrency(selectedRow.amount) }}</strong>
            </div>
            <div class="col-12 col-sm-4">
              <div class="text-caption">Return Amount:</div>
              <strong>{{ formatCurrency(selectedRow.returnAmount || 0) }}</strong>
            </div>
            <div class="col-12 col-sm-4">
              <div class="text-caption">Available Budget:</div>
              <strong>{{ formatCurrency(availableBudget) }}</strong>
            </div>
          </div>

          <!-- Hierarchical Table -->
          <div class="hierarchical-table" style="border: 1px solid #e0e0e0; border-radius: 4px">
            <div class="row bg-grey-2 text-weight-medium q-pa-sm">
              <div class="col-6">Account</div>
              <div class="col-6 text-right">Amount (₱)</div>
            </div>

            <div style="max-height: 400px; overflow-y: auto">
              <template v-for="category in displayAccounts" :key="'cat-' + category.id">
                <div class="row bg-grey-1 text-weight-medium q-pa-sm">
                  <div class="col-6">CAPITAL OUTLAYS</div>
                  <div class="col-6 text-right">
                    {{ formatCurrency(calculateCategoryTotal(category)) }}
                  </div>
                </div>

                <template v-for="subcategory in category.children" :key="'sub-' + subcategory.id">
                  <div class="row q-pa-sm" style="border-bottom: 1px solid #f0f0f0">
                    <div class="col-6" style="padding-left: 16px; display: flex; align-items: center">
                      <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                      {{ subcategory.name }}
                    </div>
                    <div class="col-6 text-right">
                      <q-input
                        dense
                        outlined
                        v-model.number="subcategory.amount"
                        prefix="₱"
                        :rules="[(val) => validateAmount(val)]"
                        style="width: 150px"
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

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            label="Save"
            color="primary"
            @click="handleAllocationSaveClick"
            :disable="!canSaveAllocation"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAppropriationStore } from 'stores/appropriationStore'
import { usePageLogging } from 'composables/usePageLogging'

const $q = useQuasar()
const appropriationStore = useAppropriationStore()
const loading = ref(false)
const { logPageVisit } = usePageLogging()

const loadPendingUsers = async () => {
  loading.value = true
  try {
    await appropriationStore.initialize()
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

const selectedFiscalYear = computed({
  get: () => appropriationStore.selectedFiscalYear,
  set: (value) => appropriationStore.setSelectedFiscalYear(value)
})

const onFiscalYearChange = (value) => {
  if (value !== appropriationStore.selectedFiscalYear) {
    appropriationStore.setSelectedFiscalYear(value)
    loadPendingUsers() // Refresh data when fiscal year changes
  }
}

const clearAllFilters = () => {
  searchQuery.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  // Reset fiscal year to current year if available, otherwise first available year
  const currentYear = new Date().getFullYear().toString()
  const defaultYear = appropriationStore.fiscalYears.includes(currentYear)
    ? currentYear
    : appropriationStore.fiscalYears[0]
  appropriationStore.setSelectedFiscalYear(defaultYear)
}

onMounted(async () => {
  try {
    await appropriationStore.initialize()
    // Log page visit
    await logPageVisit('Continuing Appropriation')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to load data',
      icon: 'error',
      position: 'top',
    })
  }
})

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

const mergedAppropriations = ref([])

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
  if (showContinueDialog.value) {
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

    continueSelected()
  }
}

const handleEnterKey = (event) => {
  event.preventDefault()
  validateAndContinue()
}

const handleContinueClick = () => {
  validateAndContinue()
}

const continueSelected = () => {
  const totalAmount = selectedAccounts.value.reduce((sum, acc) => sum + acc.balance, 0)

  mergedAppropriations.value.push({
    id: mergedAppropriations.value.length + 1,
    date: new Date().toLocaleDateString(),
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
}

const selectedRow = ref({
  id: null,
  unappropriated: 100000,
})
const displayAccounts = ref(JSON.parse(JSON.stringify(sampleAccounts)))

const openAllocationDialog = (row) => {
  selectedRow.value = {
    ...row,
    returnAmount: row.returnAmount || 0,
    augmentationAmount: row.augmentationAmount || 0,
  }

  if (row.accounts && row.accounts.length > 0) {
    displayAccounts.value = [
      {
        id: 1,
        name: 'CAPITAL OUTLAYS',
        children: row.accounts.map((acc) => ({
          id: acc.id,
          name: acc.accountName.split('>')[1].trim(),
          amount: acc.balance,
        })),
      },
    ]
  } else {
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

const calculateCategoryTotal = (category) => {
  return category.children.reduce((sum, item) => sum + (item.amount || 0), 0)
}

const totalAllocated = computed(() => {
  return displayAccounts.value.reduce((total, category) => {
    return total + calculateCategoryTotal(category)
  }, 0)
})

const validateAmount = (val) => {
  if (val === null || val === '') return true
  const num = Number(val)
  return !isNaN(num) && num >= 0
}

const canSaveAllocation = computed(() => {
  return totalAllocated.value > 0 && totalAllocated.value <= availableBudget.value
})

const validateAndSaveAllocation = () => {
  if (showAllocationDialog.value) {
    if (!canSaveAllocation.value) {
      $q.notify({
        type: 'negative',
        message: 'Please ensure total allocated amount is greater than 0 and within available budget',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    saveAllocation()
  }
}

const handleAllocationEnterKey = (event) => {
  event.preventDefault()
  validateAndSaveAllocation()
}

const handleAllocationSaveClick = () => {
  validateAndSaveAllocation()
}

const saveAllocation = () => {
  const allocationData = {
    budgetId: selectedRow.value.id,
    returnAmount: returnAmount.value,
    augmentationAmount: augmentationAmount.value,
    allocations: displayAccounts.value,
    totalAllocated: totalAllocated.value,
  }

  console.log('Saving allocation:', allocationData)

  const rowIndex = mergedAppropriations.value.findIndex((r) => r.id === selectedRow.value.id)
  if (rowIndex !== -1) {
    mergedAppropriations.value[rowIndex].unappropriated -= totalAllocated.value
  }

  showAllocationDialog.value = false
}

defineExpose({
  openAllocationDialog,
})
</script>

<style scoped>
.cont-appr {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.hierarchical-table {
  background: white;
  overflow: hidden;
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
