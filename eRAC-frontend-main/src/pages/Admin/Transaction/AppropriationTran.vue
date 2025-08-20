<template>
  <q-page class="q-pa-md appropriation-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">Appropriation Transaction</div>

        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="loadAppropriation"
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
          v-model="appropriationStore.searchQuery"
          class="col-auto"
          style="min-width: 400px; background-color: white;"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-input
          outlined
          dense
          :model-value="dateRangeDisplay"
          label="Date Range"
          class="col-auto"
          style="min-width: 250px; background-color: white;"
          clearable
          @clear="onDateRangeClear"
          readonly
        >
          <template v-slot:append>
            <q-icon name="event">
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

        <q-btn
          dense
          outlined
          color="red-10"
          icon="clear_all"
          label="Clear All"
          @click="clearAllFilters"
          class="clear-all-btn"
          style="width: 9%;"
        />
        <q-space/>

          <div class="row  ">
        <q-btn
          unelevated
                icon="print"
                label="Print"
                color="green"
                @click="handleSACBPrint"
                size="md"
                no-caps
        />
          </div>


        <!-- <q-btn
          label="Add"
          icon="add"
          color="primary"
          @click="addBudget"
        /> -->
      </div>
    </div>

    <!-- Add Budget Dialog -->
    <q-dialog v-model="showDialog" @keydown.enter="handleEnterKey">
      <q-card style="min-width: 400px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Add New Budget</div>
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <q-select
            outlined
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

          <q-input
            outlined
            v-model="startDate"
            label="Start Date"
            mask="date"
            :rules="['date']"
            @keydown.enter="handleEnterKey"
          >
            <template v-slot:append>
              <q-icon name="event">
                <q-popup-proxy>
                  <q-date v-model="startDate" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-input
            outlined
            v-model="description"
            label="Description"
            @keydown.enter="handleEnterKey"
          />

          <q-input
            outlined
            v-model="amount"
            label="Amount"
            prefix="₱"
            type="number"
            @keydown.enter="handleEnterKey"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn label="Save" color="primary" @click="saveBudget" :loading="loading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Data Table -->
    <q-card flat bordered>
      <q-table
        :rows="appropriationStore.filteredAppropriations"
        :columns="columns"
        :loading="appropriationStore.loading"
        row-key="id"
        flat
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
              dense
              label="Commit"
              :color="props.row.unappropriated <= 0 ? 'primary' : 'grey-4'"
              @click="openAllocationDialog(props.row)"
              :disable="props.row.unappropriated <= 0"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-xs">
              <!-- <q-btn
                dense
                icon="edit"
                color="orange"
                @click="openEditAllocationDialog(props.row)"
                :disable="!props.row.allocations || props.row.allocations.length === 0"
              /> -->
              <q-btn
                dense
                icon="visibility"
                color="blue"
                @click="openViewDialog(props.row)"
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
        <q-card-section class="q-pb-none">
          <div class="text-h6">Edit Allocation</div>
        </q-card-section>

        <q-card-section>
          <div class="hierarchical-table" style="border: 1px solid #e0e0e0">
            <div class="row q-pa-sm bg-grey-2 text-weight-medium">
              <div class="col-6">Type</div>
              <div class="col-6 text-right">Amount (₱)</div>
            </div>

            <div class="hierarchical-body" style="max-height: 400px; overflow-y: auto">
              <template v-for="expenseClass in editDisplayAccounts" :key="'class-' + expenseClass.id">
                <div class="row q-pa-sm bg-grey-1 text-weight-medium">
                  <div class="col-12">{{ expenseClass.name }}</div>
                </div>

                <template v-for="expenseType in expenseClass.children" :key="'type-' + expenseType.id">
                  <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                    <div class="col-6" style="padding-left: 16px; display: flex; align-items: center">
                      <q-btn
                        dense
                        flat
                        :icon="(expenseType.children && expenseType.children.length > 0 && expandedEditTypes[expenseType.id]) ? 'expand_more' : 'chevron_right'"
                        @click="(expenseType.children && expenseType.children.length > 0) ? toggleEditType(expenseType.id) : null"
                        size="sm"
                      />
                      <span>{{ expenseType.name }}</span>
                    </div>
                    <div class="col-6 text-right">
                      <q-input
                        v-if="canEditType(expenseType)"
                        v-model.number="expenseType.amount"
                        type="number"
                        dense
                        outlined
                        min="0"
                        style="width: 100px"
                        :class="{ 'text-negative': typeErrorMap[expenseType.id] }"
                      />
                      <div v-else class="text-weight-medium">
                        {{ appropriationStore.formatCurrency(calculateTypeTotal(expenseType)) }}
                      </div>
                    </div>
                  </div>

                  <template v-if="expandedEditTypes[expenseType.id] && expenseType.children && expenseType.children.length > 0">
                    <template v-for="expenseItem in expenseType.children" :key="'item-' + expenseItem.id">
                      <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                        <div class="col-6" style="padding-left: 32px; display: flex; align-items: center">
                          <q-icon name="arrow_right" size="xs" class="q-mr-xs" />
                          <span>{{ expenseItem.name }}</span>
                        </div>
                        <div class="col-6 text-right">
                          <q-input
                            v-model.number="expenseItem.amount"
                            type="number"
                            dense
                            outlined
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

        <q-card-actions align="right" class="q-pa-md">
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
// import { api } from 'src/boot/axios' // No longer needed since we use appropriationStore.commitAllocation
// import SearchFilters from 'src/components/appropriation/SearchFilters.vue'

const $q = useQuasar()
const accountLibraryStore = useAccountsLibraryStore()
const appropriationStore = useAppropriationStore()

const showDialog = ref(false)
const selectedFiscalYear = computed({
  get: () => appropriationStore.selectedFiscalYear,
  set: (value) => appropriationStore.setSelectedFiscalYear(value)
})
const startDate = ref('')
const endDate = ref('')
const description = ref('')
const amount = ref(null)
const loading = ref(false)
const dateRange = ref(null)

const loadAppropriation = async () => {
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
    const fromDate = new Date(newRange.from)
    const toDate = new Date(newRange.to)
    appropriationStore.dateFrom = fromDate.toLocaleDateString('en-GB')
    appropriationStore.dateTo = toDate.toLocaleDateString('en-GB')
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
  // Reset fiscal year to current year if available, otherwise first available year
  const currentYear = new Date().getFullYear().toString()
  const defaultYear = appropriationStore.fiscalYears.includes(currentYear)
    ? currentYear
    : appropriationStore.fiscalYears[0]
  appropriationStore.setSelectedFiscalYear(defaultYear)
}

const showEditAllocationDialog = ref(false)
// const editAllocations = ref([])
const expandedEditTypes = ref({})
const typeErrorMap = ref({})
const editDisplayAccounts = ref([])

// const initializeEditDisplayAccounts = () => {
//   if (!editAllocations.value || editAllocations.value.length === 0) {
//     editDisplayAccounts.value = []
//     return
//   }

//   const classMap = {}
//   editAllocations.value.forEach((alloc) => {
//     const classId = alloc.expense_class_id || 'unclassified'
//     const className = alloc.expense_class_name || 'Unclassified'
//     const typeId = alloc.expense_type_id
//     const typeName = alloc.expense_type_name || `Type ${typeId}`
//     const itemId = alloc.expense_item_id
//     const itemName = alloc.expense_item_name || `Item ${itemId}`

//     if (!classMap[classId]) {
//       classMap[classId] = {
//         id: classId,
//         name: className,
//         children: [],
//       }
//     }

//     if (typeId && !itemId) {
//       const existingType = classMap[classId].children.find((t) => t.id === typeId)
//       if (existingType) {
//         existingType.amount += alloc.amount
//       } else {
//         classMap[classId].children.push({
//           id: typeId,
//           name: typeName,
//           amount: alloc.amount,
//           children: [],
//         })
//       }
//     }

//     if (itemId) {
//       let type = classMap[classId].children.find((t) => t.id === typeId)
//       if (!type) {
//         type = {
//           id: typeId,
//           name: typeName,
//           amount: 0,
//           children: [],
//         }
//         classMap[classId].children.push(type)
//       } else {
//         type.amount = 0
//       }
//       type.children.push({
//         id: itemId,
//         name: itemName,
//         amount: alloc.amount,
//       })
//     }
//   })

//   const classArr = Object.values(classMap)
//   classArr.forEach(cls => {
//     cls.children.sort((a, b) => a.id - b.id)
//     cls.children.forEach(type => {
//       if (type.children) {
//         type.children.sort((a, b) => a.id - b.id)
//       }
//     })
//   })

//   editDisplayAccounts.value = classArr
// }

watch(
  () => editDisplayAccounts.value,
  (newVal) => {
    if (Array.isArray(newVal)) {
      const expanded = {}
      newVal.forEach((expenseClass) => {
        if (expenseClass && Array.isArray(expenseClass.children)) {
          expenseClass.children.forEach((expenseType) => {
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
  let hasChildren = false
  editDisplayAccounts.value.forEach(expenseClass => {
    const expenseType = expenseClass.children?.find(type => type.id === typeId)
    if (expenseType && expenseType.children && expenseType.children.length > 0) {
      hasChildren = true
    }
  })

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

watch(selectedFiscalYear, (newYearId) => {
  if (newYearId) {
    const yearObj = accountLibraryStore.yearOptions.find((y) => y.value === newYearId)
    if (yearObj) {
      const today = new Date()
      const formattedToday = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
      startDate.value = formattedToday
      endDate.value = `${yearObj.yearValue}/12/31`
    }
  }
})

// const openEditAllocationDialog = async (row) => {
//   try {
//     const response = await api.get(`/api/barangay/budgets/${row.id}/history`)
//     const allHistory = response.data.data?.history || []
//     const latestAllocations = allHistory.length > 0 ? allHistory[0].allocations : []
//     editAllocations.value = JSON.parse(JSON.stringify(latestAllocations))
//     initializeEditDisplayAccounts()
//     appropriationStore.selectedRow = row
//     showEditAllocationDialog.value = true
//   } catch (error) {
//     console.error('Failed to load allocation details for editing:', error)
//     $q.notify({
//       type: 'negative',
//       message: 'Failed to load allocation details for editing',
//       icon: 'error',
//       position: 'top',
//     })
//   }
// }

const closeEditAllocationDialog = () => {
  showEditAllocationDialog.value = false
  typeErrorMap.value = {}
  editDisplayAccounts.value = []
}

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

    await appropriationStore.addBudget(payload)

    $q.notify({
      type: 'positive',
      message: 'Budget added successfully!',
      icon: 'check_circle',
      position: 'top',
    })

    showDialog.value = false
    description.value = ''
    amount.value = null
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

const canEditType = (expenseType) => {
  return !expenseType.children || expenseType.children.length === 0
}

const saveEditedAllocation = async () => {
  try {
    const allocations = []
    let totalAllocated = 0

    editDisplayAccounts.value.forEach((expenseClass) => {
      if (!expenseClass || !Array.isArray(expenseClass.children)) return

      expenseClass.children.forEach((expenseType) => {
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

        if (!canEditType(expenseType) && parseCurrency(expenseType.amount) > 0) {
          throw new Error(`Cannot set amount for type "${expenseType.name}" because it has items. Type amount should be the sum of its items.`)
        }

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

    const availableBudget = appropriationStore.selectedRow?.unappropriated || 0
    if (totalAllocated > availableBudget) {
      throw new Error(`Total allocation (₱${totalAllocated.toFixed(2)}) exceeds available budget (₱${availableBudget.toFixed(2)})`)
    }

    // Use the appropriation store's commitAllocation method instead of calling API directly
    await appropriationStore.commitAllocation(appropriationStore.selectedRow.id, allocations)
    $q.notify({
      type: 'positive',
      message: 'Allocations updated',
      icon: 'check_circle',
      position: 'top',
    })
    showEditAllocationDialog.value = false
    typeErrorMap.value = {}
    await appropriationStore.fetchBudgets()
  } catch (error) {
    let message = error.message || 'Failed to update allocations'
    if (error.response && error.response.status === 422 && error.response.data && error.response.data.message) {
      message = error.response.data.message
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


onMounted(async () => {
  try {
    await appropriationStore.initialize()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to load data',
      icon: 'error',
      position: 'top',
    })
  }
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
    name: 'startdate',
    label: 'Entry Date',
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
  event.preventDefault()
  if (showDialog.value && !loading.value) {
    saveBudget()
  }
}

// const addBudget = () => {
//   openDialog()
// }

// const openDialog = async () => {
//   try {
//     await accountLibraryStore.fetchYears()
//     const currentYear = new Date().getFullYear().toString()
//     const currentYearOption = accountLibraryStore.yearOptions.find(
//       (y) => y.yearValue === currentYear,
//     )
//     selectedFiscalYear.value = currentYearOption?.value || accountLibraryStore.yearOptions[0]?.value
//     showDialog.value = true
//   } catch (error) {
//     console.error('Error loading fiscal years:', error)
//   }
// }
</script>

<style scoped>
.appropriation-page {
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

.hierarchical-body {
  background: white;
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

  .col-auto {
    min-width: 100% !important;
  }
}
</style>
