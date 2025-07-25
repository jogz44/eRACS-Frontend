import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { useAuthStore } from './auth'

export const getAuthConfig = () => {
  const authStore = useAuthStore()
  if (!authStore.token) {
    console.error('No authentication token found')
    throw new Error('Authentication required')
  }
  return {
    headers: {
      Authorization: `Bearer ${authStore.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }
}

export const useAppropriationStore = defineStore('appropriation', {
  state: () => ({
    loading: false,
    showAllocationDialog: false,
    searchQuery: '',
    dateFrom: '',
    dateTo: '',
    allocationInputs: {},
    inputValues: {},
    inputCache: {},
    selectedRow: null,
    currentInputValues: {},
    expenseHierarchy: [],
    rawAllocations: [],
    categoryTotals: [],

    appropriations: [],
    fiscalYears: [], // Add this to store all fiscal years
    currentFiscalYearId: null, // Store the current fiscal year ID
    currentYear: new Date().getFullYear().toString(),

    allocations: [],
  }),

  getters: {
    expenseClassTotals(state) {
      // Directly return the pre-calculated totals
      return state.categoryTotals
    },

    flattenedAccounts(state) {
      const flatten = (items, depth = 0) => {
        if (!items || !Array.isArray(items)) return []

        return items.reduce((acc, item) => {
          if (!item) return acc

          // Add the current item with proper indentation
          const prefix = depth > 0 ? '→ '.repeat(depth) : ''
          const flatItem = {
            ...item,
            indent: depth,
            displayName: prefix + item.name,
            indentStyle: { paddingLeft: `${depth * 20}px` },
          }
          acc.push(flatItem)

          // Process children if they exist
          if (item.children && Array.isArray(item.children)) {
            const childItems = flatten(item.children, depth + 1)
            acc.push(...childItems)
          }

          return acc
        }, [])
      }

      return flatten(state.accounts)
    },

    filteredAccounts(state) {
      if (!state.searchQuery.trim()) return this.flattenedAccounts

      const query = state.searchQuery.toLowerCase()
      const matchingIds = new Set()

      // First identify all matching items
      const matchingItems = this.flattenedAccounts.filter((item) => {
        const matches =
          item.name.toLowerCase().includes(query) ||
          (item.displayName && item.displayName.toLowerCase().includes(query))
        if (matches) matchingIds.add(item.id)
        return matches
      })

      // Add parent categories of matching items
      const parentCategories = this.flattenedAccounts.filter(
        (item) =>
          item.isMainCategory &&
          this.flattenedAccounts.some(
            (child) => child.indent > item.indent && matchingIds.has(child.id),
          ),
      )

      return [...new Set([...matchingItems, ...parentCategories])].sort((a, b) => {
        const indexA = this.flattenedAccounts.findIndex((item) => item.id === a.id)
        const indexB = this.flattenedAccounts.findIndex((item) => item.id === b.id)
        return indexA - indexB
      })
    },

    totalAllocated() {
      return this.flattenedAccounts.reduce((total, account) => {
        if (!account.amount || account.isMainCategory) return total
        const amount = parseFloat(String(account.amount).replace(/,/g, '')) || 0
        return total + amount
      }, 0)
    },

    remainingUnappropriated(state) {
      return (state.selectedRow?.total || 0) - this.totalAllocated
    },

    filteredAppropriations(state) {
      let results = state.appropriations

      // Date filtering
      if (state.dateFrom || state.dateTo) {
        const fromDate = state.dateFrom ? new Date(state.dateFrom) : null
        const toDate = state.dateTo ? new Date(state.dateTo) : null

        results = results.filter((item) => {
          const itemDate = new Date(item.date)

          // Normalize all dates to start of the day
          const normalizedItemDate = new Date(itemDate.toDateString())
          const normalizedFromDate = fromDate ? new Date(fromDate.toDateString()) : null
          const normalizedToDate = toDate ? new Date(toDate.toDateString()) : null

          return (
            (!normalizedFromDate || normalizedItemDate >= normalizedFromDate) &&
            (!normalizedToDate || normalizedItemDate <= normalizedToDate)
          )
        })
      }

      // Search filtering
      if (state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase()
        results = results.filter((item) =>
          Object.values(item).some((val) => String(val).toLowerCase().includes(query)),
        )
      }

      return results
    },
  },

  actions: {
    /*async getCurrentFiscalYear() {
      try {
        const response = await api.get('/api/barangay/fiscal-years/current', getAuthConfig())
        return response.data.id
      } catch (error) {
        console.error('Failed to get current fiscal year:', error)
        throw error
      }
    },*/

    async openAllocationDialog(row) {
      try {
        console.log('[DEBUG] Opening allocation dialog for row:', row)

        this.selectedRow = {
          id: row.id,
          total: row.amount || 0,
          unappropriated: row.unappropriated || 0,
          description: row.description || '',
        }

        this.loading = true
        console.log('[DEBUG] Fetching expense hierarchy and existing allocations...')

        // Fetch both in parallel for better performance
        await Promise.all([this.fetchExpenseHierarchy(), this.fetchExistingAllocations(row.id)])

        this.showAllocationDialog = true
        console.log('[DEBUG] Allocation dialog opened successfully with existing allocations')
      } catch (error) {
        console.error('[ERROR] in openAllocationDialog:', {
          error: error.message,
          rowData: row,
          stack: error.stack,
        })

        throw new Error(error.message || 'Failed to load allocation accounts. Please try again.')
      } finally {
        this.loading = false
        console.log('[DEBUG] Loading state reset')
      }
    },

    formatDate(value) {
      if (!value) return ''

      const date = new Date(value)

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },

    formatCurrency(value) {
      if (value === null || value === undefined) return '₱0.00'

      const num =
        typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : Number(value)

      return isNaN(num)
        ? '₱0.00'
        : num.toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
          })
    },

    calculateTotals() {
      if (this.selectedRow) {
        this.selectedRow.unappropriated = this.remainingUnappropriated
      }
    },

    async saveAllocation() {
      if (!this.selectedRow) {
        console.error('No selected row to save allocation for.')
        return false
      }
      try {
        const updateAccountRecursively = (items, flatItem) => {
          for (const item of items) {
            if (item.id === flatItem.id) {
              item.amount = flatItem.amount
              return true
            }

            if (item.children && item.children.length) {
              if (updateAccountRecursively(item.children, flatItem)) {
                return true
              }
            }
          }
          return false
        }

        this.flattenedAccounts
          .filter((item) => !item.isMainCategory)
          .forEach((flatItem) => {
            updateAccountRecursively(this.accounts, flatItem)
          })

        this.showAllocationDialog = false
        return true
      } catch (error) {
        console.error('Failed to save allocation:', error)
        return false
      }
    },

    async addBudget(newBudget) {
      try {
        const response = await api.post('/api/barangay/budgets/create', newBudget, getAuthConfig())

        // Add to local state
        const newApprop = {
          id: response.data.id,
          date: new Date().toISOString().split('T')[0], // or use response.data.date
          description: newBudget.description,
          amount: parseFloat(newBudget.original_amount),
          unappropriated: parseFloat(newBudget.original_amount),
          allocations: [],
        }

        this.appropriations.push(newApprop)
        return newApprop
      } catch (error) {
        console.error('Failed to add budget:', error)
        throw error // Re-throw to handle in component
      }
    },

    async fetchBudgets() {
      this.loading = true
      try {
        const currentYear = new Date().getFullYear()
        const response = await api.get('/api/barangay/budgets', {
          params: { year: currentYear },
          headers: getAuthConfig().headers,
        })

        this.appropriations = response.data.data.map((budget) => ({
          id: budget.id,
          date: budget.date,
          description: budget.description,
          amount: budget.amount,
          unappropriated: budget.unappropriated,
          fiscal_year: budget.fiscal_year,
          allocations: budget.allocations,
        }))
        // Optional: Store the total available amount if needed
        this.totalAvailable = parseFloat(response.data.total_available) || 0
      } catch (error) {
        console.error('Error fetching budgets:', error)
      } finally {
        this.loading = false // Set loading to false when done
      }
    },
    async initialize() {
      await this.fetchAppropriations()
    },

    async fetchExpenseHierarchy() {
      try {
        // 1. Get fiscal years - response is direct array
        const yearsResponse = await api.get('/api/barangay/fiscal-years', getAuthConfig())
        const fiscalYears = Array.isArray(yearsResponse.data)
          ? yearsResponse.data
          : yearsResponse.data.data || []

        // 2. Find current year
        const currentYear = new Date().getFullYear()
        const fiscalYear = fiscalYears.find((y) => y.year == currentYear)

        if (!fiscalYear) {
          throw new Error(`No fiscal year configuration found for ${currentYear}.
        Please contact your administrator.`)
        }
        console.log('[DEBUG] Fetching expense hierarchy...')
        const response = await api.get('/api/barangay/expense-hierarchy', {
          params: { fiscal_year_id: fiscalYear.id },
          headers: getAuthConfig().headers,
        })

        console.log('[DEBUG] Full API response:', response)

        // Extract the actual array from response.data.data
        this.allocations = response.data.data || []
        console.log('[DEBUG] Extracted allocations:', this.allocations)
      } catch (error) {
        console.error('[ERROR] fetchExpenseHierarchy:', error)
        throw error
      }
    },

    async fetchExistingAllocations(budgetId) {
      try {
        console.log('[DEBUG] Fetching existing allocations for budget:', budgetId)
        const response = await api.get(
          `/api/barangay/budgets/${budgetId}/allocations`,
          getAuthConfig(),
        )

        // Initialize input values from existing allocations
        const allocations = response.data.data || []
        console.log('[DEBUG] Retrieved allocations:', allocations)

        // Clear previous inputs
        this.inputCache = {}
        this.allocationInputs = {}

        // Set current values from existing allocations
        allocations.forEach((allocation) => {
          const id = allocation.expense_item_id || allocation.expense_type_id
          if (id) {
            const amount = allocation.amount.toString()
            this.inputCache[id] = amount
            this.allocationInputs[id] = amount
          }
        })

        console.log('[DEBUG] Initialized input values from existing allocations')
      } catch (error) {
        console.error('[ERROR] fetchExistingAllocations:', {
          error: error.message,
          budgetId: budgetId,
          stack: error.stack,
        })
        // Fail silently - new allocation will start fresh
      }
    },

    // In your appropriationStore.js
    async commitAllocation(budgetId, allocations) {
      try {
        const response = await api.post(
          `/api/barangay/budgets/${budgetId}/allocate`,
          { allocations },
          getAuthConfig(),
        )

        // Update local state - more robust handling
        const budgetIndex = this.appropriations.findIndex((b) => b.id === budgetId)
        if (budgetIndex !== -1) {
          // Use response data or fallback to calculation
          const updatedAmount =
            response.data?.updated_amount ??
            this.appropriations[budgetIndex].unappropriated -
              allocations.reduce((sum, a) => sum + a.amount, 0)

          this.appropriations[budgetIndex].unappropriated = updatedAmount
        }

        return response.data
      } catch (error) {
        console.error('Error committing allocation:', error)
        throw error
      }
    },

    // Modified to prevent recursion
    updateAllocationAmount(id, value) {
      // Only update if value changed
      if (this.inputCache[id] !== value) {
        this.inputCache = {
          ...this.inputCache,
          [id]: value,
        }
        this.allocationInputs = {
          ...this.allocationInputs,
          [id]: value,
        }
      }
    },

    // Initialize or reset input values
    initializeInputCache(allocations) {
      const cache = {}
      const processItems = (items) => {
        items.forEach((item) => {
          if (item.id) {
            cache[item.id] = this.allocationInputs[item.id] || ''
          }
          if (item.children) {
            processItems(item.children)
          }
        })
      }
      processItems(allocations)
      this.inputCache = cache
    },

    calculateClassTotal(expenseClass) {
      let total = 0
      expenseClass.children?.forEach((expenseType) => {
        // Check both the type amount and its items
        const typeAmount = parseFloat(this.inputCache[expenseType.id] || 0)
        total += typeAmount

        expenseType.children?.forEach((item) => {
          const itemAmount = parseFloat(this.inputCache[item.id] || 0)
          total += itemAmount
        })
      })
      return total
    },

    async fetchAllocationHistory(id) {
      try {
        const response = await api.get(
          `/api/barangay/appropriations/${id}/history`,
          getAuthConfig(),
        )

        // Transform the data to match your frontend structure
        const latestAllocation = response.data.data.history[0] || null

        if (!latestAllocation) {
          return {
            allocations: [],
            created_at: null,
            budget: response.data.data.budget,
          }
        }

        // Group by expense class for hierarchical display
        const groupedByClass = {}

        latestAllocation.allocations.forEach((alloc) => {
          const classId = alloc.expense_class_id

          if (!groupedByClass[classId]) {
            groupedByClass[classId] = {
              id: classId,
              name: alloc.expense_class_name,
              children: [],
            }
          }

          // Check if this is a type-level allocation
          if (alloc.expense_type_id && !alloc.expense_item_id) {
            groupedByClass[classId].children.push({
              id: alloc.expense_type_id,
              name: alloc.expense_type_name,
              amount: alloc.amount,
              children: [],
            })
          }
          // Check if this is an item-level allocation
          else if (alloc.expense_item_id) {
            // Find or create the type
            let type = groupedByClass[classId].children.find((t) => t.id === alloc.expense_type_id)
            if (!type) {
              type = {
                id: alloc.expense_type_id,
                name: alloc.expense_type_name,
                amount: 0, // Parent types don't have their own amount
                children: [],
              }
              groupedByClass[classId].children.push(type)
            }

            // Add the item
            type.children.push({
              id: alloc.expense_item_id,
              name: alloc.expense_item_name,
              amount: alloc.amount,
            })
          }
        })

        return {
          allocations: Object.values(groupedByClass),
          created_at: latestAllocation.created_at,
          budget: response.data.data.budget,
        }
      } catch (error) {
        console.error('Failed to fetch allocation history:', error)
        throw error
      }
    },

    async processCombinedAllocations(allocations) {
      this.rawAllocations = allocations

      if (!this.expenseHierarchy.length) {
        console.warn('[WARNING] Hierarchy not loaded - fetching now')
        await this.fetchExpenseHierarchy()
      }

      // Re-check hierarchy after await
      if (!this.expenseHierarchy.length) {
        console.error('[ERROR] Hierarchy still not loaded after fetch')
        return
      }

      this.categoryTotals = this.calculateCategoryTotals()
      console.log('[DEBUG] Calculated totals:', this.categoryTotals)
    },
    calculateCategoryTotals() {
      if (!this.expenseHierarchy.length || !this.rawAllocations.length) {
        console.warn('Cannot calculate - missing data')
        return []
      }

      // Create amount map
      const amountMap = {}
      this.rawAllocations.forEach((alloc) => {
        const id = alloc.expense_item_id || alloc.expense_type_id || alloc.expense_class_id
        if (id) amountMap[id] = (amountMap[id] || 0) + parseFloat(alloc.amount)
      })

      // Calculate totals
      return this.expenseHierarchy
        .map((category) => {
          let total = amountMap[category.id] || 0

          // Sum child types
          category.children?.forEach((type) => {
            total += amountMap[type.id] || 0

            // Sum child items
            type.children?.forEach((item) => {
              total += amountMap[item.id] || 0
            })
          })

          return {
            name: category.name,
            total: total,
          }
        })
        .filter((cat) => cat.total > 0)
    },

    /*addAppropriation(newAppropriation) {
      this.appropriations.push({
        id: Math.max(...this.appropriations.map((a) => a.id), 0) + 1,
        date: newAppropriation.date,
        description: newAppropriation.description,
        amount: parseFloat(newAppropriation.amount),
        unappropriated: parseFloat(newAppropriation.amount),
        allocations: [],
      })
    },

    updateUnappropriated(appropriationId, amount) {
      const appropriation = this.appropriations.find((a) => a.id === appropriationId)
      if (appropriation) {
        appropriation.unappropriated = parseFloat(amount) // Ensure numeric value
      }
    },*/
  },
})
