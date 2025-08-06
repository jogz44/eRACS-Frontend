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

          <!-- Add Button Disbursement -->
          <q-btn
            label="Add"
            icon="add"
            class="add-table-btn"
            @click="store.openDialog('disbursement')"
          />
          
          <!-- Clear All Filters Button -->
          <q-btn
            dense
            outlined
            color="red-10"
            icon="clear_all"
            label="Clear All"
            @click="clearAllFilters"
            class="clear-all-btn"
          />
        </div>
      </div>

      <!--Disbursement Dialog-->
      <q-dialog v-model="store.dialogs.disbursement" persistent @keydown.enter="handleEnterKey">
        <q-card class="responsive-dialog-card">
          <q-card-section class="dialog-header">
            <div class="text-h6">Disbursement</div>
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
                  v-model="store.forms.disbursement.bank"
                  :options="['BDO', 'Metro Bank', 'BPI', 'PNB']"
                  @keydown.enter="handleEnterKey"
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
          <q-card-section class="dialog-content">
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

            <!-- Amount Display -->
            <div class="q-mt-md">
              <q-item-label class="q-mb-xs">Amount:</q-item-label>
              <q-input
                filled
                outlined
                dense
                :model-value="`₱${(store.totalExpensesAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
                class="responsive-amount-input"
                readonly
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="dialog-actions">
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

const validateAndSave = () => {
  // Check if disbursement dialog is open
  if (store.dialogs.disbursement) {
    // Validate required fields before saving
    const form = store.forms.disbursement
    const hasRequiredFields = form.date && 
                             form.bank && 
                             form.checkNumber && 
                             form.dvNumber && 
                             form.payee
    
    // Check if expenses are added
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
    
    // If validation passes, proceed with save
    store.saveDisbursement()
  }
}

const handleEnterKey = (event) => {
  // Prevent default behavior to avoid form submission
  event.preventDefault()
  validateAndSave()
}

const handleSaveClick = () => {
  validateAndSave()
}

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

const clearAllFilters = () => {
  store.searchQuery = ''
  store.dateFrom = ''
  store.dateTo = ''
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

.custom-search-input {
  min-width: 450px;
}

.clear-all-btn {
  min-width: 120px;
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
    max-width: 1200px !important;
  }
  .custom-date-from,
  .custom-date-to {
    width: 250px !important;
    min-width: 0 !important;
    max-width: 350px !important;
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
    min-width: 85vw;
    max-width: 85vw;
    max-height: 25vh;
    display: flex;
    flex-direction: column;
  }

  .responsive-amount-input {
    max-width: 100%;
  }

  .responsive-table {
    font-size: 12px;
  }

  /* Align form fields width for mobile */
  .dialog-content .row.q-col-gutter-md .col-md-4,
  .dialog-content .row.q-col-gutter-md .col-sm-6,
  .dialog-content .row.q-col-gutter-md .col-sm-12 {
    width: 100% !important;
    margin-bottom: 2px;
  }

  .dialog-content .row.q-col-gutter-md .col-md-4:last-child,
  .dialog-content .row.q-col-gutter-md .col-sm-6:last-child,
  .dialog-content .row.q-col-gutter-md .col-sm-12:last-child {
    margin-bottom: 0;
  }

  /* Ensure all form inputs have consistent width on mobile */
  .dialog-content .q-input,
  .dialog-content .q-select {
    width: 100% !important;
  }

  /* Make q-table more responsive and visible */
  .q-table {
    font-size: 9px !important;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin: 2px 0;
  }

  .q-table thead {
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
    background-color: #f5f5f5 !important;
  }

  .q-table th {
    padding: 2px 1px !important;
    font-size: 8px !important;
    font-weight: 600 !important;
    background-color: #f5f5f5 !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
  }

  .q-table td {
    padding: 1px 1px !important;
    font-size: 8px !important;
    vertical-align: middle !important;
  }

  .q-table tbody tr {
    border-bottom: 1px solid #f0f0f0 !important;
  }

  .q-table tbody tr:hover {
    background-color: #f8f8f8 !important;
  }

  /* Make table scrollable with fixed height */
  .responsive-table {
    max-height: 80px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin: 2px 0;
  }

  /* Ensure table body scrolls while header stays fixed */
  .q-table__container {
    max-height: 80px;
    overflow-y: auto;
  }

  /* Make dialog content scrollable */
  .dialog-content {
    flex: 1;
    overflow-y: auto;
    max-height: none;
    padding: 2px;
  }

  /* Ensure dialog actions are always visible */
  .dialog-actions {
    position: sticky;
    bottom: 0;
    background: white;
    border-top: 1px solid #e0e0e0;
    padding: 3px 16px;
    z-index: 10;
    margin-top: 0;
    flex-shrink: 0;
  }

  /* Reduce padding in dialog sections for mobile */
  .dialog-header {
    padding: 2px;
    flex-shrink: 0;
  }

  /* Make buttons more prominent on mobile */
  .dialog-actions .q-btn {
    min-height: 25px;
    font-size: 10px;
    font-weight: 500;
  }

  /* Ensure proper spacing for the dialog */
  .q-dialog__inner {
    padding: 2px;
  }

  /* Reduce spacing between elements */
  .q-mb-md {
    margin-bottom: 1px !important;
  }

  .q-mt-md {
    margin-top: 1px !important;
  }

  /* Reduce table pagination height */
  .q-table__bottom {
    padding: 1px 2px;
    font-size: 6px !important;
  }

  /* Improve table pagination controls */
  .q-table__bottom .q-field {
    font-size: 6px !important;
  }

  .q-table__bottom .q-select {
    font-size: 6px !important;
  }

  /* Add spacing around table */
  .q-table-container {
    margin: 2px 0;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }

  /* Improve button group spacing in table */
  .button-group {
    display: flex;
    gap: 1px;
    flex-wrap: wrap;
  }

  .button-group .q-btn {
    min-width: 18px;
    min-height: 18px;
    font-size: 6px;
  }
}

/* iPad Styles (768px to 1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
  .responsive-dialog-card {
    min-width: 85vw;
    max-width: 85vw;
    max-height: 80vh;
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

/* Mobile-specific responsive styles */
@media (max-width: 768px) {
  .responsive-dialog-card {
    min-width: 90vw !important;
    max-width: 90vw !important;
    max-height: 85vh !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .dialog-header {
    flex-shrink: 0 !important;
    padding: 12px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
  }

  .dialog-content {
    flex: 1 !important;
    overflow-y: auto !important;
    max-height: none !important;
    padding: 8px !important;
  }

  .dialog-actions {
    flex-shrink: 0 !important;
    position: sticky !important;
    bottom: 0 !important;
    background: white !important;
    z-index: 10 !important;
    padding: 8px 12px !important;
    border-top: 1px solid #e0e0e0 !important;
  }

  .dialog-actions .q-btn {
    min-height: 36px !important;
    font-size: 14px !important;
    padding: 0 16px !important;
  }

  /* Form fields take full width on mobile */
  .col-md-4, .col-sm-6, .col-sm-12 {
    width: 100% !important;
    margin-bottom: 12px !important;
  }

  /* Make table scrollable with fixed height */
  .responsive-table {
    max-height: 120px !important;
    overflow-y: auto !important;
    border: 1px solid #e0e0e0 !important;
    border-radius: 4px !important;
    margin: 4px 0 !important;
  }

  /* Ensure table body scrolls while header stays fixed */
  .q-table__container {
    max-height: 120px !important;
    overflow-y: auto !important;
  }

  /* Make table header sticky */
  .q-table thead {
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
    background-color: #f5f5f5 !important;
  }

  .q-table th {
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
    background-color: #f5f5f5 !important;
    padding: 4px 2px !important;
    font-size: 10px !important;
    font-weight: 600 !important;
  }

  .q-table td {
    padding: 2px 1px !important;
    font-size: 9px !important;
  }

  .q-table tbody tr {
    border-bottom: 1px solid #e0e0e0 !important;
  }

  .q-table tbody tr:hover {
    background-color: #f8f9fa !important;
  }

  /* Adjust table pagination */
  .q-table__bottom {
    font-size: 8px !important;
    padding: 4px !important;
  }

  /* Adjust button groups */
  .button-group .q-btn {
    min-width: 20px !important;
    min-height: 20px !important;
    font-size: 10px !important;
    padding: 2px !important;
  }

  /* Input fields */
  .responsive-amount-input {
    font-size: 12px !important;
    padding: 6px !important;
  }

  .responsive-search-input {
    font-size: 12px !important;
    padding: 6px !important;
  }
}
</style>
