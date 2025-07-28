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
          v-model:pagination="pagination"
          :pagination="{ rowsPerPage: 10 }"
        >

        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
          </q-td>
        </template>
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
      pagination: {
        page: 1,
        rowsPerPage: 10
      },
      search: '',
      logs: [
      ],
      columns: [
        {
          name: 'index',
          label: '#',
          field: 'index', 
          align: 'left',
          sortable: false, // optional: disable sorting
        },
        { name: 'fullname', label: 'NAME', field: 'fullname', align: 'left', sortable: true },
        { name: 'barangay', label: 'BARANGAY', field: 'barangay', align: 'left', sortable: true  },
        { name: 'position', label: 'POSITION', field: 'position', align: 'left', sortable: true  },
        { name: 'date', label: 'DATE', field: 'date', align: 'left', sortable: true },
        { name: 'activity', label: 'ACTIVITY', field: 'activity', align: 'left'},
      ],
    }
  },
  computed: {
    filteredLogs() {
      const searchTerm = this.search.toLowerCase()
      return this.logs.filter(
        (log) =>
          log.fullname.toLowerCase().includes(searchTerm) ||
          log.barangay.toLowerCase().includes(searchTerm) ||
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
