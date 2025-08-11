<template>
  <q-page class="q-pa-md disbursement-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">
          Disbursement Transaction
        </div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="loadPendingUsers"
          :loading="loading"
        />
      </div>
    </div>

    <div class="q-mb-sm">
      <SearchFilters @add="store.openDialog('disbursement')" />

      <!-- Disbursement Dialog -->
      <q-dialog v-model="store.dialogs.disbursement" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 900px; max-width: 95vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Disbursement</div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <!-- Date Field -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">Date:</q-item-label>
                <q-input
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
                  outlined
                  dense
                  v-model="store.forms.disbursement.bank_id"
                  :options="bankStore.banks"
                  option-label="name"
                  option-value="id"
                  emit-value
                  map-options
                  :label="currentBankLabel"
                  :loading="store.bankLoading"
                  @update:model-value="handleBankSelection"
                  @keydown.enter="handleEnterKey"
                />
              </div>

              <!-- Check Number Field -->
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Cheque Number:</q-item-label>
                <q-select
                  outlined
                  dense
                  v-model="store.selectedBooklet"
                  @update:model-value="handleBookletSelection"
                  :options="store.chequeBooklets"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  :label="store.chequeBooklets.length === 0 ? 'No booklets available' : 'Choose Booklet'"
                  class="q-mb-sm"
                  :loading="store.bookletLoading"
                  :disable="!store.forms.disbursement.bank_id || store.chequeBooklets.length === 0"
                  @keydown.enter="handleEnterKey"
                />

                <q-select
                  outlined
                  dense
                  v-model="store.selectedChequeNumber"
                  @update:model-value="store.selectChequeNumber"
                  :options="store.availableChequeNumbers"
                  :disable="!store.selectedBooklet || store.availableChequeNumbers.length === 0"
                  :label="store.availableChequeNumbers.length === 0 ? 'No cheques available' : 'Select Cheque Number'"
                  @keydown.enter="handleEnterKey"
                />
              </div>

              <!-- DV Number Field -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">DV Number:</q-item-label>
                <q-input
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
                 color="primary"
                 icon="add"
                 @click="handleAddExpense"
                 :loading="addingExpense"
               />
            </div>

            <!-- Expense Table -->
            <q-table
              :rows="store.expenses"
              :columns="store.expenseColumns"
              row-key="id"
              :pagination="{ rowsPerPage: 5 }"
              flat
              bordered
            >
              <template v-slot:body-cell-action="props">
                <q-td :props="props">
                  <div class="q-gutter-xs">
                    <q-btn
                      size="sm"
                      dense
                      icon="edit"
                      color="orange"
                      @click="store.editItem(props.row)"
                    />
                    <q-btn
                      size="sm"
                      dense
                      icon="delete"
                      color="red"
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
                outlined
                dense
                :model-value="`₱${(store.totalExpensesAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
                style="width: 300px"
                readonly
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              label="Cancel"
              @click="store.closeDialog('disbursement')"
            />
            <q-btn label="Save" color="primary" @click="handleSaveClick" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Expense Selection Dialog -->
      <q-dialog v-model="store.dialogs.expense" persistent>
        <q-card style="min-width: 800px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Select Expense Account</div>
          </q-card-section>

          <q-card-section>
            <q-input
              outlined
              dense
              placeholder="Search expense account..."
              v-model="store.expenseSearch"
              class="q-mb-sm"
              style="width: 300px"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>

            <q-table
              :rows="store.filteredExpenseAccounts"
              :columns="store.expenseAccountColumns"
              row-key="id"
              :loading="store.loading || store.expenseTypeLoading"
              :filter="store.expenseSearch"
              flat
              bordered
            >
              <template v-slot:body-cell-action="props">
                <q-td :props="props">
                  <q-btn
                    dense
                    label="Select"
                    color="primary"
                    @click="store.openExpenseDetail(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              label="Cancel"
              @click="store.closeDialog('expense')"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Add Expense Dialog -->
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

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              label="Cancel"
              @click="store.closeDialog('expenseDetail')"
            />
            <q-btn label="Save" @click="store.saveExpense" color="primary" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Main Data Table -->
      <q-card flat bordered>
        <q-table
          :rows="store.disbursements"
          :columns="store.disbursementColumns"
          row-key="id"
          :pagination="store.pagination"
          :loading="loading"
          flat
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="q-gutter-xs">
                <q-btn
                  dense
                  icon="edit"
                  color="orange"
                  v-if="props.row.status === 'Pending' || props.row.status === 'Partial'"
                  @click="store.openEditDisbursement(props.row)"
                />
                <q-btn
                  dense
                  icon="visibility"
                  color="blue"
                  @click="store.openViewOrDetails(props.row)"
                />
                <q-btn
                  dense
                  label="Liquidate"
                  color="primary"
                  v-if="props.row.status === 'Pending' || props.row.status === 'Partial'"
                  @click="store.openOrDetailsDialog(props.row)"
                />
                <q-btn
                  dense
                  icon="delete"
                  color="red"
                  v-if="(props.row.status === 'Pending' || props.row.status === 'Partial') && getAgingDays(props.row.aging) <= 1"
                  @click="handleDeleteDisbursement(props.row)"
                />
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>

      <OrDetailsDialog v-model="store.dialogs.orDetails" />
      <ViewOrDetails v-model="store.dialogs.viewOrDetails" />
      <EditDisbursement />
    </div>
  </q-page>
</template>

<script setup>
import { watch, onMounted, onActivated } from 'vue'
import SearchFilters from 'components/disbursement/SearchFilters.vue'
import OrDetailsDialog from 'components/disbursement/OrDetailsDialog.vue'
import ViewOrDetails from 'components/disbursement/ViewOrDetails.vue'
import EditDisbursement from 'components/disbursement/EditDisbursement.vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useBankStore } from 'stores/bankStore'

const store = useDisbursementStore()
const bankStore = useBankStore()

// Function to load all data
const loadAllData = async () => {
  console.log('Loading all disbursement data...')
  loading.value = true
  
  try {
    // Fetch all necessary data in parallel for better performance
    const promises = [
      store.fetchDisbursements(),
      store.fetchExpenseAccounts(),
      bankStore.fetchBanks()
    ]
    
    await Promise.all(promises)
    
    // Show success notification only if not in loading state
    if (!loading.value) {
      $q.notify({
        type: 'positive',
        message: 'Disbursement data loaded successfully!',
        icon: 'check_circle',
        position: 'top',
        timeout: 2000
      })
    }
    
  } catch (error) {
    console.error('Error during data loading:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load disbursement data: ' + (error.message || 'Unknown error'),
      icon: 'error',
      position: 'top',
      timeout: 5000
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  console.log('DisbursementTran component mounted - starting data refresh...')
  await loadAllData()
})

// Refresh data when component is activated (when navigating back to this page)
onActivated(async () => {
  console.log('DisbursementTran component activated - refreshing data...')
  await loadAllData()
})

// Watch for expenses changes
watch(
  () => store.expenses,
  (newExpenses) => {
    console.log('Expenses changed:', newExpenses)
    console.log('Current total:', store.totalExpensesAmount)
  },
  { deep: true },
)

// Watch for disbursements changes to update the table
watch(
  () => store.disbursements,
  (newDisbursements) => {
    console.log('Disbursements updated:', newDisbursements.length, 'items')
  },
  { deep: true },
)

import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const addingExpense = ref(false)

const currentBankLabel = computed(() => {
  if (store.forms.disbursement.bank_id) {
    const selectedBank = bankStore.banks.find(bank => bank.id === store.forms.disbursement.bank_id)
    return selectedBank ? selectedBank.name : 'Select Bank'
  }
  return 'Select Bank'
})

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

const handleBookletSelection = async (bookletRange) => {
  if (bookletRange) {
    try {
      await store.selectBooklet(bookletRange)
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: `Failed to load cheques for selected booklet: ${error.message}`,
        icon: 'error',
        position: 'top',
      })
    }
  }
}

const validateAndSave = () => {
  if (store.dialogs.disbursement) {
    const form = store.forms.disbursement
    const hasRequiredFields = form.date &&
                             form.bank_id &&
                             store.selectedBooklet &&
                             store.selectedChequeNumber &&
                             form.dvNumber &&
                             form.payee

    if (hasRequiredFields && !store.loading) {
      store.saveDisbursement()
    } else {
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
  if (event) {
    event.preventDefault()
  }
  validateAndSave()
}

const handleSaveClick = () => {
  validateAndSave()
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
      timeout: 3000
    })
  } finally {
    addingExpense.value = false
  }
}

const loadPendingUsers = async () => {
  loading.value = true
  try {
    await loadAllData()
    $q.notify({
      type: 'positive',
      message: 'Disbursements refreshed!',
      icon: 'refresh',
      position: 'top',
      timeout: 3000
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

// Helper function to extract numeric days from aging string
const getAgingDays = (agingString) => {
  if (!agingString) return 0
  const match = agingString.match(/(\d+)\s*days?/)
  return match ? parseInt(match[1]) : 0
}

// Handle delete disbursement
const handleDeleteDisbursement = (row) => {
  // Show confirmation dialog
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete disbursement ${row.dvNumber}?`,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative',
      flat: false
    },
    cancel: {
      label: 'Cancel',
      color: 'grey',
      flat: true
    }
  }).onOk(async () => {
    // This will only execute when user clicks OK
    try {
      const result = await store.deleteDisbursement(row.id)
      
      if (result.success) {
        $q.notify({
          type: 'positive',
          message: result.message || 'Disbursement deleted successfully!',
          icon: 'check_circle',
          position: 'top',
          timeout: 3000
        })
      } else {
        $q.notify({
          type: 'negative',
          message: result.message || 'Failed to delete disbursement',
          icon: 'error',
          position: 'top',
          timeout: 5000
        })
      }
    } catch (error) {
      console.error('Error deleting disbursement:', error)
      $q.notify({
        type: 'negative',
        message: 'An error occurred while deleting the disbursement',
        icon: 'error',
        position: 'top',
        timeout: 5000
      })
    }
  })
}
</script>

<style scoped>
.disbursement-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }

  .row.q-col-gutter-md {
    flex-direction: column;
  }

  .col-md-4,
  .col-sm-6,
  .col-sm-12 {
    width: 100%;
    margin-bottom: 8px;
  }
}
</style>
