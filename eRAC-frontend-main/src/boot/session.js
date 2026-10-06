import { defineBoot } from '#q-app/wrappers'
import { useAuthStore } from 'stores/auth'
import { api } from 'boot/axios'

export default defineBoot(({ app }) => {
  let heartbeatInterval = null
  let monitorInterval = null
  let lastActivityAt = Date.now()
  let isMonitoring = false

  const INACTIVITY_TIMEOUT = 50 * 60 * 1000 // 50 minutes in milliseconds
  const HEARTBEAT_INTERVAL = 2 * 60 * 1000 // Send heartbeat every 2 minutes
  const MONITOR_INTERVAL = 10 * 1000 // Check inactivity every 10s

  // Function to send heartbeat to keep session alive
  const sendHeartbeat = async () => {
    try {
      const authStore = useAuthStore()

      // Check if user is still authenticated
      if (!authStore.token && !authStore.adminToken) {
        stopActivityMonitoring()
        return
      }

      if (authStore.token || authStore.adminToken) {
        // Send a lightweight request to keep session alive
        const endpoint = authStore.adminToken ? '/api/admin/heartbeat' : '/api/barangay/heartbeat'
        const token = authStore.adminToken ? authStore.adminToken : authStore.token

        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          await api.post(endpoint, { timestamp: Date.now() })
        }
      }
    } catch (error) {
      console.log('Heartbeat failed:', error)
    }
  }

  // Update last activity timestamp on genuine user actions
  const markActivity = () => {
    const authStore = useAuthStore()
    // Only mark activity if user is authenticated
    if (authStore.token || authStore.adminToken) {
      lastActivityAt = Date.now()
    }
  }

  // Function to perform logout due to inactivity
  const performLogoutForInactivity = async () => {
    console.log('⏰ User inactive for 5 minutes, logging out...')

    // Clear intervals
    stopActivityMonitoring()

    // Get auth store and determine if admin
    const authStore = useAuthStore()
    const isAdmin = !!authStore.adminToken
    const token = isAdmin ? authStore.adminToken : authStore.token

    try {
      // Call the backend inactivity logout endpoint to delete tokens
      if (token) {
        const endpoint = isAdmin
          ? '/api/admin/inactivity-logout'
          : '/api/barangay/inactivity-logout'
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        await api.post(endpoint)
      }
    } catch (error) {
      console.warn('Backend inactivity logout failed:', error)
      // Continue with frontend logout even if backend fails
    }

    // Set flag for inactivity logout dialog
    localStorage.setItem('inactivity_logout', 'true')

    // Clear auth state (without calling backend logout again)
    authStore.user = null
    authStore.token = null
    authStore.admin = null
    authStore.adminToken = null

    // Clear localStorage
    localStorage.removeItem('user_data')
    localStorage.removeItem('barangay_token')
    localStorage.removeItem('admin_data')
    localStorage.removeItem('admin_token')

    // Clear axios headers
    delete api.defaults.headers.common['Authorization']

    // Clear any other stored data
    localStorage.removeItem('acceptedUsers')

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

  // Function to start activity monitoring
  const startActivityMonitoring = () => {
    const authStore = useAuthStore()

    // Only start monitoring if user is authenticated
    if (!authStore.token && !authStore.adminToken) {
      return
    }

    // Prevent multiple monitoring sessions
    if (isMonitoring) {
      return
    }
    isMonitoring = true

    // Reset timestamp on user activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'click']
    activityEvents.forEach((event) => {
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

      if (elapsed >= INACTIVITY_TIMEOUT) {
        performLogoutForInactivity()
      }
    }, MONITOR_INTERVAL)
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
    activityEvents.forEach((event) => {
      document.removeEventListener(event, markActivity)
    })
    document.removeEventListener('visibilitychange', markActivity)
    window.removeEventListener('focus', markActivity)

    isMonitoring = false
  }

  // Function to check authentication status and manage monitoring
  const checkAuthAndManageMonitoring = () => {
    const authStore = useAuthStore()
    const hasAuth = !!(authStore.token || authStore.adminToken)

    if (hasAuth) {
      // User is authenticated, start monitoring if not already running
      if (!isMonitoring) {
        startActivityMonitoring()
      }
    } else {
      // User is not authenticated, stop monitoring
      if (isMonitoring) {
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

  // Initialize monitoring when the app is ready
  const initializeMonitoring = () => {
    setTimeout(checkAuthAndManageMonitoring, 100)
  }

  // Start monitoring when the app is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMonitoring)
  } else {
    // DOM already loaded, check immediately
    initializeMonitoring()
  }

  // Clean up when the app is unmounted
  window.addEventListener('beforeunload', () => {
    stopActivityMonitoring()
  })

  // Listen for storage changes to detect logout/login
  window.addEventListener('storage', (event) => {
    if (event.key === 'barangay_token' || event.key === 'admin_token') {
      if (!event.newValue) {
        // Token was removed (user logged out)
        stopActivityMonitoring()
      } else if (event.newValue && !isMonitoring) {
        // Token was added (user logged in)
        setTimeout(checkAuthAndManageMonitoring, 100)
      }
    }
  })

  // Only manage monitor state when auth changes or when the page is first loaded.
  // Repeating a 5 second check here creates timer-driven traffic and can appear
  // as a constant loop in the network tab even when there is no real failure.
})
