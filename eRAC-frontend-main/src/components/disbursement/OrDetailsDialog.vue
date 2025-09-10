<template>
  <q-dialog v-model="store.dialogs.orDetails" persistent>
    <q-card style="min-width: 1100px">
      <q-card-section>
        <div class="text-h6">
          Liquidation Details for Disbursement #{{ store.currentLiquidation.dvNumber }}
        </div>
        <div class="text-caption text-grey-6 q-mt-sm">
          Add official receipt details for liquidation
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Date Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Date:</q-item-label>
            <q-input
              filled
              outlined
              dense
              v-model="store.currentLiquidation.date"
              mask="##/##/####"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="store.currentLiquidation.date" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- DV Number Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">DV Number:</q-item-label>
            <q-input
              filled
              outlined
              dense
              :model-value="store.currentLiquidation.dvNumber"
              :disable="true"
            />
          </div>

          <!-- DV Amount Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">DV Amount:</q-item-label>
            <q-input
              filled
              outlined
              dense
              :model-value="formatCurrency(store.currentLiquidation.dvAmount || 0)"
              prefix="₱"
              :disable="true"
            />
          </div>

          <!-- Actual Expense Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Actual Expense:</q-item-label>
            <q-input
              filled
              outlined
              dense
              :model-value="formatCurrency(totalActualExpense)"
              prefix="₱"
              :disable="true"
            />
          </div>

          <!-- Amount to Return Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Amount to Return to Appropriation:</q-item-label>
            <q-input
              filled
              outlined
              dense
              :model-value="formatCurrency(totalReturnAmount)"
              prefix="₱"
              :disable="true"
              :color="actualReturnAmount < 0 ? 'negative' : undefined"
            />
          </div>

          <!-- Remarks Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Remarks:</q-item-label>
            <q-input
              filled
              outlined
              dense
              v-model="store.currentLiquidation.remarks"
              placeholder="Enter remarks"
              @update:model-value="handleRemarksChange"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Liquidation Details Section -->
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="text-subtitle1">
            <strong>Liquidation Details:</strong>
            <span class="text-caption text-grey-6 q-ml-sm">
              ({{ orDetailsCount }} record{{ orDetailsCount !== 1 ? 's' : '' }})
            </span>
          </div>
          <q-space />
        </div>

          <!-- OR Details (All Editable) -->
          <div v-if="store.currentLiquidation?.orDetails?.length > 0" class="q-mb-lg">
            <div
              v-for="(orDetail, index) in store.currentLiquidation.orDetails"
              :key="orDetail.id || `new-or-${index}`"
              class="q-mb-md"
            >
              <div class="row items-center q-col-gutter-md">
                <div class="col row q-col-gutter-md no-wrap">
                  <!-- OR Date -->
                  <div class="col">
                    <div class="text-bold q-mb-xs">OR Date:</div>
                    <q-input
                      filled
                      unelaveted
                      outlined
                      v-model="orDetail.orDate"
                      placeholder="Select Date"
                    >
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date
                              v-model="orDetail.orDate"
                              mask="DD/MM/YYYY"
                              @update:model-value="(val) => handleDateChange(val, index)"
                            />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>

                  <!-- OR Number -->
                  <div class="col">
                    <div class="text-bold q-mb-xs">OR Number:</div>
                    <q-input
                      filled
                      unelaveted
                      outlined
                      v-model="orDetail.orNumber"
                      placeholder="OR Number"
                    />
                  </div>

                  <!-- OR Amount -->
                  <div class="col">
                    <div class="text-bold q-mb-xs">OR Amount:</div>
                    <q-input
                      filled
                      unelaveted
                      outlined
                      v-model="orDetail.orAmount"
                      prefix="₱"
                      inputmode="decimal"
                      @keypress="blockNonNumeric"
                      @paste.prevent="handlePasteNumeric"
                      @input="calculateTotals"
                    />
                    <!-- Over-liquidation warning -->
                    <div v-if="actualReturnAmount < 0" class="text-negative q-mt-xs text-caption">
                      Exceeds DV amount by ₱{{ formatCurrency(Math.abs(actualReturnAmount)) }}
                    </div>
                  </div>

                  <!-- OR Image -->
                  <div class="col">
                    <div class="text-bold q-mb-xs" style="display: flex; align-items: center;">
                      OR Image:
                      <q-btn
                        v-if="orDetail.orPhotoUrl"
                        flat
                        dense
                        round
                        icon="delete"
                        color="red"
                        @click="removeOrImage(index)"
                        style="margin-left: 8px;"
                      />
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
                      <q-btn
                        v-if="!orDetail.orPhotoUrl"
                        flat
                        dense
                        color="primary"
                        icon="upload"
                        label="Upload"
                        @click="triggerOrFileInput(index)"
                        style="min-width: 100px;"
                      />
                      <q-img
                        v-if="orDetail.orPhotoUrl"
                        :src="orDetail.orPhotoUrl"
                        style="max-width: 100%; max-height: 100px; border-radius: 4px; border: 1px solid #eee;"
                      />
                    </div>
                    <input
                      :ref="setOrImageInputRef(index)"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      style="display: none"
                      @change="(e) => onOrImageChange(e, index)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <q-btn
          flat
          label="Cancel"
          class="modal-cancel-btn"
          @click="store.closeDialog('orDetails')"
        />
        <q-btn
          flat
          label="Partial"
          color="warning"
          @click="handlePartialLiquidation"
          :disable="!isValid || !canSubmit || savingSubmit"
          :loading="savingPartial"
        />
        <q-btn
          :label="needsReimbursement ? 'Reimbursement' : 'Submit'"
          :color="needsReimbursement ? 'orange' : 'green'"
          @click="needsReimbursement ? handleReimbursement() : showSubmitConfirmation()"
          :disable="!isValid || savingPartial"
          :loading="savingSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Custom Confirmation Dialog -->
  <q-dialog v-model="showConfirmationDialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="text-left">
        <div class="text-h6 q-mb-md">Confirm Liquidation</div>
        <div v-if="parseFloat(totalReturnAmount) > 0" class="text-body1 text-negative q-mb-md">
          There's still an amount to return to appropriation: <strong>₱{{ totalReturnAmount }}</strong>
        </div>
        <div class="text-body1 q-mb-md">
          Are you sure you want to submit this liquidation? This action cannot be undone.
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" @click="showConfirmationDialog = false" />
        <q-btn flat label="Partial" color="warning" @click="handleConfirmationPartial" />
        <q-btn label="Submit" color="green" @click="handleConfirmationSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Reimbursement Dialog -->
  <q-dialog v-model="showReimbursementDialog" persistent>
    <q-card style="min-width: 1000px">
      <q-card-section class="q-pb-none">
        <div class="text-h6">Reimbursement for Disbursement #{{ store.currentLiquidation.dvNumber }}</div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Date Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Date:</q-item-label>
            <q-input
              filled
              outlined
              dense
              :model-value="store.currentLiquidation.date"
              :disable="true"
            />
          </div>

          <!-- DV Number Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">DV Number (Auto-generated):</q-item-label>
            <q-input
              filled
              outlined
              dense
              v-model="reimbursementDvNumber"
              :disable="true"
              hint="DV number will be automatically generated"
            />
          </div>

          <!-- DV Amount Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">REIMB Amount:</q-item-label>
            <q-input
              filled
              outlined
              dense
              :model-value="formatCurrency(reimbursementAmount)"
              prefix="₱"
              :disable="true"
            />
          </div>

          <!-- Bank Selection -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Bank:</q-item-label>
            <q-select
              filled
              outlined
              dense
              v-model="selectedReimbursementBank"
              :options="bankStore.availableBanks"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              :label="currentReimbursementBankLabel"
              @update:model-value="handleReimbursementBankSelection"
            />
          </div>

          <!-- Cheque Number Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Cheque Number:</q-item-label>
            <q-input
              filled
              outlined
              dense
              v-model="reimbursementChequeNumber"
              :disable="true"
            />
          </div>

          <!-- Payee Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Payee:</q-item-label>
            <q-input
              filled
              outlined
              dense
              :model-value="store.currentLiquidation.payee"
              :disable="true"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Expense Account Selection Section -->
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="text-subtitle1">
            <strong>Select Expense Account for Reimbursement:</strong>
          </div>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Add"
            flat
            @click="showExpenseAccountDialog = true"
          />
        </div>

        <!-- Selected Expense Accounts Table -->
        <q-table
          :rows="selectedReimbursementExpenseAccounts"
          :columns="selectedExpenseAccountColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 5 }"
          flat
          bordered
        >
          <template v-slot:body-cell-amount="props">
            <q-td :props="props" class="text-right">
              <div class="flex justify-end">
                <q-input
                  dense
                  v-model="props.row.amount"
                  prefix="₱"
                  inputmode="decimal"
                  pattern="\\d*\\.?\\d{0,2}"
                  @keypress="blockNonNumeric"
                  @paste.prevent="handlePasteNumeric"
                  style="width: 120px;"
                />
              </div>
            </q-td>
          </template>
        </q-table>

        <!-- Total Amount Display -->
        <div class="q-mt-md q-pa-md" style="background-color: #f5f5f5; border-radius: 8px;">
          <div class="text-body2">
            <strong>Total Selected: ₱{{ formatCurrency(totalSelectedExpenseAmount) }}</strong>
            <span class="text-grey-7 q-ml-md">of ₱{{ formatCurrency(reimbursementAmount) }} needed</span>
          </div>
          <div v-if="totalSelectedExpenseAmount > reimbursementAmount" class="text-negative text-caption q-mt-xs">
            Total exceeds reimbursement amount by ₱{{ formatCurrency(totalSelectedExpenseAmount - reimbursementAmount) }}
          </div>
        </div>
      </q-card-section>

      <!-- OR Details for Reimbursement -->
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="text-subtitle1">
            <strong>OR Details for Reimbursement:</strong>
          </div>
          <q-space />
        </div>

        <!-- Selected ORs Table -->
        <q-table
          :rows="selectedReimbursementOrs"
          :columns="selectedOrColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 5 }"
          flat
          bordered
        >
          <template v-slot:body-cell-dvAmount="props">
            <q-td :props="props" class="text-right">
              {{ formatCurrency(props.row.orAmount || 0) }}
            </q-td>
          </template>
          <template v-slot:body-cell-orAmount="props">
            <q-td :props="props" class="text-right">
              <div class="flex justify-end">
                <q-input
                  dense
                  v-model="props.row.reimbAmount"
                  prefix="₱"
                  inputmode="decimal"
                  pattern="\\d*\\.?\\d{0,2}"
                  @keypress="blockNonNumeric"
                  @paste.prevent="handlePasteNumeric"
                  style="width: 120px;"
                />
              </div>
            </q-td>
          </template>
        </q-table>

        <!-- Total OR Amount Display -->
        <div class="q-mt-md q-pa-md" style="background-color: #f5f5f5; border-radius: 8px;">
          <div class="text-body2">
            <strong>Total OR Amount: ₱{{ formatCurrency(totalSelectedOrAmount) }}</strong>
            <span class="text-grey-7 q-ml-md">of ₱{{ formatCurrency(reimbursementAmount) }} needed</span>
          </div>
          <div v-if="totalSelectedOrAmount !== reimbursementAmount" class="text-negative text-caption q-mt-xs">
            Total must exactly match reimbursement amount
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <q-btn flat label="Cancel" @click="showReimbursementDialog = false" />
        <q-btn
          label="Submit Reimbursement"
          color="orange"
          @click="handleSubmitReimbursement"
          :loading="savingReimbursement"
          :disable="!canSubmitReimbursement"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Expense Account Selection Dialog -->
  <q-dialog v-model="showExpenseAccountDialog" persistent>
    <q-card style="min-width: 800px; max-width: 90vw">
      <q-card-section class="q-pb-none">
        <div class="text-h6">Select Expense Account</div>
        <div class="text-caption text-grey-6 q-mt-sm">
          Select accounts to fund the reimbursement (₱{{ formatCurrency(reimbursementAmount) }} needed)
        </div>
      </q-card-section>

      <q-card-section>
        <q-input outlined dense placeholder="Search expense account..." v-model="store.expenseSearch"
          class="q-mb-sm" style="width: 300px">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-table
          :rows="validExpenseAccounts"
          :columns="store.expenseAccountColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 5 }"
          :loading="store.loading || store.expenseTypeLoading"
          :filter="store.expenseSearch"
          flat
          bordered
        >
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey-6 q-gutter-sm">
              <q-icon size="2em" name="inbox" />
              <span v-if="store.filteredExpenseAccounts.length === 0">
                No expense accounts available. Please ensure expense accounts are loaded.
              </span>
              <span v-else>
                No expense accounts with valid expense items available for reimbursement.
              </span>
            </div>
          </template>
          <template v-slot:body-cell-budget_source="props">
            <q-td :props="props">
              <q-badge :color="getBudgetSourceColor(props.row.budget_source)"
                :label="getBudgetSourceLabel(props.row.budget_source)" class="budget-source-badge" />
            </q-td>
          </template>
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <q-btn dense label="Select" color="primary" @click="addExpenseAccount(props.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" @click="showExpenseAccountDialog = false" />
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script setup>
import { computed, watch, ref, nextTick } from 'vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useBankStore } from 'stores/bankStore'
import { useAuthStore } from 'stores/auth'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

const $q = useQuasar()
const savingPartial = ref(false)
const savingSubmit = ref(false)
const savingReimbursement = ref(false)
const showConfirmationDialog = ref(false)
const showReimbursementDialog = ref(false)

// Reimbursement reactive variables
const selectedReimbursementBank = ref(null)
const reimbursementChequeNumber = ref('')
const reimbursementPayee = ref('')
const reimbursementDvNumber = ref('')
const selectedReimbursementExpenseAccounts = ref([])
const selectedReimbursementOrs = ref([])
const availableOrNumbers = ref([])
const showExpenseAccountDialog = ref(false)

const store = useDisbursementStore()
const bankStore = useBankStore()

// Initialize OR Details when dialog opens
function initializeOrDetails() {
  // If no OR details exist, add one empty row for new liquidation
  if (!store.currentLiquidation.orDetails || store.currentLiquidation.orDetails.length === 0) {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    const todayFormatted = `${dd}/${mm}/${yyyy}`

    store.currentLiquidation.orDetails = [{
      orNumber: '',
      orAmount: '',
      orDate: todayFormatted,
      orImage: null,
      orPhotoUrl: null,
      serverPhotoPath: null,
      remarks: '',
    }]
  }
  // Don't add additional rows automatically - let users add them as needed
}

// Watch dialog open, fetch OR Details
watch(
  () => store.dialogs.orDetails,
  (isOpen) => {
    if (isOpen) {
      // Only initialize if we don't already have OR details
      if (!store.currentLiquidation?.orDetails || store.currentLiquidation.orDetails.length === 0) {
        initializeOrDetails()
      }
    }
  },
)

// Watch remarks changes to ensure they're properly updated
watch(
  () => store.currentLiquidation?.remarks,
  (newRemarks) => {
    if (newRemarks !== undefined) {
      // Ensure remarks are properly set in the store
      store.currentLiquidation.remarks = newRemarks
    }
  },
  { deep: true }
)

// Watch reimbursement dialog open to initialize defaults
watch(
  () => showReimbursementDialog.value,
  async (isOpen) => {
    if (isOpen) {
      // Generate new DV number for reimbursement
      try {
        const response = await api.get('/api/barangay/generate-dvnumber', store.getAuthConfig())
        const newDVNumber = response.data.data.dv_number || ''
        reimbursementDvNumber.value = newDVNumber
      } catch (error) {
        console.error('Failed to generate new DV number:', error)
        reimbursementDvNumber.value = ''
      }

      // Initialize bank selection to match the original disbursement
      if (store.currentLiquidation?.bank_id) {
        selectedReimbursementBank.value = store.currentLiquidation.bank_id
        // Auto-generate cheque number for the selected bank
        await handleReimbursementBankSelection(store.currentLiquidation.bank_id)
      }

      // Load available OR numbers from the current disbursement
      if (store.currentLiquidation?.orDetails?.length > 0) {
        availableOrNumbers.value = store.currentLiquidation.orDetails.map(or => ({
          orNumber: or.orNumber,
          orDate: or.orDate
        }))
      }

      // Debug user type
      const authStore = useAuthStore()
      console.log('Current user is admin:', authStore.admin)
      console.log('Current user type:', authStore.user?.user_type)

      // Reset budget source filter to show all accounts
      store.selectedBudgetSource = 'all'

      // Clear expense search to show all accounts
      store.expenseSearch = ''

      // Use the special method for fetching expense accounts for reimbursements
      console.log('Loading expense accounts for reimbursement...')
      await store.fetchExpenseAccountsForReimbursement()
      console.log('Expense accounts loaded:', store.expenseAccounts.length)

      // If still empty, try the regular method as fallback
      if (store.expenseAccounts.length === 0) {
        console.log('Fallback: trying regular expense account loading...')
        await store.fetchExpenseAccounts()
        console.log('Expense accounts after fallback:', store.expenseAccounts.length)
      }

      // If still empty, try refreshing with balances
      if (store.expenseAccounts.length === 0) {
        console.log('Fallback: trying refresh with balances...')
        await store.refreshExpenseAccountsWithBalances()
        console.log('Expense accounts after balance refresh:', store.expenseAccounts.length)
      }

      // Populate selected ORs with all OR details
      selectedReimbursementOrs.value = store.currentLiquidation.orDetails.map(or => ({
        ...or,
        reimbAmount: ''
      }))
    } else {
      // Reset form when dialog closes
      resetReimbursementForm()
    }
  }
)

const totalActualExpense = computed(() => {
  if (!store.currentLiquidation?.orDetails) return '0.00'
  return store.currentLiquidation.orDetails
    .reduce((sum, or) => sum + (parseFloat(or.orAmount) || 0), 0)
    .toFixed(2)
})

const totalReturnAmount = computed(() => {
  if (!store.currentLiquidation?.dvAmount) return '0.00'
  const returnAmount = store.currentLiquidation.dvAmount - parseFloat(totalActualExpense.value)
  // Prevent negative return amounts - if over-liquidation occurs, show 0.00
  return Math.max(0, returnAmount).toFixed(2)
})

// Actual return amount for validation (can be negative)
const actualReturnAmount = computed(() => {
  if (!store.currentLiquidation?.dvAmount) return 0
  return store.currentLiquidation.dvAmount - parseFloat(totalActualExpense.value)
})

// Reimbursement amount calculation (OR amount - DV amount)
const reimbursementAmount = computed(() => {
  const excess = actualReturnAmount.value
  return excess < 0 ? Math.abs(excess) : 0
})

// Check if reimbursement is needed
const needsReimbursement = computed(() => {
  return reimbursementAmount.value > 0
})

const orDetailsCount = computed(() => {
  return store.currentLiquidation?.orDetails?.length || 0
})

// Reimbursement computed properties
const currentReimbursementBankLabel = computed(() => {
  if (selectedReimbursementBank.value) {
    const selectedBank = bankStore.banks.find(b => b.id === selectedReimbursementBank.value)
    return selectedBank ? selectedBank.name : 'Select Bank'
  }
  return 'Select Bank'
})

const selectedExpenseAccountColumns = computed(() => [
  {
    name: 'account',
    label: 'Expense Account',
    field: 'accountName',
    align: 'left',
    sortable: true,
  },
  {
    name: 'amount',
    label: 'Amount',
    field: 'amount',
    align: 'right',
    sortable: true,
  },
])

const totalSelectedExpenseAmount = computed(() => {
  return selectedReimbursementExpenseAccounts.value.reduce((sum, account) => sum + (parseFloat(account.amount) || 0), 0)
})

const selectedOrColumns = computed(() => [
  {
    name: 'orNumber',
    label: 'OR Number',
    field: 'orNumber',
    align: 'left',
    sortable: true,
  },
  {
    name: 'orDate',
    label: 'OR Date',
    field: 'orDate',
    align: 'left',
    sortable: true,
  },
  {
    name: 'dvAmount',
    label: 'OR Amount',
    field: 'orAmount',
    align: 'right',
    sortable: true,
    format: (val) => `₱${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    name: 'orAmount',
    label: 'REIMB Amount',
    field: 'reimbAmount',
    align: 'right',
    sortable: true,
  },
])

const totalSelectedOrAmount = computed(() => {
  return selectedReimbursementOrs.value.reduce((sum, or) => sum + (parseFloat(or.reimbAmount) || 0), 0)
})


const canSubmitReimbursement = computed(() => {
  return selectedReimbursementBank.value &&
         selectedReimbursementExpenseAccounts.value.length > 0 &&
         selectedReimbursementOrs.value.length > 0 &&
         totalSelectedExpenseAmount.value === reimbursementAmount.value
})

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

// Handle reimbursement bank selection for auto-generating cheque numbers
const handleReimbursementBankSelection = async (bankId) => {
  if (bankId) {
    try {
      // Use the same auth config as the store
      const authConfig = store.getAuthConfig()
      // Fetch available cheque for the selected bank
      const response = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, authConfig)
      const data = response.data.data || []
      reimbursementChequeNumber.value = data.cheque && data.cheque[0] ? data.cheque[0].cheque_number : ''
    } catch (error) {
      console.error('Error fetching cheque number for bank:', error)
      reimbursementChequeNumber.value = ''
    }
  } else {
    reimbursementChequeNumber.value = ''
  }
}





const calculateTotals = () => {
  // Computed properties will update automatically
}







// Unified OR detail image functions
const orImageInputs = ref([])

const setOrImageInputRef = (index) => {
  return (el) => {
    orImageInputs.value[index] = el
  }
}

const triggerOrFileInput = (index) => {
  nextTick(() => {
    const input = orImageInputs.value[index]
    if (input) {
      input.value = '' // allow re-uploading same file
      input.click()
    }
  })
}

const onOrImageChange = (e, index) => {
  const file = e.target.files && e.target.files[0]
  if (file) {
    // Store the file for later upload
    store.currentLiquidation.orDetails[index].orImage = file

    // Create local file path for preview
    const localPath = URL.createObjectURL(file)
    store.currentLiquidation.orDetails[index].orPhotoUrl = localPath

    $q.notify({
      type: 'positive',
      message: 'Photo selected successfully!',
      position: 'top',
    })
  }
}

const removeOrImage = (index) => {
  const prevUrl = store.currentLiquidation.orDetails[index].orPhotoUrl
  if (prevUrl && prevUrl.startsWith('blob:')) {
    URL.revokeObjectURL(prevUrl)
  }
  store.currentLiquidation.orDetails[index].orImage = null
  store.currentLiquidation.orDetails[index].orPhotoUrl = null
  store.currentLiquidation.orDetails[index].serverPhotoPath = null
  const input = orImageInputs.value[index]
  if (input) input.value = ''
}





// function saveOrDetails() {
//   // Example: pass orImageFile.value to store action for upload
//   // store.saveOrDetails({ ...fields, orImage: orImageFile.value })
//   store.dialogs.orDetails = false
// }

const isValid = computed(() => {
  // Validate all OR details since they're all editable now
  const allDetails = store.currentLiquidation.orDetails || []

  // If no details exist, return false
  if (allDetails.length === 0) return false

  // Validate all details
  return allDetails.every((or) =>
    or.orNumber && or.orAmount && or.orDate && or.orPhotoUrl
  )
})

// Filter expense accounts to only show those with valid expense_item_id
const validExpenseAccounts = computed(() => {
  // Comprehensive debug logging
  console.log('=== EXPENSE ACCOUNTS DEBUG ===')
  console.log('Store expenseAccounts length:', store.expenseAccounts?.length || 0)
  console.log('Store filteredExpenseAccounts length:', store.filteredExpenseAccounts?.length || 0)
  console.log('Store expenseSearch:', store.expenseSearch)
  console.log('Store selectedBudgetSource:', store.selectedBudgetSource)

  // Log first few accounts to see structure
  if (store.filteredExpenseAccounts?.length > 0) {
    console.log('First 3 filtered accounts:', store.filteredExpenseAccounts.slice(0, 3))
    console.log('Sample account structure:', {
      id: store.filteredExpenseAccounts[0]?.id,
      expense_item_id: store.filteredExpenseAccounts[0]?.expense_item_id,
      account: store.filteredExpenseAccounts[0]?.account,
      expenseItem: store.filteredExpenseAccounts[0]?.expenseItem
    })
  }

  // Check what we're filtering for
  const accountsWithExpenseItemId = store.filteredExpenseAccounts?.filter(account =>
    account.expense_item_id && account.expense_item_id !== null
  ) || []

  console.log('Accounts with expense_item_id:', accountsWithExpenseItemId.length)
  console.log('Sample valid account:', accountsWithExpenseItemId[0])

  // Also check for accounts without expense_item_id
  const accountsWithoutExpenseItemId = store.filteredExpenseAccounts?.filter(account =>
    !account.expense_item_id || account.expense_item_id === null
  ) || []

  console.log('Accounts without expense_item_id:', accountsWithoutExpenseItemId.length)
  if (accountsWithoutExpenseItemId.length > 0) {
    console.log('Sample invalid account:', accountsWithoutExpenseItemId[0])
  }

  console.log('=== END DEBUG ===')

  // Return all accounts for now to see what's available
  // We'll add the expense_item_id filter back once we confirm the data structure
  const allAccounts = store.filteredExpenseAccounts || []

  // If we have accounts, show them all for now
  if (allAccounts.length > 0) {
    console.log('Returning all accounts for selection:', allAccounts.length)
    return allAccounts
  }

  // If no accounts, return empty array
  console.log('No accounts available')
  return []
})

const canSubmit = computed(() => {
  if (!isValid.value) return false

  const returnAmount = actualReturnAmount.value

  // Cannot submit if return amount is negative (over-liquidation)
  if (returnAmount < 0) return false

  // Allow submit when form is valid and return amount is 0 or positive
  return returnAmount >= 0
})

const handleDateChange = (date, index) => {
  console.log('Date changed:', date, 'for index:', index)
  store.currentLiquidation.orDetails[index].orDate = date
  calculateTotals()
}



const handleRemarksChange = (newRemarks) => {
  // Ensure remarks are properly updated in the store
  store.currentLiquidation.remarks = newRemarks
  console.log('Remarks updated:', newRemarks)
}

const handlePartialLiquidation = async () => {
  savingPartial.value = true
  try {
    // First, upload all photos that haven't been uploaded yet (for all OR details)
    for (let i = 0; i < store.currentLiquidation.orDetails.length; i++) {
      const orDetail = store.currentLiquidation.orDetails[i]
      // Process all OR details since they're all editable now
      if (orDetail.orImage && !orDetail.serverPhotoPath) {
        try {
          const uploadResult = await store.uploadOrPhoto(orDetail.orImage)
          if (uploadResult.success) {
            store.currentLiquidation.orDetails[i].serverPhotoPath = uploadResult.path
            // Keep the local preview visible, don't replace it
            // The server path is stored separately for database
          } else {
            throw new Error(uploadResult.error)
          }
        } catch (error) {
          console.error('Error uploading photo:', error)
          $q.notify({
            type: 'negative',
            message: `Failed to upload photo for OR ${orDetail.orNumber || i + 1}: ${error.message}`,
            icon: 'error',
            position: 'top',
          })
          return
        }
      }
    }

    // Save as partial liquidation
    const result = await store.savePartialOrDetails()
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Partial liquidation saved successfully!',
        icon: 'check_circle',
        position: 'top',
      })
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Failed to save partial liquidation',
        icon: 'error',
        position: 'top',
      })
    }
  } catch (error) {
    console.error('Error saving partial liquidation:', error)
    $q.notify({
      type: 'negative',
      message: 'An error occurred while saving',
      icon: 'error',
      position: 'top',
    })
  } finally {
    savingPartial.value = false
  }
}

const showSubmitConfirmation = () => {
  console.log('Showing confirmation dialog...')
  showConfirmationDialog.value = true
}

const handleConfirmationSubmit = () => {
  showConfirmationDialog.value = false
  console.log('User confirmed liquidation, proceeding...')
  handleSaveOrDetails()
}

const handleConfirmationPartial = () => {
  showConfirmationDialog.value = false
  console.log('User chose partial liquidation...')
  handlePartialLiquidation()
}

const handleReimbursement = () => {
  console.log('Reimbursement triggered - showing reimbursement modal...')
  showReimbursementDialog.value = true
}

// Reimbursement functions
const addExpenseAccount = (account) => {
  // Check if account is already selected
  const existing = selectedReimbursementExpenseAccounts.value.find(acc => acc.id === account.id)
  if (!existing) {
    selectedReimbursementExpenseAccounts.value.push({
      ...account,
      accountName: `${account.account}${account.expenseType ? ` > ${account.expenseType}` : ''}${account.expenseItem ? ` > ${account.expenseItem}` : ''}`,
      amount: ''
    })
  }
  showExpenseAccountDialog.value = false
}



const handleSubmitReimbursement = async () => {
  savingReimbursement.value = true
  try {
    // Validate required fields before proceeding
    if (!selectedReimbursementBank.value) {
      $q.notify({
        type: 'negative',
        message: 'Please select a bank for reimbursement',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    // DV number is now auto-generated, so we don't need to validate it
    // if (!reimbursementDvNumber.value || reimbursementDvNumber.value.trim() === '') {
    //   $q.notify({
    //     type: 'negative',
    //     message: 'Please enter a DV number for reimbursement',
    //     icon: 'warning',
    //     position: 'top',
    //   })
    //   return
    // }

    if (!reimbursementChequeNumber.value || reimbursementChequeNumber.value.trim() === '') {
      $q.notify({
        type: 'negative',
        message: 'Please enter a cheque number for reimbursement',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    if (selectedReimbursementExpenseAccounts.value.length === 0) {
      $q.notify({
        type: 'negative',
        message: 'Please select at least one expense account for reimbursement',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    if (selectedReimbursementOrs.value.length === 0) {
      $q.notify({
        type: 'negative',
        message: 'Please select at least one OR for reimbursement',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    // Validate that all selected expense accounts have valid expense_item_id
    // Temporarily disabled for testing
    // const invalidAccounts = selectedReimbursementExpenseAccounts.value.filter(acc => !acc.expense_item_id)
    // if (invalidAccounts.length > 0) {
    //   $q.notify({
    //     type: 'negative',
    //     message: 'All selected expense accounts must have a valid expense item. Please select different accounts.',
    //     icon: 'warning',
    //     position: 'top',
    //   })
    //   return
    // }

    // Validate that total expense amounts match reimbursement amount
    const totalExpenseAmount = selectedReimbursementExpenseAccounts.value.reduce((sum, acc) => sum + (acc.amount || 0), 0)
    if (Math.abs(totalExpenseAmount - reimbursementAmount.value) > 0.01) {
      $q.notify({
        type: 'negative',
        message: `Total expense amount (₱${totalExpenseAmount.toFixed(2)}) must match reimbursement amount (₱${reimbursementAmount.value.toFixed(2)})`,
        icon: 'warning',
        position: 'top',
      })
      return
    }

    // Validate that total OR amounts match reimbursement amount
    const totalOrAmount = selectedReimbursementOrs.value.reduce((sum, or) => sum + (or.orAmount || 0), 0)
    if (Math.abs(totalOrAmount - reimbursementAmount.value) > 0.01) {
      $q.notify({
        type: 'negative',
        message: `Total OR amount (₱${totalOrAmount.toFixed(2)}) must match reimbursement amount (₱${reimbursementAmount.value.toFixed(2)})`,
        icon: 'warning',
        position: 'top',
      })
      return
    }

    // Prepare reimbursement data - use the first expense account as the primary account
    const primaryExpenseAccount = selectedReimbursementExpenseAccounts.value[0]
    const primaryOr = selectedReimbursementOrs.value[0]
    console.error('-==============================================',primaryOr)

    const reimbursementData = {
      ref_dv_number: store.currentLiquidation.dvNumber,
      dv_amount: reimbursementAmount.value,
      bank_id: selectedReimbursementBank.value,
      dvNumber: reimbursementDvNumber.value,
      cheque_number: reimbursementChequeNumber.value,
      payee: reimbursementPayee.value,
      expense_account: {
        id: primaryExpenseAccount.id,
        expense_class_id: primaryExpenseAccount.expense_class_id,
        expense_type_id: primaryExpenseAccount.expense_type_id,
        expense_item_id: primaryExpenseAccount.expense_item_id,
      },
      or_number: primaryOr.orNumber,
      or_amount: totalSelectedOrAmount.value,
      or_date: primaryOr.orDate,
    }

    console.log('Reimbursement data being submitted:', JSON.stringify(reimbursementData, null, 2));

    // Call store method to submit reimbursement
    const result = await store.submitReimbursement(reimbursementData)

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Reimbursement submitted successfully!',
        icon: 'check_circle',
        position: 'top',
      })
      showReimbursementDialog.value = false
      // Close the parent Liquidation Details dialog as well
      store.closeDialog('orDetails')
      // Reset reimbursement form
      resetReimbursementForm()
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Failed to submit reimbursement',
        icon: 'error',
        position: 'top',
      })
    }
  } catch (error) {
    console.error('Error submitting reimbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'An error occurred while submitting reimbursement',
      icon: 'error',
      position: 'top',
    })
  } finally {
    savingReimbursement.value = false
  }
}

const resetReimbursementForm = () => {
  selectedReimbursementBank.value = null
  reimbursementChequeNumber.value = ''
  reimbursementPayee.value = ''
  reimbursementDvNumber.value = ''
  selectedReimbursementExpenseAccounts.value = []
  selectedReimbursementOrs.value = []
}

const handleSaveOrDetails = async () => {
  console.log('handleSaveOrDetails called - starting liquidation process...')
  savingSubmit.value = true
  try {
    // First, upload all photos that haven't been uploaded yet (for all OR details)
    for (let i = 0; i < store.currentLiquidation.orDetails.length; i++) {
      const orDetail = store.currentLiquidation.orDetails[i]
      // Process all OR details since they're all editable now
      if (orDetail.orImage && !orDetail.serverPhotoPath) {
        try {
          const uploadResult = await store.uploadOrPhoto(orDetail.orImage)
          if (uploadResult.success) {
            store.currentLiquidation.orDetails[i].serverPhotoPath = uploadResult.path
            // Keep the local preview visible, don't replace it
            // The server path is stored separately for database
          } else {
            throw new Error(uploadResult.error)
          }
        } catch (error) {
          console.error('Error uploading photo:', error)
          $q.notify({
            type: 'negative',
            message: `Failed to upload photo for OR ${orDetail.orNumber || i + 1}: ${error.message}`,
            icon: 'error',
            position: 'top',
          })
          return
        }
      }
    }

    // Now save the OR details
    const result = await store.saveOrDetails()
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'OR Details saved successfully!',
        icon: 'check_circle',
        position: 'top',
      })
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Failed to save OR details',
        icon: 'error',
        position: 'top',
      })
    }
  } catch (error) {
    console.error('Error saving OR details:', error)
    $q.notify({
      type: 'negative',
      message: 'An error occurred while saving',
      icon: 'error',
      position: 'top',
    })
  } finally {
    savingSubmit.value = false
  }
}

// Formatting utilities for currency inputs
const formatCurrency = (value) => {
  const num = Number(String(value).replace(/[,\s]/g, '')) || 0
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const blockNonNumeric = (event) => {
  const key = event.key
  const isControl = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(key)
  if (isControl) return
  const isDigit = /\d/.test(key)
  const isDot = key === '.'
  if (isDot && event.target?.value?.includes?.('.')) {
    event.preventDefault()
    return
  }
  if (!isDigit && !isDot) {
    event.preventDefault()
  }
}

const handlePasteNumeric = (event) => {
  const text = (event.clipboardData || window.clipboardData).getData('text')
  let clean = String(text).replace(/[^\d.]/g, '')
  const parts = clean.split('.')
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length >= 2) {
    parts[1] = parts[1].slice(0, 2)
    clean = parts[0] + '.' + parts[1]
  }
  const input = event.target
  const start = input.selectionStart
  const end = input.selectionEnd
  const current = input.value
  input.value = current.slice(0, start) + clean + current.slice(end)
  const e = new Event('input', { bubbles: true })
  input.dispatchEvent(e)
}
</script>

<style scoped>
/* Style for readonly inputs */
.q-input[readonly] {
  background-color: #f5f5f5;
}

/* Custom actions styling */
.custom-actions {
  padding: 16px;
}

.modal-cancel-btn {
  color: #666;
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .q-card {
    min-width: 95vw !important;
  }
}
</style>
