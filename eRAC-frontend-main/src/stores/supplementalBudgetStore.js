import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { useAuthStore } from './auth'

// const getAuthConfig = () => {
//   const authStore = useAuthStore()
//   return {
//     headers: {
//       Authorization: `Bearer ${authStore.admin ? authStore.adminToken : authStore.token}`,
//       'Content-Type': 'application/json',
//     },
//   }
// }

// Child source for each depth on the live hierarchy: item -> sub-items,
// sub-item -> sub-types, sub-type -> sub-sub-types. The running backend's
// unused-expenses rows stop at sub-item (and carry sub-item ids only), so the
// missing deeper names are resolved from /api/barangay/expense-hierarchy.
const getSupplementalSubNodes = (node, level) => {
  if (!node) return []
  const children = node.children || node.childItems || []
  if (level === 2) return node.subItems || node.sub_items || children
  if (level === 3) return node.subTypes || node.sub_types || children
  if (level === 4) return node.subSubTypes || node.sub_sub_types || children
  return children
}

// First branch descending from a set of sub-nodes down to sub-sub-type.
const deepestSupplementalBranch = (subNodes, level) => {
  const first = subNodes[0]
  if (!first || !first.name) return []
  const names = [first.name]
  const deeper = getSupplementalSubNodes(first, level + 1)
  if (deeper.length > 0) names.push(...deepestSupplementalBranch(deeper, level + 1))
  return names
}

// Index EVERY node by its 6-tuple id key (missing levels use placeholders).
// Value is the full display path: node path + deepest branch when it has
// children, so a sub-item-level row resolves sub-type and sub-sub-type names.
const buildSupplementalHierarchyIndex = (hierarchy) => {
  const index = {}
  const walk = (node, path) => {
    if (!node) return
    const ids = [...path.ids, node.id ?? null]
    const names = [...path.names, node.name ?? '']
    const key = [
      ids[0] ?? 'class',
      ids[1] ?? 'type',
      ids[2] ?? 'item',
      ids[3] ?? 'subitem',
      ids[4] ?? 'subtype',
      ids[5] ?? 'subsubtype',
    ].join(':')

    let display = names.filter(Boolean)
    const subNodes = getSupplementalSubNodes(node, path.ids.length)
    if (subNodes.length > 0) {
      display = [...display, ...deepestSupplementalBranch(subNodes, path.ids.length)]
    }
    index[key] = display

    subNodes.forEach((sub) => walk(sub, { ids, names }))
  }
  ;(hierarchy || []).forEach((node) => walk(node, { ids: [], names: [] }))
  return index
}

// Fill missing sub-item / sub-type / sub-sub-type names from the live
// hierarchy. Only rows that carry a sub-item id are touched; backend-provided
// names always win. Ids are never altered (the backend's id space is trusted
// for sub-item, and filling deeper ids could leak into payloads).
const enrichSupplementalSubLevels = (expenses, hierarchy) => {
  if (!hierarchy || hierarchy.length === 0) return expenses
  const index = buildSupplementalHierarchyIndex(hierarchy)

  ;(expenses || []).forEach((expense) => {
    if (expense.expense_sub_item_id == null) return
    const key = [
      expense.expense_class_id ?? 'class',
      expense.expense_type_id ?? 'type',
      expense.expense_item_id ?? 'item',
      expense.expense_sub_item_id,
      expense.expense_sub_type_id ?? 'subtype',
      expense.expense_sub_sub_type_id ?? 'subsubtype',
    ].join(':')
    const path = index[key]
    if (!path) return
    if (!expense.expense_sub_item && path[3]) expense.expense_sub_item = path[3]
    if (!expense.expense_sub_type && path[4]) expense.expense_sub_type = path[4]
    if (!expense.expense_sub_sub_type && path[5]) expense.expense_sub_sub_type = path[5]
    if (expense.expense_sub_item && !String(expense.account_name).includes(expense.expense_sub_item)) {
      expense.account_name = path.join(' > ')
    }
  })
  return expenses
}

// Normalize unused-expense rows (snake_case or camelCase) and surface the full
// hierarchy: class > type > item > sub-item > sub-type > sub-sub-type.
function normalizeSupplementalExpense(row) {
  const source = row || {}
  const pick = (snake, camel) => source[snake] ?? source[camel] ?? ''
  const pickId = (snake, camel) => {
    const value = source[snake] ?? source[camel]
    if (value === undefined || value === null || value === '') return null
    return Number(value)
  }

  const expenseClass = pick('expense_class', 'expenseClass')
  const expenseType = pick('expense_type', 'expenseType')
  const expenseItem = pick('expense_item', 'expenseItem')
  const expenseSubItem = pick('expense_sub_item', 'expenseSubItem')
  const expenseSubType = pick('expense_sub_type', 'expenseSubType')
  const expenseSubSubType = pick('expense_sub_sub_type', 'expenseSubSubType')

  const pathParts = [
    expenseClass,
    expenseType,
    expenseItem,
    expenseSubItem,
    expenseSubType,
    expenseSubSubType,
  ].filter(Boolean)

  return {
    ...source,
    id: Number(source.id ?? source.appropriationId) || null,
    account_name: pick('account_name', 'accountName') || pathParts.join(' > '),
    expense_class: expenseClass,
    expense_type: expenseType,
    expense_item: expenseItem,
    expense_sub_item: expenseSubItem,
    expense_sub_type: expenseSubType,
    expense_sub_sub_type: expenseSubSubType,
    expense_class_id: pickId('expense_class_id', 'expenseClassId'),
    expense_type_id: pickId('expense_type_id', 'expenseTypeId'),
    expense_item_id: pickId('expense_item_id', 'expenseItemId'),
    expense_sub_item_id: pickId('expense_sub_item_id', 'expenseSubItemId'),
    expense_sub_type_id: pickId('expense_sub_type_id', 'expenseSubTypeId'),
    expense_sub_sub_type_id: pickId('expense_sub_sub_type_id', 'expenseSubSubTypeId'),
    budget_description: pick('budget_description', 'budgetDescription'),
    budget_type: pick('budget_type', 'budgetType'),
    total_appropriated: Number(source.total_appropriated ?? source.totalAppropriated ?? 0),
    total_disbursed: Number(source.total_disbursed ?? source.totalDisbursed ?? 0),
    unused_amount: Number(source.unused_amount ?? source.unusedAmount ?? 0),
  }
}

export const useSupplementalBudgetStore = defineStore('supplementalBudget', {
  state: () => ({
    loading: false,
    supplementalBudgets: [],
    availableUnusedExpenses: [],
    expenseHierarchy: [], // live hierarchy for sub-level enrichment
    selectedYear: new Date().getFullYear(),
    years: [],
    totalSupplementalAmount: 0,
    totalUnusedAmount: 0,
  }),

  getters: {
    filteredUnusedExpenses: (state) => {
      return state.availableUnusedExpenses.filter(expense =>
        expense.unused_amount > 0
      )
    },

    groupedUnusedExpenses: (state) => {
      const grouped = {}
      state.filteredUnusedExpenses.forEach(expense => {
        const key = expense.expense_class
        if (!grouped[key]) {
          grouped[key] = {
            expense_class: expense.expense_class,
            total_unused: 0,
            expenses: []
          }
        }
        grouped[key].total_unused += expense.unused_amount
        grouped[key].expenses.push(expense)
      })
      return Object.values(grouped)
    },

    totalAvailableUnused: (state) => {
      return state.filteredUnusedExpenses.reduce((sum, expense) => sum + expense.unused_amount, 0)
    }
  },

  actions: {
    async fetchSupplementalBudgets(year = null) {
      this.loading = true
      try {
        const authStore = useAuthStore()
        const endpoint = authStore.admin ? '/api/admin/supplemental-budgets' : '/api/barangay/supplemental-budgets'
        const token = authStore.admin ? authStore.adminToken : authStore.token

        if (year !== null) this.selectedYear = year
        const params = { year: this.selectedYear }

        // Add barangay filter for admin users
        if (authStore.admin) {
          const selectedBarangayId = authStore.getSelectedBarangay()
          if (selectedBarangayId) {
            params.barangay_id = selectedBarangayId
          }
        }

        const response = await api.get(endpoint, {
          params: params,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        this.supplementalBudgets = response.data.data || []
        this.totalSupplementalAmount = response.data.total_amount || 0
        
        // Recalculate total if not provided by API
        if (!response.data.total_amount) {
          this.totalSupplementalAmount = this.supplementalBudgets.reduce((sum, budget) => sum + (budget.total_amount || 0), 0)
        }
      } catch (error) {
        console.error('Error fetching supplemental budgets:', error)
        // Don't clear existing data on error, just log it
        console.warn('Keeping existing supplemental budgets data due to fetch error')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Load the live expense hierarchy once so unused-expense rows can resolve the
    // sub-type / sub-sub-type names the backend does not send yet.
    async ensureExpenseHierarchyLoaded() {
      if (this.expenseHierarchy.length > 0) return
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token
        const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }

        const fiscalYearResponse = await api.get(
          authStore.admin ? '/api/admin/fiscal-years' : '/api/barangay/fiscal-years',
          { headers },
        )
        const params = {}
        const currentFiscalYear = fiscalYearResponse.data.data?.[0]
        if (currentFiscalYear) params.fiscal_year_id = currentFiscalYear.id
        if (authStore.admin) {
          const selectedBarangayId = authStore.getSelectedBarangay()
          if (selectedBarangayId) params.barangay_id = selectedBarangayId
        }

        const response = await api.get('/api/barangay/expense-hierarchy', { headers, params })
        this.expenseHierarchy = response.data.data || []
      } catch (error) {
        console.error('Failed to load expense hierarchy for supplemental enrichment:', error)
        console.error('Error details:', error.response?.data || error.message)
      }
    },

    async fetchAvailableUnusedExpenses(year = null) {
      this.loading = true
      try {
        const authStore = useAuthStore()
        const endpoint = authStore.admin ? '/api/admin/unused-expenses' : '/api/barangay/unused-expenses'
        const token = authStore.admin ? authStore.adminToken : authStore.token

        if (year !== null) this.selectedYear = year
        const params = { year: this.selectedYear }

        // Add barangay filter for admin users
        if (authStore.admin) {
          const selectedBarangayId = authStore.getSelectedBarangay()
          if (selectedBarangayId) {
            params.barangay_id = selectedBarangayId
          }
        }

        const response = await api.get(endpoint, {
          params: params,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        // Resolve sub-type / sub-sub-type names the backend does not send yet
        // (running backend stops at sub-item), then normalize rows.
        await this.ensureExpenseHierarchyLoaded()

        this.availableUnusedExpenses = enrichSupplementalSubLevels(
          (response.data.data || []).map(normalizeSupplementalExpense),
          this.expenseHierarchy,
        )
        this.totalUnusedAmount = Number(response.data.total_unused ?? response.data.totalUnused ?? 0)
        
        // Recalculate total if not provided by API
        if (!this.totalUnusedAmount) {
          this.totalUnusedAmount = this.availableUnusedExpenses.reduce((sum, expense) => sum + (expense.unused_amount || 0), 0)
        }
      } catch (error) {
        console.error('Error fetching unused expenses:', error)
        // Don't clear existing data on error, just log it
        console.warn('Keeping existing unused expenses data due to fetch error')
        throw error
      } finally {
        this.loading = false
      }
    },

    async createSupplementalBudget(data) {
      this.loading = true
      try {
        const authStore = useAuthStore()
        const endpoint = authStore.admin ? '/api/admin/supplemental-budgets' : '/api/barangay/supplemental-budgets'
        const token = authStore.admin ? authStore.adminToken : authStore.token


        const response = await api.post(endpoint, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })


        // Use Promise.allSettled to handle partial failures gracefully
        const results = await Promise.allSettled([
          this.fetchSupplementalBudgets(),
          this.fetchAvailableUnusedExpenses()
        ])
        
        // Check for any failures
        const failures = results.filter(result => result.status === 'rejected')
        if (failures.length > 0) {
          console.warn('Some data refresh operations failed:', failures)
        }
        
        // Force reactive update by recalculating totals
        this.totalSupplementalAmount = this.supplementalBudgets.reduce((sum, budget) => sum + (budget.total_amount || 0), 0)
        this.totalUnusedAmount = this.availableUnusedExpenses.reduce((sum, expense) => sum + (expense.unused_amount || 0), 0)
        

        return response.data
      } catch (error) {
        console.error('Error creating supplemental budget:', error)
        console.error('Error response:', error.response?.data)
        console.error('Error status:', error.response?.status)
        console.error('Error message:', error.message)
        console.error('Full error object:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchYears() {
      try {
        const authStore = useAuthStore()
        const endpoint = authStore.admin ? '/api/admin/fiscal-years' : '/api/barangay/fiscal-years'
        const token = authStore.admin ? authStore.adminToken : authStore.token

        const response = await api.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        this.years = response.data.data || []
      } catch (error) {
        console.error('Error fetching years:', error)
        throw error
      }
    },

    setSelectedYear(year) {
      this.selectedYear = year
    },

    formatCurrency(value) {
      if (!value && value !== 0) return '₱0.00'
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
      }).format(value)
    }
  }
})
