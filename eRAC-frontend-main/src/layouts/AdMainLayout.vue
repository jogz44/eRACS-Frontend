<template>
  <q-layout view="lHh Lpr lFf">
    <!-- HEADER (unchanged) -->
    <q-header elevated class="custom-header">
      <q-toolbar class="justify-between toolbar" style="padding: 0 20px">
        <q-toolbar-title
          v-if="$q.screen.gt.sm"
          class="title"
          style="color: white; font-weight: bold"

        >
          Welcome, {{ authStore.admin?.name || 'Admin' }}
        </q-toolbar-title>
        <q-space />
        <!-- <q-btn flat round dense icon="menu" class="q-mr-sm" style="color: white">
          <q-menu transition-show="jump-down" transition-hide="jump-up">
            <q-list class="q-pa-sm" style="min-width: 180px">
              <q-item class="q-mb-sm" clickable v-ripple>
                <q-item-section>
                  <div class="text-subtitle2">Admin</div>
                  <div class="text-caption text-grey">
                    {{ authStore.admin?.email || 'Administrator' }}
                  </div>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn> -->
      </q-toolbar>
    </q-header >

    <!-- DRAWER (match MainLayout.vue) -->
    <q-drawer
      v-model="leftDrawerOpen"
      :width="$q.screen.lt.md ? 220 : 300"
      :breakpoint="mobile"
      :show-if-above="$q.screen.gt.sm"
      bordered
      class="custom-card-drawer drawer-fixed"
      :class="{ 'drawer-mobile': $q.screen.lt.md }"
    >
      <div class="drawer-content">
        <!-- Logo & Title -->
        <q-list>
          <q-item class="column items-center q-pt-md">
            <img
              src="src/assets/tagumlogo.png"
              alt="ERACS Logo"
              style="width: 80px; height: 75px; max-width: 100%; height: auto;"
              class="q-mb-sm w-20 h-auto"
            />
            <q-item-label class="eracs-title text-center text-sm md:text-base" style="font-size: medium;">
              Electronic Registry of Appropriation and Commitment (eRAC)
            </q-item-label>
          </q-item>
        </q-list>
        <!-- Nav Links - Scrollable if needed -->
        <div class="scroll nav-links q-pa-sm" style = "max-height: 70hv; overflow-y: auto;">
          <NavLink
            v-for="link in navLinks"
            :key="link.title"
            v-bind="link"
            :expanded="expanded[link.title] || false"
            @toggle="toggleExpand(link.title)"
          />
        </div>
        <!-- Sticky Footer -->
        <div class="drawer-footer q-mt-auto q-pa-xs">
          <div class="text-caption text-grey items-center q-pa-sm footer-avatar">
            <q-list separator>
              <div class="footer-user row items-center q-gutter-sm q-pa-sm">
                <!-- Avatar -->
                <q-avatar  size="$q.screen.lt.md ? '32px' : '45px'"
                class="q-avatar--xs md:q-avatar--md">
                  <img   src="src/assets/admin.png"/>
                </q-avatar>
                <!-- Name & Position -->
                <div class="column">
                  <span class="text-caption text-white text-weight-bold ">
                    User

                  </span>
                  <span class="text-caption text-black text-weight-medium text-h5"  >
                   ADMIN
                  </span>
                </div>
                <!-- Logout Icon -->
                <q-space />
                <q-btn
                  flat
                  round
                  dense
                  icon="logout"
                  color="white"
                  @click="handleLogout"
                  class="logout-btn"
                  size="md"
                />
              </div>
            </q-list>
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
import NavLink from 'components/Nav/NavLink.vue'
import { api } from 'boot/axios'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

const leftDrawerOpen = ref(false)
const navLinks = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    link: '/admin/dashboard',
  },
  {
    title: 'User Control',
    icon: 'people',
    children: [
      { title: 'Pending', link: '/admin/usercontrol/pending' },
      { title: 'Accepted', link: '/admin/usercontrol/accepted' },
    ],
  },
  {
    title: 'User Access',
    icon: 'admin_panel_settings',
    link: '/admin/userAccess',
  },
  {
    title: 'Logs',
    icon: 'history',
    link: '/admin/logs',
  },
]

const expanded = ref({
  'User Control': false,
})

const toggleExpand = (title) => {
  if (Object.hasOwn(expanded.value, title)) {
    expanded.value[title] = !expanded.value[title]
  }
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
  background: linear-gradient(#E0FFE7, #589b16,#187C19);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  padding-top: 30px;
  overflow: hidden;
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
}.nav-links {
  color: white;
  padding: 10px;
  margin: 10px;
  overflow-x: hidden;
}
.drawer-content .nav-links {
  flex: 1 1 auto;
  overflow-y: auto;
}
.drawer-footer {
  justify-content: space-between;
  flex-shrink: 0;
  padding-left: 20px;
  background-color:#187C19;

}
.avatar-footer {
  display: flex;
  justify-content: end;
  align-items: center;
  padding: 10px;
}
@media (max-width: 767px) {
  .custom-card-drawer {
    width: 100vw !important;
    min-width: 0 !important;
    max-width: 100vw !important;
    left: 0 !important;
    border-radius: 0 !important;
    padding-top: 10px;
  }
  .drawer-content {
    padding: 0 4px;
  }
  .drawer-footer {
    padding-left: 4px;
    flex-direction: column;
    align-items: flex-start;
  }
  .footer-user {
    flex-direction: column;
    align-items: flex-start;
  }
  .eracs-title {
    color: rgba(2, 2, 2, 0.7);
  font-size: 0.95rem;
  font-weight: bolder;
  text-align: center;
  }.eracs-title {
    font-size: 0.8rem;
  }
  .nav-links {
    margin: 0;
    padding: 4px;
  }
}
@media (max-width: 500px) {
  .eracs-title {
    font-size: 0.7rem;
  }
  .custom-header {
    font-size: 0.9rem;
    padding: 0 4px;


  }
}.toolbar{
  background-color: #187C19;
}
</style>
