import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const usePermissionsStore = defineStore('permissions', {
  state: () => ({
    userPermissions: {
      view: true,
      add: true,
      edit: true,
      delete: false,
      print: true,
    },
    currentUser: null,
    loading: false,
    initialized: false,
  }),

  getters: {
    canView: (state) => state.userPermissions.view,
    canAdd: (state) => state.userPermissions.add,
    canEdit: (state) => state.userPermissions.edit,
    canDelete: (state) => state.userPermissions.delete,
    canPrint: (state) => state.userPermissions.print,
    
    hasPermission: (state) => (permission) => {
      return state.userPermissions[permission] || false
    },

    isAdmin: (state) => state.currentUser?.is_admin || false,
    
    hasAnyPermission: (state) => (permissions) => {
      return permissions.some(permission => state.userPermissions[permission])
    },

    canManageUsers: (state) => {
      return state.currentUser?.is_admin || 
             state.currentUser?.position === 'Barangay Captain'
    }
  },

  actions: {
    async loadUserPermissions() {
      if (this.loading || this.initialized) return

      this.loading = true
      try {
        const response = await api.get('/api/barangay/user/permissions')
        
        if (response.data.status === 'success') {
          this.userPermissions = response.data.permissions
          this.currentUser = response.data.user
          this.initialized = true
        }
      } catch (error) {
        console.error('Failed to load user permissions:', error)
        // Keep default permissions if loading fails
      } finally {
        this.loading = false
      }
    },

    async updatePermissions(userId, permissions) {
      try {
        const response = await api.post(`/api/barangay/user-access/${userId}`, {
          permissions
        })
        
        if (response.data.status === 'success') {
          return { success: true, message: 'Permissions updated successfully' }
        } else {
          throw new Error(response.data.message || 'Failed to update permissions')
        }
      } catch (error) {
        console.error('Failed to update permissions:', error)
        return { 
          success: false, 
          message: error.response?.data?.message || 'Failed to update permissions' 
        }
      }
    },

    setPermissions(permissions) {
      this.userPermissions = { ...this.userPermissions, ...permissions }
    },

    checkPermission(permission) {
      if (this.isAdmin) return true
      return this.userPermissions[permission] || false
    },

    requirePermission(permission) {
      if (!this.checkPermission(permission)) {
        throw new Error(`You don't have permission to ${permission}`)
      }
    },

    reset() {
      this.userPermissions = {
        view: true,
        add: true,
        edit: true,
        delete: false,
        print: true,
      }
      this.currentUser = null
      this.loading = false
      this.initialized = false
    }
  }
})