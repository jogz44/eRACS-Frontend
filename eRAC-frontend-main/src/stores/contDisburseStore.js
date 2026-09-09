import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth'
import { useContApprStore } from './contApprStore'
import { useBankStore } from './bankStore'

const bankStore = useBankStore()
const authStore = useAuthStore()

const getAuthConfig = () => {
  const authStore = useAuthStore()
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
}

const getExpenseChequeNumber = (expense) =>
  expense?.cheque_number ||
  expense?.chequeNumber ||
  expense?.check_number ||
  expense?.checkNumber ||
  expense?.cheque_no ||
  expense?.chequeNo ||
  ''

const parseDmyDate = (date = null) => {
  const today = new Date()
  const value =
    date ||
    [
      String(today.getDate()).padStart(2, '0'),
      String(today.getMonth() + 1).padStart(2, '0'),
      today.getFullYear(),
    ].join('/')
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (!match) return null

  const [, dd, mm, yyyy] = match
  const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd))

  if (
    parsed.getFullYear() !== Number(yyyy) ||
    parsed.getMonth() !== Number(mm) - 1 ||
    parsed.getDate() !== Number(dd)
  ) {
    return null
  }

  return { dd, mm, yyyy }
}

const getDvPrefixForDate = (date = null) => {
  const parsedDate = parseDmyDate(date) || parseDmyDate()
  return `DV-${String(parsedDate.yyyy).slice(-2)}-${parsedDate.mm}-`
}

const getExpenseChequeDate = (expense, disbursement = {}) =>
  expense?.cheque_date ||
  expense?.chequeDate ||
  expense?.check_date ||
  expense?.checkDate ||
  disbursement?.cheque_date ||
  ''

export const useContDisbursementStore = defineStore('contdisbursement', {
  state: () => ({
    // Main data collections
    particulars: [],
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
    bankCheques: [],
    // disbursements: [], // Remove static data, will be loaded from API
    // selectedYear: null,
    // pendingChequeNumbers: [], // cheque numbers assigned in current session but not yet saved
    cachedDeductionsByDisbursement: {},
    cachedBankChequesByDisbursement: {},
    disbursements: [], // Remove static data, will be loaded from API
    pendingChequeNumbers: [], // cheque numbers assigned in current session but not yet saved

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
        fund: 'continuing',
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
    },
    // Pagination
    pagination: { rowsPerPage: 10 },
  }),

  getters: {
    // Get expense accounts from continuing appropriations
    expenseAccounts(state) {
      if (!state.expenseData || state.expenseData.length === 0) {
        return []
      }

      // Helper function to calculate remaining balance
      const calculateRemainingBalance = (accountId, originalAmount, type) => {
        if (!state.expenseDetailsData || state.expenseDetailsData.length === 0) {
          return originalAmount
        }

        const disbursedAmount = state.expenseDetailsData
          .filter((detail) => {
            if (type === 'subitem') {
              return detail.expense_sub_item_id === accountId
            } else if (type === 'item') {
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
            // If expense type has items with balance, show both items and their sub-items
            expenseType.children.forEach((expenseItem) => {
              if (expenseItem.amount && expenseItem.amount > 0) {
                // Check if this item has sub-items
                const hasSubItems = expenseItem.children && expenseItem.children.length > 0

                if (hasSubItems) {
                  // If item has sub-items, show each sub-item separately
                  expenseItem.children.forEach((expenseSubItem) => {
                    if (expenseSubItem.amount && expenseSubItem.amount > 0) {
                      const remainingBalance = calculateRemainingBalance(
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
                          expense_class_id: expenseItem.expense_class_id ?? null,
                          expense_type_id: expenseItem.expense_type_id ?? null,
                          expense_item_id: expenseItem.id,
                          expense_sub_item_id: expenseSubItem.id,
                          budget_source:
                            expenseSubItem.budget_source ||
                            expenseItem.budget_source ||
                            expenseType.budget_source ||
                            expenseClass.budget_source ||
                            'Continuing Appropriation',
                          description:
                            expenseSubItem.description ||
                            expenseItem.description ||
                            expenseType.description ||
                            expenseClass.description,
                        }
                        acc.push(expenseSubItemEntry)
                      }
                    }
                  })
                } else {
                  // If item has no sub-items, show the item itself
                  const remainingBalance = calculateRemainingBalance(
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
                      expense_class_id: expenseItem.expense_class_id ?? null,
                      expense_type_id: expenseItem.expense_type_id ?? null,
                      expense_item_id: expenseItem.id,
                      expense_sub_item_id: null,
                      budget_source:
                        expenseItem.budget_source ||
                        expenseType.budget_source ||
                        expenseClass.budget_source ||
                        'Continuing Appropriation',
                      description:
                        expenseItem.description ||
                        expenseType.description ||
                        expenseClass.description,
                    }
                    acc.push(expenseItemEntry)
                  }
                }
              }
            })
          } else {
            // If expense type has no items with balance, show the type itself (if it has balance)
            if (expenseType.amount && expenseType.amount > 0) {
              const remainingBalance = calculateRemainingBalance(
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
                  expense_class_id: expenseType.expense_class_id ?? null,
                  expense_type_id: expenseType.id,
                  expense_item_id: null,
                  expense_sub_item_id: null,
                  budget_source:
                    expenseType.budget_source ||
                    expenseClass.budget_source ||
                    'Continuing Appropriation',
                  description: expenseType.description || expenseClass.description,
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
          .filter((detail) => {
            if (type === 'subitem') {
              return detail.expense_sub_item_id === accountId
            } else if (type === 'item') {
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
                  'item',
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
                    budget_source:
                      expenseItem.budget_source ||
                      expenseType.budget_source ||
                      expenseClass.budget_source ||
                      'Continuing Appropriation', // Add budget source information
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
                'type',
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
                  budget_source:
                    expenseType.budget_source ||
                    expenseClass.budget_source ||
                    'Continuing Appropriation',
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
      // { name: 'chequeNumber', label: 'Cheque Number', field: 'chequeNumber', align: 'left', sortable: true,},
      // { name: 'bank', label: 'Bank', field: 'bank', align: 'left', sortable: true },

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
      // return state.disbursements.filter((disbursement) => {
      //   const matchesSearch =
      //     disbursement.payee.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      //     disbursement.dvNumber.toLowerCase().includes(state.searchQuery.toLowerCase())
      //   const matchesDate = true // Add date filtering logic here
      //   return matchesSearch && matchesDate
      // })

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

        return matchesSearch
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

      let base = this.expenseAccounts.filter((item) => {
        // Use the same logic as in openExpenseDetail to get the correct accountId
        const itemAccountId = item.continuingAccountId || item.id
        const isAlreadyAdded = addedIds.has(String(itemAccountId))
        return !isAlreadyAdded
      })

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
        .filter((detail) => {
          if (type === 'subitem') {
            return detail.expense_sub_item_id === accountId 
          } else if (type === 'item') {
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

        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, 10000) // 10 second timeout

        try {
          // Prefer the endpoint intended for continuing disbursement account selection.
          let response = await api.get(
            '/api/barangay/continuing-appropriations/disbursement-accounts',
            {
              ...config,
              signal: controller.signal,
            },
          )

          clearTimeout(timeoutId)

          if (response.data?.status && response.data?.data) {
            const rows = response.data.data || []
            this.expenseData = this.transformDisbursementAccountsToHierarchy(rows)
          } else {
            this.expenseData = []
          }
        } catch (apiError) {
          clearTimeout(timeoutId)
          console.warn(
            'Disbursement accounts endpoint failed, trying continuing appropriation list:',
            apiError,
          )
          const fallbackResponse = await api.get(
            '/api/barangay/continuing-appropriations/list',
            config,
          )
          const appropriations = fallbackResponse.data?.data || []
          this.expenseData = this.transformContinuingAppropriationsToHierarchy(appropriations)
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
      }
    },

    async fetchParticulars() {
      try {
        const config = getAuthConfig()
        const response = await api.get('/api/barangay/particulars', config)
        const rows = response.data?.data || response.data || []

        this.particulars = (Array.isArray(rows) ? rows : [])
          .map((item) => {
            const label =
              item.particulars ||
              item.particular ||
              item.name ||
              (typeof item === 'string' ? item : '')

            return label ? { label } : null
          })
          .filter(Boolean)
      } catch (error) {
        console.error('Error fetching particulars:', error)
        this.particulars = []
      }
    },

    transformDisbursementAccountsToHierarchy(accounts) {
      const hierarchy = {}

      ;(accounts || []).forEach((account) => {
        const expenseClass = account.expenseClass || 'Continuing Appropriation'
        const expenseType = account.expenseType || '-'
        const expenseItem = account.expenseItem || '-'

        if (!hierarchy[expenseClass]) {
          hierarchy[expenseClass] = {
            id: `class_${expenseClass}`,
            name: expenseClass,
            children: {},
          }
        }

        if (!hierarchy[expenseClass].children[expenseType]) {
          hierarchy[expenseClass].children[expenseType] = {
            id: `type_${expenseType}`,
            name: expenseType,
            children: {},
          }
        }

        hierarchy[expenseClass].children[expenseType].children[`${account.id}-${expenseItem}`] = {
          id: account.id,
          name: expenseItem,
          amount: Number(account.remaining_amount || account.balance || 0),
          budget_source: 'Continuing Appropriation',
          description: account.description || `Continued from ${account.year || 'previous year'}`,
          continuingAccountId: account.id,
          continuingAppropriationId: account.continuingAppropriationId,
          expense_class_id: account.expense_class_id || account.expenseClassId || null,
          expense_type_id: account.expense_type_id || account.expenseTypeId || null,
          expense_item_id: account.expense_item_id || account.expenseItemId || null,
          children: (account.subItems || []).map((subItem) => ({
            id: subItem.id,
            name: subItem.name,
            amount: 0,
            order: subItem.order || 0,
          })),
        }
      })

      return Object.values(hierarchy).map((classItem) => ({
        ...classItem,
        children: Object.values(classItem.children).map((typeItem) => ({
          ...typeItem,
          children: Object.values(typeItem.children),
        })),
      }))
    },

    // Transform continuing appropriations to expense hierarchy
    transformContinuingAppropriationsToHierarchy(appropriations) {
      const hierarchy = {}

      appropriations.forEach((appropriation) => {
        // Process both committed and draft appropriations for now
        if (appropriation.status !== 'committed' && appropriation.status !== 'draft') {
          return
        }

        // If there are no accounts or accounts array is empty, skip this appropriation
        // because we need actual cont_appro_accounts records to create disbursements
        if (!appropriation.accounts || appropriation.accounts.length === 0) {
          return
        }

        // Process accounts
        appropriation.accounts.forEach((account) => {
          // Use the structured data from the API response
          const expenseClass = account.expenseClass
          const expenseType = account.expenseType
          const expenseItem = account.expenseItem

          if (!hierarchy[expenseClass]) {
            hierarchy[expenseClass] = {
              id: `class_${expenseClass}`,
              name: expenseClass,
              children: {},
            }
          }

          if (!hierarchy[expenseClass].children[expenseType]) {
            hierarchy[expenseClass].children[expenseType] = {
              id: `type_${expenseType}`,
              name: expenseType,
              children: {},
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
              continuingAppropriationId: appropriation.id,
              children: account.subItems
                ? account.subItems.map((subItem) => ({
                    id: subItem.id,
                    name: subItem.name,
                    amount: 0, // Sub-items don't have direct allocations in continuing appropriations
                    order: subItem.order || 0,
                  }))
                : [],
            }
          }
        })
      })

      // Convert to array format
      const result = Object.values(hierarchy).map((classItem) => ({
        ...classItem,
        children: Object.values(classItem.children).map((typeItem) => ({
          ...typeItem,
          children: Object.values(typeItem.children),
        })),
      }))

      return result
    },

    // Fetch continuing disbursements
    // async fetchDisbursements(year = null) {
    //   this.loadingDisbursements = true
    //   try {
    //     const config = getAuthConfig()
    //     const activeYear = year || this.selectedYear
    //     if (activeYear) this.selectedYear = Number(activeYear)

    //     let rows = []

    //     try {
    //       // Try with year filter first
    //       const params = activeYear ? { year: Number(activeYear) } : {}
    //       const response = await api.get('/api/barangay/continuing-disbursements', {
    //         ...config,
    //         params,
    //       })
    //       if (response.data?.status) {
    //         rows = response.data.data || []
    //       }
    //     } catch (yearFilterError) {
    //       console.warn(
    //         'Year-filtered endpoint failed, fetching all and filtering client-side:',
    //         yearFilterError,
    //       )

    //       // Fallback: fetch all, filter client-side
    //       const fallback = await api.get('/api/barangay/continuing-disbursements', config)
    //       rows = fallback.data?.data || []
    //     }

    //     // Always apply client-side year filter as safety net
    //     const normalizeRow = (row) => {
    //       const grossAmount = Number(row.dvAmount ?? row.dv_amount ?? row.amount ?? 0)
    //       const deductions = this.normalizeDeductions(row.deductions || row.expense?.deductions || [])
    //       const netAmount = this.resolveNetAmount({ ...row, dvAmount: grossAmount }, deductions)

    //       return {
    //         ...row,
    //         dvAmount: grossAmount,
    //         deductions,
    //         netAmount,
    //         bank: row.bank || row.bank_name || '-',
    //         chequeNumber: row.chequeNumber || row.cheque_number || '',
    //         bank_cheques: this.normalizeBankCheques(row.bank_cheques || row.entries || [], {
    //           bank_id: row.bank_id || null,
    //           bank_name: row.bank || row.bank_name || '',
    //         }),
    //       }
    //     }

    //     this.disbursements = (activeYear
    //       ? rows.filter((row) => {
    //           const rowYear = row.date ? new Date(row.date).getFullYear() : null
    //           return rowYear === Number(activeYear)
    //         })
    //       : rows
    //     ).map(normalizeRow)
    //   } catch (error) {
    //     if (!error.response) {
    //       // Network error or CORS block
    //       console.error('Network/CORS error - cannot reach backend:', error.message)
    //       this.disbursements = []
    //       // Optionally show a user-facing message
    //       return
    //     }

    //     // console.error('Status:', error.response?.status)
    //     // console.error('Response body:', error.response?.data)
    //     // console.error('Error fetching continuing disbursements:', error)
    //     this.error = error.response?.data?.message || error.message
    //     this.disbursements = [] // prevent undefined errors in the table
    //   } finally {
    //     this.loadingDisbursements = false
    //   }
    // },

    async fetchDisbursements(year = null) {
      this.loadingDisbursements = true
      try {
        const authStore = useAuthStore()
        const endpoint = authStore.admin
          ? '/api/admin/continuing-disbursements'
          : '/api/barangay/continuing-disbursements'
        const token = authStore.admin ? authStore.adminToken : authStore.token

        const params = {}
        if (authStore.admin) {
          const selectedBarangay = authStore.getSelectedBarangay()
          if (selectedBarangay) params.barangay_id = selectedBarangay
        }
        params.year = year !== null && year !== undefined ? Number(year) : new Date().getFullYear()

        // Fetch all three in parallel
        const [disbursementsResponse, particularsResponse] = await Promise.allSettled([
          api.get(endpoint, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            params,
          }),
          api.get(authStore.admin ? '/api/admin/particulars' : '/api/barangay/particulars', {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
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
                // console.log('raw disbursement row:', disbursementsResponse.value.data.data?.[0])
                const deductionsFromTable =
                  deductionsByDisbursement[String(d.id)] || deductionsByDisbursement[d.id] || []
                const deductions = deductionsFromTable.length
                  ? deductionsFromTable
                  : this.normalizeDeductions(d.deductions || [])
                const bankCheques = this.normalizeBankCheques(d.bank_cheques || [], {
                  bank_id: d.bank_id || null,
                  bank_name: d.bank_name || '',
                  bank: d.bank_name || '',
                })
                if (bankCheques.length) {
                  this.cachedBankChequesByDisbursement = {
                    ...this.cachedBankChequesByDisbursement,
                    [d.id]: bankCheques,
                  }
                }

                const derivedParticular =
                  d.particular ||
                  (d.expenses || [])
                    .map((e) => e.particular)
                    .filter(Boolean)
                    .join(', ')

                // const derivedBank =
                //   d.bank_name ||
                //   bankCheques.map((c) => c.bank_name).filter(Boolean).join(', ')
                // const derivedCheque =
                //   d.chequeNumber ||
                //   bankCheques.map((c) => c.cheque_number).filter(Boolean).join(', ')
                const normalizedDvAmount = Number(
                  d.dv_amount ?? d.dvAmount ?? d.amount ?? d.gross_amount ?? 0,
                )

                return {
                  id: d.id,
                  row_id: d.row_id,
                  disbursement_id: d.disbursement_id,
                  expense_detail_id: d.expense_detail_id,
                  date: d.date,
                  dvNumber: d.dvNumber || d.dv_number || '',
                  dv_number: d.dv_number || d.dvNumber || '',
                  netAmount: this.resolveNetAmount(d, deductions),
                  deductions,
                  // chequeNumber: derivedCheque,
                  chequeNumber: d.cheque_number,
                  bank_cheques: bankCheques,
                  bank_id: d.bank_id,
                  // bank: derivedBank,
                  bank: d.bank_name,
                  bank_status: d.bank_status,
                  payee: d.payee,
                  payee2: d.payee2 || d.payee_2 || d.payee2_name || '',
                  particular: derivedParticular,
                  dvAmount: normalizedDvAmount,
                  dv_amount: normalizedDvAmount,
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

        // Merge all into one array
        this.disbursements = [...regularRows]

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

    // Fetch single disbursement by ID
    // async fetchDisbursementById(id) {
    //   try {
    //     const config = getAuthConfig()
    //     const response = await api.get(`/api/barangay/continuing-disbursements/${id}`, config)

    //     if (response.data?.status) {
    //       const row = response.data.data
    //       const grossAmount = Number(row.dvAmount ?? row.dv_amount ?? row.amount ?? 0)
    //       const deductions = this.normalizeDeductions(row.deductions || row.expense?.deductions || [])
    //       const netAmount = this.resolveNetAmount({ ...row, dvAmount: grossAmount }, deductions)

    //       return {
    //         ...row,
    //         dvAmount: grossAmount,
    //         deductions,
    //         netAmount,
    //         bank: row.bank || row.bank_name || '-',
    //         chequeNumber: row.chequeNumber || row.cheque_number || '',
    //         bank_cheques: this.normalizeBankCheques(row.bank_cheques || row.entries || [], {
    //           bank_id: row.bank_id || null,
    //           bank_name: row.bank || row.bank_name || '',
    //         }),
    //       }
    //     }
    //     return null
    //   } catch (error) {
    //     console.error('Error fetching disbursement by ID:', error)
    //     return null
    //   }
    // },

    async fetchDisbursementById(id) {
      this.isChequeCancel = false
      try {
        const authStore = useAuthStore()
        // Use barangay user token for barangay endpoints
        const token = authStore.token
        const response = await api.get(`/api/barangay/continuing-disbursements/${id}`, {
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
          this.bankCheques = savedBankCheques.length
            ? savedBankCheques
            : this.normalizeBankCheques(disbursement.bank_cheques || [], {
                bank_id: disbursement.bank_id || null,
                bank_name: disbursement.bank_name || '',
                // booklet_id: disbursement.booklet_id || null,
              })
          if (!this.bankCheques.length && disbursement.cheque_number) {
            const deductionsForFallback = this.normalizeDeductions(disbursement.deductions || [])
            this.bankCheques = [
              {
                id: `existing-${disbursement.cheque_number}`,
                bank_id: disbursement.bank_id || null,
                booklet_id: disbursement.booklet_id || null,
                bankName: disbursement.bank_name || '',
                bank: disbursement.bank_name || '',
                cheque_number: disbursement.cheque_number,
                cheque_date: disbursement.cheque_date || '',
                amount: this.resolveNetAmount(disbursement, deductionsForFallback),
              },
            ]
          }

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

    // async fetchDisbursementForView(id) {
    //   return this.fetchDisbursementById(id)
    // },
    async fetchDisbursementForView(id) {
      try {
        const authStore = useAuthStore()

        const endpoint = authStore.admin
          ? `/api/admin/continuing-disbursements/${id}`
          : `/api/barangay/continuing-disbursements/${id}`
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
          const rawBankCheques = disbursement.bank_cheques || []
          const resolvedNetAmount = this.resolveNetAmount(disbursement, deductions)
          const normalizedBankCheques =
            savedBankCheques.length > 0
              ? savedBankCheques
              : rawBankCheques.length > 0
                ? this.normalizeBankCheques(rawBankCheques, {
                    bank_id: disbursement.bank_id || null,
                    bank_name: disbursement.bank_name || '',
                  })
                : disbursement.cheque_number
                  ? [
                      {
                        id: `existing-${disbursement.cheque_number}`,
                        bank_id: disbursement.bank_id || null,
                        booklet_id: disbursement.booklet_id || null,
                        bank_name: disbursement.bank_name || '',
                        bankName: disbursement.bank_name || '',
                        cheque_number: disbursement.cheque_number,
                        chequeNumber: disbursement.cheque_number,
                        cheque_date: disbursement.cheque_date || '',
                        chequeDate: disbursement.cheque_date || '',
                        amount: resolvedNetAmount,
                      },
                    ]
                  : []

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
        const contApprStore = useContApprStore()

        // Pass budget source filter to appropriation store
        if (this.selectedBudgetSource && this.selectedBudgetSource !== 'all') {
          // Set the budget type filter in appropriation store
          contApprStore.setSelectedBudgetType(this.selectedBudgetSource)
        }

        await contApprStore.fetchExpenseHierarchy()
        this.expenseData = contApprStore.allocations || []

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

    generateLocalDvNumber(date = null) {
      const prefix = getDvPrefixForDate(date)

      // Match backend controller behavior: sequence resets for each barangay/month.
      let maxSequence = 0
      ;(this.disbursements || [])
        .map((d) => d.dvNumber)
        .filter(Boolean)
        .forEach((dv) => {
          if (!dv.startsWith(prefix)) return

          const match = dv.match(/(\d+)$/)
          if (match) {
            const sequence = parseInt(match[1], 10) || 0
            if (sequence > maxSequence) maxSequence = sequence
          }
        })

      return `${prefix}${String(maxSequence + 1).padStart(3, '0')}`
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

    async openDialog(dialogName) {
      try {
        if (dialogName === 'disbursement') {
          // Generate new disbursement defaults including DV number
          this.generateNewDisbursementDefaults()
        } else if (dialogName === 'expense') {
          // Only fetch continuing appropriations if not already loaded
          if (this.expenseData.length === 0) {
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
          }
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
      this.currentLiquidation = JSON.parse(JSON.stringify(item))

      // Ensure date is in DD/MM/YYYY format for the component
      if (this.currentLiquidation.date) {
        // If date is in YYYY-MM-DD format, convert to DD/MM/YYYY
        if (this.currentLiquidation.date.includes('-')) {
          const dateParts = this.currentLiquidation.date.split('-')
          if (dateParts.length === 3) {
            this.currentLiquidation.date = `${dateParts[2].padStart(2, '0')}/${dateParts[1].padStart(2, '0')}/${dateParts[0]}`
          }
        }
      } else {
        // If no date, set today's date
        const today = new Date()
        const dd = String(today.getDate()).padStart(2, '0')
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const yyyy = today.getFullYear()
        this.currentLiquidation.date = `${dd}/${mm}/${yyyy}`
      }

      // Fetch existing OR Details from backend if this is a partial liquidation
      if (item.id && item.status === 'Partial') {
        try {
          const config = getAuthConfig()
          const res = await api.get(
            `/api/barangay/continuing-disbursements/${item.id}/or-details`,
            config,
          )
          const backendUrl = 'http://localhost:9000'
          this.currentLiquidation.orDetails = res.data.data.map((or) => {
            // Date is already in DD/MM/YYYY format from backend
            return {
              id: or.id, // Keep the original ID for updating
              orDate: or.orDate, // Backend already returns in DD/MM/YYYY format
              orNumber: or.orNumber,
              orAmount: or.orAmount,
              orImage: or.orPhotoUrl ? `${backendUrl}/storage/${or.orPhotoUrl}` : null,
              orPhotoUrl: or.orPhotoUrl ? `${backendUrl}/storage/${or.orPhotoUrl}` : null,
              serverPhotoPath: or.orPhotoUrl,
              remarks: or.remarks || '',
            }
          })

          // Set single remarks from the latest OR detail (most recent one)
          if (res.data.data.length > 0) {
            // Get the latest OR detail (last in the array) for remarks
            const latestOrDetail = res.data.data[res.data.data.length - 1]
            this.currentLiquidation.remarks = latestOrDetail.remarks || ''
          }
        } catch (error) {
          console.error('Error fetching existing OR details:', error)
          this.currentLiquidation.orDetails = []
        }
      } else {
        // For new liquidations, initialize empty - component will add initial row
        this.currentLiquidation.orDetails = []
      }

      this.dialogs.orDetails = true
    },

    // For viewing only (read-only)
    async openViewOrDetails(row) {
      const normalizedDvAmount = Number(
        row?.dvAmount ?? row?.dv_amount ?? row?.amount ?? row?.gross_amount ?? 0,
      )
      this.currentLiquidation = {
        ...JSON.parse(JSON.stringify(row)),
        dvAmount: normalizedDvAmount,
        dv_amount: normalizedDvAmount,
        netAmount: Number(row?.netAmount ?? row?.net_amount ?? normalizedDvAmount ?? 0),
      }
      // Fetch OR Details from backend
      if (row.id) {
        try {
          const config = getAuthConfig()
          const endpoint = authStore.admin
            ? `/api/admin/continuing-disbursements/${row.id}/or-details`
            : `/api/barangay/continuing-disbursements/${row.id}/or-details`
          const res = await api.get(endpoint, config)

          const backendUrl = 'http://localhost:9000'
          this.currentLiquidation.orDetails = res.data.data.map((or) => ({
            orDate: or.orDate, // Backend already returns in DD/MM/YYYY format
            orNumber: or.orNumber,
            orAmount: or.orAmount,
            orImage: or.orPhotoUrl ? `${backendUrl}/storage/${or.orPhotoUrl}` : null,
            orPhotoUrl: or.orPhotoUrl ? `${backendUrl}/storage/${or.orPhotoUrl}` : null,
          }))

          // Set single remarks from the latest OR detail (most recent one)
          if (res.data.data.length > 0) {
            // Get the latest OR detail (last in the array) for remarks
            const latestOrDetail = res.data.data[res.data.data.length - 1]
            this.currentLiquidation.remarks = latestOrDetail.remarks || ''
          }
        } catch (error) {
          console.error('Error fetching OR details:', error)
          this.currentLiquidation.orDetails = []
        }
      } else {
        this.currentLiquidation.orDetails = []
      }
      this.dialogs.viewOrDetails = true
    },

    // Update openExpenseDetail to match your current structure
    openExpenseDetail(item) {
      // Build account name with sub-item if present
      let accountName = `${item.account} > ${item.expenseType} > ${item.expenseItem}`
      if (item.expenseSubItem) {
        accountName += ` > ${item.expenseSubItem}`
      }

      this.forms.expense = {
        account: accountName,
        accountId: item.continuingAccountId || item.id, // Use continuingAccountId if available
        balance: item.balance,
        particulars: '',
        amount: '',
        fund: '',
        taxpayerType: '',
        taxType: '',
        deductions: this.forms.expense.deductions || [],
        totalDeduction: this.forms.expense.totalDeduction || 0,
        netAmount: this.forms.expense.netAmount || 0,
        disbursementId: this.currentItem?.id || null,
        // Store additional IDs for proper tracking
        expense_class_id: item.expense_class_id,
        expense_type_id: item.expense_type_id,
        expense_item_id: item.expense_item_id,
        expense_sub_item_id: item.expense_sub_item_id,
      }
      this.dialogs.expense = false
      this.dialogs.expenseDetail = true
    },

    // Method to open expense detail for editing existing expenses
    // contDisburseStore.js
    openExpenseDetailForEdit(existingExpense) {
      const matchedAccount = this.expenseAccounts.find(
        (a) => String(a.id) === String(existingExpense.accountId),
      )
      const remainingBalance = matchedAccount ? Number(matchedAccount.balance) || 0 : 0
      const availableBalance = remainingBalance + (Number(existingExpense.amount) || 0)

      this.forms.expense = {
        account: existingExpense.accountName,
        accountId: existingExpense.accountId,
        balance: availableBalance,
        originalBalance: matchedAccount?.originalBalance ?? existingExpense.amount,
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
        expense_class_id: existingExpense.expense_class_id,
        expense_type_id: existingExpense.expense_type_id,
        expense_item_id: existingExpense.expense_item_id,
        expense_sub_item_id: existingExpense.expense_sub_item_id,
        isEditing: true,
        editingExpenseId: existingExpense.id,
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
      const amount = Number(cheque.amount ?? fallback.amount) || 0
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
        cheque.booklet?.bank?.name ||
        bankFromStore?.bank_name ||
        bankFromStore?.name ||
        fallback.bank_name ||
        fallback.bankName ||
        fallback.bank ||
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
        amount,
      }
    },

    normalizeBankCheques(cheques = [], fallback = {}) {
      return (cheques || [])
        .map((cheque) => this.normalizeBankChequeRow(cheque, fallback))
        .filter((cheque) => Number(cheque.amount) > 0)
    },

    async fetchBankChequesForDisbursement(disbursementId, fallback = {}) {
      if (!disbursementId) return []

      const endpoints = [
        `/api/barangay/cheques/disbursement/${disbursementId}`,
        `/api/barangay/continuing-disbursements/${disbursementId}/cheques`,
        `/api/barangay/bank-cheques/disbursement/${disbursementId}`,
      ]

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

          return this.normalizeBankCheques(rows, fallback)
        } catch (error) {
          if (![404, 405].includes(error.response?.status)) {
            console.warn(
              'Could not fetch bank cheques for disbursement:',
              error.response?.data || error,
            )
            break
          }
        }
      }

      return []
    },

    async saveAdditionalBankChequesForDisbursement(disbursementId, bankCheques, token) {
      if (!disbursementId || !bankCheques?.length) return

      const endpoints = [
        '/api/barangay/cheques',
        '/api/barangay/disbursement-cheques',
        '/api/barangay/bank-cheques',
      ]

      for (const cheque of bankCheques.filter((row) => Number(row.amount) > 0)) {
        if (!cheque.booklet_id || !(Number(cheque.amount) > 0)) {
          console.warn('Skipping bank cheque without booklet_id or amount:', cheque)
          continue
        }

        let saved = false
        for (const endpoint of endpoints) {
          try {
            await api.post(
              endpoint,
              {
                disbursement_id: disbursementId,
                booklet_id: cheque.booklet_id,
                cheque_date: cheque.cheque_date || cheque.chequeDate,
                amount: Number(cheque.amount) || 0,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/json',
                },
              },
            )
            saved = true
            break
          } catch (error) {
            if (![404, 405].includes(error.response?.status)) {
              throw error
            }
          }
        }

        if (!saved) {
          console.warn(
            'No cheque endpoint accepted bank cheque payload. Check the ChequeController route.',
          )
          break
        }
      }
    },

    // },
    // resolveNetAmount(disbursement = {}, deductions = null) {
    //   const normalizedDeductions = deductions || this.normalizeDeductions(disbursement.deductions || [])
    //   const deductionNetAmounts = normalizedDeductions
    //     .map((deduction) => Number(deduction.net_amount ?? deduction.netAmount))
    //     .filter((amount) => Number.isFinite(amount) && amount >= 0)
    //   const grossAmount = Number(disbursement.dv_amount ?? disbursement.dvAmount ?? disbursement.amount) || 0

    //   if (deductionNetAmounts.length) {
    //     return deductionNetAmounts[deductionNetAmounts.length - 1]
    //   }

    //   if (normalizedDeductions.length) {
    //     const totalDeductions = normalizedDeductions.reduce(
    //       (sum, deduction) => sum + (Number(deduction.deduction_amount ?? deduction.amount) || 0),
    //       0,
    //     )

    //     return Math.max(0, Math.round((grossAmount - totalDeductions) * 100) / 100)
    //   }

    //   const topLevelNet = disbursement.net_amount ?? disbursement.netAmount
    //   if (topLevelNet !== null && topLevelNet !== undefined && topLevelNet !== '') {
    //     return Number(topLevelNet) || 0
    //   }

    //   const chequeRows = this.normalizeBankCheques(
    //     disbursement.bank_cheques ||
    //       disbursement.entries ||
    //       this.cachedBankChequesByDisbursement?.[disbursement.id] ||
    //       [],
    //   )
    //   const chequeTotal = chequeRows.reduce((sum, cheque) => sum + (Number(cheque.amount) || 0), 0)
    //   if (chequeTotal > 0) {
    //     return Math.round(chequeTotal * 100) / 100
    //   }

    //   return grossAmount
    // },

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

    // deductionPayload(deduction) {
    //   const row = this.normalizeDeductionRow(deduction)
    //   const grossAmount = Number(row.gross_vat_inc) || Number(this.totalExpensesAmount) || 0
    //   const deductionAmount = Number(row.deduction_amount) || 0

    //   return {
    //     id: Number(row.id) > 0 ? Number(row.id) : null,
    //     deduction_code_id: row.deduction_code_id,
    //     deduction_type: row.deductionTypeName,
    //     tax_type: row.taxTypeName,
    //     tax_type_name: row.taxTypeName,
    //     code: row.code,
    //     description: row.description,
    //     divisor: row.divisor,
    //     vat_percent: row.vatPercent,
    //     ewt_percent: row.ewtPercent,
    //     gross_vat_inc: grossAmount,
    //     gross_vat_exc: Number(row.gross_vat_exc) || 0,
    //     percent: Number(row.percent) || 0,
    //     deduction_amount: deductionAmount,
    //     net_amount: Number(row.net_amount) || Math.max(0, grossAmount - deductionAmount),
    //     amount: deductionAmount,
    //     is_manual: row.isManual,
    //   }
    // },

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

    // Disbursement Actions
    // async saveDisbursement() {
    //   this.savingDisbursement = true
    //   const savedDeductions = this.normalizeDeductions(this.forms.expense.deductions || [])
    //   const savedBankCheques = this.normalizeBankCheques(this.bankCheques || [])
    //   try {
    //     const config = getAuthConfig()
    //     // Convert date from DD/MM/YYYY to YYYY-MM-DD format for backend
    //     const dateParts = this.forms.disbursement.date.split('/')
    //     const formattedDate =
    //       dateParts.length === 3
    //         ? `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
    //         : this.forms.disbursement.date

    //     if (savedBankCheques.length === 0) {
    //       throw new Error('Please add at least one bank cheque')
    //     }

    //     const totalDeductions = savedDeductions.reduce((sum, row) => {
    //       return sum + (Number(row.deduction_amount ?? row.amount) || 0)
    //     }, 0)

    //     const netAmount = Math.max(
    //       0,
    //       Math.round((this.totalExpensesAmount - totalDeductions) * 100) / 100,
    //     )
    //     const chequeTotal =
    //       Math.round(
    //         savedBankCheques.reduce((sum, row) => {
    //           return sum + (Number(row.amount) || 0)
    //         }, 0) * 100,
    //       ) / 100

    //     if (chequeTotal !== netAmount) {
    //       const difference = Math.abs(netAmount - chequeTotal).toLocaleString('en-US', {
    //         minimumFractionDigits: 2,
    //         maximumFractionDigits: 2,
    //       })
    //       throw new Error(
    //         chequeTotal > netAmount
    //           ? `Cheque amount exceeded the net amount by ₱${difference}`
    //           : `Cheque amount is lacking ₱${difference}`,
    //       )
    //     }

    //     const firstCheque = savedBankCheques[0] || {}

    //     const disbursementData = {
    //       date: formattedDate,
    //       dvNumber: this.forms.disbursement.dvNumber,
    //       dv_number: this.forms.disbursement.dvNumber,
    //       chequeNumber: firstCheque.cheque_number || '',
    //       cheque_number: firstCheque.cheque_number || '',
    //       bank_id: firstCheque.bank_id || null,
    //       payee: this.forms.disbursement.payee,
    //       payee2: this.forms.disbursement.payee2,
    //       amount: this.totalExpensesAmount,
    //       dv_amount: this.totalExpensesAmount,
    //       net_amount: netAmount,
    //       deductions: savedDeductions.map((deduction) => this.deductionPayload(deduction)),
    //       bank_cheques: savedBankCheques.map((cheque) => ({
    //         bank_id: cheque.bank_id,
    //         booklet_id: cheque.booklet_id,
    //         cheque_number: cheque.cheque_number,
    //         cheque_date: cheque.cheque_date || null,
    //         amount: cheque.amount,
    //       })),
    //       expenses: this.expenses.map((expense) => ({
    //         accountId: expense.accountId,
    //         amount: expense.amount,
    //         particulars: expense.particular,
    //         particular: expense.particular,
    //         fund: expense.fund,
    //         taxpayer_type: expense.taxpayerType,
    //         tax_type: expense.taxType,
    //         bank_id: expense.bank_id || firstCheque.bank_id || null,
    //         cheque_number: expense.cheque_number || firstCheque.cheque_number || '',
    //         expense_class_id: expense.expense_class_id,
    //         expense_type_id: expense.expense_type_id,
    //         expense_item_id: expense.expense_item_id,
    //         expense_sub_item_id: expense.expense_sub_item_id,
    //       })),
    //     }

    //     const response = await api.post(
    //       '/api/barangay/continuing-disbursements',
    //       disbursementData,
    //       config,
    //     )

    //     if (response.data?.status) {
    //       // Reset the form and generate new DV number
    //       this.resetForm('disbursement')
    //       this.generateNewDisbursementDefaults()
    //       this.closeDialog('disbursement')

    //       // Refresh disbursements list
    //       await this.fetchDisbursements()

    //       // Refresh expense accounts to reflect updated balances
    //       await this.refreshExpenseAccountsWithBalances()

    //       // Refresh continuing appropriations to reflect updated balances
    //       await this.refreshContinuingAppropriations()

    //       return { success: true, data: response.data.data }
    //     } else {
    //       return { success: false, error: response.data?.message || 'Failed to save disbursement' }
    //     }
    //   } catch (error) {
    //     console.error('Error saving disbursement:', error)
    //     console.error('Error response:', error.response?.data)

    //     // Handle validation errors
    //     if (error.response?.status === 422 && error.response?.data?.errors) {
    //       const validationErrors = error.response.data.errors
    //       const errorMessages = Object.values(validationErrors).flat()
    //       return {
    //         success: false,
    //         error: `Validation failed: ${errorMessages.join(', ')}`,
    //         validationErrors: validationErrors,
    //       }
    //     }

    //     return {
    //       success: false,
    //       error: error.response?.data?.message || error.message || 'Failed to save disbursement',
    //     }
    //   } finally {
    //     this.savingDisbursement = false
    //   }
    // },

    async saveDisbursement() {
      this.savingDisbursement = true // Start loading
      const savedDeductions = [...(this.forms.expense.deductions || [])]
      const savedBankCheques = [...(this.bankCheques || [])].filter((row) => Number(row.amount) > 0)
      try {
        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token
        // Convert date from DD/MM/YYYY to YYYY-MM-DD format for backend
        const dateParts = this.forms.disbursement.date.split('/')
        const formattedDate =
          dateParts.length === 3
            ? `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
            : this.forms.disbursement.date

        // Validate required fields
        // if (!this.forms.disbursement.bank_id) {
        //   throw new Error('Please select a bank')
        // }
        if (!this.forms.disbursement.payee) {
          throw new Error('Please enter a payee')
        }
        if (this.expenses.length === 0) {
          throw new Error('Please add at least one expense')
        }
        if (savedBankCheques.length === 0) {
          throw new Error('Please add at least one bank cheque')
        }

        // const totalDeductions = (this.forms.expense.deductions || []).reduce((sum, row) => {
        //   return sum + (Number(row.amount) || 0)
        // }, 0)
        // const netAmount = Math.max(
        //   0,
        //   Math.round((this.totalExpensesAmount - totalDeductions) * 100) / 100,
        // )
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

        // saveDisbursement()

        const firstCheque = savedBankCheques[0] || {}
        const toNumericOrNull = (v) => {
          const n = Number(v)
          return Number.isFinite(n) ? n : null
        }

        const payload = {
          // date: this.forms.disbursement.date,
          date: formattedDate,
          dvNumber: this.forms.disbursement.dvNumber,
          dv_number: this.forms.disbursement.dvNumber,
          cheque_number: firstCheque.cheque_number || '', // satisfy validation
          bank_id: firstCheque.bank_id || null,
          bank_status: firstCheque.bank_status || firstCheque.bankStatus || null, // satisfy validation
          payee: this.forms.disbursement.payee,
          payee2: this.forms.disbursement.payee2,
          amount: this.totalExpensesAmount,
          dv_amount: this.totalExpensesAmount,
          net_amount: netAmount,
          deductions: (this.forms.expense.deductions || []).map((ded) =>
            this.deductionPayload(ded),
          ),
          bank_cheques: savedBankCheques.map((cheque) => ({
            bank_id: cheque.bank_id,
            booklet_id: cheque.booklet_id,
            cheque_number: cheque.cheque_number,
            cheque_date: cheque.cheque_date || null,
            // bank_status: cheque.bank_status || cheque.bankStatus || null,
            amount: cheque.amount,
          })),
          expenses: this.expenses.map((expense) => ({
            accountId: expense.accountId,
            amount: expense.amount,
            particular: expense.particular,
            particulars: expense.particular,
            fund: expense.fund,
            taxpayer_type: expense.taxpayerType,
            tax_type: expense.taxType,
            bank_id: expense.bank_id || firstCheque.bank_id || null,
            cheque_number: expense.cheque_number || firstCheque.cheque_number || '',
            expense_class_id: toNumericOrNull(expense.expense_class_id),
            expense_type_id: toNumericOrNull(expense.expense_type_id),
            expense_item_id: toNumericOrNull(expense.expense_item_id),
            expense_sub_item_id: toNumericOrNull(expense.expense_sub_item_id),
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
          ? '/api/admin/continuing-disbursements/create'
          : '/api/barangay/continuing-disbursements'
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

        const additionalBankCheques = savedBankCheques.filter((row) => Number(row.amount) > 0)
        if (!authStore.admin && createdDisbursementId && additionalBankCheques.length > 0) {
          await this.saveAdditionalBankChequesForDisbursement(
            createdDisbursementId,
            additionalBankCheques,
            token,
          )
        }

        // The backend now automatically creates expense details, so we don't need to do it manually
        // Close the dialog immediately to avoid showing cleared fields briefly
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
            const response = await api.get('/api/barangay/generate-dvnumber', {
              ...getAuthConfig(),
              params: { date: this.forms.disbursement.date },
            })
            const apiDv = response.data.data?.dv_number || ''
            const matchesSelectedDate = apiDv.startsWith(
              getDvPrefixForDate(this.forms.disbursement.date),
            )
            const alreadyExists = !!(
              apiDv && (this.disbursements || []).some((d) => d.dvNumber === apiDv)
            )
            this.forms.disbursement.dvNumber = alreadyExists || !matchesSelectedDate
              ? this.generateLocalDvNumber(this.forms.disbursement.date)
              : apiDv || this.generateLocalDvNumber(this.forms.disbursement.date)
          } catch (error) {
            console.error('Failed to generate DV number, using local fallback:', error)
            this.forms.disbursement.dvNumber = this.generateLocalDvNumber(this.forms.disbursement.date)
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

    generateNewDisbursementDefaults() {
      const today = new Date()
      const dd = String(today.getDate()).padStart(2, '0')
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const yyyy = today.getFullYear()

      // Update form with new defaults
      this.forms.disbursement.date = `${dd}/${mm}/${yyyy}`
      this.forms.disbursement.dvNumber = this.generateLocalDvNumber(this.forms.disbursement.date)
    },

    // Expense Actions
    // saveExpense() {
    //   const amount = Number(this.forms.expense.amount) || 0
    //   const particulars = this.forms.expense.particulars?.trim() || ''

    //   // const bank = bankStore.availableBanks.find(
    //   //   (b) => String(b.id) === String(this.forms.expense.bank_id),
    //   // )

    //   // Validate particulars
    //   if (!particulars) {
    //     throw new Error('Particulars is required')
    //   }

    //   // Validate amount
    //   if (amount <= 0) {
    //     throw new Error('Amount must be greater than 0')
    //   }

    //   // Get the current available balance (this is the balance shown in the add expense dialog)
    //   const currentAvailableBalance = this.forms.expense.balance || 0

    //   // Validate that the requested amount doesn't exceed the current available balance
    //   if (amount > currentAvailableBalance) {
    //     throw new Error(
    //       `Amount exceeds available balance. Available: ₱${currentAvailableBalance.toLocaleString()}, Requested: ₱${amount.toLocaleString()}`,
    //     )
    //   }

    //   this.expenses.push({
    //     id: Date.now(),
    //     accountId: this.forms.expense.accountId,
    //     accountName: this.forms.expense.account,
    //     amount: amount,
    //     particular: this.forms.expense.particulars,
    //     fund: this.forms.expense.fund,
    //     taxpayerType: this.forms.expense.taxpayerType,
    //     taxType: this.forms.expense.taxType,
    //     // Store additional IDs for proper tracking
    //     expense_class_id: this.forms.expense.expense_class_id,
    //     expense_type_id: this.forms.expense.expense_type_id,
    //     expense_item_id: this.forms.expense.expense_item_id,
    //     expense_sub_item_id: this.forms.expense.expense_sub_item_id,
    //   })

    //   this.expenses = [...this.expenses]
    //   this.closeDialog('expenseDetail')
    //   this.resetForm('expense')
    // },
    saveExpense() {
      const amount = Number(this.forms.expense.amount) || 0
      const particulars = this.forms.expense.particulars?.trim() || ''

      if (!particulars) {
        throw new Error('Particulars is required')
      }

      if (amount <= 0) {
        throw new Error('Amount must be greater than 0')
      }

      const currentAvailableBalance = this.forms.expense.balance || 0
      if (amount > currentAvailableBalance) {
        throw new Error(
          `Amount exceeds available balance. Available: ₱${currentAvailableBalance.toLocaleString()}, Requested: ₱${amount.toLocaleString()}`,
        )
      }

      const expenseData = {
        accountId: this.forms.expense.accountId,
        accountName: this.forms.expense.account,
        amount: amount,
        particular: this.forms.expense.particulars,
        fund: this.forms.expense.fund,
        taxpayerType: this.forms.expense.taxpayerType,
        taxType: this.forms.expense.taxType,
        expense_class_id: this.forms.expense.expense_class_id,
        expense_type_id: this.forms.expense.expense_type_id,
        expense_item_id: this.forms.expense.expense_item_id,
        expense_sub_item_id: this.forms.expense.expense_sub_item_id,
        bank_id: this.forms.expense.bank_id,
        bankName: this.forms.expense.bankName,
        cheque_number: this.forms.expense.cheque_number,
        chequeNumber: this.forms.expense.cheque_number,
        cheque_date: this.forms.expense.cheque_date,
        cheque_cancelled: this.forms.expense.cheque_cancelled,
      }

      if (this.forms.expense.isEditing && this.forms.expense.editingExpenseId != null) {
        // UPDATE the existing row instead of pushing a duplicate
        const idx = this.expenses.findIndex(
          (e) => String(e.id) === String(this.forms.expense.editingExpenseId),
        )
        if (idx !== -1) {
          this.expenses[idx] = { ...this.expenses[idx], ...expenseData }
        } else {
          // Fallback: row wasn't found for some reason, add it back
          this.expenses.push({ id: this.forms.expense.editingExpenseId, ...expenseData })
        }
      } else {
        // ADD a brand-new row
        this.expenses.push({ id: Date.now(), ...expenseData })
      }

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
      this.isChequeCancel = false
      this.openExpenseDetailForEdit(row)
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
          payee2: '',
          amount: '',
        }
        this.expenses = []
        this.bankCheques = []
        this.pendingChequeNumbers = []
        this.forms.expense.deductions = []
        this.forms.expense.totalDeduction = 0
        this.forms.expense.netAmount = 0
      } else if (formName === 'expense') {
        const deductions = this.forms.expense.deductions || []
        const totalDeduction = this.forms.expense.totalDeduction || 0
        const netAmount = this.forms.expense.netAmount || 0
        this.forms.expense = {
          account: '',
          accountId: null,
          balance: 0,
          particulars: '',
          amount: 0,
          fund: '',
          taxpayerType: '',
          taxType: '',
          deductions,
          totalDeduction,
          netAmount,
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
        await this.fetchContinuingAppropriations()

        // Then fetch the disbursement with its expenses
        const disbursement = await this.fetchDisbursementById(row.id)

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
        console.error('Error in openEditDisbursement:', error)
        throw error
      } finally {
        clearTimeout(loadingTimeout)
        this.loadingEditDisbursement = null
      }
    },

    // async saveEditedDisbursement() {
    //   if (!this.currentItem) return

    //   this.savingDisbursement = true
    //   try {
    //     const config = getAuthConfig()

    //     // Convert date from DD/MM/YYYY to YYYY-MM-DD format for backend
    //     const dateParts = this.forms.disbursement.date.split('/')
    //     const formattedDate =
    //       dateParts.length === 3
    //         ? `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
    //         : this.forms.disbursement.date

    //     const disbursementData = {
    //       date: formattedDate,
    //       dvNumber: this.forms.disbursement.dvNumber,
    //       chequeNumber: this.forms.disbursement.chequeNumber,
    //       bank_id: this.forms.disbursement.bank_id,
    //       payee: this.forms.disbursement.payee,
    //       amount: this.totalExpensesAmount,
    //       expenses: this.expenses.map((expense) => ({
    //         accountId: expense.accountId,
    //         particulars: expense.particular,
    //         amount: expense.amount,
    //         // Include sub-item information if present
    //         expense_class_id: expense.expense_class_id,
    //         expense_type_id: expense.expense_type_id,
    //         expense_item_id: expense.expense_item_id,
    //         expense_sub_item_id: expense.expense_sub_item_id,
    //       })),
    //     }

    //     const response = await api.put(
    //       `/api/barangay/continuing-disbursements/${this.currentItem.id}`,
    //       disbursementData,
    //       config,
    //     )

    //     if (response.data?.status) {
    //       // Update the local disbursement
    //       const index = this.disbursements.findIndex((d) => d.id === this.currentItem.id)
    //       if (index !== -1) {
    //         this.disbursements[index] = {
    //           ...this.disbursements[index],
    //           ...this.forms.disbursement,
    //           expenses: [...this.expenses],
    //           dvAmount: this.totalExpensesAmount,
    //         }
    //       }

    //       this.closeDialog('editDisbursement')

    //       // Refresh disbursements list
    //       await this.fetchDisbursements()

    //       // Refresh expense accounts to reflect updated balances
    //       await this.refreshExpenseAccountsWithBalances()

    //       // Refresh continuing appropriations to reflect updated balances
    //       await this.refreshContinuingAppropriations()

    //       return { success: true, data: response.data.data }
    //     } else {
    //       return {
    //         success: false,
    //         error: response.data?.message || 'Failed to update disbursement',
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Error updating disbursement:', error)
    //     return {
    //       success: false,
    //       error: error.response?.data?.message || error.message || 'Failed to update disbursement',
    //     }
    //   } finally {
    //     this.savingDisbursement = false
    //   }
    // },

    async saveEditedDisbursement() {
      if (!this.currentItem) return

      this.savingDisbursement = true
      try {
        const config = getAuthConfig()

        const dateParts = this.forms.disbursement.date.split('/')
        const formattedDate =
          dateParts.length === 3
            ? `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
            : this.forms.disbursement.date

        const savedDeductions = this.normalizeDeductions(this.forms.expense.deductions || [])
        const savedBankCheques = this.normalizeBankCheques(this.bankCheques || [])

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

        const firstCheque = savedBankCheques[0] || {}

        const disbursementData = {
          date: formattedDate,
          dvNumber: this.forms.disbursement.dvNumber,
          dv_number: this.forms.disbursement.dvNumber,
          chequeNumber: firstCheque.cheque_number || '',
          cheque_number: firstCheque.cheque_number || '',
          bank_id: firstCheque.bank_id || null,
          cheque_booklet: firstCheque.booklet_id || null,
          cheque_date: firstCheque.cheque_date || firstCheque.chequeDate || null,
          cheque_amount: Number(firstCheque.amount) || 0,
          bank_status: firstCheque.bank_status || firstCheque.bankStatus || null,
          payee: this.forms.disbursement.payee,
          payee2: this.forms.disbursement.payee2 || this.forms.disbursement.payee,
          amount: this.totalExpensesAmount,
          dv_amount: this.totalExpensesAmount,
          net_amount: netAmount,
          deductions: savedDeductions.map((d) => this.deductionPayload(d)),
          bank_cheques: savedBankCheques.map((cheque) => ({
            bank_id: cheque.bank_id,
            booklet_id: cheque.booklet_id,
            cheque_number: cheque.cheque_number,
            cheque_date: cheque.cheque_date || null,
            bank_status: cheque.bank_status || cheque.bankStatus || null,
            amount: cheque.amount,
          })),
          expenses: this.expenses.map((expense) => ({
            accountId: expense.accountId,
            particulars: expense.particular,
            amount: expense.amount,
            expense_class_id: expense.expense_class_id,
            expense_type_id: expense.expense_type_id,
            expense_item_id: expense.expense_item_id,
            expense_sub_item_id: expense.expense_sub_item_id,
          })),
        }

        const response = await api.put(
          `/api/barangay/continuing-disbursements/${this.currentItem.id}`,
          disbursementData,
          config,
        )

        if (response.data?.status) {
          const index = this.disbursements.findIndex((d) => d.id === this.currentItem.id)
          if (index !== -1) {
            this.disbursements[index] = {
              ...this.disbursements[index],
              ...this.forms.disbursement,
              expenses: [...this.expenses],
              dvAmount: this.totalExpensesAmount,
              netAmount,
            }
          }

          this.closeDialog('editDisbursement')
          await this.fetchDisbursements()
          await this.refreshExpenseAccountsWithBalances()
          await this.refreshContinuingAppropriations()

          return { success: true, data: response.data.data }
        } else {
          return {
            success: false,
            error: response.data?.message || 'Failed to update disbursement',
          }
        }
      } catch (error) {
        console.error('Error updating disbursement:', error)
        return {
          success: false,
          error: error.response?.data?.message || error.message || 'Failed to update disbursement',
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
        if (!file || !(file instanceof File)) {
          throw new Error('Invalid file object provided')
        }

        const authStore = useAuthStore()
        const token = authStore.admin ? authStore.adminToken : authStore.token

        const formData = new FormData()
        formData.append('photo', file, file.name)

        const response = await api.post(
          '/api/barangay/continuing-disbursements/or-photo/upload',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          },
        )

        return { success: true, path: response.data.path }
      } catch (error) {
        console.error('Upload error:', error.response?.data || error.message)
        return { success: false, error: error.response?.data?.message || error.message }
      }
    },

    // Liquidation Actions
    async saveOrDetails() {
      if (!this.currentLiquidation) {
        console.warn('currentLiquidation is not available')
        return { success: false, error: 'No liquidation data available' }
      }

      // Check if all OR details are complete (photos are optional)
      const allOrDetailsComplete = this.currentLiquidation.orDetails?.every(
        (or) => or.orNumber && or.orAmount && or.orDate,
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
            this.currentLiquidation.orDetails[i].serverPhotoPath = 'no-photo'
          }
        }

        // Calculate total actual expense from OR details
        const totalActualExpense =
          this.currentLiquidation.orDetails?.reduce(
            (sum, or) => sum + (parseFloat(or.orAmount) || 0),
            0,
          ) || 0

        // Prepare the payload for complete liquidation
        const payload = {
          orDetails: this.currentLiquidation.orDetails.map((or) => ({
            id: or.id || null, // Include ID for existing OR details
            orNumber: or.orNumber,
            orAmount: or.orAmount,
            orDate: or.orDate || '',
            remarks: this.currentLiquidation.remarks || '', // Use single remarks for all OR details
            orPhotoUrl: or.serverPhotoPath || 'no-photo', // Use server path or placeholder
          })),
          liquidatedAmount: totalActualExpense,
          isPartial: false, // Flag to indicate complete liquidation

          bank_cheques: (this.bankCheques || []).map((cheque) => ({
            bank_id: cheque.bank_id,
            cheque_number: cheque.cheque_number,
            cheque_date: cheque.cheque_date || null,
            amount: cheque.amount,
          })),
        }
        const response = await api.post(
          `/api/barangay/continuing-disbursements/${this.currentLiquidation.id}/or-details`,
          payload,
          config,
        )

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
          return {
            success: false,
            error: response.data?.message || 'Failed to liquidate disbursement',
          }
        }
      } catch (error) {
        console.error('Error liquidating disbursement:', error)
        return {
          success: false,
          error:
            error.response?.data?.message || error.message || 'Failed to liquidate disbursement',
        }
      }
    },

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

    async savePartialOrDetails() {
      if (!this.currentLiquidation) {
        console.warn('currentLiquidation is not available')
        return { success: false, error: 'No liquidation data available' }
      }

      // Check if all OR details are complete (photos are optional)
      const allOrDetailsComplete = this.currentLiquidation.orDetails?.every(
        (or) => or.orNumber && or.orAmount && or.orDate,
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
            this.currentLiquidation.orDetails[i].serverPhotoPath = 'no-photo'
          }
        }

        // Calculate total actual expense from OR details
        const totalActualExpense =
          this.currentLiquidation.orDetails?.reduce(
            (sum, or) => sum + (parseFloat(or.orAmount) || 0),
            0,
          ) || 0

        // Get today's date in DD/MM/YYYY format for fallback
        const today = new Date()
        const dd = String(today.getDate()).padStart(2, '0')
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const yyyy = today.getFullYear()
        const todayFormatted = `${dd}/${mm}/${yyyy}`

        // Prepare the payload for partial liquidation
        const payload = {
          orDetails: this.currentLiquidation.orDetails.map((or) => {
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
        const response = await api.post(
          `/api/barangay/continuing-disbursements/${this.currentLiquidation.id}/or-details`,
          payload,
          config,
        )

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
          return {
            success: false,
            error: response.data?.message || 'Failed to save partial liquidation',
          }
        }
      } catch (error) {
        console.error('Error saving partial liquidation:', error)
        console.error('Error response:', error.response?.data)
        return {
          success: false,
          error:
            error.response?.data?.message ||
            error.response?.data?.errors ||
            error.message ||
            'Failed to save partial liquidation',
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

        const response = await api.delete(
          `/api/barangay/continuing-disbursements/${disbursementId}/or-details/${orDetailId}`,
          config,
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

    uploadOrImageForLiquidation(files, index) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.currentLiquidation.orDetails[index].orImage = e.target.result
      }
      reader.readAsDataURL(files[0])
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

// function calculateAgingDays(dateString) {
//   // Helper function to get just the number of days for stale checking
//   if (!dateString) return 0
//   const parts = dateString.includes('-') ? dateString.split('-') : dateString.split('/')
//   let yyyy, mm, dd
//   if (parts[0].length === 4) {
//     // 'YYYY-MM-DD'
//     ;[yyyy, mm, dd] = parts
//   } else {
//     // 'DD/MM/YYYY'
//     ;[dd, mm, yyyy] = parts
//   }
//   const disbDate = new Date(`${yyyy}-${mm}-${dd}`)
//   const today = new Date()
//   const diffTime = today - disbDate
//   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
//   return diffDays
// }

// function shouldBeStale(disbursement) {
//   // Check if disbursement should be marked as stale based on aging
//   if (!disbursement.date) return false

//   // Don't mark as stale if already liquidated, voided, or already stale
//   if (['Liquidated', 'Voided', 'Stale'].includes(disbursement.status)) {
//     return false
//   }

//   const agingDays = calculateAgingDays(disbursement.date)
//   return agingDays >= 180
// }
