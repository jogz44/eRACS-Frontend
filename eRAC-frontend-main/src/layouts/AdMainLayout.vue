<template>
  <q-layout view="lHh Lpr lFf" class="admin-layout">
    <!-- HEADER -->
    <q-header elevated class="custom-header">
      <q-toolbar class="q-pr-md items-center" style="justify-content: space-between;">
         <div style="display: flex; align-items: center;">
        <q-btn
           v-if="$q.screen.lt.md && authStore.admin?.name"
          flat
          round
          dense
          icon="menu"
          class="q-mr-sm"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <div v-if="$q.screen.lt.md && authStore.admin?.name" class="barangay-mobile-title text-weight-bold q-mr-md">
          Welcome, {{ authStore.admin?.name || 'Admin' }}
        </div>
        <q-space v-if="$q.screen.lt.md" />
        <q-toolbar-title
          v-if="$q.screen.gt.sm"
          class="welcome-title"
          style="color: white; font-weight: bold ;"
        >
          Welcome, {{ authStore.admin?.name || 'Admin' }}

        </q-toolbar-title>
        </div>

        <q-space/>

        <div class="row items-center q-gutter-sm">
          <q-select
            outlined
            dense
            bg-color="light-green-1 "
            label="Select Barangay"
            placeholder="Choose a barangay to enable transactions"
            color="green"
            class="q-mb-sm q-pt-sm"
            style="width: 200px;"
            emit-value
            map-options
            v-model="barangay"
            :options="barangayOptions"
            option-label="name"
            option-value="id"
            @update:model-value="onBarangayChange"
          />

        </div>
      </q-toolbar>
    </q-header>



    <!-- DRAWER -->
    <q-drawer
      v-model="leftDrawerOpen"
      :width="$q.screen.lt.md ? 220 : 300"
      :breakpoint="767"
      :show-if-above="$q.screen.gt.sm"
      bordered
      class="custom-card-drawer drawer-fixed"
      :class="{ 'drawer-mobile': $q.screen.lt.md }"
    >
      <div class="drawer-content">
        <!-- Logo & Title Section -->
        <div class="logo-section">
          <q-item class="row items-center q-pt-md" style="padding: 5px;">
            <img
              src="src/assets/tagumlogo.png"
              alt="ERACS Logo"
              style="width: 100px; height: 75px; max-width: 100%; height: auto;"
              class="q-mb-sm"
            />
            <q-item-label class="eracs-title text-center" style="font-size: small;color: black; font-style: normal;">
              Electronic Registry of Appropriation and Commitment System (eRACs)
            </q-item-label>
          </q-item>
        </div>

        <!-- Main Functions Section -->
        <!-- All admin types (Super Admin, COA) can access these functions -->
        <div class="favorites-section">
          <div class="section-title">Main Functions </div>
          <div class="favorites-list q-pa-sm">
            <div
              v-for="favorite in favorites"
              :key="favorite.title"
              class="favorite-item"
              @click="favorite.type === 'panel' ? togglePanel(favorite.panelType) : navigateToFavorite(favorite.link)"
            >
              <q-icon :name="favorite.icon" size="16px" />
              <span class="favorite-title">{{ favorite.title }}</span>
              <q-icon v-if="favorite.type === 'panel'" name="chevron_right" size="14px" class="panel-indicator" />
            </div>
          </div>
        </div>

        <!-- Collapsed Transactions for COA -->
        <!-- Super Admin sees sliding panel, COA sees collapsed view -->
        <div v-if="!authStore.canManageUsers" class="collapsed-transactions-section">
          <!-- Current Transactions -->
          <div class="transaction-group">
            <div class="transaction-group-title">Current Transactions</div>
            <div
              class="transaction-item"
              :class="{ 'disabled': !isBarangaySelected }"
              @click="navigateTo('/admin/appropriation')"
            >
              <q-icon name="account_balance" size="16px" />
              <span>Appropriation</span>
              <q-icon v-if="!isBarangaySelected" name="info" size="14px" color="orange" class="q-ml-sm" />
            </div>
            <div
              class="transaction-item"
              :class="{ 'disabled': !isBarangaySelected }"
              @click="navigateTo('/admin/disbursement')"
            >
              <q-icon name="payments" size="16px" />
              <span>Disbursement</span>
              <q-icon v-if="!isBarangaySelected" name="info" size="14px" color="orange" class="q-ml-sm" />
            </div>
            <div
              class="transaction-item"
              :class="{ 'disabled': !isBarangaySelected }"
              @click="navigateTo('/admin/augmentation')"
            >
              <q-icon name="add_circle" size="16px" />
              <span>Augmentation</span>
              <q-icon v-if="!isBarangaySelected" name="info" size="14px" color="orange" class="q-ml-sm" />
            </div>
          </div>

          <!-- Continuing Transactions -->
          <div class="transaction-group">
            <div class="transaction-group-title">Continuing Transactions</div>
            <div
              class="transaction-item"
              :class="{ 'disabled': !isBarangaySelected }"
              @click="navigateTo('/admin/contAppropriation')"
            >
              <q-icon name="account_balance_wallet" size="16px" />
              <span>Appropriation</span>
              <q-icon v-if="!isBarangaySelected" name="info" size="14px" color="orange" class="q-ml-sm" />
            </div>
            <div
              class="transaction-item"
              :class="{ 'disabled': !isBarangaySelected }"
              @click="navigateTo('/admin/contDisbursement')"
            >
              <q-icon name="credit_card" size="16px" />
              <span>Disbursement</span>
              <q-icon v-if="!isBarangaySelected" name="info" size="14px" color="orange" class="q-ml-sm" />
            </div>

          </div>
        </div>

        <!-- User Management Section -->
        <div v-if="authStore.canManageUsers" class="saved-searches-section">
          <div class="section-title">User Management</div>
          <div class="saved-searches-list q-pa-sm">
            <div
              v-for="search in savedSearches"
              :key="search.title"
              class="saved-search-item"
              @click="navigateToSearch(search.link)"
            >
              <q-icon :name="search.icon" size="16px" />
              <span class="search-title">{{ search.title }}</span>
            </div>
          </div>
        </div>

        <!-- Sticky Footer -->
        <div class="drawer-footer q-mt-auto q-pa-xs">
          <div class="text-caption text-grey items-center q-pa-sm footer-avatar">
            <div class="footer-user q-pa-sm">
              <q-avatar size="$q.screen.lt.md ? '32px' : '45px'">
                <img src="src/assets/admin.png" style="max-width: 100%; height: auto;" />
              </q-avatar>
              <div class="footer-user-info">
                <span class="Custom-text text-caption text-white text-weight-bold">
                  {{ authStore.admin?.name || 'Admin' }}
                </span>
                <span class="position-text text-caption text-white text-weight-medium text-h5">
                  {{ getRoleDisplayName() }}
                </span>
              </div>
              <q-space />
              <q-btn
                icon="logout"
                color="white"
                flat
                round
                dense
                @click="handleLogout"
              >
                <q-tooltip>Log Out</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>
      </div>
    </q-drawer>

    <!-- Sliding Panels -->
    <!-- Transactions Panel - Only for Super Admin -->
    <div
      v-if="authStore.canManageUsers"
      class="sliding-panel transactions-panel"
      :class="{ 'panel-open': activePanel === 'transactions' }"
      v-show="activePanel === 'transactions'"
    >
      <div class="panel-header">
        <div class="panel-title">Transactions</div>
        <q-btn flat round dense icon="close" @click="closePanel" class="close-btn" />
      </div>
      <div class="panel-content">
        <!-- Current Transactions -->
        <div class="panel-section">
          <div class="panel-section-title">Current</div>
          <div
            class="panel-item"
            :class="{ 'disabled': !isBarangaySelected }"
            @click="navigateTo('/admin/appropriation')"
          >
            <div class="colored-dot dot-pink"></div>
            <span>Appropriation</span>
            <q-icon v-if="!isBarangaySelected" name="info" size="14px" color="orange" class="q-ml-sm" />
          </div>
          <div
            class="panel-item"
            :class="{ 'disabled': !isBarangaySelected }"
            @click="navigateTo('/admin/disbursement')"
          >
            <div class="colored-dot dot-red"></div>
            <span>Disbursement</span>
            <q-icon v-if="!isBarangaySelected" name="info" size="14px" color="orange" class="q-ml-sm" />
          </div>
          <div
            class="panel-item"
            :class="{ 'disabled': !isBarangaySelected }"
            @click="navigateTo('/admin/augmentation')"
          >
            <div class="colored-dot dot-blue"></div>
            <span>Augmentation</span>
            <q-icon v-if="!isBarangaySelected" name="info" size="14px" color="orange" class="q-ml-sm" />
          </div>
        </div>
        <!-- Continuing Transactions -->
        <div class="panel-section">
          <div class="panel-section-title">Continuing</div>
          <div
            class="panel-item"
            :class="{ 'disabled': !isBarangaySelected }"
            @click="navigateTo('/admin/contAppropriation')"
          >
            <div class="colored-dot dot-orange"></div>
            <span>Appropriation</span>
            <q-icon v-if="!isBarangaySelected" name="info" size="14px" color="orange" class="q-ml-sm" />
          </div>
          <div
            class="panel-item"
            :class="{ 'disabled': !isBarangaySelected }"
            @click="navigateTo('/admin/contDisbursement')"
          >
            <div class="colored-dot dot-purple"></div>
            <span>Disbursement</span>
            <q-icon v-if="!isBarangaySelected" name="info" size="14px" color="orange" class="q-ml-sm" />
          </div>

        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div
      v-if="activePanel && authStore.canManageUsers"
      class="panel-backdrop"
      @click="closePanel"
    ></div>

    <!-- MAIN CONTENT -->
    <q-page-container style="background: #D9D9D9; min-height: 100vh;">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { api } from 'boot/axios'


const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const leftDrawerOpen = ref(false)
const activePanel = ref(null)
const barangayOptions = ref([])
const barangay = ref(null)

onMounted(async () => {
  try {
    // Load barangay options with admin token
    const response = await api.get('/api/barangay/barangays', {
      headers: {
        Authorization: `Bearer ${authStore.adminToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
    if (response.data && Array.isArray(response.data)) {
      barangayOptions.value = response.data.map((b) => ({
        name: b.name,
        id: b.id,
      }))

      // Restore barangay selection from localStorage first
      const savedBarangayId = localStorage.getItem('admin_selected_barangay')
      if (savedBarangayId) {
        barangay.value = parseInt(savedBarangayId)
        // Update reactive state
        authStore.selectedBarangay = parseInt(savedBarangayId)
        authStore.selectedBarangayName = localStorage.getItem('admin_selected_barangay_name') || null
      }
    }
  } catch (error) {
    console.error('Error loading setup data:', error)
    // Don't show notification if it might break the page
    // Just log the error for debugging
  }
})

// Check if barangay is selected
const isBarangaySelected = computed(() => {
  return barangay.value !== null && barangay.value !== undefined
})

// Show info notification when no barangay is selected on load
watch(isBarangaySelected, (newValue, oldValue) => {
  if (!newValue && oldValue !== undefined && !authStore.isLoggingOut && authStore.admin && router.currentRoute.value.path !== '/admin/login') {
    setTimeout(() => {
      if (!isBarangaySelected.value && !authStore.isLoggingOut && authStore.admin && router.currentRoute.value.path !== '/admin/login') {
        $q.notify({
          type: 'info',
          message: 'Select a barangay from the dropdown to access transaction features',
          position: 'top',
          timeout: 6000,
          icon: 'info',
          color: 'blue',
          textColor: 'white',
          actions: [
            { label: 'OK', color: 'white', handler: () => {} }
          ]
        })
      }
    }, 1000)
  }
}, { immediate: false })

// Admin functions data
const favorites = computed(() => {
  const baseFavorites = [
    { title: 'Dashboard', link: '/admin/dashboard', icon: 'dashboard' },
    { title: 'Reports', link: '/admin/reportPage', icon: 'assessment' },

  ]
  if (authStore.canManageUsers) {
    baseFavorites.push({ title: 'Transactions', type: 'panel', panelType: 'transactions', icon: 'account_balance_wallet' })
  }
  return baseFavorites
})

// User management data
const savedSearches = ref([
  { title: 'User Access', link: '/admin/userAccess', icon: 'admin_panel_settings' },
  { title: 'Pending Users', link: '/admin/usercontrol/pending', icon: 'pending' },

  { title: 'Accepted Users', link: '/admin/usercontrol/accepted', icon: 'check_circle' },
  { title: 'Logs', link: '/admin/logs', icon: 'history' }
])

const navigateToFavorite = (link) => {
  router.push(link)
  closePanel()
}

const navigateToSearch = (link) => {
  // Only allow super admin to access user management
  if (!authStore.canManageUsers) {
    $q.notify({
      type: 'warning',
      message: 'Access denied. Only Admins can manage users.',
      position: 'top',
    })
    return
  }
  router.push(link)
}

const navigateTo = (link) => {
  // Check if trying to access transaction pages
  const transactionPages = [
    '/admin/appropriation',
    '/admin/disbursement',
    '/admin/augmentation',
    '/admin/contAppropriation',
    '/admin/contDisbursement'
  ]

  if (transactionPages.includes(link) && !isBarangaySelected.value) {
    $q.notify({
      type: 'info',
      message: 'Please select a barangay first to access transaction features',
      position: 'top',
      timeout: 5000,
      icon: 'info',
      color: 'blue',
      textColor: 'white',
      actions: [
        { label: 'Got it', color: 'white', handler: () => {} }
      ]
    })
    return
  }

  router.push(link)
  // Close the panel after navigation
  closePanel()
  if ($q.screen.lt.md) {
    leftDrawerOpen.value = false
  }
}

const togglePanel = (panelType) => {
  if (activePanel.value === panelType) {
    closePanel()
  } else {
    activePanel.value = panelType
    nextTick(() => {
      // Ensure panel is properly positioned for middle-left animation
      const panel = document.querySelector('.sliding-panel.panel-open')
      if (panel) {
        panel.style.transform = 'translate(0, -50%)'
      }
    })
  }
}

const closePanel = () => {
  const panel = document.querySelector('.sliding-panel.panel-open')
  if (panel) {
    panel.style.transform = 'translate(-100%, -50%)'
    setTimeout(() => {
      activePanel.value = null
    }, 300)
  } else {
    activePanel.value = null
  }
}

const getRoleDisplayName = () => {
  if (authStore.isSuperAdmin) return 'Accounting Office'
  if (authStore.isCOA) return 'COA'
  return 'Administrator'
}

const handleLogout = async () => {
  $q.dialog({
    title: 'Confirm Logout',
    message: 'Are you sure you want to logout?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    // Clear barangay selection before logout
    barangay.value = null
    localStorage.removeItem('admin_selected_barangay')
    localStorage.removeItem('admin_selected_barangay_name')

    // Clear barangay selection from auth store
    authStore.selectedBarangay = null
    authStore.selectedBarangayName = null

    await authStore.adminLogout()
    router.push('/admin/login')
  })
}

                    const onBarangayChange = async (barangayId) => {
                      try {
                        // Save to localStorage for persistence across page refreshes
                        if (barangayId) {
                          localStorage.setItem('admin_selected_barangay', barangayId.toString())
                          // Update reactive state
                          authStore.selectedBarangay = barangayId
                          // Save barangay name for later display/logging
                          try {
                            const selected = (barangayOptions.value || []).find(b => b.id === barangayId)
                            if (selected?.name) {
                              localStorage.setItem('admin_selected_barangay_name', selected.name)
                              authStore.selectedBarangayName = selected.name
                            }
                          } catch (error) {
                            console.error('Error saving barangay selection:', error)
                          }
                        } else {
                          localStorage.removeItem('admin_selected_barangay')
                          localStorage.removeItem('admin_selected_barangay_name')
                          // Update reactive state
                          authStore.selectedBarangay = null
                          authStore.selectedBarangayName = null
                          // Show warning notification
                          $q.notify({
                            type: 'warning',
                            message: 'No barangay selected - all data will be shown',
                            icon: 'warning',
                            position: 'top',
                          })
                        }

                        // Refresh only the current page's store with new barangay filter
                        try {
                          const currentRoute = router.currentRoute.value.path

                          if (currentRoute.includes('/admin/transaction/appropriation')) {
                            // On appropriation page - only refresh appropriation store
                            const { useAppropriationStore } = await import('stores/appropriationStore')
                            const appropriationStore = useAppropriationStore()
                            await appropriationStore.fetchBudgets()
                          } else if (currentRoute.includes('/admin/transaction/disbursement')) {
                            // On disbursement page - only refresh disbursement store
                            const { useDisbursementStore } = await import('stores/disbursementStore')
                            const disbursementStore = useDisbursementStore()
                            await disbursementStore.fetchDisbursements()
                          } else if (currentRoute.includes('/admin/transaction/augmentation')) {
                            // On augmentation page - only refresh augmentation store
                            const { useAugmentationStore } = await import('stores/augmentation')
                            const augmentationStore = useAugmentationStore()
                            await augmentationStore.fetchAugmentations()
                          } else if (currentRoute.includes('/admin/reportPage')) {
                            // On reports page - refresh report store expense classes
                            const { useReportStore } = await import('stores/reportStore')
                            const reportStore = useReportStore()
                            if (barangayId) {
                              // Store current selections before fetching
                              const currentSelected = reportStore.expenseSelectedCurrent
                              const continuingSelected = reportStore.expenseSelectedContinuing

                              await reportStore.fetchExpenseClassesForBarangay(barangayId)

                              // Try to preserve selections by finding matching names
                              if (currentSelected?.name) {
                                const matchingOption = reportStore.expenseOptionsCurrent.find(opt => opt.name === currentSelected.name)
                                reportStore.expenseSelectedCurrent = matchingOption || null
                              }

                              if (continuingSelected?.name) {
                                const matchingOption = reportStore.expenseOptionsContinuing.find(opt => opt.name === continuingSelected.name)
                                reportStore.expenseSelectedContinuing = matchingOption || null
                              }
                            }
                          } else {
                            // On other admin pages - refresh all stores (dashboard, etc.)
                            const { useAppropriationStore } = await import('stores/appropriationStore')
                            const { useDisbursementStore } = await import('stores/disbursementStore')
                            const { useAugmentationStore } = await import('stores/augmentation')

                            const appropriationStore = useAppropriationStore()
                            const disbursementStore = useDisbursementStore()
                            const augmentationStore = useAugmentationStore()

                            await Promise.all([
                              appropriationStore.fetchBudgets(),
                              disbursementStore.fetchDisbursements(),
                              augmentationStore.fetchAugmentations()
                            ])
                          }
                        } catch (error) {
                          // Handle 401 Unauthorized - token expired
                          if (error.response?.status === 401) {
                            console.warn('Admin token expired during barangay change, logging out...')
                            await authStore.adminLogout(router)
                            return
                          }
                          console.error('Error refreshing stores with new barangay filter:', error)
                        }
                      } catch (error) {
                        console.error('Error updating barangay filter:', error)
                      }
                    }

// Note: Stores now get barangay ID directly from auth store, so no need to watch store changes

const handleKeydown = (event) => {
  if (event.key === 'Escape' && activePanel.value) {
    closePanel()
  }
}

// Redirect to login if not authenticated
const token = localStorage.getItem('admin_token');
if (token) {
  authStore.adminToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
} else {
  router.replace('/admin/login')
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

watch(
  () => authStore.adminToken,
  (token) => {
    if (!token) {
      router.replace('/admin/login')
    }
  }
)


</script>

<style>
.custom-card-drawer {
  position: sticky;
  background: linear-gradient(30deg, #187C19, #E0FFE7, #187C19);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding-top: 0;
  overflow: hidden;
  overflow-x: hidden;
  border-right: 1px solid #e0e0e0;
}

.Custom-text {
  font-size: 18px;
  color: black !important;
}

.custom-header {
  background: #0E780E;
  justify-content: center;
  border-left: black;
  margin-left: -2px;
}

.eracs-title {
  color: black;
  font-size: 0.95rem;
  font-weight: bolder;
  text-align: center;
}

.nav-links {
  color: black;
  padding: 0;
  margin: 0;
  overflow-x: hidden;
}

.drawer-fixed {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.logo-section {
  position: relative;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: black;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 16px 2px 16px;
  margin-top: 0;
}

/* Main Functions Section */
.favorites-section {
  border-top: 1px solid black;
  padding-top: 8px;
  padding-bottom: 8px;
}

.favorites-list {
  padding: 0 8px;
  width: 95%;
  max-width: 280px;
  margin: 0 auto;
}

.favorite-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white !important;
  background-color: #69B31E;
  box-shadow: 0 4px 8px rgba(82, 140, 24, 0.4);
}

.favorite-item:hover {
  background-color: #0E780E;
}

.favorite-title {
  margin-left: 12px;
  font-size: 15px;
  font-weight: 500;
  color: white !important;
}

/* User Management Section */
.saved-searches-section {
  border-top: 1px solid black;
  padding-top: 8px;
  padding-bottom: 8px;
}

.saved-searches-list {
  padding: 0 8px;
  width: 95%;
  max-width: 280px;
  margin: 0 auto;
}

/* Layout Styles */
.admin-layout {
  overflow-x: hidden;
}

.saved-search-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white !important;
  background-color: #69B31E;
  box-shadow: 0 4px 8px rgba(82, 140, 24, 0.4);
}

.saved-search-item:hover {
  background-color: #0E780E;
}

.search-title {
  margin-left: 12px;
  font-size: 15px;
  font-weight: 500;
  color: white !important;
}

/* Added panel indicator styles */
.panel-indicator {
  margin-left: auto;
  color: #666;
  transition: transform 0.2s ease;
}

.favorite-item:hover .panel-indicator {
  transform: translateX(2px);
  color: #69B31E;
}

/* Added complete sliding panel styles */
/* Improved Sliding Panels */
.sliding-panel {
  position: fixed;
  top: 50%;
  left: 0;
  width: 280px;
  height: auto;
  max-height: 600px;
  background: linear-gradient(30deg, #187C19 0%, #E0FFE7 50%, #187C19 100%);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  z-index: 3000;
  transform: translate(-100%, -50%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border-radius: 0 12px 12px 0;
}

.sliding-panel.panel-open {
  transform: translate(0, -50%) !important;
}

.panel-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 2500;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(76, 175, 80, 0.2);
  background-color: rgba(76, 175, 80, 0.05);
  backdrop-filter: blur(2px);
  border-radius: 0 12px 0 0;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: black;
  text-shadow: none;
}

.close-btn {
  color: black;
  transition: all 0.2s ease;
  background-color: rgba(76, 175, 80, 0.1);
  border-radius: 50%;
}

.close-btn:hover {
  color: #1a5c1d;
  background-color: rgba(76, 175, 80, 0.2);
  transform: scale(1.1);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px;
}

.panel-section {
  margin-bottom: 16px;
}

.panel-section-title {
  font-size: 12px;
  font-weight: 600;
  color: black;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid black;
}

.panel-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  margin: 3px 0;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white !important;
  background-color: #69B31E;
  border: 1px solid rgba(76, 175, 80, 0.1);
}

.panel-item:hover {
  background-color: #187C19;
  transform: translateX(3px);
  border-color: rgba(76, 175, 80, 0.3);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
}

.panel-item span {
  margin-left: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
}

/* Colored dots for panel items */
.colored-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: none;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.dot-pink {
  background: #ff6b9d;
}

.dot-red {
  background: #ff5a5a;
}

.dot-blue {
  background: #4a90e2;
}

.dot-light-blue {
  background: #7ed3f4;
}

.dot-green {
  background: #09410b;
}

.dot-orange {
  background: #ff9800;
}

.dot-purple {
  background: #9c27b0;
}

.dot-grey {
  background: #9e9e9e;
}

/* Responsive panel styles */
@media (max-width: 767px) {
  .sliding-panel {
    width: 260px;
    max-height: 550px;
  }
  .panel-header {
    padding: 12px 16px;
  }
  .panel-content {
    padding: 12px 16px;
  }
  .panel-item {
    padding: 8px 12px;
    margin: 2px 0;
  }
  .panel-item span {
    font-size: 13px;
  }
}

@media (max-width: 500px) {
  .sliding-panel {
    width: 240px;
    max-height: 500px;
  }
  .panel-header {
    padding: 10px 14px;
  }
  .panel-content {
    padding: 10px 14px;
  }
  .panel-item {
    padding: 6px 10px;
    margin: 2px 0;
  }
  .panel-item span {
    font-size: 12px;
  }
}

/* Legacy styles for backward compatibility */
.drawer-content .nav-links {
  flex: 1 1 auto;
  overflow-y: auto;
}

.drawer-footer {
  justify-content: space-between;
  flex-shrink: 0;
  background-color: #0E780E;
  height: 12%;
}

.avatar-footer {
  display: flex;
  justify-content: end;
  align-items: center;
  padding: 10px;
}

.barangay-mobile-title {
  font-size: 1.1rem;
  color: white;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
}

@media (min-width: 992px) {
  .barangay-mobile-title {
    display: none !important;
  }
}

.footer-user {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.footer-user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-width: 0;
  text-align: left;
}

.footer-avatar-center {
  margin-bottom: 0;
}

@media (max-width: 767px) {
  .footer-user {
    gap: 8px;
    padding-left: 0;
    padding-right: 0;
    justify-content: flex-start;
  }
  .footer-user-info {
    font-size: 0.9em;
  }
  .footer-avatar-center q-avatar {
    width: 32px !important;
    height: 32px !important;
  }
}

@media (max-width: 500px) {
  .footer-user-info {
    font-size: 0.8em;
  }
  .footer-avatar-center q-avatar {
    width: 28px !important;
    height: 28px !important;
  }
}

.full-width {
  width: 100%;
}

.position-text {
  font-style: italic;
  font-size: smaller;
  color: white !important;
}

.welcome-title {
  color: white;
  font-weight: bold;
}

.role-indicator {
  font-size: 0.8rem;
  font-weight: normal;
  opacity: 0.9;
  margin-top: 2px;
  color: #E0FFE7;
}

/* Collapsed Transactions Section */
.collapsed-transactions-section {
  border-top: 1px solid black;
  padding-top: 8px;
  padding-bottom: 8px;
  margin-top: 10px;
}

.transaction-group {
  margin-bottom: 16px;
  padding: 8px;

  border-radius: 6px;

}

.transaction-group-title {
  font-size: 12px;
  font-weight: 600;
  color: black;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 16px 2px 16px;
  margin-top: 0;
  margin-bottom: 8px;

  padding-bottom: 4px;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white !important;
  background-color: #69B31E;
  box-shadow: 0 4px 8px rgba(82, 140, 24, 0.4);
  width: 95%;
  max-width: 280px;
  margin: 4px auto;
}

.transaction-item:hover {
  background-color: #0E780E;
  transform: translateX(2px);
}

.transaction-item span {
  margin-left: 12px;
  font-size: 15px;
  font-weight: 500;
  color: white !important;
}

/* Disabled state for transaction items */
.transaction-item.disabled {
  background-color: #9e9e9e !important;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: 0 2px 4px rgba(158, 158, 158, 0.3);
}

.transaction-item.disabled:hover {
  background-color: #9e9e9e !important;
  transform: none;
}

.transaction-item.disabled span {
  color: #e0e0e0 !important;
}

/* Panel item disabled state */
.panel-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.panel-item.disabled:hover {
  background-color: #f5f5f5;
}

.panel-item.disabled span {
  color: #9e9e9e !important;
}
</style>
