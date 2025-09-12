<template>
  <q-layout view="lHh Lpr lFf">
    <!-- HEADER -->
    <q-header elevated class="custom-header">
      <q-toolbar class="q-pr-md items-center" style="display: flex; flex-direction: row">
        <q-btn
          flat
          round
          dense
          icon="menu"
          class="q-mr-sm"
          v-if="$q.screen.lt.md"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <div
          v-if="$q.screen.lt.md && authStore.user?.barangay_name"
          class="barangay-mobile-title text-weight-bold q-mr-md"
        >
          Barangay {{ authStore.user.barangay_name }}
        </div>
        <q-space v-if="$q.screen.lt.md" />
        <q-toolbar-title
          v-if="$q.screen.gt.sm"
          class="welcome-title"
          style="color: white; font-weight: bold"
        >
          Barangay {{ authStore.user?.barangay_name }}
        </q-toolbar-title>
        <!--- Bell for notifications-->
        <q-btn style="background-color: grey;" size= 17px round dense flat class="notification-btn">
          <q-icon name="notifications" size="30px" color="white">
            <!-- Show notification -->
            <q-badge v-if="totalNotificationCount > 0" floating color="red" text-color="white">
              !
            </q-badge>
          </q-icon>

          <q-menu anchor="bottom right" self="top right" class="notification-menu">
            <q-list style="min-width: 300px">
              <q-item class="notification-header">
                <q-item-section>
                  <q-item-label class="text-weight-bold">Notifications</q-item-label>
                </q-item-section>
                <q-btn flat round dense icon="refresh" size="sm" @click="refreshAllNotifications">
                  <q-tooltip>Refresh all notifications</q-tooltip>
                </q-btn>
              </q-item>

              <q-separator />

              <!-- Void Requests -->
              <q-item v-if="voidRequestCount > 0" clickable @click="handleVoidRequestClick" class="notification-item void-notification">
                <q-item-section avatar>
                  <q-icon name="pending_actions" color="orange" size="28px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">Void Requests</q-item-label>
                  <q-item-label caption>
                    {{ voidRequestCount }} pending approval{{ voidRequestCount > 1 ? 's' : '' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" size="20px" />
                </q-item-section>
              </q-item>

              <!-- Edit Requests -->
              <q-item v-if="editRequestCount > 0" clickable @click="handleEditRequestClick" class="notification-item edit-notification">
                <q-item-section avatar>
                  <q-icon name="edit_note" color="purple" size="28px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">Edit Requests</q-item-label>
                  <q-item-label caption>
                    {{ editRequestCount }} pending approval{{ editRequestCount > 1 ? 's' : '' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" size="20px" />
                </q-item-section>
              </q-item>

              <!-- No notifications message -->
              <q-item v-if="totalNotificationCount === 0">
                <q-item-section class="text-center text-grey q-pa-md">
                  No new notifications
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <!--- User Avatar Menu-->
        <q-btn style="background-color: grey;" round dense flat class="user-menu-btn">
          <q-avatar size="41px">
            <img
              :src="userPhoto"
              @error="handleImageError"
              :alt="authStore.user?.first_name"
            />
          </q-avatar>

          <q-menu class="user-menu" transition-show="jump-down" transition-hide="jump-up">
            <q-list style="min-width: 250px">
              <!-- User Profile Header -->
              <q-item class="user-profile-header">
                <q-item-section avatar>
                  <q-avatar size="72px">
                    <img :src="userPhoto" @error="handleImageError" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-h6">
                    {{ authStore.user?.first_name }} {{ authStore.user?.last_name }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ authStore.user?.position_name }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ authStore.user?.barangay_name }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <!-- Menu Items -->
              <q-item clickable v-ripple @click="goToSettings" class="menu-item">
                <q-item-section avatar>
                  <q-icon name="settings" color="primary" />
                </q-item-section>
                <q-item-section>Edit Profile</q-item-section>
              </q-item>

              <q-item clickable v-ripple @click="handleLogout" class="menu-item">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section>Log Out</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
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
          <q-item class="row items-center q-pt-md" style="padding: 5px">
            <img
              src="src/assets/tagumlogo.png"
              alt="ERACS Logo"
              style="width: 100px; height: 75px; max-width: 100%; height: auto"
              class="q-mb-sm"
            />
            <q-item-label
              class="eracs-title text-center"
              style="font-size: small; color: black; font-style: normal"
            >
              Electronic Registry of Appropriation and Commitment System (eRACs)
            </q-item-label>
          </q-item>
        </div>

        <!-- Favorites Section -->
        <div class="favorites-section">
          <div class="section-title">Main Functions</div>
          <div class="favorites-list q-pa-sm">
            <div
              v-for="favorite in favorites"
              :key="favorite.title"
              class="favorite-item"
              @click="
                favorite.type === 'panel'
                  ? togglePanel(favorite.panelType)
                  : navigateToFavorite(favorite.link)
              "
            >
              <q-icon :name="favorite.icon" size="16px" />
              <span class="favorite-title">{{ favorite.title }}</span>

              <q-icon
                v-if="favorite.type === 'panel'"
                name="chevron_right"
                size="14px"
                class="panel-indicator"
              />

              <!-- Tooltip for void requests -->
              <q-tooltip v-if="favorite.title === 'Transactions' && voidRequestCount > 0">
                {{ voidRequestCount }} void request{{ voidRequestCount > 1 ? 's' : '' }} pending
                approval
              </q-tooltip>
            </div>
          </div>
        </div>

        <!-- Saved Searches Section -->
        <div class="saved-searches-section">
          <div class="section-title">User Management</div>
          <div class="saved-searches-list q-pa-sm">
            <div
              v-for="search in savedSearches"
              :key="search.title"
              class="saved-search-item"
              :class="{
                'restricted-item':
                  !hasAccessToRestrictedFeatures &&
                  (search.link === '/home/logsview' || search.link === '/home/useraccess'),
              }"
              @click="navigateToSearch(search.link)"
            >
              <q-icon
                :name="
                  !hasAccessToRestrictedFeatures &&
                  (search.link === '/home/logsview' || search.link === '/home/useraccess')
                    ? 'lock'
                    : search.icon
                "
                size="16px"
              />
              <span class="search-title">{{ search.title }}</span>
            </div>
          </div>
        </div>

        <!-- Sticky Footer -->
        <div class="drawer-footer q-mt-auto q-pa-xs">
          <div class="text-caption text-grey items-center q-pa-sm footer-avatar">

          </div>
        </div>
      </div>
    </q-drawer>

    <!-- Sliding Panels -->
    <!-- Transactions Panel -->
    <div
      class="sliding-panel transactions-panel"
      :class="{ 'panel-open': activePanel === 'transactions' }"
      v-show="activePanel === 'transactions'"
    >
      <div class="panel-header">
        <div class="panel-title">Transactions</div>
        <q-btn flat round dense icon="close" @click="closePanel" class="close-btn" />
      </div>

      <div class="panel-content">
        <!-- Void Request Summary Header -->


        <!-- Current Transactions -->
        <div class="panel-section">
          <div class="panel-section-title">Current</div>
          <div class="panel-item" @click="navigateTo('/home/transactions/appropriation')">
            <div class="colored-dot dot-pink"></div>
            <span>Appropriation</span>
          </div>
          <div class="panel-item" @click="navigateTo('/home/transactions/disbursement')">
            <div class="colored-dot dot-red"></div>
            <span>Disbursement</span>

          </div>
          <div class="panel-item" @click="navigateTo('/home/transactions/augmentation')">
            <div class="colored-dot dot-blue"></div>
            <span>Augmentation</span>
          </div>
          <div class="panel-item" @click="navigateTo('/home/transactions/supplemental')">
            <div class="colored-dot dot-red"></div>
            <span>Supplemental</span>
          </div>
        </div>

        <!-- Continuing Transactions -->
        <div class="panel-section">
          <div class="panel-section-title">Continuing</div>
          <div class="panel-item" @click="navigateTo('/home/continuing/appropriation')">
            <div class="colored-dot dot-orange"></div>
            <span>Appropriation</span>
          </div>
          <div class="panel-item" @click="navigateTo('/home/continuing/disbursement')">
            <div class="colored-dot dot-purple"></div>
            <span>Disbursement</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Libraries Panel -->
    <div
      class="sliding-panel libraries-panel"
      :class="{ 'panel-open': activePanel === 'libraries' }"
      v-show="activePanel === 'libraries'"
    >
      <div class="panel-header">
        <div class="panel-title">Libraries</div>
        <q-btn flat round dense icon="close" @click="closePanel" class="close-btn" />
      </div>

      <div class="panel-content">
        <div class="panel-section">
          <div class="panel-item" @click="navigateTo('/home/libraries/accounts')">
            <div class="colored-dot dot-light-blue"></div>
            <span>Accounts Library</span>
          </div>
          <div class="panel-item" @click="navigateTo('/home/libraries/bank')">
            <div class="colored-dot dot-grey"></div>
            <span>Bank Library</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="activePanel" class="panel-backdrop" @click="closePanel"></div>

    <!-- MAIN CONTENT -->
    <q-page-container style="background: #d9d9d9; min-height: 100vh">
      <SetupDialog v-model="showSetupDialog" />
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
// import NavLink from 'components/Nav/NavLink.vue'
import SetupDialog from 'components/SetupDialog.vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const disbursementStore = useDisbursementStore()
const route = useRoute()

const leftDrawerOpen = ref(false)
const showSetupDialog = ref(false)
const imageLoadingFailed = ref(false)
const activePanel = ref(null)

// Computed property to check if user has access to restricted features
const hasAccessToRestrictedFeatures = computed(() => {
  const restrictedPositions = ['barangay captain']
  const userPosition = authStore.user?.position_name?.toLowerCase().trim()
  return restrictedPositions.includes(userPosition)
})

// Computed property for void request count (only for Captains/Chairpersons)
const voidRequestCount = computed(() => {
  // Only show count for users who can approve/reject void requests
  // Try to get position from the relationship first, fallback to position_name
  const userPosition =
    authStore.user?.position?.name?.toLowerCase().trim() ||
    authStore.user?.position_name?.toLowerCase().trim()

  const canApproveVoid =
    userPosition &&
    (userPosition.includes('captain') ||
      userPosition.includes('chairperson') ||
      userPosition.includes('barangay captain') ||
      userPosition.includes('sk chairperson'))

  if (!canApproveVoid) return 0

  // Additional security check: ensure user has barangay_name
  if (!authStore.user?.barangay_name) {
    console.warn('User does not have barangay_name, cannot show void request count')
    return 0
  }

  // Ensure disbursements are loaded
  if (!disbursementStore.disbursements || disbursementStore.disbursements.length === 0) {
    return 0
  }

  // Count disbursements with 'Void Requested' status
  // Filter by both status and barangay_name for security
  const voidCount = disbursementStore.disbursements.filter((d) => {
    const hasVoidRequestedStatus = d.status === 'Void Requested'
    const matchesBarangay = d.barangay_name === authStore.user.barangay_name


    return hasVoidRequestedStatus && matchesBarangay
  }).length


  return voidCount
})

// Computed property for edit request count (only for Captains/Chairpersons)
const editRequestCount = computed(() => {
  // Only show count for users who can approve/reject edit requests
  // Try to get position from the relationship first, fallback to position_name
  const userPosition =
    authStore.user?.position?.name?.toLowerCase().trim() ||
    authStore.user?.position_name?.toLowerCase().trim()

  const canApproveEdit =
    userPosition &&
    (userPosition.includes('captain') ||
      userPosition.includes('chairperson') ||
      userPosition.includes('barangay captain') ||
      userPosition.includes('sk chairperson'))

  if (!canApproveEdit) return 0

  // Additional security check: ensure user has barangay_name
  if (!authStore.user?.barangay_name) {
    console.warn('User does not have barangay_name, cannot show edit request count')
    return 0
  }

  // Ensure disbursements are loaded
  if (!disbursementStore.disbursements || disbursementStore.disbursements.length === 0) {
    return 0
  }

  // Count disbursements with 'Edit Requested' status
  // Filter by both status and barangay_name for security
  const editCount = disbursementStore.disbursements.filter((d) => {
    const hasEditRequestedStatus = d.status === 'Edit Requested'
    const matchesBarangay = d.barangay_name === authStore.user.barangay_name


    return hasEditRequestedStatus && matchesBarangay
  }).length


  return editCount
})

// Add this computed property
const totalNotificationCount = computed(() => {
  return voidRequestCount.value + editRequestCount.value
})

// Add this method
const refreshAllNotifications = async () => {
  await Promise.all([
    refreshVoidRequestCount(),
    refreshEditRequestCount()
  ])

  $q.notify({
    type: 'positive',
    message: 'Notifications refreshed',
    icon: 'refresh',
    position: 'top',
    timeout: 1000
  })
}

// Favorites data
const favorites = ref([
  { title: 'Dashboard', link: '/home/dashboard', icon: 'dashboard' },
  {
    title: 'Transactions',
    type: 'panel',
    panelType: 'transactions',
    icon: 'account_balance_wallet',
  },
  { title: 'Libraries', type: 'panel', panelType: 'libraries', icon: 'library_books' },
  { title: 'Reports', link: '/home/reports', icon: 'assessment' },
])

// Saved searches data
const savedSearches = ref([
  //  { title: 'Accounts', link: '/home/libraries/accounts', icon: 'settings' },
  { title: 'User Control', link: '/home/useraccess', icon: 'admin_panel_settings' },
  { title: 'Log Activities', link: '/home/logsview', icon: 'history' },
])

const handleImageError = (e) => (e.target.src = 'src/assets/user.png')

const navigateToFavorite = (link) => {
  router.push(link)
  closePanel()
}

const navigateToSearch = (link) => {
  // Check if the link requires barangay captain permission
  if (link === '/home/logsview' || link === '/home/useraccess') {
    if (!hasAccessToRestrictedFeatures.value) {
      $q.notify({
        type: 'negative',
        message: 'Access Denied',
        caption: 'You do not have permission to access this resource.',
        position: 'top',
        timeout: 5000,
      })
      return
    }
  }

  router.push(link)
  closePanel()
}

const navigateTo = (link) => {
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
      if (panel && panel.style) {
        panel.style.transform = 'translate(0, -50%)'
      }
    })
  }
}

const closePanel = () => {
  const panel = document.querySelector('.sliding-panel.panel-open')
  if (panel && panel.style) {
    panel.style.transform = 'translate(-100%, -50%)'
    setTimeout(() => {
      activePanel.value = null
    }, 300)
  } else {
    activePanel.value = null
  }
}

// Method to refresh void request count
const refreshVoidRequestCount = async () => {
  if (authStore.user?.barangay_name) {
    $q.notify({
      type: 'info',
      message: 'Refreshing data...',
      icon: 'refresh',
      position: 'top',
      timeout: 1000,
    })

    // Use the existing fetchDisbursements method
    await disbursementStore.fetchDisbursements()

    // Force reactivity update
    await nextTick()
  }
}

// Method to refresh edit request count
const refreshEditRequestCount = async () => {
  if (authStore.user?.barangay_name) {
    $q.notify({
      type: 'info',
      message: 'Refreshing data...',
      icon: 'refresh',
      position: 'top',
      timeout: 1000,
    })

    // Use the existing fetchDisbursements method
    await disbursementStore.fetchDisbursements()

    // Force reactivity update
    await nextTick()
  }
}

// Method to handle void request click - navigate to disbursement page with void request filter
const handleVoidRequestClick = async () => {
  // Security check: ensure user has barangay_name
  if (!authStore.user?.barangay_name) {
    $q.notify({
      type: 'negative',
      message: 'Access denied: Invalid user context',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
    return
  }


  // Close the panel first
  closePanel()

  // Show loading notification
  $q.notify({
    type: 'info',
    color: 'lightgreen',
    textColor: 'white',
    bgcolor: 'lightgreen',
    message: 'Opening void requests...',
    icon: 'pending_actions',
    position: 'top',
    timeout: 2000,
  })

  // Check if there are any void requests for this barangay

  // Refresh disbursement data before navigation to ensure we have the latest data
  await disbursementStore.fetchDisbursements()

  // Re-check void requests after refresh
  const updatedVoidRequestsForThisBarangay = disbursementStore.disbursements.filter(
    (d) => d.status === 'Void Requested' && d.barangay_name === authStore.user.barangay_name,
  )

  if (updatedVoidRequestsForThisBarangay.length > 0) {
    // Navigate to disbursement page with void request status filter
    await router.push({
      path: '/home/transactions/disbursement',
      query: { status: 'Void Requested' }
    })

    // Show success notification
    $q.notify({
      type: 'positive',
      message: `Showing ${updatedVoidRequestsForThisBarangay.length} void request(s) for your barangay`,
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
  } else {
    // Navigate to disbursement page anyway but show warning
    await router.push('/home/transactions/disbursement')

    // Show warning if no void requests found for this barangay
    const allVoidRequests = disbursementStore.disbursements.filter(
      (d) => d.status === 'Void Requested',
    )

    $q.notify({
      type: 'warning',
      message: `No void requests found for your barangay (${authStore.user.barangay_name}). Found ${allVoidRequests.length} void requests for other barangays.`,
      icon: 'warning',
      position: 'top',
      timeout: 5000,
    })
  }
}

// Method to handle edit request click - navigate to disbursement page with edit request filter
const handleEditRequestClick = async () => {
  // Security check: ensure user has barangay_name
  if (!authStore.user?.barangay_name) {
    $q.notify({
      type: 'negative',
      message: 'Access denied: Invalid user context',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
    return
  }


  // Close the panel first
  closePanel()

  // Show loading notification
  $q.notify({
    type: 'info',
    color: 'lightgreen',
    textColor: 'white',
    bgcolor: 'lightgreen',
    message: 'Opening edit requests...',
    icon: 'edit_note',
    position: 'top',
    timeout: 2000,
  })

  // Check if there are any edit requests for this barangay


  // Refresh disbursement data before navigation to ensure we have the latest data
  await disbursementStore.fetchDisbursements()

  // Re-check edit requests after refresh
  const updatedEditRequestsForThisBarangay = disbursementStore.disbursements.filter(
    (d) => d.status === 'Edit Requested' && d.barangay_name === authStore.user.barangay_name,
  )

  if (updatedEditRequestsForThisBarangay.length > 0) {
    // Navigate to disbursement page with edit request status filter
    await router.push({
      path: '/home/transactions/disbursement',
      query: { status: 'Edit Requested' }
    })

    // Show success notification
    $q.notify({
      type: 'positive',
      message: `Showing ${updatedEditRequestsForThisBarangay.length} edit request(s) for your barangay`,
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
  } else {
    // Navigate to disbursement page anyway but show warning
    await router.push('/home/transactions/disbursement')

    // Show warning if no edit requests found for this barangay
    const allEditRequests = disbursementStore.disbursements.filter(
      (d) => d.status === 'Edit Requested',
    )

    $q.notify({
      type: 'warning',
      message: `No edit requests found for your barangay (${authStore.user.barangay_name}). Found ${allEditRequests.length} edit requests for other barangays.`,
      icon: 'warning',
      position: 'top',
      timeout: 5000,
    })
  }
}

const userPhoto = computed(() => {
  if (!authStore.user) return 'src/assets/user.png'
  return (
    authStore.user.photo_url ||
    (authStore.user.photo_path ? `/storage/${authStore.user.photo_path}` : 'src/assets/user.png')
  )
})

const goToSettings = () => {
  router.push('/home/profile-settings')
}

const handleLogout = async () => {
  $q.dialog({
    title: 'Confirm Logout',
    message: 'Are you sure you want to logout?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await authStore.logout()
    router.push('/')
  })
}

// Close panel when clicking outside or pressing escape
const handleKeydown = (event) => {
  if (event.key === 'Escape' && activePanel.value) {
    closePanel()
  }
}

onMounted(async () => {
  await authStore.initialize()
  document.addEventListener('keydown', handleKeydown)

  // Load disbursements to get void request count
  if (authStore.user?.barangay_name) {
    await disbursementStore.fetchDisbursements()

    // Force refresh void request count after initial load
    setTimeout(async () => {
      if (authStore.user?.barangay_name) {
        await disbursementStore.fetchDisbursements()
      }
    }, 1000)

    // Set up periodic refresh for void request count (every 10 seconds)
    const refreshInterval = setInterval(async () => {
      if (authStore.user?.barangay_name) {
        await disbursementStore.fetchDisbursements()
      }
    }, 10000)

    // Clean up interval on component unmount
    onUnmounted(() => {
      clearInterval(refreshInterval)
    })
  }
})

watch(
  () => authStore.user,
  async (newUser) => {
    imageLoadingFailed.value = false

    // Refresh disbursements when user changes to update void request count
    if (newUser?.barangay_name) {
      await disbursementStore.fetchDisbursements()
    }
  },
  { deep: true },
)


watch(
  () => route.meta.title,
  (newTitle) => {
    document.title = newTitle ? `${newTitle} | ERACS` : 'ERACS'
  },
)
</script>

<style>
.avatar-menu {
  background: linear-gradient(15deg, #187c19, #e0ffe7, #187c19);
}
.custom-card-drawer {
  position: sticky;
  background: linear-gradient(30deg, #187c19, #e0ffe7, #187c19);
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
  background: #0e780e;
  justify-content: center;
  /* border-bottom: 1px solid #e0e0e0; */
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
  padding: 12px 16px 4px 16px;
  margin-top: 0;
}

.nav-section {
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin: 0;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  color: black;
  position: relative;
  border-bottom: 1px solid #f0f0f0;
}

.nav-item:hover {
  background-color: #f5f5f5;
  transform: translateX(4px);
}

.nav-title {
  margin-left: 12px;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
  color: black;
}

.panel-item span {
  margin-left: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.favorites-section {
  border-top: 1px solid black;
  padding-top: 8px;
  height: 230px;
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
  background-color: #69b31e;
  box-shadow: 0 4px 8px rgba(82, 140, 24, 0.4);
}

.favorite-item:hover {
  background-color: #0e780e;
}

.favorite-title {
  margin-left: 12px;
  font-size: 15px;
  font-weight: 500;
  color: white !important;
}

.panel-trigger {
  background-color: #f8f8f8;
}

.panel-trigger:hover {
  background-color: #f0f0f0;
}

.panel-arrow {
  margin-left: auto;
  transition: transform 0.2s ease;
  color: #666;
}

.panel-trigger:hover .panel-arrow {
  transform: translateX(2px);
  color: #333;
}

/* Improved Sliding Panels */
.sliding-panel {
  position: fixed;
  top: 50%;
  left: 0;
  width: 280px;
  height: auto;
  max-height: 700px;
  /* background:linear-gradient(30deg,#187C19,#E0FFE7,#187C19); */
  background: linear-gradient(30deg, #187c19 0%, #e0ffe7 50%, #187c19 100%);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  z-index: 3000;
  transform: translate(-100%, -50%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border-radius: 0 12px 12px 0;
  /* border: 1px solid rgba(76, 175, 80, 0.2); */
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
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
  background-color: #69b31e;
  border: 1px solid rgba(76, 175, 80, 0.1);
}

.panel-item:hover {
  background-color: #187c19;
  transform: translateX(3px);
  border-color: rgba(76, 175, 80, 0.3);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
}

.panel-indicator {
  margin-left: auto;
  color: #666;
  transition: transform 0.2s ease;
}
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

  .footer-user-info {
    font-size: 0.8em;
  }

  .footer-avatar-center q-avatar {
    width: 28px !important;
    height: 28px !important;
  }

  /* Mobile void request button */
  .void-request-container {
    margin: 0 4px 12px 4px;
  }

  .void-request-button {
    min-height: 70px;
  }

  .void-request-content {
    padding: 12px 16px;
  }

  .void-request-count {
    font-size: 14px;
  }

  .void-request-subtitle {
    font-size: 10px;
  }

  .void-icon {
    size: 20px;
  }

  /* Mobile edit request button */
  .edit-request-container {
    margin: 0 4px 12px 4px;
  }

  .edit-request-button {
    min-height: 70px;
  }

  .edit-request-content {
    padding: 12px 16px;
  }

  .edit-request-count {
    font-size: 14px;
  }

  .edit-request-subtitle {
    font-size: 10px;
  }

  .edit-icon {
    size: 20px;
  }
}

.full-width {
  width: 100%;
}
.favorite-item:hover .panel-indicator {
  transform: translateX(2px);
  color: #69b31e;
}

/* Void Request Notification Badge */
.void-notification-badge {
  position: absolute;
  top: -8px;
  right: 25px;
  background-color: #ff4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

/* Edit Request Notification Badge */
.edit-notification-badge {
  position: absolute;
  top: -8px;
  right: 8px;
  background-color: purple;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.favorite-item {
  position: relative;
}

/* Void Request Container */
.void-request-container {
  margin: 0 8px 16px 8px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
  transition: all 0.3s ease;
  animation: voidRequestPulse 2s infinite;
  border: 2px solid rgba(255, 152, 0, 0.3);
}

.void-request-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.3);
  animation: none;
}

@keyframes voidRequestPulse {
  0%,
  100% {
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
  }
  50% {
    box-shadow:
      0 4px 12px rgba(255, 152, 0, 0.4),
      0 0 0 4px rgba(255, 152, 0, 0.1);
  }
}

.void-request-button {
  width: 120%;
  min-height: 40px;
  background: linear-gradient(135deg, #ff9800, #ff5722) !important;
  color: white !important;
  border-radius: 12px;
  padding: 0;

  text-transform: none;
  font-weight: 600;
  box-shadow: none;
  position: relative;
  overflow: hidden;
}

.void-request-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.void-request-button:hover::before {
  left: 100%;
}

.void-request-content {
  width: 100%;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.void-request-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.void-icon {
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.void-request-text-container {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.void-request-count {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}

.void-request-subtitle {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.8px;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}

.refresh-void-btn {
  flex-shrink: 0;
  opacity: 0.8;
  transition: all 0.2s ease;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.refresh-void-btn:hover {
  opacity: 1;
  transform: rotate(180deg);
  background-color: rgba(255, 255, 255, 0.2);
}

/* Edit Request Container */
.edit-request-container {
  margin: 0 8px 16px 8px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.2);
  transition: all 0.3s ease;
  animation: editRequestPulse 2s infinite;
  border: 2px solid rgba(255, 87, 34, 0.3);
}

.edit-request-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 87, 34, 0.3);
  animation: none;
}

@keyframes editRequestPulse {
  0%,
  100% {
    box-shadow: 0 4px 12px rgba(255, 87, 34, 0.2);
  }
  50% {
    box-shadow:
      0 4px 12px rgba(255, 87, 34, 0.4),
      0 0 0 4px rgba(255, 87, 34, 0.1);
  }
}

.edit-request-button {
  width: 120%;
  min-height: 40px;
  background: linear-gradient(135deg, purple, purple) !important;
  color: white !important;
  border-radius: 12px;
  padding: 0;

  text-transform: none;
  font-weight: 600;
  box-shadow: none;
  position: relative;
  overflow: hidden;
}

.edit-request-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.edit-request-button:hover::before {
  left: 100%;
}

.edit-request-content {
  width: 100%;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-request-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.edit-icon {
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.edit-request-text-container {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edit-request-count {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}

.edit-request-subtitle {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.8px;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}

.refresh-edit-btn {
  flex-shrink: 0;
  opacity: 0.8;
  transition: all 0.2s ease;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.refresh-edit-btn:hover {
  opacity: 1;
  transform: rotate(180deg);
  background-color: rgba(255, 255, 255, 0.2);
}

/* Panel Void Badge */
.panel-void-badge {
  position: absolute;
  top: -6px;
  right: 8px;
  background-color: #ff4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Panel Edit Badge */
.panel-edit-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #ff5722;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.panel-item {
  position: relative;
}


/* End of Panel */

.saved-searches-section {
  border-top: 1px solid black;
  padding-top: 8px;
}

.saved-searches-list {
  padding: 0 8px;
  color: white !important;
  width: 95%;
  max-width: 280px;
  margin: 0 auto;
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
  background-color: #69b31e;
  box-shadow: 0 4px 8px rgba(82, 140, 24, 0.4);
}

.saved-search-item:hover {
  background-color: #0e780e;
}

.search-title {
  margin-left: 12px;
  font-size: 15px;
  font-weight: 500;
  color: white !important;
}

.restricted-item {
  background-color: #666666 !important;
  opacity: 0.7;
  cursor: not-allowed;
}

.restricted-item:hover {
  background-color: #666666 !important;
  opacity: 0.8;
}

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

.drawer-content .nav-links {
  flex: 1 1 auto;
  overflow-y: auto;
}

.drawer-footer {
  justify-content: space-between;
  flex-shrink: 0;
  background-color: #0e780e;
  /* border-top: 1px solid #e0e0e0; */
  height: 5%;
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

.position-text {
  font-style: italic;
  font-size: smaller;
  color: white !important;
}

/* Add these new styles */
.notification-btn {
  margin: 0 8px;
  position: relative;
}

.notification-menu {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.notification-header {
  padding: 12px 16px;
  background: linear-gradient(to right, #187c19, #69b31e);
  color: white;
  border-radius: 8px 8px 0 0;
}

.notification-item {
  padding: 12px 16px;
  transition: all 0.2s ease;
}

.notification-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.void-notification:hover {
  background: rgba(255, 152, 0, 0.1);
}

.edit-notification:hover {
  background: rgba(156, 39, 176, 0.1);
}

.user-menu-btn {
  margin-left: 8px;
  transition: transform 0.2s ease;
}

.user-menu-btn:hover {
  transform: scale(1.05);
}

.user-menu {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.user-profile-header {
  padding: 20px;
  background: linear-gradient(135deg, #187c19, #69b31e);
  color: white;
  border-radius: 8px 8px 0 0;
}

.menu-item {
  padding: 12px 16px;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* Update existing styles */
.avatar-menu {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}
</style>
