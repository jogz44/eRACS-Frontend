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
      <div class="text-right text-blue text-caption cursor-pointer q-mt-sm" @click="goToForgotPassword">Forgot password?</div>
      <q-btn
        label="Sign In"
        color="green"
        class="full-width q-mt-md"
        @click="handleLogin"
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

</template>

<script setup>
import { ref } from 'vue'
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
const handleLogin = async () => {
  isLoading.value = true
  await authStore.login(username.value, password.value, $q, router) // No success check needed
  isLoading.value = false
}
const goToForgotPassword = () => router.push('/forgotpage')
const goToSignUp = () => router.push('/signup')
const goToAdmin = () => router.push('/admin/login')
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
  background: transparent !important;
  box-shadow: none !important;
}
</style>
