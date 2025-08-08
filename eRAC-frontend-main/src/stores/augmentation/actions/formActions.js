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
    console.log('Saving expense with form data:', state.forms.value.augExpense?.value)
    
    if (!state.forms.value.augExpense?.value) {
      console.error('augExpense form is not initialized')
      return
    }
    
    const newId = state.Augexpenses.value.length + 1
    const expenseData = {
      id: newId,
      expense_class_id: state.forms.value.augExpense.value.expense_class_id,
      expense_type_id: state.forms.value.augExpense.value.expense_type_id,
      expense_item_id: state.forms.value.augExpense.value.expense_item_id,
      account: state.forms.value.augExpense.value.account,
      expense_class: state.forms.value.augExpense.value.account.split(' > ')[0] || '',
      expense_type: state.forms.value.augExpense.value.account.split(' > ')[1] || '',
      expense_item: state.forms.value.augExpense.value.account.split(' > ')[2] || '',
      amount: Number(state.forms.value.augExpense.value.amount) || 0,
      particulars: state.forms.value.augExpense.value.particulars,
      }
    
    console.log('Adding expense data:', expenseData)
    state.Augexpenses.value.push(expenseData)
    state.Augexpenses.value = [...state.Augexpenses.value]
    console.log('Updated Augexpenses:', state.Augexpenses.value)
    
    state.dialogs.value.AugexpenseDetail = false
    resetForm('augExpense')
  }

  const editItem = (row) => {
    const index = state.Augexpenses.value.findIndex((e) => e.id === row.id)
    if (index !== -1) {
      state.Augexpenses.value[index] = row
      state.Augexpenses.value = [...state.Augexpenses.value]
    }
  }

  const deleteItem = (id) => {
    state.Augexpenses.value = state.Augexpenses.value.filter((e) => e.id !== id)
  }

  return {
    resetForm,
    saveExpense,
    editItem,
    deleteItem,
  }
}
