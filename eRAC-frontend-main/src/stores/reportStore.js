import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { useAuthStore } from './auth'

export const useReportStore = defineStore('report', {
  state: () => ({
    selectedYear: new Date().getFullYear(),
    reportRAC: [],
    reportSACB: [],

    prepBy: '',
    prepPosition: null,
    notedBy: '',
    notedPosition: null,
    certBy: '',
    certPosition: null,
    
    isLoading: false,

    availableYears: [],

    expenseOptionsCurrent: [],
    expenseOptionsContinuing: [],
    expenseRacSelected: null,
    positionsOptions: [],
    positionSelected: null,

    // Dynamic columns for RAC report
    dynamicAccountColumns: [],
    accountTitleKeyMap: {}, // Maps readable titles to data keys
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
    _normalizeDate(input) {
      if (!input || typeof input !== 'string') return input
      // Convert YYYY/MM/DD to YYYY-MM-DD
      return input.replaceAll('/  ', '-')
    },
    _getSelectedExpenseClass() {
      // Handle both ref and plain object for expenseRacSelected
      const selected = this.expenseRacSelected && this.expenseRacSelected.value
        ? this.expenseRacSelected.value
        : this.expenseRacSelected
      return selected || null
    },
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

    async fetchData(year = null) {
  try {
    const authStore = useAuthStore()
    const config = this.getAuthConfig()

    if (authStore.admin) {
      this.expenseOptionsCurrent = []
      this.expenseOptionsContinuing = []
      this.positionsOptions = []
      return
    }

    // Always send a year — fall back to current year to prevent duplicate
    // entries caused by the backend returning ALL years when no filter is sent
    const fiscalYear = year ?? new Date().getFullYear()
    const params = { fiscal_year: fiscalYear }

    const [expenseClasses, positionsOptions] = await Promise.all([
      api.get('/api/barangay/expense-classes', { ...config, params }),
      api.get('/api/barangay/positions', config),
    ])

    const list = expenseClasses?.data?.data?.data || []

    this.expenseOptionsCurrent = list.map((expense) => ({ id: expense.id, name: expense.name }))
    this.expenseOptionsContinuing = list.map((expense) => ({ id: expense.id, name: expense.name }))
    this.positionsOptions = positionsOptions?.data?.map((pos) => ({
      label: pos.name,
      value: pos.id,
    })) || []
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
},

    async fetchAvailableYears() {
      try {
        this.isLoading = true
        const config = this.getAuthConfig()
        const authStore = useAuthStore()

      if (authStore.admin) {
        const selectedBarangayId = authStore.getSelectedBarangay()
        if (selectedBarangayId) {
          try {
            // Fetch fiscal years scoped to the selected barangay
            const res = await api.get('/api/admin/fiscal-years', {
              ...config,
              params: { barangay_id: selectedBarangayId },
            })
            const fiscalYears = Array.isArray(res.data?.data) ? res.data.data : []
            this.availableYears = [
              { label: 'Year Filter', value: null },
              ...fiscalYears.map((fy) => ({ label: fy.year.toString(), value: fy.year })),
            ]
            return
          } catch {
            // fallthrough to default below
          }
        }
        // No barangay selected or fetch failed — show current year only
        const currentYear = new Date().getFullYear()
        this.availableYears = [
          { label: 'Year Filter', value: null },
          { label: currentYear.toString(), value: currentYear },
        ]
        return
      }

        // Use the SAME endpoint as the dashboard — fiscal-years has the real data
        const res = await api.get('/api/barangay/fiscal-years', config)
        const fiscalYears = Array.isArray(res.data?.data) ? res.data.data : []

        this.availableYears = [
          { label: 'Year Filter', value: null },
          ...fiscalYears.map((fy) => ({
            label: fy.year.toString(),
            value: fy.year,
          })),
        ]

        // Default to current year if not already set
        if (!this.selectedYear) {
          this.selectedYear = new Date().getFullYear()
        }
      } catch (e) {
        console.error('Failed to fetch available years', e)
        this.availableYears = [{ label: 'Year Filter', value: null }]
      } finally {
        this.isLoading = false
      }
    },
        
    async fetchExpenseClassesForBarangay(barangayId, year) {
      try {
        const config = this.getAuthConfig()
        const currentYear = year || new Date().getFullYear()
        // Admin endpoint uses expense-hierarchy with barangay_id + year to derive classes
        const response = await api.get('/api/admin/expense-hierarchy', {
          params: { barangay_id: barangayId, year: currentYear },
          ...config,
        })

        const classes = response?.data || response?.data?.data || []
        const list = Array.isArray(classes)
          ? classes
          : (classes.data || classes.rows || [])

        const mapped = list.map((cls) => ({ id: cls.id, name: cls.name }))
        this.expenseOptionsCurrent = mapped
        this.expenseOptionsContinuing = mapped

        return mapped
      } catch (error) {
        // Handle 401 Unauthorized - token expired
        if (error.response?.status === 401) {
          console.warn('Admin token expired, logging out...')
          const { useAuthStore } = await import('./auth')
          const authStore = useAuthStore()
          await authStore.adminLogout()
          return []
        }
        console.error('Error fetching admin expense classes:', error)
        throw error
      }
    },
    async fetchRacReport($date) {
      try {
        const config = this.getAuthConfig()
        const authStore = useAuthStore()
        const selected = this._getSelectedExpenseClass()
        const to = this._normalizeDate($date.value.to)
        const from = this._normalizeDate($date.value.from)
        if (!selected?.id) {
          throw new Error('Expense class not selected')
        }
        // If admin, use admin endpoint instead
        if (authStore.admin) {
          const selectedBarangayId = authStore.getSelectedBarangay()
          if (!selectedBarangayId) {
            throw new Error('Please select a barangay to generate admin RAC report')
          }
          return await this.fetchAdminRacReport(selectedBarangayId, { value: { to, from } })
        }
        const response = await api.get(
          `/api/barangay/report/rac`,
          {
            params: {
              to,
              from,
              expense_class_id: selected.id,
            },
          },
          config,
        )
        console.log('========================',response)

        // Handle middleware-wrapped response structure
        const responseData = response?.data?.data || response?.data
        const rawData = responseData?.data?.rows || responseData?.rows || []

        // Use account titles from backend response if available, otherwise extract from keys
        if (responseData?.data?.account_titles && responseData?.data?.account_title_key_map) {
          this.dynamicAccountColumns = responseData.data.account_titles
          this.accountTitleKeyMap = responseData.data.account_title_key_map
        } else if (responseData?.account_titles && responseData?.account_title_key_map) {
          this.dynamicAccountColumns = responseData.account_titles
          this.accountTitleKeyMap = responseData.account_title_key_map
        } else {
          // Fallback: Extract unique account titles from dynamic keys (amount_*)
          const accountTitles = []
          const accountTitleMap = {} // Map readable titles to keys

          rawData.forEach(item => {
            Object.keys(item).forEach(key => {
              if (key.startsWith('amount_')) {
                // Convert key back to readable account title - smart conversion
                let accountTitle = key.replace('amount_', '')

                // Handle common patterns to restore proper formatting
                // Convert underscores back to spaces, but preserve some structure
                accountTitle = accountTitle.replace(/_/g, ' ')

                // Clean up multiple spaces
                accountTitle = accountTitle.replace(/\s+/g, ' ').trim()

                if (!accountTitles.includes(accountTitle)) {
                  accountTitles.push(accountTitle)
                  accountTitleMap[accountTitle] = key // Store mapping
                }
              }
            })
          })
          this.dynamicAccountColumns = accountTitles
          this.accountTitleKeyMap = accountTitleMap // Store the mapping for template use
        }

        // Process data - the grouped data already has dynamic columns
        this.reportRAC = rawData.map((pos) => {
          const row = {
            appropriation: pos.appropriation,
            particular: pos.particular,
            dvNumber: pos.dvNumber,
            date: pos.date,
            payee: pos.payee,
            amount: pos.amount,
          }

          // Copy all dynamic amount columns from the grouped data
          Object.keys(pos).forEach(key => {
            if (key.startsWith('amount_')) {
              row[key] = pos[key]
            }
          })

          return row
        })
      } catch (error) {
        console.error('Error:', error)
        throw error
      }
    },
    async fetchAdminRacReport(barangayId, $date) {
      try {
        const config = this.getAuthConfig()
        const selected = this._getSelectedExpenseClass()
        const to = this._normalizeDate($date.value.to)
        const from = this._normalizeDate($date.value.from)


        // Use the same endpoint as user page but with admin parameters
        const response = await api.get(
          `/api/admin/report/rac`,
          {
            params: {
              to,
              from,
              expense_class_id: selected?.id,
              barangay_id: barangayId,
            },
          },
          config,
        )

        const rawData = response?.data?.data?.rows || []


        // Use account titles from backend response if available, otherwise extract from keys
        if (response?.data?.account_titles && response?.data?.account_title_key_map) {
          this.dynamicAccountColumns = response.data.account_titles
          this.accountTitleKeyMap = response.data.account_title_key_map
        } else {
          // Fallback: Extract unique account titles from dynamic keys (amount_*)
          const accountTitles = []
          const accountTitleMap = {} // Map readable titles to keys

          rawData.forEach(item => {
            Object.keys(item).forEach(key => {
              if (key.startsWith('amount_')) {
                // Convert key back to readable account title - smart conversion
                let accountTitle = key.replace('amount_', '')

                // Handle common patterns to restore proper formatting
                // Convert underscores back to spaces, but preserve some structure
                accountTitle = accountTitle.replace(/_/g, ' ')

                // Clean up multiple spaces
                accountTitle = accountTitle.replace(/\s+/g, ' ').trim()

                if (!accountTitles.includes(accountTitle)) {
                  accountTitles.push(accountTitle)
                  accountTitleMap[accountTitle] = key // Store mapping
                }
              }
            })
          })
          this.dynamicAccountColumns = accountTitles
          this.accountTitleKeyMap = accountTitleMap // Store the mapping for template use
        }

        // Process data - the grouped data already has dynamic columns
        this.reportRAC = rawData.map((pos) => {
          const row = {
            appropriation: pos.appropriation,
            particular: pos.particular,
            dvNumber: pos.dvNumber,
            date: pos.date,
            payee: pos.payee,
            amount: pos.amount,
          }

          // Copy all dynamic amount columns from the grouped data
          Object.keys(pos).forEach(key => {
            if (key.startsWith('amount_')) {
              row[key] = pos[key]
            }
          })

          return row
        })

      } catch (error) {
        console.error('Admin RAC fetch error:', error)
        throw error
      }
    },
    async fetchSacbReport($from, $to) {
      try {
        const config = this.getAuthConfig()
        const from = this._normalizeDate($from)
        const to = this._normalizeDate($to)
        const authStore = useAuthStore()
        let response
        if (authStore.admin) {
          const barangayId = authStore.getSelectedBarangay()
          response = await api.get(
            `/api/admin/report/sacb`,
            { params: { from, to, ...(barangayId ? { barangay_id: barangayId } : {}) } },
            config,
          )
        } else {
          response = await api.get(
            `/api/barangay/report/sacb`,
            { params: { from, to } },
            config,
          )
        }

        // Handle middleware-wrapped response structure for SACB
        const responseData = response?.data?.data || response?.data
        const rows = responseData?.data?.rows || responseData?.rows || []

        // Backend now returns hierarchical structure directly
        this.reportSACB = rows
      } catch (error) {
        console.error('Fetch by steve - Error:', error)
        throw error
      }
    },
  },
})
