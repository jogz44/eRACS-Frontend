export function useDialogActions(state, fetchExpenseAccounts, fetchAvailableBudgets, resetForm) {
  const openDialog = async (dialogName) => {
    if (!state.dialogs?.value) {
      console.error('Dialogs state is not initialized')
      return
    }
    
    if (dialogName === 'augmentation') {
      // Reset the form first
      resetForm('augmentation')
      
      // Clear any existing expenses
      state.Augexpenses.value = []
      state.currentItem.value = null
      
      // Fetch available budgets
      await fetchAvailableBudgets()
      
      // Set default date to today after form reset
      const today = new Date()
      const dd = String(today.getDate()).padStart(2, '0')
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const yyyy = today.getFullYear()
      
      // Set the date directly to the form
      state.forms.value.augmentation.augmentation_date = `${dd}/${mm}/${yyyy}`
    } else if (dialogName === 'augExpense') {
      // Get the selected budget ID
      const selectedBudget = state.forms.value?.augmentation?.budget_id
      
      if (!selectedBudget) {
        console.warn('No budget selected. Please select a budget first.')
        // You can add a notification here if you have access to Quasar's $q
        return
      }
      
      // Extract the budget ID (it might be an object or just the ID)
      const selectedBudgetId = typeof selectedBudget === 'object' ? selectedBudget.id : selectedBudget
      
      // Fetch expense accounts for the selected budget
      await fetchExpenseAccounts(selectedBudgetId)
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
    
    state.forms.value.augExpense.value = {
      expense_class_id: expenseItem.expense_class_id,
      expense_type_id: expenseItem.expense_type_id,
      expense_item_id: expenseItem.expense_item_id,
      account: `${expenseItem.expense_class} > ${expenseItem.expense_type} > ${expenseItem.expense_item}`,
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
