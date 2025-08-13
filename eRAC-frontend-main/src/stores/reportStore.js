import { defineStore } from "pinia";
import { api } from 'boot/axios'
import { useAuthStore } from './auth'

export const useReportStore = defineStore("reportStore", {
  state: () => ({

    reportRAC: [],
    toDateRAC: '',
    fromDateRAC: '',
    
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
    expenseSelectedCurrent: null,
    expenseOptionsContinuing: [],
    expenseSelectedContinuing: null,
    positionsOptions: [],
    positionSelected: null,

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
    async fetchData() {
      try{
        const config = this.getAuthConfig();
        const expenseClasses = await api.get('/api/barangay/expense-classes', config);
        const positionsOptions = await api.get('/api/barangay/positions', config);

        const list = expenseClasses?.data?.data?.data || [];

        this.expenseOptionsCurrent = list.map(expense => ({
          id: expense.id,
          name: expense.name
        }));

        this.expenseOptionsContinuing = list.map(expense => ({
          id: expense.id,
          name: expense.name
        }));

        this.positionsOptions = positionsOptions?.data?.map(pos => ({
          label: pos.name,
          value: pos.id
        })) || [];
      } catch (error) {
        console.error('Error:', error)
        throw error
      }
      }
    }
})