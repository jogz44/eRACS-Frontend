<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card class="card-table" style="width: 1000px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">User Activities</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-card-section class="q-pa-md">
        <div class="user-info q-mb-md">
          <div class="text-subtitle1 text-weight-bold">{{ selectedUser?.fullname }}</div>
          <div class="text-caption">{{ selectedUser?.position }} - {{ selectedUser?.barangay }}</div>
        </div>

        <div class="activity-list q-mt-md">
          <q-timeline color="primary">
            <q-timeline-entry
              v-for="activity in activities"
              :key="activity.id"
              :title="activity.action"
              :subtitle="formatDate(activity.created_at)"
              :color="getActionColor(activity.action)"
            >
              <div class="text-body2">{{ activity.description }}</div>
            </q-timeline-entry>
          </q-timeline>
        </div>

        <div v-if="loading" class="text-center q-pa-md">
          <q-spinner color="primary" size="2em" />
          <div class="q-mt-sm">Loading activities...</div>
        </div>

        <div v-if="!loading && activities.length === 0" class="text-center q-pa-md">
          <q-icon name="info" size="2em" color="grey" />
          <div class="text-grey q-mt-sm">No activities found for this user.</div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth'
import { date } from 'quasar'

export default {
  name: 'LogsActivity',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    selectedUser: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const authStore = useAuthStore()
    const loading = ref(false)
    const activities = ref([])

    // Computed property for v-model binding
    const dialogModel = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    // Watch for dialog value changes
    watch(() => props.modelValue, (newValue) => {
      if (newValue && props.selectedUser) {
        loadActivities()
      }
    })

    const loadActivities = async () => {
      loading.value = true
      try {
        const response = await api.get(`/api/barangay/getlogs/${props.selectedUser.id}`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            'Content-Type': 'application/json',
          }
        })
        activities.value = response.data
      } catch (error) {
        console.error('Error loading activities:', error)
      } finally {
        loading.value = false
      }
    }

    const formatDate = (dateString) => {
      return date.formatDate(dateString, 'MMMM D, YYYY h:mm A')
    }

    const getActionColor = (action) => {
      const colorMap = {
        'Login': 'primary',
        'Logout': 'orange',
        'Registration': 'positive',
        'Reset Password': 'warning',
        'Check the Logs': 'info'
      }
      return colorMap[action] || 'grey'
    }

    const closeDialog = () => {
      dialogModel.value = false
    }

    return {
      loading,
      activities,
      formatDate,
      getActionColor,
      closeDialog,
      dialogModel
    }
  }
}
</script>

<style scoped>
.card-table {
  background-color: white;
}

.user-info {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1rem;
}

.activity-list {
  max-height: 500px;
  overflow-y: auto;
}

:deep(.q-timeline__title) {
  font-weight: 600;
}

:deep(.q-timeline__subtitle) {
  color: #666;
}
</style>

