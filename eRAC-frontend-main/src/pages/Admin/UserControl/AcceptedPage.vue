<template>
  <q-page class="q-pa-md accepted-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">
          User Control Accepted
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
          placeholder="Search by ID, Name, Username, or Position..."
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
          v-model="selectedBarangay"
          :options="barangayOptions"
          label="Filter by Barangay"
          style="min-width: 200px"
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
          style="min-width: 200px"
          clearable
          @clear="onPositionClear"
          emit-value
          map-options
        />

        <q-btn
          dense
          outlined
          color="negative"
          icon="clear"
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

        <template v-slot:body-cell-created_at="props">
          <q-td :props="props">
            {{ formatDate(props.row.created_at) }}
          </q-td>
        </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-xs">
              <q-btn
                dense
                icon="visibility"
                color="blue"
                @click="openViewModal(props.row)"
              />
              <q-btn
                dense
                icon="delete"
                color="red"
                @click="openDeleteModal(props.row)"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Delete Confirmation Modal -->
    <q-dialog v-model="deleteModal.show" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="text-center">
          <div class="text-h6 q-mb-md">Are you sure you want to delete</div>
          <div class="text-h6 text-weight-medium q-mb-md">
            {{ deleteModal.selectedRow?.username }}?
          </div>
        </q-card-section>

        <q-card-actions align="center" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            label="Yes"
            color="negative"
            @click="confirmDelete"
            :loading="deleteModal.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- View Details Modal -->
    <q-dialog v-model="viewModal.show" persistent>
      <q-card style="min-width: 400px; max-width: 500px">
        <q-card-section class="q-pb-none">
          <div class="row items-center justify-between">
            <div class="text-h6">User Details</div>
            <q-btn
              flat
              dense
              round
              icon="close"
              v-close-popup
            />
          </div>
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-sm">
            <div><strong>Name:</strong> {{ viewModal.selectedRow?.name }}</div>
            <div><strong>Barangay:</strong> {{ viewModal.selectedRow?.barangay }}</div>
            <div><strong>Position:</strong> {{ viewModal.selectedRow?.position?.name }}</div>
            <div><strong>Username:</strong> {{ viewModal.selectedRow?.username }}</div>
            <div><strong>Approved Date:</strong> {{ viewModal.selectedRow?.created_at }}</div>
          </div>

          <div class="q-mt-md">
            <div class="text-subtitle2 q-mb-sm"><strong>Picture:</strong></div>
            <q-img
              :src="viewModal.selectedRow?.avatar || 'https://www.w3schools.com/w3images/avatar2.png'"
              style="max-width: 200px; border-radius: 8px"
              spinner-color="grey-5"
              contain
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="Close" color="primary" v-close-popup />
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
      selectedBarangay: null,
      selectedPosition: null,
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
        { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
        { name: 'barangay', label: 'Barangay', field: 'barangay', align: 'left', sortable: true },
        { name: 'position', label: 'Position', field: 'position', align: 'left', sortable: true },
        { name: 'username', label: 'Username', field: 'username', align: 'left', sortable: true },
        { name: 'email', label: 'Email', field: 'email', align: 'left' },
        { name: 'created_at', label: 'Acceptance Date', field: 'created_at', align: 'left', sortable: true },
        { name: 'action', label: 'Action', field: 'action', align: 'center' },
      ],
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
          const positionMatch = (user.position || '').toLowerCase().includes(query)
          return idMatch || nameMatch || usernameMatch || positionMatch
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
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    async loadAcceptedUsers() {
      this.loading = true
      try {
        const response = await api.get('/api/admin/users/accepted')
        this.users = response.data
        localStorage.setItem('acceptedUsers', JSON.stringify(this.users));
      } finally {
        this.loading = false
      }
    },
    openDeleteModal(row) {
      this.deleteModal.selectedRow = row
      this.deleteModal.show = true
    },
    async confirmDelete() {
      this.deleteModal.loading = true
      try {
        await api.delete(`/api/admin/users/${this.deleteModal.selectedRow.id}`)
        this.users = this.users.filter(
          (user) => user.id !== this.deleteModal.selectedRow.id,
        )
        localStorage.setItem('acceptedUsers', JSON.stringify(this.users));
        this.$q.notify({
          type: 'positive',
          message: 'User deleted successfully',
          position: 'top',
        })
      } catch (error) {
        console.error('Error deleting user:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Failed to delete user',
          position: 'top',
        })
      } finally {
        this.deleteModal.show = false
        this.deleteModal.selectedRow = null
        this.deleteModal.loading = false
      }
    },
    openViewModal(row) {
      this.viewModal.selectedRow = row
      this.viewModal.show = true
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
    clearAllFilters() {
      this.search = ''
      this.selectedBarangay = null
      this.selectedPosition = null
    },
  },
}
</script>

<style scoped>
.accepted-page {
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
