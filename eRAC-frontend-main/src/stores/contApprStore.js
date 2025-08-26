import { defineStore } from "pinia";
import { api } from "src/boot/axios";
import { useAuthStore } from './auth'


export const useContApprStore = defineStore('continuing-appropriation',{
    state: ()=>({
        years: [],
        selectedYear: null,
        continueAccounts: [],
    }),
    getters: {
    },
    actions: {
        
        getAuthConfig() {
            const authStore = useAuthStore()
            if (!authStore.token) {
                throw new Error('Authentication token not found')
            }
            return {
                headers: {
                Authorization: `Bearer ${authStore.token}`,
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

                // group by expenseClass
                const grouped = {}
                rows.forEach(item => {
                if (!grouped[item.expenseClass]) {
                    grouped[item.expenseClass] = []
                }

                let accountName = item.expenseType
                if (item.expenseItem) {
                    accountName += ` > ${item.expenseItem}`
                }

                grouped[item.expenseClass].push({
                    id: item.id,
                    accountName,
                    balance: item.remaining_amount
                })
                })

                // convert into array
                this.continueAccounts = Object.keys(grouped).map(expClass => ({
                class: expClass,
                children: grouped[expClass]
                }))

                console.log('Mapped Continuing Appropriations:', this.continueAccounts)
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
        }

    }

})