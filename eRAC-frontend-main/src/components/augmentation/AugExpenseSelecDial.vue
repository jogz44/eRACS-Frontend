<template>
  <!-- Expense Selection Dialog -->
  <q-dialog v-model="store.dialogs.augExpense">
    <q-card :style="cardWidthStyle">
      <q-card-section>
        <div class="text-h6">Select Expense Account (Same Class)</div>
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
            :loading="store.expenseAccountsLoading"
            flat
            bordered
          >
            <template v-slot:no-data>
              <div class="full-width row flex-center q-gutter-sm">
                <q-icon name="warning" color="orange" size="2em" />
                <div class="text-center">
                  <div class="text-h6 text-orange">No Expense Accounts Available</div>
                  <div class="text-body2 text-grey-7 q-mt-sm">
                    This could be due to:
                  </div>
                  <div class="text-body2 text-grey-6 q-mt-xs">
                    • No appropriations with "committed" status<br>
                    • No appropriations for current fiscal year<br>
                    • No appropriations for current barangay<br>
                    • Missing expense hierarchy setup
                  </div>
                  <div class="text-body2 text-grey-7 q-mt-sm">
                    Please ensure appropriations are properly set up and committed.
                  </div>
                </div>
              </div>
            </template>
            <template v-slot:body-cell-expense_class="props">
              <q-td :props="props">
                <q-badge
                  v-if="props.row.expense_class"
                  :color="getExpenseClassColor(props.row.expense_class)"
                  :label="props.row.expense_class"
                  class="expense-class-badge"
                />
                <span v-else class="empty-text">-</span>
              </q-td>
            </template>
            <template v-slot:body-cell-expense_type="props">
              <q-td :props="props">
                <span class="expense-type-text">{{ props.row.expense_type || '-' }}</span>
              </q-td>
            </template>
            <template v-slot:body-cell-expense_item="props">
              <q-td :props="props">
                <span class="expense-item-text">{{ props.row.expense_item || '-' }}</span>
              </q-td>
            </template>
            <template v-slot:body-cell-expense_sub_item="props">
              <q-td :props="props">
                <div v-if="props.row.expense_sub_item_name" class="subitem-container">
                  <q-chip 
                    size="sm" 
                    color="teal" 
                    text-color="white" 
                    icon="label"
                    class="subitem-chip"
                  >
                    {{ props.row.expense_sub_item_name }}
                  </q-chip>
                </div>
                <span v-else class="empty-text">-</span>
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

const cardWidthStyle = computed(() => {
  // Calculate appropriate width based on content
  // New layout: expense class, expense type, expense item, expense sub-item, balance, action
  const expenseClassColumnWidth = 150 // Expense class column
  const expenseTypeColumnWidth = 150 // Expense type column
  const expenseItemColumnWidth = 150 // Expense item column
  const expenseSubItemColumnWidth = 150 // Expense sub-item column
  const balanceColumnWidth = 120  // Balance column
  const actionColumnWidth = 100   // Action button
  const totalWidth = expenseClassColumnWidth + expenseTypeColumnWidth + expenseItemColumnWidth + expenseSubItemColumnWidth + balanceColumnWidth + actionColumnWidth + 200 // Add more padding

  // Responsive width calculation
  if (window.innerWidth < 768) {
    // Mobile/tablet: use most of the viewport width
    return `min-width: 95vw; max-width: 95vw; width: 95vw;`
  } else if (window.innerWidth < 1200) {
    // Small desktop: use calculated width or 90vw, whichever is smaller
    const width = Math.min(totalWidth, window.innerWidth * 0.9)
    return `min-width: 1000px; max-width: 90vw; width: ${width}px;`
  } else {
    // Large desktop: use calculated width or 80vw, whichever is smaller
    const width = Math.min(totalWidth, window.innerWidth * 0.8)
    return `min-width: 1000px; max-width: 80vw; width: ${width}px;`
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
  width: 18%;
  min-width: 120px;
}

.expense-accounts-table .q-table th:nth-child(2),
.expense-accounts-table .q-table td:nth-child(2) {
  width: 18%;
  min-width: 120px;
}

.expense-accounts-table .q-table th:nth-child(3),
.expense-accounts-table .q-table td:nth-child(3) {
  width: 18%;
  min-width: 120px;
}

.expense-accounts-table .q-table th:nth-child(4),
.expense-accounts-table .q-table td:nth-child(4) {
  width: 18%;
  min-width: 120px;
}

.expense-accounts-table .q-table th:nth-child(5),
.expense-accounts-table .q-table td:nth-child(5) {
  width: 15%;
  min-width: 100px;
}

.expense-accounts-table .q-table th:nth-child(6),
.expense-accounts-table .q-table td:nth-child(6) {
  width: 13%;
  min-width: 80px;
}

.expense-class-badge {
  font-size: 0.75rem;
  font-weight: 500;
  color: black !important;
}

.expense-type-text {
  font-size: 0.875rem;
  color: #333;
  font-weight: 500;
}

.expense-item-text {
  font-size: 0.875rem;
  color: #444;
  font-weight: 400;
}

.subitem-text {
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}

.subitem-container {
  display: flex;
  align-items: center;
}

.subitem-chip {
  font-size: 0.75rem;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-text {
  font-size: 0.875rem;
  color: #999;
  font-style: italic;
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
    font-size: 10px !important;
  }

  .q-dialog .q-table th,
  .q-dialog .q-table td {
    padding: 4px 2px !important;
  }

  .subitem-text {
    font-size: 0.7rem !important;
  }

  .subitem-chip {
    font-size: 0.6rem !important;
    padding: 2px 4px !important;
  }

  .expense-type-text {
    font-size: 0.7rem !important;
  }

  .expense-item-text {
    font-size: 0.7rem !important;
  }

  .expense-class-badge {
    font-size: 0.6rem !important;
  }

  .empty-text {
    font-size: 0.7rem !important;
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
    font-size: 11px !important;
  }

  .q-dialog .q-table th,
  .q-dialog .q-table td {
    padding: 6px 4px !important;
  }

  .subitem-text {
    font-size: 0.75rem !important;
  }

  .subitem-chip {
    font-size: 0.65rem !important;
    padding: 3px 6px !important;
  }

  .expense-type-text {
    font-size: 0.75rem !important;
  }

  .expense-item-text {
    font-size: 0.75rem !important;
  }

  .expense-class-badge {
    font-size: 0.65rem !important;
  }

  .empty-text {
    font-size: 0.75rem !important;
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
    font-size: 12px !important;
  }

  .q-dialog .q-table th,
  .q-dialog .q-table td {
    padding: 8px 5px !important;
  }

  .subitem-text {
    font-size: 0.8rem !important;
  }

  .subitem-chip {
    font-size: 0.7rem !important;
    padding: 4px 8px !important;
  }

  .expense-type-text {
    font-size: 0.8rem !important;
  }

  .expense-item-text {
    font-size: 0.8rem !important;
  }

  .expense-class-badge {
    font-size: 0.7rem !important;
  }

  .empty-text {
    font-size: 0.8rem !important;
  }
}
</style>
