export function useAugmentationActions(state) {
  const saveAugmentation = () => {
    const newId = state.augmentation.value.length + 1
    state.augmentation.value.push({
      id: newId,
      ...state.forms.value.augmentation,
    })
  }



  return {
    saveAugmentation,
  }
}
