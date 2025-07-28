<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
        <div class="text-h5 text-weight-bold">
          User Control Pending 
          <span class="text-caption q-ml-sm">({{ users.length }} users)</span>
        </div>
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
        <div class="q-mb-lg">
          <q-input dense outlined bg-color="white" v-model="search" placeholder="Search..." class="search-bar">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
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
          v-model:pagination="pagination"
          :pagination="{ rowsPerPage: 10 }"
        >

        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
          </q-td>
        </template>
          <!-- Custom Actions Column -->
          <template v-slot:body-cell-action="props">
            <q-td :props="props" class="action-buttons">
              <q-btn
                dense
                round
                flat
                color="red"
                icon="cancel"
                size="sm"
                @click="openCancelModal(props.row)"
              />
              <q-btn
                dense
                round
                flat
                color="green"
                icon="check_circle"
                size="sm"
                class="q-mx-sm"
                @click="openAcceptModal(props.row)"
              />
              <q-btn
                dense
                round
                flat
                color="blue-8"
                icon="visibility"
                size="sm"
                class="q-mx-sm"
                @click="openViewModal(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
      <!-- Cancel Confirmation Modal -->
      <q-dialog v-model="cancelModal.show" persistent>
        <q-card style="min-width: 350px">
          <q-card-section class="column items-center">
            <div class="text-h6 q-mb-md">Are you sure you want to remove</div>
            <div class="text-h6 text-weight-bold q-mb-md">
              {{ cancelModal.selectedRow?.username }} ?
            </div>
          </q-card-section>

          <q-card-actions align="center" class="q-pb-md">
            <q-btn
              unelevated
              label="Yes"
              color="red"
              @click="confirmCancel"
              :loading="cancelModal.loading"
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

      <!-- Accept Confirmation Modal -->
      <q-dialog v-model="acceptModal.show" persistent>
        <q-card style="min-width: 350px">
          <q-card-section class="column items-center">
            <div class="text-h6 q-mb-md">Are you sure you want to accept</div>
            <div class="text-h6 text-weight-bold q-mb-md">
              {{ acceptModal.selectedRow?.username }}?
            </div>
          </q-card-section>

          <q-card-actions align="center" class="q-pb-md">
            <q-btn
              unelevated
              label="Confirm"
              color="green"
              @click="confirmAccept"
              :loading="acceptModal.loading"
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
            <div class="text-h6 text-center q-mb-md">SIGN UP DETAILS</div>

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
              <strong>Request Date:<br /></strong> {{ viewModal.selectedRow?.created_at }}
            </div>
            <div class="q-mt-md">
              <strong>Picture<br /></strong>
            </div>
            <div class="q-mt-sm flex" style="align-items: flex-start; gap: 20px">
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
//import { useUserControlStore } from 'stores/userControlStore'

export default {
  data() {
    return {
      pagination: {
        page: 1,
        rowsPerPage: 10
      },
      search: '',
      users: [],
      loading: false,
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
      cancelModal: {
        show: false,
        selectedRow: null,
        loading: false,
      },
      acceptModal: {
        show: false,
        selectedRow: null,
        loading: false,
      },
      viewModal: {
        show: false,
        selectedRow: null,
      },
    }
  },
  computed: {
    filteredUsers() {
      return this.users.filter(
        (user) =>
          user.username.toLowerCase().includes(this.search.toLowerCase()) ||
          user.email.toLowerCase().includes(this.search.toLowerCase()) ||
          user.name.toLowerCase().includes(this.search.toLowerCase()) ||
          (user.position || '').toLowerCase().includes(this.search.toLowerCase()),
      )
    },
  },
  async mounted() {
    // Try to load from localStorage first
    const cached = localStorage.getItem('pendingUsers');
    if (cached) {
      try {
        this.users = JSON.parse(cached);
      } catch {
        this.users = [];
      }
    }
    // Always fetch latest from API
    await this.loadPendingUsers();
  },
  activated() {
    // Refresh data when component is activated (when navigating to this page)
    this.loadPendingUsers()
  },
  methods: {
    async loadPendingUsers() {
      this.loading = true
      try {
        const response = await api.get('/api/admin/users/pending')
        this.users = response.data
        // Persist to localStorage
        localStorage.setItem('pendingUsers', JSON.stringify(this.users));
      }  finally {
        this.loading = false
      }
    },
    openCancelModal(row) {
      this.cancelModal.selectedRow = row
      this.cancelModal.show = true
    },
    openAcceptModal(row) {
      this.acceptModal.selectedRow = row
      this.acceptModal.show = true
    },
    openViewModal(row) {
      this.viewModal.selectedRow = row
      this.viewModal.show = true
    },
    async confirmCancel() {
      this.cancelModal.loading = true
      try {
        await api.delete(`/api/admin/users/${this.cancelModal.selectedRow.id}`)
        // Remove from local array
        this.users = this.users.filter(
          (user) => user.id !== this.cancelModal.selectedRow.id,
        )
        // Update localStorage
        localStorage.setItem('pendingUsers', JSON.stringify(this.users));
        this.$q.notify({
          type: 'positive',
          message: 'User removed successfully',
          position: 'top',
        })
      } catch (error) {
        console.error('Error deleting user:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Failed to remove user',
          position: 'top',
        })
      } finally {
        this.cancelModal.selectedRow = null
        this.cancelModal.show = false
        this.cancelModal.loading = false
      }
    },
    async confirmAccept() {
      this.acceptModal.loading = true
      try {
        await api.patch(`/api/admin/users/${this.acceptModal.selectedRow.id}/approve`)
        // Remove from local array (user is now approved and should appear in accepted list)
        this.users = this.users.filter(
          (user) => user.id !== this.acceptModal.selectedRow.id,
        )
        // Update localStorage
        localStorage.setItem('pendingUsers', JSON.stringify(this.users));
        this.$q.notify({
          type: 'positive',
          message: 'User accepted successfully! The user will now appear in the Accepted list.',
          position: 'top',
        })
        //Notify the store that a user was accepted
        //const userControlStore = useUserControlStore()
        //userControlStore.userAccepted(this.acceptModal.selectedRow)
      } catch (error) {
        console.error('Error approving user:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Failed to accept user',
          position: 'top',
        })
      } finally {
        this.acceptModal.selectedRow = null
        this.acceptModal.show = false
        this.acceptModal.loading = false
      }
    },
  },
}
</script>

<style>
.search-bar {
  width: 450px;
  margin-bottom: 15px;
}
</style>
