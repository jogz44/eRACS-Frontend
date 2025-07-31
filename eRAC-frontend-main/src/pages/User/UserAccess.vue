<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
        <div class="text-h5 text-weight-bold">
          User Control Accepted
          <span class="text-caption q-ml-sm">({{ users.length }} users)</span>
        </div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          round
          @click="loadAcceptedUsers"
          :loading="loading"
          title="Refresh accepted users"
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
            placeholder="Search by ID, Name, or Position..."
            class="search-input"
            clearable
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- User Access Table -->
        <q-table
          flat
          bordered
          :rows="filteredUsers"
          :columns="columns"
          row-key="id"
          :loading="loading"
          class="user-access-table"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-id="props">
            <q-td :props="props">
              {{ formatId(props.row.id) }}
            </q-td>
          </template>
          <!-- Custom Actions Column -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="actions-column">
              <q-btn
                label="ACCESS"
                color="green"
                size="sm"
                @click="openAccessModal(props.row)"
                class="access-button"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
      <!-- Access Modal -->
        <q-dialog v-model="accessModal.show" persistent @keydown.enter="handleAccessEnterKey">
            <q-card style="width: 350px; max-height: 450px; overflow: hidden">
            <!-- Centered Title with Close Button -->
            <q-card-section class="relative-position">
                <div class="text-h6 text-center full-width">Manage User Access</div>
                <q-btn
                class="absolute-top-right"
                flat
                dense
                round
                icon="close"
                @click="closeAccessModal"
                />
                <div class="text-subtitle1 q-mt-sm text-start">
                Username: <strong>{{ accessModal.selectedUser?.username || 'N/A' }}</strong>
                </div>
            </q-card-section>

            <q-card-section>
                <div class="access-grid">
                <div
                    v-for="(permission, key) in accessModal.permissions"
                    :key="key"
                    class="access-row"
                >
                    <span class="access-label">{{ permission.label }}</span>
                    <q-toggle v-model="permission.value" color="primary" />
                </div>
                </div>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn label="Save" color="primary" @click="handleAccessSaveClick" />
            </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
import { api } from 'boot/axios'
import { useUserControlStore } from 'stores/userControlStore'

export default {
  name: 'UserControlAcceptedPage',
  data() {
    return {
      search: '',
      users: [],
      deleteModal: {
        show: false,
        selectedRow: null,
        loading: false,
      },
      viewModal: {
        show: false,
        selectedRow: null,
      },
      columns: [
        { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
        { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true  },
        { name: 'position', label: 'Position', field: 'position', align: 'left', sortable: true  },
        { name: 'actions', label: 'Action', field: 'actions', align: 'center' },
      ],
      accessModal: {
        show: false,
        selectedUser: null,
        permissions: {
          view: { label: 'Access View:', value: false },
          add: { label: 'Access Add:', value: false },
          edit: { label: 'Access Edit:', value: false },
          delete: { label: 'Access Delete:', value: false },
          print: { label: 'Access Print:', value: false },
        },
      },
    }
  },
  computed: {
    filteredUsers() {
      const searchTerm = this.search.toLowerCase().trim()
      if (!searchTerm) return this.users

      return this.users.filter(user => {
        // Search by ID - handle both formatted and unformatted IDs
        const formattedId = this.formatId(user.id)
        const idMatch = formattedId.includes(searchTerm) || String(user.id).includes(searchTerm)

        // Search by Name
        const nameMatch = user.name.toLowerCase().includes(searchTerm)

        // Search by Position
        const positionMatch = user.position.toLowerCase().includes(searchTerm)

        // Return true if any field matches
        return idMatch || nameMatch || positionMatch
      })
    },
  },
  async mounted() {
    // Try to load from localStorage first
    const cached = localStorage.getItem('acceptedUsers');
    if (cached) {
      try {
        this.users = JSON.parse(cached);
      } catch {
        this.users = [];
      }
    }
    // Always fetch latest from API
    await this.loadAcceptedUsers();
  },
  activated() {
    // Check if there was a recent user acceptance action
    const userControlStore = useUserControlStore()
    if (userControlStore.hasRecentAction('user_accepted')) {
      // Auto-refresh if a user was recently accepted
      this.loadAcceptedUsers()
      userControlStore.clearLastAction()
    }
  },
  methods: {
    formatId(id) {
      return id.toString().padStart(4, '0')  // e.g. 1 -> "0001"
    },
    async loadAcceptedUsers() {
      this.loading = true
      try {
        const response = await api.get('/api/admin/users/accepted')
        this.users = response.data
        // Persist to localStorage
        localStorage.setItem('acceptedUsers', JSON.stringify(this.users));

      } finally {
        this.loading = false
      }
    },

    openAccessModal(user) {
      this.accessModal.selectedUser = user
      this.accessModal.show = true
    },
    closeAccessModal() {
      this.accessModal.show = false
    },
    // Validation function
    validateAccess() {
      // Check if at least one permission is selected
      const hasAnyPermission = Object.values(this.accessModal.permissions).some(permission => permission.value)
      
      if (!hasAnyPermission) {
        this.$q.notify({
          type: 'negative',
          message: 'At least one permission must be selected',
          position: 'top',
        })
        return false
      }
      
      if (!this.accessModal.selectedUser) {
        this.$q.notify({
          type: 'negative',
          message: 'No user selected',
          position: 'top',
        })
        return false
      }
      
      return true
    },

    handleAccessEnterKey() {
      if (this.validateAccess()) {
        this.saveAccess()
      }
    },

    handleAccessSaveClick() {
      if (this.validateAccess()) {
        this.saveAccess()
      }
    },

    saveAccess() {
      console.log('Saving access for:', this.accessModal.selectedUser.username)
      console.log('Permissions:', this.accessModal.permissions)

      this.$q.notify({
        type: 'positive',
        message: 'Access permissions saved successfully!',
        position: 'top',
      })

      this.closeAccessModal()
    },
  },
}
</script>

<style scoped>
.search-bar {
  width: 450px;
  margin-bottom: 15px;
}

.user-table {
  border-radius: 10px;
  overflow: hidden;
}

:deep(.q-table tbody td) {
  padding: 8px 16px;
}

.access-button {
  text-transform: uppercase;
  font-weight: 500;
}

:deep(.q-table th) {
  font-weight: bold;
}

:deep(.q-table td) {
  height: 48px;
}

.access-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.access-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.access-label {
  font-size: 1rem;
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

  /* Search input adjustments */
  .search-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  /* Table adjustments */
  .user-access-table {
    font-size: 0.8rem !important;
  }

  .user-access-table th,
  .user-access-table td {
    padding: 8px 4px !important;
  }

  /* Hide less important columns on mobile */
  .user-access-table th:nth-child(3),
  .user-access-table td:nth-child(3) {
    display: none !important;
  }

  .user-access-table th:nth-child(4),
  .user-access-table td:nth-child(4) {
    display: none !important;
  }

  /* Dialog adjustments */
  .q-dialog .q-card {
    width: 95vw !important;
    max-width: 95vw !important;
    margin: 8px !important;
  }

  /* Access modal adjustments */
  .q-dialog .q-card[style*="width: 350px"] {
    width: 95vw !important;
    max-width: 95vw !important;
  }

  /* Access grid adjustments */
  .access-grid {
    gap: 16px !important;
  }

  .access-row {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 8px !important;
  }

  .access-label {
    font-size: 0.9rem !important;
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

  /* Search input adjustments */
  .search-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  /* Table adjustments */
  .user-access-table {
    font-size: 0.85rem !important;
  }

  .user-access-table th,
  .user-access-table td {
    padding: 8px 6px !important;
  }

  /* Hide less important columns on small tablet */
  .user-access-table th:nth-child(3),
  .user-access-table td:nth-child(3) {
    display: none !important;
  }

  /* Dialog adjustments */
  .q-dialog .q-card {
    width: 90vw !important;
    max-width: 90vw !important;
  }

  /* Access modal adjustments */
  .q-dialog .q-card[style*="width: 350px"] {
    width: 90vw !important;
    max-width: 90vw !important;
  }

  /* Access grid adjustments */
  .access-grid {
    gap: 14px !important;
  }

  .access-row {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 8px !important;
  }

  .access-label {
    font-size: 0.95rem !important;
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

  /* Search input adjustments */
  .search-input {
    width: 400px !important;
    min-width: 400px !important;
  }

  /* Table adjustments */
  .user-access-table {
    font-size: 0.9rem !important;
  }

  /* Dialog adjustments */
  .q-dialog .q-card {
    width: 80vw !important;
    max-width: 80vw !important;
  }

  /* Access modal adjustments */
  .q-dialog .q-card[style*="width: 350px"] {
    width: 80vw !important;
    max-width: 80vw !important;
  }

  /* Access grid adjustments */
  .access-grid {
    gap: 12px !important;
  }

  .access-row {
    flex-direction: row !important;
    align-items: center !important;
    gap: 12px !important;
  }

  .access-label {
    font-size: 1rem !important;
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

  /* Search input adjustments */
  .search-input {
    width: 450px !important;
    min-width: 450px !important;
  }

  /* Table adjustments */
  .user-access-table {
    font-size: 1rem !important;
  }

  /* Dialog adjustments */
  .q-dialog .q-card {
    width: 350px !important;
    max-width: 500px !important;
  }

  /* Access modal adjustments */
  .q-dialog .q-card[style*="width: 350px"] {
    width: 350px !important;
    max-width: 500px !important;
  }

  /* Access grid adjustments */
  .access-grid {
    gap: 12px !important;
  }

  .access-row {
    flex-direction: row !important;
    align-items: center !important;
    gap: 12px !important;
  }

  .access-label {
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
  .user-access-table {
    font-size: 0.75rem !important;
  }

  .user-access-table th,
  .user-access-table td {
    padding: 4px 2px !important;
  }

  /* Hide less important columns on mobile */
  .user-access-table th:nth-child(3),
  .user-access-table td:nth-child(3) {
    display: none !important;
  }

  .user-access-table th:nth-child(4),
  .user-access-table td:nth-child(4) {
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
</style>
