<template>
  <!--Edit Disbursement-->
  <q-dialog v-model="store.dialogs.editDisbursement" persistent>
    <q-card style="min-width: 1100px">
      <q-card-section>
        <div class="text-h6">
          Edit Expenses for Disbursement #{{ store.forms.disbursement.dvNumber }}
        </div>
        <div v-if="!isChequeCancelled" class="text-caption text-grey-6 q-mt-sm">
          Note: Total amount is locked to ₱{{ store.lockedTotalAmount?.toLocaleString() || '0' }}. You can only
          redistribute amounts between expenses, UNLESS you cancel the cheque.
        </div>

      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Date Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Date:</q-item-label>
            <q-input filled outlined dense v-model="store.forms.disbursement.date" mask="##/##/####" :readonly="true"
              :disable="true">
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="store.forms.disbursement.date" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Bank Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Bank:</q-item-label>
            <q-select outlined dense v-model="store.forms.disbursement.bank_id" :options="bankStore.availableBanks"
              option-label="name" option-value="id" emit-value map-options :label="currentBankLabel"
              :disable="!isChequeCancelled" @update:model-value="handleBankSelection" />
          </div>

          <!-- Check Number Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Cheque Number:</q-item-label>
            <div class="row q-gutter-xs">
              <div class="col">
                <q-input outlined dense v-model="chequeField" :disable="true" placeholder="Select a bank first" />
              </div>
            </div>
          </div>
          <!-- DV Number Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">DV Number:</q-item-label>
            <q-input filled outlined dense v-model="store.forms.disbursement.dvNumber" :disable="true" />
          </div>

          <!-- Payee Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Payee:</q-item-label>
            <q-input filled outlined dense v-model="store.forms.disbursement.payee" :disable="!isChequeCancelled" />
          </div>

          <!-- Cancel Cheque Button -->
          <div v-if="!isChequeCancelled" class="col-md-4 col-sm-12 flex flex-center q-mt-lg">
            <q-btn color="negative" label="Cancel Cheque" icon="cancel" class="full-width"
              @click="handleCancelCheque" />
          </div>
        </div>
      </q-card-section>

      <div>

        <!-- Cancel Cheque Confirmation Dialog -->
        <q-dialog v-model="showConfirmDialog" persistent>
          <q-card style="min-width: 400px">
            <q-card-section>
              <div class="text-h6">Cancel Cheque</div>
            </q-card-section>

            <q-card-section>
              <div class="text-body1">
                Are you sure you want to cancel this cheque?
              </div>
              <div class="q-mt-md">
                <div><strong>Cheque Number:</strong> {{ store.forms.disbursement.chequeNumber }}</div>
                <div><strong>Bank:</strong> {{ currentBankLabel }}</div>
                <div><strong>Payee:</strong> {{ store.forms.disbursement.payee }}</div>
              </div>
              <div class="text-caption text-grey-6 q-mt-sm">
                After canceling, you can select a different bank and add a new cheque number.
              </div>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="No" v-close-popup />
              <q-btn color="negative" label="Yes, Cancel" @click="confirmCancelCheque" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>

      <!-- Expense Table Section -->
      <q-card-section>
        <div v-if="isChequeCancelled" class="row justify-end q-mb-md">
          <q-btn label="Add" color="primary" icon="add" @click="handleAddExpense" @mouseenter="preloadExpenseAccounts"
            :loading="addingExpense || store.expenseTypeLoading" v-permission="'add'" />
        </div>
        <!-- Expense Table -->
        <q-table :rows="store.expenses" :columns="store.expenseColumns" row-key="id" :pagination="{ rowsPerPage: 5 }">
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="button-group">
                <q-btn size="sm" flat round color="green" icon="edit" @click="editExpenseInline(props.row)" />
              </div>
            </q-td>
          </template>
        </q-table>

        <!-- Amount Display -->
        <div class="q-mt-md">
          <q-item-label class="q-mb-xs">Total Amount:</q-item-label>
          <q-input filled outlined dense
            :model-value="`₱${(store.totalExpensesAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
            :class="getTotalAmountClass()" style="width: 40%" readonly />
          <div v-if="getAmountDifference() !== 0" class="text-caption text-negative q-mt-xs">
            {{ getAmountDifferenceMessage() }}
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <q-btn flat label="Cancel" class="modal-cancel-btn" @click="
          () => {
            isChequeCancelled = false
            store.closeDialog('editDisbursement')
            // Don't reset form data immediately - let the dialog close handler manage it
          }
        " />
        <q-btn label="Save" class="modal-save-btn" @click="handleSaveEditedDisbursement" :loading="saving"
          :disable="!store.expenses || store.expenses.length === 0 || (store.totalExpensesAmount !== store.lockedTotalAmount && !isChequeCancelled)" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Edit Expense Dialog -->
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
          <strong>Available Balance:</strong> ₱{{ store.forms.expense.balance.toLocaleString() }}
        </div>
        <div class="text-subtitle1 q-mb-md">
        <q-select outlined dense v-model="store.forms.expense.particulars" :options="filteredParticulars"
          label="Particulars" use-input fill-input hide-selected new-value-mode="add-unique" option-label="label"
          option-value="label" map-options emit-value @filter="filterFn" />

        </div>
        <div class="text-subtitle1 q-mb-md">
        <q-input outlined dense :model-value="formatInputValue(store.forms.expense.amount)"
          @update:model-value="(val) => store.forms.expense.amount = handleAmountInput(val)"
          @blur="(e) => (store.forms.expense.amount = formatToTwoDecimals(e.target.value))" label="Amount"
          class="q-mb-md" prefix="₱" inputmode="decimal" pattern="\\d*\\.?\\d{0,2}" @keypress="blockNonNumeric"
          @paste.prevent="handlePasteNumeric" />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">


        <q-btn flat label="Cancel" @click="store.closeDialog('expenseDetail')" />
        <q-btn label="Save" @click="handleSaveExpense" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDisbursementStore } from 'stores/disbursementStore'
import { useBankStore } from 'stores/bankStore'
import { onMounted, ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'

const store = useDisbursementStore()
const bankStore = useBankStore()
const $q = useQuasar()
const saving = ref(false)


const showConfirmDialog = ref(false)
const addingExpense = ref(false)
const isChequeCancelled = ref(store.isChequeCancel) // Track if cheque is cancelled

const filteredParticulars = ref(store.particulars)

function filterFn (val, update) {
  if (val === '') {
    update(() => {
      filteredParticulars.value = store.particulars.slice(0, 5)
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    const results = store.particulars.filter(opt =>
      opt.label.toLowerCase().includes(needle)
    )

    // 👇 only keep first 5 matches
    filteredParticulars.value = results.slice(0, 5)
  })
}


// Example bank list (replace with your data)

// Computed properties
const currentBankLabel = computed(() => {
  if (store.forms.disbursement.bank_id) {
    const selectedBank = bankStore.banks.find(b => b.id === store.forms.disbursement.bank_id)
    return selectedBank ? selectedBank.name : 'Select Bank'
  }
  return 'Select Bank'
})

onMounted(async () => {
  await bankStore.fetchBanks()
})

// Watch for dialog close to reset form data
watch(() => store.dialogs.editDisbursement, (isOpen) => {
  if (!isOpen) {
    // Dialog is closed, reset form data after a short delay to allow for data persistence
    setTimeout(() => {
      store.resetEditDisbursement()
    }, 100)
  }
})



const handleSaveEditedDisbursement = async () => {
  // Validate total amount before saving
  if (store.totalExpensesAmount !== store.lockedTotalAmount && !isChequeCancelled.value) {
    $q.notify({
      type: 'negative',
      message: `Total amount must equal the original DV amount of ₱${store.lockedTotalAmount?.toLocaleString()}. Current total: ₱${store.totalExpensesAmount?.toLocaleString()}`,
      icon: 'warning',
      position: 'top',
      timeout: 5000
    })
    return
  }

  saving.value = true
  try {
    const result = await store.saveEditedDisbursement()
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Disbursement updated successfully!',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000
      })
      isChequeCancelled.value = false
      store.isChequeCancel = false

    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Failed to update disbursement',
        icon: 'error',
        position: 'top',
        timeout: 5000
      })
    }
  } catch (error) {
    console.error('Error saving edited disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'An error occurred while saving',
      icon: 'error',
      position: 'top',
      timeout: 5000
    })
  } finally {
    saving.value = false
  }
}

const editExpenseInline = (expense) => {
  store.openExpenseDetailForEdit(expense)
}

const getTotalAmountClass = () => {
  const currentTotal = store.totalExpensesAmount || 0
  const lockedTotal = store.lockedTotalAmount || 0

  if (currentTotal > lockedTotal) {
    return 'text-negative'
  } else if (currentTotal < lockedTotal) {
    return 'text-warning'
  } else {
    return 'text-positive'
  }
}

const getAmountDifference = () => {
  const currentTotal = store.totalExpensesAmount || 0
  const lockedTotal = store.lockedTotalAmount || 0
  return currentTotal - lockedTotal
}

const getAmountDifferenceMessage = () => {
  const difference = getAmountDifference()

  if (difference > 0 && !isChequeCancelled.value) {
    return `Amount exceeds original DV amount by ₱${difference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else if (difference < 0 && !isChequeCancelled.value) {
    return `Amount is less than original DV amount by ₱${Math.abs(difference).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return ''
}

const handleSaveExpense = async () => {
  try {
    await store.saveExpense()
    $q.notify({
      type: 'positive',
      message: 'Expense updated successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000
    })
  } catch (error) {
    console.error('Error saving expense:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to save expense',
      icon: 'error',
      position: 'top',
      timeout: 5000
    })
  }
}

// Formatting helpers (match CommitDialog behavior)
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
  if (cleanValue === '') return 0
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    const collapsed = parts[0] + '.' + parts.slice(1).join('')
    return formatToTwoDecimals(collapsed)
  }
  if (parts.length === 2 && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2)
  }
  const num = parseFloat(parts.join('.'))
  if (isNaN(num)) return 0
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


// Handle cancel cheque button click
const handleCancelCheque = () => {
  showConfirmDialog.value = true
}

// Confirm cancel cheque action
const confirmCancelCheque = async () => {
  try {
    showConfirmDialog.value = false

    // Call backend API to mark cheque as cancelled
    store.isChequeCancel = true

    if (store.isChequeCancel) {
      // Clear the cheque number and enable bank selection
      store.forms.disbursement.chequeNumber = ''
      store.forms.disbursement.bank_id = null
      store.autoCheque = ''


      isChequeCancelled.value = true

      // Refresh bank data to reflect the cancelled cheque status
      await bankStore.fetchBanks()

      $q.notify({
        type: 'positive',
        message: 'Cheque cancelled successfully! You can now select a different bank and add a new cheque and expenses',
        icon: 'check_circle',
        position: 'top',
        timeout: 4000
      })
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to cancel cheque',
        icon: 'error',
        position: 'top',
        timeout: 3000
      })
    }
  } catch (error) {
    console.error('Error cancelling cheque:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to cancel cheque',
      icon: 'error',
      position: 'top',
      timeout: 3000
    })
  }
}

// Handle bank selection
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

const chequeField = computed({
  get() {
    return !isChequeCancelled.value
      ? store.forms.disbursement.chequeNumber
      : store.autoCheque
  },
  set(val) {
    if (!isChequeCancelled.value) {
      store.forms.disbursement.chequeNumber = val
    } else {
      store.autoCheque = val
    }
  }
})


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

// Watch for changes in the expense detail dialog
watch(
  () => store.dialogs.expenseDetail,
  (isOpen) => {
    if (!isOpen) {
      // Reset expense form when dialog closes
      store.resetForm('expense')
    }
  }
)
</script>

<style scoped>
.button-group {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.button-group .q-btn {
  min-width: 32px;
}

/* Ensure proper spacing for the expense table */
.q-table {
  margin-bottom: 16px;
}

/* Style for the amount display */
.q-input[readonly] {
  background-color: #f5f5f5;
}

/* Amount validation colors */
.text-negative {
  color: #c10015 !important;
}

.text-warning {
  color: #f57c00 !important;
}

.text-positive {
  color: #21ba45 !important;
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .q-card {
    min-width: 95vw !important;
  }

  .q-table {
    font-size: 12px;
  }

  .button-group .q-btn {
    min-width: 28px;
    padding: 4px;
  }
}
</style>
