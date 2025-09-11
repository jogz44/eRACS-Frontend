import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth'

export function usePageLogging() {
  const authStore = useAuthStore()

  const logPageVisit = async (pageName) => {
    try {
      // Check if user is authenticated
      if (!authStore.user && !authStore.admin) {
        console.warn('No authenticated user found for page logging')
        return
      }

      // Determine if it's admin or regular user
      const isAdmin = !!authStore.admin
      const endpoint = isAdmin ? '/api/admin/setlogs' : '/api/barangay/setlogs'
      
      const payload = {
        activity: 'Visited Page',
        details: `Visited ${pageName} Page`
      }

      // Prepare per-request auth headers to avoid race with defaults
      const token = isAdmin ? authStore.adminToken : authStore.token
      if (!token) {
        // Skip logging if token not ready yet
        return
      }

      await api.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
    } catch (error) {
      console.error('Error logging page visit:', error)
      // Don't throw error to avoid breaking page functionality
    }
  }

  return {
    logPageVisit
  }
}
