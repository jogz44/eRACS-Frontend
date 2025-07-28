<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
      <div class="text-h5 text-weight-bold">User Log Activities</div>
      <LogsActivity v-model="showLogsActivity"/>
      <q-card-section>
        <!-- Search Field -->
        <div class="row q-mb-md">
          <q-input
            dense
            outlined
            bg-color="white"
            v-model="searchQuery"
            placeholder="Search by ID, Name, or Date..."
            class="search-input"
            clearable
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- Logs Table -->
        <q-table
          flat
          bordered
          :rows="filteredLogs"
          :columns="columns"
          row-key="id"
          class="logs-table"
          v-model:pagination="pagination"
          :pagination="{ rowsPerPage: 10 }"
          :rows-per-page-options="[10, 25, 50, 100]"
        >

        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
          </q-td>
        </template>

          <!-- Custom Date Formatting -->
          <template v-slot:body-cell-date="props">
            <q-td :props="props" class="text-center">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-center">
              <q-btn
                label="VIEW ACTIVITY"
                color="green"
                size="sm"
                @click="openLogsActivity"
                class="view-button"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </div>
  </q-page>
</template>

<script>
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth'
import LogsActivity from './LogsActivity.vue'


const authStore = useAuthStore()
const getAuthConfig = () => {
  console.log('Current auth token:', authStore.token ? 'Token exists' : 'No token')

  if (!authStore.token) {
    console.warn('No authentication token found')
    throw new Error('Authentication required')
  }

  return {
    headers: {
      Authorization: `Bearer ${authStore.token}`,
      'Content-Type': 'application/json',
    },
  }
}

export default {
  name: 'LogsPage',
  components:{
    LogsActivity
  },
  data() {
    return {
      showLogsActivity: false,
      loading: false,
      searchQuery: '',
      logs: [],
      columns: [
        { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
        { name: 'fullname', label: 'Fullname', field: 'fullname', align: 'left', sortable: true },
        { name: 'date', label: 'Date', field: 'date', align: 'center', sortable: true },

        { name: 'actions', label: 'Actions', align: 'center', sortable: false },
      ],
    }
  },
  computed: {
    filteredLogs() {
      const query = this.searchQuery.toLowerCase().trim()
      if (!query) return this.logs

      return this.logs.filter(log => {
        // Search by ID
        const idMatch = String(log.id).includes(query)

        // Search by Name
        const nameMatch = log.fullname.toLowerCase().includes(query)

        // Search by Date (only match the date part, not time)
        const date = new Date(log.created_at)
        const dateString = date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
        const dateMatch = dateString.toLowerCase().includes(query)

        // Return true if any of the fields match
        return idMatch || nameMatch || dateMatch
      })
    },
  },
  async mounted() {
    await this.loadLogs()
  },
  methods: {
    openLogsActivity() {
      this.showLogsActivity = true;

    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    },
    async loadLogs() {
      this.loading = true
      try {
        const response = await api.get(`/api/barangay/getlogs/${authStore.getUserID()}`, getAuthConfig())
        this.logs = response.data.data
      } catch (error) {
        console.error('Error loading logs:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Failed to load logs',
          position: 'top',
        })
      } finally {
        this.loading = false
      }
    },
    openAccessModal(row) {
      // Store the selected row data for the modal
      console.log('Opening modal for row:', row)
      // TODO: Implement modal logic
    },
  },
}
</script>

<style scoped>
.search-input {
  width: 450px;
}

.logs-table {
  border-radius: 4px;
  overflow: hidden;
}

:deep(.q-table th) {
  font-weight: bold;
  background-color: #f5f5f5 !important;
}

:deep(.q-table td) {
  height: 48px;
}

.view-button {
  text-transform: uppercase;
  font-weight: 500;
  min-width: 120px;
}

@media (max-width: 600px) {
  .search-input {
    width: 100%;
  }
}
</style>
