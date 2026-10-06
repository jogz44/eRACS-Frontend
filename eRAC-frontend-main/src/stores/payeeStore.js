import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { useAuthStore } from './auth'

// Adjust if your actual route differs
const BASE_URL = '/api/barangay/library/registered-payees'

const getAuthConfig = () => {
  const authStore = useAuthStore()
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

// Resolves the logged-in barangay user's barangay_id.
// Ideally this comes straight from authStore.user.barangay_id, but the
// current /api/barangay/login and /api/barangay/user responses only send
// barangay_name, not barangay_id — so this falls back to looking it up via
// /api/barangay/barangays?name=... and caches the result so the lookup only
// happens once per session.
// TODO (backend): add barangay_id to the user object returned by those two
// endpoints, then this fallback becomes unnecessary.
const getBarangayId = async () => {
  const authStore = useAuthStore()

  if (authStore.user?.barangay_id) {
    return authStore.user.barangay_id
  }

  const barangayName = authStore.user?.barangay_name
  if (!barangayName) {
    console.warn('No barangay_id or barangay_name found on authStore.user')
    throw new Error('barangay_id is required but was not found in the auth store')
  }

  const response = await api.get('/api/barangay/barangays', {
    params: { name: barangayName },
  })

  const match = response.data?.[0]
  if (!match?.id) {
    console.warn(`Could not resolve barangay_id for barangay_name "${barangayName}"`)
    throw new Error('barangay_id is required but could not be resolved from barangay_name')
  }

  // Cache it so we don't hit this endpoint on every add/edit
  authStore.user.barangay_id = match.id
  localStorage.setItem('user_data', JSON.stringify(authStore.user))

  return match.id
}

const emptyPayeeForm = () => ({
  payee: '',
  payee2: '',
  taxpayerType: '',
  tin: '',
  description: '',
  firstName: '',
  middleName: '',
  lastName: '',
  foreignAddress: '',
  foreignZipCode: '',
  address: '',
  zipCode: '',
  type: 'Local', // 'Local' | 'Foreign'
})

export const usePayeeStore = defineStore('payee', {
  state: () => ({
    payees: [],
    loading: false,
    isLoading: false,
    error: null,

    forms: {
      payee: emptyPayeeForm(),
    },

    // Maps 1:1 to the fields your API actually returns
    columns: [
      { name: 'payee_name', label: 'Payee', field: 'payee_name', align: 'center', sortable: true },
      { name: 'payee2_name', label: 'Payee 2', field: 'payee2_name', align: 'center', sortable: true },
      { name: 'taxpayer_type', label: 'Taxpayer Type', field: 'taxpayer_type', align: 'center', sortable: true },
      { name: 'tin_number', label: 'TIN', field: 'tin_number', align: 'center', sortable: true },
      { name: 'description', label: 'Description', field: 'description', align: 'center', sortable: true },
      { name: 'address', label: 'Address', field: 'address', align: 'center', sortable: true },
      { name: 'zip_code', label: 'Zip Code', field: 'zip_code', align: 'center', sortable: true },
      { name: 'type', label: 'Type', field: 'type', align: 'center', sortable: true },
      { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
      { name: 'action', label: 'Actions', field: 'action', align: 'center', sortable: false },
    ],
  }),

  actions: {
    setLoading(value) {
      this.loading = value
      this.isLoading = value
    },

    resetForm() {
      this.forms.payee = emptyPayeeForm()
    },

    // Loads a full row into the edit form (call this from the "edit" click handler)
    loadIntoForm(payee) {
      this.forms.payee = {
        payee: payee.payee_name || '',
        payee2: payee.payee2_name || '',
        taxpayerType: payee.taxpayer_type || '',
        tin: payee.tin_number || '',
        description: payee.description || '',
        firstName: payee.firstname || '',
        middleName: payee.middlename || '',
        lastName: payee.lastname || '',
        foreignAddress: payee.type === 'Foreign' ? payee.address || '' : '',
        foreignZipCode: payee.type === 'Foreign' ? payee.zip_code || '' : '',
        address: payee.type !== 'Foreign' ? payee.address || '' : '',
        zipCode: payee.type !== 'Foreign' ? payee.zip_code || '' : '',
        type: payee.type || 'Local',
      }
    },

    // Converts the UI form shape into the payload shape the backend expects
    buildPayload(form, barangayId) {
      return {
        barangay_id: barangayId,
        firstname: form.firstName,
        middlename: form.middleName,
        lastname: form.lastName,
        payee_name: form.payee,
        payee2_name: form.payee2,
        taxpayer_type: form.taxpayerType,
        tin_number: form.tin,
        description: form.description,
        address: form.type === 'Foreign' ? form.foreignAddress : form.address,
        zip_code: form.type === 'Foreign' ? form.foreignZipCode : form.zipCode,
        type: form.type,
      }
    },

    async fetchPayees(type = null) {
      this.setLoading(true)
      this.error = null

      try {
        const url = type ? `${BASE_URL}?type=${type}` : BASE_URL
        const response = await api.get(url, getAuthConfig())
        const data = response.data?.data ?? response.data
        this.payees = Array.isArray(data) ? data : []
        return this.payees
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch payees'
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // Maps to: RegisteredPayee::where('type', 'Local')->get();
    async fetchLocalPayees() {
      return this.fetchPayees('Local')
    },

    // Maps to: RegisteredPayee::where('type', 'Foreign')->get();
    async fetchForeignPayees() {
      return this.fetchPayees('Foreign')
    },

    async addPayee(form) {
      this.setLoading(true)
      this.error = null

      try {
        const barangayId = await getBarangayId()
        const payload = this.buildPayload(form, barangayId)
        const response = await api.post(BASE_URL, payload, getAuthConfig())
        const payee = response.data?.data ?? response.data

        if (payee) {
          this.payees.unshift(payee)
        }

        return payee
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to add payee'
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async editPayee(id, form) {
      this.setLoading(true)
      this.error = null

      try {
        const barangayId = await getBarangayId()
        const payload = this.buildPayload(form, barangayId)
        const response = await api.put(`${BASE_URL}/${id}`, payload, getAuthConfig())
        const updatedPayee = response.data?.data ?? response.data

        if (updatedPayee) {
          const index = this.payees.findIndex((p) => p.id === id)
          if (index !== -1) {
            this.payees[index] = { ...this.payees[index], ...updatedPayee }
          }
        }

        return updatedPayee
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to update payee'
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async deletePayee(id) {
      this.setLoading(true)
      this.error = null

      try {
        await api.delete(`${BASE_URL}/${id}`, getAuthConfig())
        this.payees = this.payees.filter((p) => p.id !== id)
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to delete payee'
        throw error
      } finally {
        this.setLoading(false)
      }
    },
  },
})