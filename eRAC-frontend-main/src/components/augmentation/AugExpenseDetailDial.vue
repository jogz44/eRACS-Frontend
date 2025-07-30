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
        <q-btn label="Save" color="primary" @click="store.saveExpense" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useAugmentationStore } from 'stores/augmentation'

const store = useAugmentationStore()
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
