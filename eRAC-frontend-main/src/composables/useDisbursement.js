import { ref } from 'vue'

export function useDisbursement() {
  // Main disbursement data
  const disbursement = ref([
    { id: 1, date: '22/01/2025', dvNumber: 'DV-25-43-01', payee: 'NORDECO', amount: '5,000.00' },
  ])

  // Expense data (linked to disbursements)
  const expenses = ref([
    {
      id: 1,
      disbursementId: 1, // Link to disbursement
      accountName: 'MOOE-Electricity',
      amount: '2,500.00',
      particular: 'Bill for March 2025',
    },
    {
      id: 2,
      disbursementId: 1, // Link to disbursement
      accountName: 'MOOE-Water',
      amount: '1,500.00',
      particular: 'Bill for March 2025',
    },
  ])

  // Available expense accounts
  const expenseAccounts = ref([
    { id: 1, account: 'MOOE - Electricity', balance: 100000.0 },
    { id: 2, account: 'MOOE - Water', balance: 75000.0 },
    { id: 3, account: 'MOOE - Internet', balance: 50000.0 },
    { id: 4, account: 'MOOE - Office Supplies', balance: 30000.0 },
  ])

  // Search and filter
  const searchQuery = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')

  // Table columns
  const disbursementColumns = [
    { name: 'id', label: 'ID', field: 'id', align: 'left' },
    { name: 'date', label: 'Date', field: 'date', align: 'left' },
    { name: 'dvNumber', label: 'DV Number', field: 'dvNumber', align: 'left' },
    { name: 'payee', label: 'Payee', field: 'payee', align: 'left' },
    { name: 'amount', label: 'Amount', field: 'amount', align: 'right' },
    { name: 'action', label: 'Action', field: '', align: 'center' },
  ]

  const expenseColumns = [
    { name: 'id', label: 'ID', field: 'id', align: 'left' },
    { name: 'accountName', label: 'Account Name', field: 'accountName', align: 'left' },
    { name: 'amount', label: 'Amount', field: 'amount', align: 'right' },
    { name: 'particular', label: 'Particular', field: 'particular', align: 'left' },
    { name: 'action', label: 'Action', field: '', align: 'center' },
  ]

  const expenseAccountColumns = [
    { name: 'account', label: 'Account', field: 'account', align: 'left' },
    {
      name: 'balance',
      label: 'Balance',
      field: (row) => `₱${row.balance.toLocaleString()}`,
      align: 'right',
    },
    { name: 'action', label: 'Action', field: '', align: 'center' },
  ]

  // Pagination
  const pagination = ref({ rowsPerPage: 10 })

  // Dialog controls
  const showDisbursementDialog = ref(false)
  const showExpenseDialog = ref(false)
  const showExpenseDetailDialog = ref(false)

  // Form models
  const disbursementForm = ref({
    date: '',
    dvNumber: '',
    payee: '',
    amount: '',
  })

  const expenseForm = ref({
    account: '',
    balance: 0,
    particulars: '',
    amount: 0,
    disbursementId: null, // Link to parent disbursement
  })

  // Methods
  const addDisbursement = () => {
    showDisbursementDialog.value = true
  }

  const saveDisbursement = () => {
    const newId = disbursement.value.length + 1
    disbursement.value.push({
      id: newId,
      ...disbursementForm.value,
    })
    resetDisbursementForm()
    showDisbursementDialog.value = false
  }

  const resetDisbursementForm = () => {
    disbursementForm.value = {
      date: '',
      dvNumber: '',
      payee: '',
      amount: '',
    }
  }

  const addExpense = (disbursementId) => {
    expenseForm.value.disbursementId = disbursementId
    showExpenseDialog.value = true
  }

  const openExpenseDetail = (account) => {
    expenseForm.value = {
      ...expenseForm.value, // Keep existing disbursementId
      account: account.account,
      balance: account.balance,
      particulars: '',
      amount: 0,
    }
    showExpenseDetailDialog.value = true
    showExpenseDialog.value = false
  }

  const saveExpense = () => {
    expenses.value.push({
      id: expenses.value.length + 1,
      disbursementId: expenseForm.value.disbursementId,
      accountName: expenseForm.value.account,
      amount: expenseForm.value.amount.toLocaleString(),
      particular: expenseForm.value.particulars,
    })
    showExpenseDetailDialog.value = false
  }

  // Other CRUD methods
  const editItem = (row) => console.log('Editing:', row)
  const deleteItem = (row) => console.log('Deleting:', row)
  const editDisbursement = (row) => console.log('Editing disbursement:', row)
  const deleteDisbursement = (row) => console.log('Deleting disbursement:', row)
  const viewDisbursementDialog = (row) => console.log('Viewing disbursement:', row)

  return {
    // Data
    disbursement,
    expenses,
    expenseAccounts,

    // Columns
    disbursementColumns,
    expenseColumns,
    expenseAccountColumns,

    // Search/filter
    searchQuery,
    dateFrom,
    dateTo,

    // Pagination
    pagination,

    // Dialog controls
    showDisbursementDialog,
    showExpenseDialog,
    showExpenseDetailDialog,

    // Form models
    disbursementForm,
    expenseForm,

    // Methods
    addDisbursement,
    saveDisbursement,
    addExpense,
    openExpenseDetail,
    saveExpense,
    editItem,
    deleteItem,
    editDisbursement,
    deleteDisbursement,
    viewDisbursementDialog,
  }
}
