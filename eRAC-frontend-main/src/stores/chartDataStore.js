import { defineStore } from 'pinia'
//import { api } from 'boot/axios'
//import { useAuthStore } from './auth'

import { computed } from 'vue'

export const useChartDataStore = defineStore('chartData', {
  state: () => ({
    // Reactive date range
    dateFrom: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    dateTo: new Date(), // Current date

    // Enhanced Summary Cards Data
    summaryCards: [
      {
        label: 'Total Appropriation',
        value: '₱50,000,000.00',
        icon: 'account_balance',
        color: 'secondary',
        trend: 'up',
        change: '2.5%',
      },
      {
        label: 'Total Obligation',
        value: '₱21,000,000.00',
        icon: 'assignment',
        color: 'secondary',
        trend: 'down',
        change: '1.2%',
      },
      {
        label: 'Total Balance',
        value: '₱29,000,000.00',
        icon: 'balance',
        color: 'secondary',
        trend: 'up',
        change: '3.8%',
      },
    ],

    recentDisbursementRows: [
      {
        dvNumber: '',
        dvAmount: '',
        date: '',
        status: '',
        liquidatedAmount: '',
      },
      {
        dvNumber: '',
        dvAmount: '',
        date: '',
        status: '',
        liquidatedAmount: '',
      },
      {
        dvNumber: '',
        dvAmount: '',
        date: '',
        status: '',
        liquidatedAmount: '',
      },
      {
        dvNumber: '',
        dvAmount: '',
        date: '',
        status: '',
        liquidatedAmount: '',
      },
    ],

    chartOptions: {
      doughnut: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 20,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return ` ${context.label}: ₱${context.raw.toLocaleString()}`
              },
            },
          },
        },
      },
      line: {
        // ... (keep your line chart options if needed)
      },
    },
  }),

  getters: {
    recentDisbursementColumns: () =>
      computed(() => [
        {
          name: 'dvNumber',
          required: true,
          label: 'DV Number',
          align: 'center',
          sortable: true,
        },
        {
          name: 'dvAmount',
          label: 'DV Amount',
          align: 'center',
          field: 'dvAmount',
          sortable: true,
        },
        {
          name: 'date',
          label: 'Date',
          align: 'center',
          sortable: true,
        },
        {
          name: 'status',
          label: 'Status',
          align: 'center',
          field: 'status',
          sortable: true,
        },
        {
          name: 'liquidatedAmount',
          label: 'Liquidated Amount',
          align: 'center',
          field: 'liquidatedAmount',
          sortable: true,
        },
      ]).value,

    // If you need to keep the computed property reactive, you can define it like this:
    /*
    recentDisbursementColumns() {
      return [
        // ... same column definitions
      ]
    }
    */
  },

  actions: {
    formatDate(date, options = {}) {
      if (!date) return '' // Handle empty dates

      const d = new Date(date)
      const {
        fullYear = false, // Show full year (YYYY) if true, else YY
        separator = '/', // Custom separator (default '/')
      } = options

      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const year = fullYear ? d.getFullYear() : String(d.getFullYear()).slice(-2)

      return [month, day, year].join(separator)
    },

    getStatusColor(status) {
      const statusMap = {
        Completed: 'positive',
        'For Liquidation': 'warning',
        Pending: 'negative',
      }
      return statusMap[status] || 'grey'
    },

    /*async debugAPIs() {
      try {
        const hierarchy = await api.get('/api/barangay/expense-hierarchy', this.getAuthConfig())
        console.log('Hierarchy API response:', hierarchy.data)

        const budgetId = this.appropriations[0]?.id
        if (budgetId) {
          const allocations = await api.get(
            `/api/barangay/budgets/${budgetId}/allocations`,
            this.getAuthConfig(),
          )
          console.log('Allocations API response:', allocations.data)
        }
      } catch (error) {
        console.error('Debug failed:', error)
        throw error
      }
    },*/

    /* async loadChartData() {
      try {
        this.isLoading = true

        // 1. Get the structure
        const hierarchyRes = await api.get('/api/barangay/expense-hierarchy', this.getAuthConfig())
        const structure = hierarchyRes.data.data || []

        // 2. Get amounts
        const budgetId = this.selectedBudgetId || this.appropriations[0]?.id
        if (!budgetId) throw new Error('No budget selected')

        const allocationsRes = await api.get(
          `/api/barangay/budgets/${budgetId}/allocations`,
          this.getAuthConfig(),
        )
        const allocations = allocationsRes.data.data || []

        // 3. Process data (same logic as before)
        const amountMap = {}
        allocations.forEach((allocation) => {
          const id =
            allocation.expense_item_id || allocation.expense_type_id || allocation.expense_class_id
          if (id) amountMap[id] = allocation.amount
        })

        // 4. Update store state
        this.pieChartData = {
          labels: structure.map((item) => item.name),
          datasets: [
            {
              data: structure.map((classItem) => {
                let total = amountMap[classItem.id] || 0
                classItem.children?.forEach((type) => {
                  total += amountMap[type.id] || 0
                  type.children?.forEach((item) => {
                    total += amountMap[item.id] || 0
                  })
                })
                return total
              }),
              backgroundColor: this.pieChartData.datasets[0].backgroundColor,
              borderWidth: 0,
            },
          ],
        }
      } catch (error) {
        console.error('Failed to load chart data:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },*/

    /*getAuthConfig() {
      return {
        headers: {
          Authorization: `Bearer ${useAuthStore().token}`,
        },
      }
    },*/
  },
})
