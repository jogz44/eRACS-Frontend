import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$axios
  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API

  // Set default Authorization header from localStorage
  const adminToken = localStorage.getItem('admin_token')
  const barangayToken = localStorage.getItem('barangay_token')
  
  if (adminToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`
  } else if (barangayToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${barangayToken}`
  }

  // Add response interceptor to handle 401 responses
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear tokens from localStorage
        localStorage.removeItem('admin_token')
        localStorage.removeItem('barangay_token')
        
        // Remove Authorization header
        delete api.defaults.headers.common['Authorization']
        
        // Store a flag that the session expired
        localStorage.setItem('session_expired', 'true')
        
        // Dispatch a custom event that components can listen to
        window.dispatchEvent(new CustomEvent('session-expired'))
      }
      return Promise.reject(error)
    }
  )
})

export { api }
