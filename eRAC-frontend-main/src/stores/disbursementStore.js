// src/stores/disbursementStore.js
import { defineStore } from 'pinia'
import { useAppropriationStore } from './appropriationStore'
import { api } from 'src/boot/axios'
import { useAuthStore } from './auth'
import { useBankStore } from './bankStore'

const bankStore = useBankStore()

const getAuthConfig = () => {
  const authStore = useAuthStore()

  // Use admin token if admin is logged in, otherwise use regular token
  const token = authStore.admin ? authStore.adminToken : authStore.token

  if (!token) {
    console.warn('No authentication token found')
    throw new Error('Authentication required')
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
}

export const useDisbursementStore = defineStore('disbursement', {
  state: () => ({
    particulars: [
    ],

    // Main data collections
    expenseData: [], // This will hold our complete expense hierarchy
    expenses: [], // Initialize expenses array
    expenseSearch: '',
    currentItem: null,
    selectedBarangayId: null, // Added for admin barangay filtering
    selectedBudgetSource: 'all', // For budget source filtering (annual/supplemental)

    // Track expense details from tran_expense_details table for balance calculations
    expenseDetailsData: [], // Array to store all expense details from the database

    autoBookletID: null, // Automatically generated cheque booklet after selecting a bank
    autoCheque: null, // Automatically generated cheque number after selecting a bank
    selectedBank: null,
    selectedBooklet: null,
    selectedChequeNumber: null,
    disbursements: [], // <-- Remove static data, will be loaded from API


    // Track cancelled cheques in frontend
    cancelledCheques: new Set(), // Store cancelled cheque numbers

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
      void: false, // Added for void dialog
    },

    // Loading states
    loading: false,
    bankLoading: false,
    bookletLoading: false,
    expenseTypeLoading: false,
    isChequeCancel: false, // Loading state for cancelling cheque
    savingDisbursement: false, // New loading state for save button
    loadingEditDisbursement: null, // Loading state for edit disbursement (stores the ID of the disbursement being loaded)
    loadingDisbursements: false, // Loading state for fetching disbursements
    voidingDisbursement: false, // Loading state for voiding disbursement

    // Form data
    forms: {
      disbursement: {
        date: '',
        dvNumber: '',
        chequeNumber: '', // Changed from checkNumber to chequeNumber
        bank_id: '',
        payee: '',
        amount: '',
      },
      expense: {
        account: '',
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
      void: { // Added for void form
        disbursementId: null,
        remarks: '',
        requestedBy: null,
        requestedAt: null,
      },
    },

    // Pagination
    pagination: { rowsPerPage: 10 },

    // Test data for development - remove in production
    testDisbursements: [
      {
        id: 1,
        date: '2023-01-01',
        dvNumber: 'DV001',
        chequeNumber: 'CHQ000001',
        bank: 'Bank A',
        payee: 'John Doe',
        dvAmount: 1000.00,
        status: 'Unliquidated',
        aging: '30 days',
        expenses: [
          { id: 1, accountId: 1, accountName: 'Expense Class A > Expense Type A > Expense Item A', amount: 100.00, particular: 'Particular 1' },
          { id: 2, accountId: 2, accountName: 'Expense Class B > Expense Type B', amount: 200.00, particular: 'Particular 2' },
        ],
        orDetails: [
          { id: 1, orNumber: 'OR001', orAmount: 100.00, orDate: '2023-01-10', orImage: null, orPhotoUrl: null, serverPhotoPath: null, remarks: 'Remarks 1' },
          { id: 2, orNumber: 'OR002', orAmount: 200.00, orDate: '2023-01-15', orImage: null, orPhotoUrl: null, serverPhotoPath: null, remarks: 'Remarks 2' },
        ],
        actualExpense: 300.00,
        returnAmount: 700.00,
        remarks: null,
        void_requested_at: null,
        void_approved_at: null,
        rejection_remarks: null,
        void_rejected_at: null,
      },
      {
        id: 2,
        date: '2023-02-01',
        dvNumber: 'DV002',
        chequeNumber: 'CHQ000002',
        bank: 'Bank B',
        payee: 'Jane Smith',
        dvAmount: 2000.00,
        status: 'Liquidated',
        aging: '0 days',
        expenses: [
          { id: 3, accountId: 1, accountName: 'Expense Class A > Expense Type A > Expense Item A', amount: 50.00, particular: 'Particular 3' },
          { id: 4, accountId: 2, accountName: 'Expense Class B > Expense Type B', amount: 100.00, particular: 'Particular 4' },
        ],
        orDetails: [
          { id: 3, orNumber: 'OR003', orAmount: 50.00, orDate: '2023-02-05', orImage: null, orPhotoUrl: null, serverPhotoPath: null, remarks: 'Remarks 3' },
          { id: 4, orNumber: 'OR004', orAmount: 100.00, orDate: '2023-02-10', orImage: null, orPhotoUrl: null, serverPhotoPath: null, remarks: 'Remarks 4' },
        ],
        actualExpense: 150.00,
        returnAmount: 1850.00,
        remarks: null,
        void_requested_at: null,
        void_approved_at: null,
        rejection_remarks: null,
        void_rejected_at: null,
      },
    ],
  }),

  getters: {
    // Filtered expense accounts for search
    expenseAccounts(state) {
      if (!state.expenseData || state.expenseData.length === 0) {
        return []
      }

      // Use the new calculation that includes disbursement deductions
      return this.expenseAccountsWithDisbursements
    },

    // New getter that calculates remaining balance after disbursements
    expenseAccountsWithDisbursements(state) {
      if (!state.expenseData || state.expenseData.length === 0) {
        return []
      }

      const flattened = state.expenseData.reduce((acc, expenseClass) => {
        if (!expenseClass.children) {
          return acc
        }

        expenseClass.children.forEach((expenseType) => {
          // Check if this expense type has any expense items with balance > 0
          const hasExpenseItemsWithBalance = expenseType.children &&
            expenseType.children.some(item => item.amount && item.amount > 0);

          if (hasExpenseItemsWithBalance) {
            // If expense type has items with balance, only show the items (not the type)
            expenseType.children.forEach((expenseItem) => {
              if (expenseItem.amount && expenseItem.amount > 0) {
                // Calculate remaining balance by deducting disbursements
                const remainingBalance = this.calculateRemainingBalance(
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
                    budget_source: expenseItem.budget_source || expenseType.budget_source || expenseClass.budget_source || 'Annual Budget', // Add budget source information
                  }
                  acc.push(expenseItemEntry)
                }
              }
            })
          } else {
            // If expense type has no items with balance, show the type itself (if it has balance)
            if (expenseType.amount && expenseType.amount > 0) {
              // Calculate remaining balance by deducting disbursements
              const remainingBalance = this.calculateRemainingBalance(
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
                  balance: remainingBalance, // Use remaining balance instead of original amount
                  originalBalance: expenseType.amount, // Keep original amount for reference
                  expense_class_id: expenseClass.id,
                  expense_type_id: expenseType.id,
                  expense_item_id: null, // This identifies it as an expense type
                  budget_source: expenseType.budget_source || expenseClass.budget_source || 'Annual Budget', // Add budget source information
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
        { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
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
        format: (val) => {
          const num = Number(val) || 0
          return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        },
        align: 'left',
        sortable: true,
      },
      {
        name: 'aging',
        label: 'Aging',
        field: 'aging',
        align: 'center',
        sortable: true,
        format: (val, row) => {
          // Don't show aging for liquidated disbursements
          if (row.status === 'Liquidated') {
            return '-'
          }
          return val
        }
      },

      { name: 'action', label: 'Action', field: '', align: 'center' },
      { name: 'liquidate', label: 'Liquidate', field: '', align: 'center' },
       { name: 'remarks', label: 'Remarks', field: '', align: 'center' },
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
        format: (val) => {
          const num = Number(val) || 0
          return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        },
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
        name: 'budget_source',
        label: 'Budget Source',
        field: 'budget_source',
        align: 'center',
        sortable: true,
      },
      {
        name: 'balance',
        label: 'Balance',
        field: 'balance',
        format: (val) => {
          const num = Number(val) || 0
          return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        },
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
      const parseFlexibleDate = (value) => {
        if (!value) return null
        if (value instanceof Date) return value
        if (typeof value === 'string') {
          if (value.includes('/')) {
            const parts = value.split('/')
            if (parts[0].length === 2) {
              const [dd, mm, yyyy] = parts
              const d = new Date(`${yyyy}-${mm}-${dd}`)
              return isNaN(d.getTime()) ? null : d
            }
          }
          const d = new Date(value)
          return isNaN(d.getTime()) ? null : d
        }
        return null
      }

      const from = parseFlexibleDate(state.dateFrom)
      const to = parseFlexibleDate(state.dateTo)
      const fromStart = from ? new Date(from.setHours(0, 0, 0, 0)) : null
      const toEnd = to ? new Date(to.setHours(23, 59, 59, 999)) : null

      const query = (state.searchQuery || '').toLowerCase().trim()

      return state.disbursements.filter((d) => {
        // Search across key fields
        const haystacks = [d.payee, d.dvNumber, d.chequeNumber, d.bank, d.status]
        const matchesSearch = !query || haystacks.some((h) => String(h || '').toLowerCase().includes(query))

        // Inclusive date range
        const dt = parseFlexibleDate(d.date)
        const matchesDate = !fromStart && !toEnd
          ? true
          : (dt && (!fromStart || dt >= fromStart) && (!toEnd || dt <= toEnd))

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

      // Filter by budget source if selected - use description-based filtering like other stores
      if (state.selectedBudgetSource && state.selectedBudgetSource !== 'all') {
        base = base.filter(account => {
          // Check if account has budget_source field first, then fall back to description
          const budgetSource = account.budget_source || account.description || ''
          const budgetSourceLower = budgetSource.toLowerCase()

          if (state.selectedBudgetSource === 'annual') {
            return budgetSourceLower.includes('annual')
          } else if (state.selectedBudgetSource === 'supplemental') {
            return budgetSourceLower.includes('supplemental')
          }
          return true
        })
      }

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
    // Calculate remaining balance by deducting expenses from tran_expense_details table
    calculateRemainingBalance(expenseId, originalAmount, expenseLevel) {
      try {
        let totalDisbursed = 0;
        let totalReturned = 0;

        // Determine current editing disbursement id (if any)
        const currentDisbursementId = this.currentItem?.id ? String(this.currentItem.id) : null

        // Get all expense details from the database for this expense account
        if (this.expenseDetailsData && this.expenseDetailsData.length > 0) {
          // Only show first few expense details to avoid clutter
          const relevantDetails = this.expenseDetailsData.filter(ed => {
            const matchesLevel = (
              (expenseLevel === 'item' && String(ed.expense_item_id) === String(expenseId)) ||
              (expenseLevel === 'type' && String(ed.expense_type_id) === String(expenseId))
            )

            if (!matchesLevel) return false

            // When editing a disbursement, exclude its own existing expense details
            // This allows us to show the balance that would be available after saving
            if (currentDisbursementId && String(ed.disbursement_id) === currentDisbursementId) {
              return false
            }

            return true
          })

          relevantDetails.forEach(expenseDetail => {
            // Include expense details from other disbursements in the calculation
            totalDisbursed += parseFloat(expenseDetail.amount) || 0;
          });
        }

        // Add current frontend expenses for this account (includes the one being edited)
        if (this.expenses && this.expenses.length > 0) {
          const relevantFrontendExpenses = this.expenses.filter(expense => {
            if (expenseLevel === 'item') return String(expense.expense_item_id) === String(expenseId)
            if (expenseLevel === 'type') return String(expense.expense_type_id) === String(expenseId)
            return false
          })

          relevantFrontendExpenses.forEach(expense => {
            totalDisbursed += parseFloat(expense.amount) || 0;
          });
        }

        // Compute remaining balance
        const remainingBalance = Math.max(0, originalAmount - totalDisbursed + totalReturned);

        return remainingBalance;

      } catch (error) {
        console.error('Error calculating remaining balance:', error);
        return originalAmount; // Return original amount if calculation fails
      }
    },



    // Fetch all expense details from tran_expense_details table
    async fetchExpenseDetails() {
      try {
        const authStore = useAuthStore()

        // For admin users, we don't need expense details since they only view disbursements
        if (authStore.admin) {
          this.expenseDetailsData = []
          return
        }

        const token = authStore.token
        const endpoint = '/api/barangay/expense-details'
        const params = {}

        const response = await api.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          params,
        })

        if (response.data.status) {
          const newExpenseDetails = response.data.data || []

          // Only update if we actually got data
          if (newExpenseDetails.length > 0) {
            this.expenseDetailsData = newExpenseDetails
          }
        }
      } catch (error) {
        console.error('Failed to fetch expense details:', error)
        // Don't clear existing data on error
      }
    },

    // Refresh expense accounts with updated balances after disbursement changes
    async refreshExpenseAccountsWithBalances() {
      try {
        const authStore = useAuthStore()

        // For admin users, we don't need to refresh expense accounts since they only view disbursements
        if (authStore.admin) {
          return Promise.resolve()
        }

        // Force a refresh of the expense accounts to recalculate balances
        // This will trigger the getter to recalculate with current frontend expenses
        this.expenseData = [...this.expenseData]

        return Promise.resolve()

      } catch (error) {
        console.error('Failed to refresh expense accounts with balances:', error)
        return Promise.reject(error)
      }
    },

    // Set budget source filter
    setBudgetSourceFilter(budgetSource) {
      this.selectedBudgetSource = budgetSource
    },



    // Fetch expense hierarchy from appropriation store and accounts library store
    async fetchExpenseAccounts() {
      try {
        // Always fetch to ensure we get the latest data with current filters
        this.expenseTypeLoading = true

        const authStore = useAuthStore()

        // For admin users, we don't need expense hierarchy data since they only view disbursements
        if (authStore.admin) {
          this.expenseData = []
          return
        }

        // Fetch from appropriation store for budget allocations (only for barangay users)
        const appropriationStore = useAppropriationStore()

        // Pass budget source filter to appropriation store
        if (this.selectedBudgetSource && this.selectedBudgetSource !== 'all') {
          // Set the budget type filter in appropriation store
          appropriationStore.setSelectedBudgetType(this.selectedBudgetSource)
        }

        await appropriationStore.fetchExpenseHierarchy()
        this.expenseData = appropriationStore.allocations || []

        // Fetch expense types from accounts library store (non-blocking)
        this.fetchExpenseTypesFromAccountsLib().catch(error => {
          console.warn('Failed to fetch expense types:', error)
        })

      } catch (error) {
        console.error('Error fetching expense accounts:', error)
        this.expenseData = []
      } finally {
        this.expenseTypeLoading = false
      }
    },

    // Force refresh expense details when appropriations are updated
    async forceRefreshExpenseDetails() {
      try {
        const authStore = useAuthStore()

        // For admin users, we don't need to refresh expense details since they only view disbursements
        if (authStore.admin) {
          return Promise.resolve()
        }

        await this.fetchExpenseDetails()
        return Promise.resolve()
      } catch (error) {
        console.error('Failed to force refresh expense details:', error)
        return Promise.reject(error)
      }
    },

    // Background refresh method for expense accounts
    async refreshExpenseAccountsInBackground() {
      try {
        const authStore = useAuthStore()

        // For admin users, we don't need to refresh expense accounts since they only view disbursements
        if (authStore.admin) {
          return Promise.resolve()
        }

        // Fetch from appropriation store for budget allocations
        const appropriationStore = useAppropriationStore()
        await appropriationStore.fetchExpenseHierarchy()
        this.expenseData = appropriationStore.allocations || []

        // Only refresh expense details if we don't have any
        // This prevents excessive API calls
        if (!this.expenseDetailsData || this.expenseDetailsData.length === 0) {
          await this.fetchExpenseDetails()
        }

        // Fetch expense types from accounts library store (non-blocking)
        this.fetchExpenseTypesFromAccountsLib().catch(error => {
          console.warn('Failed to fetch expense types in background:', error)
        })

        return Promise.resolve()

      } catch (error) {
        console.warn('Failed to refresh expense accounts in background:', error)
        return Promise.reject(error)
      }
    },

    // New method to fetch expense types from accounts library store
    async fetchExpenseTypesFromAccountsLib() {
      try {
        this.expenseTypeLoading = true

        // Dynamically import to avoid circular dependencies
        const { useAccountsLibraryStore } = await import('./accountsLibstore')
        const accountsStore = useAccountsLibraryStore()

        // Skip accounts library fetches for admin context (uses different data flow)
        const authStore = useAuthStore()
        if (authStore.admin) {
          return
        }

        // Fetch years if not already loaded
        if (!accountsStore.years.length) {
          await accountsStore.fetchYears()
        }

        // Fetch expense classes for the current year
        if (accountsStore.selectedYear) {
          await accountsStore.fetchExpenseClasses(accountsStore.selectedYear)

          // Fetch expense types for all classes in parallel instead of sequentially
          const typePromises = accountsStore.expenseClasses.map(async (expenseClass) => {
            try {
              return await accountsStore.fetchExpenseTypes(expenseClass.id)
            } catch (error) {
              console.warn(`Failed to fetch types for class ${expenseClass.id}:`, error)
              return null
            }
          })

          await Promise.all(typePromises)

          // Integrate expense types into expenseData
          this.integrateExpenseTypesFromAccountsLib(accountsStore)
        } else {
          console.warn('No selected year in accounts library store')
        }
      } catch (error) {
        console.error('Error fetching expense types from accounts library:', error)
        throw error
      } finally {
        this.expenseTypeLoading = false
      }
    },

    // Integrate expense types from accounts library into expenseData
    integrateExpenseTypesFromAccountsLib(accountsStore) {
      try {
        const authStore = useAuthStore()

        // For admin users, we don't need to integrate expense types since they only view disbursements
        if (authStore.admin) {
          return
        }

        // If no expense types are available, return early
        if (!accountsStore.expenseTypes || accountsStore.expenseTypes.length === 0) {
          return
        }

        // Create a map of expense classes by name for easier lookup
        const classMap = new Map()
        this.expenseData.forEach(expenseClass => {
          classMap.set(expenseClass.name, expenseClass)
        })

        // Group expense types by class
        const typesByClass = new Map()
        accountsStore.expenseTypes.forEach(type => {
          const classId = type.expense_class_id
          if (!typesByClass.has(classId)) {
            typesByClass.set(classId, [])
          }
          typesByClass.get(classId).push(type)
        })

        // Integrate types into existing expenseData
        typesByClass.forEach((types, classId) => {
          const expenseClass = accountsStore.expenseClasses.find(c => c.id == classId)
          if (expenseClass) {

            // Find corresponding class in expenseData
            const existingClass = this.expenseData.find(c => c.name === expenseClass.name)

            if (existingClass) {
              // Add types to existing class
              if (!existingClass.children) {
                existingClass.children = []
              }

              types.forEach(type => {
                // Check if type already exists
                const existingType = existingClass.children.find(t => t.id === type.id)
                if (!existingType) {
                  existingClass.children.push({
                    id: type.id,
                    name: type.name,
                    expense_class_id: type.expense_class_id,
                    order: type.order || 0,
                    amount: 0, // Will be populated from appropriation data if available
                    children: [] // Initialize empty children array for items
                  })
                }
              })
            } else {
              // Create new class if it doesn't exist
              const newClass = {
                id: expenseClass.id,
                name: expenseClass.name,
                fiscal_year_id: expenseClass.fiscal_year_id,
                children: types.map(type => ({
                  id: type.id,
                  name: type.name,
                  expense_class_id: type.expense_class_id,
                  order: type.order || 0,
                  amount: 0,
                  children: []
                }))
              }
              this.expenseData.push(newClass)
            }
          }
        })

      } catch (error) {
        console.error('Error integrating expense types:', error)
        throw error
      }
    },

    async fetchDisbursements() {
      this.loadingDisbursements = true
      this.isCancelCheque = false
      try {

        const authStore = useAuthStore()

        // Use different endpoints and tokens for admin vs regular users
        const endpoint = authStore.admin ? "/api/admin/disbursements" : "/api/barangay/disbursements"
        const token = authStore.admin ? authStore.adminToken : authStore.token

        // Add barangay_id parameter for admin users if selected
        const params = {}
        if (authStore.admin) {
          const selectedBarangay = authStore.getSelectedBarangay()
          if (selectedBarangay) {
            params.barangay_id = selectedBarangay
          }
        }

        // Add current fiscal year filter to only show current year transactions
        const currentYear = new Date().getFullYear()
        params.year = currentYear

        // Fetch disbursements and particulars in parallel for faster loading
        const [disbursementsResponse, particularsResponse] = await Promise.all([
          api.get(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            params: params
          }),
          api.get(authStore.admin ? '/api/admin/particulars' : '/api/barangay/particulars', {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          })
        ])

        // Process particulars data
        const pData = Array.isArray(particularsResponse.data?.data) ? particularsResponse.data.data : (Array.isArray(particularsResponse.data) ? particularsResponse.data : [])
        this.particulars = pData.map(item => ({ label: item.particulars }))

        // Map backend fields to frontend fields if needed
        // Derive selected barangay name for admin context as fallback
        const selectedBarangayName = authStore.admin ? (authStore.getSelectedBarangayName && authStore.getSelectedBarangayName()) : null

        this.disbursements = (disbursementsResponse.data.data || []).map(d => {
          const disbursement = {
            id: d.id,
            date: d.date,
            dvNumber: d.dv_number,
            chequeNumber: d.cheque_number,
            bank: d.bank_name,
            payee: d.payee,
            dvAmount: d.dv_amount,
            status: d.status,
            remarks: d.remarks,
            rejection_remarks: d.rejection_remarks,
            // Normalize barangay name across possible backend shapes; fallback to selected name for admin context
            barangay_name: d.barangay_name || d.barangayName || (typeof d.barangay === 'string' ? d.barangay : (d.barangay?.name)) || selectedBarangayName || '',
            aging: calculateAging(d.date),
            expenses: d.expenses || [],
          }

          // Check if disbursement should be marked as stale based on aging
          if (shouldBeStale(disbursement)) {
            disbursement.status = 'Stale'
            // Also update the associated cheque status to stale
            this.updateChequeStatusToStale(disbursement.chequeNumber)
          }

          return disbursement
        })

        // Only fetch expense details if we don't have any (for admin users, this is not essential)
        if (!this.expenseDetailsData.length && !authStore.admin) {
          this.fetchExpenseDetails().catch(error => {
            console.warn('Failed to fetch expense details:', error)
          })
        }

      } catch (error) {
        console.error('Failed to fetch disbursements:', error)
        this.disbursements = []
      } finally {
        this.loadingDisbursements = false
      }
    },







    async fetchDisbursementById(id) {
      this.isChequeCancel=false
      try {
        const authStore = useAuthStore();
        // Use barangay user token for barangay endpoints
        const token = authStore.token;
        const response = await api.get(`/api/barangay/disbursements/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        // Get the disbursement data
        const disbursement = response.data.data;
        if (disbursement) {
          this.forms.disbursement = {
            date: formatDateForForm(disbursement.date),
            dvNumber: disbursement.dv_number,
            chequeNumber: disbursement.cheque_number,
            bank_id: disbursement.bank_id ? Number(disbursement.bank_id) : '',
            payee: disbursement.payee,
            // Add other fields as needed
          };

          function formatDateForForm(dateStr) {
            if (!dateStr) return '';
            if (dateStr.includes('-')) {
              // 'YYYY-MM-DD'
              const [yyyy, mm, dd] = dateStr.split('-');
              return `${dd}/${mm}/${yyyy}`;
            }
            else if (dateStr.includes('/')) {
              return dateStr;
            }
            return dateStr;
          }

          // Load existing expenses from the disbursement
          if (disbursement.expenses && disbursement.expenses.length > 0) {
            this.expenses = disbursement.expenses.map(expense => ({
              id: expense.id, // Use the actual database ID from tran_expense_details
              accountId: expense.accountId,
              accountName: expense.account_name || 'Unknown Account', // Use particular as fallback
              amount: expense.amount,
              particular: expense.particular,
              expense_class_id: expense.expense_class_id,
              expense_type_id: expense.expense_type_id,
              expense_item_id: expense.expense_item_id,
            }));
          } else {
            this.expenses = [];
          }

          this.currentItem = { ...disbursement }
          // Store the original DV amount for validation during editing
          this.lockedTotalAmount = parseFloat(disbursement.dv_amount) || 0
          this.dialogs.editDisbursement = true
        }
        return disbursement;
      } catch (error) {
        console.error('Failed to fetch disbursement:', error);
        return null;
      }
    },

    // Fetch disbursement data for viewing only (doesn't modify form data or open dialogs)
    async fetchDisbursementForView(id) {
      try {
        const authStore = useAuthStore();
        // Use barangay user token for barangay endpoints
        const token = authStore.token;
        const response = await api.get(`/api/barangay/disbursements/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        // Get the disbursement data
        const disbursement = response.data.data;
        console.log('Raw disbursement data from API:', disbursement);
        console.log('Raw expenses from API:', disbursement?.expenses);

        if (disbursement) {
          // Map expenses to ensure proper field names
          const mappedExpenses = (disbursement.expenses || []).map(expense => ({
            id: expense.id,
            accountName: expense.account_name  || 'Unknown Account',
            amount: expense.amount,
            particular: expense.particular,
            accountId: expense.accountId,
            expense_class_id: expense.expense_class_id,
            expense_type_id: expense.expense_type_id,
            expense_item_id: expense.expense_item_id,
          }));

          console.log('Mapped expenses for view:', mappedExpenses);

          return {
            id: disbursement.id,
            date: disbursement.date,
            dvNumber: disbursement.dv_number,
            chequeNumber: disbursement.cheque_number,
            bank_id: disbursement.bank_id,
            payee: disbursement.payee,
            dvAmount: disbursement.dv_amount,
            expenses: mappedExpenses,
          };
        }
        return null;
      } catch (error) {
        console.error('Error fetching disbursement for view:', error);
        return null;
      }
    },

    async liquidateDisbursement(id, liquidatedAmount) {
      try {
        const authStore = useAuthStore();
        const token = authStore.admin ? authStore.adminToken : authStore.token;
        const response = await api.patch(`/api/barangay/disbursements/${id}/liquidate`,
          { liquidated_amount: liquidatedAmount },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        );
        // Update the local disbursement
        const updated = response.data.data;
        const idx = this.disbursements.findIndex(d => d.id === id);
        if (idx !== -1) {
          this.disbursements[idx].status = updated.status;
          this.disbursements[idx].liquidated_amount = updated.liquidated_amount;
          this.disbursements[idx].aging = calculateAging(updated.date);
        }
        return true;
      } catch (error) {
        console.error('Failed to liquidate disbursement:', error);
        return false;
      }
    },

    async selectBooklet(range) {
      this.bookletLoading = true
      this.selectedBooklet = range
      this.selectedChequeNumber = null
      this.forms.disbursement.chequeNumber = null

    },

    // New method to handle bank selection
    async selectBank(bankId) {
      this.bankLoading = true
      this.forms.disbursement.bank_id = bankId
      this.forms.disbursement.chequeNumber = null
      this.autoBookletID = null
      this.autoCheque = null

      if (bankId) {
        try {

          // Fetch booklets for the selected bank
          const authStore = useAuthStore();
          const token = authStore.admin ? authStore.adminToken : authStore.token;
          const bankData = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          });
          const data = bankData.data.data || [];
          console.error('Fetched booklets data:', data);
          console.error('Fetched booklets data:', data.booklet_numb);
          console.error('Fetched booklets data:', data.cheque[0].cheque_number);

          this.autoBookletID = data.id || null
          this.autoCheque = data.cheque[0].cheque_number || null
          this.forms.disbursement.chequeNumber = 0


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

    // Dialog Actions
    async openDialog(dialogName) {
      if (dialogName === 'disbursement') {
        // Reset the form first to clear any previous data
        this.resetForm('disbursement')

        const today = new Date()
        const dd = String(today.getDate()).padStart(2, '0')
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const yyyy = today.getFullYear()

        this.forms.disbursement.date = `${dd}/${mm}/${yyyy}`
        try {
          const response = await api.get('/api/barangay/generate-dvnumber',getAuthConfig());
          const newDVNumber = response.data.data.dv_number || ''
          this.forms.disbursement.dvNumber= newDVNumber
        } catch (error) {
          console.error('Failed to generate new DV number:', error)
          this.forms.disbursement.dvNumber= ''
        }

        // Generate cheque number (separate logic)
        const lastCheque = this.disbursements.reduce(
          (max, d) => Math.max(max, parseInt(d.chequeNumber) || 0),
          0,
        )
        this.forms.disbursement.chequeNumber = String(lastCheque + 1).padStart(6, '0')

        // Load expense details data to ensure getNextExpenseId can access existing database IDs
        if (this.expenseDetailsData.length === 0) {
          await this.fetchExpenseDetails()
        }
      } else if (dialogName === 'expense') {
        // Only fetch expense accounts if not already loaded
        if (this.expenseData.length === 0) {
          await this.fetchExpenseAccounts()
        }
      }
      this.dialogs[dialogName] = true
    },

    closeDialog(dialogName) {
      if (dialogName === 'disbursement') {
        // If closing disbursement dialog, rollback all unsaved expense details
        this.rollbackUnsavedExpenses()
      }
      this.dialogs[dialogName] = false
    },

    // Rollback all unsaved expense details when disbursement is canceled
    rollbackUnsavedExpenses() {
      try {
        // Since expenses are now only stored in frontend, just clear the local array
        if (this.expenses.length > 0) {

          // Clear local expenses array
          this.expenses = []

          // Refresh expense account balances to show original amounts
          this.refreshExpenseAccountsWithBalances()

        }
      } catch (error) {
        console.error('Failed to rollback unsaved expenses:', error)
      }
    },

    async openOrDetailsDialog(item) {
      this.currentLiquidation = JSON.parse(JSON.stringify(item));

      // Fetch existing OR Details from backend if this is a partial liquidation
      if (item.id && item.status === 'Partial') {
        try {
          const res = await api.get(`/api/barangay/disbursements/${item.id}/or-details`);
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
              orImage: null,
              orPhotoUrl: or.or_photo ? `${backendUrl}/storage/${or.or_photo}` : null,
              serverPhotoPath: or.or_photo,
              isExisting: true, // Flag to identify existing OR details
            };
          });

          // Set single remarks from the latest OR detail (most recent one)
          if (res.data.data.length > 0) {
            // Get the latest OR detail (last in the array) for remarks
            const latestOrDetail = res.data.data[res.data.data.length - 1];
            this.currentLiquidation.remarks = latestOrDetail.remarks || '';
          }
        } catch {
          this.currentLiquidation.orDetails = [];
        }
      } else {
        // For new liquidations, initialize empty - component will add initial row
        this.currentLiquidation.orDetails = [];
      }

      this.dialogs.orDetails = true;
    },

    // In your disbursementStore.js actions
    // In your actions
    // For viewing only (read-only)
    async openViewOrDetails(row) {
      // Close any other dialogs that might be open
      this.dialogs.editDisbursement = false;
      this.dialogs.orDetails = false;
      this.dialogs.disbursement = false;

      this.currentLiquidation = JSON.parse(JSON.stringify(row));
      console.log('Opening view OR details for:', row);
      console.log('Row expenses:', row.expenses);

      // Initialize orDetails as empty array
      this.currentLiquidation.orDetails = [];

      // Ensure expenses are available
      if (!this.currentLiquidation.expenses || this.currentLiquidation.expenses.length === 0) {
        console.log('No expenses found in row, attempting to fetch disbursement details');
        try {
          const disbursement = await this.fetchDisbursementForView(row.id);
          if (disbursement && disbursement.expenses) {
            this.currentLiquidation.expenses = disbursement.expenses;
            console.log('Loaded expenses from fetchDisbursementForView:', disbursement.expenses);
          }
        } catch (error) {
          console.error('Error fetching disbursement details:', error);
        }
      }

      // Fetch OR Details from backend
      if (row.id) {
        try {
          // Get auth store instance
          const authStore = useAuthStore();

          // Validate auth store
          if (!authStore) {
            throw new Error('Auth store not available');
          }

          console.log('Auth store:', authStore);
          console.log('Is admin:', authStore.admin);
          console.log('Admin token:', authStore.adminToken);
          console.log('Regular token:', authStore.token);

          // Use different endpoints for admin vs regular users
          const endpoint = authStore.admin ? `/api/admin/disbursements/${row.id}/or-details` : `/api/barangay/disbursements/${row.id}/or-details`
          const token = authStore.admin ? authStore.adminToken : authStore.token

          if (!token) {
            throw new Error('No authentication token available');
          }

          console.log('Fetching OR details from:', endpoint);
          const res = await api.get(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            }
          });

          console.log('OR Details response:', res.data);
          console.log('Response data structure:', res.data);
          console.log('Data array:', res.data.data);

          // Check if we have data and it's an array
          if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
            const backendUrl = 'http://localhost:8000'; // Change if your backend runs elsewhere
            this.currentLiquidation.orDetails = res.data.data.map((or, index) => {
              console.log(`Processing OR detail ${index}:`, or);

              // Convert YYYY-MM-DD to DD/MM/YYYY format
              let formattedDate = '';
              if (or.or_date) {
                const dateParts = or.or_date.split('-');
                if (dateParts.length === 3) {
                  formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                }
              }

              const mappedOr = {
                id: or.id,
                index: index,
                orDate: formattedDate || or.or_date,
                orNumber: or.or_number,
                orAmount: or.or_amount,
                orImage: or.or_photo ? `${backendUrl}/storage/${or.or_photo}` : null,
                orPhotoUrl: or.or_photo ? `${backendUrl}/storage/${or.or_photo}` : null,
                serverPhotoPath: or.or_photo,
                remarks: or.remarks || '',
                isExisting: true // Flag to identify existing OR details
              };

              console.log(`Mapped OR detail ${index}:`, mappedOr);
              return mappedOr;
            });

            console.log('Final mapped OR Details:', this.currentLiquidation.orDetails);

            // Set single remarks from the latest OR detail (most recent one)
            if (res.data.data.length > 0) {
              // Get the latest OR detail (last in the array) for remarks
              const latestOrDetail = res.data.data[res.data.data.length - 1];
              this.currentLiquidation.remarks = latestOrDetail.remarks || '';
            }
          } else {
            console.log('No OR details found in response or empty array');
            this.currentLiquidation.orDetails = [];
          }
        } catch (error) {
          console.error('Error fetching OR details:', error);
          console.error('Error details:', error.response?.data);
          this.currentLiquidation.orDetails = [];
        }
      } else {
        console.log('No row ID provided, initializing empty orDetails');
        this.currentLiquidation.orDetails = [];
      }

      console.log('Final currentLiquidation.orDetails:', this.currentLiquidation.orDetails);
      this.dialogs.viewOrDetails = true;
    },

    // Update openExpenseDetail to match your current structure
    openExpenseDetail(item) {
      // Create a proper account display string
      let accountDisplay = item.account
      if (item.expenseType) {
        accountDisplay += ` > ${item.expenseType}`
      }
      if (item.expenseItem) {
        accountDisplay += ` > ${item.expenseItem}`
      }

      // Use the balance that's already calculated and displayed in the selection table
      // DO NOT recalculate - this prevents double counting
      const availableBalance = item.balance || 0

      this.forms.expense = {
        account: accountDisplay,
        accountId: item.id,
        balance: availableBalance, // Use the pre-calculated balance from selection table
        originalBalance: item.originalBalance || item.balance || 0, // Keep original balance for reference
        particulars: '',
        amount: '',
        disbursementId: this.currentItem?.id || null,
        // Store additional information for backend
        expense_class_id: item.expense_class_id,
        expense_type_id: item.expense_type_id,
        expense_item_id: item.expense_item_id,
      }
      this.dialogs.expense = false
      this.dialogs.expenseDetail = true
    },

    // Method to open expense detail for editing existing expenses
    openExpenseDetailForEdit(existingExpense) {
      // Derive original allocated amount and expense level (type or item)
      let originalAllocatedAmount = 0
      let expenseLevel = 'type'
      let balanceKeyId = null

      try {
        // Traverse expense hierarchy to find the matching node
        for (const expenseClass of this.expenseData || []) {
          if (!expenseClass?.children) continue
          for (const expenseType of expenseClass.children || []) {
            // If item-level
            if (existingExpense.expense_item_id) {
              if (expenseType?.children) {
                const matchedItem = (expenseType.children || []).find(ci => String(ci.id) === String(existingExpense.expense_item_id))
                if (matchedItem) {
                  originalAllocatedAmount = parseFloat(matchedItem.amount) || 0
                  expenseLevel = 'item'
                  balanceKeyId = matchedItem.id
                  throw new Error('__found')
                }
              }
            } else {
              // Type-level
              if (String(expenseType.id) === String(existingExpense.expense_type_id)) {
                originalAllocatedAmount = parseFloat(expenseType.amount) || 0
                expenseLevel = 'type'
                balanceKeyId = expenseType.id
                throw new Error('__found')
              }
            }
          }
        }
      } catch (e) {
        if (e?.message !== '__found') {
          // Silent fallthrough, keep defaults
        }
      }

      // Fallbacks if not found in hierarchy
      if (!Number.isFinite(originalAllocatedAmount)) originalAllocatedAmount = 0

      // Calculate remaining balance from DB-backed expense details
      let remainingBalance = this.calculateRemainingBalance(
        balanceKeyId || existingExpense.accountId,
        originalAllocatedAmount,
        expenseLevel
      )

      // If the current expense is already persisted in DB for this disbursement and account,
      // add it back to compute the editable available balance
      let includeCurrentAmountBack = false
      try {
        includeCurrentAmountBack = (this.expenseDetailsData || []).some(ed => {
          const sameDisbursement = String(ed.disbursement_id) === String(this.currentItem?.id)
          if (!sameDisbursement) return false
          const isItemLevel = Boolean(existingExpense.expense_item_id)
          if (isItemLevel) {
            return String(ed.expense_item_id) === String(existingExpense.expense_item_id)
          }
          // Type-level: ensure it's a type record (no item) and matches type id
          return (ed.expense_item_id == null) && String(ed.expense_type_id) === String(existingExpense.expense_type_id)
        })
      } catch {
        includeCurrentAmountBack = false
      }

      const availableBalance = remainingBalance + (includeCurrentAmountBack ? (parseFloat(existingExpense.amount) || 0) : 0)

      this.forms.expense = {
        account: existingExpense.accountName,
        accountId: existingExpense.accountId,
        balance: availableBalance,
        originalBalance: originalAllocatedAmount || existingExpense.amount,
        particulars: existingExpense.particular,
        amount: existingExpense.amount,
        disbursementId: this.currentItem?.id || null,
        // Store additional information for backend
        expense_class_id: existingExpense.expense_class_id,
        expense_type_id: existingExpense.expense_type_id,
        expense_item_id: existingExpense.expense_item_id,
        // Flag to indicate this is an edit operation
        isEditing: true,
        editingExpenseId: existingExpense.id, // Use the database ID for editing
      }
      this.dialogs.expenseDetail = true
    },
    // Disbursement Actions
    // Update your saveDisbursement action in the Pinia store
    async saveDisbursement() {
      this.savingDisbursement = true; // Start loading
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        // Validate required fields
        if (!this.forms.disbursement.bank_id) {
          throw new Error('Please select a bank')
        }
        if (!this.forms.disbursement.payee) {
          throw new Error('Please enter a payee')
        }
        if (this.expenses.length === 0) {
          throw new Error('Please add at least one expense')
        }

        // Prepare the payload
        const payload = {
          date: this.forms.disbursement.date,
          dv_number: this.forms.disbursement.dvNumber,
          cheque_number: this.autoCheque ,
          cheque_booklet: this.autoBookletID,
          bank_id: this.forms.disbursement.bank_id,
          payee: this.forms.disbursement.payee,
          dv_amount: this.totalExpensesAmount,
          expenses: this.expenses.map(expense => ({
            accountId: expense.accountId,
            amount: expense.amount,
            particular: expense.particular,
            expense_class_id: expense.expense_class_id,
            expense_type_id: expense.expense_type_id,
            expense_item_id: expense.expense_item_id,
          }))
        }

        // Add barangay_id for admin users if selected
        if (authStore.admin) {
          const selectedBarangay = authStore.getSelectedBarangay()
          if (selectedBarangay) {
            payload.barangay_id = selectedBarangay
          }
        }

        // Use different endpoints for admin vs regular users
        const endpoint = authStore.admin ? "/api/admin/disbursements/create" : "/api/barangay/disbursements"
        const response = await api.post(endpoint, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        // The backend now automatically creates expense details, so we don't need to do it manually
        // Close the dialog immediately to avoid showing cleared fields briefly
        this.dialogs.disbursement = false

        // Defer clearing form and regenerating fields until after dialog hide animation
        setTimeout(async () => {
          this.resetForm('disbursement')
          this.expenses = []

          const today = new Date()
          const dd = String(today.getDate()).padStart(2, '0')
          const mm = String(today.getMonth() + 1).padStart(2, '0')
          const yyyy = today.getFullYear()

          this.forms.disbursement.date = `${dd}/${mm}/${yyyy}`

          try {
            const response = await api.get('/api/barangay/generate-dvnumber', getAuthConfig());
            const newDVNumber = response.data.data.dv_number || ''
            this.forms.disbursement.dvNumber = newDVNumber
          } catch (error) {
            console.error('Failed to generate new DV number:', error)
            this.forms.disbursement.dvNumber = ''
          }
        }, 350) // match Quasar default transition

        // Do data refreshes in background (non-blocking)
        this.refreshDataInBackground().catch(error => {
          console.warn('Background refresh failed:', error)
        })

        await bankStore.fetchBanks()

        return { success: true, data: response.data.data }
      } catch (error) {
        console.error('Failed to save disbursement:', error)

        // Log the specific validation errors if available
        if (error.response?.data?.errors) {
          console.error('Validation errors:', error.response.data.errors)
        }

        return {
          success: false,
          error: error.response?.data?.message || error.message || 'Failed to save disbursement'
        }
      } finally {
        this.savingDisbursement = false; // End loading
      }
    },

    // New method to refresh data in background without blocking UI
    async refreshDataInBackground() {
      try {
        const authStore = useAuthStore()

        // Refresh disbursements list first (most important)
        await this.fetchDisbursements()

        // Only refresh expense-related data for barangay users (admin users don't need this)
        if (!authStore.admin) {
          // Refresh expense details for balance calculations
          await this.fetchExpenseDetails()

          // Refresh expense accounts with updated balances
          this.refreshExpenseAccountsWithBalances()

          // Force a refresh of the expense accounts to update the selection table
          this.expenseData = [] // Clear to force refresh
          await this.fetchExpenseAccounts()
        }

      } catch (error) {
        console.error('Background refresh failed:', error)
        // Don't show error to user since this is background operation
      }
    },


          // Generate next available incremental ID for expenses
    getNextExpenseId() {
      // Get all existing IDs from current expenses array
      const currentExpenseIds = this.expenses.map(exp => exp.id)

      // Get all existing IDs from database expense details
      const databaseExpenseIds = this.expenseDetailsData.map(exp => exp.id)

      // Combine all IDs and filter out negative ones
      const allIds = [...currentExpenseIds, ...databaseExpenseIds].filter(id => id > 0)

      if (allIds.length === 0) {
        // No existing IDs found, start from 1
        return 1
      }

      // Find the highest ID and add 1
      const highestId = Math.max(...allIds)
      return highestId + 1
    },

    // Helper method to get expense account name from IDs
    getExpenseAccountName(expenseClassId, expenseTypeId, expenseItemId) {
      try {
        let accountName = '';

        // Find expense class - convert IDs to strings for comparison
        const expenseClass = this.expenseData.find(ec => String(ec.id) === String(expenseClassId));
        if (expenseClass) {
          accountName = expenseClass.name;

          // Find expense type
          if (expenseTypeId && expenseClass.children) {
            const expenseType = expenseClass.children.find(et => String(et.id) === String(expenseTypeId));
            if (expenseType) {
              accountName += ` > ${expenseType.name}`;

              // Find expense item
              if (expenseItemId && expenseType.children) {
                const expenseItem = expenseType.children.find(ei => String(ei.id) === String(expenseItemId));
                if (expenseItem) {
                  accountName += ` > ${expenseItem.name}`;
                }
              }
            }
          }
        }

        return accountName || 'Unknown Account';
      } catch (error) {
        console.error('Error getting expense account name:', error);
        return 'Unknown Account';
      }
    },

    // Expense Actions
    async saveExpense() {
      const amount = Number(this.forms.expense.amount) || 0
      const particulars = this.forms.expense.particulars?.trim() || ''

      // Validate particulars
      if (!particulars) {
        throw new Error('Particulars is required')
      }

      // Validate amount
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0')
      }

      // Get the current available balance (this is the balance shown in the add expense dialog)
      const currentAvailableBalance = this.forms.expense.balance || 0

      // Validate that the requested amount doesn't exceed the current available balance
      if (amount > currentAvailableBalance) {
        throw new Error(`Amount exceeds available balance. Available: ₱${currentAvailableBalance.toLocaleString()}, Requested: ₱${amount.toLocaleString()}`)
      }

      // Check if we're in edit mode and validate against locked total amount
      if (this.lockedTotalAmount !== null) {
        // Calculate what the total would be after this change
        const currentTotal = this.expenses.reduce((sum, exp) => {
          if (this.forms.expense.isEditing && exp.id === this.forms.expense.editingExpenseId) {
            // Exclude the expense being edited from current total
            return sum
          }
          return sum + (parseFloat(exp.amount) || 0)
        }, 0)

        const newTotal = currentTotal + amount
        if(!this.isChequeCancel){
          if (newTotal > this.lockedTotalAmount) {
            throw new Error(`Total amount cannot exceed the original DV amount of ₱${this.lockedTotalAmount.toLocaleString()}. Current total would be ₱${newTotal.toLocaleString()}`)
          }
        }
      }

      // Check if this is an edit operation
      if (this.forms.expense.isEditing && this.forms.expense.editingExpenseId) {
        // Update existing expense - keep the existing database ID
        const existingExpenseIndex = this.expenses.findIndex(exp => exp.id === this.forms.expense.editingExpenseId)
        if (existingExpenseIndex !== -1) {
          this.expenses[existingExpenseIndex] = {
            ...this.expenses[existingExpenseIndex],
            amount: amount,
            particular: particulars,
          }
          this.expenses = [...this.expenses]
        }
      } else {
        // Create new expense object - keep in frontend only until disbursement is saved
        const expense = {
          id: this.getNextExpenseId(), // Generate new frontend ID for new expenses
          accountId: this.forms.expense.accountId,
          accountName: this.forms.expense.account,
          amount: amount,
          particular: particulars,
          expense_class_id: this.forms.expense.expense_class_id,
          expense_type_id: this.forms.expense.expense_type_id,
          expense_item_id: this.forms.expense.expense_item_id,
          // Note: No dbId until disbursement is saved
        }

        // Add to local expenses array (frontend only)
        this.expenses.push(expense)
        this.expenses = [...this.expenses]
      }

      // Refresh expense account balances to show updated amounts
      this.refreshExpenseAccountsWithBalances()

      this.closeDialog('expenseDetail')
      this.resetForm('expense')

    },
    // Similarly update editExpense and deleteExpense
    editExpense(row) {
      const index = this.expenses.findIndex((e) => e.id === row.id)
      if (index !== -1) {
        this.expenses[index] = row
        this.forms.disbursement.amount = this.totalExpensesAmount

        // Refresh expense account balances to show updated amounts
        this.refreshExpenseAccountsWithBalances()
      }
    },

    async deleteExpense(id) {
      const expense = this.expenses.find(e => e.id === id)

      if (expense) {
        // Remove from local array (frontend only)
        this.expenses = this.expenses.filter((e) => e.id !== id)
        this.forms.disbursement.amount = this.totalExpensesAmount

        // Refresh expense account balances to show updated amounts
        this.refreshExpenseAccountsWithBalances()
      }
    },

    // Alias functions for EditDisbursement component
    editItem(row) {
      this.isChequeCancel=false
      this.openExpenseDetailForEdit(row)
    },

    deleteItem(row) {
      this.deleteExpense(row.id)
    },

    // Helper function to format date
    formatDateForForm(dateStr) {
      if (!dateStr) return '';
      if (dateStr.includes('-')) {
        // 'YYYY-MM-DD'
        const [yyyy, mm, dd] = dateStr.split('-');
        return `${dd}/${mm}/${yyyy}`;
      }
      else if (dateStr.includes('/')) {
        return dateStr;
      }
      return dateStr;
    },

    // Form Actions
    resetForm(formName) {
      if (formName === 'disbursement') {
        this.forms.disbursement = {
          date: '',
          dvNumber: '',
          chequeNumber: '',
          bank_id: '',
          payee: '',
          amount: '',
        }
        this.expenses = []
        // Reset bank-related selections
        this.autoBookletID = null
        this.autoCheque = null
      } else if (formName === 'expense') {
        this.forms.expense = {
          account: '',
          balance: 0,
          particulars: '',
          disbursementId: null,
          isEditing: false,
          editingExpenseId: null,
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
        await this.fetchExpenseAccounts();

        // Then fetch the disbursement with its expenses
        await this.fetchDisbursementById(row.id);

        // Now update the account names for existing expenses using the loaded expense data
        if (this.expenses.length > 0) {
          this.expenses = this.expenses.map(expense => {
            const accountName = this.getExpenseAccountName(expense.expense_class_id, expense.expense_type_id, expense.expense_item_id);
            return {
              ...expense,
              accountName: accountName
            };
          });
        }

        // Refresh balances to reflect current editing context (exclude current disbursement's DB expenses)
        this.refreshExpenseAccountsWithBalances()

      } catch (error) {
        console.error('Error in openEditDisbursement:', error);
        // Re-throw the error so the calling component can handle it
        throw error;
      } finally {
        // Clear the timeout
        clearTimeout(loadingTimeout);
        // Always clear loading state when done (either success or error)
        this.loadingEditDisbursement = null;
      }
    },


    async saveEditedDisbursement() {

      if (!this.currentItem) return

      if (!this.expenses || this.expenses.length === 0) {
        return {
          success: false,
          error: 'At least one expense is required to save the disbursement'
        }
      }

      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        // Ensure we have up-to-date expense details
        if (!this.expenseDetailsData || this.expenseDetailsData.length === 0) {
          await this.fetchExpenseDetails()
        }

        // Existing DB ids for this disbursement
        const existingIdsForCurrent = new Set(
          (this.expenseDetailsData || [])
            .filter(ed => String(ed.disbursement_id) === String(this.currentItem.id))
            .map(ed => Number(ed.id))
        )

        // Pre-create new expenses so we get real DB ids for the update delete-keep logic
        for (const exp of this.expenses) {
          const numericId = Number(exp.id)
          const isExisting = Number.isFinite(numericId) && existingIdsForCurrent.has(numericId)
          if (!isExisting) {
            // Create on backend
            const createBody = {
              amount: exp.amount,
              particulars: exp.particular,
              disbursement_id: this.currentItem.id,
              expense_class_id: exp.expense_class_id || null,
              expense_type_id: exp.expense_type_id || null,
              expense_item_id: exp.expense_item_id || null,
            }
            const createRes = await api.post('/api/barangay/expense-details', createBody, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            })
            const created = createRes.data?.data
            if (created && created.id) {
              exp.id = Number(created.id)
              existingIdsForCurrent.add(exp.id)
            }
          }
        }


        // Prepare the payload with ids for all expenses so backend keeps them
        const payload = {
          cancel: this.isChequeCancel,
          bank_id: this.forms.disbursement.bank_id,
          cheque_number: this.autoCheque,
          payee: this.forms.disbursement.payee,

          date: this.forms.disbursement.date,
          dv_number: this.forms.disbursement.dvNumber,
          dv_amount: !this.cancelledCheques
            ? (this.lockedTotalAmount || 0)
            : this.totalExpensesAmount,
          expenses: this.expenses.map(expense => ({
            id: Number(expense.id) || undefined,
            accountId: expense.accountId,
            amount: expense.amount,
            particular: expense.particular,
            expense_class_id: expense.expense_class_id,
            expense_type_id: expense.expense_type_id,
            expense_item_id: expense.expense_item_id,
          }))
        }

        const response = await api.put(`/api/barangay/disbursements/${this.currentItem.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        // Refresh lists/details
        await this.fetchDisbursements()
        await this.fetchExpenseDetails()
        this.refreshExpenseAccountsWithBalances()
        this.refreshExpenseAccountsInBackground()

        this.closeDialog('editDisbursement')
        this.resetEditDisbursement()

        return { success: true, data: response.data.data }
      } catch (error) {
        console.error('Failed to update disbursement:', error)
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to update disbursement'
        }
      }
    },

    resetEditDisbursement() {
      this.currentItem = null
      this.expenses = []
      this.lockedTotalAmount = null
      this.selectedBank = null
      this.autoBookletID = null
      this.autoCheque = null
      // Reset form data
      this.forms.disbursement = {
        date: '',
        dvNumber: '',
        chequeNumber: '',
        bank_id: '',
        payee: '',
        amount: '',
      }
    },

    uploadOrImage(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.currentLiquidation.orImage = e.target.result
      }
      reader.readAsDataURL(file)
    },

    // Liquidation Actions
    async saveOrDetails() {
      if (!this.currentLiquidation) {
        console.warn('currentLiquidation is not available')
        return
      }

      // Check if all OR details are complete
      const allOrDetailsComplete = this.currentLiquidation.orDetails?.every(or =>
        or.orNumber && or.orAmount && or.orDate && or.orPhotoUrl
      )

      if (!allOrDetailsComplete) {
        console.warn('Not all OR details are complete')
        return
      }

      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        // Calculate total actual expense from OR details
        const totalActualExpense = this.currentLiquidation.orDetails?.reduce(
          (sum, or) => sum + (parseFloat(or.orAmount) || 0), 0
        ) || 0

        // Prepare the payload
        const payload = {
          orDetails: this.currentLiquidation.orDetails.map(or => ({
            id: or.id || null, // Include ID for existing OR details
            orNumber: or.orNumber,
            orAmount: or.orAmount,
            orDate: or.orDate || '',
            remarks: this.currentLiquidation.remarks || '', // Use single remarks for all OR details
            orPhotoUrl: or.serverPhotoPath || '', // Use server path only
          })),
          liquidatedAmount: totalActualExpense,
        }

        const response = await api.post(`/api/barangay/disbursements/${this.currentLiquidation.id}/or-details`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        // Refresh the disbursements list
        await this.fetchDisbursements()

        // Close the dialog after saving
        this.closeDialog('orDetails')

        return { success: true, data: response.data.data }
      } catch (error) {
        console.error('Failed to save OR details:', error)
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to save OR details'
        }
      }
    },

    async savePartialOrDetails() {
      if (!this.currentLiquidation) {
        console.warn('currentLiquidation is not available')
        return
      }

      // Check if all OR details are complete
      const allOrDetailsComplete = this.currentLiquidation.orDetails?.every(or =>
        or.orNumber && or.orAmount && or.orDate && or.orPhotoUrl
      )

      if (!allOrDetailsComplete) {
        console.warn('Not all OR details are complete')
        return
      }

      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        // Calculate total actual expense from OR details
        const totalActualExpense = this.currentLiquidation.orDetails?.reduce(
          (sum, or) => sum + (parseFloat(or.orAmount) || 0), 0
        ) || 0

        // Prepare the payload for partial liquidation
        const payload = {
          orDetails: this.currentLiquidation.orDetails.map(or => ({
            id: or.id || null, // Include ID for existing OR details
            orNumber: or.orNumber,
            orAmount: or.orAmount,
            orDate: or.orDate || '',
            remarks: this.currentLiquidation.remarks || '', // Use single remarks for all OR details
            orPhotoUrl: or.serverPhotoPath || '', // Use server path only
          })),
          liquidatedAmount: totalActualExpense,
          isPartial: true, // Flag to indicate partial liquidation
        }

        const response = await api.post(`/api/barangay/disbursements/${this.currentLiquidation.id}/or-details`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        // Refresh the disbursements list
        await this.fetchDisbursements()

        // Close the dialog after saving
        this.closeDialog('orDetails')

        return { success: true, data: response.data.data }
      } catch (error) {
        console.error('Failed to save partial OR details:', error)
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to save partial OR details'
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
        orDate: todayFormatted,
        orImage: null,
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

    uploadOrImageForLiquidation(files, index) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.currentLiquidation.orDetails[index].orImage = e.target.result
      }
      reader.readAsDataURL(files[0])
    },

    async uploadOrPhoto(file) {
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        const formData = new FormData();
        formData.append('photo', file, file.name);
        const response = await api.post('/api/barangay/disbursements/or-photo/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        });
        return { success: true, path: response.data.path };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    async deleteOrPhoto(path) {
      try {
        await api.delete('/api/barangay/disbursements/or-photo/delete', { data: { path } });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    async deleteOrDetail(disbursementId, orDetailId) {
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        const response = await api.delete(`/api/barangay/disbursements/${disbursementId}/or-details/${orDetailId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

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

    async deleteDisbursement(id) {
      try {
        const authStore = useAuthStore();
        const token = authStore.admin ? authStore.adminToken : authStore.token;

        const response = await api.delete(`/api/barangay/disbursements/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (response.data.status) {
          // Remove the disbursement from the local array
          this.disbursements = this.disbursements.filter(d => d.id !== id);

          // Refresh expense details for balance calculations
          await this.fetchExpenseDetails();

          // Refresh expense accounts with updated balances
          this.refreshExpenseAccountsWithBalances();

          // Refresh expense accounts in background to ensure latest data
          this.refreshExpenseAccountsInBackground();

          return { success: true, message: response.data.message };
        } else {
          return { success: false, message: response.data.message };
        }
      } catch (error) {
        console.error('Failed to delete disbursement:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete disbursement'
        };
      }
    },

    // Load test data for development - remove in production
    loadTestData() {
      this.disbursements = [...this.testDisbursements];
    },

    // Void-related methods
    openVoidDialog(disbursement) {
      this.forms.void.disbursementId = disbursement.id;
      this.forms.void.remarks = '';
      this.forms.void.requestedBy = null;
      this.forms.void.requestedAt = null;
      this.dialogs.void = true;
    },

    closeVoidDialog() {
      this.dialogs.void = false;
      this.forms.void.disbursementId = null;
      this.forms.void.remarks = '';
      this.forms.void.requestedBy = null;
      this.forms.void.requestedAt = null;
    },

    async submitVoidRequest() {
      if (!this.forms.void.remarks || this.forms.void.remarks.trim() === '') {
        throw new Error('Remarks are required for void requests');
      }

      this.voidingDisbursement = true;
      try {
        const authStore = useAuthStore();
        const token = authStore.admin ? authStore.adminToken : authStore.token;

        const response = await api.post(`/api/barangay/disbursements/${this.forms.void.disbursementId}/void-request`, {
          remarks: this.forms.void.remarks.trim(),
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (response.data.status) {
          // Update the disbursement status in the local array
          const disbursementIndex = this.disbursements.findIndex(d => d.id === this.forms.void.disbursementId);
          if (disbursementIndex !== -1) {
            this.disbursements[disbursementIndex].status = 'Void Requested';
            this.disbursements[disbursementIndex].remarks = this.forms.void.remarks.trim();
            this.disbursements[disbursementIndex].void_requested_at = new Date().toISOString();
          }

          this.closeVoidDialog();
          return { success: true, message: response.data.message };
        } else {
          return { success: false, message: response.data.message };
        }
      } catch (error) {
        console.error('Failed to submit void request:', error);
        throw new Error(error.response?.data?.message || 'Failed to submit void request');
      } finally {
        this.voidingDisbursement = false;
      }
    },

    async approveVoidRequest(disbursementId) {
      try {
        const authStore = useAuthStore();
        // Use barangay user token for barangay endpoints
        const token = authStore.token;

        const response = await api.post(`/api/barangay/disbursements/${disbursementId}/void-approve`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (response.data.status) {
          // Update the disbursement status in the local array
          const disbursementIndex = this.disbursements.findIndex(d => d.id === disbursementId);
          if (disbursementIndex !== -1) {
            this.disbursements[disbursementIndex].status = 'Voided';
            this.disbursements[disbursementIndex].void_approved_at = new Date().toISOString();
          }

          // Refresh bank library data to reflect voided cheque status
          try {
            const { useBankStore } = await import('./bankStore');
            const bankStore = useBankStore();
            await bankStore.fetchBanks();
          } catch (bankError) {
            console.warn('Failed to refresh bank data after void approval:', bankError);
            // Don't throw error here as the main operation succeeded
          }

          return { success: true, message: response.data.message };
        } else {
          return { success: false, message: response.data.message };
        }
      } catch (error) {
        console.error('Failed to approve void request:', error);
        throw new Error(error.response?.data?.message || 'Failed to approve void request');
      }
    },

    async rejectVoidRequest(disbursementId, rejectionRemarks) {
      try {
        const authStore = useAuthStore();
        // Use barangay user token for barangay endpoints
        const token = authStore.token;

        const response = await api.post(`/api/barangay/disbursements/${disbursementId}/void-reject`, {
          remarks: rejectionRemarks,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (response.data.status) {
          // Update the disbursement status in the local array
          const disbursementIndex = this.disbursements.findIndex(d => d.id === disbursementId);
          if (disbursementIndex !== -1) {
            this.disbursements[disbursementIndex].status = 'Unliquidated';
            this.disbursements[disbursementIndex].rejection_remarks = rejectionRemarks;
            this.disbursements[disbursementIndex].void_rejected_at = new Date().toISOString();
          }

          return { success: true, message: response.data.message };
        } else {
          return { success: false, message: response.data.message };
        }
      } catch (error) {
        console.error('Failed to reject void request:', error);
        throw new Error(error.response?.data?.message || 'Failed to reject void request');
      }
    },

    // Direct void method for captains and SK chairpersons (no request needed)
    async voidDisbursementDirectly(disbursementId, remarks) {
      if (!remarks || remarks.trim() === '') {
        throw new Error('Remarks are required for voiding disbursements');
      }

      this.voidingDisbursement = true;
      try {
        const authStore = useAuthStore();
        const token = authStore.admin ? authStore.adminToken : authStore.token;

        const response = await api.post(`/api/barangay/disbursements/${disbursementId}/void-direct`, {
          remarks: remarks.trim(),
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (response.data.status) {
          // Update the disbursement status in the local array
          const disbursementIndex = this.disbursements.findIndex(d => d.id === disbursementId);
          if (disbursementIndex !== -1) {
            this.disbursements[disbursementIndex].status = 'Voided';
            this.disbursements[disbursementIndex].remarks = remarks.trim();
            this.disbursements[disbursementIndex].voided_at = new Date().toISOString();
          }

          // Refresh bank library data to reflect voided cheque status
          try {
            const { useBankStore } = await import('./bankStore');
            const bankStore = useBankStore();
            await bankStore.fetchBanks();
          } catch (bankError) {
            console.warn('Failed to refresh bank data after direct void:', bankError);
            // Don't throw error here as the main operation succeeded
          }

          return { success: true, message: response.data.message };
        } else {
          return { success: false, message: response.data.message };
        }
      } catch (error) {
        console.error('Failed to void disbursement directly:', error);
        throw new Error(error.response?.data?.message || 'Failed to void disbursement');
      } finally {
        this.voidingDisbursement = false;
      }
    },

    // Method to get an available cheque number for a specific bank
    async getAvailableCheque(bankId) {
      try {
        // Load cancelled cheques from localStorage
        this.loadCancelledCheques()

        const config = this.getAuthConfig()
        const response = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, config)

        const data = response.data.data || []
        if (data.cheque && data.cheque.length > 0) {
          // Filter out cancelled cheques (both from backend status and frontend tracking)
          const availableCheques = data.cheque.filter(cheque => {
            const chequeNumber = cheque.cheque_number || cheque.chequeNo
            const backendStatus = (cheque.status || '').toLowerCase()
            const isFrontendCancelled = this.cancelledCheques.has(chequeNumber)

            return backendStatus !== 'cancelled' && !isFrontendCancelled
          })

          if (availableCheques.length > 0) {
            const availableCheque = availableCheques[0]
            return {
              success: true,
              chequeNumber: availableCheque.cheque_number || availableCheque.chequeNo,
              message: 'Available cheque found'
            }
          } else {
            return {
              success: false,
              message: 'No available cheques found for this bank (all cheques are cancelled or used)'
            }
          }
        } else {
          return {
            success: false,
            message: 'No available cheques found for this bank'
          }
        }
      } catch (error) {
        console.error('Failed to get available cheque:', error)
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to get available cheque'
        }
      }
    },

    // Method to cancel a cheque and mark it as cancelled in the frontend
    // async cancelCheque(disbursementId, chequeNumber) {
    //   try {
    //     // Add the cheque to the cancelled cheques set
    //     this.cancelledCheques.add(chequeNumber)

    //     // Store in localStorage for persistence across sessions
    //     localStorage.setItem('cancelledCheques', JSON.stringify(Array.from(this.cancelledCheques)))

    //     return {
    //       success: true,
    //       message: 'Cheque cancelled successfully'
    //     }
    //   } catch (error) {
    //     console.error('Failed to cancel cheque:', error)
    //     return {
    //       success: false,
    //       message: error.message || 'Failed to cancel cheque'
    //     }
    //   }
    // },

    // Method to update disbursement status to stale in the backend
    async updateDisbursementToStale(disbursementId) {
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        const response = await api.patch(`/api/barangay/disbursements/${disbursementId}/mark-stale`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        if (response.data.status) {
          // Update the local disbursement status
          const disbursementIndex = this.disbursements.findIndex(d => d.id === disbursementId)
          if (disbursementIndex !== -1) {
            this.disbursements[disbursementIndex].status = 'Stale'
          }

          // Also update the associated cheque status to stale
          try {
            await this.updateChequeToStale(disbursementId)
          } catch (chequeError) {
            console.warn('Failed to update cheque status to stale:', chequeError)
            // Don't fail the entire operation if cheque update fails
          }

          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data.message }
        }
      } catch (error) {
        console.error('Failed to update disbursement to stale:', error)
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update disbursement to stale'
        }
      }
    },

    // Method to update cheque status to stale (frontend only)
    async updateChequeToStale(disbursementId) {
      try {
        // Find the disbursement to get the cheque number
        const disbursement = this.disbursements.find(d => d.id === disbursementId)
        if (!disbursement || !disbursement.chequeNumber) {
          return { success: false, message: 'Disbursement or cheque number not found' }
        }

        // Update the cheque status in the bank store
        this.updateChequeStatusToStale(disbursement.chequeNumber)

        return { success: true, message: 'Cheque marked as stale' }
      } catch (error) {
        console.error('Failed to update cheque to stale:', error)
        return {
          success: false,
          message: error.message || 'Failed to update cheque to stale'
        }
      }
    },

    // Helper method to update cheque status to stale in bank store
    updateChequeStatusToStale(chequeNumber) {
      try {
        // Import bank store and update cheque status
        import('./bankStore').then(({ useBankStore }) => {
          const bankStore = useBankStore()

          // Find the bank that contains this cheque and update its status
          for (const bank of bankStore.banks) {
            if (bank.cheques) {
              const cheque = bank.cheques.find(c => c.chequeNo === chequeNumber)
              if (cheque) {
                cheque.status = 'stale'
                break
              }
            }
          }
        }).catch(error => {
          console.warn('Failed to update cheque status in bank store:', error)
        })
      } catch (error) {
        console.warn('Failed to update cheque status:', error)
      }
    },

    // Method to check and update stale disbursements
    async checkAndUpdateStaleDisbursements() {
      try {
        const staleDisbursements = this.disbursements.filter(disbursement =>
          shouldBeStale(disbursement) && disbursement.status !== 'Stale'
        )

        if (staleDisbursements.length === 0) {
          return { success: true, message: 'No disbursements need to be marked as stale' }
        }

        // Update each stale disbursement and its cheque in the backend
        const updatePromises = staleDisbursements.map(async disbursement => {
          const disbursementResult = await this.updateDisbursementToStale(disbursement.id)
          const chequeResult = await this.updateChequeToStale(disbursement.id)
          return {
            disbursement: disbursementResult,
            cheque: chequeResult,
            success: disbursementResult.success && chequeResult.success
          }
        })

        const results = await Promise.allSettled(updatePromises)
        const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length
        const failed = results.filter(result => result.status === 'rejected' || !result.value.success).length

        // Refresh bank data to reflect cheque status changes
        if (successful > 0) {
          try {
            const { useBankStore } = await import('./bankStore')
            const bankStore = useBankStore()
            await bankStore.fetchBanks()
          } catch (bankError) {
            console.warn('Failed to refresh bank data after stale update:', bankError)
            // Don't fail the entire operation if bank refresh fails
          }
        }

        return {
          success: true,
          message: `Updated ${successful} disbursements and their cheques to stale status. ${failed} failed.`,
          updated: successful,
          failed: failed
        }
      } catch (error) {
        console.error('Failed to check and update stale disbursements:', error)
        return {
          success: false,
          message: error.message || 'Failed to check and update stale disbursements'
        }
      }
    }
  }
})

function calculateAging(dateString) {
  // Accepts 'YYYY-MM-DD' or 'YYYY/MM/DD'
  if (!dateString) return '0 days';
  const parts = dateString.includes('-') ? dateString.split('-') : dateString.split('/');
  let yyyy, mm, dd;
  if (parts[0].length === 4) {
    // 'YYYY-MM-DD'
    [yyyy, mm, dd] = parts;
  } else {
    // 'DD/MM/YYYY'
    [dd, mm, yyyy] = parts;
  }
  const disbDate = new Date(`${yyyy}-${mm}-${dd}`);
  const today = new Date();
  const diffTime = today - disbDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} days`;
}

function calculateAgingDays(dateString) {
  // Helper function to get just the number of days for stale checking
  if (!dateString) return 0;
  const parts = dateString.includes('-') ? dateString.split('-') : dateString.split('/');
  let yyyy, mm, dd;
  if (parts[0].length === 4) {
    // 'YYYY-MM-DD'
    [yyyy, mm, dd] = parts;
  } else {
    // 'DD/MM/YYYY'
    [dd, mm, yyyy] = parts;
  }
  const disbDate = new Date(`${yyyy}-${mm}-${dd}`);
  const today = new Date();
  const diffTime = today - disbDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function shouldBeStale(disbursement) {
  // Check if disbursement should be marked as stale based on aging
  if (!disbursement.date) return false;

  // Don't mark as stale if already liquidated, voided, or already stale
  if (['Liquidated', 'Voided', 'Stale'].includes(disbursement.status)) {
    return false;
  }

  const agingDays = calculateAgingDays(disbursement.date);
  return agingDays >= 180;
}
