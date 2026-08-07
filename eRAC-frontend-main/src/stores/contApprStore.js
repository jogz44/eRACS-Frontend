import { defineStore } from "pinia";
import { api } from "../boot/axios";
import { useAuthStore } from './auth'

const authStore = useAuthStore()

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

        buildAdminParams() {
            const authStore = useAuthStore()
            const params = {}
            if (authStore.admin) {
                const selectedBarangay = authStore.getSelectedBarangay()
                if (selectedBarangay) params.barangay_id = selectedBarangay
            }
            return params
        },

        mapContinueAccountRow(row) {
            return {
                id: row.id,
                year: row.year,
                accountName: [row.expenseClass, row.expenseType, row.expenseItem, row.expenseSubItem]
                    .filter(Boolean)
                    .join(" > "),
                total: row.total_amount,
                details: row.details_amount,
                balance: Number(row.remaining_amount ?? row.balance ?? 0),
                subItems: row.subItems || [],
                expenseClass: row.expenseClass,
                expenseType: row.expenseType,
                expenseItem: row.expenseItem,
                expenseSubItem: row.expenseSubItem,
            }
        },

        async fetchContinueAccounts() {
            const authStore = useAuthStore()
            const config = this.getAuthConfig()
            const endpoint = authStore.admin
                ? '/api/admin/continuing-appropriations/disbursement-accounts'
                : '/api/barangay/continuing-appropriations/disbursement-accounts'

            const params = this.buildAdminParams()

            try {
                this.loading = true
                const response = await api.get(endpoint, { ...config, params })

                if (response.data?.status === false) {
                    this.continueAccounts = []
                    this.error = response.data?.message || 'Failed to fetch continue accounts'
                    return []
                }

                const rows = response.data?.data || response.data?.rows || []
                this.continueAccounts = rows.map((row) => this.mapContinueAccountRow(row))
                return this.continueAccounts
            } catch (error) {
                this.error = error.response?.data?.message || error.message
                this.continueAccounts = []
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
      await this.fetchContinuingAppropriations(this.selectedYear)
    } finally {
      this.loading = false
    }
  },
        async fetchYears() {
            const authStore = useAuthStore()
    const config = this.getAuthConfig()
    const endpoint = authStore.admin ? '/api/admin/fiscal-years' : '/api/barangay/fiscal-years'
    try {
        const response = await api.get(endpoint, config)

                const currentYear = new Date().getFullYear()
                const rawYears = response.data.data || []

                const filteredYears = rawYears.filter((y) => Number(y.year) !== currentYear)

                const uniqueByYear = new Map()
                for (const y of filteredYears) {
                const yearKey = String(y.year)
                if (!uniqueByYear.has(yearKey)) {
                    uniqueByYear.set(yearKey, {
                    label: yearKey,
                    value: y.id,
                    year: Number(y.year),
                    })
                }
                }

                const uniqueYears = Array.from(uniqueByYear.values())
                .sort((a, b) => b.year - a.year)
                this.years = uniqueYears.map(({ label, value }) => ({ label, value }))
                this.selectedYear = uniqueYears.length > 0 ? uniqueYears[0].value : null

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
            const authStore = useAuthStore()
            const config = this.getAuthConfig()
            const params = { ...this.buildAdminParams() }
            const yearId = fiscalYearId ?? this.selectedYear
            if (yearId) params.fiscal_year_id = yearId

            try {
                this.loading = true
                const endpoint = authStore.admin
                 ? '/api/admin/continuing-appropriations/list'
  : '/api/barangay/continuing-appropriations/list'
                const response = await api.get(endpoint, {
                    ...config,
                    params
                })

                if (response.data?.status === false) {
                    this.error = response.data.message || 'Failed to fetch continuing appropriations'
                    this.continuingAppropriations = []
                    return []
                }

                const data = response.data?.data || response.data?.rows || []
                this.continuingAppropriations = data.map(item => ({
                    ...item,
                    accounts: (item.accounts || []).map(account => ({
                        ...account,
                        accountName: account.accountName || 'Unknown Account',
                        subItems: account.subItems || [],
                    }))
                }))
                return this.continuingAppropriations
            } catch (error) {
                this.error = error.response?.data?.message || error.message
                this.continuingAppropriations = []
                return []
            } finally {
                this.loading = false
            }
        },

        async createContinuingAppropriation(data) {
            const config = this.getAuthConfig()
            try {
                this.loading = true
                const endpoint = authStore.admin ? '/api/admin/continuing-appropriations' : '/api/barangay/continuing-appropriations'
                const response = await api.post(endpoint, data, config)

                if (response.data.status) {
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