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
      name: 'expense_class_summary',
      label: 'Expense Classes',
      field: 'expense_class_summary',
      align: 'center',
      sortable: false,
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
      name: 'expense_class',
      label: 'Expense Class',
      field: 'expense_class',
      align: 'center',
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
      name: 'expense_class',
      label: 'Expense Class',
      field: 'expense_class',
      align: 'left',
      sortable: true,
      style: 'width: 18%; min-width: 120px;'
    },
    {
      name: 'expense_type',
      label: 'Expense Type',
      field: 'expense_type',
      align: 'left',
      sortable: true,
      style: 'width: 18%; min-width: 120px;'
    },
    {
      name: 'expense_item',
      label: 'Expense Item',
      field: 'expense_item',
      align: 'left',
      sortable: true,
      style: 'width: 18%; min-width: 120px;'
    },
    {
      name: 'expense_sub_item',
      label: 'Expense Sub-item',
      field: 'expense_sub_item_name',
      align: 'left',
      sortable: true,
      style: 'width: 18%; min-width: 120px;'
    },
    {
      name: 'balance',
      label: 'Balance',
      field: 'balance',
      format: (val) => `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      align: 'right',
      sortable: true,
      style: 'width: 15%; min-width: 100px;'
    },
    {
      name: 'action',
      label: 'Action',
      field: '',
      align: 'center',
      style: 'width: 13%; min-width: 80px;'
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

  const filteredExpenseAccounts = computed(() => {
    console.log('=== FILTERED EXPENSE ACCOUNTS GETTER ===')
    console.log('AugexpenseAccounts.value:', state.AugexpenseAccounts.value)
    console.log('AugexpenseAccounts.value length:', state.AugexpenseAccounts.value?.length)
    
    if (!state.AugexpenseAccounts.value || state.AugexpenseAccounts.value.length === 0) {
      console.log('No expense accounts available - returning empty array')
      return []
    }

    let base = state.AugexpenseAccounts.value
    console.log('Total expense accounts:', base.length)
    console.log('Selected expense class:', state.selectedExpenseClass.value)

    // Apply expense class filtering when selecting TO expense
    if (state.selectedExpenseClass.value) {
      console.log('Filtering by expense class:', state.selectedExpenseClass.value)
      const beforeFilter = base.length
      base = base.filter(item => {
        const matches = item.expense_class === state.selectedExpenseClass.value
        if (!matches) {
          console.log('Filtered out:', item.account, 'expense_class:', item.expense_class)
        }
        return matches
      })
      console.log('After expense class filtering:', base.length, 'out of', beforeFilter)
    }

    // Apply search filtering
    if (!state.expenseSearch.value.trim()) {
      console.log('No search query, returning filtered results:', base.length)
      return base
    }

    const query = state.expenseSearch.value.toLowerCase()
    const searchFiltered = base.filter(
      (item) =>
        item.account.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
    )
    console.log('After search filtering:', searchFiltered.length)
    console.log('Final filtered results:', searchFiltered)
    console.log('=== END FILTERED EXPENSE ACCOUNTS GETTER ===')
    return searchFiltered
  })

  const expenseHierarchy = computed(() => {
    console.log('=== EXPENSE HIERARCHY GETTER ===')
    console.log('expenseHierarchy.value:', state.expenseHierarchy.value)
    console.log('expenseHierarchy.value length:', state.expenseHierarchy.value?.length)
    
    if (!state.expenseHierarchy.value || state.expenseHierarchy.value.length === 0) {
      console.log('No expense hierarchy available - returning empty array')
      return []
    }

    console.log('Returning expense hierarchy:', state.expenseHierarchy.value)
    console.log('=== END EXPENSE HIERARCHY GETTER ===')
    return state.expenseHierarchy.value
  })

  return {
    augmentationColumns,
    expenseAugColumns,
    AugexpenseAccountColumns,
    filteredAugmentations,
    totalExpensesAmount,
    filteredExpenseAccounts,
    expenseHierarchy,
  }
}
