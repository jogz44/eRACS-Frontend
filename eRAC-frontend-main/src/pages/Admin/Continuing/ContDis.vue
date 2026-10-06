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
      <div class="row items-center q-gutter-sm q-mb-md">
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

        <!-- Fiscal Year Filter -->
        <q-select
          outlined
          dense
          v-model="selectedFiscalYear"
          :options="fiscalYearOptions"
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

      <!-- Main Data Table -->
      <q-card flat bordered>
        <q-table
          :rows="store.disbursements"
          :columns="adminColumns"
          row-key="id"
          :pagination="store.pagination"
          flat
        >
          <template v-slot:body-cell-bank_cheque="props">
            <q-td :props="props">
              <div v-if="props.row.bank_cheques && props.row.bank_cheques.length">
                <div v-for="(c, i) in props.row.bank_cheques" :key="i" class="q-mb-xs">
                  <div class="text-weight-medium text-grey-8" style="font-size: 13px">
                    {{ c.bank_name || c.bank || '-' }}
                  </div>
                  <q-chip v-if="c.cheque_number" dense text-color="black-8" size="md" class="q-ma-none">
                    {{ c.cheque_number }}
                  </q-chip>
                </div>
              </div>
              <span v-else class="text-grey-5 text-caption">-</span>
            </q-td>
          </template>
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="q-gutter-xs">
                <!-- <q-btn
                  dense
                  icon="edit"
                  color="orange"
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
                  @click="store.openOrDetailsDialog(props.row)"
                /> -->
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-print="props">
            <q-td :props="props">
              <div class="column q-gutter-xs items-start">
                <q-btn
                  dense
                  label="Print Cheque"
                  color="teal"
                  @click="handlePrintCheque(props.row)"
                  v-permission="'print'"
                  style="width: 10em; font-size: 13px"
                />
                <q-btn
                  dense
                  label="Print Voucher"
                  color="teal"
                  @click="handlePrintVoucher(props.row)"
                  v-permission="'print'"
                  style="width: 10em; font-size: 13px"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useContDisbursementStore } from 'stores/contDisburseStore'
import { useAppropriationStore } from 'stores/appropriationStore'
import { useRoute } from 'vue-router'
import ContLiquidateDialog from 'components/contDisburse/ContOrDetails.vue'
import ContViewOr from 'components/contDisburse/ContViewOr.vue'
import { usePageLogging } from '../../../composables/usePageLogging'
import { useBankStore } from 'stores/bankStore'

const $q = useQuasar()
const route = useRoute()
const loading = ref(false)
const store = useContDisbursementStore()
const appropriationStore = useAppropriationStore()
const { logPageVisit } = usePageLogging()

const selectedRouteYear = () => {
  const year = route.query.year ? parseInt(route.query.year, 10) : null
  return year || new Date().getFullYear()
}

const fiscalYearOptions = computed(() => {
  const years = appropriationStore.fiscalYears || []

  return years
    .map((item) => {
      // appropriationStore admin years look like: { year: '2025', label: '2025' }
      if (typeof item === 'object' && item !== null) {
        const value = String(item.year ?? item.value ?? item.label ?? '')
        const label = String(item.label ?? item.year ?? item.value ?? '')
        return value ? { label, value } : null
      }

      // fallback if plain string/number
      const value = String(item)
      return value ? { label: value, value } : null
    })
    .filter(Boolean)
})

const selectedFiscalYear = computed({
  get: () => appropriationStore.selectedFiscalYear,
  set: (value) => appropriationStore.setSelectedFiscalYear(value)
})

const onFiscalYearChange = (value) => {
  appropriationStore.setSelectedFiscalYear(value)
  loadPendingUsers(value)
}

const adminColumns = computed(() => {
  return store.disbursementColumns.filter(column => ![ 'print' ].includes(column.name))
})

onMounted(async () => {
  try {
    // in ContDisbursement.vue onMounted, or in fetchDisbursements() before mapping rows
const bankStore = useBankStore()
if (!bankStore.availableBanks?.length) {
  await bankStore.fetchBanks()
}
    await store.fetchDisbursements(selectedRouteYear())
    await appropriationStore.fetchFiscalYears()

    if (!appropriationStore.selectedFiscalYear && fiscalYearOptions.value.length > 0) {
      appropriationStore.setSelectedFiscalYear(fiscalYearOptions.value[0].value)
    }
    // Log page visit
    await logPageVisit('Continuing Disbursement')
  } catch (error) {
    console.error('Failed to initialize fiscal years:', error)
  }
})


const handleEnterKey = (event) => {
  event.preventDefault()
  // Admin users cannot save - only view
}

const loadPendingUsers = async (yearOverride = null) => {
  loading.value = true
  try {
    const selected = yearOverride ?? selectedFiscalYear.value
    const yearParam = selected && selected !== 'all' ? Number(selected) : null

    await store.fetchDisbursements(yearParam)

    $q.notify({
      type: 'positive',
      message: 'Disbursement refreshed!',
      icon: 'refresh',
      position: 'top',
      timeout: 3000
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

watch(
  () => route.query.year,
  async () => {
    await store.fetchDisbursements(selectedRouteYear())
  },
)
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
