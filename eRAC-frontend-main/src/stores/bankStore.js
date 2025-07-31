import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { useAuthStore } from './auth'

export const useBankStore = defineStore('bank', {
  state: () => ({
    banks: [],
    booklets: [],
    loading: false,
    error: null,
    columns: [
      {
        name: 'name',
        label: 'Bank',
        field: 'name', // Now using standardized 'name' field
        align: 'center',
        sortable: true,
      },
      {
        name: 'status',
        label: 'Status',
        field: 'status',
        align: 'center',
        format: (val) => (val === 'Available' ? 'Available' : 'Consumed'),
      },
      { name: 'actions', label: 'Actions', align: 'center' },
    ],
    chequeColumns: [
      {
        name: 'chequeNo',
        label: 'Cheque No.',
        field: 'chequeNo',
        align: 'left',
        sortable: true,
      },
      {
        name: 'dvNo',
        label: 'DV Number',
        field: 'dvNo',
        align: 'left',
        sortable: true,
      },
      {
        name: 'status',
        label: 'Status',
        field: 'status',
        align: 'center',
        format: (val) => {
          const status = (val || '').toLowerCase()
          return status === 'unused' ? 'Unused' : 'Used'
        },
      },
      {
        name: 'date',
        label: 'Date',
        field: 'date',
        align: 'center',
        sortable: true,
      },
    ],

    bookletColumns: [
      {
        name: 'id',
        label: 'Id',
        field: 'id',
        align: 'left',
        sortable: true,
      },

      {
        name: 'date',
        label: 'Date',
        field: 'date',
        align: 'left',
        sortable: true,
      },

      {
        name: 'quantity',
        label: 'Quantity',
        field: 'quantity',
        align: 'center',
        sortable: true,
        format: (val) => val || 0,
      },

      {
        name: 'starting_cheque_numb',
        label: 'Start',
        field: 'starting_cheque_numb',
        align: 'left',
        sortable: true,
      },

      {
        name: 'ending_cheque_numb',
        label: 'End',
        field: 'ending_cheque_numb',
        align: 'left',
        sortable: true,
      },

      {
        name: 'status',
        label: 'Status',
        field: 'status',
        align: 'center',
        format: (val) => {
          const status = (val || '').toLowerCase()
          return status === 'unused' ? 'Unused' : status === 'used' ? 'Used' : 'Not all Consumed'
        },
      },
    ],
  }),

  actions: {
    getAuthConfig() {
      const authStore = useAuthStore()
      if (!authStore.token) {
        throw new Error('Authentication token not found')
      }
      return {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    },

    // Fetch all banks
    // Add this transformation in fetchBanks
    async fetchBanks() {
      this.loading = true
      try {
        const config = this.getAuthConfig()
        const response = await api.get('/api/barangay/banks', config)

        this.banks = (response.data.data || response.data || []).map((bank) => ({
          id: bank.id,
          name: bank.bank_name || bank.name,
          status: bank.status || 'Available',
          booklets_count: bank.booklets_count || 0, // Changed from cheques_count
          booklets: bank.booklets || [], // Changed from cheques
        }))

        console.log('Stored banks:', this.banks)
        return this.banks
      } catch (error) {
        console.error('Error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Add new bank
    // In bankStore.js - update addBank action
    async addBank(bankName) {
      try {
        const config = this.getAuthConfig()
        const response = await api.post('/api/barangay/banks', { name: bankName }, config)

        // Transform the response to match frontend expectations
        const newBank = {
          id: response.data.id,
          name: response.data.bank_name || response.data.name,
          status: response.data.status || 'Available',
          cheques: response.data.cheques || [],
        }

        // Add to local state
        if (Array.isArray(this.banks)) {
          this.banks.push(newBank)
        } else {
          this.banks = [newBank]
        }

        return newBank
      } catch (error) {
        console.error('Error adding bank:', error)
        throw error
      }
    },

    // Edit existing bank
    async editBank(id, newName) {
      this.isLoading = true
      this.error = null
      try {

        const response = await api.put(`/api/barangay/banks/${id}`, 
          { name: newName,
            _method: 'PUT' }, this.getAuthConfig())

        // Update local state
        const index = this.banks.findIndex((bank) => bank.id === id)
        if (index !== -1) {
          this.banks[index] = {
            ...this.banks[index],
            name: response.data.bank_name || response.data.name || newName,
            status: response.data.status || 'Available',
          }
        }

        return response.data
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          error.response?.data?.errors?.name?.[0] ||
          'Failed to update bank'
        console.error('Edit bank error:', error.response?.data || error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Mark bank as consumed
    consumeBank(id) {
      const bank = this.banks.find((bank) => bank.id === id)
      if (bank) {
        bank.status = 'Consumed'
      }
    },

    //Booklet
    async fetchBankBooklets(bankId) {
      this.isLoading = true
      try {
        const config = this.getAuthConfig()
        const response = await api.get(`/api/barangay/banks/${bankId}/booklets`, config)

        // Debug: log the raw response
        console.log('Raw API response:', response.data)

        // Extract booklets from the correct path
        const apiBooklets = response.data?.data?.booklets || []

        // Process the booklets to match your table columns
        const processedBooklets = apiBooklets.map((booklet) => ({
          id: booklet.id,
          date: booklet.date,
          quantity: booklet.quantity,
          starting_cheque_numb: booklet.starting_cheque_numb,
          ending_cheque_numb: booklet.ending_cheque_numb,
          status: booklet.status,
          // Include any additional fields needed for your table
          booklet_numb: booklet.booklet_numb, // Added this line
        }))

        console.log('Processed booklets:', processedBooklets)
        return processedBooklets // Return the array directly
      } catch (error) {
        console.error('Error fetching booklets:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    methods: {
      calculateQuantity(start, end) {
        try {
          return parseInt(end) - parseInt(start) + 1
        } catch {
          return 0
        }
      },
    },

    async addBooklet(bankId, bookletData) {
      this.isLoading = true
      try {
        const config = this.getAuthConfig()

        // Convert to numbers for validation
        const start = parseInt(bookletData.starting_cheque_numb)
        const end = parseInt(bookletData.ending_cheque_numb)

        // Client-side validation
        if (isNaN(start) || isNaN(end)) {
          throw new Error('Cheque numbers must be numeric')
        }
        if (start > end) {
          throw new Error('Starting number must be less than ending number')
        }

        const response = await api.post(
          `/api/barangay/banks/${bankId}/booklets`,
          {
            starting_cheque_numb: bookletData.starting_cheque_numb,
            ending_cheque_numb: bookletData.ending_cheque_numb,
          },
          config,
        )

        return response.data
      } catch (error) {
        console.error('Error adding booklet:', error)

        // Provide more specific error messages
        let message = error.response?.data?.message || error.message
        if (error.response?.status === 422) {
          message = 'Invalid cheque number range: ' + message
        }

        throw new Error(message)
      } finally {
        this.isLoading = false
      }
    },

    // Add this action to your store's actions
    async fetchBookletCheques(bookletId) {
      this.isLoading = true
      this.error = null
      try {
        // Convert to number and validate
        const id = Number(bookletId)
        if (isNaN(id)) {
          throw new Error(`Invalid booklet ID: ${bookletId}`)
        }

        const config = this.getAuthConfig()
        const response = await api.get(`/api/barangay/booklets/${id}/cheques`, config)

        // Debug raw response
        console.log('API response:', response.data)

        // Handle different response structures
        const rawCheques =
          response.data?.data?.booklets ||
          response.data?.booklets ||
          response.data?.data ||
          response.data?.cheques ||
          []

        const cheques = rawCheques.map((c) => ({
          chequeNo: c.chequeNo || c.cheque_number || '',
          status: c.status || c.cheque_status || 'unused',
          date: c.date || c.created_at || '',
          dvs: c.dvs || [],
        }))

        return {
          status: true,
          message: 'Success',
          data: cheques,
          cheques: cheques,
        }
      } catch (error) {
        console.error('Fetch booklet cheques error:', {
          error: error.response?.data || error.message,
          bookletId: bookletId,
        })
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchBankCheques(bankId) {
      this.isLoading = true
      this.error = null
      try {
        console.log('[Store] Fetching cheques for bank ID:', bankId)

        const config = this.getAuthConfig()
        const response = await api.get(`/api/barangay/banks/${bankId}/cheques`, config)
        console.log('[Store] Raw API response:', response.data)

        // Normalize and transform cheques
        const rawCheques = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.cheques || []

        const cheques = rawCheques.map((cheque) => ({
          chequeNo: cheque.chequeNo || cheque.cheque_number || '',
          status: cheque.status || 'unused',
          date: cheque.date || '',
          dvs: cheque.dvs || [],
        }))

        // Optional: sort by cheque number
        cheques.sort((a, b) => a.chequeNo.localeCompare(b.chequeNo, undefined, { numeric: true }))

        const result = {
          ...response.data,
          data: cheques,
          cheques,
        }

        console.log('[Store] Final normalized response:', result)
        return result
      } catch (error) {
        console.error('[Store] Error fetching cheques:', error)
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.isLoading = false
        console.log('[Store] Finished fetching cheques')
      }
    },

    // Add cheque to a bank
    async addCheque(bankId, chequeData) {
      this.isLoading = true
      this.error = null
      try {
        const config = this.getAuthConfig()
        const response = await api.post(
          `/api/barangay/banks/${bankId}/cheques`,
          {
            chequeNo: chequeData.chequeNo,
            date: chequeData.date,
          },
          config,
        )

        return {
          chequeNo: response.data.chequeNo || response.data.cheque_number,
          status: (response.data.status || 'unused').toLowerCase(),
          date: response.data.date || new Date().toISOString().split('T')[0],
          dvs: response.data.dvs || [],
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        console.error('Error adding cheque:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})
