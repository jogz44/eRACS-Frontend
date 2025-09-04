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
        amount: '',
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
      console.log('Added expense accountIds:', Array.from(addedIds))
      console.log('Total expense accounts available:', this.expenseAccounts.length)

      let base = this.expenseAccounts.filter(item => {
        // Use the same logic as in openExpenseDetail to get the correct accountId
        const itemAccountId = item.continuingAccountId || item.id
        const isAlreadyAdded = addedIds.has(String(itemAccountId))
        if (isAlreadyAdded) {
          console.log(`Filtering out account: ${item.account} > ${item.expenseType} > ${item.expenseItem} (ID: ${itemAccountId})`)
        }
        return !isAlreadyAdded
      })
      
      console.log('Filtered expense accounts remaining:', base.length)

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

    // Fetch single disbursement by ID
    async fetchDisbursementById(id) {
      try {
        const config = getAuthConfig()
        const response = await api.get(`/api/barangay/continuing-disbursements/${id}`, config)
        
        if (response.data?.status) {
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching disbursement by ID:', error)
        return null
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

    // Refresh continuing appropriations in the contApprStore
    async refreshContinuingAppropriations() {
      try {
        // Import and use the contApprStore to refresh its data
        const { useContApprStore } = await import('./contApprStore')
        const contApprStore = useContApprStore()
        await contApprStore.fetchContinuingAppropriations()
        await contApprStore.fetchContinueAccounts()
      } catch (error) {
        console.warn('Failed to refresh continuing appropriations:', error)
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
              // Don't re-throw the error - just log it and continue
              console.warn('Continuing with empty expense data due to fetch error')
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
        // Don't re-throw the error to prevent button loading state issues
        console.warn('Dialog opened despite error:', error.message)
      }
    },
    
    closeDialog(dialogName) {
      this.dialogs[dialogName] = false
    },

    async openOrDetailsDialog(item) {
      console.log('Opening OR details dialog for item:', item);
      this.currentLiquidation = JSON.parse(JSON.stringify(item));

      // Fetch existing OR Details from backend if this is a partial liquidation
      if (item.id && item.status === 'Partial') {
        try {
          const config = getAuthConfig()
          const res = await api.get(`/api/barangay/disbursements/${item.id}/or-details`, config);
          console.log('Fetched existing OR details:', res.data.data);
          const backendUrl = 'http://localhost:8000';
          this.currentLiquidation.orDetails = res.data.data.map(or => {
            // Convert YYYY-MM-DD to DD/MM/YYYY format
            let formattedDate = '';
            if (or.or_date) {
              const dateParts = or.or_date.split('-');
              if (dateParts.length === 3) {
                formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
              }
            }

            return {
              id: or.id, // Keep the original ID for updating
              orDate: formattedDate,
              orNumber: or.or_number,
              orAmount: or.or_amount,
              orImage: or.or_photo ? `${backendUrl}/storage/${or.or_photo}` : null,
              orPhotoUrl: or.or_photo ? `${backendUrl}/storage/${or.or_photo}` : null,
              serverPhotoPath: or.or_photo,
              remarks: or.remarks || '',
            };
          });

          // Set single remarks from the latest OR detail (most recent one)
          if (res.data.data.length > 0) {
            // Get the latest OR detail (last in the array) for remarks
            const latestOrDetail = res.data.data[res.data.data.length - 1];
            this.currentLiquidation.remarks = latestOrDetail.remarks || '';
          }
        } catch (error) {
          console.error('Error fetching existing OR details:', error);
          this.currentLiquidation.orDetails = [];
        }
      } else {
        // For new liquidations, initialize empty - component will add initial row
        this.currentLiquidation.orDetails = [];
      }

      this.dialogs.orDetails = true;
    },

    // For viewing only (read-only)
    async openViewOrDetails(row) {
      this.currentLiquidation = JSON.parse(JSON.stringify(row));
      // Fetch OR Details from backend
      if (row.id) {
        try {
          const config = getAuthConfig()
          const res = await api.get(`/api/barangay/disbursements/${row.id}/or-details`, config);
          
          const backendUrl = 'http://localhost:8000'; // Change if your backend runs elsewhere
          this.currentLiquidation.orDetails = res.data.data.map(or => ({
            orDate: or.or_date,
            orNumber: or.or_number,
            orAmount: or.or_amount,
            orImage: or.or_photo ? `${backendUrl}/storage/${or.or_photo}` : null,
            orPhotoUrl: or.or_photo ? `${backendUrl}/storage/${or.or_photo}` : null,
          }));

          // Set single remarks from the latest OR detail (most recent one)
          if (res.data.data.length > 0) {
            // Get the latest OR detail (last in the array) for remarks
            const latestOrDetail = res.data.data[res.data.data.length - 1];
            this.currentLiquidation.remarks = latestOrDetail.remarks || '';
          }
        } catch (error) {
          console.error('Error fetching OR details:', error);
          this.currentLiquidation.orDetails = [];
        }
      } else {
        this.currentLiquidation.orDetails = [];
      }
      this.dialogs.viewOrDetails = true;
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
        amount: '',
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
          
          // Refresh expense accounts to reflect updated balances
          await this.refreshExpenseAccountsWithBalances()
          
          // Refresh continuing appropriations to reflect updated balances
          await this.refreshContinuingAppropriations()
          
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

    async openEditDisbursement(row) {
      // Set loading state for this specific disbursement
      this.loadingEditDisbursement = row.id;

      // Set a timeout to clear loading state if something goes wrong
      const loadingTimeout = setTimeout(() => {
        if (this.loadingEditDisbursement === row.id) {
          this.loadingEditDisbursement = null;
        }
      }, 30000); // 30 second timeout

      try {
        // Ensure expense details are loaded for correct balance calculations
        if (this.expenseDetailsData.length === 0) {
          await this.fetchExpenseDetails()
        }

        // First fetch expense accounts to ensure we have the data for account names
        await this.fetchContinuingAppropriations();

        // Then fetch the disbursement with its expenses
        const disbursement = await this.fetchDisbursementById(row.id);
        
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
      } catch (error) {
        console.error('Error in openEditDisbursement:', error);
        throw error;
      } finally {
        clearTimeout(loadingTimeout);
        this.loadingEditDisbursement = null;
      }
    },

    async saveEditedDisbursement() {
      if (!this.currentItem) return

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

        const response = await api.put(`/api/barangay/continuing-disbursements/${this.currentItem.id}`, disbursementData, config)
        
        if (response.data?.status) {
          // Update the local disbursement
      const index = this.disbursements.findIndex((d) => d.id === this.currentItem.id)
      if (index !== -1) {
        this.disbursements[index] = {
          ...this.disbursements[index],
          ...this.forms.disbursement,
          expenses: [...this.expenses],
          dvAmount: this.totalExpensesAmount,
        }
          }
          
        this.closeDialog('editDisbursement')
          
          // Refresh disbursements list
          await this.fetchDisbursements()
          
          // Refresh expense accounts to reflect updated balances
          await this.refreshExpenseAccountsWithBalances()
          
          // Refresh continuing appropriations to reflect updated balances
          await this.refreshContinuingAppropriations()
          
          return { success: true, data: response.data.data }
        } else {
          return { success: false, error: response.data?.message || 'Failed to update disbursement' }
        }
      } catch (error) {
        console.error('Error updating disbursement:', error)
        return { 
          success: false, 
          error: error.response?.data?.message || error.message || 'Failed to update disbursement' 
        }
      } finally {
        this.savingDisbursement = false
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

    async uploadOrPhoto(file) {
      try {
        const config = getAuthConfig()
        const formData = new FormData();
        formData.append('photo', file, file.name);
        
        const response = await api.post('/api/barangay/disbursements/or-photo/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...config.headers,
          },
        });
        
        return { success: true, path: response.data.path };
      } catch (error) {
        console.error('Upload error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    // Liquidation Actions
    async saveOrDetails() {
      if (!this.currentLiquidation) {
        console.warn('currentLiquidation is not available')
        return { success: false, error: 'No liquidation data available' }
      }

      // Check if all OR details are complete (photos are optional)
      const allOrDetailsComplete = this.currentLiquidation.orDetails?.every(or =>
        or.orNumber && or.orAmount && or.orDate
      )

      if (!allOrDetailsComplete) {
        console.warn('Not all OR details are complete')
        return { success: false, error: 'Not all OR details are complete' }
      }

      try {
        const config = getAuthConfig()
        
        // Skip photo upload for now - use placeholder for all photos
        for (let i = 0; i < this.currentLiquidation.orDetails.length; i++) {
          const orDetail = this.currentLiquidation.orDetails[i]
          
          if (orDetail.orImageFile && !orDetail.serverPhotoPath) {
            console.log(`Skipping photo upload for OR ${orDetail.orNumber || i + 1} - using placeholder`);
            this.currentLiquidation.orDetails[i].serverPhotoPath = 'no-photo'
          }
        }
        
        // Calculate total actual expense from OR details
        const totalActualExpense = this.currentLiquidation.orDetails?.reduce(
          (sum, or) => sum + (parseFloat(or.orAmount) || 0), 0
        ) || 0

        // Prepare the payload for complete liquidation
        const payload = {
          orDetails: this.currentLiquidation.orDetails.map(or => ({
            id: or.id || null, // Include ID for existing OR details
            orNumber: or.orNumber,
            orAmount: or.orAmount,
            orDate: or.orDate || '',
            remarks: this.currentLiquidation.remarks || '', // Use single remarks for all OR details
            orPhotoUrl: or.serverPhotoPath || 'no-photo', // Use server path or placeholder
          })),
          liquidatedAmount: totalActualExpense,
          isPartial: false, // Flag to indicate complete liquidation
        }

        console.log('Sending liquidation payload:', JSON.stringify(payload, null, 2))
        console.log('OR Details being sent:', this.currentLiquidation.orDetails)
        const response = await api.post(`/api/barangay/disbursements/${this.currentLiquidation.id}/or-details`, payload, config)
        
        if (response.data?.status) {
          // Update the local disbursement
          const index = this.disbursements.findIndex((d) => d.id === this.currentLiquidation.id)
      if (index !== -1) {
            this.disbursements[index].status = response.data.data.status
            this.disbursements[index].liquidated_amount = response.data.data.liquidated_amount
          }
          
          this.closeDialog('orDetails')
          
          // Refresh disbursements list
          await this.fetchDisbursements()
          
          // Refresh expense accounts to reflect updated balances
          await this.refreshExpenseAccountsWithBalances()
          
          // Refresh continuing appropriations to reflect updated balances
          await this.refreshContinuingAppropriations()
          
          return { success: true, data: response.data.data }
        } else {
          return { success: false, error: response.data?.message || 'Failed to liquidate disbursement' }
        }
      } catch (error) {
        console.error('Error liquidating disbursement:', error)
        return { 
          success: false, 
          error: error.response?.data?.message || error.message || 'Failed to liquidate disbursement' 
        }
      }
    },

    async savePartialOrDetails() {
      if (!this.currentLiquidation) {
        console.warn('currentLiquidation is not available')
        return { success: false, error: 'No liquidation data available' }
      }

      // Check if all OR details are complete (photos are optional)
      const allOrDetailsComplete = this.currentLiquidation.orDetails?.every(or =>
        or.orNumber && or.orAmount && or.orDate
      )

      if (!allOrDetailsComplete) {
        console.warn('Not all OR details are complete')
        return { success: false, error: 'Not all OR details are complete' }
      }

      try {
        const config = getAuthConfig()
        
        // Skip photo upload for now - use placeholder for all photos
        for (let i = 0; i < this.currentLiquidation.orDetails.length; i++) {
          const orDetail = this.currentLiquidation.orDetails[i]
          
          if (orDetail.orImageFile && !orDetail.serverPhotoPath) {
            console.log(`Skipping photo upload for OR ${orDetail.orNumber || i + 1} - using placeholder`);
            this.currentLiquidation.orDetails[i].serverPhotoPath = 'no-photo'
          }
        }
        
        // Calculate total actual expense from OR details
        const totalActualExpense = this.currentLiquidation.orDetails?.reduce(
          (sum, or) => sum + (parseFloat(or.orAmount) || 0), 0
        ) || 0

        // Get today's date in DD/MM/YYYY format for fallback
        const today = new Date()
        const dd = String(today.getDate()).padStart(2, '0')
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const yyyy = today.getFullYear()
        const todayFormatted = `${dd}/${mm}/${yyyy}`

        // Prepare the payload for partial liquidation
        const payload = {
          orDetails: this.currentLiquidation.orDetails.map(or => {
            // Ensure orDate is in DD/MM/YYYY format
            let formattedDate = or.orDate || todayFormatted
            if (formattedDate && !formattedDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
              // If date is not in DD/MM/YYYY format, use today's date
              formattedDate = todayFormatted
            }
            
            return {
              id: or.id || null, // Include ID for existing OR details
              orNumber: or.orNumber,
              orAmount: or.orAmount,
              orDate: formattedDate, // Ensure proper DD/MM/YYYY format
              remarks: this.currentLiquidation.remarks || '', // Use single remarks for all OR details
              orPhotoUrl: or.serverPhotoPath || 'no-photo', // Use server path or placeholder
            }
          }),
          liquidatedAmount: totalActualExpense,
          isPartial: true, // Flag to indicate partial liquidation
        }

        console.log('Sending liquidation payload:', JSON.stringify(payload, null, 2))
        console.log('OR Details being sent:', this.currentLiquidation.orDetails)
        const response = await api.post(`/api/barangay/disbursements/${this.currentLiquidation.id}/or-details`, payload, config)
        
        if (response.data?.status) {
          // Update the local disbursement
          const index = this.disbursements.findIndex((d) => d.id === this.currentLiquidation.id)
          if (index !== -1) {
            this.disbursements[index].status = response.data.data.status
            this.disbursements[index].liquidated_amount = response.data.data.liquidated_amount
          }
          
          this.closeDialog('orDetails')
          
          // Refresh disbursements list
          await this.fetchDisbursements()
          
          // Refresh expense accounts to reflect updated balances
          await this.refreshExpenseAccountsWithBalances()
          
          // Refresh continuing appropriations to reflect updated balances
          await this.refreshContinuingAppropriations()
          
          return { success: true, data: response.data.data }
        } else {
          return { success: false, error: response.data?.message || 'Failed to save partial liquidation' }
        }
      } catch (error) {
        console.error('Error saving partial liquidation:', error)
        console.error('Error response:', error.response?.data)
        return { 
          success: false, 
          error: error.response?.data?.message || error.response?.data?.errors || error.message || 'Failed to save partial liquidation' 
        }
      }
    },

    addOrDetail() {
      if (!this.currentLiquidation.orDetails) {
        this.currentLiquidation.orDetails = []
      }

      // Get today's date in DD/MM/YYYY format
      const today = new Date()
      const dd = String(today.getDate()).padStart(2, '0')
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const yyyy = today.getFullYear()
      const todayFormatted = `${dd}/${mm}/${yyyy}`

      this.currentLiquidation.orDetails.push({
        orNumber: '',
        orAmount: '',
        orDate: todayFormatted, // Preload with today's date
        orImage: null,
        orImageFile: null,
        orPhotoUrl: null,
        serverPhotoPath: null,
        remarks: '',
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

    async deleteOrDetail(disbursementId, orDetailId) {
      try {
        const config = getAuthConfig()

        const response = await api.delete(`/api/barangay/disbursements/${disbursementId}/or-details/${orDetailId}`, config)

        if (response.data.status) {
          // Remove the OR detail from the local array
          if (this.currentLiquidation?.orDetails) {
            this.currentLiquidation.orDetails = this.currentLiquidation.orDetails.filter(
              or => or.id !== orDetailId
            )
          }

          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data.message }
        }
      } catch (error) {
        console.error('Failed to delete OR detail:', error)
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete OR detail'
        }
      }
    },

    uploadOrImageForLiquidation(files, index) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.currentLiquidation.orDetails[index].orImage = e.target.result
      }
      reader.readAsDataURL(files[0])
    }
  },
})
