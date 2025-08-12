import { api } from 'src/boot/axios'
import { useAuthStore } from 'stores/auth'

export function useAugmentationActions(state) {
  const authStore = useAuthStore()

  const fetchAugmentations = async () => {
    try {
      const token = authStore.token
      const params = {}
      
      if (state.searchQuery.value) params.search = state.searchQuery.value
      if (state.dateFrom.value) params.date_from = state.dateFrom.value
      if (state.dateTo.value) params.date_to = state.dateTo.value

      const response = await api.get('/api/barangay/budget-augmentations', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        params
      })

      state.augmentation.value = response.data.data || []
    } catch (error) {
      console.error('Failed to fetch augmentations:', error)
      state.augmentation.value = []
    }
  }

  // --- UPDATED: Fetch and flatten expense accounts like disbursement ---
  const fetchExpenseAccounts = async () => {
    try {
      state.expenseAccountsLoading.value = true
      const token = authStore.token
      // Get the current fiscal year
      const fiscalYearResponse = await api.get('/api/barangay/fiscal-years', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        }
      })
      if (!fiscalYearResponse.data.data || fiscalYearResponse.data.data.length === 0) {
        state.AugexpenseAccounts.value = []
        return
      }
      const currentFiscalYear = fiscalYearResponse.data.data[0]
      const params = { fiscal_year_id: currentFiscalYear.id }
      const response = await api.get('/api/barangay/expense-hierarchy', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        params
      })
      // Store the hierarchy for possible future use
      state.expenseData = response.data.data || []
      // Flatten for dialog selection (same as disbursement)
      const flattened = []
      if (state.expenseData && state.expenseData.length > 0) {
        state.expenseData.forEach(expenseClass => {
          if (!expenseClass.children) return
          expenseClass.children.forEach(expenseType => {
            // Check if this expense type has any expense items with balance > 0
            const hasExpenseItemsWithBalance = expenseType.children && 
              expenseType.children.some(item => item.amount && item.amount > 0)
            if (hasExpenseItemsWithBalance) {
              // If expense type has items with balance, only show the items (not the type)
              expenseType.children.forEach(expenseItem => {
                if (expenseItem.amount && expenseItem.amount > 0) {
                  flattened.push({
                    id: expenseItem.id,
                    account: expenseClass.name,
                    expenseType: expenseType.name,
                    expenseItem: expenseItem.name,
                    balance: expenseItem.amount || 0,
                    expense_class_id: expenseClass.id,
                    expense_type_id: expenseType.id,
                    expense_item_id: expenseItem.id,
                  })
                }
              })
            } else {
              // If expense type has no items with balance, show the type itself (if it has balance)
              if (expenseType.amount && expenseType.amount > 0) {
                flattened.push({
                  id: expenseType.id,
                  account: expenseClass.name,
                  expenseType: expenseType.name,
                  expenseItem: null,
                  balance: expenseType.amount || 0,
                  expense_class_id: expenseClass.id,
                  expense_type_id: expenseType.id,
                  expense_item_id: null,
                })
              }
            }
          })
        })
      }
      state.AugexpenseAccounts.value = flattened
    } catch (error) {
      console.error('Failed to fetch expense accounts:', error)
      state.AugexpenseAccounts.value = []
    } finally {
      state.expenseAccountsLoading.value = false
    }
  }

  const saveAugmentation = async () => {
    try {
      const token = authStore.token
      const payload = {
        augmentation_date: state.forms.value.augmentation.augmentation_date,
        remarks: state.forms.value.augmentation.remarks,
        details: state.Augexpenses.value.map(expense => ({
          expense_class_id: expense.expense_class_id,
          expense_type_id: expense.expense_type_id,
          expense_item_id: expense.expense_item_id,
          amount: expense.amount,
          particulars: expense.particulars
        }))
      }

      let response
      if (state.currentItem.value?.id) {
        // Update existing augmentation
        response = await api.put(`/api/barangay/budget-augmentations/${state.currentItem.value.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          }
        })
      } else {
        // Create new augmentation
        response = await api.post('/api/barangay/budget-augmentations', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          }
        })
      }

      // Refresh the list
      await fetchAugmentations()
      
      // Reset form
      resetForm('augmentation')
      state.Augexpenses.value = []
      state.currentItem.value = null
      
      return { success: true, data: response.data.data }
    } catch (error) {
      console.error('Failed to save augmentation:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to save augmentation' 
      }
    }
  }

  const updateAugmentation = async (id) => {
    try {
      const token = authStore.token
      const payload = {
        augmentation_date: state.forms.value.augmentation.augmentation_date,
        remarks: state.forms.value.augmentation.remarks,
        details: state.Augexpenses.value.map(expense => ({
          expense_class_id: expense.expense_class_id,
          expense_type_id: expense.expense_type_id,
          expense_item_id: expense.expense_item_id,
          amount: expense.amount,
          particulars: expense.particulars
        }))
      }

      const response = await api.put(`/api/barangay/budget-augmentations/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        }
      })

      // Refresh the list
      await fetchAugmentations()
      
      // Reset form
      resetForm('augmentation')
      state.Augexpenses.value = []
      
      return { success: true, data: response.data.data }
    } catch (error) {
      console.error('Failed to update augmentation:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update augmentation' 
      }
    }
  }

  const deleteAugmentation = async (id) => {
    try {
      const token = authStore.token
      await api.delete(`/api/barangay/budget-augmentations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        }
      })

      // Refresh the list
      await fetchAugmentations()
      
      return { success: true }
    } catch (error) {
      console.error('Failed to delete augmentation:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to delete augmentation' 
      }
    }
  }

  const fetchAugmentationById = async (id) => {
    try {
      const token = authStore.token
      const response = await api.get(`/api/barangay/budget-augmentations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        }
      })

      return response.data.data
    } catch (error) {
      console.error('Failed to fetch augmentation:', error)
      return null
    }
  }

  const editAugmentation = async (row) => {
    try {
      const augmentation = await fetchAugmentationById(row.id)
      if (augmentation) {
        // Convert date format from YYYY-MM-DD to DD/MM/YYYY for frontend
        const dateParts = augmentation.augmentation_date.split('-')
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : augmentation.augmentation_date
        
        state.forms.value.augmentation = {
          augmentation_date: formattedDate,
          remarks: augmentation.remarks || '',
          refNo: augmentation.ref_number || '',
        }
        
        state.Augexpenses.value = augmentation.details || []
        state.currentItem.value = augmentation
        state.dialogs.value.augmentation = true
      }
    } catch (error) {
      console.error('Failed to edit augmentation:', error)
  }
  }

  const resetForm = (formName) => {
    if (formName === 'augmentation') {
      // Reset the augmentation form
      state.forms.value.augmentation = {
        augmentation_date: '',
        remarks: '',
        refNo: '',
      }
      
      // Clear all related state
      state.Augexpenses.value = []
      state.currentItem.value = null
      
      // Generate fresh defaults including new ref number
      generateNewAugmentationDefaults()
    } else if (formName === 'augExpense') {
      state.forms.value.augExpense = {
        expense_class_id: null,
        expense_type_id: null,
        expense_item_id: null,
        account: '',
        balance: 0,
        particulars: '',
        amount: 0,
      }
    }
  }

  const generateNewAugmentationDefaults = () => {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()

    // Generate new ref number
    const lastRef = state.augmentation.value.reduce((max, a) => {
      const num = parseInt(a.ref_number?.split('-')?.pop()) || 0
      return Math.max(max, num)
    }, 0)
    const newRefNumber = `AUG-${String(yyyy).slice(-2)}-${mm}-${String(lastRef + 1).padStart(3, '0')}`

    // Update form with new defaults
    state.forms.value.augmentation.augmentation_date = `${dd}/${mm}/${yyyy}`
    state.forms.value.augmentation.refNo = newRefNumber
  }

  const refreshAugmentationDialog = () => {
    // Completely reset all augmentation dialog state
    resetForm('augmentation')
  }

  return {
    fetchAugmentations,
    fetchExpenseAccounts,
    saveAugmentation,
    updateAugmentation,
    deleteAugmentation,
    fetchAugmentationById,
    editAugmentation,
    resetForm,
    generateNewAugmentationDefaults,
    refreshAugmentationDialog,
  }
}
