import { computed } from 'vue'
import { usePermissionsStore } from 'stores/permissionsStore'
import { useQuasar } from 'quasar'

export function usePermissions() {
  const permissionsStore = usePermissionsStore()
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

  const checkPermission = (permission) => {
    return permissionsStore.checkPermission(permission)
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

  // Permission-aware navigation
  const navigateWithPermission = (router, path, requiredPermission) => {
    if (checkPermission(requiredPermission)) {
      router.push(path)
    } else {
      showPermissionError(`access ${path}`)
    }
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
    
    // Functions
    hasPermission,
    checkPermission,
    requirePermission,
    hasAnyPermission,
    showPermissionError,
    navigateWithPermission,
    
    // Store access
    permissionsStore
  }
}