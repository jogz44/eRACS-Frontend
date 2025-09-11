<template>
  <q-page class="q-pa-md user-logs-page">
    <div class="page-header q-mb-md">
      <div class="text-h6 text-weight-medium">User Log Activities</div>
    </div>

    <LogsActivity v-model="showLogsActivity" :selected-user="selectedLog" />
    <q-card flat bordered class="q-mb-md filters-section">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="q-mb-sm">
            <div class="row items-center q-gutter-sm">
              <q-input
                outlined
                dense
                v-model="searchQuery"
                placeholder="Search by ID, Name, or Date..."
                style="min-width: 300px"
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
                v-model="selectedPosition"
                :options="positionOptions"
                label="Filter by Position"
                style="min-width: 200px"
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
                style="min-width: 200px"
                clearable
                @clear="onDateRangeClear"
                readonly
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="dateRange" range @update:model-value="onDateRangeChange" />
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
                @click="clearAllFilters"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

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

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              label="View Activity"
              color="primary"
              dense
              @click="openLogsActivity(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script>
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth'
import LogsActivity from './LogsActivity.vue'
import { usePageLogging } from '../../composables/usePageLogging'

const authStore = useAuthStore()
const getAuthConfig = () => {

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
  components: {
    LogsActivity,
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
        { name: 'id', label: 'ID', field: 'id', align: 'center', sortable: true },
        { name: 'fullname', label: 'Fullname', field: 'fullname', align: 'center', sortable: true },
        { name: 'date', label: 'Date', field: 'created_at', align: 'center', sortable: true },
        { name: 'actions', label: 'Actions', align: 'center', sortable: false },
      ],
    }
  },
  computed: {
    positionOptions() {
      const uniquePositions = [...new Set(this.logs.map((log) => log.position).filter(Boolean))]
      return uniquePositions
        .map((position) => ({
          label: position,
          value: position,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
    },

    dateRangeDisplay() {
      if (!this.dateRange || !this.dateRange.from || !this.dateRange.to) {
        return ''
      }

      const fromDate = new Date(this.dateRange.from).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      const toDate = new Date(this.dateRange.to).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      return `${fromDate} - ${toDate}`
    },

    filteredLogs() {
      let filtered = [...this.logs]

      const query = this.searchQuery.toLowerCase().trim()
      if (query) {
        filtered = filtered.filter((log) => {
          const idMatch = String(log.id).includes(query)
          const nameMatch = log.fullname.toLowerCase().includes(query)
          const date = new Date(log.log_date)
          const dateString = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
          const dateMatch = dateString.toLowerCase().includes(query)
          return idMatch || nameMatch || dateMatch
        })
      }

      if (this.selectedPosition) {
        filtered = filtered.filter((log) => log.position === this.selectedPosition)
      }

      if (this.dateRange && this.dateRange.from && this.dateRange.to) {
        filtered = filtered.filter((log) => {
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
    openLogsActivity(row) {
      this.selectedLog = row
      this.showLogsActivity = true
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    },
    async loadLogs() {
      this.loading = true
      try {
        const response = await api.get(`/api/barangay/getlogs`, getAuthConfig())
        // Backend returns an array directly
        this.logs = Array.isArray(response.data) ? response.data : response.data?.data || []
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
      this.searchQuery = ''
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
      this.searchQuery = ''
      this.selectedPosition = null
      this.dateRange = null
    },
  },
}
</script>

<style scoped>
.user-logs-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}
.btn-match-input {
  height: 40px;
  padding: 0 16px;
  border-radius: 4px;
}
.btn-match-input :deep(.q-btn__content) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1; /* let align-items center do the vertical alignment */
}

.btn-match-input :deep(.q-icon) {
  font-size: 18px;
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
}
</style>
