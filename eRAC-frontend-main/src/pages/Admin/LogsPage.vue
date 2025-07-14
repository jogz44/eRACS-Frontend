<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
      <div class="text-h5 text-weight-bold">User Access</div>
      <q-card-section>
        <!-- Search Bar Only -->
        <div class="row q-mb-md">
          <q-input dense outlined v-model="search" placeholder="Search..." class="search-input">
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
              {{ formatDate(props.row.date) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'LogsPage',
  data() {
    return {
      search: '',
      logs: [
        {
          id: 1,
          fullname: 'John Doe',
          date: '02/27/25',
          activity: 'Accessed Appropriation',
        },
        {
          id: 2,
          fullname: 'John Doe',
          date: '02/25/25',
          activity: 'Accessed Augmentation',
        },
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
  methods: {
    formatDate(dateString) {
      // Implement your date formatting logic here
      return dateString // Return formatted date
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
