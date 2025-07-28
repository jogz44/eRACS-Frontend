<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
       <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">User Access</div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          round
          @click="loadPendingUsers"
          :loading="loading"
          title="Refresh pending users"
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
          class="user-access-table"
          :pagination="{ rowsPerPage: 10 }"
          :rows-per-page-options="[10, 25, 50, 100]"
        >
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
      <q-dialog v-model="accessModal.show" persistent>
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
            <q-btn label="Save" color="primary" @click="saveAccess" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'UserAccessPage',
  data() {
    return {
      loading: false,
      search: '',
      users: [
        { id: 1, fullname: 'John Doe', barangay: 'Visayan Village', position: 'Manager', username: 'johndoe' },
        { id: 2, fullname: 'Jane Smith', barangay: 'Apokon',position: 'Developer', username: 'janesmith' },
        // Add more users as needed
      ],
      columns: [
        { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
        { name: 'fullname', label: 'NAME', field: 'fullname', align: 'left', sortable: true },
        { name: 'barangay', label: 'BARANGAY', field: 'barangay', align: 'left', sortable: true },
        { name: 'position', label: 'POSITION', field: 'position', align: 'left', sortable: true },
        { name: 'username', label: 'USERNAME', field: 'username', align: 'left', sortable: true },
        { name: 'actions', label: 'ACTIONS', align: 'center', sortable: false },
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
        const nameMatch = user.fullname.toLowerCase().includes(query)

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
  methods: {
    openAccessModal(user) {
      this.accessModal.selectedUser = user
      this.accessModal.show = true
    },
    closeAccessModal() {
      this.accessModal.show = false
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
.search-input {
  width: 450px;
}

.user-access-table {
  border-radius: 8px;
  overflow: hidden;
}

.actions-column {
  white-space: nowrap;
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
