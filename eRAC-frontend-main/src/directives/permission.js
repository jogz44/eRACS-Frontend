import { usePermissionsStore } from 'stores/permissionsStore'

// Vue directive to disable/hide elements based on permissions
export const vPermission = {
  beforeMount(el, binding) {
    applyPermission(el, binding)
  },
  updated(el, binding) {
    applyPermission(el, binding)
  },
  unmounted(el) {
    removeBlockHandlers(el)
  }
}

function applyPermission(el, binding) {
  const permissionsStore = usePermissionsStore()
  const { value, modifiers } = binding

  if (!value) {
    throw new Error('v-permission directive requires a permission value')
  }

  let hasPermission = false

  if (typeof value === 'string') {
    hasPermission = permissionsStore.checkPermission(value)
  } else if (Array.isArray(value)) {
    hasPermission = permissionsStore.hasAnyPermission(value)
  } else if (typeof value === 'object') {
    if (value.permissions && Array.isArray(value.permissions)) {
      hasPermission = value.requireAll
        ? value.permissions.every(perm => permissionsStore.checkPermission(perm))
        : permissionsStore.hasAnyPermission(value.permissions)
    } else if (value.permission) {
      hasPermission = permissionsStore.checkPermission(value.permission)
    }
  }

  // If lacking permission: disable by default; hide if "hide" modifier present
  if (!hasPermission) {
    if (modifiers && modifiers.hide) {
      el.style.display = 'none'
      el.setAttribute('data-permission-hidden', 'true')
    } else {
      // Visual and interactive disable
      el.style.pointerEvents = 'none'
      el.style.opacity = '0.5'
      el.setAttribute('aria-disabled', 'true')
      // Add event blockers in capture phase as a fallback for components
      addBlockHandlers(el)
      // For native button elements
      if (typeof el.disabled !== 'undefined') {
        el.disabled = true
      }
    }
  } else {
    el.style.display = ''
    el.style.pointerEvents = ''
    el.style.opacity = ''
    el.removeAttribute('data-permission-hidden')
    el.removeAttribute('aria-disabled')
    removeBlockHandlers(el)
    if (typeof el.disabled !== 'undefined') {
      el.disabled = false
    }
  }
}

function blockEvent(e) {
  e.preventDefault()
  e.stopImmediatePropagation()
  e.stopPropagation()
  return false
}

function addBlockHandlers(el) {
  el.__permHandlers = el.__permHandlers || []
  const events = ['click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'touchstart', 'touchend']
  events.forEach(evt => {
    const handler = blockEvent
    el.addEventListener(evt, handler, true)
    el.__permHandlers.push({ evt, handler })
  })
  el.setAttribute('tabindex', '-1')
}

function removeBlockHandlers(el) {
  if (el.__permHandlers) {
    el.__permHandlers.forEach(({ evt, handler }) => {
      el.removeEventListener(evt, handler, true)
    })
    el.__permHandlers = []
  }
  el.removeAttribute('tabindex')
}

export default vPermission