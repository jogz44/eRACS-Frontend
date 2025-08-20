export function useDialogActions(state, fetchExpenseAccounts, resetForm ) {
  const openDialog = async (dialogName) => {
    if (!state.dialogs?.value) {
      console.error('Dialogs state is not initialized')
      return
    }
    
    if (dialogName === 'augmentation') {
      state.loading.value.addDialog = true
      try {
        // Reset the form first
        resetForm('augmentation')
        
        // Clear any existing expenses
        state.Augexpenses.value = []
        state.currentItem.value = null
        
        // Set default date to today after form reset
        const today = new Date()
        const dd = String(today.getDate()).padStart(2, '0')
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const yyyy = today.getFullYear()
        
        // Set the date directly to the form
        state.forms.value.augmentation.augmentation_date = `${dd}/${mm}/${yyyy}`
        
        state.dialogs.value[dialogName] = true
      } finally {
        state.loading.value.addDialog = false
      }
    } else if (dialogName === 'augExpense') {
      state.loading.value.addExpense = true
      try {
        // Fetch expense accounts
        await fetchExpenseAccounts()
        state.dialogs.value[dialogName] = true
      } finally {
        state.loading.value.addExpense = false
      }
    }
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
      const accountName = expenseItem.account || 'Unknown Account'
      
      // Update the TO expense fields
      state.forms.value.augExpense.value.to_expense = accountName
      state.forms.value.augExpense.value.to_appropriation_id = expenseItem.appropriation_id
      
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
          from_appropriation_id: null,
          to_appropriation_id: null,
          from_expense: '',
          to_expense: '',
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
    const accountName = expenseItem.account || 'Unknown Account'
    
    state.forms.value.augExpense.value = {
      from_appropriation_id: expenseItem.appropriation_id,
      to_appropriation_id: null,
      from_expense: accountName, // Set the FROM expense
      to_expense: '', // TO expense will be selected later
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
