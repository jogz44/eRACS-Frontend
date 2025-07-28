<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
       <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">Log Activities</div>
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
        <!-- Search Bar -->
        <div class="row q-mb-md">
          <q-input
            dense
            outlined
            bg-color="white"
            v-model="search"
            placeholder="Search by ID, Name, Barangay, Position, or Date..."
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
          :rows-per-page-options="[10, 25, 50, 100]"
        >
          <!-- Custom Date Formatting -->
          <template v-slot:body-cell-date="props">
            <q-td :props="props" class="text-center">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </div>
  </q-page>
</template>

<script>
import { api } from 'boot/axios'
export default {
  name: 'LogsPage',
  data() {
    return {
      loading: false,
      search: '',
      logs: [],
      columns: [
        { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
        { name: 'fullname', label: 'NAME', field: 'fullname', align: 'left', sortable: true },
        { name: 'barangay', label: 'BARANGAY', field: 'barangay', align: 'left', sortable: true },
        { name: 'position', label: 'POSITION', field: 'position', align: 'left', sortable: true },
        { name: 'date', label: 'DATE', field: 'date', align: 'left', sortable: true },
        { name: 'activity', label: 'ACTIVITY', field: 'activity', align: 'left', sortable: true },
      ],
    }
  },
  computed: {
    filteredLogs() {
      const query = this.search.toLowerCase().trim()
      if (!query) return this.logs

      return this.logs.filter(log => {
        // Search by ID
        const idMatch = String(log.id).includes(query)

        // Search by Name
        const nameMatch = log.fullname.toLowerCase().includes(query)

        // Search by Barangay
        const barangayMatch = log.barangay.toLowerCase().includes(query)

        // Search by Position
        const positionMatch = log.position.toLowerCase().includes(query)

        // Search by Date (only match the date part, not time)
        const date = new Date(log.created_at)
        const dateString = date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
        const dateMatch = dateString.toLowerCase().includes(query)

        // Return true if any field matches
        return idMatch || nameMatch || barangayMatch || positionMatch || dateMatch
      })
    },
  },
  async mounted() {
    await this.loadLogs()
  },
  methods: {
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
        const response = await api.get('/api/admin/admin/logs')
        this.logs = response.data
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

@media (max-width: 600px) {
  .search-input {
    width: 100%;
  }
}
</style>
