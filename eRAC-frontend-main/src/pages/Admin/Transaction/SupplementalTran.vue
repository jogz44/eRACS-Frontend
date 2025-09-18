<template>
  <q-page class="q-pa-md supplemental-tran">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-medium">Supplemental Budget</div>
          <div class="text-caption text-grey-7">
            {{ isAdmin ? 'View supplemental budgets submitted by barangays' : 'Create supplemental budgets from unused expenses' }}
          </div>
        </div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="loadData"
          :loading="loading"
        />
      </div>
    </div>



    <!-- Filters Section -->
    <q-card flat bordered class="q-mb-md filters-section">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Search Input -->
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Search:</q-item-label>
            <q-input
              outlined
              dense
              v-model="searchQuery"
              placeholder="Search expenses..."
              clearable
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Year Filter -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Year:</q-item-label>
            <q-select
              outlined
              dense
              v-model="selectedYear"
              :options="yearOptions"
              emit-value
              map-options
              @update:model-value="onYearChange"
            />
          </div>

          <!-- Clear Button -->
          <div class="col-md-2 col-sm-6 col-xs-12">
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

          <!-- Flexible spacer -->
          <div class="col"></div>

          <!-- Selected Count Indicator and Proceed Transfer Button (hidden for admin view-only) -->
          <div class="col-auto" v-if="!isAdmin">
            <div class="row items-center q-gutter-sm">
              <div v-if="selectedExpenses.length > 0" class="text-caption text-grey-7">
                {{ selectedExpenses.length }} selected
              </div>
              <q-btn
                dense
                color="primary"
                icon="swap_horiz"
                label="Proceed Transfer"
                @click="openCreateDialog"
                :disable="selectedExpenses.length === 0"
              />
            </div>
          </div>

          <!-- Create Supplemental Budget Button -->
          <!-- <div class="col-auto">
            <q-btn
              label="Create Supplemental Budget"
              @click="scrollToSelection"
              color="primary"
              v-permission="'add'"
              :loading="loading"
              class="btn-match-input"
              icon="add"
              :disable="selectedExpenses.length === 0"
            />
          </div> -->
        </div>
      </q-card-section>
    </q-card>



    <!-- Tabs for Unused Expenses and Supplemental Budgets -->
    <q-card flat bordered>
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey tabs-green-highlight"
        active-color="positive"
        indicator-color="positive"
        align="justify"
        narrow-indicator
      >
        <q-tab v-if="!isAdmin" name="unused" label="Available Unused Expenses" />
        <q-tab name="supplemental" label="Supplemental Budgets" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <!-- Unused Expenses Tab -->
        <q-tab-panel v-if="!isAdmin" name="unused">
             <q-table
        :rows="filteredExpenses"
        :columns="columns"
        row-key="id"
        :selection="isAdmin ? undefined : 'multiple'"
        v-model:selected="selectedExpenses"
        :pagination="pagination"
        v-model:pagination="pagination"
        :loading="loading"
        @request="onRequest"
        binary-state-sort
        flat
        bordered
      >
        <template v-if="!isAdmin" v-slot:header-selection="scope">
          <q-checkbox color="primary" v-model="scope.selected" />
        </template>

        <template v-if="!isAdmin" v-slot:body-selection="scope">
          <q-checkbox color="primary" v-model="scope.selected" />
        </template>

        <template v-slot:body-cell-account_name="props">
          <q-td :props="props">
            <div class="text-weight-medium">{{ props.row.account_name }}</div>
            <div class="text-caption text-grey-6">{{ props.row.budget_description }}</div>
            <!-- Show hierarchy levels -->
            <div class="hierarchy-levels">
              <span v-if="props.row.expense_class">
                <q-icon name="folder" size="12px" />
                {{ props.row.expense_class }}
              </span>
              <span v-if="props.row.expense_type">
                <q-icon name="folder_open" size="12px" />
                {{ props.row.expense_type }}
              </span>
              <span v-if="props.row.expense_item">
                <q-icon name="description" size="12px" />
                {{ props.row.expense_item }}
              </span>
              <span v-if="props.row.expense_sub_item">
                <q-icon name="list" size="12px" />
                {{ props.row.expense_sub_item }}
              </span>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-unused_amount="props">
          <q-td :props="props">
            <div class="text-weight-medium text-green-7  text-h6">
              {{ supplementalBudgetStore.formatCurrency(props.row.unused_amount) }}
            </div>
            <div class="text-caption text-grey-6">
              Available for supplemental budget
            </div>
          </q-td>
        </template>

        <!-- Added amount input column to main table -->
        <template v-if="!isAdmin" v-slot:body-cell-amount_to_use="props">
          <q-td :props="props">
            <q-input
              :model-value="formatInputValue(props.row.amount_to_use)"
              @update:model-value="(val) => handleAmountToUseInput(props.row, val)"
              @blur="(event) => handleAmountToUseBlur(props.row, event.target.value)"
              @keypress="blockNonNumeric"
              @paste.prevent="handlePasteNumeric"
              dense
              outlined
              :disable="!selectedExpenses.some(exp => exp.id === props.row.id)"
              :rules="[
                val => {
                  const num = parseCurrency(val)
                  return num >= 0 || 'Amount cannot be negative'
                },
                val => {
                  const num = parseCurrency(val)
                  return num <= (props.row.unused_amount || 0) || `Amount cannot exceed ${supplementalBudgetStore.formatCurrency(props.row.unused_amount || 0)}`
                }
              ]"
              @focus="ensureSelected(props.row)"
              prefix="₱"
              placeholder="0.00"
              inputmode="decimal"
              pattern="\\d*\\.?\\d{0,2}"
            />
          </q-td>
        </template>

        <template v-slot:no-data>
          <div class="full-width row flex-center text-grey q-gutter-sm">
            <q-icon size="2em" name="sentiment_dissatisfied" />
            <span>No expenses available for supplemental budget</span>
          </div>
        </template>
      </q-table>
        </q-tab-panel>

        <!-- Supplemental Budgets Tab -->
        <q-tab-panel name="supplemental">
          <q-table
            :rows="filteredSupplementalBudgets"
            :columns="supplementalColumns"
            :loading="loading"
            row-key="id"
            flat
            :pagination="{ rowsPerPage: 10 }"
          >
            <template v-slot:body-cell-index="props">
              <q-td :props="props">
                {{ props.pageIndex + 1 }}
              </q-td>
            </template>

            <template v-slot:body-cell-description="props">
              <q-td :props="props">
                <div class="text-weight-medium">{{ props.row.description }}</div>
                <div class="text-caption text-grey-6">Created: {{ props.row.created_at }}</div>
              </q-td>
            </template>

            <template v-slot:body-cell-total_amount="props">
              <q-td :props="props">
                {{ supplementalBudgetStore.formatCurrency(props.row.total_amount) }}
              </q-td>
            </template>

            <template v-slot:body-cell-total_appropriated="props">
              <q-td :props="props">
                <div class="text-weight-medium text-blue">
                  {{ supplementalBudgetStore.formatCurrency(props.row.total_appropriated) }}
                </div>
                <div class="text-caption text-grey-6">
                  Allocated to expense accounts
                </div>
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

            <!-- Review/Remarks column content -->
            <template v-slot:body-cell-remarks="props">
              <q-td :props="props">
                <q-btn
                  v-if="isAdmin"
                  dense
                  :icon="isReviewed(props.row.id) ? 'check' : 'rate_review'"
                  :label="isReviewed(props.row.id) ? 'Reviewed' : 'Review'"
                  :color="isReviewed(props.row.id) ? 'positive' : 'primary'"
                  :outline="!isReviewed(props.row.id)"
                  @click="isReviewed(props.row.id) ? showRemarksDialog(props.row.id) : handleReviewClick(props.row)"
                />
              </q-td>
            </template>
          </q-table>

        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- View Dialog -->
    <q-dialog v-model="showViewDialog">
      <q-card style="min-width: 900px; max-width: 90vw">
        <q-card-section class="q-pb-none">
          <div class="row items-center justify-between">
            <div class="text-h6">View Supplemental Budget Details</div>
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
              <div class="text-caption">Created Date:</div>
              <strong>{{ selectedRow.created_at || '-' }}</strong>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption">Total Amount:</div>
              <strong>{{ supplementalBudgetStore.formatCurrency(selectedRow.total_amount) }}</strong>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption">Total Allocated:</div>
              <strong>{{ supplementalBudgetStore.formatCurrency(selectedRow.total_appropriated) }}</strong>
            </div>
          </div>

          <!-- Source Information -->
          <div class="q-mb-md">
            <div class="text-h6 text-weight-medium q-mb-sm">
              Source Information
            </div>
            <div class="text-caption q-mb-sm">
              This supplemental budget was created from unused funds from annual budget allocations
            </div>
            <q-card flat bordered class="q-pa-md bg-blue-1">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-7">Source Type:</div>
                  <div class="text-weight-medium text-primary">
                    Unused Annual Budget Funds
                  </div>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-7">Transfer Date:</div>
                  <div class="text-weight-medium">
                    {{ selectedRow.created_at || 'N/A' }}
                  </div>
                </div>
              </div>
            </q-card>
          </div>

          <!-- Allocated Funds in this supplemental budget -->
          <div class="q-mb-md">
            <div class="text-h6 text-weight-medium q-mb-sm">
              Allocated Funds in this Supplemental Budget
            </div>
            <div class="text-caption q-mb-sm">
              These funds have been allocated to specific expense accounts
            </div>

            <div class="hierarchical-table" style="border: 1px solid #e0e0e0">
              <div class="row q-pa-sm bg-grey-2 text-weight-medium">
                <div class="col-6">Account</div>
                <div class="col-6 text-right">Amount (₱)</div>
              </div>

              <div class="hierarchical-body">
                <template v-if="selectedRow.appropriations && selectedRow.appropriations.length > 0">
                  <div
                    v-for="appropriation in selectedRow.appropriations"
                    :key="'appropriation-' + appropriation.id"
                    class="row q-pa-sm"
                    style="border-bottom: 1px solid #f0f0f0"
                  >
                    <div class="col-6">
                      <div class="text-weight-medium">
                        {{ appropriation.account_name || 'Unappropriated Funds' }}
                      </div>
                      <div class="text-caption text-grey-6" v-if="!appropriation.account_name">
                        Available for allocation to expense accounts
                      </div>
                    </div>
                    <div class="col-6 text-right">
                      <div class="text-weight-medium">{{ supplementalBudgetStore.formatCurrency(appropriation.amount) }}</div>
                    </div>
                  </div>
                </template>
                <div v-else class="row q-pa-sm">
                  <div class="col-12 text-center text-grey-6">
                    <q-icon name="info" size="1.5em" class="q-mb-xs" />
                    <div>No appropriation details available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Admin Review Dialog -->
    <q-dialog v-model="showReviewDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Confirm Review</div>
        </q-card-section>
        <q-card-section>
          <q-input
            outlined
            v-model="adminRemarks"
            label="Admin Remarks"
            type="textarea"
            rows="3"
            :rules="[(val) => !!val || 'Remarks are required']"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" @click="cancelReview" />
          <q-btn label="OK" color="primary" @click="confirmReview" :disable="!adminRemarks.trim()" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Create Supplemental Budget Dialog -->
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 600px; max-width: 90vw">
        <q-card-section class="q-pb-none">
          <div class="row items-center justify-between">
            <div class="text-h6">Create Supplemental Budget</div>
            <q-btn icon="close" flat round dense @click="showCreateDialog = false" />
          </div>
        </q-card-section>

        <q-card-section>
          <!-- Summary -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <div class="text-caption text-grey-7">Selected Expenses:</div>
              <div class="text-weight-medium">{{ selectedExpenses.length }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">Total Amount:</div>
              <div class="text-weight-medium text-green">
                {{ supplementalBudgetStore.formatCurrency(selectedExpensesTotal) }}
              </div>
            </div>
          </div>

          <!-- Description Input -->
          <q-input
            outlined
            v-model="supplementalDescription"
            label="Supplemental Budget Description"
            type="text"
            placeholder="e.g., Supplemental Budget for Emergency Expenses"
            hint="Describe the purpose of this supplemental budget"
            class="q-mb-md"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            label="Clear Selection"
            @click="clearSelection"
            color="grey-7"
          />
          <q-btn
            label="Create Supplemental Budget"
            color="primary"
            @click="handleCreateClick"
            :disable="validSelectedExpenses.length === 0 || !supplementalDescription.trim()"
            :loading="loading"
            icon="add"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useSupplementalBudgetStore } from 'src/stores/supplementalBudgetStore'
import { usePageLogging } from '../../../composables/usePageLogging'
import { useAuthStore } from 'stores/auth'

const $q = useQuasar()
const authStore = useAuthStore()
const isAdmin = computed(() => !!authStore.admin)
const supplementalBudgetStore = useSupplementalBudgetStore()
const { logPageVisit } = usePageLogging()

const loading = ref(false)
const showViewDialog = ref(false)
const showCreateDialog = ref(false)
const searchQuery = ref('')
const selectedYear = ref(new Date().getFullYear())
const activeTab = ref(isAdmin.value ? 'supplemental' : 'unused')
const selectedExpenses = ref([])
const supplementalDescription = ref('')
const localExpenses = ref([])
const pagination = ref({
  sortBy: 'desc',
  descending: false,
  page: 1,
  rowsPerPage: 10
})

// View dialog state variables
const selectedRow = ref({
  id: null,
  description: '',
  total_amount: 0,
  total_appropriated: 0,
  total_disbursed: 0,
  unused_amount: 0,
  created_at: '',
  appropriations: []
})

// Admin review state (view-only with remarks)
const showReviewDialog = ref(false)
const adminRemarks = ref('')
const reviewedSet = ref(new Set())
const currentReviewRow = ref(null)

const isReviewed = (id) => reviewedSet.value.has(id)
const handleReviewClick = (row) => { currentReviewRow.value = row; adminRemarks.value = ''; showReviewDialog.value = true }
const cancelReview = () => { showReviewDialog.value = false; adminRemarks.value = ''; currentReviewRow.value = null }
const confirmReview = async () => {
  if (!adminRemarks.value.trim() || !currentReviewRow.value) return
  reviewedSet.value.add(currentReviewRow.value.id)
  showReviewDialog.value = false
  adminRemarks.value = ''
  currentReviewRow.value = null
}

// Column definitions
const columns = computed(() => [
  {
    name: 'account_name',
    required: true,
    label: 'Account',
    align: 'left',
    field: 'account_name',
    sortable: true,
  },
  {
    name: 'unused_amount',
    label: 'Unused Amount',
    align: 'right',
    field: 'unused_amount',
    sortable: true,
  },
  {
    name: 'amount_to_use',
    label: 'Amount to Use',
    align: 'right',
    field: 'amount_to_use',
    sortable: false,
  }
])

// const unusedColumns = [
//   {
//     name: 'index',
//     label: '#',
//     field: 'index',
//     align: 'left',
//     sortable: false,
//   },
//   {
//     name: 'account_name',
//     label: 'Account',
//     field: 'account_name',
//     align: 'left',
//     sortable: true,
//   },
//   {
//     name: 'expense_class',
//     label: 'Expense Class',
//     field: 'expense_class',
//     align: 'left',
//     sortable: true,
//   },
//   {
//     name: 'total_appropriated',
//     label: 'Total Appropriated',
//     field: 'total_appropriated',
//     align: 'right',
//     sortable: true,
//   },
//   {
//     name: 'total_disbursed',
//     label: 'Total Disbursed',
//     field: 'total_disbursed',
//     align: 'right',
//     sortable: true,
//   },
//   {
//     name: 'unused_amount',
//     label: 'Unused Amount',
//     field: 'unused_amount',
//     align: 'right',
//     sortable: true,
//   },
//   {
//     name: 'action',
//     label: 'Action',
//     field: 'action',
//     align: 'center',
//     sortable: false,
//   },
// ]

const supplementalColumns = [
  {
    name: 'index',
    label: '#',
    field: 'index',
    align: 'left',
    sortable: false,
  },
  {
    name: 'barangay',
    label: 'Barangay',
    field: 'barangay_name',
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
    name: 'total_amount',
    label: 'Total Amount',
    field: 'total_amount',
    align: 'right',
    sortable: true,
  },
  {
    name: 'total_appropriated',
    label: 'Allocated Amount',
    field: 'total_appropriated',
    align: 'right',
    sortable: true,
  },
  {
    name: 'action',
    label: 'Action',
    field: 'action',
    align: 'center',
    sortable: false,
  },
  {
    name: 'remarks',
    label: 'Remarks',
    field: 'remarks',
    align: 'center',
    sortable: false,
  },
]

// Computed properties
const yearOptions = computed(() => {
  return supplementalBudgetStore.years.map(year => ({
    label: year.year.toString(),
    value: year.year
  }))
})

const filteredExpenses = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) {
    return localExpenses.value
  }

  return localExpenses.value.filter(expense =>
    (expense.account_name || '').toLowerCase().includes(query) ||
    (expense.expense_class || '').toLowerCase().includes(query) ||
    (expense.expense_type || '').toLowerCase().includes(query) ||
    (expense.expense_item || '').toLowerCase().includes(query) ||
    (expense.expense_sub_item || '').toLowerCase().includes(query) ||
    (expense.budget_description || '').toLowerCase().includes(query)
  )
})

// const filteredUnusedExpenses = computed(() => {
//   const query = searchQuery.value.toLowerCase()
//   return supplementalBudgetStore.filteredUnusedExpenses.filter(expense =>
//     expense.account_name.toLowerCase().includes(query) ||
//     expense.expense_class.toLowerCase().includes(query) ||
//     expense.budget_description.toLowerCase().includes(query)
//   )
// })

const filteredSupplementalBudgets = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) {
    return supplementalBudgetStore.supplementalBudgets
  }

  return supplementalBudgetStore.supplementalBudgets.filter(budget =>
    (budget.description || '').toLowerCase().includes(query) ||
    (budget.barangay_name || '').toLowerCase().includes(query)
  )
})

// Computed property for selected expenses total
const selectedExpensesTotal = computed(() => {
  return selectedExpenses.value.reduce((sum, exp) => sum + (exp.amount_to_use || 0), 0)
})

// Computed property for valid selected expenses
const validSelectedExpenses = computed(() => {
  return selectedExpenses.value.filter(exp =>
    exp.amount_to_use &&
    exp.amount_to_use > 0 &&
    exp.amount_to_use <= (exp.unused_amount || 0)
  )
})

// Progress indicators for summary cards

// Total allocated amount metrics for the third indicator

// Methods
const loadData = async (showNotification = true) => {
  loading.value = true
  try {
    // Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled([
      supplementalBudgetStore.fetchAvailableUnusedExpenses(),
      supplementalBudgetStore.fetchSupplementalBudgets()
    ])

    // Check for any failures
    const failures = results.filter(result => result.status === 'rejected')

    if (failures.length === 0) {

      // Sync local expenses after successful data load
      syncLocalExpenses()
      if (showNotification) {
        $q.notify({
          type: 'positive',
          message: 'Data refreshed successfully!',
          icon: 'refresh',
          position: 'top',
        })
      }
    } else if (failures.length < results.length) {
      // Partial success
      if (showNotification) {
        $q.notify({
          type: 'warning',
          message: 'Some data could not be refreshed. Please try again.',
          icon: 'warning',
          position: 'top',
        })
      }
    } else {
      // Complete failure
      throw new Error('Failed to refresh data')
    }
  } catch (error) {
    console.error('Error loading data:', error)
    if (showNotification) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || error.message || 'Failed to refresh data',
        icon: 'error',
        position: 'top',
      })
    }
  } finally {
    loading.value = false
  }
}

const onYearChange = async (year) => {
  if (year === supplementalBudgetStore.selectedYear) return

  supplementalBudgetStore.setSelectedYear(year)
  // Clear selections when year changes
  clearSelection()
  await loadData()
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedYear.value = new Date().getFullYear()
  clearSelection()
}

const ensureSelected = (expense) => {
  const existingIndex = selectedExpenses.value.findIndex(exp => exp.id === expense.id)
  if (existingIndex === -1) {
    selectedExpenses.value.push({
      ...expense,
      amount_to_use: expense.amount_to_use || undefined
    })
  } else {
    // Update existing selection with current expense data but preserve existing amount_to_use
    const existingAmount = selectedExpenses.value[existingIndex].amount_to_use
    selectedExpenses.value[existingIndex] = {
      ...expense,
      amount_to_use: existingAmount !== undefined ? existingAmount : (expense.amount_to_use || undefined)
    }
  }
}

// === Validation (from Arbiter02) ===
const validateAmount = (expense) => {
  // Only validate if amount_to_use is defined and not empty
  if (expense.amount_to_use !== undefined && expense.amount_to_use !== null && expense.amount_to_use !== '') {
    if (expense.amount_to_use < 0) {
      expense.amount_to_use = 0
    }
    if (expense.amount_to_use > (expense.unused_amount || 0)) {
      expense.amount_to_use = expense.unused_amount || 0
    }
  }
}

// === Currency & Input Handling (from main) ===
const parseCurrency = (value) => {
  if (!value && value !== 0) return 0
  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
}

// Real-time input formatting: typing = commas only, blur = two decimals
const formatInputValue = (value) => {
  if (!value && value !== 0) return ''
  const isNumber = typeof value === 'number'
  const cleanValue = String(value).replace(/,/g, '')
  const num = parseFloat(cleanValue)
  if (isNaN(num)) return ''
  return isNumber
    ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : num.toLocaleString('en-US')
}

// Handle amount input while typing (string) – sanitized
const handleAmountToUseInput = (expense, value) => {
  let cleanValue = String(value).replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }
  expense.amount_to_use = cleanValue
  validateAmount(expense) // 🔹 run business rule check after input
}

// Handle input blur – format to two decimals
const handleAmountToUseBlur = (expense, value) => {
  const formatted = formatToTwoDecimals(value)
  expense.amount_to_use = formatted
  validateAmount(expense) // 🔹 enforce limits
}

// Force exactly two decimals
const formatToTwoDecimals = (value) => {
  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  if (cleanValue === '') return ''
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    const collapsed = parts[0] + '.' + parts.slice(1).join('')
    return formatToTwoDecimals(collapsed)
  }
  if (parts.length === 2 && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2)
  }
  const num = parseFloat(parts.join('.'))
  if (isNaN(num)) return ''
  return Math.round(num * 100) / 100
}

// Block invalid keypresses
const blockNonNumeric = (event) => {
  const key = event.key
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
  if (allowedKeys.includes(key)) return
  if (key === '.' && !event.target.value.includes('.')) return
  if (!/^\d$/.test(key)) {
    event.preventDefault()
  }
}

// Sanitize pasted content
const handlePasteNumeric = (event) => {
  const paste = (event.clipboardData || window.clipboardData).getData('text')
  const cleanPaste = paste.replace(/[^\d.]/g, '')

  if (cleanPaste !== paste) {
    event.preventDefault()
    const target = event.target
    const start = target.selectionStart
    const end = target.selectionEnd
    const currentValue = target.value
    const newValue = currentValue.substring(0, start) + cleanPaste + currentValue.substring(end)

    // Find the expense row and update it
    const tableRow = target.closest('tr')
    if (tableRow) {
      const rowIndex = Array.from(tableRow.parentNode.children).indexOf(tableRow)
      const expense = filteredExpenses.value[rowIndex]
      if (expense) {
        handleAmountToUseInput(expense, newValue)
        validateAmount(expense) // 🔹 enforce rules after paste
      }
    }
  }
}


const syncLocalExpenses = () => {
  // Create a map of existing local expenses by ID to preserve amount_to_use values
  const existingExpensesMap = new Map()
  localExpenses.value.forEach(expense => {
    existingExpensesMap.set(expense.id, expense.amount_to_use)
  })

  // Update local expenses with fresh data from store, preserving amount_to_use values
  localExpenses.value = supplementalBudgetStore.filteredUnusedExpenses.map(expense => {
    const existingAmount = existingExpensesMap.get(expense.id)
    // If we have an existing amount and it's less than or equal to the new unused amount, preserve it
    // Otherwise, start with empty value (no preloaded amount)
    const amountToUse = (existingAmount !== undefined && existingAmount <= expense.unused_amount)
      ? existingAmount
      : undefined

    return {
      ...expense,
      amount_to_use: amountToUse
    }
  })
}

const clearSelection = () => {
  selectedExpenses.value = []
  supplementalDescription.value = ''
  // Reset amount_to_use values in local expenses to undefined (empty)
  localExpenses.value.forEach(expense => {
    expense.amount_to_use = undefined
  })
}

const openCreateDialog = () => {
  if (selectedExpenses.value.length === 0) {
    $q.notify({
      type: 'info',
      message: 'Please select expenses from the table above to create a supplemental budget',
      icon: 'info',
      position: 'top',
    })
    return
  }
  showCreateDialog.value = true
}

// const scrollToSelection = () => {
//   if (selectedExpenses.value.length === 0) {
//     $q.notify({
//       type: 'info',
//       message: 'Please select expenses from the table above to create a supplemental budget',
//       icon: 'info',
//       position: 'top',
//     })
//   }
//   // Scroll to the supplemental budget section if it exists
//   const element = document.querySelector('.bg-blue-1')
//   if (element) {
//     element.scrollIntoView({ behavior: 'smooth' })
//   }
// }

// const addToSupplemental = (expense) => {
//   // Add to selected expenses with default amount
//   const existingIndex = selectedExpenses.value.findIndex(exp => exp.id === expense.id)
//   if (existingIndex === -1) {
//     selectedExpenses.value.push({
//       ...expense,
//       amount_to_use: expense.unused_amount
//     })
//   }
// }

const handleCreateClick = async () => {
  // Use computed properties for validation
  if (validSelectedExpenses.value.length === 0) {
    $q.notify({
      type: 'negative',
      message: 'Please select at least one expense with a valid amount to create supplemental budget',
      icon: 'warning',
      position: 'top',
    })
    return
  }

  if (!supplementalDescription.value || !supplementalDescription.value.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Please provide a description for the supplemental budget',
      icon: 'warning',
      position: 'top',
    })
    return
  }

  await createSupplementalBudget()
}

const createSupplementalBudget = async () => {
  loading.value = true
  try {
    // Validate fiscal year
    if (!supplementalBudgetStore.selectedYear) {
      $q.notify({
        type: 'negative',
        message: 'Please select a fiscal year',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    // Use computed property for validation
    if (validSelectedExpenses.value.length === 0) {
      $q.notify({
        type: 'negative',
        message: 'Please select at least one expense with a valid amount',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    const totalAmount = selectedExpensesTotal.value

    const data = {
      description: supplementalDescription.value.trim(),
      year: supplementalBudgetStore.selectedYear,
      expense_sources: validSelectedExpenses.value.map(exp => ({
        appropriation_id: exp.id,
        amount: exp.amount_to_use
      }))
    }

    const result = await supplementalBudgetStore.createSupplementalBudget(data)

    if (result.status) {
      $q.notify({
        type: 'positive',
        message: `Successfully created supplemental budget "${supplementalDescription.value}" with amount ${supplementalBudgetStore.formatCurrency(totalAmount)}`,
        icon: 'check_circle',
        position: 'top',
        timeout: 5000
      })

      // Clear form data and close dialog
      clearSelection()
      showCreateDialog.value = false

      // Refresh data silently to avoid duplicate notifications
      await loadData(false)
    } else {
      throw new Error(result.message || 'Failed to create supplemental budget')
    }
  } catch (error) {
    console.error('Error creating supplemental budget:', error)

    let errorMessage = 'An error occurred while creating supplemental budget'

    if (error.response?.data?.errors) {
      // Handle validation errors
      const errors = error.response.data.errors
      const errorMessages = Object.values(errors).flat()
      errorMessage = errorMessages.join(', ')
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      icon: 'error',
      position: 'top',
      timeout: 5000
    })
  } finally {
    loading.value = false
  }
}

const openViewDialog = (row) => {
  selectedRow.value = {
    ...row,
    appropriations: row.appropriations || []
  }
  showViewDialog.value = true
}

const onRequest = (props) => {
  pagination.value = props.pagination
}

onMounted(async () => {
  try {
    // Load years first
    await supplementalBudgetStore.fetchYears()

    // Set default year if not set
    if (!supplementalBudgetStore.selectedYear) {
      supplementalBudgetStore.setSelectedYear(new Date().getFullYear())
    }

    // Load data
    await loadData(false) // Don't show notification on initial load

    // Sync local expenses after initial load
    syncLocalExpenses()

    // Log page visit
    await logPageVisit('Supplemental Budget')
  } catch (error) {
    console.error('Error initializing SupplementalTran page:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to initialize page. Please refresh.',
      icon: 'error',
      position: 'top',
    })
  }
})

// Watch for dialog close to clear selections
watch(showViewDialog, (newValue) => {
  if (!newValue) {
    // Dialog was closed, reset selected row
    selectedRow.value = {
      id: null,
      description: '',
      total_amount: 0,
      total_appropriated: 0,
      total_disbursed: 0,
      unused_amount: 0,
      created_at: '',
      appropriations: []
    }
  }
})

// Watch for create dialog close to clear selections
watch(showCreateDialog, (newValue) => {
  if (!newValue) {
    // Dialog was closed, clear selections
    clearSelection()
  }
})

// Watch for changes in store data to trigger reactive updates
watch(() => supplementalBudgetStore.availableUnusedExpenses, () => {
  // Force reactivity update for computed properties
}, { deep: true })

watch(() => supplementalBudgetStore.supplementalBudgets, () => {
  // Force reactivity update for computed properties
}, { deep: true })

// Watch for selected expenses changes to validate amounts and sync with localExpenses
watch(selectedExpenses, (newExpenses) => {
  // Validate amounts when expenses change
  newExpenses.forEach(expense => {
    if (expense.amount_to_use !== undefined && expense.amount_to_use !== null && expense.amount_to_use !== '') {
      if (expense.amount_to_use > (expense.unused_amount || 0)) {
        expense.amount_to_use = expense.unused_amount || 0
      }
      if (expense.amount_to_use < 0) {
        expense.amount_to_use = 0
      }
    }
  })

  // Sync selectedExpenses with amounts from localExpenses when selection changes
  newExpenses.forEach(selectedExp => {
    const localExp = localExpenses.value.find(exp => exp.id === selectedExp.id)
    if (localExp && localExp.amount_to_use !== undefined) {
      selectedExp.amount_to_use = localExp.amount_to_use
    }
  })
}, { deep: true })

// Watch for local expenses changes to validate amounts and sync with selectedExpenses
watch(localExpenses, (newExpenses) => {
  // Validate amounts when local expenses change
  newExpenses.forEach(expense => {
    if (expense.amount_to_use !== undefined && expense.amount_to_use !== null && expense.amount_to_use !== '') {
      if (expense.amount_to_use > (expense.unused_amount || 0)) {
        expense.amount_to_use = expense.unused_amount || 0
      }
      if (expense.amount_to_use < 0) {
        expense.amount_to_use = 0
      }
    }
  })

  // Sync selectedExpenses with updated amounts from localExpenses
  selectedExpenses.value.forEach(selectedExp => {
    const localExp = newExpenses.find(exp => exp.id === selectedExp.id)
    if (localExp) {
      selectedExp.amount_to_use = localExp.amount_to_use
    }
  })
}, { deep: true })

defineExpose({
  loadData
})
</script>

<style scoped>
.supplemental-tran {
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

.summary-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.summary-card.loading-state {
  opacity: 0.7;
  pointer-events: none;
}

.summary-card.loading-state::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.available-funds-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-left: 4px solid #6c757d;
}

.supplemental-budget-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-left: 4px solid #6c757d;
}

.transfer-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-left: 4px solid #6c757d;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.summary-header .q-icon {
  color: #6c757d;
}

.summary-amount {
  margin: 16px 0;
}

.summary-amount .text-h4 {
  font-size: 2.2rem;
  line-height: 1.2;
  margin-bottom: 4px;
}

.summary-footer {
  margin-top: 16px;
}

.summary-footer .q-linear-progress {
  border-radius: 4px;
  opacity: 1;
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

  /* Mobile summary cards adjustments */
  .summary-card {
    margin-bottom: 12px;
  }

  .summary-amount .text-h4 {
    font-size: 1.8rem;
  }

  .summary-header {
    flex-direction: column;
    gap: 8px;
  }

  .summary-header .q-icon {
    margin-right: 0;
  }

  /* Ensure dialog is properly sized on mobile */
  .q-dialog .q-card {
    min-width: 95vw !important;
    max-width: 95vw !important;
    width: 95vw !important;
  }
}

/* Tablet adjustments */
@media (min-width: 769px) and (max-width: 1023px) {
  .summary-amount .text-h4 {
    font-size: 2rem;
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

/* Tab styling */
.q-tabs {
  background: white;
}

.q-tab-panel {
  padding: 0;
}

/* Highlight active tab with green background and text */
.tabs-green-highlight :deep(.q-tab--active) {
  background-color: rgba(76, 175, 80, 0.12); /* subtle green */
  border-radius: 6px;
}

.tabs-green-highlight :deep(.q-tab--active .q-tab__label),
.tabs-green-highlight :deep(.q-tab--active .q-icon) {
  color: #2e7d32 !important; /* dark green text/icon */
  font-weight: 600;
}

/* Table styling */
.q-table {
  background: white;
}

/* Summary card specific styling */
.summary-card .text-h5 {
  font-size: 1.75rem;
  font-weight: 700;
}

.summary-card .text-h6 {
  font-size: 1.1rem;
  font-weight: 600;
}

/* Hierarchy display styling */
.hierarchy-levels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.hierarchy-levels span {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  font-size: 11px;
  color: #666;
}

.hierarchy-levels .q-icon {
  margin-right: 2px;
}
</style>
