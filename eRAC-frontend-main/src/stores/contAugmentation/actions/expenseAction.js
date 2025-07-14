export function useExpenseActions(state) {
  const saveExpense = () => {
    state.Augexpenses.value.push({
      id: state.Augexpenses.value.length + 1,
      augmentationId: state.forms.value.augExpense.augmentationId,
      accountName: state.forms.value.augExpense.account,
      amount: state.forms.value.augExpense.amount.toLocaleString(),
      particular: state.forms.value.augExpense.particulars,
    })
  }

  return {
    saveExpense,
  }
}
