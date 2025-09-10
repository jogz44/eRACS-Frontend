<template>
  <q-page class="q-pa-md cont-appr">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
        <div class="text-h6 text-weight-medium">Continuing Appropriation</div>
          <div class="text-caption text-grey-7">
            Continue accounts with remaining balances from previous year for disbursement
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

    <!-- Filters Section -->
    <q-card flat bordered class="q-mb-md filters-section">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Search Input -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Search:</q-item-label>
            <q-input
              outlined
              dense
              v-model="searchQuery"
              placeholder="Search description..."
              clearable
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Date Range Filter -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Date Range:</q-item-label>
            <q-input
              outlined
              dense
              v-model="dateRangeDisplay"
              placeholder="Select date range..."
              readonly
              clearable
              @clear="onDateRangeClear"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="dateRange"
                      range
                      @update:model-value="onDateRangeChange"
                    >
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Clear Button -->
          <div class="col-md-1 col-sm-6 col-xs-12">
            <q-btn
              dense
              outlined
              color="red-10"
              icon="clear_all"
              label="Clear"
              @click="clearAllFilters"
              class="full-width"
            />
          </div>

          <!-- Flexible spacer to push Continue button to the right -->
          <div class="col"></div>

          <!-- Continue Button -->
          <div class="col-auto">
            <q-btn
              label="Continue Previous Year Accounts"
              @click="openContinueDialog"
              color="secondary"
              v-permission="'add'"
              :loading="generalLoading"
              class="full-width btn-match-input"
              icon="forward"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Dialog for Selecting Accounts -->
    <q-dialog v-model="showContinueDialog" @keydown.enter="handleEnterKey">
      <q-card style="min-width: 700px; max-width: 90vw">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Continue Accounts from Previous Year</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Select accounts that had remaining balances from the previous year to continue for disbursement
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row items-center q-gutter-sm q-mb-md">
            <q-input
              dense
              outlined
              debounce="300"
              v-model="dialogSearchQuery"
              placeholder="Search accounts..."
              style="min-width: 250px"
              @keydown.enter="handleEnterKey"
            />
          </div>

          <q-table
            :rows="filteredDialogAccounts"
            :columns="continueColumns"
            row-key="id"
            selection="multiple"
            v-model:selected="selectedAccounts"
            :pagination="{ rowsPerPage: 0 }"
            style="max-height: 400px"
            flat
            bordered
          >
            <template v-slot:header-selection="scope">
              <q-checkbox color="secondary" v-model="scope.selected" />
            </template>
            <template v-slot:body-selection="scope">
              <q-checkbox color="secondary" v-model="scope.selected" />
            </template>

            <template v-slot:body-cell-balance="props">
              <q-td :props="props">
                <div class="text-weight-medium text-green">
                  {{ formatCurrency(props.row.balance) }}
                </div>
                <div class="text-caption text-grey-6">
                  Available for disbursement
                </div>
              </q-td>
            </template>
          </q-table>

          <!-- Summary of selected accounts -->
          <div v-if="selectedAccounts.length > 0" class="q-mt-md">
            <q-card flat bordered class="bg-blue-1">
              <q-card-section class="q-py-sm">
                <div class="text-subtitle2 text-weight-medium q-mb-xs">
                  Selected Accounts Summary
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-6">
                    <div class="text-caption text-grey-7">Number of Accounts:</div>
                    <div class="text-weight-medium">{{ selectedAccounts.length }}</div>
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-7">Total Amount:</div>
                    <div class="text-weight-medium text-green">
                      {{ formatCurrency(selectedAccounts.reduce((sum, acc) => sum + acc.balance, 0)) }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <q-input
            outlined
            v-model="description"
            label="Description"
            type="text"
            placeholder="e.g., Carried-over balances from previous year for continued disbursement"
            class="q-mt-md"
            @keydown.enter="handleEnterKey"
            hint="Describe the purpose of continuing these accounts"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" @click="handleCancelContinue" />
          <q-btn
            label="Continue Accounts"
            color="primary"
            @click="handleContinueClick"
            :disable="selectedAccounts.length === 0 || !description"
            :loading="loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Main Data Table -->
    <q-card flat bordered>
      <q-table
        :rows="filteredAppropriations"
        :columns="columns"
        :loading="loading"
        row-key="id"
        flat
      >
        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ props.pageIndex + 1 }}
          </q-td>
        </template>

        <template v-slot:body-cell-continued_date="props">
          <q-td :props="props">
            {{ props.row.continued_date || '-' }}
          </q-td>
        </template>

        <template v-slot:body-cell-year="props">
          <q-td :props="props">
            {{ props.row.year || '-' }}
          </q-td>
        </template>

        <template v-slot:body-cell-expense_class="props">
          <q-td :props="props">
            {{ props.row.expense_class || '-' }}
          </q-td>
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

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-xs">
              <q-btn
                dense
                icon="visibility"
                color="blue"
                @click="openViewDialog(props.row)"
                v-permission="'view'"
              />
            </div>
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
      </q-table>
    </q-card>



    <!-- View Dialog -->
    <q-dialog v-model="showViewDialog">
      <q-card style="min-width: 900px; max-width: 90vw">
        <q-card-section class="q-pb-none">
          <div class="row items-center justify-between">
            <div class="text-h6">View Appropriation Details</div>
            <q-btn icon="close" flat round dense @click="showViewDialog = false" />
          </div>
        </q-card-section>

        <q-card-section>
          <!-- Summary section -->
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

          <!-- Original Accounts from Previous Year -->
            <div class="q-mb-md">
              <div class="text-h6 text-weight-medium q-mb-sm">
              Accounts Continued from Year {{ selectedRow.year || 'Previous Year' }}
              </div>
              <div class="text-caption q-mb-sm">
              These accounts had remaining balances from the previous year and are now available for disbursement
              </div>

              <div class="hierarchical-table" style="border: 1px solid #e0e0e0">
                <div class="row q-pa-sm bg-grey-2 text-weight-medium">
                  <div class="col-6">Account</div>
                <div class="col-6 text-right">Remaining Balance (₱)</div>
                </div>

                <div class="hierarchical-body">
                <template v-if="selectedRow.accounts && selectedRow.accounts.length > 0">
                  <div
                    v-for="account in selectedRow.accounts"
                    :key="'account-' + account.id"
                    class="row q-pa-sm"
                    style="border-bottom: 1px solid #f0f0f0"
                  >
                          <div class="col-6">
                            <div class="text-weight-medium">
                        {{ account.accountName || 'Unknown Account' }}
                            </div>
                          </div>
                          <div class="col-6 text-right">
                      <div class="text-weight-medium">{{ formatCurrency(account.balance) }}</div>
                          </div>
                        </div>
                      </template>
                <div v-else class="row q-pa-sm">
                  <div class="col-12 text-center text-grey-6">
                    <q-icon name="info" size="1.5em" class="q-mb-xs" />
                    <div>No account details available</div>
                    </div>
                  </div>
                </div>
            </div>
            </div>

          <!-- Status Information -->
          <div class="q-mb-md">
            <div class="text-h6 text-weight-medium q-mb-sm">Status Information</div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-card flat bordered class="q-pa-md">
                  <div class="text-caption text-grey-7">Current Status</div>
                  <div class="text-h6" :class="selectedRow.unappropriated > 0 ? 'text-green' : 'text-grey'">
                    {{ selectedRow.unappropriated > 0 ? 'Available for Disbursement' : 'Fully Disbursed' }}
                  </div>
      </q-card>
          </div>
              <div class="col-12 col-sm-6">
                <q-card flat bordered class="q-pa-md">
                  <div class="text-caption text-grey-7">Total Disbursed</div>
                  <div class="text-h6 text-primary">
                    {{ formatCurrency(selectedRow.amount - selectedRow.unappropriated) }}
            </div>
      </q-card>
            </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'
import { useContApprStore } from 'src/stores/contApprStore'
import { usePageLogging } from '../../../composables/usePageLogging'
// import { api } from 'src/boot/axios'

const $q = useQuasar()
const contApprStore = useContApprStore()
const { continueAccounts, continuingAppropriations } = storeToRefs(contApprStore)

const loading = ref(false)
const showContinueDialog = ref(false)
const showViewDialog = ref(false)
const description = ref('')
const selectedAccounts = ref([])
const searchQuery = ref('')
const dialogSearchQuery = ref('')
const generalLoading = ref(true)
const dateRange = ref(null)

// View dialog state variables
const selectedRow = ref({
  id: null,
  amount: 0,
  unappropriated: 0,
  description: '',
  continued_date: '',
  year: '',
  accounts: []
})

const continueColumns = [
  {
    name: 'year',
    label: 'Year',
    field: 'year',
    align: 'center',
    sortable: true
  },
  {
    name: 'accountName',
    label: 'Account Name',
    field: 'accountName',
    align: 'left',
    sortable: true
  },
  {
    name: 'balance',
    label: 'Remaining Balance',
    field: 'balance',
    align: 'right',
    sortable: true
  },
]

// Use store data instead of local state
const mergedAppropriations = computed(() => {
  return continuingAppropriations.value || []
})

const columns = [
  {
    name: 'index',
    label: '#',
    field: 'index',
    align: 'left',
    sortable: false,
  },
  {
    name: 'continued_date',
    label: 'Continued Date',
    field: 'continued_date',
    align: 'left',
    sortable: true,
  },
  {
    name: 'year',
    label: 'Year',
    field: 'year',
    align: 'left',
    sortable: true,
  },
  {
    name: 'expense_class',
    label: 'Expense Class',
    field: 'expense_class',
    align: 'left',
    sortable: true,
  },
  {
    name: 'description',
    label: 'Description',
    field: 'description',
    align: 'left',
    sortable: true,
  },
  {
    name: 'amount',
    label: 'Total Budget',
    field: 'amount',
    align: 'right',
    sortable: true,
  },
  {
    name: 'total_appropriated',
    label: 'Total Disbursed',
    field: 'total_appropriated',
    align: 'right',
    sortable: true,
  },
  {
    name: 'unappropriated',
    label: 'Available for Disbursement',
    field: 'unappropriated',
    align: 'right',
    sortable: true,
  },
  {
    name: 'action',
    label: 'Action',
    align: 'center',
    field: 'action',
  },
  {
    name: 'status',
    label: 'Status',
    align: 'center',
    field: 'status',
  },
]



const filteredDialogAccounts = computed(() => {
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1

  // First filter by year (2024 or last year)
  const yearFilteredAccounts = continueAccounts.value.filter((account) => {
    const accountYear = parseInt(account.year)
    return accountYear === 2024 || accountYear === lastYear
  })

  // Only allow accounts that are CAPITAL OUTLAY (in any segment)
  const capitalOutlayFiltered = yearFilteredAccounts.filter((account) => {
    const name = String(account.accountName || '').toLowerCase()
    return name.includes('capital outlay')
  })

  if (!dialogSearchQuery.value) return capitalOutlayFiltered

  return capitalOutlayFiltered.filter((account) =>
    Object.values(account).join(' ').toLowerCase().includes(dialogSearchQuery.value.toLowerCase()),
  )
})

const filteredAppropriations = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1

  return mergedAppropriations.value.filter((row) => {
    // Only show data from 2024 or last year
    const rowYear = parseInt(row.year)
    const isCurrentOrLastYear = rowYear === 2024 || rowYear === lastYear

    if (!isCurrentOrLastYear) {
      return false
    }

    return (
      row.description.toLowerCase().includes(query) ||
      row.expense_class?.toLowerCase().includes(query) ||
      row.year?.toString().includes(query)
    )
  })
})



const loadPendingUsers = async () => {
  loading.value = true
  try {
    // Refresh both continue accounts and continuing appropriations
    await Promise.all([
      contApprStore.fetchContinueAccounts(),
      contApprStore.fetchContinuingAppropriations()
    ])

    $q.notify({
      type: 'positive',
      message: 'Continuing appropriation data refreshed!',
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

const dateRangeDisplay = computed(() => {
  if (!dateRange.value || !dateRange.value.from || !dateRange.value.to) {
    return ''
  }
  const fromDate = new Date(dateRange.value.from).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
  const toDate = new Date(dateRange.value.to).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
  return `${fromDate} - ${toDate}`
})

const onDateRangeChange = (newRange) => {
  if (newRange && newRange.from && newRange.to) {
    // const fromDate = new Date(newRange.from)
    // const toDate = new Date(newRange.to)
    // Store date range in appropriate format for the store
    // You may need to adjust this based on your store's date handling
  }
}

const onDateRangeClear = () => {
  dateRange.value = null
}

const clearAllFilters = () => {
  searchQuery.value = ''
  dialogSearchQuery.value = ''
  dateRange.value = null
}

const validateAndContinue = () => {
  if (showContinueDialog.value) {
    const hasSelectedAccounts = selectedAccounts.value && selectedAccounts.value.length > 0
    const hasDescription = description.value && description.value.trim() !== ''

    if (!hasSelectedAccounts) {
      $q.notify({
        type: 'negative',
        message: 'Please select at least one account to continue',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    if (!hasDescription) {
      $q.notify({
        type: 'negative',
        message: 'Please provide a description before continuing',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    continueSelected()
  }
}

const handleEnterKey = (event) => {
  event.preventDefault()
  validateAndContinue()
}

const handleContinueClick = () => {
  validateAndContinue()
}

const handleCancelContinue = () => {
  // Clear selections and close dialog
  selectedAccounts.value = []
  description.value = ''
  dialogSearchQuery.value = ''
  showContinueDialog.value = false
}

const openContinueDialog = () => {
  // Clear any previous selections and open dialog
  selectedAccounts.value = []
  description.value = ''
  dialogSearchQuery.value = ''
  showContinueDialog.value = true
}

const continueSelected = async () => {
  loading.value = true
  const totalAmount = selectedAccounts.value.reduce((sum, acc) => sum + acc.balance, 0)
  const currentDate = new Date().toISOString().split('T')[0] // Format as YYYY-MM-DD for database

  // Force expense class to CAPITAL OUTLAY for continued accounts
  const expenseClass = 'CAPITAL OUTLAY'

  try {
    const data = {
      description: description.value,
      fiscal_year_id: contApprStore.selectedYear,
      expense_class: expenseClass,
      appropriation_amount: totalAmount,
      unappropriated_amount: totalAmount,
      continued_date: currentDate,
      accounts: selectedAccounts.value.map((acc) => ({
        id: acc.id,
        balance: acc.balance,
      })),
    }

    const result = await contApprStore.createContinuingAppropriation(data)

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: `Successfully continued ${selectedAccounts.value.length} accounts with total amount of ${formatCurrency(totalAmount)}. These accounts are now available for disbursement.`,
        icon: 'check_circle',
        position: 'top',
        timeout: 5000
      })

      // No need to remove accounts from frontend - backend will filter them out on next fetch

      // Refresh the continuing appropriations list
      await contApprStore.fetchContinuingAppropriations()

      selectedAccounts.value = []
      description.value = ''
      dialogSearchQuery.value = ''
      showContinueDialog.value = false
    } else {
      $q.notify({
        type: 'negative',
        message: result.message || 'Failed to create continuing appropriation',
        icon: 'error',
        position: 'top',
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'An error occurred while creating continuing appropriation',
      icon: 'error',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value) => {
  if (!value && value !== 0) return '₱0.00'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value)
}

// Utility function to safely parse currency values
// const parseCurrency = (value) => {
//   if (!value && value !== 0) return 0
//   const cleanValue = String(value).replace(/[₱,\s]/g, '')
//   const parsed = parseFloat(cleanValue)
//   return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
// }



const openViewDialog = (row) => {
  selectedRow.value = {
    ...row,
    amount: row.appropriation || row.amount,
    unappropriated: row.unappropriated,
    year: row.year,
    description: row.description,
    continued_date: row.continued_date,
    accounts: row.accounts || []
  }
  showViewDialog.value = true
}





onMounted(async () => {
  try {
    await contApprStore.fetchContinueAccounts()
    await contApprStore.fetchYears()
    await contApprStore.fetchContinuingAppropriations()

    // Log page visit
    const { logPageVisit } = usePageLogging()
    await logPageVisit('Continuing Appropriation')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to load data',
      position: 'top',
    })
  } finally {
    generalLoading.value = false
  }
})

// Watch for dialog close to clear selections
watch(showContinueDialog, (newValue) => {
  if (!newValue) {
    // Dialog was closed, clear selections
    selectedAccounts.value = []
    description.value = ''
    dialogSearchQuery.value = ''
  }
})

defineExpose({
  // No functions to expose since allocation functionality has been removed
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

.filters-section {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.hierarchical-table {
  border-radius: 4px;
  overflow: hidden;
}

.hierarchical-body {
  background: white;
}

/* Added specific styles for inputs to replace inline styles */
.search-input {
  min-width: 400px;
  background-color: white;
}

/* Responsive adjustments */
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

  .search-input {
    min-width: 100%;
  }

  /* Ensure dialog is properly sized on mobile */
  .q-dialog .q-card {
    min-width: 95vw !important;
    max-width: 95vw !important;
    width: 95vw !important;
  }
}

/* Make action buttons match dense input height and improve label styling */
.btn-match-input {
  height: 40px;
  padding: 0 16px;
  border-radius: 4px;
}

.btn-match-input :deep(.q-btn__content) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}
</style>
