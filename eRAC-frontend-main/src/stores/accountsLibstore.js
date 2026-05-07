import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { useAuthStore } from './auth'
import { reactive } from 'vue'

// Helper function with better debugging
const getAuthConfig = () => {
  const authStore = useAuthStore()

  // Use admin token if admin is logged in, otherwise use regular token
  const token = authStore.admin ? authStore.adminToken : authStore.token

  if (!token) {
    console.warn('No authentication token found')
    throw new Error('Authentication required')
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
}

export const useAccountsLibraryStore = defineStore('accounts-library', {
  state: () => ({
    years: [],
    expenseClasses: [],
    expenseTypes: [],
    expenseItems: [],
    expenseSubItems: [], // Add sub-items state
    selectedYear: null,
    loading: false,
    error: null,
    fetchedTypes: reactive(new Set()), // classId-year combo
    fetchedItems: reactive(new Set()),
    fetchedSubItems: reactive(new Set()), // Add sub-items tracking
  }),

  getters: {
    yearOptions: (state) => {
      return state.years.map((y) => ({
        label: y.year.toString(), // Display value (e.g., "2024")
        value: y.id, // Actual fiscal year ID
        yearValue: y.year.toString(), // For display purposes database ID // For display purposes
      }))
    },
    // New getter for expense classes
    expenseClassOptions: (state) => {
      return state.expenseClasses.map((c) => ({
        label: c.name,
        value: c.id,
        year: c.fiscal_year_id,
      }))
    },
  },

  actions: {
    // Existing year methods...
    async fetchYears() {
      this.loading = true
      try {
        const config = getAuthConfig()
        const response = await api.get('/api/barangay/fiscal-years', config)

        this.years = response.data.data || []
        if (this.years.length > 0) {
          const currentYear = new Date().getFullYear()
          const currentYearStr = currentYear.toString()
          const yearExists = this.years.some((y) => y.year.toString() === currentYearStr)

          // Store the ID, not the year string
          this.selectedYear = yearExists
            ? this.years.find((y) => y.year.toString() === currentYearStr).id
            : this.years[0].id
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        this.years = []
      } finally {
        this.loading = false
      }
    },

    async addYear(newYear) {
      this.loading = true
      try {
        const response = await api.post(
          '/api/barangay/fiscal-years',
          { year: newYear },
          getAuthConfig(),
        )

        this.years.push(response.data)
        this.years.sort((a, b) => b.year - a.year)
        this.selectedYear = newYear

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchExpenseClasses(fiscalYearId) {
      this.loading = true
      try {
        const response = await api.get(
          `/api/barangay/expense-classes?fiscal_year_id=${fiscalYearId}`,
          getAuthConfig(),
        )

        // Handle the nested response structure
        const apiData = response.data?.data // This is your {status, message, data} object
        const classesData = apiData?.data // This should contain your actual expense classes

        // Ensure we have an array
        if (!Array.isArray(classesData)) {
          console.error('Expected array but got:', classesData)
          throw new Error('API did not return an array of expense classes')
        }

        // Transform the data for your frontend
        this.expenseClasses = classesData.map((c) => ({
          id: c.id,
          name: c.name,
          fiscal_year_id: c.fiscal_year_id,
          year: c.fiscal_year_id, // or c.year if available
          order: c.order || 0,
          types: c.types || [],
        }))

        return this.expenseClasses
      } catch (error) {
        console.error('Error fetching expense classes:', error)
        this.error =
          error.response?.data?.message || error.message || 'Failed to load expense classes'
        this.expenseClasses = [] // Reset on error
        throw error
      } finally {
        this.loading = false
      }
    },

    async createExpenseClass(classData) {
      this.loading = true
      try {
        const authStore = useAuthStore()
        const response = await api.post(
          '/api/barangay/expense-classes',
          {
            name: classData.name,
            fiscal_year_id: classData.fiscalYearId,
            barangay_id: authStore.user.barangay_id,
          },
          getAuthConfig(),
        )

        // Handle the nested response structure
        const newClass = response.data?.data || response.data

        if (!newClass) {
          throw new Error('No data returned from API')
        }

        this.expenseClasses.push({
          id: newClass.id,
          name: newClass.name,
          fiscal_year_id: newClass.fiscal_year_id,
          year: classData.fiscalYearId,
          order: newClass.order || this.expenseClasses.length,
          types: [],
        })

        return newClass
      } catch (error) {
        console.error('Error creating expense class:', error)

        // Handle validation errors
        if (error.response?.status === 422) {
          const errors = error.response.data.errors
          const firstError = Object.values(errors)[0][0]
          throw new Error(firstError)
        }

        throw new Error(error.response?.data?.message || 'Failed to create expense class')
      } finally {
        this.loading = false
      }
    },

    async updateExpenseClass(classData) {
      this.loading = true
      try {
        const response = await api.put(
          `/api/barangay/expense-classes/${classData.id}`,
          {
            name: classData.name,
            fiscal_year_id: classData.fiscalYearId,
            order: classData.order || 0, // Ensure order has a default value
          },
          getAuthConfig(),
        )

        // Handle nested response structure if needed
        const updatedClass = response.data?.data || response.data

        const index = this.expenseClasses.findIndex((c) => c.id === classData.id)
        if (index !== -1) {
          this.expenseClasses[index] = {
            ...this.expenseClasses[index],
            ...updatedClass,
            year: classData.fiscalYearId, // Update year reference if needed
          }
        }
        return updatedClass
      } catch (error) {
        console.error('Error updating expense class:', error)
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteExpenseClass(classId) {
      this.loading = true
      try {
        await api.delete(`/api/barangay/expense-classes/${classId}`, getAuthConfig())
        this.expenseClasses = this.expenseClasses.filter((c) => c.id !== classId)
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateClassOrder(classes) {
      this.loading = true
      try {
        const updates = classes.map((cls, index) => ({
          id: cls.id,
          order: index,
        }))

        await api.patch(
          '/api/barangay/expense-classes/update-order',
          { classes: updates },
          getAuthConfig(),
        )

        // Update local state
        updates.forEach((update) => {
          const cls = this.expenseClasses.find((c) => c.id === update.id)
          if (cls) cls.order = update.order
        })
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }  
    },

    //Expense Types

    async fetchExpenseTypes(expenseClassId) {
  const key = `${expenseClassId}-${this.selectedYear}`
  if (this.fetchedTypes.has(key)) return

  this.loading = true
  try {
    const response = await api.get(
      `/api/barangay/expense-classes/${expenseClassId}/types`,
      getAuthConfig(),
    )

    // Response shape: { status, message, data: { success, data: { data: [...] } } }
    const typesData = response.data?.data?.data?.data

    if (!Array.isArray(typesData)) {
      console.error('Unexpected response shape:', JSON.stringify(response.data))
      throw new Error(`Expected array of expense types, got: ${typeof typesData}`)
    }

    // accountsLibstore.js — fetchExpenseTypes()
// async fetchExpenseTypes(expenseClassId) {
//   const key = `${expenseClassId}-${this.selectedYear}`
//   if (this.fetchedTypes.has(key)) return

//   this.loading = true
//   try {
//     const response = await api.get(
//       `/api/barangay/expense-classes/${expenseClassId}/types`,
//       getAuthConfig(),
//     )

//     // ✅ Guard against non-2xx wrapped in axios (shouldn't happen, but safety net)
//     if (!response.data?.success && response.data?.success !== undefined) {
//       throw new Error(response.data?.message || 'Server returned an error')
//     }

//     const apiData = response.data?.data
//     const typesData = apiData?.data ?? apiData  // handles both {data:{data:[]}} and {data:[]}

//     if (!Array.isArray(typesData)) {
//       // ✅ Log the actual shape so you can debug quickly
//       console.error('Unexpected response shape:', JSON.stringify(response.data))
//       throw new Error(`Expected array of expense types, got: ${typeof typesData}`)
//     }

    this.expenseTypes = this.expenseTypes.filter(
      (et) => et.expense_class_id != expenseClassId,
    )

    const fiscalYear = this.years.find((y) => y.id == this.selectedYear)
    const yearValue = fiscalYear?.year?.toString() || null

    this.expenseTypes.push(
      ...typesData.map((t) => ({
        id: t.id,
        name: t.name,
        expense_class_id: t.expense_class_id || expenseClassId,
        order: t.order || 0,
        year: yearValue,
      })),
    )

    this.fetchedTypes.add(key)
  } catch (error) {
    // ✅ Don't add to fetchedTypes on error, so retry is possible
    console.error('Error fetching expense types:', error.response?.data || error.message)
    throw error
  } finally {
    this.loading = false
  }
},

    async createExpenseType(typeData) {
      this.loading = true
      try {
        const authStore = useAuthStore()
        const response = await api.post(
          `/api/barangay/expense-classes/${typeData.expenseClassId}/types`,
          {
            name: typeData.name,
            fiscal_year_id: typeData.fiscalYearId,
            barangay_id: authStore.user.barangay_id,
          },
          getAuthConfig(),
        )

        const newType = response.data?.data || response.data

        if (!newType) throw new Error('Invalid API response')

        // Ensure the type has all required fields
        const completeType = {
          id: newType.id,
          name: newType.name,
          expense_class_id: newType.expense_class_id || typeData.expenseClassId,
          order: newType.order || this.expenseTypes.length,
          year: typeData.year || new Date().getFullYear().toString(),
        }

        this.expenseTypes.push(completeType)
        return completeType
      } catch (error) {
        console.error('Error creating expense type:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // In your accountsLibstore.js
    async updateExpenseType(typeData) {
      this.loading = true
      try {
        const response = await api.put(
          `/api/barangay/expense-classes/${typeData.expenseClassId}/types/${typeData.id}`,
          {
            name: typeData.name,
            order: typeData.order || 0,
          },
          getAuthConfig(),
        )

        const index = this.expenseTypes.findIndex((t) => t.id === typeData.id)
        if (index !== -1) {
          this.expenseTypes[index] = {
            ...this.expenseTypes[index],
            ...(response.data?.data || response.data),
          }
        }

        return response.data
      } catch (error) {
        console.error('Error updating expense type:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteExpenseType(typeData) {
      this.loading = true
      try {
        await api.delete(
          `/api/barangay/expense-classes/${typeData.expenseClassId}/types/${typeData.id}`,
          getAuthConfig(),
        )

        this.expenseTypes = this.expenseTypes.filter((t) => t.id !== typeData.id)
      } catch (error) {
        console.error('Error deleting expense type:', error)
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Add this action to your store
    async updateTypesOrder(classId, types) {
      this.loading = true
      try {
        const updates = types.map((type, index) => ({
          id: type.id,
          order: index,
        }))

        const response = await api.patch(
          `/api/barangay/expense-classes/${classId}/types/update-order`,
          { types: updates },
          getAuthConfig(),
        )

        // Update local state
        types.forEach((type, index) => {
          const foundType = this.expenseTypes.find((t) => t.id === type.id)
          if (foundType) {
            foundType.order = index
          }
        })

        return response.data
      } catch (error) {
        console.error('Error updating type order:', error)
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Expense Item Methods
    async fetchExpenseItems(expenseClassId, expenseTypeId, forceRefresh = false) {
      const year = this.years.find((y) => y.id == this.selectedYear)?.year
      const key = `${expenseClassId}-${expenseTypeId}-${year}`
      if (this.fetchedItems.has(key)) return
      this.loading = true
      try {
        // Check if we should skip fetch (items exist and not forcing refresh)
        const existingItems = this.expenseItems.filter(
          (item) =>
            item.expense_class_id == expenseClassId && item.expense_type_id == expenseTypeId,
        )

        if (!forceRefresh && existingItems.length > 0) {
          return existingItems
        }

        const response = await api.get(
          `/api/barangay/expense-classes/${expenseClassId}/types/${expenseTypeId}/items`,
          getAuthConfig(),
        )

        // Handle nested response structure
        const apiData = response.data?.data
        const itemsData = apiData?.data || apiData

        if (!Array.isArray(itemsData)) {
          console.error('Expected array but got:', itemsData)
          throw new Error('API did not return an array of expense items')
        }

        // Filter out existing items for this type
        this.expenseItems = this.expenseItems.filter(
          (item) =>
            !(item.expense_class_id == expenseClassId && item.expense_type_id == expenseTypeId),
        )

        // Add new items
        this.expenseItems.push(
          ...itemsData.map((item) => ({
            id: item.id,
            name: item.name,
            expense_class_id: item.expense_class_id || expenseClassId,
            expense_type_id: item.expense_type_id || expenseTypeId,
            order: item.order || 0,
            year: this.years.find((y) => y.id == this.selectedYear)?.year?.toString() || null,
          })),
        )
        this.fetchedItems.add(key)
        return itemsData
      } catch (error) {
        console.error('Error fetching expense items:', error)
        this.error =
          error.response?.data?.message || error.message || 'Failed to load expense items'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createExpenseItem(itemData) {
      this.loading = true
      try {
        const authStore = useAuthStore()
        const response = await api.post(
          `/api/barangay/expense-classes/${itemData.expenseClassId}/types/${itemData.expenseTypeId}/items`,
          {
            name: itemData.name,
            barangay_id: authStore.user.barangay_id,
          },
          getAuthConfig(),
        )

        const newItem = response.data?.data || response.data

        if (!newItem) {
          throw new Error('No data returned from API')
        }

        this.expenseItems.push({
          id: newItem.id,
          name: newItem.name,
          expense_class_id: newItem.expense_class_id || itemData.expenseClassId,
          expense_type_id: newItem.expense_type_id || itemData.expenseTypeId,
          order: newItem.order || this.expenseItems.length,
          year: this.years.find((y) => y.id == this.selectedYear)?.year?.toString() || null,
        })

        return newItem
      } catch (error) {
        console.error('Error creating expense item:', error)

        if (error.response?.status === 422) {
          const errors = error.response.data.errors
          const firstError = Object.values(errors)[0][0]
          throw new Error(firstError)
        }

        throw new Error(error.response?.data?.message || 'Failed to create expense item')
      } finally {
        this.loading = false
      }
    },

    async updateExpenseItem(itemData) {
      this.loading = true
      try {
        const response = await api.put(
          `/api/barangay/expense-classes/${itemData.expenseClassId}/types/${itemData.expenseTypeId}/items/${itemData.id}`,
          {
            name: itemData.name,
            order: itemData.order || 0,
          },
          getAuthConfig(),
        )

        const updatedItem = response.data?.data || response.data

        const index = this.expenseItems.findIndex((i) => i.id === itemData.id)
        if (index !== -1) {
          this.expenseItems[index] = {
            ...this.expenseItems[index],
            ...updatedItem,
          }
        }

        return updatedItem
      } catch (error) {
        console.error('Error updating expense item:', error)
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteExpenseItem(itemData) {
      this.loading = true
      try {
        await api.delete(
          `/api/barangay/expense-classes/${itemData.expenseClassId}/types/${itemData.expenseTypeId}/items/${itemData.id}`,
          getAuthConfig(),
        )

        this.expenseItems = this.expenseItems.filter((i) => i.id !== itemData.id)
      } catch (error) {
        console.error('Error deleting expense item:', error)
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateItemOrder(itemData) {
      try {
        await this.updateExpenseItem(itemData)
      } catch (error) {
        console.error('Error updating item order:', error)
        throw error
      }
    },

    //Copy to Another Year
    // Add this action to your accountsLibstore.js
    async copyClassesToYear(sourceYearId, targetYearId, classIds) {
      this.loading = true
      try {
        const response = await api.post(
          `/api/barangay/expense-classes/copy-to-year/${sourceYearId}`,
          {
            target_year_id: targetYearId,
            class_ids: classIds,
          },
          getAuthConfig(),
        )

        if (!response.data) {
          throw new Error('No data received from server')
        }

        // Ensure we have the expected response structure
        const result = {
          success: response.data.success,
          stats: response.data.stats || {
            copied_classes: 0,
            copied_types: 0,
          },
          message: response.data.message || 'Copy completed',
        }

        // Refresh data after successful copy
        await this.fetchYears()
        if (this.selectedYear) {
          await this.fetchExpenseClasses(this.selectedYear)
        }

        return result
      } catch (error) {
        console.error('Error copying classes:', error)
        throw new Error(error.response?.data?.message || error.message || 'Failed to copy classes')
      } finally {
        this.loading = false
      }
    },

    // Expense Sub-Items Methods
    async fetchExpenseSubItems(expenseClassId, expenseTypeId, expenseItemId, forceRefresh = false) {
      const year = this.years.find((y) => y.id == this.selectedYear)?.year
      const key = `${expenseClassId}-${expenseTypeId}-${expenseItemId}-${year}`

      if (this.fetchedSubItems.has(key) && !forceRefresh) return

      this.loading = true
      try {
        const response = await api.get(
          `/api/barangay/expense-classes/${expenseClassId}/types/${expenseTypeId}/items/${expenseItemId}/sub-items`,
          getAuthConfig(),
        )

        const apiData = response.data?.data
        const subItemsData = apiData?.data || apiData

        if (!Array.isArray(subItemsData)) {
          console.error('Expected array but got:', subItemsData)
          throw new Error('API did not return an array of expense sub-items')
        }

        // Filter out existing sub-items for this item
        this.expenseSubItems = this.expenseSubItems.filter(
          (subItem) =>
            !(subItem.expense_class_id == expenseClassId &&
              subItem.expense_type_id == expenseTypeId &&
              subItem.expense_item_id == expenseItemId),
        )

        // Add new sub-items
        this.expenseSubItems.push(
          ...subItemsData.map((subItem) => ({
            id: subItem.id,
            name: subItem.name,
            expense_class_id: subItem.expense_class_id || expenseClassId,
            expense_type_id: subItem.expense_type_id || expenseTypeId,
            expense_item_id: subItem.expense_item_id || expenseItemId,
            order: subItem.order || 0,
            year: this.years.find((y) => y.id == this.selectedYear)?.year?.toString() || null,
          })),
        )

        this.fetchedSubItems.add(key)
        return subItemsData
      } catch (error) {
        console.error('Error fetching expense sub-items:', error)
        this.error =
          error.response?.data?.message || error.message || 'Failed to load expense sub-items'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createExpenseSubItem(subItemData) {
      this.loading = true
      try {
        const authStore = useAuthStore()
        const response = await api.post(
          `/api/barangay/expense-classes/${subItemData.expenseClassId}/types/${subItemData.expenseTypeId}/items/${subItemData.expenseItemId}/sub-items`,
          {
            name: subItemData.name,
            barangay_id: authStore.user.barangay_id,
          },
          getAuthConfig(),
        )

        const newSubItem = response.data?.data || response.data

        if (!newSubItem) {
          throw new Error('No data returned from API')
        }

        const yearValue = this.years.find((y) => y.id == this.selectedYear)?.year?.toString()

        const subItemToAdd = {
          id: newSubItem.id,
          name: newSubItem.name,
          expense_class_id: newSubItem.expense_class_id || subItemData.expenseClassId,
          expense_type_id: newSubItem.expense_type_id || subItemData.expenseTypeId,
          expense_item_id: newSubItem.expense_item_id || subItemData.expenseItemId,
          order: newSubItem.order || this.expenseSubItems.length,
          year: yearValue,
        }

        this.expenseSubItems.push(subItemToAdd)

        // Force reactivity update
        this.expenseSubItems = [...this.expenseSubItems]

        return newSubItem
      } catch (error) {
        console.error('Error creating expense sub-item:', error)

        if (error.response?.status === 422) {
          const errors = error.response.data.errors
          const firstError = Object.values(errors)[0][0]
          throw new Error(firstError)
        }

        throw new Error(error.response?.data?.message || 'Failed to create expense sub-item')
      } finally {
        this.loading = false
      }
    },

    async updateExpenseSubItem(subItemData) {
      this.loading = true
      try {
        const response = await api.put(
          `/api/barangay/expense-classes/${subItemData.expenseClassId}/types/${subItemData.expenseTypeId}/items/${subItemData.expenseItemId}/sub-items/${subItemData.id}`,
          {
            name: subItemData.name,
            order: subItemData.order || 0,
          },
          getAuthConfig(),
        )

        const updatedSubItem = response.data?.data || response.data

        const index = this.expenseSubItems.findIndex((i) => i.id === subItemData.id)
        if (index !== -1) {
          this.expenseSubItems[index] = {
            ...this.expenseSubItems[index],
            ...updatedSubItem,
          }
        }

        return updatedSubItem
      } catch (error) {
        console.error('Error updating expense sub-item:', error)
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteExpenseSubItem(subItemData) {
      this.loading = true
      try {
        await api.delete(
          `/api/barangay/expense-classes/${subItemData.expenseClassId}/types/${subItemData.expenseTypeId}/items/${subItemData.expenseItemId}/sub-items/${subItemData.id}`,
          getAuthConfig(),
        )

        this.expenseSubItems = this.expenseSubItems.filter((i) => i.id !== subItemData.id)
      } catch (error) {
        console.error('Error deleting expense sub-item:', error)
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateSubItemOrder(subItemData) {
      try {
        await this.updateExpenseSubItem(subItemData)
      } catch (error) {
        console.error('Error updating sub-item order:', error)
        throw error
      }
    },

    // Existing auth method
    async ensureAuthenticated() {
      const authStore = useAuthStore()
      if (!authStore.token) {
        if (!authStore.token) {
          throw new Error('Authentication required')
        }
      }
      return true
    },
  },
})
