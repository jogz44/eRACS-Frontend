import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { useAuthStore } from './auth'

export const useReportStore = defineStore('report', {
  state: () => ({
    reportRAC: [],
    reportSACB: [],

    prepBy: '',
    prepPosition: null,
    notedBy: '',
    notedPosition: null,
    certBy: '',
    certPosition: null,

    expenseOptionsCurrent: [],
    expenseOptionsContinuing: [],
    expenseRacSelected: null,
    positionsOptions: [],
    positionSelected: null,

    racColumn: [
      { name: 'accountTitle', field: 'accountTitle', align: 'left' },
      {
        name: 'appropriation',
        field: 'appropriation',
        align: 'right',
        format: (val) => val.toLocaleString(),
      },
      { name: 'particular', field: 'particular', align: 'left' },
      { name: 'dvNumber', field: 'dvNumber', align: 'left' },
      { name: 'date', field: 'date', align: 'left' },
      { name: 'payee', field: 'payee', align: 'left' },
      { name: 'amount', field: 'amount', align: 'right', format: (val) => val.toLocaleString() },
    ],
    sacbColumn: [
      { name: 'ppa', label: 'PROGRAM / PROJECT / ACTIVITY', align: 'left', field: 'ppa' },
      { name: 'appropriation', label: 'APPROPRIATION', align: 'right', field: 'appropriation' },
      { name: 'obligation', label: 'OBLIGATION', align: 'right', field: 'obligation' },
      { name: 'balance', label: 'BALANCE', align: 'right', field: 'balance' },
    ],
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
      try {
        const config = this.getAuthConfig()
        const currentYear = new Date().getFullYear()
        const expenseClasses = await api.get(
          `/api/barangay/expense-classes?fiscal_year=${currentYear}`,
          config,
        )
        const positionsOptions = await api.get('/api/barangay/positions', config)

        const list = expenseClasses?.data?.data?.data || []

        this.expenseOptionsCurrent = list.map((expense) => ({
          id: expense.id,
          name: expense.name,
        }))

        this.expenseOptionsContinuing = list.map((expense) => ({
          id: expense.id,
          name: expense.name,
        }))

        this.positionsOptions =
          positionsOptions?.data?.map((pos) => ({
            label: pos.name,
            value: pos.id,
          })) || []
      } catch (error) {
        console.error('Error:', error)
        throw error
      }
    },
    async fetchRacReport($date) {
      try {
        const config = this.getAuthConfig()
        const response = await api.get(
          `/api/barangay/report/rac`,
          {
            params: {
              to: $date.value.to,
              from: $date.value.from,
              expense_class_id: this.expenseRacSelected.id,
            },
          },
          config,
        )

        this.reportRAC = response?.data?.data?.rows.map((pos) => ({
          accountTitle: pos.accountTitle,
          appropriation: pos.appropriation,
          particular: pos.particular,
          dvNumber: pos.dvNumber,
          date: pos.date,
          payee: pos.payee,
          amount: pos.amount,
        }))
      } catch (error) {
        console.error('Error:', error)
        throw error
      }
    },
    async fetchSacbReport($from, $to) {
      try {
        const config = this.getAuthConfig()
        const response = await api.get(
          `/api/barangay/report/sacb`,
          { params: { from: $from, to: $to } },
          config,
        )

        const rows = response?.data?.data?.rows || [] // <-- fix here

        const grouped = {}
        rows.forEach((row) => {
          const key = `${row.order}-${row.expense}`
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(row)
        })

        this.reportSACB = []
        Object.keys(grouped)
          .sort()
          .forEach((key) => {
            const items = grouped[key]
            const firstItem = items[0]

            this.reportSACB.push({
              isSection: true,
              ppa: `${parseInt(firstItem.order) + 1}. ${firstItem.expense}`,
            })

            items.forEach((item) => {
              this.reportSACB.push({
                ppa: `• ${item.ppa}`,
                appropriation: Number(item.appropriation).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
                obligation: Number(item.obligation).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
                balance: Number(item.balance).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
              })
            })
          })
      } catch (error) {
        console.error('Fetch by steve - Error:', error)
        throw error
      }
    },
  },
})
