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
        <q-input dense outlined bg-color="white" v-model="search" placeholder="Search..." class="search-bar">
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- User Table -->
        <q-table
          flat
          bordered
          :rows="filteredUsers"
          :columns="columns"
          row-key="id"
          :loading="loading"
          class="user-table"
        >
        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ props.pageIndex + 1 }}
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
              <strong>Position:<br /></strong> {{ viewModal.selectedRow?.position }}
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
            <!-- <div class="q-mt-sm flex flex-left">
              <q-img
                :src="viewModal.selectedRow?.avatar || 'https://www.w3schools.com/w3images/avatar2.png'"
                style="max-width: 200px; border-radius: 8px"
                spinner-color="grey-5"
                contain
              />
            </div> -->
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
        {
          name: 'index',
          label: '#',
          field: 'index', 
          align: 'left',
          sortable: false, // optional: disable sorting
        },
        { name: 'name', label: 'NAME', field: 'name', align: 'left', sortable: true  },
        { name: 'barangay', label: 'BARANGAY', field: 'barangay', align: 'left', sortable: true  },
        { name: 'position', label: 'POSITION', field: 'position', align: 'left', sortable: true  },
        { name: 'username', label: 'USERNAME', field: 'username', align: 'left', sortable: true  },
        { name: 'email', label: 'EMAIL', field: 'email', align: 'left' },
        { name: 'action', label: '', field: 'action', align: 'center' },
      ],
    }
  },
  computed: {
    filteredUsers() {
      return this.users.filter(
        (user) =>
          user.username.toLowerCase().includes(this.search.toLowerCase()) ||
          user.email.toLowerCase().includes(this.search.toLowerCase()) ||
          user.name.toLowerCase().includes(this.search.toLowerCase()),
      )
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

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 1000px) {
  .search-bar {
    width: 1000px;
  }

  .action-buttons {
    flex-wrap: wrap;
  }
}
</style>
