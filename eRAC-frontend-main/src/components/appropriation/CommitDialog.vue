<template>
  <q-dialog v-model="appropriationStore.showAllocationDialog" persistent>
    <q-card class="allocation-card" style="min-width: 1050px">
      <!-- Header with reduced padding -->
      <q-card-section class="q-pb-sm q-pt-sm">
        <div class="row items-center justify-between">
          <div class="text-h6">Allocate Amounts</div>
          <q-icon
            name="close"
            class="cursor-pointer"
            size="sm"
            @click="appropriationStore.showAllocationDialog = false"
          />
        </div>
      </q-card-section>

      <q-card-section class="q-py-lg">
        <!-- Summary section with reduced padding -->
        <div class="row q-mb-sm">
          <div class="col-md-6 col-12 q-mb-md text-weight-regular">
            Total:
            <strong>
              {{
                appropriationStore.formatCurrency(
                  appropriationStore.appropriations.reduce((sum, app) => sum + app.amount, 0),
                )
              }}
            </strong>
          </div>
          <div class="col-md-6 col-12 text-weight-regular">
            Total Unappropriated:
            <strong>
              {{
                appropriationStore.formatCurrency(
                  appropriationStore.appropriations.reduce(
                    (sum, app) => sum + app.unappropriated,
                    0,
                  ),
                )
              }}
            </strong>
          </div>

          <div class="col-md-6 col-12 q-mb-md text-weight-regular">
            Return Amount:
            <strong> 0.00 </strong>
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

        <!-- Compact Hierarchical Table -->
        <div class="hierarchical-table" style="border: 1px solid #e0e0e0; border-radius: 4px">
          <!-- Table Header with reduced height -->
          <div
            class="row q-table__top bg-grey-3 text-weight-bold"
            style="padding: 8px 12px; min-height: 40px"
          >
            <div class="col-6" style="display: flex; align-items: center">Account</div>
            <div
              class="col-6 text-right"
              style="display: flex; align-items: center; justify-content: flex-end"
            >
              Amount (₱)
            </div>
          </div>

          <!-- Table Body -->
          <div class="hierarchical-body" style="max-height: 400px; overflow-y: auto">
            <template v-for="expenseClass in displayAccounts" :key="'class-' + expenseClass.id">
              <!-- Expense Class Row -->
              <div
                class="row bg-grey-3 text-weight-bold"
                style="padding: 12px 12px; min-height: 32px"
              >
                <div class="col-6" style="display: flex; align-items: center">
                  {{ expenseClass.name }}
                </div>
                <div
                  class="col-6 text-right"
                  style="display: flex; align-items: center; justify-content: flex-end"
                >
                  {{ appropriationStore.formatCurrency(calculateClassTotal(expenseClass)) }}
                </div>
              </div>

              <!-- Expense Type Rows -->
              <!-- Expense Type Rows - Fixed -->
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
                  <div class="col-6 text-right">
                    <q-input
                      v-if="!expenseType.children || expenseType.children.length === 0"
                      dense
                      :model-value="expenseType.amount"
                      @update:model-value="
                        (val) => {
                          appropriationStore.updateAllocationAmount(expenseType.id, val)
                          updateUnappropriated()
                        }
                      "
                      prefix="₱"
                      :rules="[(val) => validateAmount(val) || 'Invalid amount']"
                      style="max-width: 230px; width: 100%; display: inline-block"
                      class="q-pa-none"
                      input-class="q-py-xs"
                    />
                  </div>
                </div>

                <!-- Expense Item Rows -->
                <template v-if="expenseType.children && expenseType.children.length > 0">
                  <template
                    v-for="expenseItem in expenseType.children"
                    :key="'item-' + expenseItem.id"
                  >
                    <template v-if="!expenseItem.children || expenseItem.children.length === 0">
                      <div
                        class="row"
                        style="
                          padding: 6px 12px;
                          min-height: 32px;
                          border-bottom: 1px solid #f0f0f0;
                        "
                      >
                        <div
                          class="col-6"
                          style="padding-left: 48px; display: flex; align-items: center"
                        >
                          <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                          <span class="text-weight-regular">{{ expenseItem.name }}</span>
                        </div>
                        <div class="col-6 text-right">
                          <q-input
                            dense
                            :model-value="expenseItem.amount"
                            @update:model-value="
                              (val) => {
                                appropriationStore.updateAllocationAmount(expenseItem.id, val)
                                updateUnappropriated()
                              }
                            "
                            prefix="₱"
                            :rules="[(val) => validateAmount(val) || 'Invalid amount']"
                            style="max-width: 230px; width: 100%; display: inline-block"
                            class="q-pa-none"
                            input-class="q-py-xs"
                          />
                        </div>
                      </div>
                    </template>
                  </template>
                </template>
              </template>
            </template>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-sm">
        <q-btn flat label="Cancel" color="secondary" v-close-popup />
        <q-btn
          label="Save"
          class="modal-save-btn"
          @click="submitAllocation"
          :loading="appropriationStore.loading"
          :disable="
            totalAllocated <= 0 || totalAllocated > appropriationStore.selectedRow?.unappropriated
          "
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { useAppropriationStore } from '../../stores/appropriationStore'
import { ref, computed } from 'vue'
const appropriationStore = useAppropriationStore()
const searchQuery = ref('')

const $q = useQuasar()
// Transform allocations for display
// Updated displayAccounts computed property

const displayAccounts = computed(() => {
  const rawData = appropriationStore.allocations
  const allocations = Array.isArray(rawData?.data)
    ? rawData.data
    : Array.isArray(rawData)
      ? rawData
      : []

  // Initialize cache once
  if (allocations.length > 0 && Object.keys(appropriationStore.inputCache).length === 0) {
    appropriationStore.initializeInputCache(allocations)
  }

  // Apply search filter if query exists
  const filteredData = searchQuery.value
    ? filterBySearchQuery(allocations, searchQuery.value)
    : allocations

  return filteredData.map((expenseClass) => ({
    id: expenseClass.id,
    name: expenseClass.name,
    isMainCategory: expenseClass.isMainCategory,
    amount: appropriationStore.inputCache[expenseClass.id] || '',
    children: Array.isArray(expenseClass.children)
      ? expenseClass.children.map((expenseType) => ({
          id: expenseType.id,
          name: expenseType.name,
          isMainCategory: expenseType.isMainCategory,
          amount: appropriationStore.inputCache[expenseType.id] || '',
          children: Array.isArray(expenseType.children)
            ? expenseType.children.map((item) => ({
                id: item.id,
                name: item.name,
                isMainCategory: item.isMainCategory,
                amount: appropriationStore.inputCache[item.id] || '',
              }))
            : [],
        }))
      : [],
  }))
})

const filterBySearchQuery = (allocations, query) => {
  const lowerQuery = query.toLowerCase()

  return allocations.filter((expenseClass) => {
    // Keep the class if its name matches
    if (expenseClass.name.toLowerCase().includes(lowerQuery)) {
      return true
    }

    // Filter children
    const filteredChildren = expenseClass.children?.filter((expenseType) => {
      // Keep type if its name matches
      if (expenseType.name.toLowerCase().includes(lowerQuery)) {
        return true
      }

      // Filter items
      if (expenseType.children) {
        expenseType.children = expenseType.children.filter((item) =>
          item.name.toLowerCase().includes(lowerQuery),
        )
        return expenseType.children.length > 0
      }
      return false
    })

    // Only keep class if it has matching children
    if (filteredChildren && filteredChildren.length > 0) {
      expenseClass.children = filteredChildren
      return true
    }
    return false
  })
}

// Remove the watcher completely - it's causing the recursion

// Add this watcher to update the store when amounts change

// Filter accounts based on search

// Calculate total allocated amount
const totalAllocated = computed(() => {
  let total = 0

  if (!displayAccounts.value) return total

  displayAccounts.value.forEach((expenseClass) => {
    if (!expenseClass.children) return

    expenseClass.children.forEach((expenseType) => {
      if (expenseType.children?.length) {
        expenseType.children.forEach((item) => {
          if (item.amount) {
            const amount = parseFloat(item.amount)
            if (!isNaN(amount)) total += amount
          }
        })
      } else if (expenseType.amount) {
        const amount = parseFloat(expenseType.amount)
        if (!isNaN(amount)) total += amount
      }
    })
  })

  return total
})

const getTypeClass = (expenseType) => {
  return expenseType.children?.length > 0 ? 'text-weight-bold' : 'text-weight-regular'
}
// Calculate main category totals
/*const getMainCategoryTotal = (categoryId) => {
  const category = appropriationStore.allocations.find((acc) => acc.id === categoryId)
  if (!category) return 0

  let total = 0
  category.children.forEach((type) => {
    if (type.children && type.children.length > 0) {
      type.children.forEach((item) => {
        if (item.amount) {
          total += parseFloat(String(item.amount).replace(/,/g, '')) || 0
        }
      })
    } else if (type.amount) {
      total += parseFloat(String(type.amount).replace(/,/g, '')) || 0
    }
  })
  return total
}*/

const calculateClassTotal = (expenseClass) => {
  let total = 0

  expenseClass.children?.forEach((expenseType) => {
    // Add amount from expense type itself (if it has no children)
    if ((!expenseType.children || expenseType.children.length === 0) && expenseType.amount) {
      total += parseFloat(expenseType.amount) || 0
    }

    // Add amounts from expense items
    expenseType.children?.forEach((item) => {
      if (item.amount) {
        total += parseFloat(item.amount) || 0
      }
    })
  })

  return total
}

// Validate amount input
const validateAmount = (val) => {
  if (!val) return true
  const num = parseFloat(String(val).replace(/,/g, ''))
  return !isNaN(num) && num >= 0
}

const submitAllocation = async () => {
  try {
    const allocations = []
    let hasValidAllocation = false

    // Build allocations array with proper validation
    displayAccounts.value.forEach((expenseClass) => {
      expenseClass.children?.forEach((expenseType) => {
        if (expenseType.children?.length) {
          expenseType.children.forEach((item) => {
            if (item.amount && !isNaN(parseFloat(item.amount))) {
              allocations.push({
                id: item.id,
                type: 'item',
                amount: parseFloat(item.amount),
              })
              hasValidAllocation = true
            }
          })
        } else if (expenseType.amount && !isNaN(parseFloat(expenseType.amount))) {
          allocations.push({
            id: expenseType.id,
            type: 'type',
            amount: parseFloat(expenseType.amount),
          })
          hasValidAllocation = true
        }
      })
    })

    if (!hasValidAllocation) {
      throw new Error('Please enter at least one valid amount')
    }

    // Check against available budget
    const available = appropriationStore.selectedRow?.unappropriated || 0
    if (totalAllocated.value > available) {
      throw new Error(
        `Allocation exceeds available budget by ₱${(totalAllocated.value - available).toLocaleString()}`,
      )
    }

    // Submit allocation
    await appropriationStore.commitAllocation(appropriationStore.selectedRow.id, allocations)

    // Refresh data
    await appropriationStore.fetchBudgets()
    appropriationStore.showAllocationDialog = false

    // Show success notification
    $q.notify({
      type: 'positive',
      message: 'Allocation saved successfully',
      icon: 'check_circle',
      position: 'top',
    })
  } catch (error) {
    console.error('[ERROR] submitAllocation:', error)
    let message = error.message || 'Failed to save allocation'
    // If backend returns 422, show the backend message
    if (error.response && error.response.status === 422) {
      message = error.response.data.message
    }
    $q.notify({
      type: 'negative',
      message,
      icon: 'error',
      position: 'top',
    })
  }
}

// Update method remains the same
const updateUnappropriated = () => {
  if (appropriationStore.selectedRow) {
    appropriationStore.calculateTotals()
  }
}

const debugInfo = computed(() => ({
  hasAllocations: appropriationStore.allocations.length > 0,
  firstClass: appropriationStore.allocations[0] || null,
  classChildren: appropriationStore.allocations[0]?.children || [],
}))

// Then you can check this in your component
console.log('Debug Info:', debugInfo.value)
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
