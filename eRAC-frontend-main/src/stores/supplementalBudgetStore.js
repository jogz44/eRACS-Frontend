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

export const useSupplementalBudgetStore = defineStore('supplementalBudget', {
  state: () => ({
    loading: false,
    supplementalBudgets: [],
    availableUnusedExpenses: [],
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
    async fetchSupplementalBudgets() {
      this.loading = true
      try {
        const authStore = useAuthStore()
        const endpoint = authStore.admin ? '/api/admin/supplemental-budgets' : '/api/barangay/supplemental-budgets'
        const token = authStore.admin ? authStore.adminToken : authStore.token

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
      } catch (error) {
        console.error('Error fetching supplemental budgets:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchAvailableUnusedExpenses() {
      this.loading = true
      try {
        const authStore = useAuthStore()
        const endpoint = authStore.admin ? '/api/admin/unused-expenses' : '/api/barangay/unused-expenses'
        const token = authStore.admin ? authStore.adminToken : authStore.token

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

        this.availableUnusedExpenses = response.data.data || []
        this.totalUnusedAmount = response.data.total_unused || 0
      } catch (error) {
        console.error('Error fetching unused expenses:', error)
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

        console.log('Creating supplemental budget with data:', data)
        console.log('Using endpoint:', endpoint)

        const response = await api.post(endpoint, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        console.log('Supplemental budget created successfully:', response.data)

        // Refresh the supplemental budgets list
        console.log('Refreshing data after creation...')
        await this.fetchSupplementalBudgets()
        await this.fetchAvailableUnusedExpenses()
        console.log('Data refresh completed')

        return response.data
      } catch (error) {
        console.error('Error creating supplemental budget:', error)
        console.error('Error response:', error.response?.data)
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
        console.log('Fetched fiscal years:', this.years)
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
