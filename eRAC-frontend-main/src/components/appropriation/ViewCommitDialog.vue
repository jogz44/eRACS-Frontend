<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card class="allocation-card" style="min-width: 1050px">
      <q-card-section class="q-pb-sm q-pt-sm">
        <div class="row items-center justify-between">
          <div class="text-h6">View Allocation</div>
          <q-icon name="close" class="cursor-pointer" size="sm" @click="showDialog = false" />
        </div>
      </q-card-section>

      <q-card-section class="q-py-lg">
        <div class="row q-mb-sm">
          <div class="col-md-6 col-12 q-mb-md text-weight-regular">
            Total Appropriated:
            <strong>{{ appropriationStore.formatCurrency(totalAllocated) }}</strong>
          </div>
          <div class="col-md-6 col-12 text-weight-regular">
            Date Allocated:
            <strong>{{
              viewAllocationData ? formatDate(viewAllocationData.created_at) : ''
            }}</strong>
          </div>
        </div>

        <q-input
          outlined
          dense
          placeholder="Search accounts..."
          class="q-mb-sm"
          v-model="searchQuery"
          style="max-width: 500px"
          clearable
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <div class="hierarchical-table" style="border: 1px solid #e0e0e0; border-radius: 4px">
          <div
            class="row q-table__top bg-grey-3 text-weight-bold"
            style="padding: 8px 12px; min-height: 40px"
          >
            <div class="col-6">Account</div>
            <div class="col-6 text-right">Amount (₱)</div>
          </div>

          <div class="hierarchical-body" style="max-height: 400px; overflow-y: auto">
            <template v-for="expenseClass in displayAccounts" :key="'class-' + expenseClass.id">
              <!-- Expense Class Row -->
              <div
                class="row bg-grey-3 text-weight-bold"
                style="padding: 12px 12px; min-height: 32px"
              >
                <div class="col-6">{{ expenseClass.name }}</div>
                <div class="col-6 text-right">
                  {{ appropriationStore.formatCurrency(calculateClassTotal(expenseClass)) }}
                </div>
              </div>

              <!-- Expense Type Rows (expandable) -->
              <template v-for="expenseType in expenseClass.children" :key="'type-' + expenseType.id">
                <div
                  class="row"
                  :class="getTypeClass(expenseType)"
                  style="padding: 6px 12px; min-height: 32px; border-bottom: 1px solid #f0f0f0"
                >
                  <div class="col-6" style="padding-left: 24px; display: flex; align-items: center">
                    <q-btn
                      flat
                      dense
                      size="sm"
                      :icon="expandedTypes[expenseType.id] ? 'expand_more' : 'chevron_right'"
                      @click="toggleType(expenseType.id)"
                      style="min-width: 24px; margin-right: 4px;"
                    />
                    <span>{{ expenseType.name }}</span>
                  </div>
                  <div class="col-6 text-right">
                    <strong>{{ appropriationStore.formatCurrency(calculateTypeTotal(expenseType)) }}</strong>
                  </div>
                </div>
                <!-- Expense Item Rows (only if expanded) -->
                <template v-if="expandedTypes[expenseType.id] && expenseType.children && expenseType.children.length > 0">
                  <template v-for="expenseItem in expenseType.children" :key="'item-' + expenseItem.id">
                    <div
                      class="row"
                      style="padding: 6px 12px; min-height: 32px; border-bottom: 1px solid #f0f0f0"
                    >
                      <div
                        class="col-6"
                        style="padding-left: 48px; display: flex; align-items: center"
                      >
                        <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                        <span class="text-weight-regular">{{ expenseItem.name }}</span>
                      </div>
                      <div class="col-6 text-right">
                        <span class="text-weight-regular"
                          >{{ appropriationStore.formatCurrency(expenseItem.amount) }}
                        </span>
                      </div>
                    </div>
                  </template>
                </template>
              </template>
            </template>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-sm">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { useAppropriationStore } from '../../stores/appropriationStore'
import { ref, computed, watch } from 'vue'
import { api } from 'src/boot/axios'

const appropriationStore = useAppropriationStore()
const showDialog = ref(false)
const searchQuery = ref('')
const viewAllocationData = ref(null)
const viewAllocations = ref([])
const allHistoryData = ref([])
const expandedTypes = ref({})

const displayAccounts = computed(() => {
  if (!viewAllocations.value || viewAllocations.value.length === 0) return []

  // Create a map to organize allocations by expense class
  const classMap = {}

  viewAllocations.value.forEach((alloc) => {
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
      // Find or create the type
      let type = classMap[classId].children.find((t) => t.id === typeId)
      if (!type) {
        type = {
          id: typeId,
          name: typeName,
          amount: 0, // Parent types don't have their own amount when items exist
          children: [],
        }
        classMap[classId].children.push(type)
      }

      // Add the item
      type.children.push({
        id: itemId,
        name: itemName,
        amount: alloc.amount,
      })
    }
  })

  return Object.values(classMap)
})

// Expand all types by default when displayAccounts changes
watch(
  () => displayAccounts.value,
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
      expandedTypes.value = expanded
    }
  },
  { immediate: true }
)

const toggleType = (typeId) => {
  expandedTypes.value[typeId] = !expandedTypes.value[typeId]
}
const calculateTypeTotal = (expenseType) => {
  // Sum only the items under this type
  if (!expenseType.children || expenseType.children.length === 0) {
    return expenseType.amount || 0
  }
  return expenseType.children.reduce((sum, item) => sum + (item.amount || 0), 0)
}
const $q = useQuasar()

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const openDialog = async (row) => {
  try {
    showDialog.value = true
    await fetchAllocationData(row.id)
  } catch (error) {
    console.error('Error opening view dialog:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open allocation view',
      icon: 'error',
    })
  }
}

const fetchAllocationData = async (id) => {
  try {
    const response = await api.get(`/api/barangay/budgets/${id}/history`)
    allHistoryData.value = response.data.data?.history || []

    if (allHistoryData.value.length > 0) {
      // Get all allocations (combine from all history)
      viewAllocations.value = allHistoryData.value.flatMap((h) => h.allocations || [])

      // Just set the most recent date info for display
      viewAllocationData.value = allHistoryData.value[0]
    }
  } catch (error) {
    console.error('Error fetching allocation data:', error)
    throw error
  }
}

const totalAllocated = computed(() => {
  return viewAllocations.value.reduce((sum, alloc) => sum + (alloc.amount || 0), 0)
})

const calculateClassTotal = (expenseClass) => {
  return expenseClass.children.reduce((sum, type) => {
    const typeAmount = type.amount || 0
    const itemsAmount =
      type.children?.reduce((childSum, item) => childSum + (item.amount || 0), 0) || 0
    return sum + typeAmount + itemsAmount
  }, 0)
}

const getTypeClass = (expenseType) => {
  return expenseType.children?.length > 0 ? 'text-weight-bold' : 'text-weight-regular'
}

defineExpose({
  openDialog,
})
</script>

<style scoped>
.hierarchical-table .row {
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  min-height: 48px;
}
.hierarchical-table .row:last-child {
  border-bottom: none;
}
</style>
