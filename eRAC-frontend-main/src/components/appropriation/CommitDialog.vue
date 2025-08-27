<template>
  <q-dialog v-model="appropriationStore.showAllocationDialog" persistent>
    <q-card class="allocation-card" style="min-width: 1050px; height: 800px; font-size: medium;">
      <!-- Header with reduced padding -->
      <q-card-section class="q-pb-sm q-pt-sm" >
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

        <div class="row q-mb-sm">
          <div class="col-md-6 col-12 q-mb-md text-weight-regular">
            Total Budget:
            <strong>{{ appropriationStore.formatCurrency(appropriationStore.selectedRow?.total || 0) }}</strong>
          </div>
          <div class="col-md-6 col-12 text-weight-regular">
            Available for allocation:
            <strong>{{ appropriationStore.formatCurrency(availableBudget) }}</strong>
          </div>

          <div class="col-md-6 col-12 q-mb-md text-weight-regular">
            New Allocations:
            <strong>{{ appropriationStore.formatCurrency(newAllocationsTotal) }}</strong>
          </div>

          <div class="col-md-6 col-12 q-mb-md text-weight-regular">
            Net Change:
            <strong
              :class="netChange < 0 ? 'text-positive' : netChange > availableBudget ? 'text-negative' : 'text-primary'"
            >
              {{ appropriationStore.formatCurrency(netChange) }}
            </strong>
          </div>

          <div class="col-md-6 col-12 q-mb-md text-weight-regular">
            Remaining after changes:
            <strong
              :class="remainingAfterChanges < 0 ? 'text-negative' : 'text-positive'"
            >
              {{ appropriationStore.formatCurrency(remainingAfterChanges) }}
            </strong>
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
          <!-- Table Header -->
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
          <div class="hierarchical-body" style="max-height: 300px; overflow-y: auto">
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
                      :model-value="formatInputValue(expenseType.amount)"
                      @update:model-value="
                        (val) => {
                          const cleanValue = handleAmountInput(val)
                          appropriationStore.updateAllocationAmount(`type-${expenseType.id}`, cleanValue)
                          updateUnappropriated()
                        }
                      "
                      @blur="
                        (event) => {
                          const formatted = formatToTwoDecimals(event.target.value)
                          appropriationStore.updateAllocationAmount(`type-${expenseType.id}`, formatted)
                          updateUnappropriated()
                        }
                      "
                      prefix="₱"
                      :rules="[validateAmountRule]"
                      style="max-width: 230px; width: 100%; display: inline-block"
                      class="q-pa-none"
                      input-class="q-py-xs"
                      placeholder="0.00"
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
                            :model-value="formatInputValue(expenseItem.amount)"
                            @update:model-value="
                              (val) => {
                                const cleanValue = handleAmountInput(val)
                                appropriationStore.updateAllocationAmount(`item-${expenseItem.id}`, cleanValue)
                                updateUnappropriated()
                              }
                            "
                            @blur="
                              (event) => {
                                const formatted = formatToTwoDecimals(event.target.value)
                                appropriationStore.updateAllocationAmount(`item-${expenseItem.id}`, formatted)
                                updateUnappropriated()
                              }
                            "
                            prefix="₱"
                            :rules="[validateAmountRule]"
                            style="max-width: 230px; width: 100%; display: inline-block"
                            class="q-pa-none"
                            input-class="q-py-xs"
                            placeholder="0.00"
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
        <!-- <q-btn
          flat
          label="Debug"
          color="info"
          size="sm"
          @click="showDebugInfo = !showDebugInfo"
        /> -->
        <q-btn
          label="Allocate"
          class="modal-save-btn"
          @click="submitAllocation"
          :loading="appropriationStore.loading"
          :disable="appropriationStore.loading || !canSave"
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
// const showDebugInfo = ref(false)
const $q = useQuasar()

// Utility function to safely parse currency values
const parseCurrency = (value) => {
  if (!value && value !== 0) return 0

  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  const parsed = parseFloat(cleanValue)

  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
}

// Available budget from the selected row (unappropriated amount)
const availableBudget = computed(() => {
  return parseCurrency(appropriationStore.selectedRow?.unappropriated || 0)
})

// Transform allocations for display
const displayAccounts = computed(() => {
  const rawData = appropriationStore.allocations
  const allocations = Array.isArray(rawData?.data)
    ? rawData.data
    : Array.isArray(rawData)
      ? rawData
      : []

  if (allocations.length > 0 && Object.keys(appropriationStore.inputCache).length === 0) {
    appropriationStore.initializeInputCache(allocations)
  }

  const filteredData = searchQuery.value
    ? filterBySearchQuery(allocations, searchQuery.value)
    : allocations

  return filteredData.map((expenseClass) => ({
    id: expenseClass.id,
    name: expenseClass.name,
    isMainCategory: expenseClass.isMainCategory,
    amount: appropriationStore.inputCache[`class-${expenseClass.id}`] || '',
    children: Array.isArray(expenseClass.children)
      ? expenseClass.children.map((expenseType) => ({
          id: expenseType.id,
          name: expenseType.name,
          isMainCategory: expenseType.isMainCategory,
          amount: appropriationStore.inputCache[`type-${expenseType.id}`] || '',
          children: Array.isArray(expenseType.children)
            ? expenseType.children.map((item) => ({
                id: item.id,
                name: item.name,
                isMainCategory: item.isMainCategory,
                amount: appropriationStore.inputCache[`item-${item.id}`] || '',
              }))
            : [],
        }))
      : [],
  }))
})

const filterBySearchQuery = (allocations, query) => {
  const lowerQuery = query.toLowerCase()

  return allocations.filter((expenseClass) => {
    if (expenseClass.name.toLowerCase().includes(lowerQuery)) {
      return true
    }

    const filteredChildren = expenseClass.children?.filter((expenseType) => {
      if (expenseType.name.toLowerCase().includes(lowerQuery)) {
        return true
      }

      if (expenseType.children) {
        expenseType.children = expenseType.children.filter((item) =>
          item.name.toLowerCase().includes(lowerQuery),
        )
        return expenseType.children.length > 0
      }
      return false
    })

    if (filteredChildren && filteredChildren.length > 0) {
      expenseClass.children = filteredChildren
      return true
    }
    return false
  })
}

// Calculate only NEW allocations (non-zero input values)
const newAllocationsTotal = computed(() => {
  let total = 0

  if (!displayAccounts.value) return total

  displayAccounts.value.forEach((expenseClass) => {
    if (!expenseClass.children) return

    expenseClass.children.forEach((expenseType) => {
      if (expenseType.children?.length) {
        expenseType.children.forEach((item) => {
          const currentAmount = parseCurrency(item.amount)
          if (currentAmount > 0) {
            total += currentAmount
          }
        })
      } else {
        const currentAmount = parseCurrency(expenseType.amount)
        if (currentAmount > 0) {
          total += currentAmount
        }
      }
    })
  })

  return Math.round(total * 100) / 100
})

// Calculate net change (new allocations minus existing allocations)
const netChange = computed(() => {
  const existingTotal = appropriationStore.existingAllocationsTotal || 0
  const newTotal = newAllocationsTotal.value
  const netChange = Math.round((newTotal - existingTotal) * 100) / 100

  // Debug logging
  console.log('[DEBUG] Net Change Calculation:', {
    newAllocations: newTotal,
    existingTotal: existingTotal,
    netChange: netChange
  })

  return netChange
})

// Calculate remaining budget after changes
const remainingAfterChanges = computed(() => {
  // Remaining = Available budget - Net change
  const remaining = Math.round((availableBudget.value - netChange.value) * 100) / 100

  // Debug logging
  console.log('[DEBUG] Remaining After Changes Calculation:', {
    availableBudget: availableBudget.value,
    netChange: netChange.value,
    remaining: remaining
  })

  return remaining
})

// Determine if save button should be enabled
const canSave = computed(() => {
  const hasValidAllocation = newAllocationsTotal.value > 0
  const withinBudget = netChange.value <= (availableBudget.value + 0.01) // Small tolerance
  const hasValidAmounts = newAllocationsTotal.value >= 0

  console.log('[DEBUG] canSave calculation:', {
    hasValidAllocation,
    withinBudget,
    hasValidAmounts,
    newAllocationsTotal: newAllocationsTotal.value,
    netChange: netChange.value,
    availableBudget: availableBudget.value
  })

  return hasValidAllocation && withinBudget && hasValidAmounts
})


const getTypeClass = (expenseType) => {
  return expenseType.children?.length > 0 ? 'text-weight-bold' : 'text-weight-regular'
}

const calculateClassTotal = (expenseClass) => {
  let total = 0

  expenseClass.children?.forEach((expenseType) => {
    if ((!expenseType.children || expenseType.children.length === 0) && expenseType.amount) {
      total += parseCurrency(expenseType.amount)
    }

    expenseType.children?.forEach((item) => {
      if (item.amount) {
        total += parseCurrency(item.amount)
      }
    })
  })

  return Math.round(total * 100) / 100
}

const validateAmountRule = (val) => {
  if (!val) return true

  const parsed = parseCurrency(val)
  if (isNaN(parsed) || parsed < 0) {
    return 'Please enter a valid positive number'
  }

  return true
}

const submitAllocation = async () => {
  try {
    const allocations = []
    let hasValidAllocation = false

    // Build allocations array - include ALL allocations (both existing and new)
    displayAccounts.value.forEach((expenseClass) => {
      expenseClass.children?.forEach((expenseType) => {
        if (expenseType.children?.length) {
          expenseType.children.forEach((item) => {
            const amount = parseCurrency(item.amount)
            if (amount > 0) {
              allocations.push({
                id: item.id,
                type: 'item',
                amount: amount,
                expense_class_id: expenseClass.id,
                expense_type_id: expenseType.id,
                expense_item_id: item.id
              })
              hasValidAllocation = true
            }
          })
        } else {
          const amount = parseCurrency(expenseType.amount)
          if (amount > 0) {
            allocations.push({
              id: expenseType.id,
              type: 'type',
              amount: amount,
              expense_class_id: expenseClass.id,
              expense_type_id: expenseType.id,
              expense_item_id: null
            })
            hasValidAllocation = true
          }
        }
      })
    })

    if (!hasValidAllocation) {
      throw new Error('Please enter at least one valid amount')
    }

    // Calculate total new allocation amount
    const totalNewAllocation = allocations.reduce((sum, allocation) => sum + allocation.amount, 0)

    // Get existing allocations total
    const existingTotal = appropriationStore.existingAllocationsTotal || 0

    // Calculate the actual amount being allocated (new allocations - existing allocations)
    const actualAllocationAmount = totalNewAllocation - existingTotal

    console.log('=== ALLOCATION VALIDATION ===')
    console.log('Available Budget:', availableBudget.value)
    console.log('Total New Allocation:', totalNewAllocation)
    console.log('Existing Allocations Total:', existingTotal)
    console.log('Actual Allocation Amount:', actualAllocationAmount)
    console.log('Will Exceed:', actualAllocationAmount > availableBudget.value)
    console.log('============================')

    // Validate that the actual allocation amount doesn't exceed available budget
    const tolerance = 0.01 // Small tolerance for floating-point precision
    if (actualAllocationAmount > (availableBudget.value + tolerance)) {
      const errorMsg = `Allocation amount exceeds available budget!
        Available Budget: ₱${availableBudget.value.toFixed(2)}
        New Allocation Total: ₱${totalNewAllocation.toFixed(2)}
        Existing Allocations: ₱${existingTotal.toFixed(2)}
        Net Allocation Amount: ₱${actualAllocationAmount.toFixed(2)}
        Excess Amount: ₱${(actualAllocationAmount - availableBudget.value).toFixed(2)}`

      console.error(errorMsg)
      throw new Error(errorMsg)
    }

    // Submit allocation
    console.log('Submitting allocation to backend...')
    // Trigger background refresh so we can close immediately
    await appropriationStore.commitAllocation(appropriationStore.selectedRow.id, allocations, { backgroundRefresh: true })

    // Close dialog immediately after successful allocation
    // Next-tick hide to avoid any repaint timing issues
    appropriationStore.showAllocationDialog = false

    $q.notify({
      type: 'positive',
      message: 'Allocation saved successfully',
      icon: 'check_circle',
      position: 'top',
    })
  } catch (error) {
    console.error('[ERROR] submitAllocation:', error)
    let message = error.message || 'Failed to save allocation'

    if (error.response && error.response.status === 422) {
      const backendMessage = error.response.data.message || error.response.data.error
      message = `Backend Error: ${backendMessage}`
      console.log('Backend response:', error.response.data)
    }

    $q.notify({
      type: 'negative',
      message: message,
      icon: 'error',
      position: 'top',
    })
  }
}

// Display function: while typing (string), show commas only; after blur (number), show 2 decimals
const formatInputValue = (value) => {
  if (value === '' || value === null || value === undefined) return ''
  const isNumber = typeof value === 'number'
  const cleanValue = String(value).replace(/,/g, '')
  const num = parseFloat(cleanValue)
  if (isNaN(num)) return ''
  return isNumber
    ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : num.toLocaleString('en-US')
}

// Handle input changes while typing: return cleaned STRING (no forced decimals)
const handleAmountInput = (value) => {
  let cleanValue = String(value).replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }
  return cleanValue
}

// On blur: force exactly two decimals
const formatToTwoDecimals = (value) => {
  const cleanValue = String(value).replace(/[^\d.]/g, '')
  if (cleanValue === '') return 0
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    // collapse extra dots
    const collapsed = parts[0] + '.' + parts.slice(1).join('')
    return formatToTwoDecimals(collapsed)
  }
  if (parts.length === 2 && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2)
  }
  const num = parseFloat(parts.join('.'))
  if (isNaN(num)) return 0
  // return numeric value with two decimals, UI will render via formatInputValue
  return Math.round(num * 100) / 100
}

const updateUnappropriated = () => {
  if (appropriationStore.selectedRow) {
    appropriationStore.calculateTotals()
  }
}
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
.text-negative {
  color: #c10015;
}
.text-positive {
  color: #21ba45;
}
</style>
