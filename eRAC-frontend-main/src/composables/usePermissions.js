import { computed } from 'vue'
import { usePermissionsStore } from 'stores/permissionsStore'
import { useAuthStore } from 'stores/auth'
import { useQuasar } from 'quasar'

export function usePermissions() {
  const permissionsStore = usePermissionsStore()
  const authStore = useAuthStore()
  const $q = useQuasar()

  const hasPermission = (permission) => {
    return computed(() => permissionsStore.hasPermission(permission))
  }

  const canView = computed(() => permissionsStore.canView)
  const canAdd = computed(() => permissionsStore.canAdd)
  const canEdit = computed(() => permissionsStore.canEdit)
  const canDelete = computed(() => permissionsStore.canDelete)
  const canPrint = computed(() => permissionsStore.canPrint)
  const isAdmin = computed(() => permissionsStore.isAdmin)
  const canManageUsers = computed(() => permissionsStore.canManageUsers)

  // Position-based permissions
  const isBarangayCaptain = computed(() => {
    if (!authStore.user || !authStore.user.position_name) {
      return false
    }
    return authStore.user.position_name.toLowerCase().trim() === 'barangay captain'
  })

  const hasPosition = (requiredPosition) => {
    if (!authStore.user || !authStore.user.position_name) {
      return false
    }
    return authStore.user.position_name.toLowerCase().trim() === requiredPosition.toLowerCase().trim()
  }

  const hasAnyPosition = (allowedPositions) => {
    if (!authStore.user || !authStore.user.position_name) {
      return false
    }
    const userPosition = authStore.user.position_name.toLowerCase().trim()
    return allowedPositions.some(pos => pos.toLowerCase().trim() === userPosition)
  }

  const checkPermission = (permission) => {
    return permissionsStore.checkPermission(permission)
  }

  const checkPositionPermission = (requiredPositions = ['Barangay Captain']) => {
    return hasAnyPosition(requiredPositions)
  }

  // Combined permission checking (both role-based and position-based)
  const checkCombinedPermission = (permission, requiredPositions = ['Barangay Captain']) => {
    const hasRolePermission = checkPermission(permission)
    const hasPositionPermission = checkPositionPermission(requiredPositions)
    return hasRolePermission && hasPositionPermission
  }

  const requirePermission = (permission) => {
    if (!checkPermission(permission)) {
      $q.notify({
        type: 'negative',
        message: `You don't have permission to ${permission}`,
        position: 'top'
      })
      throw new Error(`Permission denied: ${permission}`)
    }
  }

  const requirePositionPermission = (requiredPositions = ['Barangay Captain'], action = 'perform this action') => {
    if (!checkPositionPermission(requiredPositions)) {
      showPositionPermissionError(action, requiredPositions)
      throw new Error(`Position permission denied: ${requiredPositions.join(', ')}`)
    }
  }

  const requireCombinedPermission = (permission, requiredPositions = ['Barangay Captain']) => {
    if (!checkCombinedPermission(permission, requiredPositions)) {
      $q.notify({
        type: 'negative',
        message: 'Access Denied',
        caption: `You need both the '${permission}' permission and one of these positions: ${requiredPositions.join(', ')}`,
        position: 'top',
        timeout: 5000
      })
      throw new Error(`Combined permission denied: ${permission} + ${requiredPositions.join(', ')}`)
    }
  }

  const hasAnyPermission = (permissions) => {
    return computed(() => permissionsStore.hasAnyPermission(permissions))
  }

  // Helper function to show permission error
  const showPermissionError = (action = 'perform this action') => {
    $q.notify({
      type: 'negative',
      message: `You don't have permission to ${action}`,
      position: 'top'
    })
  }

  // Helper function to show position permission error
  const showPositionPermissionError = (action = 'perform this action', requiredPositions = ['Barangay Captain']) => {
    $q.notify({
      type: 'negative',
      message: 'Access Denied',
      caption: `You are not permitted to ${action}. Only ${requiredPositions.join(' or ')} can access this resource.`,
      position: 'top',
      timeout: 5000,
      actions: [
        { label: 'Dismiss', color: 'white', handler: () => {} }
      ]
    })
  }

  // Permission-aware navigation
  const navigateWithPermission = (router, path, requiredPermission) => {
    if (checkPermission(requiredPermission)) {
      router.push(path)
    } else {
      showPermissionError(`access ${path}`)
    }
  }

  // Position-aware navigation
  const navigateWithPositionPermission = (router, path, requiredPositions = ['Barangay Captain']) => {
    if (checkPositionPermission(requiredPositions)) {
      router.push(path)
    } else {
      showPositionPermissionError(`access ${path}`, requiredPositions)
    }
  }

  // Combined permission navigation
  const navigateWithCombinedPermission = (router, path, requiredPermission, requiredPositions = ['Barangay Captain']) => {
    if (checkCombinedPermission(requiredPermission, requiredPositions)) {
      router.push(path)
    } else {
      $q.notify({
        type: 'negative',
        message: 'Access Denied',
        caption: `You need both the '${requiredPermission}' permission and one of these positions: ${requiredPositions.join(', ')} to access ${path}`,
        position: 'top',
        timeout: 5000
      })
    }
  }

  // Enhanced permission checking with detailed feedback
  const checkPermissionWithFeedback = (permission, showError = true) => {
    const hasPermission = checkPermission(permission)
    if (!hasPermission && showError) {
      showPermissionError(`use ${permission}`)
    }
    return hasPermission
  }

  const checkPositionPermissionWithFeedback = (requiredPositions = ['Barangay Captain'], action = 'perform this action', showError = true) => {
    const hasPermission = checkPositionPermission(requiredPositions)
    if (!hasPermission && showError) {
      showPositionPermissionError(action, requiredPositions)
    }
    return hasPermission
  }

  // Utility to get user's current position
  const userPosition = computed(() => authStore.user?.position_name || '')

  // Utility to get all user permissions
  const userPermissions = computed(() => permissionsStore.userPermissions || [])

  // Check if user can access a specific module/feature
  const canAccessModule = (moduleName, requiredPositions = ['Barangay Captain']) => {
    return computed(() => {
      const hasModulePermission = permissionsStore.hasPermission(`access_${moduleName}`)
      const hasPositionPermission = checkPositionPermission(requiredPositions)
      return hasModulePermission && hasPositionPermission
    })
  }

  // Batch permission checking
  const checkMultiplePermissions = (permissions) => {
    return permissions.every(permission => checkPermission(permission))
  }

  const checkMultiplePositions = (positions) => {
    return hasAnyPosition(positions)
  }

  return {
    // Reactive computed permissions
    canView,
    canAdd,
    canEdit,
    canDelete,
    canPrint,
    isAdmin,
    canManageUsers,

    // Position-based permissions
    isBarangayCaptain,
    hasPosition,
    hasAnyPosition,
    userPosition,
    userPermissions,

    // Functions
    hasPermission,
    checkPermission,
    checkPositionPermission,
    checkCombinedPermission,
    requirePermission,
    requirePositionPermission,
    requireCombinedPermission,
    hasAnyPermission,
    showPermissionError,
    showPositionPermissionError,

    // Navigation functions
    navigateWithPermission,
    navigateWithPositionPermission,
    navigateWithCombinedPermission,

    // Enhanced checking with feedback
    checkPermissionWithFeedback,
    checkPositionPermissionWithFeedback,

    // Module access
    canAccessModule,

    // Batch checking
    checkMultiplePermissions,
    checkMultiplePositions,

    // Store access
    permissionsStore,
    authStore
  }
}
