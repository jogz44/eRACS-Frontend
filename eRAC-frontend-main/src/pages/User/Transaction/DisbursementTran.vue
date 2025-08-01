<template>
  <q-page class="q-pa-lg disbursement-page">
    <div class="page-header q-mb-lg">
       <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">Disbursement Transaction</div>
       <q-btn
          icon="refresh"
          color="primary"
          flat
          round
          @click="loadPendingUsers"
          :loading="loading"
          title="Refresh pending users"
        />
        </div>
</div>
    <div class="q-mb-md">
      <SearchFilters @add="store.openDialog('disbursement')" />

      <!-- Disbursement Dialog -->
      <q-dialog v-model="store.dialogs.disbursement" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 1100px">
          <q-card-section>
            <div class="text-h6">Disbursement</div>
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
                  @keydown.enter="handleEnterKey"
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
                  @update:model-value="store.loadChequeBookletsForBank(store.forms.disbursement.bank_id)"
                  :options="bankStore.banks"
                  option-label="name"
                  option-value="id"
                  emit-value
                  map-options
                  :label="currentBankLabel"
                  @keydown.enter="handleEnterKey"
                />
              </div>

              <!-- Check Number Field -->
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Cheque Number:</q-item-label>
                <q-select
                  filled
                  outlined
                  dense
                  v-model="store.selectedBooklet"
                  @update:model-value="store.selectBooklet"
                  :options="store.chequeBooklets.map((b) => ({
                    label: b.label,
                    value: b.id
                  }))"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Choose Booklet"
                  class="q-mb-sm"
                  @keydown.enter="handleEnterKey"
                />

                <q-select
                  filled
                  outlined
                  dense
                  v-model="store.selectedChequeNumber"
                  @update:model-value="store.selectChequeNumber"
                  :options="store.availableChequeNumbers"
                  :disable="!store.selectedBooklet"
                  label="Select Cheque Number"
                  @keydown.enter="handleEnterKey"
                />
              </div>
              <!-- DV Number Field -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">DV Number:</q-item-label>
                <q-input
                  filled
                  outlined
                  dense
                  v-model="store.forms.disbursement.dvNumber"
                  @keydown.enter="handleEnterKey"
                />
              </div>

              <!-- Payee Field -->
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Payee:</q-item-label>
                <q-input
                  filled
                  outlined
                  dense
                  v-model="store.forms.disbursement.payee"
                  @keydown.enter="handleEnterKey"
                />
              </div>
            </div>
          </q-card-section>

          <!-- Add Expense Button -->
          <q-card-section>
            <div class="row justify-end q-mb-md">
              <q-btn
                label="Add"
                class="add-table-btn"
                icon="add"
                @click="store.openDialog('expense')"
              />
            </div>
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
                      @click="store.editItem(props.row)"
                    />
                    <q-btn
                      size="sm"
                      flat
                      round
                      color="red"
                      icon="delete"
                      @click="store.deleteItem(props.row)"
                    />
                  </div>
                </q-td>
              </template>
            </q-table>

            <!-- Amount Display -->
            <div class="q-mt-md">
              <q-item-label class="q-mb-xs">Amount:</q-item-label>
              <q-input
                filled
                outlined
                dense
                :model-value="`₱${(store.totalExpensesAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
                style="width: 40%"
                readonly
              />
            </div>
          </q-card-section>
            <q-card-actions align="right" class="custom-actions">
             <q-btn
               flat
               label="Cancel"
               class="modal-cancel-btn"
               @click="store.closeDialog('disbursement')"
             />
             <q-btn label="Save" class="modal-save-btn" @click="handleSaveClick" />
           </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Expense Selection Dialog -->
      <q-dialog v-model="store.dialogs.expense" persistent>
        <q-card style="min-width: 1000px">
          <q-card-section>
            <div class="text-h6">Select Expense Account</div>
          </q-card-section>

          <q-card-section>
            <q-input
              outlined
              dense
              placeholder="Search expense account..."
              v-model="store.expenseSearch"
              class="q-mb-sm"
              style="width: 400px"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>

            <q-table
              :rows="store.filteredExpenseAccounts"
              :columns="store.expenseAccountColumns"
              row-key="id"
              :loading="store.loading"
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
            <q-btn
              flat
              label="Cancel"
              class="modal-cancel-btn"
              @click="store.closeDialog('expense')"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Add Expense Dialog -->
      <q-dialog v-model="store.dialogs.expenseDetail">
        <q-card style="min-width: 500px">
          <q-card-section>
            <div class="text-h6">Add Expense</div>
          </q-card-section>

          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">
              <strong>Account:</strong> {{ store.forms.expense.account }}
            </div>
            <div class="text-subtitle1 q-mb-md">
              <strong>Balance:</strong> ₱{{ store.forms.expense.balance.toLocaleString() }}
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

          <q-card-actions align="right">
            <q-btn
              flat
              label="Cancel"
              class="modal-cancel-btn"
              color="negative"
              @click="store.closeDialog('expenseDetail')"
            />
            <q-btn label="Save" @click="store.saveExpense" class="modal-save-btn" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Main Data Table -->
      <q-card>
        <q-table
          :rows="store.disbursements"
          :columns="store.disbursementColumns"
          row-key="id"
          :pagination="store.pagination"
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="button-group">
                <q-btn
                  class="edit-btn"
                  icon="edit"
                  v-if="props.row.status === 'Pending' || props.row.status === 'Partial'"
                  @click="store.openEditDisbursement(props.row)"
                />
                <q-btn
                  class="view-btn"
                  icon="visibility"

                  @click="store.openViewOrDetails(props.row)"
                />
                <q-btn
                  outlined
                  label="Liquidate"
                  class="allocate-btn"
                  color="primary"
                  v-if="props.row.status === 'Pending' || props.row.status === 'Partial'"
                  @click="store.openOrDetailsDialog(props.row)"
                />
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>
      <OrDetailsDialog v-model="store.dialogs.orDetails" />

      <!-- View Only Dialog -->
      <ViewOrDetails v-model="store.dialogs.viewOrDetails" />

      <!--Edit Disbursement-->
      <EditDisbursement />
    </div>
  </q-page>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import SearchFilters from 'components/disbursement/SearchFilters.vue'
import OrDetailsDialog from 'components/disbursement/OrDetailsDialog.vue'
import ViewOrDetails from 'components/disbursement/ViewOrDetails.vue'
import EditDisbursement from 'components/disbursement/EditDisbursement.vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useBankStore } from 'stores/bankStore'

const store = useDisbursementStore()
const bankStore = useBankStore()

onMounted(async () => {
  await store.fetchDisbursementAccounts?.(); // keep existing
  await store.fetchDisbursements();
  if (!bankStore.banks.length) {
    await bankStore.fetchBanks()
  }
})

watch(
  () => store.expenses,
  (newExpenses) => {
    console.log('Expenses changed:', newExpenses)
    console.log('Current total:', store.totalExpensesAmount)
  },
  { deep: true },
)

import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)

// Computed property for bank label
const currentBankLabel = computed(() => {
  if (store.forms.disbursement.bank_id) {
    const selectedBank = bankStore.banks.find(bank => bank.id === store.forms.disbursement.bank_id)
    return selectedBank ? selectedBank.name : 'Select Bank'
  }
  return 'Select Bank'
})

const validateAndSave = () => {
  // Check if disbursement dialog is open
  if (store.dialogs.disbursement) {
    // Validate required fields before saving
    const form = store.forms.disbursement
    const hasRequiredFields = form.date &&
                             form.bank_id &&
                             store.selectedBank &&
                             store.selectedChequeNumber &&
                             form.dvNumber &&
                             form.payee

    // Only save if all required fields are filled and not currently loading
    if (hasRequiredFields && !store.loading) {
      store.saveDisbursement()
    } else {
      // Show validation error notification
      $q.notify({
        type: 'negative',
        message: 'Please fill in all required fields before saving',
        icon: 'warning',
        position: 'top',
      })
    }
  }
}

const handleEnterKey = (event) => {
  // Prevent default behavior to avoid form submission
  if (event) {
    event.preventDefault()
  }
  validateAndSave()
}

const handleSaveClick = () => {
  validateAndSave()
}

const loadPendingUsers = async () => {
  loading.value = true
  try {
    await store.fetchDisbursements()
    $q.notify({
      type: 'positive',
      message: 'Disbursements refreshed!',
      icon: 'refresh',
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to refresh disbursements',
      icon: 'error',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}



</script>

<style scoped>
.disbursement-page {
  background-color: #D9D9D9; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
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

  .q-dialog .q-gutter-md {
    gap: 8px !important;
  }

  .q-dialog .q-select,
  .q-dialog .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .q-dialog .q-btn {
    min-height: 44px !important;
  }

  /* Mobile Dialog Content Organization */
  .q-dialog .row.q-col-gutter-md {
    flex-direction: column !important;
    gap: 12px !important;
  }

  .q-dialog .col-md-4,
  .q-dialog .col-sm-6,
  .q-dialog .col-sm-12 {
    width: 100% !important;
    max-width: 100% !important;
    flex: 1 1 100% !important;
  }

  .q-dialog .q-item-label {
    font-size: 14px !important;
    margin-bottom: 4px !important;
  }

  .q-dialog .q-table {
    font-size: 12px !important;
  }

  .q-dialog .q-table th,
  .q-dialog .q-table td {
    padding: 8px 4px !important;
  }

  .q-dialog .button-group {
    display: flex !important;
    gap: 4px !important;
    flex-wrap: wrap !important;
  }

  .q-dialog .button-group .q-btn {
    min-width: 32px !important;
    height: 32px !important;
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

  .q-dialog .q-gutter-md {
    gap: 12px !important;
  }

  .q-dialog .q-select,
  .q-dialog .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .q-dialog .q-btn {
    min-height: 44px !important;
  }

  /* Small Tablet Dialog Content Organization */
  .q-dialog .row.q-col-gutter-md {
    gap: 16px !important;
  }

  .q-dialog .col-md-4 {
    width: 50% !important;
    max-width: 50% !important;
    flex: 1 1 50% !important;
  }

  .q-dialog .col-sm-6,
  .q-dialog .col-sm-12 {
    width: 100% !important;
    max-width: 100% !important;
    flex: 1 1 100% !important;
  }

  .q-dialog .q-item-label {
    font-size: 14px !important;
    margin-bottom: 6px !important;
  }

  .q-dialog .q-table {
    font-size: 13px !important;
  }

  .q-dialog .q-table th,
  .q-dialog .q-table td {
    padding: 10px 6px !important;
  }

  .q-dialog .button-group {
    display: flex !important;
    gap: 6px !important;
  }

  .q-dialog .button-group .q-btn {
    min-width: 36px !important;
    height: 36px !important;
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

  .q-dialog .q-gutter-md {
    gap: 16px !important;
  }

  .q-dialog .q-select,
  .q-dialog .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  /* Large Tablet Dialog Content Organization */
  .q-dialog .row.q-col-gutter-md {
    gap: 20px !important;
  }

  .q-dialog .col-md-4 {
    width: 33.33% !important;
    max-width: 33.33% !important;
    flex: 1 1 33.33% !important;
  }

  .q-dialog .col-sm-6 {
    width: 50% !important;
    max-width: 50% !important;
    flex: 1 1 50% !important;
  }

  .q-dialog .col-sm-12 {
    width: 100% !important;
    max-width: 100% !important;
    flex: 1 1 100% !important;
  }

  .q-dialog .q-item-label {
    font-size: 15px !important;
    margin-bottom: 8px !important;
  }

  .q-dialog .q-table {
    font-size: 14px !important;
  }

  .q-dialog .q-table th,
  .q-dialog .q-table td {
    padding: 12px 8px !important;
  }

  .q-dialog .button-group {
    display: flex !important;
    gap: 8px !important;
  }

  .q-dialog .button-group .q-btn {
    min-width: 40px !important;
    height: 40px !important;
  }
}
</style>
