<template>
  <q-page class="q-pa-md user-access-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
                 <div class="text-h6 text-weight-medium">
           User Control
           <span class="text-caption q-ml-sm">({{ filteredUsers.length }} users from {{ currentUserBarangay }})</span>
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

     <!-- Barangay Restriction Notice -->


     <!-- Authentication Warning -->
     <q-banner
       v-if="!hasValidToken"
       class="bg-orange text-white q-mb-md"
       icon="warning"
     >
       <div class="text-weight-medium">Authentication Required</div>
       <div>You need to be logged in to manage user access permissions.</div>
     </q-banner>

     <!-- Debug Info (remove in production) -->
     <q-banner
       v-if="false"
       class="bg-grey-3 text-dark q-mb-md"
       icon="info"
     >
       <div class="text-weight-medium">Debug Info</div>
       <div>Users count: {{ users.length }}, Type: {{ typeof users }}, Is Array: {{ Array.isArray(users) }}</div>
       <div>Filtered count: {{ filteredUsers.length }}, Current barangay: {{ currentUserBarangay }}</div>
     </q-banner>

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
       <!-- No Users Message -->
       <div v-if="!loading && filteredUsers.length === 0" class="q-pa-lg text-center">
         <q-icon name="people" size="48px" color="grey-5" />
         <div class="text-h6 text-grey-6 q-mt-md">No Users Found</div>
         <div class="text-body2 text-grey-6">
           {{ users.length === 0 ? 'No users available in your barangay.' : 'No users match your current filters.' }}
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
          <q-btn flat label="Cancel" @click="closeAccessModal" :disable="accessModal.saving" />
          <q-btn
            label="Save"
            color="primary"
            @click="handleAccessSaveClick"
            :loading="accessModal.saving"
            :disable="accessModal.saving"
          />
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
        saving: false,
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
    authStore() {
      return useAuthStore()
    },

         currentUserBarangay() {
       return this.authStore.user?.barangay_name || null
     },

     hasValidToken() {
       return !!(this.authStore.adminToken || this.authStore.token)
     },

         positionOptions() {
       // Ensure users is an array before processing
       if (!Array.isArray(this.users)) {
         return []
       }

       const uniquePositions = [...new Set(this.users.map(user => user.position).filter(Boolean))]
       return uniquePositions.map(position => ({
         label: position,
         value: position
       })).sort((a, b) => a.label.localeCompare(b.label))
     },

         filteredUsers() {
       // Ensure users is always an array
       if (!Array.isArray(this.users)) {
         return []
       }

       // First filter by barangay - only show users from the same barangay
       let filtered = this.users.filter(user =>
         user.barangay_name === this.currentUserBarangay
       )

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
     // Initialize users as empty array
     this.users = []

     const cached = localStorage.getItem('acceptedUsers');
     if (cached) {
       try {
         const parsed = JSON.parse(cached);
         if (Array.isArray(parsed)) {
           this.users = parsed;
         }
       } catch (error) {
         console.warn('Failed to parse cached users:', error)
         this.users = [];
       }
     }
     await this.loadAcceptedUsers();

     // Log page visit (moved from invalid top-level onMounted)
     const { logPageVisit } = usePageLogging()
     await logPageVisit('User Control')
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
         // Check if user has admin token (for admin users) or regular token (for barangay users)
         const token = this.authStore.adminToken || this.authStore.token

         if (!token) {
           throw new Error('No authentication token found')
         }

         // Set the appropriate authorization header
         const config = {
           headers: {
             Authorization: `Bearer ${token}`
           }
         }

         const response = await api.get('/api/barangay/users', config)

         console.log('API Response:', response)
         console.log('Response data:', response.data)
         console.log('Response data type:', typeof response.data)
         console.log('Is array?', Array.isArray(response.data))

         // Check if response.data.data is an array (nested response structure)
         if (Array.isArray(response.data.data)) {
           this.users = response.data.data
           localStorage.setItem('acceptedUsers', JSON.stringify(this.users));
           console.log('Users loaded successfully:', this.users.length, 'users')
         } else if (Array.isArray(response.data)) {
           // Fallback: direct array response
           this.users = response.data
           localStorage.setItem('acceptedUsers', JSON.stringify(this.users));
           console.log('Users loaded successfully (direct array):', this.users.length, 'users')
         } else {
           console.warn('API response is not an array:', response.data)
           this.users = []
           localStorage.removeItem('acceptedUsers')
         }
       } catch (error) {
         console.error('Error loading users:', error)

         if (error.response?.status === 401) {
           this.$q.notify({
             type: 'negative',
             message: 'Authentication failed. Please log in again.',
             position: 'top',
             timeout: 5000
           })

           // Clear cached data
           localStorage.removeItem('acceptedUsers')
           this.users = []

           // Optionally redirect to login
           setTimeout(() => {
             this.$router.push('/login')
           }, 3000)
         } else {
           this.$q.notify({
             type: 'negative',
             message: 'Failed to load users. Please try again.',
             position: 'top',
             timeout: 3000
           })
         }
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
       this.accessModal.saving = true
       try {
         // Check if user has admin token (for admin users) or regular token (for barangay users)
         const token = this.authStore.adminToken || this.authStore.token

         if (!token) {
           throw new Error('No authentication token found')
         }

         const permissions = {
           view: this.accessModal.permissions.view.value,
           add: this.accessModal.permissions.add.value,
           edit: this.accessModal.permissions.edit.value,
           delete: this.accessModal.permissions.delete.value,
           print: this.accessModal.permissions.print.value,
         }

         const config = {
           headers: {
             Authorization: `Bearer ${token}`
           }
         }

         const response = await api.post(`/api/barangay/users/${this.accessModal.selectedUser.id}/permissions`, {
           permissions
         }, config)

         console.log('Save permissions response:', response)
         console.log('Response data:', response.data)
         console.log('Response status:', response.data.status)
         console.log('Response success:', response.data.success)

        // Check for the specific response format from our backend
        if (response.data.success === true || response.data.status === true || response.data.status === 'success') {
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
          console.warn('Unexpected response structure:', response.data)
          console.warn('Expected success: true, got:', response.data.success)
          console.warn('Expected status: true/success, got:', response.data.status)
          throw new Error(`Unexpected response format. Expected success: true, got: ${response.data.success}`)
        }
      } catch (error) {
                 console.error('Error saving permissions:', error)
         this.$q.notify({
           type: 'negative',
           message: error.response?.data?.message || 'Failed to save permissions. Please try again.',
           position: 'top',
         })
       } finally {
         this.accessModal.saving = false
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

 /* Info banner styling */
 .q-banner.bg-blue {
   border-left: 4px solid #2196f3;
 }

 .q-banner.bg-orange {
   border-left: 4px solid #ff9800;
 }
</style>
