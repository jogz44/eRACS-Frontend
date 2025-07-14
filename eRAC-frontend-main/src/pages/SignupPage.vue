<template>
  <q-card class="signup-card">
    <!-- Logo Container -->
    <div class="logo-container">
      <q-img src="src/assets/tagumlogo.png" class="logo" contain spinner-color="white" />
    </div>

    <!-- Header Section -->
    <q-card-section class="text-center header-section">
      <div class="text-h6 text-green-8 text-bold">City Accounting Office</div>
      <div class="text-caption text-gray" style="font-style: oblique">
        Electronic Registry of Appropriation and Commitment System (eRACS)
      </div>
    </q-card-section>

    <!-- Horizontal Stepper -->
    <q-stepper v-model="step" color="green" animated header-nav class="stepper-custom">
      <!-- Step 1: Personal Information -->
      <q-step :name="1" title="Personal Info" icon="person" :done="step > 1">
        <div class="row q-col-gutter-md">
          <!-- Left Column -->
          <div class="col-6">
            <div class="text-subtitle2 text-green-8 q-mb-xs">Fullname</div>
            <q-input
              outlined
              dense
              v-model="firstName"
              label="Firstname"
              color="green"
              class="q-mb-sm"
              :rules="[(val) => !!val || 'Firstname is required']"
            />
            <q-input
              outlined
              dense
              v-model="middleName"
              label="Middlename"
              color="green"
              class="q-mb-sm"
              :rules="[(val) => !!val || 'Middlename is required']"
            />
            <q-input
              outlined
              dense
              v-model="lastName"
              label="Lastname"
              color="green"
              class="q-mb-md"
              :rules="[(val) => !!val || 'Lastname is required']"
            />

            <div class="text-subtitle2 text-green-8 q-mb-xs">Suffix (Optional)</div>
            <q-input outlined dense v-model="suffix" color="green" />
          </div>

          <!-- Right Column -->
          <div class="col-6">
            <div class="text-subtitle2 text-green-8 q-mb-xs">Barangay</div>
            <q-select
              outlined
              dense
              v-model="barangay"
              :options="barangayOptions"
              label="Select Barangay"
              color="green"
              class="q-mb-sm"
              emit-value
              map-optionsx
              option-label="name"
              option-value="value"
              :rules="[(val) => !!val || 'Barangay is required']"
            />
            <div class="text-subtitle2 text-green-8 q-mb-xs">Position</div>
            <q-input
              outlined
              dense
              v-model="position"
              color="green"
              class="q-mb-md"
              :rules="[(val) => !!val || 'Position is required']"
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
                      {{ scope.uploadSizeLabel }} / {{ scope.uploadProgressLabel }}
                    </div>
                  </div>
                  <q-btn v-if="scope.canAddFiles" icon="add" round dense flat color="white">
                    <q-uploader-add-trigger />
                  </q-btn>
                  <q-btn
                    v-if="scope.canRemoveFiles"
                    icon="clear"
                    round
                    dense
                    flat
                    color="red"
                    @click="scope.removeQueuedFiles"
                    class="q-ml-auto"
                  />
                </div>
              </template>

              <template v-slot:list="scope">
                <q-list separator>
                  <q-item v-for="file in scope.files" :key="file.name">
                    <q-item-section>
                      <q-item-label>{{ file.name }}</q-item-label>
                      <q-item-label caption>
                        {{ file.sizeLabel }} • {{ file.__statusLabel }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn
                        icon="delete"
                        round
                        dense
                        flat
                        color="red"
                        @click="scope.removeFile(file)"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </template>
            </q-uploader>
            <!-- Add this preview section below the uploader -->
            <q-img
              v-if="photoUrl"
              :src="photoUrl"
              style="max-width: 200px; margin-top: 10px"
              spinner-color="primary"
            />
          </div>
        </div>

        <q-stepper-navigation class="row justify-between q-mt-md">
          <div class="text-caption text-gray">
            Already have an account?
            <span class="text-blue cursor-pointer" @click="$router.push('/')"> Sign in. </span>
          </div>
          <q-btn @click="step = 2" color="green" label="Continue" />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 2: Account Credentials -->

      <q-step :name="2" title="Account Info" icon="lock" :done="step > 2">
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-input
              outlined
              dense
              v-model="email"
              label="Email"
              color="green"
              :rules="[(val) => !!val || 'Email is required']"
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
              v-model="username"
              label="Username"
              color="green"
              :rules="[(val) => !!val || 'Username is required']"
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-6">
            <q-input
              outlined
              dense
              v-model="password"
              label="Password"
              type="password"
              color="green"
              :rules="[(val) => val.length >= 8 || 'Minimum 8 characters']"
            >
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
            </q-input>
          </div>
          <div class="col-6">
            <q-input
              outlined
              dense
              v-model="confirmPassword"
              label="Confirm Password"
              type="password"
              color="green"
              :rules="[
                (val) => !!val || 'Required',
                (val) => val === password || 'Passwords do not match',
              ]"
            >
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

    // Your existing ref declarations remain the same
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

    onMounted(async () => {
      try {
        const response = await api.get('/api/barangay/barangays')
        barangayOptions.value = response.data.map((b) => ({
          name: b.name,
          value: b.name, // Still showing name to user but will convert to ID later
        }))
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: `Failed to load barangays list: ${error.message}`,
          position: 'top',
        })
      }
    })

    // Your existing file handlers remain exactly the same
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

    const handleSubmit = async () => {
      // Basic validations
      if (!firstName.value.trim()) {
        $q.notify({ type: 'warning', message: 'First name is required' })
        return
      }

      if (!lastName.value.trim()) {
        $q.notify({ type: 'warning', message: 'Last name is required' })
        return
      }

      if (!barangay.value) {
        $q.notify({ type: 'warning', message: 'Please select your barangay' })
        return
      }

      if (!position.value.trim()) {
        $q.notify({ type: 'warning', message: 'Position is required' })
        return
      }

      if (!email.value.trim()) {
        $q.notify({ type: 'warning', message: 'Email is required' })
        return
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        $q.notify({ type: 'warning', message: 'Please enter a valid email address' })
        return
      }

      if (!username.value.trim()) {
        $q.notify({ type: 'warning', message: 'Username is required' })
        return
      } else if (username.value.length < 4) {
        $q.notify({ type: 'warning', message: 'Username must be at least 4 characters' })
        return
      }

      if (!password.value) {
        $q.notify({ type: 'warning', message: 'Password is required' })
        return
      } else if (password.value.length < 8) {
        $q.notify({ type: 'warning', message: 'Password must be at least 8 characters' })
        return
      }

      if (!confirmPassword.value) {
        $q.notify({ type: 'warning', message: 'Please confirm your password' })
        return
      }

      if (password.value !== confirmPassword.value) {
        $q.notify({ type: 'warning', message: 'Passwords do not match' })
        return
      }

      if (!uploadedFile.value) {
        $q.notify({ type: 'warning', message: 'Please select a profile photo' })
        return
      }

      // File type validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
      if (!allowedTypes.includes(uploadedFile.value.type)) {
        $q.notify({
          type: 'negative',
          message: 'Invalid file type. Only JPG, PNG or GIF are allowed',
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
        })
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
          photo: uploadResult.path, // Use the path from upload
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
      // Your existing return object remains exactly the same
      step,
      firstName,
      middleName,
      lastName,
      barangay,
      barangayOptions,
      position,
      suffix,
      uploadedFile,
      photoUrl,
      email,
      username,
      password,
      confirmPassword,
      isLoading,
      onFileAdded,
      onFileRemoved,
      onFileRejected,
      handleSubmit,
      uploadedFiles,
      cardWidth: $q.screen.lt.sm ? '100%' : $q.screen.lt.md ? '80%' : '50%',
    }
  },
}
</script>

<style scoped>
.signup-card {
  width: 700px;
  padding: 30px;
  border-radius: 10px;
  background: rgba(255, 255, 255);
  position: relative;
  box-shadow: 0 4px 8px rgb(38, 121, 0);
  margin-top: 110px;
  margin-bottom: 20px;
}

.header-section {
  margin-top: 30px;
  margin-bottom: 20px;
}

.text-gray {
  color: #666;
}

/* Custom stepper styles */
/*
.stepper-custom .q-stepper__header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.stepper-custom .q-stepper__tab--active .q-stepper__title {
  font-weight: bold;
  color: var(--q-primary);
}

.stepper-custom .q-stepper__tab--active .q-stepper__dot {
  background: var(--q-primary);
}

/* Custom styling for the uploader */
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

/* Make it match your existing green theme */
</style>
