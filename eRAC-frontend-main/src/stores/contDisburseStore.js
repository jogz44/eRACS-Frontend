import { defineStore } from 'pinia'

export const useContDisbursementStore = defineStore('contdisbursement', {
  state: () => ({
    // Main data collections
    expenseData: [], // This will hold our complete expense hierarchy
    expenses: [], // Initialize expenses array
    expenseSearch: '',
    currentItem: null,
    disbursements: [
      {
        id: 1,
        date: '22/01/2025',
        dvNumber: 'DV-25-43-01',
        chequeNumber: '123456', // Consistent property name
        bank: 'BDO',
        payee: 'NORDECO',
        dvAmount: 4000.0,
        aging: '20 days',
        status: 'Liquidated',
      },
    ],

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

    // Form data
    forms: {
      disbursement: {
        date: '',
        dvNumber: '',
        chequeNumber: '', // Changed from checkNumber to chequeNumber
        bank: '',
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
  }),

  getters: {
    // Filtered expense accounts for search
    expenseAccounts(state) {
      if (!state.expenseData || state.expenseData.length === 0) return []

      return state.expenseData.reduce((acc, expenseClass) => {
        if (!expenseClass.children) return acc

        expenseClass.children.forEach((expenseType) => {
          if (!expenseType.children) return

          expenseType.children.forEach((expenseItem) => {
            acc.push({
              id: expenseItem.id,
              account: expenseClass.name,
              expenseType: expenseType.name,
              expenseItem: expenseItem.name,
              balance: expenseItem.amount || 0,
            })
          })
        })

        return acc
      }, [])
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
      if (!state.expenseSearch.trim()) return this.expenseAccounts

      const query = state.expenseSearch.toLowerCase()
      return this.expenseAccounts.filter(
        (item) =>
          item.account.toLowerCase().includes(query) ||
          item.expenseType.toLowerCase().includes(query) ||
          item.expenseItem.toLowerCase().includes(query) ||
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
    async fetchDisbursements() {
      this.loading = true
      try {
        // API call would go here
        // const response = await api.getDisbursements();
        // this.disbursements = response.data;
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    setCurrentDisbursement(disbursement) {
      this.currentDisbursement = disbursement
    },

    clearCurrentDisbursement() {
      this.currentDisbursement = null
    },

    openDialog(dialogName) {
      if (dialogName === 'disbursement') {
        // Generate new disbursement defaults including DV number
        this.generateNewDisbursementDefaults()

        // Generate cheque number (separate logic)
        const lastCheque = this.disbursements.reduce(
          (max, d) => Math.max(max, parseInt(d.chequeNumber) || 0),
          0,
        )
        this.forms.disbursement.chequeNumber = String(lastCheque + 1).padStart(6, '0')
      }
      this.dialogs[dialogName] = true
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
      this.forms.expense = {
        account: `${item.account} > ${item.expenseType} > ${item.expenseItem}`,
        accountId: item.id,
        balance: item.balance,
        particulars: '',
        amount: 0,
        disbursementId: this.currentItem?.id || null,
      }
      this.dialogs.expense = false
      this.dialogs.expenseDetail = true
    },
    // Disbursement Actions
    // Update your saveDisbursement action in the Pinia store
    saveDisbursement() {
      const newId = this.disbursements.length + 1

      this.disbursements.push({
        id: newId,
        date: this.forms.disbursement.date,
        dvNumber: this.forms.disbursement.dvNumber,
        chequeNumber: this.forms.disbursement.chequeNumber,
        bank: this.forms.disbursement.bank,
        payee: this.forms.disbursement.payee,
        dvAmount: this.totalExpensesAmount,
        aging: '0 days',
        status: 'Pending',
      })

      // Reset the form and generate new DV number
      this.resetForm('disbursement')
      this.generateNewDisbursementDefaults() // Add this line
      this.closeDialog('disbursement')
    },

    generateNewDisbursementDefaults() {
      const today = new Date()
      const dd = String(today.getDate()).padStart(2, '0')
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const yyyy = today.getFullYear()

      // Generate new DV number - only consider disbursements from current month
      const currentMonthDisbursements = this.disbursements.filter(d => {
        // Extract month from DV number (format: DV-YY-MM-XXX)
        const dvParts = d.dvNumber?.split('-')
        if (dvParts && dvParts.length >= 3) {
          const dvMonth = dvParts[2] // Get the month part
          const dvYear = dvParts[1]  // Get the year part
          return dvMonth === mm && dvYear === String(yyyy).slice(-2)
        }
        return false
      })

      // If no disbursements exist for current month, start from 001
      const lastDV = currentMonthDisbursements.length > 0 
        ? currentMonthDisbursements.reduce((max, d) => {
            const num = parseInt(d.dvNumber?.split('-')?.pop()) || 0
            return Math.max(max, num)
          }, 0)
        : 0
      const newDVNumber = `DV-${String(yyyy).slice(-2)}-${mm}-${String(lastDV + 1).padStart(3, '0')}`

      // Update form with new defaults
      this.forms.disbursement.date = `${dd}/${mm}/${yyyy}`
      this.forms.disbursement.dvNumber = newDVNumber
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

    // Form Actions
    resetForm(formName) {
      if (formName === 'disbursement') {
        this.forms.disbursement = {
          date: '',
          dvNumber: '',
          chequeNumber: '', // Add this line
          bank: '',
          payee: '',
          amount: '',
        }
        this.expenses = []
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

    openEditDisbursement(row) {
      const disbursement = this.disbursements.find((d) => d.id === row.id)
      if (disbursement) {
        this.forms.disbursement = {
          date: disbursement.date,
          dvNumber: disbursement.dvNumber,
          chequeNumber: disbursement.chequeNumber,
          bank: disbursement.bank,
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
