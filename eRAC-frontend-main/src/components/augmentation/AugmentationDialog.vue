<template>
  <q-dialog v-model="dialogModel" persistent @keydown.enter="handleEnterKey">
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
              v-model="store.forms.augmentation.augmentation_date"
              mask="##/##/####"
              @keydown.enter="handleEnterKey"
              :readonly="store.isViewOnly"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer" v-if="!store.isViewOnly">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="store.forms.augmentation.augmentation_date"
                      mask="DD/MM/YYYY"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <!-- Ref No. -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Ref No.:</q-item-label>
            <q-input
              filled
              outlined
              dense
              v-model="store.forms.augmentation.refNo"
              readonly
              @keydown.enter="handleEnterKey"
            />
          </div>

          <!-- Remarks -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Description:</q-item-label>
            <q-input
              filled
              outlined
              dense
              v-model="store.forms.augmentation.remarks"
              @keydown.enter="handleEnterKey"
              :readonly="store.isViewOnly"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Add Expense Button -->
      <q-card-section>
        <div class="row justify-end q-mb-md">
          <div class="row align-left q-mt-sm justify-start items-start">

          </div>
          <q-btn
            label="Add"
            class="add-table-btn"
            icon="add"
            :loading="store.expenseAccountsLoading || store.loading.addExpense"
            @click="handleAddExpense"
            :disable="store.loading.addExpense"
            v-permission="'add'"
            v-if="!store.isViewOnly"
          />
        </div>

        <!-- Expense Table -->
        <q-table
          :rows="store.Augexpenses || []"
          :columns="store.expenseAugColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 5 }"
        >
          <template v-slot:body-cell-from_budget_source="props">
            <q-td :props="props">
              <q-badge
                :color="getBudgetSourceColor(props.row.from_budget_source)"
                :label="getBudgetSourceLabel(props.row.from_budget_source)"
                class="budget-source-badge"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-to_budget_source="props">
            <q-td :props="props">
              <q-badge
                :color="getBudgetSourceColor(props.row.to_budget_source)"
                :label="getBudgetSourceLabel(props.row.to_budget_source)"
                class="budget-source-badge"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-transfer_type="props">
            <q-td :props="props">
              <q-badge
                :color="getTransferTypeColor(props.row.transfer_type)"
                :label="props.row.transfer_type"
                class="transfer-type-badge"
              />
            </q-td>
          </template>
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
                  v-permission="'edit'"
                  v-if="!store.isViewOnly"
                />
              </div>
            </q-td>
          </template>
        </q-table>
        <!-- Amount Field -->
        <div class="q-mt-md">
          <q-item-label class="q-mb-xs">Total Amount:</q-item-label>
          <q-input
            filled
            outlined
            readonly
            dense
            :model-value="`₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
            style="width: 40%"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <q-btn
          flat
          :label="store.isViewOnly ? 'Close' : 'Cancel'"
          class="modal-cancel-btn"
          @click="store.closeDialog('augmentation')"
          :disable="store.loading.saveAugmentation"
        />
        <q-btn
          v-if="!store.isViewOnly"
          label="Save"
          class="modal-save-btn"
          @click="handleSaveClick"
          :loading="store.loading.saveAugmentation"
          :disable="store.loading.saveAugmentation"
          v-permission="'add'"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useAugmentationStore } from 'stores/augmentation'
import { useQuasar } from 'quasar'

const store = useAugmentationStore()
const $q = useQuasar()

// Budget source helper functions
const getBudgetSourceColor = (budgetSource) => {
  if (budgetSource?.toLowerCase().includes('annual')) {
    return 'primary'
  } else if (budgetSource?.toLowerCase().includes('supplemental')) {
    return 'secondary'
  }
  return 'grey'
}

const getBudgetSourceLabel = (budgetSource) => {
  if (budgetSource?.toLowerCase().includes('annual')) {
    return 'Annual'
  } else if (budgetSource?.toLowerCase().includes('supplemental')) {
    return 'Supplemental'
  }
  return 'Mixed'
}

const getTransferTypeColor = (transferType) => {
  if (!transferType) return 'grey'

  if (transferType.includes('Annual → Annual')) {
    return 'primary'
  } else if (transferType.includes('Supplemental → Supplemental')) {
    return 'secondary'
  } else if (transferType.includes('Annual → Supplemental') || transferType.includes('Supplemental → Annual')) {
    return 'orange' // Cross-budget transfer
  }
  return 'grey'
}

// Computed property for total amount to ensure reactivity
const totalAmount = computed(() => {
  const total = store.totalExpensesAmount || 0
  console.log('Component totalAmount computed:', total)
  return total
})

// Computed property for dialog
const dialogModel = computed({
  get: () => store.dialogs?.augmentation || false,
  set: (value) => {
    if (store.dialogs) {
      store.dialogs.augmentation = value
    }
  },
})
const handleAddExpense = async () => {
  await store.openDialog('augExpense')
}

const validateAndSave = async () => {
  // Check if augmentation dialog is open
  if (dialogModel.value) {
    // Validate required fields before saving
    const form = store.forms.augmentation
    const hasRequiredFields = form.augmentation_date && form.remarks

    // Check if expenses are added
    const hasExpenses = store.Augexpenses && store.Augexpenses.length > 0

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
    await handleSave()
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

const handleSave = async () => {
  if (!store.Augexpenses || store.Augexpenses.length === 0) {
    $q.notify({
      type: 'negative',
      message: 'Please add at least one expense',
      position: 'top',
    })
    return
  }

  // Convert date format from DD/MM/YYYY to YYYY-MM-DD for backend
  const dateParts = store.forms.augmentation.augmentation_date?.split('/')
  if (dateParts.length === 3) {
    store.forms.augmentation.augmentation_date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
  }

  const result = await store.saveAugmentation()
  if (result.success) {
    // Display the generated ref number
    const refNumber = result.data?.ref_number || 'Generated'
    $q.notify({
      type: 'positive',
      message: `Augmentation saved successfully! Ref No: ${refNumber}`,
      position: 'top',
    })
    store.closeDialog('augmentation')

    // Refresh the augmentation list after saving
    await store.fetchAugmentations()
  } else {
    $q.notify({
      type: 'negative',
      message: result.error || 'Failed to save augmentation',
      position: 'top',
    })
  }
}
</script>

<style scoped>
.budget-source-badge {
  font-size: 0.75rem;
  font-weight: 500;
}

.transfer-type-badge {
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 120px;
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
