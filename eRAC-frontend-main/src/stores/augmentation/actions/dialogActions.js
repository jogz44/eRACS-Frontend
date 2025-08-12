export function useDialogActions(state, fetchExpenseAccounts, resetForm ) {
  const openDialog = async (dialogName) => {
    if (!state.dialogs?.value) {
      console.error('Dialogs state is not initialized')
      return
    }
    
    if (dialogName === 'augmentation') {
      // Reset the form and all related state
      resetForm('augmentation')
    } else if (dialogName === 'augExpense') {
      // Fetch expense accounts
      await fetchExpenseAccounts()
    }
    
    state.dialogs.value[dialogName] = true
  }

  const closeDialog = (dialogName) => {
    if (!state.dialogs?.value) {
      console.error('Dialogs state is not initialized')
      return
    }
    
    // Reset loading states when closing expense selection dialog
    if (dialogName === 'augExpense') {
      state.toExpenseSelectionLoading.value = false
      state.isSelectingToExpense.value = false
    }
    
    state.dialogs.value[dialogName] = false
  }

  const openExpenseDetail = (expenseItem) => {
    // Check if we're selecting a TO expense
    if (state.isSelectingToExpense.value) {
      // Update the TO expense fields in the current form
      const expenseClass = expenseItem.account || expenseItem.expense_class || ''
      const expenseType = expenseItem.expenseType || expenseItem.expense_type || ''
      const expenseItemName = expenseItem.expenseItem || expenseItem.expense_item || ''
      
      // Construct account name only with fields that have values
      const parts = []
      if (expenseClass) parts.push(expenseClass)
      if (expenseType) parts.push(expenseType)
      if (expenseItemName) parts.push(expenseItemName)
      const accountName = parts.join(' > ')
      
      // Update the TO expense fields
      state.forms.value.augExpense.value.to_expense = accountName
      state.forms.value.augExpense.value.to_expense_class_id = expenseItem.expense_class_id
      state.forms.value.augExpense.value.to_expense_type_id = expenseItem.expense_type_id
      state.forms.value.augExpense.value.to_expense_item_id = expenseItem.expense_item_id
      
      // Reset the flag and loading state
      state.isSelectingToExpense.value = false
      state.toExpenseSelectionLoading.value = false
      
      // Close the expense selection dialog
      state.dialogs.value.augExpense = false
      return
    }
    
    // Initialize the form if it's not already initialized
    if (!state.forms.value?.augExpense?.value) {
      if (state.forms.value?.augExpense) {
        state.forms.value.augExpense.value = {
          expense_class_id: null,
          expense_type_id: null,
          expense_item_id: null,
          from_expense: '',
          to_expense: '',
          from_expense_class_id: null,
          from_expense_type_id: null,
          from_expense_item_id: null,
          to_expense_class_id: null,
          to_expense_type_id: null,
          to_expense_item_id: null,
          account: '',
          balance: 0,
          particulars: '',
          amount: 0,
        }
      } else {
        console.error('augExpense form ref is not available')
        return
      }
    }
    
    // Extract the expense details from the selected item (this becomes the FROM expense)
    const expenseClass = expenseItem.account || expenseItem.expense_class || ''
    const expenseType = expenseItem.expenseType || expenseItem.expense_type || ''
    const expenseItemName = expenseItem.expenseItem || expenseItem.expense_item || ''
    
    // Construct account name only with fields that have values
    const parts = []
    if (expenseClass) parts.push(expenseClass)
    if (expenseType) parts.push(expenseType)
    if (expenseItemName) parts.push(expenseItemName)
    const accountName = parts.join(' > ')
    
    state.forms.value.augExpense.value = {
      expense_class_id: expenseItem.expense_class_id,
      expense_type_id: expenseItem.expense_type_id,
      expense_item_id: expenseItem.expense_item_id,
      from_expense: accountName, // Set the FROM expense
      to_expense: '', // TO expense will be selected later
      from_expense_class_id: expenseItem.expense_class_id,
      from_expense_type_id: expenseItem.expense_type_id,
      from_expense_item_id: expenseItem.expense_item_id,
      to_expense_class_id: null,
      to_expense_type_id: null,
      to_expense_item_id: null,
      account: accountName,
      balance: expenseItem.balance || 0,
      particulars: '',
      amount: 0,
    }
    
    state.dialogs.value.augExpense = false
    state.dialogs.value.AugexpenseDetail = true
  }

  return {
    openDialog,
    closeDialog,
    openExpenseDetail,
  }
}
