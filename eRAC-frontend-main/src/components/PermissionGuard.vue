<template>
  <div v-if="hasPermission">
    <slot />
  </div>
  <div v-else class="permission-denied">
    <q-card class="error-card q-ma-md">
      <q-card-section class="text-center q-pa-lg">
        <q-icon name="block" size="64px" color="negative" class="q-mb-md" />
        <div class="text-h5 text-negative q-mb-md">Access Denied</div>
        <div class="text-body1 text-grey-7">
          You are not permitted to access this resource. Only Barangay Captains are authorized to view this content.
        </div>
        <q-btn 
          color="primary" 
          label="Go Back" 
          @click="goBack" 
          class="q-mt-lg"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const props = defineProps({
  requiredPosition: {
    type: String,
    default: 'Barangay Captain'
  },
  allowedPositions: {
    type: Array,
    default: () => ['Barangay Captain']
  }
})

const router = useRouter()
const authStore = useAuthStore()

const hasPermission = computed(() => {
  if (!authStore.user || !authStore.user.position_name) {
    return false
  }
  
  const userPosition = authStore.user.position_name.toLowerCase().trim()
  const allowedPositions = props.allowedPositions.map(pos => pos.toLowerCase().trim())
  
  return allowedPositions.includes(userPosition)
})

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.permission-denied {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.error-card {
  max-width: 500px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
}
</style>
