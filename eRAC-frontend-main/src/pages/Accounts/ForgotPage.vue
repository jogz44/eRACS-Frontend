<template>
  <q-page class="split-login-page">
    <!-- Left side - Photo section with overlay text -->
    <div class="photo-section">
      <div class="photo-container">
        <div class="photo-overlay">
          <div class="overlay-content">
              <div class="welcome-text">
              <h6 class="welcome-title q-pb-md">Welcome </h6>
              <h6 class="to-text q-pb-md">to</h6>
              <h6 class="erac-title">eRACs</h6>
            </div>
            <div class="description-text">

            </div>
            <div class="tagline">
                </div>


          </div>
        </div>
      </div>
    </div>

    <!-- Right side - Login form section -->
    <div class="login-section">
      <div class="login-container q-pt-md">
        <div class="header-section">
          <div class="office-info">
            <q-img
              src="src/assets/tagumlogo.png"
              class="logo-image"
              contain
              style="width: 120px; height: 120px; margin: 0 auto 1rem auto;"
            />
             <div class="office-name">City Accounting Office</div>
            <div class="system-name">Electronic Registry of Appropriation and Commitment System (eRACs)</div>
          </div>

          <div class="signin-title">Find your account</div>
        </div>

        <div class="login-form">
          <!-- Email input -->
          <q-input
            id="ForgotEmail"
            color="green"
            v-model="email"
            label="Email Address"
            type="email"
            outlined
            dense
            :prepend-icon="'email'"
            :error="showValidation && (!email || !isValidEmail(email))"
            :error-message="showValidation && (!email || !isValidEmail(email)) ? getEmailErrorMessage() : ''"
            @keydown.enter="handleGlobalEnterKey"
            class="q-mb-md"
          />

          <!-- Buttons -->
          <div class="button-container q-mb-md">
            <q-btn @click="goToLogin" color="white" text-color="black">Cancel</q-btn>
            <q-btn @click="handleSearchClick" color="green" :loading="isLoading">Search</q-btn>
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


const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()

const email = ref('')
const isLoading = ref(false)
const showValidation = ref(false)

// Email validation helper
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const getEmailErrorMessage = () => {
  if (!showValidation.value) return ''
  if (!email.value) return 'Email is required'
  if (!isValidEmail(email.value)) return 'Please enter a valid email address'
  return ''
}


// Validation function
const validateSearch = () => {
  showValidation.value = true

  if (!email.value || !isValidEmail(email.value)) {
    return false
  }

  return true
}

const handleSearch = async () => {
  if (!validateSearch()) {
    return
  }

  isLoading.value = true

  try {
    const result = await authStore.checkEmailExists(email.value)

    if (result.exists) {
      $q.notify({
        type: 'positive',
        message: 'Email found! Redirecting to password reset...',
        position: 'top',
      })
      // Redirect to reset password page with email as parameter
     goToResetPassword()
    } else {
      $q.notify({
        type: 'negative',
        message: 'Email not found in our database. Please check your email or sign up.',
        position: 'top',
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'An error occurred while checking email',
      position: 'top',
    })

  } finally {
    isLoading.value = false
  }

}
const goToResetPassword = () => {
  console.log('=== DEBUGGING NAVIGATION ===')
  console.log('Email value:', email.value)
  console.log('Current route before navigation:', router.currentRoute.value)

  // Use the correct reset-password route
  const targetPath = `/reset-password?email=${encodeURIComponent(email.value)}`
  console.log('Target path:', targetPath)

  router.push(targetPath).then(() => {
    console.log('Navigation successful, new route:', router.currentRoute.value)
  }).catch((error) => {
    console.error('Navigation failed:', error)
    // Fallback to login
    router.push('/')
  })
}
const handleGlobalEnterKey = (event) => {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  console.log('Enter key pressed - triggering search')
  handleSearch()
}

const handleSearchClick = () => {
  handleSearch()
}

// Global keyboard event handler
const handleGlobalKeydown = (event) => {
  if (event.key === 'Enter') {
    console.log('Global Enter key detected for forgot password')
    event.preventDefault()
    event.stopPropagation()
    handleSearch()
  }
}

// Add and remove global event listeners
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
  console.log('Global keyboard listener added for forgot password')
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  console.log('Global keyboard listener removed for forgot password')
})

const goToLogin = () => router.push('/')
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
  /* background-image: url('/src/assets/cityhall.jpg'); */
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
  background: linear-gradient(25deg,
    rgba(0, 0, 0, 0.5),
    rgba(5, 100, 13, 0.404)
  );
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
  font-size: 5rem;
  font-weight: bold;
  margin: 0;
  line-height: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  ;
}

.to-text {

  font-size: 4.5rem;
  opacity: 0.9;
}
.description-text {
  margin-bottom: 2rem;
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
  margin-bottom: 1rem;
}

.office-info {
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
}

.logo-image {
  display: block;
  margin: 0 auto 1rem auto;
}

.office-name {
  font-size: 1.6rem;
  font-weight: bold;
  color: #2d5016;
  line-height: 1.1;
  margin: 0;
}

.system-name {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
  margin-top: 0.5rem;
}

.signin-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #2d5016;
  margin-top: 0.5rem;
}

.login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

}

.button-container {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.login-footer {
  margin-top: auto;
  padding-top: 2rem;
}

/* Responsive Design */
@media (max-width: 1023px) {
  .split-login-page {
    flex-direction: column;
  }

  .photo-section {
    display: none; /* Hide photo section on mobile/tablet */
  }

  .login-section {
    flex: 1;
    width: 100%; /* Login section takes full width */
    padding: 1rem;
  }

  .login-container {
    max-width: 100%;
  }
}

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

  .welcome-title, .to-text, .erac-title {
    font-size: 2rem;
  }

  .to-text {
    font-size: 1.5rem;
  }

  .description-line {
    font-size: 1rem;
  }

  .tagline-text {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .photo-section {
    height: 30vh;
  }

  .welcome-title, .to-text, .erac-title {
    font-size: 1.5rem;
  }

  .to-text {
    font-size: 1.2rem;
  }

  .description-line {
    font-size: 0.9rem;
  }

  .tagline-text {
    font-size: 0.8rem;
  }

  .login-container {
    max-width: 100%;
  }
}
</style>
