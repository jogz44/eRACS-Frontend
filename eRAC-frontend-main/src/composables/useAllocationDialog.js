// src/composables/useAllocationDialog.js
import { ref, computed } from 'vue'

export default function useAllocationDialog() {
  const showAllocationDialog = ref(false)
  const selectedRow = ref({})
  const searchQuery = ref('')
  const recordsPerPage = ref(5)

  const accountColumns = [
    { name: 'account', label: 'Accounts', field: 'name', align: 'left' },
    { name: 'amount', label: 'Amount', field: 'amount', align: 'right' },
  ]

  const accounts = ref([
    { name: 'Personal Service', amount: '' },
    { name: '• Honorarium', amount: '5000000.00' },
    { name: '• Cash Gift', amount: '' },
    { name: 'MOOE', amount: '' },
  ])  

  const filteredAccounts = computed(() => {
    return accounts.value.filter((account) =>
      account.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  })

  function openAllocationDialog(row) {
    selectedRow.value = row
    showAllocationDialog.value = true
  }

  function formatCurrency(value) {
    return value
      ? '₱' +
          parseFloat(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
      : '₱0.00'
  }

  function saveAllocation() {
    // Save logic here
    showAllocationDialog.value = false
  }

  return {
    showAllocationDialog,
    selectedRow,
    searchQuery,
    recordsPerPage,
    accountColumns,
    accounts,
    filteredAccounts,
    openAllocationDialog,
    formatCurrency,
    saveAllocation,
  }
}
