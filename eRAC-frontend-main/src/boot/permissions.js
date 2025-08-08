import { boot } from 'quasar/wrappers'
import { usePermissionsStore } from 'stores/permissionsStore'
import vPermission from 'src/directives/permission'

export default boot(({ app, router }) => {
  // Register the permission directive globally
  app.directive('permission', vPermission)

  // Initialize permissions store on app start
  const permissionsStore = usePermissionsStore()
  
  // Load permissions when the app boots (if user is logged in)
  const token = localStorage.getItem('barangay_token')
  if (token) {
    permissionsStore.loadUserPermissions().catch(error => {
      console.warn('Failed to load permissions on boot:', error)
    })
  }

  // Add router guard to check permissions for protected routes
  router.beforeEach((to, from, next) => {
    // Check if route requires specific permissions
    if (to.meta?.requiresPermission) {
      const permission = to.meta.requiresPermission
      
      if (!permissionsStore.checkPermission(permission)) {
        // Redirect to unauthorized page or show error
        next({
          name: 'ErrorNotFound',
          query: { reason: 'permission_denied', required: permission }
        })
        return
      }
    }
    
    next()
  })
})