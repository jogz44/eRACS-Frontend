import { defineStore } from "pinia";
import { api } from "src/boot/axios";
import { useAuthStore } from './auth'


export const useContApprStore = defineStore('continuing-appropriation',{
    state: ()=>({
        years: [],
        selectedYear: null,
        continueAccounts: [],
        continuingAppropriations: [],
        loading: false,
        error: null,
    }),
    getters: {
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
                    accountName: [row.expenseClass, row.expenseType, row.expenseItem]
                        .filter(Boolean)
                        .join(" > "),
                    total: row.total_amount,
                    details: row.details_amount,
                    balance: row.remaining_amount,
                }))
                console.log('Mapped Continuing Appropriations:', this.continueAccounts)
                return this.continueAccounts
            } catch (error) {
                this.error = error.response?.data?.message || error.message
                return []
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

        async fetchContinuingAppropriations() {
            const config = this.getAuthConfig()
            try {
                this.loading = true
                const response = await api.get('/api/barangay/continuing-appropriations/list', config)
                
                if (response.data.status) {
                    this.continuingAppropriations = response.data.data || []
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
        }

    }

})