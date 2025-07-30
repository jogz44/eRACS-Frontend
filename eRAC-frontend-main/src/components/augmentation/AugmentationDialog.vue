<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card style="min-width: 1100px">
      <q-card-section>
        <div class="text-h6">Augmentation</div>
      </q-card-section>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Budget Selection -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Budget:</q-item-label>
            <q-select
              filled
              outlined
              dense
              v-model="store.forms.augmentation.budget_id"
              :options="store.availableBudgets"
              option-label="description"
              option-value="id"
              label="Select Budget"
              :rules="[(val) => !!val || 'Budget is required']"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.description }}</q-item-label>
                    <q-item-label caption>₱{{ scope.opt.current_amount?.toLocaleString() }} - {{ scope.opt.fiscal_year }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
          <!-- Date Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Date:</q-item-label>
            <q-input
              filled
              outlined
              dense
              v-model="store.forms.augmentation.augmentation_date"
              mask="##/##/####"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
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
              placeholder="Auto-generated"
            />
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
            @click="handleAddExpense"
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
          <q-item-label class="q-mb-xs">Total Amount:</q-item-label>
          <q-input 
            filled 
            outlined 
            readonly="true" 
            dense 
            prefix="₱" 
            style="width: 40%"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <q-btn
          flat
          label="Cancel"
          class="modal-cancel-btn"
          @click="store.closeDialog('augmentation')"
        />
        <q-btn label="Save" class="modal-save-btn" @click="handleSave" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAugmentationStore } from 'stores/augmentation'
import { useQuasar } from 'quasar'

const store = useAugmentationStore()
const $q = useQuasar()

// Computed property for dialog
const dialogModel = computed({
  get: () => store.dialogs?.augmentation || false,
  set: (value) => {
    if (store.dialogs) {
      store.dialogs.augmentation = value
    }
  }
})

const handleAddExpense = async () => {
  if (!store.forms.augmentation.budget_id) {
    $q.notify({
      type: 'negative',
      message: 'Please select a budget first',
      position: 'top'
    })
    return
  }
  
  await store.openDialog('augExpense')
}

const handleSave = async () => {
  if (!store.forms.augmentation.budget_id) {
    $q.notify({
      type: 'negative',
      message: 'Please select a budget',
      position: 'top'
    })
    return
  }

  if (!store.Augexpenses?.value || store.Augexpenses.value.length === 0) {
    $q.notify({
      type: 'negative',
      message: 'Please add at least one expense',
      position: 'top'
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
      position: 'top'
    })
    store.closeDialog('augmentation')
  } else {
    $q.notify({
      type: 'negative',
      message: result.error || 'Failed to save augmentation',
      position: 'top'
    })
  }
}

onMounted(async () => {
  await store.fetchAvailableBudgets()
  console.log('Available budgets in dialog:', store.availableBudgets)
})


</script>

<style scoped>
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
