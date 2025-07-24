<template>
  <q-card class="login-card">
 <div class="logo-container">
      <q-img src="src/assets/tagumlogo.png" class="logo" contain spinner-color="white" />
    </div>
    <q-card-section>
      <div></div>
    </q-card-section>
    <q-card-section> </q-card-section>

    <q-card-section class="text-center">
      <div class="text-h5 text-green-8 text-bold">Find your account</div>
    </q-card-section>
    <!-- Email address-->
    <q-card-section>
      <q-input id="ForgotEmail"
        color="green"
        v-model="email"
        label="Email Address"
        type="email"
        outlined
        dense

        :prepend-icon="'email'"
        :error="showValidation && !email"
        :error-message="showValidation && !email ? 'email is required' : ''"

      />

      <div class="button-container">
        <q-btn @click="goToLogin" color="white" text-color="black">Cancel</q-btn>
        <q-btn @click="handleSearch" color="green"
        :loading="isLoading"
       >Search</q-btn>
      </div>
    </q-card-section>
    <q-card-section class="text-center">

    </q-card-section>
  </q-card>
 <div class="bottom">
  <q-footer class="text-center no-footer-bg">
    <div class="text-caption text-white">
      © 2025 City Accounting Office, Tagum City. All rights reserved.
    </div>
  </q-footer>
</div>

</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()

const email = ref('')
const isLoading = ref(false)
const showValidation = ref(false)


const handleSearch = async () => {

      showValidation.value = true
  if (!email.value ) {
    return

}
  // Basic validation

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    $q.notify({ type: 'warning', message: 'Please enter a valid email address' })
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
const goToLogin = () => router.push('/')
</script>

<style scoped>
.button-container {
  margin-top: 20px;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

.login-card {
  height: 300px;
  width: 400px;
  padding: 5px;
  border-radius: 10px;
  background: rgba(255, 255, 255);
  position: relative;
  box-shadow: 0 8px 8px rgb(38, 121, 0);
  margin-top: 120px;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  size: 10in;
}
.no-footer-bg {
  background-color: transparent !important;
  box-shadow: none !important;
}
</style>
