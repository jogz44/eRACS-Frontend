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
        <q-space />
        <q-input
          bg-color="white"
          outlined
          dense
          label="From"
          v-model="appropriationStore.dateFrom"
          mask="##/##/####"
          class="custom-date-from"
        >
          <template v-slot:append>
            <q-icon name="event" class="calend-icon">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="appropriationStore.dateFrom" mask="DD/MM/YYYY" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-input
          bg-color="white"
          outlined
          dense
          label="To"
          v-model="appropriationStore.dateTo"
          mask="##/##/####"
          class="custom-date-to"
        >
          <template v-slot:append>
            <q-icon name="event" class="calend-icon">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="appropriationStore.dateTo" mask="DD/MM/YYYY" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-btn label="Add" icon="add" color="primary" style="min-width: 180px;" @click="addBudget" />
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
          label="From"
          v-model="appropriationStore.dateFrom"
          mask="##/##/####"
          class="custom-date-from"
        >
          <template v-slot:append>
            <q-icon name="event" class="calend-icon">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="appropriationStore.dateFrom" mask="DD/MM/YYYY" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-input
          bg-color="white"
          outlined
          dense
          label="To"
          v-model="appropriationStore.dateTo"
          mask="##/##/####"
          class="custom-date-to"
        >
          <template v-slot:append>
            <q-icon name="event" class="calend-icon">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="appropriationStore.dateTo" mask="DD/MM/YYYY" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-btn label="Add" icon="add" color="primary" style="min-width: 180px;" @click="addBudget" />
      </div>
    </div>


    <!-- Add Budget Dialog-->
    <q-dialog v-model="showDialog">
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
          />

          <!-- Auto-filled Dates Based on Selected Year -->

          <q-input
            class="col"
            filled
            v-model="startDate"
            label="Start Date"
            mask="date"
            :rules="['date']"
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
            <q-input filled v-model="description" placeholder="Budget description" />
          </div>
          <div class="q-mb-md">
            <strong>Amount:</strong><br />
            <q-input filled v-model="amount" prefix="₱" placeholder="0.00" type="number" />
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
              <q-btn
                class="allocate-btn"
                label="Commit"
                @click="openAllocationDialog(props.row)"
                :disable="props.row.unappropriated <= 0"
              />
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
                      <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                      <q-btn
                        dense
                        flat
                        :icon="expandedEditTypes[expenseType.id] ? 'expand_more' : 'chevron_right'"
                        @click="toggleEditType(expenseType.id)"
                        class="q-mr-sm"
                      />
                      <span>{{ expenseType.name }}</span>
                    </div>
                    <div class="col-6 text-right">
                      <strong :class="{ 'text-negative': typeErrorMap[expenseType.id] }">
                        {{ appropriationStore.formatCurrency(calculateTypeTotal(expenseType)) }}
                      </strong>
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

const showEditAllocationDialog = ref(false)
const editAllocations = ref([])
const expandedEditTypes = ref({})
const typeErrorMap = ref({})

const editDisplayAccounts = computed(() => {
  if (!editAllocations.value || editAllocations.value.length === 0) return []
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
          amount: 0,
          children: [],
        }
        classMap[classId].children.push(type)
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
  return classArr
})

// Expand all types by default when editDisplayAccounts changes
watch(
  () => editDisplayAccounts.value,
  (newVal) => {
    if (Array.isArray(newVal)) {
      const expanded = {}
      newVal.forEach((expenseClass) => {
        if (expenseClass && Array.isArray(expenseClass.children)) {
          expenseClass.children.forEach((expenseType) => {
            if (expenseType && expenseType.id) {
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
  expandedEditTypes.value[typeId] = !expandedEditTypes.value[typeId]
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

const calculateTypeTotal = (type) => {
  if (!type || !type.children) return 0
  return type.children.reduce((sum, item) => sum + item.amount, 0)
}

const saveEditedAllocation = async () => {
  try {
    // Flatten editDisplayAccounts into editAllocations before saving
    editDisplayAccounts.value.forEach((expenseClass) => {
      if (!expenseClass || !Array.isArray(expenseClass.children)) return
      expenseClass.children.forEach((expenseType) => {
        if (!expenseType || !Array.isArray(expenseType.children)) return
        expenseType.children.forEach((item) => {
          if (!item) return
          // Find the original allocation in editAllocations and update its amount
          const alloc = editAllocations.value.find(
            a => a.expense_item_id === item.id
          )
          if (alloc) {
            alloc.amount = item.amount
          }
        })
      })
    })
    const allocations = []
    editDisplayAccounts.value.forEach((expenseClass) => {
      if (!expenseClass || !Array.isArray(expenseClass.children)) return
      expenseClass.children.forEach((expenseType) => {
        if (!expenseType || !Array.isArray(expenseType.children)) return
        expenseType.children.forEach((item) => {
          if (!item) return
          if (typeof item.id !== 'undefined' && item.id !== null) {
            allocations.push({
              expense_item_id: item.id,
              amount: item.amount || 0,
            })
          }
        })
      })
    })
    await api.patch(`/api/barangay/budgets/${appropriationStore.selectedRow.id}/allocations`, { allocations })
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
    name: 'date',
    label: 'Date',
    field: 'date',
    align: 'left',
    sortable: true,
    format: (val) => appropriationStore.formatDate(val),
  },
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
    align: 'right',
    format: (val) => appropriationStore.formatCurrency(val),
  },
  {
    name: 'unappropriated',
    label: 'Unappropriated',
    field: 'unappropriated',
    align: 'right',
    format: (val) => appropriationStore.formatCurrency(val),
  },
  {
    name: 'action',
    label: 'Action',
    align: 'center',
    field: 'action',
  },
]

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
  border-radius: 8px;
}
.appropriation-page {
  background-color: #D9D9D9; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
}
.custom-search-input {
  min-width: 450px;
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
  .custom-date-from,
  .custom-date-to {
    flex: 1 1 0 !important;
    min-width: 120px !important;
    width: auto !important;
    max-width: 100% !important;
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
</style>
