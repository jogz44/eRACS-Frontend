import { api } from 'src/boot/axios'
import { useAuthStore } from 'stores/auth'

// Stable 6-level hierarchy key (class : type : item : sub-item : sub-type :
// sub-sub-type). Missing levels use a placeholder, mirroring how the backend
// stores nulls for the new sub-type / sub-sub-type columns.
const buildAugHierarchyKey = (row) => {
  if (!row) return ''
  const levelKeys = [
    'expense_class_id',
    'expense_type_id',
    'expense_item_id',
    'expense_sub_item_id',
    'expense_sub_type_id',
    'expense_sub_sub_type_id',
  ]
  const placeholders = ['class', 'type', 'item', 'subitem', 'subtype', 'subsubtype']
  return levelKeys
    .map((key, index) => {
      const value = row[key]
      return value != null && value !== '' ? value : placeholders[index]
    })
    .join(':')
}

// Child source for each depth: item -> sub-items, sub-item -> sub-types,
// sub-type -> sub-sub-types. Accepts the flat "children" nesting (older/API
// style) or the nested subItems / subTypes / subSubTypes keys (newer/API style).
const getAugSubNodes = (node, level) => {
  if (!node) return []
  const children = node.children || node.childItems || []
  if (level === 2) return node.subItems || node.sub_items || children
  if (level === 3) return node.subTypes || node.sub_types || children
  if (level === 4) return node.subSubTypes || node.sub_sub_types || children
  return children
}

// Sum disbursed amounts per appropriation id from tran_expense_details rows.
// Rows without an appropriation_id fall back to the hierarchy-path key.
const buildAugDisbursedMap = (expenseDetails, appropriationMap) => {
  const map = {}
  ;(expenseDetails || []).forEach((row) => {
    let apprId = row.appropriation_id ?? row.accountId
    if (apprId == null || apprId === '') {
      apprId = appropriationMap[buildAugHierarchyKey(row)]?.id
    }
    if (apprId == null) return
    const key = String(apprId)
    map[key] = (map[key] || 0) + (parseFloat(row.amount) || 0)
  })
  return map
}

// Recursively flatten the hierarchy into one account entry per leaf, carrying
// the full 6-level path so sub-items / sub-types / sub-sub-types are surfaced.
const walkAugHierarchy = (node, path, appropriationMap, results, disbursedMap = {}) => {
  const level = path.ids.length
  const id = node?.id ?? null
  const name = node?.name ?? ''
  const ids = [...path.ids, id]
  const names = [...path.names, name]

  const subNodes = getAugSubNodes(node, level)
  const fundedSubNodes = subNodes.filter((c) => Number(c.amount) > 0)

  // Same rule as the disbursement dialog: go down only through funded children
  if (level < 5 && fundedSubNodes.length > 0) {
    fundedSubNodes.forEach((sub) =>
      walkAugHierarchy(sub, { ids, names }, appropriationMap, results, disbursedMap),
    )
    return
  }
  // Node has no funding at all: keep descending so unallocated leaves stay selectable
  if (level < 5 && subNodes.length > 0 && !(Number(node.amount) > 0)) {
    subNodes.forEach((sub) =>
      walkAugHierarchy(sub, { ids, names }, appropriationMap, results, disbursedMap),
    )
    return
  }

  const [
    expense_class_id,
    expense_type_id,
    expense_item_id,
    expense_sub_item_id,
    expense_sub_type_id,
    expense_sub_sub_type_id,
  ] = ids
  const [
    expense_class,
    expense_type,
    expense_item,
    expense_sub_item,
    expense_sub_type,
    expense_sub_sub_type,
  ] = names

  const key = buildAugHierarchyKey({
    expense_class_id,
    expense_type_id,
    expense_item_id,
    expense_sub_item_id,
    expense_sub_type_id,
    expense_sub_sub_type_id,
  })
  const mapped = appropriationMap[key] || null

  const treeAmount = Number(node?.amount) || 0
  const appropriationId = node?.tran_appropriation_id ?? mapped?.id ?? null
  const appropriatedAmount = treeAmount > 0 ? treeAmount : Number(mapped?.amount || 0)
  const disbursedAmount = appropriationId != null ? disbursedMap[String(appropriationId)] || 0 : 0
  const isAllocated = appropriatedAmount > 0

  results.push({
    id,
    appropriation_id: appropriationId,
    account: names.filter(Boolean).join(' - '),
    description: names.filter(Boolean).join(' > '),
    balance: Math.max(0, appropriatedAmount - disbursedAmount),
    appropriated_amount: appropriatedAmount,
    disbursed_amount: disbursedAmount,
    expense_class: expense_class || '',
    expense_class_id,
    expense_type: expense_type || '',
    expense_type_id,
    expense_item: expense_item || '',
    expense_item_id,
    expense_sub_item_name: expense_sub_item || '',
    expense_sub_item_id,
    expense_sub_type_name: expense_sub_type || '',
    expense_sub_type_id,
    expense_sub_sub_type_name: expense_sub_sub_type || '',
    expense_sub_sub_type_id,
    budget_source: isAllocated
      ? String(mapped?.budget_description || node?.budget_source || '')
          .toLowerCase()
          .includes('supplemental')
        ? 'Supplemental Budget'
        : 'Annual Budget'
      : 'Unallocated',
    is_allocated: isAllocated,
  })
}

// Deepest first-branch names under a set of sub-nodes (sub-item -> sub-type ->
// sub-sub-type), used to keep deep levels visible even when an appropriation is
// stored at a higher depth of the tree.
const getDeepestBranchNames = (subNodes, level) => {
  const first = subNodes[0]
  if (!first || !first.name) return []
  const names = [first.name]
  const deeper = getAugSubNodes(first, level + 1)
  if (deeper.length > 0) {
    names.push(...getDeepestBranchNames(deeper, level + 1))
  }
  return names
}

// Create a map of appropriation id -> full account path by walking the ENTIRE
// hierarchy (not just leaves). The backend's from_account / to_account only
// reach the expense item, so edit/view overrides them with the full path
// incl. sub-item, sub-type and sub-sub-type levels.
const buildAugAppropriationNameMap = (hierarchy, appropriationMap) => {
  const map = {}
  const walk = (node, path) => {
    if (!node) return
    const ids = [...path.ids, node.id ?? null]
    const names = [...path.names, node.name ?? '']

    const key = buildAugHierarchyKey({
      expense_class_id: ids[0],
      expense_type_id: ids[1],
      expense_item_id: ids[2],
      expense_sub_item_id: ids[3],
      expense_sub_type_id: ids[4],
      expense_sub_sub_type_id: ids[5],
    })
    const appropriation = appropriationMap[key]
    if (appropriation && appropriation.id != null) {
      let display = names.filter(Boolean)
      const subNodes = getAugSubNodes(node, path.ids.length)
      if (subNodes.length > 0) {
        display = [...display, ...getDeepestBranchNames(subNodes, path.ids.length)]
      }
      map[String(appropriation.id)] = display.join(' > ')
    }

    const subNodes = getAugSubNodes(node, path.ids.length)
    subNodes.forEach((sub) => walk(sub, { ids, names }))
  }
  ;(hierarchy || []).forEach((node) => walk(node, { ids: [], names: [] }))
  return map
}

export function useAugmentationActions(state) {
  const authStore = useAuthStore()

  // Normalize augmentation dates to YYYY-MM-DD.
  // This is the format expected by Laravel and QDate.
  const normalizeAugmentationDate = (value) => {
    if (!value) return ''

    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value
    }

    // Support legacy DD/MM/YYYY or MM/DD/YYYY values.
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [first, second, year] = value.split('/')

      // If the second value is > 12, it must be MM/DD/YYYY.
      if (Number(second) > 12) {
        return `${year}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`
      }

      // Default legacy format is DD/MM/YYYY.
      return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`
    }

    return value
  }

  const fetchAugmentations = async (year = null) => {
    state.loadingAugmentations.value = true
    try {
      const endpoint = authStore.admin
        ? '/api/admin/augmentations'
        : '/api/barangay/budget-augmentations'
      const token = authStore.admin ? authStore.adminToken : authStore.token

      const params = {}

      if (state.searchQuery.value) params.search = state.searchQuery.value
      if (state.dateFrom.value) params.date_from = state.dateFrom.value
      if (state.dateTo.value) params.date_to = state.dateTo.value
      if (year !== null && year !== undefined && year !== '') params.year = year

      // Pass year param — backend uses it to filter by fiscal year
      // if (year !== null && year !== undefined) {
      //   params.year = year
      // }

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
        params,
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
        },
      })

      if (!fiscalYearResponse.data.data || fiscalYearResponse.data.data.length === 0) {
        state.AugexpenseAccounts.value = []
        return
      }

      const fiscalYears = fiscalYearResponse.data.data
      const currentFiscalYear =
        fiscalYears.find((y) => y.year == new Date().getFullYear()) || fiscalYears[0]
      const params = {
        fiscal_year_id: currentFiscalYear.id,
        ...(state.selectedBudgetSource.value !== 'all'
          ? { budget_type: state.selectedBudgetSource.value }
          : {}),
      }
      const response = await api.get('/api/barangay/expense-hierarchy', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        params,
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
          ...(state.selectedBudgetSource.value !== 'all'
            ? { budget_type: state.selectedBudgetSource.value }
            : {}),
        },
      })

      const appropriations = appropriationResponse.data.data || []

      // Create a map of appropriations by expense hierarchy IDs for quick lookup
      const appropriationMap = {}
      appropriations.forEach((appropriation) => {
        const key = buildAugHierarchyKey(appropriation)
        appropriationMap[key] = appropriation
      })
      state.augAppropriationMap.value = appropriationMap

      // Fetch disbursements so balances reflect what has already been spent
      let disbursedMap = {}
      try {
        const expenseDetailsResponse = await api.get('/api/barangay/expense-details', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
        disbursedMap = buildAugDisbursedMap(
          expenseDetailsResponse.data?.data || [],
          appropriationMap,
        )
      } catch (error) {
        // Don't block the dialog; balances fall back to the appropriated amount
        console.warn('Failed to fetch expense details for balance calculation:', error)
      }

      const expenseAccounts = []
      if (state.expenseHierarchy && state.expenseHierarchy.length > 0) {
        state.expenseHierarchy.forEach((expenseClass) => {
          walkAugHierarchy(
            expenseClass,
            { ids: [], names: [] },
            appropriationMap,
            expenseAccounts,
            disbursedMap,
          )
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

      const backendDate = normalizeAugmentationDate(
        state.forms.value.augmentation.augmentation_date,
      )

      // Create payload with appropriation IDs
      const payload = {
        augmentation_date: backendDate,
        remarks: state.forms.value.augmentation.remarks,
        details: state.Augexpenses.value.map((expense) => {
          const detail = {
            from_appropriation_id: expense.from_appropriation_id,
            to_appropriation_id: expense.to_appropriation_id,
            amount: expense.amount,
            particulars: expense.particulars,
          }

          // If TO appropriation is null (unallocated), include expense hierarchy data
          if (!expense.to_appropriation_id && expense.to_expense_data) {
            detail.to_expense_data = expense.to_expense_data
          }

          return detail
        }),
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

      const endpoint = '/api/barangay/budget-augmentations'
      const token = authStore.token

      let response
      if (state.currentItem.value?.id) {
        // Update existing augmentation
        response = await api.put(
          `/api/barangay/budget-augmentations/${state.currentItem.value.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )
        // Admin activity log
      } else {
        // Create new augmentation
        response = await api.post(endpoint, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
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
        error: error.response?.data?.message || 'Failed to save augmentation',
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

      const backendDate = normalizeAugmentationDate(
        state.forms.value.augmentation.augmentation_date,
      )

      // Create backward-compatible payload that matches the original structure
      const payload = {
        augmentation_date: backendDate,
        remarks: state.forms.value.augmentation.remarks,
        details: state.Augexpenses.value.map((expense) => {
          const detail = {
            from_appropriation_id: expense.from_appropriation_id,
            to_appropriation_id: expense.to_appropriation_id,
            amount: expense.amount,
            particulars: expense.particulars,
          }

          if (!expense.to_appropriation_id && expense.to_expense_data) {
            detail.to_expense_data = expense.to_expense_data
          }

          return detail
        }),
      }

      const response = await api.put(`/api/barangay/budget-augmentations/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
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
        error: error.response?.data?.message || 'Failed to update augmentation',
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
        },
      })

      // Refresh the list
      await fetchAugmentations()

      return { success: true }
    } catch (error) {
      console.error('Failed to delete augmentation:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete augmentation',
      }
    }
  }

  const fetchAugmentationById = async (id) => {
    try {
      // Use different endpoints and tokens for admin vs regular users
      const endpoint = authStore.admin
        ? `/api/admin/augmentations/${id}`
        : `/api/barangay/budget-augmentations/${id}`
      const token = authStore.admin ? authStore.adminToken : authStore.token

      const response = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
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
        state.forms.value.augmentation = {
          augmentation_date: normalizeAugmentationDate(augmentation.augmentation_date),
          remarks: augmentation.remarks || '',
          refNo: augmentation.ref_number || '',
        }

        // Rebuild full account paths (sub-item / sub-type / sub-sub-type levels).
        // Load the hierarchy lazily when the page did not fetch it yet (admin page)
        if (
          !state.expenseHierarchy.value ||
          state.expenseHierarchy.value.length === 0 ||
          Object.keys(state.augAppropriationMap.value || {}).length === 0
        ) {
          await fetchExpenseAccounts()
        }

        // Map the backend details to the new appropriation structure
        const augAccountMap = buildAugAppropriationNameMap(
          state.expenseHierarchy.value,
          state.augAppropriationMap.value,
        )
        const mappedDetails = (augmentation.details || []).map((detail) => {
          // Build FROM expense account name
          const fromExpense =
            augAccountMap[String(detail.from_appropriation_id)] || detail.from_account || ''

          // Build TO expense account name
          const toExpense =
            augAccountMap[String(detail.to_appropriation_id)] || detail.to_account || ''

          return {
            id: detail.id,
            from_expense: fromExpense,
            to_expense: toExpense,
            from_appropriation_id: detail.from_appropriation_id,
            to_appropriation_id: detail.to_appropriation_id,
            amount: detail.amount,
            particulars: detail.particulars,
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
        // Set form data for display only (read-only)
        state.forms.value.augmentation = {
          augmentation_date: normalizeAugmentationDate(augmentation.augmentation_date),
          remarks: augmentation.remarks || '',
          refNo: augmentation.ref_number || '',
        }

        // Rebuild full account paths (sub-item / sub-type / sub-sub-type levels).
        // Load the hierarchy lazily when the page did not fetch it yet (admin page)
        if (
          !state.expenseHierarchy.value ||
          state.expenseHierarchy.value.length === 0 ||
          Object.keys(state.augAppropriationMap.value || {}).length === 0
        ) {
          await fetchExpenseAccounts()
        }

        // Map the backend details to the new appropriation structure
        const augAccountMap = buildAugAppropriationNameMap(
          state.expenseHierarchy.value,
          state.augAppropriationMap.value,
        )
        const mappedDetails = (augmentation.details || []).map((detail) => {
          // Build FROM expense account name
          const fromExpense =
            augAccountMap[String(detail.from_appropriation_id)] || detail.from_account || ''

          // Build TO expense account name
          const toExpense =
            augAccountMap[String(detail.to_appropriation_id)] || detail.to_account || ''

          return {
            id: detail.id,
            from_expense: fromExpense,
            to_expense: toExpense,
            from_appropriation_id: detail.from_appropriation_id,
            to_appropriation_id: detail.to_appropriation_id,
            amount: detail.amount,
            particulars: detail.particulars,
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
    state.forms.value.augmentation.augmentation_date = `${yyyy}-${mm}-${dd}`
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
      const endpoint = authStore.admin ? '/api/admin/budgets' : '/api/barangay/budgets'
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
