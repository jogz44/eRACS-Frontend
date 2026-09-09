<template>
  <q-page class="q-pa-md cont-appr">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-medium">Continuing Appropriation</div>
          <div class="text-caption text-grey-7">
            View continuing appropriations continued from previous year
          </div>
        </div>
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
          v-model="searchQuery"
          style="min-width: 300px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-select
          outlined
          dense
          v-model="selectedFiscalYear"
          :options="appropriationStore.fiscalYearOptions"
          label="Fiscal Year"
          class="col-auto"
          style="min-width: 180px; background-color: white;"
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
    </div>

    <q-card flat bordered>
      <q-table
        flat
        :rows="filteredAppropriations"
        :columns="columns"
        :loading="appropriationStore.loading || loading"
        row-key="id"
      >
        <template v-slot:body-cell-index="props">
          <q-td :props="props">{{ props.pageIndex + 1 }}</q-td>
        </template>

        <template v-slot:body-cell-continued_date="props">
          <q-td :props="props">{{ props.row.continued_date || '-' }}</q-td>
        </template>

        <template v-slot:body-cell-year="props">
          <q-td :props="props">{{ props.row.year || '-' }}</q-td>
        </template>

        <template v-slot:body-cell-expense_class="props">
          <q-td :props="props">{{ props.row.expense_class || '-' }}</q-td>
        </template>

        <template v-slot:body-cell-amount="props">
          <q-td :props="props">
            {{ formatCurrency(props.row.appropriation || props.row.amount) }}
          </q-td>
        </template>

        <template v-slot:body-cell-total_appropriated="props">
          <q-td :props="props">
            {{ formatCurrency(props.row.total_appropriated || 0) }}
          </q-td>
        </template>

        <template v-slot:body-cell-unappropriated="props">
          <q-td :props="props">
            {{ formatCurrency(props.row.unappropriated) }}
          </q-td>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.unappropriated > 0 ? 'green' : 'grey'"
              :label="props.row.unappropriated > 0 ? 'Available for Disbursement' : 'Fully Disbursed'"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <q-btn
              dense
              icon="visibility"
              color="blue"
              @click="viewDetails(props.row)"
            />
          </q-td>
        </template>

        <template v-slot:no-data>
          <div class="full-width row flex-center q-pa-lg text-grey-6">
            <div class="text-center">
              <q-icon name="info" size="2em" class="q-mb-sm" />
              <div>No continuing appropriations found for the selected filters.</div>
            </div>
          </div>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="showViewDialog">
      <q-card style="min-width: 900px; max-width: 90vw">
        <q-card-section class="q-pb-none">
          <div class="row items-center justify-between">
            <div class="text-h6">View Appropriation Details</div>
            <q-btn icon="close" flat round dense @click="showViewDialog = false" />
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row q-mb-md q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="text-caption">Description:</div>
              <strong>{{ selectedRow.description || '-' }}</strong>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption">Continued Date:</div>
              <strong>{{ selectedRow.continued_date || '-' }}</strong>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption">Total Amount:</div>
              <strong>{{ formatCurrency(selectedRow.amount) }}</strong>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption">Available for Disbursement:</div>
              <strong>{{ formatCurrency(selectedRow.unappropriated) }}</strong>
            </div>
          </div>

          <div class="text-h6 text-weight-medium q-mb-sm">
            Accounts Continued from Year {{ selectedRow.year || 'Previous Year' }}
          </div>

          <div class="hierarchical-table" style="border: 1px solid #e0e0e0">
            <div class="row q-pa-sm bg-grey-2 text-weight-medium">
              <div class="col-6">Account</div>
              <div class="col-6 text-right">Remaining Balance (₱)</div>
            </div>

            <template v-if="selectedRow.accounts && selectedRow.accounts.length > 0">
              <div
                v-for="account in selectedRow.accounts"
                :key="'account-' + account.id"
                class="row q-pa-sm"
                style="border-bottom: 1px solid #f0f0f0"
              >
                <div class="col-6">
                  <div class="text-weight-medium">{{ account.accountName || 'Unknown Account' }}</div>
                </div>
                <div class="col-6 text-right">
                  <div class="text-weight-medium">{{ formatCurrency(account.balance) }}</div>
                </div>
              </div>
            </template>
            <div v-else class="row q-pa-sm">
              <div class="col-12 text-center text-grey-6">No account details available</div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { usePageLogging } from '../../../composables/usePageLogging'
import { storeToRefs } from 'pinia'
import { useContApprStore } from 'stores/contApprStore'

const $q = useQuasar()
const appropriationStore = useContApprStore()
const { continuingAppropriations } = storeToRefs(appropriationStore)
const loading = ref(false)
const { logPageVisit } = usePageLogging()

const searchQuery = ref('')
const showViewDialog = ref(false)
const selectedRow = ref({
  id: null,
  amount: 0,
  unappropriated: 0,
  description: '',
  continued_date: '',
  year: '',
  accounts: [],
})

const selectedFiscalYear = computed({
  get: () => appropriationStore.selectedFiscalYear,
  set: (value) => appropriationStore.setSelectedFiscalYear(value),
})

const columns = [
  { name: 'index', label: '#', field: 'index', align: 'left', sortable: false },
  { name: 'continued_date', label: 'Continued Date', field: 'continued_date', align: 'left', sortable: true },
  { name: 'year', label: 'Year', field: 'year', align: 'left', sortable: true },
  { name: 'expense_class', label: 'Expense Class', field: 'expense_class', align: 'left', sortable: true },
  { name: 'description', label: 'Description', field: 'description', align: 'left', sortable: true },
  { name: 'amount', label: 'Total Budget', field: 'amount', align: 'right', sortable: true },
  { name: 'total_appropriated', label: 'Total Disbursed', field: 'total_appropriated', align: 'right', sortable: true },
  { name: 'unappropriated', label: 'Available for Disbursement', field: 'unappropriated', align: 'right', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'action', label: 'Action', field: 'action', align: 'center' },
]

const filteredAppropriations = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return (continuingAppropriations.value || []).filter((row) => {
    return (
      String(row.description || '').toLowerCase().includes(query) ||
      String(row.expense_class || '').toLowerCase().includes(query) ||
      String(row.year || '').includes(query)
    )
  })
})

const loadPendingUsers = async () => {
  loading.value = true
  try {
    await appropriationStore.fetchYears()
    await appropriationStore.fetchContinuingAppropriations(appropriationStore.selectedYear)
    $q.notify({
      type: 'positive',
      message: 'Appropriation refreshed!',
      icon: 'refresh',
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || error.message || 'Failed to refresh data',
      icon: 'error',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const onFiscalYearChange = async (value) => {
  if (value === appropriationStore.selectedFiscalYear) return
  appropriationStore.setSelectedFiscalYear(value)
  loading.value = true
  try {
    await appropriationStore.fetchContinuingAppropriations(value)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || error.message || 'Failed to load data',
      icon: 'error',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const clearAllFilters = () => {
  searchQuery.value = ''
  if (appropriationStore.fiscalYearOptions.length > 0) {
    const defaultYear = appropriationStore.fiscalYearOptions[0].value
    onFiscalYearChange(defaultYear)
  }
}

const viewDetails = (row) => {
  selectedRow.value = {
    ...row,
    amount: row.appropriation || row.amount,
    unappropriated: row.unappropriated,
    year: row.year,
    description: row.description,
    continued_date: row.continued_date,
    accounts: row.accounts || [],
  }
  showViewDialog.value = true
}

const formatCurrency = (value) => {
  if (!value && value !== 0) return '₱0.00'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value)
}

onMounted(async () => {
  try {
    await appropriationStore.initialize()
    await logPageVisit('Continuing Appropriation')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || error.message || 'Failed to load data',
      icon: 'error',
      position: 'top',
    })
  }
})
</script>

<style scoped>
.cont-appr {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.hierarchical-table {
  border-radius: 4px;
  overflow: hidden;
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
}
</style>