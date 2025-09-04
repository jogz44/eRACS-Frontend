<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card class="card-table" style="width: 1000px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">User Activities</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-card-section class="q-pa-md">
        <div class="user-info q-mb-md ">
          <div class="text-subtitle1 text-weight-bold">{{ selectedUser?.fullname }} - {{ formatDate(selectedUser?.log_date) }}</div>
          <div class="text-caption">{{ selectedUser?.position }} - {{ selectedUser?.barangay }}</div>
        </div>

        <!-- Search Filter -->
        <div class="filter-section q-mb-md">
          <div class="row items-center q-gutter-md">
            <div class="col-auto">
              <q-input
                v-model="searchQuery"
                label="Search activities"
                outlined
                dense
                clearable
                debounce="300"
                style="min-width: 260px;"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
          </div>
        </div>

        <q-table
        :table-header-style="{ position: 'sticky', top: '0', zIndex: 3, background: 'white' }"
        class="activity-table"
          flat
          bordered
          :rows="groupedRows"
          :columns="columns"
          row-key="_key"
          :loading="loading"
          :pagination="{ rowsPerPage: 10 }"
          :rows-per-page-options="[10, 25, 50]"
        >
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="created_at" :props="props" class="text-weight-medium">
                {{ props.row.headerTime }}
            </q-td>
              <q-td key="description" :props="props">
              <div class="activity-description">
                  <span class="text-weight-medium">{{ props.row.header.activity }}:</span>
                  {{ props.row.header.details }}
                </div>
                <div v-if="props.row.children && props.row.children.length" class="children-list q-mt-sm">
                  <div
                    v-for="child in props.row.children"
                    :key="child.id"
                    class="child-item"
                  >
                    <span class="child-time">{{ formatTime(child.created_at) }}</span>
                    <span class="child-sep">-</span>
                    <span class="child-text"><span class="text-weight-medium">{{ child.activity }}:</span> {{ child.details }}</span>
                  </div>
              </div>
            </q-td>
            </q-tr>
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
import { api } from 'boot/axios'

export default {
  name: 'LogsActivity',
  props: {
    modelValue: { type: Boolean, required: true },
    selectedUser: { type: Object, required: true }
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const loading = ref(false)
    const activities = ref([])
    const searchQuery = ref('')

    const columns = [
      { name: 'created_at', label: 'Time', field: 'created_at', sortable: false, align: 'left' },
      { name: 'description', label: 'Activity Description', field: 'description', sortable: false, align: 'left' }
    ]



    const dialogModel = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    watch(() => props.modelValue, (newValue) => {
      if (newValue && props.selectedUser) {
        loadActivities()
      }
    })

    const loadActivities = async () => {
      loading.value = true
      try {
        const response = await api.get(`/api/admin/logs/${props.selectedUser.id}/${props.selectedUser.log_date}`)
        activities.value = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Error loading activities:', error)
        activities.value = []
      } finally {
        loading.value = false
      }
    }

    const VISITED_PREFIX = 'Visited '



    const groupedRows = computed(() => {
      let filteredActivities = activities.value
      if (searchQuery.value && searchQuery.value.trim() !== '') {
        const q = searchQuery.value.toLowerCase().trim()
        filteredActivities = activities.value.filter(activity => {
          const combined = `${activity.activity} ${activity.details}`.toLowerCase()
          return combined.includes(q)
        })
      }

      // First, find all page visits and create groups (keep original chronological order for grouping)
      const chronologicalActivities = [...filteredActivities].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      const pageGroups = []
      const allActivities = []

      chronologicalActivities.forEach((act, idx) => {
        if (typeof act.details === 'string' && act.details.startsWith(VISITED_PREFIX)) {
          pageGroups.push({
            _key: `h-${idx}-${act.id}`,
            header: act,
            headerTime: formatTime(act.created_at),
            children: [],
            pageStartTime: new Date(act.created_at),
            type: 'page'
          })
        }
      })

      // If no page visits found, create a default group
      if (pageGroups.length === 0) {
        const firstActivity = chronologicalActivities[0]
        if (firstActivity) {
          pageGroups.push({
            _key: 'h-default',
            header: { activity: 'Activity', details: 'General Activities', created_at: firstActivity.created_at },
            headerTime: formatTime(firstActivity.created_at),
            children: [],
            pageStartTime: new Date(firstActivity.created_at),
            type: 'page'
          })
        }
      }

      // Now assign each activity to the appropriate page group (using chronological order)
      chronologicalActivities.forEach((act) => {
        const isVisited = typeof act.details === 'string' && act.details.startsWith(VISITED_PREFIX)
        const isAuth = act.activity === 'Login' || act.activity === 'Logout'

        if (!isVisited && !isAuth) {
          // Find the most recent page visit that happened before this activity
          let targetGroup = null
          for (let i = pageGroups.length - 1; i >= 0; i--) {
            if (new Date(act.created_at) >= pageGroups[i].pageStartTime) {
              targetGroup = pageGroups[i]
              break
            }
          }

          // If no suitable group found, add to the first group
          if (!targetGroup && pageGroups.length > 0) {
            targetGroup = pageGroups[0]
          }

          if (targetGroup) {
            targetGroup.children.push(act)
          }
        }
      })

      // Create a flat list of all activities (page visits and login/logout) in chronological order
      chronologicalActivities.forEach((act) => {
        const isVisited = typeof act.details === 'string' && act.details.startsWith(VISITED_PREFIX)
        const isAuth = act.activity === 'Login' || act.activity === 'Logout'

        if (isVisited) {
          // Find the page group for this visit
          const pageGroup = pageGroups.find(group => group.header.id === act.id)
          if (pageGroup) {
            allActivities.push({
              _key: `page-${act.id}`,
              header: act,
              headerTime: formatTime(act.created_at),
              children: pageGroup.children,
              type: 'page'
            })
          }
        } else if (isAuth) {
          // Add login/logout as separate entries
          allActivities.push({
            _key: `auth-${act.id}`,
            header: act,
            headerTime: formatTime(act.created_at),
            children: [],
            type: 'auth'
          })
        }
      })

      // Sort all activities by timestamp (newest first)
      return allActivities.sort((a, b) => new Date(b.header.created_at) - new Date(a.header.created_at))
    })

    const formatTime = (dateString) => date.formatDate(dateString, 'h:mm A')
    const formatDate = (dateString) => date.formatDate(dateString, 'MMMM D, YYYY')

    const closeDialog = () => { dialogModel.value = false }



    return {
      loading,
      activities,
      columns,
      formatTime,
      formatDate,
      closeDialog,
      dialogModel,
      groupedRows,
      searchQuery
    }
  }
}
</script>

<style scoped>
.card-table { background-color: white; }
.user-info { border-bottom: 1px solid #e0e0e0; padding-bottom: 1rem; }
.filter-section {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}
.activity-description { white-space: normal; line-height: 1.4; }
.children-list { border-left: 3px solid #e0e0e0; margin-left: 4px; padding-left: 10px; }
.child-item { display: flex; align-items: baseline; padding: 4px 0; }
.child-time { color: #666; font-size: 12px; min-width: 64px; }
.child-sep { margin: 0 8px; color: #bbb; }
.child-text { color: #333; }
:deep(.q-table th) { font-weight: bold; background-color: #f5f5f5 !important; }
:deep(.q-table td) { height: auto; }
.no-data-message { min-height: 200px; }
.activity-table{ max-height: 400px; }
</style>

