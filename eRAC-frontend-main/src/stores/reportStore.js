import { defineStore } from "pinia";
import { api } from 'boot/axios'
import { useAuthStore } from './auth'

export const useReportStore = defineStore("reportStore", {
  state: () => ({
    barangayID: '',

    reportRAC: [],
    toDateRAC: '',
    fromDateRAC: '',
    expenseID: 'Lol',
    
    reportSACB: [],
    toDateSACB: '',
    fromDateSACB: '',
    prepBy: '',
    prepPosition: null,
    notedBy: '',
    notedPosition: null,
    certBy: '',
    certPosition: null,
    
    expenseOptionsCurrent: [],
    expenseOptionsContinuing: [],
    positionsOptions: [],

    loadingRAC: false,
    loadingSACB: false,
    }),
  getters: {},
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
    async loadPositionsOptions() {
        const config = this.getAuthConfig()
        const positions = await api.get('/api/barangay/positions', config)
        return positions.data.data.map(pos => ({
          label: pos.name,
          value: pos.id
        }))
      },
    async fetchExpenseClass() {
      try{
        const config = this.getAuthConfig();
        const expenseClasses = await api.get('/api/barangay/expense-classes', config);

        const list = expenseClasses?.data?.data?.data || [];

        this.expenseOptionsCurrent = list.map(expense => ({
          id: expense.id,
          name: expense.name
        }));
        return this.expenseOptionsCurrent
      } catch (error) {
        console.error('Error:', error)
        throw error
      }
      }
    }
})