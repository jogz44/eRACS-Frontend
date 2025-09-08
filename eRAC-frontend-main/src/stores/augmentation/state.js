import { ref } from 'vue'
export function initialState() {
  return {
    currentItem: ref(null),
    augmentation: ref([]),

    Augexpenses: ref([]),

    AugexpenseAccounts: ref([]),
    availableBudgets: ref([]),

    // Loading states
    expenseAccountsLoading: ref(false),
    toExpenseSelectionLoading: ref(false),
    loadingBudgets: ref(false),

    // Search/filters
    searchQuery: ref(''),
    dateFrom: ref(''),
    dateTo: ref(''),
    expenseSearch: ref(''),
    selectedBarangayId: ref(null), // Added for admin barangay filtering
    selectedBudgetSource: ref('all'), // For budget source filtering (annual/supplemental)
    selectedExpenseClass: ref(null), // For expense class filtering when selecting TO expense

    // Pagination
    pagination: ref({
      rowsPerPage: 10,
    }),

    dialogs: ref({
      augmentation: false,
      augExpense: false,
      AugexpenseDetail: false,
    }),

    // Transfer selection state
    isSelectingToExpense: ref(false),

    forms: ref({
      augmentation: ref({
        augmentation_date: '',
        remarks: '',
        refNo: '',
      }),

      augExpense: ref({
        from_appropriation_id: null,
        to_appropriation_id: null,
        from_expense: '',
        to_expense: '',
        from_expense_class: '',
        to_expense_class: '',
        account: '',
        balance: 0,
        particulars: '',
        amount: '',
      }),
    }),

    // Loading states
    loading: ref({
      addDialog: false,
      saveAugmentation: false,
      addExpense: false,
    }),
    loadingAugmentations: ref(false), // Loading state for fetching augmentations

    // View mode state
    isViewOnly: ref(false), // Flag to indicate if dialog is in view-only mode
  }
}
