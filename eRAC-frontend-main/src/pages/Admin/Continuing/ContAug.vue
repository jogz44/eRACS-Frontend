<template>
  <q-page class="q-pa-md contaug-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">Continuing Augmentation</div>
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
          placeholder="Search..."
          v-model="store.searchQuery"
          style="min-width: 300px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- Fiscal Year Filter -->
        <q-select
          outlined
          dense
          v-model="selectedFiscalYear"
          :options="appropriationStore.fiscalYearOptions"
          label="Fiscal Year"
          style="min-width: 180px"
          emit-value
          map-options
          :loading="appropriationStore.loading"
          @update:model-value="onFiscalYearChange"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                No fiscal years found
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-btn
          dense
          outlined
          color="negative"
          icon="clear"
          @click="clearAllFilters"
        />

        <q-space />
<!--
        <q-btn
          label="Add"
          icon="add"
          color="primary"
          @click="store.openDialog('augmentation')"
        /> -->
      </div>

      <!-- Augmentation Main Table -->
      <q-card flat bordered class="q-mt-md">
        <q-table
          :rows="store.augmentation"
          :columns="store.augmentationColumns"
          row-key="id"
          :pagination="store.pagination"
          flat
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="q-gutter-xs">
                <!-- <q-btn
                  dense
                  icon="edit"
                  color="orange"
                  @click="store.editDisbursement(props.row)"
                /> -->
                <q-btn
                  dense
                  icon="visibility"
                  color="blue"
                  @click="store.openLiquidationTable(props.row)"
                />
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-remarks="props">
            <q-td :props="props">
              <q-btn
                dense
                :icon="isAugmentationReviewed(props.row.id) ? 'check' : 'rate_review'"
                :label="isAugmentationReviewed(props.row.id) ? 'Reviewed' : 'Review'"
                :color="isAugmentationReviewed(props.row.id) ? 'positive' : 'primary'"
                :outline="!isAugmentationReviewed(props.row.id)"
                :disable="isAugmentationReviewed(props.row.id)"
                :unelevated="!isAugmentationReviewed(props.row.id)"
                rounded
                @click="!isAugmentationReviewed(props.row.id) && handleAugmentationReviewClick(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card>

      <!-- Augmentation Dialog -->
      <q-dialog v-model="store.dialogs.augmentation" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 700px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Augmentation</div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <!-- Date Field -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">Date:</q-item-label>
                <q-input
                  outlined
                  dense
                  v-model="store.forms.augmentation.date"
                  mask="##/##/####"
                  @keydown.enter="handleEnterKey"
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
                <q-input
                  outlined
                  dense
                  v-model="store.forms.augmentation.refNo"
                  @keydown.enter="handleEnterKey"
                />
              </div>

              <!-- Remarks -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">Remarks:</q-item-label>
                <q-input
                  outlined
                  dense
                  v-model="store.forms.augmentation.remarks"
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
                @click="store.openDialog('augExpense')"
              />
            </div>

            <!-- Expense Table -->
            <q-table
              :rows="store.Augexpenses"
              :columns="store.expenseAugColumns"
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

            <!-- Amount Field -->
            <div class="q-mt-md">
              <q-item-label class="q-mb-xs">Amount:</q-item-label>
              <q-input
                outlined
                readonly
                dense
                prefix="₱"
                style="width: 300px"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              label="Cancel"
              @click="store.closeDialog('augmentation')"
            />
            <q-btn label="Save" color="primary" @click="handleSaveClick" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Expense Selection Dialog -->
      <q-dialog v-model="store.dialogs.augExpense">
        <q-card style="min-width: 600px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Select Expense Account</div>
          </q-card-section>

          <q-card-section>
            <q-input
              outlined
              dense
              placeholder="Search expense account..."
              v-model="store.expenseSearch"
              class="q-mb-md"
              style="width: 300px"
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
            <q-btn flat label="Cancel" @click="store.closeDialog('augExpense')" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Expense Detail Dialog -->
      <q-dialog v-model="store.dialogs.AugexpenseDetail">
        <q-card style="min-width: 500px">
          <q-card-section class="q-pb-none">
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

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              label="Cancel"
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
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useContAugmentationStore } from 'stores/contAugmentation'
import { useAppropriationStore } from 'stores/appropriationStore'
import { usePageLogging } from '../../../composables/usePageLogging'

// Local reviewed state for augmentation rows
const augmentationReviewedSet = ref(new Set())

const isAugmentationReviewed = (id) => augmentationReviewedSet.value.has(id)

const handleAugmentationReviewClick = (row) => {
  // Add the augmentation to reviewed set
  augmentationReviewedSet.value.add(row.id)

  $q.notify({
    type: 'positive',
    message: 'Augmentation reviewed successfully!',
    icon: 'check_circle',
    position: 'top',
  })
}

const $q = useQuasar()
const store = useContAugmentationStore()
const loading = ref(false)
const appropriationStore = useAppropriationStore()
const { logPageVisit } = usePageLogging()

const selectedFiscalYear = computed({
  get: () => appropriationStore.selectedFiscalYear,
  set: (value) => appropriationStore.setSelectedFiscalYear(value)
})

const onFiscalYearChange = (value) => {
  if (value !== appropriationStore.selectedFiscalYear) {
    appropriationStore.setSelectedFiscalYear(value)
    loadPendingUsers() // Refresh data when fiscal year changes
  }
}

onMounted(async () => {
  try {
    await appropriationStore.initialize()
    // Log page visit
    await logPageVisit('Continuing Augmentation')
  } catch (error) {
    console.error('Failed to initialize fiscal years:', error)
  }
})

const validateAndSave = () => {
  if (store.dialogs.augmentation) {
    const form = store.forms.augmentation
    const hasRequiredFields = form.date && form.refNo && form.remarks

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

const clearAllFilters = () => {
  store.searchQuery = ''
  store.dateFrom = ''
  store.dateTo = ''
  // Reset fiscal year to current year if available, otherwise first available year
  const currentYear = new Date().getFullYear().toString()
  const defaultYear = appropriationStore.fiscalYears.includes(currentYear)
    ? currentYear
    : appropriationStore.fiscalYears[0]
  appropriationStore.setSelectedFiscalYear(defaultYear)
}
</script>

<style scoped>
.contaug-page {
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
  .col-sm-6 {
    width: 100%;
    margin-bottom: 8px;
  }
}
</style>
