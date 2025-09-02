import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth'

export function useActivityLogging() {
  const authStore = useAuthStore()

  const logAdminActivity = async (activity, details) => {
    try {
      // Only log for authenticated users
      const isAdmin = !!authStore.admin
      const endpoint = isAdmin ? '/api/admin/setlogs' : '/api/barangay/setlogs'
      const token = isAdmin ? authStore.adminToken : authStore.token
      if (!token) return

      const payload = { activity, details }

      await api.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
    } catch (error) {
      // Silently ignore logging errors to avoid UX impact
      console.error('Error logging activity:', error)
    }
  }

  return { logAdminActivity }
}


