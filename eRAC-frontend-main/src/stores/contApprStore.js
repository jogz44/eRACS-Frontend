import { defineStore } from "pinia";
import { api } from "src/boot/axios";
import { useAuthStore } from './auth'


export const useContApprStore = defineStore('continuing-appropriation',{
    state: ()=>({
        years: [],
        selectedYear: null,
    }),
    getters: {
        yearOptions: (state) => {
            return state.years.map((y) => ({
                label: y.year.toString(), // Display value (e.g., "2024")
                value: y.id, // Actual fiscal year ID
                yearValue: y.year.toString(), // For display purposes database ID // For display purposes
            }))
        },
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
        async fetchYears() {
            const config = this.getAuthConfig()
            try {
                const response = await api.get('/api/barangay/fiscal-years', config)

                this.years = response.data.data || []
                //const currentYear = new Date().getFullYear()

            } catch (error) {
                this.error = error.response?.data?.message || error.message
                this.years = []
            } finally {
                this.loading = false
            }
        },
    }
})