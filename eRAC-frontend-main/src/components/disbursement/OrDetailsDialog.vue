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
          <div class="col-md-4 col-sm-6 q-mb-md">
            <div class="text-caption text-grey">Date</div>
            <div class="text-body1 text-weight-medium">
              {{ store.currentLiquidation.date }}
            </div>
          </div>

          <!-- DV Number Field -->
          <div class="col-md-4 col-sm-6 q-mb-md">
            <div class="text-caption text-grey">DV Number</div>
            <div class="text-body1 text-weight-medium">
              {{ store.currentLiquidation.dvNumber }}
            </div>
          </div>

          <!-- DV Amount Field -->
          <div class="col-md-4 col-sm-6 q-mb-md">
            <div class="text-caption text-grey">DV Amount</div>
            <div class="text-body1 text-weight-medium">
              ₱ {{ formatCurrency(store.currentLiquidation.dvAmount || 0) }}
            </div>
          </div>

          <!-- Actual Expense Field -->
          <div class="col-md-4 col-sm-6"> <q-item-label class="q-mb-xs">Actual Expense:</q-item-label> <q-input filled
              outlined dense :model-value="formatCurrency(totalActualExpense)" prefix="₱" :readonly="true" /> </div>
          <!-- Amount to Return Field -->
          <div class="col-md-4 col-sm-6"> <q-item-label class="q-mb-xs">Amount to Return to
              Appropriation:</q-item-label> <q-input filled outlined dense
              :model-value="formatCurrency(totalReturnAmount)" prefix="₱" :readonly="true"
              :color="actualReturnAmount < 0 ? 'negative' : undefined" /> </div> <!-- Remarks Field -->
          <div class="col-md-4 col-sm-12"> <q-item-label class="q-mb-xs">Remarks:</q-item-label> <q-input filled
              outlined dense v-model="store.currentLiquidation.remarks" placeholder="Enter remarks" /> </div>

        </div>
      </q-card-section>


      <!-- Expense Account Details Section -->
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="text-subtitle1">
            <strong>Expense Accounts:</strong>
          </div>
        </div>

        <!-- Expense Account Details Table -->
        <q-table :rows="expenseAccountDetails" :columns="expenseAccountColumns" row-key="id"
          :pagination="{ rowsPerPage: 5 }" flat bordered>
          <template v-slot:body-cell-amount="props">
            <q-td :props="props" class="text-right">
              ₱{{ formatCurrency(props.row.amount) }}
            </q-td>
          </template>
        </q-table>
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
          <q-btn color="green" icon="add" label="Add OR" flat @click="addOrDetail" />
        </div>

        <!-- OR Details (All Editable) -->
        <div v-if="store.currentLiquidation?.orDetails?.length > 0" class="q-mb-lg">
          <div v-for="(orDetail, index) in store.currentLiquidation.orDetails" :key="orDetail.id || `new-or-${index}`"
            class="q-mb-md">
            <div class="row items-center q-col-gutter-md">
              <!-- Remove Button -->
              <div class="col-auto" v-if="store.currentLiquidation.orDetails.length > 1">
                <q-btn flat round dense icon="remove" color="red" @click="removeOrDetail(index)"
                  title="Remove this OR" />
              </div>

              <div class="col row q-col-gutter-md no-wrap">
                <!-- OR Date -->
                <div class="col">
                  <div class="text-bold q-mb-xs">OR Date:</div>
                  <q-input filled unelaveted outlined v-model="orDetail.orDate" placeholder="Select Date">
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="orDetail.orDate" mask="DD/MM/YYYY"
                            @update:model-value="(val) => handleDateChange(val, index)" />
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>

                <!-- OR Number -->
                <div class="col">
                  <div class="text-bold q-mb-xs">OR Number:</div>
                  <q-input filled unelaveted outlined v-model="orDetail.orNumber" placeholder="OR Number" />
                </div>

                <!-- OR Amount -->
                <div class="col">
                  <div class="text-bold q-mb-xs">OR Amount:</div>
                  <q-input filled unelaveted outlined :model-value="formatInputValue(orDetail.orAmount)"
                    @update:model-value="(val) => handleOrAmountInput(orDetail, val)"
                    @blur="(e) => handleOrAmountBlur(orDetail, e.target.value)" prefix="₱" placeholder="0.00"
                    inputmode="decimal" pattern="\\d*\\.?\\d{0,2}" @keypress="blockNonNumeric"
                    @paste.prevent="handlePasteNumeric" @input="calculateTotals" />
                  <!-- Over-liquidation warning -->
                  <div v-if="actualReturnAmount < 0" class="text-negative q-mt-xs text-caption">
                    Exceeds DV amount by ₱{{ formatCurrency(Math.abs(actualReturnAmount)) }}
                  </div>
                </div>

                <!-- OR Image -->
                <div class="col">
                  <div class="text-bold q-mb-xs" style="display: flex; align-items: center">
                    OR Image:
                    <q-btn v-if="orDetail.orPhotoUrl" flat dense round icon="delete" color="red"
                      @click="removeOrImage(index)" style="margin-left: 8px" />
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px">
                    <q-btn v-if="!orDetail.orPhotoUrl" flat dense color="primary" icon="upload" label="Upload"
                      @click="triggerOrFileInput(index)" style="min-width: 100px" />
                    <q-img v-if="orDetail.orPhotoUrl" :src="orDetail.orPhotoUrl" style="
                        max-width: 100%;
                        max-height: 100px;
                        border-radius: 4px;
                        border: 1px solid #eee;
                      " />
                  </div>
                  <input :ref="setOrImageInputRef(index)" type="file" accept=".jpg,.jpeg,.png" style="display: none"
                    @change="(e) => onOrImageChange(e, index)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <q-btn flat label="Cancel" class="modal-cancel-btn" @click="store.closeDialog('orDetails')" />
        <q-btn flat label="Partial" color="warning" @click="handlePartialLiquidation"
          :disable="!isValid || !canSubmit || savingSubmit" :loading="savingPartial" />
        <q-btn :label="needsReimbursement ? 'Reimbursement' : 'Submit'" :color="needsReimbursement ? 'orange' : 'green'"
          @click="needsReimbursement ? handleReimbursement() : showSubmitConfirmation()"
          :disable="!isValid || savingPartial || (needsReimbursement && reimbursementAmount <= 0)" :loading="savingSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Custom Confirmation Dialog -->
  <q-dialog v-model="showConfirmationDialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="text-left">
        <div class="text-h6 q-mb-md">Confirm Liquidation</div>
        <div v-if="parseFloat(totalReturnAmount) > 0" class="text-body1 text-negative q-mb-md">
          There's still an amount to return to appropriation:
          <strong>₱{{ totalReturnAmount }}</strong>
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
        <div class="q-mb-md text-left">
          <div class="text-h5 text-weight-bold">
            Reimbursement Transaction
          </div>
          <div class="text-subtitle2 text-grey-7">
            Reference: Disbursement No. {{ store.currentLiquidation.dvNumber }}
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Date Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Date:</q-item-label>
            <q-input filled outlined dense :model-value="store.currentLiquidation.date" :disable="true" />
          </div>

          <!-- DV Number Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Reimburse DV Number:</q-item-label>
            <q-input filled outlined dense v-model="reimbursementDvNumber" :disable="true" />
          </div>

          <!-- DV Amount Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Reimburse Amount:</q-item-label>
            <q-input filled outlined dense :model-value="formatCurrency(reimbursementAmount)" prefix="₱"
              :disable="true" />
          </div>

          <!-- Bank Selection -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Bank:</q-item-label>
            <q-select filled outlined dense v-model="selectedReimbursementBank" :options="bankStore.availableBanks"
              option-label="name" option-value="id" emit-value map-options :label="currentReimbursementBankLabel"
              @update:model-value="handleReimbursementBankSelection" />
          </div>

          <!-- Cheque Number Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Cheque Number:</q-item-label>
            <q-input filled outlined dense v-model="reimbursementChequeNumber" :disable="true" />
          </div>

          <!-- Payee Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Payee:</q-item-label>
            <q-input filled outlined dense :model-value="store.currentLiquidation.payee" :disable="true" />
          </div>
        </div>
      </q-card-section>

      <!-- Expense Account Selection Section -->
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="text-subtitle1">
            <strong>Expense Account for Reimbursement:</strong>
          </div>
          <q-space />
          <q-btn 
            color="primary" 
            icon="add" 
            label="Change Account" 
            flat 
            @click="showExpenseAccountDialog = true"
            v-if="selectedReimbursementExpenseAccounts.length > 0"
          />
          <q-btn 
            color="primary" 
            icon="add" 
            label="Add" 
            flat 
            @click="showExpenseAccountDialog = true"
            v-else
          />
        </div>
        
        <!-- Auto-selection notification -->
        <div v-if="selectedReimbursementExpenseAccounts.length > 0" class="q-mb-md">
          <q-banner class="bg-blue-1 text-blue-8" rounded>
            <template v-slot:avatar>
              <q-icon name="auto_awesome" color="blue" />
            </template>
            <div class="text-body2">
              <strong>Account automatically selected</strong> from the original disbursement
            </div>
          </q-banner>
        </div>

        <!-- Selected Expense Accounts Table -->
        <q-table :rows="selectedReimbursementExpenseAccounts" :columns="selectedExpenseAccountColumns" row-key="id"
          :pagination="{ rowsPerPage: 0 }" flat bordered>
          <template v-slot:body-cell-account="props">
            <q-td :props="props">
              <div class="expense-account-hierarchy">
                {{ props.row.accountName }}
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-amount="props">
            <q-td :props="props" class="text-right">
              <div class="flex justify-end">
                <q-input dense v-model="props.row.amount" prefix="₱" inputmode="decimal" pattern="\\d*\\.?\\d{0,2}"
                  @keypress="blockNonNumeric" @paste.prevent="handlePasteNumeric" style="width: 120px" />
              </div>
            </q-td>
          </template>
        </q-table>

        <!-- Total Amount Display -->
        <div class="q-mt-md q-pa-md" style="background-color: #f5f5f5; border-radius: 8px">
          <div class="text-body2">
            <strong>Total Selected: ₱{{ formatCurrency(totalSelectedExpenseAmount) }}</strong>
            <span class="text-grey-7 q-ml-md">of ₱{{ formatCurrency(reimbursementAmount) }} needed</span>
          </div>
          <div v-if="totalSelectedExpenseAmount > reimbursementAmount" class="text-negative text-caption q-mt-xs">
            Total exceeds reimburse amount by ₱{{
              formatCurrency(totalSelectedExpenseAmount - reimbursementAmount)
            }}
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
        <q-table :rows="selectedReimbursementOrs" :columns="selectedOrColumns" row-key="id"
          :pagination="{ rowsPerPage: 0 }" flat bordered>
          <template v-slot:body-cell-dvAmount="props">
            <q-td :props="props" class="text-right">
              {{ formatCurrency(props.row.orAmount || 0) }}
            </q-td>
          </template>
          <template v-slot:body-cell-orAmount="props">
            <q-td :props="props" class="text-right">
              <div class="flex justify-end">
                <q-input dense v-model="props.row.reimbAmount" prefix="₱" inputmode="decimal" pattern="\\d*\\.?\\d{0,2}"
                  @keypress="blockNonNumeric" @paste.prevent="handlePasteNumeric" style="width: 120px" />
              </div>
            </q-td>
          </template>
        </q-table>

        <!-- Total OR Amount Display -->
        <div class="q-mt-md q-pa-md" style="background-color: #f5f5f5; border-radius: 8px">
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
        <q-btn label="Submit Reimbursement" color="orange" @click="handleSubmitReimbursement"
          :loading="savingReimbursement" :disable="!canSubmitReimbursement" />
      </q-card-actions>
    </q-card>
  </q-dialog>


  <!-- Expense Account Selection Dialog -->
  <q-dialog v-model="showExpenseAccountDialog" persistent>
    <q-card style="min-width: 800px; max-width: 90vw">
      <q-card-section class="q-pb-none">
        <div class="text-h6">Select Expense Account</div>
        <div class="text-caption text-grey-6 q-mt-sm">
          Select accounts to fund the reimbursement (₱{{
            formatCurrency(reimbursementAmount)
          }}
          needed)
        </div>
      </q-card-section>

      <q-card-section>
        <q-input outlined dense placeholder="Search expense account..." v-model="store.expenseSearch" class="q-mb-sm"
          style="width: 300px">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-table :rows="validExpenseAccounts" :columns="store.expenseAccountColumns" row-key="id"
          :pagination="{ rowsPerPage: 5 }" :loading="store.loading || store.expenseTypeLoading"
          :filter="store.expenseSearch" flat bordered>
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

// Debug watcher for selectedReimbursementExpenseAccounts
watch(selectedReimbursementExpenseAccounts, (newVal, oldVal) => {
  console.log('=== selectedReimbursementExpenseAccounts CHANGED ===')
  console.log('Old value:', oldVal)
  console.log('New value:', newVal)
  console.log('New length:', newVal?.length || 0)
}, { deep: true })


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

    store.currentLiquidation.orDetails = [
      {
        orNumber: '',
        orAmount: '',
        orDate: todayFormatted,
        orImage: null,
        orPhotoUrl: null,
        serverPhotoPath: null,
        remarks: '',
      },
    ]
  }
  // Don't add additional rows automatically - let users add them as needed
}

// Watch dialog open, fetch OR Details and expense data
watch(
  () => store.dialogs.orDetails,
  async (isOpen) => {
    if (isOpen) {
      // Fetch full disbursement data including expenses if not already loaded
      if (store.currentLiquidation?.id && (!store.currentLiquidation.expenses || store.currentLiquidation.expenses.length === 0)) {
        try {
          console.log('Fetching full disbursement data for ID:', store.currentLiquidation.id)
          const fullDisbursementData = await store.fetchDisbursementForView(store.currentLiquidation.id)
          if (fullDisbursementData) {
            // Update currentLiquidation with the full data including expenses
            store.currentLiquidation = { ...store.currentLiquidation, ...fullDisbursementData }
            console.log('Updated currentLiquidation with expenses:', store.currentLiquidation.expenses)
          }
        } catch (error) {
          console.error('Error fetching full disbursement data:', error)
        }
      }
      
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
  { deep: true },
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
        availableOrNumbers.value = store.currentLiquidation.orDetails.map((or) => ({
          orNumber: or.orNumber,
          orDate: or.orDate,
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

      // AUTO-SELECT ACCOUNT: Automatically select the same account from the original disbursement
      // Add a small delay to ensure expense accounts are fully loaded
      console.log('=== SCHEDULING AUTO-SELECTION ===')
      console.log('Current time:', new Date().toISOString())
      setTimeout(async () => {
        console.log('=== AUTO-SELECTION TIMEOUT TRIGGERED ===')
        console.log('Current time:', new Date().toISOString())
        await autoSelectOriginalAccount()
      }, 500)

      // Populate selected ORs with all OR details
      selectedReimbursementOrs.value = store.currentLiquidation.orDetails.map((or) => ({
        ...or,
        reimbAmount: '',
      }))
    } else {
      // Reset form when dialog closes - add a small delay to avoid race conditions
      setTimeout(() => {
        resetReimbursementForm()
      }, 100)
    }
  },
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
  // Only allow reimbursement if there's actual excess (over-liquidation)
  // If liquidated amount equals disbursed amount, no reimbursement needed
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
    const selectedBank = bankStore.banks.find((b) => b.id === selectedReimbursementBank.value)
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

const expenseAccountColumns = computed(() => [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left',
    sortable: true,
  },
  {
    name: 'account',
    label: 'Expense Class',
    field: 'account',
    align: 'left',
    sortable: true,
  },
  {
    name: 'expenseType',
    label: 'Expense Type',
    field: 'expenseType',
    align: 'left',
    sortable: true,
  },
  {
    name: 'expenseItem',
    label: 'Expense Item',
    field: 'expenseItem',
    align: 'left',
    sortable: true,
  },
  {
    name: 'expenseSubItem',
    label: 'Sub Item',
    field: 'expenseSubItem',
    align: 'left',
    sortable: true,
    format: (val) => val || '-',
  },
  {
    name: 'amount',
    label: 'Amount',
    field: 'amount',
    align: 'right',
    sortable: true,
  },
  {
    name: 'particular',
    label: 'Particular',
    field: 'particular',
    align: 'left',
    sortable: true,
  },
])

const totalSelectedExpenseAmount = computed(() => {
  return selectedReimbursementExpenseAccounts.value.reduce(
    (sum, account) => sum + (parseFloat(account.amount) || 0),
    0,
  )
})

const expenseAccountDetails = computed(() => {
  // Debug logging to see what data is available
  console.log('=== EXPENSE ACCOUNT DEBUG ===')
  console.log('currentLiquidation:', store.currentLiquidation)
  console.log('currentLiquidation.expenses:', store.currentLiquidation?.expenses)
  console.log('currentLiquidation keys:', store.currentLiquidation ? Object.keys(store.currentLiquidation) : 'No currentLiquidation')
  
  // Get expense details from the current liquidation
  if (!store.currentLiquidation?.expenses || store.currentLiquidation.expenses.length === 0) {
    console.log('No expenses found in currentLiquidation')
    return []
  }

  const mappedExpenses = store.currentLiquidation.expenses.map((expense, index) => ({
    id: expense.id || index + 1,
    accountName: expense.accountName || expense.account_name || 'N/A',
    amount: expense.amount || 0,
    particular: expense.particular || 'N/A',
    // Add fields for multi-column display
    account: expense.account || expense.expense_class_name || '',
    expenseType: expense.expenseType || expense.expense_type_name || '',
    expenseItem: expense.expenseItem || expense.expense_item_name || '',
    expenseSubItem: expense.expenseSubItem || expense.expense_sub_item_name || '',
  }))
  
  console.log('Mapped expenses:', mappedExpenses)
  console.log('=== END DEBUG ===')
  
  return mappedExpenses
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
    format: (val) =>
      `₱${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
  return selectedReimbursementOrs.value.reduce(
    (sum, or) => sum + (parseFloat(or.reimbAmount) || 0),
    0,
  )
})

const canSubmitReimbursement = computed(() => {
  return (
    selectedReimbursementBank.value &&
    selectedReimbursementExpenseAccounts.value.length > 0 &&
    selectedReimbursementOrs.value.length > 0 &&
    totalSelectedExpenseAmount.value === reimbursementAmount.value
  )
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
      reimbursementChequeNumber.value =
        data.cheque && data.cheque[0] ? data.cheque[0].cheque_number : ''
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

const addOrDetail = () => {
  if (!store.currentLiquidation.orDetails) {
    store.currentLiquidation.orDetails = []
  }

  // Get today's date in DD/MM/YYYY format
  const today = new Date()
  const dd = String(today.getDate()).padStart(2, '0')
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const yyyy = today.getFullYear()
  const todayFormatted = `${dd}/${mm}/${yyyy}`

  store.currentLiquidation.orDetails.push({
    orNumber: '',
    orAmount: '',
    orDate: todayFormatted,
    orImage: null,
    orPhotoUrl: null,
    serverPhotoPath: null,
    remarks: '',
  })
}

// Remove OR detail (unified function)
const removeOrDetail = async (index) => {
  console.log('Removing OR detail at index:', index)
  console.log(
    'Current OR details before removal:',
    JSON.parse(JSON.stringify(store.currentLiquidation.orDetails)),
  )

  if (store.currentLiquidation.orDetails && store.currentLiquidation.orDetails.length > 0) {
    // Ensure we don't go below minimum rows
    if (store.currentLiquidation.orDetails.length <= 1) {
      $q.notify({
        type: 'warning',
        message: 'Cannot remove the last OR detail. At least one row is required.',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    const orDetail = store.currentLiquidation.orDetails[index]
    console.log('Removing OR detail:', orDetail)

    // If it's an existing OR detail (has ID), delete it from backend first
    if (orDetail.id) {
      try {
        const result = await store.deleteOrDetail(store.currentLiquidation.id, orDetail.id)
        if (result.success) {
          // Find the correct index again in case the array changed
          const currentIndex = store.currentLiquidation.orDetails.findIndex(
            (detail) => detail.id === orDetail.id,
          )
          if (currentIndex !== -1) {
            store.currentLiquidation.orDetails.splice(currentIndex, 1)
            console.log('OR detail removed from backend and local array at index:', currentIndex)
          } else {
            console.warn('OR detail not found in array after backend deletion')
          }
          $q.notify({
            type: 'positive',
            message: 'OR Detail removed successfully!',
            icon: 'check_circle',
            position: 'top',
          })
        } else {
          $q.notify({
            type: 'negative',
            message: result.message || 'Failed to remove OR Detail',
            icon: 'error',
            position: 'top',
          })
        }
      } catch (error) {
        console.error('Error removing OR detail:', error)
        $q.notify({
          type: 'negative',
          message: 'An error occurred while removing OR Detail',
          icon: 'error',
          position: 'top',
        })
      }
    } else {
      // If it's a new OR detail (no ID), find it by comparing the object reference
      const currentIndex = store.currentLiquidation.orDetails.findIndex(
        (detail) =>
          detail === orDetail ||
          (detail.orNumber === orDetail.orNumber &&
            detail.orAmount === orDetail.orAmount &&
            detail.orDate === orDetail.orDate),
      )
      if (currentIndex !== -1) {
        store.currentLiquidation.orDetails.splice(currentIndex, 1)
        console.log('New OR detail removed from local array at index:', currentIndex)
      } else {
        console.warn('New OR detail not found in array')
      }
    }

    console.log(
      'OR details after removal:',
      JSON.parse(JSON.stringify(store.currentLiquidation.orDetails)),
    )
  }
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
  return allDetails.every((or) => or.orNumber && or.orAmount && or.orDate && or.orPhotoUrl)
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
      expenseItem: store.filteredExpenseAccounts[0]?.expenseItem,
    })
  }

  // Check what we're filtering for
  const accountsWithExpenseItemId =
    store.filteredExpenseAccounts?.filter(
      (account) => account.expense_item_id && account.expense_item_id !== null,
    ) || []

  console.log('Accounts with expense_item_id:', accountsWithExpenseItemId.length)
  console.log('Sample valid account:', accountsWithExpenseItemId[0])

  // Also check for accounts without expense_item_id
  const accountsWithoutExpenseItemId =
    store.filteredExpenseAccounts?.filter(
      (account) => !account.expense_item_id || account.expense_item_id === null,
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

  // Cannot submit if return amount is negative (over-liquidation) without sufficient budget
  if (returnAmount < 0) {
    // Check if there's sufficient budget for reimbursement
    const reimbursementNeeded = Math.abs(returnAmount)
    // For now, we'll allow over-liquidation but show a warning
    // The backend will handle budget validation
    return true
  }

  // Allow submit when form is valid and return amount is 0 or positive
  return returnAmount >= 0
})

const handleDateChange = (date, index) => {
  console.log('Date changed:', date, 'for index:', index)
  store.currentLiquidation.orDetails[index].orDate = date
  calculateTotals()
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
  
  // Check if reimbursement is actually needed
  if (reimbursementAmount.value <= 0) {
    $q.notify({
      type: 'warning',
      message: 'No reimbursement needed. The liquidated amount does not exceed the disbursed amount.',
      icon: 'warning',
      position: 'top',
      timeout: 3000,
    })
    return
  }
  
  showReimbursementDialog.value = true
}

// Reimbursement functions
const addExpenseAccount = (account) => {
  // Check if account is already selected
  const existing = selectedReimbursementExpenseAccounts.value.find((acc) => acc.id === account.id)
  if (!existing) {
    selectedReimbursementExpenseAccounts.value.push({
      ...account,
      accountName: `${account.account}${account.expenseType ? ` > ${account.expenseType}` : ''}${account.expenseItem ? ` > ${account.expenseItem}` : ''}`,
      amount: '',
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
    const totalExpenseAmount = selectedReimbursementExpenseAccounts.value.reduce(
      (sum, acc) => sum + (parseFloat(acc.amount) || 0),
      0,
    )
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
    const totalOrAmount = selectedReimbursementOrs.value.reduce((sum, or) => sum + (parseFloat(or.reimbAmount) || 0), 0)
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

    const reimbursementData = {
      ref_dv_number: store.currentLiquidation.dvNumber,
      dv_amount: reimbursementAmount.value,
      bank_id: selectedReimbursementBank.value,
      dvNumber: reimbursementDvNumber.value,
      cheque_number: reimbursementChequeNumber.value,
      payee: store.currentLiquidation.payee, // Use original disbursement payee
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

    console.log('Reimbursement data being submitted:', JSON.stringify(reimbursementData, null, 2))

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
      // Handle specific budget validation error
      if (result.error === 'Insufficient budget' || result.message?.includes('No more budget')) {
        $q.notify({
          type: 'negative',
          message: 'No more budget for this account. Please commit again.',
          icon: 'warning',
          position: 'top',
          timeout: 5000,
        })
      } else {
        $q.notify({
          type: 'negative',
          message: result.error || result.message || 'Failed to submit reimbursement',
          icon: 'error',
          position: 'top',
        })
      }
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
  console.log('=== RESETTING REIMBURSEMENT FORM ===')
  console.log('Current selectedReimbursementExpenseAccounts before reset:', selectedReimbursementExpenseAccounts.value)
  
  selectedReimbursementBank.value = null
  reimbursementChequeNumber.value = ''
  reimbursementPayee.value = ''
  reimbursementDvNumber.value = ''
  selectedReimbursementExpenseAccounts.value = []
  selectedReimbursementOrs.value = []
  
  console.log('Form reset completed')
}

// Auto-select the same account from the original disbursement
const autoSelectOriginalAccount = async () => {
  try {
    console.log('=== AUTO-SELECTING ORIGINAL ACCOUNT FUNCTION CALLED ===')
    console.log('Function called at:', new Date().toISOString())
    console.log('=== AUTO-SELECTING ORIGINAL ACCOUNT ===')
    console.log('Current liquidation expenses:', store.currentLiquidation?.expenses)
    console.log('Available expense accounts:', store.expenseAccounts?.length || 0)
    
    if (!store.currentLiquidation?.expenses || store.currentLiquidation.expenses.length === 0) {
      console.log('No expenses found in original disbursement')
      return
    }

    if (!store.expenseAccounts || store.expenseAccounts.length === 0) {
      console.log('No expense accounts available for matching')
      $q.notify({
        type: 'warning',
        message: 'No expense accounts available. Please refresh and try again.',
        icon: 'warning',
        position: 'top',
        timeout: 3000,
      })
      return
    }

    // Get the first expense from the original disbursement
    // For now, we'll use the first expense. In the future, this could be enhanced
    // to handle multiple expense accounts by allowing user selection
    const originalExpense = store.currentLiquidation.expenses[0]
    console.log('Original expense:', originalExpense)

    if (!originalExpense) {
      console.log('No original expense found')
      return
    }

    // If there are multiple expenses, show a warning
    if (store.currentLiquidation.expenses.length > 1) {
      console.log('Multiple expenses found in original disbursement, using the first one')
      $q.notify({
        type: 'warning',
        message: `Multiple expense accounts found. Using the first account: ${originalExpense.account_name || 'Unknown'}`,
        icon: 'warning',
        position: 'top',
        timeout: 4000,
      })
    }

    // Find matching expense account in the available accounts
    console.log('Available expense accounts:', store.expenseAccounts)
    console.log('Original expense full object:', JSON.stringify(originalExpense, null, 2))
    console.log('Looking for account with IDs:', {
      expense_class_id: originalExpense.expense_class_id,
      expense_type_id: originalExpense.expense_type_id,
      expense_item_id: originalExpense.expense_item_id,
      expense_sub_item_id: originalExpense.expense_sub_item_id
    })

    const matchingAccount = store.expenseAccounts.find(account => {
      // Match by expense hierarchy IDs - convert to numbers for comparison
      const classMatch = parseInt(account.expense_class_id) === parseInt(originalExpense.expense_class_id)
      const typeMatch = parseInt(account.expense_type_id) === parseInt(originalExpense.expense_type_id)
      const itemMatch = parseInt(account.expense_item_id) === parseInt(originalExpense.expense_item_id)
      const subItemMatch = parseInt(account.expense_sub_item_id) === parseInt(originalExpense.expense_sub_item_id)

      console.log('Checking account:', {
        id: account.id,
        account: account.account,
        expenseType: account.expenseType,
        expenseItem: account.expenseItem,
        expenseSubItem: account.expenseSubItem,
        expense_class_id: account.expense_class_id,
        expense_type_id: account.expense_type_id,
        expense_item_id: account.expense_item_id,
        expense_sub_item_id: account.expense_sub_item_id,
        matches: { classMatch, typeMatch, itemMatch, subItemMatch }
      })
      
      // Also log the full account object for debugging
      console.log('Full account object:', JSON.stringify(account, null, 2))

      return classMatch && typeMatch && itemMatch && subItemMatch
    })

    if (matchingAccount) {
      console.log('Found matching account:', matchingAccount)
      
      // Check if account has sufficient budget
      const requiredAmount = parseFloat(reimbursementAmount.value)
      const availableBalance = parseFloat(matchingAccount.balance || 0)
      
      console.log('Required amount:', requiredAmount)
      console.log('Available balance:', availableBalance)
      
      if (availableBalance >= requiredAmount) {
        // Auto-select the account with the reimbursement amount
        const autoSelectedAccount = {
          ...matchingAccount,
          amount: requiredAmount.toString(),
          accountName: `${matchingAccount.account}${matchingAccount.expenseType ? ` > ${matchingAccount.expenseType}` : ''}${matchingAccount.expenseItem ? ` > ${matchingAccount.expenseItem}` : ''}${matchingAccount.expenseSubItem ? ` > ${matchingAccount.expenseSubItem}` : ''}`
        }
        
        selectedReimbursementExpenseAccounts.value = [autoSelectedAccount]
        
        console.log('=== AUTO-SELECTION SUCCESS (EXACT MATCH) ===')
        console.log('Auto-selected account:', autoSelectedAccount)
        console.log('selectedReimbursementExpenseAccounts.value:', selectedReimbursementExpenseAccounts.value)
        console.log('Array length:', selectedReimbursementExpenseAccounts.value.length)
        
        $q.notify({
          type: 'positive',
          message: `Automatically selected account: ${autoSelectedAccount.accountName}`,
          icon: 'check_circle',
          position: 'top',
          timeout: 3000,
        })
      } else {
        // Show budget validation error
        $q.notify({
          type: 'negative',
          message: 'No more budget for this account. Please commit again.',
          icon: 'warning',
          position: 'top',
          timeout: 5000,
        })
        
        console.log('Insufficient budget for auto-selection')
      }
    } else {
      console.log('No exact matching account found, trying fallback matching...')
      
      // Fallback: Try multiple matching strategies with priority scoring
      const fallbackMatches = store.expenseAccounts.map(account => {
        // Strategy 1: Try matching by account name (the full hierarchy string) - HIGHEST PRIORITY
        const accountNameMatch = account.account && originalExpense.account_name && 
          account.account.toLowerCase().includes(originalExpense.account_name.toLowerCase().split(' > ')[0])
        
        // Strategy 2: Try matching by exact expense item ID - HIGH PRIORITY
        const exactItemMatch = parseInt(account.expense_item_id) === parseInt(originalExpense.expense_item_id)
        
        // Strategy 3: Try matching by partial hierarchy (class and type) - MEDIUM PRIORITY
        const partialMatch = parseInt(account.expense_class_id) === parseInt(originalExpense.expense_class_id) &&
          parseInt(account.expense_type_id) === parseInt(originalExpense.expense_type_id)
        
        // Strategy 4: Try matching by just the expense class - LOW PRIORITY
        const classOnlyMatch = parseInt(account.expense_class_id) === parseInt(originalExpense.expense_class_id)
        
        // Strategy 5: Try matching by account name parts - MEDIUM PRIORITY
        const namePartsMatch = originalExpense.account_name && account.account && 
          originalExpense.account_name.toLowerCase().includes(account.account.toLowerCase())
        
        // Strategy 6: Try reverse matching (account name in original) - MEDIUM PRIORITY
        const reverseNameMatch = originalExpense.account_name && account.account && 
          account.account.toLowerCase().includes(originalExpense.account_name.toLowerCase())
        
        // Calculate priority score (higher is better)
        let priorityScore = 0
        if (exactItemMatch) priorityScore += 100  // Highest priority for exact item match
        if (accountNameMatch) priorityScore += 80
        if (namePartsMatch) priorityScore += 60
        if (reverseNameMatch) priorityScore += 60
        if (partialMatch) priorityScore += 40
        if (classOnlyMatch) priorityScore += 20
        
        console.log('Fallback matching for account:', {
          id: account.id,
          account: account.account,
          expenseItem: account.expenseItem,
          exactItemMatch,
          accountNameMatch,
          partialMatch,
          classOnlyMatch,
          namePartsMatch,
          reverseNameMatch,
          priorityScore,
          originalExpenseItemId: originalExpense.expense_item_id,
          accountExpenseItemId: account.expense_item_id
        })
        
        return {
          account,
          priorityScore,
          exactItemMatch,
          accountNameMatch,
          partialMatch,
          classOnlyMatch,
          namePartsMatch,
          reverseNameMatch
        }
      }).filter(match => match.priorityScore > 0) // Only include accounts that have some match
      
      // Sort by priority score (highest first) and take the best match
      const sortedMatches = fallbackMatches.sort((a, b) => b.priorityScore - a.priorityScore)
      const bestMatch = sortedMatches.length > 0 ? sortedMatches[0] : null
      const fallbackMatch = bestMatch ? bestMatch.account : null
      
      console.log('Fallback matching results:', {
        totalMatches: fallbackMatches.length,
        sortedMatches: sortedMatches.map(m => ({
          id: m.account.id,
          account: m.account.account,
          expenseItem: m.account.expenseItem,
          priorityScore: m.priorityScore,
          exactItemMatch: m.exactItemMatch
        })),
        bestMatch: bestMatch ? {
          id: bestMatch.account.id,
          account: bestMatch.account.account,
          expenseItem: bestMatch.account.expenseItem,
          priorityScore: bestMatch.priorityScore,
          exactItemMatch: bestMatch.exactItemMatch
        } : null
      })
      
      if (fallbackMatch) {
        console.log('Found fallback matching account:', fallbackMatch)
        
        // Check if account has sufficient budget
        const requiredAmount = parseFloat(reimbursementAmount.value)
        const availableBalance = parseFloat(fallbackMatch.balance || 0)
        
        if (availableBalance >= requiredAmount) {
          // Auto-select the account with the reimbursement amount
          const autoSelectedAccount = {
            ...fallbackMatch,
            amount: requiredAmount.toString(),
            accountName: `${fallbackMatch.account}${fallbackMatch.expenseType ? ` > ${fallbackMatch.expenseType}` : ''}${fallbackMatch.expenseItem ? ` > ${fallbackMatch.expenseItem}` : ''}${fallbackMatch.expenseSubItem ? ` > ${fallbackMatch.expenseSubItem}` : ''}`
          }
          
          selectedReimbursementExpenseAccounts.value = [autoSelectedAccount]
          
          console.log('=== AUTO-SELECTION SUCCESS (FALLBACK MATCH) ===')
          console.log('Auto-selected account:', autoSelectedAccount)
          console.log('selectedReimbursementExpenseAccounts.value:', selectedReimbursementExpenseAccounts.value)
          console.log('Array length:', selectedReimbursementExpenseAccounts.value.length)
          console.log('First item in array:', selectedReimbursementExpenseAccounts.value[0])
          console.log('First item accountName:', selectedReimbursementExpenseAccounts.value[0]?.accountName)
          console.log('First item amount:', selectedReimbursementExpenseAccounts.value[0]?.amount)
          console.log('First item id:', selectedReimbursementExpenseAccounts.value[0]?.id)
          
          // Force reactivity update
          await nextTick()
          console.log('After nextTick - Array length:', selectedReimbursementExpenseAccounts.value.length)
          
          $q.notify({
            type: 'positive',
            message: `Automatically selected account (fallback match): ${autoSelectedAccount.accountName}`,
            icon: 'check_circle',
            position: 'top',
            timeout: 4000,
          })
          
          // Show additional info about the fallback match
          $q.notify({
            type: 'info',
            message: 'Note: Selected account has same fund and type as original, but different item/sub-item.',
            icon: 'info',
            position: 'top',
            timeout: 5000,
          })
        } else {
          // Show budget validation error
          $q.notify({
            type: 'negative',
            message: 'No more budget for this account. Please commit again.',
            icon: 'warning',
            position: 'top',
            timeout: 5000,
          })
        }
      } else {
        console.log('No matching account found in available accounts')
        console.log('=== DEBUGGING INFO ===')
        console.log('Original expense:', originalExpense)
        console.log('All available accounts:', store.expenseAccounts.map(acc => ({
          id: acc.id,
          account: acc.account,
          expenseType: acc.expenseType,
          expenseItem: acc.expenseItem,
          expenseSubItem: acc.expenseSubItem,
          expense_class_id: acc.expense_class_id,
          expense_type_id: acc.expense_type_id,
          expense_item_id: acc.expense_item_id,
          expense_sub_item_id: acc.expense_sub_item_id,
          balance: acc.balance
        })))
        console.log('=== END DEBUGGING INFO ===')
        
        $q.notify({
          type: 'warning',
          message: 'Could not find matching account. Please select manually.',
          icon: 'warning',
          position: 'top',
          timeout: 5000,
        })
      }
    }
  } catch (error) {
    console.error('Error in auto-select original account:', error)
    $q.notify({
      type: 'negative',
      message: 'Error auto-selecting account. Please select manually.',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
  }
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

// Real-time input formatting function: strings (typing) show commas only; numbers (after blur) show two decimals
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

// Handle OR amount input while typing: keep cleaned STRING, prevent >2 decimals
const handleOrAmountInput = (orDetail, value) => {
  let cleanValue = String(value).replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }
  orDetail.orAmount = cleanValue
}

// Handle OR amount input on blur: format to two decimals
const handleOrAmountBlur = (orDetail, value) => {
  const formatted = formatToTwoDecimals(value)
  orDetail.orAmount = formatted
}

// Format input value to exactly two decimal places
const formatToTwoDecimals = (value) => {
  // Remove peso sign, commas, and spaces
  const cleanValue = String(value).replace(/[₱,\s]/g, '')

  if (cleanValue === '') return ''

  // Handle multiple decimal points
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    const collapsed = parts[0] + '.' + parts.slice(1).join('')
    return formatToTwoDecimals(collapsed)
  }

  // Limit decimal places to 2
  if (parts.length === 2 && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2)
  }

  const num = parseFloat(parts.join('.'))
  if (isNaN(num)) return ''

  // Return numeric value with two decimals
  return Math.round(num * 100) / 100
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
  event.preventDefault()
  const pastedText = event.clipboardData.getData('text')
  const cleanText = pastedText.replace(/[^\d.]/g, '')
  const parts = cleanText.split('.')
  let finalText = parts[0]
  if (parts.length > 1) {
    finalText += '.' + parts.slice(1).join('').substring(0, 2)
  }
  event.target.value = finalText

  // Find the OR detail that this input belongs to and update it
  const inputElement = event.target
  const orDetailIndex = Array.from(inputElement.closest('.q-card-section').querySelectorAll('input[prefix="₱"]')).indexOf(inputElement)
  if (orDetailIndex >= 0 && store.currentLiquidation.orDetails[orDetailIndex]) {
    store.currentLiquidation.orDetails[orDetailIndex].orAmount = finalText
  }
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

/* Expense account hierarchy styling */
.expense-account-hierarchy {
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
  max-width: 400px;
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .q-card {
    min-width: 95vw !important;
  }

  .expense-account-hierarchy {
    font-size: 11px;
    max-width: 250px;
  }
}
</style>
