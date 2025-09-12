<template>
  <q-dialog v-model="store.dialogs.viewOrDetails">
    <q-card style="min-width: 1100px">
      <q-card-section>
        <div class="text-h6">
          Disbursement #{{ store.currentLiquidation.dvNumber }}
        </div>
        <div class="text-caption text-grey-6 q-mt-sm">
          View liquidation details and official receipt information
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">

          <!-- Date Field -->
          <div class="col-md-4 col-sm-6 q-mb-md">
            <div class="text-caption text-grey">Date</div>
            <div class="text-body1 text-weight-medium">
              {{ store.currentLiquidation.date }}
            </div>
          </div>

          <!-- DV Number Field -->
          <div class="col-md-4 col-sm-6 q-mb-md">
            <div class="text-caption text-grey">DV Number</div>
            <div class="row items-center">
              <div class="text-body1 text-weight-medium">
                {{ store.currentLiquidation.dvNumber }}
              </div>
              <q-btn flat dense round icon="content_copy" class="q-ml-sm"
                @click="copyToClipboard(store.currentLiquidation.dvNumber)" />
            </div>
          </div>

          <!-- DV Amount Field -->
          <div class="col-md-4 col-sm-6 q-mb-md">
            <div class="text-caption text-grey">DV Amount</div>
            <div class="text-body1 text-weight-medium">
              ₱ {{ formatCurrency(store.currentLiquidation.dvAmount || 0) }}
            </div>
          </div>

          <!-- Actual Expense Field -->
          <div class="col-md-4 col-sm-6 q-mb-md">
            <div class="text-caption text-grey">Actual Expense</div>
            <div class="text-body1 text-weight-medium">
              ₱ {{ formatCurrency(totalActualExpense) }}
            </div>
          </div>

          <!-- Amount to Return Field -->
          <div class="col-md-4 col-sm-6 q-mb-md">
            <div class="text-caption text-grey">Amount to Return to Appropriation</div>
            <div class="text-body1 text-weight-medium">
              ₱ {{ formatCurrency(totalReturnAmount) }}
            </div>
          </div>

          <!-- Remarks Field -->
          <div class="col-md-4 col-sm-12 q-mb-md">
            <div class="text-caption text-grey">Remarks</div>
            <div class="text-body1 text-weight-medium">
              {{ store.currentLiquidation.remarks || '—' }}
            </div>
          </div>

        </div>
      </q-card-section>

      <!-- Expense Accounts Section -->
      <q-card-section v-if="store.currentLiquidation?.expenses?.length > 0">
        <div class="text-subtitle1 q-mb-md">
          <strong>Expense Accounts:</strong>
        </div>

        <!-- Expense Accounts Table -->
        <q-table :rows="store.currentLiquidation.expenses" :columns="expenseAccountColumns" row-key="id"
          :pagination="{ rowsPerPage: 5 }" flat bordered>
          <template v-slot:body-cell-amount="props">
            <q-td :props="props">
              {{ formatCurrency(props.value) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- Reimbursement Details Section -->
      <div>
        <q-card-section>
          <div class="text-h6">
            Reimbursement Transaction Details
          </div>
          <div class="text-caption text-grey-6 q-mt-sm">
            Reference: Disbursement No. {{ store.currentLiquidation.dvNumber }}
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">

            <!-- Date Field -->
            <div class="col-md-4 col-sm-6 q-mb-md">
              <div class="text-caption text-grey">Date</div>
              <div class="text-body1 text-weight-medium">
                {{ store.currentLiquidation.date }}
              </div>
            </div>

            <!-- DV Number Field -->
            <div class="col-md-4 col-sm-6 q-mb-md">
              <div class="text-caption text-grey">DV Number</div>
              <div class="row items-center">
                <div class="text-body1 text-weight-medium">
                  {{ store.currentLiquidation.dvNumber }}
                </div>
                <q-btn flat dense round icon="content_copy" class="q-ml-sm"
                  @click="copyToClipboard(store.currentLiquidation.dvNumber)" />
              </div>
            </div>

            <!-- DV Amount Field -->
            <div class="col-md-4 col-sm-6 q-mb-md">
              <div class="text-caption text-grey">DV Amount</div>
              <div class="text-body1 text-weight-medium">
                ₱ {{ formatCurrency(store.currentLiquidation.dvAmount || 0) }}
              </div>
            </div>

            <!-- Actual Expense Field -->
            <div class="col-md-4 col-sm-6 q-mb-md">
              <div class="text-caption text-grey">Actual Expense</div>
              <div class="text-body1 text-weight-medium">
                ₱ {{ formatCurrency(totalActualExpense) }}
              </div>
            </div>

            <!-- Amount to Return Field -->
            <div class="col-md-4 col-sm-6 q-mb-md">
              <div class="text-caption text-grey">Amount to Return to Appropriation</div>
              <div class="text-body1 text-weight-medium">
                ₱ {{ formatCurrency(totalReturnAmount) }}
              </div>
            </div>

            <!-- Remarks Field -->
            <div class="col-md-4 col-sm-12 q-mb-md">
              <div class="text-caption text-grey">Remarks</div>
              <div class="text-body1 text-weight-medium">
                {{ store.currentLiquidation.remarks || '—' }}
              </div>
            </div>

          </div>
        </q-card-section>

        <!-- Expense Accounts Section -->
        <q-card-section v-if="store.currentLiquidation?.expenses?.length > 0">
          <div class="text-subtitle1 q-mb-md">
            <strong>Expense Accounts:</strong>
          </div>

          <!-- Expense Accounts Table -->
          <q-table :rows="store.currentLiquidation.expenses" :columns="expenseAccountColumns" row-key="id"
            :pagination="{ rowsPerPage: 5 }" flat bordered>
            <template v-slot:body-cell-amount="props">
              <q-td :props="props">
                {{ formatCurrency(props.value) }}
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </div>

      <!-- Liquidation Details Section -->
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="text-subtitle1">
            <strong>Liquidation Details:</strong>
            <span class="text-caption text-grey-6 q-ml-sm">
              ({{ orDetailsCount }} record{{ orDetailsCount !== 1 ? 's' : '' }})
            </span>
          </div>
          <q-space />
          <q-btn flat dense icon="refresh" color="primary" @click="reloadOrDetails" title="Reload OR Details" />
        </div>

        <!-- OR Details Table -->
        <q-table :rows="store.currentLiquidation?.orDetails || []" :columns="orDetailsColumns" row-key="id"
          :pagination="{ rowsPerPage: 10 }" flat bordered :loading="loadingOrDetails">
          <template v-slot:body-cell-orPhotoUrl="props">
            <q-td :props="props">
              <q-img v-if="props.value" :src="props.value" style="max-width: 100px; max-height: 100px"
                class="cursor-pointer" @click="viewImage(props.value)" />
              <div v-else class="text-grey">No image</div>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm">
              <q-icon size="2em" name="inbox" />
              <span>No liquidation details found</span>
            </div>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <!-- Void Request Action Buttons (only for approvers) -->
        <div v-if="isApprover && store.currentLiquidation?.status === 'Void Requested'"
          class="q-mr-auto void-action-buttons">

          <q-btn unelevated label="Approve Void" color="green" icon="check_circle" @click="handleApproveVoid"
            :loading="voidActionLoading" class="void-approve-btn" />
          <q-btn unelevated label="Reject Void" color="red" icon="cancel" @click="handleRejectVoid"
            :loading="voidActionLoading" class="void-reject-btn" />
        </div>
        <div v-if="isApprover && store.currentLiquidation?.status === 'Edit Requested'"
          class="q-mr-auto edit-action-buttons">

          <q-btn unelevated label="Approve Edit" color="green" icon="check_circle" @click="handleApproveEdit"
            :loading="editActionLoading" class="edit-approve-btn" />
          <q-btn unelevated label="Reject Edit" color="red" icon="cancel" @click="handleRejectEdit"
            :loading="editActionLoading" class="edit-reject-btn" />
        </div>

        <q-btn flat label="Close" class="modal-cancel-btn" @click="store.closeDialog('viewOrDetails')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useAuthStore } from 'stores/auth'
import { useQuasar } from 'quasar'

const store = useDisbursementStore()
const authStore = useAuthStore()
const $q = useQuasar()
const loadingOrDetails = ref(false)
const voidActionLoading = ref(false)
const editActionLoading = ref(false)

// Table columns for Expense Accounts - matching the image structure
const expenseAccountColumns = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left',
    sortable: true
  },
  {
    name: 'accountName',
    label: 'Account Name',
    field: 'accountName',
    align: 'left',
    sortable: true
  },
  {
    name: 'amount',
    label: 'Amount',
    field: 'amount',
    align: 'right',
    sortable: true
  },
  {
    name: 'particular',
    label: 'Particular',
    field: 'particular',
    align: 'left',
    sortable: true
  }
]

// Table columns for OR Details - matching OrDetailsDialog structure
const orDetailsColumns = [
  {
    name: 'orDate',
    label: 'OR Date',
    field: 'orDate',
    align: 'left',
    sortable: true
  },
  {
    name: 'orNumber',
    label: 'OR Number',
    field: 'orNumber',
    align: 'left',
    sortable: true
  },
  {
    name: 'orAmount',
    label: 'OR Amount',
    field: 'orAmount',
    align: 'right',
    sortable: true,
    format: (val) => formatCurrency(val)
  },
  {
    name: 'orPhotoUrl',
    label: 'OR Image',
    field: 'orPhotoUrl',
    align: 'center',
    sortable: false
  }
]

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    $q.notify({
      type: 'positive',
      message: 'DV Number copied to clipboard',
      icon: 'content_copy',
      position: 'top',
      timeout: 3000,
    })
  })
}

const totalActualExpense = computed(() => {
  if (!store.currentLiquidation?.orDetails) return 0
  return store.currentLiquidation.orDetails
    .reduce((sum, or) => sum + (parseFloat(or.orAmount) || 0), 0)
})

const totalReturnAmount = computed(() => {
  if (!store.currentLiquidation?.dvAmount) return 0
  const returnAmount = store.currentLiquidation.dvAmount - totalActualExpense.value
  // Prevent negative return amounts - if over-liquidation occurs, show 0
  return Math.max(0, returnAmount)
})

const orDetailsCount = computed(() => {
  return store.currentLiquidation?.orDetails?.length || 0
})


// Check if user is an approver (Captain/SK Chairperson)
const isApprover = computed(() => {
  const userPosition = authStore.user?.position_name?.toLowerCase().trim() || ''
  return userPosition.includes('captain') ||
    userPosition.includes('chairperson') ||
    userPosition.includes('barangay captain') ||
    userPosition.includes('sk chairperson')
})

// Method to manually reload OR details if needed
const reloadOrDetails = async () => {
  if (store.currentLiquidation?.id) {
    await store.openViewOrDetails(store.currentLiquidation)
  }
}

const viewImage = (imageUrl) => {
  $q.dialog({
    component: 'q-img',
    componentProps: {
      src: imageUrl,
      style: 'max-width: 80vw; max-height: 80vh'
    }
  })
}

// Formatting utilities to match OrDetailsDialog
const formatCurrency = (value) => {
  const num = Number(String(value).replace(/[,\s]/g, '')) || 0
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Handle void approval
const handleApproveVoid = async () => {
  if (!store.currentLiquidation?.id) return

  voidActionLoading.value = true
  try {
    await store.approveVoidRequest(store.currentLiquidation.id)
    $q.notify({
      type: 'positive',
      message: 'Void request approved successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
    // Close the dialog after successful approval
    store.closeDialog('viewOrDetails')
  } catch (error) {
    console.error('Error approving void request:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to approve void request',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  } finally {
    voidActionLoading.value = false
  }
}

// Handle void rejection
const handleRejectVoid = () => {
  if (!store.currentLiquidation?.id) return

  $q.dialog({
    title: 'Reject Void Request',
    message: 'Please provide rejection remarks:',
    prompt: {
      model: '',
      type: 'textarea',
      isValid: (val) => val && val.trim() !== '',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (remarks) => {
    voidActionLoading.value = true
    try {
      await store.rejectVoidRequest(store.currentLiquidation.id, remarks?.trim?.() || '')
      $q.notify({
        type: 'positive',
        message: 'Void request rejected successfully!',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000,
      })
      // Close the dialog after successful rejection
      store.closeDialog('viewOrDetails')
    } catch (error) {
      console.error('Error rejecting void request:', error)
      $q.notify({
        type: 'negative',
        message: error.message || 'Failed to reject void request',
        icon: 'error',
        position: 'top',
        timeout: 5000,
      })
    } finally {
      voidActionLoading.value = false
    }
  })
}

// Handle edit approval
const handleApproveEdit = async () => {
  if (!store.currentLiquidation?.id) return

  editActionLoading.value = true
  try {
    await store.approveEditRequest(store.currentLiquidation.id)
    $q.notify({
      type: 'positive',
      message: 'Edit request approved successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
    // Close the dialog after successful approval
    store.closeDialog('viewOrDetails')
  } catch (error) {
    console.error('Error approving edit request:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to approve edit request',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  } finally {
    editActionLoading.value = false
  }
}

// Handle edit rejection
const handleRejectEdit = () => {
  if (!store.currentLiquidation?.id) return

  $q.dialog({
    title: 'Reject Edit Request',
    message: 'Please provide rejection remarks:',
    prompt: {
      model: '',
      type: 'textarea',
      isValid: (val) => val && val.trim() !== '',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (remarks) => {
    editActionLoading.value = true
    try {
      await store.rejectEditRequest(store.currentLiquidation.id, remarks?.trim?.() || '')
      $q.notify({
        type: 'positive',
        message: 'Edit request rejected successfully!',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000,
      })
      // Close the dialog after successful rejection
      store.closeDialog('viewOrDetails')
    } catch (error) {
      console.error('Error rejecting edit request:', error)
      $q.notify({
        type: 'negative',
        message: error.message || 'Failed to reject edit request',
        icon: 'error',
        position: 'top',
        timeout: 5000,
      })
    } finally {
      editActionLoading.value = false
    }
  })
}
</script>

<style scoped>
/* Ensure proper spacing for the OR details table */
.q-table {
  margin-bottom: 16px;
}

/* Style for readonly inputs */
.q-input[readonly] {
  background-color: #f5f5f5;
}

/* Custom actions styling */
.custom-actions {
  padding: 16px;
}

.modal-cancel-btn {
  color: #666;
}

/* Void action buttons styling */
.void-action-buttons {
   display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 16px;
  background-color: #fff3e0;
  border-radius: 8px;
  border: 1px solid #ffcc02;
  margin-right: 16px;
}

.void-approve-btn {
  font-weight: 600;
  text-transform: none;
  padding: 8px 16px;
  min-width: 120px;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
  transition: all 0.2s ease;
}

.void-approve-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.void-reject-btn {
  font-weight: 600;
  text-transform: none;
  padding: 8px 16px;
  min-width: 120px;
  box-shadow: 0 2px 4px rgba(244, 67, 54, 0.2);
  transition: all 0.2s ease;
}

.void-reject-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
}

/* Edit action buttons styling */
.edit-action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 16px;
  background-color: #fff3e0;
  border-radius: 8px;
  border: 1px solid #ffcc02;
  margin-right: 16px;
}

.edit-request-indicator {
  display: flex;
  align-items: center;
  color: #ff5722;
  font-weight: 500;
  font-size: 14px;
}

.edit-approve-btn {
  font-weight: 600;
  text-transform: none;
  padding: 8px 16px;
  min-width: 120px;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
  transition: all 0.2s ease;
}

.edit-approve-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.edit-reject-btn {
  font-weight: 600;
  text-transform: none;
  padding: 8px 16px;
  min-width: 120px;
  box-shadow: 0 2px 4px rgba(244, 67, 54, 0.2);
  transition: all 0.2s ease;
}

.edit-reject-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
}

.void-action-buttons .q-btn {
  font-size: 14px;
  letter-spacing: 0.5px;
}

.void-request-indicator {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  margin-bottom: 12px;
  font-weight: 500;
  color: #856404;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(255, 193, 7, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0);
  }
}

.void-request-text {
  font-size: 14px;
  font-weight: 600;
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .q-card {
    min-width: 95vw !important;
  }

  .q-table {
    font-size: 12px;
  }

  .void-action-buttons {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    margin-right: 0;
    margin-bottom: 16px;
  }

  .void-request-indicator {
    margin-bottom: 8px;
    padding: 6px 10px;
  }

  .void-request-text {
    font-size: 13px;
  }

  .void-approve-btn,
  .void-reject-btn {
    min-width: 100%;
    width: 100%;
  }

  .custom-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .custom-actions .q-mr-auto {
    margin-right: 0 !important;
    margin-bottom: 16px;
  }
}
</style>
