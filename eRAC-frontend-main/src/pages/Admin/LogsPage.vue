<template>
  <q-page class="q-pa-md logs-page">
    <div class="page-header q-mb-md">
      <div class="text-h6 text-weight-medium">Log Activities</div>
    </div>

    <AdminLogsActivity
      v-if="selectedLog"
      v-model="showAdminLogsActivity"
      :selected-user="selectedLog"
      @update:model-value="onDialogClose"
    />

    <div class="q-mb-sm">
      <div class="row items-center q-gutter-sm">
        <q-input
          outlined
          dense
          v-model="search"
          placeholder="Search by ID, Name, Barangay, Position, or Date..."
          style="min-width: 300px; max-width: 300px;"
          clearable
          @clear="onSearchClear"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-select
          outlined
          dense
          v-model="selectedBarangay"
          :options="barangayOptions"
          label="Filter by Barangay"
          style="min-width: 200px; max-width: 200px;"
          clearable
          @clear="onBarangayClear"
          emit-value
          map-options
        />

        <q-select
          outlined
          dense
          v-model="selectedPosition"
          :options="positionOptions"
          label="Filter by Position"
          style="min-width: 200px; max-width: 200px;"
          clearable
          @clear="onPositionClear"
          emit-value
          map-options
        />

        <q-input
          outlined
          dense
          :model-value="dateRangeDisplay"
          label="Date Range"
          style="min-width: 200px; max-width: 200px;"
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

        <q-btn
          dense
          outlined
          color="red-10"
          icon="clear_all"
          label="Clear All"
          style="width: 120px;"
          @click="clearAllFilters"
        />
      </div>
    </div>

    <q-card flat bordered>
      <q-table
        flat
        :rows="filteredLogs"
        :columns="columns"
        row-key="id"
        :pagination="{ rowsPerPage: 10 }"
        :rows-per-page-options="[10, 25, 50, 100]"
      >
        <template v-slot:body-cell-date="props">
          <q-td :props="props">
            {{ formatDate(props.row.log_date) }}
          </q-td>
        </template>

        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <div class="text-weight-medium">
              {{ props.row.fullname || 'Admin User' }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-barangay="props">
          <q-td :props="props">
            <div class="text-weight-medium">
              {{ props.row.barangay || 'Admin' }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              label="View Activity"
              color="primary"
              dense
              @click="openAdminLogsActivity(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script>
import { api } from 'boot/axios'
import { date } from 'quasar'
import AdminLogsActivity from './AdminLogsActivity.vue'
import { usePageLogging } from '../../composables/usePageLogging'

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
    barangayOptions() {
      const uniqueBarangays = [...new Set(this.logs.map(log => log.barangay).filter(Boolean))]
      return uniqueBarangays.map(barangay => ({
        label: barangay,
        value: barangay
      })).sort((a, b) => a.label.localeCompare(b.label))
    },

    positionOptions() {
      const uniquePositions = [...new Set(this.logs.map(log => log.position).filter(Boolean))]
      return uniquePositions.map(position => ({
        label: position,
        value: position
      })).sort((a, b) => a.label.localeCompare(b.label))
    },

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

      const query = this.search.toLowerCase().trim()
      if (query) {
        filtered = filtered.filter(log => {
          const idMatch = String(log.id).includes(query)
          const nameMatch = log.fullname.toLowerCase().includes(query)
          const barangayMatch = log.barangay.toLowerCase().includes(query)
          const positionMatch = log.position.toLowerCase().includes(query)
          const date = new Date(log.log_date)
          const dateString = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
          const dateMatch = dateString.toLowerCase().includes(query)
          return idMatch || nameMatch || barangayMatch || positionMatch || dateMatch
        })
      }

      if (this.selectedBarangay) {
        filtered = filtered.filter(log => log.barangay === this.selectedBarangay)
      }

      if (this.selectedPosition) {
        filtered = filtered.filter(log => log.position === this.selectedPosition)
      }

      if (this.dateRange && this.dateRange.from && this.dateRange.to) {
        filtered = filtered.filter(log => {
          const logDate = new Date(log.log_date)
          const fromDate = new Date(this.dateRange.from)
          const toDate = new Date(this.dateRange.to)

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
    
    // Log page visit
    const { logPageVisit } = usePageLogging()
    await logPageVisit('Log Activities')
  },
  methods: {
    openAdminLogsActivity(row) {
      console.log('Opening admin logs activity for row:', row);
      this.selectedLog = row;
      this.showAdminLogsActivity = true;
    },
    onDialogClose(value) {
      if (!value) {
        // Dialog is closing, clear the selected log
        this.selectedLog = null;
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      return date.formatDate(dateString, 'MMMM D, YYYY')
    },
    async loadLogs() {
      this.loading = true
      try {
        // Use the correct admin logs endpoint
        const response = await api.get('/api/admin/logs')
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
      // Filtering is handled automatically by the computed property
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
.logs-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

/* Prevent dropdown stretching */
.q-select {
  max-width: 200px !important;
}

.q-input {
  max-width: 300px !important;
}

/* Ensure proper filter layout */
.row.items-center.q-gutter-sm {
  flex-wrap: wrap;
  gap: 12px;
}

.row.items-center.q-gutter-sm > * {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }

  .row.items-center.q-gutter-sm {
    flex-direction: column;
    align-items: stretch;
  }

  .row.items-center.q-gutter-sm > * {
    margin-bottom: 8px;
    width: 100%;
  }

  .q-select,
  .q-input {
    max-width: 100% !important;
  }
}
</style>
