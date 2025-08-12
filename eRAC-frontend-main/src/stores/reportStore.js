import { defineStore } from "pinia";
import { api } from 'src/boot/axios'
import { useAuthStore } from './auth'

export const useReportStore = defineStore("report", {
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
  getters: {
    async loadPositionsOptions() {
        const authStore = useAuthStore()
        const positions = await api.get('/api/barangay/positions', authStore.getAuthHeader())
        return positions.data.data.map(pos => ({
          label: pos.name,
          value: pos.id
        }))
      },
    async loadExpenseOptions() {
        const authStore = useAuthStore()
        const expenseClasses = await api.get('/api/barangay/expense-classes', authStore.getAuthHeader())
        return expenseClasses.data.data.map(exp => ({
          label: exp.name,
          value: exp.id
        }))
      }
    },
  actions: {}
})