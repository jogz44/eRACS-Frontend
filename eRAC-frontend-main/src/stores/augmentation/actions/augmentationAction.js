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
      
      // Fetch appropriations instead of expense hierarchy
      const appropriationResponse = await api.get('/api/barangay/appropriations', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        params: { status: 'committed' }
      })
      
      const appropriations = appropriationResponse.data.data || []
      console.log('Raw appropriations from API:', appropriations)
      
      const flattened = appropriations.map(appropriation => ({
        id: appropriation.id,
        account: appropriation.account_name || 'Unknown Account',
        balance: appropriation.amount || 0,
        appropriation_id: appropriation.id, // This is now the representative ID
        // Store additional info for debugging
        expense_class_id: appropriation.expense_class_id,
        expense_type_id: appropriation.expense_type_id,
        expense_item_id: appropriation.expense_item_id,
        appropriation_ids: appropriation.appropriation_ids || [appropriation.id] // All IDs in the group
      }))
      
      console.log('Flattened appropriations:', flattened)
      
      // If we're selecting TO expense, filter out the FROM expense
      if (state.isSelectingToExpense.value && state.forms.value.augExpense?.value) {
        const fromExpense = state.forms.value.augExpense.value
        const filtered = flattened.filter(expense => {
          // Filter out the appropriation that matches the FROM appropriation
          return expense.appropriation_id !== fromExpense.from_appropriation_id
        })
        state.AugexpenseAccounts.value = filtered
      } else {
        state.AugexpenseAccounts.value = flattened
      }
    } catch (error) {
      console.error('Failed to fetch expense accounts:', error)
      state.AugexpenseAccounts.value = []
    } finally {
      state.expenseAccountsLoading.value = false
    }
  }

  const saveAugmentation = async () => {
    state.loading.value.saveAugmentation = true
    try {
      const token = authStore.token
      
      // Validate required fields
      if (!state.forms.value.augmentation.augmentation_date) {
        throw new Error('Augmentation date is required')
      }
      if (!state.forms.value.augmentation.remarks) {
        throw new Error('Remarks are required')
      }
      if (!state.Augexpenses.value || state.Augexpenses.value.length === 0) {
        throw new Error('At least one expense is required')
      }
      
      // Convert date format from DD/MM/YYYY to YYYY-MM-DD for backend
      let backendDate = state.forms.value.augmentation.augmentation_date
      if (backendDate && backendDate.includes('/')) {
        const dateParts = backendDate.split('/')
        if (dateParts.length === 3) {
          backendDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
        }
      }
      
      // Create payload with appropriation IDs
      const payload = {
        augmentation_date: backendDate,
        remarks: state.forms.value.augmentation.remarks,
        details: state.Augexpenses.value.map(expense => ({
          from_appropriation_id: expense.from_appropriation_id,
          to_appropriation_id: expense.to_appropriation_id,
          amount: expense.amount,
          particulars: expense.particulars
        }))
      }
      
      console.log('Augexpenses array:', state.Augexpenses.value)
      console.log('Sending payload:', payload)

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
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to save augmentation'
      }
    } finally {
      state.loading.value.saveAugmentation = false
    }
  }

  const updateAugmentation = async (id) => {
    try {
      const token = authStore.token
      
      // Validate required fields
      if (!state.forms.value.augmentation.augmentation_date) {
        throw new Error('Augmentation date is required')
      }
      if (!state.forms.value.augmentation.remarks) {
        throw new Error('Remarks are required')
      }
      if (!state.Augexpenses.value || state.Augexpenses.value.length === 0) {
        throw new Error('At least one expense is required')
      }
      
      // Convert date format from DD/MM/YYYY to YYYY-MM-DD for backend
      let backendDate = state.forms.value.augmentation.augmentation_date
      if (backendDate && backendDate.includes('/')) {
        const dateParts = backendDate.split('/')
        if (dateParts.length === 3) {
          backendDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
        }
      }
      
      // Create backward-compatible payload that matches the original structure
      const payload = {
        augmentation_date: backendDate,
        remarks: state.forms.value.augmentation.remarks,
        details: state.Augexpenses.value.map(expense => ({
          from_appropriation_id: expense.from_appropriation_id,
          to_appropriation_id: expense.to_appropriation_id,
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
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
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
        
        // Map the backend details to the new appropriation structure
        const mappedDetails = (augmentation.details || []).map(detail => {
          // Build FROM expense account name
          const fromExpense = detail.from_account || ''
          
          // Build TO expense account name
          const toExpense = detail.to_account || ''
          
          return {
            id: detail.id,
            from_expense: fromExpense,
            to_expense: toExpense,
            from_appropriation_id: detail.from_appropriation_id,
            to_appropriation_id: detail.to_appropriation_id,
            amount: detail.amount,
            particulars: detail.particulars
          }
        })
        
        state.Augexpenses.value = mappedDetails
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
        from_appropriation_id: null,
        to_appropriation_id: null,
        from_expense: '',
        to_expense: '',
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
