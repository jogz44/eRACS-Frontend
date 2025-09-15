<template>
  <q-page class="q-pa-md profile-settings-page">
    <!-- Page Header -->
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">
          Profile Settings
          <div class="text-caption text-grey-6">
            Manage your account information and preferences
          </div>
        </div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="resetForm"
          :loading="isUpdating"
        />
      </div>
    </div>

    <!-- Profile Information Card -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="bg-grey-1">
        <div class="row items-center">
          <q-icon name="person" size="24px" color="primary" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-medium">Profile Information</div>
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="updateProfile" class="profile-form">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="profileForm.first_name"
                label="First Name"
                outlined
                dense
                :rules="[val => !!val || 'First name is required']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="profileForm.middle_name"
                label="Middle Name"
                outlined
                dense
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="profileForm.last_name"
                label="Last Name"
                outlined
                dense
                :rules="[val => !!val || 'Last name is required']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="profileForm.suffix"
                label="Suffix"
                outlined
                dense
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="profileForm.email"
                label="Email"
                type="email"
                outlined
                dense
                :rules="[
                  val => !!val || 'Email is required',
                  val => isValidEmail(val) || 'Please enter a valid email'
                ]"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="profileForm.username"
                label="Username"
                outlined
                dense
                :rules="[
                  val => !!val || 'Username is required',
                  val => val.length >= 4 || 'Username must be at least 4 characters'
                ]"
              />
            </div>
          </div>

          <!-- Photo Upload Section -->
          <q-separator class="q-my-md" />
          <div class="row items-center q-col-gutter-md">
            <div class="col-auto">
              <div class="photo-upload">
                <div class="current-photo" @mouseenter="onPhotoHover" @mouseleave="onPhotoLeave">
                  <q-avatar size="120px" class="profile-avatar" :class="{ 'uploading': isUploadingPhoto, 'has-preview': photoPreview, 'preview-hover': isHoveringPreview }">
                    <img :src="userPhoto" @error="handleImageError" />
                    <div v-if="isUploadingPhoto" class="upload-overlay">
                      <q-spinner color="white" size="24px" />
                    </div>
                    <div v-if="photoPreview && !isUploadingPhoto" class="preview-badge" @click="removePreview" @mouseenter="onBadgeHover" @mouseleave="onBadgeLeave">
                      <q-icon :name="isHoveringBadge ? 'close' : 'check'" :color="isHoveringBadge ? 'grey-6' : 'white'" size="16px" />
                    </div>
                  </q-avatar>
                  <div class="photo-overlay">
                    <q-btn
                      round
                      color="primary"
                      :icon="isUploadingPhoto ? 'hourglass_empty' : 'camera_alt'"
                      size="sm"
                      :loading="isUploadingPhoto"
                      @click="triggerFileUpload"
                    >
                      <q-tooltip>{{ isUploadingPhoto ? 'Uploading...' : 'Change Photo' }}</q-tooltip>
                    </q-btn>
                  </div>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  @change="handleFileUpload"
                  style="display: none"
                />
              </div>
            </div>
            <div class="col">
              <div class="text-subtitle2 text-weight-medium q-mb-xs">Profile Photo</div>
              <div class="text-body2 text-grey-6">
                Click the camera icon to change your profile photo.
                Supported formats: JPG, PNG, GIF. Max size: 2MB.
              </div>
            </div>
          </div>

          <q-separator class="q-my-md" />
          <div class="row justify-end q-gutter-sm">
            <q-btn
              flat
              color="grey"
              label="Reset"
              @click="resetForm"
              :disable="isUpdating"
            />
            <q-btn
              type="submit"
              color="primary"
              label="Update Profile"
              :loading="isUpdating"
              :disable="!isFormValid"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Change Password Card -->
    <q-card flat bordered>
      <q-card-section class="bg-grey-1">
        <div class="row items-center">
          <q-icon name="lock" size="24px" color="primary" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-medium">Change Password</div>
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="changePassword" class="password-form">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model="passwordForm.current_password"
                label="Current Password"
                type="password"
                outlined
                dense
                :rules="[val => !!val || 'Current password is required']"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="passwordForm.new_password"
                label="New Password"
                type="password"
                outlined
                dense
                :rules="[
                  val => !!val || 'New password is required',
                  val => val.length >= 8 || 'Password must be at least 8 characters'
                ]"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="passwordForm.confirm_password"
                label="Confirm New Password"
                type="password"
                outlined
                dense
                :rules="[
                  val => !!val || 'Please confirm your password',
                  val => val === passwordForm.new_password || 'Passwords do not match'
                ]"
              />
            </div>
          </div>

          <q-separator class="q-my-md" />
          <div class="row justify-end q-gutter-sm">
            <q-btn
              flat
              color="grey"
              label="Reset"
              @click="resetPasswordForm"
              :disable="isChangingPassword"
            />
            <q-btn
              type="submit"
              color="primary"
              label="Change Password"
              :loading="isChangingPassword"
              :disable="!isPasswordFormValid"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'


const $q = useQuasar()
const authStore = useAuthStore()

// Reactive data
const isUpdating = ref(false)
const isChangingPassword = ref(false)
const fileInput = ref(null)
const photoPreview = ref(null)
const isUploadingPhoto = ref(false)
const isHoveringPreview = ref(false)
const isHoveringBadge = ref(false)

// Profile form data
const profileForm = ref({
  first_name: '',
  middle_name: '',
  last_name: '',
  suffix: '',
  email: '',
  username: '',
  photo_path: ''
})

// Password form data
const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

// Computed properties
const userPhoto = computed(() => {
  // Show preview if available
  if (photoPreview.value) {
    return photoPreview.value
  }
  
  // Show current user photo
  if (!authStore.user) return 'src/assets/user.png'
  return authStore.user.photo_url ||
    (authStore.user.photo_path ? `/storage/${authStore.user.photo_path}` : 'src/assets/user.png')
})

const isFormValid = computed(() => {
  return profileForm.value.first_name &&
         profileForm.value.last_name &&
         profileForm.value.email &&
         profileForm.value.username &&
         isValidEmail(profileForm.value.email) &&
         profileForm.value.username.length >= 4
})

const isPasswordFormValid = computed(() => {
  return passwordForm.value.current_password &&
         passwordForm.value.new_password &&
         passwordForm.value.confirm_password &&
         passwordForm.value.new_password.length >= 8 &&
         passwordForm.value.new_password === passwordForm.value.confirm_password
})

// Methods
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const handleImageError = (e) => {
  e.target.src = 'src/assets/user.png'
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const onPhotoHover = () => {
  if (photoPreview.value && !isUploadingPhoto.value) {
    isHoveringPreview.value = true
  }
}

const onPhotoLeave = () => {
  isHoveringPreview.value = false
}

const onBadgeHover = () => {
  isHoveringBadge.value = true
}

const onBadgeLeave = () => {
  isHoveringBadge.value = false
}

const removePreview = () => {
  photoPreview.value = null
  profileForm.value.photo_path = authStore.user?.photo_path || ''
  $q.notify({
    type: 'info',
    message: 'Photo preview removed',
    position: 'top',
    timeout: 2000
  })
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    $q.notify({
      type: 'negative',
      message: 'Please select a valid image file',
      position: 'top'
    })
    return
  }

  // Validate file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    $q.notify({
      type: 'negative',
      message: 'Image size must be less than 2MB',
      position: 'top'
    })
    return
  }

  // Create immediate preview
  const reader = new FileReader()
  reader.onload = (e) => {
    photoPreview.value = e.target.result
  }
  reader.readAsDataURL(file)

  isUploadingPhoto.value = true
  try {
    const result = await authStore.uploadPhoto(file)
    if (result.success) {
      profileForm.value.photo_path = result.path
      // Keep preview visible - don't clear it yet
      // User can see the preview and decide if they want to update profile
      $q.notify({
        type: 'positive',
        message: 'Photo uploaded successfully - click "Update Profile" to save changes',
        position: 'top',
        timeout: 4000
      })
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    // Clear preview on error and revert to original photo
    photoPreview.value = null
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to upload photo',
      position: 'top'
    })
  } finally {
    isUploadingPhoto.value = false
  }
}

const updateProfile = async () => {
  isUpdating.value = true

  try {
    const result = await authStore.updateProfile(profileForm.value)
    
    if (result.success) {
      // Clear photo preview since profile was successfully updated
      photoPreview.value = null
      $q.notify({
        type: 'positive',
        message: 'Profile updated successfully',
        position: 'top'
      })
      // Update the auth store with new user data
      await authStore.initialize()
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    
    let errorMessage = 'Failed to update profile'
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.errors) {
      // Handle validation errors
      const errors = Object.values(error.response.data.errors).flat()
      errorMessage = errors.join(', ')
    } else if (error.message) {
      errorMessage = error.message
    }
    
    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
      timeout: 5000
    })
  } finally {
    isUpdating.value = false
  }
}

const changePassword = async () => {
  isChangingPassword.value = true

  try {
    const result = await authStore.changePassword({
      current_password: passwordForm.value.current_password,
      new_password: passwordForm.value.new_password,
      new_password_confirmation: passwordForm.value.confirm_password
    })

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Password changed successfully',
        position: 'top'
      })
      resetPasswordForm()
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to change password',
      position: 'top'
    })
  } finally {
    isChangingPassword.value = false
  }
}

const resetForm = () => {
  // Clear any photo preview
  photoPreview.value = null
  
  if (authStore.user) {
    profileForm.value = {
      first_name: authStore.user.first_name || '',
      middle_name: authStore.user.middle_name || '',
      last_name: authStore.user.last_name || '',
      suffix: authStore.user.suffix || '',
      email: authStore.user.email || '',
      username: authStore.user.username || '',
      photo_path: authStore.user.photo_path || ''
    }
  } else {
    // Reset to empty values if no user data
    profileForm.value = {
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      email: '',
      username: '',
      photo_path: ''
    }
  }
}

const resetPasswordForm = () => {
  passwordForm.value = {
    current_password: '',
    new_password: '',
    confirm_password: ''
  }
}

// Initialize form with current user data
onMounted(async () => {
  // Ensure user data is loaded before initializing form
  if (!authStore.user) {
    await authStore.initialize()
  }
  resetForm()
})

// Cleanup preview URL on unmount
onUnmounted(() => {
  if (photoPreview.value) {
    URL.revokeObjectURL(photoPreview.value)
  }
})
</script>

<style scoped>
.profile-settings-page {
  background: whitesmoke;
}

/* Photo upload styling */
.photo-upload {
  position: relative;
}

.current-photo {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  border: 3px solid #e0e0e0;
  transition: all 0.3s ease;
  position: relative;
}

.profile-avatar:hover {
  border-color: #1976d2;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
}

.profile-avatar.uploading {
  border-color: #ff9800;
  opacity: 0.8;
}

.profile-avatar.has-preview.preview-hover {
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #4caf50;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
  transform: scale(0.8);
}

.profile-avatar.has-preview.preview-hover .preview-badge {
  opacity: 1;
  transform: scale(1);
}

.preview-badge:hover {
  background: #f5f5f5;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  right: 0;
  background: white;
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.photo-overlay:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Form styling to match other pages */
.profile-form,
.password-form {
  max-width: 100%;
}

/* Button styling to match application theme */
.q-btn {
  transition: all 0.2s ease;
}

.q-btn:hover {
  transform: translateY(-1px);
}

/* Card styling to match other pages */
.q-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.q-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Input styling consistency */
.q-field--outlined .q-field__control {
  border-radius: 4px;
}

.q-field--outlined .q-field__control:hover {
  border-color: #1976d2;
}

/* Header styling to match dashboard */
.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

/* Responsive design */
@media (max-width: 768px) {
  .profile-settings-page {
    padding: 8px;
  }

  .page-header {
    padding: 12px;
  }

  .q-card-section {
    padding: 12px;
  }

  .photo-upload {
    text-align: center;
    margin-bottom: 16px;
  }

  .current-photo {
    display: block;
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .profile-settings-page {
    padding: 4px;
  }

  .page-header {
    padding: 8px;
  }

  .q-card-section {
    padding: 8px;
  }

  .profile-avatar {
    width: 80px !important;
    height: 80px !important;
  }
}
</style>
