import { computed } from 'vue'

export function useGetters(state) {
  const augmentationColumns = computed(() => [
    { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
    { name: 'ref_number', label: 'Ref No', field: 'ref_number', align: 'left', sortable: true },
    { name: 'augmentation_date', label: 'Date', field: 'augmentation_date', align: 'left', sortable: true },
    {
      name: 'total_amount',
      label: 'Amount',
      field: 'total_amount',
      align: 'left',
      sortable: true,
      format: (val) => `₱${val ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`,
    },

    {
      name: 'remarks',
      label: 'Remarks',
      field: 'remarks',
      align: 'left',
      sortable: true,
    },
    { name: 'action', label: 'Action', field: '', align: 'center' },
  ])

  const expenseAugColumns = computed(() => [
    { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
    {
      name: 'account',
      label: 'Account Name',
      field: 'account',
      align: 'left',
      sortable: true,
    },
    { 
      name: 'amount', 
      label: 'Amount', 
      field: 'amount', 
      align: 'left', 
      sortable: true,
      format: (val) => `₱${val ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`,
    },
    { name: 'particulars', label: 'Particulars', field: 'particulars', align: 'left', sortable: true },
    { name: 'action', label: 'Action', field: '', align: 'center' },
  ])

  const AugexpenseAccountColumns = computed(() => [
    { name: 'account', label: 'Account', field: 'account', align: 'left', sortable: true },
    {
      name: 'balance',
      label: 'Balance',
      field: (row) => `₱${row.balance.toLocaleString()}`,
      align: 'left',
      sortable: true,
    },
    { name: 'action', label: 'Action', field: '', align: 'center' },
  ])

  const filteredAugmentations = computed(() => {
    return state.augmentation.value.filter((augmentation) => {
      const matchesSearch =
        augmentation.remarks.toLowerCase().includes(state.searchQuery.value.toLowerCase()) ||
        augmentation.totalAmount.toLowerCase().includes(state.searchQuery.value.toLowerCase())
      const matchesDate = true // Add date filtering logic here
      return matchesSearch && matchesDate
    })
  })

  return {
    augmentationColumns,
    expenseAugColumns,
    AugexpenseAccountColumns,
    filteredAugmentations,
  }
}
