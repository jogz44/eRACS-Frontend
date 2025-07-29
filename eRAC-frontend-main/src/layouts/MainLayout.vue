<template>
  <q-layout view="lHh Lpr lFf">
    <!-- HEADER -->
    <q-header elevated class="custom-header">
      <q-toolbar class="q-pr-md items-center" style="display: flex; flex-direction: row;">
        <!-- Hamburger button for drawer, only on mobile -->
        <q-btn
          flat
          round
          dense
          icon="menu"
          class="q-mr-sm"
          v-if="$q.screen.lt.md"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <!-- Barangay name beside menu button on mobile only, left-aligned -->
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
        </q-toolbar-title >




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
    <!-- Logo & Title -->
    <q-list>
      <q-item class="column items-center q-pt-md">
        <img
          src="src/assets/tagumlogo.png"
          alt="ERACS Logo"
          style="width: 80px; height: 75px; max-width: 100%; height: auto;"
          class="q-mb-sm"
        />
        <q-item-label class="eracs-title text-center" style="font-size: medium;color: black;">
          Electronic Registry of Appropriation and Commitment (eRAC)
        </q-item-label>
      </q-item>
    </q-list>
    <!-- Nav Links - Scrollable if needed -->
    <div class="scroll nav-links q-pa-sm">
      <NavLink
        v-for="link in navLinks"
        :key="link.title"
        v-bind="link"
        :expanded="expanded[link.title] || false"
        :expanded-children="{
          ...(link.title === 'Transactions' && {
            Current: expanded['Transactions.Current'],
            Continuing: expanded['Transactions.Continuing'],
          }),
        }"
        @toggle="(childTitle, parentTitle) => toggleExpand(childTitle, parentTitle || link.title)"
      />
    </div>
    <!-- Sticky Footer -->
    <div class="drawer-footer q-mt-auto q-pa-xs">
      <div class="text-caption text-grey items-center q-pa-sm footer-avatar">
        <div class="footer-user q-pa-sm">
          <q-avatar size="$q.screen.lt.md ? '32px' : '45px'">
            <img :src="userPhoto" @error="handleImageError" style="max-width: 100%; height: auto;" />
          </q-avatar>
          <div class="footer-user-info">
            <span class="Custom-text text-caption text-white text-weight-bold ">
              {{ authStore.user?.first_name || 'Guest' }}

            </span>
            <span class="position-text text-caption text-white text-weight-medium text-h5">
              {{ authStore.user.position_name }}
            </span>
          </div>
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
      <SetupDialog v-model="showSetupDialog" />
      <router-view />
    </q-page-container>

  </q-layout>

</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import NavLink from 'components/Nav/NavLink.vue'
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


const handleImageError = (e) => (e.target.src = 'src/assets/user.png')

const userPhoto = computed(() => {
  if (!authStore.user) return 'src/assets/user.png'
  return authStore.user.photo_url || (authStore.user.photo_path ? `/storage/${authStore.user.photo_path}` : 'src/assets/user.png')
})

const handleLogout = async () => {
  $q.dialog({ title: 'Confirm Logout', message: 'Are you sure you want to logout?', cancel: true, persistent: true })
    .onOk(async () => {
      await authStore.logout()
      router.push('/')
    })
}

onMounted(async () => {
  await authStore.initialize()
})

watch(() => authStore.user, () => { imageLoadingFailed.value = false }, { deep: true })
watch(() => route.meta.title, (newTitle) => { document.title = newTitle ? `${newTitle} | ERACS` : 'ERACS' })

const navLinks = [
  { title: 'Dashboard', icon: 'dashboard', link: '/home/dashboard' },
  {
    title: 'Transactions', icon: 'receipt_long', children: [
      { title: 'Current', icon: 'schedule', children: [
        { title: 'Appropriation', link: '/home/transactions/appropriation' },
        { title: 'Disbursement', link: '/home/transactions/disbursement' },
        { title: 'Augmentation', link: '/home/transactions/augmentation' }
      ]},
      { title: 'Continuing', icon: 'sync', children: [
        { title: 'Appropriation', link: '/home/continuing/appropriation' },
        { title: 'Disbursement', link: '/home/continuing/disbursement' },
        { title: 'Augmentation', link: '/home/continuing/augmentation' }
      ]}
    ]
  },
  { title: 'Libraries',
    icon: 'library_books',
    children: [
    { title: 'Accounts',
    link: '/home/libraries/accounts' },
    { title: 'Bank',
    link: '/home/libraries/bank' },

  ]},
  { title: 'Reports', icon: 'assessment', link: '/home/reports' },

  {
    title: 'User Access', icon: 'admin_panel_settings', link: '/home/useraccess'
  },
  {
    title: 'Logs', icon: 'history', link: '/home/logsview'
  }

]

const expanded = ref({ Transactions: false, 'Transactions.Current': false, 'Transactions.Continuing': false, Libraries: false })
const toggleExpand = (title, parentTitle = null) => {
  const fullTitle = parentTitle ? `${parentTitle}.${title}` : title
  const wasExpanded = expanded.value[fullTitle]

  const newState = Object.keys(expanded.value).reduce((acc, key) => { acc[key] = false; return acc }, {})

  if (!wasExpanded) {
    newState[fullTitle] = true
    if (parentTitle) {
      newState[parentTitle] = true
      if (parentTitle === 'Transactions') {
        Object.keys(expanded.value).forEach((key) => {
          if (key.startsWith('Transactions.') && key !== fullTitle) newState[key] = false
        })
      }
    }
  }

  expanded.value = newState
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
.Custom-text {
  font-size: 18px;
  color: White !important;
}

.custom-header {
  background: #187C19;
  justify-content: center;
}

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

.drawer-content .nav-links {
  flex: 1 1 auto;
  overflow-y: auto;
}

.drawer-footer {
  justify-content: space-between;
  flex-shrink: 0;
  background-color:#187C19;
  ;
}.avatar-footer {
  display: flex;
  justify-content: end;
  align-items: center;
  padding: 10px;
}
.barangay-mobile-title {
  font-size: 1.1rem;
  color: #fff;
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
  justify-content: flex-start; /* left-aligned */
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
    justify-content: flex-start; /* still left-aligned on mobile */
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
}.position-text{
  font-style: italic;
  font-size: smaller;
  color: white !important;

}
</style>
