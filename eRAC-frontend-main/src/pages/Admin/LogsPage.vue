<template>
  <q-page class="q-pa-lg" style="background-color: whitesmoke;">
    <div class="page-header q-mb-lg">
       <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">Log Activities</div>
      <AdminLogsActivity
        v-model="showAdminLogsActivity"
        :selected-user="selectedLog"
      />
          <q-btn
          icon="refresh"
          color="primary"
          flat
          round
          @click="loadLogs"
          :loading="loading"
          title="Refresh logs"
        />
        </div>

      <q-card-section>
        <!-- Search and Filter Bar -->
        <div class="row q-mb-md items-center">
          <!-- Text Search -->
          <q-input
            dense
            outlined
            bg-color="white"
            v-model="search"
            placeholder="Search by ID, Name, Barangay, Position, or Date..."
            class="search-input q-mr-md"
            clearable
            @clear="onSearchClear"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <!-- Barangay Filter -->
          <q-select
            dense
            outlined
            v-model="selectedBarangay"
            :options="barangayOptions"
            label="Filter by Barangay"
            class="filter-select q-mr-md"
            clearable
            @clear="onBarangayClear"
            emit-value
            map-options
            options-dense
          />

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
          />

          <!-- Date Range Filter -->
          <q-input
            dense
            outlined
            :model-value="dateRangeDisplay"
            label="Date Range"
            class="date-range-input"
            clearable
            @clear="onDateRangeClear"
            readonly
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

        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
          </q-td>
        </template>
          <!-- Custom Date Formatting -->
          <template v-slot:body-cell-date="props">
            <q-td :props="props" class="text-left">
              {{ formatDate(props.row.log_date) }}
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-center">
              <q-btn
                label="VIEW ACTIVITY"
                color="green"
                size="sm"
                @click="openAdminLogsActivity(props.row)"
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
import { date } from 'quasar'
import AdminLogsActivity from './AdminLogsActivity.vue'

export default {
  name: 'LogsPage',
  components: {
    AdminLogsActivity
  },
  data() {
    return {
      showAdminLogsActivity: false,
      selectedLog: null,
      loading: false,
      search: '',
      selectedBarangay: null,
      selectedPosition: null,
      dateRange: null,
      logs: [],
      columns: [
        {
          name: 'date',
          label: 'Date',
          field: 'log_date',
          align: 'left',
          sortable: true
        },
        {
          name: 'fullname',
          label: 'Name',
          field: 'fullname',
          align: 'left',
          sortable: true
        },
        {
          name: 'barangay',
          label: 'Barangay',
          field: 'barangay',
          align: 'left',
          sortable: true
        },
        {
          name: 'position',
          label: 'Position',
          field: 'position',
          align: 'left',
          sortable: true
        },
        {
          name: 'actions',
          label: 'Actions',
          align: 'center',
          sortable: false
        },
      ],
    }
  },
  computed: {
    // Get unique barangay options from logs
    barangayOptions() {
      const uniqueBarangays = [...new Set(this.logs.map(log => log.barangay).filter(Boolean))]
      return uniqueBarangays.map(barangay => ({
        label: barangay,
        value: barangay
      })).sort((a, b) => a.label.localeCompare(b.label))
    },

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

      const fromDate = date.formatDate(this.dateRange.from, 'MMM D, YYYY')
      const toDate = date.formatDate(this.dateRange.to, 'MMM D, YYYY')
      return `${fromDate} - ${toDate}`
    },

    filteredLogs() {
      let filtered = [...this.logs]

      // Apply text search filter
      const query = this.search.toLowerCase().trim()
      if (query) {
        filtered = filtered.filter(log => {
          // Search by ID
          const idMatch = String(log.id).includes(query)

          // Search by Name
          const nameMatch = log.fullname.toLowerCase().includes(query)

          // Search by Barangay
          const barangayMatch = log.barangay.toLowerCase().includes(query)

          // Search by Position
          const positionMatch = log.position.toLowerCase().includes(query)

          // Search by Date (only match the date part, not time)
          const date = new Date(log.log_date)
          const dateString = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
          const dateMatch = dateString.toLowerCase().includes(query)

          // Return true if any field matches
          return idMatch || nameMatch || barangayMatch || positionMatch || dateMatch
        })
      }

      // Apply barangay filter
      if (this.selectedBarangay) {
        filtered = filtered.filter(log => log.barangay === this.selectedBarangay)
      }

      // Apply position filter
      if (this.selectedPosition) {
        filtered = filtered.filter(log => log.position === this.selectedPosition)
      }

      // Apply date range filter
      if (this.dateRange && this.dateRange.from && this.dateRange.to) {
        filtered = filtered.filter(log => {
          const logDate = new Date(log.log_date)
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
    openAdminLogsActivity(row) {
      this.selectedLog = row;
      this.showAdminLogsActivity = true;
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      return date.formatDate(dateString, 'MMMM D, YYYY')
    },
    async loadLogs() {
      this.loading = true
      try {
        const response = await api.get('/api/admin/admin/logs')
        // The API returns log_date, so we don't need to transform it
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
    openAccessModal(row) {
      // Store the selected row data for the modal
      console.log('Opening modal for row:', row)
      // TODO: Implement modal logic
    },
    // Filter clear methods
    onSearchClear() {
      this.search = ''
    },
    onBarangayClear() {
      this.selectedBarangay = null
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
      this.search = ''
      this.selectedBarangay = null
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
}

:deep(.q-table td) {
  height: 48px;
}

/* Make filter backgrounds white */
:deep(.q-input) {
  background-color: white !important;
}

:deep(.q-select) {
  background-color: white !important;
}

@media (max-width: 600px) {
  .search-input,
  .filter-select,
  .date-range-input,
  .clear-all-btn {
    width: 100%;
  }
}
</style>
