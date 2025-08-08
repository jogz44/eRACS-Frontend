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
            placeholder="Search by ID, Name, Username, Email, or Position..."
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

        <!-- User Table -->
        <q-table
          flat
          bordered
          :rows="filteredUsers"
          :columns="columns"
          row-key="id"
          :loading="loading"
          class="user-table"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-id="props">
            <q-td :props="props">
              {{ formatId(props.row.id) }}
            </q-td>
          </template>
          <!-- Custom Actions Column -->
          <template v-slot:body-cell-action="props">
            <q-td :props="props" class="action-buttons">
              <q-btn
                dense
                round
                flat
                color="blue-8"
                icon="visibility"
                size="sm"
                @click="openViewModal(props.row)"
              />
              <q-btn
                dense
                round
                flat
                color="red"
                icon="delete"
                size="sm"
                @click="openDeleteModal(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
      <!-- Delete Confirmation Modal -->
      <q-dialog v-model="deleteModal.show" persistent>
        <q-card style="min-width: 350px">
          <q-card-section class="column items-center">
            <div class="text-h6 q-mb-md">Are you sure you want to delete</div>
            <div class="text-h6 text-weight-bold q-mb-md">
              {{ deleteModal.selectedRow?.username }}?
            </div>
          </q-card-section>

          <q-card-actions align="center" class="q-pb-md">
            <q-btn
              unelevated
              label="Yes"
              color="red"
              @click="confirmDelete"
              :loading="deleteModal.loading"
              class="q-mx-sm"
              style="min-width: 80px"
            />
            <q-btn
              unelevated
              label="Cancel"
              color="grey-8"
              v-close-popup
              class="q-mx-sm"
              style="min-width: 80px"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- View Details Modal -->
      <q-dialog v-model="viewModal.show" persistent>
        <q-card style="min-width: 350px; max-width: 450px">
          <q-card-section>
            <div class="text-h6 text-center q-mb-md">USER DETAILS</div>

            <div class="q-mb-sm">
              <strong>Name:<br /></strong> {{ viewModal.selectedRow?.name }}
            </div>
            <div class="q-mb-sm">
              <strong>Barangay:<br /></strong> {{ viewModal.selectedRow?.barangay }}
            </div>
            <div class="q-mb-sm">
              <strong>Position:<br /></strong> {{ viewModal.selectedRow?.position?.name }}
            </div>
            <div class="q-mb-sm">
              <strong>Username:<br /></strong> {{ viewModal.selectedRow?.username }}
            </div>
            <div class="q-mb-sm">
              <strong>Email:<br /></strong> {{ viewModal.selectedRow?.email }}
            </div>
            <div class="q-mb-sm">
              <strong>Approved Date:<br /></strong> {{ viewModal.selectedRow?.created_at }}
            </div>
            <div class="q-mt-md"><strong>Picture:</strong></div>
            <div class="q-mt-sm flex flex-left">
              <q-img
                :src="viewModal.selectedRow?.avatar || 'https://www.w3schools.com/w3images/avatar2.png'"
                style="max-width: 200px; border-radius: 8px"
                spinner-color="grey-5"
                contain
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pb-md q-pr-md">
            <q-btn unelevated label="Close" color="blue-9" v-close-popup style="min-width: 80px" />
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
        { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true  },
        { name: 'barangay', label: 'Barangay', field: 'barangay', align: 'left', sortable: true  },
        { name: 'position', label: 'Position', field: 'position', align: 'left', sortable: true  },
        { name: 'username', label: 'Username', field: 'username', align: 'left', sortable: true  },
        { name: 'email', label: 'Email', field: 'email', align: 'left' },
        { name: 'action', label: 'Action', field: 'action', align: 'center' },
      ],
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
          const emailMatch = user.email.toLowerCase().includes(query)
          const positionMatch = (user.position || '').toLowerCase().includes(query)

          return idMatch || nameMatch || usernameMatch || emailMatch || positionMatch
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
    openDeleteModal(row) {
      this.deleteModal.selectedRow = row
      this.deleteModal.show = true
    },
    async confirmDelete() {
      this.deleteModal.loading = true
      try {
        await api.delete(`/api/admin/users/${this.deleteModal.selectedRow.id}`)
        // Remove from local array
        this.users = this.users.filter(
          (user) => user.id !== this.deleteModal.selectedRow.id,
        )
        // Update localStorage
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

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

/* Make filter backgrounds white */
:deep(.q-input) {
  background-color: white !important;
}

:deep(.q-select) {
  background-color: white !important;
}

@media (max-width: 1000px) {
  .search-input,
  .filter-select,
  .clear-all-btn {
    width: 100%;
  }

  .action-buttons {
    flex-wrap: wrap;
  }
}
</style>
