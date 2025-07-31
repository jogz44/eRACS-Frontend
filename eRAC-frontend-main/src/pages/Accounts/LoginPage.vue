<template>
  <q-page class="login-page" @keydown.enter="handleEnterKey" tabindex="0">
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
        <div class="text-h5 text-green-8 text-bold">Sign In</div>
      </q-card-section>
      <!-- Login Username-->
      <q-card-section>
        <q-input id="LoginUsername"
          color="green"
          v-model="username"
          label="Username"
          outlined
          dense
          :prepend-icon="'user'"
          :error="showValidation && !username"
          :error-message="showValidation && !username ? 'Username is required' : ''"
          @keydown.enter="handleEnterKey"
        />

       <!-- Login Password-->
        <q-input id="LoginPassword"
          color="primary"
          v-model="password"
          label="Password"
          outlined
          dense
          :type="isPasswordVisible ? 'text' : 'password'"
          class="q-mt-md"
          prepend-icon="lock"
          @keydown.enter="handleEnterKey"
          :error="showValidation && !password"
          :error-message="showValidation && !password ? 'Password is required' : ''"
        >
          <template #append>
            <q-icon
              :name="isPasswordVisible ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="isPasswordVisible = !isPasswordVisible"
            />
          </template>
        </q-input>
        <div class="forgot-pass" style="display: flex;">

   <div class=" text-caption m">
          <span class="text-right text-blue cursor-pointer "  @click="goToForgotPassword">Forgot password?</span></div>

        </div>

        <q-btn
          label="Sign In"
          color="green"
          class="full-width q-mt-md"
          @click="handleLoginClick"
          :loading="isLoading"

        />
      </q-card-section>
      <q-card-section class="text-center">
        <div class="text-caption">
          Don't have an account yet?
          <span class="text-blue cursor-pointer" @click="goToSignUp">Sign up.</span>
        </div>
        <div class="text-caption q-mt-sm">
          Switch to <span class="text-blue cursor-pointer" @click="goToAdmin">Admin</span>
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
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'


const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()


const username = ref('')
const password = ref('')
const isLoading = ref(false)
const isPasswordVisible = ref(false)
const showValidation = ref(false)

// Validation function
const validateLogin = () => {
  showValidation.value = true
  
  if (!username.value) {
    $q.notify({
      type: 'negative',
      message: 'Username is required',
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
  
  isLoading.value = true
  await authStore.login(username.value, password.value, $q, router)
  isLoading.value = false
}

const handleEnterKey = (event) => {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  console.log('Enter key pressed - triggering login')
  handleLogin()
}

const handleLoginClick = () => {
  handleLogin()
}

// Global keyboard event handler
const handleGlobalKeydown = (event) => {
  if (event.key === 'Enter') {
    console.log('Global Enter key detected')
    event.preventDefault()
    event.stopPropagation()
    handleLogin()
  }
}

// Add and remove global event listeners
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
  console.log('Global keyboard listener added')
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  console.log('Global keyboard listener removed')
})


const goToForgotPassword = () => router.push('/forgotpage')
const goToSignUp = () => router.push('/signup')
const goToAdmin = () => router.push('/admin/login')
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

.forgot-pass{
  position: sticky;
  justify-content: right;
  margin-left:auto;
  text-align: right;
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
