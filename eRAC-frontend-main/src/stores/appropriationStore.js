import { defineStore } from "pinia"
import { api } from "boot/axios"
import { useAuthStore } from "./auth"

const parseCurrency = (value) => {
  if (typeof value === 'string') {
    return parseFloat(value.replace(/[^\d.-]/g, ''))
  }
  return value
}

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
    selectedFiscalYear: null,
    currentFiscalYearId: null,
    currentYear: new Date().getFullYear().toString(),

    allocations: [],
    authStore: useAuthStore(),
  }),

  getters: {
    expenseClassTotals(state) {
      return state.categoryTotals
    },

    filteredAppropriations(state) {
      let filtered = [...state.appropriations]

      // Filter by search query
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase()
        filtered = filtered.filter(item =>
          item.description.toLowerCase().includes(query)
        )
      }

      // Filter by date range
      if (state.dateFrom && state.dateTo) {
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.date)
          const fromDate = new Date(state.dateFrom.split('/').reverse().join('-'))
          const toDate = new Date(state.dateTo.split('/').reverse().join('-'))
          return itemDate >= fromDate && itemDate <= toDate
        })
      }

      return filtered
    },

    totalAvailable(state) {
      return state.appropriations.reduce((sum, item) => sum + (item.unappropriated || 0), 0)
    },

    fiscalYearOptions(state) {
      return state.fiscalYears.map(year => ({
        label: `FY ${year}`,
        value: year
      }))
    }
  },

  actions: {
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB')
    },

    formatCurrency(value) {
      if (value === null || value === undefined) return '₱0.00'
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(value)
    },

    async fetchFiscalYears() {
      try {
        const response = await api.get("/api/barangay/fiscal-years", {
          headers: {
            Authorization: `Bearer ${this.authStore.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        this.fiscalYears = response.data.map(year => year.toString())

        // Set selected fiscal year to current year if available, otherwise most recent
        if (!this.selectedFiscalYear && this.fiscalYears.length > 0) {
          const currentYear = new Date().getFullYear().toString()
          this.selectedFiscalYear = this.fiscalYears.includes(currentYear)
            ? currentYear
            : this.fiscalYears[0]
        }
      } catch (error) {
        console.error("Error fetching fiscal years:", error)
        throw error
      }
    },

    async fetchBudgets() {
      this.loading = true
      try {
        const response = await api.get("/api/barangay/budgets", {
          params: {
            year: this.selectedFiscalYear || new Date().getFullYear()
          },
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
      } catch (error) {
        console.error("Error fetching budgets:", error)
        throw error
      } finally {
        this.loading = false
      }
    },

    setSelectedFiscalYear(year) {
      this.selectedFiscalYear = year
      this.fetchBudgets() // Refresh data when fiscal year changes
    },

    async initialize() {
      await Promise.all([
        this.fetchFiscalYears(),
        this.fetchBudgets()
      ])
    },

    // ... rest of your existing actions
  }
})
