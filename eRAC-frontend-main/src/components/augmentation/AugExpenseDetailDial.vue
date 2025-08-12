<template>
  <q-dialog v-model="store.dialogs.AugexpenseDetail">
    <q-card style="min-width: 500px; max-width: 90vw; width: auto;">
      <q-card-section>
        <div class="text-h6">Add Expense</div>
      </q-card-section>

      <q-card-section>
        <!-- Display FROM expense info -->
        <div class="text-subtitle1 q-mb-sm">
          <strong>From Expense:</strong> {{ store.forms.augExpense?.value?.from_expense }}
        </div>
        <div class="text-subtitle1 q-mb-sm">
          <strong>Balance:</strong> ₱{{ store.forms.augExpense?.value?.balance?.toLocaleString() }}
        </div>

        <!-- TO Expense Selection -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">
            <strong>To Expense:</strong>
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
          v-model="store.forms.augExpense.value.amount"
          label="Amount"
          class="q-mb-md"
          prefix="₱"
          type="number"
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
import { useAugmentationStore } from 'stores/augmentation'
import { useQuasar } from 'quasar'
const store = useAugmentationStore()
const $q = useQuasar()

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
    store.saveExpense()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to add expense',
      position: 'top',
      icon: 'error',
    })
  }
}
</script>

<style scoped>
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
