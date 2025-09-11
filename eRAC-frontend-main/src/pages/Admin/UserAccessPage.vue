<template>
  <q-page class="q-pa-md admin-access-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">
          User Control
          <span class="text-caption q-ml-sm">({{ filteredUsers.length }} users from all barangays)</span>
        </div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="loadAcceptedUsers"
          :loading="loading"
        />
      </div>
    </div>

    <div class="q-mb-sm">
      <div class="row items-center q-gutter-sm">
        <q-input
          outlined
          dense
          v-model="search"
          placeholder="Search by ID, Name, or Position..."
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
      <!-- No Users Message -->
      <div v-if="!loading && filteredUsers.length === 0" class="q-pa-lg text-center">
        <q-icon name="people" size="48px" color="grey-5" />
        <div class="text-h6 text-grey-6 q-mt-md">No Users Found</div>
        <div class="text-body2 text-grey-6">
          {{ users.length === 0 ? 'No users available.' : 'No users match your current filters.' }}
        </div>
      </div>

      <q-table
        v-else
        flat
        :rows="filteredUsers"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="{ rowsPerPage: 10 }"
        :rows-per-page-options="[10, 25, 50, 100]"
      >
        <template v-slot:body-cell-id="props">
          <q-td :props="props">
            {{ formatId(props.row.id) }}
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              label="Access"
              color="primary"
              dense
              @click="openAccessModal(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Access Modal -->
    <q-dialog v-model="accessModal.show" persistent @keydown.enter="handleAccessEnterKey">
      <q-card style="min-width: 400px">
        <q-card-section class="q-pb-none">
          <div class="row items-center justify-between">
            <div class="text-h6">Manage User Access</div>
            <q-btn
              flat
              dense
              round
              icon="close"
              @click="closeAccessModal"
            />
          </div>
          <div class="text-subtitle2 q-mt-sm">
            Username: <strong>{{ accessModal.selectedUser?.username || 'N/A' }}</strong>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-sm">
            <div
              v-for="(permission, key) in accessModal.permissions"
              :key="key"
              class="row items-center justify-between"
            >
              <span class="text-body2">{{ permission.label }}</span>
              <q-toggle v-model="permission.value" color="primary" />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" @click="closeAccessModal" />
          <q-btn label="Save" color="primary" @click="handleAccessSaveClick" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { api } from 'boot/axios'
import { useUserControlStore } from 'stores/userControlStore'
import { useAuthStore } from 'stores/auth'
import { usePageLogging } from '../../composables/usePageLogging'
import { useActivityLogging } from '../../composables/useActivityLogging'

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
        { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
        { name: 'barangay', label: 'Barangay', field: 'barangay', align: 'left', sortable: true },
        { name: 'position', label: 'Position', field: 'position', align: 'left', sortable: true },
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
    barangayOptions() {
      const uniqueBarangays = [...new Set(this.users.map(user => user.barangay).filter(Boolean))]
      return uniqueBarangays.map(barangay => ({
        label: barangay,
        value: barangay
      })).sort((a, b) => a.label.localeCompare(b.label))
    },

    positionOptions() {
      const uniquePositions = [...new Set(this.users.map(user => user.position).filter(Boolean))]
      return uniquePositions.map(position => ({
        label: position,
        value: position
      })).sort((a, b) => a.label.localeCompare(b.label))
    },

    filteredUsers() {
      let filtered = [...this.users]

      const query = this.search.toLowerCase().trim()
      if (query) {
        filtered = filtered.filter(user => {
          const formattedId = this.formatId(user.id)
          const rawId = String(user.id)
          const idMatch = formattedId.includes(query) || rawId.includes(query)
          const nameMatch = user.name.toLowerCase().includes(query)
          const usernameMatch = user.username.toLowerCase().includes(query)
          return idMatch || nameMatch || usernameMatch
        })
      }

      if (this.selectedBarangay) {
        filtered = filtered.filter(user => user.barangay === this.selectedBarangay)
      }

      if (this.selectedPosition) {
        filtered = filtered.filter(user => user.position === this.selectedPosition)
      }
      return filtered
    },
  },
  async mounted() {
    // Log page visit
    const { logPageVisit } = usePageLogging()
    await logPageVisit('User Control')
    
    
    const cached = localStorage.getItem('acceptedUsers');
    if (cached) {
      try {
        this.users = JSON.parse(cached);
      } catch {
        this.users = [];
      }
    }
    await this.loadAcceptedUsers();
  },
  activated() {
    const userControlStore = useUserControlStore()
    if (userControlStore.hasRecentAction('user_accepted')) {
      this.loadAcceptedUsers()
      userControlStore.clearLastAction()
    }
  },
  methods: {
    formatId(id) {
      return id.toString().padStart(4, '0')
    },
    async loadAcceptedUsers() {
      this.loading = true
      try {
        const response = await api.get('/api/admin/users/accepted')
        this.users = response.data
        localStorage.setItem('acceptedUsers', JSON.stringify(this.users));
      } catch (error) {
        console.error('Error loading users:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Failed to load users',
          position: 'top',
        })
      } finally {
        this.loading = false
      }
    },

    openAccessModal(user) {
      this.accessModal.selectedUser = user

      const permissions = user.permissions || {
        view: true,
        add: true,
        edit: true,
        delete: false,
        print: true,
      }

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
    validateAccess() {
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

    async saveAccess() {
      try {
        // Validate user selection
        if (!this.accessModal.selectedUser || !this.accessModal.selectedUser.id) {
          throw new Error('No user selected')
        }
        
        // Validate user ID is a valid number
        const userId = parseInt(this.accessModal.selectedUser.id)
        if (isNaN(userId) || userId <= 0) {
          throw new Error('Invalid user ID')
        }

        // Ensure all permission values are boolean
        const permissions = {
          view: Boolean(this.accessModal.permissions.view.value),
          add: Boolean(this.accessModal.permissions.add.value),
          edit: Boolean(this.accessModal.permissions.edit.value),
          delete: Boolean(this.accessModal.permissions.delete.value),
          print: Boolean(this.accessModal.permissions.print.value),
        }

        // Capture previous permissions to compute changes (match barangay logic)
        const previous = (this.accessModal.selectedUser && this.accessModal.selectedUser.permissions) || {
          view: true,
          add: true,
          edit: true,
          delete: false,
          print: true,
        }
        

        const response = await api.post(`/api/admin/user-access/${userId}`, {
          permissions
        }, {
          headers: {
            'Authorization': `Bearer ${useAuthStore().adminToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })

        if (response.data.status === 'success') {
          this.$q.notify({
            type: 'positive',
            message: 'Access permissions saved successfully!',
            position: 'top',
          })

          const userIndex = this.users.findIndex(u => u.id === this.accessModal.selectedUser.id)
          if (userIndex !== -1) {
            this.users[userIndex].permissions = permissions
          }

          // Log admin activity matching barangay useraccess format (only changed flags)
          try {
            const { logAdminActivity } = useActivityLogging()
            const u = this.accessModal.selectedUser || {}
            const fullName = u.name || [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ').trim()
            const position = (u.position && u.position.name) || u.position || u.position_name || 'Unknown Position'
            const barangay = u.barangay || u.barangay_name || 'Unknown Barangay'
            const labels = { view: 'View', add: 'Add', edit: 'Edit', delete: 'Delete', print: 'Print' }
            const changes = []
            Object.keys(labels).forEach((key) => {
              const oldVal = Boolean(previous[key])
              const newVal = Boolean(permissions[key])
              if (oldVal !== newVal) {
                changes.push(`${newVal ? 'Enabled' : 'Disabled'} ${labels[key]}`)
              }
            })
            const changeDescription = changes.length ? `${changes.join(', ')}` : 'No changes detected'
            const details = `${changeDescription} for user "${fullName}" (${position} in ${barangay}) `
            await logAdminActivity('Updated User Permissions', details)
          } catch (e) {
            console.warn('Failed to log access update activity:', e)
          }

          this.closeAccessModal()
        } else {
          throw new Error(response.data.message || 'Failed to save permissions')
        }
      } catch (error) {
        console.error('Error saving permissions:', error)
        console.error('Error response:', error.response)
        console.error('Error response data:', error.response?.data)
        console.error('Error request:', error.request)
        console.error('Error config:', error.config)
        
        let errorMessage = 'Failed to save permissions. Please try again.'
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.message) {
          errorMessage = error.message
        }
        
        // Check for network errors
        if (error.code === 'ERR_NETWORK') {
          errorMessage = 'Network error - please check your connection'
        } else if (error.response?.status === 401) {
          errorMessage = 'Unauthorized - please log in again'
        } else if (error.response?.status === 404) {
          errorMessage = 'API endpoint not found - please contact administrator'
        } else if (error.response?.status === 422) {
          // Validation error
          const validationErrors = error.response.data.errors
          if (validationErrors) {
            const errorDetails = Object.entries(validationErrors)
              .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
              .join('; ')
            errorMessage = `Validation error: ${errorDetails}`
          } else {
            errorMessage = 'Validation error - please check your input'
          }
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error - please try again later'
        }
        
        this.$q.notify({
          type: 'negative',
          message: errorMessage,
          position: 'top',
        })
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
.admin-access-page {
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
