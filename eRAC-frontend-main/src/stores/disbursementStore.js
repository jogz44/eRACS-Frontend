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

const getExpenseChequeNumber = (expense) =>
  expense?.cheque_number ||
  expense?.chequeNumber ||
  expense?.check_number ||
  expense?.checkNumber ||
  expense?.cheque_no ||
  expense?.chequeNo ||
  ''

const getExpenseChequeDate = (expense, disbursement = {}) =>
  expense?.cheque_date ||
  expense?.chequeDate ||
  expense?.check_date ||
  expense?.checkDate ||
  disbursement?.cheque_date ||
  ''
export const useDisbursementStore = defineStore('disbursement', {
  state: () => ({
    particulars: [],
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
    bankCheques: [],
    cachedDeductionsByDisbursement: {},
    cachedBankChequesByDisbursement: {},
    disbursements: [], // Remove static data, will be loaded from API
    pendingChequeNumbers: [], // cheque numbers assigned in current session but not yet saved

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
      editRequest: false, // Added for edit request dialog
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
    requestingEdit: false, // Loading state for edit request
    editActionLoading: false, // Loading state for edit approval/rejection actions

    //REMOVE THE UNNECESARRY BANK_CHEQUES FIELDS AND ADD NEW ARRAY ALSO THE DEDUCTIONS ARRAY
    // Form data
    forms: {
      disbursement: {
        date: '',
        dvNumber: '',
        // chequeNumber: '',
        // bank_id: '',
        payee: '',
        payee2: '',
        amount: '',
        bankCheques: [],
      },
      expense: {
        account: '',
        balance: 0,
        bank_id: '',
        // cheque_number: '',
        bankLoading: false,
        fund: '',
        taxpayerType: '',
        taxType: '',
        particulars: '',
        amount: '',
        disbursementId: null,
        deductions: [],
        totalDeduction: 0,
        netAmount: 0,
      },
      orDetails: {
        receivedFrom: '',
        address: '',
        paymentFor: '',
        receivedBy: '',
      },
      void: {
        // Added for void form
        disbursementId: null,
        remarks: '',
        requestedBy: null,
        requestedAt: null,
      },
      edit: {
        // Added for edit request form
        disbursementId: null,
        remarks: '',
        requestedBy: null,
        requestedAt: null,
      },
    },

    lastDisbursementFetchKey: null,
    // Pagination
    pagination: { rowsPerPage: 10 },
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
          const hasExpenseItemsWithBalance =
            expenseType.children &&
            expenseType.children.some((item) => item.amount && item.amount > 0)

          if (hasExpenseItemsWithBalance) {
            // If expense type has items with balance, show items and their subitems
            expenseType.children.forEach((expenseItem) => {
              if (expenseItem.amount && expenseItem.amount > 0) {
                // Check if this item has subitems with allocations
                const hasSubitemsWithBalance =
                  expenseItem.children &&
                  expenseItem.children.some((subItem) => subItem.amount && subItem.amount > 0)

                if (hasSubitemsWithBalance) {
                  // Show subitems that have allocations
                  expenseItem.children.forEach((expenseSubItem) => {
                    if (expenseSubItem.amount && expenseSubItem.amount > 0) {
                      // Calculate remaining balance by deducting disbursements
                      const remainingBalance = this.calculateRemainingBalance(
                        expenseSubItem.id,
                        expenseSubItem.amount,
                        'subitem',
                      )

                      if (remainingBalance > 0) {
                        const expenseSubItemEntry = {
                          id: expenseSubItem.id,
                          account: expenseClass.name,
                          expenseType: expenseType.name,
                          expenseItem: expenseItem.name,
                          expenseSubItem: expenseSubItem.name,
                          balance: remainingBalance,
                          originalBalance: expenseSubItem.amount,
                          expense_class_id: expenseClass.id,
                          expense_type_id: expenseType.id,
                          expense_item_id: expenseItem.id,
                          expense_sub_item_id: expenseSubItem.id,
                          budget_source:
                            expenseSubItem.budget_source ||
                            expenseItem.budget_source ||
                            expenseType.budget_source ||
                            expenseClass.budget_source ||
                            'Annual Budget',
                        }
                        acc.push(expenseSubItemEntry)
                      }
                    }
                  })
                } else {
                  // Show the item itself if it has no subitems with allocations
                  const remainingBalance = this.calculateRemainingBalance(
                    expenseItem.id,
                    expenseItem.amount,
                    'item',
                  )

                  if (remainingBalance > 0) {
                    const expenseItemEntry = {
                      id: expenseItem.id,
                      account: expenseClass.name,
                      expenseType: expenseType.name,
                      expenseItem: expenseItem.name,
                      expenseSubItem: null,
                      balance: remainingBalance,
                      originalBalance: expenseItem.amount,
                      expense_class_id: expenseClass.id,
                      expense_type_id: expenseType.id,
                      expense_item_id: expenseItem.id,
                      expense_sub_item_id: null,
                      budget_source:
                        expenseItem.budget_source ||
                        expenseType.budget_source ||
                        expenseClass.budget_source ||
                        'Annual Budget',
                    }
                    acc.push(expenseItemEntry)
                  }
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
                'type',
              )

              if (remainingBalance > 0) {
                const expenseTypeEntry = {
                  id: expenseType.id,
                  account: expenseClass.name,
                  expenseType: expenseType.name,
                  expenseItem: null,
                  expenseSubItem: null,
                  balance: remainingBalance,
                  originalBalance: expenseType.amount,
                  expense_class_id: expenseClass.id,
                  expense_type_id: expenseType.id,
                  expense_item_id: null,
                  expense_sub_item_id: null,
                  budget_source:
                    expenseType.budget_source || expenseClass.budget_source || 'Annual Budget',
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
      {
        name: 'id',
        label: 'ID',
        field: 'id',
        align: 'left',
        sortable: true,
        classes: 'hidden',
        headerClasses: 'hidden',
      },
      { name: 'dvNumber', label: 'DV Number', field: 'dvNumber', align: 'left', sortable: true },
      { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
      { name: 'payee', label: 'Payee', field: 'payee', align: 'left', sortable: true },
      {
        name: 'particular',
        label: 'Particular',
        field: 'particular',
        align: 'left',
        sortable: true,
      },

      {
        name: 'bank_cheque',
        label: 'Bank / Cheque No.',
        field: 'bank',
        align: 'left',
        sortable: true,
      },
      {
        name: 'netAmount',
        label: 'Net Amount',
        field: 'netAmount',
        format: (val) => {
          const num = Number(val) || 0
          return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        },
        align: 'left',
        sortable: true,
      },
      { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
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
        },
      },
      // { name: 'action', label: 'Action', field: '', align: 'center' },
      {
        name: 'action',
        label: 'Action',
        field: '',
        align: 'center',
        style: 'width: 90px; min-width: 90px',
      },
      { name: 'remarks', label: 'Remarks', field: '', align: 'center' },
      { name: 'liquidate', label: '', field: '', align: 'center' },
      { name: 'print', label: 'Print Cheque', field: '', align: 'center' },
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
        name: 'bank',
        label: 'Bank',
        field: (row) => row.bankName || row.bank || '-',
        align: 'left',
        sortable: true,
      },
      {
        name: 'chequeNumber',
        label: 'Cheque Number',
        field: (row) => row.chequeNumber || row.cheque_number || '-',
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
        name: 'expenseSubItem',
        label: 'Sub Item',
        field: 'expenseSubItem',
        align: 'left',
        sortable: true,
        format: (val) => val || '-',
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
        const matchesSearch =
          !query ||
          haystacks.some((h) =>
            String(h || '')
              .toLowerCase()
              .includes(query),
          )

        // Inclusive date range
        const dt = parseFlexibleDate(d.date)
        const matchesDate =
          !fromStart && !toEnd
            ? true
            : dt && (!fromStart || dt >= fromStart) && (!toEnd || dt <= toEnd)

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
      const addedIds = new Set((state.expenses || []).map((e) => String(e.accountId)))

      let base = this.expenseAccounts.filter((item) => !addedIds.has(String(item.id)))

      // Filter by budget source if selected - use description-based filtering like other stores
      if (state.selectedBudgetSource && state.selectedBudgetSource !== 'all') {
        base = base.filter((account) => {
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
        let totalDisbursed = 0
        let totalReturned = 0

        // Determine current editing disbursement id (if any)
        const currentDisbursementId = this.currentItem?.id ? String(this.currentItem.id) : null

        // Get all expense details from the database for this expense account
        if (this.expenseDetailsData && this.expenseDetailsData.length > 0) {
          // Only show first few expense details to avoid clutter
          const relevantDetails = this.expenseDetailsData.filter((ed) => {
            const matchesLevel =
              (expenseLevel === 'subitem' &&
                String(ed.expense_sub_item_id) === String(expenseId)) ||
              (expenseLevel === 'item' && String(ed.expense_item_id) === String(expenseId)) ||
              (expenseLevel === 'type' && String(ed.expense_type_id) === String(expenseId))

            if (!matchesLevel) return false

            // When editing a disbursement, exclude its own existing expense details
            // This allows us to show the balance that would be available after saving
            if (currentDisbursementId && String(ed.disbursement_id) === currentDisbursementId) {
              return false
            }

            return true
          })

          relevantDetails.forEach((expenseDetail) => {
            // Include expense details from other disbursements in the calculation
            totalDisbursed += parseFloat(expenseDetail.amount) || 0
          })
        }

        // Add current frontend expenses for this account (includes the one being edited)
        if (this.expenses && this.expenses.length > 0) {
          const relevantFrontendExpenses = this.expenses.filter((expense) => {
            if (expenseLevel === 'subitem')
              return String(expense.expense_sub_item_id) === String(expenseId)
            if (expenseLevel === 'item')
              return String(expense.expense_item_id) === String(expenseId)
            if (expenseLevel === 'type')
              return String(expense.expense_type_id) === String(expenseId)
            return false
          })

          relevantFrontendExpenses.forEach((expense) => {
            totalDisbursed += parseFloat(expense.amount) || 0
          })
        }

        // Compute remaining balance
        const remainingBalance = Math.max(0, originalAmount - totalDisbursed + totalReturned)

        return remainingBalance
      } catch (error) {
        console.error('Error calculating remaining balance:', error)
        return originalAmount // Return original amount if calculation fails
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

    async selectBankForExpense(bankId) {
      this.forms.expense.bank_id = bankId
      this.forms.expense.cheque_number = ''
      if (!bankId) return
      this.forms.expense.bankLoading = true
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token
        const res = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        const cheques = res.data?.data?.cheque || []
        // Skip cheques already assigned in this session
        const next = cheques.find((c) => !this.pendingChequeNumbers.includes(c.cheque_number))
        this.forms.expense.cheque_number = next?.cheque_number || ''
      } catch (e) {
        console.error('Expense bank selection error:', e)
        this.forms.expense.bank_id = null
        this.forms.expense.cheque_number = ''
      } finally {
        this.forms.expense.bankLoading = false
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

        // Fetch updated expense details to get latest disbursement history
        await this.fetchExpenseDetails()

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

    generateLocalDvNumber() {
      const now = new Date()
      const yy = String(now.getFullYear()).slice(-2)
      const mm = String(now.getMonth() + 1).padStart(2, '0')

      // Collect every existing DV number regardless of month/year prefix,
      // pull out only the trailing sequence number, and find the highest one.
      // const allDvNumbers = (this.disbursements || [])
      //   .map(d => d.dvNumber)
      //   .filter(Boolean)

      let maxSeq = 0
      ;(this.disbursements || [])
        .map((d) => d.dvNumber)
        .filter(Boolean)
        .forEach((dv) => {
          // Handles DV-26-05-1005 and any DV-*-*-NNNN pattern
          const match = dv.match(/^DV-\d+-\d+-(\d+)$/)
          if (match) {
            const seq = parseInt(match[1], 10) || 0
            if (seq > maxSeq) maxSeq = seq
          }
        })

      return `DV-${yy}-${mm}-${String(maxSeq + 1).padStart(4, '0')}`
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

        // Fetch expense details for balance calculations
        await this.fetchExpenseDetails()

        // Fetch expense types from accounts library store (non-blocking)
        this.fetchExpenseTypesFromAccountsLib().catch((error) => {
          console.warn('Failed to fetch expense types:', error)
        })
      } catch (error) {
        console.error('Error fetching expense accounts:', error)
        this.expenseData = []
      } finally {
        this.expenseTypeLoading = false
      }
    },

    // Special method for fetching expense accounts for reimbursements (works for both admin and regular users)
    async fetchExpenseAccountsForReimbursement() {
      try {
        this.expenseTypeLoading = true
        const authStore = useAuthStore()

        if (authStore.admin) {
          // For admin users, fetch from accounts library to get expense structure
          await this.fetchExpenseTypesFromAccountsLib()

          // Create mock expense data structure for admin users
          // This allows them to see expense accounts for reimbursement purposes
          this.expenseData = this.createMockExpenseDataForAdmin()
        } else {
          // For regular users, use the normal flow
          const appropriationStore = useAppropriationStore()

          if (this.selectedBudgetSource && this.selectedBudgetSource !== 'all') {
            appropriationStore.setSelectedBudgetType(this.selectedBudgetSource)
          }

          await appropriationStore.fetchExpenseHierarchy()
          this.expenseData = appropriationStore.allocations || []
        }

        // Fetch expense types from accounts library store (non-blocking)
        this.fetchExpenseTypesFromAccountsLib().catch((error) => {
          console.warn('Failed to fetch expense types:', error)
        })
      } catch (error) {
        console.error('Error fetching expense accounts for reimbursement:', error)
        this.expenseData = []
      } finally {
        this.expenseTypeLoading = false
      }
    },

    // Get default booklet ID for a bank
    async getDefaultBookletId(bankId) {
      try {
        // Try multiple API endpoints to find booklets
        let booklets = []

        // Try the main booklets endpoint
        try {
          const response = await api.get(
            `/api/barangay/banks/${bankId}/booklets`,
            this.getAuthConfig(),
          )
          booklets = response.data.data || []
        } catch (error) {
          console.warn('Main booklets endpoint failed:', error.message)
        }

        // If no booklets found, try alternative endpoint
        if (booklets.length === 0) {
          try {
            const response = await api.get(
              `/api/barangay/booklets?bank_id=${bankId}`,
              this.getAuthConfig(),
            )
            booklets = response.data.data || []
          } catch (error) {
            console.warn('Alternative booklets endpoint failed:', error.message)
          }
        }

        // If still no booklets, try to get any booklet for this bank
        if (booklets.length === 0) {
          try {
            const response = await api.get('/api/barangay/booklets', this.getAuthConfig())
            const allBooklets = response.data.data || []
            booklets = allBooklets.filter((booklet) => booklet.bank_id === bankId)
          } catch (error) {
            console.warn('All booklets endpoint failed:', error.message)
          }
        }

        if (booklets.length > 0) {
          const selectedBooklet = booklets[0]
          return selectedBooklet.id
        }

        // Last resort: try to find any booklet in the system
        try {
          const response = await api.get('/api/barangay/booklets', this.getAuthConfig())
          const allBooklets = response.data.data || []
          if (allBooklets.length > 0) {
            return allBooklets[0].id
          }
        } catch (error) {
          console.warn('Failed to get any booklets:', error.message)
        }

        // Ultimate fallback
        console.warn('No booklets found anywhere, using default ID 1')
        return 1
      } catch (error) {
        console.error('Complete failure in getDefaultBookletId:', error)
        return 1
      }
    },

    // Create mock expense data structure for admin users
    createMockExpenseDataForAdmin() {
      if (!this.expenseTypes || this.expenseTypes.length === 0) {
        return []
      }

      // Group expense types by class
      const groupedByClass = {}
      this.expenseTypes.forEach((type) => {
        if (!groupedByClass[type.expense_class_id]) {
          groupedByClass[type.expense_class_id] = {
            id: type.expense_class_id,
            name: type.expense_class_name,
            children: [],
          }
        }

        groupedByClass[type.expense_class_id].children.push({
          id: type.expense_type_id,
          name: type.expense_type_name,
          children: [
            {
              id: type.expense_item_id,
              name: type.expense_item_name,
              amount: 1000000, // Mock amount for admin users
              budget_source: 'Annual Budget',
            },
          ],
        })
      })

      const result = Object.values(groupedByClass)

      return result
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
        this.fetchExpenseTypesFromAccountsLib().catch((error) => {
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

    addDeductionRow(row) {
      if (!this.forms.expense.deductions) {
        this.forms.expense.deductions = []
      }

      this.forms.expense.deductions = [...this.forms.expense.deductions, row]
      this._recalcDeductionTotals()
    },

    removeDeductionRow(id) {
      this.forms.expense.deductions = (this.forms.expense.deductions || []).filter(
        (r) => r.id !== id,
      )
      this._recalcDeductionTotals()
    },

    _recalcDeductionTotals() {
      const total = (this.forms.expense.deductions || []).reduce(
        (sum, r) => sum + (parseFloat(r.deduction_amount ?? r.amount) || 0),
        0,
      )
      this.forms.expense.totalDeduction = Math.round(total * 100) / 100

      const gross = parseFloat(this.forms.expense.amount) || 0
      this.forms.expense.netAmount = Math.max(0, Math.round((gross - total) * 100) / 100)
    },

    normalizeDeductionRow(deduction = {}) {
      const codeDetails =
        deduction.deduction_code || deduction.deductionCode || deduction.deduction_code_detail || {}
      const deductionAmount =
        Number(deduction.deduction_amount ?? deduction.deductionAmount ?? deduction.amount) || 0
      const grossVatInc =
        Number(deduction.gross_vat_inc ?? deduction.grossVatInc ?? deduction.gross_amount) || 0
      const rawNetAmount = deduction.net_amount ?? deduction.netAmount
      const netAmount =
        rawNetAmount !== null && rawNetAmount !== undefined && rawNetAmount !== ''
          ? Number(rawNetAmount) || 0
          : Math.max(0, grossVatInc - deductionAmount)
      const deductionTypeName =
        deduction.deductionTypeName ??
        deduction.deduction_type_name ??
        deduction.deduction_type ??
        codeDetails.deduction_type_name ??
        codeDetails.deduction_type ??
        codeDetails.deductionType ??
        ''
      const normalizedDeductionType = String(deductionTypeName || '').toLowerCase()
      const taxTypeName =
        deduction.taxTypeName ??
        deduction.tax_type_name ??
        deduction.tax_type ??
        codeDetails.tax_type_name ??
        codeDetails.tax_type ??
        codeDetails.taxType ??
        ''

      return {
        id: deduction.id,
        deduction_code_id: deduction.deduction_code_id ?? codeDetails.id ?? null,
        deductionTypeName,
        taxTypeName,
        code: deduction.code ?? codeDetails.code ?? '',
        description: deduction.description ?? codeDetails.description ?? deduction.code ?? '',
        divisor: deduction.divisor ?? codeDetails.divisor ?? null,
        vatPercent:
          deduction.vatPercent ?? deduction.vat_percent ?? codeDetails.vat_percent ?? null,
        ewtPercent:
          deduction.ewtPercent ?? deduction.ewt_percent ?? codeDetails.ewt_percent ?? null,
        gross_vat_inc: grossVatInc,
        gross_vat_exc: Number(deduction.gross_vat_exc ?? deduction.grossVatExc) || 0,
        percent:
          deduction.percent ??
          deduction.vat_percent ??
          deduction.ewt_percent ??
          codeDetails.vat_percent ??
          codeDetails.ewt_percent ??
          null,
        deduction_amount: deductionAmount,
        net_amount: netAmount,
        netAmount,
        amount: deductionAmount,
        isManual: Boolean(
          deduction.isManual ||
            deduction.is_manual ||
            codeDetails.is_others ||
            normalizedDeductionType === 'others',
        ),
      }
    },

    normalizeDeductions(deductions = []) {
      return (deductions || []).map((deduction) => this.normalizeDeductionRow(deduction))
    },

    async fetchDeductionsForDisbursement(disbursementId) {
      if (!disbursementId) return []

      try {
        const deductionsByDisbursement = await this.fetchDeductionsByDisbursementMap()
        const deductions = deductionsByDisbursement[disbursementId] || []
        this.cachedDeductionsByDisbursement = {
          ...this.cachedDeductionsByDisbursement,
          [disbursementId]: deductions,
        }
        return deductions
      } catch (error) {
        console.warn('Could not fetch deductions for disbursement:', error.response?.data || error)
        return this.cachedDeductionsByDisbursement?.[disbursementId] || []
      }
    },

    async fetchDeductionsByDisbursementMap() {
      try {
        const response = await api.get('/api/barangay/deductions', getAuthConfig())
        const payload = response.data?.data ?? response.data ?? []
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.deductions)
            ? payload.deductions
            : []

        const grouped = rows.reduce((acc, deduction) => {
          const disbursementId = deduction.disbursement_id
          if (!disbursementId) return acc

          const key = String(disbursementId)
          if (!acc[key]) acc[key] = []
          acc[key].push(this.normalizeDeductionRow(deduction))
          return acc
        }, {})

        this.cachedDeductionsByDisbursement = grouped
        return grouped
      } catch (error) {
        console.warn('Could not fetch deductions:', error.response?.data || error)
        return this.cachedDeductionsByDisbursement || {}
      }
    },

    normalizeBankChequeRow(cheque = {}, fallback = {}) {
      const amount =
        Number(
          cheque.amount ??
            cheque.cheque_amount ??
            cheque.check_amount ??
            cheque.disbursement_amount ??
            fallback.amount,
        ) || 0
      const bankId = cheque.bank_id ?? cheque.bank?.id ?? cheque.booklet?.bank_id ?? null
      const resolvedBankId = bankId ?? fallback.bank_id ?? null

      const bankFromStore = resolvedBankId
        ? bankStore.availableBanks?.find((b) => String(b.id) === String(resolvedBankId))
        : null

      const bankName =
        cheque.bank_name ||
        cheque.bankName ||
        cheque.bank?.bank_name ||
        cheque.bank?.name ||
        cheque.booklet?.bank?.bank_name ||
        bankFromStore?.name ||
        (bankId ? '' : fallback.bank_name || fallback.bankName || '') ||
        ''

      return {
        id: cheque.id,
        bank_id: resolvedBankId,
        booklet_id: cheque.booklet_id ?? cheque.booklet?.id ?? fallback.booklet_id ?? null,
        bank_name: bankName,
        bankName,
        bank: bankName,
        bank_status: cheque.bank_status || cheque.bankStatus || fallback.bank_status || '',
        bankStatus: cheque.bank_status || cheque.bankStatus || fallback.bankStatus || '',
        cheque_number: cheque.cheque_number || cheque.chequeNumber || fallback.cheque_number || '',
        chequeNumber: cheque.cheque_number || cheque.chequeNumber || fallback.chequeNumber || '',
        cheque_date: cheque.cheque_date || cheque.chequeDate || fallback.cheque_date || '',
        chequeDate: cheque.cheque_date || cheque.chequeDate || fallback.chequeDate || '',
        particular: cheque.particular || cheque.particulars || fallback.particular || '',
        amount,
      }
    },

    normalizeBankCheques(cheques = [], fallback = {}) {
      return (cheques || [])
        .map((cheque) => this.normalizeBankChequeRow(cheque, fallback))
        .filter((cheque) => Number(cheque.amount) > 0)
    },

    mergeDisbursementChequeRows(disbursement = {}, deductions = [], savedBankCheques = []) {
      const resolvedNetAmount = this.resolveNetAmount(disbursement, deductions)
      const topLevelChequeNumber = disbursement.cheque_number || disbursement.chequeNumber || ''

      const rawRows = [
        ...(disbursement.bank_cheques || []),
        ...(disbursement.entries || []),
        ...savedBankCheques,
      ]

      if (topLevelChequeNumber) {
        rawRows.unshift({
          id: `main-${topLevelChequeNumber}`,
          bank_id: disbursement.bank_id || null,
          booklet_id: disbursement.booklet_id || null,
          bank_name: disbursement.bank_name || '',
          bankName: disbursement.bank_name || '',
          cheque_number: topLevelChequeNumber,
          chequeNumber: topLevelChequeNumber,
          cheque_date: disbursement.cheque_date || '',
          chequeDate: disbursement.cheque_date || '',
          // amount: disbursement.cheque_amount ?? disbursement.amount ?? disbursement.dv_amount ?? 0,
          amount:
            disbursement.cheque_amount ??
            disbursement.amount ??
            resolvedNetAmount ??
            disbursement.dv_amount ??
            0,
          bank_status: disbursement.bank_status || '',
        })
      }

      const normalized = this.normalizeBankCheques(rawRows, {
        bank_id: disbursement.bank_id || null,
        bank_name: disbursement.bank_name || '',
        bank_status: disbursement.bank_status || '',
      }).filter(
        (cheque, index, rows) =>
          rows.findIndex(
            (row) =>
              String(row.cheque_number || row.chequeNumber) ===
              String(cheque.cheque_number || cheque.chequeNumber),
          ) === index,
      )

      if (topLevelChequeNumber && normalized.length > 1) {
        const otherTotal = normalized
          .filter(
            (row) => String(row.cheque_number || row.chequeNumber) !== String(topLevelChequeNumber),
          )
          .reduce((sum, row) => sum + (Number(row.amount) || 0), 0)

        const inferredTopLevelAmount = Math.max(
          0,
          Math.round((resolvedNetAmount - otherTotal) * 100) / 100,
        )

        return normalized.map((row) =>
          String(row.cheque_number || row.chequeNumber) === String(topLevelChequeNumber)
            ? { ...row, amount: inferredTopLevelAmount }
            : row,
        )
      }

      return normalized
    },

    async fetchBankChequesForDisbursement(disbursementId, fallback = {}) {
      if (!disbursementId) return []

      const endpoints = [
        `/api/barangay/cheques/disbursement/${disbursementId}`,
        // `/api/barangay/disbursements/${disbursementId}/cheques`,
        // `/api/barangay/bank-cheques/disbursement/${disbursementId}`,
      ]

      const allRows = []

      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint, getAuthConfig())
          const payload = response.data?.data ?? response.data ?? []
          const rows = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.cheques)
              ? payload.cheques
              : Array.isArray(payload.bank_cheques)
                ? payload.bank_cheques
                : []

          allRows.push(...rows)
        } catch (error) {
          if (![404, 405].includes(error.response?.status)) {
            console.warn(
              'Could not fetch bank cheques for disbursement:',
              error.response?.data || error,
            )
          }
        }
      }

      return this.normalizeBankCheques(allRows, fallback).filter(
        (cheque, index, rows) =>
          rows.findIndex(
            (row) =>
              String(row.cheque_number || row.chequeNumber) ===
              String(cheque.cheque_number || cheque.chequeNumber),
          ) === index,
      )
    },

    resolveNetAmount(disbursement = {}, deductions = null) {
      const normalizedDeductions =
        deductions || this.normalizeDeductions(disbursement.deductions || [])
      const grossAmount =
        Number(disbursement.dv_amount ?? disbursement.dvAmount ?? disbursement.amount) || 0

      if (normalizedDeductions.length) {
        const totalDeductions = normalizedDeductions.reduce(
          (sum, deduction) => sum + (Number(deduction.deduction_amount ?? deduction.amount) || 0),
          0,
        )
        return Math.max(0, Math.round((grossAmount - totalDeductions) * 100) / 100)
      }

      const topLevelNet = disbursement.net_amount ?? disbursement.netAmount
      if (topLevelNet !== null && topLevelNet !== undefined && topLevelNet !== '') {
        return Number(topLevelNet) || 0
      }

      const chequeRows = this.normalizeBankCheques(
        disbursement.bank_cheques ||
          disbursement.entries ||
          this.cachedBankChequesByDisbursement?.[disbursement.id] ||
          [],
      )
      const chequeTotal = chequeRows.reduce((sum, cheque) => sum + (Number(cheque.amount) || 0), 0)
      if (chequeTotal > 0) {
        return Math.round(chequeTotal * 100) / 100
      }

      return grossAmount
    },

    deductionPayload(deduction) {
      const row = this.normalizeDeductionRow(deduction)
      const grossAmount = Number(row.gross_vat_inc) || Number(this.totalExpensesAmount) || 0
      const deductionAmount = Number(row.deduction_amount) || 0
      const netAmount = Number(row.net_amount) || Math.max(0, grossAmount - deductionAmount)

      return {
        id: Number(row.id) > 0 ? Number(row.id) : null,
        deduction_code_id: row.deduction_code_id,
        deduction_type: row.deductionTypeName,
        tax_type: row.taxTypeName,
        tax_type_name: row.taxTypeName,
        code: row.code,
        description: row.description,
        divisor: row.divisor,
        vat_percent: row.vatPercent,
        ewt_percent: row.ewtPercent,
        gross_vat_inc: grossAmount,
        gross_vat_exc: Number(row.gross_vat_exc) || 0,
        percent: Number(row.percent) || 0,
        deduction_amount: deductionAmount,
        net_amount: netAmount,
        amount: deductionAmount,
        is_manual: row.isManual,
      }
    },

    async saveDeductionsForDisbursement(disbursementId, deductions, token) {
      if (!disbursementId || !deductions?.length) return

      for (const deduction of deductions) {
        const row = this.normalizeDeductionRow(deduction)
        const payload = this.deductionPayload(row)
        const isManual = row.isManual || !row.deduction_code_id

        await api.post(
          '/api/barangay/deductions',
          isManual
            ? {
                ...payload,
                disbursement_id: disbursementId,
                deduction_type: row.deductionTypeName || 'OTHERS',
                tax_type: row.taxTypeName || null,
                description: row.description || row.code || 'OTHERS',
              }
            : {
                disbursement_id: disbursementId,
                deduction_code_id: row.deduction_code_id,
                gross_vat_inc: payload.gross_vat_inc,
                description: row.description || '',
              },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )
      }
    },

    getCreatedDisbursementId(responseData) {
      const data = responseData?.data ?? responseData

      return (
        data?.id ||
        data?.disbursement_id ||
        data?.disbursement?.id ||
        data?.data?.id ||
        data?.data?.disbursement_id ||
        data?.data?.disbursement?.id ||
        null
      )
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
        this.expenseData.forEach((expenseClass) => {
          classMap.set(expenseClass.name, expenseClass)
        })

        // Group expense types by class
        const typesByClass = new Map()
        accountsStore.expenseTypes.forEach((type) => {
          const classId = type.expense_class_id
          if (!typesByClass.has(classId)) {
            typesByClass.set(classId, [])
          }
          typesByClass.get(classId).push(type)
        })

        // Integrate types into existing expenseData
        typesByClass.forEach((types, classId) => {
          const expenseClass = accountsStore.expenseClasses.find((c) => c.id == classId)
          if (expenseClass) {
            // Find corresponding class in expenseData
            const existingClass = this.expenseData.find((c) => c.name === expenseClass.name)

            if (existingClass) {
              // Add types to existing class
              if (!existingClass.children) {
                existingClass.children = []
              }

              types.forEach((type) => {
                // Check if type already exists
                const existingType = existingClass.children.find((t) => t.id === type.id)
                if (!existingType) {
                  existingClass.children.push({
                    id: type.id,
                    name: type.name,
                    expense_class_id: type.expense_class_id,
                    order: type.order || 0,
                    amount: 0, // Will be populated from appropriation data if available
                    children: [], // Initialize empty children array for items
                  })
                }
              })
            } else {
              // Create new class if it doesn't exist
              const newClass = {
                id: expenseClass.id,
                name: expenseClass.name,
                fiscal_year_id: expenseClass.fiscal_year_id,
                children: types.map((type) => ({
                  id: type.id,
                  name: type.name,
                  expense_class_id: type.expense_class_id,
                  order: type.order || 0,
                  amount: 0,
                  children: [],
                })),
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

    async fetchDisbursements(year = null, force = false) {
      const authStore = useAuthStore()
      const resolvedYear = Number(year ?? new Date().getFullYear())
      const cacheKey = `${authStore.admin ? 'admin' : 'barangay'}:${resolvedYear}:${authStore.admin ? (authStore.getSelectedBarangay?.() ?? 'all') : 'all'}`

      if (!force && this.lastDisbursementFetchKey === cacheKey && this.disbursements.length) {
        return { cached: true }
      }

      this.lastDisbursementFetchKey = cacheKey
      this.loadingDisbursements = true
      try {
        const authStore = useAuthStore()
        const endpoint = authStore.admin
          ? '/api/admin/disbursements'
          : '/api/barangay/disbursements'
        const birEndpoint = authStore.admin
          ? '/api/admin/bir-remittances'
          : '/api/barangay/bir-remittances'
        const fundTransferEndpoint = authStore.admin
          ? '/api/admin/fund-transfers'
          : '/api/barangay/fund-transfers'
        const token = authStore.admin ? authStore.adminToken : authStore.token

        const params = {}
        if (authStore.admin) {
          const selectedBarangay = authStore.getSelectedBarangay()
          if (selectedBarangay) params.barangay_id = selectedBarangay
        }
        params.year = year !== null && year !== undefined ? Number(year) : new Date().getFullYear()

        // Fetch all three in parallel
        const [disbursementsResponse, particularsResponse, birResponse, ftResponse] =
          await Promise.allSettled([
            api.get(endpoint, {
              headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
              params,
            }),
            api.get(authStore.admin ? '/api/admin/particulars' : '/api/barangay/particulars', {
              headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            }),
            api.get(birEndpoint, {
              headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
              params: {
                year: params.year,
                ...(params.barangay_id ? { barangay_id: params.barangay_id } : {}),
              },
            }),
            api.get(fundTransferEndpoint, {
              headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
              params: {
                year: params.year,
                ...(params.barangay_id ? { barangay_id: params.barangay_id } : {}),
              },
            }),
          ])

        // Particulars
        if (particularsResponse.status === 'fulfilled') {
          const pData = Array.isArray(particularsResponse.value.data?.data)
            ? particularsResponse.value.data.data
            : Array.isArray(particularsResponse.value.data)
              ? particularsResponse.value.data
              : []
          this.particulars = pData.map((item) => ({ label: item.particulars }))
        }

        const selectedBarangayName = authStore.admin ? authStore.getSelectedBarangayName?.() : null
        const deductionsByDisbursement =
          disbursementsResponse.status === 'fulfilled'
            ? await this.fetchDeductionsByDisbursementMap()
            : this.cachedDeductionsByDisbursement || {}

        // Regular disbursements
        const regularRows =
          disbursementsResponse.status === 'fulfilled'
            ? (disbursementsResponse.value.data.data || []).map((d) => {
                const deductionsFromTable =
                  deductionsByDisbursement[String(d.id)] || deductionsByDisbursement[d.id] || []
                const deductions = deductionsFromTable.length
                  ? deductionsFromTable
                  : this.normalizeDeductions(d.deductions || [])
                // const bankCheques = this.normalizeBankCheques(d.bank_cheques || [], {
                //   bank_id: d.bank_id || null,
                //   bank_name: d.bank_name || '',
                //   bank: d.bank_name || '',
                // })
                const savedBankCheques =
                  this.cachedBankChequesByDisbursement?.[d.id] ||
                  this.cachedBankChequesByDisbursement?.[String(d.id)] ||
                  []

                const bankCheques = this.mergeDisbursementChequeRows(
                  d,
                  deductions,
                  savedBankCheques,
                )

                if (bankCheques.length) {
                  this.cachedBankChequesByDisbursement = {
                    ...this.cachedBankChequesByDisbursement,
                    [d.id]: bankCheques,
                  }
                }

                const primaryCheque = bankCheques[0] || {}

                return {
                  id: d.id,
                  row_id: d.row_id,
                  disbursement_id: d.disbursement_id,
                  expense_detail_id: d.expense_detail_id,
                  date: d.date,
                  dvNumber: d.dv_number,
                  netAmount: this.resolveNetAmount(d, deductions),
                  deductions,
                  // chequeNumber: d.cheque_number,
                  // bank_cheques: bankCheques,
                  // bank: d.bank_name,
                  chequeNumber: d.cheque_number || primaryCheque.cheque_number || '',
                  bank_cheques: bankCheques,
                  bank: d.bank_name || primaryCheque.bank || primaryCheque.bankName || '',
                  bank_status: d.bank_status,
                  payee: d.payee,
                  payee2: d.payee2 || d.payee_2 || d.payee2_name || '',
                  particular: d.particular,
                  dvAmount: d.dv_amount,
                  status: d.status,
                  remarks: d.remarks,
                  rejection_remarks: d.rejection_remarks,
                  barangay_name:
                    d.barangay_name ||
                    d.barangayName ||
                    (typeof d.barangay === 'string' ? d.barangay : d.barangay?.name) ||
                    selectedBarangayName ||
                    '',
                  aging: calculateAging(d.date),
                  expenses: d.expenses || [],
                  type: d.disbursement_type || 'regular',
                }
              })
            : []

        // BIR rows
        const birRows =
          birResponse.status === 'fulfilled'
            ? (birResponse.value.data.data || []).map((d) => {
                const entries = this.normalizeBankCheques(d.entries || d.bank_cheques || [], {
                  bank_id: d.bank_id || null,
                  bank_name: d.bank_name || '',
                  bank_status: d.bank_status || '',
                })
                const uniqueParticulars = [
                  ...new Set(entries.map((e) => e.particular).filter(Boolean)),
                ]
                const particular =
                  uniqueParticulars.length > 1
                    ? `${uniqueParticulars.length} particulars`
                    : uniqueParticulars[0] || d.particular || 'Remittance to BIR'

                const primaryEntry = entries[0] || {}
                return {
                  id: d.id,
                  _rawId: d.id,
                  _table: 'bir',
                  date: d.date,
                  dvNumber: d.dv_number,
                  chequeNumber:
                    d.cheque_number ||
                    primaryEntry.cheque_number ||
                    primaryEntry.chequeNumber ||
                    '',
                  bank_id: d.bank_id,
                  bank: d.bank_name || primaryEntry.bank || primaryEntry.bankName || '',
                  bank_cheques: entries,
                  bank_status: d.bank_status,
                  payee: d.payee,
                  particular,
                  dvAmount: d.dv_amount,
                  netAmount: d.dv_amount,
                  remarks: d.remarks,
                  rejection_remarks: d.rejection_remarks,
                  type: 'bir',
                  aging: calculateAging(d.date),
                  // bank_cheques: [
                  //   bank_id:
                  // ],
                  expenses: [],
                }
              })
            : []

        // SK / fund-transfer rows
        const ftRows =
          ftResponse.status === 'fulfilled'
            ? (ftResponse.value.data.data || []).map((d) => {
                const entries = this.normalizeBankCheques(d.entries || d.bank_cheques || [], {
                  bank_id: d.bank_id || null,
                  bank_name: d.bank_name || '',
                  bank_status: d.bank_status || '',
                })

                const primaryEntry = entries[0] || {}
                return {
                  id: d.id,
                  _rawId: d.id,
                  _table: 'fund_transfer',
                  _originalType: d.type, // keep original for debugging
                  date: d.date,
                  dvNumber: d.dv_number,
                  chequeNumber:
                    d.cheque_number ||
                    primaryEntry.cheque_number ||
                    primaryEntry.chequeNumber ||
                    '',
                  bank_id: d.bank_id,
                  bank: d.bank_name || primaryEntry.bank || primaryEntry.bankName || '',
                  bank_cheques: entries,
                  bank_status: d.bank_status,
                  payee: d.payee,
                  dvAmount: d.amount ?? d.dv_amount,
                  netAmount: d.dv_amount ?? d.amount,
                  remarks: d.remarks,
                  rejection_remarks: d.rejection_remarks,
                  // type: 'sk',
                  type:
                    d.type === 'aid' || d.type === 'fund_transfer'
                      ? 'provincial_aid'
                      : d.type || 'sk',
                  aging: calculateAging(d.date),
                  expenses: [],
                }
              })
            : []

        // Merge all into one array
        this.disbursements = [...regularRows, ...birRows, ...ftRows]

        // Expense details
        if (!this.expenseDetailsData.length && !authStore.admin) {
          this.fetchExpenseDetails().catch((e) =>
            console.warn('Failed to fetch expense details:', e),
          )
        }
      } catch (error) {
        console.error('Failed to fetch disbursements:', error)
        this.disbursements = []
      } finally {
        this.loadingDisbursements = false
      }
    },

    async fetchDisbursementById(id) {
      this.isChequeCancel = false
      try {
        const authStore = useAuthStore()
        // Use barangay user token for barangay endpoints
        const token = authStore.token
        const response = await api.get(`/api/barangay/disbursements/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
        // Get the disbursement data
        const disbursement = response.data.data
        if (disbursement) {
          this.forms.disbursement = {
            date: formatDateForForm(disbursement.date),
            dvNumber: disbursement.dv_number,
            chequeNumber: disbursement.cheque_number,
            bank_id: disbursement.bank_id ? Number(disbursement.bank_id) : '',
            payee: disbursement.payee,
            payee2: disbursement.payee2 || disbursement.payee_2 || disbursement.payee2_name || '',
            // Add other fields as needed
          }

          // Set the autoCheque and autoBookletID fields for display in the UI
          this.autoCheque = disbursement.cheque_number
          this.autoBookletID = disbursement.booklet_id

          function formatDateForForm(dateStr) {
            if (!dateStr) return ''
            if (dateStr.includes('-')) {
              // 'YYYY-MM-DD'
              const [yyyy, mm, dd] = dateStr.split('-')
              return `${dd}/${mm}/${yyyy}`
            } else if (dateStr.includes('/')) {
              return dateStr
            }
            return dateStr
          }

          // Load existing expenses from the disbursement
          if (disbursement.expenses && disbursement.expenses.length > 0) {
            this.expenses = disbursement.expenses.map((expense) => {
              const expenseChequeNumber = getExpenseChequeNumber(expense)
              // Use the account_name from backend (which now includes subitem) or fallback to lookup
              const fullAccountName =
                expense.account_name ||
                this.getExpenseAccountName(
                  expense.expense_class_id,
                  expense.expense_type_id,
                  expense.expense_item_id,
                  expense.expense_sub_item_id,
                )

              // Parse the full account name to extract individual components
              const parts = fullAccountName.split(' > ')
              const account = parts[0] || ''
              const expenseType = parts[1] || ''
              const expenseItem = parts[2] || ''
              const expenseSubItem = parts[3] || ''

              return {
                id: expense.id, // Use the actual database ID from tran_expense_details
                accountId: expense.accountId,
                accountName: expense.account_name || fullAccountName, // Use particular as fallback
                amount: expense.amount,
                particular: expense.particular,
                fund: expense.fund || '',
                taxpayerType: expense.taxpayerType || expense.taxpayer_type || '',
                taxType: expense.taxType || expense.tax_type || '',
                bank_id: expense.bank_id || disbursement.bank_id || null,
                bankName: expense.bank_name || disbursement.bank_name || '',
                bank: expense.bank_name || disbursement.bank_name || '',
                cheque_number: expenseChequeNumber,
                chequeNumber: expenseChequeNumber,
                cheque_date: getExpenseChequeDate(expense, disbursement),
                cheque_cancelled: Boolean(
                  expense.cheque_cancelled || expense.cancel_cheque || expense.is_cancelled,
                ),
                expense_class_id: expense.expense_class_id,
                expense_type_id: expense.expense_type_id,
                expense_item_id: expense.expense_item_id,
                expense_sub_item_id: expense.expense_sub_item_id,
                expense_class_name: parts[0] || '',
                expense_type_name: parts[1] || '',
                expense_item_name: parts[2] || '',
                expense_sub_item_name: parts[3] || '',
                account: account,
                expenseType: expenseType,
                expenseItem: expenseItem,
                expenseSubItem: expenseSubItem,
              }
            })
          } else {
            this.expenses = []
          }

          const savedBankCheques = await this.fetchBankChequesForDisbursement(disbursement.id, {
            bank_id: disbursement.bank_id || null,
            bank_name: disbursement.bank_name || '',
            bank: disbursement.bank_name || '',
          })

          const deductionsFromRaw = this.normalizeDeductions(disbursement.deductions || [])
          this.bankCheques = this.mergeDisbursementChequeRows(
            disbursement,
            deductionsFromRaw,
            savedBankCheques,
          )

          const deductionsFromTable = await this.fetchDeductionsForDisbursement(disbursement.id)
          const deductions = deductionsFromTable.length
            ? deductionsFromTable
            : this.normalizeDeductions(disbursement.deductions || [])

          this.forms.expense.amount = Number(disbursement.dv_amount) || 0
          this.forms.expense.deductions = deductions
          this._recalcDeductionTotals()

          this.currentItem = {
            ...disbursement,
            deductions,
            net_amount: this.resolveNetAmount(disbursement, deductions),
          }
          // Store the original DV amount for validation during editing
          this.lockedTotalAmount = parseFloat(disbursement.dv_amount) || 0
          this.dialogs.editDisbursement = true
        }
        return disbursement
      } catch (error) {
        console.error('Failed to fetch disbursement:', error)
        return null
      }
    },

    // Fetch disbursement data for viewing only (doesn't modify form data or open dialogs)
    async fetchDisbursementForView(id, type = 'regular') {
      try {
        const authStore = useAuthStore()

        if (type === 'bir' || type === 'sk' || type === 'provincial_aid') {
          return await this.fetchBirOrSkForView(id, type)
        }

        const endpoint = authStore.admin
          ? `/api/admin/disbursements/${id}`
          : `/api/barangay/disbursements/${id}`
        // Use shared auth config that selects the correct token (admin vs barangay)
        const config = getAuthConfig()

        // Ensure expense data is loaded first
        if (!this.expenseData || this.expenseData.length === 0) {
          await this.fetchExpenseAccounts()
        }

        const response = await api.get(endpoint, config)

        // Get the disbursement data
        const disbursement = response.data.data

        if (disbursement) {
          // Map expenses to ensure proper field names
          const mappedExpenses = (disbursement.expenses || []).map((expense) => {
            const expenseChequeNumber = getExpenseChequeNumber(expense)
            // Use the account_name from backend (which now includes subitem) or fallback to lookup
            const fullAccountName =
              expense.account_name ||
              this.getExpenseAccountName(
                expense.expense_class_id,
                expense.expense_type_id,
                expense.expense_item_id,
                expense.expense_sub_item_id,
              )

            // Parse the full account name to extract individual components
            const parts = fullAccountName.split(' > ')
            const account = parts[0] || ''
            const expenseType = parts[1] || ''
            const expenseItem = parts[2] || ''
            const expenseSubItem = parts[3] || ''

            return {
              id: expense.id,
              accountName: expense.account_name || fullAccountName,
              amount: expense.amount,
              particular: expense.particular,
              fund: expense.fund || '',
              taxpayerType: expense.taxpayerType || expense.taxpayer_type || '',
              taxType: expense.taxType || expense.tax_type || '',
              accountId: expense.accountId,
              bank_id: expense.bank_id || disbursement.bank_id || null,
              bankName: expense.bank_name || disbursement.bank_name || '',
              bank: expense.bank_name || disbursement.bank_name || '',
              cheque_number: expenseChequeNumber,
              chequeNumber: expenseChequeNumber,
              cheque_date: getExpenseChequeDate(expense, disbursement),
              cheque_cancelled: Boolean(
                expense.cheque_cancelled || expense.cancel_cheque || expense.is_cancelled,
              ),
              expense_class_id: expense.expense_class_id,
              expense_type_id: expense.expense_type_id,
              expense_item_id: expense.expense_item_id,
              expense_sub_item_id: expense.expense_sub_item_id,
              expense_class_name: parts[0] || '',
              expense_type_name: parts[1] || '',
              expense_item_name: parts[2] || '',
              expense_sub_item_name: parts[3] || '',
              // Add fields for multi-column display
              account: account,
              expenseType: expenseType,
              expenseItem: expenseItem,
              expenseSubItem: expenseSubItem,
            }
          })

          // Map reimbursement expenses if they exist
          const mappedReimbursementExpenses = disbursement.reimbursement?.expenses
            ? disbursement.reimbursement.expenses.map((expense) => {
                const expenseChequeNumber = getExpenseChequeNumber(expense)
                // Use the account_name from backend or fallback to lookup
                const fullAccountName =
                  expense.account_name ||
                  this.getExpenseAccountName(
                    expense.expense_class_id,
                    expense.expense_type_id,
                    expense.expense_item_id,
                    expense.expense_sub_item_id,
                  )

                // Parse the full account name to extract individual components
                const parts = fullAccountName.split(' > ')
                const account = parts[0] || ''
                const expenseType = parts[1] || ''
                const expenseItem = parts[2] || ''
                const expenseSubItem = parts[3] || ''

                return {
                  id: expense.id,
                  accountName: expense.account_name || fullAccountName,
                  amount: expense.amount,
                  particular: expense.particular,
                  accountId: expense.accountId,
                  bank_id: expense.bank_id || disbursement.reimbursement.bank_id || null,
                  bankName: expense.bank_name || disbursement.reimbursement.bank_name || '',
                  bank: expense.bank_name || disbursement.reimbursement.bank_name || '',
                  cheque_number: expenseChequeNumber,
                  chequeNumber: expenseChequeNumber,
                  expense_class_id: expense.expense_class_id,
                  expense_type_id: expense.expense_type_id,
                  expense_item_id: expense.expense_item_id,
                  expense_sub_item_id: expense.expense_sub_item_id,
                  expense_class_name: parts[0] || '',
                  expense_type_name: parts[1] || '',
                  expense_item_name: parts[2] || '',
                  expense_sub_item_name: parts[3] || '',
                  // Add fields for multi-column display
                  account: account,
                  expenseType: expenseType,
                  expenseItem: expenseItem,
                  expenseSubItem: expenseSubItem,
                }
              })
            : []

          const deductionsFromTable = await this.fetchDeductionsForDisbursement(disbursement.id)
          const deductions = deductionsFromTable.length
            ? deductionsFromTable
            : this.normalizeDeductions(disbursement.deductions || [])

          const savedBankCheques = await this.fetchBankChequesForDisbursement(disbursement.id, {
            bank_id: disbursement.bank_id || null,
            bank_name: disbursement.bank_name || '',
            bank: disbursement.bank_name || '',
          })
          // const rawBankCheques = disbursement.bank_cheques || []
          const resolvedNetAmount = this.resolveNetAmount(disbursement, deductions)

          const normalizedBankCheques = this.mergeDisbursementChequeRows(
            disbursement,
            deductions,
            savedBankCheques,
          )

          const result = {
            id: disbursement.id,
            date: disbursement.date,
            dvNumber: disbursement.dv_number,
            chequeNumber: disbursement.cheque_number,
            bank_id: disbursement.bank_id,
            bank_name: disbursement.bank_name,
            bank_cheques: normalizedBankCheques,
            deductions,
            netAmount: resolvedNetAmount,
            payee: disbursement.payee,
            payee2: disbursement.payee2 || disbursement.payee_2 || disbursement.payee2_name || '',
            dvAmount: disbursement.dv_amount,
            status: disbursement.status,
            remarks: disbursement.remarks,
            rejection_remarks: disbursement.rejection_remarks,
            expenses: mappedExpenses,
            reimbursement: disbursement.reimbursement
              ? {
                  id: disbursement.reimbursement.id,
                  date: disbursement.reimbursement.date,
                  dv_number: disbursement.reimbursement.dv_number,
                  dv_amount: disbursement.reimbursement.dv_amount,
                  bank_id: disbursement.reimbursement.bank_id,
                  bank_name: disbursement.reimbursement.bank_name,
                  cheque_number: disbursement.reimbursement.cheque_number,
                  status: disbursement.reimbursement.status,
                  ref_dv_number: disbursement.reimbursement.ref_dv_number,
                  expenses: mappedReimbursementExpenses,
                }
              : null,
          }

          return result
        }
        return null
      } catch (error) {
        console.error('Error fetching disbursement for view:', error)
        return null
      }
    },

    async liquidateDisbursement(id, liquidatedAmount) {
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token
        const response = await api.patch(
          `/api/barangay/disbursements/${id}/liquidate`,
          { liquidated_amount: liquidatedAmount },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )
        // Update the local disbursement
        const updated = response.data.data
        const idx = this.disbursements.findIndex((d) => d.id === id)
        if (idx !== -1) {
          this.disbursements[idx].status = updated.status
          this.disbursements[idx].liquidated_amount = updated.liquidated_amount
          this.disbursements[idx].aging = calculateAging(updated.date)
        }
        return true
      } catch (error) {
        console.error('Failed to liquidate disbursement:', error)
        return false
      }
    },

    async fetchBirOrSkForView(id, type) {
      try {
        const authStore = useAuthStore()
        const isBir = type === 'bir'
        const endpoint = isBir
          ? authStore.admin
            ? `/api/admin/bir-remittances/${id}`
            : `/api/barangay/bir-remittances/${id}`
          : authStore.admin
            ? `/api/admin/fund-transfers/${id}`
            : `/api/barangay/fund-transfers/${id}`

        const config = getAuthConfig()
        const response = await api.get(endpoint, config)
        const d = response.data.data

        if (!d) return null
        const fallback = {
          bank_id: d.bank_id || null,
          bank_name: d.bank_name || '',
          particular: isBir ? 'Remittance to BIR' : '',
        }

        const fetchedCheques = await this.fetchBankChequesForDisbursement(d.id, fallback)

        const rawEntries = d.entries || d.bank_cheques || []
        const bankCheques = fetchedCheques.length
          ? fetchedCheques
          : rawEntries.length
            ? this.normalizeBankCheques(rawEntries, fallback)
            : d.cheque_number
              ? [
                  {
                    id: `existing-${d.cheque_number}`,
                    bank_id: d.bank_id || null,
                    bank_name: d.bank_name || '',
                    bankName: d.bank_name || '',
                    bank: d.bank_name || '',
                    cheque_number: d.cheque_number,
                    chequeNumber: d.cheque_number,
                    cheque_date: d.cheque_date || '',
                    chequeDate: d.cheque_date || '',
                    bank_status: d.bank_status || '',
                    bankStatus: d.bank_status || '',
                    particular: isBir ? 'Remittance to BIR' : '',
                    amount: Number(d.dv_amount || d.amount) || 0,
                  },
                ]
              : []

        return {
          id: d.id,
          type,
          date: d.date,
          dvNumber: d.dv_number,
          chequeNumber: d.cheque_number,
          bank_id: d.bank_id,
          bank_name: d.bank_name,
          bank_cheques: bankCheques,
          bank_status: d.bank_status,
          payee: d.payee || (isBir ? 'Bureau of Internal Revenue' : ''),
          dvAmount: isBir ? d.dv_amount : d.amount,
          status: d.status,
          remarks: d.remarks,
          rejection_remarks: d.rejection_remarks,
          // No expenses/deductions/reimbursement/liquidation for BIR/SK
          expenses: [],
          deductions: [],
          reimbursement: null,
        }
      } catch (error) {
        console.error('Error fetching BIR/SK for view:', error)
        return null
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
          const authStore = useAuthStore()
          const token = authStore.admin ? authStore.adminToken : authStore.token
          const bankData = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          })
          const data = bankData.data.data || []
          console.error('Fetched booklets data:', data)
          console.error('Fetched booklets data:', data.booklet_numb)
          console.error('Fetched booklets data:', data.cheque[0].cheque_number)

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
        this.resetForm('disbursement')

        const today = new Date()
        const dd = String(today.getDate()).padStart(2, '0')
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const yyyy = today.getFullYear()

        this.forms.disbursement.date = `${dd}/${mm}/${yyyy}`

        try {
          const response = await api.get('/api/barangay/generate-dvnumber', getAuthConfig())
          let apiDvNumber = response.data.data?.dv_number || ''

          const alreadyExists = !!(
            apiDvNumber && (this.disbursements || []).some((d) => d.dvNumber === apiDvNumber)
          )

          this.forms.disbursement.dvNumber = alreadyExists
            ? this.generateLocalDvNumber()
            : apiDvNumber || this.generateLocalDvNumber()
        } catch (error) {
          console.error('Failed to generate DV number from API, using local fallback:', error)
          this.forms.disbursement.dvNumber = this.generateLocalDvNumber()
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
      // Always fetch fresh data from backend to ensure we have the complete disbursement with expenses
      try {
        const freshDisbursementData = await this.fetchDisbursementForView(item.id)
        if (freshDisbursementData) {
          this.currentLiquidation = freshDisbursementData
        } else {
          // Fallback to item data if fetch fails
          this.currentLiquidation = JSON.parse(JSON.stringify(item))
        }
      } catch (error) {
        console.error('Error fetching fresh disbursement data:', error)
        // Fallback: create a new object with the essential properties
        this.currentLiquidation = {
          id: item.id,
          dvNumber: item.dvNumber,
          payee: item.payee,
          date: item.date,
          dvAmount: item.dvAmount,
          netAmount: item.netAmount,
          status: item.status,
          remarks: item.remarks,
          rejection_remarks: item.rejection_remarks,
          expenses: item.expenses || [],
          deductions: item.deductions || [],
          orDetails: [],
        }
      }

      const deductionsFromTable = await this.fetchDeductionsForDisbursement(
        this.currentLiquidation?.id || item.id,
      )
      const deductions = deductionsFromTable.length
        ? deductionsFromTable
        : this.normalizeDeductions(this.currentLiquidation?.deductions || item.deductions || [])
      this.currentLiquidation.deductions = deductions
      this.currentLiquidation.netAmount = this.resolveNetAmount(this.currentLiquidation, deductions)
      this.bankCheques = this.normalizeBankCheques(this.currentLiquidation.bank_cheques || [], {
        bank_id: this.currentLiquidation.bank_id || null,
        bank_name: this.currentLiquidation.bank_name || this.currentLiquidation.bank || '',
      })
      this.forms.expense.amount =
        Number(this.currentLiquidation.dvAmount ?? this.currentLiquidation.dv_amount) || 0
      this.forms.expense.deductions = deductions
      this._recalcDeductionTotals()

      if (item.expense_detail_id && this.currentLiquidation?.expenses?.length) {
        const selectedExpense = this.currentLiquidation.expenses.find(
          (expense) => String(expense.id) === String(item.expense_detail_id),
        )
        if (selectedExpense) {
          this.currentLiquidation.expenses = [selectedExpense]
          this.currentLiquidation.dvAmount = parseFloat(selectedExpense.amount) || 0
        }
      }

      // Fetch existing OR Details from backend if this is a partial liquidation
      if (item.id && item.status === 'Partial') {
        try {
          const res = await api.get(`/api/barangay/disbursements/${item.id}/or-details`)
          const backendUrl = 'http://localhost:8000'
          this.currentLiquidation.orDetails = res.data.data.map((or) => {
            // Convert YYYY-MM-DD to DD/MM/YYYY format
            let formattedDate = ''
            if (or.or_date) {
              const dateParts = or.or_date.split('-')
              if (dateParts.length === 3) {
                formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
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
            }
          })

          // Set single remarks from the latest OR detail (most recent one)
          if (res.data.data.length > 0) {
            // Get the latest OR detail (last in the array) for remarks
            const latestOrDetail = res.data.data[res.data.data.length - 1]
            this.currentLiquidation.remarks = latestOrDetail.remarks || ''
          }
        } catch {
          this.currentLiquidation.orDetails = []
        }
      } else {
        // For new liquidations, initialize empty - component will add initial row
        this.currentLiquidation.orDetails = []
      }

      this.dialogs.orDetails = true
    },

    async openLiquidateDialog(row) {
      return this.openOrDetailsDialog(row)
    },

    // For viewing only (read-only)
    async openViewOrDetails(row) {
      // Close any other dialogs that might be open
      this.dialogs.editDisbursement = false
      this.dialogs.orDetails = false
      this.dialogs.disbursement = false

      const rowType = row.type || 'regular'

      // Always fetch fresh data from backend to ensure we have the correct disbursement
      // This prevents issues where the list might show reimbursement data instead of main disbursement
      try {
        const freshDisbursementData = await this.fetchDisbursementForView(row.id, rowType)
        if (freshDisbursementData) {
          this.currentLiquidation = freshDisbursementData
        } else {
          this.currentLiquidation = JSON.parse(JSON.stringify(row))
        }
      } catch (error) {
        console.error('Error fetching fresh disbursement data:', error)
        // Fallback: create a new object with the essential properties
        this.currentLiquidation = {
          id: row.id,
          dvNumber: row.dvNumber,
          payee: row.payee,
          date: row.date,
          dvAmount: row.dvAmount,
          netAmount: row.netAmount,
          status: row.status,
          remarks: row.remarks,
          rejection_remarks: row.rejection_remarks,
          expenses: row.expenses || [],
          deductions: row.deductions || [],
          orDetails: [],
        }
      }

      const deductionsFromTable = await this.fetchDeductionsForDisbursement(
        this.currentLiquidation?.id || row.id,
      )
      const deductions = deductionsFromTable.length
        ? deductionsFromTable
        : this.normalizeDeductions(this.currentLiquidation?.deductions || row.deductions || [])
      this.currentLiquidation.deductions = deductions
      this.currentLiquidation.netAmount = this.resolveNetAmount(this.currentLiquidation, deductions)
      this.bankCheques = this.normalizeBankCheques(this.currentLiquidation.bank_cheques || [], {
        bank_id: this.currentLiquidation.bank_id || null,
        bank_name: this.currentLiquidation.bank_name || this.currentLiquidation.bank || '',
      })
      this.forms.expense.amount =
        Number(this.currentLiquidation.dvAmount ?? this.currentLiquidation.dv_amount) || 0
      this.forms.expense.deductions = deductions
      this._recalcDeductionTotals()

      // Initialize orDetails as empty array
      this.currentLiquidation.orDetails = []

      if (rowType === 'regular') {
        // Ensure expenses are available
        if (!this.currentLiquidation.expenses || this.currentLiquidation.expenses.length === 0) {
          try {
            const disbursement = await this.fetchDisbursementForView(row.id)
            if (disbursement) {
              this.currentLiquidation.expenses = disbursement.expenses
              this.currentLiquidation.reimbursement = disbursement.reimbursement
            }
          } catch (error) {
            console.error('Error fetching disbursement details:', error)
          }
        }

        // Fetch OR Details from backend - ALWAYS use the main disbursement ID (row.id)
        // This ensures OR details are always for the original disbursement, not reimbursement
        if (row.id) {
          try {
            // Get auth store instance
            const authStore = useAuthStore()

            // Validate auth store
            if (!authStore) {
              throw new Error('Auth store not available')
            }

            // Use different endpoints for admin vs regular users
            // IMPORTANT: Always use row.id (main disbursement ID) for OR details
            const endpoint = authStore.admin
              ? `/api/admin/disbursements/${row.id}/or-details`
              : `/api/barangay/disbursements/${row.id}/or-details`
            const token = authStore.admin ? authStore.adminToken : authStore.token

            if (!token) {
              throw new Error('No authentication token available')
            }

            const res = await api.get(endpoint, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            })

            // Check if we have data and it's an array
            if (
              res.data &&
              res.data.data &&
              Array.isArray(res.data.data) &&
              res.data.data.length > 0
            ) {
              const backendUrl = 'http://localhost:8000' // Change if your backend runs elsewhere
              this.currentLiquidation.orDetails = res.data.data.map((or, index) => {
                // Convert YYYY-MM-DD to DD/MM/YYYY format
                let formattedDate = ''
                if (or.or_date) {
                  const dateParts = or.or_date.split('-')
                  if (dateParts.length === 3) {
                    formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
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
                  isExisting: true, // Flag to identify existing OR details
                }

                return mappedOr
              })
              // Set single remarks from the latest OR detail (most recent one)
              if (res.data.data.length > 0) {
                // Get the latest OR detail (last in the array) for remarks
                const latestOrDetail = res.data.data[res.data.data.length - 1]
                this.currentLiquidation.remarks = latestOrDetail.remarks || ''
              }
            } else {
              this.currentLiquidation.orDetails = []
            }
          } catch (error) {
            console.error('Error fetching OR details:', error)
            console.error('Error details:', error.response?.data)
            this.currentLiquidation.orDetails = []
          }
        } else {
          this.currentLiquidation.orDetails = []
        }
      }
      this.dialogs.viewOrDetails = true
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
      if (item.expenseSubItem) {
        accountDisplay += ` > ${item.expenseSubItem}`
      }

      // Use the balance that's already calculated and displayed in the selection table
      // DO NOT recalculate - this prevents double counting
      const availableBalance = item.balance || 0

      // this.forms.expense = {
      //   account: accountDisplay,
      //   accountId: item.id,
      //   balance: availableBalance, // Use the pre-calculated balance from selection table
      //   originalBalance: item.originalBalance || item.balance || 0, // Keep original balance for reference
      //   particulars: '',
      //   amount: '',
      //   disbursementId: this.currentItem?.id || null,
      //   bank_id: null,
      //   cheque_number: '',
      //   bankLoading: false,
      //   fund: '',
      //   taxpayerType: '',
      //   taxType: '',
      //   // Store additional information for backend
      //   expense_class_id: item.expense_class_id,
      //   expense_type_id: item.expense_type_id,
      //   expense_item_id: item.expense_item_id,
      //   expense_sub_item_id: item.expense_sub_item_id,
      // }
      this.forms.expense = {
        ...this.forms.expense,
        account: accountDisplay,
        accountId: item.id,
        balance: availableBalance,
        originalBalance: item.originalBalance || item.balance || 0,
        particulars: '',
        amount: '',
        disbursementId: this.currentItem?.id || null,
        bank_id: null,
        cheque_number: '',
        bankLoading: false,
        isEditing: false,
        editingExpenseId: null,
        expense_class_id: item.expense_class_id,
        expense_type_id: item.expense_type_id,
        expense_item_id: item.expense_item_id,
        expense_sub_item_id: item.expense_sub_item_id,
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
                const matchedItem = (expenseType.children || []).find(
                  (ci) => String(ci.id) === String(existingExpense.expense_item_id),
                )
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
        expenseLevel,
      )

      // If the current expense is already persisted in DB for this disbursement and account,
      // add it back to compute the editable available balance
      let includeCurrentAmountBack = false
      try {
        includeCurrentAmountBack = (this.expenseDetailsData || []).some((ed) => {
          const sameDisbursement = String(ed.disbursement_id) === String(this.currentItem?.id)
          if (!sameDisbursement) return false
          const isItemLevel = Boolean(existingExpense.expense_item_id)
          if (isItemLevel) {
            return String(ed.expense_item_id) === String(existingExpense.expense_item_id)
          }
          // Type-level: ensure it's a type record (no item) and matches type id
          return (
            ed.expense_item_id == null &&
            String(ed.expense_type_id) === String(existingExpense.expense_type_id)
          )
        })
      } catch {
        includeCurrentAmountBack = false
      }

      const availableBalance =
        remainingBalance + (includeCurrentAmountBack ? parseFloat(existingExpense.amount) || 0 : 0)

      this.forms.expense = {
        account: existingExpense.accountName,
        accountId: existingExpense.accountId,
        balance: availableBalance,
        originalBalance: originalAllocatedAmount || existingExpense.amount,
        particulars: existingExpense.particular,
        amount: existingExpense.amount,
        disbursementId: this.currentItem?.id || null,
        fund: existingExpense.fund || '',
        taxpayerType: existingExpense.taxpayerType || '',
        taxType: existingExpense.taxType || '',
        bank_id: existingExpense.bank_id || this.forms.disbursement.bank_id || null,
        cheque_number:
          existingExpense.cheque_number ||
          existingExpense.chequeNumber ||
          this.forms.disbursement.chequeNumber ||
          '',
        cheque_date: existingExpense.cheque_date || '',
        cheque_cancelled: Boolean(existingExpense.cheque_cancelled),
        original_cheque_number: existingExpense.original_cheque_number || '',
        original_bank_id: existingExpense.original_bank_id || null,
        bankLoading: false,
        // Store additional information for backend
        expense_class_id: existingExpense.expense_class_id,
        expense_type_id: existingExpense.expense_type_id,
        expense_item_id: existingExpense.expense_item_id,
        expense_sub_item_id: existingExpense.expense_sub_item_id,
        // Flag to indicate this is an edit operation
        isEditing: true,
        editingExpenseId: existingExpense.id, // Use the database ID for editing
      }
      this.dialogs.expenseDetail = true
    },

    // Disbursement Actions
    async saveDisbursement() {
      this.savingDisbursement = true // Start loading
      const savedDeductions = [...(this.forms.expense.deductions || [])]
      const savedBankCheques = [...(this.bankCheques || [])].filter((row) => Number(row.amount) > 0)
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        if (!this.forms.disbursement.payee) {
          throw new Error('Please enter a payee')
        }
        if (this.expenses.length === 0) {
          throw new Error('Please add at least one expense')
        }
        if (savedBankCheques.length === 0) {
          throw new Error('Please add at least one bank cheque')
        }

        const totalDeductions = savedDeductions.reduce(
          (sum, row) => sum + (Number(row.deduction_amount ?? row.amount) || 0),
          0,
        )
        const netAmount = Math.max(
          0,
          Math.round((this.totalExpensesAmount - totalDeductions) * 100) / 100,
        )
        const chequeTotal =
          Math.round(
            savedBankCheques.reduce((sum, row) => {
              return sum + (Number(row.amount) || 0)
            }, 0) * 100,
          ) / 100

        if (chequeTotal !== netAmount) {
          const difference = Math.abs(netAmount - chequeTotal).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
          throw new Error(
            chequeTotal > netAmount
              ? `Cheque amount exceeded the net amount by ₱${difference}`
              : `Cheque amount is lacking ₱${difference}`,
          )
        }
        const chequePayload = savedBankCheques.map((cheque) => ({
          bank_id: cheque.bank_id || null,
          booklet_id: cheque.booklet_id || null,
          cheque_number: cheque.cheque_number || cheque.chequeNumber || '',
          cheque_date: cheque.cheque_date || cheque.chequeDate || null,
          bank_status: cheque.bank_status || cheque.bankStatus || '',
          amount: Number(cheque.amount) || 0,
        }))

        const firstCheque = savedBankCheques[0] || {}
        const chequeForExpense = savedBankCheques[0] || {}
        const payload = {
          date: this.forms.disbursement.date,
          dv_number: this.forms.disbursement.dvNumber,
          cheque_number: firstCheque.cheque_number || '',
          bank_cheques: chequePayload,
          bank_id: firstCheque.bank_id || null,
          cheque_date: firstCheque.cheque_date || firstCheque.chequeDate || null,
          cheque_booklet: firstCheque.booklet_id || null,
          cheque_amount: Number(firstCheque.amount) || 0,
          bank_status: firstCheque.bank_status,
          payee: this.forms.disbursement.payee,
          payee2: this.forms.disbursement.payee2,
          dv_amount: this.totalExpensesAmount,
          net_amount: netAmount,
          deductions: (this.forms.expense.deductions || []).map((ded) =>
            this.deductionPayload(ded),
          ),
          expenses: this.expenses.map((expense) => ({
            accountId: expense.accountId,
            amount: expense.amount,
            particular: expense.particular,
            fund: expense.fund,
            taxpayer_type: expense.taxpayerType,
            tax_type: expense.taxType,

            bank_id: expense.bank_id || chequeForExpense.bank_id || null,
            cheque_number: expense.cheque_number || chequeForExpense.cheque_number || '',
            cheque_date:
              expense.cheque_date ||
              chequeForExpense.cheque_date ||
              chequeForExpense.chequeDate ||
              null,
            expense_class_id: expense.expense_class_id,
            expense_type_id: expense.expense_type_id,
            expense_item_id: expense.expense_item_id,
            expense_sub_item_id: expense.expense_sub_item_id,
          })),
        }

        // Add barangay_id for admin users if selected
        if (authStore.admin) {
          const selectedBarangay = authStore.getSelectedBarangay()
          if (selectedBarangay) {
            payload.barangay_id = selectedBarangay
          }
        }

        // Use different endpoints for admin vs regular users
        const endpoint = authStore.admin
          ? '/api/admin/disbursements/create'
          : '/api/barangay/disbursements'
        const response = await api.post(endpoint, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        const createdDisbursementId = this.getCreatedDisbursementId(response.data)
        if (!createdDisbursementId) {
          console.warn('Created disbursement id was missing.', response.data)
        } else {
          this.cachedDeductionsByDisbursement = {
            ...this.cachedDeductionsByDisbursement,
            [createdDisbursementId]: this.normalizeDeductions(savedDeductions),
          }
          this.cachedBankChequesByDisbursement = {
            ...this.cachedBankChequesByDisbursement,
            [createdDisbursementId]: this.normalizeBankCheques(savedBankCheques),
          }
        }

        if (!authStore.admin && savedDeductions.length > 0) {
          if (!createdDisbursementId) {
            console.warn(
              'Could not save deductions because the created disbursement id was missing.',
              response.data,
            )
          } else {
            await this.saveDeductionsForDisbursement(createdDisbursementId, savedDeductions, token)
          }
        }

        this.dialogs.disbursement = false
        this.pendingChequeNumbers = []
        this.bankCheques = []
        // Defer clearing form and regenerating fields until after dialog hide animation
        setTimeout(async () => {
          this.resetForm('disbursement')
          this.expenses = []
          this.bankCheques = []

          const today = new Date()
          const dd = String(today.getDate()).padStart(2, '0')
          const mm = String(today.getMonth() + 1).padStart(2, '0')
          const yyyy = today.getFullYear()

          this.forms.disbursement.date = `${dd}/${mm}/${yyyy}`

          try {
            const response = await api.get('/api/barangay/generate-dvnumber', getAuthConfig())
            const apiDv = response.data.data?.dv_number || ''
            const alreadyExists = !!(
              apiDv && (this.disbursements || []).some((d) => d.dvNumber === apiDv)
            )
            this.forms.disbursement.dvNumber = alreadyExists
              ? this.generateLocalDvNumber()
              : apiDv || this.generateLocalDvNumber()
          } catch (error) {
            console.error('Failed to generate DV number, using local fallback:', error)
            this.forms.disbursement.dvNumber = this.generateLocalDvNumber()
          }
        }, 350) // match Quasar default transition

        // Do data refreshes in background (non-blocking)
        this.refreshDataInBackground().catch((error) => {
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
          error: error.response?.data?.message || error.message || 'Failed to save disbursement',
        }
      } finally {
        this.savingDisbursement = false // End loading
      }
    },

    async refreshDataInBackground() {
      try {
        const authStore = useAuthStore()

        // Force a real reload so the list updates right after saving
        await this.fetchDisbursements(null, true)

        if (!authStore.admin) {
          await this.fetchExpenseDetails()
          this.refreshExpenseAccountsWithBalances()
          this.expenseData = []
          await this.fetchExpenseAccounts()
        }
      } catch (error) {
        console.error('Background refresh failed:', error)
      }
    },

    // Generate next available incremental ID for expenses
    getNextExpenseId() {
      // Get all existing IDs from current expenses array
      const currentExpenseIds = this.expenses.map((exp) => exp.id)

      // Get all existing IDs from database expense details
      const databaseExpenseIds = this.expenseDetailsData.map((exp) => exp.id)

      // Combine all IDs and filter out negative ones
      const allIds = [...currentExpenseIds, ...databaseExpenseIds].filter((id) => id > 0)

      if (allIds.length === 0) {
        // No existing IDs found, start from 1
        return 1
      }

      // Find the highest ID and add 1
      const highestId = Math.max(...allIds)
      return highestId + 1
    },

    // Helper method to get expense account name from IDs
    getExpenseAccountName(expenseClassId, expenseTypeId, expenseItemId, expenseSubItemId = null) {
      try {
        let accountName = ''

        // Find expense class - convert IDs to strings for comparison
        const expenseClass = this.expenseData.find((ec) => String(ec.id) === String(expenseClassId))
        if (expenseClass) {
          accountName = expenseClass.name

          // Find expense type
          if (expenseTypeId && expenseClass.children) {
            const expenseType = expenseClass.children.find(
              (et) => String(et.id) === String(expenseTypeId),
            )

            if (expenseType) {
              accountName += ` > ${expenseType.name}`

              // Find expense item
              if (expenseItemId && expenseType.children) {
                const expenseItem = expenseType.children.find(
                  (ei) => String(ei.id) === String(expenseItemId),
                )

                if (expenseItem) {
                  accountName += ` > ${expenseItem.name}`

                  // Find expense subitem
                  if (expenseSubItemId && expenseItem.children) {
                    const expenseSubItem = expenseItem.children.find(
                      (esi) => String(esi.id) === String(expenseSubItemId),
                    )

                    if (expenseSubItem) {
                      accountName += ` > ${expenseSubItem.name}`
                    }
                  }
                }
              }
            }
          }
        }

        return accountName || 'Unknown Account'
      } catch (error) {
        console.error('Error getting expense account name:', error)
        return 'Unknown Account'
      }
    },

    async fetchDisbursementStatusesOnly(year = null) {
      try {
        const authStore = useAuthStore()
        const endpoint = authStore.admin
          ? '/api/admin/disbursements'
          : '/api/barangay/disbursements'
        const token = authStore.admin ? authStore.adminToken : authStore.token
        const params = { year: Number(year ?? new Date().getFullYear()) }
        if (authStore.admin) {
          const barangay = authStore.getSelectedBarangay?.()
          if (barangay) params.barangay_id = barangay
        }

        const res = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          params,
        })

        // Only update the fields the badge needs — don't touch the full disbursements array
        // used by the Disbursements page, so it don't clobber richer data it may have loaded.
        return (res.data.data || []).map((d) => ({
          status: d.status,
          barangay_name: d.barangay_name,
        }))
      } catch (e) {
        console.warn('Failed to fetch disbursement statuses:', e)
        return []
      }
    },

    // Expense Actions
    async saveExpense() {
      const amount = Number(this.forms.expense.amount) || 0
      const particulars = this.forms.expense.particulars?.trim() || ''

      const bank = bankStore.availableBanks.find(
        (b) => String(b.id) === String(this.forms.expense.bank_id),
      )
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
        throw new Error(
          `Amount exceeds available balance. Available: ₱${currentAvailableBalance.toLocaleString()}, Requested: ₱${amount.toLocaleString()}`,
        )
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
        if (!this.isChequeCancel) {
          if (newTotal > this.lockedTotalAmount) {
            throw new Error(
              `Total amount cannot exceed the original DV amount of ₱${this.lockedTotalAmount.toLocaleString()}. Current total would be ₱${newTotal.toLocaleString()}`,
            )
          }
        }
      }

      // Check if this is an edit operation
      if (this.forms.expense.isEditing && this.forms.expense.editingExpenseId) {
        // Update existing expense - keep the existing database ID
        const existingExpenseIndex = this.expenses.findIndex(
          (exp) => exp.id === this.forms.expense.editingExpenseId,
        )
        if (existingExpenseIndex !== -1) {
          this.expenses[existingExpenseIndex] = {
            ...this.expenses[existingExpenseIndex],
            amount: amount,
            particular: particulars,
            fund: this.forms.expense.fund || '',
            taxpayerType: this.forms.expense.taxpayerType || '',
            taxType: this.forms.expense.taxType || '',
            bank_id: this.forms.expense.bank_id,
            bankName: bank?.name || this.expenses[existingExpenseIndex].bankName || '',
            bank: bank?.name || this.expenses[existingExpenseIndex].bank || '',
            cheque_number: this.forms.expense.cheque_number,
            chequeNumber: this.forms.expense.cheque_number,
            cheque_date:
              this.forms.expense.cheque_date ||
              this.expenses[existingExpenseIndex].cheque_date ||
              '',
            cheque_cancelled: Boolean(
              this.forms.expense.cheque_cancelled ||
                this.expenses[existingExpenseIndex].cheque_cancelled,
            ),
            original_cheque_number:
              this.forms.expense.original_cheque_number ||
              this.expenses[existingExpenseIndex].original_cheque_number ||
              '',
            original_bank_id:
              this.forms.expense.original_bank_id ||
              this.expenses[existingExpenseIndex].original_bank_id ||
              null,
          }
          this.expenses = [...this.expenses]
        }
      } else {
        // Create new expense object - keep in frontend only until disbursement is saved
        const expense = {
          id: this.getNextExpenseId(),
          accountId: this.forms.expense.accountId,
          accountName: this.forms.expense.account,
          amount: amount,
          particular: particulars,
          fund: this.forms.expense.fund || '',
          taxpayerType: this.forms.expense.taxpayerType || '',
          taxType: this.forms.expense.taxType || '',
          expense_class_id: this.forms.expense.expense_class_id,
          expense_type_id: this.forms.expense.expense_type_id,
          expense_item_id: this.forms.expense.expense_item_id,
          expense_sub_item_id: this.forms.expense.expense_sub_item_id,
          bank_id: this.forms.expense.bank_id,
          bankName: bank?.name || '',
          cheque_number: this.forms.expense.cheque_number,
          chequeNumber: this.forms.expense.cheque_number,
          // Note: No dbId until disbursement is saved
        }

        // Add to local expenses array (frontend only)
        this.expenses.push(expense)
        if (expense.cheque_number && !this.pendingChequeNumbers.includes(expense.cheque_number)) {
          this.pendingChequeNumbers.push(expense.cheque_number)
        }
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
      const expense = this.expenses.find((e) => e.id === id)

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
      this.isChequeCancel = false
      this.openExpenseDetailForEdit(row)
    },

    deleteItem(row) {
      this.deleteExpense(row.id)
    },

    markExpenseChequeCancelled(row) {
      const idx = this.expenses.findIndex((expense) => String(expense.id) === String(row.id))
      if (idx === -1) return { success: false, message: 'Expense row not found' }

      const expense = this.expenses[idx]
      const chequeNumber = expense.cheque_number || expense.chequeNumber
      if (!chequeNumber) return { success: false, message: 'No cheque number to cancel' }

      this.expenses[idx] = {
        ...expense,
        original_cheque_number: expense.original_cheque_number || chequeNumber,
        original_bank_id: expense.original_bank_id || expense.bank_id || null,
        cheque_cancelled: true,
        cheque_number: '',
        chequeNumber: '',
        bank_id: null,
        bankName: '',
        bank: '',
      }

      this.isChequeCancel = true
      this.cancelledCheques.add(chequeNumber)
      try {
        localStorage.setItem('cancelledCheques', JSON.stringify(Array.from(this.cancelledCheques)))
      } catch (error) {
        console.warn('Failed to persist cancelled cheque locally:', error)
      }
      this.expenses = [...this.expenses]
      return { success: true, message: 'Cheque marked for cancellation' }
    },

    // Helper function to format date
    formatDateForForm(dateStr) {
      if (!dateStr) return ''
      if (dateStr.includes('-')) {
        // 'YYYY-MM-DD'
        const [yyyy, mm, dd] = dateStr.split('-')
        return `${dd}/${mm}/${yyyy}`
      } else if (dateStr.includes('/')) {
        return dateStr
      }
      return dateStr
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
          payee2: '',
          amount: '',
          bankCheques: [],
        }
        this.expenses = []
        this.bankCheques = []
        // Reset bank-related selections
        this.autoBookletID = null
        this.autoCheque = null
        this.pendingChequeNumbers = []
        // } else if (formName === 'expense') {
        //   this.forms.expense = {
        //     account: '',
        //     balance: 0,
        //     fund: '',
        //     taxpayerType: '',
        //     taxType: '',
        //     particulars: '',
        //     amount: '',
        //     disbursementId: null,
        //     isEditing: false,
        //     editingExpenseId: null,
        //     bank_id: null,
        //     cheque_number: '',
        //     bankLoading: false,
        //     deductions: [],
        //     totalDeduction: 0,
        //     netAmount: 0,
        //   }
      } else if (formName === 'expense') {
        this.forms.expense = {
          ...this.forms.expense,
          account: '',
          balance: 0,
          particulars: '',
          amount: '',
          disbursementId: null,
          isEditing: false,
          editingExpenseId: null,
          bank_id: null,
          cheque_number: '',
          bankLoading: false,
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
      this.loadingEditDisbursement = row.id

      // Set a timeout to clear loading state if something goes wrong
      const loadingTimeout = setTimeout(() => {
        if (this.loadingEditDisbursement === row.id) {
          this.loadingEditDisbursement = null
        }
      }, 30000) // 30 second timeout

      try {
        // Ensure expense details are loaded for correct balance calculations
        if (this.expenseDetailsData.length === 0) {
          await this.fetchExpenseDetails()
        }

        // First fetch expense accounts to ensure we have the data for account names
        await this.fetchExpenseAccounts()

        // Then fetch the disbursement with its expenses
        await this.fetchDisbursementById(row.id)

        // Now update the account names for existing expenses using the loaded expense data
        if (this.expenses.length > 0) {
          this.expenses = this.expenses.map((expense) => {
            const accountName = this.getExpenseAccountName(
              expense.expense_class_id,
              expense.expense_type_id,
              expense.expense_item_id,
              expense.expense_sub_item_id,
            )
            return {
              ...expense,
              accountName: accountName,
            }
          })
        }

        // Refresh balances to reflect current editing context (exclude current disbursement's DB expenses)
        this.refreshExpenseAccountsWithBalances()
      } catch (error) {
        console.error('Error in openEditDisbursement:', error)
        // Re-throw the error so the calling component can handle it
        throw error
      } finally {
        // Clear the timeout
        clearTimeout(loadingTimeout)
        // Always clear loading state when done (either success or error)
        this.loadingEditDisbursement = null
      }
    },

    async saveEditedDisbursement() {
      if (!this.currentItem) return

      if (!this.expenses || this.expenses.length === 0) {
        return {
          success: false,
          error: 'At least one expense is required to save the disbursement',
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
            .filter((ed) => String(ed.disbursement_id) === String(this.currentItem.id))
            .map((ed) => Number(ed.id)),
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
              expense_sub_item_id: exp.expense_sub_item_id || null,
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

        const editDeductionTotal = (this.forms.expense.deductions || []).reduce((sum, row) => {
          return sum + (Number(row.deduction_amount ?? row.amount) || 0)
        }, 0)
        const editNetAmount = Math.max(
          0,
          Math.round(((this.totalExpensesAmount || 0) - editDeductionTotal) * 100) / 100,
        )
        const validEditBankCheques = (this.bankCheques || []).filter(
          (row) => Number(row.amount) > 0,
        )
        const editChequeTotal =
          Math.round(
            validEditBankCheques.reduce((sum, row) => {
              return sum + (Number(row.amount) || 0)
            }, 0) * 100,
          ) / 100

        if (validEditBankCheques.length && editChequeTotal !== editNetAmount) {
          const difference = Math.abs(editNetAmount - editChequeTotal).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
          return {
            success: false,
            error:
              editChequeTotal > editNetAmount
                ? `Cheque amount exceeded the net amount by ₱${difference}`
                : `Cheque amount is lacking ₱${difference}`,
          }
        }

        // Prepare the payload with ids for all expenses so backend keeps them
        const firstEditCheque = validEditBankCheques[0] || {}
        const editChequePayload = validEditBankCheques.map((cheque) => ({
          bank_id: cheque.bank_id || null,
          booklet_id: cheque.booklet_id || null,
          cheque_number: cheque.cheque_number || cheque.chequeNumber || '',
          cheque_date: cheque.cheque_date || cheque.chequeDate || null,
          bank_status: cheque.bank_status || cheque.bankStatus || '',
          amount: Number(cheque.amount) || 0,
        }))
        const payload = {
          cancel: this.isChequeCancel,
          bank_id: firstEditCheque.bank_id || this.forms.disbursement.bank_id,
          cheque_number: firstEditCheque.cheque_number || this.autoCheque,
          cheque_booklet: firstEditCheque.booklet_id || null,
          cheque_date: firstEditCheque.cheque_date || firstEditCheque.chequeDate || null,
          cheque_amount: Number(firstEditCheque.amount) || 0,
          bank_status: firstEditCheque.bank_status,
          payee: this.forms.disbursement.payee,
          payee2: this.forms.disbursement.payee2,
          net_amount: editNetAmount,
          bank_cheques: editChequePayload,
          cancelled_cheques: (this.expenses || [])
            .filter((expense) => expense.cheque_cancelled && expense.original_cheque_number)
            .map((expense) => ({
              expense_detail_id: Number(expense.id) > 0 ? Number(expense.id) : null,
              cheque_number: expense.original_cheque_number,
              bank_id: expense.original_bank_id || null,
            })),

          date: this.forms.disbursement.date,
          dv_number: this.forms.disbursement.dvNumber,
          dv_amount: this.isChequeCancel
            ? this.totalExpensesAmount
            : this.lockedTotalAmount || this.totalExpensesAmount || 0,
          deductions: (this.forms.expense.deductions || []).map((deduction) =>
            this.deductionPayload(deduction),
          ),
          expenses: this.expenses.map((expense) => ({
            id: Number(expense.id) > 0 ? Number(expense.id) : null,
            accountId: expense.accountId,
            amount: expense.amount,
            particular: expense.particular,
            bank_id: expense.bank_id, // ADD
            cheque_number: expense.cheque_number, // ADD
            cheque_date: expense.cheque_date || null,
            cancel_cheque: Boolean(expense.cheque_cancelled),
            original_cheque_number: expense.original_cheque_number || null,
            original_bank_id: expense.original_bank_id || null,
            expense_class_id: expense.expense_class_id,
            expense_type_id: expense.expense_type_id,
            expense_item_id: expense.expense_item_id,
            expense_sub_item_id: expense.expense_sub_item_id, // was missing before
          })),
        }

        const response = await api.put(
          `/api/barangay/disbursements/${this.currentItem.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )

        const unsavedManualDeductions = (this.forms.expense.deductions || []).filter(
          (deduction) => {
            const row = this.normalizeDeductionRow(deduction)
            const idNumber = Number(row.id)
            const looksLikeFrontendId = Number.isFinite(idNumber) && idNumber > 100000000000
            return (row.isManual || !row.deduction_code_id) && (!row.id || looksLikeFrontendId)
          },
        )

        if (!authStore.admin && unsavedManualDeductions.length > 0) {
          await this.saveDeductionsForDisbursement(
            this.currentItem.id,
            unsavedManualDeductions,
            token,
          )
        }

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
          error: error.response?.data?.message || 'Failed to update disbursement',
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
        payee2: '',
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
      const allOrDetailsComplete = this.currentLiquidation.orDetails?.every(
        (or) => or.orNumber && or.orAmount && or.orDate && or.orPhotoUrl,
      )

      if (!allOrDetailsComplete) {
        console.warn('Not all OR details are complete')
        return
      }

      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        // Calculate total actual expense from OR details
        const totalActualExpense =
          this.currentLiquidation.orDetails?.reduce(
            (sum, or) => sum + (parseFloat(or.orAmount) || 0),
            0,
          ) || 0

        // Prepare the payload
        const payload = {
          orDetails: this.currentLiquidation.orDetails.map((or) => ({
            id: or.id || null, // Include ID for existing OR details
            orNumber: or.orNumber,
            orAmount: or.orAmount,
            orDate: or.orDate || '',
            remarks: this.currentLiquidation.remarks || '', // Use single remarks for all OR details
            orPhotoUrl: or.serverPhotoPath || '', // Use server path only
          })),
          liquidatedAmount: totalActualExpense,
        }

        const response = await api.post(
          `/api/barangay/disbursements/${this.currentLiquidation.id}/or-details`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )

        // Refresh the disbursements list
        await this.fetchDisbursements()

        // Close the dialog after saving
        this.closeDialog('orDetails')

        return { success: true, data: response.data.data }
      } catch (error) {
        console.error('Failed to save OR details:', error)
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to save OR details',
        }
      }
    },

    async savePartialOrDetails() {
      if (!this.currentLiquidation) {
        console.warn('currentLiquidation is not available')
        return
      }

      // Check if all OR details are complete
      const allOrDetailsComplete = this.currentLiquidation.orDetails?.every(
        (or) => or.orNumber && or.orAmount && or.orDate && or.orPhotoUrl,
      )

      if (!allOrDetailsComplete) {
        console.warn('Not all OR details are complete')
        return
      }

      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        // Calculate total actual expense from OR details
        const totalActualExpense =
          this.currentLiquidation.orDetails?.reduce(
            (sum, or) => sum + (parseFloat(or.orAmount) || 0),
            0,
          ) || 0

        // Prepare the payload for partial liquidation
        const payload = {
          orDetails: this.currentLiquidation.orDetails.map((or) => ({
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

        const response = await api.post(
          `/api/barangay/disbursements/${this.currentLiquidation.id}/or-details`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )

        // Refresh the disbursements list
        await this.fetchDisbursements()

        // Close the dialog after saving
        this.closeDialog('orDetails')

        return { success: true, data: response.data.data }
      } catch (error) {
        console.error('Failed to save partial OR details:', error)
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to save partial OR details',
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

        const formData = new FormData()
        formData.append('photo', file, file.name)
        const response = await api.post('/api/barangay/disbursements/or-photo/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        })
        return { success: true, path: response.data.path }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },

    async deleteOrPhoto(path) {
      try {
        await api.delete('/api/barangay/disbursements/or-photo/delete', { data: { path } })
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },

    async deleteOrDetail(disbursementId, orDetailId) {
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        const response = await api.delete(
          `/api/barangay/disbursements/${disbursementId}/or-details/${orDetailId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )

        if (response.data.status) {
          // Remove the OR detail from the local array
          if (this.currentLiquidation?.orDetails) {
            this.currentLiquidation.orDetails = this.currentLiquidation.orDetails.filter(
              (or) => or.id !== orDetailId,
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
          message: error.response?.data?.message || 'Failed to delete OR detail',
        }
      }
    },

    async deleteDisbursement(id) {
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        const response = await api.delete(`/api/barangay/disbursements/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        if (response.data.status) {
          // Remove the disbursement from the local array
          this.disbursements = this.disbursements.filter((d) => d.id !== id)

          // Refresh expense details for balance calculations
          await this.fetchExpenseDetails()

          // Refresh expense accounts with updated balances
          this.refreshExpenseAccountsWithBalances()

          // Refresh expense accounts in background to ensure latest data
          this.refreshExpenseAccountsInBackground()

          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data.message }
        }
      } catch (error) {
        console.error('Failed to delete disbursement:', error)
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete disbursement',
        }
      }
    },

    // Load test data for development - remove in production
    loadTestData() {
      this.disbursements = [...this.testDisbursements]
    },

    // Void-related methods
    openVoidDialog(disbursement) {
      this.forms.void.disbursementId = disbursement.id
      this.forms.void.remarks = ''
      this.forms.void.requestedBy = null
      this.forms.void.requestedAt = null
      this.dialogs.void = true
    },

    closeVoidDialog() {
      this.dialogs.void = false
      this.forms.void.disbursementId = null
      this.forms.void.remarks = ''
      this.forms.void.requestedBy = null
      this.forms.void.requestedAt = null
    },

    // Edit-request related methods
    openEditRequestDialog(disbursement) {
      this.forms.edit.disbursementId = disbursement.id
      this.forms.edit.remarks = ''
      this.forms.edit.requestedBy = null
      this.forms.edit.requestedAt = null
      this.dialogs.editRequest = true
    },

    closeEditRequestDialog() {
      this.dialogs.editRequest = false
      this.forms.edit.disbursementId = null
      this.forms.edit.remarks = ''
      this.forms.edit.requestedBy = null
      this.forms.edit.requestedAt = null
    },
    async fetchVoidRequests() {
      try {
        const barangayId = this.authStore?.user?.barangay_id
        const { data } = await api.get(`/void-requests?barangay_id=${barangayId}`)
        this.voidRequests = data
      } catch (error) {
        console.error('Error fetching void requests:', error)
        this.voidRequests = []
      }
    },

    async submitEditRequest() {
      if (!this.forms.edit.remarks || this.forms.edit.remarks.trim() === '') {
        throw new Error('Remarks are required for edit requests')
      }

      this.requestingEdit = true
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        // Reuse backend pattern similar to void-request; adjust endpoint name
        const response = await api.post(
          `/api/barangay/disbursements/${this.forms.edit.disbursementId}/edit-request`,
          {
            remarks: this.forms.edit.remarks.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )

        if (response.data.status) {
          const idx = this.disbursements.findIndex((d) => d.id === this.forms.edit.disbursementId)
          if (idx !== -1) {
            this.disbursements[idx].status = 'Edit Requested'
            this.disbursements[idx].remarks = this.forms.edit.remarks.trim()
            this.disbursements[idx].edit_requested_at = new Date().toISOString()
          }

          this.closeEditRequestDialog()
          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data.message }
        }
      } catch (error) {
        console.error('Failed to submit edit request:', error)
        throw new Error(error.response?.data?.message || 'Failed to submit edit request')
      } finally {
        this.requestingEdit = false
      }
    },

    // Approve edit request
    async approveEditRequest(disbursementId) {
      this.editActionLoading = true
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        const response = await api.post(
          `/api/barangay/disbursements/${disbursementId}/edit-approve`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )

        if (response.data.status) {
          // Update the disbursement status in the list
          const idx = this.disbursements.findIndex((d) => d.id === disbursementId)
          if (idx !== -1) {
            this.disbursements[idx].status = 'Unliquidated'
            this.disbursements[idx].remarks = null
            this.disbursements[idx].edit_requested_at = null
          }
          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data.message }
        }
      } catch (error) {
        console.error('Failed to approve edit request:', error)
        throw new Error(error.response?.data?.message || 'Failed to approve edit request')
      } finally {
        this.editActionLoading = false
      }
    },

    // Reject edit request
    async rejectEditRequest(disbursementId, remarks) {
      this.editActionLoading = true
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        const response = await api.post(
          `/api/barangay/disbursements/${disbursementId}/edit-reject`,
          {
            remarks: remarks.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )

        if (response.data.status) {
          // Update the disbursement status in the list
          const idx = this.disbursements.findIndex((d) => d.id === disbursementId)
          if (idx !== -1) {
            this.disbursements[idx].status = 'Unliquidated'
            this.disbursements[idx].rejection_remarks = remarks.trim()
            this.disbursements[idx].edit_requested_at = null
          }
          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data.message }
        }
      } catch (error) {
        console.error('Failed to reject edit request:', error)
        throw new Error(error.response?.data?.message || 'Failed to reject edit request')
      } finally {
        this.editActionLoading = false
      }
    },

    // In your submitVoidRequest method, use the correct endpoint:
    async submitVoidRequest() {
      if (!this.forms.void.remarks || this.forms.void.remarks.trim() === '') {
        throw new Error('Remarks are required for void requests')
      }

      this.voidingDisbursement = true
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        // Use the correct endpoint for void requests
        const response = await api.post(
          `/api/barangay/disbursements/${this.forms.void.disbursementId}/void-request`,
          {
            remarks: this.forms.void.remarks.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )

        if (response.data.status) {
          const idx = this.disbursements.findIndex((d) => d.id === this.forms.void.disbursementId)
          if (idx !== -1) {
            this.disbursements[idx].status = 'Void Requested'
            this.disbursements[idx].remarks = this.forms.void.remarks.trim()
            this.disbursements[idx].void_requested_at = new Date().toISOString()
          }

          this.closeVoidDialog()
          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data.message }
        }
      } catch (error) {
        console.error('Failed to submit void request:', error)
        throw new Error(error.response?.data?.message || 'Failed to submit void request')
      } finally {
        this.voidingDisbursement = false
      }
    },
    async approveVoidRequest(disbursementId) {
      try {
        const authStore = useAuthStore()
        // Use barangay user token for barangay endpoints
        const token = authStore.token

        const response = await api.post(
          `/api/barangay/disbursements/${disbursementId}/void-approve`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )

        if (response.data.status) {
          // Update the disbursement status in the local array
          const disbursementIndex = this.disbursements.findIndex((d) => d.id === disbursementId)
          if (disbursementIndex !== -1) {
            this.disbursements[disbursementIndex].status = 'Voided'
            this.disbursements[disbursementIndex].void_approved_at = new Date().toISOString()
          }

          // Refresh bank library data to reflect voided cheque status
          try {
            const { useBankStore } = await import('./bankStore')
            const bankStore = useBankStore()
            await bankStore.fetchBanks()
          } catch (bankError) {
            console.warn('Failed to refresh bank data after void approval:', bankError)
            // Don't throw error here as the main operation succeeded
          }

          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data.message }
        }
      } catch (error) {
        console.error('Failed to approve void request:', error)
        throw new Error(error.response?.data?.message || 'Failed to approve void request')
      }
    },

    async rejectVoidRequest(disbursementId, rejectionRemarks) {
      try {
        const authStore = useAuthStore()
        // Use barangay user token for barangay endpoints
        const token = authStore.token

        const response = await api.post(
          `/api/barangay/disbursements/${disbursementId}/void-reject`,
          {
            remarks: rejectionRemarks,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )

        if (response.data.status) {
          // Update the disbursement status in the local array
          const disbursementIndex = this.disbursements.findIndex((d) => d.id === disbursementId)
          if (disbursementIndex !== -1) {
            this.disbursements[disbursementIndex].status = 'Unliquidated'
            this.disbursements[disbursementIndex].rejection_remarks = rejectionRemarks
            this.disbursements[disbursementIndex].void_rejected_at = new Date().toISOString()
          }

          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data.message }
        }
      } catch (error) {
        console.error('Failed to reject void request:', error)
        throw new Error(error.response?.data?.message || 'Failed to reject void request')
      }
    },

    // Direct void method for captains and SK chairpersons (no request needed)
    async voidDisbursementDirectly(disbursementId, remarks) {
      if (!remarks || remarks.trim() === '') {
        throw new Error('Remarks are required for voiding disbursements')
      }

      this.voidingDisbursement = true
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        const response = await api.post(
          `/api/barangay/disbursements/${disbursementId}/void-direct`,
          {
            remarks: remarks.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )

        if (response.data.status) {
          // Update the disbursement status in the local array
          const disbursementIndex = this.disbursements.findIndex((d) => d.id === disbursementId)
          if (disbursementIndex !== -1) {
            this.disbursements[disbursementIndex].status = 'Voided'
            this.disbursements[disbursementIndex].remarks = remarks.trim()
            this.disbursements[disbursementIndex].voided_at = new Date().toISOString()
          }

          // Refresh bank library data to reflect voided cheque status
          try {
            const { useBankStore } = await import('./bankStore')
            const bankStore = useBankStore()
            await bankStore.fetchBanks()
          } catch (bankError) {
            console.warn('Failed to refresh bank data after direct void:', bankError)
            // Don't throw error here as the main operation succeeded
          }

          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data.message }
        }
      } catch (error) {
        console.error('Failed to void disbursement directly:', error)
        throw new Error(error.response?.data?.message || 'Failed to void disbursement')
      } finally {
        this.voidingDisbursement = false
      }
    },
    // Submit reimbursement
    async submitReimbursement(reimbursementData) {
      if (!this.currentLiquidation) {
        console.warn('currentLiquidation is not available')
        return
      }

      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        // Validate required reimbursement data
        if (!reimbursementData) {
          throw new Error('Reimbursement data is required')
        }

        if (!reimbursementData.ref_dv_number) {
          throw new Error('Reference DV number is required')
        }

        if (!reimbursementData.dvNumber) {
          throw new Error('DV number is required')
        }

        if (!reimbursementData.dv_amount || reimbursementData.dv_amount <= 0) {
          throw new Error('Valid DV amount is required')
        }

        if (!reimbursementData.bank_id) {
          throw new Error('Bank selection is required')
        }

        if (!reimbursementData.cheque_number || reimbursementData.cheque_number.trim() === '') {
          throw new Error('Cheque number is required')
        }

        if (!reimbursementData.expense_account) {
          throw new Error('Expense account is required')
        }

        if (!reimbursementData.expense_account.id) {
          throw new Error('Expense account ID is required')
        }

        // Validate expense item ID - it might be required
        // Temporarily disabled for testing
        // if (!reimbursementData.expense_account.expense_item_id) {
        //   throw new Error('Expense item ID is required for reimbursement');
        // }

        if (!reimbursementData.or_number) {
          throw new Error('OR number is required')
        }

        if (!reimbursementData.or_amount || reimbursementData.or_amount <= 0) {
          throw new Error('Valid OR amount is required')
        }

        // Prepare the payload for reimbursement
        const today = new Date()
        // Format date as DD/MM/YYYY to match the expected format
        const dd = String(today.getDate()).padStart(2, '0')
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const yyyy = today.getFullYear()
        const formattedDate = `${dd}/${mm}/${yyyy}`

        // Calculate total actual expense from OR details
        const totalActualExpense =
          this.currentLiquidation.orDetails?.reduce(
            (sum, or) => sum + (parseFloat(or.orAmount) || 0),
            0,
          ) || 0

        const payload = {
          // Required fields for disbursements table
          date: formattedDate,
          dv_number: reimbursementData.dvNumber,
          cheque_number: reimbursementData.cheque_number,
          bank_id: reimbursementData.bank_id,
          payee: this.currentLiquidation.payee, // Default payee for reimbursements
          dv_amount: parseFloat(reimbursementData.dv_amount),
          net_amount: parseFloat(reimbursementData.net_amount),
          ref_dv_number: reimbursementData.ref_dv_number, // Reference to original DV

          // Additional fields
          expenses: [
            {
              accountId: reimbursementData.expense_account.id,
              // amount: parseFloat(reimbursementData.dv_amount),
              amount: parseFloat(reimbursementData.net_amount),
              particular: `Reimbursement for DV ${reimbursementData.ref_dv_number}`,
              expense_class_id: reimbursementData.expense_account.expense_class_id,
              expense_type_id: reimbursementData.expense_account.expense_type_id,
              expense_item_id: reimbursementData.expense_account.expense_item_id,
            },
          ],

          orDetails: this.currentLiquidation.orDetails
            .filter((or) => or.id !== null) // Exclude reimbursement entries with null id
            .map((or) => ({
              id: or.id,
              orNumber: or.orNumber,
              orAmount: or.orAmount, // Keep original OR amount
              orRefAmount: 0, // No reference amount for reimbursement
              orDate: or.orDate || '',
              remarks: or.remarks, // Keep original remarks
              orPhotoUrl: or.serverPhotoPath || or.orPhotoUrl || 'or-photos/samplejaskd.png',
            })),
          liquidatedAmount: totalActualExpense,
        }

        // Add barangay_id for admin users if selected
        if (authStore.admin) {
          const selectedBarangay = authStore.getSelectedBarangay()
          if (selectedBarangay) {
            payload.barangay_id = selectedBarangay
          }
        }

        // Use different endpoints for admin vs regular users
        const endpoint = authStore.admin
          ? `/api/admin/reimbursements/${this.currentLiquidation.id}`
          : `/api/barangay/reimbursements/${this.currentLiquidation.id}`

        let response
        try {
          response = await api.post(endpoint, payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          })
        } catch (error) {
          console.error('Failed to submit reimbursement:', error)
          console.error('Error response:', error.response?.data)

          // Handle budget validation error specifically
          if (
            error.response?.status === 400 &&
            error.response?.data?.error === 'Insufficient budget'
          ) {
            return {
              success: false,
              error: 'Insufficient budget',
              message:
                error.response.data.message ||
                'No more budget for this account. Please commit again.',
            }
          }

          // Re-throw other errors to be handled by the outer catch block
          throw error
        }

        // Check if the response indicates success
        if (response.data.status) {
          // Refresh the disbursements list
          await this.fetchDisbursements()
          return { success: true, data: response.data.data }
        } else {
          return {
            success: false,
            error: response.data.error || response.data.message || 'Failed to submit reimbursement',
            message: response.data.message,
          }
        }
      } catch (error) {
        console.error('Failed to submit reimbursement:', error)
        console.error('Error response:', error.response?.data)

        // Provide more specific error messages
        let errorMessage = 'Failed to submit reimbursement'

        if (error.response?.status === 422) {
          // Handle validation errors specifically
          if (error.response.data?.errors) {
            const errors = error.response.data.errors
            const errorMessages = Object.values(errors).flat()
            errorMessage = `Validation errors: ${errorMessages.join(', ')}`
          } else if (error.response.data?.message) {
            errorMessage = `Validation error: ${error.response.data.message}`
          } else {
            errorMessage = 'Validation failed. Please check all required fields.'
          }
        } else if (error.message) {
          errorMessage = error.message
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        }

        return {
          success: false,
          error: errorMessage,
        }
      }
    },
    async cancelCheque() {
      try {
        const config = this.getAuthConfig()
        // Use admin banks endpoint when admin is logged in
        const authStore = useAuthStore()
        const endpoint = authStore.admin ? '/api/admin/banks' : '/api/barangay/banks'
        const response = await api.get(endpoint, config)

        const cancelBanks = (response.data.data || response.data || []).map((bank) => ({
          id: bank.id,
          name: bank.bank_name || bank.name,
          status: bank.status || 'Available',
          booklets_count: bank.booklets_count || 0, // Changed from cheques_count
          booklets: bank.booklets || [], // Changed from cheques
        }))
        this.cancelBanks = cancelBanks.filter((bank) => bank.status === 'Available')

        if (this.cancelBanks.length == 0) {
          this.cancelBanks[0] = { id: 0, name: 'No Available Bank' }
        }

        //============================================================================
        //============================================================================
        //============================================================================
      } catch (error) {
        console.error('Failed to cancel cheque:', error)
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to cancel cheque',
        }
      }
    },
    async submitCancelCheque() {
      try {
        const config = this.getAuthConfig()
        console.error('Fsksdghisdgh', this.cancelBank)
        const bankData = await api.get(
          `/api/barangay/banks/${this.cancelBank.id}/available-cheques`,
          config,
        )
        const data = bankData.data.data || []
        console.error('Fetched booklets data:', data.booklet_numb)
        console.error('Fetched booklets data:', data.cheque[0].cheque_number)

        this.cancelChequed = data.cheque[0].cheque_number || null
      } catch (error) {
        console.error('Failed to submit cancel cheque:', error)
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to submit cancel cheque',
        }
      }
    },

    // Method to load cancelled cheques from localStorage
    loadCancelledCheques() {
      try {
        const stored = localStorage.getItem('cancelledCheques')
        if (stored) {
          this.cancelledCheques = new Set(JSON.parse(stored))
        }
      } catch (error) {
        console.warn('Failed to load cancelled cheques from localStorage:', error)
        this.cancelledCheques = new Set()
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
          const availableCheques = data.cheque.filter((cheque) => {
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
              message: 'Available cheque found',
            }
          } else {
            return {
              success: false,
              message:
                'No available cheques found for this bank (all cheques are cancelled or used)',
            }
          }
        } else {
          return {
            success: false,
            message: 'No available cheques found for this bank',
          }
        }
      } catch (error) {
        console.error('Failed to get available cheque:', error)
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to get available cheque',
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

        const response = await api.patch(
          `/api/barangay/disbursements/${disbursementId}/mark-stale`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )

        if (response.data.status) {
          // Update the local disbursement status
          const disbursementIndex = this.disbursements.findIndex((d) => d.id === disbursementId)
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
          message: error.response?.data?.message || 'Failed to update disbursement to stale',
        }
      }
    },

    // Method to update cheque status to stale (frontend only)
    async updateChequeToStale(disbursementId) {
      try {
        // Find the disbursement to get the cheque number
        const disbursement = this.disbursements.find((d) => d.id === disbursementId)
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
          message: error.message || 'Failed to update cheque to stale',
        }
      }
    },

    // Helper method to update cheque status to stale in bank store
    updateChequeStatusToStale(chequeNumber) {
      try {
        // Import bank store and update cheque status
        import('./bankStore')
          .then(({ useBankStore }) => {
            const bankStore = useBankStore()

            // Find the bank that contains this cheque and update its status
            for (const bank of bankStore.banks) {
              if (bank.cheques) {
                const cheque = bank.cheques.find((c) => c.chequeNo === chequeNumber)
                if (cheque) {
                  cheque.status = 'stale'
                  break
                }
              }
            }
          })
          .catch((error) => {
            console.warn('Failed to update cheque status in bank store:', error)
          })
      } catch (error) {
        console.warn('Failed to update cheque status:', error)
      }
    },

    // Method to check and update stale disbursements
    async checkAndUpdateStaleDisbursements() {
      try {
        const staleDisbursements = this.disbursements.filter(
          (disbursement) => shouldBeStale(disbursement) && disbursement.status !== 'Stale',
        )

        if (staleDisbursements.length === 0) {
          return { success: true, message: 'No disbursements need to be marked as stale' }
        }

        // Update each stale disbursement and its cheque in the backend
        const updatePromises = staleDisbursements.map(async (disbursement) => {
          const disbursementResult = await this.updateDisbursementToStale(disbursement.id)
          const chequeResult = await this.updateChequeToStale(disbursement.id)
          return {
            disbursement: disbursementResult,
            cheque: chequeResult,
            success: disbursementResult.success && chequeResult.success,
          }
        })

        const results = await Promise.allSettled(updatePromises)
        const successful = results.filter(
          (result) => result.status === 'fulfilled' && result.value.success,
        ).length
        const failed = results.filter(
          (result) => result.status === 'rejected' || !result.value.success,
        ).length

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
          failed: failed,
        }
      } catch (error) {
        console.error('Failed to check and update stale disbursements:', error)
        return {
          success: false,
          message: error.message || 'Failed to check and update stale disbursements',
        }
      }
    },
  },
})

function calculateAging(dateString) {
  // Accepts 'YYYY-MM-DD' or 'YYYY/MM/DD'
  if (!dateString) return '0 days'
  const parts = dateString.includes('-') ? dateString.split('-') : dateString.split('/')
  let yyyy, mm, dd
  if (parts[0].length === 4) {
    // 'YYYY-MM-DD'
    ;[yyyy, mm, dd] = parts
  } else {
    // 'DD/MM/YYYY'
    ;[dd, mm, yyyy] = parts
  }
  const disbDate = new Date(`${yyyy}-${mm}-${dd}`)
  const today = new Date()
  const diffTime = today - disbDate
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return `${diffDays} days`
}

function calculateAgingDays(dateString) {
  // Helper function to get just the number of days for stale checking
  if (!dateString) return 0
  const parts = dateString.includes('-') ? dateString.split('-') : dateString.split('/')
  let yyyy, mm, dd
  if (parts[0].length === 4) {
    // 'YYYY-MM-DD'
    ;[yyyy, mm, dd] = parts
  } else {
    // 'DD/MM/YYYY'
    ;[dd, mm, yyyy] = parts
  }
  const disbDate = new Date(`${yyyy}-${mm}-${dd}`)
  const today = new Date()
  const diffTime = today - disbDate
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function shouldBeStale(disbursement) {
  // Check if disbursement should be marked as stale based on aging
  if (!disbursement.date) return false

  // Don't mark as stale if already liquidated, voided, or already stale
  if (['Liquidated', 'Voided', 'Stale'].includes(disbursement.status)) {
    return false
  }

  const agingDays = calculateAgingDays(disbursement.date)
  return agingDays >= 180
}
