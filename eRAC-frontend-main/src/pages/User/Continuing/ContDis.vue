<template>
  <q-page class="q-pa-md contdis-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">Continuing Disbursement</div>
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
      <div class="row items-center q-gutter-sm">
        <q-input
          outlined
          dense
          placeholder="Search Description..."
          v-model="store.searchQuery"
          style="min-width: 300px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-btn
          dense
          outlined
          color="negative"
          icon="clear"
          @click="clearAllFilters"
        />

        <q-space />

        <q-btn
          label="Add"
          icon="add"
          color="primary"
          @click="store.openDialog('disbursement')"
        />
      </div>

      <!-- Disbursement Dialog -->
      <q-dialog v-model="store.dialogs.disbursement" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 700px; max-width: 90vw">
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
                  v-model="store.forms.disbursement.bank"
                  :options="['BDO', 'Metro Bank', 'BPI', 'PNB']"
                  @keydown.enter="handleEnterKey"
                />
              </div>

              <!-- Check Number Field -->
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Cheque Number:</q-item-label>
                <q-input
                  outlined
                  dense
                  v-model="store.forms.disbursement.checkNumber"
                  :rules="[(val) => !!val || 'Field is required']"
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
                @click="store.openDialog('expense')"
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

      <!-- Main Data Table -->
      <q-card flat bordered>
        <q-table
          :rows="store.disbursements"
          :columns="store.disbursementColumns"
          row-key="id"
          :pagination="store.pagination"
          flat
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="q-gutter-xs">
                <q-btn
                  dense
                  icon="edit"
                  color="orange"
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
                  @click="store.openOrDetailsDialog(props.row)"
                />
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>

      <ContLiquidateDialog v-model="store.dialogs.orDetails" />
      <ContViewOr v-model="store.dialogs.viewOrDetails" />
    </div>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { ref } from 'vue'
import { useContDisbursementStore } from 'stores/contDisburseStore'
import ContLiquidateDialog from 'components/contDisburse/ContOrDetails.vue'
import ContViewOr from 'components/contDisburse/ContViewOr.vue'

const $q = useQuasar()
const loading = ref(false)
const store = useContDisbursementStore()

const validateAndSave = () => {
  if (store.dialogs.disbursement) {
    const form = store.forms.disbursement
    const hasRequiredFields = form.date &&
                             form.bank &&
                             form.checkNumber &&
                             form.dvNumber &&
                             form.payee

    const hasExpenses = store.expenses && store.expenses.length > 0

    if (!hasRequiredFields) {
      $q.notify({
        type: 'negative',
        message: 'Please fill in all required fields before saving',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    if (!hasExpenses) {
      $q.notify({
        type: 'negative',
        message: 'Please add at least one expense before saving',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    store.saveDisbursement()
  }
}

const handleEnterKey = (event) => {
  event.preventDefault()
  validateAndSave()
}

const handleSaveClick = () => {
  validateAndSave()
}

const loadPendingUsers = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    $q.notify({
      type: 'positive',
      message: 'Disbursement refreshed!',
      icon: 'refresh',
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to refresh data',
      icon: 'error',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const clearAllFilters = () => {
  store.searchQuery = ''
  store.dateFrom = ''
  store.dateTo = ''
}
</script>

<style scoped>
.contdis-page {
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

  .row.items-center.q-gutter-sm {
    flex-direction: column;
    align-items: stretch;
  }

  .row.items-center.q-gutter-sm > * {
    margin-bottom: 8px;
    width: 100%;
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
