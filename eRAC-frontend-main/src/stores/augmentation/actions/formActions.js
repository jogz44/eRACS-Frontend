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
    
    // Validate that both from and to expenses are selected
    if (!augExpense.from_expense || !augExpense.to_expense) {
      throw new Error('Both From Expense and To Expense must be selected')
    }
    
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
    const accountKey = `${augExpense.from_expense_class_id}-${augExpense.from_expense_type_id}-${augExpense.from_expense_item_id}`
    const existingAmountForAccount = (state.Augexpenses.value || [])
      .filter(expense => `${expense.from_expense_class_id}-${expense.from_expense_type_id}-${expense.from_expense_item_id}` === accountKey)
      .reduce((total, expense) => total + Number(expense.amount), 0)
    const remainingBalance = availableBalance - existingAmountForAccount
    
    if (amount > remainingBalance) {
      throw new Error(`Amount exceeds available balance. Available: ₱${remainingBalance.toLocaleString()}, Requested: ₱${amount.toLocaleString()}`)
    }
    
    // Add expense
    const newId = (state.Augexpenses.value && state.Augexpenses.value.length > 0) 
      ? Math.max(...state.Augexpenses.value.map(e => e.id)) + 1 
      : 1
      
    const expenseData = {
      id: newId,
      from_expense_class_id: augExpense.from_expense_class_id,
      from_expense_type_id: augExpense.from_expense_type_id,
      from_expense_item_id: augExpense.from_expense_item_id,
      to_expense_class_id: augExpense.to_expense_class_id,
      to_expense_type_id: augExpense.to_expense_type_id,
      to_expense_item_id: augExpense.to_expense_item_id,
      from_expense: augExpense.from_expense,
      to_expense: augExpense.to_expense,
      amount: amount,
      particulars: particulars,
    }
    
    if (!state.Augexpenses.value) {
      state.Augexpenses.value = []
    }
    
    state.Augexpenses.value.push(expenseData)
    state.Augexpenses.value = [...state.Augexpenses.value]
    
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
        from_expense: row.from_expense,
        to_expense: row.to_expense,
        from_expense_class_id: row.from_expense_class_id,
        from_expense_type_id: row.from_expense_type_id,
        from_expense_item_id: row.from_expense_item_id,
        to_expense_class_id: row.to_expense_class_id,
        to_expense_type_id: row.to_expense_type_id,
        to_expense_item_id: row.to_expense_item_id,
      }
      state.Augexpenses.value = [...state.Augexpenses.value]
    }
  }

  const deleteItem = (id) => {
    if (!state.Augexpenses.value) {
      state.Augexpenses.value = []
    }
    
    const index = state.Augexpenses.value.findIndex((e) => e.id === Number(id))
    if (index !== -1) {
      state.Augexpenses.value.splice(index, 1)
      state.Augexpenses.value = [...state.Augexpenses.value]
    }
  }

  return {
    resetForm,
    saveExpense,
    editItem,
    deleteItem,
  }
}
