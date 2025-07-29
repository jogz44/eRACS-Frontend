<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
      <div class="text-h5 text-weight-bold">User Access</div>
      <q-card-section>
        <!-- Search Bar -->

        <div class="row q-mb-md">
          <q-input
            dense
            outlined
            bg-color="white"
            v-model="search"
            placeholder="Search users..."
            class="search-input"
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
        >
          <template v-slot:body-cell-index="props">
            <q-td :props="props">
              {{ props.pageIndex + 1 }}
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="actions-column">
              <q-btn label="Access" color="primary" size="sm" @click="openAccessModal(props.row)" />
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
      search: '',
      users: [
        { id: 1, fullname: 'John Doe', position: 'Manager', username: 'johndoe' },
        { id: 2, fullname: 'Jane Smith', position: 'Developer', username: 'janesmith' },
        // Add more users as needed
      ],
      columns: [
        {
          name: 'index',
          label: '#',
          field: 'index', // index starts from 0, so add 1
          align: 'left',
          sortable: false, // optional: disable sorting
        },
        { name: 'fullname', label: 'Full Name', field: 'fullname', align: 'left', sortable: true },
        { name: 'barangay', label: 'BARANGAY', field: 'barangay', align: 'left', sortable: true },
        { name: 'position', label: 'POSITION', field: 'position', align: 'left', sortable: true  },
        { name: 'username', label: 'Username', field: 'username', align: 'left', sortable: true },
        { name: 'actions', label: 'Actions', align: 'center', sortable: false },

        // { name: 'name', label: 'NAME', field: 'name', align: 'left' },
        // { name: 'barangay', label: 'BARANGAY', field: 'barangay', align: 'left' },
        // { name: 'position', label: 'POSITION', field: 'position', align: 'left' },
        // { name: 'username', label: 'USERNAME', field: 'username', align: 'left' },
        // { name: 'email', label: 'EMAIL', field: 'email', align: 'left' },
        // { name: 'action', label: '', field: 'action', align: 'center' },
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
      const searchTerm = this.search.toLowerCase()
      return this.users.filter(
        (user) =>
          user.fullname.toLowerCase().includes(searchTerm) ||
          user.position.toLowerCase().includes(searchTerm) ||
          user.username.toLowerCase().includes(searchTerm),
      )
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

/* Responsive Design */
@media (max-width: 600px) {
  /* Mobile View */
  
  /* Page header adjustments */
  .page-header {
    margin-bottom: 16px !important;
  }
  
  .page-header .text-h5 {
    font-size: 1.2rem !important;
  }
  
  /* Search input adjustments */
  .search-input {
    width: 100% !important;
    min-width: 0 !important;
  }
  
  /* Table adjustments */
  .user-access-table {
    font-size: 0.8rem !important;
  }
  
  .user-access-table th,
  .user-access-table td {
    padding: 8px 4px !important;
  }
  
  /* Hide less important columns on mobile */
  .user-access-table th:nth-child(3),
  .user-access-table td:nth-child(3) {
    display: none !important;
  }
  
  .user-access-table th:nth-child(4),
  .user-access-table td:nth-child(4) {
    display: none !important;
  }
  
  /* Dialog adjustments */
  .q-dialog .q-card {
    width: 95vw !important;
    max-width: 95vw !important;
    margin: 8px !important;
  }
  
  /* Access modal adjustments */
  .q-dialog .q-card[style*="width: 350px"] {
    width: 95vw !important;
    max-width: 95vw !important;
  }
  
  /* Access grid adjustments */
  .access-grid {
    gap: 16px !important;
  }
  
  .access-row {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 8px !important;
  }
  
  .access-label {
    font-size: 0.9rem !important;
  }
  
  /* Button adjustments */
  .q-btn {
    min-height: 44px !important;
  }
  
  /* Text adjustments */
  .text-h5 {
    font-size: 1.2rem !important;
  }
  
  .text-h6 {
    font-size: 1.1rem !important;
  }
  
  .text-subtitle1 {
    font-size: 0.9rem !important;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  /* Small Tablet View */
  
  /* Page header adjustments */
  .page-header {
    margin-bottom: 16px !important;
  }
  
  .page-header .text-h5 {
    font-size: 1.3rem !important;
  }
  
  /* Search input adjustments */
  .search-input {
    width: 100% !important;
    min-width: 0 !important;
  }
  
  /* Table adjustments */
  .user-access-table {
    font-size: 0.85rem !important;
  }
  
  .user-access-table th,
  .user-access-table td {
    padding: 8px 6px !important;
  }
  
  /* Hide less important columns on small tablet */
  .user-access-table th:nth-child(3),
  .user-access-table td:nth-child(3) {
    display: none !important;
  }
  
  /* Dialog adjustments */
  .q-dialog .q-card {
    width: 90vw !important;
    max-width: 90vw !important;
  }
  
  /* Access modal adjustments */
  .q-dialog .q-card[style*="width: 350px"] {
    width: 90vw !important;
    max-width: 90vw !important;
  }
  
  /* Access grid adjustments */
  .access-grid {
    gap: 14px !important;
  }
  
  .access-row {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 8px !important;
  }
  
  .access-label {
    font-size: 0.95rem !important;
  }
  
  /* Button adjustments */
  .q-btn {
    min-height: 44px !important;
  }
  
  /* Text adjustments */
  .text-h5 {
    font-size: 1.3rem !important;
  }
  
  .text-h6 {
    font-size: 1.2rem !important;
  }
  
  .text-subtitle1 {
    font-size: 1rem !important;
  }
}

@media (min-width: 901px) and (max-width: 1200px) {
  /* Large Tablet View */
  
  /* Page header adjustments */
  .page-header {
    margin-bottom: 16px !important;
  }
  
  .page-header .text-h5 {
    font-size: 1.4rem !important;
  }
  
  /* Search input adjustments */
  .search-input {
    width: 400px !important;
    min-width: 400px !important;
  }
  
  /* Table adjustments */
  .user-access-table {
    font-size: 0.9rem !important;
  }
  
  /* Dialog adjustments */
  .q-dialog .q-card {
    width: 80vw !important;
    max-width: 80vw !important;
  }
  
  /* Access modal adjustments */
  .q-dialog .q-card[style*="width: 350px"] {
    width: 80vw !important;
    max-width: 80vw !important;
  }
  
  /* Access grid adjustments */
  .access-grid {
    gap: 12px !important;
  }
  
  .access-row {
    flex-direction: row !important;
    align-items: center !important;
    gap: 12px !important;
  }
  
  .access-label {
    font-size: 1rem !important;
  }
  
  /* Button adjustments */
  .q-btn {
    min-width: 120px !important;
  }
  
  /* Text adjustments */
  .text-h5 {
    font-size: 1.4rem !important;
  }
  
  .text-h6 {
    font-size: 1.3rem !important;
  }
  
  .text-subtitle1 {
    font-size: 1.1rem !important;
  }
}

@media (min-width: 1201px) {
  /* Desktop View */
  
  /* Page header adjustments */
  .page-header {
    margin-bottom: 16px !important;
  }
  
  .page-header .text-h5 {
    font-size: 1.5rem !important;
  }
  
  /* Search input adjustments */
  .search-input {
    width: 450px !important;
    min-width: 450px !important;
  }
  
  /* Table adjustments */
  .user-access-table {
    font-size: 1rem !important;
  }
  
  /* Dialog adjustments */
  .q-dialog .q-card {
    width: 350px !important;
    max-width: 500px !important;
  }
  
  /* Access modal adjustments */
  .q-dialog .q-card[style*="width: 350px"] {
    width: 350px !important;
    max-width: 500px !important;
  }
  
  /* Access grid adjustments */
  .access-grid {
    gap: 12px !important;
  }
  
  .access-row {
    flex-direction: row !important;
    align-items: center !important;
    gap: 12px !important;
  }
  
  .access-label {
    font-size: 1rem !important;
  }
  
  /* Button adjustments */
  .q-btn {
    min-width: 120px !important;
  }
  
  /* Text adjustments */
  .text-h5 {
    font-size: 1.5rem !important;
  }
  
  .text-h6 {
    font-size: 1.4rem !important;
  }
  
  .text-subtitle1 {
    font-size: 1.2rem !important;
  }
}

/* General responsive improvements */
@media (max-width: 900px) {
  /* Adjust text sizes for better readability */
  .text-h5 {
    font-size: 1.2rem !important;
  }
  
  .text-h6 {
    font-size: 1.1rem !important;
  }
  
  .text-subtitle1 {
    font-size: 0.9rem !important;
  }
  
  /* Adjust padding for better mobile experience */
  .q-pa-lg {
    padding: 12px !important;
  }
  
  .q-pa-md {
    padding: 8px !important;
  }
  
  /* Make buttons more touch-friendly */
  .q-btn {
    min-height: 40px !important;
  }
  
  /* Adjust card margins */
  .q-card {
    margin: 4px !important;
  }
  
  /* Ensure proper spacing */
  .q-mb-lg {
    margin-bottom: 16px !important;
  }
  
  .q-mb-md {
    margin-bottom: 12px !important;
  }
  
  .q-mb-sm {
    margin-bottom: 8px !important;
  }
  
  /* Adjust card sections */
  .q-card-section {
    padding: 12px !important;
  }
}

/* Ensure proper spacing in all views */
.q-mb-md {
  margin-bottom: 12px !important;
}

/* Table responsive improvements */
@media (max-width: 600px) {
  .user-access-table {
    font-size: 0.75rem !important;
  }
  
  .user-access-table th,
  .user-access-table td {
    padding: 4px 2px !important;
  }
  
  /* Hide less important columns on mobile */
  .user-access-table th:nth-child(3),
  .user-access-table td:nth-child(3) {
    display: none !important;
  }
  
  .user-access-table th:nth-child(4),
  .user-access-table td:nth-child(4) {
    display: none !important;
  }
}

/* Dialog content responsive */
@media (max-width: 600px) {
  .q-card-section {
    padding: 12px !important;
  }
  
  .q-card-actions {
    padding: 8px 12px !important;
  }
  
  /* Make form inputs full width on mobile */
  .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }
  
  /* Adjust button groups */
  .q-card-actions {
    flex-direction: column !important;
    gap: 8px !important;
  }
  
  .q-card-actions .q-btn {
    width: 100% !important;
  }
}

/* Page header responsive */
@media (max-width: 600px) {
  .page-header {
    margin-bottom: 12px !important;
  }
  
  .page-header .text-h5 {
    font-size: 1.1rem !important;
  }
}

/* Search input responsive */
@media (max-width: 600px) {
  .row.q-mb-md {
    margin-bottom: 12px !important;
  }
  
  .row.q-mb-md .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }
}
</style>
