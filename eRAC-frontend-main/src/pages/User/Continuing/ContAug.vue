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
          <!-- <q-input
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
          </q-input> -->

          <!-- To Label -->
          <div class="t q-px-xs"></div>
          <div class="t q-px-xs"></div>

          <!-- To Date -->
          <!-- <q-input
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
          </q-input> -->
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
        <q-card class="responsive-dialog-card">
          <q-card-section class="dialog-header">
            <div class="text-h6">Augmentation</div>
          </q-card-section>
          <q-card-section class="dialog-content">
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
          <q-card-section class="dialog-content">
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
              class="responsive-table"
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
              <q-input filled outlined readonly="true" dense prefix="₱" class="responsive-amount-input" />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="dialog-actions">
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
        <q-card class="responsive-dialog-card">
          <q-card-section class="dialog-header">
            <div class="text-h6">Select Expense Account</div>
          </q-card-section>

          <q-card-section class="dialog-content">
            <q-input
              outlined
              dense
              placeholder="Search expense account..."
              v-model="store.expenseSearch"
              class="responsive-search-input q-mb-md"
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
              class="responsive-table"
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

          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancel" color="negative" @click="store.closeDialog('augExpense')" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!--Expense Detail Dialog -->
      <q-dialog v-model="store.dialogs.AugexpenseDetail">
        <q-card class="responsive-dialog-card">
          <q-card-section class="dialog-header">
            <div class="text-h6">Add Expense</div>
          </q-card-section>

          <q-card-section class="dialog-content">
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

          <q-card-actions align="right" class="dialog-actions">
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

/* Dialog Responsive Styles */
.responsive-dialog-card {
  min-width: 400px;
  max-width: 90vw;
  max-height: 85vh;
}

.dialog-header {
  border-bottom: 1px solid #e0e0e0;
  padding: 16px;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
}

.dialog-actions {
  border-top: 1px solid #e0e0e0;
  padding: 16px;
}

.responsive-search-input {
  min-width: 200px;
  flex: 1;
}

.responsive-amount-input {
  width: 100%;
  max-width: 300px;
}

.responsive-table {
  font-size: 14px;
}

/* Mobile Styles (up to 768px) */
@media (max-width: 768px) {
  .responsive-dialog-card {
    min-width: 80vw;
    max-width: 80vw;
    max-height: 60vh;
  }

  .responsive-search-input {
    width: 100%;
    max-width: 100%;
  }

  .responsive-amount-input {
    max-width: 100%;
  }

  .responsive-table {
    font-size: 12px;
  }

  /* Align form fields width for mobile */
  .dialog-content .row.q-col-gutter-md .col-md-4 {
    width: 100% !important;
    margin-bottom: 12px;
  }

  .dialog-content .row.q-col-gutter-md .col-md-4:last-child {
    margin-bottom: 0;
  }

  /* Ensure all form inputs have consistent width on mobile */
  .dialog-content .q-input {
    width: 100% !important;
  }

  /* Make q-table more responsive and visible */
  .q-table {
    font-size: 11px !important;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin: 8px 0;
  }

  .q-table thead {
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
    background-color: #f5f5f5 !important;
  }

  .q-table th {
    padding: 8px 4px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    background-color: #f5f5f5 !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
  }

  .q-table td {
    padding: 6px 4px !important;
    font-size: 11px !important;
    vertical-align: middle !important;
  }

  .q-table tbody tr {
    border-bottom: 1px solid #f0f0f0 !important;
  }

  .q-table tbody tr:hover {
    background-color: #f8f8f8 !important;
  }

  /* Reduce table height on mobile to leave space for buttons */
  .responsive-table {
    max-height: 120px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin: 8px 0;
  }

  /* Ensure table body scrolls while header stays fixed */
  .q-table__container {
    max-height: 120px;
    overflow-y: auto;
  }

  .q-table__container thead {
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
    background-color: #f5f5f5 !important;
  }

  .dialog-content {
    max-height: 40vh;
    overflow-y: auto;
  }

  /* Ensure dialog actions are always visible */
  .dialog-actions {
    position: sticky;
    bottom: 0;
    background: white;
    border-top: 1px solid #e0e0e0;
    padding: 10px 16px;
    z-index: 10;
    margin-top: 8px;
  }

  /* Reduce padding in dialog sections for mobile */
  .dialog-header {
    padding: 8px;
  }

  .dialog-content {
    padding: 8px;
    padding-bottom: 6px;
  }

  /* Make buttons more prominent on mobile */
  .dialog-actions .q-btn {
    min-height: 36px;
    font-size: 14px;
    font-weight: 500;
  }

  /* Ensure proper spacing for the dialog */
  .q-dialog__inner {
    padding: 12px;
  }

  /* Reduce spacing between elements */
  .q-mb-md {
    margin-bottom: 8px !important;
  }

  .q-mt-md {
    margin-top: 8px !important;
  }

  /* Reduce table pagination height */
  .q-table__bottom {
    padding: 4px 8px;
    font-size: 10px !important;
  }

  /* Improve table pagination controls */
  .q-table__bottom .q-field {
    font-size: 10px !important;
  }

  .q-table__bottom .q-select {
    font-size: 10px !important;
  }

  /* Add spacing around table */
  .q-table-container {
    margin: 8px 0;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }

  /* Improve button group spacing in table */
  .button-group {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
  }

  .button-group .q-btn {
    min-width: 28px;
    min-height: 28px;
    font-size: 10px;
  }
}

/* iPad Styles (768px to 1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
  .responsive-dialog-card {
    min-width: 85vw;
    max-width: 85vw;
    max-height: 80vh;
  }

  .responsive-search-input {
    min-width: 300px;
  }

  .responsive-amount-input {
    max-width: 250px;
  }

  .responsive-table {
    font-size: 13px;
  }
}

/* Small Monitor Styles (1025px to 1366px) */
@media (min-width: 1025px) and (max-width: 1366px) {
  .responsive-dialog-card {
    min-width: 800px;
    max-width: 85vw;
    max-height: 80vh;
  }

  .responsive-search-input {
    min-width: 350px;
  }

  .responsive-amount-input {
    max-width: 300px;
  }
}

/* Large Monitor Styles (1367px and above) */
@media (min-width: 1367px) {
  .responsive-dialog-card {
    min-width: 900px;
    max-width: 80vw;
    max-height: 75vh;
  }

  .responsive-search-input {
    min-width: 400px;
  }

  .responsive-amount-input {
    max-width: 350px;
  }
}

/* Landscape Mobile Styles */
@media (max-width: 768px) and (orientation: landscape) {
  .dialog-content {
    max-height: 60vh;
  }
}

/* Portrait Mobile Styles */
@media (max-width: 768px) and (orientation: portrait) {
  .dialog-content {
    max-height: 70vh;
  }
}

/* Ensure proper scrolling on all devices */
.q-dialog__inner--minimized > div {
  max-height: 100vh;
  overflow-y: auto;
}

/* Button group responsive styles */
.button-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .button-group {
    flex-direction: column;
    gap: 2px;
  }
  
  .button-group .q-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Table responsive improvements */
@media (max-width: 768px) {
  .q-table {
    font-size: 12px;
  }
  
  .q-table th,
  .q-table td {
    padding: 4px 6px;
  }
}

/* Ensure proper spacing in dialogs */
.q-card-section {
  padding: 16px;
}

@media (max-width: 768px) {
  .q-card-section {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .q-card-section {
    padding: 8px;
  }
}
</style>
