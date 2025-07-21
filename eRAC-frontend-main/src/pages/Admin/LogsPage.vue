<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
      <div class="text-h5 text-weight-bold">User Access</div>
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
      search: '',
      logs: [
      ],
      columns: [
        { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
        { name: 'fullname', label: 'Fullname', field: 'fullname', align: 'left', sortable: true },
        { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
        { name: 'activity', label: 'Activity', field: 'activity', align: 'left', sortable: true },
      ],
    }
  },
  computed: {
    filteredLogs() {
      const searchTerm = this.search.toLowerCase()
      return this.logs.filter(
        (log) =>
          log.fullname.toLowerCase().includes(searchTerm) ||
          log.activity.toLowerCase().includes(searchTerm) ||
          log.date.toLowerCase().includes(searchTerm),
      )
    },
  },
  async mounted() {
    await this.loadLogs()
  },
  methods: {
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
    formatDate(dateString) {
      // Implement your date formatting logic here
      return dateString // Return formatted date
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
