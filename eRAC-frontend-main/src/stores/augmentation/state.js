import { ref } from 'vue'
export function initialState() {
  return {
    currentItem: ref(null),
    augmentation: ref([]),

    Augexpenses: ref([]),

    AugexpenseAccounts: ref([]),

    // Loading states
    expenseAccountsLoading: ref(false),
    toExpenseSelectionLoading: ref(false),

    // Search/filters
    searchQuery: ref(''),
    dateFrom: ref(''),
    dateTo: ref(''),
    expenseSearch: ref(''),

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
        expense_class_id: null,
        expense_type_id: null,
        expense_item_id: null,
        from_expense: '',
        to_expense: '',
        from_expense_class_id: null,
        from_expense_type_id: null,
        from_expense_item_id: null,
        to_expense_class_id: null,
        to_expense_type_id: null,
        to_expense_item_id: null,
        account: '',
        balance: 0,
        particulars: '',
        amount: 0,
      }),
    }),

    // Loading states
    loading: ref({
      addDialog: false,
      saveAugmentation: false,
      addExpense: false,
    }),
  }
}
