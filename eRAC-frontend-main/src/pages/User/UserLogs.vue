<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
       <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">User Access</div>
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
        <!-- Search Bar Only -->
        <div class="row q-mb-md">
          <q-input dense outlined bg-color="white" v-model="search" placeholder="Search..." class="search-input">
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
      search: '',
      logs: [
      ],
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
      const searchTerm = this.search.toLowerCase()
      return this.logs.filter(
        (log) =>
          log.fullname.toLowerCase().includes(searchTerm) ||
          log.position.toLowerCase().includes(searchTerm) ||
          log.activity.toLowerCase().includes(searchTerm) ||
          this.formatDate(log.date).toLowerCase().includes(searchTerm)
      )
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
        const response = await api.get(`/api/barangay/getlogs/${authStore.getUserID()}`,getAuthConfig())
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
    openViewModal(row) {
      this.viewModal.selectedRow = row
      this.viewModal.show = true
    },
  },
}
</script>

<style scoped>
.search-input {
  width: 450px;
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
