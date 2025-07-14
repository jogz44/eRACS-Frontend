export function useDialogActions(state) {
  const openDialog = (dialogName) => {
    state.dialogs.value[dialogName] = true
  }

  const closeDialog = (dialogName) => {
    state.dialogs.value[dialogName] = false
  }

  const openExpenseDetail = (account) => {
    state.forms.value.augExpense = {
      ...state.forms.value.augExpense,
      account: account.account,
      balance: account.balance,
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
