<template>
  <q-layout view="lHh Lpr lFf">
    <!-- HEADER -->
    <q-header elevated class="custom-header">
      <q-toolbar class="q-pr-md items-center" style="display: flex; flex-direction: row;">
        <q-btn
          flat
          round
          dense
          icon="menu"
          class="q-mr-sm"
          v-if="$q.screen.lt.md"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <div v-if="$q.screen.lt.md && authStore.user?.barangay_name" class="barangay-mobile-title text-weight-bold q-mr-md">
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
          <q-item class="column items-center q-pt-md">
            <img
              src="src/assets/tagumlogo.png"
              alt="ERACS Logo"
              style="width: 100px; height: 75px; max-width: 100%; height: auto;"
              class="q-mb-sm"
            />
            <q-item-label class="eracs-title text-center" style="font-size: medium;color: black;">
              Electronic Registry of Appropriation and Commitment (eRAC)
            </q-item-label>
          </q-item>
        </div>



        <!-- Favorites Section -->
        <div class="favorites-section">
          <div class="section-title">Main Functions</div>
          <div class="favorites-list q-pa-sm ">
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

        <!-- Saved Searches Section -->
        <div class="saved-searches-section">
          <div class="section-title">User Management</div>
          <div class="saved-searches-list q-pa-sm">
            <div
              v-for="search in savedSearches"
              :key="search.title"
              class="saved-search-item"
              :class="{ 'restricted-item': !isBarangayCaptain && (search.link === '/home/logsview' || search.link === '/home/useraccess') }"
              @click="navigateToSearch(search.link)"
            >
              <q-icon :name="!isBarangayCaptain && (search.link === '/home/logsview' || search.link === '/home/useraccess') ? 'lock' : search.icon" size="16px" />
              <span class="search-title">{{ search.title }}</span>
            </div>
          </div>
        </div>

        <!-- Sticky Footer -->
        <div class="drawer-footer q-mt-auto q-pa-xs">
          <div class="text-caption text-grey items-center q-pa-sm footer-avatar">
            <div class="footer-user q-pa-sm">
              <q-avatar size="$q.screen.lt.md ? '32px' : '45px'">
                <img :src="userPhoto" @error="handleImageError" style="max-width: 100%; height: auto;" />
              </q-avatar>
              <div class="footer-user-info">
                <span class="Custom-text text-caption text-white text-weight-bold">
                  {{ authStore.user?.first_name || 'Guest' }}
                </span>
                <span class="position-text text-caption text-white text-weight-medium text-h5">
                  {{ authStore.user.position_name }}
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
          <div class="panel-item" @click="navigateTo('/home/continuing/augmentation')">
            <div class="colored-dot dot-green"></div>
            <span>Augmentation</span>
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
    <div
      v-if="activePanel"
      class="panel-backdrop"
      @click="closePanel"
    ></div>

    <!-- MAIN CONTENT -->
    <q-page-container style="background: #D9D9D9; min-height: 100vh;">
      <SetupDialog v-model="showSetupDialog" />
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue'
// import NavLink from 'components/Nav/NavLink.vue'
import SetupDialog from 'components/SetupDialog.vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const route = useRoute()

const leftDrawerOpen = ref(false)
const showSetupDialog = ref(false)
const imageLoadingFailed = ref(false)
const activePanel = ref(null)

// Computed property to check if user is barangay captain
const isBarangayCaptain = computed(() => {
  return authStore.user?.position_name?.toLowerCase().trim() === 'barangay captain'
})

// Favorites data
const favorites = ref([
  { title: 'Dashboard', link: '/home/dashboard', icon: 'dashboard' },
  { title: 'Transactions', type: 'panel', panelType: 'transactions', icon: 'account_balance_wallet' },
  { title: 'Libraries', type: 'panel', panelType: 'libraries', icon: 'library_books' },
  { title: 'Reports', link: '/home/reports', icon: 'assessment' }
])

// Saved searches data
const savedSearches = ref([
  //  { title: 'Accounts', link: '/home/libraries/accounts', icon: 'settings' },
  { title: 'Log Activities', link: '/home/logsview', icon: 'history' },
  { title: 'User Control', link: '/home/useraccess', icon: 'admin_panel_settings' },

])

const handleImageError = (e) => (e.target.src = 'src/assets/user.png')

const navigateToFavorite = (link) => {
  router.push(link)
  closePanel()
}

const navigateToSearch = (link) => {
  // Check if the link requires barangay captain permission
  if (link === '/home/logsview' || link === '/home/useraccess') {
    if (!isBarangayCaptain.value) {
      $q.notify({
        type: 'negative',
        message: 'Access Denied',
        caption: 'You are not permitted to access this. Only Barangay Captains can access this resource.',
        position: 'top',
        timeout: 5000
      })
      return
    }
  }

  router.push(link)
  closePanel()
}

const navigateTo = (link) => {
  router.push(link)
  // Don't close panel when navigating - keep it open
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

const userPhoto = computed(() => {
  if (!authStore.user) return 'src/assets/user.png'
  return authStore.user.photo_url || (authStore.user.photo_path ? `/storage/${authStore.user.photo_path}` : 'src/assets/user.png')
})

const handleLogout = async () => {
  $q.dialog({
    title: 'Confirm Logout',
    message: 'Are you sure you want to logout?',
    cancel: true,
    persistent: true
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
})

watch(() => authStore.user, () => { imageLoadingFailed.value = false }, { deep: true })
watch(() => route.meta.title, (newTitle) => { document.title = newTitle ? `${newTitle} | ERACS` : 'ERACS' })
</script>

<style>
.custom-card-drawer {
  position: sticky;
  background: rgb(255, 255, 255);
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
  /* border-bottom: 1px solid #e0e0e0; */


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
  /* border-bottom: 1px solid rgba(255, 255, 255, 0.1); */
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
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
  max-height: 600px;
  background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 50%, #d4edda 100%);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  z-index: 3000;
  transform: translate(-100%, -50%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border-radius: 0 12px 12px 0;
  border: 1px solid rgba(76, 175, 80, 0.2);
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
  color: #2e7d32;
  text-shadow: none;
}

.close-btn {
  color: rgba(76, 175, 80, 0.7);
  transition: all 0.2s ease;
  background-color: rgba(76, 175, 80, 0.1);
  border-radius: 50%;
}

.close-btn:hover {
  color: #2e7d32;
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
  color: #4caf50;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(76, 175, 80, 0.2);
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

.favorites-section {
  /* border-top: 1px solid #e0e0e0; */
  padding-top: 8px;
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

.panel-indicator {
  margin-left: auto;
  color: #666;
  transition: transform 0.2s ease;
}

.favorite-item:hover .panel-indicator {
  transform: translateX(2px);
  color: #69B31E;
}

.saved-searches-section {
  /* border-top: 1px solid #e0e0e0; */
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
  background-color: #0E780E;
  /* border-top: 1px solid #e0e0e0; */
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
}

.full-width {
  width: 100%;
}

.position-text {
  font-style: italic;
  font-size: smaller;
  color: white !important;
}
</style>
