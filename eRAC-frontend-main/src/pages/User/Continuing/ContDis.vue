<template>
  <q-page class="q-pa-lg contdis-page">
    <div class="page-header q-mb-lg">
       <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">Continuing Disbursement</div>
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
      <div class="justify-end q-mb-md">
        <div class="row items-center justify-between q-gutter-sm">
          <!-- Search Input -->
          <q-input
            bg-color="white"
            outlined
            dense
            placeholder="Search..."
            v-model="store.searchQuery"
            class="col-md-3 col-sm-5 custom-search-input"
            style="min-width: 450px"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <div class="t q-px-xl"></div>

          <!-- Date Range Group -->
          <div class="row items-center justify-between">
            <!-- From Date -->
            <q-input
              bg-color="white"
              outlined
              label="From"
              dense
              v-model="store.dateFrom"
              mask="##/##/####"
              class="custom-date-from"
              style="width: 200px"
            >
              <template v-slot:append>
                <q-icon name="event" class="calend-icon">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="store.dateFrom" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <!-- To Label -->
            <div class="t q-px-xs"></div>
            <div class="t q-px-xs"></div>

            <!-- To Date -->
            <q-input
             bg-color="white"
              outlined
              label="To"
              dense
              v-model="store.dateTo"
              mask="##/##/####"
              class="custom-date-to"
              style="width: 200px"
            >
              <template v-slot:append>
                <q-icon name="event" class="calend-icon">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="store.dateTo" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="t q-px-xs"></div>

          <!-- Add Button Disbursement -->
          <q-btn
            label="Add"
            icon="add"
            class="add-table-btn"
            @click="store.openDialog('disbursement')"
          />
        </div>
      </div>

      <!--Disbursement Dialog-->
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
                <q-input
                  filled
                  outlined
                  dense
                  v-model="store.forms.disbursement.checkNumber"
                  :rules="[(val) => !!val || 'Field is required']"
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
                  @click="store.openOrDetailsDialog(props.row)"
                />
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>

      <ContLiquidateDialog v-model="store.dialogs.orDetails" />

      <!-- View Only Dialog -->
      <ContViewOr v-model="store.dialogs.viewOrDetails" />
    </div>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)

const loadPendingUsers = async () => {
  loading.value = true
  try {
    // TODO: Replace with actual API call to fetch continuing disbursements
    // Example: await store.fetchDisbursements()
    // For now, just simulate a delay
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
import { ref } from 'vue'
import { useContDisbursementStore } from 'stores/contDisburseStore'
import ContLiquidateDialog from 'components/contDisburse/ContOrDetails.vue'
import ContViewOr from 'components/contDisburse/ContViewOr.vue'

const store = useContDisbursementStore()
</script>

<style scoped>
.contdis-page {
  background-color: #D9D9D9; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
}

</style>
