<template>
  <q-dialog v-model="appropriationStore.showAllocationDialog" persistent>
    <q-card class="allocation-card" style="min-width: 1050px; max-height: 90vh; font-size: medium">
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
        <div class="row q-mb-sm">
          <div class="col-md-6 col-12 q-mb-md text-weight-regular">
            Total Budget:
            <strong>{{
              appropriationStore.formatCurrency(appropriationStore.selectedRow?.total || 0)
            }}</strong>
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
              :class="
                netChange < 0
                  ? 'text-positive'
                  : netChange > availableBudget
                    ? 'text-negative'
                    : 'text-primary'
              "
            >
              {{ appropriationStore.formatCurrency(netChange) }}
            </strong>
          </div>

          <div class="col-md-6 col-12 q-mb-md text-weight-regular">
            Remaining after changes:
            <strong :class="remainingAfterChanges < 0 ? 'text-negative' : 'text-positive'">
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
          <div class="hierarchical-body" style="max-height: calc(70vh - 200px); overflow-y: auto">
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
                  <template v-if="calculateClassTotal(expenseClass) > 0">
                    {{ appropriationStore.formatCurrency(calculateClassTotal(expenseClass)) }}
                  </template>
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
                      v-if="!hasChildren(expenseType)"
                      dense
                      :model-value="formatInputValue(expenseType.amount)"
                      @update:model-value="(val) => setNodeAmount(expenseType, handleAmountInput(val))"
                      @blur="
                        (event) => setNodeAmount(expenseType, formatToTwoDecimals(event.target.value))
                      "
                      prefix="₱"
                      inputmode="decimal"
                      pattern="\\d*\\.?\\d{0,2}"
                      @keypress="blockNonNumeric"
                      @paste.prevent="handlePasteNumeric"
                      :rules="[validateAmountRule]"
                      style="max-width: 230px; width: 100%; display: inline-block"
                      class="q-pa-none"
                      input-class="q-py-xs"
                      placeholder="0.00"
                    />
                    <!-- Types with children should show NO amount - only their children show amounts -->
                  </div>
                </div>

                <!-- Expense Item Rows -->
                <template v-if="hasChildren(expenseType)">
                  <template
                    v-for="expenseItem in expenseType.children"
                    :key="'item-' + expenseItem.id"
                  >
                    <!-- Item Row (always show as header, with input only if no sub-items) -->
                    <div class="row" style="padding: 6px 12px; min-height: 32px; border-bottom: 1px solid #f0f0f0">
                      <div class="col-6" style="padding-left: 48px; display: flex; align-items: center">
                        <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                        <span
                          :class="hasChildren(expenseItem) ? 'text-weight-bold' : 'text-weight-regular'"
                          >{{ expenseItem.name }}</span
                        >
                      </div>
                      <div class="col-6 text-right">
                        <!-- Only show input if item has no sub-items -->
                        <template v-if="!hasChildren(expenseItem)">
                          <q-input
                            dense
                            :model-value="formatInputValue(expenseItem.amount)"
                            @update:model-value="
                              (val) => setNodeAmount(expenseItem, handleAmountInput(val))
                            "
                            @blur="
                              (event) =>
                                setNodeAmount(expenseItem, formatToTwoDecimals(event.target.value))
                            "
                            prefix="₱"
                            inputmode="decimal"
                            pattern="\\d*\\.?\\d{0,2}"
                            @keypress="blockNonNumeric"
                            @paste.prevent="handlePasteNumeric"
                            :rules="[validateAmountRule]"
                            style="max-width: 230px; width: 100%; display: inline-block"
                            class="q-pa-none"
                            input-class="q-py-xs"
                            placeholder="0.00"
                          />
                        </template>
                        <!-- Show amount display if item has sub-items -->
                        <template v-else>
                          <!-- Items with sub-items should show NO amount - only sub-items show amounts -->
                        </template>
                      </div>
                    </div>

                    <!-- Sub-Item Rows (only if item has sub-items) -->
                    <template v-if="hasChildren(expenseItem)">
                      <template
                        v-for="expenseSubItem in expenseItem.children"
                        :key="'subitem-' + expenseSubItem.id"
                      >
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
                            style="padding-left: 72px; display: flex; align-items: center"
                          >
                            <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                            <span
                              :class="
                                hasChildren(expenseSubItem)
                                  ? 'text-weight-bold'
                                  : 'text-weight-regular'
                              "
                              >{{ expenseSubItem.name }}</span
                            >
                          </div>
                          <div class="col-6 text-right">
                            <template v-if="!hasChildren(expenseSubItem)">
                              <q-input
                                dense
                                :model-value="formatInputValue(expenseSubItem.amount)"
                                @update:model-value="
                                  (val) => setNodeAmount(expenseSubItem, handleAmountInput(val))
                                "
                                @blur="
                                  (event) =>
                                    setNodeAmount(
                                      expenseSubItem,
                                      formatToTwoDecimals(event.target.value),
                                    )
                                "
                                prefix="₱"
                                inputmode="decimal"
                                pattern="\\d*\\.?\\d{0,2}"
                                @keypress="blockNonNumeric"
                                @paste.prevent="handlePasteNumeric"
                                :rules="[validateAmountRule]"
                                style="max-width: 230px; width: 100%; display: inline-block"
                                class="q-pa-none"
                                input-class="q-py-xs"
                                placeholder="0.00"
                              />
                            </template>
                          </div>
                        </div>

                        <!-- Sub-Type Rows (only if sub-item has sub-types) -->
                        <template v-if="hasChildren(expenseSubItem)">
                          <template
                            v-for="expenseSubType in expenseSubItem.children"
                            :key="'subtype-' + expenseSubType.id"
                          >
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
                                style="padding-left: 96px; display: flex; align-items: center"
                              >
                                <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                                <span
                                  :class="
                                    hasChildren(expenseSubType)
                                      ? 'text-weight-bold'
                                      : 'text-weight-regular'
                                  ">{{ expenseSubType.name }}</span
                                >
                              </div>
                              <div class="col-6 text-right">
                                <template v-if="!hasChildren(expenseSubType)">
                                  <q-input
                                    dense
                                    :model-value="formatInputValue(expenseSubType.amount)"
                                    @update:model-value="
                                      (val) => setNodeAmount(expenseSubType, handleAmountInput(val))
                                    "
                                    @blur="
                                      (event) =>
                                        setNodeAmount(
                                          expenseSubType,
                                          formatToTwoDecimals(event.target.value),
                                        )
                                    "
                                    prefix="₱"
                                    inputmode="decimal"
                                    pattern="\\d*\\.?\\d{0,2}"
                                    @keypress="blockNonNumeric"
                                    @paste.prevent="handlePasteNumeric"
                                    :rules="[validateAmountRule]"
                                    style="max-width: 230px; width: 100%; display: inline-block"
                                    class="q-pa-none"
                                    input-class="q-py-xs"
                                    placeholder="0.00"
                                  />
                                </template>
                              </div>
                            </div>

                            <!-- Sub-Sub-Type Rows — end of hierarchy, always has input -->
                            <template v-if="hasChildren(expenseSubType)">
                              <template
                                v-for="expenseSubSubType in expenseSubType.children"
                                :key="'subsubtype-' + expenseSubSubType.id"
                              >
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
                                    style="padding-left: 120px; display: flex; align-items: center"
                                  >
                                    <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                                    <span class="text-weight-regular">{{
                                      expenseSubSubType.name
                                    }}</span>
                                  </div>
                                  <div class="col-6 text-right">
                                    <q-input
                                      dense
                                      :model-value="formatInputValue(expenseSubSubType.amount)"
                                      @update:model-value="
                                        (val) =>
                                          setNodeAmount(expenseSubSubType, handleAmountInput(val))
                                      "
                                      @blur="
                                        (event) =>
                                          setNodeAmount(
                                            expenseSubSubType,
                                            formatToTwoDecimals(event.target.value),
                                          )
                                      "
                                      prefix="₱"
                                      inputmode="decimal"
                                      pattern="\\d*\\.?\\d{0,2}"
                                      @keypress="blockNonNumeric"
                                      @paste.prevent="handlePasteNumeric"
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
          label="Allocate"
          class="modal-save-btn"
          @click="checkAndSubmitAllocation"
          :loading="appropriationStore.loading"
          :disable="appropriationStore.loading || !canSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Confirmation Dialog for Parent-Level Allocations -->
  <q-dialog v-model="showConfirmationDialog" persistent>
    <q-card style="min-width: 500px; max-width: 600px">
      <q-card-section class="q-pb-sm q-pt-sm">
        <div class="text-h6 text-warning">Confirm Allocation Changes</div>
      </q-card-section>

      <q-card-section class="q-py-lg">
        <div class="text-body1 q-mb-md">
          The following accounts have amounts allocated at the parent level, but you've also
          allocated amounts to items within them:
        </div>

        <div class="confirmation-list q-mb-md">
          <div
            v-for="conflict in typeAllocationConflicts"
            :key="conflict.levelKey + '-' + conflict.typeId"
            class="conflict-item q-pa-sm q-mb-sm"
            style="border: 1px solid #e0e0e0; border-radius: 4px; background-color: #f8f9fa"
          >
            <div class="text-weight-medium text-primary">{{ conflict.typeName }}</div>
            <div class="text-caption text-grey-7">
              {{ conflict.typeName }} allocation:
              <strong>{{ appropriationStore.formatCurrency(conflict.typeAmount) }}</strong>
            </div>
            <div class="text-caption text-grey-7">
              Total in children:
              <strong>{{ appropriationStore.formatCurrency(conflict.itemsTotal) }}</strong>
            </div>
          </div>
        </div>

        <div class="text-body2 text-grey-8">
          <strong>Note:</strong> When you confirm, the parent-level allocations will be cleared and
          only the child-level allocations will be saved.
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" color="secondary" @click="showConfirmationDialog = false" />
        <q-btn
          label="Confirm & Save"
          color="primary"
          @click="confirmAndSubmitAllocation"
          :loading="appropriationStore.loading"
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

// Utility function to safely parse currency values
const parseCurrency = (value) => {
  if (!value && value !== 0) return 0

  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  const parsed = parseFloat(cleanValue)

  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
}

const hasChildren = (node) => Array.isArray(node?.children) && node.children.length > 0

// Available budget from the selected row (unappropriated amount)
const availableBudget = computed(() => {
  return appropriationStore.remainingUnappropriated
})

// Transform allocations for display (class -> type -> item -> subitem -> subtype -> subsubtype)
const levelPrefixes = ['type', 'item', 'subitem', 'subtype', 'subsubtype']

const mapAllocationNode = (node, levelIndex, ancestorIds) => {
  const level = levelPrefixes[Math.min(levelIndex, levelPrefixes.length - 1)]
  const amountIds = [...ancestorIds, node.id]
  const children = Array.isArray(node.children)
    ? node.children.map((child) => mapAllocationNode(child, levelIndex + 1, amountIds))
    : []

  return {
    id: node.id,
    name: node.name,
    order: node.order,
    isMainCategory: node.isMainCategory,
    cacheKey: appropriationStore.buildAllocationKey(level, amountIds),
    amountIds,
    amount: appropriationStore.getAllocationAmount(level, amountIds),
    children,
  }
}

const displayAccounts = computed(() => {
  const rawData = appropriationStore.allocations
  const allocations = Array.isArray(rawData?.data)
    ? rawData.data
    : Array.isArray(rawData)
      ? rawData
      : []

  const filteredData = searchQuery.value
    ? filterBySearchQuery(allocations, searchQuery.value)
    : allocations

  return filteredData.map((expenseClass) => ({
    id: expenseClass.id,
    name: expenseClass.name,
    order: expenseClass.order,
    isMainCategory: expenseClass.isMainCategory,
    amount: '',
    children: Array.isArray(expenseClass.children)
      ? expenseClass.children.map((expenseType) =>
          mapAllocationNode(expenseType, 0, [expenseClass.id]),
        )
      : [],
  }))
})

// Generic recursive search filter — works at any depth (class -> ... -> subsubtype)
const filterBySearchQuery = (allocations, query) => {
  const lowerQuery = String(query || '').toLowerCase()
  const matchText = (text) =>
    String(text || '')
      .toLowerCase()
      .includes(lowerQuery)

  const filterNode = (node) => {
    const nameMatches = matchText(node.name)
    const children = Array.isArray(node.children)
      ? node.children.map(filterNode).filter(Boolean)
      : []
    if (nameMatches || children.length > 0) {
      return { ...node, children }
    }
    return null
  }

  return allocations.map(filterNode).filter(Boolean)
}

// depth: 0 = type, 1 = item, 2 = subitem, 3 = subtype, 4 = subsubtype

// Sum only leaf-level (deepest) amounts under a node, to avoid double counting
const sumLeafAmounts = (node) => {
  if (!hasChildren(node)) {
    return parseCurrency(node.amount)
  }
  return node.children.reduce((sum, child) => sum + sumLeafAmounts(child), 0)
}

const calculateClassTotal = (expenseClass) => {
  const total = (expenseClass.children || []).reduce((sum, child) => sum + sumLeafAmounts(child), 0)
  return Math.round(total * 100) / 100
}

// Calculate only NEW allocations (sum of all leaf-level input values)
const newAllocationsTotal = computed(() => {
  if (!displayAccounts.value) return 0
  let total = 0
  displayAccounts.value.forEach((expenseClass) => {
    ;(expenseClass.children || []).forEach((expenseType) => {
      total += sumLeafAmounts(expenseType)
    })
  })
  return Math.round(total * 100) / 100
})

// Calculate net change (new allocations minus existing allocations)
const netChange = computed(() => {
  const existingTotal = appropriationStore.existingAllocationsTotal || 0
  const newTotal = newAllocationsTotal.value
  return Math.round((newTotal - existingTotal) * 100) / 100
})

// Calculate remaining budget after changes
const remainingAfterChanges = computed(() => {
  return Math.round((availableBudget.value - netChange.value) * 100) / 100
})

// Determine if save button should be enabled
const canSave = computed(() => {
  const hasValidAllocation = newAllocationsTotal.value > 0
  const withinBudget = netChange.value <= availableBudget.value + 0.01 // Small tolerance
  const hasValidAmounts = newAllocationsTotal.value >= 0

  return hasValidAllocation && withinBudget && hasValidAmounts
})

const getTypeClass = (expenseType) => {
  return hasChildren(expenseType) ? 'text-weight-bold' : 'text-weight-regular'
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

    const levelTypeName = (depth) => ['type', 'item', 'sub-item', 'sub-type', 'sub-sub-type'][depth]
    const childKeyByDepth = [
      'expense_item_id',
      'expense_sub_item_id',
      'expense_sub_type_id',
      'expense_sub_sub_type_id',
    ]

    const walk = (node, path, depth) => {
      const isLeaf = !hasChildren(node)
      if (isLeaf) {
        const amount = parseCurrency(node.amount)
        if (amount > 0) {
          allocations.push({
            type: levelTypeName(depth),
            amount,
            expense_class_id: path.expense_class_id ?? null,
            expense_type_id: path.expense_type_id ?? null,
            expense_item_id: path.expense_item_id ?? null,
            expense_sub_item_id: path.expense_sub_item_id ?? null,
            expense_sub_type_id: path.expense_sub_type_id ?? null,
            expense_sub_sub_type_id: path.expense_sub_sub_type_id ?? null,
          })
          hasValidAllocation = true
        }
        return
      }
      const childKey = childKeyByDepth[depth]
      node.children.forEach((child) => walk(child, { ...path, [childKey]: child.id }, depth + 1))
    }

    displayAccounts.value.forEach((expenseClass) => {
      ;(expenseClass.children || []).forEach((expenseType) => {
        walk(expenseType, { expense_class_id: expenseClass.id, expense_type_id: expenseType.id }, 0)
      })
    })

    if (!hasValidAllocation) {
      throw new Error('Please enter at least one valid amount')
    }

    const totalNewAllocation = allocations.reduce((sum, a) => sum + a.amount, 0)
    const existingTotal = appropriationStore.existingAllocationsTotal || 0
    const actualAllocationAmount = totalNewAllocation - existingTotal

    const tolerance = 0.01
    if (actualAllocationAmount > availableBudget.value + tolerance) {
      const errorMsg = `Allocation amount exceeds available budget!
        Available Budget: ₱${availableBudget.value.toFixed(2)}
        New Allocation Total: ₱${totalNewAllocation.toFixed(2)}
        Existing Allocations: ₱${existingTotal.toFixed(2)}
        Net Allocation Amount: ₱${actualAllocationAmount.toFixed(2)}
        Excess Amount: ₱${(actualAllocationAmount - availableBudget.value).toFixed(2)}`

      console.error(errorMsg)
      throw new Error(errorMsg)
    }

    // Trigger background refresh so we can close immediately
    await appropriationStore.commitAllocation(appropriationStore.selectedRow.id, allocations, {
      backgroundRefresh: true,
    })

    // Clear input cache and reset state after successful allocation
    appropriationStore.resetAllocationState()

    // Close dialog immediately after successful allocation
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
    }

    $q.notify({
      type: 'negative',
      message: message,
      icon: 'error',
      position: 'top',
    })
  }
}

// Display function:
// - While typing (string), show commas only (no forced decimals)
// - After blur (number), show two decimals
const formatInputValue = (value) => {
  if (value === '' || value === null || value === undefined) return ''

  const isNumber = typeof value === 'number'
  const cleanValue = String(value)
    .replace(/[₱,\s]/g, '')
    .replace(/,/g, '')
  const num = parseFloat(cleanValue)
  if (isNaN(num)) return ''

  return isNumber
    ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : num.toLocaleString('en-US')
}

// Handle input changes while typing: return CLEANED STRING (no commas, no peso)
const handleAmountInput = (value) => {
  // Remove peso sign, commas, and spaces
  let cleanValue = String(value).replace(/[₱,\s]/g, '')

  // Only allow digits and one decimal point
  cleanValue = cleanValue.replace(/[^\d.]/g, '')

  // Handle multiple decimal points
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }

  // Limit decimal places to 2
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }

  return cleanValue
}

// On blur: force exactly two decimals and proper formatting
const formatToTwoDecimals = (value) => {
  // Remove peso sign, commas, and spaces
  const cleanValue = String(value).replace(/[₱,\s]/g, '')

  if (cleanValue === '') return 0

  // Handle multiple decimal points
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    const collapsed = parts[0] + '.' + parts.slice(1).join('')
    return formatToTwoDecimals(collapsed)
  }

  // Limit decimal places to 2
  if (parts.length === 2 && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2)
  }

  const num = parseFloat(parts.join('.'))
  if (isNaN(num)) return 0

  // Return numeric value with two decimals
  return Math.round(num * 100) / 100
}

// Block any non-numeric keypress except one decimal point
const blockNonNumeric = (event) => {
  const key = event.key
  const isControl = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(key)
  if (isControl) return
  const isDigit = /\d/.test(key)
  const isDot = key === '.'
  // Prevent multiple dots
  if (isDot && event.target?.value?.includes?.('.')) {
    event.preventDefault()
    return
  }
  if (!isDigit && !isDot) {
    event.preventDefault()
  }
}

// Sanitize pasted content to numbers with optional single decimal (max 2 decimals)
const handlePasteNumeric = (event) => {
  const text = (event.clipboardData || window.clipboardData).getData('text')
  let clean = String(text).replace(/[^\d.]/g, '')
  const parts = clean.split('.')
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length >= 2) {
    parts[1] = parts[1].slice(0, 2)
    clean = parts[0] + '.' + parts[1]
  }
  // Insert cleaned value at cursor
  const input = event.target
  const start = input.selectionStart
  const end = input.selectionEnd
  const current = input.value
  input.value = current.slice(0, start) + clean + current.slice(end)
  const e = new Event('input', { bubbles: true })
  input.dispatchEvent(e)
}

const setNodeAmount = (node, value) => {
  if (!node?.cacheKey) return
  appropriationStore.updateAllocationAmount(node.cacheKey, value, node.amountIds)
  updateUnappropriated()
}

const updateUnappropriated = () => {
  if (appropriationStore.selectedRow) {
    appropriationStore.calculateTotals()
  }
}

const typeAllocationConflicts = ref([])
const showConfirmationDialog = ref(false)

// Find any node (at any depth) that has BOTH its own amount AND allocated children
const findConflicts = (node, depth, conflicts) => {
  if (!hasChildren(node)) return
  const ownAmount = parseCurrency(node.amount)
  const childrenTotal = sumLeafAmounts(node)
  if (ownAmount > 0 && childrenTotal > 0) {
    conflicts.push({
      levelKey: levelPrefixes[depth],
      typeId: node.id,
      typeName: node.name,
      typeAmount: ownAmount,
      itemsTotal: childrenTotal,
      cacheKey: node.cacheKey,
      amountIds: node.amountIds,
    })
  }
  node.children.forEach((child) => findConflicts(child, depth + 1, conflicts))
}

const checkAndSubmitAllocation = () => {
  const conflicts = []
  displayAccounts.value.forEach((expenseClass) => {
    ;(expenseClass.children || []).forEach((expenseType) => {
      findConflicts(expenseType, 0, conflicts)
    })
  })

  if (conflicts.length > 0) {
    typeAllocationConflicts.value = conflicts
    showConfirmationDialog.value = true
  } else {
    submitAllocation()
  }
}

const confirmAndSubmitAllocation = async () => {
  try {
    // Close confirmation dialog first
    showConfirmationDialog.value = false

    // Clear parent-level allocations from input cache to ensure they're not sent
    typeAllocationConflicts.value.forEach((conflict) => {
      const key = conflict.cacheKey || `${conflict.levelKey}-${conflict.typeId}`
      appropriationStore.updateAllocationAmount(key, '', conflict.amountIds || [conflict.typeId])
    })

    // Now submit the allocation (this will only include the deepest-level allocations)
    await submitAllocation()
  } catch (error) {
    console.error('[ERROR] confirmAndSubmitAllocation:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to save allocation',
      icon: 'error',
      position: 'top',
    })
  }
}
</script>

<style scoped>
.allocation-card {
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
.text-negative {
  color: #c10015;
}
.text-positive {
  color: #21ba45;
}

/* Currency input formatting styles */
.q-input input {
  text-align: right;
  font-family: 'Courier New', monospace;
}

/* Ensure proper spacing for currency values */
.edit-allocation-input,
.q-input[style*='max-width: 230px'] {
  min-width: 180px;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .allocation-card {
    min-width: 90vw !important;
  }

  .q-input[style*='max-width: 230px'] {
    min-width: 150px;
  }

  .hierarchical-body {
    max-height: calc(80vh - 200px);
  }
}

@media (max-width: 900px) {
  .allocation-card {
    min-width: 95vw !important;
  }

  .q-input[style*='max-width: 230px'] {
    min-width: 120px;
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

/* Confirmation dialog styles */
.confirmation-list {
  max-height: 300px;
  overflow-y: auto;
}

.conflict-item {
  transition: all 0.2s ease;
}

.conflict-item:hover {
  background-color: #e3f2fd !important;
  border-color: #2196f3 !important;
}

.text-warning {
  color: #ff9800;
}

/* Item and Subitem row styles */
.item-row {
  background-color: #ffffff !important;
  border-left: none !important;
}

.subitem-row {
  background-color: #fafafa !important;
  border-left: 3px solid #e0e0e0 !important;
  margin-left: 24px !important;
  position: relative;
}

.subitem-row:hover {
  background-color: #f0f0f0 !important;
}

.subitem-row::before {
  content: '';
  position: absolute;
  left: -3px;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #e0e0e0;
}

/* Column-specific styles */
.item-name-column {
  position: relative;
}

.subitem-name-column {
  position: relative;
  padding-left: 48px !important;
}

.item-amount-column,
.subitem-amount-column {
  position: relative;
}

/* Expand/collapse button styles */
.expand-btn {
  min-width: 20px !important;
  margin-right: 4px !important;
  padding: 2px !important;
}

.expand-btn .q-icon {
  font-size: 0.7rem !important;
}

/* Icon styles */
.item-icon {
  font-size: 0.7rem !important;
}

.subitem-icon {
  font-size: 0.6rem !important;
  color: #666 !important;
}

/* Name styles */
.item-name {
  font-size: 0.9rem !important;
}

.subitem-name {
  font-size: 0.85rem !important;
  color: #666 !important;
}

/* Chip styles for subitem count */
.subitem-count-chip {
  font-size: 0.6rem !important;
  height: 18px !important;
  min-height: 18px !important;
  padding: 0 6px !important;
}

/* Visual hierarchy improvements */
.item-row {
  border-left: 2px solid transparent !important;
}

.item-row:hover {
  background-color: #f8f9fa !important;
  border-left-color: #e3f2fd !important;
}

/* Responsive adjustments for better column separation */
@media (max-width: 768px) {
  .subitem-row {
    margin-left: 16px !important;
  }

  .subitem-name-column {
    padding-left: 32px !important;
  }

  .item-name-column {
    padding-left: 32px !important;
  }
}

/* Responsive confirmation dialog */
@media (max-width: 768px) {
  .q-dialog .q-card {
    min-width: 95vw !important;
    max-width: 95vw !important;
    width: 95vw !important;
  }
}
</style>
