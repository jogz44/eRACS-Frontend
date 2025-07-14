<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
      <div class="text-h5 text-weight-bold">User Control Accepted</div>
      <q-card-section>
        <!-- Search Bar -->
        <q-input dense outlined v-model="search" placeholder="Search..." class="search-bar">
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
          row-key="username"
          class="user-table"
        >
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
            <div class="q-mt-md"><strong>Picture:</strong></div>
            <div class="q-mt-sm flex flex-left">
              <q-img
                :src="
                  viewModal.selectedRow?.image || 'https://www.w3schools.com/w3images/avatar2.png'
                "
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
export default {
  name: 'UserControlAcceptedPage',
  data() {
    return {
      search: '',
      users: [
        {
          username: 'elecomvp34',
          email: 'elkencp@gmail.com',
          name: 'Alexandra May T. Pis-ing',
          barangay: 'Visayan Village',
          position: 'Secretary',
          image: 'https://www.w3schools.com/w3images/avatar2.png',
        },
        {
          username: 'elecomvp33',
          email: 'elkencp@gmail.com',
          name: 'Michael Smith',
          barangay: 'Santo Niño',
          position: 'Treasurer',
          image: 'https://www.w3schools.com/w3images/avatar2.pngg',
        },
        {
          username: 'elecomvp32',
          email: 'elkencp@gmail.com',
          name: 'John Doe',
          barangay: 'Nueva Vida',
          position: 'Chairperson',
          image: 'https://www.w3schools.com/w3images/avatar2.png',
        },
      ],
      columns: [
        { name: 'username', label: 'Username', field: 'username', align: 'left', sortable: true },
        { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
        { name: 'action', label: 'Actions', field: 'action', align: 'center' },
      ],
      deleteModal: {
        show: false,
        selectedRow: null,
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
          user.email.toLowerCase().includes(this.search.toLowerCase()),
      )
    },
  },
  methods: {
    openDeleteModal(row) {
      this.deleteModal.selectedRow = row
      this.deleteModal.show = true
    },
    confirmDelete() {
      // Remove the user from the array
      this.users = this.users.filter(
        (user) => user.username !== this.deleteModal.selectedRow.username,
      )

      // Close the modal
      this.deleteModal.show = false
      this.deleteModal.selectedRow = null

      // Show success notification
      this.$q.notify({
        type: 'positive',
        message: 'User deleted successfully',
      })
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
