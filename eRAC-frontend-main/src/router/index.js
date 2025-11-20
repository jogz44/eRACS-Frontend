import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { useAuthStore } from '../stores/auth'
/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Add navigation guards
  Router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    // 1. Define public routes
    const publicRoutes = ['/', '/signup', '/admin/login','/forgotpage', '/reset-password']

    // 2. Check if route requires authentication
    if (!publicRoutes.includes(to.path)) {
      // 3. Check admin routes specifically
      if (to.path.startsWith('/admin')) {
        if (!authStore.adminToken) {
          // Only redirect to login if not already going there
          if (to.path !== '/admin/login') {
            authStore.adminReturnUrl = to.fullPath
            return next('/admin/login')
          }
        } else {
          // 3.1. Check if transaction pages require barangay selection
          const transactionPages = [
            '/admin/appropriation', '/admin/disbursement', '/admin/augmentation',
            '/admin/contAppropriation', '/admin/contDisbursement', '/admin/contAugmentation'
          ]

          if (transactionPages.includes(to.path)) {
            const selectedBarangay = localStorage.getItem('admin_selected_barangay')
            if (!selectedBarangay) {
              // Redirect to dashboard with a message
              if (from.path !== '/admin/dashboard') {
                return next('/admin/dashboard')
              }
            }
          }
        }
      }
      // 4. Check regular user routes
      else if (!authStore.token) {
        if (to.path !== '/') {
          authStore.returnUrl = to.fullPath
          return next('/')
        }
      }
    }

    // 5. Prevent authenticated users from accessing login pages
    if (to.path === '/' && authStore.token) {
      return next('/home/dashboard')
    }

    if (to.path === '/admin/login' && authStore.adminToken) {
      return next('/admin/dashboard')
    }

    // 6. Allow navigation in all other cases
    next()
  })

  return Router
})
