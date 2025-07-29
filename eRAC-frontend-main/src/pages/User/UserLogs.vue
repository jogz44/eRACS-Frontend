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

/* Responsive Design */
@media (max-width: 600px) {
  /* Mobile View */
  
  /* Page header adjustments */
  .page-header {
    margin-bottom: 16px !important;
  }
  
  .page-header .text-h5 {
    font-size: 1.2rem !important;
  }
  
  /* Header row adjustments */
  .row.items-center.justify-between {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 12px !important;
  }
  
  /* Search input adjustments */
  .search-input {
    width: 100% !important;
    min-width: 0 !important;
  }
  
  /* Table adjustments */
  .logs-table {
    font-size: 0.8rem !important;
  }
  
  .logs-table th,
  .logs-table td {
    padding: 8px 4px !important;
  }
  
  /* Hide less important columns on mobile */
  .logs-table th:nth-child(1),
  .logs-table td:nth-child(1) {
    display: none !important;
  }
  
  .logs-table th:nth-child(3),
  .logs-table td:nth-child(3) {
    display: none !important;
  }
  
  /* Button adjustments */
  .q-btn {
    min-height: 44px !important;
  }
  
  /* Text adjustments */
  .text-h5 {
    font-size: 1.2rem !important;
  }
  
  .text-h6 {
    font-size: 1.1rem !important;
  }
  
  .text-subtitle1 {
    font-size: 0.9rem !important;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  /* Small Tablet View */
  
  /* Page header adjustments */
  .page-header {
    margin-bottom: 16px !important;
  }
  
  .page-header .text-h5 {
    font-size: 1.3rem !important;
  }
  
  /* Header row adjustments */
  .row.items-center.justify-between {
    flex-direction: row !important;
    align-items: center !important;
    gap: 16px !important;
  }
  
  /* Search input adjustments */
  .search-input {
    width: 100% !important;
    min-width: 0 !important;
  }
  
  /* Table adjustments */
  .logs-table {
    font-size: 0.85rem !important;
  }
  
  .logs-table th,
  .logs-table td {
    padding: 8px 6px !important;
  }
  
  /* Hide less important columns on small tablet */
  .logs-table th:nth-child(1),
  .logs-table td:nth-child(1) {
    display: none !important;
  }
  
  /* Button adjustments */
  .q-btn {
    min-height: 44px !important;
  }
  
  /* Text adjustments */
  .text-h5 {
    font-size: 1.3rem !important;
  }
  
  .text-h6 {
    font-size: 1.2rem !important;
  }
  
  .text-subtitle1 {
    font-size: 1rem !important;
  }
}

@media (min-width: 901px) and (max-width: 1200px) {
  /* Large Tablet View */
  
  /* Page header adjustments */
  .page-header {
    margin-bottom: 16px !important;
  }
  
  .page-header .text-h5 {
    font-size: 1.4rem !important;
  }
  
  /* Header row adjustments */
  .row.items-center.justify-between {
    flex-direction: row !important;
    align-items: center !important;
    gap: 16px !important;
  }
  
  /* Search input adjustments */
  .search-input {
    width: 400px !important;
    min-width: 400px !important;
  }
  
  /* Table adjustments */
  .logs-table {
    font-size: 0.9rem !important;
  }
  
  /* Button adjustments */
  .q-btn {
    min-width: 120px !important;
  }
  
  /* Text adjustments */
  .text-h5 {
    font-size: 1.4rem !important;
  }
  
  .text-h6 {
    font-size: 1.3rem !important;
  }
  
  .text-subtitle1 {
    font-size: 1.1rem !important;
  }
}

@media (min-width: 1201px) {
  /* Desktop View */
  
  /* Page header adjustments */
  .page-header {
    margin-bottom: 16px !important;
  }
  
  .page-header .text-h5 {
    font-size: 1.5rem !important;
  }
  
  /* Header row adjustments */
  .row.items-center.justify-between {
    flex-direction: row !important;
    align-items: center !important;
    gap: 16px !important;
  }
  
  /* Search input adjustments */
  .search-input {
    width: 450px !important;
    min-width: 450px !important;
  }
  
  /* Table adjustments */
  .logs-table {
    font-size: 1rem !important;
  }
  
  /* Button adjustments */
  .q-btn {
    min-width: 120px !important;
  }
  
  /* Text adjustments */
  .text-h5 {
    font-size: 1.5rem !important;
  }
  
  .text-h6 {
    font-size: 1.4rem !important;
  }
  
  .text-subtitle1 {
    font-size: 1.2rem !important;
  }
}

/* General responsive improvements */
@media (max-width: 900px) {
  /* Adjust text sizes for better readability */
  .text-h5 {
    font-size: 1.2rem !important;
  }
  
  .text-h6 {
    font-size: 1.1rem !important;
  }
  
  .text-subtitle1 {
    font-size: 0.9rem !important;
  }
  
  /* Adjust padding for better mobile experience */
  .q-pa-lg {
    padding: 12px !important;
  }
  
  .q-pa-md {
    padding: 8px !important;
  }
  
  /* Make buttons more touch-friendly */
  .q-btn {
    min-height: 40px !important;
  }
  
  /* Adjust card margins */
  .q-card {
    margin: 4px !important;
  }
  
  /* Ensure proper spacing */
  .q-mb-lg {
    margin-bottom: 16px !important;
  }
  
  .q-mb-md {
    margin-bottom: 12px !important;
  }
  
  .q-mb-sm {
    margin-bottom: 8px !important;
  }
  
  /* Adjust card sections */
  .q-card-section {
    padding: 12px !important;
  }
}

/* Ensure proper spacing in all views */
.q-mb-md {
  margin-bottom: 12px !important;
}

/* Table responsive improvements */
@media (max-width: 600px) {
  .logs-table {
    font-size: 0.75rem !important;
  }
  
  .logs-table th,
  .logs-table td {
    padding: 4px 2px !important;
  }
  
  /* Hide less important columns on mobile */
  .logs-table th:nth-child(1),
  .logs-table td:nth-child(1) {
    display: none !important;
  }
  
  .logs-table th:nth-child(3),
  .logs-table td:nth-child(3) {
    display: none !important;
  }
}

/* Dialog content responsive */
@media (max-width: 600px) {
  .q-card-section {
    padding: 12px !important;
  }
  
  .q-card-actions {
    padding: 8px 12px !important;
  }
  
  /* Make form inputs full width on mobile */
  .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }
  
  /* Adjust button groups */
  .q-card-actions {
    flex-direction: column !important;
    gap: 8px !important;
  }
  
  .q-card-actions .q-btn {
    width: 100% !important;
  }
}

/* Page header responsive */
@media (max-width: 600px) {
  .page-header {
    margin-bottom: 12px !important;
  }
  
  .page-header .text-h5 {
    font-size: 1.1rem !important;
  }
}

/* Search input responsive */
@media (max-width: 600px) {
  .row.q-mb-md {
    margin-bottom: 12px !important;
  }
  
  .row.q-mb-md .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }
}

/* Header row responsive adjustments */
@media (max-width: 600px) {
  .row.items-center.justify-between {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 12px !important;
  }
  
  .row.items-center.justify-between .q-btn {
    align-self: flex-end !important;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  .row.items-center.justify-between {
    flex-direction: row !important;
    align-items: center !important;
    gap: 16px !important;
  }
  
  .row.items-center.justify-between .q-btn {
    flex-shrink: 0 !important;
  }
}

/* Activity button responsive */
@media (max-width: 600px) {
  .actions-column .q-btn {
    width: 100% !important;
    min-width: 0 !important;
  }
  
  .actions-column .q-btn .q-btn__content {
    font-size: 0.8rem !important;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  .actions-column .q-btn {
    min-width: 120px !important;
  }
  
  .actions-column .q-btn .q-btn__content {
    font-size: 0.85rem !important;
  }
}

/* Table header responsive */
@media (max-width: 600px) {
  :deep(.logs-table thead th) {
    font-size: 0.75rem !important;
    padding: 6px 2px !important;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  :deep(.logs-table thead th) {
    font-size: 0.8rem !important;
    padding: 8px 4px !important;
  }
}

@media (min-width: 901px) and (max-width: 1200px) {
  :deep(.logs-table thead th) {
    font-size: 0.9rem !important;
    padding: 10px 6px !important;
  }
}

@media (min-width: 1201px) {
  :deep(.logs-table thead th) {
    font-size: 1rem !important;
    padding: 12px 8px !important;
  }
}
</style>
