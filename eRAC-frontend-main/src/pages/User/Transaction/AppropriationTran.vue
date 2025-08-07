<template>
  <q-page class="q-pa-lg appropriation-page">

    <div class="page-header q-mb-lg">
       <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">Appropriation Transaction</div>
      <q-btn
          icon="refresh"
          color="primary"
          flat
          round
          @click="loadPendingUsers"
          :loading="loading"

        />
        </div>
</div>
    <div class="q-mb-md">
      <!-- Desktop & Mobile: All in one row -->
      <div class="row items-center justify-between q-gutter-sm all-in-one-row">
        <q-input
          bg-color="white"
          outlined
          dense
          placeholder="Search Description..."
          v-model="appropriationStore.searchQuery"
          class="custom-search-input"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
          <q-input
          bg-color="white"
          outlined
          dense
          :model-value="dateRangeDisplay"
          label="Date Range"
          class="custom-date-range"
          clearable
          @clear="onDateRangeClear"
          readonly
        >
          <template v-slot:append>
            <q-icon name="event" class="calend-icon">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date
                  v-model="dateRange"
                  range
                  @update:model-value="onDateRangeChange"
                />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
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
        <q-space />

        <q-btn label="Add" icon="add" color="primary" style="min-width: 150px; border-radius: 3px; font-size: small !important;" @click="addBudget"/>

        <!-- Clear All Filters Button -->

      </div>
      <!-- iPad: Search input in one row, From/To/Add in a single row below -->
      <div class="ipad-search-row" style="display: none;">
        <q-input
          bg-color="white"
          outlined
          dense
          placeholder="Search Description..."
          v-model="appropriationStore.searchQuery"
          class="custom-search-input"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="row items-center q-gutter-sm ipad-dateadd-row" style="display: none;">
        <q-input
          bg-color="white"
          outlined
          dense
          :model-value="dateRangeDisplay"
          label="Date Range"
          class="custom-date-range"
          clearable
          @clear="onDateRangeClear"
          readonly
        >
          <template v-slot:append>
            <q-icon name="event" class="calend-icon">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date
                  v-model="dateRange"
                  range
                  @update:model-value="onDateRangeChange"
                />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-btn label="Add" icon="add" color="primary" style="min-width: 180px;" @click="addBudget" />


      </div>
    </div>


    <!-- Add Budget Dialog-->
    <q-dialog v-model="showDialog" @keydown.enter="handleEnterKey">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add New Budget</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <!-- Fiscal Year Selection -->
          <q-select
            filled
            v-model="selectedFiscalYear"
            :options="accountLibraryStore.yearOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Fiscal Year"
            :rules="[(val) => !!val || 'Required']"
            @keydown.enter="handleEnterKey"
          />

          <!-- Auto-filled Dates Based on Selected Year -->

          <q-input
            class="col"
            filled
            v-model="startDate"
            label="Start Date"
            mask="date"
            :rules="['date']"
            @keydown.enter="handleEnterKey"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy>
                  <q-date v-model="startDate" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <div class="q-mb-md">
            <strong>Description:</strong><br />
            <q-input
              filled
              v-model="description"
              placeholder="Budget description"
              @keydown.enter="handleEnterKey"
            />
          </div>
          <div class="q-mb-md">
            <strong>Amount:</strong><br />
            <q-input
              filled
              v-model="amount"
              prefix="₱"
              placeholder="0.00"
              type="number"
              @keydown.enter="handleEnterKey"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right" class="custom-actions">
          <q-btn flat label="Cancel" v-close-popup class="modal-cancel-btn" />
          <q-btn label="Save" class="modal-save-btn" @click="saveBudget" :loading="loading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Data Table -->
    <q-card>
      <q-table
        :rows="appropriationStore.filteredAppropriations"
        :columns="columns"
        :loading="appropriationStore.loading"
        row-key="id"
      >

        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ props.pageIndex + 1 }}
          </q-td>
        </template>
        <template v-slot:body-cell-amount="props">
          <q-td :props="props">
            {{ appropriationStore.formatCurrency(props.row.amount) }}
          </q-td>
        </template>

        <template v-slot:body-cell-unappropriated="props">
          <q-td :props="props">
            {{ appropriationStore.formatCurrency(props.row.unappropriated) }}
          </q-td>
        </template>

         <template v-slot:body-cell-commit="props">
          <q-td :props="props">
            <q-btn
                class="allocate-btn"
                label="Commit"
                @click="openAllocationDialog(props.row)"
                :disable="props.row.unappropriated <= 0"
              />
          </q-td>

        </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="button-group">
              <q-btn
                class="edit-btn"
                icon="edit"
                @click="openEditAllocationDialog(props.row)"
                :disable="!props.row.allocations || props.row.allocations.length === 0"
              />

              <q-btn class="allocate-btn" icon="visibility" @click="openViewDialog(props.row)" />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>
    <CommitDialog />
    <ViewCommitDialog ref="viewDialogRef" />
    <!-- Edit Allocation Dialog -->
    <q-dialog v-model="showEditAllocationDialog">
      <q-card style="min-width: 700px">
        <q-card-section>
          <div class="text-h6">Edit Allocation</div>
        </q-card-section>
        <q-card-section>
          <div class="hierarchical-table" style="border: 1px solid #e0e0e0; border-radius: 4px">
            <div
              class="row q-table__top bg-grey-3 text-weight-bold"
              style="padding: 8px 12px; min-height: 40px"
            >
              <div class="col-6">Type</div>
              <div class="col-6 text-right">Amount (₱)</div>
            </div>
            <div class="hierarchical-body" style="max-height: 400px; overflow-y: auto">
              <template v-for="expenseClass in editDisplayAccounts" :key="'class-' + expenseClass.id">
                <!-- Expense Class Row -->
                <div
                  class="row bg-grey-3 text-weight-bold"
                  style="padding: 12px 12px; min-height: 32px"
                >
                  <div class="col-12">{{ expenseClass.name }}</div>
                </div>
                <!-- Expense Type Rows -->
                <template v-for="expenseType in expenseClass.children" :key="'type-' + expenseType.id">
                  <div
                    class="row"
                    style="padding: 6px 12px; min-height: 32px; border-bottom: 1px solid #f0f0f0"
                  >
                    <div class="col-6" style="padding-left: 24px; display: flex; align-items: center">
                      <q-btn
                        dense
                        flat
                        :icon="(expenseType.children && expenseType.children.length > 0 && expandedEditTypes[expenseType.id]) ? 'expand_more' : 'chevron_right'"
                        @click="(expenseType.children && expenseType.children.length > 0) ? toggleEditType(expenseType.id) : null"
                        class="q-mr-sm"
                        :class="{ 'cursor-default': !expenseType.children || expenseType.children.length === 0 }"
                      />
                      <span>{{ expenseType.name }}</span>
                    </div>
                    <div class="col-6 text-right">
                      <!-- Show input only if no items exist -->
                      <q-input
                        v-if="canEditType(expenseType)"
                        v-model.number="expenseType.amount"
                        type="number"
                        dense
                        min="0"
                        style="width: 100px"
                        :class="{ 'text-negative': typeErrorMap[expenseType.id] }"
                      />
                      <!-- Show read-only total if items exist -->
                      <div v-else class="text-weight-bold">
                        {{ appropriationStore.formatCurrency(calculateTypeTotal(expenseType)) }}
                      </div>
                    </div>
                  </div>
                  <template v-if="expandedEditTypes[expenseType.id] && expenseType.children && expenseType.children.length > 0">
                    <template v-for="expenseItem in expenseType.children" :key="'item-' + expenseItem.id">
                      <div
                        class="row"
                        style="padding: 6px 12px; min-height: 32px; border-bottom: 1px solid #f0f0f0"
                      >
                        <div class="col-6" style="padding-left: 48px; display: flex; align-items: center">
                          <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                          <span class="text-weight-regular">{{ expenseItem.name }}</span>
                        </div>
                        <div class="col-6 text-right">
                          <q-input
                            v-model.number="expenseItem.amount"
                            type="number"
                            dense
                            min="0"
                            style="width: 100px"
                          />
                        </div>
                      </div>
                    </template>
                  </template>
                </template>
              </template>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup @click="closeEditAllocationDialog" />
          <q-btn label="Save Changes" color="primary" @click="saveEditedAllocation" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import CommitDialog from 'components/appropriation/CommitDialog.vue'
import ViewCommitDialog from 'components/appropriation/ViewCommitDialog.vue'
import { useAppropriationStore } from 'stores/appropriationStore'
import { useAccountsLibraryStore } from 'stores/accountsLibstore'
import { api } from 'src/boot/axios'


const $q = useQuasar()
const accountLibraryStore = useAccountsLibraryStore()
const appropriationStore = useAppropriationStore()

const showDialog = ref(false)
const selectedFiscalYear = ref(null)
const startDate = ref('')
const endDate = ref('')
const description = ref('')
const amount = ref(null)
const loading = ref(false)
const dateRange = ref(null)

const loadPendingUsers = async () => {
  loading.value = true
  try {
    await appropriationStore.fetchBudgets()
     $q.notify({
      type: 'positive',
      message: 'Appropriation refreshed!',
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
    // Convert date format from YYYY/MM/DD to DD/MM/YYYY
    const fromDate = new Date(newRange.from)
    const toDate = new Date(newRange.to)

    appropriationStore.dateFrom = fromDate.toLocaleDateString('en-GB') // DD/MM/YYYY format
    appropriationStore.dateTo = toDate.toLocaleDateString('en-GB') // DD/MM/YYYY format
  } else {
    appropriationStore.dateFrom = ''
    appropriationStore.dateTo = ''
  }
}

const onDateRangeClear = () => {
  dateRange.value = null
  appropriationStore.dateFrom = ''
  appropriationStore.dateTo = ''
}

const clearAllFilters = () => {
  appropriationStore.searchQuery = ''
  appropriationStore.dateFrom = ''
  appropriationStore.dateTo = ''
  dateRange.value = null
}

const showEditAllocationDialog = ref(false)
const editAllocations = ref([])
const expandedEditTypes = ref({})
const typeErrorMap = ref({})
const editDisplayAccounts = ref([])

// Function to initialize editDisplayAccounts from editAllocations
const initializeEditDisplayAccounts = () => {
  if (!editAllocations.value || editAllocations.value.length === 0) {
    editDisplayAccounts.value = []
    return
  }

  // Group allocations by class/type/item (similar to ViewCommitDialog)
  const classMap = {}
  editAllocations.value.forEach((alloc) => {
    const classId = alloc.expense_class_id || 'unclassified'
    const className = alloc.expense_class_name || 'Unclassified'
    const typeId = alloc.expense_type_id
    const typeName = alloc.expense_type_name || `Type ${typeId}`
    const itemId = alloc.expense_item_id
    const itemName = alloc.expense_item_name || `Item ${itemId}`

    // Initialize class if not exists
    if (!classMap[classId]) {
      classMap[classId] = {
        id: classId,
        name: className,
        children: [],
      }
    }

    // Handle type-level allocations (no item ID)
    if (typeId && !itemId) {
      // Check if type already exists
      const existingType = classMap[classId].children.find((t) => t.id === typeId)
      if (existingType) {
        existingType.amount += alloc.amount
      } else {
        classMap[classId].children.push({
          id: typeId,
          name: typeName,
          amount: alloc.amount,
          children: [],
        })
      }
    }

    // Handle item-level allocations
    if (itemId) {
      let type = classMap[classId].children.find((t) => t.id === typeId)
      if (!type) {
        type = {
          id: typeId,
          name: typeName,
          amount: 0, // Type amount should be 0 when items exist
          children: [],
        }
        classMap[classId].children.push(type)
      } else {
        // If type already exists and has items, ensure type amount is 0
        type.amount = 0
      }
      type.children.push({
        id: itemId,
        name: itemName,
        amount: alloc.amount,
      })
    }
  })

  // Sort classes, types, and items by id to keep order static
  const classArr = Object.values(classMap)
  classArr.forEach(cls => {
    cls.children.sort((a, b) => a.id - b.id)
    cls.children.forEach(type => {
      if (type.children) {
        type.children.sort((a, b) => a.id - b.id)
      }
    })
  })

  editDisplayAccounts.value = classArr
}

// Expand types with children by default when editDisplayAccounts changes
watch(
  () => editDisplayAccounts.value,
  (newVal) => {
    if (Array.isArray(newVal)) {
      const expanded = {}
      newVal.forEach((expenseClass) => {
        if (expenseClass && Array.isArray(expenseClass.children)) {
          expenseClass.children.forEach((expenseType) => {
            // Only expand types that have children
            if (expenseType && expenseType.id && expenseType.children && expenseType.children.length > 0) {
              expanded[expenseType.id] = true
            }
          })
        }
      })
      expandedEditTypes.value = expanded
    }
  },
  { immediate: true }
)

const toggleEditType = (typeId) => {
  // Find the expense type to check if it has children
  let hasChildren = false
  editDisplayAccounts.value.forEach(expenseClass => {
    const expenseType = expenseClass.children?.find(type => type.id === typeId)
    if (expenseType && expenseType.children && expenseType.children.length > 0) {
      hasChildren = true
    }
  })

  // Only toggle if the type has children
  if (hasChildren) {
    expandedEditTypes.value[typeId] = !expandedEditTypes.value[typeId]
  }
}

const openAllocationDialog = async (row) => {
  await appropriationStore.openAllocationDialog(row)
}

const viewDialogRef = ref(null)

const openViewDialog = (row) => {
  if (viewDialogRef.value) {
    viewDialogRef.value.openDialog(row)
  } else {
    console.error('View dialog reference is not available')
  }
}

// Automatically set dates when fiscal year changes
// Automatically set dates when fiscal year changes
watch(selectedFiscalYear, (newYearId) => {
  if (newYearId) {
    const yearObj = accountLibraryStore.yearOptions.find((y) => y.value === newYearId)
    if (yearObj) {
      const today = new Date()
      const formattedToday = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`

      startDate.value = formattedToday // Set to current date (YYYY/MM/DD)
      endDate.value = `${yearObj.yearValue}/12/31` // Keep original end date logic
    }
  }
})

// Remove or rename any function named editBudgetDialog to avoid conflict
// Use showEditAllocationDialog as the v-model for the edit allocation dialog
// Ensure all dialog open/close logic uses showEditAllocationDialog
const openEditAllocationDialog = async (row) => {
  try {
    // Fetch full allocation history for this budget
    const response = await api.get(`/api/barangay/budgets/${row.id}/history`)
    const allHistory = response.data.data?.history || []
    // Use the most recent allocation set for editing
    const latestAllocations = allHistory.length > 0 ? allHistory[0].allocations : []
    editAllocations.value = JSON.parse(JSON.stringify(latestAllocations))
    // Initialize the display accounts for editing
    initializeEditDisplayAccounts()
    appropriationStore.selectedRow = row; // <-- Fix: set selectedRow for save
    showEditAllocationDialog.value = true
  } catch (error) {
    console.error('Failed to load allocation details for editing:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load allocation details for editing',
      icon: 'error',
      position: 'top',
    })
  }
  }

// The dialog should be closed with:
const closeEditAllocationDialog = () => {
  showEditAllocationDialog.value = false
  typeErrorMap.value = {} // Clear errors on close
  editDisplayAccounts.value = [] // Reset edit display accounts
}

// In the template, ensure:
// <q-dialog v-model="showEditAllocationDialog">
// ...
// <q-btn flat label="Cancel" v-close-popup @click="closeEditAllocationDialog" />
// ...

// Fix the saveBudget function
const saveBudget = async () => {
  loading.value = true
  try {
    const payload = {
      fiscal_year_id: selectedFiscalYear.value,
      original_amount: parseFloat(amount.value),
      description: description.value,
      start_date: startDate.value.replace(/\//g, '-'),
      end_date: endDate.value.replace(/\//g, '-'),
    }

    // Call the store action
    await appropriationStore.addBudget(payload)

    // Show success message
    $q.notify({
      type: 'positive',
      message: 'Budget added successfully!',
      icon: 'check_circle',
      position: 'top',
    })

    // Reset form
    showDialog.value = false
    description.value = ''
    amount.value = null

    // Optional: Refresh data (only if your API returns incomplete data)
    // await appropriationStore.fetchBudgets()
  } catch (error) {
    console.error('Save error:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to save budget',
      icon: 'error',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

// Utility function to parse currency values
const parseCurrency = (value) => {
  if (!value && value !== 0) return 0
  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
}

const calculateTypeTotal = (type) => {
  if (!type || !type.children) return 0
  return type.children.reduce((sum, item) => sum + parseCurrency(item.amount), 0)
}

// Helper function to check if a type can be edited (has no items)
const canEditType = (expenseType) => {
  return !expenseType.children || expenseType.children.length === 0
}

const saveEditedAllocation = async () => {
  try {
    const allocations = []

    // Calculate total allocation amount for validation
    let totalAllocated = 0

    // Process both type-level and item-level allocations
    editDisplayAccounts.value.forEach((expenseClass) => {
      if (!expenseClass || !Array.isArray(expenseClass.children)) return

      expenseClass.children.forEach((expenseType) => {
        // Handle type-level allocations (only when no items exist)
        if (canEditType(expenseType)) {
          const typeAmount = parseCurrency(expenseType.amount)
          if (typeAmount > 0) {
            totalAllocated += typeAmount
          }
          allocations.push({
            id: expenseType.id,
            type: 'type',
            amount: typeAmount,
            expense_class_id: expenseClass.id,
            expense_type_id: expenseType.id,
            expense_item_id: null
          })
        }

        // If items exist, ensure type amount is 0 (type amount should be sum of items)
        if (!canEditType(expenseType) && parseCurrency(expenseType.amount) > 0) {
          throw new Error(`Cannot set amount for type "${expenseType.name}" because it has items. Type amount should be the sum of its items.`)
        }

        // Handle item-level allocations
        if (expenseType.children && Array.isArray(expenseType.children)) {
          expenseType.children.forEach((item) => {
            if (!item) return

            const itemAmount = parseCurrency(item.amount)
            if (itemAmount > 0) {
              totalAllocated += itemAmount
            }
            allocations.push({
              id: item.id,
              type: 'item',
              amount: itemAmount,
              expense_class_id: expenseClass.id,
              expense_type_id: expenseType.id,
              expense_item_id: item.id
            })
          })
        }
      })
    })

    // Validate against budget limit
    const availableBudget = appropriationStore.selectedRow?.unappropriated || 0
    if (totalAllocated > availableBudget) {
      throw new Error(`Total allocation (₱${totalAllocated.toFixed(2)}) exceeds available budget (₱${availableBudget.toFixed(2)})`)
    }

    // Use the saveAllocation endpoint instead of updateAllocations
    await api.post(`/api/barangay/budgets/${appropriationStore.selectedRow.id}/allocate`, { allocations })
    $q.notify({
      type: 'positive',
      message: 'Allocations updated',
      icon: 'check_circle',
      position: 'top',
    })
    showEditAllocationDialog.value = false
    typeErrorMap.value = {} // Clear errors on success
    await appropriationStore.fetchBudgets()
  } catch (error) {
    let message = error.message || 'Failed to update allocations'
    if (error.response && error.response.status === 422 && error.response.data && error.response.data.message) {
      message = error.response.data.message
      // Mark all types as error (or you can be more specific if you want)
      const errorMap = {}
      editDisplayAccounts.value.forEach(expenseClass => {
        if (!expenseClass || !Array.isArray(expenseClass.children)) return
        expenseClass.children.forEach(expenseType => {
          if (expenseType && expenseType.id) {
            errorMap[expenseType.id] = true
          }
        })
      })
      typeErrorMap.value = errorMap
    } else {
      typeErrorMap.value = {}
    }
    $q.notify({
      type: 'negative',
      message,
      icon: 'error',
      position: 'top',
    })
    console.error(error)
  }
}

// Initialize component
onMounted(async () => {
  try {
    await appropriationStore.fetchBudgets()

    // Access the loaded data
    console.log('Appropriations:', appropriationStore.appropriations)
    console.log('Total Available:', appropriationStore.totalAvailable)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to load budgets',
      icon: 'error',
      position: 'top',
    })
  }
})

/*const editAllocate = (row) => {
  appropriationStore.editAllocate(row)
}
*/
const columns = [
  {
    name: 'index',
    label: '#',
    field: 'index',
    align: 'left',
    sortable: false, // optional: disable sorting
  },
  {
    name: 'startdate',
    label: 'Entry Date',
    field: 'date',
    align: 'left',
    sortable: true,
    format: (val) => appropriationStore.formatDate(val),
  },
  // {
  //   name: 'date',
  //   label: 'Date Allocated',
  //   field: 'date',
  //   align: 'left',
  //   sortable: true,
  //   format: (val) => appropriationStore.formatDate(val),
  // },
  {
    name: 'description',
    label: 'Description',
    field: 'description',
    align: 'left',
  },
  {
    name: 'amount',
    label: 'Amount',
    field: 'amount',
    align: 'left',
    format: (val) => appropriationStore.formatCurrency(val),
  },
  {
    name: 'unappropriated',
    label: 'Unappropriated',
    field: 'unappropriated',
    align: 'left',
    format: (val) => appropriationStore.formatCurrency(val),
  },

  {
    name: 'action',
    label: 'Action',
    align: 'center',
    field: 'action',
  },
   {
    name: 'commit',
    label: 'Commit',
    field: 'commit',
    align: 'center',

  },
]

const handleEnterKey = (event) => {
  // Prevent default behavior to avoid form submission
  event.preventDefault()
  // Only save if the dialog is open and not currently loading
  if (showDialog.value && !loading.value) {
    saveBudget()
  }
}

const addBudget = () => {
  openDialog()
}

const openDialog = async () => {
  try {
    await accountLibraryStore.fetchYears()
    // Auto-select current year if available
    const currentYear = new Date().getFullYear().toString()
    const currentYearOption = accountLibraryStore.yearOptions.find(
      (y) => y.yearValue === currentYear,
    )
    selectedFiscalYear.value = currentYearOption?.value || accountLibraryStore.yearOptions[0]?.value
    showDialog.value = true
  } catch (error) {
    console.error('Error loading fiscal years:', error)
  }
}
</script>

<style scoped>
.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}

.custom-actions {
  margin-right: 10px;
}
.custom-actions .q-btn:not(:last-child) {
  margin-right: 5px; /* Adjust this value as needed */
}

/* Using the deep selector (Vue 3 syntax) */
.q-mb-md :deep(.q-input .q-field__control) {
  border-radius: 3px;
}
.appropriation-page {
  background-color: whitesmoke; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
}
.custom-search-input {
 width: 400px !important;
    min-width: 0 !important;
    max-width: 1200px !important;
}

.clear-all-btn {
  min-width: 120px;
}
@media (max-width: 600px) {
  .custom-search-input {
    min-width: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
}
@media (max-width: 900px) {
  .row.q-gutter-sm {
    flex-wrap: wrap;
  }
  .row.q-gutter-sm > *:not(.q-space) {
    flex: 1 1 100%;
    max-width: 100%;
    margin-bottom: 8px;
  }
  .q-space {
    display: none !important;
  }
}
@media (min-width: 768px) and (max-width: 1024px) {
  .all-in-one-row {
    display: none !important;
  }
  .ipad-search-row {
    display: block !important;
    margin-bottom: 8px;
  }
  .ipad-dateadd-row {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
    margin-bottom: 8px;
  }
  .ipad-date-row {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
    margin-bottom: 8px;
  }
  .custom-date-range {
    flex: 1 1 0 !important;
    width: 250px !important;
    min-width: 0 !important;
    max-width: 350px !important;

  }
}
@media (max-width: 767px), (min-width: 1025px) {
  .ipad-search-row,
  .ipad-dateadd-row {
    display: none !important;
  }
  .all-in-one-row {
    display: flex !important;
  }
  .ipad-date-row {
    display: none !important;
  }
}
 .custom-date-range {
    width: 250px !important;
    min-width: 0 !important;
    max-width: 350px !important;
  }

/* Responsive Dialog - Only sizing adjustments */
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
}

@media (min-width: 1201px) {
  /* Desktop View - Only size adjustments */
  .q-dialog .q-card {
    width: 500px !important;
    min-width: 500px !important;
    max-width: 500px !important;
  }

  .q-dialog .q-card-section {
    padding: 24px !important;
  }

  .q-dialog .q-gutter-md {
    gap: 20px !important;
  }

  .q-dialog .q-select,
  .q-dialog .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }
}
</style>
