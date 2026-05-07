<!-- admin -->
<template>
  <q-page class="q-pa-md disbursement-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">Disbursement Transaction</div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="refreshData"
          :loading="store.loadingDisbursements"
        />
      </div>
    </div>

    <div class="q-mb-sm">
      <SearchFilters />

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
                  :options="bankStore.banks"
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
              <!-- <q-btn
                label="Add"
                color="primary"
                icon="add"
                @click="store.openDialog('expense')"
              /> -->
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
                  <!-- Admin can only view, not edit/delete -->
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
              label="Close"
              @click="store.closeDialog('disbursement')"
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

            <q-input
              outlined
              dense
              v-model="store.forms.expense.particulars"
              label="Particulars"
              class="q-mb-md"
              type="textarea"
              autogrow
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
            <q-btn label="Save" @click="store.saveExpense" color="primary" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Main Data Table -->
      <q-card flat bordered>
        <q-table
          :rows="store.filteredDisbursements"
          :columns="adminColumns"
          row-key="id"
          :pagination="store.pagination"
          :loading="store.loadingDisbursements"
          flat
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="q-gutter-xs">
                <!-- <q-btn
                  dense
                  icon="edit"
                  color="orange"
                  v-if="props.row.status === 'Pending' || props.row.status === 'Partial'"
                  @click="store.openEditDisbursement(props.row)"
                /> -->
                <q-btn
                  dense
                  icon="visibility"
                  color="blue"
                  @click="store.openViewOrDetails(props.row)"
                />
                <!-- <q-btn
                  dense
                  label="Liquidate"
                  color="primary"
                  v-if="props.row.status === 'Pending' || props.row.status === 'Partial'"
                  @click="store.openOrDetailsDialog(props.row)"
                /> -->
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-remarks="props">
            <q-td :props="props">
              <q-btn
                dense
                :icon="isReviewed(props.row.id) ? 'check' : 'rate_review'"
                :label="isReviewed(props.row.id) ? 'Reviewed' : 'Review'"
                :color="isReviewed(props.row.id) ? 'positive' : 'primary'"
                :outline="!isReviewed(props.row.id)"
                :disable="isLoadingReview(props.row.id)"
                :loading="isLoadingReview(props.row.id)"
                :unelevated="!isReviewed(props.row.id)"
                rounded
                @click="isReviewed(props.row.id) ? showRemarksDialog(props.row.id) : handleReviewClick(props.row)"
              >
                <q-tooltip v-if="isReviewed(props.row.id)" class="bg-grey-8">
                  Click to view admin remarks
                </q-tooltip>
                <q-tooltip v-else-if="isLoadingReview(props.row.id)" class="bg-grey-8">
                  Loading review status...
                </q-tooltip>
              </q-btn>
            </q-td>
          </template>


        </q-table>
      </q-card>

      <!-- Review Confirmation Dialog -->
      <q-dialog v-model="showReviewDialog" @keydown.enter="confirmReview">
        <q-card style="min-width: 400px">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Confirm Review</div>
          </q-card-section>

          <q-card-section>
            <div class="q-mb-md">
              <div class="text-body1 q-mb-sm">
                Mark DV <strong>{{ currentReviewRow?.dvNumber }}</strong> as reviewed?
              </div>
              <q-input
                outlined
                v-model="adminRemarks"
                label="Admin Remarks"
                placeholder="Enter your remarks here..."
                type="textarea"
                rows="3"
                :rules="[(val) => !!val || 'Remarks are required']"
                @keydown.enter="confirmReview"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="cancelReview" />
            <q-btn
              label="OK"
              color="primary"
              @click="confirmReview"
              :disable="!adminRemarks.trim()"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <OrDetailsDialog />
      <ViewOrDetails v-model="store.dialogs.viewOrDetails" />
      <EditDisbursement />
    </div>
  </q-page>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SearchFilters from 'pages/Admin/SearchFilters.vue'
import OrDetailsDialog from 'components/disbursement/OrDetailsDialog.vue'
import ViewOrDetails from 'components/disbursement/ViewOrDetails.vue'
import EditDisbursement from 'components/disbursement/EditDisbursement.vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useBankStore } from 'stores/bankStore'
import { usePageLogging } from '../../../composables/usePageLogging'
import { useActivityLogging } from '../../../composables/useActivityLogging'
import { useAuthStore } from 'stores/auth'
import { api } from 'boot/axios'
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const store = useDisbursementStore()
const bankStore = useBankStore()
const authStore = useAuthStore()
const route = useRoute()
const { logPageVisit } = usePageLogging()
const { logAdminActivity } = useActivityLogging()

onMounted(async () => {
  try {
    const year = route.query.year ? parseInt(route.query.year, 10) : null

    const [disbursementsPromise, banksPromise] = await Promise.allSettled([
      store.fetchDisbursements(year),  // PASS year HERE
      bankStore.banks.length ? Promise.resolve() : bankStore.fetchBanks()
    ])

    if (!store.expenseData.length) {
      store.fetchExpenseAccounts().catch(error => {
        console.warn('Failed to fetch expense accounts:', error)
      })
    }

    logPageVisit('Current Disbursement').catch(error => {
      console.warn('Failed to log page visit:', error)
    })

    if (disbursementsPromise.status === 'rejected') {
      throw disbursementsPromise.reason
    }
    if (banksPromise.status === 'rejected') {
      console.warn('Failed to fetch banks:', banksPromise.reason)
    }

  } catch (error) {
    console.error('Error during component initialization:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load initial data: ' + error.message,
      position: 'top',
    })
  }
})

watch(
  () => route.query.year,
  async (newYear) => {
    const year = newYear ? parseInt(newYear, 10) : null
    try {
      await store.fetchDisbursements(year)
      await loadDisbursementReviews()
    } catch (error) {
      console.error('Failed to fetch disbursements for year:', year, error)
      $q.notify({
        type: 'negative',
        message: 'Failed to load disbursements for selected year: ' + error.message,
        position: 'top',
      })
    }
  }
)

// Watch for changes in the selected bank to update the cheque booklets
watch(
  () => store.forms.disbursement.bank_id,
  async (newBankId) => {
    if (newBankId) {
      try {
        await store.loadChequeBookletsForBank(newBankId)
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: `Failed to load cheque booklets for selected bank: ${error.message}`,
          icon: 'error',
          position: 'top',
        })
      }
    }
  },
)

// Persistent review state per disbursement row
const reviewedSet = ref(new Set())
const disbursementRemarks = ref(new Map()) // Store remarks per reviewed DV
const loadingReviews = ref(new Set()) // Track which items are loading reviews

const isReviewed = (id) => reviewedSet.value.has(id)
const getRemarks = (id) => disbursementRemarks.value.get(id) || ''
const isLoadingReview = (id) => loadingReviews.value.has(id)

// Load existing reviews for disbursements
const loadDisbursementReviews = async () => {
  try {
    const items = store.filteredDisbursements.map(item => ({
      reviewable_type: 'App\\Models\\Disbursement',
      reviewable_id: item.id
    }))
    
    if (items.length === 0) return
    
    // Mark all items as loading
    items.forEach(item => loadingReviews.value.add(item.reviewable_id))
    
    const response = await api.post('/api/admin/reviews/bulk', { items }, {
      headers: {
        Authorization: `Bearer ${authStore.adminToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    
    if (response.data.success) {
      response.data.data.forEach(review => {
        if (review.is_reviewed && review.review) {
          reviewedSet.value.add(review.reviewable_id)
          disbursementRemarks.value.set(review.reviewable_id, review.review.remarks)
        }
        // Remove from loading set
        loadingReviews.value.delete(review.reviewable_id)
      })
    }
  } catch (error) {
    console.error('Failed to load disbursement reviews:', error)
    // Clear loading state on error
    store.filteredDisbursements.forEach(item => {
      loadingReviews.value.delete(item.id)
    })
  }
}

// Review dialog state
const showReviewDialog = ref(false)
const adminRemarks = ref('')
const currentReviewRow = ref(null)

const handleReviewClick = (row) => {
  if (isReviewed(row.id)) return
  currentReviewRow.value = row
  adminRemarks.value = ''
  showReviewDialog.value = true
}

const confirmReview = async () => {
  if (!adminRemarks.value.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Please enter your remarks before confirming the review.',
      icon: 'warning',
      position: 'top',
    })
    return
  }

  if (currentReviewRow.value) {
    try {
      const response = await api.post('/api/admin/reviews', {
        reviewable_type: 'App\\Models\\Disbursement',
        reviewable_id: currentReviewRow.value.id,
        remarks: adminRemarks.value
      }, {
        headers: {
          Authorization: `Bearer ${authStore.adminToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      if (response.data.success) {
        reviewedSet.value.add(currentReviewRow.value.id)
        disbursementRemarks.value.set(currentReviewRow.value.id, adminRemarks.value)
        
        // Log admin review activity
        const selectedBarangayName = (authStore?.getSelectedBarangayName && authStore.getSelectedBarangayName()) || null
        const barangayName = currentReviewRow.value.barangay_name || currentReviewRow.value.barangayName || (typeof currentReviewRow.value.barangay === 'string' ? currentReviewRow.value.barangay : (currentReviewRow.value.barangay?.name)) || selectedBarangayName || 'Unknown Barangay'
        logAdminActivity('Reviewed Item', `Admin reviewed Disbursement ${currentReviewRow.value.dvNumber} (Barangay: ${barangayName}) - Remarks: ${adminRemarks.value}`)
        
        $q.notify({
          type: 'positive',
          message: 'Disbursement marked as reviewed successfully!',
          icon: 'check_circle',
          position: 'top',
        })
      } else {
        throw new Error(response.data.message || 'Failed to save review')
      }
    } catch (error) {
      console.error('Failed to save review:', error)
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to save review',
        icon: 'error',
        position: 'top',
      })
      return
    }
  }

  showReviewDialog.value = false
  adminRemarks.value = ''
  currentReviewRow.value = null
}

const cancelReview = () => {
  showReviewDialog.value = false
  adminRemarks.value = ''
  currentReviewRow.value = null
}

const showRemarksDialog = (id) => {
  const remarks = getRemarks(id)
  if (remarks) {
    $q.dialog({
      title: 'Admin Remarks',
      message: remarks,
      ok: { label: 'Close', color: 'primary' }
    })
  }
}

const currentBankLabel = computed(() => {
  if (store.forms.disbursement.bank_id) {
    const selectedBank = bankStore.banks.find(bank => bank.id === store.forms.disbursement.bank_id)
    return selectedBank ? selectedBank.name : 'Select Bank'
  }
  return 'Select Bank'
})

// Admin-specific columns without liquidation
const adminColumns = computed(() => {
  return store.disbursementColumns.filter(column => column.name !== 'liquidate')
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

// Watch for disbursements data to be available and load reviews immediately
watch(
  () => store.filteredDisbursements,
  async (newDisbursements) => {
    if (newDisbursements && newDisbursements.length > 0) {
      // Only load if we haven't loaded reviews yet (prevent double loading)
      if (reviewedSet.value.size === 0 && loadingReviews.value.size === 0) {
        await loadDisbursementReviews()
      }
    }
  },
  { immediate: true }
)

const refreshData = async () => {
  try {
    const year = route.query.year ? parseInt(route.query.year, 10) : null
    await store.fetchDisbursements(year)
    await loadDisbursementReviews()
  } catch (error) {
    console.error('Failed to refresh data:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to refresh data: ' + error.message,
      position: 'top',
    })
  }
}

// const handleBookletSelection = async (bookletRange) => {
//   if (bookletRange) {
//     try {
//       await store.selectBooklet(bookletRange)
//     } catch (error) {
//       $q.notify({
//         type: 'negative',
//         message: `Failed to load cheques for selected booklet: ${error.message}`,
//         icon: 'error',
//         position: 'top',
//       })
//     }
//   }
// }


const handleEnterKey = (event) => {
  if (event) {
    event.preventDefault()
  }
  // Admin users cannot save - only view
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
