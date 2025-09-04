<template>
  <q-page class="q-pa-md contdis-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-medium">Continuing Disbursement</div>
          <div class="text-caption text-grey-6">
            Showing transactions for fiscal year {{ currentFiscalYear }}
          </div>
        </div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="loadPendingUsers"
          :loading="loading"
          title="Refresh disbursements"
        />
      </div>
    </div>

    <!-- Status Summary Cards -->
    <!-- <div class="status-indicators-container q-mb-md"> -->
      <!-- <div class="row q-col-gutter-md justify-center">
        <div class="col-md-2 col-sm-4 col-xs-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h4 text-weight-bold text-orange">{{ statusCounts.pending }}</div>
              <div class="text-subtitle2 text-grey-7">Pending</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-2 col-sm-4 col-xs-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h4 text-weight-bold text-amber">{{ statusCounts.partial }}</div>
              <div class="text-subtitle2 text-grey-7">Partial</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-2 col-sm-4 col-xs-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h4 text-weight-bold text-green">{{ statusCounts.liquidated }}</div>
              <div class="text-subtitle2 text-grey-7">Liquidated</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-2 col-sm-4 col-xs-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h4 text-weight-bold text-red">{{ statusCounts.voided }}</div>
              <div class="text-subtitle2 text-grey-7">Voided</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-2 col-sm-4 col-xs-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h4 text-weight-bold text-purple">{{ statusCounts.stale }}</div>
              <div class="text-subtitle2 text-grey-7">Stale</div>
            </q-card-section>
          </q-card>
        </div>
      </div> -->
    <!-- </div> -->

    <!-- Filters Section -->
    <q-card flat bordered class="q-mb-md filters-section">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Search Input -->
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Search:</q-item-label>
            <q-input
              outlined
              dense
              v-model="store.searchQuery"
              placeholder="Search payee, DV number..."
              clearable
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Date Range Filter -->
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Date Range:</q-item-label>
            <q-input
              outlined
              dense
              v-model="dateRangeDisplay"
              placeholder="Select date range..."
              readonly
              clearable
              @clear="onDateRangeClear"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="dateRange" range @update:model-value="onDateRangeChange">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Clear Button -->
          <div class="col-md-1 col-sm-6 col-xs-12">
            <q-btn
              dense
              outlined
              color="red-10"
              icon="clear_all"
              label="Clear"
              @click="clearAllFilters"
              class="full-width"
            />
          </div>

          <!-- Flexible spacer to push Add button to the right -->
          <div class="col"></div>

          <!-- Add Button -->
          <div class="col-auto">
            <q-btn
              label="Add"
              color="primary"
              icon="add"
              @click="store.openDialog('disbursement')"
              class="full-width"
              v-permission="'add'"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="q-mb-sm">
      <!-- Disbursement Dialog -->
      <q-dialog v-model="store.dialogs.disbursement" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 900px; max-width: 95vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Continuing Disbursement</div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <!-- Date Field -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">Date:</q-item-label>
                <q-input
                  outlined
                  dense
                  v-model="store.forms.disbursement.date"
                  mask="##/##/####"
                  :readonly="true"
                  :disable="true"
                  @keydown.enter="handleEnterKey"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-not-allowed" />
                  </template>
                </q-input>
              </div>

              <!-- Bank Field -->
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Bank:</q-item-label>
                <q-select
                  outlined
                  dense
                  v-model="store.forms.disbursement.bank_id"
                  :options="bankStore.availableBanks"
                  option-label="name"
                  option-value="id"
                  emit-value
                  map-options
                  :label="currentBankLabel"
                  :loading="store.bankLoading"
                  @update:model-value="handleBankSelection"
                  @keydown.enter="handleEnterKey"
                />
              </div>

              <!-- Check Number Field -->
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Cheque Number:</q-item-label>
                <q-input
                  outlined
                  dense
                  v-model="store.autoCheque"
                  :disable="true"
                  @keydown.enter="handleEnterKey"
                />
              </div>

              <!-- DV Number Field -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">DV Number:</q-item-label>
                <q-input
                  outlined
                  dense
                  :disable="true"
                  v-model="store.forms.disbursement.dvNumber"
                  @keydown.enter="handleEnterKey"
                />
              </div>

              <!-- Payee Field -->
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Payee:</q-item-label>
                <q-input
                  outlined
                  dense
                  v-model="store.forms.disbursement.payee"
                  @keydown.enter="handleEnterKey"
                />
              </div>
            </div>
          </q-card-section>


          <!-- Add Expense Button -->
          <q-card-section>
            <div class="row justify-end q-mb-md">
              <q-btn
                label="Add"
                color="primary"
                icon="add"
                @click="handleAddExpense"
                @mouseenter="preloadExpenseAccounts"
                :loading="store.loading || store.expenseTypeLoading"
                v-permission="'add'"
              />
            </div>

            <!-- Expense Table -->
            <q-table
              :rows="store.expenses"
              :columns="store.expenseColumns"
              row-key="id"
              :pagination="{ rowsPerPage: 5 }"
              flat
              bordered
            >
              <template v-slot:body-cell-action="props">
                <q-td :props="props">
                  <div class="q-gutter-xs">
                    <q-btn
                      size="sm"
                      dense
                      icon="edit"
                      color="orange"
                      @click="store.editItem(props.row)"
                    />
                    <q-btn
                      size="sm"
                      dense
                      icon="delete"
                      color="red"
                      @click="handleDeleteExpense(props.row)"
                    />
                  </div>
                </q-td>
              </template>

            </q-table>

            <!-- Amount Display -->
            <div class="q-mt-md">
              <q-item-label class="q-mb-xs">Amount:</q-item-label>
              <q-input
                outlined
                dense
                :model-value="`₱${(store.totalExpensesAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
                style="width: 300px"
                readonly
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="store.closeDialog('disbursement')" />
            <q-btn
              label="Disburse"
              color="primary"
              @click="handleSaveClick"
              v-permission="'add'"
              :loading="store.savingDisbursement"
              :disable="store.savingDisbursement"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Expense Selection Dialog -->
      <q-dialog v-model="store.dialogs.expense" persistent>
        <q-card style="min-width: 800px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Select Expense Account</div>
          </q-card-section>

          <q-card-section>
            <q-input
              outlined
              dense
              placeholder="Search expense account..."
              v-model="store.expenseSearch"
              class="q-mb-sm"
              style="width: 300px"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>

            <q-table
              :rows="store.filteredExpenseAccounts"
              :columns="store.expenseAccountColumns"
              row-key="id"
              :loading="store.loading || store.expenseTypeLoading"
              :filter="store.expenseSearch"
              flat
              bordered
            >
              <template v-slot:body-cell-action="props">
                <q-td :props="props">
                  <q-btn
                    dense
                    label="Select"
                    color="primary"
                    @click="store.openExpenseDetail(props.row)"
                  />
                </q-td>
              </template>

              <template v-slot:no-data>
                <div class="full-width row flex-center text-grey q-gutter-sm">
                  <q-icon size="2em" name="info" />
                  <span v-if="store.loading || store.expenseTypeLoading">
                    Loading expense accounts...
                  </span>
                  <span v-else>
                    No continuing appropriation accounts available.
                    <br />
                    Please create continuing appropriations first in the Continuing Appropriation
                    module.
                  </span>
                </div>
              </template>
            </q-table>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="store.closeDialog('expense')" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Add Expense Dialog -->
      <q-dialog v-model="store.dialogs.expenseDetail">
        <q-card style="min-width: 500px">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Add Expense</div>
          </q-card-section>

          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">
              <strong>Account:</strong> {{ store.forms.expense.account }}
            </div>
            <div class="text-subtitle1 q-mb-md">
              <strong>Balance:</strong> ₱{{ store.forms.expense.balance.toLocaleString() }}
            </div>
            <q-input
              outlined
              dense
              v-model="store.forms.expense.particulars"
              label="Particulars"
              placeholder="Enter particulars..."
            />
            <q-input
              outlined
              dense
              :model-value="formatInputValue(store.forms.expense.amount)"
              @update:model-value="(val) => store.forms.expense.amount = handleAmountInput(val)"
              @blur="(e) => (store.forms.expense.amount = formatToTwoDecimals(e.target.value))"
              label="Amount"
              class="q-mb-md"
              prefix="₱"
              inputmode="decimal"
              pattern="\\d*\\.?\\d{0,2}"
              @keypress="blockNonNumeric"
              @paste.prevent="handlePasteNumeric"
              placeholder="0.00"
              :error="isAmountExceedingBalance"
              :error-message="amountErrorMessage"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="store.closeDialog('expenseDetail')" />
            <q-btn 
              label="Save" 
              @click="handleSaveExpense" 
              color="primary" 
              :disable="isAmountExceedingBalance || !store.forms.expense.particulars?.trim()"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Main Data Table -->
      <q-card flat bordered>
        <q-table
          :rows="filteredDisbursements"
          :columns="store.disbursementColumns"
          row-key="id"
          :pagination="store.pagination"
          :loading="store.loadingDisbursements"
          flat
        >  <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="getStatusColor(props.row.status)"
                :text-color="getStatusTextColor(props.row.status)"
                dense
                :label="props.row.status"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="row q-gutter-xs items-center justify-center">
                <q-btn
                  dense
                  icon="edit"
                  :color="
                    props.row.status === 'Pending' || props.row.status === 'Partial'
                      ? 'orange'
                      : 'grey'
                  "
                  :disable="props.row.status !== 'Pending' && props.row.status !== 'Partial'"
                  :loading="store.loadingEditDisbursement === props.row.id"
                  @click="handleEditDisbursement(props.row)"
                  v-permission="'edit'"
                />
                <q-btn
                  dense
                  icon="visibility"
                  color="blue"
                  @click="handleViewDisbursement(props.row)"
                  :loading="viewLoading[props.row.id]"
                  :disable="viewLoading[props.row.id]"
                  v-permission="'view'"
                />

              </div>
            </q-td>
          </template>
           <template v-slot:body-cell-liquidate="props">
            <q-td :props="props">
              <div class="row q-gutter-xs items-center justify-center">

                <q-btn
                  dense
                  label="Liquidate"
                  color="primary"
                  v-if="props.row.status === 'Pending' || props.row.status === 'Partial'"
                  @click="handleLiquidateDisbursement(props.row)"
                  :loading="liquidateLoading[props.row.id]"
                  :disable="liquidateLoading[props.row.id]"
                  v-permission="'add'"
                />
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>

      <ContLiquidateDialog v-model="store.dialogs.orDetails" @save="handleLiquidateSave" />
      <ContViewOr v-model="store.dialogs.viewOrDetails" />
      <ContEditDisburse v-model="store.dialogs.editDisbursement" @save="handleEditSave" />
    </div>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { ref, onMounted, computed } from 'vue'
import { useContDisbursementStore } from 'src/stores/contDisburseStore'
import { useBankStore } from 'src/stores/bankStore'
import ContLiquidateDialog from 'src/components/contDisburse/ContOrDetails.vue'
import ContViewOr from 'src/components/contDisburse/ContViewOr.vue'
import ContEditDisburse from 'src/components/contDisburse/ContEditDisburse.vue'
import { usePageLogging } from 'src/composables/usePageLogging'

const $q = useQuasar()
const loading = ref(false)
const store = useContDisbursementStore()
const bankStore = useBankStore()
const dateRange = ref(null)
const viewLoading = ref({})
const liquidateLoading = ref({})

// Current fiscal year
const currentFiscalYear = computed(() => new Date().getFullYear())

// Amount validation computed properties
const isAmountExceedingBalance = computed(() => {
  const amount = Number(store.forms.expense.amount) || 0
  const balance = store.forms.expense.balance || 0
  return amount > balance && amount > 0
})

const amountErrorMessage = computed(() => {
  if (isAmountExceedingBalance.value) {
    const amount = Number(store.forms.expense.amount) || 0
    const balance = store.forms.expense.balance || 0
    return `Amount exceeds available balance. Available: ₱${balance.toLocaleString()}, Requested: ₱${amount.toLocaleString()}`
  }
  return ''
})

// Status counts for summary cards
// const statusCounts = computed(() => {
//   const counts = {
//     pending: 0,
//     partial: 0,
//     liquidated: 0,
//     voided: 0,
//     stale: 0,
//   }

//   store.disbursements.forEach((disbursement) => {
//     switch (disbursement.status) {
//       case 'Pending':
//         counts.pending++
//         break
//       case 'Partial':
//         counts.partial++
//         break
//       case 'Liquidated':
//         counts.liquidated++
//         break
//       case 'Void Requested':
//       case 'Voided':
//         counts.voided++
//         break
//       case 'Stale':
//         counts.stale++
//         break
//     }
//   })

//   return counts
// })

// Removed particulars filtering logic since particulars is now a simple text input

// Computed properties
const currentBankLabel = computed(() => {
  if (store.forms.disbursement.bank_id) {
    const selectedBank = bankStore.banks.find(
      (bank) => bank.id === store.forms.disbursement.bank_id,
    )
    return selectedBank ? selectedBank.name : 'Select Bank'
  }
  return 'Select Bank'
})

// Filtered disbursements based on search and date range
const filteredDisbursements = computed(() => {
  let filtered = store.disbursements

  // Filter by search query
  if (store.searchQuery && store.searchQuery.trim()) {
    const query = store.searchQuery.toLowerCase().trim()
    filtered = filtered.filter(
      (disbursement) =>
        disbursement.payee?.toLowerCase().includes(query) ||
        disbursement.dvNumber?.toLowerCase().includes(query) ||
        disbursement.chequeNumber?.toLowerCase().includes(query),
    )
  }

  // Filter by date range
  if (store.dateFrom && store.dateTo) {
    filtered = filtered.filter((disbursement) => {
      if (!disbursement.date) return false

      // Convert disbursement date to DD/MM/YYYY format for comparison
      const disbursementDate = disbursement.date.includes('/')
        ? disbursement.date
        : new Date(disbursement.date).toLocaleDateString('en-GB')

      return disbursementDate >= store.dateFrom && disbursementDate <= store.dateTo
    })
  }

  return filtered
})

const validateAndSave = () => {
  if (store.dialogs.disbursement) {
    const form = store.forms.disbursement
    const hasRequiredFields = form.date && form.bank_id && form.dvNumber && form.payee
    const hasExpenses = store.expenses && store.expenses.length > 0

    if (!hasRequiredFields) {
      $q.notify({
        type: 'negative',
        message: 'Please fill in all required fields before saving',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    if (!hasExpenses) {
      $q.notify({
        type: 'negative',
        message: 'Please add at least one expense before saving',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    store.saveDisbursement().then((result) => {
      if (!result.success) {
        $q.notify({
          type: 'negative',
          message: result.error || 'Failed to save disbursement',
          icon: 'error',
          position: 'top',
          timeout: 5000,
        })
      }
    })
  }
}

const handleEnterKey = (event) => {
  if (event) {
    event.preventDefault()
  }
  validateAndSave()
}
const getStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return 'orange'
    case 'Partial':
      return 'amber'
    case 'Liquidated':
      return 'green'
    case 'Void Requested':
      return 'deep-orange'
    case 'Voided':
      return 'red'
    case 'Stale':
      return 'purple'
    default:
      return 'grey'
  }
}
const getStatusTextColor = (status) => {
  switch (status) {
    case 'Pending':
    case 'Partial':
    case 'Liquidated':
    case 'Void Requested':
    case 'Voided':
    case 'Stale':
      return 'white'
    default:
      return 'black'
  }
}

const handleSaveClick = async () => {
  await validateAndSave()
  // Refresh the disbursement list after saving
  await store.fetchDisbursements()
}

const handleBankSelection = async (bankId) => {
  if (bankId) {
    try {
      await store.selectBank(bankId)
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: `Failed to load booklets for selected bank: ${error.message}`,
        icon: 'error',
        position: 'top',
      })
    }
  }
}

const handleAddExpense = async () => {
  console.log('Add button clicked, starting to open expense dialog...')

  try {
    await store.openDialog('expense')
    console.log('Expense dialog opened successfully')
  } catch (error) {
    console.error('Error opening expense dialog:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open expense dialog: ' + (error.message || 'Unknown error'),
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

const handleSaveExpense = async () => {
  try {
    await store.saveExpense()
    $q.notify({
      type: 'positive',
      message: 'Expense added successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
  } catch (error) {
    console.error('Error saving expense:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to save expense',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

const handleDeleteExpense = async (row) => {
  try {
    await store.deleteItem(row)
    $q.notify({
      type: 'positive',
      message: 'Expense deleted successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to delete expense',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

const preloadExpenseAccounts = () => {
  // Preload expense accounts when user hovers over Add button
  // Only preload if not already loading and no data exists
  if (store.expenseData.length === 0 && !store.loading && !store.expenseTypeLoading) {
    store.refreshExpenseAccountsWithBalances().catch((error) => {
      console.warn('Failed to preload expense accounts:', error)
    })
  }
}

const loadPendingUsers = async () => {
  loading.value = true
  try {
    // Refresh both disbursements and banks
    const refreshPromises = [store.fetchDisbursements(), bankStore.fetchBanks()]
    await Promise.all(refreshPromises)

    $q.notify({
      type: 'positive',
      message: 'Continuing disbursements refreshed!',
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

const dateRangeDisplay = computed(() => {
  if (!dateRange.value || !dateRange.value.from || !dateRange.value.to) {
    return ''
  }
  const fromDate = new Date(dateRange.value.from).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const toDate = new Date(dateRange.value.to).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${fromDate} - ${toDate}`
})

const onDateRangeChange = (newRange) => {
  if (newRange && newRange.from && newRange.to) {
    const fromDate = new Date(newRange.from)
    const toDate = new Date(newRange.to)
    store.dateFrom = fromDate.toLocaleDateString('en-GB')
    store.dateTo = toDate.toLocaleDateString('en-GB')
  } else {
    store.dateFrom = ''
    store.dateTo = ''
  }
}

const onDateRangeClear = () => {
  dateRange.value = null
  store.dateFrom = ''
  store.dateTo = ''
}

const clearAllFilters = () => {
  store.searchQuery = ''
  store.dateFrom = ''
  store.dateTo = ''
  dateRange.value = null
}

// Handle edit disbursement with loading state
const handleEditDisbursement = async (row) => {
  try {
    await store.openEditDisbursement(row)
  } catch (error) {
    console.error('Error opening edit disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open edit disbursement',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
  }
}

// Handle edit save result
const handleEditSave = async (result) => {
  if (result.success) {
    $q.notify({
      type: 'positive',
      message: 'Disbursement updated successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
  } else {
    $q.notify({
      type: 'negative',
      message: result.error || 'Failed to update disbursement',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

// Handle liquidate save result
const handleLiquidateSave = async (result) => {
  if (result.success) {
    $q.notify({
      type: 'positive',
      message: 'Disbursement liquidated successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
  } else {
    $q.notify({
      type: 'negative',
      message: result.error || 'Failed to liquidate disbursement',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

// Handle view disbursement with loading state
const handleViewDisbursement = async (row) => {
  viewLoading.value[row.id] = true
  try {
    await store.openViewOrDetails(row)
  } catch (error) {
    console.error('Error opening view disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open view disbursement',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
  } finally {
    viewLoading.value[row.id] = false
  }
}

// Handle liquidate disbursement with loading state
const handleLiquidateDisbursement = async (row) => {
  liquidateLoading.value[row.id] = true
  try {
    await store.openOrDetailsDialog(row)
  } catch (error) {
    console.error('Error opening liquidate disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open liquidate disbursement',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
  } finally {
    liquidateLoading.value[row.id] = false
  }
}

// Formatting helpers for amount input
const formatInputValue = (value) => {
  if (value === '' || value === null || value === undefined) return ''
  const isNumber = typeof value === 'number'
  const cleanValue = String(value).replace(/[₱,\s]/g, '').replace(/,/g, '')
  const num = parseFloat(cleanValue)
  if (isNaN(num)) return ''
  return isNumber
    ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : num.toLocaleString('en-US')
}

const handleAmountInput = (value) => {
  let cleanValue = String(value).replace(/[₱,\s]/g, '')
  cleanValue = cleanValue.replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }
  return cleanValue
}

const formatToTwoDecimals = (value) => {
  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  if (cleanValue === '') return ''
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    const collapsed = parts[0] + '.' + parts.slice(1).join('')
    return formatToTwoDecimals(collapsed)
  }
  if (parts.length === 2 && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2)
  }
  const num = parseFloat(parts.join('.'))
  if (isNaN(num)) return ''
  return Math.round(num * 100) / 100
}

const blockNonNumeric = (event) => {
  const key = event.key
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
  
  if (allowedKeys.includes(key)) {
    return
  }
  
  // Allow decimal point only if there isn't one already
  if (key === '.' && !event.target.value.includes('.')) {
    return
  }
  
  // Block all other characters except digits
  if (!/^\d$/.test(key)) {
    event.preventDefault()
  }
}

const handlePasteNumeric = (event) => {
  event.preventDefault()
  const paste = (event.clipboardData || window.clipboardData).getData('text')
  const cleanValue = paste.replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  let finalValue = parts[0]
  if (parts.length > 1) {
    finalValue += '.' + parts.slice(1).join('').substring(0, 2)
  }
  store.forms.expense.amount = finalValue
}




// Function to load all data with optimized loading strategy
const loadAllData = async () => {
  loading.value = true

  try {
    // Load critical data first (disbursements and banks) in parallel
    const criticalPromises = [store.fetchDisbursements(), bankStore.fetchBanks()]

    await Promise.all(criticalPromises)

    // Load expense accounts in background (non-blocking)
    store.refreshExpenseAccountsWithBalances().catch((error) => {
      console.warn('Failed to load expense accounts in background:', error)
    })

    $q.notify({
      type: 'positive',
      message: 'Continuing disbursement data loaded successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 2000,
    })
  } catch (error) {
    console.error('Error during data loading:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load continuing disbursement data: ' + (error.message || 'Unknown error'),
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadAllData()

  // Log page visit
  const { logPageVisit } = usePageLogging()
  await logPageVisit('Continuing Disbursement')
})
</script>

<style scoped>
.contdis-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

/* Status Indicators Container */
.status-indicators-container {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

/* Summary Cards Styling */
.summary-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  background: white;
  border: 2px solid transparent;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.filters-section {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }

  .status-indicators-container {
    padding: 12px;
  }

  .row.items-center.q-gutter-sm {
    flex-direction: column;
    align-items: stretch;
  }

  .row.items-center.q-gutter-sm > * {
    margin-bottom: 8px;
    width: 100%;
  }

  .row.q-col-gutter-md {
    flex-direction: column;
  }

  .col-md-2,
  .col-sm-4,
  .col-xs-6 {
    margin-bottom: 8px;
  }

  .col-md-4,
  .col-sm-6,
  .col-sm-12 {
    width: 100%;
    margin-bottom: 8px;
  }

  .summary-card .q-card-section {
    padding: 12px;
  }

  .text-h4 {
    font-size: 1.5rem;
  }
}
</style>
