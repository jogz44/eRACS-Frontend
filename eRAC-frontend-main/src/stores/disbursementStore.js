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
    chequeBooklets: [
      { label: 'Booklet 1', range: '20000150-20000200' },
      { label: 'Booklet 2', range: '20000201-20000250' },
    ],
    availableChequeNumbers: [],
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

    // Pagination
    pagination: { rowsPerPage: 10 },
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
    // Fetch expense hierarchy from appropriation store

    async fetchExpenseAccounts() {
      try {
        const appropriationStore = useAppropriationStore()
        await appropriationStore.fetchExpenseHierarchy()
        this.expenseData = appropriationStore.allocations || []
      } catch (error) {
        console.error('Error fetching expense accounts:', error)
        this.expenseData = []
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
          bank: d.bank,
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

    selectBooklet(range) {
      this.selectedBooklet = range
      const [start, end] = range.split('-').map(Number)
      this.availableChequeNumbers = Array.from({ length: end - start }, (_, i) =>
        (start + 1 + i).toString(),
      )
      this.selectedChequeNumber = null
      this.forms.disbursement.chequeNumber = null
    },

    selectChequeNumber(number) {
      this.selectedChequeNumber = number
      this.forms.disbursement.chequeNumber = number
    },

    // Dialog Actions
    openDialog(dialogName) {
      if (dialogName === 'disbursement') {
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
            remarks: or.remarks || '',
          }));
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

        // Find and set the selected booklet based on the cheque number
        const chequeNum = parseInt(disbursement.chequeNumber)
        const selectedBooklet = this.chequeBooklets.find((booklet) => {
          const [start, end] = booklet.range.split('-').map(Number)
          return chequeNum >= start && chequeNum <= end
        })

        if (selectedBooklet) {
          this.selectedBooklet = selectedBooklet.range
          this.selectBooklet(selectedBooklet.range)
          this.selectedChequeNumber = disbursement.chequeNumber
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
      this.selectedBooklet = null
      this.selectedChequeNumber = null
      this.availableChequeNumbers = []
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

    async uploadOrPhoto(file) {
      try {
        const formData = new FormData();
        formData.append('photo', file, file.name);
        const response = await api.post('/api/barangay/disbursements/or-photo/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
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
