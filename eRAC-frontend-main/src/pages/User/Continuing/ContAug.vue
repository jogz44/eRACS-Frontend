<template>
  <q-page class="q-pa-lg contaug-page">
    <div class="page-header q-mb-lg">
       <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">Continuing Augmentation</div>
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
      <div class="justify-end q-mb-md"></div>
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

        <div class="t q-px-xs"></div>

        <!-- Add Button Disbursement -->
        <q-btn
          label="Add"
          icon="add"
          class="add-table-btn"
          @click="store.openDialog('augmentation')"
        />
      </div>
      <div class="justify-end q-mb-md"></div>

      <!--Augmentation Main Table-->
      <q-card>
        <q-table
          :rows="store.augmentation"
          :columns="store.augmentationColumns"
          row-key="id"
          :pagination="store.pagination"
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="button-group">
                <q-btn class="edit-btn" icon="edit" @click="store.editDisbursement(props.row)" />
                <q-btn
                  outlined
                  class="view-btn"
                  icon="visibility"
                  @click="store.openLiquidationTable(props.row)"
                />
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>
      <!--Augmenation Dialog-->
      <q-dialog v-model="store.dialogs.augmentation" persistent>
        <q-card style="min-width: 1100px">
          <q-card-section>
            <div class="text-h6">Augmentation</div>
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
                  v-model="store.forms.augmentation.date"
                  mask="##/##/####"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="store.forms.augmentation.date" mask="DD/MM/YYYY" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <!-- Ref No. -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">Ref No.:</q-item-label>
                <q-input filled outlined dense v-model="store.forms.augmentation.refNo" />
              </div>

              <!-- Remarks -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">Remarks:</q-item-label>
                <q-input filled outlined dense v-model="store.forms.augmentation.remarks" />
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
                @click="store.openDialog('augExpense')"
              />
            </div>

            <!-- Expense Table -->
            <q-table
              :rows="store.Augexpenses"
              :columns="store.expenseAugColumns"
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
            <!-- Amount Field -->
            <div class="q-mt-md">
              <q-item-label class="q-mb-xs">Amount:</q-item-label>
              <q-input filled outlined readonly="true" dense prefix="₱" style="width: 40%" />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="custom-actions">
            <q-btn
              flat
              label="Cancel"
              class="modal-cancel-btn"
              @click="store.closeDialog('augmentation')"
            />
            <q-btn label="Save" class="modal-save-btn" @click="store.saveDisbursement" />
          </q-card-actions>
        </q-card>
      </q-dialog>

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

      <!--Expense Detail Dialog -->
      <q-dialog v-model="store.dialogs.AugexpenseDetail">
        <q-card style="min-width: 500px">
          <q-card-section>
            <div class="text-h6">Add Expense</div>
          </q-card-section>

          <q-card-section>
            <!-- Display selected account info -->
            <div class="text-subtitle1 q-mb-sm">
              <strong>Account:</strong> {{ store.forms.augExpense.account }}
            </div>
            <div class="text-subtitle1 q-mb-md">
              <strong>Balance:</strong> ₱{{ store.forms.augExpense.balance.toLocaleString() }}
            </div>

            <!-- Particulars Field -->
            <q-input
              outlined
              dense
              v-model="store.forms.augExpense.particulars"
              label="Particulars"
              class="q-mb-md"
              type="textarea"
              autogrow
            />

            <!-- Amount Field -->
            <q-input
              outlined
              dense
              v-model="store.forms.augExpense.amount"
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
              color="negative"
              @click="store.closeDialog('AugexpenseDetail')"
            />
            <q-btn label="Save" color="primary" @click="store.saveExpense" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useContAugmentationStore } from 'stores/contAugmentation'

const $q = useQuasar()
const store = useContAugmentationStore()
const loading = ref(false)

const loadPendingUsers = async () => {
  loading.value = true
  try {
    // TODO: Replace with actual API call to fetch continuing augmentations
    // Example: await store.fetchAugmentations()
    // For now, just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 500))
    $q.notify({
      type: 'positive',
      message: 'Augmentation refreshed!',
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
</script>

<style scoped>
.contaug-page {
  background-color: #D9D9D9; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
}

.custom-search-input {
  min-width: 450px;
}

/* Responsive styles to match Continuing Appropriation */
@media (max-width: 600px) {
  .custom-search-input {
    min-width: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  .custom-search-input {
    min-width: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  .custom-date-from,
  .custom-date-to {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  .add-table-btn {
    width: 100% !important;
    max-width: 100% !important;
  }
}

@media (max-width: 900px) {
  /* Force the main container to stack */
  .row.items-center.justify-between.q-gutter-sm {
    flex-direction: column !important;
    align-items: stretch !important;
    width: 100% !important;
  }
  .row.items-center.justify-between.q-gutter-sm > * {
    margin-bottom: 8px !important;
    width: 100% !important;
  }
  /* Stack date container vertically in mobile */
  .row.items-center.justify-between > .row.items-center.justify-between {
    flex-direction: column !important;
    width: 100% !important;
    margin-bottom: 8px !important;
  }
  .row.items-center.justify-between > .row.items-center.justify-between > * {
    margin-bottom: 8px !important;
    width: 100% !important;
  }
  /* Hide spacing divs */
  .t.q-px-xl, .t.q-px-xs {
    display: none !important;
  }
  /* Make button full width */
  .add-table-btn {
    width: 100% !important;
    margin-top: 8px !important;
  }
  /* Align date inputs width with search input in mobile */
  .custom-date-from,
  .custom-date-to {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  /* Ensure search input takes full width */
  .custom-search-input {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  /* Force the main container to stack */
  .row.items-center.justify-between.q-gutter-sm {
    flex-direction: column !important;
    align-items: stretch !important;
    width: 100% !important;
  }
  .row.items-center.justify-between.q-gutter-sm > * {
    margin-bottom: 8px !important;
    width: 100% !important;
  }
  /* Keep date container horizontal but align with table */
  .row.items-center.justify-between > .row.items-center.justify-between {
    flex-direction: row !important;
    width: 100% !important;
    margin-bottom: 8px !important;
    gap: 16px !important;
  }
  .row.items-center.justify-between > .row.items-center.justify-between > * {
    flex: 1 1 0 !important;
    min-width: 0 !important;
    max-width: calc(50% - 8px) !important;
  }
  /* Hide spacing divs */
  .t.q-px-xl, .t.q-px-xs {
    display: none !important;
  }
  /* Make button full width */
  .add-table-btn {
    width: 100% !important;
    margin-top: 8px !important;
  }
  /* Align date inputs width with search input in iPad */
  .custom-date-from,
  .custom-date-to {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  /* Ensure search input takes full width */
  .custom-search-input {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
}

@media (min-width: 1025px) {
  .custom-search-input {
    width: 400px !important;
    min-width: 0 !important;
    max-width: 700px !important;
  }
  .custom-date-from,
  .custom-date-to {
    width: 220px !important;
    min-width: 0 !important;
    max-width: 300px !important;
  }
}
</style>
