<template>
  <q-layout view="lHh Lpr lFf">
    <!-- HEADER -->
    <q-header elevated class="custom-header">
      <q-toolbar class="justify-end q-pr-md">
        <!-- NEW: Hamburger button for drawer, only on mobile -->
        <q-btn

          flat
          round
          dense
          icon="menu"
          class="q-mr-sm"
          v-if="$q.screen.lt.md"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <q-toolbar-title
          v-if="$q.screen.gt.sm"
          class="welcome-title"
          style="color: white; font-weight: bold"
        >
          Barangay {{ authStore.user?.barangay_name }}

        </q-toolbar-title>

        <!-- AVATAR & MENU -->
        <q-btn flat round dense icon="menu" v-if="$q.screen.gt.sm">
          <q-menu transition-show="jump-down" transition-hide="jump-up">
            <q-list class="q-pa-sm" style="min-width: 180px">
              <q-item class="q-mb-sm" v-if="authStore.user">
                <q-item-section>
                  <div class="text-subtitle2">
                    {{ authStore.user.first_name }} {{ authStore.user.last_name }}
                  </div>
                  <div class="text-caption text-grey">
                    {{ authStore.user.position }}
                  </div>
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable v-close-popup @click="openSetupDialog">
                <q-item-section avatar><q-icon name="settings" /></q-item-section>
                <q-item-section>Set-up</q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="handleLogout">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Logout</q-item-section>
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
    <!-- Logo & Title -->
    <q-list>
      <q-item class="column items-center q-pt-md">
        <img
          src="src/assets/tagumlogo.png"
          alt="ERACS Logo"
          style="width: 80px; height: 75px; max-width: 100%; height: auto;"
          class="q-mb-sm"
        />
        <q-item-label class="eracs-title text-center">
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
        <q-list separator>
          <div class="footer-user row items-center q-gutter-sm q-pa-sm">
            <!-- Avatar -->
            <q-avatar size="$q.screen.lt.md ? '32px' : '45px'">
              <img :src="userPhoto" @error="handleImageError" style="max-width: 100%; height: auto;" />
            </q-avatar>
            <!-- Name & Position -->
            <div class="column">
              <span class="Custom-text text-caption text-white text-weight-bold">
                {{ authStore.user?.first_name || 'Guest' }}
                {{ authStore.user?.last_name || ''   }}
              </span>
              <span class="text-caption text-white text-weight-medium text-h5"  >
               {{ authStore.user.position }}
              </span>
            </div>
          </div>
        </q-list>
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

const openSetupDialog = () => (showSetupDialog.value = true)
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
  { title: 'Libraries', icon: 'library_books', children: [
    { title: 'Accounts', link: '/home/libraries/accounts' },
    { title: 'Particulars', link: '/home/libraries/particulars' },
    { title: 'Bank', link: '/home/libraries/bank' },
    { title: 'Continuing', link: '/home/libraries/continuing' }
  ]},
  { title: 'Reports', icon: 'assessment', link: '/home/reports' },

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
  padding-left: 20px;
  background-color:#187C19;
  ;
}.avatar-footer {
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
}
</style>
