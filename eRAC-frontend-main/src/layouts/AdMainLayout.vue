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
              @click="navigateToFavorite(favorite.link)"
            >
              <q-icon :name="favorite.icon" size="16px" />
              <span class="favorite-title">{{ favorite.title }}</span>
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
                  ADMIN
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

    <!-- MAIN CONTENT -->
    <q-page-container style="background: #D9D9D9; min-height: 100vh;">
      <router-view />
    </q-page-container>
  </q-layout>
</template>


<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { api } from 'boot/axios'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

const leftDrawerOpen = ref(false)

// Favorites data - Admin functions
const favorites = ref([
  { title: 'Dashboard', link: '/admin/dashboard', icon: 'dashboard' },
  { title: 'Logs', link: '/admin/logs', icon: 'history' }
])

// Saved searches data - Additional admin functions
const savedSearches = ref([
 { title: 'User Access', link: '/admin/userAccess', icon: 'admin_panel_settings' },
  { title: 'Pending Users', link: '/admin/usercontrol/pending', icon: 'pending' },
  { title: 'Accepted Users', link: '/admin/usercontrol/accepted', icon: 'check_circle' }
])

const navigateToFavorite = (link) => {
  router.push(link)
}

const navigateToSearch = (link) => {
  router.push(link)
}

const handleLogout = async () => {
  $q.dialog({
    title: 'Confirm Logout',
    message: 'Are you sure you want to logout?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await authStore.adminLogout()
    router.push('/admin/login')
  })
}

// Redirect to login if not authenticated
onMounted(() => {
  // Restore admin token and set Authorization header if present
  if (!authStore.adminToken) {
    const token = localStorage.getItem('admin_token');
    if (token) {
      authStore.adminToken = token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  } else {
    api.defaults.headers.common['Authorization'] = `Bearer ${authStore.adminToken}`;
  }
  if (!authStore.admin || !authStore.adminToken) {
    router.replace('/admin/login')
  }
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
  background:linear-gradient(30deg,#187C19,#E0FFE7,#187C19);
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
  color:black;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 16px 2px 16px;
  margin-top: 0;
}

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

.saved-searches-section {
  border-top: 1px solid black;
  padding-top: 8px;
  padding-bottom: 8px;
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
</style>
