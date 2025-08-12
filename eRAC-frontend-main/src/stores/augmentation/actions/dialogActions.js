export function useDialogActions(state, fetchExpenseAccounts, resetForm) {
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
    state.dialogs.value[dialogName] = false
  }

  const openExpenseDetail = (expenseItem) => {
    // Initialize the form if it's not already initialized
    if (!state.forms.value?.augExpense?.value) {
      if (state.forms.value?.augExpense) {
        state.forms.value.augExpense.value = {
          expense_class_id: null,
          expense_type_id: null,
          expense_item_id: null,
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
    
    // Extract the expense details from the selected item
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
      expense_class: expenseClass,
      expense_type: expenseType,
      expense_item: expenseItemName,
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
