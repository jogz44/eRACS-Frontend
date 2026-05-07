import { defineStore } from "pinia";
import { api } from "../boot/axios";
import { useAuthStore } from './auth'


export const useContApprStore = defineStore('continuing-appropriation',{
    state: ()=>({
        years: [],
        selectedYear: null,
        continueAccounts: [],
        continuingAppropriations: [],
        expenseHierarchy: [],
        loading: false,
        error: null,
        selectedRow: null,
    }),
    getters: {
  fiscalYearOptions: (state) => state.years,
  fiscalYears: (state) => state.years.map((y) => String(y.label)),
  selectedFiscalYear: (state) => state.selectedYear,
},
    actions: {

        getAuthConfig() {
            const authStore = useAuthStore()

            // Use admin token if admin is logged in, otherwise use regular token
            const token = authStore.admin ? authStore.adminToken : authStore.token

            if (!token) {
                throw new Error('Authentication token not found')
            }
            return {
                headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                },
            }
        },
        async fetchContinueAccounts() {
            const config = this.getAuthConfig()
            try {

                const response = await api.get(`/api/barangay/continuing-appropriations`, config)
                const rows = response.data?.data?.rows || []

                // map into a clean array of objects
                this.continueAccounts = rows.map(row => ({
                    id: row.id,
                    year: row.year,
                    accountName: [row.expenseClass, row.expenseType, row.expenseItem, row.expenseSubItem]
                        .filter(Boolean)
                        .join(" > "),
                    total: row.total_amount,
                    details: row.details_amount,
                    balance: row.remaining_amount,
                    // Add subitems data for proper display
                    subItems: row.subItems || [],
                    expenseClass: row.expenseClass,
                    expenseType: row.expenseType,
                    expenseItem: row.expenseItem,
                    expenseSubItem: row.expenseSubItem,
                }))
                return this.continueAccounts
            } catch (error) {
                this.error = error.response?.data?.message || error.message
                return []
            } finally {
                this.loading = false
            }
        },

        setSelectedFiscalYear(value) {
    this.selectedYear = value
  },
  async initialize() {
    this.loading = true
    this.error = null
    try {
      await this.fetchYears()
      await this.fetchContinueAccounts()
      await this.fetchContinuingAppropriations()
    } finally {
      this.loading = false
    }
  },
        async fetchYears() {
            const config = this.getAuthConfig()
            try {
                const response = await api.get('/api/barangay/fiscal-years', config)

                const currentYear = new Date().getFullYear()

                const rawYears = response.data.data || []

                // remove current year (compare by year string/number)
                const filteredYears = rawYears.filter(y => Number(y.year) !== currentYear)
                    this.years = filteredYears.map(y => ({
                    label: y.year,
                    value: y.id
                }))

                if (filteredYears.length > 0) {
                const latest = filteredYears.reduce((max, y) =>
                    Number(y.year) > Number(max.year) ? y : max
                )
                this.selectedYear = latest.id
                } else {
                this.selectedYear = null
                }


            } catch (error) {
                this.error = error.response?.data?.message || error.message
                this.years = []
            } finally {
                this.loading = false
            }
        },

        async fetchContinuingAppropriations(fiscalYearId = null) {
            const config = this.getAuthConfig()
            const params = fiscalYearId ? { fiscal_year_id: fiscalYearId } : {}
            try {
                this.loading = true
                const response = await api.get('/api/barangay/continuing-appropriations/list', {
                ...config,
                params
                })


                if (response.data.status) {
                    // Process the data to include subitems information
                    this.continuingAppropriations = (response.data.data || []).map(item => ({
                        ...item,
                        // Ensure accounts array includes subitems
                        accounts: (item.accounts || []).map(account => ({
                            ...account,
                            // Parse account name to extract subitems
                            accountName: account.accountName || 'Unknown Account',
                            subItems: account.subItems || [],
                        }))
                    }))
                    return this.continuingAppropriations
                } else {
                    this.error = response.data.message || 'Failed to fetch continuing appropriations'
                    return []
                }
            } catch (error) {
                this.error = error.response?.data?.message || error.message
                return []
            } finally {
                this.loading = false
            }
        },

        async createContinuingAppropriation(data) {
            const config = this.getAuthConfig()
            try {
                this.loading = true
                const response = await api.post('/api/barangay/continuing-appropriations', data, config)

                if (response.data.status) {
                    // Add the new appropriation to the list
                    this.continuingAppropriations.unshift(response.data.data)
                    return { success: true, data: response.data.data }
                } else {
                    this.error = response.data.message || 'Failed to create continuing appropriation'
                    return { success: false, message: response.data.message }
                }
            } catch (error) {
                this.error = error.response?.data?.message || error.message
                return { success: false, message: this.error }
            } finally {
                this.loading = false
            }
        },

        async updateContinuingAppropriationStatus(id, status) {
            const config = this.getAuthConfig()
            try {
                this.loading = true
                const response = await api.patch(`/api/barangay/continuing-appropriations/${id}/status`, { status }, config)

                if (response.data.status) {
                    // Update the status in the local list
                    const index = this.continuingAppropriations.findIndex(item => item.id === id)
                    if (index !== -1) {
                        this.continuingAppropriations[index].status = status
                    }
                    return { success: true, data: response.data.data }
                } else {
                    this.error = response.data.message || 'Failed to update status'
                    return { success: false, message: response.data.message }
                }
            } catch (error) {
                this.error = error.response?.data?.message || error.message
                return { success: false, message: this.error }
            } finally {
                this.loading = false
            }
        },

        async fetchExpenseHierarchy(fiscalYearId, budgetId = null) {
            const config = this.getAuthConfig()
            try {
                const params = { fiscal_year_id: fiscalYearId }
                if (budgetId) params.budget_id = budgetId

                const response = await api.get('/api/barangay/expense-hierarchy', { ...config, params })

                if (response.data.status) {
                    this.expenseHierarchy = response.data.data
                    return this.expenseHierarchy
                } else {
                    this.error = response.data.message || 'Failed to fetch expense hierarchy'
                    return []
                }
            } catch (error) {
                this.error = error.response?.data?.message || error.message
                return []
            }
        },

        async commitAllocation(id, allocations) {
            const config = this.getAuthConfig()
            try {
                const response = await api.post(`/api/barangay/continuing-appropriations/${id}/allocate`, { allocations }, config)

                if (response.data.status) {
                    // Update the local state
                    const index = this.continuingAppropriations.findIndex(item => item.id === id)
                    if (index !== -1) {
                        this.continuingAppropriations[index] = {
                            ...this.continuingAppropriations[index],
                            ...response.data.data
                        }
                    }
                    return { success: true, data: response.data.data }
                } else {
                    throw new Error(response.data.message || 'Failed to commit allocation')
                }
            } catch (error) {
                throw new Error(error.response?.data?.message || error.message)
            }
        },

        formatCurrency(value) {
            if (!value && value !== 0) return '₱0.00'
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
            }).format(value)
        },

        formatDate(date) {
            if (!date) return '-'
            return new Date(date).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        },


    }

})
