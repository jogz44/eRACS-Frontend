<template>
  <q-page class="q-pa-md disbursement-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">
          Disbursement Transaction
        </div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="loadPendingUsers"
          :loading="store.loadingDisbursements"
        />
      </div>
    </div>

    <div class="q-mb-sm">
      <SearchFilters @add="store.openDialog('disbursement')" />

      <!-- Disbursement Dialog -->
      <q-dialog v-model="store.dialogs.disbursement" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 900px; max-width: 95vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Disbursement</div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <!-- Date Field -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">Date:</q-item-label>
                <q-input
                  outlined
                  dense
                  v-model="store.forms.disbursement.date"
                  mask="##/##/####"
                  :readonly="true"
                  :disable="true"
                  @keydown.enter="handleEnterKey"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-not-allowed" />
                  </template>
                </q-input>
              </div>

              <!-- Bank Field -->
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Bank:</q-item-label>
                <q-select
                  outlined
                  dense
                  v-model="store.forms.disbursement.bank_id"
                  :options="bankStore.availableBanks"
                  option-label="name"
                  option-value="id"
                  emit-value
                  map-options
                  :label="currentBankLabel"
                  :loading="store.bankLoading"
                  @update:model-value="handleBankSelection"
                  @keydown.enter="handleEnterKey"
                />
              </div>

              <!-- Check Number Field -->
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Cheque Number:</q-item-label>

                <q-input
                  outlined
                  dense
                  v-model="store.autoCheque"
                  :disable="true"
                  @keydown.enter="handleEnterKey"
                ></q-input>
              </div>

              <!-- DV Number Field -->
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">DV Number:</q-item-label>
                <q-input
                  outlined
                  dense
                  :disable="true"
                  v-model="store.forms.disbursement.dvNumber"
                  @keydown.enter="handleEnterKey"
                />
              </div>

              <!-- Payee Field -->
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Payee:</q-item-label>
                <q-input
                  outlined
                  dense
                  v-model="store.forms.disbursement.payee"
                  @keydown.enter="handleEnterKey"
                />
              </div>
            </div>
          </q-card-section>

          <!-- Add Expense Button -->
          <q-card-section>
            <div class="row justify-end q-mb-md">
              <q-btn
                label="Add"
                color="primary"
                icon="add"
                @click="handleAddExpense"
                @mouseenter="preloadExpenseAccounts"
                :loading="addingExpense || store.expenseTypeLoading"
                v-permission="'add'"
              />
            </div>

            <!-- Expense Table -->
            <q-table
              :rows="store.expenses"
              :columns="store.expenseColumns"
              row-key="id"
              :pagination="{ rowsPerPage: 5 }"
              flat
              bordered
            >
              <template v-slot:body-cell-action="props">
                <q-td :props="props">
                  <div class="q-gutter-xs">
                    <q-btn
                      size="sm"
                      dense
                      icon="edit"
                      color="orange"
                      @click="store.editItem(props.row)"
                    />
                    <q-btn
                      size="sm"
                      dense
                      icon="delete"
                      color="red"
                      @click="handleDeleteExpense(props.row)"
                    />
                  </div>
                </q-td>
              </template>
            </q-table>

            <!-- Amount Display -->
            <div class="q-mt-md">
              <q-item-label class="q-mb-xs">Amount:</q-item-label>
              <q-input
                outlined
                dense
                :model-value="`₱${(store.totalExpensesAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
                style="width: 300px"
                readonly
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              label="Cancel"
              @click="store.closeDialog('disbursement')"
            />
            <q-btn
              label="Disburse"
              color="primary"
              @click="handleSaveClick"
              v-permission="'add'"
              :loading="store.savingDisbursement"
              :disable="store.savingDisbursement"

            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Expense Selection Dialog -->
      <q-dialog v-model="store.dialogs.expense" persistent>
        <q-card style="min-width: 800px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Select Expense Account</div>
          </q-card-section>

          <q-card-section>
            <q-input
              outlined
              dense
              placeholder="Search expense account..."
              v-model="store.expenseSearch"
              class="q-mb-sm"
              style="width: 300px"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>

            <q-table
              :rows="store.filteredExpenseAccounts"
              :columns="store.expenseAccountColumns"
              row-key="id"
              :loading="store.loading || store.expenseTypeLoading"
              :filter="store.expenseSearch"
              flat
              bordered
            >
              <template v-slot:body-cell-action="props">
                <q-td :props="props">
                  <q-btn
                    dense
                    label="Select"
                    color="primary"
                    @click="store.openExpenseDetail(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              label="Cancel"
              @click="store.closeDialog('expense')"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Add Expense Dialog -->
      <q-dialog v-model="store.dialogs.expenseDetail">
        <q-card style="min-width: 500px">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Add Expense</div>
          </q-card-section>

          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">
              <strong>Account:</strong> {{ store.forms.expense.account }}
            </div>
            <div class="text-subtitle1 q-mb-md">
              <strong>Balance:</strong> ₱{{ store.forms.expense.balance.toLocaleString() }}
            </div>
            <q-select
  outlined
  dense
  v-model="store.forms.expense.particulars"
  :options="filteredParticulars"
  label="Particulars"
  use-input
  fill-input
  hide-selected
  new-value-mode="add-unique"
  @filter="filterFn"
/>
            <q-input
              outlined
              dense
              v-model="store.forms.expense.amount"
              label="Amount"
              class="q-mb-md"
              prefix="₱"
              type="number"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              label="Cancel"
              @click="store.closeDialog('expenseDetail')"
            />
              <q-btn label="Save" @click="handleSaveExpense" color="primary" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Main Data Table -->
      <q-card flat bordered>
        <q-table
          :rows="store.disbursements"
          :columns="store.disbursementColumns"
          row-key="id"
          :pagination="store.pagination"
          :loading="store.loadingDisbursements"
          flat
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="row q-gutter-xs items-center justify-center">
                <q-btn
                  dense
                  icon="edit"
                  :color="props.row.status === 'Pending' || props.row.status === 'Partial' ? 'orange' : 'grey'"
                  :disable="props.row.status !== 'Pending' && props.row.status !== 'Partial'"
                  :loading="store.loadingEditDisbursement === props.row.id"
                  @click="handleEditDisbursement(props.row)"
                  v-permission="'edit'"
                />
                <q-btn
                  dense
                  icon="visibility"
                  color="blue"
                  @click="handleViewDisbursement(props.row)"
                  :loading="viewLoading[props.row.id]"
                  :disable="viewLoading[props.row.id]"
                  v-permission="'view'"
                />

                <q-btn
                  dense
                  icon="delete"
                  :color="canDelete(props.row) ? 'red' : 'grey'"
                  :disable="!canDelete(props.row)"
                  v-if="isTreasurer && (props.row.status === 'Pending' || props.row.status === 'Partial')"
                  @click.stop="() => handleVoidDisbursement(props.row)"
                  v-permission="'delete'"
                />
                <div v-else-if="isApprover">
                  <q-btn
                    dense
                    icon="check_circle"
                    color="green"
                    class="q-mr-xs"
                    v-if="props.row.status === 'Void Requested'"
                    @click="handleApproveVoid(props.row)"
                  />
                  <q-btn
                    dense
                    icon="cancel"
                    color="grey"
                    v-if="props.row.status === 'Void Requested'"
                    @click="handleRejectVoid(props.row)"
                  />
                  <q-btn
                    dense
                    icon="delete"
                    :color="canDelete(props.row) ? 'red' : 'grey'"
                    :disable="!canDelete(props.row)"
                    v-if="(props.row.status === 'Pending' || props.row.status === 'Partial') && canDelete(props.row)"
                    @click.stop="() => handleDeleteDisbursement(props.row)"
                  />
                </div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="getStatusColor(props.row.status)"
                :text-color="getStatusTextColor(props.row.status)"
                dense
                :label="props.row.status"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-remarks="props">
            <q-td :props="props">
              <div v-if="props.row.status === 'Void Requested' && props.row.remarks">
                <q-chip color="orange" text-color="white" dense>
                  Void Request: {{ props.row.remarks }}
                </q-chip>
              </div>
              <div v-else-if="props.row.status === 'Voided' && props.row.remarks">
                <q-chip color="red" text-color="white" dense>
                  Voided: {{ props.row.remarks }}
                </q-chip>
              </div>
              <div v-else-if="props.row.rejection_remarks">
                <q-chip color="grey" text-color="white" dense>
                  Void Rejected: {{ props.row.rejection_remarks }}
                </q-chip>
              </div>
              <div v-else>-</div>
            </q-td>
          </template>

                     <template v-slot:body-cell-liquidate="props">
             <q-td :props="props">
                 <q-btn
                   dense
                   label="Liquidate"
                   color="primary"
                   v-if="props.row.status === 'Pending' || props.row.status === 'Partial'"
                   @click="handleLiquidateDisbursement(props.row)"
                   :loading="liquidateLoading[props.row.id]"
                   :disable="liquidateLoading[props.row.id]"
                   v-permission="'add'"
                 />
             </q-td>
           </template>

        </q-table>


      </q-card>

      <OrDetailsDialog v-model="store.dialogs.orDetails" />
      <ViewOrDetails v-model="store.dialogs.viewOrDetails" />
      <EditDisbursement />

      <!-- Void Dialog -->
      <q-dialog v-model="store.dialogs.void" persistent>
        <q-card style="min-width: 500px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Request Void</div>
          </q-card-section>

          <q-card-section>
            <div class="text-body1 q-mb-md">
              Please provide remarks for this void request.
            </div>

            <q-input
              outlined
              v-model="store.forms.void.remarks"
              label="Remarks (Required)"
              type="textarea"
              rows="3"
              :rules="[val => !!val && val.trim() !== '' || 'Remarks are required']"
              hint="Reason for voiding this disbursement"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="store.closeVoidDialog()" />
            <q-btn
              label="Submit Void Request"
              color="red"
              :loading="store.voidingDisbursement"
              :disable="!store.forms.void.remarks || store.forms.void.remarks.trim() === ''"
              @click="handleSubmitVoidRequest"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import SearchFilters from 'components/disbursement/SearchFilters.vue'
import OrDetailsDialog from 'components/disbursement/OrDetailsDialog.vue'
import ViewOrDetails from 'components/disbursement/ViewOrDetails.vue'
import EditDisbursement from 'components/disbursement/EditDisbursement.vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useAuthStore } from 'stores/auth'
import { useBankStore } from 'stores/bankStore'
import { usePageLogging } from '../../../composables/usePageLogging'

const store = useDisbursementStore()
const bankStore = useBankStore()
const authStore = useAuthStore()



const filteredParticulars = ref(store.particulars)
function filterFn (val, update) {
  if (val === '') {
    update(() => {
      filteredParticulars.value = store.particulars
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    filteredParticulars.value = store.particulars.filter(
      opt => opt.label.toLowerCase().includes(needle)
    )
  })
}
// Helper function to extract numeric days from aging string
const getAgingDays = (agingString) => {
  if (!agingString) return 0
  const match = agingString.match(/(\d+)\s*days?/)
  return match ? parseInt(match[1]) : 0
}

function canDelete(row) {
  // Cannot delete if liquidated (regardless of return amount)
  if (row.status === 'Liquidated') return false
  
  // Can only delete if pending or partial
  if (!(row.status === 'Pending' || row.status === 'Partial')) return false
  
  // For Treasurers and Approvers: Check aging restriction (≤ 1 day can be deleted)
  if (isTreasurer.value || isApprover.value) {
    const aging = Number(getAgingDays(row.aging))
    if (Number.isNaN(aging) || aging > 1) return false
  }
  
  return true
}

// Handle delete disbursement (for Captains/Chairpersons to delete after void approval)
const handleDeleteDisbursement = async (row) => {
  try {
    const result = await store.deleteDisbursement(row.id)
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Disbursement deleted successfully!',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000
      })
    } else {
      $q.notify({
        type: 'negative',
        message: result.message || 'Failed to delete disbursement',
        icon: 'error',
        position: 'top',
        timeout: 5000
      })
    }
  } catch (error) {
    console.error('Error deleting disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'An error occurred while deleting the disbursement',
      icon: 'error',
      position: 'top',
      timeout: 5000
    })
  }
}

// Status color helpers
const getStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return 'orange'
    case 'Partial':
      return 'amber'
    case 'Liquidated':
      return 'green'
    case 'Void Requested':
      return 'deep-orange'
    case 'Voided':
      return 'red'
    default:
      return 'grey'
  }
}

const getStatusTextColor = (status) => {
  switch (status) {
    case 'Pending':
    case 'Partial':
    case 'Liquidated':
    case 'Void Requested':
    case 'Voided':
      return 'white'
    default:
      return 'black'
  }
}

// Role helpers
const userPosition = computed(() => authStore.user?.position_name || '')
const isTreasurer = computed(() => /treasurer/i.test(userPosition.value))
const isApprover = computed(() => /(captain|chairperson)/i.test(userPosition.value))

// Function to load all data with optimized loading strategy
const loadAllData = async () => {
  loading.value = true

  try {
    // Load critical data first (disbursements and banks) in parallel
    const criticalPromises = [
      store.fetchDisbursements(),
      bankStore.fetchBanks()
    ]

    await Promise.all(criticalPromises)

    // Load expense accounts in background (non-blocking)
    store.fetchExpenseAccounts().catch(error => {
      console.warn('Failed to load expense accounts in background:', error)
    })

    // Show success notification only if not initial load
    if (!initialLoading.value) {
      $q.notify({
        type: 'positive',
        message: 'Disbursement data loaded successfully!',
        icon: 'check_circle',
        position: 'top',
        timeout: 2000
      })
    }

  } catch (error) {
    console.error('Error during data loading:', error)
    if (!initialLoading.value) {
      $q.notify({
        type: 'negative',
        message: 'Failed to load disbursement data: ' + (error.message || 'Unknown error'),
        icon: 'error',
        position: 'top',
        timeout: 5000
      })
    }
  } finally {
    loading.value = false
    initialLoading.value = false
  }
}

// Set up periodic refresh for expense accounts
// Removed to reduce excessive API calls

onMounted(async () => {
  await loadAllData()

  // Refresh expense accounts with updated balances
  store.refreshExpenseAccountsWithBalances()

  // Log page visit
  const { logPageVisit } = usePageLogging()
  await logPageVisit('Current Disbursement')
})

// Auto-refresh expense accounts when the expense dialog is opened
watch(
  () => store.dialogs.expense,
  async (isOpen) => {
    if (isOpen && store.expenseData.length === 0) {
      store.refreshExpenseAccountsInBackground()
    }
  }
)

import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const addingExpense = ref(false)
const initialLoading = ref(true)
const viewLoading = ref({})
const liquidateLoading = ref({})

const currentBankLabel = computed(() => {
  if (store.forms.disbursement.bank_id) {
    const selectedBank = bankStore.banks.find(bank => bank.id === store.forms.disbursement.bank_id)
    return selectedBank ? selectedBank.name : 'Select Bank'
  }
  return 'Select Bank'
})

const handleBankSelection = async (bankId) => {
  if (bankId) {
    try {
      await store.selectBank(bankId)
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: `Failed to load booklets for selected bank: ${error.message}`,
        icon: 'error',
        position: 'top',
      })
    }
  }
}

const validateAndSave = () => {
  if (store.dialogs.disbursement) {
    const form = store.forms.disbursement
    const hasRequiredFields = form.date &&
                             form.bank_id &&
                             form.dvNumber &&
                             form.payee
    if (hasRequiredFields && !store.loading) {
      store.saveDisbursement().then(result => {
        if (!result.success) {
          $q.notify({
            type: 'negative',
            message: result.error || 'Failed to save disbursement',
            icon: 'error',
            position: 'top',
            timeout: 5000
          })
        }
      })
    } else {
      $q.notify({
        type: 'negative',
        message: 'Please fill in all required fields before saving',
        icon: 'warning',
        position: 'top',
      })
    }
  }
}

const handleEnterKey = (event) => {
  if (event) {
    event.preventDefault()
  }
  validateAndSave()
}

const handleSaveClick = async () => {
  await validateAndSave()
  // Refresh the disbursement list after saving
  await store.fetchDisbursements()
}

const preloadExpenseAccounts = () => {
  // Preload expense accounts when user hovers over Add button
  if (store.expenseData.length === 0 && !store.expenseTypeLoading) {
    store.fetchExpenseAccounts().catch(error => {
      console.warn('Failed to preload expense accounts:', error)
    })
  }
}

const handleAddExpense = async () => {
  addingExpense.value = true
  try {
    await store.openDialog('expense')
  } catch (error) {
    console.error('Error opening expense dialog:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open expense dialog',
      icon: 'error',
      position: 'top',
      timeout: 3000
    })
  } finally {
    addingExpense.value = false
  }
}

const handleSaveExpense = async () => {
  try {
    await store.saveExpense()
    $q.notify({
      type: 'positive',
      message: 'Expense added successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000
    })
  } catch (error) {
    console.error('Error saving expense:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to save expense',
      icon: 'error',
      position: 'top',
      timeout: 5000
    })
  }
}

const handleDeleteExpense = async (row) => {
  try {
    await store.deleteItem(row)
    $q.notify({
      type: 'positive',
      message: 'Expense deleted successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to delete expense',
      icon: 'error',
      position: 'top',
      timeout: 5000
    })
  }
}

const loadPendingUsers = async () => {
  loading.value = true
  try {
    // Only refresh disbursements and banks, skip expense accounts for faster refresh
    const refreshPromises = [
      store.fetchDisbursements(),
      bankStore.fetchBanks()
    ]

    await Promise.all(refreshPromises)

    $q.notify({
      type: 'positive',
      message: 'Disbursements refreshed!',
      icon: 'refresh',
      position: 'top',
      timeout: 3000
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to refresh disbursements',
      icon: 'error',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}






// Open void dialog for treasurer
const handleVoidDisbursement = (row) => {
  store.openVoidDialog(row)
}

// Submit void request from dialog
const handleSubmitVoidRequest = async () => {
  try {
    await store.submitVoidRequest()
    $q.notify({
      type: 'positive',
      message: 'Void request submitted successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to submit void request',
      icon: 'error',
      position: 'top',
      timeout: 5000
    })
  }
}

// Approver actions
const handleApproveVoid = async (row) => {
  try {
    await store.approveVoidRequest(row.id)
    $q.notify({
      type: 'positive',
      message: 'Void approved.',
      icon: 'check_circle',
      position: 'top',
      timeout: 2500
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to approve void',
      icon: 'error',
      position: 'top',
      timeout: 5000
    })
  }
}

const handleRejectVoid = async (row) => {
  $q.dialog({
    title: 'Reject Void Request',
    message: 'Please provide rejection remarks:',
    prompt: {
      model: '',
      type: 'textarea'
    },
    cancel: true,
    persistent: true
  }).onOk(async (remarks) => {
    try {
      await store.rejectVoidRequest(row.id, remarks?.trim?.() || '')
      $q.notify({
        type: 'positive',
        message: 'Void request rejected.',
        icon: 'check_circle',
        position: 'top',
        timeout: 2500
      })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.message || 'Failed to reject void request',
        icon: 'error',
        position: 'top',
        timeout: 5000
      })
    }
  })
}

// Handle edit disbursement with loading state
const handleEditDisbursement = async (row) => {
  try {
    await store.openEditDisbursement(row)
  } catch (error) {
    console.error('Error opening edit disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open edit disbursement',
      icon: 'error',
      position: 'top',
      timeout: 3000
    })
  }
}

// Handle view disbursement with loading state
const handleViewDisbursement = async (row) => {
  viewLoading.value[row.id] = true
  try {
    await store.openViewOrDetails(row)
  } catch (error) {
    console.error('Error opening view disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open view disbursement',
      icon: 'error',
      position: 'top',
      timeout: 3000
    })
  } finally {
    viewLoading.value[row.id] = false
  }
}

// Handle liquidate disbursement with loading state
const handleLiquidateDisbursement = async (row) => {
  liquidateLoading.value[row.id] = true
  try {
    await store.openOrDetailsDialog(row)
  } catch (error) {
    console.error('Error opening liquidate disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open liquidate disbursement',
      icon: 'error',
      position: 'top',
      timeout: 3000
    })
  } finally {
    liquidateLoading.value[row.id] = false
  }
}
</script>

<style scoped>
.disbursement-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

/* Style for loading edit button */
.q-btn[loading] {
  opacity: 0.7;
}

/* Ensure proper spacing for action buttons */
.q-gutter-xs .q-btn {
  margin: 2px;
}

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }

  .row.q-col-gutter-md {
    flex-direction: column;
  }

  .col-md-4,
  .col-sm-6,
  .col-sm-12 {
    width: 100%;
    margin-bottom: 8px;
  }
}
</style>
