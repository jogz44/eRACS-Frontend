<template>
  <q-page class="q-pa-md user-access-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">
          User Control
          <span class="text-caption q-ml-sm">({{ users.length }} users)</span>
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

        <q-btn
          dense
          outlined
           color="red-10"
          icon="clear_all"
          label="Clear All"
          style="width: 9%;"
          @click="clearAllFilters"
        />
      </div>
    </div>

    <q-card flat bordered>
      <q-table
        flat
        :rows="filteredUsers"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="{ rowsPerPage: 10 }"
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

export default {
  name: 'UserControlAcceptedPage',
  data() {
    return {
      loading: false,
      search: '',
      selectedPosition: null,
      users: [],
      columns: [
        { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
        { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
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
    positionOptions() {
      const uniquePositions = [...new Set(this.users.map(user => user.position).filter(Boolean))]
      return uniquePositions.map(position => ({
        label: position,
        value: position
      })).sort((a, b) => a.label.localeCompare(b.label))
    },

    filteredUsers() {
      let filtered = [...this.users]

      const searchTerm = this.search.toLowerCase().trim()
      if (searchTerm) {
        filtered = filtered.filter(user => {
          const formattedId = this.formatId(user.id)
          const idMatch = formattedId.includes(searchTerm) || String(user.id).includes(searchTerm)
          const nameMatch = user.name.toLowerCase().includes(searchTerm)
          const positionMatch = user.position.toLowerCase().includes(searchTerm)
          return idMatch || nameMatch || positionMatch
        })
      }

      if (this.selectedPosition) {
        filtered = filtered.filter(user => user.position === this.selectedPosition)
      }

      return filtered
    },
  },
  async mounted() {
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
      }
      finally {
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

    async saveAccess() {
      try {
        const permissions = {
          view: this.accessModal.permissions.view.value,
          add: this.accessModal.permissions.add.value,
          edit: this.accessModal.permissions.edit.value,
          delete: this.accessModal.permissions.delete.value,
          print: this.accessModal.permissions.print.value,
        }

        const response = await api.post(`/api/user-access/${this.accessModal.selectedUser.id}`, {
          permissions
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

          this.closeAccessModal()
        } else {
          throw new Error(response.data.message || 'Failed to save permissions')
        }
      } catch (error) {
        console.error('Error saving permissions:', error)
        this.$q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to save permissions. Please try again.',
          position: 'top',
        })
      }
    },
    onSearchClear() {
      this.search = ''
    },
    onPositionClear() {
      this.selectedPosition = null
    },
    clearAllFilters() {
      this.search = ''
      this.selectedPosition = null
    },
  },
}
</script>

<style scoped>
.user-access-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
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
