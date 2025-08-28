import { defineStore } from "pinia"
import { api } from "boot/axios"
import { useAuthStore } from "./auth"

export const useAppropriationStore = defineStore("appropriation", {
  state: () => ({
    loading: false,
    showAllocationDialog: false,
    searchQuery: "",
    dateFrom: "",
    dateTo: "",
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
    selectedBarangayId: null, // For admin barangay filtering

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

          const prefix = depth > 0 ? "→ ".repeat(depth) : ""
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
          this.flattenedAccounts.some((child) => child.indent > item.indent && matchingIds.has(child.id)),
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
      return Math.round((total - existingAllocated) * 100) / 100
    },

    filteredAppropriations(state) {
      let results = state.appropriations

      // Date filtering
      if (state.dateFrom || state.dateTo) {
        const fromDate = state.dateFrom ? new Date(state.dateFrom) : null
        const toDate = state.dateTo ? new Date(state.dateTo) : null

        results = results.filter((item) => {
          const itemDate = new Date(item.date)
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
        results = results.filter((item) => Object.values(item).some((val) => String(val).toLowerCase().includes(query)))
      }

      return results
    },
  },

  actions: {
    async openAllocationDialog(row) {
      try {

        // Ensure proper number parsing for selectedRow
        const unappropriatedValue = row.unappropriated || row.amount || 0

        this.selectedRow = {
          id: row.id,
          total: parseCurrency(row.amount || 0),
          unappropriated: parseCurrency(unappropriatedValue),
          description: row.description || "",
        }

        this.loading = true

        await Promise.all([this.fetchExpenseHierarchy(), this.fetchExistingAllocations(row.id)])

        // Update the unappropriated amount based on existing allocations
        if (this.selectedRow) {
          this.selectedRow.unappropriated = this.remainingUnappropriated
        }

        this.showAllocationDialog = true
        
      } catch (error) {
        console.error("[ERROR] in openAllocationDialog:", {
          error: error.message,
          rowData: row,
          stack: error.stack,
        })

        throw new Error(error.message || "Failed to load allocation accounts. Please try again.")
      } finally {
        this.loading = false
      }
    },

    formatDate(value) {
      if (!value) return ""

      const date = new Date(value)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    },

    formatCurrency(value) {
      const num = parseCurrency(value)
      return num.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
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
        console.error("No selected row to save allocation for.")
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
        console.error("Failed to save allocation:", error)
        return false
      }
    },

    async addBudget(newBudget) {
      try {
        // Add barangay_id for admin users if selected
        if (this.authStore.admin && this.selectedBarangayId) {
          newBudget.barangay_id = this.selectedBarangayId
        }
        
        // Use different endpoints for admin vs regular users
        const endpoint = this.authStore.admin ? "/api/admin/budgets/create" : "/api/barangay/budgets/create"
        const token = this.authStore.admin ? this.authStore.adminToken : this.authStore.token
        
        const response = await api.post(endpoint, newBudget, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        const newApprop = {
          id: response.data.id,
          date: new Date().toISOString().split("T")[0],
          description: newBudget.description,
          amount: parseCurrency(newBudget.original_amount),
          unappropriated: parseCurrency(newBudget.original_amount),
          allocations: [],
        }

        this.appropriations.push(newApprop)
        return newApprop
      } catch (error) {
        console.error("Failed to add budget:", error)
        throw error
      }
    },

    async fetchBudgets(options = { silent: false }) {
      const silent = options?.silent === true
      if (!silent) this.loading = true
      try {
        const currentYear = new Date().getFullYear()
        const params = { year: currentYear }
        
        // Add barangay filter for admin users
        if (this.authStore.admin && this.selectedBarangayId) {
          params.barangay_id = this.selectedBarangayId
        }
        
        // Use different endpoints for admin vs regular users
        const endpoint = this.authStore.admin ? "/api/admin/budgets" : "/api/barangay/budgets"
        const token = this.authStore.admin ? this.authStore.adminToken : this.authStore.token
        
        const response = await api.get(endpoint, {
          params: params,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        this.appropriations = response.data.data.map((budget) => ({
          id: budget.id,
          date: budget.date,
          description: budget.description,
          amount: parseCurrency(budget.amount),
          unappropriated: parseCurrency(budget.unappropriated),
          fiscal_year: budget.fiscal_year,
          barangay_name: budget.barangay_name,
          barangay_id: budget.barangay_id,
          allocations: budget.allocations,
        }))

        this.totalAvailable = parseCurrency(response.data.total_available || 0)
      } catch (error) {
        console.error("Error fetching budgets:", error)
      } finally {
        if (!silent) this.loading = false
      }
    },

    // Method to set selected barangay for admin filtering
    setSelectedBarangay(barangayId) {
      this.selectedBarangayId = barangayId
    },

    async initialize() {
      await this.fetchAppropriations()
    },

    async fetchExpenseHierarchy() {
      try {
        // Use admin token if admin is logged in
        const token = this.authStore.admin ? this.authStore.adminToken : this.authStore.token
        
        let fiscalYear = null
        
        if (this.authStore.admin) {
          // For admins, we need to find fiscal years from any barangay for the current year
          // Since admins can see all barangays, we'll fetch from the first barangay
          // that has fiscal years or use a different approach
          const currentYear = new Date().getFullYear()
          
          // Try to get fiscal year directly using a raw query approach for admins
          // We'll assume there's a fiscal year for the current year
          fiscalYear = { id: currentYear, year: currentYear }
          
          // For now, let's skip the fiscal year API call for admins and use the current year
          // This is a temporary solution - ideally we'd need an admin fiscal years endpoint
        } else {
          // Regular barangay users can use their fiscal years endpoint
          const yearsResponse = await api.get("/api/barangay/fiscal-years", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          })
          const fiscalYears = Array.isArray(yearsResponse.data) ? yearsResponse.data : yearsResponse.data.data || []

          const currentYear = new Date().getFullYear()
          fiscalYear = fiscalYears.find((y) => y.year == currentYear)

          if (!fiscalYear) {
            throw new Error(`No fiscal year configuration found for ${currentYear}.
          Please contact your administrator.`)
          }
        }

        // Use different endpoints for admin vs regular users
        const endpoint = this.authStore.admin ? "/api/admin/expense-hierarchy" : "/api/barangay/expense-hierarchy"

        const response = await api.get(endpoint, {
          params: { fiscal_year_id: fiscalYear.id },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        this.allocations = response.data.data || []
      } catch (error) {
        console.error("[ERROR] fetchExpenseHierarchy:", error)
        throw error
      }
    },

    async fetchExistingAllocations(budgetId) {
      try {
        // Use different endpoints for admin vs regular users
        const endpoint = this.authStore.admin ? `/api/admin/budgets/${budgetId}/allocations` : `/api/barangay/budgets/${budgetId}/allocations`
        const token = this.authStore.admin ? this.authStore.adminToken : this.authStore.token
        
        const response = await api.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        const allocations = response.data.data || []

        // Clear previous state
        this.inputCache = {}
        this.allocationInputs = {}
        this.originalAllocations = {}
        this.existingAllocationsTotal = 0

        // Set current values from existing allocations and track originals
        allocations.forEach((allocation) => {
          let id = null
          let key = null
          
          if (allocation.expense_item_id) {
            id = allocation.expense_item_id
            key = `item-${id}`
          } else if (allocation.expense_type_id) {
            id = allocation.expense_type_id
            key = `type-${id}`
          } else if (allocation.expense_class_id) {
            id = allocation.expense_class_id
            key = `class-${id}`
          }
          
          if (id && key) {
            const amount = parseCurrency(allocation.amount)
            this.inputCache[key] = amount.toString()
            this.allocationInputs[key] = amount.toString()
            this.originalAllocations[key] = amount
            this.existingAllocationsTotal += amount
          }
        })

      } catch (error) {
        console.error("[ERROR] fetchExistingAllocations:", {
          error: error.message,
          budgetId: budgetId,
          stack: error.stack,
        })
        // Initialize empty state on error
        this.originalAllocations = {}
        this.existingAllocationsTotal = 0
      }
    },

    async commitAllocation(budgetId, allocations, options = { backgroundRefresh: false }) {
      const doBackground = options?.backgroundRefresh === true
      if (!doBackground) this.loading = true
      try {
        const cleanedAllocations = allocations.map((allocation) => ({
          ...allocation,
          amount: parseCurrency(allocation.amount),
        }))

        // Use different endpoints for admin vs regular users
        const endpoint = this.authStore.admin ? `/api/admin/budgets/${budgetId}/allocate` : `/api/barangay/budgets/${budgetId}/allocate`
        const token = this.authStore.admin ? this.authStore.adminToken : this.authStore.token

        const response = await api.post(
          endpoint,
          { allocations: cleanedAllocations },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        )

        // Use the backend response to update local state instead of calculating locally
        if (response.data && response.data.budget) {
          const budgetIndex = this.appropriations.findIndex((b) => b.id === budgetId)
          if (budgetIndex !== -1) {
            // Update with the actual values from the database
            // Backend returns current_amount which represents the unappropriated amount
            this.appropriations[budgetIndex].unappropriated = parseCurrency(response.data.budget.current_amount)
          }
        }

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

        return response.data
      } catch (error) {
        console.error("[ERROR] commitAllocation:", error)
        console.error("[ERROR] Response data:", error.response?.data)
        console.error("[ERROR] Response status:", error.response?.status)
        throw error
      } finally {
        if (!doBackground) this.loading = false
      }
    },

    updateAllocationAmount(id, value) {
      // Preserve numbers (finalized blur) so UI can render with .00;
      // while typing (strings), keep raw string sanitized
      let nextValue
      if (typeof value === 'number') {
        nextValue = value
      } else if (value === '' || value === null || value === undefined) {
        nextValue = ''
      } else {
        nextValue = parseCurrency(value).toString()
      }

      if (this.inputCache[id] !== nextValue) {
        this.inputCache = {
          ...this.inputCache,
          [id]: nextValue,
        }
        this.allocationInputs = {
          ...this.allocationInputs,
          [id]: nextValue,
        }
      }
    },

    initializeInputCache(allocations) {
      const cache = {}
      const processItems = (items, level = 'item') => {
        items.forEach((item) => {
          if (item.id) {
            const key = `${level}-${item.id}`
            const existingValue = this.allocationInputs[key] || ""
            cache[key] = existingValue
          }
          if (item.children) {
            // Determine the next level
            const nextLevel = level === 'class' ? 'type' : 'item'
            processItems(item.children, nextLevel)
          }
        })
      }
      // Start with class level
      processItems(allocations, 'class')
      this.inputCache = cache
    },

    calculateClassTotal(expenseClass) {
      let total = 0
      expenseClass.children?.forEach((expenseType) => {
        const typeAmount = parseCurrency(this.inputCache[`type-${expenseType.id}`] || 0)
        total += typeAmount

        expenseType.children?.forEach((item) => {
          const itemAmount = parseCurrency(this.inputCache[`item-${item.id}`] || 0)
          total += itemAmount
        })
      })
      return Math.round(total * 100) / 100
    },

    async fetchAllocationHistory(id) {
      try {
        // Use different endpoints for admin vs regular users
        const endpoint = this.authStore.admin ? `/api/admin/budgets/${id}/history` : `/api/barangay/budgets/${id}/history`
        const token = this.authStore.admin ? this.authStore.adminToken : this.authStore.token
        
        const response = await api.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
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

          if (alloc.expense_type_id && !alloc.expense_item_id) {
            groupedByClass[classId].children.push({
              id: alloc.expense_type_id,
              name: alloc.expense_type_name,
              amount: parseCurrency(alloc.amount),
              children: [],
            })
          } else if (alloc.expense_item_id) {
            let type = groupedByClass[classId].children.find((t) => t.id === alloc.expense_type_id)
            if (!type) {
              type = {
                id: alloc.expense_type_id,
                name: alloc.expense_type_name,
                amount: 0,
                children: [],
              }
              groupedByClass[classId].children.push(type)
            }

            type.children.push({
              id: alloc.expense_item_id,
              name: alloc.expense_item_name,
              amount: parseCurrency(alloc.amount),
            })
          }
        })

        return {
          allocations: Object.values(groupedByClass),
          created_at: latestAllocation.created_at,
          budget: response.data.data.budget,
        }
      } catch (error) {
        console.error("Failed to fetch allocation history:", error)
        throw error
      }
    },

    async processCombinedAllocations(allocations) {
      this.rawAllocations = allocations

      if (!this.expenseHierarchy.length) {
        console.warn("[WARNING] Hierarchy not loaded - fetching now")
        await this.fetchExpenseHierarchy()
      }

      if (!this.expenseHierarchy.length) {
        console.error("[ERROR] Hierarchy still not loaded after fetch")
        return
      }

      this.categoryTotals = this.calculateCategoryTotals()
    },

    calculateCategoryTotals() {
      if (!this.expenseHierarchy.length || !this.rawAllocations.length) {
        console.warn("Cannot calculate - missing data")
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

            // Sum child items
            type.children?.forEach((item) => {
              total += amountMap[item.id] || 0
            })
          })

          return {
            name: category.name,
            total: Math.round(total * 100) / 100,
          }
        })
        .filter((cat) => cat.total > 0)
    },
  },
})

// Utility function for consistent currency parsing
const parseCurrency = (value) => {
  if (!value && value !== 0) return 0

  const cleanValue = String(value).replace(/[₱,\s]/g, "")
  const parsed = Number.parseFloat(cleanValue)

  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
}