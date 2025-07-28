<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
       <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">User Log Activities</div>
          <q-btn
          icon="refresh"
          color="primary"
          flat
          round
          @click="loadPendingUsers"
          :loading="loading"
          title="Refresh pending users"
        />
        </div>
      <q-card-section>
        <!-- Single Search Field -->
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
          :pagination="{ rowsPerPage: 10 }"
        >
        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ props.pageIndex + 1 }}
          </q-td>
        </template>

          <!-- Custom Date Formatting -->
          <template v-slot:body-cell-date="props">
            <q-td :props="props">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="actions-column">
              <q-btn label="View Activity" color="primary" size="sm" @click="openAccessModal(props.row)" />
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
  data() {
    return {
      loading: false,
      searchQuery: '',
      logs: [],
      columns: [
        { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
        { name: 'fullname', label: 'Fullname', field: 'fullname', align: 'left', sortable: true },
        { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
        { name: 'activity', label: 'Activity', field: 'activity', align: 'left', sortable: true },
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

        // Search by Date
        const dateMatch = this.formatDate(log.created_at).toLowerCase().includes(query)

        // Return true if any of the fields match
        return idMatch || nameMatch || dateMatch
      })
    },
  },
  async mounted() {
    await this.loadLogs()
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString)
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
      return new Intl.DateTimeFormat('en-US', options).format(date)
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
  width: 300px;
}

:deep(.logs-table thead th) {
  background-color: #f5f5f5;
  font-weight: bold;
  color: #333;
}

@media (max-width: 600px) {
  .search-input {
    width: 100%;
  }
}
</style>
