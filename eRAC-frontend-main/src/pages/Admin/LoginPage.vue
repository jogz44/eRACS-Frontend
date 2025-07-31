<template>
  <q-page class="login-page" @keydown.enter="handleEnterKey">
    <q-card class="login-card">
      <div class="logo-container">
        <q-img src="src/assets/tagumlogo.png" class="logo" contain spinner-color="white" />
      </div>
      <q-card-section>
        <div></div>
      </q-card-section>
      <q-card-section> </q-card-section>
      <q-card-section class="text-center">
        <div class="text-h6 text-green-8 text-bold" style="margin-top: 20px;">City Accounting Office</div>
        <div class="text-caption text-gray" style="font-style: oblique; margin-top: 10px;">
          Electronic Registry of Appropriation and Commitment (eRAC)
        </div>
      </q-card-section>
      <q-card-section class="text-center">
        <div class="text-h5 text-green-8 text-bold">Admin</div>
      </q-card-section>
     <q-card-section>
       <!-- Email -->
    <q-input
      color="green"
      v-model="email"
      label="Email"
      type="email"
      outlined
      dense
      bg-color="white"
      :prepend-icon="'user'"
        :error="showValidation && !email"
      :error-message="showValidation && !email ? 'Email is required!':''"
      @keydown.enter="handleEnterKey"
    />
      <!-- Password -->

    <q-input
      color="primary"
      v-model="password"
      label="Password"
      :type="isPasswordVisible ? 'text' : 'password'"
      outlined
      dense
      bg-color="white"
      class="q-mt-md"
      :prepend-icon="'lock'"
      :error="showValidation && !password"
      :error-message="showValidation && !password ? 'Password is required!':''"
      @keydown.enter="handleEnterKey"
    >
      <template #append>
        <q-icon
          :name="isPasswordVisible ? 'visibility_off' : 'visibility'"
          class="cursor-pointer"
          @click="isPasswordVisible = !isPasswordVisible"
        />
      </template>
    </q-input>

    <q-btn
      label="SIGN IN"
      color="green"
      class="full-width q-mt-md"
      @click="handleLoginClick"
      :loading="loading"
    />
  </q-card-section>

      <q-card-section class="text-center">
        <div class="text-caption q-mt-sm">
          Switch to <span class="text-blue cursor-pointer" @click="goToUser">User</span>
        </div>
      </q-card-section>
    </q-card>
    <div class="bottom">
    <q-footer class="text-center no-footer-bg">
      <div class="text-caption text-white">
        © 2025 City Accounting Office, Tagum City. All rights reserved.
      </div>
    </q-footer>
  </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()


const email = ref('admin@gmail.com') // Pre-fill for testing
const password = ref('')
const loading = ref(false)
const isPasswordVisible = ref(false)
const showValidation = ref(false)
const goToUser = () => {
  router.push('/') // Make sure this matches your signup route
}

// Validation function
const validateLogin = () => {
  showValidation.value = true
  
  if (!email.value) {
    $q.notify({
      type: 'negative',
      message: 'Email is required',
      position: 'top',
    })
    return false
  }
  
  if (!password.value) {
    $q.notify({
      type: 'negative',
      message: 'Password is required',
      position: 'top',
    })
    return false
  }
  
  return true
}

const handleLogin = async () => {
  if (!validateLogin()) {
    return
  }
  
  loading.value = true
  try {
    await authStore.adminLogin({
      email: email.value,
      password: password.value,
    })

    $q.notify({
      type: 'positive',
      message: 'Login successful!',
      position: 'top',
    })
    router.push('/admin/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Login failed. Please try again.',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const handleEnterKey = (event) => {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  console.log('Enter key pressed - triggering admin login')
  handleLogin()
}

const handleLoginClick = () => {
  handleLogin()
}

// Global keyboard event handler
const handleGlobalKeydown = (event) => {
  if (event.key === 'Enter') {
    console.log('Global Enter key detected for admin login')
    event.preventDefault()
    event.stopPropagation()
    handleLogin()
  }
}

// Add and remove global event listeners
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
  console.log('Global keyboard listener added for admin login')
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  console.log('Global keyboard listener removed for admin login')
})
</script>

<style scoped>
/* Make page scrollable */
.login-page {
  overflow-y: auto !important;
  min-height: 100vh !important;
  padding: 20px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.login-card {
  width: 400px;
  padding: 5px;
  border-radius: 10px;
  background: rgba(255, 255, 255);
  position: relative;
  box-shadow: 0 8px 8px rgb(38, 121, 0);
  margin-top: 120px;
}

/* Logo container to ensure visibility */
.logo-container {
  padding-top: 30px;
  padding-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.no-footer-bg {
  background-color: transparent !important;
  box-shadow: none !important;
}

/* Responsive Design */
@media (max-width: 480px) {
  .login-card {
    width: 90% !important;
    margin-top: 60px !important;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .login-card {
    width: 85% !important;
    margin-top: 80px !important;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .login-card {
    width: 70% !important;
    margin-top: 100px !important;
  }
}

@media (min-width: 1025px) {
  .login-card {
    width: 400px !important;
    margin-top: 120px !important;
  }
}
</style>
