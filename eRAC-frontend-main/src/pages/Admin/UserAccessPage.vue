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
            placeholder="Search by ID, Name, Barangay, Position, or Username..."
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
          :rows-per-page-options="[10, 25, 50, 100]"
        >
          <template v-slot:body-cell-id="props">
            <q-td :props="props">
              {{ formatId(props.row.id) }}
            </q-td>
          </template>
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
      loading: false,
      search: '',
      users: [],
      columns: [
        { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
        { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true  },
        { name: 'barangay', label: 'Barangay', field: 'barangay', align: 'left', sortable: true  },
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
      const query = this.search.toLowerCase().trim()
      if (!query) return this.users

      return this.users.filter(user => {
        // Search by ID
        const idMatch = String(user.id).includes(query)

        // Search by Name
        const nameMatch = user.name.toLowerCase().includes(query)

        // Search by Barangay
        const barangayMatch = user.barangay?.toLowerCase().includes(query) || false

        // Search by Position
        const positionMatch = user.position.toLowerCase().includes(query)

        // Search by Username
        const usernameMatch = user.username.toLowerCase().includes(query)

        // Return true if any field matches
        return idMatch || nameMatch || barangayMatch || positionMatch || usernameMatch
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
          message: 'No user selected for access management',
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
  background-color: #f5f5f5 !important;
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

@media (max-width: 600px) {
  .search-input {
    width: 100%;
  }
}
</style>
