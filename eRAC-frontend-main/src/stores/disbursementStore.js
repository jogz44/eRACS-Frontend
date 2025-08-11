// src/stores/disbursementStore.js
import { defineStore } from 'pinia'
import { useAppropriationStore } from './appropriationStore'
import { api } from 'src/boot/axios'
import { useAuthStore } from './auth'

export const useDisbursementStore = defineStore('disbursement', {
  state: () => ({
    // Main data collections
    expenseData: [], // This will hold our complete expense hierarchy
    expenses: [], // Initialize expenses array
    expenseSearch: '',
    currentItem: null,

    chequeBooklets: [], // Will be populated from selected bank
    availableChequeNumbers: [],
    selectedBank: null,
    selectedBooklet: null,
    selectedChequeNumber: null,
    disbursements: [], // <-- Remove static data, will be loaded from API

    // Current selections
    currentLiquidation: null,

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

    // Pagination
    pagination: { rowsPerPage: 10 },
  }),

  getters: {
    // Filtered expense accounts for search
    expenseAccounts(state) {
      if (!state.expenseData || state.expenseData.length === 0) {
        console.log('No expense data available')
        return []
      }

      const flattened = state.expenseData.reduce((acc, expenseClass) => {
        if (!expenseClass.children) {
          console.log(`No children for expense class: ${expenseClass.name}`)
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
                const expenseItemEntry = {
                  id: expenseItem.id,
                  account: expenseClass.name,
                  expenseType: expenseType.name,
                  expenseItem: expenseItem.name,
                  balance: expenseItem.amount || 0,
                  expense_class_id: expenseClass.id,
                  expense_type_id: expenseType.id,
                  expense_item_id: expenseItem.id,
                }
                acc.push(expenseItemEntry)
                console.log(`Added expense item: ${expenseItem.name} with balance: ${expenseItem.amount}`)
              }
            })
          } else {
            // If expense type has no items with balance, show the type itself (if it has balance)
            if (expenseType.amount && expenseType.amount > 0) {
              const expenseTypeEntry = {
                id: expenseType.id,
                account: expenseClass.name,
                expenseType: expenseType.name,
                expenseItem: null,
                balance: expenseType.amount || 0,
                expense_class_id: expenseClass.id,
                expense_type_id: expenseType.id,
                expense_item_id: null, // This identifies it as an expense type
              }
              acc.push(expenseTypeEntry)
              console.log(`Added expense type: ${expenseType.name} with balance: ${expenseType.amount}`)
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
      { name: 'aging', label: 'Aging', field: 'aging', align: 'left', sortable: true },
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
      if (!state.expenseSearch.trim()) {
        console.log('No search query, returning all expense accounts:', this.expenseAccounts.length)
        return this.expenseAccounts
      }

      const query = state.expenseSearch.toLowerCase()
      const filtered = this.expenseAccounts.filter(
        (item) =>
          item.account.toLowerCase().includes(query) ||
          item.expenseType.toLowerCase().includes(query) ||
          (item.expenseItem && item.expenseItem.toLowerCase().includes(query)) ||
          (item.description && item.description.toLowerCase().includes(query)),
      )
      return filtered
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
    // Fetch expense hierarchy from appropriation store and accounts library store
    async fetchExpenseAccounts() {
      try {
        // Only fetch if not already loaded to avoid unnecessary API calls
        if (this.expenseData.length > 0 && !this.expenseTypeLoading) {
          console.log('Expense accounts already loaded, skipping fetch')
          return
        }
        
        // Fetch from appropriation store for budget allocations
        const appropriationStore = useAppropriationStore()
        await appropriationStore.fetchExpenseHierarchy()
        this.expenseData = appropriationStore.allocations || []
        
        // Fetch expense types from accounts library store (non-blocking)
        this.fetchExpenseTypesFromAccountsLib().catch(error => {
          console.warn('Failed to fetch expense types:', error)
        })
        
      } catch (error) {
        console.error('Error fetching expense accounts:', error)
        this.expenseData = []
      }
    },

    // Background refresh method for expense accounts
    async refreshExpenseAccountsInBackground() {
      try {
        console.log('Refreshing expense accounts in background...')
        
        // Fetch from appropriation store for budget allocations
        const appropriationStore = useAppropriationStore()
        await appropriationStore.fetchExpenseHierarchy()
        this.expenseData = appropriationStore.allocations || []
        
        // Fetch expense types from accounts library store (non-blocking)
        this.fetchExpenseTypesFromAccountsLib().catch(error => {
          console.warn('Failed to fetch expense types in background:', error)
        })
        
        console.log('Expense accounts refreshed in background')
      } catch (error) {
        console.warn('Failed to refresh expense accounts in background:', error)
      }
    },

    // New method to fetch expense types from accounts library store
    async fetchExpenseTypesFromAccountsLib() {
      try {
        this.expenseTypeLoading = true
        
        // Dynamically import to avoid circular dependencies
        const { useAccountsLibraryStore } = await import('./accountsLibstore')
        const accountsStore = useAccountsLibraryStore()
        
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
        
        // If no expense types are available, return early
        if (!accountsStore.expenseTypes || accountsStore.expenseTypes.length === 0) {
          console.log('No expense types available from accounts library')
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
                  console.log(`Added expense type: ${type.name} to class: ${expenseClass.name}`)
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
              console.log(`Created new expense class: ${expenseClass.name} with ${types.length} types`)
            }
          }
        })
       
      } catch (error) {
        console.error('Error integrating expense types:', error)
        throw error
      }
    },

    async fetchDisbursements() {
      try {
        const authStore = useAuthStore()
        const token = authStore.token
        const response = await api.get('/api/barangay/disbursements', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
        // Map backend fields to frontend fields if needed
        this.disbursements = (response.data.data || []).map(d => ({
          id: d.id,
          date: d.date,
          dvNumber: d.dv_number,
          chequeNumber: d.cheque_number,
          bank: d.bank_name, 
          payee: d.payee,
          dvAmount: d.dv_amount,
          status: d.status,
          aging: calculateAging(d.date),
        }))
      } catch (error) {
        console.error('Failed to fetch disbursements:', error)
        this.disbursements = []
      }
    },

    async fetchDisbursementById(id) {
      try {
        const authStore = useAuthStore();
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
              return `${mm}/${dd}/${yyyy}`;
            } 
            else if (dateStr.includes('/')) {
              return dateStr;
            }
            return dateStr;
          }

          // Find and set the selected booklet based on the cheque number
          const chequeNum = parseInt(disbursement.cheque_number)
          const selectedBooklet = this.chequeBooklets.find((booklet) => {
            const [start, end] = booklet.range.split('-').map(Number)
            return chequeNum >= start && chequeNum <= end
          })

          // if (disbursement.bank_id) {
          //   // Set selected bank and set chequeBooklets
          //   //this.selectedBank = disbursement.bank_id ? Number(disbursement.bank_id) : null
          //   const bankData = await api.get(`/api/barangay/banks/${disbursement.bank_id}/available-cheques`, {
          //     headers: {
          //       Authorization: `Bearer ${token}`,
          //       Accept: 'application/json',
          //     },
          //   });
          //   this.chequeBooklets = bankData.data.data || [];

          //   // Sample Output of bankData.data
          //   // {
          //   //   "status": true,
          //   //   "message": "Available booklets and cheques retrieved successfully",
          //   //   "data": [
          //   //     {
          //   //       "id": 1,
          //   //       "date": "2025-08-01",
          //   //       "booklet_numb": "10000001-10000005",
          //   //       "status": "unused",
          //   //       "cheques": [
          //   //         {
          //   //           "id": 1,
          //   //           "cheque_number": "10000001",
          //   //           "status": "unused"
          //   //         },
          //   //         {
          //   //           "id": 2,
          //   //           "cheque_number": "10000002",
          //   //           "status": "unused"
          //   //         },
          //   //         {
          //   //           "id": 3,
          //   //           "cheque_number": "10000003",
          //   //           "status": "unused"
          //   //         },
          //   //         {
          //   //           "id": 4,
          //   //           "cheque_number": "10000004",
          //   //           "status": "unused"
          //   //         },
          //   //         {
          //   //           "id": 5,
          //   //           "cheque_number": "10000005",
          //   //           "status": "unused"
          //   //         }
          //   //       ]
          //   //     },
          //   //     {
          //   //       "id": 8,
          //   //       "date": "2025-08-01",
          //   //       "booklet_numb": "10000030-10000033",
          //   //       "status": "unused",
          //   //       "cheques": [
          //   //         {
          //   //           "id": 13,
          //   //           "cheque_number": "10000030",
          //   //           "status": "unused"
          //   //         },
          //   //         {
          //   //           "id": 14,
          //   //           "cheque_number": "10000031",
          //   //           "status": "unused"
          //   //         },
          //   //         {
          //   //           "id": 15,
          //   //           "cheque_number": "10000032",
          //   //           "status": "unused"
          //   //         },
          //   //         {
          //   //           "id": 16,
          //   //           "cheque_number": "10000033",
          //   //           "status": "unused"
          //   //         }
          //   //       ]
          //   //     }
          //   //   ]
          //   // }
          //   // chequeBooklets: [
          //   //   { label: 'Booklet 1', range: '20000150-20000200' },
          //   //   { label: 'Booklet 2', range: '20000201-20000250' },
          //   // ],
          //   // availableChequeNumbers: [],
          // }

          if (selectedBooklet) {
            this.selectedBooklet = selectedBooklet.range
            this.selectBooklet(selectedBooklet.range)
            this.selectedChequeNumber = this.availableChequeNumbers[0] || null
          }

          // Set expenses to empty array since backend doesn't include them yet
          this.expenses = []
          this.currentItem = { ...disbursement }
          this.dialogs.editDisbursement = true
        }
        return disbursement;
      } catch (error) {
        console.error('Failed to fetch disbursement:', error);
        return null;
      }
    },

    async liquidateDisbursement(id, liquidatedAmount) {
      try {
        const authStore = useAuthStore();
        const token = authStore.token;
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
      this.availableChequeNumbers = []

      if (range) {
        try {
          const [start, end] = range.split('-').map(Number)
          
          // Generate available cheque numbers for the selected range
          this.availableChequeNumbers = Array.from({ length: end - start + 1 }, (_, i) =>
            (start + i).toString().padStart(8, '0'),
          )

          // If we have a selected booklet, we might want to fetch the actual cheques
          // to check which ones are already used
          if (this.forms.disbursement.bank_id) {
            try {
              const { useBankStore } = await import('./bankStore')
              const bankStore = useBankStore()
              
              // Find the selected booklet
              const selectedBookletData = this.chequeBooklets.find(b => b.value === range)
              if (selectedBookletData && selectedBookletData.booklet) {
                // Fetch cheques for this booklet to check status
                const response = await bankStore.fetchBookletCheques(selectedBookletData.booklet.id)
                
                // Extract cheques from the response
                const cheques = response.cheques || response.data || []
                
                // Filter out used cheques
                const unusedCheques = cheques.filter(cheque => 
                  cheque.status?.toLowerCase() === 'unused'
                )
                
                // Update available cheque numbers to only show unused ones
                if (unusedCheques.length > 0) {
                  this.availableChequeNumbers = unusedCheques.map(cheque => 
                    cheque.chequeNo || cheque.cheque_number
                  )
                }
              }
            } catch (error) {
              console.error('Error fetching cheques for booklet:', error)
              // If we can't fetch cheques, just use the generated range
            }
          }
        } catch (error) {
          console.error('Error processing booklet selection:', error)
          // Reset booklet selection on error
          this.selectedBooklet = null
          this.availableChequeNumbers = []
          throw error
        } finally {
          this.bookletLoading = false
        }
      } else {
        this.bookletLoading = false
      }
    },

    // New method to handle bank selection
    async selectBank(bankId) {
      

      this.bankLoading = true
      this.forms.disbursement.bank_id = bankId
      this.selectedBooklet = null
      this.selectedChequeNumber = null
      this.forms.disbursement.chequeNumber = null
      this.chequeBooklets = []
      this.availableChequeNumbers = []

      if (bankId) {
        try {
          // Import bankStore dynamically to avoid circular dependency
          const { useBankStore } = await import('./bankStore')
          const bankStore = useBankStore()
          
          // Fetch booklets for the selected bank
          const booklets = await bankStore.fetchBankBooklets(bankId)
          
          // Transform booklets for the select component
          this.chequeBooklets = booklets.map(booklet => ({
            label: `Booklet ${booklet.booklet_numb || booklet.id} (${booklet.starting_cheque_numb}-${booklet.ending_cheque_numb})`,
            value: `${booklet.starting_cheque_numb}-${booklet.ending_cheque_numb}`,
            booklet: booklet
          }))

          // Automatically select the first booklet if available
          if (this.chequeBooklets.length > 0) {
            this.selectedBooklet = this.chequeBooklets[0].value
            this.selectBooklet(this.selectedBooklet)
            
          }
          
          // Automatically select the first cheque if available
          this.selectedChequeNumber = this.availableChequeNumbers[0] || null
          this.forms.disbursement.chequeNumber = 0

          
        } catch (error) {
          console.error('Error fetching booklets for bank:', error)
          // Reset bank selection on error
          this.forms.disbursement.bank_id = null
          this.chequeBooklets = []
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

        const lastCheque = this.disbursements.reduce(
          (max, d) => Math.max(max, parseInt(d.chequeNumber) || 0),
          0,
        )
        this.forms.disbursement.chequeNumber = String(lastCheque + 1).padStart(6, '0')

        const lastDV = this.disbursements.reduce((max, d) => {
          const num = parseInt(d.dvNumber.split('-').pop()) || 0
          return Math.max(max, num)
        }, 0)
        this.forms.disbursement.dvNumber = `DV-${String(yyyy).slice(-2)}-${mm}-${String(lastDV + 1).padStart(3, '0')}`
      } else if (dialogName === 'expense') {
        // Only fetch expense accounts if not already loaded
        if (this.expenseData.length === 0) {
          await this.fetchExpenseAccounts()
        }
      }
      this.dialogs[dialogName] = true
    },

    closeDialog(dialogName) {
      this.dialogs[dialogName] = false
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
              orDate: formattedDate,
              orNumber: or.or_number,
              orAmount: or.or_amount,
              orImage: null,
              orPhotoUrl: or.or_photo ? `${backendUrl}/storage/${or.or_photo}` : null,
              serverPhotoPath: or.or_photo,
              isReadOnly: true, // Mark existing OR details as read-only
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
      this.currentLiquidation = JSON.parse(JSON.stringify(row));
      // Fetch OR Details from backend
      if (row.id) {
        try {
          const res = await api.get(`/api/barangay/disbursements/${row.id}/or-details`);
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
        } catch {
          this.currentLiquidation.orDetails = [];
        }
      } else {
        this.currentLiquidation.orDetails = [];
      }
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

      this.forms.expense = {
        account: accountDisplay,
        accountId: item.id,
        balance: item.balance || 0,
        particulars: '',
        amount: 0,
        disbursementId: this.currentItem?.id || null,
        // Store additional information for backend
        expense_class_id: item.expense_class_id,
        expense_type_id: item.expense_type_id,
        expense_item_id: item.expense_item_id,
      }
      this.dialogs.expense = false
      this.dialogs.expenseDetail = true
    },
    // Disbursement Actions
    // Update your saveDisbursement action in the Pinia store
    async saveDisbursement() {
      try {
        const authStore = useAuthStore()
        const token = authStore.token
        
        // Validate required fields
        if (!this.forms.disbursement.bank_id) {
          throw new Error('Please select a bank')
        }
        if (!this.selectedChequeNumber ) {
          throw new Error('Please select a cheque number')
        }
        if (!this.forms.disbursement.dvNumber) {
          throw new Error('Please enter a DV number')
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
          cheque_number: this.selectedChequeNumber ,
          cheque_booklet: this.chequeBooklets[0].booklet.id,
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

        const response = await api.post('/api/barangay/disbursements', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        console.log('Disbursement saved successfully:', response.data)

        // Refresh the disbursements list
        await this.fetchDisbursements()

        // Refresh expense accounts in background to ensure latest data
        this.refreshExpenseAccountsInBackground()

        // Reset the form and generate new DV number
        this.resetForm('disbursement')
        this.expenses = []
        this.generateNewDisbursementDefaults()
        this.closeDialog('disbursement')

        return { success: true, data: response.data.data }
      } catch (error) {
        console.error('Failed to save disbursement:', error)
        return { 
          success: false, 
          error: error.response?.data?.message || error.message || 'Failed to save disbursement' 
        }
      }
    },

    generateNewDisbursementDefaults() {
      const today = new Date()
      const dd = String(today.getDate()).padStart(2, '0')
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const yyyy = today.getFullYear()

      // Generate new DV number
      const lastDV = this.disbursements.reduce((max, d) => {
        const num = parseInt(d.dvNumber?.split('-')?.pop()) || 0
        return Math.max(max, num)
      }, 0)
      const newDVNumber = `DV-${String(yyyy).slice(-2)}-${mm}-${String(lastDV + 1).padStart(3, '0')}`

      // Update form with new defaults
      this.forms.disbursement.date = `${dd}/${mm}/${yyyy}`
      this.forms.disbursement.dvNumber = newDVNumber
    },

    // Expense Actions
    saveExpense() {
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

      // Validate amount against available balance
      const availableBalance = this.forms.expense.balance || 0
      
      // Calculate total amount already allocated to this account in current disbursement
      const existingAmountForAccount = this.expenses
        .filter(expense => expense.accountId === this.forms.expense.accountId)
        .reduce((total, expense) => total + Number(expense.amount), 0)
      
      const remainingBalance = availableBalance - existingAmountForAccount
      
      if (amount > remainingBalance) {
        throw new Error(`Amount exceeds available balance. Available: ₱${remainingBalance.toLocaleString()}, Requested: ₱${amount.toLocaleString()}`)
      }

      this.expenses.push({
        id: Date.now(),
        accountId: this.forms.expense.accountId,
        accountName: this.forms.expense.account,
        amount: amount,
        particular: particulars,
        // Store additional expense type information
        expense_class_id: this.forms.expense.expense_class_id,
        expense_type_id: this.forms.expense.expense_type_id,
        expense_item_id: this.forms.expense.expense_item_id,
      })

      this.expenses = [...this.expenses]
      this.closeDialog('expenseDetail')
      this.resetForm('expense')
    },
    // Similarly update editExpense and deleteExpense
    editExpense(row) {
      const index = this.expenses.findIndex((e) => e.id === row.id)
      if (index !== -1) {
        this.expenses[index] = row
        this.forms.disbursement.amount = this.totalExpensesAmount
      }
    },

    deleteExpense(id) {
      this.expenses = this.expenses.filter((e) => e.id !== id)
      this.forms.disbursement.amount = this.totalExpensesAmount
    },

    // Alias functions for EditDisbursement component
    editItem(row) {
      this.editExpense(row)
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
        this.selectedBooklet = null
        this.selectedChequeNumber = null
        this.chequeBooklets = []
        this.availableChequeNumbers = []
      } else if (formName === 'expense') {
        this.forms.expense = {
          account: '',
          balance: 0,
          particulars: '',
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
      await this.fetchDisbursementById(row.id);
      // Fetch expense accounts for the edit dialog
      await this.fetchExpenseAccounts();
    },


    async saveEditedDisbursement() {
      if (!this.currentItem) return

      try {
        const authStore = useAuthStore()
        const token = authStore.token

        // Prepare the payload
        const payload = {
          date: this.forms.disbursement.date,
          dv_number: this.forms.disbursement.dvNumber,
          cheque_number: this.forms.disbursement.chequeNumber,
          bank_id: this.forms.disbursement.bank_id,
          payee: this.forms.disbursement.payee,
          dv_amount: this.totalExpensesAmount,
          expenses: this.expenses.map(expense => ({
            accountId: expense.accountId,
            amount: expense.amount,
            particular: expense.particular
          }))
        }

        const response = await api.put(`/api/barangay/disbursements/${this.currentItem.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        console.log('Disbursement updated successfully:', response.data)

        // Refresh the disbursements list
        await this.fetchDisbursements()

        // Refresh expense accounts in background to ensure latest data
        this.refreshExpenseAccountsInBackground()

        // Close dialog and reset
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
      this.selectedBank = null
      this.selectedBooklet = null
      this.selectedChequeNumber = null
      this.availableChequeNumbers = []
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
        const token = authStore.token

        // Calculate total actual expense from OR details
        const totalActualExpense = this.currentLiquidation.orDetails?.reduce(
          (sum, or) => sum + (parseFloat(or.orAmount) || 0), 0
        ) || 0

        // Prepare the payload
        const payload = {
          orDetails: this.currentLiquidation.orDetails.filter(or => !or.isReadOnly).map(or => ({
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

        console.log('OR Details saved successfully:', response.data)

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
        const token = authStore.token

        // Calculate total actual expense from OR details
        const totalActualExpense = this.currentLiquidation.orDetails?.reduce(
          (sum, or) => sum + (parseFloat(or.orAmount) || 0), 0
        ) || 0

        // Prepare the payload for partial liquidation
        const payload = {
          orDetails: this.currentLiquidation.orDetails.filter(or => !or.isReadOnly).map(or => ({
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

        console.log('Partial OR Details saved successfully:', response.data)

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
        isReadOnly: false,
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
        const token = authStore.token
        
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

    async loadChequeBookletsForBank(newBankId) {
      try {
        const authStore = useAuthStore();
        const token = authStore.token;
        const bankData = await api.get(`/api/barangay/banks/${newBankId}/available-cheques`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        const data = bankData.data.data || [];

        // Map the cheque booklets for select options
        this.chequeBooklets = data.map(booklet => ({
          label: booklet.booklet_numb,
          value: booklet.id
        }));

        // Optionally store all cheque data for later filtering
        this.bookletCheques = data.reduce((acc, booklet) => {
          acc[booklet.id] = booklet.cheques;
          return acc;
        }, {});

        // Reset selections
        this.selectedBank = 1;
        this.selectedBooklet = null;
        this.availableChequeNumbers = [];
      } catch (error) {
        console.error('Failed to load cheque booklets:', error);
        this.chequeBooklets = [];
        this.selectedBooklet = null;
        this.availableChequeNumbers = [];
        // Notify user if $q is available (Quasar)
        if (typeof this.$q !== 'undefined') {
          this.$q.notify({
            type: 'negative',
            message: 'Failed to load cheque booklets. Please try again.',
            position: 'top'
          });
        }
      }
    },

    async deleteDisbursement(id) {
      try {
        const authStore = useAuthStore();
        const token = authStore.token;
        
        const response = await api.delete(`/api/barangay/disbursements/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        
        if (response.data.status) {
          // Remove the disbursement from the local array
          this.disbursements = this.disbursements.filter(d => d.id !== id);
          
          // Refresh expense accounts in background to ensure latest data
          this.refreshExpenseAccountsInBackground()
          
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
  },
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
