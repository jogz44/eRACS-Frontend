<template>
  <q-page class="q-pa-md disbursement-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-medium">Disbursement Transaction</div>
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
          :loading="store.loadingDisbursements"
        />
      </div>
    </div>

    <!-- Status Summary Cards -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card class="summary-card pending-card">
          <q-card-section class="text-center">
            <div class="text-h4 text-weight-bold text-orange">{{ statusCounts.pending }}</div>
            <div class="text-subtitle2 text-grey-7">Pending</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card class="summary-card partial-card">
          <q-card-section class="text-center">
            <div class="text-h4 text-weight-bold text-amber">{{ statusCounts.partial }}</div>
            <div class="text-subtitle2 text-grey-7">Partial</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card class="summary-card liquidated-card">
          <q-card-section class="text-center">
            <div class="text-h4 text-weight-bold text-green">{{ statusCounts.liquidated }}</div>
            <div class="text-subtitle2 text-grey-7">Liquidated</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card class="summary-card voided-card">
          <q-card-section class="text-center">
            <div class="text-h4 text-weight-bold text-red">{{ statusCounts.voided }}</div>
            <div class="text-subtitle2 text-grey-7">Voided</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Filters Section -->
    <q-card flat bordered class="q-mb-md filters-section">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Status Filter -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Status:</q-item-label>
            <q-select
              outlined
              dense
              v-model="selectedStatus"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              :label="currentStatusLabel"
              clearable
              @update:model-value="handleStatusChange"
            />
          </div>

          <!-- Budget Source Filter -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Budget Source:</q-item-label>
            <q-select
              outlined
              dense
              v-model="selectedBudgetSource"
              :options="budgetSourceOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              :label="currentBudgetSourceLabel"
              @update:model-value="handleBudgetSourceChange"
            />
          </div>

          <!-- Search Input -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Search:</q-item-label>
            <q-input
              outlined
              dense
              v-model="searchQuery"
              placeholder="Search payee, DV number..."
              clearable
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Date Range Filter -->
          <div class="col-md-2 col-sm-6 col-xs-12">
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
                    <q-date
                      v-model="dateRange"
                      range
                      @update:model-value="onDateRangeChange"
                    >
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

          <!-- Spacer to push Add button to the right -->
          <div class="col-md-2 col-sm-0 col-xs-0"></div>

          <!-- Add Button -->
          <div class="col-md-1 col-sm-6 col-xs-12">
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
      <SearchFilters @add="store.openDialog('disbursement')" />

      <!-- Disbursement Dialog -->
      <q-dialog v-model="store.dialogs.disbursement" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 900px; max-width: 95vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Disbursement</div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <!-- Budget Source Selection -->
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Budget Source:</q-item-label>
                <q-select
                  outlined
                  dense
                  v-model="selectedBudgetSource"
                  :options="budgetSourceOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  :label="currentBudgetSourceLabel"
                  @update:model-value="handleBudgetSourceChange"
                  @keydown.enter="handleEnterKey"
                />
              </div>

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
                ></q-input>
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
                :loading="addingExpense || store.expenseTypeLoading"
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
              <template v-slot:body-cell-budget_source="props">
                <q-td :props="props">
                  <q-badge
                    :color="getBudgetSourceColor(props.row.budget_source)"
                    :label="getBudgetSourceLabel(props.row.budget_source)"
                    class="budget-source-badge"
                  />
                </q-td>
              </template>
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
            <q-select
              outlined
              dense
              v-model="store.forms.expense.particulars"
              :options="filteredParticulars"
              label="Particulars"
              use-input
              fill-input
              hide-selected
              new-value-mode="add-unique"
              @filter="filterFn"
            />
            <q-input
              outlined
              dense
              :model-value="formatInputValue(store.forms.expense.amount)"
              @update:model-value="(val) => (store.forms.expense.amount = handleAmountInput(val))"
              @blur="(e) => (store.forms.expense.amount = formatToTwoDecimals(e.target.value))"
              label="Amount"
              class="q-mb-md"
              prefix="₱"
              inputmode="decimal"
              pattern="\\d*\\.?\\d{0,2}"
              @keypress="blockNonNumeric"
              @paste.prevent="handlePasteNumeric"
              placeholder="0.00"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="store.closeDialog('expenseDetail')" />
            <q-btn label="Save" @click="handleSaveExpense" color="primary" />
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
        >
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

                <!-- Treasurer: Request void -->
                <q-btn
                  dense
                  icon="block"
                  color="red"
                  v-if="
                    isTreasurer &&
                    (props.row.status === 'Pending' || props.row.status === 'Partial') &&
                    canVoid(props.row)
                  "
                  @click.stop="() => handleVoidDisbursement(props.row)"
                  v-permission="'delete'"
                />
                <!-- Captain/SK Chairperson: Direct void -->
                <q-btn
                  dense
                  icon="block"
                  color="red"
                  v-if="
                    isApprover &&
                    (props.row.status === 'Pending' || props.row.status === 'Partial') &&
                    canVoid(props.row)
                  "
                  @click.stop="() => handleDirectVoidDisbursement(props.row)"
                  v-permission="'delete'"
                />
                <!-- Approver: Handle void requests -->
                <div v-if="isApprover">
                  <q-btn
                    dense
                    icon="check_circle"
                    color="green"
                    class="q-mr-xs"
                    v-if="props.row.status === 'Void Requested'"
                    @click="handleApproveVoid(props.row)"
                  />
                  <q-btn
                    dense
                    icon="cancel"
                    color="grey"
                    v-if="props.row.status === 'Void Requested'"
                    @click="handleRejectVoid(props.row)"
                  />
                </div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="getStatusColor(props.row.status)"
                :text-color="getStatusTextColor(props.row.status)"
                dense
                :label="props.row.status"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-remarks="props">
            <q-td :props="props">
              <div v-if="props.row.status === 'Void Requested' && props.row.remarks">
                {{ props.row.remarks }}
              </div>
              <div v-else-if="props.row.status === 'Voided' && props.row.remarks">
                {{ props.row.remarks }}
              </div>
              <div v-else-if="props.row.rejection_remarks">
                {{ props.row.rejection_remarks }}
              </div>
              <div v-else>-</div>
            </q-td>
          </template>

          <template v-slot:body-cell-liquidate="props">
            <q-td :props="props">
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
            </q-td>
          </template>
        </q-table>
      </q-card>

      <OrDetailsDialog v-model="store.dialogs.orDetails" />
      <ViewOrDetails v-model="store.dialogs.viewOrDetails" />
      <EditDisbursement />

      <!-- Void Request Dialog (for Treasurers) -->
      <q-dialog v-model="store.dialogs.void" persistent>
        <q-card style="min-width: 500px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Request Void</div>
          </q-card-section>

          <q-card-section>
            <div class="text-body1 q-mb-md">Please provide remarks for this void request. The request will be sent to the Barangay Captain or SK Chairperson for approval.</div>

            <q-input
              outlined
              v-model="store.forms.void.remarks"
              label="Remarks (Required)"
              type="textarea"
              rows="3"
              :rules="[(val) => (!!val && val.trim() !== '') || 'Remarks are required']"
              hint="Reason for requesting to void this disbursement"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="store.closeVoidDialog()" />
            <q-btn
              label="Submit Void Request"
              color="red"
              :loading="store.voidingDisbursement"
              :disable="!store.forms.void.remarks || store.forms.void.remarks.trim() === ''"
              @click="handleSubmitVoidRequest"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'

import OrDetailsDialog from 'components/disbursement/OrDetailsDialog.vue'
import ViewOrDetails from 'components/disbursement/ViewOrDetails.vue'
import EditDisbursement from 'components/disbursement/EditDisbursement.vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useAuthStore } from 'stores/auth'
import { useBankStore } from 'stores/bankStore'
import { usePageLogging } from '../../../composables/usePageLogging'

const store = useDisbursementStore()
const bankStore = useBankStore()
const authStore = useAuthStore()

// Budget source selection
const selectedBudgetSource = ref('all')
const budgetSourceOptions = [
  { label: 'All Budgets', value: 'all' },
  { label: 'Annual Budget Only', value: 'annual' },
  { label: 'Supplemental Budget Only', value: 'supplemental' },
]

// Status filtering
const selectedStatus = ref(null)
const statusOptions = [
  { label: 'All Status', value: null },
  { label: 'Pending', value: 'Pending' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Liquidated', value: 'Liquidated' },
  { label: 'Void Requested', value: 'Void Requested' },
  { label: 'Voided', value: 'Voided' },
]

// Search query
const searchQuery = ref('')

const filteredParticulars = ref(store.particulars)
function filterFn(val, update) {
  if (val === '') {
    update(() => {
      filteredParticulars.value = store.particulars
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    filteredParticulars.value = store.particulars.filter((opt) =>
      opt.label.toLowerCase().includes(needle),
    )
  })
}
// Helper function to extract numeric days from aging string
const getAgingDays = (agingString) => {
  if (!agingString) return 0
  const match = agingString.match(/(\d+)\s*days?/)
  return match ? parseInt(match[1]) : 0
}

// Formatting helpers for amount input (kept local to this component)
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
  if (allowedKeys.includes(key)) return
  if (key === '.' && !event.target.value.includes('.')) return
  if (!/^\d$/.test(key)) event.preventDefault()
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

function canVoid(row) {
  // Can only void if pending or partial
  if (!(row.status === 'Pending' || row.status === 'Partial')) return false

  // Check aging restriction (≤ 1 day can be voided)
  const aging = Number(getAgingDays(row.aging))
  if (Number.isNaN(aging) || aging > 1) return false

  return true
}
// Clear all filters
const clearAllFilters = () => {
  selectedStatus.value = null
  selectedBudgetSource.value = 'all'
  searchQuery.value = ''
  dateRange.value = null
  store.searchQuery = ''
  store.dateFrom = ''
  store.dateTo = ''
}
const dateRange = ref(null)

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
    // Convert date format from YYYY/MM/DD to DD/MM/YYYY
    const fromDate = new Date(newRange.from)
    const toDate = new Date(newRange.to)

    store.dateFrom = fromDate.toLocaleDateString('en-GB') // DD/MM/YYYY format
    store.dateTo = toDate.toLocaleDateString('en-GB') // DD/MM/YYYY format
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

// Handle direct void disbursement (for Captains/SK Chairpersons)
const handleDirectVoidDisbursement = (row) => {
  $q.dialog({
    title: 'Void Disbursement',
    message: 'Please provide remarks for voiding this disbursement:',
    prompt: {
      model: '',
      type: 'textarea',
      isValid: (val) => val && val.trim() !== '',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (remarks) => {
    try {
      const result = await store.voidDisbursementDirectly(row.id, remarks?.trim?.() || '')
      if (result.success) {
        $q.notify({
          type: 'positive',
          message: 'Disbursement voided successfully!',
          icon: 'block',
          position: 'top',
          timeout: 3000,
        })
      } else {
        $q.notify({
          type: 'negative',
          message: result.message || 'Failed to void disbursement',
          icon: 'error',
          position: 'top',
          timeout: 5000,
        })
      }
    } catch (error) {
      console.error('Error voiding disbursement:', error)
      $q.notify({
        type: 'negative',
        message: error.message || 'An error occurred while voiding the disbursement',
        icon: 'error',
        position: 'top',
        timeout: 5000,
      })
    }
  })
}

// Status color helpers
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
      return 'white'
    default:
      return 'black'
  }
}

// Role helpers
const userPosition = computed(() => authStore.user?.position_name || '')
const isTreasurer = computed(() => /treasurer/i.test(userPosition.value))
const isApprover = computed(() => /(captain|chairperson)/i.test(userPosition.value))

// Current fiscal year
const currentFiscalYear = computed(() => new Date().getFullYear())

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

    // Show success notification only if not initial load
    if (!initialLoading.value) {
      $q.notify({
        type: 'positive',
        message: `Disbursement data for fiscal year ${currentFiscalYear.value} loaded successfully!`,
        icon: 'check_circle',
        position: 'top',
        timeout: 2000,
      })
    }
  } catch (error) {
    console.error('Error during data loading:', error)
    if (!initialLoading.value) {
      $q.notify({
        type: 'negative',
        message: 'Failed to load disbursement data: ' + (error.message || 'Unknown error'),
        icon: 'error',
        position: 'top',
        timeout: 5000,
      })
    }
  } finally {
    loading.value = false
    initialLoading.value = false
  }
}

// Set up periodic refresh for expense accounts
// Removed to reduce excessive API calls

onMounted(async () => {
  await loadAllData()

  // Refresh expense accounts with updated balances
  store.refreshExpenseAccountsWithBalances()

  // Log page visit
  const { logPageVisit } = usePageLogging()
  await logPageVisit('Current Disbursement')
})

// Auto-refresh expense accounts when the expense dialog is opened
watch(
  () => store.dialogs.expense,
  async (isOpen) => {
    if (isOpen && store.expenseAccounts.length === 0) {
      store.refreshExpenseAccountsWithBalances()
    }
  },
)

// Sync selected budget source with store and refresh expense accounts
watch(selectedBudgetSource, async (newBudgetSource) => {
  store.setBudgetSourceFilter(newBudgetSource)
  // Refresh expense accounts when budget source changes
  if (store.dialogs.expense) {
    await store.refreshExpenseAccountsWithBalances()
  }
})

const $q = useQuasar()
const loading = ref(false)
const addingExpense = ref(false)
const initialLoading = ref(true)
const viewLoading = ref({})
const liquidateLoading = ref({})

const currentBankLabel = computed(() => {
  if (store.forms.disbursement.bank_id) {
    const selectedBank = bankStore.banks.find(
      (bank) => bank.id === store.forms.disbursement.bank_id,
    )
    return selectedBank ? selectedBank.name : 'Select Bank'
  }
  return 'Select Bank'
})

const currentBudgetSourceLabel = computed(() => {
  const option = budgetSourceOptions.find((opt) => opt.value === selectedBudgetSource.value)
  return option ? option.label : 'Select Budget Source'
})

const currentStatusLabel = computed(() => {
  const option = statusOptions.find((opt) => opt.value === selectedStatus.value)
  return option ? option.label : 'All Status'
})

// Status counts for summary cards
const statusCounts = computed(() => {
  const counts = {
    pending: 0,
    partial: 0,
    liquidated: 0,
    voided: 0,
  }

  store.disbursements.forEach((disbursement) => {
    switch (disbursement.status) {
      case 'Pending':
        counts.pending++
        break
      case 'Partial':
        counts.partial++
        break
      case 'Liquidated':
        counts.liquidated++
        break
      case 'Void Requested':
      case 'Voided':
        counts.voided++
        break
    }
  })

  return counts
})

// Filtered disbursements based on status, search, and date range
const filteredDisbursements = computed(() => {
  let filtered = store.disbursements

  // Filter by status
  if (selectedStatus.value) {
    filtered = filtered.filter((disbursement) => disbursement.status === selectedStatus.value)
  }

  // Filter by search query
  if (searchQuery.value && searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
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

const handleBudgetSourceChange = async (budgetSource) => {
  if (budgetSource) {
    try {
      // Update the store to filter expense accounts based on budget source
      await store.setBudgetSourceFilter(budgetSource)
      // Refresh expense accounts with the new filter
      await store.refreshExpenseAccountsWithBalances()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: `Failed to update budget source filter: ${error.message}`,
        icon: 'error',
        position: 'top',
      })
    }
  }
}

const handleStatusChange = () => {
  // Status filtering is handled by the computed property
  // No additional logic needed as it's reactive
}

const validateAndSave = () => {
  if (store.dialogs.disbursement) {
    const form = store.forms.disbursement
    const hasRequiredFields = form.date && form.bank_id && form.dvNumber && form.payee
    if (hasRequiredFields && !store.loading) {
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
    } else {
      $q.notify({
        type: 'negative',
        message: 'Please fill in all required fields before saving',
        icon: 'warning',
        position: 'top',
      })
    }
  }
}

const handleEnterKey = (event) => {
  if (event) {
    event.preventDefault()
  }
  validateAndSave()
}

const handleSaveClick = async () => {
  await validateAndSave()
  // Refresh the disbursement list after saving
  await store.fetchDisbursements()
}

const preloadExpenseAccounts = () => {
  // Preload expense accounts when user hovers over Add button
  if (store.expenseAccounts.length === 0 && !store.expenseAccountsLoading) {
    store.refreshExpenseAccountsWithBalances().catch((error) => {
      console.warn('Failed to preload expense accounts:', error)
    })
  }
}

const handleAddExpense = async () => {
  addingExpense.value = true
  try {
    await store.openDialog('expense')
  } catch (error) {
    console.error('Error opening expense dialog:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open expense dialog',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
  } finally {
    addingExpense.value = false
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

const loadPendingUsers = async () => {
  loading.value = true
  try {
    // Only refresh disbursements and banks, skip expense accounts for faster refresh
    // The fetchDisbursements method now automatically filters by current fiscal year
    const refreshPromises = [store.fetchDisbursements(), bankStore.fetchBanks()]

    await Promise.all(refreshPromises)

    $q.notify({
      type: 'positive',
      message: `Disbursements for fiscal year ${currentFiscalYear.value} refreshed!`,
      icon: 'refresh',
      position: 'top',
      timeout: 3000,
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to refresh disbursements',
      icon: 'error',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

// Open void dialog for treasurer
const handleVoidDisbursement = (row) => {
  store.openVoidDialog(row)
}

// Submit void request from dialog
const handleSubmitVoidRequest = async () => {
  try {
    await store.submitVoidRequest()
    $q.notify({
      type: 'positive',
      message: 'Void request submitted successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to submit void request',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

// Approver actions
const handleApproveVoid = async (row) => {
  try {
    await store.approveVoidRequest(row.id)
    $q.notify({
      type: 'positive',
      message: 'Void approved.',
      icon: 'check_circle',
      position: 'top',
      timeout: 2500,
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to approve void',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

const handleRejectVoid = async (row) => {
  $q.dialog({
    title: 'Reject Void Request',
    message: 'Please provide rejection remarks:',
    prompt: {
      model: '',
      type: 'textarea',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (remarks) => {
    try {
      await store.rejectVoidRequest(row.id, remarks?.trim?.() || '')
      $q.notify({
        type: 'positive',
        message: 'Void request rejected.',
        icon: 'check_circle',
        position: 'top',
        timeout: 2500,
      })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.message || 'Failed to reject void request',
        icon: 'error',
        position: 'top',
        timeout: 5000,
      })
    }
  })
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

// Budget source helper functions
const getBudgetSourceColor = (budgetSource) => {
  if (budgetSource?.toLowerCase().includes('annual')) {
    return 'primary'
  } else if (budgetSource?.toLowerCase().includes('supplemental')) {
    return 'secondary'
  }
  return 'grey'
}

const getBudgetSourceLabel = (budgetSource) => {
  if (budgetSource?.toLowerCase().includes('annual')) {
    return 'Annual'
  } else if (budgetSource?.toLowerCase().includes('supplemental')) {
    return 'Supplemental'
  }
  return 'Mixed'
}
</script>

<style scoped>
.disbursement-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

/* Style for loading edit button */
.q-btn[loading] {
  opacity: 0.7;
}

/* Ensure proper spacing for action buttons */
.q-gutter-xs .q-btn {
  margin: 2px;
}

/* Summary Cards Styling */
.summary-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.pending-card {
  border-left: 4px solid #ff9800;
}

.partial-card {
  border-left: 4px solid #ffc107;
}

.liquidated-card {
  border-left: 4px solid #4caf50;
}

.voided-card {
  border-left: 4px solid #f44336;
}

/* Filter Section Styling */
.q-card .q-card-section {
  padding: 16px;
}

.q-item-label {
  font-weight: 500;
  color: #424242;
}

/* Filter Layout Improvements */
.filters-section .row {
  align-items: end;
}

.filters-section .q-item-label {
  margin-bottom: 4px;
  font-size: 0.875rem;
}

.filters-section .q-select,
.filters-section .q-input {
  min-height: 40px;
}

.filters-section .q-btn {
  min-height: 40px;
}

/* Clear All Button Styling */
.clear-all-btn {
  border: 1px solid #f44336;
}

.clear-all-btn:hover {
  background-color: #ffebee;
}

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }

  .row.q-col-gutter-md {
    flex-direction: column;
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
