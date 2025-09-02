<template>
  <q-page class="q-pa-md disbursement-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">Disbursement Transaction</div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="refreshData"
          :loading="store.loadingDisbursements"
        />
      </div>
    </div>

    <div class="q-mb-sm">
      <SearchFilters />

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
                  :readonly="true"
                  :disable="true"
                  @keydown.enter="handleEnterKey"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-not-allowed" />
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
                <!-- <q-input
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
                  :disable="true"
                  @keydown.enter="handleEnterKey"
                /> -->

                <q-input
                  outlined
                  dense
                  v-model="store.availableChequeNumbers[0]"
                  :disable="true"
                  @keydown.enter="handleEnterKey"
                ></q-input>
              </div>

              <!-- DV Number Field -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">DV Number:</q-item-label>
                <q-input
                  outlined
                  dense
                  :disable="true"
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
              <!-- <q-btn
                label="Add"
                color="primary"
                icon="add"
                @click="store.openDialog('expense')"
              /> -->
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
                  <!-- Admin can only view, not edit/delete -->
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
              label="Close"
              @click="store.closeDialog('disbursement')"
            />
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
          :rows="store.filteredDisbursements"
          :columns="store.disbursementColumns"
          row-key="id"
          :pagination="store.pagination"
          :loading="store.loadingDisbursements"
          flat
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="q-gutter-xs">
                <!-- <q-btn
                  dense
                  icon="edit"
                  color="orange"
                  v-if="props.row.status === 'Pending' || props.row.status === 'Partial'"
                  @click="store.openEditDisbursement(props.row)"
                /> -->
                <q-btn
                  dense
                  icon="visibility"
                  color="blue"
                  @click="store.openViewOrDetails(props.row)"
                />
                <!-- <q-btn
                  dense
                  label="Liquidate"
                  color="primary"
                  v-if="props.row.status === 'Pending' || props.row.status === 'Partial'"
                  @click="store.openOrDetailsDialog(props.row)"
                /> -->
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-remarks="props">
            <q-td :props="props">
              <q-btn
                dense
                :icon="isReviewed(props.row.id) ? 'check' : 'rate_review'"
                :label="isReviewed(props.row.id) ? 'Reviewed' : 'Review'"
                :color="isReviewed(props.row.id) ? 'positive' : 'primary'"
                :outline="!isReviewed(props.row.id)"
                :disable="isReviewed(props.row.id)"
                :unelevated="!isReviewed(props.row.id)"
                rounded
                @click="!isReviewed(props.row.id) && handleReviewClick(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card>

      <OrDetailsDialog />
      <ViewOrDetails v-model="store.dialogs.viewOrDetails" />
      <EditDisbursement />
    </div>
  </q-page>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import SearchFilters from 'pages/Admin/SearchFilters.vue'
import OrDetailsDialog from 'components/disbursement/OrDetailsDialog.vue'
import ViewOrDetails from 'components/disbursement/ViewOrDetails.vue'
import EditDisbursement from 'components/disbursement/EditDisbursement.vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useBankStore } from 'stores/bankStore'
import { usePageLogging } from '../../../composables/usePageLogging'

const store = useDisbursementStore()
const bankStore = useBankStore()
const { logPageVisit } = usePageLogging()

onMounted(async () => {
  try {
    // Load essential data in parallel for faster loading
    const [disbursementsPromise, banksPromise] = await Promise.allSettled([
      store.fetchDisbursements(),
      bankStore.banks.length ? Promise.resolve() : bankStore.fetchBanks()
    ])

    // Only fetch expense accounts if needed (for admin users, this is not essential)
    if (!store.expenseData.length) {
      store.fetchExpenseAccounts().catch(error => {
        console.warn('Failed to fetch expense accounts:', error)
      })
    }

    // Log page visit in background
    logPageVisit('Current Disbursement').catch(error => {
      console.warn('Failed to log page visit:', error)
    })

    // Check for errors in critical operations
    if (disbursementsPromise.status === 'rejected') {
      throw disbursementsPromise.reason
    }
    if (banksPromise.status === 'rejected') {
      console.warn('Failed to fetch banks:', banksPromise.reason)
    }

  } catch (error) {
    console.error('Error during component initialization:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load initial data: ' + error.message,
      position: 'top',
    })
  }
})

// Watch for changes in the selected bank to update the cheque booklets
watch(
  () => store.forms.disbursement.bank_id,
  async (newBankId) => {
    if (newBankId) {
      try {
        await store.loadChequeBookletsForBank(newBankId)
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: `Failed to load cheque booklets for selected bank: ${error.message}`,
          icon: 'error',
          position: 'top',
        })
      }
    }
  },
)

import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Local reviewed state per disbursement row (non-persistent)
const reviewedSet = ref(new Set())

const isReviewed = (id) => reviewedSet.value.has(id)

const handleReviewClick = (row) => {
  if (isReviewed(row.id)) return
  $q.dialog({
    title: 'Confirm Review',
    message: `Mark DV ${row.dvNumber} as reviewed?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    reviewedSet.value.add(row.id)
  })
}

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

const refreshData = async () => {
  try {
    // Only refresh essential data for faster response
    await store.fetchDisbursements()
  } catch (error) {
    console.error('Failed to refresh data:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to refresh data: ' + error.message,
      position: 'top',
    })
  }
}

// const handleBookletSelection = async (bookletRange) => {
//   if (bookletRange) {
//     try {
//       await store.selectBooklet(bookletRange)
//     } catch (error) {
//       $q.notify({
//         type: 'negative',
//         message: `Failed to load cheques for selected booklet: ${error.message}`,
//         icon: 'error',
//         position: 'top',
//       })
//     }
//   }
// }


const handleEnterKey = (event) => {
  if (event) {
    event.preventDefault()
  }
  // Admin users cannot save - only view
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
