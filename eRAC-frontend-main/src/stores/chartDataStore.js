import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { useAuthStore } from './auth'

import { computed } from 'vue'

export const useChartDataStore = defineStore('chartData', {
  state: () => ({
    // Year filter state
    selectedYear: new Date().getFullYear(),
    availableYears: [],
    isYearFilterLoading: false,

    // Reactive date range
    dateFrom: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    dateTo: new Date(), // Current date

    // Loading states
    isLoading: false,
    chartLoading: false,

    // Enhanced Summary Cards Data - will be populated from backend
    summaryCards: [
      {
        label: 'Total Appropriation',
        value: '₱0.00',
        icon: 'account_balance',
        color: 'secondary',
        trend: 'up',
        change: '0%',
      },
      {
        label: 'Total Obligation',
        value: '₱0.00',
        icon: 'assignment',
        color: 'secondary',
        trend: 'down',
        change: '0%',
      },
      {
        label: 'Total Balance',
        value: '₱0.00',
        icon: 'balance',
        color: 'secondary',
        trend: 'up',
        change: '0%',
      },
    ],

    // Pie chart data
    pieChartData: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            '#2E7D32',
            '#1565C0',
            '#FFA000',
            '#C62828',
            '#6A1B9A',
            '#00838F',
            '#EF6C00',
            '#4E342E',
            '#AD1457',
            '#00796B',
            '#5D4037',
            '#4527A0',
            '#689F38',
            '#D84315',
            '#283593',
            '#F4511E',
            '#00695C',
            '#512DA8',
          ],
          borderWidth: 0,
          hoverOffset: 12,
        },
      ],
    },

    // Disbursement overview data - comprehensive list for filtering
    disbursementOverviewRows: [],

    // Old recent disbursement data (keeping for backward compatibility)
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
    // New comprehensive disbursement overview columns
    disbursementOverviewColumns: () =>
      computed(() => [
        {
          name: 'dv_number',
          required: true,
          label: 'DV Number',
          align: 'left',
          sortable: true,
          field: 'dv_number',
          style: 'width: 18%',
        },
        {
          name: 'date',
          label: 'Date',
          align: 'center',
          sortable: true,
          field: 'date',
          style: 'width: 12%',
        },
        {
          name: 'payee',
          label: 'Payee',
          align: 'left',
          sortable: true,
          field: 'payee',
          style: 'width: 22%',
        },
        {
          name: 'dv_amount',
          label: 'DV Amount',
          align: 'right',
          field: 'dv_amount',
          sortable: true,
          style: 'width: 18%',
        },
        {
          name: 'aging',
          label: 'Aging (Days)',
          align: 'center',
          field: 'aging',
          sortable: true,
          style: 'width: 15%',
        },
        {
          name: 'status',
          label: 'Status',
          align: 'center',
          field: 'status',
          sortable: true,
          style: 'width: 15%',
        },
      ]).value,

    recentDisbursementColumns: () =>
      computed(() => [
        {
          name: 'dvNumber',
          required: true,
          label: 'DV Number',
          align: 'center',
          sortable: true,
          field: 'dvNumber',
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
          field: 'date', // <-- add this line
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
  },

  actions: {
    getAuthConfig() {
      const authStore = useAuthStore()
      
      // Use admin token if admin is logged in, otherwise use regular token
      const token = authStore.admin ? authStore.adminToken : authStore.token
      
      if (!token) {
        console.error('No authentication token found')
        throw new Error('Authentication required')
      }
      
      console.log('Auth token available:', token ? 'Yes' : 'No')
      return {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
      }).format(value || 0)
    },

    formatDate(date, options = {}) {
      if (!date) return ''

      const d = new Date(date)
      const { fullYear = false, separator = '/' } = options

      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const year = fullYear ? d.getFullYear() : String(d.getFullYear()).slice(-2)

      return [month, day, year].join(separator)
    },

    // Calculate aging in days from creation date
    calculateAging(createdDate, status) {
      if (!createdDate || status.toLowerCase() === 'liquidated') return '-'

      const created = new Date(createdDate)
      const today = new Date()

      // Normalize both to midnight (removes hours/minutes offset issue)
      created.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)

      const diffTime = today - created
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) // <-- FLOOR, not CEIL

      return diffDays < 0 ? 0 : diffDays // Prevent negative values
    },

    getStatusColor(status) {
      const statusMap = {
        Completed: 'positive',
        'For Liquidation': 'warning',
        Pending: 'negative',
      }
      return statusMap[status] || 'grey'
    },

    // Fetch dashboard summary data
    async fetchDashboardSummary() {
      try {
        this.isLoading = true

        // Get budgets data with year filter
        const params = {}
        if (this.selectedYear !== 'all') {
          params.year = this.selectedYear
        }
        
        const budgetsResponse = await api.get('/api/barangay/budgets', {
          ...this.getAuthConfig(),
          params
        })
        const budgets = budgetsResponse.data.data || []

        // Calculate totals
        const totalAppropriation = budgets.reduce(
          (sum, budget) => sum + (parseFloat(budget.amount) || 0),
          0,
        )
        const totalObligation = budgets.reduce((sum, budget) => {
          const allocated =
            budget.allocations?.reduce(
              (allocSum, alloc) => allocSum + (parseFloat(alloc.amount) || 0),
              0,
            ) || 0
          return sum + allocated
        }, 0)
        const totalBalance = totalAppropriation - totalObligation

        // Update summary cards
        this.summaryCards = [
          {
            label: 'Total Appropriation',
            value: this.formatCurrency(totalAppropriation),
            icon: 'account_balance',
            color: 'secondary',
            trend: 'up',
            change: '2.5%',
          },
          {
            label: 'Total Obligation',
            value: this.formatCurrency(totalObligation),
            icon: 'assignment',
            color: 'secondary',
            trend: 'down',
            change: '1.2%',
          },
          {
            label: 'Total Balance',
            value: this.formatCurrency(totalBalance),
            icon: 'balance',
            color: 'secondary',
            trend: 'up',
            change: '3.8%',
          },
        ]

        return { totalAppropriation, totalObligation, totalBalance }
      } catch (error) {
        console.error('Error fetching dashboard summary:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Fetch pie chart data from backend
    async fetchPieChartData(fiscalYearId = null) {
      try {
        this.chartLoading = true

        // Get expense hierarchy with year filter
        const params = {}
        if (this.selectedYear !== 'all') {
          params.year = this.selectedYear
        }
        if (fiscalYearId) {
          params.fiscal_year_id = fiscalYearId
        }

        const hierarchyResponse = await api.get('/api/barangay/expense-hierarchy', {
          ...this.getAuthConfig(),
          params
        })

        const expenseHierarchy = hierarchyResponse.data || []

        // Get budgets to fetch allocations with year filter
        const budgetParams = {}
        if (this.selectedYear !== 'all') {
          budgetParams.year = this.selectedYear
        }
        
        const budgetsResponse = await api.get('/api/barangay/budgets', {
          ...this.getAuthConfig(),
          params: budgetParams
        })
        const budgets = budgetsResponse.data.data || []

        if (budgets.length === 0) {
          this.pieChartData = {
            labels: ['No Data Available'],
            datasets: [
              {
                data: [1],
                backgroundColor: ['#FFA000'],
                borderWidth: 0,
              },
            ],
          }
          return
        }

        // Fetch allocations for all budgets
        const allocationPromises = budgets.map((budget) =>
          api.get(`/api/barangay/budgets/${budget.id}/allocations`, this.getAuthConfig()),
        )

        const allocationResponses = await Promise.all(allocationPromises)
        const allAllocations = allocationResponses.flatMap((response) => response.data.data || [])

        // Process allocations and create pie chart data
        const classTotals = this.processAllocationsForPieChart(expenseHierarchy, allAllocations)

        // Update pie chart data
        this.pieChartData = {
          labels: classTotals.map((item) => item.name),
          datasets: [
            {
              data: classTotals.map((item) => item.total),
              backgroundColor: this.pieChartData.datasets[0].backgroundColor,
              borderWidth: 0,
              hoverOffset: 12,
            },
          ],
        }

        return classTotals
      } catch (error) {
        console.error('Error fetching pie chart data:', error)
        this.pieChartData = {
          labels: ['Error Loading Data'],
          datasets: [
            {
              data: [1],
              backgroundColor: ['#C62828'],
              borderWidth: 0,
            },
          ],
        }
        throw error
      } finally {
        this.chartLoading = false
      }
    },

    // Process allocations to create pie chart data
    processAllocationsForPieChart(expenseHierarchy, allocations) {
      const classTotals = []

      expenseHierarchy.forEach((expenseClass) => {
        let classTotal = 0

        // Sum allocations for this expense class
        allocations.forEach((allocation) => {
          if (allocation.expense_class_id === expenseClass.id) {
            classTotal += parseFloat(allocation.amount) || 0
          }
        })

        // Also sum allocations from child types and items
        expenseClass.children?.forEach((expenseType) => {
          allocations.forEach((allocation) => {
            if (allocation.expense_type_id === expenseType.id) {
              classTotal += parseFloat(allocation.amount) || 0
            }
          })

          expenseType.children?.forEach((expenseItem) => {
            allocations.forEach((allocation) => {
              if (allocation.expense_item_id === expenseItem.id) {
                classTotal += parseFloat(allocation.amount) || 0
              }
            })
          })
        })

        if (classTotal > 0) {
          classTotals.push({
            id: expenseClass.id,
            name: expenseClass.name,
            total: classTotal,
          })
        }
      })

      return classTotals
    },

    // Test method to set static data
    setTestData() {
      console.log('Setting test data for pie chart')
      this.pieChartData = {
        labels: ['Personnel Services', 'Maintenance', 'Capital Outlay', 'Financial Expenses'],
        datasets: [
          {
            data: [5000000, 3000000, 2000000, 1000000],
            backgroundColor: ['#2E7D32', '#1565C0', '#FFA000', '#C62828'],
            borderWidth: 0,
            hoverOffset: 12,
          },
        ],
      }

      this.summaryCards = [
        {
          label: 'Total Appropriation',
          value: this.formatCurrency(0),
          icon: 'account_balance',
          color: 'secondary',
          trend: 'up',
          change: '2.5%',
        },
        {
          label: 'Total Obligation',
          value: this.formatCurrency(0),
          icon: 'assignment',
          color: 'secondary',
          trend: 'down',
          change: '1.2%',
        },
        {
          label: 'Total Balance',
          value: this.formatCurrency(0),
          icon: 'balance',
          color: 'secondary',
          trend: 'up',
          change: '3.8%',
        },
      ]

      console.log('Test data set:', this.pieChartData)
    },

    // Fetch disbursement overview data
    async fetchDisbursementOverview() {
      try {
        // Add year filter to disbursements API call
        const params = {}
        if (this.selectedYear !== 'all') {
          params.year = this.selectedYear
        }
        
        const disbResponse = await api.get('/api/barangay/disbursements', {
          ...this.getAuthConfig(),
          params
        })
        if (disbResponse.data && disbResponse.data.data) {
          // Transform data for the overview table
          this.disbursementOverviewRows = disbResponse.data.data.map((row) => {

            const aging = this.calculateAging(row.created_at, row.status)

            return {
              id: row.id,
              dv_number: row.dv_number,
              date: this.formatDate(row.date, { fullYear: true }),
              payee: row.payee,
              dv_amount: parseFloat(row.dv_amount) || 0,
              status: row.status,
              liquidated_amount: row.liquidated_amount ? parseFloat(row.liquidated_amount) : null,
              bank_name: row.bank_name,
              cheque_number: row.cheque_number,
              aging: aging,
            }
          })

          return this.disbursementOverviewRows
        }
        return []
      } catch (error) {
        console.error('Error fetching disbursement overview:', error)
        this.disbursementOverviewRows = []
        throw error
      }
    },

    // Load all dashboard data
    async loadDashboardData() {
      try {
        this.isLoading = true
        console.log('Loading dashboard data...')
        console.log('Selected year for API call:', this.selectedYear, 'Type:', typeof this.selectedYear)

        try {
          // Try the new optimized dashboard endpoint first
          const response = await api.get('/api/barangay/dashboard/summary', {
            ...this.getAuthConfig(),
            params: { year: this.selectedYear }
          })
          console.log('Dashboard API response:', response.data)

          const dashboardData = response.data.data
          console.log('Dashboard data:', dashboardData)

          // Update summary cards
          this.summaryCards = [
            {
              label: 'Total Appropriation',
              value: this.formatCurrency(dashboardData.summary.total_appropriation),
              icon: 'account_balance',
              color: 'secondary',
              trend: 'up',
              change: '2.5%',
            },
            {
              label: 'Total Obligation',
              value: this.formatCurrency(dashboardData.summary.total_obligation),
              icon: 'assignment',
              color: 'secondary',
              trend: 'down',
              change: '1.2%',
            },
            {
              label: 'Total Balance',
              value: this.formatCurrency(dashboardData.summary.total_balance),
              icon: 'balance',
              color: 'secondary',
              trend: 'up',
              change: '3.8%',
            },
          ]

          // Update pie chart data
          if (dashboardData.pie_chart_data.labels.length > 0) {
            const palette = [
              '#2E7D32',
              '#1565C0',
              '#FFA000',
              '#C62828',
              '#6A1B9A',
              '#00838F',
              '#EF6C00',
              '#4E342E',
              '#AD1457',
              '#00796B',
              '#5D4037',
              '#4527A0',
              '#689F38',
              '#D84315',
              '#283593',
              '#F4511E',
              '#00695C',
              '#512DA8',
            ]
            const colorCount = dashboardData.pie_chart_data.labels.length
            const backgroundColor = Array.from(
              { length: colorCount },
              (_, i) => palette[i % palette.length],
            )

            this.pieChartData = {
              labels: dashboardData.pie_chart_data.labels,
              datasets: [
                {
                  data: dashboardData.pie_chart_data.data,
                  backgroundColor: backgroundColor,
                  borderWidth: 0,
                  hoverOffset: 12,
                },
              ],
            }
            console.log('Updated pie chart data:', this.pieChartData)
          } else {
            this.pieChartData = {
              labels: ['No Data Available'],
              datasets: [
                {
                  data: [1],
                  backgroundColor: ['#FFA000'],
                  borderWidth: 0,
                },
              ],
            }
            console.log('No pie chart data available, showing placeholder')
          }

          // Fetch comprehensive disbursement data for overview
          try {
            const disbResponse = await api.get('/api/barangay/disbursements', {
              ...this.getAuthConfig(),
              params: { year: this.selectedYear }
            })
            if (disbResponse.data && disbResponse.data.data) {
              // Transform data for the overview table
              this.disbursementOverviewRows = disbResponse.data.data.map((row) => {

                const aging = this.calculateAging(row.created_at, row.status)
                

                return {
                  id: row.id,
                  dv_number: row.dv_number,
                  date: this.formatDate(row.date, { fullYear: true }),
                  payee: row.payee,
                  dv_amount: parseFloat(row.dv_amount) || 0,
                  status: row.status,
                  liquidated_amount: row.liquidated_amount
                    ? parseFloat(row.liquidated_amount)
                    : null,
                  bank_name: row.bank_name,
                  cheque_number: row.cheque_number,
                  aging: aging,
                }
              })

              // Also populate the old recent disbursement rows for backward compatibility
              const liquidatedRows = disbResponse.data.data
                .filter((row) => row.status === 'Liquidated')
                .slice(0, 4)
                .map((row) => ({
                  dvNumber: row.dv_number,
                  dvAmount: this.formatCurrency(row.dv_amount),
                  date: this.formatDate(row.date),
                  status: row.status,
                  liquidatedAmount: row.liquidated_amount
                    ? this.formatCurrency(row.liquidated_amount)
                    : '',
                }))

              // Fill remaining slots if less than 4 liquidated disbursements
              while (liquidatedRows.length < 4) {
                liquidatedRows.push({
                  dvNumber: '',
                  dvAmount: '',
                  date: '',
                  status: '',
                  liquidatedAmount: '',
                })
              }
              this.recentDisbursementRows = liquidatedRows
            }
          } catch (err) {
            console.error('Error fetching disbursement data:', err)
            // Set empty data on error
            this.disbursementOverviewRows = []
            this.recentDisbursementRows = []
          }

          return dashboardData
        } catch (dashboardError) {
          console.warn('Dashboard endpoint failed, trying fallback method:', dashboardError)

          // Fallback: Use existing endpoints
          await this.fetchDashboardSummary()
          await this.fetchPieChartData()

          return { fallback: true }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        // Set error state for pie chart
        this.pieChartData = {
          labels: ['Error Loading Data'],
          datasets: [
            {
              data: [1],
              backgroundColor: ['#C62828'],
              borderWidth: 0,
            },
          ],
        }
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Year filter methods
    async fetchAvailableYears() {
      try {
        this.isYearFilterLoading = true
        console.log('Fetching available years...')
        
        const response = await api.get('/api/barangay/fiscal-years', this.getAuthConfig())
        console.log('Fiscal years API response:', response.data)
        
        // Fix: Access the nested data property correctly
        const fiscalYears = response.data?.data || []
        console.log('Extracted fiscal years:', fiscalYears)
        
        // Extract years and add "All Years" option
        this.availableYears = [
          { value: 'all', label: 'All Years' },
          ...fiscalYears.map(fy => ({
            value: fy.year,
            label: fy.year.toString()
          }))
        ]
        
        console.log('Final available years array:', this.availableYears)
        
        // Set default to current year if not already set
        if (!this.selectedYear || this.selectedYear === 'all') {
          this.selectedYear = new Date().getFullYear()
        }
        
        console.log('Selected year set to:', this.selectedYear)
      } catch (error) {
        console.error('Error fetching available years:', error)
        this.availableYears = []
      } finally {
        this.isYearFilterLoading = false
      }
    },

    setSelectedYear(year) {
      // Ensure year is a simple value, not an object
      const yearValue = typeof year === 'object' ? year.value : year
      this.selectedYear = yearValue
      
      // Update date range based on selected year
      if (yearValue === 'all') {
        // For "All Years", set a wide range (e.g., last 10 years)
        const currentYear = new Date().getFullYear()
        this.dateFrom = new Date(currentYear - 10, 0, 1)
        this.dateTo = new Date()
      } else {
        // For specific year, set range for that year
        this.dateFrom = new Date(yearValue, 0, 1)
        this.dateTo = new Date(yearValue, 11, 31)
      }
      
      console.log('Year filter changed to:', yearValue, 'Date range:', this.dateFrom, 'to', this.dateTo)
    },

    resetToCurrentYear() {
      const currentYear = new Date().getFullYear()
      this.setSelectedYear(currentYear)
    },
  },
})
