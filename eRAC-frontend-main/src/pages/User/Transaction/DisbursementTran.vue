<!-- user -->
<template>
  <q-page class="q-pa-md disbursement-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-medium">Disbursement Transaction</div>
          <div class="text-caption text-grey-6">
            Showing transactions for fiscal year {{ currentFiscalYear }}
          </div>
        </div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="refreshData"
          :loading="loading"
          title="Refresh disbursements"
        />
      </div>
    </div>

    <!-- Status Summary Cards -->

    <!-- Filters Section -->
    <q-card flat bordered class="q-mb-md filters-section">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Status Filter -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Status:</q-item-label>
            <q-select
              outlined
              dense
              v-model="selectedStatus"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              :label="currentStatusLabel"
              clearable
              @update:model-value="handleStatusChange"
            />
          </div>

          <!-- Search Input -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Search:</q-item-label>
            <q-input
              outlined
              dense
              v-model="searchQuery"
              placeholder="Search payee, DV number..."
              clearable
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
              <template v-slot:hint v-if="searchQuery">
                {{ filteredDisbursements.length }} result{{
                  filteredDisbursements.length !== 1 ? 's' : ''
                }}
                found
              </template>
            </q-input>
          </div>

          <!-- Date Range Filter -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Date Range:</q-item-label>
            <q-input
              outlined
              dense
              v-model="dateRangeDisplay"
              placeholder="Select date range..."
              readonly
              clearable
              @clear="onDateRangeClear"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="dateRange" range @update:model-value="onDateRangeChange">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Clear Button -->
          <div class="col-md-1 col-sm-6 col-xs-12">
            <q-btn
              dense
              outlined
              color="red-10"
              icon="clear_all"
              label="Clear"
              @click="clearAllFilters"
              class="full-width"
            />
          </div>

          <!-- Spacer to push Add button to the right -->
          <div class="col"></div>

          <!-- Add Button -->
          <div class="col-md-1 col-sm-6 col-xs-12">
            <q-btn
              label="Add"
              color="primary"
              icon="add"
              @click="store.openDialog('disbursement')"
              class="full-width"
              v-permission="'add'"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

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
            <q-btn flat label="Cancel" @click="handleDialogClose('disbursement')" />
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
            <q-btn flat label="Cancel" @click="handleDialogClose('expense')" />
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
            <!-- <q-select outlined dense v-model="store.forms.expense.particulars" :options="filteredParticulars"
              label="Particulars" use-input fill-input hide-selected new-value-mode="add-unique" @filter="filterFn" /> -->
<q-select
  outlined
  dense
  v-model="store.forms.expense.particulars"
  :options="filteredParticulars"
  label="Particulars"
  use-input
  hide-selected
  fill-input
  new-value-mode="add-unique"
  option-label="label"
  option-value="label"
  emit-value
  @filter="filterFn"
  @input-value="(val) => { particularInputVal = val }"
  @blur="() => { if (particularInputVal) store.forms.expense.particulars = particularInputVal }"
/>

<!-- <q-select
  outlined
  dense
  v-model="store.forms.expense.particulars"
  :options="filteredParticulars"
  label="Particulars"
  use-input
  fill-input
  hide-selected
  new-value-mode="add-unique"
  option-label="label"
  option-value="label"
  emit-value
  @filter="filterFn"
  @input-value="(val) => { particularInputVal = val }"
  @keyup.tab="() => { if (particularInputVal) store.forms.expense.particulars = particularInputVal }"
  @keyup.esc="() => { if (particularInputVal) store.forms.expense.particulars = particularInputVal }"
  popup-content-style="display: none"
  v-if="false"
/>

<q-input
  outlined
  dense
  v-model="store.forms.expense.particulars"
  label="Particulars"
>
  <template v-slot:append>
    <q-icon name="arrow_drop_down" class="cursor-pointer">
      <q-menu fit>
        <q-list>
          <q-item
            v-for="opt in filteredParticulars"
            :key="opt.label"
            clickable
            v-close-popup
            @click="store.forms.expense.particulars = opt.label"
          >
            <q-item-section>{{ opt.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-icon>
  </template>
</q-input> -->
            <q-input
              outlined
              dense
              :model-value="formatInputValue(store.forms.expense.amount)"
              @update:model-value="(val) => (store.forms.expense.amount = handleAmountInput(val))"
              @blur="(e) => (store.forms.expense.amount = formatToTwoDecimals(e.target.value))"
              label="Amount"
              class="q-mb-md"
              prefix="₱"
              inputmode="decimal"
              pattern="\\d*\\.?\\d{0,2}"
              @keypress="blockNonNumeric"
              @paste.prevent="handlePasteNumeric"
              placeholder="0.00"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="handleDialogClose('expenseDetail')" />
            <q-btn label="Save" @click="handleSaveExpense" color="primary" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Results Summary -->
      <div v-if="filteredDisbursements.length > 0" class="q-mb-sm">
        <!-- <q-chip
          :color="
            filteredDisbursements.length === store.disbursements.length ? 'grey-6' : 'primary'
          "
          :text-color="
            filteredDisbursements.length === store.disbursements.length ? 'white' : 'white'
          "
          dense
        >
          {{ filteredDisbursements.length }} of {{ store.disbursements.length }} disbursements
          <span v-if="filteredDisbursements.length !== store.disbursements.length">(filtered)</span>
        </q-chip> -->
      </div>

      <!-- Main Data Table -->
      <q-card flat bordered>
        <q-table
          :rows="filteredDisbursements"
          :columns="userColumns"
          row-key="id"
          :pagination="store.pagination"
          :loading="store.loadingDisbursements"
          flat
          @row-dblclick="(evt, row) => handleViewDisbursement(row)"
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props" >
              <div class="row q-gutter-xs items-left left ">
                <q-btn
                  v-if="
                    isApprover ||
                    authStore.admin ||
                    isTreasurer
                  "
                  dense
                  icon="edit"
                  :color="
                    props.row.status === 'Unliquidated' || props.row.status === 'Partial'
                      ? 'orange'
                      : 'grey'
                  "
                  :disable="props.row.status !== 'Unliquidated' && props.row.status !== 'Partial'"
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

                <!-- Treasurer: Request edit - COMMENTED OUT FOR FUTURE REUSE -->
                <!--
                <q-btn
                  dense
                  icon="edit_note"
                  color="deep-orange"
                  v-if="
                    isTreasurer &&
                    (props.row.status === 'Unliquidated' || props.row.status === 'Partial') &&
                    props.row.status !== 'Stale' &&
                    props.row.status !== 'Edit Requested' &&
                    props.row.edit_approved !== true
                  "
                  @click.stop="() => handleEditRequest(props.row)"
                  v-permission="'edit'"
                />
                -->

                <!-- Treasurer: Request void -->
                <q-btn
                  dense
                  icon="block"
                  color="red"
                  v-if="
                    isTreasurer &&
                    (props.row.status === 'Unliquidated' || props.row.status === 'Partial') &&
                    canVoid(props.row) &&
                    props.row.status !== 'Stale'
                  "
                  @click.stop="() => handleVoidDisbursement(props.row)"
                  v-permission="'delete'"
                />
                <!-- Captain/SK Chairperson: Direct void -->
                <q-btn
                  dense
                  icon="block"
                  color="red"
                  v-if="
                    isApprover &&
                    (props.row.status === 'Unliquidated' || props.row.status === 'Partial') &&
                    canVoid(props.row) &&
                    props.row.status !== 'Stale'
                  "
                  @click.stop="() => handleDirectVoidDisbursement(props.row)"
                  v-permission="'delete'"
                />
                <!-- Approver: Handle void requests - now handled in ViewOrDetails -->
                <!-- Void approval/rejection buttons removed - now handled in ViewOrDetails component -->
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props" >
              <q-chip
                :color="getStatusColor(props.row.status)"
                :text-color="getStatusTextColor(props.row.status)"
                dense
                :label="props.row.status"
              />
            </q-td>
          </template>


          <template v-slot:body-cell-liquidate="props">
            <q-td :props="props">
              <q-btn
                dense
                label="Liquidate"
                color="primary"
                v-if="props.row.status === 'Unliquidated' || props.row.status === 'Partial'"
                @click="handleLiquidateDisbursement(props.row)"
                :loading="liquidateLoading[props.row.id]"
                :disable="liquidateLoading[props.row.id] || props.row.status === 'Stale'"
                v-permission="'add'"
              />
            </q-td>
          </template>
        </q-table>
      </q-card>

      <OrDetailsDialog v-model="store.dialogs.orDetails" />
      <ViewOrDetails v-model="store.dialogs.viewOrDetails" />
      <EditDisbursement />

      <!-- Void Request Dialog (for Treasurers) -->
      <q-dialog v-model="store.dialogs.void" persistent>
        <q-card style="min-width: 500px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Request Void</div>
          </q-card-section>

          <q-card-section>
            <div class="text-body1 q-mb-md">
              Please provide remarks for this void request. The request will be sent to the Barangay
              Captain or SK Chairperson for approval.
            </div>

            <q-input
              outlined
              v-model="store.forms.void.remarks"
              label="Remarks (Required)"
              type="textarea"
              rows="3"
              :rules="[(val) => (!!val && val.trim() !== '') || 'Remarks are required']"
              hint="Reason for requesting to void this disbursement"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="handleDialogClose('void')" />
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

      <!-- Dialog (for Treasurers) - COMMENTED OUT FOR FUTURE REUSE -->
      <!--
      <q-dialog v-model="store.dialogs.editRequest" persistent>
        <q-card style="min-width: 500px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Request Edit</div>
          </q-card-section>

          <q-card-section>
            <div class="text-body1 q-mb-md">
              Please provide remarks for this edit request. The request will be sent to the Barangay
              Captain or SK Chairperson for approval.
            </div>

            <q-input
              outlined
              v-model="store.forms.edit.remarks"
              label="Remarks (Required)"
              type="textarea"
              rows="3"
              :rules="[(val) => (!!val && val.trim() !== '') || 'Remarks are required']"
              hint="Reason for requesting to edit this disbursement"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="handleDialogClose('editRequest')" />
            <q-btn
              label="Submit Edit Request"
              color="deep-orange"
              :loading="store.requestingEdit"
              :disable="!store.forms.edit.remarks || store.forms.edit.remarks.trim() === ''"
              @click="handleSubmitEditRequest"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
      -->

      <!-- Remarks Dialog -->
      <q-dialog v-model="remarksDialog" persistent>
        <q-card style="min-width: 500px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Remarks</div>
          </q-card-section>

          <q-card-section>
            <div class="text-body1 q-mb-sm">
              <strong>Disbursement:</strong> {{ selectedRemarksData?.dvNumber || 'N/A' }}
            </div>
            <div class="text-body1 q-mb-sm">
              <strong>Payee:</strong> {{ selectedRemarksData?.payee || 'N/A' }}
            </div>
            <div class="text-body1 q-mb-md">
              <strong>Status:</strong>
              <q-chip
                :color="getStatusColor(selectedRemarksData?.status)"
                :text-color="getStatusTextColor(selectedRemarksData?.status)"
                dense
                :label="selectedRemarksData?.status"
                class="q-ml-sm"
              />
            </div>

            <q-separator class="q-mb-md" />

            <div class="text-subtitle1 q-mb-sm text-weight-medium">Remarks:</div>
            <div
              class="remarks-content q-pa-md"
              style="background-color: #f5f5f5; border-radius: 8px; min-height: 100px"
            >
              <div v-if="selectedRemarksData?.remarks" class="text-body1">
                {{ selectedRemarksData.remarks }}
              </div>
              <div v-else-if="selectedRemarksData?.rejection_remarks" class="text-body1">
                {{ selectedRemarksData.rejection_remarks }}
              </div>
              <div v-else class="text-grey-6 text-italic">No remarks available</div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Close" @click="closeRemarksDialog" color="primary" />
            <q-btn
              label="View Details"
              @click="openViewOrDetailsFromRemarks"
              color="primary"
              unelevated
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'

import OrDetailsDialog from 'components/disbursement/OrDetailsDialog.vue'
import ViewOrDetails from 'components/disbursement/ViewOrDetails.vue'
import EditDisbursement from 'components/disbursement/EditDisbursement.vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useAuthStore } from 'stores/auth'
import { useBankStore } from 'stores/bankStore'
import { usePageLogging } from '../../../composables/usePageLogging'

const particularInputVal = ref('')
const store = useDisbursementStore()
const bankStore = useBankStore()
const authStore = useAuthStore()
const route = useRoute()

// Status filtering
const selectedStatus = ref(null)
const statusOptions = [
  { label: 'All Status', value: null },
  { label: 'Unliquidated', value: 'Unliquidated' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Liquidated', value: 'Liquidated' },
  // { label: 'Edit Requested', value: 'Edit Requested' }, // COMMENTED OUT FOR FUTURE REUSE
  { label: 'Void Requested', value: 'Void Requested' },
  { label: 'Voided', value: 'Voided' },
  { label: 'Stale', value: 'Stale' },
]

// Search query
const searchQuery = ref('')

const filteredParticulars = ref(store.particulars)

function filterFn(val, update) {

  if (val === '') {
    update(() => {
      filteredParticulars.value = store.particulars
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    const results = store.particulars.filter((opt) => opt.label.toLowerCase().includes(needle))
    filteredParticulars.value = results
  })
}

watch(filteredParticulars, () => {
})

// Formatting helpers for amount input (kept local to this component)
const formatInputValue = (value) => {
  if (value === '' || value === null || value === undefined) return ''
  const isNumber = typeof value === 'number'
  const cleanValue = String(value)
    .replace(/[₱,\s]/g, '')
    .replace(/,/g, '')
  const num = parseFloat(cleanValue)
  if (isNaN(num)) return ''
  return isNumber
    ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : num.toLocaleString('en-US')
}

const handleAmountInput = (value) => {
  let cleanValue = String(value).replace(/[₱,\s]/g, '')
  cleanValue = cleanValue.replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }
  return cleanValue
}

const formatToTwoDecimals = (value) => {
  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  if (cleanValue === '') return ''
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    const collapsed = parts[0] + '.' + parts.slice(1).join('')
    return formatToTwoDecimals(collapsed)
  }
  if (parts.length === 2 && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2)
  }
  const num = parseFloat(parts.join('.'))
  if (isNaN(num)) return ''
  return Math.round(num * 100) / 100
}

const blockNonNumeric = (event) => {
  const key = event.key
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
  ]
  if (allowedKeys.includes(key)) return
  if (key === '.' && !event.target.value.includes('.')) return
  if (!/^\d$/.test(key)) event.preventDefault()
}

const handlePasteNumeric = (event) => {
  event.preventDefault()
  const paste = (event.clipboardData || window.clipboardData).getData('text')
  const cleanValue = paste.replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  let finalValue = parts[0]
  if (parts.length > 1) {
    finalValue += '.' + parts.slice(1).join('').substring(0, 2)
  }
  store.forms.expense.amount = finalValue
}

function canVoid(row) {
  // Can only void if unliquidated or partial
  if (!(row.status === 'Unliquidated' || row.status === 'Partial')) return false

  return true
}
// Clear all filters
const clearAllFilters = () => {
  selectedStatus.value = null
  searchQuery.value = ''
  dateRange.value = null
  store.searchQuery = ''
  store.dateFrom = ''
  store.dateTo = ''
}
const dateRange = ref(null)

const dateRangeDisplay = computed(() => {
  if (!dateRange.value || !dateRange.value.from || !dateRange.value.to) {
    return ''
  }
  const fromDate = new Date(dateRange.value.from).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const toDate = new Date(dateRange.value.to).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${fromDate} - ${toDate}`
})

const onDateRangeChange = (newRange) => {
  if (newRange && newRange.from && newRange.to) {
    // Convert date format from YYYY/MM/DD to DD/MM/YYYY
    const fromDate = new Date(newRange.from)
    const toDate = new Date(newRange.to)

    store.dateFrom = fromDate.toLocaleDateString('en-GB') // DD/MM/YYYY format
    store.dateTo = toDate.toLocaleDateString('en-GB') // DD/MM/YYYY format
  } else {
    store.dateFrom = ''
    store.dateTo = ''
  }
}

const onDateRangeClear = () => {
  dateRange.value = null
  store.dateFrom = ''
  store.dateTo = ''
}

// Handle direct void disbursement (for Captains/SK Chairpersons)
const handleDirectVoidDisbursement = (row) => {
  $q.dialog({
    title: 'Void Disbursement',
    message: 'Please provide remarks for voiding this disbursement:',
    prompt: {
      model: '',
      type: 'textarea',
      isValid: (val) => val && val.trim() !== '',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (remarks) => {
    try {
      const result = await store.voidDisbursementDirectly(row.id, remarks?.trim?.() || '')
      if (result.success) {
        $q.notify({
          type: 'positive',
          message: 'Disbursement voided successfully!',
          icon: 'block',
          position: 'top',
          timeout: 3000,
        })
      } else {
        $q.notify({
          type: 'negative',
          message: result.message || 'Failed to void disbursement',
          icon: 'error',
          position: 'top',
          timeout: 5000,
        })
      }
    } catch (error) {
      console.error('Error voiding disbursement:', error)
      $q.notify({
        type: 'negative',
        message: error.message || 'An error occurred while voiding the disbursement',
        icon: 'error',
        position: 'top',
        timeout: 5000,
      })
    }
  })
}

// Status color helpers
const getStatusColor = (status) => {
  switch (status) {
    case 'Unliquidated':
      return 'blue'
    case 'Partial':
      return 'amber'
    case 'Liquidated':
      return 'green'
    // case 'Edit Requested': // COMMENTED OUT FOR FUTURE REUSE
    //   return 'deep-purple'
    case 'Void Requested':
      return 'deep-orange'
    case 'Voided':
      return 'red'
    case 'Stale':
      return 'purple'
    default:
      return 'grey'
  }
}

const getStatusTextColor = (status) => {
  switch (status) {
    case 'Unliquidated':
    case 'Partial':
    case 'Liquidated':
       case 'Void Requested':
           case 'Voided':
    case 'Stale':
      return 'white'
    default:
      return 'black'
    // case 'Edit Requested': // COMMENTED OUT FOR FUTURE REUSE
    //   return 'white'


  }
}

// Role helpers
const userPosition = computed(() => authStore.user?.position_name || '')
const isTreasurer = computed(() => /treasurer/i.test(userPosition.value))
const isApprover = computed(() => /(captain|chairperson)/i.test(userPosition.value))

// Current fiscal year
const currentFiscalYear = computed(() => new Date().getFullYear())

// User-specific columns without remarks
const userColumns = computed(() => {
  return store.disbursementColumns.filter(column => column.name !== 'remarks')
})

// Function to load all data with optimized loading strategy
const loadAllData = async () => {
  loading.value = true

  try {
    // Load critical data first (disbursements and banks) in parallel
    const criticalPromises = [store.fetchDisbursements(), bankStore.fetchBanks()]

    await Promise.all(criticalPromises)

    // Load expense accounts in background (non-blocking)
    store.refreshExpenseAccountsWithBalances().catch((error) => {
      console.warn('Failed to load expense accounts in background:', error)
    })

    // Show success notification only if not initial load
    if (!initialLoading.value) {
      $q.notify({
        type: 'positive',
        message: `Disbursement data for fiscal year ${currentFiscalYear.value} loaded successfully!`,
        icon: 'check_circle',
        position: 'top',
        timeout: 2000,
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
        timeout: 5000,
      })
    }
  } finally {
    loading.value = false
    initialLoading.value = false
  }
}

// Enhanced data loading with better error handling
const loadDataWithRetry = async (retryCount = 0, maxRetries = 3) => {
  try {
    await loadAllData()
  } catch (error) {
    if (retryCount < maxRetries) {
      console.warn(`Data loading failed, retrying... (${retryCount + 1}/${maxRetries})`)
      setTimeout(
        () => {
          loadDataWithRetry(retryCount + 1, maxRetries)
        },
        1000 * (retryCount + 1),
      ) // Exponential backoff
    } else {
      console.error('Data loading failed after all retries:', error)
      $q.notify({
        type: 'negative',
        message: 'Failed to load data after multiple attempts. Please refresh the page.',
        icon: 'error',
        position: 'top',
        timeout: 10000,
        actions: [
          {
            label: 'Retry',
            color: 'white',
            handler: () => loadDataWithRetry(),
          },
        ],
      })
    }
  }
}

// Set up periodic refresh for expense accounts
// Removed to reduce excessive API calls

// Apply navigation parameters from dashboard
const applyNavigationFilters = () => {
  const query = route.query

  if (query.search) {
    searchQuery.value = query.search
    store.searchQuery = query.search
  }

  if (query.status) {
    selectedStatus.value = query.status
  }

  if (query.dateFrom && query.dateTo) {
    // Convert date format for the date range picker
    const fromDate = new Date(query.dateFrom)
    const toDate = new Date(query.dateTo)

    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
      dateRange.value = {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0]
      }

      // Apply to store
      store.dateFrom = fromDate.toLocaleDateString('en-GB')
      store.dateTo = toDate.toLocaleDateString('en-GB')
    }
  }

  // Show notification if filters were applied
  // Filters applied from dashboard navigation - no notification needed
}

onMounted(async () => {
  try {
    // Apply navigation filters first
    applyNavigationFilters()

    // Use enhanced data loading with retry mechanism
    await loadDataWithRetry()

    // Log page visit
    const { logPageVisit } = usePageLogging()
    await logPageVisit('Current Disbursement')
  } catch (error) {
    console.error('Error initializing DisbursementTran page:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to initialize page. Please refresh.',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
})

// Watch for route changes to update filters when navigating from notifications
watch(
  () => route.query,
  (newQuery, oldQuery) => {
    // Only apply filters if the query actually changed
    if (JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
      applyNavigationFilters()
    }
  },
  { deep: true }
)

// Auto-refresh expense accounts when the expense dialog is opened
watch(
  () => store.dialogs.expense,
  async (isOpen) => {
    if (isOpen && store.expenseAccounts.length === 0) {
      store.refreshExpenseAccountsWithBalances()
    }
  },
)

const $q = useQuasar()
const loading = ref(false)
const addingExpense = ref(false)
const initialLoading = ref(true)
const viewLoading = ref({})
const liquidateLoading = ref({})

// Remarks dialog
const remarksDialog = ref(false)
const selectedRemarksData = ref(null)

const currentBankLabel = computed(() => {
  if (store.forms.disbursement.bank_id) {
    const selectedBank = bankStore.banks.find(
      (bank) => bank.id === store.forms.disbursement.bank_id,
    )
    return selectedBank ? selectedBank.name : 'Select Bank'
  }
  return 'Select Bank'
})

const currentStatusLabel = computed(() => {
  const option = statusOptions.find((opt) => opt.value === selectedStatus.value)
  return option ? option.label : 'All Status'
})

// Status counts for summary cards

// Enhanced filtered disbursements with better search and filtering
const filteredDisbursements = computed(() => {
  let filtered = store.disbursements || []

  // Filter by status
  if (selectedStatus.value) {
    filtered = filtered.filter((disbursement) => disbursement.status === selectedStatus.value)
  }

  // Enhanced search functionality
  if (searchQuery.value && searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter((disbursement) => {
      // Search in multiple fields
      const searchableFields = [
        disbursement.payee,
        disbursement.dvNumber,
        disbursement.chequeNumber,
        disbursement.bank,
        disbursement.barangay_name,
        disbursement.status,
      ]

      return searchableFields.some(
        (field) => field && field.toString().toLowerCase().includes(query),
      )
    })
  }

  // Enhanced date range filtering
  if (store.dateFrom && store.dateTo) {
    filtered = filtered.filter((disbursement) => {
      if (!disbursement.date) return false

      try {
        // Convert disbursement date to DD/MM/YYYY format for comparison
        let disbursementDate
        if (disbursement.date.includes('/')) {
          disbursementDate = disbursement.date
        } else {
          // Handle different date formats
          const date = new Date(disbursement.date)
          if (isNaN(date.getTime())) return false
          disbursementDate = date.toLocaleDateString('en-GB')
        }

        // Compare dates
        return disbursementDate >= store.dateFrom && disbursementDate <= store.dateTo
      } catch (error) {
        console.warn('Error parsing disbursement date:', disbursement.date, error)
        return false
      }
    })
  }

  // Sort by date (newest first) and then by DV number
  filtered.sort((a, b) => {
    // First sort by date
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    if (dateA.getTime() !== dateB.getTime()) {
      return dateB.getTime() - dateA.getTime() // Newest first
    }

    // Then sort by DV number
    return (b.dvNumber || '').localeCompare(a.dvNumber || '')
  })

  return filtered
})

const handleBankSelection = async (bankId) => {
  if (bankId) {
    try {
      // Clear previous auto-generated values
      store.autoCheque = null
      store.autoBookletID = null

      await store.selectBank(bankId)

      // Auto-generate cheque number after bank selection
      if (store.autoCheque && store.autoBookletID) {
        $q.notify({
          type: 'positive',
          message: `Auto-generated cheque number: ${store.autoCheque}`,
          icon: 'check_circle',
          position: 'top',
          timeout: 2000,
        })
      }
    } catch (error) {
      console.error('Error selecting bank:', error)
      $q.notify({
        type: 'negative',
        message: `Failed to load booklets for selected bank: ${error.message}`,
        icon: 'error',
        position: 'top',
        timeout: 5000,
      })
    }
  } else {
    // Clear auto-generated values when bank is deselected
    store.autoCheque = null
    store.autoBookletID = null
  }
}

const handleStatusChange = () => {
  // Status filtering is handled by the computed property
  // No additional logic needed as it's reactive
}

const validateAndSave = () => {
  if (store.dialogs.disbursement) {
    const form = store.forms.disbursement
    const hasRequiredFields = form.date && form.bank_id && form.dvNumber && form.payee
    const hasExpenses = store.expenses && store.expenses.length > 0
    const hasValidAmounts = store.expenses.every(
      (expense) => expense.amount && parseFloat(expense.amount) > 0,
    )

    if (!hasRequiredFields) {
      $q.notify({
        type: 'negative',
        message: 'Please fill in all required fields (Date, Bank, DV Number, Payee)',
        icon: 'warning',
        position: 'top',
        timeout: 3000,
      })
      return false
    }

    if (!hasExpenses) {
      $q.notify({
        type: 'negative',
        message: 'Please add at least one expense before saving',
        icon: 'warning',
        position: 'top',
        timeout: 3000,
      })
      return false
    }

    if (!hasValidAmounts) {
      $q.notify({
        type: 'negative',
        message: 'All expenses must have valid amounts greater than 0',
        icon: 'warning',
        position: 'top',
        timeout: 3000,
      })
      return false
    }

    if (store.savingDisbursement) {
      return false // Prevent multiple saves
    }

    return true
  }
  return false
}

const handleEnterKey = (event) => {
  if (event) {
    event.preventDefault()
  }
  validateAndSave()
}

const handleSaveClick = async () => {
  if (!validateAndSave()) {
    return // Validation failed, don't proceed
  }

  try {
    const result = await store.saveDisbursement()
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Disbursement saved successfully!',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000,
      })
      // Refresh the disbursement list after saving
      await store.fetchDisbursements()
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Failed to save disbursement',
        icon: 'error',
        position: 'top',
        timeout: 5000,
      })
    }
  } catch (error) {
    console.error('Error saving disbursement:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'An error occurred while saving disbursement',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

const preloadExpenseAccounts = () => {
  // Preload expense accounts when user hovers over Add button
  if (store.expenseAccounts.length === 0 && !store.expenseAccountsLoading) {
    store.refreshExpenseAccountsWithBalances().catch((error) => {
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
      timeout: 3000,
    })
  } finally {
    addingExpense.value = false
  }
}

const handleSaveExpense = async () => {
  // Validate expense before saving
  const expense = store.forms.expense

  if (!expense.account) {
    $q.notify({
      type: 'negative',
      message: 'Please select an expense account',
      icon: 'warning',
      position: 'top',
      timeout: 3000,
    })
    return
  }

  if (!expense.amount || parseFloat(expense.amount) <= 0) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a valid amount greater than 0',
      icon: 'warning',
      position: 'top',
      timeout: 3000,
    })
    return
  }

  if (parseFloat(expense.amount) > expense.balance) {
    $q.notify({
      type: 'negative',
      message: `Amount cannot exceed available balance of ${formatInputValue(expense.balance)}`,
      icon: 'warning',
      position: 'top',
      timeout: 3000,
    })
    return
  }

  try {
    await store.saveExpense()
    $q.notify({
      type: 'positive',
      message: 'Expense added successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
  } catch (error) {
    console.error('Error saving expense:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to save expense',
      icon: 'error',
      position: 'top',
      timeout: 5000,
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
      timeout: 3000,
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to delete expense',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

const loadDisbursements = async () => {
  loading.value = true
  try {
    // Only refresh disbursements and banks, skip expense accounts for faster refresh
    // The fetchDisbursements method now automatically filters by current fiscal year
    const refreshPromises = [store.fetchDisbursements(), bankStore.fetchBanks()]

    await Promise.all(refreshPromises)

    $q.notify({
      type: 'positive',
      message: `Disbursements for fiscal year ${currentFiscalYear.value} refreshed!`,
      icon: 'refresh',
      position: 'top',
      timeout: 3000,
    })
  } catch (error) {
    console.error('Error refreshing disbursements:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to refresh disbursements',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  } finally {
    loading.value = false
  }
}

// Enhanced refresh with better error handling
const refreshData = async () => {
  try {
    await loadDisbursements()
  } catch (error) {
    console.error('Error refreshing data:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to refresh data. Please try again.',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

// Enhanced dialog management
const handleDialogClose = (dialogName) => {
  if (dialogName === 'disbursement') {
    // Clear all form data when closing disbursement dialog
    store.resetForm('disbursement')
    store.expenses = []
    store.autoCheque = null
    store.autoBookletID = null
  } else if (dialogName === 'expense') {
    // Clear expense form when closing expense dialog
    store.resetForm('expense')
  } else if (dialogName === 'expenseDetail') {
    // Clear expense detail form when closing expense detail dialog
    store.resetForm('expense')
  } else if (dialogName === 'void') {
    // Clear void form when closing void dialog
    store.resetForm('void')
  }
  // } else if (dialogName === 'editRequest') { // COMMENTED OUT FOR FUTURE REUSE
  //   // Close edit request dialog via store method
  //   store.closeEditRequestDialog()
  // }

  store.closeDialog(dialogName)
}

// Open void dialog for treasurer
const handleVoidDisbursement = (row) => {
  store.openVoidDialog(row)
}

// Open edit request dialog for treasurer - COMMENTED OUT FOR FUTURE REUSE
// const handleEditRequest = (row) => {
//   store.openEditRequestDialog(row)
// }

// Submit void request from dialog
const handleSubmitVoidRequest = async () => {
  if (!store.forms.void.remarks || store.forms.void.remarks.trim() === '') {
    $q.notify({
      type: 'negative',
      message: 'Please provide remarks for the void request',
      icon: 'warning',
      position: 'top',
      timeout: 3000,
    })
    return
  }

  try {
    const result = await store.submitVoidRequest()
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Void request submitted successfully!',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000,
      })
      // Refresh data after successful void request
      await refreshData()
    } else {
      $q.notify({
        type: 'negative',
        message: result.message || 'Failed to submit void request',
        icon: 'error',
        position: 'top',
        timeout: 5000,
      })
    }
  } catch (error) {
    console.error('Error submitting void request:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to submit void request',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

// Approver actions - now handled in ViewOrDetails component
// Removed handleApproveVoid and handleRejectVoid methods

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
      timeout: 3000,
    })
  }
}

// Handle view disbursement with loading state
const handleViewDisbursement = async (row) => {
  viewLoading.value[row.id] = true
  try {
    // Check if there are remarks (void request or edit request) first
    if (hasRemarks(row)) {
      // Show remarks dialog first
      openRemarksDialog(row)
    } else {
      // No remarks, directly open ViewOrDetails
      await store.openViewOrDetails(row)
    }
  } catch (error) {
    console.error('Error opening view disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open view disbursement',
      icon: 'error',
      position: 'top',
      timeout: 3000,
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
      timeout: 3000,
    })
  } finally {
    liquidateLoading.value[row.id] = false
  }
}

// Handle manual stale status check
// const handleCheckStaleStatus = async () => {
//   checkingStaleStatus.value = true
//   try {
//     const result = await store.checkStaleStatus()
//     if (result.success) {
//       $q.notify({
//         type: 'positive',
//         message: `Stale status check completed! Updated ${result.data.disbursements_updated} disbursements and ${result.data.cheques_updated} cheques.`,
//         icon: 'check_circle',
//         position: 'top',
//         timeout: 5000,
//       })
//     } else {
//       $q.notify({
//         type: 'negative',
//         message: result.message || 'Failed to check stale status',
//         icon: 'error',
//         position: 'top',
//         timeout: 5000,
//       })
//     }
//   } catch (error) {
//     $q.notify({
//       type: 'negative',
//       message: error.message || 'Failed to check stale status',
//       icon: 'error',
//       position: 'top',
//       timeout: 5000,
//     })
//   } finally {
//     checkingStaleStatus.value = false
//   }
// }

// Remarks dialog methods
const hasRemarks = (row) => {
  return (
    (row.status === 'Void Requested' && row.remarks) ||
    // (row.status === 'Edit Requested' && row.remarks) || // COMMENTED OUT FOR FUTURE REUSE
    (row.status === 'Voided' && row.remarks) ||
    row.rejection_remarks
  )
}

const openRemarksDialog = (row) => {
  selectedRemarksData.value = row
  remarksDialog.value = true
}

const closeRemarksDialog = () => {
  remarksDialog.value = false
  selectedRemarksData.value = null
}

const openViewOrDetailsFromRemarks = async () => {
  if (selectedRemarksData.value && selectedRemarksData.value.id) {
    // Store the data before closing the dialog
    const disbursementData = { ...selectedRemarksData.value }

    // Ensure we have the required fields
    if (!disbursementData.id) {
      $q.notify({
        type: 'negative',
        message: 'Invalid disbursement data',
        icon: 'error',
        position: 'top',
        timeout: 3000,
      })
      return
    }

    // Close remarks dialog first
    closeRemarksDialog()

    // Then open ViewOrDetails with the stored data
    try {
      await store.openViewOrDetails(disbursementData)
    } catch (error) {
      console.error('Error opening view disbursement from remarks:', error)
      $q.notify({
        type: 'negative',
        message: 'Failed to open view disbursement',
        icon: 'error',
        position: 'top',
        timeout: 3000,
      })
    }
  } else {
    $q.notify({
      type: 'negative',
      message: 'No disbursement data available',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
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

/* Status Indicators Container */
.status-indicators-container {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

/* Summary Cards Styling */
.summary-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  background: white;
  border: 2px solid transparent;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Filter Section Styling */
.q-card .q-card-section {
  padding: 16px;
}

.q-item-label {
  font-weight: 500;
  color: #424242;
}

/* Filter Layout Improvements */
.filters-section .row {
  align-items: end;
}

.filters-section .q-item-label {
  margin-bottom: 4px;
  font-size: 0.875rem;
}

.filters-section .q-select,
.filters-section .q-input {
  min-height: 40px;
}

.filters-section .q-btn {
  min-height: 40px;
}

/* Clear All Button Styling */
.clear-all-btn {
  border: 1px solid #f44336;
}

.clear-all-btn:hover {
  background-color: #ffebee;
}

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }

  .status-indicators-container {
    padding: 12px;
  }

  .row.q-col-gutter-md {
    flex-direction: column;
  }

  .col-md-2,
  .col-sm-4,
  .col-xs-6 {
    margin-bottom: 8px;
  }

  .summary-card .q-card-section {
    padding: 12px;
  }

  .text-h4 {
    font-size: 1.5rem;
  }
}

/* Remarks dialog styling */
.remarks-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.5;
}

.remarks-content .text-body1 {
  margin: 0;
}
</style>
