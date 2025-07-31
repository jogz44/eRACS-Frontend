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
      return Math.round((total - this.totalAllocated) * 100) / 100
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
        console.log("[DEBUG] Opening allocation dialog for row:", row)
        console.log("[DEBUG] Raw row data:", JSON.stringify(row, null, 2))

        // Ensure proper number parsing for selectedRow
        const unappropriatedValue = row.unappropriated || row.amount || 0
        console.log("[DEBUG] Unappropriated value before parsing:", unappropriatedValue, typeof unappropriatedValue)

        this.selectedRow = {
          id: row.id,
          total: parseCurrency(row.amount || 0),
          unappropriated: parseCurrency(unappropriatedValue),
          description: row.description || "",
        }

        console.log("[DEBUG] Parsed selectedRow:", this.selectedRow)

        this.loading = true
        console.log("[DEBUG] Fetching expense hierarchy and existing allocations...")

        await Promise.all([this.fetchExpenseHierarchy(), this.fetchExistingAllocations(row.id)])

        this.showAllocationDialog = true
        console.log("[DEBUG] Allocation dialog opened successfully")
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
        const response = await api.post("/api/barangay/budgets/create", newBudget, {
          headers: {
            Authorization: `Bearer ${this.authStore.token}`,
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

    async fetchBudgets() {
      this.loading = true
      try {
        const currentYear = new Date().getFullYear()
        const response = await api.get("/api/barangay/budgets", {
          params: { year: currentYear },
          headers: {
            Authorization: `Bearer ${this.authStore.token}`,
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
          allocations: budget.allocations,
        }))

        this.totalAvailable = parseCurrency(response.data.total_available || 0)
        console.log("[DEBUG] Fetched budgets with parsed amounts:", this.appropriations)
      } catch (error) {
        console.error("Error fetching budgets:", error)
      } finally {
        this.loading = false
      }
    },

    async initialize() {
      await this.fetchAppropriations()
    },

    async fetchExpenseHierarchy() {
      try {
        const yearsResponse = await api.get("/api/barangay/fiscal-years", {
          headers: {
            Authorization: `Bearer ${this.authStore.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })
        const fiscalYears = Array.isArray(yearsResponse.data) ? yearsResponse.data : yearsResponse.data.data || []

        const currentYear = new Date().getFullYear()
        const fiscalYear = fiscalYears.find((y) => y.year == currentYear)

        if (!fiscalYear) {
          throw new Error(`No fiscal year configuration found for ${currentYear}.
        Please contact your administrator.`)
        }

        console.log("[DEBUG] Fetching expense hierarchy...")
        const response = await api.get("/api/barangay/expense-hierarchy", {
          params: { fiscal_year_id: fiscalYear.id },
          headers: {
            Authorization: `Bearer ${this.authStore.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        console.log("[DEBUG] Full API response:", response)
        this.allocations = response.data.data || []
        console.log("[DEBUG] Extracted allocations:", this.allocations)
      } catch (error) {
        console.error("[ERROR] fetchExpenseHierarchy:", error)
        throw error
      }
    },

    async fetchExistingAllocations(budgetId) {
      try {
        console.log("[DEBUG] Fetching existing allocations for budget:", budgetId)
        const response = await api.get(`/api/barangay/budgets/${budgetId}/allocations`, {
          headers: {
            Authorization: `Bearer ${this.authStore.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        const allocations = response.data.data || []
        console.log("[DEBUG] Retrieved existing allocations:", allocations)

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

        console.log("[DEBUG] Original allocations:", this.originalAllocations)
        console.log("[DEBUG] Existing allocations total:", this.existingAllocationsTotal)
        console.log("[DEBUG] Initialized input values:", this.inputCache)
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

    async commitAllocation(budgetId, allocations) {
      try {
        const cleanedAllocations = allocations.map((allocation) => ({
          ...allocation,
          amount: parseCurrency(allocation.amount),
        }))

        const totalAmount = cleanedAllocations.reduce((sum, a) => sum + a.amount, 0)

        console.log("[DEBUG] Committing allocation:")
        console.log("- Budget ID:", budgetId)
        console.log("- Allocations:", cleanedAllocations)
        console.log("- Total Amount:", totalAmount)
        console.log("- Available Budget:", this.selectedRow?.unappropriated)
        console.log("- Existing Total:", this.existingAllocationsTotal)
        console.log("- Net Change:", totalAmount - this.existingAllocationsTotal)

        const response = await api.post(
          `/api/barangay/budgets/${budgetId}/allocate`,
          { allocations: cleanedAllocations },
          {
            headers: {
              Authorization: `Bearer ${this.authStore.token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        )

        console.log("[DEBUG] Backend response:", response.data)

        // Update local state
        const budgetIndex = this.appropriations.findIndex((b) => b.id === budgetId)
        if (budgetIndex !== -1) {
          const netChange = totalAmount - this.existingAllocationsTotal
          const updatedAmount = this.appropriations[budgetIndex].unappropriated - netChange

          this.appropriations[budgetIndex].unappropriated = parseCurrency(updatedAmount)
          console.log(
            "[DEBUG] Updated local budget unappropriated to:",
            this.appropriations[budgetIndex].unappropriated,
          )
        }

        return response.data
      } catch (error) {
        console.error("[ERROR] commitAllocation:", error)
        console.error("[ERROR] Response data:", error.response?.data)
        console.error("[ERROR] Response status:", error.response?.status)
        throw error
      }
    },

    updateAllocationAmount(id, value) {
      const parsedValue = value ? parseCurrency(value).toString() : ""

      if (this.inputCache[id] !== parsedValue) {
        this.inputCache = {
          ...this.inputCache,
          [id]: parsedValue,
        }
        this.allocationInputs = {
          ...this.allocationInputs,
          [id]: parsedValue,
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
        const response = await api.get(`/api/barangay/appropriations/${id}/history`, {
          headers: {
            Authorization: `Bearer ${this.authStore.token}`,
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
      console.log("[DEBUG] Calculated totals:", this.categoryTotals)
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
