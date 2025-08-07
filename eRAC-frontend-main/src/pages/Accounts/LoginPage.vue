<template>
  <q-page class="split-login-page">
        <!-- Left side - Photo section with overlay text -->
    <div class="photo-section">
      <div class="photo-container">
        <div class="photo-overlay">
          <div class="overlay-content">
            <div class="welcome-text">
              <h1 class="welcome-title">Welcome</h1>
              <h1 class="to-text">to</h1>
              <h1 class="erac-title">eRAC</h1>
            </div>
            <div class="description-text">
              <p class="description-line">Electronic</p>
              <p class="description-line">Registry of</p>
              <p class="description-line">Appropriation</p>
              <p class="description-line">and</p>
              <p class="description-line">Commitment</p>
            </div>
            <div class="tagline">

            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right side - Login form section -->
    <div class="login-section">
      <div class="login-container">
                <div class="header-section">
          <div class="office-info ">
            <div class="divide row">
              <q-img
              src="src/assets/tagumlogo.png"
              class="logo-image"
              contain
              style="width: 120px; height: 120px; margin: 0 auto 1rem auto;"
            />


          </div>
          <div class="office-name">City</div>
            <div class="office-name">Accounting</div>
            <div class="office-name">Office</div>
            <div class="system-name">Electronic Registry of Appropriation and Commitment (eRAC)</div>

          </div>

          <div class="signin-title">Sign In</div>
        </div>

        <div class="login-form">

          <!-- Username input -->
          <q-input
            id="LoginUsername"
            color="green"
            v-model="username"
            label="Username"
            outlined
            dense
            :prepend-icon="'user'"
            :error="showValidation && !username"
            error-message="Username is required"
            @keydown.enter="handleEnterKey"
            class="q-mb-md"
          />

          <!-- Password input -->
          <q-input
            id="LoginPassword"
            color="primary"
            v-model="password"
            label="Password"
            outlined
            dense
            :type="isPasswordVisible ? 'text' : 'password'"
            prepend-icon="lock"
            @keydown.enter="handleEnterKey"
            :error="showValidation && !password"
            error-message="Password is required"
            class="q-mb-md"
          >
            <template #append>
              <q-icon
                :name="isPasswordVisible ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPasswordVisible = !isPasswordVisible"
              />
            </template>
          </q-input>

          <!-- Forgot password link -->
          <div class="forgot-pass q-mb-md">
            <span class="text-right text-blue cursor-pointer" @click="goToForgotPassword">
              Forgot password?
            </span>
          </div>

          <!-- Sign In button -->
          <q-btn
            label="Sign In"
            color="green"
            class="full-width q-mb-md"
            @click="handleLoginClick"
            :loading="isLoading"
          />

          <!-- Sign up and admin links -->
          <div class="text-center q-mb-sm">
            <div class="text-caption">
              Don't have an account yet?
              <span class="text-blue cursor-pointer" @click="goToSignUp">Sign up.</span>
            </div>
          </div>

          <div class="text-center">
            <div class="text-caption">
              Switch to <span class="text-blue cursor-pointer" @click="goToAdmin">Admin</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="login-footer">
          <div class="text-caption text-center text-grey-6">
            © 2025 City Accounting Office, Tagum City. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
// import tagumLogo from 'src/assets/tagumlogo.png'

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

  if (!username.value || !password.value) {
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

// const onImageError = (error) => {
//   console.log('Logo image failed to load:', error)
//   // Try alternative path
//   const imgElement = error.target
//   if (imgElement && imgElement.src.includes('~/assets/')) {
//     imgElement.src = '/src/assets/tagumlogo.png'
//   }
// }
</script>

<style scoped>
.split-login-page {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* Left side - Photo section */
.photo-section {
  flex: 2;
  position: relative;
  overflow: hidden;
}

.photo-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-image: url('/src/assets/cityhall.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-content {
  text-align: center;
  color: white;
  padding: 2rem;
}

.welcome-text {
  margin-bottom: 2rem;
}

.welcome-title, .to-text, .erac-title {
  font-size: 4rem;
  font-weight: bold;
  margin: 0;
  line-height: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.to-text {
  font-size: 3rem;
  opacity: 0.9;
}

.description-text {
  margin-bottom: 2rem;
}

.description-line {
  font-size: 1.5rem;
  font-weight: 500;
  margin: 0.2rem 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
}

.tagline {
  opacity: 0.8;
}

.tagline-text {
  font-size: 1rem;
  margin: 0.1rem 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
}

/* Right side - Login section */
.login-section {
  flex: 1;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

/* Logo container styles removed - logo now in office-info */

.logo {
  width: 120px !important;
  height: 120px !important;
  max-width: 120px;
  max-height: 120px;
  min-width: 120px;
  min-height: 120px;
}

.logo-fallback {
  width: 120px !important;
  height: 120px !important;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d5016, #4a7c59) !important;
  display: flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white !important;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  margin: 0 auto;
  border: 3px solid #2d5016;
  position: relative;
  z-index: 10;
}

.logo-text {
  font-size: 1.4rem !important;
  line-height: 1;
  color: white !important;
  font-weight: 900;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.logo-text-small {
  font-size: 1rem !important;
  line-height: 1;
  color: white !important;
  font-weight: 700;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.office-info {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-image {
  display: block;
  margin: 0 auto 1rem auto;
}

.office-name {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2d5016;
  line-height: 1.2;
  margin: 0;
}

.system-name {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
  margin-top: 0.5rem;
}

.signin-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2d5016;
  margin-top: 1rem;
}

.login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.forgot-pass {
  display: flex;
  justify-content: flex-end;
}

.login-footer {
  margin-top: auto;
  padding-top: 2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .split-login-page {
    flex-direction: column;
  }

  .photo-section {
    flex: 1;
    height: 40vh;
  }

  .login-section {
    flex: 1;
    padding: 1rem;
  }

  .photo-title {
    font-size: 2rem;
  }

  .photo-subtitle {
    font-size: 1rem;
  }

  .photo-description {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .photo-section {
    height: 30vh;
  }

  .photo-title {
    font-size: 1.5rem;
  }

  .photo-subtitle {
    font-size: 0.9rem;
  }

  .photo-description {
    font-size: 0.8rem;
  }

  .login-container {
    max-width: 100%;
  }
}
</style>
