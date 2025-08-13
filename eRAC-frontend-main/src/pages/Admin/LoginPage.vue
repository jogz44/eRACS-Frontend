<template>
  <q-page class="split-login-page">
    <!-- Left side - Photo section (2/3 width) -->
    <div class="photo-section">
      <div class="photo-container">
        <div class="photo-overlay">
          <div class="overlay-content">
                  <div class="welcome-text">
              <h5 class="welcome-title">Welcome</h5>
              <h5 class="to-text">to</h5>
              <h5 class="erac-title">eRAC</h5>
            </div>
            <div class="description-text">
              <p class="description-line">Electronic Registry</p>
              <p class="description-line"> of</p>
              <p class="description-line">Appropriation and Commitment</p>

            </div>
            <div class="tagline">
</div>
            <!-- <div class="welcome-text">
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
              <p class="tagline-text">Streamline your</p>
              <p class="tagline-text">financial</p>
              <p class="tagline-text">management</p>
              <p class="tagline-text">with our</p>
              <p class="tagline-text">comprehensive</p>
              <p class="tagline-text">accounting</p>
              <p class="tagline-text">system</p>
            </div> -->
          </div>
        </div>
      </div>
    </div>

    <!-- Right side - Login form section (1/3 width) -->
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
          </div>
          <div class="office-name">City Accounting Office</div>
            <div class="system-name">Electronic Registry of Appropriation and Commitment (eRAC)</div>

          <div class="signin-title">Admin</div>
        </div>

        <div class="login-form">

          <!-- Email input -->
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
            error-message="Email is required"
            @keydown.enter="handleEnterKey"
            class="q-mb-md"
          />

          <!-- Password input -->
          <q-input
            color="primary"
            v-model="password"
            label="Password"
            :type="isPasswordVisible ? 'text' : 'password'"
            outlined
            dense
            bg-color="white"
            :prepend-icon="'lock'"
            :error="showValidation && !password"
            error-message="Password is required"
            @keydown.enter="handleEnterKey"
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

          <!-- Sign In button -->
          <q-btn
            label="SIGN IN"
            color="green"
            class="full-width q-mb-md"
            @click="handleLoginClick"
            :loading="loading"
          />

          <!-- Switch to user link -->
          <div class="text-center">
            <div class="text-caption">
              Switch to <span class="text-blue cursor-pointer" @click="goToUser">User</span>
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

  if (!email.value || !password.value) {
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
  background: rgba(0, 0, 0, 0.4);
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
