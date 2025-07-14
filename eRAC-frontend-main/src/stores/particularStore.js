import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'boot/axios'
import { date } from 'quasar'
import { useAuthStore } from './auth' // Import the auth store

export const useParticularStore = defineStore('particular', () => {
  const particularRow = ref([]) // Initialize as an empty array
  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore() // Get the auth store instance

  const particularColumns = ref([
    {
      name: 'particular_name',
      label: 'Particular',
      field: 'particular_name',
      align: 'center',
      sortable: true,
    },
    {
      name: 'created_at',
      label: 'Date',
      field: 'created_at',
      format: (val) => date.formatDate(val, 'DD/MM/YYYY'),
      align: 'center',
      sortable: true,
    },
    { name: 'action', label: 'Action', field: '', align: 'center' },
  ])

  // Get auth config using the token from auth store
  const getAuthConfig = () => {
    if (!authStore.token) {
      console.warn('No authentication token found')
      // You might want to redirect to login here or throw an error
      throw new Error('Authentication required')
    }
    return {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    }
  }

  // Fetch all particulars from API
  const fetchParticulars = async () => {
    try {
      loading.value = true
      const response = await api.get('/api/barangay/particulars', getAuthConfig())

      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        particularRow.value = response.data
      } else if (response.data && Array.isArray(response.data.data)) {
        // Some APIs wrap data in a data property
        particularRow.value = response.data.data
      } else {
        // If we got something else, initialize as empty array
        console.warn('API did not return an array format as expected', response.data)
        particularRow.value = []
      }

      error.value = null
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching particulars:', err)

      // Handle unauthorized error
      if (err.response?.status === 401) {
        authStore.clearAuth() // Clear auth state
        // You might want to redirect to login here
        console.error('Unauthorized - redirect to login')
      }
    } finally {
      loading.value = false
    }
  }

  // Add new particular
  const addParticular = async (particularData) => {
    try {
      loading.value = true
      const response = await api.post(
        '/api/barangay/particulars',
        {
          particular_name: particularData.particular_name,
        },
        getAuthConfig(),
      )

      // Ensure particularRow.value is an array before using unshift
      if (!Array.isArray(particularRow.value)) {
        particularRow.value = []
      }

      // Add the new item to the array
      if (response.data) {
        particularRow.value.unshift(response.data)
      }

      error.value = null
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error adding particular:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update existing particular
  const updateParticular = async (id, particularData) => {
    try {
      loading.value = true
      const response = await api.put(
        `/api/barangay/particulars/${id}`,
        {
          particular_name: particularData.particular_name,
        },
        getAuthConfig(),
      )

      // Update the local state immediately
      const index = particularRow.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        // Create a new array to trigger reactivity
        particularRow.value = [
          ...particularRow.value.slice(0, index),
          response.data,
          ...particularRow.value.slice(index + 1),
        ]
      } else {
        // If not found, refresh the list
        await fetchParticulars()
      }

      error.value = null
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error updating particular:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete particular
  const deleteParticular = async (id) => {
    try {
      loading.value = true
      await api.delete(`/api/barangay/particulars/${id}`, getAuthConfig())

      // Ensure particularRow.value is an array before filtering
      if (Array.isArray(particularRow.value)) {
        particularRow.value = particularRow.value.filter((p) => p.id !== id)
      }

      error.value = null
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error deleting particular:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    particularRow,
    particularColumns,
    loading,
    error,
    fetchParticulars,
    addParticular,
    updateParticular,
    deleteParticular,
  }
})
