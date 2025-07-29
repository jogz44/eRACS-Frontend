<template>
  <q-page class="q-pa-lg no-scroll-page">
    <q-card class="signup-card">
      <!-- Logo Container -->
      <!-- Header Section -->
      <q-card-section class="text-center header-section" style="">
        <div></div>
        <div class="text-h6 text-green-8 text-bold text-gray">Create an Account</div>
      </q-card-section>
      <!-- Horizontal Stepper -->
      <q-stepper v-model="step" color="green" keep-alive>
        <!-- Step 1: Personal Information -->
        <q-step :name="1" title="Personal Info" icon="person" :done="step > 1">
          <div class="row q-col-gutter-md">
            <!-- Left Column -->
            <div class="col-6">
              <div class="text-subtitle2 text-green-8 q-mb-xs">Fullname</div>
              <q-input
                outlined
                dense
                bg-color="white"
                v-model="firstName"
                label="Firstname"
                color="green"
                class="q-mb-sm"
                :error="showStep1Validation && !firstName"
                :error-message="showStep1Validation && !firstName ? 'First name is required' : ''"
              />
              <q-input
                outlined
                dense
                bg-color="white"
                v-model="middleName"
                label="Middlename"
                color="green"
                class="q-mb-sm"
                :error="showStep1Validation && !middleName"
                :error-message="showStep1Validation && !middleName ? 'Middle name is required' : ''"
              />
              <q-input
                outlined
                dense
                bg-color="white"
                v-model="lastName"
                label="Lastname"
                color="green"
                class="q-mb-md"
                :error="showStep1Validation && !lastName"
                :error-message="showStep1Validation && !lastName ? 'Last name is required' : ''"
              />
              <div class="text-subtitle2 text-green-8 q-mb-xs">Suffix (Optional)</div>
              <q-input outlined dense bg-color="white" v-model="suffix" color="green" />
            </div>
            <!-- Right Column -->
            <div class="col-6">
              <div class="text-subtitle2 text-green-8 q-mb-xs">Barangay</div>
              <q-select
                outlined
                dense
                bg-color="white"
                v-model="barangay"
                :options="barangayOptions"
                label="Select Barangay"
                color="green"
                class="q-mb-sm"
                emit-value
                map-options
                option-label="name"
                option-value="value"
                :error="showStep1Validation && !barangay"
                :error-message="showStep1Validation && !barangay ? 'Barangay is required' : ''"
              />
              <div class="text-subtitle2 text-green-8 q-mb-xs">Position</div>
              <q-select
                outlined
                dense
                bg-color="white"
                v-model="position"
                :options="positionOptions"
                label="Select Position"
                color="green"
                class="q-mb-md"
                emit-value
                map-options
                option-label="name"
                option-value="value"
                :error="showStep1Validation && !position"
                :error-message="showStep1Validation && !position ? 'Position is required' : ''"
              />
              <q-uploader
                v-model="uploadedFiles"
                label="Drag and drop photo or click to browse"
                accept=".jpg,.jpeg,.png,.gif"
                max-file-size="5242880"
                max-files="1"
                style="width: 100%"
                color="green"
                flat
                bordered
                bg-color="white"
                @added="onFileAdded"
                @rejected="onFileRejected"
                @removed="onFileRemoved"
              >
                <template v-slot:header="scope">
                  <div class="row no-wrap items-center q-pa-sm">
                    <q-spinner v-if="scope.isUploading" class="q-uploader__spinner" />
                    <div class="col">
                      <div class="q-uploader__title">Upload Photo</div>
                      <div class="q-uploader__subtitle">
                        {{ scope.uploadSizeLabel }} / {{ '2MB' }}
                      </div>
                    </div>
                    <div class="row items-center q-gutter-sm q-ml-md">
                      <!-- Add Button -->
                      <q-btn
                        icon="add"
                        round
                        dense
                        flat
                        color="white"
                        v-if="scope.canAddFiles"
                        :disable="uploadedFiles.length > 0"
                        @click="scope.addFiles()"
                      >
                        <q-uploader-add-trigger />
                      </q-btn>
                      <!-- Delete Button -->
                      <q-btn
                        icon="delete"
                        round
                        dense
                        flat
                        color="red"
                        :disable="uploadedFiles.length === 0"
                        @click="scope.removeFile(scope.files[0])"
                      />
                    </div>
                  </div>
                </template>
                <template v-slot:list="scope">
                  <q-list separator>
                    <q-item v-for="file in scope.files" :key="file.name">
                      <q-img
                        v-if="photoUrl"
                        :src="photoUrl"
                        style="max-width: 200px; margin-top: 10px"
                        spinner-color="primary"
                      />
                      <q-item-section>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </template>
              </q-uploader>
              <!-- Photo validation error -->
              <div v-if="showStep1Validation && !uploadedFile" class="text-negative text-caption q-mt-xs">
                Please select a profile photo
              </div>
            </div>
          </div>
          <q-stepper-navigation class="row justify-between q-mt-md">
            <div class="text-caption text-gray">
              Already have an account?
              <span class="text-blue cursor-pointer" @click="$router.push('/')"> Sign in. </span>
            </div>
            <q-btn @click="validateStep1" color="green" label="Continue" />
          </q-stepper-navigation>
        </q-step>
        <!-- Step 2: Account Credentials -->
        <q-step :name="2" title="Account Info" icon="lock" :done="step > 2">
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input
                outlined
                dense
                bg-color="white"
                v-model="email"
                label="Email"
                color="green"
                :error="showStep2Validation && (!email || !isValidEmail(email))"
                :error-message="getEmailErrorMessage()"
              >
                <template v-slot:prepend>
                  <q-icon name="mail" />
                </template>
              </q-input>
            </div>
            <div class="col-6">
              <q-input
                outlined
                dense
                bg-color="white"
                v-model="username"
                label="Username"
                color="green"
                :error="showStep2Validation && (!username || username.length < 4)"
                :error-message="getUsernameErrorMessage()"
              >
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>
            </div>
          </div>
          <!-- Signup Password-->
          <div class="row q-col-gutter-md q-mt-sm">
            <div class="col-6">
              <q-input
                outlined
                dense
                bg-color="white"
                v-model="password"
                label="Password"
                :type="isPasswordVisible ? 'text' : 'password'"
                color="green"
                :error="showStep2Validation && (!password || password.length < 8)"
                :error-message="getPasswordErrorMessage()"
              >
                <template #append>
                  <q-icon
                    :name="isPasswordVisible ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPasswordVisible = !isPasswordVisible"
                  />
                </template>
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>
            </div>
            <!-- Confirm Password-->
            <div class="col-6">
              <q-input
                outlined
                dense
                bg-color="white"
                v-model="confirmPassword"
                label="Confirm Password"
                :type="isPasswordVisible2 ? 'text' : 'password'"
                color="green"
                :error="showStep2Validation && (!confirmPassword || password !== confirmPassword)"
                :error-message="getConfirmPasswordErrorMessage()"
                @keyup.enter="handleSubmit"
              >
                <template #append>
                  <q-icon
                    :name="isPasswordVisible2 ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPasswordVisible2 = !isPasswordVisible2"
                  />
                </template>
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>
            </div>
          </div>
          <q-stepper-navigation class="row justify-between q-mt-md">
            <q-btn flat @click="step = 1" color="green" label="Back" />
            <q-btn @click="handleSubmit" color="green" label="Submit" />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
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

<script>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { api } from 'boot/axios'

export default {
  setup() {
    const $q = useQuasar()
    const router = useRouter()
    const authStore = useAuthStore()

    // Your existing ref declarations
    const step = ref(1)
    const firstName = ref('')
    const middleName = ref('')
    const lastName = ref('')
    const barangay = ref(null)
    const position = ref('')
    const suffix = ref('')
    const uploadedFile = ref(null)
    const photoUrl = ref(null)
    const email = ref('')
    const username = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const isLoading = ref(false)
    const uploadedFiles = ref([])
    const uploadError = ref(null)
    const barangayOptions = ref([])
    const positionOptions = ref([])
    const isPasswordVisible = ref(false)
    const isPasswordVisible2 = ref(false)

    // Separate validation states for each step
    const showStep1Validation = ref(false)
    const showStep2Validation = ref(false)

    onMounted(async () => {
      try {
        // Load barangays
        const barangayResponse = await api.get('/api/barangay/barangays')
        barangayOptions.value = barangayResponse.data.map((b) => ({
          name: b.name,
          value: b.name,
        }))

        // Load positions
        const positionResponse = await api.get('/api/barangay/positions')
        positionOptions.value = positionResponse.data.map((b) => ({
          name: b.name,
          value: b.name,
        }))
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: `Failed to load data: ${error.message}`,
          position: 'top',
        })
      }
    })

    // File handlers remain the same
    const onFileAdded = (files) => {
      if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
      const file = files[0]
      uploadedFile.value = file
      photoUrl.value = URL.createObjectURL(file)
      uploadedFiles.value = [file]
    }

    const onFileRemoved = () => {
      if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
      uploadedFile.value = null
      photoUrl.value = null
      uploadedFiles.value = []
      uploadError.value = null
    }

    const onFileRejected = (rejectedEntries) => {
      const reasons = rejectedEntries.map((entry) => entry.failedPropValidation).join(', ')
      $q.notify({
        type: 'negative',
        message: `File rejected: ${reasons}`,
        position: 'top',
      })
    }

    // Validation helper functions
    const isValidEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const getEmailErrorMessage = () => {
      if (!showStep2Validation.value) return ''
      if (!email.value) return 'Email is required'
      if (!isValidEmail(email.value)) return 'Please enter a valid email address'
      return ''
    }

    const getUsernameErrorMessage = () => {
      if (!showStep2Validation.value) return ''
      if (!username.value) return 'Username is required'
      if (username.value.length < 4) return 'Username must be at least 4 characters'
      return ''
    }

    const getPasswordErrorMessage = () => {
      if (!showStep2Validation.value) return ''
      if (!password.value) return 'Password is required'
      if (password.value.length < 8) return 'Password must be at least 8 characters'
      return ''
    }

    const getConfirmPasswordErrorMessage = () => {
      if (!showStep2Validation.value) return ''
      if (!confirmPassword.value) return 'Please confirm your password'
      if (password.value !== confirmPassword.value) return 'Passwords do not match'
      return ''
    }

    // Step 1 validation
    const validateStep1 = () => {
      showStep1Validation.value = true

      // Check all step 1 required fields
      if (!firstName.value.trim()) {
        return
      }
      if (!middleName.value.trim()) {
        return
      }
      if (!lastName.value.trim()) {
        return
      }
      if (!barangay.value) {
        return
      }
      if (!position.value.trim()) {
        return
      }
      if (!uploadedFile.value) {
        return
      }

      // File type validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
      if (!allowedTypes.includes(uploadedFile.value.type)) {
        $q.notify({
          type: 'negative',
          message: 'Invalid file type. Only JPG, PNG or GIF are allowed',
          position: 'top',
        })
        return
      }

      // File size validation (2MB max)
      const maxSize = 2 * 1024 * 1024 // 2MB in bytes
      if (uploadedFile.value.size > maxSize) {
        $q.notify({
          type: 'negative',
          message: 'File too large. Maximum size is 2MB',
          caption: `Current size: ${(uploadedFile.value.size / 1024 / 1024).toFixed(2)}MB`,
          position: 'top',
        })
        return
      }

      // If all validations pass, move to step 2
      showStep1Validation.value = false // Reset step 1 validation
      step.value = 2
    }

    // Step 2 validation and submission
    const handleSubmit = async () => {
      showStep2Validation.value = true

      // Validate step 2 fields
      if (!email.value.trim()) {
        return
      }
      if (!isValidEmail(email.value)) {
        return
      }
      if (!username.value.trim()) {
        return
      }
      if (username.value.length < 4) {
        return
      }
      if (!password.value) {
        return
      }
      if (password.value.length < 8) {
        return
      }
      if (!confirmPassword.value) {
        return
      }
      if (password.value !== confirmPassword.value) {
        return
      }

      isLoading.value = true
      try {
        // 1. First upload the photo
        const uploadResult = await authStore.uploadPhoto(uploadedFile.value)
        if (!uploadResult.success) {
          throw new Error(uploadResult.error)
        }

        // 2. Then register with all user data + photo path
        const registrationData = {
          first_name: firstName.value,
          middle_name: middleName.value,
          last_name: lastName.value,
          barangay: barangay.value,
          position: position.value,
          suffix: suffix.value,
          email: email.value,
          username: username.value,
          password: password.value,
          password_confirmation: confirmPassword.value,
          photo: uploadResult.path,
        }

        const result = await authStore.register(registrationData)
        if (!result.success) {
          throw new Error(result.error)
        }

        // Success
        $q.notify({
          type: 'positive',
          message: 'Registration successful!',
          position: 'top',
        })
        router.push('/')
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error.message,
          position: 'top',
          multiLine: error.message.includes('\n'),
        })
      } finally {
        isLoading.value = false
      }
    }

    return {
      step,
      firstName,
      middleName,
      lastName,
      barangay,
      barangayOptions,
      position,
      positionOptions,
      suffix,
      uploadedFile,
      photoUrl,
      email,
      username,
      password,
      confirmPassword,
      isPasswordVisible,
      isPasswordVisible2,
      isLoading,
      showStep1Validation,
      showStep2Validation,
      onFileAdded,
      onFileRemoved,
      onFileRejected,
      validateStep1,
      handleSubmit,
      uploadedFiles,
      isValidEmail,
      getEmailErrorMessage,
      getUsernameErrorMessage,
      getPasswordErrorMessage,
      getConfirmPasswordErrorMessage,
      cardWidth: $q.screen.lt.sm ? '100%' : $q.screen.lt.md ? '80%' : '50%',
    }
  },
}
</script>

<style scoped>
.signup-card {
  width: 700px;
  border-radius: 10px;
  background: rgba(255, 255, 255);
  position: relative;
  box-shadow: 0 4px 8px rgb(38, 121, 0);
  margin-top: 10px;
  margin-bottom: 20px;
}

.header-section {
  margin-top: 60px;
}

.text-gray {
  color: #666;
}

.q-uploader {
  border-radius: 3px;
}

.q-uploader__title {
  color: var(--q-info);
}

.q-uploader__subtitle {
  font-size: 0.75rem;
  color: #e5e5e5;
}

.no-footer-bg {
  background-color: transparent !important;
  box-shadow: none !important;
}

.no-scroll-page {
  overflow: hidden;
  height: 100v;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  size: 10in;
}
</style>
