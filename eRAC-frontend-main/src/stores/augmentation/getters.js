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
      name: 'transfer_summary',
      label: 'Transfer Types',
      field: 'transfer_summary',
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
      name: 'from_budget_source',
      label: 'From Budget',
      field: 'from_budget_source',
      align: 'center',
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
      name: 'to_budget_source',
      label: 'To Budget',
      field: 'to_budget_source',
      align: 'center',
      sortable: true,
    },
    {
      name: 'transfer_type',
      label: 'Transfer Type',
      field: 'transfer_type',
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
      name: 'account',
      label: 'Account',
      field: 'account',
      align: 'left',
      sortable: true,
      style: 'width: 40%; min-width: 250px;'
    },
    {
      name: 'budget_source',
      label: 'Budget Source',
      field: 'budget_source',
      align: 'center',
      sortable: true,
      style: 'width: 20%; min-width: 120px;'
    },
    {
      name: 'balance',
      label: 'Balance',
      field: 'balance',
      format: (val) => `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      align: 'right',
      sortable: true,
      style: 'width: 20%; min-width: 120px;'
    },
    {
      name: 'action',
      label: 'Action',
      field: '',
      align: 'center',
      style: 'width: 20%; min-width: 100px;'
    },
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
    if (!state.AugexpenseAccounts.value || state.AugexpenseAccounts.value.length === 0) {
      return []
    }

    let base = state.AugexpenseAccounts.value

    // Apply budget source filtering
    if (state.selectedBudgetSource.value !== 'all') {
      base = base.filter(item => {
        const budgetSource = item.budget_source || item.description || ''
        if (state.selectedBudgetSource.value === 'annual') {
          return budgetSource.toLowerCase().includes('annual')
        } else if (state.selectedBudgetSource.value === 'supplemental') {
          return budgetSource.toLowerCase().includes('supplemental')
        }
        return true
      })
    }

    // Apply search filtering
    if (!state.expenseSearch.value.trim()) {
      return base
    }

    const query = state.expenseSearch.value.toLowerCase()
    return base.filter(
      (item) =>
        item.account.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
    )
  })

  return {
    augmentationColumns,
    expenseAugColumns,
    AugexpenseAccountColumns,
    filteredAugmentations,
    totalExpensesAmount,
    filteredExpenseAccounts,
  }
}
