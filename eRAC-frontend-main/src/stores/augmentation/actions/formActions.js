export function useFormActions(state) {
  const resetForm = (formName) => {
    if (!state?.forms?.value) return

    if (formName === 'augmentation') {
      state.forms.value.augmentation = {
        date: '',
        refNo: '',
        remarks: '',
      }
    } else if (formName === 'augExpense') {
      state.forms.value.augExpense = {
        account: '',
        balance: 0,
        particulars: '',
        augmentationId: null,
      }
    }
  }

  return {
    resetForm,
  }
}
