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
      <SearchFilters />

      <!-- Disbursement Dialog -->
      <q-dialog v-model="store.dialogs.disbursement" persistent>
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
                  v-model="store.forms.disbursement.bank"
                  :options="['BDO', 'Metro Bank', 'BPI', 'PNB']"
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
                  :options="
                    store.chequeBooklets.map((b) => ({
                      label: `${b.label} (${b.range})`,
                      value: b.range,
                    }))
                  "
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Choose Booklet"
                  class="q-mb-sm"
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
                />
              </div>
              <!-- DV Number Field -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">DV Number:</q-item-label>
                <q-input filled outlined dense v-model="store.forms.disbursement.dvNumber" />
              </div>

              <!-- Payee Field -->
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Payee:</q-item-label>
                <q-input filled outlined dense v-model="store.forms.disbursement.payee" />
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
            <q-btn label="Save" class="modal-save-btn" @click="store.saveDisbursement" />
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
                  v-if="props.row.status === 'Pending'"
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
                  v-if="props.row.status === 'Pending'"
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

const store = useDisbursementStore()

onMounted(async () => {
  await store.fetchDisbursementAccounts?.(); // keep existing
  await store.fetchDisbursements();
})

watch(
  () => store.expenses,
  (newExpenses) => {
    console.log('Expenses changed:', newExpenses)
    console.log('Current total:', store.totalExpensesAmount)
  },
  { deep: true },
)

import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)

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
</style>
