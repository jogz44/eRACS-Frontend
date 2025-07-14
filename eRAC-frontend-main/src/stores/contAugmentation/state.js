import { ref } from 'vue'
export function initialState() {
  return {
    currentItem: ref(null),
    augmentation: ref([
      {
        id: 1,
        refNo: 'AUG-25-43-011',
        date: '22/01/2025',
        totalAmount: '4,000.00',
        remarks: 'Remarks for Augmentation 1',
      },
      {
        id: 2,
        refNo: 'AUG-25-43-011',
        date: '22/01/2025',
        totalAmount: '4,000.00',
        remarks: 'Remarks for Augmentation 1',
      },
      {
        id: 3,
        refNo: 'AUG-25-43-011',
        date: '22/01/2025',
        totalAmount: '4,0001.00',
        remarks: 'Remarks for Augmentation 1',
      },
      {
        id: 1,
        refNo: 'AUG-25-43-011',
        date: '22/01/2025',
        totalAmount: '4,0001.00',
        remarks: 'Remarks for Augmentation 1',
      },
      {
        id: 1,
        refNo: 'AUG-25-43-01S',
        date: '22/01/2025',
        totalAmount: '4,0002.00',
        remarks: 'Remarks for Augmentation 1',
      },

      {
        id: 2,
        refNO: 'AUG-25-43-01S',
        date: '22/01/2025',
        totalAmount: '4,000.00',
        remarks: 'Remarks for Augmentation sad1',
      },
    ]),

    Augexpenses: ref([
      {
        id: 1,
        augmentationId: 1,
        accountName: 'MOOE-Electricity',
        amount: '2,500.00',
        particular: 'Bill for March 2025',
      },
    ]),

    AugexpenseAccounts: ref([
      { id: 1, account: 'MOOE - Electricity', balance: 100000.0 },
      { id: 2, account: 'MOOE - Water', balance: 75000.0 },
      { id: 3, account: 'MOOE - Internet', balance: 50000.0 },
    ]),

    // Search/filters
    searchQuery: ref(''),
    dateFrom: ref(''),
    dateTo: ref(''),

    dialogs: ref({
      augmentation: false,
      augExpense: false,
      AugexpenseDetail: false,
    }),

    forms: ref({
      augmentation: {
        date: '',
        refNo: '',
        remarks: '',
      },

      augExpense: {
        account: '',
        balance: 0,
        particulars: '',
        augmentationId: null,
      },
    }),
  }
}
