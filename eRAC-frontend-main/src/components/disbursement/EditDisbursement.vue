<template>
  <!--Edit Disbursement-->
  <q-dialog v-model="store.dialogs.editDisbursement" persistent>
    <q-card style="min-width: 1100px">
      <q-card-section>
        <div class="text-h6">
          Edit Expenses for Disbursement #{{ store.forms.disbursement.dvNumber }}
        </div>
        <div class="text-caption text-grey-6 q-mt-sm">
          Note: Total amount is locked to ₱{{ store.lockedTotalAmount?.toLocaleString() || '0' }}. You can only redistribute amounts between expenses.
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
              v-model="store.forms.disbursement.date"
              mask="##/##/####"
              :readonly="true"
              :disable="true"
            >
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
            <q-select
              filled
              outlined
              dense
              v-model="store.forms.disbursement.bank_id"
              :options="bankStore.banks"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              :label="currentBankLabel"
              :readonly="true"
              :disable="true"
            />
          </div>

          <!-- Check Number Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Cheque Number:</q-item-label>

            <q-input
              outlined
              dense
              v-model="store.forms.disbursement.chequeNumber"
              :disable="true"
            ></q-input>
          </div>
          <!-- DV Number Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">DV Number:</q-item-label>
            <q-input filled outlined dense v-model="store.forms.disbursement.dvNumber"
              :disable="true"/>
          </div>

          <!-- Payee Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Payee:</q-item-label>
            <q-input filled outlined dense v-model="store.forms.disbursement.payee"/>
          </div>
        </div>
      </q-card-section>

      <!-- Expense Table Section -->
      <q-card-section>
        <!-- Expense Table -->
        <q-table
          :rows="store.expenses"
          :columns="store.expenseColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 5 }"
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="button-group">
                <q-btn
                  size="sm"
                  flat
                  round
                  color="green"
                  icon="edit"
                  @click="editExpenseInline(props.row)"
                />
              </div>
            </q-td>
          </template>
        </q-table>

        <!-- Amount Display -->
        <div class="q-mt-md">
          <q-item-label class="q-mb-xs">Total Amount:</q-item-label>
          <q-input
            filled
            outlined
            dense
            :model-value="`₱${(store.totalExpensesAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
            :class="getTotalAmountClass()"
            style="width: 40%"
            readonly
          />
          <div v-if="getAmountDifference() !== 0" class="text-caption text-negative q-mt-xs">
            {{ getAmountDifferenceMessage() }}
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <q-btn
          flat
          label="Cancel"
          class="modal-cancel-btn"
          @click="
            () => {
              store.closeDialog('editDisbursement')
              store.resetEditDisbursement()
            }
          "
        />
        <q-btn
          label="Save"
          class="modal-save-btn"
          @click="handleSaveEditedDisbursement"
          :loading="saving"
          :disable="!store.expenses || store.expenses.length === 0 || store.totalExpensesAmount !== store.lockedTotalAmount"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Edit Expense Dialog -->
  <q-dialog v-model="store.dialogs.expenseDetail">
    <q-card style="min-width: 500px">
      <q-card-section class="q-pb-none">
        <div class="text-h6">Edit Expense</div>
      </q-card-section>

      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">
          <strong>Account:</strong> {{ store.forms.expense.account }}
        </div>
        <div class="text-subtitle1 q-mb-md">
          <strong>Available Balance:</strong> ₱{{ store.forms.expense.balance.toLocaleString() }}
        </div>

        <q-input
          outlined
          dense
          v-model="store.forms.expense.particulars"
          label="Particulars"
          class="q-mb-md"
          type="textarea"
          autogrow
        />

        <q-input
          outlined
          dense
          v-model="store.forms.expense.amount"
          label="Amount"
          class="q-mb-md"
          prefix="₱"
          type="number"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          label="Cancel"
          @click="store.closeDialog('expenseDetail')"
        />
        <q-btn label="Save" @click="handleSaveExpense" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDisbursementStore } from 'stores/disbursementStore'
import { useBankStore } from 'stores/bankStore'
import { onMounted, computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'

const store = useDisbursementStore()
const bankStore = useBankStore()
const $q = useQuasar()
const saving = ref(false)

onMounted(async () => {
  await bankStore.fetchBanks()
})

const currentBankLabel = computed(() => {
  const bank = bankStore.banks.find(b => b.id === store.forms.disbursement.bank_id)
  return bank ? bank.name : 'Select Bank'
})

const handleSaveEditedDisbursement = async () => {
  // Validate total amount before saving
  if (store.totalExpensesAmount !== store.lockedTotalAmount) {
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

  if (difference > 0) {
    return `Amount exceeds original DV amount by ₱${difference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else if (difference < 0) {
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

