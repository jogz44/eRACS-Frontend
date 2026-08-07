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
    bankOptions: [],
    barangaySetupBankAccounts: [],
    reportPBC: [],
    reportTransmittal: {
      dvRows: [],
      rcdRows: [],
      otherReports: [],
    },
    pbcAdviceList: [],
    contPbcAdviceList: [],
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
      const selected =
        this.expenseRacSelected && this.expenseRacSelected.value
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

        const [expenseClasses, positionsOptions, banksResponse, setupRecord] = await Promise.all([
          api.get('/api/barangay/expense-classes', { ...config, params }),
          api.get('/api/barangay/positions', config),
          api.get('/api/barangay/banks', config),
          this._fetchBarangaySetupBankAccounts(),
        ])

        const list = expenseClasses?.data?.data?.data || []

        this.expenseOptionsCurrent = list.map((expense) => ({ id: expense.id, name: expense.name }))
        this.expenseOptionsContinuing = list.map((expense) => ({
          id: expense.id,
          name: expense.name,
        }))
        this.positionsOptions =
          positionsOptions?.data?.map((pos) => ({
            label: pos.name,
            value: pos.id,
          })) || []
        const configuredIds = new Set(
          (setupRecord || [])
            .filter((account) => account.account_number)
            .map((account) => String(account.bank_id)),
        )
        const banks = this._unwrapRows(banksResponse)
        this.bankOptions = banks
          .filter((bank) => !configuredIds.size || configuredIds.has(String(bank.id)))
          .map((bank) => ({
            id: bank.id,
            name: bank.bank_name || bank.name,
            branch: bank.branch || bank.bank_branch || '',
            city: bank.city || bank.bank_city || '',
            status: bank.status || '',
          }))
      } catch (error) {
        console.error('Error:', error)
        throw error
      }
    },

    async _fetchBarangaySetupBankAccounts() {
      const authStore = useAuthStore()
      if (authStore.admin) return this.barangaySetupBankAccounts

      try {
        const response = await api.get('/api/barangay/setup', this.getAuthConfig())
        const payload = response.data?.data ?? response.data
        const record = Array.isArray(payload)
          ? payload.find((item) => item.barangay_id === authStore.user?.barangay_id) || payload[0]
          : payload

        const accounts =
          record?.bank_accounts || record?.bankAccounts || record?.setup_bank_accounts || []
        this.barangaySetupBankAccounts = accounts.map((account) => ({
          ...account,
          bank_id: account.bank_id ?? account.bankId ?? account.bank?.id,
          account_number: account.account_number ?? account.accountNumber ?? '',
          bank_status: account.bank_status ?? account.bankStatus ?? '',
        }))
      } catch (error) {
        console.error('Failed to fetch barangay setup bank accounts:', error)
        this.barangaySetupBankAccounts = []
      }

      return this.barangaySetupBankAccounts
    },

    _getBankStatusForBank(bankId) {
      if (!bankId) return ''
      const account = this.barangaySetupBankAccounts.find(
        (item) => String(item.bank_id) === String(bankId) && item.account_number,
      )
      return String(account?.bank_status || '').toLowerCase()
    },

    async fetchSignatories() {
      try {
        const config = this.getAuthConfig()
        const authStore = useAuthStore()

        if (authStore.admin) return null // admins don't have a barangay setup record

        const response = await api.get('/api/barangay/setup', config)
        const payload = response.data?.data ?? response.data

        let record = null
        if (Array.isArray(payload)) {
          record = payload[0] || null
        } else if (payload && typeof payload === 'object') {
          record = payload
        }
        if (!record) return null

        const findPosition = (id) =>
          id != null ? this.positionsOptions.find((p) => p.value === Number(id)) || null : null

        this.prepBy = record.prepared_by || ''
        this.prepPosition = findPosition(record.barangay_position_id)
        this.notedBy = record.noted_by || ''
        this.notedPosition = findPosition(record.noted_by_position_id)
        this.certBy = record.certified_by || ''
        this.certPosition = findPosition(record.certified_by_position_id)

        return record
      } catch (error) {
        console.error('Failed to fetch barangay signatories', error)
        return null
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
        const list = Array.isArray(classes) ? classes : classes.data || classes.rows || []

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
    // async fetchBankOptionsForBarangay(barangayId) {
    //   if (!barangayId) {
    //     this.bankOptions = []
    //     return []
    //   }

    //   const config = this.getAuthConfig()
    //   const response = await api.get('/api/admin/banks', {
    //     ...config,
    //     params: { barangay_id: barangayId },
    //   })

    //   const banks = this._unwrapRows(response)
    //   this.bankOptions = banks.map((bank) => ({
    //     id: bank.id,
    //     name: bank.bank_name || bank.name,
    //     branch: bank.branch || bank.bank_branch || '',
    //     city: bank.city || bank.bank_city || '',
    //     status: bank.status || '',
    //   }))

    //   return this.bankOptions
    // },

    async fetchBankOptionsForBarangay(barangayId) {
      if (!barangayId) {
        this.bankOptions = []
        return []
      }
      try {
        const config = this.getAuthConfig()
        const response = await api.get('/api/admin/banks', {
          ...config,
          params: { barangay_id: barangayId },
        })
        console.log('admin/banks raw response:', response.data) // <-- TEMP LANG
        const banks = this._unwrapRows(response)
        console.log('admin/banks unwrapped:', banks) // <-- TEMP ALSO
        this.bankOptions = banks.map((bank) => ({
          id: bank.id,
          name: bank.bank_name || bank.name,
          branch: bank.branch || bank.bank_branch || '',
          city: bank.city || bank.bank_city || '',
          status: bank.status || '',
        }))
        return this.bankOptions
      } catch (error) {
        console.error('Failed to fetch bank options for barangay:', error)
        this.bankOptions = []
        return []
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
        console.log('========================', response)

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

          rawData.forEach((item) => {
            Object.keys(item).forEach((key) => {
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
          Object.keys(pos).forEach((key) => {
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

          rawData.forEach((item) => {
            Object.keys(item).forEach((key) => {
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
          Object.keys(pos).forEach((key) => {
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
          response = await api.get(`/api/barangay/report/sacb`, { params: { from, to } }, config)
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

    async loadPbcAdviceList() {
      try {
        this.isLoading = true
        const config = this.getAuthConfig()
        const authStore = useAuthStore()
        const endpoint = authStore.admin ? '/api/admin/pbc-advices' : '/api/barangay/pbc-advices'

        const params = {}
        if (authStore.admin) {
          const barangayId = authStore.getSelectedBarangay?.()
          if (barangayId) params.barangay_id = barangayId
        }

        const response = await api.get(endpoint, { ...config, params })
        const rows = this._unwrapRows(response)

        this.pbcAdviceList = rows.map((row) => {
          const matchedBank = this.bankOptions.find((b) => String(b.id) === String(row.bank_id))
          return {
            id: row.id,
            pbcNo: row.advice_no,
            pbcDate: row.advice_date,
            voucherCount: row.voucher_count ?? 0,
            amount: this._money(row.total_amount),
            from: row.from_date,
            to: row.to_date,
            bankId: row.bank_id,
            bankName: matchedBank?.name || row.bank_name || '',
            recipient: row.recipient || '',
            bankBranch: matchedBank?.branch || row.bank_branch || '',
            bankCity: matchedBank?.city || row.bank_city || '',
            source: row.source || 'regular',
          }
        })
      } catch (error) {
        console.error('Failed to load PBC advice list:', error)
        this.pbcAdviceList = []
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async recordPbcAdvice({
      pbcNo,
      pbcDate,
      voucherCount,
      amount,
      from,
      to,
      bankId,
      bankName,
      recipient,
      bankBranch,
      bankCity,
      source = 'regular',
    }) {
      try {
        const config = this.getAuthConfig()
        const authStore = useAuthStore()
        const endpoint = authStore.admin ? '/api/admin/pbc-advices' : '/api/barangay/pbc-advices'

        const payload = {
          bank_id: bankId,
          from_date: from,
          to_date: to,
          ...(authStore.admin ? { barangay_id: authStore.getSelectedBarangay?.() } : {}),
        }

        const response = await api.post(endpoint, payload, config)
        const saved = response?.data?.data || response?.data

        if (!Array.isArray(this.pbcAdviceList)) this.pbcAdviceList = []
        this.pbcAdviceList.unshift({
          id: saved?.id,
          pbcNo: saved?.advice_no || pbcNo,
          pbcDate: saved?.advice_date || pbcDate,
          voucherCount: saved?.voucher_count ?? voucherCount,
          amount: this._money(saved?.total_amount ?? amount),
          from: saved?.from_date || from,
          to: saved?.to_date || to,
          bankId: saved?.bank_id || bankId,
          bankName,
          recipient,
          bankBranch,
          bankCity,
          source,
        })
        return saved
      } catch (error) {
        console.error('Failed to record PBC advice:', error)
        throw error
      }
    },
    async fetchPbcAdviceById(id) {
      try {
        const config = this.getAuthConfig()
        const response = await api.get(`/api/barangay/pbc-advices/${id}`, config)
        return response?.data?.data || response?.data
      } catch (error) {
        console.error('Failed to fetch PBC advice:', error)
        throw error
      }
    },

    async deletePbcAdvice(id) {
      try {
        const config = this.getAuthConfig()
        await api.delete(`/api/barangay/pbc-advices/${id}`, config)

        // Remove from local list immediately
        this.pbcAdviceList = this.pbcAdviceList.filter((row) => row.id !== id)
      } catch (error) {
        console.error('Failed to delete PBC advice:', error)
        throw error
      }
    },

    async loadContPbcAdviceList() {
      try {
        this.isLoading = true
        const config = this.getAuthConfig()
        const authStore = useAuthStore()
        const endpoint = authStore.admin
          ? '/api/admin/cont-pbc-advices'
          : '/api/barangay/cont-pbc-advices'

        const params = {}
        if (authStore.admin) {
          const barangayId = authStore.getSelectedBarangay?.()
          if (barangayId) params.barangay_id = barangayId
        }

        const response = await api.get(endpoint, { ...config, params })
        const rows = this._unwrapRows(response)

        this.contPbcAdviceList = rows.map((row) => {
          const matchedBank = this.bankOptions.find(
            (bank) => String(bank.id) === String(row.bank_id),
          )

          return {
            id: row.id,
            pbcNo: row.advice_no,
            pbcDate: row.advice_date,
            voucherCount: row.voucher_count ?? 0,
            amount: this._money(row.total_amount),
            from: row.from_date,
            to: row.to_date,
            bankId: row.bank_id,
            bankName: matchedBank?.name || row.bank_name || '',
            recipient: row.recipient || '',
            bankBranch: matchedBank?.branch || row.bank_branch || '',
            bankCity: matchedBank?.city || row.bank_city || '',
            source: 'continuing',
          }
        })
      } catch (error) {
        console.error('Failed to load Continuing PBC advice list:', error)
        this.contPbcAdviceList = []
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async recordContPbcAdvice({
      pbcNo,
      pbcDate,
      voucherCount,
      amount,
      from,
      to,
      bankId,
      bankName,
      recipient,
      bankBranch,
      bankCity,
    }) {
      try {
        const config = this.getAuthConfig()
        const authStore = useAuthStore()
        const endpoint = authStore.admin
          ? '/api/admin/cont-pbc-advices'
          : '/api/barangay/cont-pbc-advices'

        const payload = {
          bank_id: bankId,
          from_date: from,
          to_date: to,
          ...(authStore.admin ? { barangay_id: authStore.getSelectedBarangay?.() } : {}),
        }

        const response = await api.post(endpoint, payload, config)
        const saved = response?.data?.data || response?.data

        if (!Array.isArray(this.contPbcAdviceList)) this.contPbcAdviceList = []
        this.contPbcAdviceList.unshift({
          id: saved?.id,
          pbcNo: saved?.advice_no || pbcNo,
          pbcDate: saved?.advice_date || pbcDate,
          voucherCount: saved?.voucher_count ?? voucherCount,
          amount: this._money(saved?.total_amount ?? amount),
          from: saved?.from_date || from,
          to: saved?.to_date || to,
          bankId: saved?.bank_id || bankId,
          bankName,
          recipient,
          bankBranch,
          bankCity,
          source: 'continuing',
        })

        return saved
      } catch (error) {
        console.error('Failed to record Continuing PBC advice:', error)
        throw error
      }
    },

    async fetchContPbcAdviceById(id) {
      try {
        const config = this.getAuthConfig()
        const authStore = useAuthStore()
        const endpoint = authStore.admin
          ? `/api/admin/cont-pbc-advices/${id}`
          : `/api/barangay/cont-pbc-advices/${id}`
        const response = await api.get(endpoint, config)
        return response?.data?.data || response?.data
      } catch (error) {
        console.error('Failed to fetch Continuing PBC advice:', error)
        throw error
      }
    },

    async deleteContPbcAdvice(id) {
      try {
        const config = this.getAuthConfig()
        const authStore = useAuthStore()
        const endpoint = authStore.admin
          ? `/api/admin/cont-pbc-advices/${id}`
          : `/api/barangay/cont-pbc-advices/${id}`
        await api.delete(endpoint, config)
        this.contPbcAdviceList = this.contPbcAdviceList.filter((row) => row.id !== id)
      } catch (error) {
        console.error('Failed to delete Continuing PBC advice:', error)
        throw error
      }
    },

    _unwrapRows(response) {
      const payload = response?.data?.data ?? response?.data ?? []
      if (Array.isArray(payload)) return payload
      if (Array.isArray(payload?.data)) return payload.data
      if (Array.isArray(payload?.rows)) return payload.rows
      if (Array.isArray(payload?.data?.rows)) return payload.data.rows
      return []
    },

    _isOfflineStatus(status) {
      return (
        String(status || '')
          .trim()
          .toLowerCase() === 'offline'
      )
    },

    _dateValue(value) {
      if (!value) return 0
      if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
        const parsed = new Date(value)
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
      }
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(value))) {
        const [month, day, year] = String(value).split('/')
        const parsed = new Date(`${year}-${month}-${day}`)
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
      }
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
    },

    _isWithinDateRange(value, from, to) {
      const time = this._dateValue(value)
      if (!time) return false
      const fromTime = from ? this._dateValue(from) : 0
      const toTime = to ? this._dateValue(to) : 0
      return (!fromTime || time >= fromTime) && (!toTime || time <= toTime)
    },

    _yearsInDateRange(from, to, fallbackYear = null) {
      const fromDate = from ? new Date(from) : null
      const toDate = to ? new Date(to) : null
      const startYear =
        !fromDate || Number.isNaN(fromDate.getTime())
          ? Number(fallbackYear || this.selectedYear || new Date().getFullYear())
          : fromDate.getFullYear()
      const endYear = !toDate || Number.isNaN(toDate.getTime()) ? startYear : toDate.getFullYear()
      const first = Math.min(startYear, endYear)
      const last = Math.max(startYear, endYear)

      return Array.from({ length: last - first + 1 }, (_, index) => first + index)
    },

    _findPbcAdviceMatch(bankId, dateValue, source = 'regular') {
      const list = source === 'continuing' ? this.contPbcAdviceList : this.pbcAdviceList
      if (!Array.isArray(list) || !bankId || !dateValue) return null

      const target = this._dateValue(dateValue)
      if (!target) return null

      return (
        list.find((advice) => {
          if (String(advice.bankId) !== String(bankId)) return false
          const fromTime = this._dateValue(advice.from)
          const toTime = this._dateValue(advice.to)
          return (!fromTime || target >= fromTime) && (!toTime || target <= toTime)
        }) || null
      )
    },

    _formatReportDate(value) {
      if (!value) return ''
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return value
      const month = String(parsed.getMonth() + 1).padStart(2, '0')
      const day = String(parsed.getDate()).padStart(2, '0')
      return `${month}/${day}/${parsed.getFullYear()}`
    },

    _money(value) {
      return Number(value ?? 0) || 0
    },

    _getPbCertificationNo(row, cheque = {}) {
      return (
        cheque.pb_certification_no ||
        cheque.pbCertificationNo ||
        cheque.pbc_no ||
        cheque.pbcNo ||
        cheque.certification_no ||
        row.pb_certification_no ||
        row.pbCertificationNo ||
        row.pbc_no ||
        row.pbcNo ||
        row.certification_no ||
        ''
      )
    },

    _rowPurpose(row) {
      if (row.particular) return row.particular
      if (row.purpose) return row.purpose
      if (Array.isArray(row.expenses) && row.expenses.length) {
        return row.expenses
          .map((e) => e.particular || e.description || '')
          .filter(Boolean)
          .join('; ')
      }
      return ''
    },

    _getPbCertificationDate(row, cheque = {}) {
      return (
        cheque.pb_certification_date ||
        cheque.pbCertificationDate ||
        cheque.pbc_date ||
        cheque.pbcDate ||
        cheque.certification_date ||
        row.pb_certification_date ||
        row.pbCertificationDate ||
        row.pbc_date ||
        row.pbcDate ||
        row.certification_date ||
        ''
      )
    },

    _disbursementChequeRows(row) {
      const rawCheques = [...(row.bank_cheques || []), ...(row.entries || [])]
      if (!rawCheques.length) {
        rawCheques.push({
          bank_id: row.bank_id,
          bank_name: row.bank_name,
          bankStatus: row.bank_status,
          bank_status: row.bank_status,
          cheque_number: row.cheque_number,
          cheque_date: row.cheque_date || row.date,
          amount: row.cheque_amount ?? row.net_amount ?? row.dv_amount ?? row.amount,
        })
      }

      return rawCheques
        .map((cheque) => ({
          bank_id: cheque.bank_id ?? cheque.bank?.id ?? row.bank_id ?? null,
          bankName:
            cheque.bank_name ||
            cheque.bankName ||
            // cheque.bank?.bank_name ||
            // cheque.bank?.name ||
            // row.bank_name ||
            // '',
            cheque.bankName ||
            (typeof cheque.bank === 'string'
              ? cheque.bank
              : cheque.bank?.bank_name || cheque.bank?.name) ||
            row.bank_name ||
            '',
          bank_status:
            this._getBankStatusForBank(cheque.bank_id ?? cheque.bank?.id ?? row.bank_id) ||
            cheque.bank_status ||
            cheque.bankStatus ||
            row.bank_status ||
            '',
          cheque_number: cheque.cheque_number || cheque.chequeNumber || row.cheque_number || '',
          cheque_date: cheque.cheque_date || cheque.chequeDate || row.cheque_date || row.date || '',
          amount: this._money(
            cheque.amount ?? cheque.cheque_amount ?? row.net_amount ?? row.dv_amount,
          ),
          pbNo: this._getPbCertificationNo(row, cheque),
          pbDate: this._getPbCertificationDate(row, cheque),
        }))
        .filter((cheque) => cheque.cheque_number || cheque.amount > 0)
    },

    async _fetchDisbursementReportRows(year) {
      const config = this.getAuthConfig()
      const authStore = useAuthStore()
      const years = Array.isArray(year)
        ? year
        : [Number(year ?? this.selectedYear ?? new Date().getFullYear())]
      const endpoint = authStore.admin ? '/api/admin/disbursements' : '/api/barangay/disbursements'

      const responses = await Promise.all(
        years.map((reportYear) => {
          const params = { year: Number(reportYear) }

          if (authStore.admin) {
            const barangayId = authStore.getSelectedBarangay?.()
            if (barangayId) params.barangay_id = barangayId
          }

          return api.get(endpoint, { ...config, params })
        }),
      )

      const seen = new Set()
      return responses
        .flatMap((response) => this._unwrapRows(response))
        .filter((row) => {
          const key = `${row.id || row.disbursement_id || row.dv_number || row.dvNumber}:${row.type || row.disbursement_type || ''}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
    },

    async _fetchContinuingDisbursementReportRows(year) {
      const config = this.getAuthConfig()
      const authStore = useAuthStore()
      const years = Array.isArray(year)
        ? year
        : [Number(year ?? this.selectedYear ?? new Date().getFullYear())]

      const endpoint = authStore.admin
        ? '/api/admin/continuing-disbursements'
        : '/api/barangay/continuing-disbursements'

      const responses = await Promise.all(
        years.map((reportYear) => {
          const params = { year: Number(reportYear) }
          if (authStore.admin) {
            const barangayId = authStore.getSelectedBarangay?.()
            if (barangayId) params.barangay_id = barangayId
          }
          return api.get(endpoint, { ...config, params })
        }),
      )

      const rows = responses.flatMap((response) => this._unwrapRows(response))

      // TEMP DEBUG — remove after diagnosing
      console.log('CONTINUING DISBURSEMENT RAW ROW:', rows[0])

      const seen = new Set()
      return rows.filter((row) => {
        const key = `${row.id || row.disbursement_id || row.dv_number || row.dvNumber}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    },

    async fetchPbcReport({ from, to, bankId, year, pbcNo = '', pbcDate = '', source = 'regular' }) {
      try {
        const fetchRows =
          source === 'continuing'
            ? this._fetchContinuingDisbursementReportRows(this._yearsInDateRange(from, to, year))
            : this._fetchDisbursementReportRows(this._yearsInDateRange(from, to, year))

        const rows = await fetchRows
        await this._fetchBarangaySetupBankAccounts()
        const selectedBankId = bankId ? String(bankId) : ''
        const grouped = new Map()

        rows.forEach((row) => {
          if (!this._isWithinDateRange(row.date || row.cheque_date, from, to)) return

          const cheques = this._disbursementChequeRows(row).filter((cheque) => {
            if (!this._isOfflineStatus(cheque.bank_status || row.bank_status)) return false
            if (selectedBankId && String(cheque.bank_id || '') !== selectedBankId) return false
            return true
          })

          cheques.forEach((cheque) => {
            const bankKey = cheque.bank_id || cheque.bankName || 'offline-bank'
            const bankLabel = cheque.bankName || row.bank_name || 'Bank'

            if (!grouped.has(bankKey)) {
              grouped.set(bankKey, {
                bankGroup: bankLabel,
                checks: [],
              })
            }

            // grouped.get(bankKey).checks.push({
            //   checkNo: cheque.cheque_number,
            //   checkDate: this._formatReportDate(cheque.cheque_date),
            //   payee: row.payee || row.payee2 || '',
            //   amount: cheque.amount,
            //   purpose: row.particular || row.purpose || '',
            //   pbNo: cheque.pbNo || pbcNo,
            //   pbDate: this._formatReportDate(cheque.pbDate || pbcDate),
            // })
            grouped.get(bankKey).checks.push({
              checkNo: cheque.cheque_number,
              checkDate: this._formatReportDate(cheque.cheque_date),
              payee: row.payee || row.payee2 || '',
              amount: cheque.amount,
              purpose: this._rowPurpose(row), // <-- was: row.particular || row.purpose || ''
              pbNo: cheque.pbNo || pbcNo,
              pbDate: this._formatReportDate(cheque.pbDate || pbcDate),
            })
          })
        })

        this.reportPBC = [...grouped.values()]
        return this.reportPBC
      } catch (error) {
        console.error('Failed to fetch PBC report:', error)
        this.reportPBC = []
        throw error
      }
    },

    async fetchTransmittalReport({ from, to, year, pbcNo = '', pbcDate = '', source = 'regular' }) {
      try {
        await this._fetchBarangaySetupBankAccounts()

        // Make sure we have advice records to match against
        if (!this.pbcAdviceList?.length) await this.loadPbcAdviceList()
        if (source === 'continuing' && !this.contPbcAdviceList?.length) {
          await this.loadContPbcAdviceList()
        }

        const rows =
          source === 'continuing'
            ? await this._fetchContinuingDisbursementReportRows(year)
            : await this._fetchDisbursementReportRows(year)

        const dvRows = []

        rows.forEach((row) => {
          if (!this._isWithinDateRange(row.date || row.cheque_date, from, to)) return

          const offlineCheques = this._disbursementChequeRows(row).filter((cheque) =>
            this._isOfflineStatus(cheque.bank_status || row.bank_status),
          )

          offlineCheques.forEach((cheque) => {
            const match = this._findPbcAdviceMatch(cheque.bank_id, cheque.cheque_date, source)

            dvRows.push({
              dvDate: this._formatReportDate(row.date),
              dvNo: row.dv_number || row.dvNumber || '',
              checkDate: this._formatReportDate(cheque.cheque_date),
              checkNo: cheque.cheque_number,
              payee: row.payee || row.payee2 || '',
              amount: cheque.amount,
              pbDate: this._formatReportDate(match?.pbcDate || cheque.pbDate || pbcDate),
              pbNo: match?.pbcNo || cheque.pbNo || pbcNo,
            })
          })
        })

        this.reportTransmittal = { dvRows, rcdRows: [], otherReports: [] }
        return this.reportTransmittal
      } catch (error) {
        console.error('Failed to fetch transmittal report:', error)
        this.reportTransmittal = { dvRows: [], rcdRows: [], otherReports: [] }
        throw error
      }
    },
  },
})
