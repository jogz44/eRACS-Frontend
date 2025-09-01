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

    <!-- Simplified the search and filter section structure -->
    <div class="q-mb-sm">
      <div class="row items-center q-gutter-sm">
        <q-input
          outlined
          dense
          placeholder="Search Description..."
          v-model="searchQuery"
          class="search-input"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-btn
          dense
          outlined
          color="red-10"
          icon="clear_all"
          label="Clear All"
          @click="clearAllFilters"
        />

        <q-space />

        <q-btn
          label="Continue Accounts"
          @click="showContinueDialog = true"
          color="secondary"
          v-permission="'add'"
          :loading="generalLoading"
        />
      </div>
    </div>

    <!-- Dialog for Selecting Accounts -->
    <q-dialog v-model="showContinueDialog" @keydown.enter="handleEnterKey">
      <q-card style="min-width: 600px; max-width: 90vw">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Select Accounts to Continue Last Year</div>
        </q-card-section>

        <q-card-section>
          <div class="row items-center q-gutter-sm q-mb-md">
            <q-input
              dense
              outlined
              debounce="300"
              v-model="dialogSearchQuery"
              placeholder="Search accounts..."
              style="min-width: 250px"
              @keydown.enter="handleEnterKey"
            />
          </div>

          <q-table
            :rows="filteredDialogAccounts"
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

    <!-- Main Data Table -->
    <q-card flat bordered>

      <q-table
        :rows="filteredAppropriations"
        :columns="columns"
        :loading="loading"
        row-key="id"
        flat
      >
        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ props.pageIndex + 1 }}
          </q-td>
        </template>

        <template v-slot:body-cell-amount="props">
          <q-td :props="props">
            {{ formatCurrency(props.row.amount) }}
          </q-td>
        </template>

        <template v-slot:body-cell-balance="props">
          <q-td :props="props">
            {{ formatCurrency(props.row.balance) }}
          </q-td>
        </template>

        <template v-slot:body-cell-unappropriated="props">
          <q-td :props="props">
            {{ formatCurrency(props.row.unappropriated || props.row.balance) }}
          </q-td>
        </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-xs">
              <q-btn
                dense
                label="Allocate"
                color="primary"
                @click="openAllocationDialog(props.row)"
                :disable="!props.row.balance || props.row.balance <= 0"
                v-permission="'edit'"
              />
              <q-btn
                dense
                icon="visibility"
                color="blue"
                @click="openViewDialog(props.row)"
                v-permission="'view'"
              />
            </div>

          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Allocation Dialog -->
    <q-dialog v-model="showAllocationDialog" persistent @keydown.enter="handleAllocationEnterKey">
      <q-card style="min-width: 900px; max-width: 90vw">
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
          <div class="hierarchical-table" style="border: 1px solid #e0e0e0">
            <div class="row q-pa-sm bg-grey-2 text-weight-medium">
              <div class="col-6">Type</div>
              <div class="col-6 text-right">Amount (₱)</div>
            </div>

            <div class="hierarchical-body" style="max-height: 400px; overflow-y: auto">
              <template v-for="expenseClass in displayAccounts" :key="'class-' + expenseClass.id">
                <div class="row q-pa-sm bg-grey-1 text-weight-medium">
                  <div class="col-12">{{ expenseClass.name }}</div>
                </div>

                <template v-for="expenseType in expenseClass.children" :key="'type-' + expenseType.id">
                  <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                    <div class="col-6" style="padding-left: 16px; display: flex; align-items: center">
                      <q-btn
                        dense
                        flat
                        :icon="(expenseType.children && expenseType.children.length > 0 && expandedTypes[expenseType.id]) ? 'expand_more' : 'chevron_right'"
                        @click="(expenseType.children && expenseType.children.length > 0) ? toggleType(expenseType.id) : null"
                        size="sm"
                      />
                      <span>{{ expenseType.name }}</span>
                    </div>
                    <div class="col-6 text-right">
                      <q-input
                        v-if="canEditType(expenseType)"
                        :model-value="formatInputValue(expenseType.amount)"
                        @update:model-value="(val) => handleAmountInput(expenseType, val)"
                        @blur="(event) => handleAmountBlur(expenseType, event.target.value)"
                        dense
                        outlined
                        class="allocation-input"
                        prefix="₱"
                        placeholder="0.00"
                        @keydown.enter="handleAllocationEnterKey"
                      />
                      <div v-else class="text-weight-medium">
                        {{ formatCurrency(calculateTypeTotal(expenseType)) }}
                      </div>
                    </div>
                  </div>

                  <template v-if="expandedTypes[expenseType.id] && expenseType.children && expenseType.children.length > 0">
                    <template v-for="expenseItem in expenseType.children" :key="'item-' + expenseItem.id">
                      <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                        <div class="col-6" style="padding-left: 32px; display: flex; align-items: center">
                          <q-icon name="arrow_right" size="xs" class="q-mr-xs" />
                          <span>{{ expenseItem.name }}</span>
                        </div>
                        <div class="col-6 text-right">
                          <q-input
                            :model-value="formatInputValue(expenseItem.amount)"
                            @update:model-value="(val) => handleAmountInput(expenseItem, val)"
                            @blur="(event) => handleAmountBlur(expenseItem, event.target.value)"
                            dense
                            outlined
                            class="allocation-input"
                            prefix="₱"
                            placeholder="0.00"
                            @keydown.enter="handleAllocationEnterKey"
                          />
                        </div>
                      </div>
                    </template>
                  </template>
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
            v-permission="'edit'"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'
import { useContApprStore } from 'src/stores/contApprStore'
import { usePageLogging } from '../../../composables/usePageLogging'

const $q = useQuasar()
const contApprStore = useContApprStore();
const { continueAccounts } = storeToRefs(contApprStore)

const loading = ref(false)
const showContinueDialog = ref(false)
const showAllocationDialog = ref(false)
const description = ref('')
const selectedAccounts = ref([])
const searchQuery = ref('')
const dialogSearchQuery = ref('')
const returnAmount = ref(0)
const augmentationAmount = ref(0)
const generalLoading = ref(true)

// New state variables for enhanced functionality
const expandedTypes = ref({})
const selectedRow = ref({
  id: null,
  amount: 0,
  unappropriated: 0,
  returnAmount: 0,
  augmentationAmount: 0,
})

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
  {

    name: 'index',
    label: '#',
    field: 'index',
    align: 'left',
    sortable: false,

  },
  {
    name: 'description',
    label: 'Description',
    field: 'description',
    align: 'left',
    sortable: true,

  },
  { 
    name: 'amount', 
    label: 'Total Amount', 
    field: 'amount', 
    align: 'right', 
    sortable: true 
  },
  { 
    name: 'balance', 
    label: 'Balance', 
    field: 'balance', 
    align: 'right', 
    sortable: true 
  },
  { 
    name: 'unappropriated', 
    label: 'Unappropriated', 
    field: 'unappropriated', 
    align: 'right', 
    sortable: true 
  },
  {
    name: 'action',
    label: 'Action',
    align: 'center',
    field: 'action',
  },

]

const availableBudget = computed(() => {
  const base = selectedRow.value.unappropriated || selectedRow.value.balance || 0
  const returns = selectedRow.value.returnAmount || 0
  const augmentation = selectedRow.value.augmentationAmount || 0
  return base + returns + augmentation
})

const filteredDialogAccounts = computed(() => {
  if (!dialogSearchQuery.value) return continueAccounts.value

  return continueAccounts.value.filter((account) =>
    Object.values(account).join(' ').toLowerCase().includes(dialogSearchQuery.value.toLowerCase()),
  )
})

const filteredAppropriations = computed(() => {
  const query = searchQuery.value.toLowerCase()

  return mergedAppropriations.value.filter((row) => {
    return row.description.toLowerCase().includes(query) ||
           row.remarks?.toLowerCase().includes(query) ||
           row.year?.toString().includes(query)
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

const loadPendingUsers = async () => {
  loading.value = true
  try {
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
  dialogSearchQuery.value = ''
}

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
    description: description.value,
    year: contApprStore.selectedYear,
    originalAppropriation: totalAmount,
    amount: totalAmount,
    balance: totalAmount, // Initially, balance equals the original appropriation
    unappropriated: totalAmount,
    remarks: '',
    accounts: [...selectedAccounts.value],
  })

  selectedAccounts.value = []
  description.value = ''
  dialogSearchQuery.value = ''
  showContinueDialog.value = false
}

const formatCurrency = (value) => {
  if (!value && value !== 0) return '₱0.00'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value)
}

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
          name: acc.accountName.split('>')[1]?.trim() || acc.accountName,
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

const calculateTypeTotal = (type) => {
  if (!type || !type.children) return 0
  return type.children.reduce((sum, item) => sum + (item.amount || 0), 0)
}

const totalAllocated = computed(() => {
  return displayAccounts.value.reduce((total, category) => {
    return total + calculateCategoryTotal(category)
  }, 0)
})

const canEditType = (expenseType) => {
  return !expenseType.children || expenseType.children.length === 0
}

const toggleType = (typeId) => {
  let hasChildren = false
  displayAccounts.value.forEach(expenseClass => {
    const expenseType = expenseClass.children?.find(type => type.id === typeId)
    if (expenseType && expenseType.children && expenseType.children.length > 0) {
      hasChildren = true
    }
  })

  if (hasChildren) {
    expandedTypes.value[typeId] = !expandedTypes.value[typeId]
  }
}

// Enhanced input handling functions
const formatInputValue = (value) => {
  if (!value && value !== 0) return ''
  const isNumber = typeof value === 'number'
  const cleanValue = String(value).replace(/,/g, '')
  const num = parseFloat(cleanValue)
  if (isNaN(num)) return ''
  return isNumber
    ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : num.toLocaleString('en-US')
}

const handleAmountInput = (item, value) => {
  let cleanValue = String(value).replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }
  item.amount = cleanValue
}

const handleAmountBlur = (item, value) => {
  const parsed = parseFloat(value.replace(/[₱,\s]/g, ''))
  if (!isNaN(parsed)) {
    item.amount = Math.round(parsed * 100) / 100
  }
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
  
  $q.notify({
    type: 'positive',
    message: 'Allocation saved successfully!',
    icon: 'check_circle',
    position: 'top',
  })
}

const openViewDialog = (row) => {
  // Implement view functionality
  console.log('Viewing row:', row)
}

onMounted(async () => {
  try {
    await contApprStore.fetchContinueAccounts()
    await contApprStore.fetchYears()

    // Log page visit
    const { logPageVisit } = usePageLogging()
    await logPageVisit('Continuing Appropriation')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to load data',
      position: 'top',
    })
  } finally {
    generalLoading.value = false
  }
})



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
  border-radius: 4px;
  overflow: hidden;
}

.hierarchical-body {
  background: white;
}

/* Added specific styles for inputs to replace inline styles */
.search-input {
  min-width: 400px;
  background-color: white;
}

/* Allocation Dialog Text Box Styles */
.allocation-input {
  min-width: 180px;
  width: 180px;
}

/* Responsive text box sizing for Allocation dialog */
@media (max-width: 1200px) {
  .allocation-input {
    min-width: 150px;
    width: 150px;
  }
}

@media (max-width: 900px) {
  .allocation-input {
    min-width: 120px;
    width: 120px;
  }
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

  .search-input {
    min-width: 100%;
  }

  /* Mobile adjustments for Allocation dialog */
  .allocation-input {
    min-width: 100px;
    width: 100px;
  }

  /* Ensure dialog is properly sized on mobile */
  .q-dialog .q-card {
    min-width: 95vw !important;
    max-width: 95vw !important;
    width: 95vw !important;
  }
}
</style>
