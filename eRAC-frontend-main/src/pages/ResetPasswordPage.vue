<template>
  <q-layout view="lHh Lpr lFf">
    <div class="bg-wrapper">
      <q-page-container class="flex flex-center">
        <q-card class="login-card">
          <q-card-section>
            <div></div>
          </q-card-section>
          <q-card-section> </q-card-section>

          <q-card-section class="text-center">
            <div class="text-h5 text-green-8 text-bold">Reset Password</div>
            <div class="text-caption text-gray q-mt-sm">
              Enter your new password for {{ email }}
            </div>
          </q-card-section>

          <q-card-section>
            <!-- New Password -->
            <q-input
              color="green"
              v-model="newPassword"
              label="New Password"
              :type="isPasswordVisible ? 'text' : 'password'"
              outlined
              dense
              :prepend-icon="'lock'"
              :rules="[(val) => val.length >= 8 || 'Minimum 8 characters']"
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
              class="q-mt-md"
              :prepend-icon="'lock'"
              :rules="[
                (val) => !!val || 'Required',
                (val) => val === newPassword || 'Passwords do not match',
              ]"
            >
              <template #append>
                <q-icon
                  :name="isPasswordVisible2 ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPasswordVisible2 = !isPasswordVisible2"
                />
              </template>
            </q-input>

            <div class="button-container">
              <q-btn @click="goToLogin" flat color="grey">Cancel</q-btn>
              <q-btn @click="handleResetPassword" color="green" :loading="isLoading">
                Reset Password
              </q-btn>
            </div>
          </q-card-section>
        </q-card>
      </q-page-container>
    </div>
  </q-layout>
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

onMounted(() => {
  console.log('ResetPasswordPage mounted')
  console.log('Route params:', route.params)
  console.log('Route query:', route.query)
  
  // Get email from route params or query
  email.value = route.params.email || route.query.email || ''
  console.log('Email value:', email.value)
  
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
  // Basic validations
  if (!newPassword.value) {
    $q.notify({ type: 'warning', message: 'New password is required' })
    return
  } else if (newPassword.value.length < 8) {
    $q.notify({ type: 'warning', message: 'Password must be at least 8 characters' })
    return
  }

  if (!confirmPassword.value) {
    $q.notify({ type: 'warning', message: 'Please confirm your password' })
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    $q.notify({ type: 'warning', message: 'Passwords do not match' })
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
.button-container {
  margin-top: 20px;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.login-card {
  height: 400px;
  width: 400px;
  padding: 5px;
  border-radius: 10px;
  background: rgba(255, 255, 255);
  position: relative;
  box-shadow: 0 8px 8px rgb(38, 121, 0);
  margin-top: 120px;
}

.bg-wrapper {
  position: relative;
  min-height: 100vh;
  background: url('src/assets/cityhall.jpg') no-repeat center center;
  background-size: cover;
}

.q-page-container {
  background: transparent;
}
</style> 