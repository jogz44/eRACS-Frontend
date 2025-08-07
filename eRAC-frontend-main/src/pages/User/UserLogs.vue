<template>
  <q-page class="q-pa-lg" style="background-color: whitesmoke;">
    <div class="page-header q-mb-lg">
      <div class="text-h5 text-weight-bold">User Log Activities</div>
      </div>
      <LogsActivity
        v-model="showLogsActivity"
        :selected-user="selectedLog"
      />
      <q-card-section>
        <!-- Search and Filter Bar -->
        <div class="row q-mb-md items-center">
          <!-- Text Search -->
          <q-input
            dense
            outlined
            bg-color="white"
            v-model="searchQuery"
            placeholder="Search by ID, Name, or Date..."
            class="search-input q-mr-md"
            clearable
            @clear="onSearchClear"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <!-- Position Filter -->
          <q-select
            dense
            outlined
            v-model="selectedPosition"
            :options="positionOptions"
            label="Filter by Position"
            class="filter-select q-mr-md"
            clearable
            @clear="onPositionClear"
            emit-value
            map-options
            options-dense
            bg-color="white"
          />

          <!-- Date Range Filter -->
          <q-input
            dense
            outlined
            :model-value="dateRangeDisplay"
            label="Date Range"
            class="date-range-input q-mr-md"
            clearable
            @clear="onDateRangeClear"
            readonly
            bg-color="white"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="dateRange"
                    range
                    @update:model-value="onDateRangeChange"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <!-- Clear All Filters Button -->
          <q-btn
            dense
            outlined
            color="red-10"
            icon="clear_all"
            label="Clear All"
            @click="clearAllFilters"
            class="clear-all-btn"
          />
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
              {{ formatDate(props.row.log_date) }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-center" style="text-align: center;">
              <q-btn
                label="VIEW ACTIVITY"
                color="green"
                size="sm"
                @click="openLogsActivity(props.row)"
                class="view-button"
                style="margin: 0 auto;"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

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
      selectedLog: null,
      loading: false,
      searchQuery: '',
      selectedPosition: null,
      dateRange: null,
      logs: [],
      columns: [
        { name: 'id', label: 'ID', field: 'id', align: 'center', sortable: true, headerAlign: 'center' },
        { name: 'fullname', label: 'Fullname', field: 'fullname', align: 'center', sortable: true, headerAlign: 'center' },
        { name: 'date', label: 'Date', field: 'created_at', align: 'center', sortable: true, headerAlign: 'center' },
        { name: 'actions', label: 'Actions', align: 'center', sortable: false, headerAlign: 'center' },
      ],
    }
  },
  computed: {
    // Get unique position options from logs
    positionOptions() {
      const uniquePositions = [...new Set(this.logs.map(log => log.position).filter(Boolean))]
      return uniquePositions.map(position => ({
        label: position,
        value: position
      })).sort((a, b) => a.label.localeCompare(b.label))
    },

    // Format date range for display
    dateRangeDisplay() {
      if (!this.dateRange || !this.dateRange.from || !this.dateRange.to) {
        return ''
      }

      const fromDate = new Date(this.dateRange.from).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      const toDate = new Date(this.dateRange.to).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      return `${fromDate} - ${toDate}`
    },

    filteredLogs() {
      let filtered = [...this.logs]

      // Apply text search filter
      const query = this.searchQuery.toLowerCase().trim()
      if (query) {
        filtered = filtered.filter(log => {
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
      }

      // Apply position filter
      if (this.selectedPosition) {
        filtered = filtered.filter(log => log.position === this.selectedPosition)
      }

      // Apply date range filter
      if (this.dateRange && this.dateRange.from && this.dateRange.to) {
        filtered = filtered.filter(log => {
          const logDate = new Date(log.created_at)
          const fromDate = new Date(this.dateRange.from)
          const toDate = new Date(this.dateRange.to)

          // Set time to start of day for from date and end of day for to date
          fromDate.setHours(0, 0, 0, 0)
          toDate.setHours(23, 59, 59, 999)

          return logDate >= fromDate && logDate <= toDate
        })
      }

      return filtered
    },
  },
  async mounted() {
    await this.loadLogs()
  },
  methods: {
    openLogsActivity(row) {
      this.selectedLog = row;
      this.showLogsActivity = true;
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        // hour: 'numeric',
        // minute: '2-digit',
        // hour12: true
      })
    },
    async loadLogs() {
      this.loading = true
      try {
        const response = await api.get(`/api/barangay/getlogs`, getAuthConfig())
        this.logs = response.data.data
        console.log('Loaded logs:', this.logs) // Debug: Check if data is loaded
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
    // Filter clear methods
    onSearchClear() {
      this.searchQuery = ''
    },
    onPositionClear() {
      this.selectedPosition = null
    },
    onDateRangeClear() {
      this.dateRange = null
    },
    onDateRangeChange() {
      // This method is called when the date range is updated
      // The filtering is handled automatically by the computed property
    },
    clearAllFilters() {
      this.searchQuery = ''
      this.selectedPosition = null
      this.dateRange = null
    },
  },
}
</script>

<style scoped>
.search-input {
  width: 300px;
}

.filter-select {
  width: 200px;
}

.date-range-input {
  width: 200px;
}

.clear-all-btn {
  min-width: 120px;
}

.logs-table {
  border-radius: 4px;
  overflow: hidden;
}

:deep(.q-table th) {
  font-weight: bold;
  background-color: #f5f5f5 !important;
  text-align: center !important;
}

/* Align all headers and cells to center */
:deep(.q-table th[data-col="id"]) {
  text-align: center !important;
}

:deep(.q-table th[data-col="fullname"]) {
  text-align: center !important;
}

:deep(.q-table th[data-col="date"]) {
  text-align: center !important;
}

:deep(.q-table th[data-col="actions"]) {
  text-align: center !important;
}

/* Align all table cells to center */
:deep(.q-table td[data-col="id"]) {
  text-align: center !important;
}

:deep(.q-table td[data-col="fullname"]) {
  text-align: center !important;
}

:deep(.q-table td[data-col="date"]) {
  text-align: center !important;
}

:deep(.q-table td[data-col="actions"]) {
  text-align: center !important;
}

:deep(.q-table td) {
  height: 48px;
}

.view-button {
  text-transform: uppercase;
  font-weight: 500;
  min-width: 120px;
  display: block;
  margin: 0 auto;
}

/* Ensure actions column is properly aligned */
:deep(.q-table td[data-col="actions"]) {
  text-align: center !important;
}

:deep(.q-table th[data-col="actions"]) {
  text-align: center !important;
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

  /* Keep date column visible on mobile */
  /* .logs-table th:nth-child(3),
  .logs-table td:nth-child(3) {
    display: none !important;
  } */

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

  /* Keep date column visible on mobile */
  /* .logs-table th:nth-child(3),
  .logs-table td:nth-child(3) {
    display: none !important;
  } */
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
.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}

</style>
