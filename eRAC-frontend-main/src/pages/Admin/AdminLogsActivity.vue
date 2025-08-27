<template>
  <q-dialog v-model="dialogModel" persistent  >
    <q-card class="card-table" style="width: 1000px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">User Activities</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-card-section class="q-pa-md">
        <div class="user-info q-mb-md">
          <div class="text-subtitle1 text-weight-bold">{{ selectedUser?.fullname }} - {{ formatDate(selectedUser?.log_date) }}</div>
          <div class="text-caption">{{ selectedUser?.position }} - {{ selectedUser?.barangay }}</div>
        </div>

        <q-table
          flat
          bordered
          :rows="activities"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :pagination="{ rowsPerPage: 10 }"
          :rows-per-page-options="[10, 25, 50]"
        >
          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">
              {{ formatTime(props.row.created_at) }}
            </q-td>
          </template>

          <template v-slot:body-cell-description="props">
            <q-td :props="props">
              <div class="activity-description">
                <span class="text-weight-medium">{{ props.row.activity }}:</span>
                {{ props.row.details }}
              </div>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width row justify-center items-center no-data-message">
              <div class="text-center">
                <q-icon name="info" size="2em" color="grey" />
                <div class="text-grey q-mt-sm">No activities found for this user.</div>
              </div>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { date } from 'quasar'
import { api } from 'boot/axios' // Adjust the import based on your axios setup
import { useAuthStore } from 'stores/auth'

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
    const loading = ref(false)
    const activities = ref([])



    const columns = [
      {
        name: 'created_at',
        label: 'Time',
        field: 'created_at',
        sortable: true,
        align: 'left'
      },
      {
        name: 'description',
        label: 'Activity Description',
        field: 'description',
        sortable: false,
        align: 'left'
      }
    ]

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
      
      // Validate selectedUser data
      if (!props.selectedUser || !props.selectedUser.id || !props.selectedUser.log_date) {
        console.error('Invalid selectedUser data:', props.selectedUser)
        activities.value = []
        loading.value = false
        return
      }
      
      // Debug: Log the selectedUser data
      console.log('Loading activities for user:', {
        userId: props.selectedUser?.id,
        logDate: props.selectedUser?.log_date,
        fullUser: props.selectedUser
      })
      
      try {
        const apiUrl = `/api/admin/logs/${props.selectedUser.id}/${props.selectedUser.log_date}`
        console.log('Making API call to:', apiUrl)
        
        const response = await api.get(apiUrl, {
          headers: {
            'Authorization': `Bearer ${useAuthStore().adminToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        console.log('API response:', response.data)
        
        if (response.data && Array.isArray(response.data)) {
          activities.value = response.data
        } else {
          console.warn('Invalid response format:', response.data)
          activities.value = []
        }
      } catch (error) {
        console.error('Error loading activities:', error)
        // Clear activities on error and show empty state
        activities.value = []
        
        // Show user-friendly error message
        if (error.response?.status === 404) {
          console.warn('No logs found for this user and date')
          // Show a user-friendly message in the UI
          activities.value = []
        } else if (error.response?.status === 401) {
          console.error('Unauthorized - please check your login status')
          activities.value = []
        } else if (error.code === 'ERR_NETWORK') {
          console.error('Network error - please check your connection')
          activities.value = []
        } else {
          // For other errors, still clear the activities
          activities.value = []
        }
      } finally {
        loading.value = false
      }
    }

    const formatTime = (dateString) => {
      return date.formatDate(dateString, 'h:mm A')
    }
    const formatDate = (dateString) => {
      return date.formatDate(dateString, 'MMMM D, YYYY')
    }

    const closeDialog = () => {
      dialogModel.value = false
    }

    return {
      loading,
      activities,
      columns,
      formatTime,
      formatDate,
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

.activity-description {
  white-space: normal;
  line-height: 1.4;
}

:deep(.q-table th) {
  font-weight: bold;
  background-color: #f5f5f5 !important;
}

:deep(.q-table td) {
  height: 48px;
}

.no-data-message {
  min-height: 200px;
}
</style>

