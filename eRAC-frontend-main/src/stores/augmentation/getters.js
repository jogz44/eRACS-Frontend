import { computed } from 'vue'

export function useGetters(state) {
  const augmentationColumns = computed(() => [
    { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
    { name: 'refNo', label: 'Ref No', field: 'refNo', align: 'left', sortable: true },
    { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
    {
      name: 'totalAmount',
      label: 'Amount',
      field: 'totalAmount',
      align: 'left',
      sortable: true,
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
      name: 'accountName',
      label: 'Account Name',
      field: 'accountName',
      align: 'left',
      sortable: true,
    },
    { name: 'augAmount', label: 'Amount', field: 'augAmount', align: 'left', sortable: true },
    { name: 'particular', label: 'Particular', field: 'particular', align: 'left', sortable: true },
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
