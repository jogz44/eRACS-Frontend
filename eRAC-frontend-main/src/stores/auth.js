import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // User state

    user: JSON.parse(localStorage.getItem('user_data')) || null,
    token: localStorage.getItem('barangay_token') || null,
    returnUrl: '/home/dashboard',

    // Admin state
    admin: JSON.parse(localStorage.getItem('admin_data')) || null,
    adminToken: localStorage.getItem('admin_token') || null,
    adminReturnUrl: '/admin/dashboard',
  }),
   getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
    
    // Admin role getters
    isSuperAdmin: (state) => state.admin?.role === 'super_admin',
    isAccounting: (state) => state.admin?.role === 'accounting',
    isCOA: (state) => state.admin?.role === 'coa',
    canManageUsers: (state) => state.admin?.role === 'super_admin',
  },


  persist: true,

  actions: {
    // Helper methods
        setToken(token) {
      this.token = token
    },
    setUser(user) {
      this.user = user
    },
    clearAuthData() {
      this.token = null
      this.user = null
    },
    _setAuthData(userData, token) {
      this.user = this._formatUser(userData)
      this.token = token
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('user_data', JSON.stringify(this.user))
      localStorage.setItem('barangay_token', token)
    },

    _formatUser(userData) {
      return {
        id: userData.id || null,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        barangay_name: userData.barangay_name || '',
        position_name: userData.position_name || '',
        position: userData.position || '',
        photo_path: userData.photo_path || null,
        photo_url:
          userData.photo_url || (userData.photo_path ? `/storage/${userData.photo_path}` : null),
      }
    },

    _handleError(error, defaultMessage) {
      if (error.response?.status === 422) {
        return Object.values(error.response.data.errors).flat().join('\n')
      }
      return error.response?.data?.message || defaultMessage
    },

    // Auth methods
    async register(userData) {
      try {
        // 1. Validate required fields first
        if (!userData.barangay) {
          return {
            success: false,
            error: 'Barangay is required',
          }
        }

        // 2. Get barangay ID
        const barangayResponse = await api.get('/api/barangay/barangays', {
          params: { name: userData.barangay },
        })

        if (!barangayResponse.data?.length) {
          return {
            success: false,
            error: 'Invalid barangay selected',
          }
        }

        const barangayId = barangayResponse.data[0].id

        // 3. Get position ID
        const positionResponse = await api.get('/api/barangay/positions', {
          params: { active_only: true },
        })

        if (!positionResponse.data?.length) {
          return {
            success: false,
            error: 'No positions available',
          }
        }

        const position = positionResponse.data.find(p => p.name === userData.position)
        if (!position) {
          return {
            success: false,
            error: 'Invalid position selected',
          }
        }

        // 4. Prepare registration data
        const registrationData = {
          first_name: userData.first_name,
          middle_name: userData.middle_name || null, // Handle optional field
          last_name: userData.last_name,
          barangay_id: barangayId,
          position_id: position.id,
          suffix: userData.suffix || null, // Handle optional field
          email: userData.email,
          username: userData.username,
          password: userData.password,
          password_confirmation: userData.password_confirmation,
          photo_path: userData.photo || null, // Handle optional field
          is_approved: true,
        }

        // 4. Make registration request
        const response = await api.post('/api/barangay/register', registrationData)

        return {
          success: true,
          data: response.data,
        }
      } catch (error) {
        // Improved error handling
        let errorMessage = 'Registration failed'

        if (error.response?.status === 422) {
          // Handle Laravel validation errors
          const errors = error.response.data.errors
          errorMessage = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n')
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }

        return {
          success: false,
          error: errorMessage,
        }
      }
    },

    async uploadPhoto(file) {
      try {
        const formData = new FormData()
        formData.append('photo', file, file.name)

        const response = await api.post('/api/barangay/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        return { success: true, path: response.data.path }
      } catch (error) {
        return { success: false, error: this._handleError(error, 'Upload failed') }
      }
    },

    async login(username, password, $q, router) {
      try {
        const response = await api.post('/api/barangay/login', { username, password })

        // Update state
        this.user = response.data.user
        this.token = response.data.access_token

        // Store in localStorage
        localStorage.setItem('user_data', JSON.stringify(response.data.user))
        localStorage.setItem('barangay_token', response.data.access_token)

        // Load user permissions after successful login
        try {
          const { usePermissionsStore } = await import('./permissionsStore')
          const permissionsStore = usePermissionsStore()
          await permissionsStore.loadUserPermissions()
        } catch (permError) {
          console.warn('Failed to load user permissions:', permError)
          // Don't fail login if permissions fail to load
        }

        $q.notify({
          type: 'positive',
          message: 'Login successful!',
          position: 'top',
        })

        router.push('/home/dashboard')
        return true
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error.notify?.data?.message || 'Login Failed',
          position: 'top',
        })
        return false
      }
    },

    async logout() {
      try {
        if (this.token) {
          await api.post(
            '/api/barangay/logout',
            {},
            {
              headers: { Authorization: `Bearer ${this.token}` },
            },
          )
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.user = null
        this.token = null
        localStorage.removeItem('barangay_token')
        
        // Reset permissions on logout
        try {
          const { usePermissionsStore } = await import('./permissionsStore')
          const permissionsStore = usePermissionsStore()
          permissionsStore.reset()
        } catch (permError) {
          console.warn('Failed to reset permissions:', permError)
        }
      }
    },

    async initialize() {
      const token = localStorage.getItem('barangay_token')
      if (!token) return

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const response = await api.get('/api/barangay/user')

        if (!response.data?.data?.user) {
          throw new Error('Invalid user data in response')
        }

        this._setAuthData(response.data.data.user, token)
      } catch (error) {
        console.error('Session validation failed:', error)
        this.clearAuth()
      }
    },

    getAuthHeader() {
      return {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    },

    clearAuth() {
      this.user = null
      this.token = null
      delete api.defaults.headers.common['Authorization']
      localStorage.removeItem('barangay_token')
      localStorage.removeItem('user_data')
    },

    // ====== NEW ADMIN ACTIONS ======
    // Admin actions
    adminLogin(credentials, router) {
      return new Promise((resolve, reject) => {
        api
          .post('/api/admin/login', credentials, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          })
          .then((response) => {
            if (response.data.token) {
              this.admin = response.data.admin
              this.adminToken = response.data.token
              localStorage.setItem('admin_data', JSON.stringify(this.admin))
              localStorage.setItem('admin_token', this.adminToken)
              api.defaults.headers.common['Authorization'] = `Bearer ${this.adminToken}`
              if (router) {
                router.replace('/admin/dashboard')
                setTimeout(() => window.location.reload(), 100)
              }
              resolve(response.data)
            } else {
              throw new Error('No token received')
            }
          })
          .catch((error) => {
            console.error('Login error:', error)
            if (error.response) {
              reject(error.response.data.message || 'Login failed')
            } else if (error.request) {
              reject('Network error - please check your connection')
            } else {
              reject(error.message)
            }
          })
      })
    },

    adminLogout(router) {
      return api.post('/api/admin/logout').finally(() => {
        this._clearAdminAuth()
        if (router) {
          router.replace('/admin/login')
          setTimeout(() => window.location.reload(), 100)
        }
      })
    },

    _clearAdminAuth() {
      this.admin = null
      this.adminToken = null
      localStorage.removeItem('admin_data')
      localStorage.removeItem('admin_token')
      delete api.defaults.headers.common['Authorization']
    },

    // Password reset methods
    async checkEmailExists(email) {
      try {
        const response = await api.post('/api/barangay/check-email', { email })
        return {
          exists: response.data.exists,
          success: true
        }
      } catch (error) {
        return {
          exists: false,
          success: false,
          error: this._handleError(error, 'Failed to check email')
        }
      }
    },

    async resetPassword(data) {
      try {
        const response = await api.post('/api/barangay/reset-password', data)
        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        return {
          success: false,
          error: this._handleError(error, 'Password reset failed')
        }
      }
    },
    getUserID() {
      return this.user.id || null}
  },
})
