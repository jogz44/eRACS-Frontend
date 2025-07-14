// Augmentation Store
import { defineStore } from 'pinia'
import { initialState } from './state'
import { useGetters } from './getters'
import { useDialogActions } from './actions/dialogActions.js'
import { useFormActions } from './actions/formActions'
//import { useAugmentationActions } from './actions/augmentationActions'
//import { useExpenseActions } from './actions/expenseActions'

export const useAugmentationStore = defineStore('augmentation', () => {
  const state = initialState()
  const getters = useGetters(state)

  // Combine all actions
  const actions = {
    ...useDialogActions(state),
    ...useFormActions(state),
    //...useAugmentationActions(state),
    //...useExpenseActions(state),
  }

  return {
    // State
    ...state,

    // Getters
    ...getters,

    // Actions
    ...actions,
  }
})
