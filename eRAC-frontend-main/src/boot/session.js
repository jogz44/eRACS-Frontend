import { defineBoot } from '#q-app/wrappers'
import { useAuthStore } from 'stores/auth'
import { api } from 'boot/axios'

export default defineBoot(({ app }) => {
  let heartbeatInterval
  let monitorInterval
  let lastActivityAt = Date.now()
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds
  const HEARTBEAT_INTERVAL = 2 * 60 * 1000 // Send heartbeat every 2 minutes
  const MONITOR_INTERVAL = 10 * 1000 // Check inactivity every 10s

  // Function to log inactivity logout

  const performLogoutForInactivity = async () => {
    console.log('User inactive for 5 minutes, logging out...')

    // Clear intervals
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
    if (monitorInterval) {
      clearInterval(monitorInterval)
      monitorInterval = null
    }

    // Get auth store and determine if admin
    const authStore = useAuthStore()
    const isAdmin = !!authStore.adminToken
    
    try {
      // Call the backend inactivity logout endpoint to delete tokens
      const endpoint = isAdmin ? '/api/admin/inactivity-logout' : '/api/barangay/inactivity-logout'
      const token = isAdmin ? authStore.adminToken : authStore.token
      
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        await api.post(endpoint)
        console.log('Backend inactivity logout successful')
      }
    } catch (error) {
      console.warn('Backend inactivity logout failed:', error)
      // Continue with frontend logout even if backend fails
    }
    
    // Set flag for inactivity logout dialog
    localStorage.setItem('inactivity_logout', 'true')
    
    // Clear auth state
    await authStore.logout()
    
    // Redirect to login
    if (app.config.globalProperties.$router) {
      const currentPath = app.config.globalProperties.$router.currentRoute.value.path
      if (currentPath.startsWith('/admin')) {
        app.config.globalProperties.$router.push('/admin/login')
      } else {
        app.config.globalProperties.$router.push('/')
      }
    }
  }

  // Function to send heartbeat to keep session alive
  const sendHeartbeat = async () => {
    try {
      const authStore = useAuthStore()
      
      // Check if user is still authenticated
      if (!authStore.token && !authStore.adminToken) {
        console.log('User not authenticated, stopping heartbeat')
        stopActivityMonitoring()
        return
      }

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

  // Update last activity timestamp on genuine user actions
  const markActivity = () => {
    lastActivityAt = Date.now()
  }

  // Function to start activity monitoring
  const startActivityMonitoring = () => {
    const authStore = useAuthStore()
    
    // Only start monitoring if user is authenticated
    if (!authStore.token && !authStore.adminToken) {
      console.log('User not authenticated, skipping activity monitoring')
      return
    }

    console.log('Starting activity monitoring for authenticated user')
    
    // Reset timestamp on user activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'click'] // removed scroll
    activityEvents.forEach(event => {
      document.addEventListener(event, markActivity, { passive: true })
    })

    // Track visibility changes (hidden tabs should still count towards inactivity)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // When returning to tab, mark activity once
        markActivity()
      }
    })
    window.addEventListener('focus', markActivity)

    // Start heartbeat interval
    heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)
    
    // Start monitor interval that logs out when elapsed exceeds timeout
    lastActivityAt = Date.now()
    monitorInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityAt
      // If page is hidden, we still use the same elapsed rule (no auto activity)
      if (elapsed >= INACTIVITY_TIMEOUT) {
        performLogoutForInactivity()
      }
    }, MONITOR_INTERVAL)

    console.log('Activity monitoring started - 5 minute inactivity timeout')
  }

  // Function to stop activity monitoring
  const stopActivityMonitoring = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
    if (monitorInterval) {
      clearInterval(monitorInterval)
      monitorInterval = null
    }
    
    // Remove event listeners
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'click']
    activityEvents.forEach(event => {
      document.removeEventListener(event, markActivity)
    })
    document.removeEventListener('visibilitychange', markActivity)
    window.removeEventListener('focus', markActivity)
    
    console.log('Activity monitoring stopped')
  }

  // Function to check authentication status and manage monitoring
  const checkAuthAndManageMonitoring = () => {
    const authStore = useAuthStore()
    
    if (authStore.token || authStore.adminToken) {
      // User is authenticated, start monitoring if not already running
      if (!heartbeatInterval && !monitorInterval) {
        startActivityMonitoring()
      }
    } else {
      // User is not authenticated, stop monitoring
      if (heartbeatInterval || monitorInterval) {
        stopActivityMonitoring()
      }
    }
  }

  // Listen for session expiration events from axios interceptor
  window.addEventListener('session-expired', async () => {
    // Clear the flag
    localStorage.removeItem('session_expired')
    
    // Stop activity monitoring
    stopActivityMonitoring()
    
    // Get the auth store
    const authStore = useAuthStore()
    
    // Clear auth state
    await authStore.logout()
    
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
    document.addEventListener('DOMContentLoaded', () => {
      // Check authentication status after DOM is loaded
      setTimeout(checkAuthAndManageMonitoring, 100)
    })
  } else {
    // DOM already loaded, check immediately
    setTimeout(checkAuthAndManageMonitoring, 100)
  }

  // Clean up when the app is unmounted
  window.addEventListener('beforeunload', stopActivityMonitoring)

  // Listen for storage changes to detect logout
  window.addEventListener('storage', (event) => {
    if (event.key === 'barangay_token' || event.key === 'admin_token') {
      if (!event.newValue) {
        // Token was removed (user logged out)
        console.log('Token removed from storage, stopping activity monitoring')
        stopActivityMonitoring()
      } else if (event.newValue && !heartbeatInterval && !monitorInterval) {
        // Token was added (user logged in)
        console.log('Token added to storage, starting activity monitoring')
        setTimeout(checkAuthAndManageMonitoring, 100)
      }
    }
  })
})
