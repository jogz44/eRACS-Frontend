<template>
  <!-- Expense Selection Dialog -->
  <q-dialog v-model="store.dialogs.augExpense">
    <q-card :style="cardWidthStyle">
      <q-card-section>
        <div class="text-h6">Select Expense Account</div>
      </q-card-section>

      <q-card-section class="q-pa-md">
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
        <div class="table-container">
          <q-table
            :rows="store.filteredExpenseAccounts"
            :columns="store.AugexpenseAccountColumns"
            row-key="id"
            class="expense-accounts-table"
            :pagination="{ rowsPerPage: 5 }"
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
                  flat
                  label="Select"
                  color="primary"
                  @click="store.openExpenseDetail(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="negative" @click="store.closeDialog('augExpense')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useAugmentationStore } from 'stores/augmentation'
import { computed } from 'vue'
const store = useAugmentationStore()

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

const cardWidthStyle = computed(() => {
  // Calculate appropriate width based on content
  // Account column needs more space for long names, balance and action are fixed
  const accountColumnWidth = 500 // Increased from 400 for better visibility
  const budgetSourceColumnWidth = 150 // Budget source column
  const balanceColumnWidth = 150  // Balance column
  const actionColumnWidth = 120   // Action button
  const totalWidth = accountColumnWidth + budgetSourceColumnWidth + balanceColumnWidth + actionColumnWidth + 150 // Add more padding
  
  // Responsive width calculation
  if (window.innerWidth < 768) {
    // Mobile/tablet: use most of the viewport width
    return `min-width: 95vw; max-width: 95vw; width: 95vw;`
  } else if (window.innerWidth < 1200) {
    // Small desktop: use calculated width or 90vw, whichever is smaller
    const width = Math.min(totalWidth, window.innerWidth * 0.9)
    return `min-width: 800px; max-width: 90vw; width: ${width}px;`
  } else {
    // Large desktop: use calculated width or 80vw, whichever is smaller
    const width = Math.min(totalWidth, window.innerWidth * 0.8)
    return `min-width: 800px; max-width: 80vw; width: ${width}px;`
  }
})
</script>

<style scoped>
/* Table container and column width control */
.table-container {
  width: 100%;
  min-height: 400px;
}

.expense-accounts-table {
  width: 100%;
}

.expense-accounts-table .q-table th:nth-child(1),
.expense-accounts-table .q-table td:nth-child(1) {
  width: 40%;
  min-width: 250px;
}

.budget-source-badge {
  font-size: 0.75rem;
  font-weight: 500;
}

.expense-accounts-table .q-table th:nth-child(2),
.expense-accounts-table .q-table td:nth-child(2) {
  width: 25%;
  min-width: 120px;
}

.expense-accounts-table .q-table th:nth-child(3),
.expense-accounts-table .q-table td:nth-child(3) {
  width: 25%;
  min-width: 100px;
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
