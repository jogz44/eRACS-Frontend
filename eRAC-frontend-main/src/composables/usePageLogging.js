import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth'

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

      // Set authorization header
      const token = isAdmin ? authStore.adminToken : authStore.token
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      await api.post(endpoint, payload)
      console.log(`Page visit logged: ${pageName}`)
    } catch (error) {
      console.error('Error logging page visit:', error)
      // Don't throw error to avoid breaking page functionality
    }
  }

  return {
    logPageVisit
  }
}
