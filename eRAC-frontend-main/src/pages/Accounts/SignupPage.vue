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
              <h6 class="erac-title">eRAC</h6>
            </div>
            <div class="description-text">

            </div>
            <div class="tagline">
                </div>

           </div>
         </div>
      </div>
    </div>

    <!-- Right side - Signup form section -->
    <div class="login-section">
      <div class="login-container q-pt-md">
        <div class="header-section">
          <div class="office-info">
            <q-img
              src="src/assets/tagumlogo.png"
              class="logo-image"
              contain
              style="width: 120px; height: 120px; margin: 0 auto 0.5rem auto;"
            />
            <div class="office-name">City Accounting Office</div>
            <div class="system-name">Electronic Registry of Appropriation and Commitment (eRAC)</div>
          </div>

          <div class="signin-title">Create an Account</div>
        </div>

        <div class="signup-form">
          <q-card class="signup-card">
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
                @keyup.enter="validateStep1"
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
                @keyup.enter="validateStep1"
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
                @keyup.enter="validateStep1"
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
                @keyup.enter="validateStep1"
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
                @keyup.enter="validateStep1"
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
                @keyup.enter="handleSubmit"
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
                @keyup.enter="handleSubmit"
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
                @keyup.enter="handleSubmit"
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
            <q-btn flat @click="step = 1" color="green" label="Back" :disable="isLoading" />
            <q-btn @click="handleSubmit" color="green" label="Submit" :loading="isLoading" :disable="isLoading" />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
    </q-card>
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

<script>
import { ref, onMounted, onUnmounted } from 'vue'
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

    // Global keyboard event handler
    const handleGlobalKeydown = (event) => {
      if (event.key === 'Enter') {
        console.log('Global Enter key detected for signup')
        event.preventDefault()
        event.stopPropagation()

        if (step.value === 1) {
          validateStep1()
        } else if (step.value === 2) {
          handleSubmit()
        }
      }
    }

    // Global Enter key handler for the page
    const handleGlobalEnterKey = (event) => {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      if (step.value === 1) {
        validateStep1()
      } else if (step.value === 2) {
        handleSubmit()
      }
    }

    // Add and remove global event listeners
    onMounted(() => {
      document.addEventListener('keydown', handleGlobalKeydown)
      console.log('Global keyboard listener added for signup')
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleGlobalKeydown)
      console.log('Global keyboard listener removed for signup')
    })

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
      handleGlobalEnterKey,
      cardWidth: $q.screen.lt.sm ? '100%' : $q.screen.lt.md ? '80%' : '50%',
    }
  },
}
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
   align-items: stretch;
   justify-content: center;
   padding: 2rem;
   overflow: hidden;
 }

.login-container {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.header-section {
  text-align: center;
  margin-bottom: 1rem;
  flex-shrink: 0;
  padding: 0.5rem 0;
}

.office-info {
  margin-bottom: 0.5rem;
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
  line-height: 1.1;
  margin: 0;
}

.system-name {
  font-size: 0.9rem;
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

.signup-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.signup-card {
  flex: 1;
  border-radius: 10px;
  background: rgba(255, 255, 255);
  box-shadow: 0 2px 4px rgba(38, 121, 0, 0.3);
  margin: 0;
  padding: 0.5rem;
  overflow: visible;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.q-stepper {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.q-stepper .q-stepper__content {
  flex: 1;
  overflow-y: auto;
}

.q-stepper .q-stepper__nav {
  flex-shrink: 0;
  margin-top: auto;
  padding: 1rem 0;
  background: white;
  z-index: 10;
}

/* Ensure stepper navigation is always visible */
.q-stepper-navigation {
  padding: 1rem 0 !important;
  margin-top: 1rem !important;
  border-top: 1px solid #e0e0e0;
  background: white;
  position: sticky;
  bottom: 0;
  z-index: 100;
}

.login-footer {
  margin-top: 0.5rem;
  flex-shrink: 0;
  padding: 0.5rem 0;
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

/* Responsive Design */
@media (max-width: 768px) {
  .split-login-page {
    flex-direction: column;
  }

  .photo-section {
    flex: 1;
    height: 30vh;
  }

  .login-section {
    flex: 1;
    padding: 0.5rem;
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
    height: 25vh;
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

  .signup-card {
    padding: 0.5rem;
  }
}
</style>
