// Augmentation Store
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { initialState } from './state'
import { useGetters } from './getters'
import { useDialogActions } from './actions/dialogActions.js'
import { useFormActions } from './actions/formActions'
import { useAugmentationActions } from './actions/augmentationAction'
//import { useExpenseActions } from './actions/expenseActions'

export const useAugmentationStore = defineStore('augmentation', () => {
  const state = initialState()
  
  const getters = useGetters(state)

  // Get augmentation actions first to access fetchExpenseAccounts
  const augmentationActions = useAugmentationActions(state)

  // Combine all actions
  const actions = {
    ...useDialogActions(state, augmentationActions.fetchExpenseAccounts, augmentationActions.resetForm, augmentationActions.generateNewAugmentationDefaults),
    ...useFormActions(state),
    ...augmentationActions,
    //...useExpenseActions(state),
  }

  // Computed properties to unwrap refs for easier component access
  const forms = computed(() => state.forms.value)

  return {
    // State
    ...state,

    // Getters
    ...getters,

    // Actions
    ...actions,

    // Computed properties
    forms,
  }
})
