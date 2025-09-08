<template>
  <q-dialog v-model="store.dialogs.AugexpenseDetail">
    <q-card style="min-width: 500px; max-width: 90vw; width: auto;">
      <q-card-section>
        <div class="text-h6">Add Expense (Same Class Transfer)</div>
      </q-card-section>

      <q-card-section>
        <!-- Display FROM expense info -->
        <div class="text-subtitle1 q-mb-sm">
          <strong>From Expense:</strong> {{ store.forms.augExpense?.value?.from_expense }}
          <q-badge
            :color="getExpenseClassColor(store.forms.augExpense?.value?.from_expense_class)"
            :label="store.forms.augExpense?.value?.from_expense_class || 'N/A'"
            class="q-ml-sm expense-class-badge"
          />
        </div>
        <div class="text-subtitle1 q-mb-sm">
          <strong>Balance:</strong> ₱{{ store.forms.augExpense?.value?.balance?.toLocaleString() }}
        </div>

        <!-- TO Expense Selection -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">
            <strong>To Expense:</strong>
            <q-badge
              v-if="store.forms.augExpense?.value?.to_expense_class"
              :color="getExpenseClassColor(store.forms.augExpense?.value?.to_expense_class)"
              :label="store.forms.augExpense?.value?.to_expense_class || 'N/A'"
              class="q-ml-sm expense-class-badge"
            />
          </div>
          <div class="row q-gutter-sm">
            <q-input
              outlined
              dense
              v-model="store.forms.augExpense.value.to_expense"
              label="To Expense"
              class="col"
              readonly
              placeholder="Select destination expense"
            />
            <q-btn
              label="Select"
              color="primary"
              outline
              :loading="store.toExpenseSelectionLoading"
              :disable="!store.forms.augExpense?.value?.from_expense || store.toExpenseSelectionLoading"
              @click="openToExpenseSelection"
            />
          </div>
        </div>

        <!-- Same Class Transfer Info -->
        <div v-if="isSameClassTransfer" class="q-mb-md">
          <q-banner class="bg-green-1 text-green-8">
            <template v-slot:avatar>
              <q-icon name="check_circle" color="green" />
            </template>
            <strong>Same Class Transfer:</strong> You are transferring funds within the same expense class
            ({{ store.forms.augExpense?.value?.from_expense_class }}). This is a standard augmentation.
          </q-banner>
        </div>

        <!-- Particulars Field -->
        <q-input
          outlined
          dense
          v-model="store.forms.augExpense.value.particulars"
          label="Particulars"
          class="q-mb-md"
          type="textarea"
          autogrow
        />

        <!-- Amount Field -->
        <q-input
          outlined
          dense
          :model-value="formatInputValue(store.forms.augExpense.value.amount)"
          @update:model-value="(val) => store.forms.augExpense.value.amount = handleAmountInput(val)"
          @blur="(e) => (store.forms.augExpense.value.amount = formatToTwoDecimals(e.target.value))"
          label="Amount"
          class="q-mb-md"
          prefix="₱"
          inputmode="decimal"
          pattern="\\d*\\.?\\d{0,2}"
          @keypress="blockNonNumeric"
          @paste.prevent="handlePasteNumeric"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancel"
          color="negative"
          @click="store.closeDialog('AugexpenseDetail')"
        />
        <q-btn label="Save" color="primary" @click="handleSave" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useAugmentationStore } from 'stores/augmentation'
import { useQuasar } from 'quasar'
const store = useAugmentationStore()
const $q = useQuasar()

// Expense class helper functions
const getExpenseClassColor = (expenseClass) => {
  if (!expenseClass) return 'grey'
  
  // Color coding based on expense class
  const classColors = {
    'Sangguniang Kabataan': 'purple',
    'General Services': 'blue',
    'Social Services': 'green',
    'Economic Services': 'orange',
    'Environmental Services': 'teal',
    'Capital Outlay': 'indigo',
    'Disaster Risk Reduction': 'red',
    'Infrastructure': 'brown',
    'Peace and Order': 'deep-orange',
    'Sports and Recreation': 'pink',
    'Other': 'grey'
  }
  
  return classColors[expenseClass] || 'info'
}

// Check if this is a same class transfer
const isSameClassTransfer = computed(() => {
  const fromClass = store.forms.augExpense?.value?.from_expense_class
  const toClass = store.forms.augExpense?.value?.to_expense_class
  return fromClass && toClass && fromClass === toClass
})

function openToExpenseSelection() {
  // Set the flag to indicate we're selecting a TO expense
  store.isSelectingToExpense = true

  // Set loading state for the Select button
  store.toExpenseSelectionLoading = true

  // Open the expense selection dialog for selecting TO expense
  store.openDialog('augExpense')
}

function handleSave() {
  try {
    // Check if this is a same class transfer
    if (isSameClassTransfer.value) {
      // Same class transfer, proceed normally
      store.saveExpense()
      // Show success notification for same class transfer
      $q.notify({
        type: 'positive',
        message: `Same class transfer added successfully! ₱${store.forms.augExpense?.value?.amount?.toLocaleString()} transferred within ${store.forms.augExpense?.value?.from_expense_class} class.`,
        position: 'top',
        icon: 'check_circle',
      })
    } else {
      // Different class transfer - show warning
      $q.dialog({
        title: 'Confirm Cross-Class Transfer',
        message: `You are transferring ₱${store.forms.augExpense?.value?.amount?.toLocaleString()} between different expense classes (${store.forms.augExpense?.value?.from_expense_class} → ${store.forms.augExpense?.value?.to_expense_class}). This may require special authorization. Do you want to proceed?`,
        cancel: true,
        persistent: true,
        ok: {
          label: 'Proceed',
          color: 'orange'
        }
      }).onOk(() => {
        // User confirmed, proceed with save
        store.saveExpense()
        // Show success notification for cross-class transfer
        $q.notify({
          type: 'positive',
          message: `Cross-class transfer added successfully! ₱${store.forms.augExpense?.value?.amount?.toLocaleString()} transferred from ${store.forms.augExpense?.value?.from_expense_class} to ${store.forms.augExpense?.value?.to_expense_class} class.`,
          position: 'top',
          icon: 'check_circle',
        })
      }).onCancel(() => {
        // User cancelled, do nothing
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to add expense',
      position: 'top',
      icon: 'error',
    })
  }
}

// Currency input helpers (consistent with CommitDialog/EditDisbursement)
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
</script>

<style scoped>
.expense-class-badge {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Responsive Dialog - Only sizing adjustments for mobile and tablet */
@media (max-width: 600px) {
  /* Mobile View - Only size adjustments */
  .q-dialog .q-card {
    width: 95vw !important;
    min-width: 95vw !important;
    max-width: 95vw !important;
    margin: 8px !important;
  }

  .q-dialog .q-card-section {
    padding: 12px !important;
  }

  .q-dialog .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .q-dialog .q-btn {
    min-height: 44px !important;
  }

  .q-dialog .text-subtitle1 {
    font-size: 14px !important;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  /* Small Tablet View - Only size adjustments */
  .q-dialog .q-card {
    width: 90vw !important;
    min-width: 90vw !important;
    max-width: 90vw !important;
  }

  .q-dialog .q-card-section {
    padding: 16px !important;
  }

  .q-dialog .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .q-dialog .q-btn {
    min-height: 44px !important;
  }

  .q-dialog .text-subtitle1 {
    font-size: 15px !important;
  }
}

@media (min-width: 901px) and (max-width: 1200px) {
  /* Large Tablet View - Only size adjustments */
  .q-dialog .q-card {
    width: 80vw !important;
    min-width: 80vw !important;
    max-width: 80vw !important;
  }

  .q-dialog .q-card-section {
    padding: 20px !important;
  }

  .q-dialog .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .q-dialog .text-subtitle1 {
    font-size: 16px !important;
  }
}
</style>
