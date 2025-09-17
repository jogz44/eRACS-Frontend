export function useFormActions(state) {
  // Helper function to get budget source label
  const getBudgetSourceLabel = (budgetSource) => {
    if (budgetSource?.toLowerCase().includes('annual')) {
      return 'Annual'
    } else if (budgetSource?.toLowerCase().includes('supplemental')) {
      return 'Supplemental'
    }
    return 'Annual' // Default
  }

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
        from_appropriation_id: null,
        to_appropriation_id: null,
        from_expense: '',
        to_expense: '',
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
    
    // Validate that FROM and TO appropriations are different
    if (augExpense.from_appropriation_id === augExpense.to_appropriation_id) {
      throw new Error('From and To appropriations must be different')
    }
    
    // Validate that FROM appropriation exists (must be allocated)
    if (!augExpense.from_appropriation_id) {
      throw new Error('From appropriation must be selected from an allocated account')
    }
    
    // For TO appropriation: if it's null (unallocated), we need to handle this case
    // The backend currently requires both appropriations to exist, but augmentation to unallocated accounts
    // should be allowed. This might need backend changes to support creating new appropriations.
    if (!augExpense.to_appropriation_id) {
      console.warn('TO appropriation is null (unallocated account). Backend may need to handle this case.')
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
    const accountKey = augExpense.from_appropriation_id
    const existingAmountForAccount = (state.Augexpenses.value || [])
      .filter(expense => expense.from_appropriation_id === accountKey)
      .reduce((total, expense) => total + Number(expense.amount), 0)
    const remainingBalance = availableBalance - existingAmountForAccount
    
    if (amount > remainingBalance) {
      throw new Error(`Amount exceeds available balance. Available: ₱${remainingBalance.toLocaleString()}, Requested: ₱${amount.toLocaleString()}`)
    }
    
    // Add expense
    const newId = (state.Augexpenses.value && state.Augexpenses.value.length > 0) 
      ? Math.max(...state.Augexpenses.value.map(e => e.id)) + 1 
      : 1
      
    // Calculate transfer type indicator
    const fromBudget = augExpense.from_budget_source || 'Annual Budget'
    const toBudget = augExpense.to_budget_source || 'Annual Budget'
    const transferType = `${getBudgetSourceLabel(fromBudget)} → ${getBudgetSourceLabel(toBudget)}`

    const expenseData = {
      id: newId,
      from_appropriation_id: augExpense.from_appropriation_id,
      to_appropriation_id: augExpense.to_appropriation_id,
      from_expense: augExpense.from_expense,
      to_expense: augExpense.to_expense,
      from_budget_source: fromBudget,
      to_budget_source: toBudget,
      transfer_type: transferType,
      amount: amount,
      particulars: particulars,
      // Include expense hierarchy data for creating new appropriations if needed
      to_expense_data: augExpense.to_expense_data || null
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
      // Calculate transfer type indicator
      const fromBudget = row.from_budget_source || 'Annual Budget'
      const toBudget = row.to_budget_source || 'Annual Budget'
      const transferType = `${getBudgetSourceLabel(fromBudget)} → ${getBudgetSourceLabel(toBudget)}`

      state.Augexpenses.value[index] = {
        ...row,
        from_expense: row.from_expense,
        to_expense: row.to_expense,
        from_appropriation_id: row.from_appropriation_id,
        to_appropriation_id: row.to_appropriation_id,
        from_budget_source: fromBudget,
        to_budget_source: toBudget,
        transfer_type: transferType,
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
