<template>
  <q-dialog v-model="store.dialogs.AugexpenseDetail">
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Add Expense</div>
      </q-card-section>

      <q-card-section>
        <!-- Display selected account info -->
        <div class="text-subtitle1 q-mb-sm">
          <strong>Account:</strong> {{ store.forms.augExpense?.value?.account }}
        </div>
        <div class="text-subtitle1 q-mb-md">
          <strong>Balance:</strong> ₱{{ store.forms.augExpense?.value?.balance?.toLocaleString() }}
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
          placeholder="0.00"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancel"
          color="negative"
          @click="store.closeDialog('AugexpenseDetail')"
        />
        <q-btn label="Save" color="primary" @click="store.saveExpense" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useAugmentationStore } from 'stores/augmentation'

const store = useAugmentationStore()

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
  store.forms.augExpense.value.amount = finalValue
}
</script>
