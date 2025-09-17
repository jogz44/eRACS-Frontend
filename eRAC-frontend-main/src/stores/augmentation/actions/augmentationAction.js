import { api } from 'src/boot/axios'
import { useAuthStore } from 'stores/auth'

export function useAugmentationActions(state) {
  const authStore = useAuthStore()


  const fetchAugmentations = async () => {
    state.loadingAugmentations.value = true
    try {
      // Use different endpoints and tokens for admin vs regular users
      const endpoint = authStore.admin ? "/api/admin/augmentations" : "/api/barangay/budget-augmentations"
      const token = authStore.admin ? authStore.adminToken : authStore.token

      const params = {}

      if (state.searchQuery.value) params.search = state.searchQuery.value
      if (state.dateFrom.value) params.date_from = state.dateFrom.value
      if (state.dateTo.value) params.date_to = state.dateTo.value

      // Add barangay_id parameter for admin users if selected
      if (authStore.admin) {
        const selectedBarangayId = authStore.getSelectedBarangay()
        if (selectedBarangayId) {
          params.barangay_id = selectedBarangayId
        }
      }

      const response = await api.get(endpoint, {
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
    } finally {
      state.loadingAugmentations.value = false
    }
  }

  // --- UPDATED: Fetch and flatten expense accounts like disbursement ---
  const fetchExpenseAccounts = async () => {
    try {
      state.expenseAccountsLoading.value = true
      // Use different tokens for admin vs regular users
      const token = authStore.admin ? authStore.adminToken : authStore.token

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
      const params = {
        fiscal_year_id: currentFiscalYear.id,
        ...(state.selectedBudgetSource.value !== 'all' ? { budget_type: state.selectedBudgetSource.value } : {})
      }
      const response = await api.get('/api/barangay/expense-hierarchy', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        params
      })

      // Store the hierarchy for possible future use
      state.expenseData = response.data.data || []
      state.expenseHierarchy = response.data.data || []

      // Fetch appropriations instead of expense hierarchy
      const appropriationResponse = await api.get('/api/barangay/appropriations', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        params: {
          status: 'committed',
          fiscal_year_id: currentFiscalYear.id,
          ...(state.selectedBudgetSource.value !== 'all' ? { budget_type: state.selectedBudgetSource.value } : {})
        }
      })

      const appropriations = appropriationResponse.data.data || []

      // Check if no appropriations found
      if (appropriations.length === 0) {

        // Use the expense hierarchy data instead of appropriations
        // This shows ALL expense accounts from the library, even unallocated ones

        // Transform expense hierarchy into expense accounts format
        const expenseAccounts = []
        if (state.expenseHierarchy && state.expenseHierarchy.length > 0) {
          state.expenseHierarchy.forEach(expenseClass => {
            if (expenseClass.children && expenseClass.children.length > 0) {
              expenseClass.children.forEach(expenseType => {
                if (expenseType.children && expenseType.children.length > 0) {
                  expenseType.children.forEach(expenseItem => {
                    expenseAccounts.push({
                      id: expenseItem.id,
                      account: `${expenseClass.name} - ${expenseType.name} - ${expenseItem.name}`,
                      description: `${expenseClass.name} > ${expenseType.name} > ${expenseItem.name}`,
                      balance: 0, // Unallocated accounts have 0 balance
                      expense_class: expenseClass.name,
                      expense_class_id: expenseClass.id,
                      expense_type_id: expenseType.id,
                      expense_item_id: expenseItem.id,
                      budget_source: 'Unallocated',
                      is_allocated: false
                    })
                  })
                } else {
                  // Type level account (no items)
                  expenseAccounts.push({
                    id: expenseType.id,
                    account: `${expenseClass.name} - ${expenseType.name}`,
                    description: `${expenseClass.name} > ${expenseType.name}`,
                    balance: 0,
                    expense_class: expenseClass.name,
                    expense_class_id: expenseClass.id,
                    expense_type_id: expenseType.id,
                    expense_item_id: null,
                    budget_source: 'Unallocated',
                    is_allocated: false
                  })
                }
              })
            } else {
              // Class level account (no types)
              expenseAccounts.push({
                id: expenseClass.id,
                account: expenseClass.name,
                description: expenseClass.name,
                balance: 0,
                expense_class: expenseClass.name,
                expense_class_id: expenseClass.id,
                expense_type_id: null,
                expense_item_id: null,
                budget_source: 'Unallocated',
                is_allocated: false
              })
            }
          })
        }
        state.AugexpenseAccounts.value = expenseAccounts
        return
      }

      // Instead of replacing the expense hierarchy, merge appropriations with it
      // This preserves ALL expense accounts (allocated and unallocated)

      // Create a map of appropriations by expense hierarchy IDs for quick lookup
      const appropriationMap = {}
      appropriations.forEach(appropriation => {
        const key = `${appropriation.expense_class_id || 'class'}-${appropriation.expense_type_id || 'type'}-${appropriation.expense_item_id || 'item'}-${appropriation.expense_sub_item_id || 'subitem'}`
        appropriationMap[key] = appropriation
      })

      // Transform the complete expense hierarchy and add allocation information
      const expenseAccounts = []
      if (state.expenseHierarchy && state.expenseHierarchy.length > 0) {
        state.expenseHierarchy.forEach(expenseClass => {
          if (expenseClass.children && expenseClass.children.length > 0) {
            expenseClass.children.forEach(expenseType => {
              if (expenseType.children && expenseType.children.length > 0) {
                expenseType.children.forEach(expenseItem => {
                  const key = `${expenseClass.id}-${expenseType.id}-${expenseItem.id}-subitem`
                  const appropriation = appropriationMap[key]

                  expenseAccounts.push({
                    id: expenseItem.id,
                    account: `${expenseClass.name} - ${expenseType.name} - ${expenseItem.name}`,
                    description: `${expenseClass.name} > ${expenseType.name} > ${expenseItem.name}`,
                    balance: appropriation ? appropriation.amount : 0,
                    expense_class: expenseClass.name,
                    expense_class_id: expenseClass.id,
                    expense_type_id: expenseType.id,
                    expense_item_id: expenseItem.id,
                    budget_source: appropriation ? (appropriation.budget_description?.toLowerCase().includes('supplemental') ? 'Supplemental Budget' : 'Annual Budget') : 'Unallocated',
                    is_allocated: !!appropriation
                  })
                })
              } else {
                // Type level account (no items)
                const key = `${expenseClass.id}-${expenseType.id}-type-subitem`
                const appropriation = appropriationMap[key]

                expenseAccounts.push({
                  id: expenseType.id,
                  account: `${expenseClass.name} - ${expenseType.name}`,
                  description: `${expenseClass.name} > ${expenseType.name}`,
                  balance: appropriation ? appropriation.amount : 0,
                  expense_class: expenseClass.name,
                  expense_class_id: expenseClass.id,
                  expense_type_id: expenseType.id,
                  expense_item_id: null,
                  budget_source: appropriation ? (appropriation.budget_description?.toLowerCase().includes('supplemental') ? 'Supplemental Budget' : 'Annual Budget') : 'Unallocated',
                  is_allocated: !!appropriation
                })
              }
            })
          } else {
            // Class level account (no types)
            const key = `${expenseClass.id}-class-subitem-subitem`
            const appropriation = appropriationMap[key]

            expenseAccounts.push({
              id: expenseClass.id,
              account: expenseClass.name,
              description: expenseClass.name,
              balance: appropriation ? appropriation.amount : 0,
              expense_class: expenseClass.name,
              expense_class_id: expenseClass.id,
              expense_type_id: null,
              expense_item_id: null,
              budget_source: appropriation ? (appropriation.budget_description?.toLowerCase().includes('supplemental') ? 'Supplemental Budget' : 'Annual Budget') : 'Unallocated',
              is_allocated: !!appropriation
            })
          }
        })
      }
      state.AugexpenseAccounts.value = expenseAccounts
      return


    } catch (error) {
      console.error('Failed to fetch expense accounts:', error)
      console.error('Error details:', error.response?.data || error.message)
      state.AugexpenseAccounts.value = []
    } finally {
      state.expenseAccountsLoading.value = false
    }
  }

  const saveAugmentation = async () => {
    state.loading.value.saveAugmentation = true
    try {
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



      // Add barangay_id for admin users if selected
      if (authStore.admin) {
        const selectedBarangay = authStore.getSelectedBarangay()
        if (selectedBarangay) {
          payload.barangay_id = selectedBarangay
        }
      }

      // Admin users cannot create augmentations - only view
      if (authStore.admin) {
        throw new Error('Admin users cannot create augmentations')
      }

      const endpoint = "/api/barangay/budget-augmentations"
      const token = authStore.token

      let response
      if (state.currentItem.value?.id) {
        // Update existing augmentation
        response = await api.put(`/api/barangay/budget-augmentations/${state.currentItem.value.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          }
        })
        // Admin activity log

      } else {
        // Create new augmentation
        response = await api.post(endpoint, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          }
        })
        // Admin activity log

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
      // Use different tokens for admin vs regular users
      const token = authStore.admin ? authStore.adminToken : authStore.token

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
      // Admin users cannot delete augmentations - only view
      if (authStore.admin) {
        throw new Error('Admin users cannot delete augmentations')
      }

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

      // Use different endpoints and tokens for admin vs regular users
      const endpoint = authStore.admin ? `/api/admin/augmentations/${id}` : `/api/barangay/budget-augmentations/${id}`
      const token = authStore.admin ? authStore.adminToken : authStore.token

      const response = await api.get(endpoint, {
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

  const viewAugmentationOnly = async (row) => {
    try {
      const augmentation = await fetchAugmentationById(row.id)
      if (augmentation) {
        // Convert date format from YYYY-MM-DD to DD/MM/YYYY for frontend
        const dateParts = augmentation.augmentation_date.split('-')
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : augmentation.augmentation_date

        // Set form data for display only (read-only)
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

        // Set view-only mode flag
        state.isViewOnly.value = true
      }
    } catch (error) {
      console.error('Failed to view augmentation:', error)
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

      // Reset view-only mode
      state.isViewOnly.value = false

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



  // Fetch available budgets for augmentation
  const fetchAvailableBudgets = async () => {
    try {
      state.loadingBudgets.value = true

      // Use different endpoints and tokens for admin vs regular users
      const endpoint = authStore.admin ? "/api/admin/budgets" : "/api/barangay/budgets"
      const token = authStore.admin ? authStore.adminToken : authStore.token

      const params = { year: new Date().getFullYear() }

      // Add barangay filter for admin users
      if (authStore.admin) {
        const selectedBarangayId = authStore.getSelectedBarangay()
        if (selectedBarangayId) {
          params.barangay_id = selectedBarangayId
        }
      }

      const response = await api.get(endpoint, {
        params: params,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      state.availableBudgets.value = response.data.data || []
    } catch (error) {
      console.error('Failed to fetch available budgets:', error)
      state.availableBudgets.value = []
    } finally {
      state.loadingBudgets.value = false
    }
  }

  const setBudgetSourceFilter = (budgetSource) => {
    state.selectedBudgetSource.value = budgetSource
  }

  return {
    fetchAugmentations,
    fetchExpenseAccounts,
    saveAugmentation,
    updateAugmentation,
    deleteAugmentation,
    fetchAugmentationById,
    editAugmentation,
    viewAugmentationOnly,
    resetForm,
    generateNewAugmentationDefaults,
    refreshAugmentationDialog,
    fetchAvailableBudgets,
    setBudgetSourceFilter,
  }
}
