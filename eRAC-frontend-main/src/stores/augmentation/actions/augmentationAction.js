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

  const fetchExpenseAccounts = async () => {
    try {
      const token = authStore.token
      
      // First, get the current fiscal year
      const fiscalYearResponse = await api.get('/api/barangay/fiscal-years', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        }
      })
      
      if (!fiscalYearResponse.data.data || fiscalYearResponse.data.data.length === 0) {
        console.error('No fiscal years found')
        state.AugexpenseAccounts.value = []
        return
      }
      
      // Get the most recent fiscal year
      const currentFiscalYear = fiscalYearResponse.data.data[0] // Assuming it's sorted by year desc
      
      const params = {
        fiscal_year_id: currentFiscalYear.id
      }
      
      const response = await api.get('/api/barangay/expense-hierarchy', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        params
      })

      // Transform the expense hierarchy into a flat list for selection
      const expenseAccounts = []
      if (response.data.data) {
        response.data.data.forEach(expenseClass => {
          if (expenseClass.children) {
            expenseClass.children.forEach(expenseType => {
              if (expenseType.children) {
                expenseType.children.forEach(expenseItem => {
                  const balance = expenseItem.amount || 0
                  // Only include accounts with balance greater than 0
                  if (balance > 0) {
                    expenseAccounts.push({
                      id: expenseItem.id,
                      expense_class_id: expenseClass.id,
                      expense_type_id: expenseType.id,
                      expense_item_id: expenseItem.id,
                      expense_class: expenseClass.name,
                      expense_type: expenseType.name,
                      expense_item: expenseItem.name,
                      account: `${expenseClass.name} > ${expenseType.name} > ${expenseItem.name}`,
                      balance: balance
                    })
                  }
                })
              }
            })
          }
        })
      }
      
      state.AugexpenseAccounts.value = expenseAccounts
    } catch (error) {
      console.error('Failed to fetch expense accounts:', error)
      state.AugexpenseAccounts.value = []
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
      state.forms.value.augmentation = {
        augmentation_date: '',
        remarks: '',
        refNo: '',
      }
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

  return {
    fetchAugmentations,
    fetchExpenseAccounts,
    saveAugmentation,
    updateAugmentation,
    deleteAugmentation,
    fetchAugmentationById,
    editAugmentation,
    resetForm,
  }
}
