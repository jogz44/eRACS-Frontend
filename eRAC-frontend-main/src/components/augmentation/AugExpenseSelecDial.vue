<template>
  <!-- Expense Selection Dialog -->
  <q-dialog v-model="store.dialogs.augExpense">
    <q-card style="min-width: 800px">
      <q-card-section>
        <div class="text-h6">Select Expense Account</div>
      </q-card-section>

      <q-card-section>
        <q-input
          outlined
          dense
          placeholder="Search expense account..."
          v-model="store.expenseSearch"
          class="q-mb-md"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- Expense Account Selection Table -->
        <q-table
          :rows="store.AugexpenseAccounts"
          :columns="store.AugexpenseAccountColumns"
          row-key="id"
          :filter="store.expenseSearch"
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <q-btn
                flat
                label="Select"
                color="primary"
                @click="store.openExpenseDetail(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="negative" @click="store.closeDialog('augExpense')" />
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
  
  .q-dialog .q-table {
    font-size: 12px !important;
  }
  
  .q-dialog .q-table th,
  .q-dialog .q-table td {
    padding: 8px 4px !important;
  }
  
  .q-dialog .q-btn {
    min-height: 44px !important;
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
  
  .q-dialog .q-table {
    font-size: 13px !important;
  }
  
  .q-dialog .q-table th,
  .q-dialog .q-table td {
    padding: 10px 6px !important;
  }
  
  .q-dialog .q-btn {
    min-height: 44px !important;
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
  
  .q-dialog .q-table {
    font-size: 14px !important;
  }
  
  .q-dialog .q-table th,
  .q-dialog .q-table td {
    padding: 12px 8px !important;
  }
}
</style>
