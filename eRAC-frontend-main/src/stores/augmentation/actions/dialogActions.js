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
      // Clear expense class filter when closing selection dialog
      state.selectedExpenseClass.value = null
    }

    // Reset view-only mode when closing augmentation dialog
    if (dialogName === 'augmentation') {
      state.isViewOnly.value = false
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
      state.forms.value.augExpense.value.to_budget_source = expenseItem.budget_source || 'Annual Budget'
      state.forms.value.augExpense.value.to_expense_class = expenseItem.expense_class
      
      // Store expense hierarchy data for creating new appropriations if needed
      state.forms.value.augExpense.value.to_expense_data = {
        expense_class_id: expenseItem.expense_class_id,
        expense_type_id: expenseItem.expense_type_id,
        expense_item_id: expenseItem.expense_item_id,
        expense_sub_item_id: expenseItem.expense_sub_item_id || null
      }

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
          from_expense_class: '',
          to_expense_class: '',
          from_budget_source: '',
          to_budget_source: '',
          account: '',
          balance: 0,
          particulars: '',
          amount: 0,
          to_expense_data: null,
        }
      } else {
        console.error('augExpense form ref is not available')
        return
      }
    }

    // Extract the expense details from the selected item (this becomes the FROM expense)
    const accountName = expenseItem.account || 'Unknown Account'

    // Set the selected expense class for filtering TO expenses
    state.selectedExpenseClass.value = expenseItem.expense_class

    state.forms.value.augExpense.value = {
      from_appropriation_id: expenseItem.appropriation_id,
      to_appropriation_id: null,
      from_expense: accountName, // Set the FROM expense
      to_expense: '', // TO expense will be selected later
      from_expense_class: expenseItem.expense_class, // Set the FROM expense class
      to_expense_class: '', // TO expense class will be set when TO expense is selected
      from_budget_source: expenseItem.budget_source || 'Annual Budget',
      to_budget_source: '',
      account: accountName,
      balance: expenseItem.balance || 0,
      particulars: '',
      amount: '',
      to_expense_data: null, // Will be set when TO expense is selected
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
