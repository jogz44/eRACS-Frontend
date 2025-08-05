<template>
  <q-page class="q-pa-lg" style="background-color: whitesmoke;">
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
        <!-- Search and Filter Bar -->
        <div class="row q-mb-md items-center">
          <!-- Text Search -->
          <q-input
            dense
            outlined
            bg-color="white"
            v-model="search"
            placeholder="Search by ID or Name"
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
      selectedBarangay: null,
      selectedPosition: null,
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
    // Get unique barangay options from users
    barangayOptions() {
      const uniqueBarangays = [...new Set(this.users.map(user => user.barangay).filter(Boolean))]
      return uniqueBarangays.map(barangay => ({
        label: barangay,
        value: barangay
      })).sort((a, b) => a.label.localeCompare(b.label))
    },

    // Get unique position options from users
    positionOptions() {
      const uniquePositions = [...new Set(this.users.map(user => user.position).filter(Boolean))]
      return uniquePositions.map(position => ({
        label: position,
        value: position
      })).sort((a, b) => a.label.localeCompare(b.label))
    },

    filteredUsers() {
      let filtered = [...this.users]

             // Apply text search filter
       const query = this.search.toLowerCase().trim()
       if (query) {
         filtered = filtered.filter(user => {
           // Format ID both ways for matching
           const formattedId = this.formatId(user.id) // with leading zeros (e.g., "0001")
           const rawId = String(user.id) // without leading zeros (e.g., "1")
           const idMatch = formattedId.includes(query) || rawId.includes(query)

           const nameMatch = user.name.toLowerCase().includes(query)
           const usernameMatch = user.username.toLowerCase().includes(query)
           return idMatch || nameMatch || usernameMatch
         })
       }

      // Apply barangay filter
      if (this.selectedBarangay) {
        filtered = filtered.filter(user => user.barangay === this.selectedBarangay)
      }

      // Apply position filter
      if (this.selectedPosition) {
        filtered = filtered.filter(user => user.position === this.selectedPosition)
      }

      return filtered
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

      // Load existing permissions or set defaults
      const permissions = user.permissions || {
        view: true,
        add: true,
        edit: true,
        delete: false,
        print: true,
      }

      // Update modal permissions
      this.accessModal.permissions.view.value = permissions.view
      this.accessModal.permissions.add.value = permissions.add
      this.accessModal.permissions.edit.value = permissions.edit
      this.accessModal.permissions.delete.value = permissions.delete
      this.accessModal.permissions.print.value = permissions.print

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
    clearAllFilters() {
      this.search = ''
      this.selectedBarangay = null
      this.selectedPosition = null
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

.clear-all-btn {
  min-width: 120px;
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
  .clear-all-btn {
    width: 100%;
  }
}
</style>
