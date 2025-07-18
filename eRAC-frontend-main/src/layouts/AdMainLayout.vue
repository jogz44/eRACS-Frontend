<template>
  <q-layout view="lHh lpR ffr" no-shadow>
    <!-- Add admin info to header -->
    <q-header elevated class="custom-header">
      <q-toolbar class="justify-between" style="padding: 0 20px">
        <q-toolbar-title

          v-if="$q.screen.gt.sm"
          class="title"
          style="color: rgba(0, 0, 0, 0.7); font-weight: bold"
        >
          Welcome, {{ authStore.admin?.name || 'Admin' }}
        </q-toolbar-title>

        <q-space />

        <!-- Admin Dropdown Menu -->
        <q-btn flat round dense icon="person" class="q-mr-sm" style="color: black">
          <q-menu transition-show="jump-down" transition-hide="jump-up">
            <q-list class="q-pa-sm" style="min-width: 180px">
              <!-- Admin Info -->
              <q-item class="q-mb-sm" clickable v-ripple>
                <q-item-section>
                  <div class="text-subtitle2">Admin</div>
                  <div class="text-caption text-grey">
                    {{ authStore.admin?.email || 'Administrator' }}
                  </div>
                </q-item-section>
              </q-item>

              <q-separator />

              <!-- Logout -->
              <q-item clickable v-close-popup @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer

      v-model="leftDrawerOpen"
      :width="300"
      :breakpoint="767"
      show-if-above
      class="custom-card-drawer"
      v-if="$q.screen.gt.sm"
    >
      <q-list>
        <q-item class="column items-center q-pt-md">
          <img
            src="src/assets/tagumlogo.png"
            alt="ERACS Logo"
            style="width: 80px; height: 75px"
            class="q-mb-sm"
          />
          <q-item-label class="eracs-title">
            Electronic Registry of Appropriation and Commitment (eRAC)
          </q-item-label>
        </q-item>
        <br />
<div class="nav-links">
        <NavLink
          v-for="link in navLinks"
          :key="link.title"
          v-bind="link"
          :expanded="expanded[link.title] || false"
          @toggle="toggleExpand(link.title)"
        />
        </div>
      </q-list>

    <!-- Sticky Footer -->
    <div class="drawer-footer">
      <div class="text-caption text-grey items-center q-pa-sm footer-avatar">
<q-list separator>
  <div class="footer-user row items-center q-gutter-sm q-pa-sm">
    <!-- Avatar -->
    <q-avatar size="45px">
      <img :src="userPhoto" @error="handleImageError" />
    </q-avatar>

    <!-- Name & Position -->
    <div class="column">
      <span class="text-caption text-white text-weight-bold " >
        {{ authStore.user?.first_name || 'Guest' }}
        {{ authStore.user?.last_name || ''   }}
      </span>
      <span class="text-caption text-black text-weight-medium text-h5"  >
       {{ authStore.user.position }}
      </span>
    </div>
  </div>
</q-list>



      </div>
    </div>

    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import NavLink from 'components/Nav/NavLink.vue'

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

.custom-header {
background: #69B31E;
  justify-content: center;
}

/* Smooth transitions */
.q-slide-transition {
  transition: max-height 0.9s ease;
}

.eracs-title {
  color: rgba(2, 2, 2, 0.7);
  font-size: 0.95rem;
  font-weight: bolder;
  text-align: center;
}
.nav-links {
  color: white;
  padding: 10px;
  margin: 10px;
  overflow-x: hidden;
}.drawer-footer {
  justify-content: space-between;
  flex-shrink: 0;
  padding-left: 20px;
  background-color:#187C19;
  ;
}.avatar-footer {
  display: flex;
  justify-content: end;
  align-items: center;
  padding: 10px;
}
</style>
