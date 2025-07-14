<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
      <div class="text-h5 text-weight-bold">User Control Pending</div>
      <q-card-section>
        <div class="q-mb-lg">
          <q-input dense outlined v-model="search" placeholder="Search..." class="search-bar">
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
              {{ cancelModal.selectedRow?.username || 'alexamay3' }} ?
            </div>
          </q-card-section>

          <q-card-actions align="center" class="q-pb-md">
            <q-btn
              unelevated
              label="Yes"
              color="red"
              @click="confirmCancel"
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
              <strong>Position:<br /></strong> {{ viewModal.selectedRow?.position }}
            </div>
            <div class="q-mb-sm">
              <strong>Username:<br /></strong> {{ viewModal.selectedRow?.username }}
            </div>
            <div class="q-mb-sm">
              <strong>Email:<br /></strong> {{ viewModal.selectedRow?.email }}
            </div>
            <div class="q-mt-md">
              <strong>Picture<br /></strong>
            </div>
            <div class="q-mt-sm flex" style="align-items: flex-start; gap: 20px">
              <q-img
                :src="
                  viewModal.selectedRow?.avatar || 'https://www.w3schools.com/w3images/avatar2.png'
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
  data() {
    return {
      search: '',
      users: [
        {
          name: 'Alexandra May T. Pis-ing',
          barangay: 'Visayan Village',
          position: 'Secretary',
          username: 'alexamay20',
          email: 'alexap@gmail.com',
          avatar: 'https://www.w3schools.com/w3images/avatar2.png',
        },
        { date: 'February 26, 2025', username: 'alexamay3', email: 'aalexap@gmail.com' },
        { date: 'February 26, 2025', username: 'alexamay34', email: 'aalexap@gmail.com' },
        { date: 'February 25, 2025', username: 'alexamay35', email: 'aaalexap@gmail.com' },
        { date: 'February 25, 2025', username: 'alexamay36', email: 'aaaalexap@gmail.com' },
      ],
      columns: [
        { name: 'date', label: 'Request Date', field: 'date', align: 'left', classes: 'text-left' },
        {
          name: 'username',
          label: 'Username',
          field: 'username',
          align: 'left',
          classes: 'text-left',
        },
        { name: 'email', label: 'Email', field: 'email', align: 'left', classes: 'text-left' },
        {
          name: 'action',
          label: 'Action',
          field: 'action',
          align: 'center',
          classes: 'text-center',
        },
      ],
      cancelModal: {
        show: false,
        selectedRow: null,
      },
      acceptModal: {
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
          user.email.toLowerCase().includes(this.search.toLowerCase()) ||
          user.date.toLowerCase().includes(this.search.toLowerCase()),
      )
    },
  },
  methods: {
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
    confirmCancel() {
      this.users = this.users.filter(
        (user) => user.username !== this.cancelModal.selectedRow.username,
      )
      this.cancelModal.selectedRow = null
      this.cancelModal.show = false
      this.$q.notify({
        type: 'positive',
        message: 'User removed successfully',
      })
    },
    confirmAccept() {
      // Update user status to 'Accepted' or perform other acceptance logic
      const userIndex = this.users.findIndex(
        (user) => user.username === this.acceptModal.selectedRow.username,
      )
      if (userIndex !== -1) {
        this.$q.notify({
          type: 'positive',
          message: 'User accepted successfully',
        })
      }
      this.acceptModal.selectedRow = null
      this.acceptModal.show = false
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
