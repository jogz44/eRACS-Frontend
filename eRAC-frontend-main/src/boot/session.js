import { defineBoot } from '#q-app/wrappers'
import { useAuthStore } from 'stores/auth'
import { api } from 'boot/axios'

export default defineBoot(({ app }) => {
  let activityTimeout
  let heartbeatInterval
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds
  const HEARTBEAT_INTERVAL = 2 * 60 * 1000 // Send heartbeat every 2 minutes

  // Function to log inactivity logout
  const logInactivityLogout = async (isAdmin = false) => {
    try {
      const endpoint = isAdmin ? '/api/admin/setlogs' : '/api/barangay/setlogs'
      const payload = {
        activity: 'Logout',
        details: 'Logged out due to inactivity'
      }
      
      // Set authorization header before logging
      const authStore = useAuthStore()
      const token = isAdmin ? authStore.adminToken : authStore.token
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      
      await api.post(endpoint, payload)
      console.log('Inactivity logout logged successfully')
    } catch (error) {
      console.warn('Failed to log inactivity logout:', error)
    }
  }

  // Function to reset inactivity timer
  const resetInactivityTimer = () => {
    if (activityTimeout) {
      clearTimeout(activityTimeout)
    }
    
    activityTimeout = setTimeout(async () => {
      // User has been inactive for 5 minutes
      console.log('User inactive for 5 minutes, logging out...')
      
      // Clear intervals
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
      }
      
      // Get auth store and determine if admin
      const authStore = useAuthStore()
      const isAdmin = !!authStore.adminToken
      
      // Log the inactivity logout before clearing auth
      await logInactivityLogout(isAdmin)
      
      // Set flag for inactivity logout dialog
      localStorage.setItem('inactivity_logout', 'true')
      
      // Clear auth state
      authStore.logout()
      
      // Redirect to login
      if (app.config.globalProperties.$router) {
        const currentPath = app.config.globalProperties.$router.currentRoute.value.path
        if (currentPath.startsWith('/admin')) {
          app.config.globalProperties.$router.push('/admin/login')
        } else {
          app.config.globalProperties.$router.push('/')
        }
      }
    }, INACTIVITY_TIMEOUT)
  }

  // Function to send heartbeat to keep session alive
  const sendHeartbeat = async () => {
    try {
      const authStore = useAuthStore()
      if (authStore.token || authStore.adminToken) {
        // Send a lightweight request to keep session alive
        const endpoint = authStore.adminToken ? '/api/admin/heartbeat' : '/api/barangay/heartbeat'
        await api.post(endpoint, { timestamp: Date.now() })
        console.log('Heartbeat sent successfully')
      }
    } catch (error) {
      console.warn('Heartbeat failed:', error)
      // If heartbeat fails, it might mean the session expired
      // The axios interceptor will handle 401 responses
    }
  }

  // Function to start activity monitoring
  const startActivityMonitoring = () => {
    // Reset timer on any user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true })
    })
    
    // Start heartbeat interval
    heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)
    
    // Initial timer reset
    resetInactivityTimer()
    
    console.log('Activity monitoring started - 5 minute inactivity timeout')
  }

  // Function to stop activity monitoring
  const stopActivityMonitoring = () => {
    if (activityTimeout) {
      clearTimeout(activityTimeout)
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
    }
    
    // Remove event listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    activityEvents.forEach(event => {
      document.removeEventListener(event, resetInactivityTimer)
    })
  }

  // Listen for session expiration events from axios interceptor
  window.addEventListener('session-expired', () => {
    // Clear the flag
    localStorage.removeItem('session_expired')
    
    // Stop activity monitoring
    stopActivityMonitoring()
    
    // Get the auth store
    const authStore = useAuthStore()
    
    // Clear auth state
    authStore.logout()
    
    // Show notification
    if (app.config.globalProperties.$q) {
      app.config.globalProperties.$q.notify({
        type: 'negative',
        message: 'Session expired. Please login again.',
        position: 'top',
        timeout: 5000,
        actions: [
          { 
            label: 'Login', 
            color: 'white', 
            handler: () => {
              // Redirect to appropriate login page
              if (app.config.globalProperties.$router) {
                const currentPath = app.config.globalProperties.$router.currentRoute.value.path
                if (currentPath.startsWith('/admin')) {
                  app.config.globalProperties.$router.push('/admin/login')
                } else {
                  app.config.globalProperties.$router.push('/')
                }
              }
            }
          }
        ]
      })
    }
    
    // Redirect to appropriate login page
    if (app.config.globalProperties.$router) {
      const currentPath = app.config.globalProperties.$router.currentRoute.value.path
      if (currentPath.startsWith('/admin')) {
        app.config.globalProperties.$router.push('/admin/login')
      } else {
        app.config.globalProperties.$router.push('/')
      }
    }
  })
  
  // Check for session expired flag on app start
  if (localStorage.getItem('session_expired')) {
    localStorage.removeItem('session_expired')
    const authStore = useAuthStore()
    authStore.logout()
  }

  // Start monitoring when the app is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startActivityMonitoring)
  } else {
    startActivityMonitoring()
  }

  // Clean up when the app is unmounted
  window.addEventListener('beforeunload', stopActivityMonitoring)
})
