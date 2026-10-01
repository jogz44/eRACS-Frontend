import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { useAuthStore } from './auth'

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
    originalAllocations: {}, // Track original allocation amounts
    existingAllocationsTotal: 0, // Track total of existing allocations

    appropriations: [],
    fiscalYears: [],
    currentFiscalYearId: null,
    currentYear: new Date().getFullYear().toString(),
    selectedFiscalYear: new Date().getFullYear().toString(),
    selectedBarangayId: null, // For admin barangay filtering
    selectedBudgetType: 'all', // For budget type filtering

    allocations: [],
    authStore: useAuthStore(), // Moved hook call inside state
  }),

  getters: {
    expenseClassTotals(state) {
      return state.categoryTotals
    },

    flattenedAccounts(state) {
      const flatten = (items, depth = 0) => {
        if (!items || !Array.isArray(items)) return []

        return items.reduce((acc, item) => {
          if (!item) return acc

          const prefix = depth > 0 ? '→ '.repeat(depth) : ''
          const flatItem = {
            ...item,
            indent: depth,
            displayName: prefix + item.name,
            indentStyle: { paddingLeft: `${depth * 20}px` },
          }
          acc.push(flatItem)

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

      const matchingItems = this.flattenedAccounts.filter((item) => {
        const matches =
          item.name.toLowerCase().includes(query) ||
          (item.displayName && item.displayName.toLowerCase().includes(query))
        if (matches) matchingIds.add(item.id)
        return matches
      })

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

    totalAllocated(state) {
      return state.flattenedAccounts.reduce((total, account) => {
        if (!account.amount || account.isMainCategory) return total
        const amount = parseCurrency(account.amount)
        return total + amount
      }, 0)
    },

    remainingUnappropriated(state) {
      const total = parseCurrency(state.selectedRow?.total || 0)
      // Use existingAllocationsTotal instead of totalAllocated for accurate calculation
      const existingAllocated = state.existingAllocationsTotal || 0
      const result = Math.round((total - existingAllocated) * 100) / 100

      return result
    },

    filteredAppropriations(state) {
      // Helper to parse either 'YYYY-MM-DD' or 'DD/MM/YYYY'
      const parseFlexibleDate = (value) => {
        if (!value) return null
        if (value instanceof Date) return value
        if (typeof value === 'string') {
          if (value.includes('/')) {
            const [dd, mm, yyyy] = value.split('/')
            const d = new Date(`${yyyy}-${mm}-${dd}`)
            return isNaN(d.getTime()) ? null : d
          }
          const d = new Date(value)
          return isNaN(d.getTime()) ? null : d
        }

        return null
      }

      let results = state.appropriations

      if (state.selectedFiscalYear && state.selectedFiscalYear !== 'all') {
        results = results.filter((item) => {
          return String(item.fiscal_year) === String(state.selectedFiscalYear)
        })
      }

      // Budget type filtering
      if (state.selectedBudgetType && state.selectedBudgetType !== 'all') {
        results = results.filter((item) => {
          const description = item.description?.toLowerCase() || ''
          if (state.selectedBudgetType === 'annual') {
            return description.includes('annual')
          } else if (state.selectedBudgetType === 'supplemental') {
            // For supplemental budgets, show all regardless of unappropriated amount
            return description.includes('supplemental')
          }
          return true
        })
      } else {
        // For 'all' view, show all budgets including supplemental budgets with zero unappropriated amount
        // results = results.filter((item) => {
        //   const description = item.description?.toLowerCase() || ''
        //   // Show all budgets regardless of unappropriated amount
        //   return true
        // })
      }

      // Date filtering (inclusive)
      const from = parseFlexibleDate(state.dateFrom)
      const to = parseFlexibleDate(state.dateTo)
      if (from || to) {
        // Normalize range bounds to full-day
        const fromStart = from ? new Date(from.setHours(0, 0, 0, 0)) : null
        const toEnd = to ? new Date(to.setHours(23, 59, 59, 999)) : null

        results = results.filter((item) => {
          const d = parseFlexibleDate(item.date)
          if (!d) return false
          const dt = d.getTime()
          return (!fromStart || dt >= fromStart.getTime()) && (!toEnd || dt <= toEnd.getTime())
        })
      }

      // Search filtering
      const query = (state.searchQuery || '').toLowerCase().trim()
      if (query) {
        results = results.filter((item) =>
          Object.values(item || {}).some((val) =>
            String(val ?? '')
              .toLowerCase()
              .includes(query),
          ),
        )
      }

      return results
    },
  },

  actions: {
    async openAllocationDialog(row) {
      try {
        const unappropriatedValue = row.unappropriated || row.amount || 0
        this.selectedRow = {
          id: row.id,
          total: parseCurrency(row.amount || 0),
          unappropriated: parseCurrency(unappropriatedValue),
          description: row.description || '',
        }

        this.loading = true
        this.resetAllocationState()

        await this.fetchExpenseHierarchy()
        await this.fetchExistingAllocations(row.id) // runs LAST, always wins

        if (this.selectedRow) {
          this.selectedRow.unappropriated = this.remainingUnappropriated
        }

        this.showAllocationDialog = true
      } catch (error) {
        console.error('[ERROR] in openAllocationDialog:', error)
        throw new Error(error.message || 'Failed to load allocation accounts. Please try again.')
      } finally {
        this.loading = false
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
      const num = parseCurrency(value)
      return num.toLocaleString('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
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
        // Add barangay_id for admin users if selected
        if (this.authStore.admin) {
          const selectedBarangay = this.authStore.getSelectedBarangay()
          if (selectedBarangay) {
            newBudget.barangay_id = selectedBarangay
          }
        }

        // Admin users cannot create budgets - only view
        if (this.authStore.admin) {
          throw new Error('Admin users cannot create budgets')
        }

        const endpoint = '/api/barangay/budgets/create'
        const token = this.authStore.token

        const response = await api.post(endpoint, newBudget, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        const newApprop = {
          id: response.data.id,
          date: new Date().toISOString().split('T')[0],
          description: newBudget.description,
          amount: parseCurrency(newBudget.original_amount),
          unappropriated: parseCurrency(newBudget.original_amount),
          allocations: [],
        }

        this.appropriations.push(newApprop)

        return newApprop
      } catch (error) {
        console.error('Failed to add budget:', error)
        throw error
      }
    },

    async fetchBudgets(yearOrOptions = null, options = { silent: false }) {
      const isLegacyOptionsOnly =
        yearOrOptions && typeof yearOrOptions === 'object' && !Array.isArray(yearOrOptions)
      const year = isLegacyOptionsOnly ? null : yearOrOptions
      const mergedOptions = isLegacyOptionsOnly ? yearOrOptions : options
      const silent = mergedOptions?.silent === true
      if (!silent) this.loading = true
      try {
        const params = {
          year: year !== null && year !== undefined ? Number(year) : new Date().getFullYear(),
        }

        if (this.selectedBudgetType && this.selectedBudgetType !== 'all') {
          params.budget_type = this.selectedBudgetType
        }

        // Add barangay filter for admin users
        if (this.authStore.admin) {
          const selectedBarangayId = this.authStore.getSelectedBarangay()
          if (selectedBarangayId) {
            params.barangay_id = selectedBarangayId
          }
        }

        // Use different endpoints for admin vs regular users
        const endpoint = this.authStore.admin ? '/api/admin/budgets' : '/api/barangay/budgets'
        const token = this.authStore.admin ? this.authStore.adminToken : this.authStore.token

        const response = await api.get(endpoint, {
          params: params,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        this.appropriations = response.data.data.map((budget) => ({
          id: budget.id,
          date: budget.date,
          description: budget.description,
          amount: parseCurrency(budget.amount),
          current_amount: parseCurrency(
            budget.current_amount !== null && budget.current_amount !== undefined
              ? budget.current_amount
              : budget.amount,
          ),
          unappropriated: parseCurrency(budget.unappropriated),
          fiscal_year: budget.fiscal_year,
          barangay_name: budget.barangay_name,
          barangay_id: budget.barangay_id,
          allocations: budget.allocations,
        }))

        this.totalAvailable = parseCurrency(response.data.total_available || 0)
      } catch (error) {
        console.error('Error fetching budgets:', error)
      } finally {
        if (!silent) this.loading = false
      }
    },

    // Method to set selected budget type for filtering
    setSelectedBudgetType(budgetType) {
      this.selectedBudgetType = budgetType
    },

    async initialize() {
      await this.fetchAppropriations()
      await this.fetchFiscalYears()
    },

    // Backwards-compat: some components call fetchAppropriations; route to fetchBudgets
    // async fetchAppropriations(options = { silent: false }) {
    //   return this.fetchBudgets(options)
    // },

    async fetchAppropriations(yearOrOptions = null, options = { silent: false }) {
      return this.fetchBudgets(yearOrOptions, options)
    },

    async fetchExpenseHierarchy() {
      try {
        // Use admin token if admin is logged in
        const token = this.authStore.admin ? this.authStore.adminToken : this.authStore.token

        let fiscalYear = null

        // Regular barangay users need the fiscal year ID
        if (!this.authStore.admin) {
          const yearsResponse = await api.get('/api/barangay/fiscal-years', {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          })

          const fiscalYears = Array.isArray(yearsResponse.data)
            ? yearsResponse.data
            : yearsResponse.data.data || []

          const currentYear = new Date().getFullYear()

          fiscalYear = fiscalYears.find((y) => y.year == currentYear)

          if (!fiscalYear) {
            throw new Error(
              `No fiscal year configuration found for ${currentYear}. ` +
                `Please contact your administrator.`,
            )
          }
        }

        // Select the appropriate endpoint
        const endpoint = this.authStore.admin
          ? '/api/admin/expense-hierarchy'
          : '/api/barangay/expense-hierarchy'

        const currentYear = new Date().getFullYear()

        const params = this.authStore.admin
          ? {
              year: currentYear,

              ...(this.selectedBarangayId
                ? {
                    barangay_id: this.selectedBarangayId,
                  }
                : {}),

              ...(this.selectedBudgetType !== 'all'
                ? {
                    budget_type: this.selectedBudgetType,
                  }
                : {}),
            }
          : {
              fiscal_year_id: fiscalYear.id,

              ...(this.selectedBudgetType !== 'all'
                ? {
                    budget_type: this.selectedBudgetType,
                  }
                : {}),
            }

        const response = await api.get(endpoint, {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        const hierarchyData = response.data?.data || []

        // console.log('[DEBUG] Expense hierarchy:', hierarchyData)

        this.allocations = sortAccountHierarchy(hierarchyData)
        // console.log('[RAW EXPENSE HIERARCHY]', JSON.stringify(response.data.data, null, 2))

        const sorted = sortAccountHierarchy(response.data.data || [])

        // console.log('[SORTED EXPENSE HIERARCHY]', JSON.stringify(sorted, null, 2))

        this.allocations = sorted
      } catch (error) {
        console.error('[ERROR] fetchExpenseHierarchy:', error)

        throw error
      }
    },

    async fetchExistingAllocations(budgetId) {
      try {
        // Use different endpoints for admin vs regular users
        const endpoint = this.authStore.admin
          ? `/api/admin/budgets/${budgetId}/allocations`
          : `/api/barangay/budgets/${budgetId}/allocations`
        const token = this.authStore.admin ? this.authStore.adminToken : this.authStore.token

        const response = await api.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        const allocations = response.data.data || []

        const cache = {}
        const originals = {}

        allocations.forEach((allocation) => {
          const resolved = resolveAllocationLevel(allocation)
          if (!resolved) return

          const amount = parseCurrency(allocation.amount)
          const amountText = amount.toString()

          collectAllocationKeys(resolved.level, resolved.ids).forEach((key) => {
            cache[key] = amountText
            originals[key] = amount
          })
        })

        this.inputCache = cache
        this.allocationInputs = { ...cache }
        this.originalAllocations = originals

        // Each row from the backend should be a single leaf-level allocation
        this.existingAllocationsTotal = allocations.reduce(
          (sum, a) => sum + parseCurrency(a.amount),
          0,
        )
      } catch (error) {
        console.error('[ERROR] fetchExistingAllocations:', {
          error: error.message,
          budgetId: budgetId,
          stack: error.stack,
        })
        this.inputCache = {}
        this.allocationInputs = {}
        this.originalAllocations = {}
        this.existingAllocationsTotal = 0
      }
    },

    async commitAllocation(budgetId, allocations, options = { backgroundRefresh: false }) {
      const doBackground = options?.backgroundRefresh === true
      if (!doBackground) this.loading = true
      try {
        const cleanedAllocations = allocations.map((allocation) => {
          const typeAliases = {
            subitem: 'sub-item',
            subtype: 'sub-type',
            subsubtype: 'sub-sub-type',
            sub_item: 'sub-item',
            sub_type: 'sub-type',
            sub_sub_type: 'sub-sub-type',
          }
          const normalizedType = typeAliases[allocation.type] || allocation.type
          return {
            amount: parseCurrency(allocation.amount),
            type: normalizedType,
            expense_class_id: allocation.expense_class_id ?? null,
            expense_type_id: allocation.expense_type_id ?? null,
            expense_item_id: allocation.expense_item_id ?? null,
            expense_sub_item_id: allocation.expense_sub_item_id ?? null,
            expense_sub_type_id: allocation.expense_sub_type_id ?? null,
            expense_sub_sub_type_id: allocation.expense_sub_sub_type_id ?? null,
          }
        })

        // Admin users cannot commit allocations - only view
        if (this.authStore.admin) {
          throw new Error('Admin users cannot commit allocations')
        }

        const endpoint = `/api/barangay/budgets/${budgetId}/allocate`
        const token = this.authStore.token

        const response = await api.post(
          endpoint,
          { allocations: cleanedAllocations },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        )

        // Use the backend response to update local state instead of calculating locally
        if (response.data && response.data.budget) {
          const budgetIndex = this.appropriations.findIndex((b) => b.id === budgetId)
          if (budgetIndex !== -1) {
            // Update with the actual values from the database
            // Backend returns current_amount which represents the unappropriated amount
            this.appropriations[budgetIndex].unappropriated = parseCurrency(
              response.data.budget.current_amount,
            )
          }
        }

        // Update existingAllocationsTotal to reflect the new allocations
        // This prevents negative net change calculations after saving
        const totalNewAllocation = cleanedAllocations.reduce(
          (sum, allocation) => sum + allocation.amount,
          0,
        )
        this.existingAllocationsTotal = totalNewAllocation

        // Optionally refresh in the background so UI can close immediately
        if (doBackground) {
          ;(async () => {
            try {
              await this.fetchBudgets({ silent: true })
              const { useDisbursementStore } = await import('./disbursementStore')
              const disbursementStore = useDisbursementStore()
              await disbursementStore.forceRefreshExpenseDetails()
              await disbursementStore.refreshExpenseAccountsInBackground()
            } catch (error) {
              console.warn('Background refresh after appropriation update failed:', error)
            }
          })()
        } else {
          // Refresh the budgets list to ensure we have the latest data from the database
          await this.fetchBudgets()
          // Refresh disbursement store expense data to reflect appropriation changes
          try {
            const { useDisbursementStore } = await import('./disbursementStore')
            const disbursementStore = useDisbursementStore()
            await disbursementStore.forceRefreshExpenseDetails()
            await disbursementStore.refreshExpenseAccountsInBackground()
          } catch (error) {
            console.warn('Failed to refresh disbursement store after appropriation update:', error)
          }
        }

        // Admin activity log

        return response.data
      } catch (error) {
        console.error('[ERROR] commitAllocation:', error)
        const backendMessage =
          error.response?.data?.message || error.response?.data?.error || error.message

        const wrapped = new Error(backendMessage)
        wrapped.original = error
        wrapped.response = error.response
        throw wrapped
      } finally {
        if (!doBackground) this.loading = false
      }
    },

    getAllocationAmount(level, ids = []) {
      return getCachedAllocationAmount(this.inputCache, level, ids)
    },

    buildAllocationKey(level, ids = []) {
      return buildAllocationKey(level, ids)
    },

    updateAllocationAmount(id, value, extraIds = []) {
      // Preserve numbers (finalized blur) so UI can render with .00;
      // while typing (strings), keep the sanitized raw string
      let nextValue
      if (typeof value === 'number') {
        nextValue = value
      } else if (value === '' || value === null || value === undefined) {
        nextValue = ''
      } else {
        nextValue = String(value)
      }

      const parsed = parseAllocationKey(id)
      const keys = parsed
        ? collectAllocationKeys(parsed.level, extraIds.length ? extraIds : parsed.ids)
        : [id]

      const cache = { ...this.inputCache }
      const inputs = { ...this.allocationInputs }
      let changed = false

      keys.forEach((key) => {
        if (cache[key] !== nextValue) {
          cache[key] = nextValue
          inputs[key] = nextValue
          changed = true
        }
      })

      if (changed) {
        this.inputCache = cache
        this.allocationInputs = inputs
      }
    },

    initializeInputCache(allocations) {
      const cache = {}
      const levelOrder = ['class', 'type', 'item', 'subitem', 'subtype', 'subsubtype']

      const processItems = (items, levelIndex = 0, ancestorIds = []) => {
        items.forEach((item) => {
          if (!item?.id) return
          const level = levelOrder[Math.min(levelIndex, levelOrder.length - 1)]
          const ids = [...ancestorIds, item.id]
          collectAllocationKeys(level, ids).forEach((key) => {
            cache[key] = getCachedAllocationAmount(this.allocationInputs, level, ids) || ''
          })
          if (Array.isArray(item.children) && item.children.length) {
            processItems(item.children, levelIndex + 1, ids)
          }
        })
      }
      processItems(allocations, 0, [])
      this.inputCache = cache
    },

    calculateClassTotal(expenseClass) {
      const prefixes = ['type', 'item', 'subitem', 'subtype', 'subsubtype']

      const sumLeaves = (node, depth, ancestorIds) => {
        const ids = node?.id != null ? [...ancestorIds, node.id] : ancestorIds
        if (!node.children || node.children.length === 0) {
          const prefix = prefixes[Math.min(depth, prefixes.length - 1)]
          return parseCurrency(
            getCachedAllocationAmount(this.inputCache, prefix, ids) || node.amount || 0,
          )
        }
        return node.children.reduce((sum, child) => sum + sumLeaves(child, depth + 1, ids), 0)
      }

      const total = (expenseClass.children || []).reduce(
        (sum, child) => sum + sumLeaves(child, 0, expenseClass.id != null ? [expenseClass.id] : []),
        0,
      )
      return Math.round(total * 100) / 100
    },

    async fetchAllocationHistory(id) {
      try {
        // Use different endpoints for admin vs regular users
        const endpoint = this.authStore.admin
          ? `/api/admin/budgets/${id}/history`
          : `/api/barangay/budgets/${id}/history`
        const token = this.authStore.admin ? this.authStore.adminToken : this.authStore.token

        const response = await api.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        const latestAllocation = response.data.data.history[0] || null

        if (!latestAllocation) {
          return {
            allocations: [],
            created_at: null,
            budget: response.data.data.budget,
          }
        }

        const groupedByClass = {}

        const ensureChild = (parent, id, name, order) => {
          if (!id) return null
          let child = parent.children.find((c) => c.id === id)
          if (!child) {
            child = {
              id,
              name: name || `Account ${id}`,
              order,
              amount: 0,
              children: [],
            }
            parent.children.push(child)
          }
          return child
        }

        latestAllocation.allocations.forEach((alloc) => {
          const classId = alloc.expense_class_id
          if (!groupedByClass[classId]) {
            groupedByClass[classId] = {
              id: classId,
              name: alloc.expense_class_name,
              order: alloc.expense_class_order,
              amount: 0,
              children: [],
            }
          }

          const cls = groupedByClass[classId]
          const type = ensureChild(
            cls,
            alloc.expense_type_id,
            alloc.expense_type_name,
            alloc.expense_type_order,
          )
          if (!type) {
            cls.amount += parseCurrency(alloc.amount)
            return
          }

          const item = ensureChild(
            type,
            alloc.expense_item_id,
            alloc.expense_item_name,
            alloc.expense_item_order,
          )
          if (!item) {
            type.amount += parseCurrency(alloc.amount)
            return
          }

          const subItem = ensureChild(
            item,
            alloc.expense_sub_item_id,
            alloc.expense_sub_item_name,
            alloc.expense_sub_item_order,
          )
          if (!subItem) {
            item.amount += parseCurrency(alloc.amount)
            return
          }

          const subType = ensureChild(
            subItem,
            alloc.expense_sub_type_id,
            alloc.expense_sub_type_name,
            alloc.expense_sub_type_order,
          )
          if (!subType) {
            subItem.amount += parseCurrency(alloc.amount)
            return
          }

          const subSubType = ensureChild(
            subType,
            alloc.expense_sub_sub_type_id,
            alloc.expense_sub_sub_type_name,
            alloc.expense_sub_sub_type_order,
          )
          if (!subSubType) {
            subType.amount += parseCurrency(alloc.amount)
            return
          }

          subSubType.amount += parseCurrency(alloc.amount)
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

      if (!this.expenseHierarchy.length) {
        console.error('[ERROR] Hierarchy still not loaded after fetch')
        return
      }

      this.categoryTotals = this.calculateCategoryTotals()
    },

    calculateCategoryTotals() {
      if (!this.expenseHierarchy.length || !this.rawAllocations.length) {
        console.warn('Cannot calculate - missing data')
        return []
      }

      // Create amount map with proper parsing
      const amountMap = {}
      this.rawAllocations.forEach((alloc) => {
        const id = alloc.expense_item_id || alloc.expense_type_id || alloc.expense_class_id
        if (id) {
          const amount = parseCurrency(alloc.amount)
          amountMap[id] = (amountMap[id] || 0) + amount
        }
      })

      // Calculate totals
      return this.expenseHierarchy
        .map((category) => {
          let total = amountMap[category.id] || 0

          // Sum child types
          category.children?.forEach((type) => {
            total += amountMap[type.id] || 0

            // Sum child items and sub-items
            type.children?.forEach((item) => {
              total += amountMap[item.id] || 0

              // Sum child sub-items
              item.children?.forEach((subItem) => {
                total += amountMap[subItem.id] || 0
              })
            })
          })

          return {
            name: category.name,
            total: Math.round(total * 100) / 100,
          }
        })
        .filter((cat) => cat.total > 0)
    },

    // Set selected fiscal year for filtering
    setSelectedFiscalYear(year) {
      this.selectedFiscalYear = year
    },

    // Reset allocation state after successful commit
    resetAllocationState() {
      this.inputCache = {}
      this.allocationInputs = {}
      this.originalAllocations = {}
      this.existingAllocationsTotal = 0
    },

    // Fetch available fiscal years
    async fetchFiscalYears() {
      try {
        const token = this.authStore.admin ? this.authStore.adminToken : this.authStore.token

        if (this.authStore.admin) {
          // For admin users, provide current year and "All Years" option
          const currentYear = new Date().getFullYear()
          this.fiscalYears = [
            { year: 'all', label: 'All Years' },
            { year: currentYear.toString(), label: currentYear.toString() },
          ]
          return
        }

        // For barangay users, fetch from barangay endpoint
        const response = await api.get('/api/barangay/fiscal-years', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        const fiscalYears = Array.isArray(response.data) ? response.data : response.data.data || []
        this.fiscalYears = fiscalYears.map((fy) => ({
          year: fy.year.toString(),
          label: fy.year.toString(),
        }))
      } catch (error) {
        console.error('Failed to fetch fiscal years:', error)
        this.fiscalYears = []
      }
    },
  },
})

// Backwards-compat export for components expecting `useContApprStore`
export const useContApprStore = useAppropriationStore

// Utility function for consistent currency parsing
const parseCurrency = (value) => {
  if (!value && value !== 0) return 0

  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  const parsed = Number.parseFloat(cleanValue)

  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
}

const ALLOCATION_LEVELS = ['class', 'type', 'item', 'subitem', 'subtype', 'subsubtype']

const normalizeAllocationId = (id) => {
  if (id === null || id === undefined || id === '') return null
  return String(id)
}

const buildAllocationKey = (level, ids = []) => {
  const parts = (Array.isArray(ids) ? ids : [ids]).map(normalizeAllocationId).filter(Boolean)
  return `${level}-${parts.join('-')}`
}

const collectAllocationKeys = (level, ids = []) => {
  const normalized = (Array.isArray(ids) ? ids : [ids]).map(normalizeAllocationId).filter(Boolean)
  if (!normalized.length) return []

  const keys = new Set([
    buildAllocationKey(level, normalized),
    `${level}-${normalized[normalized.length - 1]}`,
  ])

  return [...keys]
}

const parseAllocationKey = (key) => {
  const raw = String(key || '')
  const level = [...ALLOCATION_LEVELS]
    .sort((a, b) => b.length - a.length)
    .find((item) => raw.startsWith(`${item}-`))
  if (!level) return null
  const ids = raw
    .slice(level.length + 1)
    .split('-')
    .filter(Boolean)
  return { level, ids }
}

const getCachedAllocationAmount = (cache, level, ids = []) => {
  if (!cache) return ''
  for (const key of collectAllocationKeys(level, ids)) {
    if (cache[key] !== undefined && cache[key] !== null && cache[key] !== '') {
      return cache[key]
    }
  }
  return ''
}

const resolveAllocationLevel = (allocation) => {
  if (!allocation) return null

  const classId = allocation.expense_class_id
  const typeId = allocation.expense_type_id
  const itemId = allocation.expense_item_id
  const subItemId = allocation.expense_sub_item_id
  const subTypeId = allocation.expense_sub_type_id
  const subSubTypeId = allocation.expense_sub_sub_type_id

  if (subSubTypeId) {
    return {
      level: 'subsubtype',
      ids: [classId, typeId, itemId, subItemId, subTypeId, subSubTypeId],
    }
  }
  if (subTypeId) {
    return {
      level: 'subtype',
      ids: [classId, typeId, itemId, subItemId, subTypeId],
    }
  }
  if (subItemId) {
    return {
      level: 'subitem',
      ids: [classId, typeId, itemId, subItemId],
    }
  }
  if (itemId) {
    return {
      level: 'item',
      ids: [classId, typeId, itemId],
    }
  }
  if (typeId) {
    return {
      level: 'type',
      ids: [classId, typeId],
    }
  }
  if (classId) {
    return {
      level: 'class',
      ids: [classId],
    }
  }

  const typeAliases = {
    class: 'class',
    type: 'type',
    item: 'item',
    subitem: 'subitem',
    'sub-item': 'subitem',
    subtype: 'subtype',
    'sub-type': 'subtype',
    subsubtype: 'subsubtype',
    'sub-sub-type': 'subsubtype',
  }
  const aliasedLevel = typeAliases[allocation.type]
  if (aliasedLevel && allocation.id) {
    return { level: aliasedLevel, ids: [allocation.id] }
  }

  return null
}

const getSortOrder = (item) => {
  const value = Number(item?.order)
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER
}

const sortAccountHierarchy = (items) => {
  if (!Array.isArray(items)) return []

  return [...items]
    .sort((a, b) => {
      const orderDiff = getSortOrder(a) - getSortOrder(b)
      if (orderDiff !== 0) return orderDiff

      const idDiff = Number(a?.id || 0) - Number(b?.id || 0)
      if (idDiff !== 0) return idDiff

      return String(a?.name || '').localeCompare(String(b?.name || ''))
    })
    .map((item) => ({
      ...item,
      children: sortAccountHierarchy(item?.children),
    }))
}
