import { ref } from 'vue'
export function initialState() {
  return {
    currentItem: ref(null),
    augmentation: ref([]),

    Augexpenses: ref([]),

    AugexpenseAccounts: ref([]),

    // Loading states
    expenseAccountsLoading: ref(false),

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
        account: '',
        balance: 0,
        particulars: '',
        amount: 0,
      }),
    }),
  }
}
