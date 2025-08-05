import { usePermissionsStore } from 'stores/permissionsStore'

// Vue directive to show/hide elements based on permissions
export const vPermission = {
  beforeMount(el, binding) {
    checkPermission(el, binding)
  },
  updated(el, binding) {
    checkPermission(el, binding)
  }
}

function checkPermission(el, binding) {
  const permissionsStore = usePermissionsStore()
  const { value } = binding
  
  if (!value) {
    throw new Error('v-permission directive requires a permission value')
  }

  let hasPermission = false

  if (typeof value === 'string') {
    // Single permission: v-permission="'add'"
    hasPermission = permissionsStore.checkPermission(value)
  } else if (Array.isArray(value)) {
    // Array of permissions (any): v-permission="['add', 'edit']"
    hasPermission = permissionsStore.hasAnyPermission(value)
  } else if (typeof value === 'object') {
    // Object with options: v-permission="{ permission: 'add', requireAll: true }"
    if (value.permissions && Array.isArray(value.permissions)) {
      if (value.requireAll) {
        // All permissions required
        hasPermission = value.permissions.every(perm => 
          permissionsStore.checkPermission(perm)
        )
      } else {
        // Any permission required (default)
        hasPermission = permissionsStore.hasAnyPermission(value.permissions)
      }
    } else if (value.permission) {
      hasPermission = permissionsStore.checkPermission(value.permission)
    }
  }

  if (!hasPermission) {
    // Remove the element from DOM
    el.style.display = 'none'
    el.setAttribute('data-permission-hidden', 'true')
  } else {
    // Show the element
    el.style.display = ''
    el.removeAttribute('data-permission-hidden')
  }
}

export default vPermission