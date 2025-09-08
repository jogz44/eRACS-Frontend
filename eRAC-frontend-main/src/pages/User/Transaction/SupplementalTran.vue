<template>
  <q-page class="q-pa-md supplemental-tran">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-medium">Supplemental Budget</div>
          <div class="text-caption text-grey-7">
            Create supplemental budgets from unused expenses
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

    <!-- Summary Cards -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-md-6 col-sm-12">
        <q-card class="summary-card">
          <q-card-section class="text-center">
            <div class="text-h6 text-primary">Available Unused Funds</div>
            <div class="text-h5 text-weight-bold">
              {{ supplementalBudgetStore.formatCurrency(supplementalBudgetStore.totalAvailableUnused) }}
            </div>
            <div class="text-caption text-grey-6">
              {{ supplementalBudgetStore.filteredUnusedExpenses.length }} expense{{ supplementalBudgetStore.filteredUnusedExpenses.length !== 1 ? 's' : '' }} with unused funds
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-6 col-sm-12">
        <q-card class="summary-card">
          <q-card-section class="text-center">
          <div class="text-h6 text-secondary">Total Supplemental Budgets</div>
          <div class="text-h5 text-weight-bold">
            {{ supplementalBudgetStore.formatCurrency(supplementalBudgetStore.totalSupplementalAmount) }}
          </div>
          <div class="text-caption text-grey-6">
            {{ supplementalBudgetStore.supplementalBudgets.length }} supplemental budget{{ supplementalBudgetStore.supplementalBudgets.length !== 1 ? 's' : '' }}
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">
            Funds transferred from unused expenses (unappropriated)
          </div>
          </q-card-section>
        </q-card>
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

          <!-- Create Supplemental Budget Button -->
          <div class="col-auto">
            <q-btn
              label="Create Supplemental Budget"
              @click="openCreateDialog"
              color="primary"
              v-permission="'add'"
              :loading="loading"
              class="btn-match-input"
              icon="add"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Create Supplemental Budget Dialog -->
    <q-dialog v-model="showCreateDialog" @keydown.enter="handleEnterKey">
      <q-card style="min-width: 800px; max-width: 90vw">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Create Supplemental Budget</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Transfer unused expenses to create a supplemental budget. These funds will be available as unappropriated for future allocation.
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row items-center q-gutter-sm q-mb-md">
            <q-input
              dense
              outlined
              debounce="300"
              v-model="dialogSearchQuery"
              placeholder="Search expenses..."
              style="min-width: 250px"
              @keydown.enter="handleEnterKey"
            />
          </div>

          <q-table
            :rows="filteredDialogExpenses"
            :columns="createColumns"
            row-key="id"
            selection="multiple"
            v-model:selected="selectedExpenses"
            :pagination="{ rowsPerPage: 0 }"
            style="max-height: 400px"
            flat
            bordered
          >
            <template v-slot:header-selection="scope">
              <q-checkbox color="primary" v-model="scope.selected" />
            </template>
            <template v-slot:body-selection="scope">
              <q-checkbox color="primary" v-model="scope.selected" />
            </template>

            <template v-slot:body-cell-account_name="props">
              <q-td :props="props">
                <div class="text-weight-medium">{{ props.row.account_name }}</div>
                <div class="text-caption text-grey-6">{{ props.row.budget_description }}</div>
              </q-td>
            </template>

            <template v-slot:body-cell-unused_amount="props">
              <q-td :props="props">
                <div class="text-weight-medium text-green">
                  {{ supplementalBudgetStore.formatCurrency(props.row.unused_amount) }}
                </div>
                <div class="text-caption text-grey-6">
                  Available for supplemental budget
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-amount_to_use="props">
              <q-td :props="props">
                <q-input
                  v-model.number="props.row.amount_to_use"
                  type="number"
                  :max="props.row.unused_amount"
                  :min="0"
                  step="0.01"
                  dense
                  outlined
                  :rules="[
                    val => val > 0 || 'Amount must be greater than 0',
                    val => val <= props.row.unused_amount || `Amount cannot exceed ${supplementalBudgetStore.formatCurrency(props.row.unused_amount)}`
                  ]"
                />
              </q-td>
            </template>
          </q-table>

          <!-- Summary of selected expenses -->
          <div v-if="selectedExpenses.length > 0" class="q-mt-md">
            <q-card flat bordered class="bg-blue-1">
              <q-card-section class="q-py-sm">
                <div class="text-subtitle2 text-weight-medium q-mb-xs">
                  Selected Expenses Summary
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-6">
                    <div class="text-caption text-grey-7">Number of Expenses:</div>
                    <div class="text-weight-medium">{{ selectedExpenses.length }}</div>
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-7">Total Amount:</div>
                    <div class="text-weight-medium text-green">
                      {{ supplementalBudgetStore.formatCurrency(selectedExpenses.reduce((sum, exp) => sum + (exp.amount_to_use || 0), 0)) }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <q-input
            outlined
            v-model="supplementalDescription"
            label="Supplemental Budget Description"
            type="text"
            placeholder="e.g., Supplemental Budget for Emergency Expenses"
            class="q-mt-md"
            @keydown.enter="handleEnterKey"
            hint="Describe the purpose of this supplemental budget"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" @click="handleCancelCreate" />
          <q-btn
            label="Create Supplemental Budget"
            color="primary"
            @click="handleCreateClick"
            :disable="selectedExpenses.length === 0 || !supplementalDescription"
            :loading="loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Tabs for Unused Expenses and Supplemental Budgets -->
    <q-card flat bordered>
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="unused" label="Available Unused Expenses" />
        <q-tab name="supplemental" label="Supplemental Budgets" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <!-- Unused Expenses Tab -->
        <q-tab-panel name="unused">
          <q-table
            :rows="filteredUnusedExpenses"
            :columns="unusedColumns"
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

            <template v-slot:body-cell-account_name="props">
              <q-td :props="props">
                <div class="text-weight-medium">{{ props.row.account_name }}</div>
                <div class="text-caption text-grey-6">{{ props.row.budget_description }}</div>
              </q-td>
            </template>

            <template v-slot:body-cell-total_appropriated="props">
              <q-td :props="props">
                {{ supplementalBudgetStore.formatCurrency(props.row.total_appropriated) }}
              </q-td>
            </template>

            <template v-slot:body-cell-total_disbursed="props">
              <q-td :props="props">
                {{ supplementalBudgetStore.formatCurrency(props.row.total_disbursed) }}
              </q-td>
            </template>

            <template v-slot:body-cell-unused_amount="props">
              <q-td :props="props">
                <div class="text-weight-medium text-green">
                  {{ supplementalBudgetStore.formatCurrency(props.row.unused_amount) }}
                </div>
                <div class="text-caption text-grey-6">
                  Available for supplemental budget
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-action="props">
              <q-td :props="props">
                <div class="q-gutter-xs">
                  <q-btn
                    dense
                    icon="add"
                    color="primary"
                    @click="addToSupplemental(props.row)"
                    v-permission="'add'"
                    :disable="props.row.unused_amount <= 0"
                  />
                </div>
              </q-td>
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
                  Transferred from unused expenses
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
              <div class="text-caption">Total Transferred:</div>
              <strong>{{ supplementalBudgetStore.formatCurrency(selectedRow.total_appropriated) }}</strong>
            </div>
          </div>

          <!-- Transferred Funds in this supplemental budget -->
          <div class="q-mb-md">
            <div class="text-h6 text-weight-medium q-mb-sm">
              Transferred Funds in this Supplemental Budget
            </div>
            <div class="text-caption q-mb-sm">
              These funds were transferred from unused expenses and are available for transfer to annual budgets
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
                        {{ appropriation.account_name || 'Unknown Account' }}
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

          <!-- Transfer Information -->
          <div class="q-mb-md">
            <div class="text-h6 text-weight-medium q-mb-sm">Transfer Information</div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-card flat bordered class="q-pa-md">
                  <div class="text-caption text-grey-7">Purpose</div>
                  <div class="text-h6 text-primary">
                    Available for Transfer
                  </div>
                </q-card>
              </div>
              <div class="col-12 col-sm-6">
                <q-card flat bordered class="q-pa-md">
                  <div class="text-caption text-grey-7">Total Transferred</div>
                  <div class="text-h6 text-secondary">
                    {{ supplementalBudgetStore.formatCurrency(selectedRow.total_appropriated) }}
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
// import { storeToRefs } from 'pinia'
import { useSupplementalBudgetStore } from 'src/stores/supplementalBudgetStore'
import { usePageLogging } from '../../../composables/usePageLogging'

const $q = useQuasar()
const supplementalBudgetStore = useSupplementalBudgetStore()
// const { supplementalBudgets, availableUnusedExpenses, years } = storeToRefs(supplementalBudgetStore)

const loading = ref(false)
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const searchQuery = ref('')
const dialogSearchQuery = ref('')
const selectedYear = ref(new Date().getFullYear())
const activeTab = ref('unused')
const selectedExpenses = ref([])
const supplementalDescription = ref('')

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

// Column definitions
const unusedColumns = [
  {
    name: 'index',
    label: '#',
    field: 'index',
    align: 'left',
    sortable: false,
  },
  {
    name: 'account_name',
    label: 'Account',
    field: 'account_name',
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
    name: 'total_appropriated',
    label: 'Total Appropriated',
    field: 'total_appropriated',
    align: 'right',
    sortable: true,
  },
  {
    name: 'total_disbursed',
    label: 'Total Disbursed',
    field: 'total_disbursed',
    align: 'right',
    sortable: true,
  },
  {
    name: 'unused_amount',
    label: 'Unused Amount',
    field: 'unused_amount',
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
]

const supplementalColumns = [
  {
    name: 'index',
    label: '#',
    field: 'index',
    align: 'left',
    sortable: false,
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
    label: 'Total Transferred',
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
]

const createColumns = [
  {
    name: 'account_name',
    label: 'Account',
    field: 'account_name',
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
    name: 'unused_amount',
    label: 'Available Amount',
    field: 'unused_amount',
    align: 'right',
    sortable: true,
  },
  {
    name: 'amount_to_use',
    label: 'Amount to Use',
    field: 'amount_to_use',
    align: 'right',
    sortable: false,
  },
]

// Computed properties
// const yearOptions = computed(() => {
//   return years.value.map(year => ({
//     label: year.year.toString(),
//     value: year.year
//   }))
// })

const filteredUnusedExpenses = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return supplementalBudgetStore.filteredUnusedExpenses.filter(expense =>
    expense.account_name.toLowerCase().includes(query) ||
    expense.expense_class.toLowerCase().includes(query) ||
    expense.budget_description.toLowerCase().includes(query)
  )
})

const filteredSupplementalBudgets = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return supplementalBudgetStore.supplementalBudgets.filter(budget =>
    budget.description.toLowerCase().includes(query) ||
    budget.barangay_name.toLowerCase().includes(query)
  )
})

const filteredDialogExpenses = computed(() => {
  const query = dialogSearchQuery.value.toLowerCase()
  return supplementalBudgetStore.filteredUnusedExpenses.filter(expense =>
    expense.account_name.toLowerCase().includes(query) ||
    expense.expense_class.toLowerCase().includes(query) ||
    expense.budget_description.toLowerCase().includes(query)
  )
})



// Methods
const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      supplementalBudgetStore.fetchAvailableUnusedExpenses(),
      supplementalBudgetStore.fetchSupplementalBudgets()
    ])

    $q.notify({
      type: 'positive',
      message: 'Data refreshed successfully!',
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

const onYearChange = async (year) => {
  supplementalBudgetStore.setSelectedYear(year)
  await loadData()
}

const clearAllFilters = () => {
  searchQuery.value = ''
  dialogSearchQuery.value = ''
  selectedYear.value = new Date().getFullYear()
}



const openCreateDialog = () => {
  selectedExpenses.value = []
  supplementalDescription.value = ''
  dialogSearchQuery.value = ''
  showCreateDialog.value = true
}

const addToSupplemental = (expense) => {
  // Add to selected expenses with default amount
  const existingIndex = selectedExpenses.value.findIndex(exp => exp.id === expense.id)
  if (existingIndex === -1) {
    selectedExpenses.value.push({
      ...expense,
      amount_to_use: expense.unused_amount
    })
  }
}

const handleEnterKey = (event) => {
  event.preventDefault()
  if (showCreateDialog.value) {
    handleCreateClick()
  }
}

const handleCreateClick = async () => {
  const hasSelectedExpenses = selectedExpenses.value && selectedExpenses.value.length > 0
  const hasDescription = supplementalDescription.value && supplementalDescription.value.trim() !== ''

  if (!hasSelectedExpenses) {
    $q.notify({
      type: 'negative',
      message: 'Please select at least one expense to create supplemental budget',
      icon: 'warning',
      position: 'top',
    })
    return
  }

  if (!hasDescription) {
    $q.notify({
      type: 'negative',
      message: 'Please provide a description for the supplemental budget',
      icon: 'warning',
      position: 'top',
    })
    return
  }

  // Validate amounts
  const invalidExpenses = selectedExpenses.value.filter(exp =>
    !exp.amount_to_use || exp.amount_to_use <= 0 || exp.amount_to_use > exp.unused_amount
  )

  if (invalidExpenses.length > 0) {
    console.error('Invalid expenses:', invalidExpenses)
    $q.notify({
      type: 'negative',
      message: 'Please check the amounts to use for selected expenses',
      icon: 'warning',
      position: 'top',
    })
    return
  }

  // Validate that we have at least one expense with a valid amount
  const validExpenses = selectedExpenses.value.filter(exp =>
    exp.amount_to_use && exp.amount_to_use > 0 && exp.amount_to_use <= exp.unused_amount
  )

  if (validExpenses.length === 0) {
    $q.notify({
      type: 'negative',
      message: 'Please select at least one expense with a valid amount',
      icon: 'warning',
      position: 'top',
    })
    return
  }

  await createSupplementalBudget()
}

const handleCancelCreate = () => {
  selectedExpenses.value = []
  supplementalDescription.value = ''
  dialogSearchQuery.value = ''
  showCreateDialog.value = false
}

const createSupplementalBudget = async () => {
  loading.value = true
  try {
    // Check if fiscal year exists
    if (!supplementalBudgetStore.selectedYear) {
      $q.notify({
        type: 'negative',
        message: 'Please select a fiscal year',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    const totalAmount = selectedExpenses.value.reduce((sum, exp) => sum + (exp.amount_to_use || 0), 0)

    const data = {
      description: supplementalDescription.value,
      year: supplementalBudgetStore.selectedYear,
      expense_sources: selectedExpenses.value.map(exp => ({
        appropriation_id: exp.id,
        amount: exp.amount_to_use
      }))
    }

    console.log('Creating supplemental budget with data:', data)
    console.log('Selected year:', supplementalBudgetStore.selectedYear)
    console.log('Selected expenses:', selectedExpenses.value)

    const result = await supplementalBudgetStore.createSupplementalBudget(data)

    if (result.status) {
      console.log('Supplemental budget creation successful, refreshing data...')

      $q.notify({
        type: 'positive',
        message: `Successfully created supplemental budget "${supplementalDescription.value}" with amount ${supplementalBudgetStore.formatCurrency(totalAmount)}`,
        icon: 'check_circle',
        position: 'top',
        timeout: 5000
      })

      selectedExpenses.value = []
      supplementalDescription.value = ''
      dialogSearchQuery.value = ''
      showCreateDialog.value = false

      // Force refresh the data
      await loadData()
      console.log('Data refresh completed after creation')
    } else {
      $q.notify({
        type: 'negative',
        message: result.message || 'Failed to create supplemental budget',
        icon: 'error',
        position: 'top',
      })
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





onMounted(async () => {
  try {
    await supplementalBudgetStore.fetchYears()
    await loadData()

    // Log page visit
    const { logPageVisit } = usePageLogging()
    await logPageVisit('Supplemental Budget')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to load data',
      position: 'top',
    })
  }
})

// Watch for dialog close to clear selections
watch(showCreateDialog, (newValue) => {
  if (!newValue) {
    // Dialog was closed, clear selections
    selectedExpenses.value = []
    supplementalDescription.value = ''
    dialogSearchQuery.value = ''
  }
})

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
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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

/* Tab styling */
.q-tabs {
  background: white;
}

.q-tab-panel {
  padding: 0;
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
</style>
