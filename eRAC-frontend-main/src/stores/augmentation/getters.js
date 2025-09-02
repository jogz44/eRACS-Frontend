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
      name: 'description',
      label: 'Description',
      field: 'remarks',
      align: 'left',
      sortable: true,
    },
    {
      name: 'actions',
      label: 'Actions',
      field: '',
      align: 'center',
      sortable: false
    },

  ])

  const expenseAugColumns = computed(() => [
    { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
    {
      name: 'from_expense',
      label: 'From Expense',
      field: 'from_expense',
      align: 'left',
      sortable: true,
    },
    {
      name: 'to_expense',
      label: 'To Expense',
      field: 'to_expense',
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
    {
      name: 'account',
      label: 'Account',
      field: 'account',
      align: 'left',
      sortable: true,
      style: 'width: 50%; min-width: 300px;'
    },
    {
      name: 'balance',
      label: 'Balance',
      field: 'balance',
      format: (val) => `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      align: 'right',
      sortable: true,
      style: 'width: 25%; min-width: 120px;'
    },
    {
      name: 'action',
      label: 'Action',
      field: '',
      align: 'center',
      style: 'width: 25%; min-width: 100px;'
    },
  ])

  const filteredAugmentations = computed(() => {
    const parseFlexibleDate = (value) => {
      if (!value) return null
      if (value instanceof Date) return value
      if (typeof value === 'string') {
        if (value.includes('/')) {
          const [dd, mm, yyyy] = value.split('/')
          const d = new Date(`${yyyy}-${mm}-${dd}`)
          return isNaN(d.getTime()) ? null : d
        }
        const d = new Date(value)
        return isNaN(d.getTime()) ? null : d
      }
      return null
    }

    const from = parseFlexibleDate(state.dateFrom.value)
    const to = parseFlexibleDate(state.dateTo.value)
    const fromStart = from ? new Date(from.setHours(0, 0, 0, 0)) : null
    const toEnd = to ? new Date(to.setHours(23, 59, 59, 999)) : null

    const query = (state.searchQuery.value || '').toLowerCase().trim()

    return (state.augmentation.value || []).filter((a) => {
      // Search across remarks, ref number
      const haystacks = [a.remarks, a.ref_number]
      const matchesSearch = !query || haystacks.some((h) => String(h || '').toLowerCase().includes(query))

      // Inclusive date range using augmentation_date
      const dt = parseFlexibleDate(a.augmentation_date)
      const matchesDate = !fromStart && !toEnd
        ? true
        : (dt && (!fromStart || dt >= fromStart) && (!toEnd || dt <= toEnd))

      return matchesSearch && matchesDate
    })
  })

  const totalExpensesAmount = computed(() => {
    console.log('totalExpensesAmount getter called')
    console.log('Augexpenses value:', state.Augexpenses.value)
    if (!state.Augexpenses.value || state.Augexpenses.value.length === 0) {
      console.log('No expenses, returning 0')
      return 0
    }
    const total = state.Augexpenses.value.reduce((total, expense) => {
      const amount =
        typeof expense.amount === 'string'
          ? parseFloat(expense.amount.replace(/[^0-9.]/g, ''))
          : expense.amount
      return total + (Number(amount) || 0)
    }, 0)
    console.log('Calculated total:', total)
    return total
  })

  return {
    augmentationColumns,
    expenseAugColumns,
    AugexpenseAccountColumns,
    filteredAugmentations,
    totalExpensesAmount,
  }
}
