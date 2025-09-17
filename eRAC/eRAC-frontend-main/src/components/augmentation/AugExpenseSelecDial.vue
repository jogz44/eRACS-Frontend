<template>
  <!-- Expense Selection Dialog -->
  <q-dialog v-model="store.dialogs.augExpense" persistent>
    <q-card class="expense-selection-card" style="min-width: 1050px; max-height: 90vh; font-size: medium;">
      <!-- Header with reduced padding -->
      <q-card-section class="q-pb-sm q-pt-sm">
        <div class="row items-center justify-between">
          <div class="text-h6">Select Expense Account for Augmentation</div>
          <q-icon
            name="close"
            class="cursor-pointer"
            size="sm"
            @click="store.closeDialog('augExpense')"
          />
        </div>
        <div class="text-caption text-grey-6 q-mt-sm">
          Select expense accounts to augment from the same expense class
        </div>
      </q-card-section>

      <q-card-section class="q-py-lg">
        <!-- Summary Information -->
        <div class="row q-mb-sm">
          <div class="col-md-6 col-12 q-mb-md text-weight-regular">
            Total Selected Balance:
            <strong>{{ formatCurrency(availableForAugmentation) }}</strong>
          </div>
          <div class="col-md-6 col-12 text-weight-regular">
            Selected Accounts:
            <strong>{{ selectedAccountsCount }}</strong>
          </div>
        </div>

        <!-- Search Input -->
        <q-input
          outlined
          dense
          placeholder="Search expense accounts..."
          class="q-mb-sm"
          v-model="searchQuery"
          style="max-width: 500px"
          clearable
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- Hierarchical Expense Account Table -->
        <div class="hierarchical-table" style="border: 1px solid #e0e0e0; border-radius: 4px">
          <!-- Table Header -->
          <div
            class="row q-table__top bg-grey-3 text-weight-bold"
            style="padding: 8px 12px; min-height: 40px"
          >
            <div class="col-6" style="display: flex; align-items: center">Expense Account</div>
            <div class="col-3 text-center" style="display: flex; align-items: center; justify-content: center">
              Available Balance
            </div>
            <div class="col-3 text-center" style="display: flex; align-items: center; justify-content: center">
              Action
            </div>
          </div>

          <!-- Table Body -->
          <div class="hierarchical-body" style="max-height: calc(70vh - 200px); overflow-y: auto">
            <template v-for="expenseClass in displayAccounts" :key="'class-' + expenseClass.id">
              <!-- Expense Class Row -->
              <div
                class="row bg-grey-3 text-weight-bold"
                style="padding: 12px 12px; min-height: 32px"
              >
                <div class="col-6" style="display: flex; align-items: center">
                  <q-badge
                    :color="getExpenseClassColor(expenseClass.name)"
                    :label="expenseClass.name"
                    class="expense-class-badge"
                  />
                </div>
                <div class="col-3 text-center" style="display: flex; align-items: center; justify-content: center">
                  <template v-if="calculateClassTotal(expenseClass) > 0">
                    {{ formatCurrency(calculateClassTotal(expenseClass)) }}
                  </template>
                </div>
                <div class="col-3 text-center" style="display: flex; align-items: center; justify-content: center">
                  <!-- Class level selection if applicable -->
                </div>
              </div>

              <!-- Expense Type Rows -->
              <template
                v-for="expenseType in expenseClass.children"
                :key="'type-' + expenseType.id"
              >
                <div
                  class="row"
                  :class="getTypeClass(expenseType)"
                  style="padding: 6px 12px; min-height: 32px; border-bottom: 1px solid #f0f0f0"
                >
                  <div class="col-6" style="padding-left: 24px; display: flex; align-items: center">
                    <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                    {{ expenseType.name }}
                  </div>
                  <div class="col-3 text-center" style="display: flex; align-items: center; justify-content: center">
                    <template v-if="!expenseType.children || expenseType.children.length === 0">
                      {{ formatCurrency(expenseType.balance || 0) }}
                    </template>
                    <template v-else>
                      {{ formatCurrency(calculateTypeTotal(expenseType)) }}
                    </template>
                  </div>
                  <div class="col-3 text-center" style="display: flex; align-items: center; justify-content: center">
                    <!-- Type level selection if no children -->
                    <q-btn
                      v-if="!expenseType.children || expenseType.children.length === 0"
                      dense
                      :label="isSelected(expenseType) ? 'Selected' : (expenseType.balance > 0 ? 'Select' : 'Select (₱0)')"
                      :color="isSelected(expenseType) ? 'positive' : (expenseType.balance > 0 ? 'primary' : 'grey')"
                      :disable="!canSelectAccount(expenseType)"
                      @click="toggleAccountSelection(expenseType)"
                      size="sm"
                    />
                  </div>
                </div>

                <!-- Expense Item Rows -->
                <template v-if="expenseType.children && expenseType.children.length > 0">
                  <template
                    v-for="expenseItem in expenseType.children"
                    :key="'item-' + expenseItem.id"
                  >
                    <!-- Item Row -->
                    <div
                      class="row"
                      style="padding: 6px 12px; min-height: 32px; border-bottom: 1px solid #f0f0f0"
                    >
                      <div
                        class="col-6"
                        style="padding-left: 48px; display: flex; align-items: center"
                      >
                        <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                        <span :class="expenseItem.children && expenseItem.children.length > 0 ? 'text-weight-bold' : 'text-weight-regular'">
                          {{ expenseItem.name }}
                        </span>
                      </div>
                      <div class="col-3 text-center" style="display: flex; align-items: center; justify-content: center">
                        <template v-if="!expenseItem.children || expenseItem.children.length === 0">
                          {{ formatCurrency(expenseItem.balance || 0) }}
                        </template>
                        <template v-else>
                          {{ formatCurrency(calculateItemTotal(expenseItem)) }}
                        </template>
                      </div>
                      <div class="col-3 text-center" style="display: flex; align-items: center; justify-content: center">
                        <!-- Item level selection if no children -->
                        <q-btn
                          v-if="!expenseItem.children || expenseItem.children.length === 0"
                          dense
                          :label="isSelected(expenseItem) ? 'Selected' : (expenseItem.balance > 0 ? 'Select' : 'Select (₱0)')"
                          :color="isSelected(expenseItem) ? 'positive' : (expenseItem.balance > 0 ? 'primary' : 'grey')"
                          :disable="!canSelectAccount(expenseItem)"
                          @click="toggleAccountSelection(expenseItem)"
                          size="sm"
                        />
                      </div>
                    </div>

                    <!-- Sub-Item Rows (only if item has sub-items) -->
                    <template v-if="expenseItem.children && expenseItem.children.length > 0">
                      <template
                        v-for="expenseSubItem in expenseItem.children"
                        :key="'subitem-' + expenseSubItem.id"
                      >
                        <div
                          class="row"
                          style="padding: 6px 12px; min-height: 32px; border-bottom: 1px solid #f0f0f0"
                        >
                          <div
                            class="col-6"
                            style="padding-left: 72px; display: flex; align-items: center"
                          >
                            <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                            <span class="text-weight-regular">{{ expenseSubItem.name }}</span>
                          </div>
                          <div class="col-3 text-center" style="display: flex; align-items: center; justify-content: center">
                            {{ formatCurrency(expenseSubItem.balance || 0) }}
                          </div>
                          <div class="col-3 text-center" style="display: flex; align-items: center; justify-content: center">
                            <q-btn
                              dense
                              :label="isSelected(expenseSubItem) ? 'Selected' : (expenseSubItem.balance > 0 ? 'Select' : 'Select (₱0)')"
                              :color="isSelected(expenseSubItem) ? 'positive' : (expenseSubItem.balance > 0 ? 'primary' : 'grey')"
                              :disable="!canSelectAccount(expenseSubItem)"
                              @click="toggleAccountSelection(expenseSubItem)"
                              size="sm"
                            />
                          </div>
                        </div>
                      </template>
                    </template>
                  </template>
                </template>
              </template>
            </template>

            <!-- No Data State -->
            <div v-if="displayAccounts.length === 0" class="full-width row flex-center q-gutter-sm q-pa-lg">
              <q-icon name="warning" color="orange" size="2em" />
              <div class="text-center">
                <div class="text-h6 text-orange">No Expense Accounts Available</div>
                <div class="text-body2 text-grey-7 q-mt-sm">
                  This could be due to:
                </div>
                <div class="text-body2 text-grey-6 q-mt-xs">
                  • Expense hierarchy not loaded<br>
                  • No expense accounts configured<br>
                  • Search filter too restrictive<br>
                  • Network connection issues
                </div>
                <div class="text-body2 text-grey-7 q-mt-sm">
                  Please ensure the expense library is properly configured and try again.
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-sm">
        <q-btn flat label="Cancel" color="secondary" @click="store.closeDialog('augExpense')" />
        <q-btn
          label="Confirm Selection"
          class="modal-save-btn"
          @click="confirmSelection"
          :loading="store.loading"
          :disable="selectedAccountsCount === 0"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useAugmentationStore } from 'stores/augmentation'
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const store = useAugmentationStore()
const $q = useQuasar()
const searchQuery = ref('')
const selectedAccounts = ref([])

// Transform expense accounts for hierarchical display
const displayAccounts = computed(() => {
  // Get the complete expense hierarchy from the augmentation store
  // This contains ALL expense accounts in hierarchical structure (same as CommitDialog)
  console.log('=== DISPLAY ACCOUNTS COMPUTED ===')
  console.log('store.expenseHierarchy:', store.expenseHierarchy)
  console.log('store.expenseHierarchy type:', typeof store.expenseHierarchy)
  console.log('store.expenseHierarchy length:', store.expenseHierarchy?.length)
  console.log('store.filteredExpenseAccounts:', store.filteredExpenseAccounts)
  console.log('store.filteredExpenseAccounts length:', store.filteredExpenseAccounts?.length)
  
  // Always use the complete expense hierarchy, not the filtered accounts
  // This ensures we show ALL accounts (allocated and unallocated)
  const rawData = store.expenseHierarchy
  const allocations = Array.isArray(rawData?.data)
    ? rawData.data
    : Array.isArray(rawData)
      ? rawData
      : []
  
  console.log('allocations:', allocations)
  console.log('allocations length:', allocations.length)
  
  if (allocations.length === 0) {
    console.log('No allocations found - returning empty array')
    return []
  }

  const filteredData = searchQuery.value
    ? filterBySearchQuery(allocations, searchQuery.value)
    : allocations

  console.log('filteredData:', filteredData)
  console.log('=== END DISPLAY ACCOUNTS COMPUTED ===')

  // The backend data is already in hierarchical structure
  // We just need to add the required properties for our display
  return filteredData.map((expenseClass) => ({
    id: expenseClass.id,
    name: expenseClass.name,
    isMainCategory: true, // Expense classes are main categories
    balance: 0, // Default balance for unallocated accounts
    level: 'class',
    expense_class_id: expenseClass.id,
    expense_type_id: null,
    expense_item_id: null,
    expense_sub_item_id: null,
    children: Array.isArray(expenseClass.children)
      ? expenseClass.children.map((expenseType) => ({
          id: expenseType.id,
          name: expenseType.name,
          isMainCategory: false,
          balance: 0, // Default balance for unallocated accounts
          level: 'type',
          expense_class_id: expenseClass.id,
          expense_type_id: expenseType.id,
          expense_item_id: null,
          expense_sub_item_id: null,
          children: Array.isArray(expenseType.children)
            ? expenseType.children.map((item) => ({
                id: item.id,
                name: item.name,
                isMainCategory: false,
                balance: 0, // Default balance for unallocated accounts
                level: 'item',
                expense_class_id: expenseClass.id,
                expense_type_id: expenseType.id,
                expense_item_id: item.id,
                expense_sub_item_id: null,
                children: [], // No sub-items in the current backend response
              }))
            : [],
        }))
      : [],
  }))
})

const filterBySearchQuery = (allocations, query) => {
  const lowerQuery = String(query || '').toLowerCase()

  const matchText = (text) => String(text || '').toLowerCase().includes(lowerQuery)

  const filterType = (expenseType) => {
    const typeMatches = matchText(expenseType.name)

    let filteredItems = []
    if (Array.isArray(expenseType.children)) {
      filteredItems = expenseType.children
        .map(filterItem)
        .filter(Boolean)
    }

    if (typeMatches || filteredItems.length > 0) {
      return {
        ...expenseType,
        children: filteredItems
      }
    }
    return null
  }

  const filterItem = (item) => {
    const itemMatches = matchText(item.name)

    let filteredSubItems = []
    if (Array.isArray(item.children)) {
      filteredSubItems = item.children.filter((sub) => matchText(sub.name))
    }

    if (itemMatches || filteredSubItems.length > 0) {
      return {
        ...item,
        children: filteredSubItems
      }
    }
    return null
  }

  return allocations
    .map((expenseClass) => {
      const classMatches = matchText(expenseClass.name)

      let filteredTypes = []
      if (Array.isArray(expenseClass.children)) {
        filteredTypes = expenseClass.children
          .map(filterType)
          .filter(Boolean)
      }

      if (classMatches || filteredTypes.length > 0) {
        return {
          ...expenseClass,
          children: filteredTypes
        }
      }
      return null
    })
    .filter(Boolean)
}

// Calculate totals for display
const calculateClassTotal = (expenseClass) => {
  let total = 0
  expenseClass.children?.forEach((expenseType) => {
    if ((!expenseType.children || expenseType.children.length === 0) && expenseType.balance) {
      total += expenseType.balance
    }
    expenseType.children?.forEach((item) => {
      if (item.children && item.children.length > 0) {
        item.children.forEach((subItem) => {
          if (subItem.balance) {
            total += subItem.balance
          }
        })
      } else if (item.balance) {
        total += item.balance
      }
    })
  })
  return total
}

const calculateTypeTotal = (expenseType) => {
  let total = 0
  expenseType.children?.forEach((item) => {
    if (item.children && item.children.length > 0) {
      item.children.forEach((subItem) => {
        if (subItem.balance) {
          total += subItem.balance
        }
      })
    } else if (item.balance) {
      total += item.balance
    }
  })
  return total
}

const calculateItemTotal = (expenseItem) => {
  let total = 0
  expenseItem.children?.forEach((subItem) => {
    if (subItem.balance) {
      total += subItem.balance
    }
  })
  return total
}

// Selection logic
const isSelected = (account) => {
  return selectedAccounts.value.some(selected => 
    selected.id === account.id && selected.level === account.level
  )
}

const canSelectAccount = (account) => {
  // Allow selection of all accounts, even those with 0 balance
  // This enables augmentation to accounts that haven't been allocated yet
  return true
}

const toggleAccountSelection = (account) => {
  const index = selectedAccounts.value.findIndex(selected => 
    selected.id === account.id && selected.level === account.level
  )
  
  if (index > -1) {
    selectedAccounts.value.splice(index, 1)
  } else {
    selectedAccounts.value.push({
      id: account.id,
      name: account.name,
      level: account.level,
      balance: account.balance,
      account: account.account,
      expense_class_id: account.expense_class_id,
      expense_type_id: account.expense_type_id,
      expense_item_id: account.expense_item_id,
      expense_sub_item_id: account.expense_sub_item_id,
    })
  }
}

// Computed properties
const selectedAccountsCount = computed(() => selectedAccounts.value.length)

const availableForAugmentation = computed(() => {
  return selectedAccounts.value.reduce((total, account) => total + (account.balance || 0), 0)
})

// Utility functions
const formatCurrency = (value) => {
  if (!value && value !== 0) return '₱0.00'
  return `₱${parseFloat(value).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
}

const getExpenseClassColor = (expenseClass) => {
  if (!expenseClass) return 'grey'

  const classColors = {
    'Sangguniang Kabataan': 'purple',
    'General Services': 'blue',
    'Social Services': 'green',
    'Economic Services': 'orange',
    'Environmental Services': 'teal',
    'Capital Outlay': 'indigo',
    'Disaster Risk Reduction': 'red',
    'Infrastructure': 'brown',
    'Peace and Order': 'deep-orange',
    'Sports and Recreation': 'pink',
    'Other': 'grey'
  }

  return classColors[expenseClass] || 'info'
}

const getTypeClass = (expenseType) => {
  return expenseType.children?.length > 0 ? 'text-weight-bold' : 'text-weight-regular'
}

// Actions
const confirmSelection = () => {
  if (selectedAccounts.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Please select at least one expense account',
      icon: 'warning',
      position: 'top',
    })
    return
  }

  // For now, we'll open the expense detail dialog for the first selected account
  // This maintains compatibility with the existing flow
  if (selectedAccounts.value.length > 0) {
    const firstAccount = selectedAccounts.value[0]
    store.openExpenseDetail(firstAccount.account)
  }
  
  $q.notify({
    type: 'positive',
    message: `${selectedAccounts.value.length} expense account(s) selected for augmentation`,
    icon: 'check_circle',
    position: 'top',
  })

  store.closeDialog('augExpense')
}

// Load complete expense hierarchy when dialog opens
const loadExpenseHierarchy = async () => {
  try {
    console.log('=== LOADING EXPENSE HIERARCHY ===')
    console.log('Before fetch - store.expenseHierarchy:', store.expenseHierarchy)
    
    // Load the complete expense hierarchy from the augmentation store
    // This uses the same API endpoint as the appropriation store
    await store.fetchExpenseAccounts()
    
    console.log('After fetch - store.expenseHierarchy:', store.expenseHierarchy)
    console.log('After fetch - store.expenseHierarchy length:', store.expenseHierarchy?.length)
    console.log('=== END LOADING EXPENSE HIERARCHY ===')
  } catch (error) {
    console.warn('Could not load complete expense hierarchy:', error)
  }
}

// Watch for dialog open to load expense hierarchy
watch(() => store.dialogs.augExpense, (isOpen) => {
  if (isOpen) {
    loadExpenseHierarchy()
  } else {
    selectedAccounts.value = []
  }
})

// Load expense hierarchy on component mount
onMounted(() => {
  if (store.dialogs.augExpense) {
    loadExpenseHierarchy()
  }
})
</script>

<style scoped>
.expense-selection-card {
  display: flex;
  flex-direction: column;
}

.q-card-section {
  flex: none;
}

.hierarchical-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.hierarchical-body {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
}

.hierarchical-table .row {
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  min-height: 48px;
}

.hierarchical-table .row:last-child {
  border-bottom: none;
}

.expense-class-badge {
  font-size: 0.75rem;
  font-weight: 500;
  color: black !important;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .expense-selection-card {
    min-width: 90vw !important;
  }

  .hierarchical-body {
    max-height: calc(80vh - 200px);
  }
}

@media (max-width: 900px) {
  .expense-selection-card {
    min-width: 95vw !important;
  }

  .hierarchical-body {
    max-height: calc(85vh - 200px);
  }

  /* Make summary section more compact on mobile */
  .row.q-mb-sm {
    gap: 8px;
  }

  .col-md-6.col-12 {
    margin-bottom: 8px !important;
  }
}

/* Mobile responsive adjustments */
@media (max-width: 600px) {
  .q-dialog .q-card {
    width: 95vw !important;
    min-width: 95vw !important;
    max-width: 95vw !important;
    margin: 8px !important;
  }

  .q-dialog .q-card-section {
    padding: 12px !important;
  }

  .q-dialog .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .hierarchical-table .row {
    font-size: 10px !important;
  }

  .hierarchical-table .row > div {
    padding: 4px 2px !important;
  }

  .q-btn {
    min-height: 32px !important;
    font-size: 0.7rem !important;
  }
}
</style>
    