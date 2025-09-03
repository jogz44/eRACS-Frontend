import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth'

const getAuthConfig = () => {
  const authStore = useAuthStore()
  return {
    headers: {
      Authorization: `Bearer ${authStore.token}`,
      'Content-Type': 'application/json',
    },
  }
}

export const useContDisbursementStore = defineStore('contdisbursement', {
  state: () => ({
    // Main data collections
    expenseData: [], // This will hold our complete expense hierarchy
    expenses: [], // Initialize expenses array
    expenseSearch: '',
    currentItem: null,
    selectedBarangayId: null,
    selectedBudgetSource: 'all', // For budget source filtering (annual/supplemental)

    // Track expense details from tran_expense_details table for balance calculations
    expenseDetailsData: [], // Array to store all expense details from the database

    autoBookletID: null, // Automatically generated cheque booklet after selecting a bank
    autoCheque: null, // Automatically generated cheque number after selecting a bank
    selectedBank: null,
    selectedBooklet: null,
    selectedChequeNumber: null,
    disbursements: [], // Will be loaded from API

    // Current selections
    currentLiquidation: null,
    lockedTotalAmount: null, // Store the original DV amount for edit mode

    // Search/filters
    searchQuery: '',
    dateFrom: '',
    dateTo: '',

    // UI state
    dialogs: {
      disbursement: false,
      editDisbursement: false,
      expense: false,
      expenseDetail: false,
      liquidationTable: false,
      orDetails: false,
      viewOrDetails: false,
    },

    // Loading states
    loading: false,
    bankLoading: false,
    bookletLoading: false,
    expenseTypeLoading: false,
    savingDisbursement: false,
    loadingEditDisbursement: null,
    loadingDisbursements: false,

    // Form data
    forms: {
      disbursement: {
        date: '',
        dvNumber: '',
        chequeNumber: '',
        bank_id: null,
        payee: '',
        amount: '',
      },
      expense: {
        account: '',
        accountId: null,
        balance: 0,
        particulars: '',
        amount: 0,
        disbursementId: null,
      },
      orDetails: {
        receivedFrom: '',
        address: '',
        paymentFor: '',
        receivedBy: '',
      },
    },
  }),

  getters: {
    // Get expense accounts from continuing appropriations
    expenseAccounts(state) {
      console.log('Computing expenseAccounts, expenseData length:', state.expenseData?.length || 0)
      if (!state.expenseData || state.expenseData.length === 0) {
        console.log('No expense data available')
        return []
      }

      // Helper function to calculate remaining balance
      const calculateRemainingBalance = (accountId, originalAmount, type) => {
        if (!state.expenseDetailsData || state.expenseDetailsData.length === 0) {
          return originalAmount
        }

        const disbursedAmount = state.expenseDetailsData
          .filter(detail => {
            if (type === 'item') {
              return detail.expense_item_id === accountId
            } else if (type === 'type') {
              return detail.expense_type_id === accountId
            }
            return false
          })
          .reduce((sum, detail) => sum + (detail.amount || 0), 0)

        return Math.max(0, originalAmount - disbursedAmount)
      }

      const flattened = state.expenseData.reduce((acc, expenseClass) => {
        if (!expenseClass.children) {
          return acc
        }

        expenseClass.children.forEach((expenseType) => {
          // Check if this expense type has any expense items with balance > 0
          const hasExpenseItemsWithBalance = expenseType.children
            ? expenseType.children.some((item) => item.amount && item.amount > 0)
            : false

          if (hasExpenseItemsWithBalance) {
            // If expense type has items with balance, only show the items (not the type)
            expenseType.children.forEach((expenseItem) => {
              if (expenseItem.amount && expenseItem.amount > 0) {
                // Calculate remaining balance by deducting disbursements
                const remainingBalance = calculateRemainingBalance(
                  expenseItem.id,
                  expenseItem.amount,
                  'item'
                )

                if (remainingBalance > 0) {
                  const expenseItemEntry = {
                    id: expenseItem.id,
                    account: expenseClass.name,
                    expenseType: expenseType.name,
                    expenseItem: expenseItem.name,
                    balance: remainingBalance,
                    originalBalance: expenseItem.amount,
                    expense_class_id: expenseClass.id,
                    expense_type_id: expenseType.id,
                    expense_item_id: expenseItem.id,
                    budget_source: expenseItem.budget_source || expenseType.budget_source || expenseClass.budget_source || 'Continuing Appropriation',
                    description: expenseItem.description || expenseType.description || expenseClass.description,
                  }
                  acc.push(expenseItemEntry)
                }
              }
            })
          } else {
            // If expense type has no items with balance, show the type itself (if it has balance)
            if (expenseType.amount && expenseType.amount > 0) {
              const remainingBalance = calculateRemainingBalance(
                expenseType.id,
                expenseType.amount,
                'type'
              )

              if (remainingBalance > 0) {
                const expenseTypeEntry = {
                  id: expenseType.id,
                  account: expenseClass.name,
                  expenseType: expenseType.name,
                  expenseItem: null,
                  balance: remainingBalance,
                  originalBalance: expenseType.amount,
                  expense_class_id: expenseClass.id,
                  expense_type_id: expenseType.id,
                  expense_item_id: null,
                  budget_source: expenseType.budget_source || expenseClass.budget_source || 'Continuing Appropriation',
                  description: expenseType.description || expenseClass.description,
                }
                acc.push(expenseTypeEntry)
              }
            }
          }
        })

        return acc
      }, [])

      console.log('Computed expenseAccounts:', flattened.length, 'items')
      return flattened
    },

    // New getter that calculates remaining balance after disbursements
    expenseAccountsWithDisbursements(state) {
      if (!state.expenseData || state.expenseData.length === 0) {
        return []
      }

      // Helper function to calculate remaining balance
      const calculateRemainingBalance = (accountId, originalAmount, type) => {
        if (!state.expenseDetailsData || state.expenseDetailsData.length === 0) {
          return originalAmount
        }

        const disbursedAmount = state.expenseDetailsData
          .filter(detail => {
            if (type === 'item') {
              return detail.expense_item_id === accountId
            } else if (type === 'type') {
              return detail.expense_type_id === accountId
            }
            return false
          })
          .reduce((sum, detail) => sum + (detail.amount || 0), 0)

        return Math.max(0, originalAmount - disbursedAmount)
      }

      const flattened = state.expenseData.reduce((acc, expenseClass) => {
        if (!expenseClass.children) {
          return acc
        }

        expenseClass.children.forEach((expenseType) => {
          // Check if this expense type has any expense items with balance > 0
          const hasExpenseItemsWithBalance = expenseType.children
            ? expenseType.children.some((item) => item.amount && item.amount > 0)
            : false

          if (hasExpenseItemsWithBalance) {
            // If expense type has items with balance, only show the items (not the type)
            expenseType.children.forEach((expenseItem) => {
              if (expenseItem.amount && expenseItem.amount > 0) {
                // Calculate remaining balance by deducting disbursements
                const remainingBalance = calculateRemainingBalance(
                  expenseItem.id,
                  expenseItem.amount,
                  'item'
                )

                if (remainingBalance > 0) {
                  const expenseItemEntry = {
                    id: expenseItem.id,
                    account: expenseClass.name,
                    expenseType: expenseType.name,
                    expenseItem: expenseItem.name,
                    balance: remainingBalance, // Use remaining balance instead of original amount
                    originalBalance: expenseItem.amount, // Keep original amount for reference
                    expense_class_id: expenseClass.id,
                    expense_type_id: expenseType.id,
                    expense_item_id: expenseItem.id,
                    budget_source: expenseItem.budget_source || expenseType.budget_source || expenseClass.budget_source || 'Continuing Appropriation', // Add budget source information
                  }
                  acc.push(expenseItemEntry)
                }
              }
            })
          } else {
            // If expense type has no items with balance, show the type itself (if it has balance)
            if (expenseType.amount && expenseType.amount > 0) {
              const remainingBalance = calculateRemainingBalance(
                expenseType.id,
                expenseType.amount,
                'type'
              )

              if (remainingBalance > 0) {
                const expenseTypeEntry = {
                  id: expenseType.id,
                  account: expenseClass.name,
                  expenseType: expenseType.name,
                  expenseItem: null,
                  balance: remainingBalance,
                  originalBalance: expenseType.amount,
                  expense_class_id: expenseClass.id,
                  expense_type_id: expenseType.id,
                  expense_item_id: null,
                  budget_source: expenseType.budget_source || expenseClass.budget_source || 'Continuing Appropriation',
                }
                acc.push(expenseTypeEntry)
              }
            }
          }
        })

        return acc
      }, [])

      return flattened
    },

    disbursementColumns: () => [
      { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
      { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
      { name: 'dvNumber', label: 'DV Number', field: 'dvNumber', align: 'left', sortable: true },
      {
        name: 'chequeNumber',
        label: 'Cheque Number',
        field: 'chequeNumber',
        align: 'left',
        sortable: true,
      },
      { name: 'bank', label: 'Bank', field: 'bank', align: 'left', sortable: true },
      { name: 'payee', label: 'Payee', field: 'payee', align: 'left', sortable: true },
      {
        name: 'dvAmount',
        label: 'Amount',
        field: 'dvAmount',
        format: (val) =>
          `₱${val ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`,
        align: 'left',
        sortable: true,
      },
      { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
      { name: 'action', label: 'Action', field: '', align: 'center' },
    ],

    expenseColumns: () => [
      { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
      {
        name: 'accountName',
        label: 'Account Name',
        field: 'accountName',
        align: 'left',
        sortable: true,
      },
      {
        name: 'amount',
        label: 'Amount',
        field: 'amount',
        align: 'left',
        sortable: true,
        format: (val) =>
          `₱${val ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`,
      },
      {
        name: 'particular',
        label: 'Particular',
        field: 'particular',
        align: 'left',
        sortable: true,
      },
      { name: 'action', label: 'Action', field: '', align: 'center' },
    ],

    expenseAccountColumns: () => [
      {
        name: 'account',
        label: 'Expense Class',
        field: 'account',
        align: 'left',
        sortable: true,
      },
      {
        name: 'expenseType',
        label: 'Expense Type',
        field: 'expenseType',
        align: 'left',
        sortable: true,
      },
      {
        name: 'expenseItem',
        label: 'Expense Item',
        field: 'expenseItem',
        align: 'left',
        sortable: true,
      },
      {
        name: 'balance',
        label: 'Balance',
        field: 'balance',
        format: (val) =>
          `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        align: 'right',
        sortable: true,
      },
      {
        name: 'action',
        label: 'Action',
        field: '',
        align: 'center',
      },
    ],

    filteredDisbursements: (state) => {
      return state.disbursements.filter((disbursement) => {
        const matchesSearch =
          disbursement.payee.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          disbursement.dvNumber.toLowerCase().includes(state.searchQuery.toLowerCase())
        const matchesDate = true // Add date filtering logic here
        return matchesSearch && matchesDate
      })
    },

    totalExpensesAmount: (state) => {
      if (!state.expenses || state.expenses.length === 0) return 0
      return state.expenses.reduce((total, expense) => {
        const amount =
          typeof expense.amount === 'string'
            ? parseFloat(expense.amount.replace(/[^0-9.]/g, ''))
            : expense.amount
        return total + (Number(amount) || 0)
      }, 0)
    },

    filteredExpenseAccounts(state) {
      // Build a set of accountIds already added to prevent duplicates
      const addedIds = new Set((state.expenses || []).map(e => String(e.accountId)))

      let base = this.expenseAccounts.filter(item => !addedIds.has(String(item.id)))

      if (!state.expenseSearch.trim()) {
        return base
      }

      const query = state.expenseSearch.toLowerCase()
      return base.filter(
        (item) =>
          item.account.toLowerCase().includes(query) ||
          item.expenseType.toLowerCase().includes(query) ||
          (item.expenseItem && item.expenseItem.toLowerCase().includes(query)) ||
          (item.description && item.description.toLowerCase().includes(query)),
      )
    },

    aging: () => (dateString) => {
      if (!dateString) return '0 days'
      const [dd, mm, yyyy] = dateString.split('/')
      const disbursementDate = new Date(`${yyyy}-${mm}-${dd}`)
      const today = new Date()
      const diffTime = Math.abs(today - disbursementDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return `${diffDays} days`
    },
  },

  actions: {
    // Calculate remaining balance after disbursements
    calculateRemainingBalance(accountId, originalAmount, type) {
      if (!this.expenseDetailsData || this.expenseDetailsData.length === 0) {
        return originalAmount
      }

      const disbursedAmount = this.expenseDetailsData
        .filter(detail => {
          if (type === 'item') {
            return detail.expense_item_id === accountId
          } else if (type === 'type') {
            return detail.expense_type_id === accountId
          }
          return false
        })
        .reduce((sum, detail) => sum + (detail.amount || 0), 0)

      return Math.max(0, originalAmount - disbursedAmount)
    },

    // Fetch continuing appropriations for disbursement
    async fetchContinuingAppropriations() {
      this.loading = true
      try {
        const config = getAuthConfig()
        console.log('Fetching continued accounts for disbursement...')
        console.log('Config:', config)
        
        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          console.log('API call timed out after 10 seconds')
          controller.abort()
        }, 10000) // 10 second timeout
        
        try {
          // Use the existing endpoint to get continuing appropriations
          console.log('Making API call to:', '/api/barangay/continuing-appropriations/list')
          const response = await api.get('/api/barangay/continuing-appropriations/list', {
            ...config,
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          console.log('API Response received:', response.data)
          
          if (response.data?.status && response.data?.data) {
            // Transform the data to match our expense hierarchy structure
            const appropriations = response.data.data || []
            console.log('Raw appropriations data:', appropriations)
            this.expenseData = this.transformContinuingAppropriationsToHierarchy(appropriations)
            console.log('Fetched continuing appropriations:', appropriations)
            console.log('Transformed expense data:', this.expenseData)
          } else {
            console.log('No data returned from API or status is false')
            console.log('Response status:', response.data?.status)
            console.log('Response data:', response.data?.data)
            this.expenseData = []
          }
        } catch (apiError) {
          clearTimeout(timeoutId)
          console.error('API call failed:', apiError)
          throw apiError
        }
      } catch (error) {
        console.error('Error fetching continuing appropriations:', error)
        console.error('Error details:', error.response?.data)
        this.error = error.response?.data?.message || error.message
        this.expenseData = []
        
        // Re-throw the error so the calling function can handle it
        throw error
      } finally {
        this.loading = false
        console.log('fetchContinuingAppropriations completed, loading set to false')
      }
    },

    // Transform continuing appropriations to expense hierarchy
    transformContinuingAppropriationsToHierarchy(appropriations) {
      const hierarchy = {}
      
      appropriations.forEach(appropriation => {
        console.log('Processing appropriation:', appropriation.id, 'Status:', appropriation.status)
        // Process both committed and draft appropriations for now
        if (appropriation.status !== 'committed' && appropriation.status !== 'draft') {
          console.log('Skipping appropriation with status:', appropriation.status)
          return
        }
        
        console.log('Processing accounts for appropriation:', appropriation.id, 'Accounts count:', appropriation.accounts?.length || 0)
        
        // If there are no accounts or accounts array is empty, skip this appropriation
        // because we need actual cont_appro_accounts records to create disbursements
        if (!appropriation.accounts || appropriation.accounts.length === 0) {
          console.log('No accounts found, skipping appropriation:', appropriation.id)
          return
        }
        
        // Process accounts
        appropriation.accounts.forEach(account => {
            console.log('Processing account:', account)
            // Parse the account name to extract class, type, and item
            const accountNameParts = account.accountName.split(' > ')
            if (accountNameParts.length !== 3) {
              console.warn('Invalid account name format:', account.accountName)
              return
            }
            
            const expenseClass = accountNameParts[0]
            const expenseType = accountNameParts[1]
            const expenseItem = accountNameParts[2]
            
            if (!hierarchy[expenseClass]) {
              hierarchy[expenseClass] = {
                id: `class_${expenseClass}`,
                name: expenseClass,
                children: {}
              }
            }
            
            if (!hierarchy[expenseClass].children[expenseType]) {
              hierarchy[expenseClass].children[expenseType] = {
                id: `type_${expenseType}`,
                name: expenseType,
                children: {}
              }
            }
            
            if (!hierarchy[expenseClass].children[expenseType].children[expenseItem]) {
              hierarchy[expenseClass].children[expenseType].children[expenseItem] = {
                id: account.id, // Use the continuing account ID
                name: expenseItem,
                amount: account.balance || 0,
                budget_source: 'Continuing Appropriation',
                description: appropriation.description || `Continued from ${appropriation.year}`,
                continuingAccountId: account.id,
                continuingAppropriationId: appropriation.id
              }
            }
          })
      })
      
      // Convert to array format
      const result = Object.values(hierarchy).map(classItem => ({
        ...classItem,
        children: Object.values(classItem.children).map(typeItem => ({
          ...typeItem,
          children: Object.values(typeItem.children)
        }))
      }))
      
      console.log('Final transformed hierarchy:', result)
      return result
    },

    // Fetch disbursements
    async fetchDisbursements() {
      this.loadingDisbursements = true
      try {
        const config = getAuthConfig()
        const response = await api.get('/api/barangay/continuing-disbursements', config)
        
        if (response.data?.status) {
          this.disbursements = response.data.data || []
        }
      } catch (error) {
        console.error('Error fetching continuing disbursements:', error)
        this.error = error.response?.data?.message || error.message
      } finally {
        this.loadingDisbursements = false
      }
    },



    // Refresh expense accounts with balances
    async refreshExpenseAccountsWithBalances() {
      this.expenseTypeLoading = true
      try {
        await this.fetchContinuingAppropriations()
        await this.fetchExpenseDetails()
      } catch (error) {
        console.error('Error refreshing expense accounts:', error)
      } finally {
        this.expenseTypeLoading = false
      }
    },

    // Fetch expense details for balance calculations
    async fetchExpenseDetails() {
      try {
        const config = getAuthConfig()
        const response = await api.get('/api/barangay/expense-details', config)
        
        if (response.data?.status) {
          this.expenseDetailsData = response.data.data || []
        }
      } catch (error) {
        console.error('Error fetching expense details:', error)
      }
    },

    setCurrentDisbursement(disbursement) {
      this.currentDisbursement = disbursement
    },

    clearCurrentDisbursement() {
      this.currentDisbursement = null
    },

    async openDialog(dialogName) {
      console.log(`Opening dialog: ${dialogName}`)
      try {
        if (dialogName === 'disbursement') {
          // Generate new disbursement defaults including DV number
          this.generateNewDisbursementDefaults()
        } else if (dialogName === 'expense') {
          console.log('Opening expense dialog, current expenseData length:', this.expenseData.length)
          // Only fetch continuing appropriations if not already loaded
          if (this.expenseData.length === 0) {
            console.log('Fetching continuing appropriations...')
            try {
              await this.fetchContinuingAppropriations()
            } catch (fetchError) {
              console.error('Failed to fetch continuing appropriations:', fetchError)
              // Set empty data to prevent infinite loading
              this.expenseData = []
              this.loading = false
            }
          } else {
            console.log('Using existing expense data')
          }
          console.log('Final expenseData length:', this.expenseData.length)
        }
        this.dialogs[dialogName] = true
      } catch (error) {
        console.error('Error in openDialog:', error)
        // Still open the dialog even if there's an error
        this.dialogs[dialogName] = true
        throw error // Re-throw so the calling function can handle it
      }
    },
    
    closeDialog(dialogName) {
      this.dialogs[dialogName] = false
    },

    openOrDetailsDialog(item) {
      this.currentLiquidation = {
        ...JSON.parse(JSON.stringify(item)),
        orNumber: '',
        orAmount: '',
        orImage: null,
      }
      this.dialogs.orDetails = true
    },

    // In your disbursementStore.js actions
    // In your actions
    // For viewing only (read-only)
    openViewOrDetails(row) {
      this.currentLiquidation = JSON.parse(JSON.stringify(row))
      // Ensure orDetails exists
      if (!this.currentLiquidation.orDetails) {
        this.currentLiquidation.orDetails = []
      }
      this.dialogs.viewOrDetails = true
    },

    // Update openExpenseDetail to match your current structure
    openExpenseDetail(item) {
      console.log('Opening expense detail for item:', item)
      console.log('Item ID (accountId):', item.id)
      console.log('Item continuingAccountId:', item.continuingAccountId)
      
      this.forms.expense = {
        account: `${item.account} > ${item.expenseType} > ${item.expenseItem}`,
        accountId: item.continuingAccountId || item.id, // Use continuingAccountId if available
        balance: item.balance,
        particulars: '',
        amount: 0,
        disbursementId: this.currentItem?.id || null,
      }
      console.log('Set forms.expense.accountId to:', this.forms.expense.accountId)
      this.dialogs.expense = false
      this.dialogs.expenseDetail = true
    },
    // Disbursement Actions
    async saveDisbursement() {
      this.savingDisbursement = true
      try {
        const config = getAuthConfig()
        // Convert date from DD/MM/YYYY to YYYY-MM-DD format for backend
        const dateParts = this.forms.disbursement.date.split('/')
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}` : this.forms.disbursement.date

        const disbursementData = {
          date: formattedDate,
          dvNumber: this.forms.disbursement.dvNumber,
          chequeNumber: this.forms.disbursement.chequeNumber,
          bank_id: this.forms.disbursement.bank_id,
          payee: this.forms.disbursement.payee,
          amount: this.totalExpensesAmount,
          expenses: this.expenses.map(expense => ({
            accountId: expense.accountId,
            particulars: expense.particular,
            amount: expense.amount
          }))
        }

        console.log('Sending disbursement data:', disbursementData)
        console.log('Expenses data:', this.expenses)
        console.log('Individual expense details:', this.expenses.map(expense => ({
          accountId: expense.accountId,
          particulars: expense.particular,
          amount: expense.amount
        })))

        const response = await api.post('/api/barangay/continuing-disbursements', disbursementData, config)
        
        if (response.data?.status) {
      // Reset the form and generate new DV number
      this.resetForm('disbursement')
          this.generateNewDisbursementDefaults()
      this.closeDialog('disbursement')
          
          // Refresh disbursements list
          await this.fetchDisbursements()
          
          return { success: true, data: response.data.data }
        } else {
          return { success: false, error: response.data?.message || 'Failed to save disbursement' }
        }
      } catch (error) {
        console.error('Error saving disbursement:', error)
        console.error('Error response:', error.response?.data)
        
        // Handle validation errors
        if (error.response?.status === 422 && error.response?.data?.errors) {
          const validationErrors = error.response.data.errors
          const errorMessages = Object.values(validationErrors).flat()
          return { 
            success: false, 
            error: `Validation failed: ${errorMessages.join(', ')}`,
            validationErrors: validationErrors
          }
        }
        
        return { 
          success: false, 
          error: error.response?.data?.message || error.message || 'Failed to save disbursement' 
        }
      } finally {
        this.savingDisbursement = false
      }
    },

    generateNewDisbursementDefaults() {
      const today = new Date()
      const dd = String(today.getDate()).padStart(2, '0')
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const yyyy = today.getFullYear()

      // Generate new DV number - consider all disbursements for continuous numbering
      const lastDV = this.disbursements.reduce((max, d) => {
        const num = parseInt(d.dvNumber?.split('-')?.pop()) || 0
        return Math.max(max, num)
      }, 0)

      const newDVNumber = `CDV-${String(yyyy).slice(-2)}-${mm}-${String(lastDV + 1).padStart(3, '0')}`

      // Update form with new defaults
      this.forms.disbursement.date = `${dd}/${mm}/${yyyy}`
      this.forms.disbursement.dvNumber = newDVNumber
    },

    // Select bank and generate cheque number
    async selectBank(bankId) {
      this.bankLoading = true
      this.forms.disbursement.bank_id = bankId
      this.forms.disbursement.chequeNumber = null
      this.autoBookletID = null
      this.autoCheque = null

      if (bankId) {
        try {
          // Fetch available cheques for the selected bank
          const authStore = useAuthStore();
          const token = authStore.admin ? authStore.adminToken : authStore.token;
          const bankData = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          });
          const data = bankData.data.data || [];
          console.log('Fetched bank data:', data);
          
          this.autoBookletID = data.id || null
          this.autoCheque = data.cheque[0]?.cheque_number || null
          this.forms.disbursement.chequeNumber = this.autoCheque

        } catch (error) {
          console.error('Error fetching booklets for bank:', error)
          // Reset bank selection on error
          this.forms.disbursement.bank_id = null
          throw error
        } finally {
          this.bankLoading = false
        }
      } else {
        this.bankLoading = false
      }
    },

    // Expense Actions
    saveExpense() {
      const amount = Number(this.forms.expense.amount) || 0

      this.expenses.push({
        id: Date.now(),
        accountId: this.forms.expense.accountId,
        accountName: this.forms.expense.account,
        amount: amount,
        particular: this.forms.expense.particulars,
      })

      this.expenses = [...this.expenses]
      this.closeDialog('expenseDetail')
      this.resetForm('expense')
    },

    editItem(row) {
      this.forms.expense = {
        account: row.accountName,
        accountId: row.accountId,
        balance: row.balance,
        particulars: row.particular,
        amount: row.amount,
        disbursementId: this.currentItem?.id || null,
      }
      this.currentItem = row
      this.dialogs.expenseDetail = true
    },

    deleteItem(row) {
      this.expenses = this.expenses.filter((e) => e.id !== row.id)
    },

    // Form Actions
    resetForm(formName) {
      if (formName === 'disbursement') {
        this.forms.disbursement = {
          date: '',
          dvNumber: '',
          chequeNumber: '',
          bank_id: null,
          payee: '',
          amount: '',
        }
        this.expenses = []
      } else if (formName === 'expense') {
        this.forms.expense = {
          account: '',
          accountId: null,
          balance: 0,
          particulars: '',
          amount: 0,
          disbursementId: null,
        }
      } else if (formName === 'orDetails') {
        this.forms.orDetails = {
          receivedFrom: '',
          address: '',
          paymentFor: '',
          receivedBy: '',
        }
      }
    },

    openEditDisbursement(row) {
      const disbursement = this.disbursements.find((d) => d.id === row.id)
      if (disbursement) {
        this.forms.disbursement = {
          date: disbursement.date,
          dvNumber: disbursement.dvNumber,
          chequeNumber: disbursement.chequeNumber,
          bank_id: disbursement.bank_id,
          payee: disbursement.payee,
        }
        this.expenses = disbursement.expenses || []
        this.currentItem = { ...disbursement }
        this.dialogs.editDisbursement = true
      }
    },

    saveEditedDisbursement() {
      if (!this.currentItem) return

      const index = this.disbursements.findIndex((d) => d.id === this.currentItem.id)
      if (index !== -1) {
        this.disbursements[index] = {
          ...this.disbursements[index],
          ...this.forms.disbursement,
          expenses: [...this.expenses],
          dvAmount: this.totalExpensesAmount,
        }
        this.closeDialog('editDisbursement')
      }
    },

    resetEditDisbursement() {
      this.currentItem = null
      this.expenses = []
    },

    uploadOrImage(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.currentLiquidation.orImage = e.target.result
      }
      reader.readAsDataURL(file)
    },

    // Liquidation Actions
    saveOrDetails() {
      const index = this.liquidationData.findIndex((d) => d.id === this.currentLiquidation.id)

      if (index !== -1) {
        const hasOrDetails =
          this.currentLiquidation.orNumber &&
          this.currentLiquidation.orAmount &&
          this.currentLiquidation.orImage

        this.liquidationData[index] = {
          ...this.currentLiquidation,
          liquidated: hasOrDetails ? 'Yes' : 'No',
          actualExpense: this.currentLiquidation.orAmount,
          returnAmount: this.currentLiquidation.dvAmount - this.currentLiquidation.orAmount,
        }
      }
    },

    addOrDetail() {
      if (!this.currentLiquidation.orDetails) {
        this.currentLiquidation.orDetails = []
      }

      this.currentLiquidation.orDetails.push({
        orNumber: '',
        orAmount: '',
        orImage: null,
      })

      this.calculateTotals()
    },

    calculateTotals() {
      if (!this.currentLiquidation.orDetails) return

      const totalOrAmount = this.currentLiquidation.orDetails.reduce(
        (sum, or) => sum + (parseFloat(or.orAmount) || 0),
        0,
      )

      this.currentLiquidation.actualExpense = totalOrAmount
      this.currentLiquidation.returnAmount = this.currentLiquidation.dvAmount - totalOrAmount
    },

    uploadOrImageForLiquidation(files, index) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.currentLiquidation.orDetails[index].orImage = e.target.result
      }
      reader.readAsDataURL(files[0])
    },
  },
})
