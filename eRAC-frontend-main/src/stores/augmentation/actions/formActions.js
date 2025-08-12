export function useFormActions(state) {
  const resetForm = (formName) => {
    if (!state?.forms?.value) return

    if (formName === 'augmentation') {
      state.forms.value.augmentation = {
        augmentation_date: '',
        remarks: '',
        refNo: '',
      }
    } else if (formName === 'augExpense') {
      state.forms.value.augExpense = {
        expense_class_id: null,
        expense_type_id: null,
        expense_item_id: null,
        account: '',
        balance: 0,
        particulars: '',
        amount: 0,
      }
    }
  }

  const saveExpense = () => {
    // Always use .value for refs
    const augExpense = state.forms.value.augExpense?.value || state.forms.value.augExpense
    if (!augExpense) {
      throw new Error('Expense form is not initialized')
    }
    const particulars = augExpense.particulars?.trim() || ''
    const amount = Number(augExpense.amount) || 0
    // Validate particulars
    if (!particulars) {
      throw new Error('Particulars is required')
    }
    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0')
    }
    // Validate amount against available balance
    const availableBalance = augExpense.balance || 0
    // Calculate total amount already allocated to this account in current augmentation
    const accountKey = `${augExpense.expense_class_id}-${augExpense.expense_type_id}-${augExpense.expense_item_id}`
    const existingAmountForAccount = (state.Augexpenses.value || [])
      .filter(expense => `${expense.expense_class_id}-${expense.expense_type_id}-${expense.expense_item_id}` === accountKey)
      .reduce((total, expense) => total + Number(expense.amount), 0)
    const remainingBalance = availableBalance - existingAmountForAccount
    if (amount > remainingBalance) {
      throw new Error(`Amount exceeds available balance. Available: ₱${remainingBalance.toLocaleString()}, Requested: ₱${amount.toLocaleString()}`)
    }
    
    // Construct the account name from the selected expense details
    const parts = []
    if (augExpense.expense_class) parts.push(augExpense.expense_class)
    if (augExpense.expense_type) parts.push(augExpense.expense_type)
    if (augExpense.expense_item) parts.push(augExpense.expense_item)
    const accountName = parts.join(' > ')
    
    // Add expense
    const newId = (state.Augexpenses.value && state.Augexpenses.value.length > 0) 
      ? Math.max(...state.Augexpenses.value.map(e => e.id)) + 1 
      : 1
    const expenseData = {
      id: newId,
      expense_class_id: augExpense.expense_class_id,
      expense_type_id: augExpense.expense_type_id,
      expense_item_id: augExpense.expense_item_id,
      account: accountName, // Use the constructed account name for display
      amount: amount,
      particulars: particulars,
    }
    if (!state.Augexpenses.value) {
      state.Augexpenses.value = []
    }
    state.Augexpenses.value.push(expenseData)
    console.log('Expense added:', expenseData)
    console.log('Current expenses array:', state.Augexpenses.value)
    console.log('Expenses count:', state.Augexpenses.value.length)
    
    state.Augexpenses.value = [...state.Augexpenses.value]
    console.log('After force update - expenses count:', state.Augexpenses.value.length)
    
    state.dialogs.value.AugexpenseDetail = false
    resetForm('augExpense')
  }

  const editItem = (row) => {
    if (!state.Augexpenses.value) {
      state.Augexpenses.value = []
    }
    const index = state.Augexpenses.value.findIndex((e) => e.id === row.id)
    if (index !== -1) {
      state.Augexpenses.value[index] = {
        ...row,
        expense_class: row.expense_class,
        expense_type: row.expense_type,
        expense_item: row.expense_item,
      }
      state.Augexpenses.value = [...state.Augexpenses.value]
    }
  }

  const deleteItem = (id) => {
    if (!state.Augexpenses.value) {
      state.Augexpenses.value = []
      return
    }
    console.log('deleteItem called with id:', id, 'type:', typeof id)
    console.log('Before delete - expenses count:', state.Augexpenses.value.length)
    console.log('Current expenses:', state.Augexpenses.value)
    
    // Ensure id is a number for comparison
    const numericId = Number(id)
    console.log('Numeric ID:', numericId)
    
    // Filter out the expense with the matching ID
    const filteredExpenses = state.Augexpenses.value.filter((e) => Number(e.id) !== numericId)
    console.log('Filtered expenses:', filteredExpenses)
    
    // Update the state
    state.Augexpenses.value = filteredExpenses
    console.log('After delete - expenses count:', state.Augexpenses.value.length)
    console.log('Remaining expenses:', state.Augexpenses.value)
    
    // Force update by creating a new array reference
    state.Augexpenses.value = [...state.Augexpenses.value]
  }

  return {
    resetForm,
    saveExpense,
    editItem,
    deleteItem,
  }
}
