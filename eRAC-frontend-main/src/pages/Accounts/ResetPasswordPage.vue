<template>
  <q-page class="split-login-page ">
    <!-- Left side - Photo section with overlay text -->
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

          </div>
        </div>
      </div>
    </div>

    <!-- Right side - Reset form section -->
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
            <div class="system-name">Electronic Registry of Appropriation and Commitment (eRAC)</div>
          </div>

          <div class="signin-title">Reset Password</div>
          <div class="reset-subtitle">Enter your new password for {{ email || 'your account' }}</div>
        </div>

        <div class="login-form">
          <!-- New Password -->
          <q-input
            color="green"
            v-model="newPassword"
            label="New Password"
            :type="isPasswordVisible ? 'text' : 'password'"
            outlined
            dense
            :prepend-icon="'lock'"
            :error="showValidation && (!newPassword || newPassword.length < 8)"
            :error-message="showValidation && (!newPassword || newPassword.length < 8) ? getPasswordErrorMessage() : ''"
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

          <!-- Confirm New Password -->
          <q-input
            color="green"
            v-model="confirmPassword"
            label="Confirm New Password"
            :type="isPasswordVisible2 ? 'text' : 'password'"
            outlined
            dense
            :prepend-icon="'lock'"
            :error="showValidation && (!confirmPassword || newPassword !== confirmPassword)"
            :error-message="showValidation && (!confirmPassword || newPassword !== confirmPassword) ? getConfirmPasswordErrorMessage() : ''"
            class="q-mb-md"
          >
            <template #append>
              <q-icon
                :name="isPasswordVisible2 ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPasswordVisible2 = !isPasswordVisible2"
              />
            </template>
          </q-input>

          <!-- Buttons -->
          <div class="button-container q-mb-md">
            <q-btn @click="goToLogin" flat color="grey">Cancel</q-btn>
            <q-btn @click="handleResetPassword" color="green" :loading="isLoading">
              Reset Password
            </q-btn>
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'


const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const $q = useQuasar()

console.log('=== RESET PASSWORD PAGE LOADING ===')
console.log('Route object:', route)
console.log('Route path:', route.path)
console.log('Route params:', route.params)
console.log('Route query:', route.query)

const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const isPasswordVisible = ref(false)
const isPasswordVisible2 = ref(false)
const showValidation = ref(false)

// Validation helper functions
const getPasswordErrorMessage = () => {
  if (!showValidation.value) return ''
  if (!newPassword.value) return 'Password is required'
  if (newPassword.value.length < 8) return 'Password must be at least 8 characters'
  return ''
}

const getConfirmPasswordErrorMessage = () => {
  if (!showValidation.value) return ''
  if (!confirmPassword.value) return 'Please confirm your password'
  if (newPassword.value !== confirmPassword.value) return 'Passwords do not match'
  return ''
}

onMounted(() => {
  console.log('ResetPasswordPage mounted')
  console.log('Route params:', route.params)
  console.log('Route query:', route.query)

  // Get email from route params or query
  email.value = route.params.email || route.query.email || ''
  console.log('Email value:', email.value)

  // Temporarily comment out the redirect to see if the component renders
  // if (!email.value) {
  //   console.log('No email found, redirecting to forgot page')
  //   $q.notify({
  //     type: 'negative',
  //     message: 'Email is required for password reset',
  //     position: 'top',
  //   })
  //   router.push('/forgotpage')
  // } else {
  //   console.log('Email found, staying on reset page')
  // }

  if (!email.value) {
    console.log('No email found, redirecting to forgot page')
    $q.notify({
      type: 'negative',
      message: 'Email is required for password reset',
      position: 'top',
    })
    router.push('/forgotpage')
  } else {
    console.log('Email found, staying on reset page')
  }
})


const handleResetPassword = async () => {
  showValidation.value = true

  // Basic validations
  if (!email.value || !newPassword.value || newPassword.value.length < 8 || !confirmPassword.value || newPassword.value !== confirmPassword.value) {
    return
  }

  isLoading.value = true

  try {
    const result = await authStore.resetPassword({
      email: email.value,
      password: newPassword.value,
      password_confirmation: confirmPassword.value,
    })

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Password reset successful! You can now login with your new password.',
        position: 'top',
      })
      router.push('/')
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Password reset failed',
        position: 'top',
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Password reset failed',
      position: 'top',
    })
  } finally {
    isLoading.value = false
  }
}

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

.reset-subtitle {
  font-size: 0.9rem;
  color: #666;
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
