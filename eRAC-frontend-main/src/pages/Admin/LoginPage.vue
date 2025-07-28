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
      <div class="text-h6 text-green-8 text-bold">City Accounting Office</div>
      <div class="text-caption text-gray" style="font-style: oblique">
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
    @keyup.enter="handleLogin"
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
    @click="handleLogin"
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

</template>

<script setup>
import { ref } from 'vue'
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

const handleLogin = async () => {
  showValidation.value = true
  if (!email.value || !password.value) {
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
</script>

<style scoped>

.login-card {
  width: 400px;
  padding: 20px;
  border-radius: 10px;
  background: rgba(255, 255, 255);
  position: relative;
  box-shadow: 0 8px 8px rgb(38, 121, 0);
  margin-top: 120px;
}
.no-footer-bg {
  background-color: transparent !important;
  box-shadow: none !important;
}
</style>
