<template>
  <q-dialog v-model="store.dialogs.viewOrDetails">
    <q-card style="min-width: 1100px">
      <!-- Debug data trigger -->
      <div v-show="false">{{ debugData }}</div>
      <div class="disbursement-tran q-pb-none">
        <q-card-section class="q-pb-xs">
          <div class="row">
            <div class="text-h6">Disbursement #{{ store.currentLiquidation.dvNumber }}</div>
            <q-space />
            <div>
              <q-btn
                flat
                dense
                icon="picture_as_pdf"
                color="red"
                @click="exportToPDF"
                title="Export to PDF"
                :loading="exportingPDF"
              />
            </div>
          </div>
          <div class="text-caption text-grey-6 q-mt-none">
            View liquidation details and official receipt information
          </div>
        </q-card-section>

        <q-card-section class="q-pb-xs">
          <div class="row q-col-gutter-xs">
            <!-- Date Field -->
            <div class="col-md-4 col-sm-6 q-mb-xs">
              <div class="text-caption text-grey text-weight-bold">Date</div>
              <div class="text-body1 text-weight-medium">
                {{ store.currentLiquidation.date }}
              </div>
            </div>

            <!-- DV Number Field -->
            <div class="col-md-4 col-sm-6 q-mb-xs">
              <div class="text-caption text-grey text-weight-bold">DV Number</div>
              <div class="row items-center">
                <div class="text-body1 text-weight-medium">
                  {{ store.currentLiquidation.dvNumber }}
                </div>
                <q-btn
                  flat
                  dense
                  round
                  icon="content_copy"
                  class="q-ml-sm"
                  @click="copyToClipboard(store.currentLiquidation.dvNumber)"
                />
              </div>
            </div>

            <!-- DV Amount Field -->
            <div class="col-md-4 col-sm-6 q-mb-xs">
              <div class="text-caption text-grey text-weight-bold">DV Amount</div>
              <div class="text-body1 text-weight-medium">
                ₱ {{ formatCurrency(store.currentLiquidation.dvAmount || 0) }}
              </div>
            </div>

            <!-- Net Amount Field -->
            <div class="col-md-4 col-sm-6 q-mb-xs" v-if="!isBirOrSk">
              <div class="text-caption text-grey text-weight-bold">Net Amount</div>
              <div class="text-body1 text-weight-medium">
                ₱ {{ formatCurrency(store.currentLiquidation.netAmount || 0) }}
              </div>
            </div>

            <!-- Amount to Return Field -->
            <div class="col-md-4 col-sm-6 q-mb-xs" v-if="!isBirOrSk">
              <div class="text-caption text-grey text-weight-bold">
                Amount to Return to Appropriation
              </div>
              <div class="text-body1 text-weight-medium">
                ₱ {{ formatCurrency(totalReturnAmount) }}
              </div>
            </div>
            <!-- Actual Expense Field -->
            <div class="col-md-4 col-sm-6 q-mb-xs" v-if="!isBirOrSk">
              <div class="text-caption text-grey text-weight-bold">Actual Expense</div>
              <div class="text-body1 text-weight-medium">
                ₱ {{ formatCurrency(totalActualExpense) }}
              </div>
            </div>
            <!-- Funds -->
            <!-- <div class="col-md-4 col-sm-6 q-mb-xs" v-if="!isBirOrSk">
              <div class="text-caption text-grey text-weight-bold">Funds</div>
              <div class="text-body1 text-weight-medium">
                {{ store.currentLiquidation.funds || '—' }}
              </div>
            </div> -->
            <!-- Taxpayer Type -->
            <div class="col-md-4 col-sm-6 q-mb-xs" v-if="!isBirOrSk">
              <div class="text-caption text-grey text-weight-bold">Payee</div>
              <div class="text-body1 text-weight-medium">
                {{ store.currentLiquidation.payee || '—' }}
              </div>
            </div>

            <!-- Status Field -->
            <div class="col-md-4 col-sm-12 q-mb-xs" v-if="!isBirOrSk">
              <div class="text-caption text-grey text-weight-bold">Status</div>
              <div
                class="text-body1 text-weight-medium"
                :class="{
                  'text-blue': store.currentLiquidation.status === 'Unliquidated',
                  'text-green': store.currentLiquidation.status === 'Liquidated',
                }"
              >
                {{ store.currentLiquidation.status }}
              </div>
            </div>

            <!-- Remarks Field -->
            <div class="col-md-8 col-sm-12 q-mb-xs" v-if="!isBirOrSk">
              <div class="text-caption text-grey text-weight-bold">Remarks</div>
              <div class="text-body1 text-weight-medium">
                {{ store.currentLiquidation.remarks || '—' }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-section
          v-if="!isBirOrSk && store.currentLiquidation?.expenses?.length > 0"
          class="q-pt-sm q-pb-none"
        >
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1"><strong>Expense Accounts</strong></div>
          </div>

          <div class="expense-acc-block">
            <table class="expense-inline-table full-width">
              <thead>
                <tr>
                  <th style="width: 36px">#</th>
                  <th>Acc</th>
                  <th>Particulars</th>
                  <th style="text-align: right; width: 140px">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!liquidationExpenses || liquidationExpenses.length === 0">
                  <td colspan="8" class="text-center text-grey-5 text-caption q-pa-md q-gutter-sm">
                    <span> No expense accounts added.</span>
                  </td>
                </tr>
                <tr
                  v-for="(row, idx) in liquidationExpenses"
                  :key="row.id"
                  class="text-weight-medium text-grey-8"
                  style="font-size: 12px"
                >
                  <td class="text-grey-6">{{ idx + 1 }}</td>
                  <td>
                    <div class="text-weight-medium text-grey-8" style="font-size: 12px">
                      {{ row.accountName }}
                    </div>
                  </td>
                  <td>
                    <div class="text-weight-medium text-grey-8" style="font-size: 12px">
                      {{ row.particular || '—' }}
                    </div>
                  </td>
                  <td style="text-align: right" class="text-weight-medium">
                    ₱{{
                      (Number(row.amount) || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })
                    }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Footer subtotal -->
            <div
              v-if="liquidationExpenses && liquidationExpenses.length > 0"
              class="expense-acc-footer row items-center justify-end q-px-md q-py-xs"
            >
              <span class="text-caption text-grey-8">
                Total Gross Amount:
                <span class="text-grey-10 q-ml-sm" style="font-size: 14px">
                  ₱{{ totalGrossAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </span>
              </span>
            </div>
          </div>
        </q-card-section>

        <q-card-section v-if="!isBirOrSk">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1"><strong>Deductions</strong></div>
          </div>
          <div class="expense-acc-block">
            <table class="expense-inline-table full-width">
              <thead>
                <tr>
                  <th style="width: 36px">#</th>
                  <th>Deduction Type</th>
                  <th>Tax Type</th>
                  <th>Description</th>
                  <th>Gross VAT INC.</th>
                  <th>Percent</th>
                  <th style="text-align: right; width: 140px">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-if="
                    !store.currentLiquidation?.deductions ||
                    store.currentLiquidation.deductions.length === 0
                  "
                >
                  <td colspan="8" class="text-center text-grey-5 text-caption q-pa-md">
                    No deductions added.
                  </td>
                </tr>
                <tr
                  v-for="(ded, idx) in store.currentLiquidation?.deductions || []"
                  :key="ded.id"
                  class="text-weight-medium text-grey-8"
                  style="font-size: 12px"
                >
                  <td class="text-grey-6">{{ idx + 1 }}</td>
                  <td>{{ ded.deductionTypeName || '—' }}</td>
                  <td>{{ ded.taxTypeName || '—' }}</td>
                  <td>{{ ded.description || '—' }}</td>
                  <td style="text-align: right">
                    ₱{{
                      (Number(ded.gross_vat_inc) || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })
                    }}
                  </td>
                  <td style="text-align: right">
                    {{ ded.percent != null ? `${ded.percent}%` : '—' }}
                  </td>
                  <td style="text-align: right" class="text-weight-medium">
                    ₱{{
                      (Number(ded.amount) || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })
                    }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Footer subtotal -->
            <div
              v-if="store.forms.expense.deductions && store.forms.expense.deductions.length > 0"
              class="expense-acc-footer row items-center justify-end q-px-md q-py-xs"
            >
              <span class="text-caption text-red-8">
                Total Deductions:
                <span class="text-grey-10 q-ml-sm" style="font-size: 14px; color: #e53935">
                  ₱{{ totalDeductionAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                </span>
              </span>
            </div>
          </div>
        </q-card-section>

        <!-- Bank Cheques Table Section -->
        <q-card-section class="q-pb-xs">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1"><strong>Bank Cheques</strong></div>
          </div>
          <div class="expense-acc-block">
            <table class="expense-inline-table full-width">
              <thead>
                <tr v-if="isBirOrSk">
                  <th style="width: 36px">#</th>
                  <th>Bank</th>
                  <th>Cheque No.</th>
                  <th v-if="isBir">Particular</th>
                  <!-- <th>Status</th> -->
                  <th style="text-align: right; width: 140px">Amount</th>
                </tr>
                <tr v-else>
                  <th>Bank</th>
                  <th>Cheque Number</th>
                  <th>Cheque Date</th>
                  <!-- <th>Status</th> -->
                  <th style="text-align: right; width: 140px">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="bankChequeRows.length === 0">
                  <td
                    :colspan="isBir ? 6 : isBirOrSk ? 5 : 4"
                    class="text-center text-grey-5 text-caption q-pa-md"
                  >
                    No bank cheques added yet.
                  </td>
                </tr>
                <template v-if="isBirOrSk">
                  <tr
                    v-for="(row, idx) in bankChequeRows"
                    :key="row.key"
                    class="text-weight-medium text-grey-8"
                    style="font-size: 12px"
                  >
                    <td class="text-grey-6">{{ idx + 1 }}</td>
                    <td>{{ row.bank || '—' }}</td>
                    <td>{{ row.chequeNumber || '—' }}</td>
                    <td v-if="isBir">{{ row.particular || '—' }}</td>
                    <!-- <td>{{ row.bankStatus || '—' }}</td> -->
                    <td style="text-align: right" class="text-weight-medium">
                      ₱{{ row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr
                    v-for="row in bankChequeRows"
                    :key="row.key"
                    class="text-weight-medium text-grey-8"
                    style="font-size: 12px"
                  >
                    <td>{{ row.bank || '—' }}</td>
                    <td>{{ row.chequeNumber || '—' }}</td>
                    <td>{{ row.chequeDate || '—' }}</td>
                    <!-- <td>{{ row.bankStatus || '—' }}</td> -->
                    <td style="text-align: right" class="text-weight-medium">
                      ₱{{ row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </q-card-section>
      </div>

      <!-- Reimbursement Details Section -->
      <div v-if="store.currentLiquidation?.reimbursement" class="reimbursement-tran q-pb-xs">
        <q-card-section>
          <div class="text-h6">Reimbursement Transaction Details</div>
          <div class="text-caption text-grey-6 q-mt-sm">
            Reference: Disbursement No. {{ store.currentLiquidation.reimbursement.ref_dv_number }}
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- Date Field -->
            <div class="col-md-4 col-sm-6 q-mb-md">
              <div class="text-caption text-grey">Date</div>
              <div class="text-body1 text-weight-medium">
                {{ store.currentLiquidation.reimbursement.date }}
              </div>
            </div>

            <!-- DV Number Field -->
            <div class="col-md-4 col-sm-6 q-mb-md">
              <div class="text-caption text-grey">DV Number</div>
              <div class="row items-center">
                <div class="text-body1 text-weight-medium">
                  {{ store.currentLiquidation.reimbursement.dv_number }}
                </div>
                <q-btn
                  flat
                  dense
                  round
                  icon="content_copy"
                  class="q-ml-sm"
                  @click="copyToClipboard(store.currentLiquidation.reimbursement.dv_number)"
                />
              </div>
            </div>

            <!-- DV Amount Field -->
            <div class="col-md-4 col-sm-6 q-mb-md">
              <div class="text-caption text-grey">DV Amount</div>
              <div class="text-body1 text-weight-medium">
                ₱ {{ formatCurrency(store.currentLiquidation.reimbursement.dv_amount || 0) }}
              </div>
            </div>

            <!-- Bank Field -->
            <div class="col-md-4 col-sm-6 q-mb-md">
              <div class="text-caption text-grey">Bank</div>
              <div class="text-body1 text-weight-medium">
                {{ store.currentLiquidation.reimbursement.bank_name }}
              </div>
            </div>

            <!-- Cheque Number Field -->
            <div class="col-md-4 col-sm-6 q-mb-md">
              <div class="text-caption text-grey">Cheque Number</div>
              <div class="text-body1 text-weight-medium">
                {{ store.currentLiquidation.reimbursement.cheque_number }}
              </div>
            </div>

            <!-- Status Field -->
            <div class="col-md-4 col-sm-12 q-mb-md">
              <div class="text-caption text-grey">Status</div>
              <div class="text-body1 text-weight-medium">
                {{ store.currentLiquidation.reimbursement.status }}
              </div>
            </div>
          </div>
        </q-card-section>

        <!-- Reimbursement Expense Accounts Section -->
        <q-card-section v-if="store.currentLiquidation?.reimbursement?.expenses?.length > 0">
          <div class="text-subtitle1 q-mb-md">
            <strong>Reimbursement Expense Accounts:</strong>
          </div>

          <!-- Reimbursement Expense Accounts Table -->
          <q-table
            :rows="store.currentLiquidation.reimbursement.expenses"
            :columns="expenseAccountColumns"
            row-key="id"
            :pagination="{ rowsPerPage: 5 }"
            flat
            bordered
          >
            <template v-slot:body-cell-account="props">
              <q-td :props="props">
                <div class="expense-account-hierarchy">
                  {{
                    props.row.accountName ||
                    props.row.account_name ||
                    `${
                      props.row.account || ''
                    }${props.row.expenseType ? ` > ${props.row.expenseType}` : ''}${
                      props.row.expenseItem
                        ? ` >
                  ${props.row.expenseItem}`
                        : ''
                    }${props.row.expenseSubItem ? ` > ${props.row.expenseSubItem}` : ''}`
                  }}
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-amount="props">
              <q-td :props="props">
                {{ formatCurrency(props.value) }}
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </div>

      <!-- Liquidation Details Section -->
      <q-card-section v-if="!isBirOrSk">
        <div class="row items-center q-mb-md">
          <div class="text-subtitle1">
            <strong>Liquidation Details</strong>
            <span class="text-caption text-grey-6 q-ml-sm">
              ({{ orDetailsCount }} record{{ orDetailsCount !== 1 ? 's' : '' }})
            </span>
          </div>
          <q-space />
          <q-btn
            flat
            dense
            icon="refresh"
            color="primary"
            @click="reloadOrDetails"
            title="Reload OR Details"
          />
        </div>

        <!-- OR Details Table -->
        <q-table
          :rows="store.currentLiquidation?.orDetails || []"
          :columns="orDetailsColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
          flat
          bordered
          :loading="loadingOrDetails"
        >
          <template v-slot:body-cell-orPhotoUrl="props">
            <q-td :props="props">
              <q-img
                v-if="props.value"
                :src="props.value"
                style="max-width: 100px; max-height: 100px"
                class="cursor-pointer"
                @click="viewImage(props.value)"
              />
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
        <div
          v-if="isApprover && store.currentLiquidation?.status === 'Void Requested'"
          class="q-mr-auto void-action-buttons"
        >
          <q-btn
            unelevated
            label="Approve Void"
            color="green"
            icon="check_circle"
            @click="handleApproveVoid"
            :loading="voidActionLoading"
            class="void-approve-btn"
          />
          <q-btn
            unelevated
            label="Reject Void"
            color="red"
            icon="cancel"
            @click="handleRejectVoid"
            :loading="voidActionLoading"
            class="void-reject-btn"
          />
        </div>
        <div
          v-if="isApprover && store.currentLiquidation?.status === 'Edit Requested'"
          class="q-mr-auto edit-action-buttons"
        >
          <q-btn
            unelevated
            label="Approve Edit"
            color="green"
            icon="check_circle"
            @click="handleApproveEdit"
            :loading="editActionLoading"
            class="edit-approve-btn"
          />
          <q-btn
            unelevated
            label="Reject Edit"
            color="red"
            icon="cancel"
            @click="handleRejectEdit"
            :loading="editActionLoading"
            class="edit-reject-btn"
          />
        </div>

        <q-btn
          flat
          label="Close"
          class="modal-cancel-btn"
          @click="store.closeDialog('viewOrDetails')"
        />
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
const exportingPDF = ref(false)

const isBirOrSk = computed(() => {
  const t = store.currentLiquidation?.type
  return t === 'bir' || t === 'sk' || t === 'provincial_aid'
})

const isBir = computed(() => store.currentLiquidation?.type === 'bir')

// Table columns for OR Details - matching OrDetailsDialog structure
const orDetailsColumns = [
  {
    name: 'orDate',
    label: 'OR Date',
    field: 'orDate',
    align: 'left',
    sortable: true,
  },
  {
    name: 'orNumber',
    label: 'OR Number',
    field: 'orNumber',
    align: 'left',
    sortable: true,
  },
  {
    name: 'orAmount',
    label: 'OR Amount',
    field: 'orAmount',
    align: 'right',
    sortable: true,
    format: (val) => formatCurrency(val),
  },
  {
    name: 'orPhotoUrl',
    label: 'OR Image',
    field: 'orPhotoUrl',
    align: 'center',
    sortable: false,
  },
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
  // If this disbursement has a reimbursement, we need to show the original liquidation values
  // The actual expense should be the same as the DV amount (fully liquidated)
  if (store.currentLiquidation?.reimbursement) {
    const dvAmount = parseFloat(store.currentLiquidation.dvAmount) || 0
    return dvAmount
  }

  // For disbursements without reimbursement, calculate from OR details
  if (!store.currentLiquidation?.orDetails || store.currentLiquidation.orDetails.length === 0) {
    return 0
  }

  const total = store.currentLiquidation.orDetails.reduce(
    (sum, or) => sum + (parseFloat(or.orAmount) || 0),
    0,
  )

  return total
})

const totalReturnAmount = computed(() => {
  // Always use the DV amount from the main disbursement, not from reimbursement
  if (!store.currentLiquidation?.dvAmount) return 0
  const returnAmount = store.currentLiquidation.dvAmount - totalActualExpense.value
  // Prevent negative return amounts - if over-liquidation occurs, show 0
  const finalReturnAmount = Math.max(0, returnAmount)

  return finalReturnAmount
})

// const totalGrossAmount = computed(() => {
//   return (store.currentLiquidation?.expenses || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
// })

const totalDeductionAmount = computed(() => {
  return (store.currentLiquidation?.deductions || []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0,
  )
})

const liquidationExpenses = computed(() => store.currentLiquidation?.expenses || [])

const totalGrossAmount = computed(() => {
  return liquidationExpenses.value.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
})

// const bankChequeTotal = computed(() => {
//   return (store.bankCheques || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
// })

const orDetailsCount = computed(() => {
  return store.currentLiquidation?.orDetails?.length || 0
})

const bankChequeRows = computed(() => {
  return (store.currentLiquidation?.bank_cheques || []).map((row, idx) => ({
    id: row.id,
    key: `${row.id || idx}-${row.cheque_number || idx}`,
    bank: row.bankName || row.bank_name || row.bank || '',
    chequeNumber: row.cheque_number || row.chequeNumber || '',
    chequeDate: row.cheque_date || row.chequeDate || '',
    bank_status: row.bank_status || row.bankStatus || '',
    bankStatus: row.bank_status || row.bankStatus || '',
    particular: row.particular || row.particulars || row.remark || row.remarks || '',
    amount: Number(row.amount) || 0,
  }))
})
// Debug computed property to log data structure
const debugData = computed(() => {
  return store.currentLiquidation
})

// Check if user is an approver (Captain/SK Chairperson)
const isApprover = computed(() => {
  const userPosition = authStore.user?.position_name?.toLowerCase().trim() || ''
  return (
    userPosition.includes('captain') ||
    userPosition.includes('chairperson') ||
    userPosition.includes('barangay captain') ||
    userPosition.includes('sk chairperson')
  )
})

// Method to manually reload OR details if needed
const reloadOrDetails = async () => {
  if (store.currentLiquidation?.id) {
    await store.openViewOrDetails(store.currentLiquidation)
  }
}

// Export to PDF function
const exportToPDF = async () => {
  exportingPDF.value = true
  const html2canvas = (await import('html2canvas')).default
  const jsPDF = (await import('jspdf')).default

  try {
    const element = document.querySelector('.q-dialog .q-card')

    if (!element) {
      $q.notify({
        type: 'negative',
        message: 'No content found to export!',
        icon: 'error',
        position: 'top',
        timeout: 3000,
      })
      return
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    // Create PDF in portrait orientation with A4 dimensions
    const pdf = new jsPDF('p', 'mm', 'a4') // 'p' for portrait

    const pageWidth = pdf.internal.pageSize.getWidth() // 210mm (A4 width)
    const pageHeight = pdf.internal.pageSize.getHeight() // 297mm (A4 height)
    const imgWidth = pageWidth - 20 // Add margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 10 // Start with top margin

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - 20 // Account for margins

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - 20
    }

    // Generate filename with DV number and date
    const dvNumber = store.currentLiquidation?.dvNumber || 'Unknown'
    const date = store.currentLiquidation?.date || new Date().toISOString().split('T')[0]
    const filename = `Disbursement_${dvNumber}_${date}.pdf`

    pdf.save(filename)

    $q.notify({
      type: 'positive',
      message: 'Disbursement details exported to PDF successfully!',
      icon: 'picture_as_pdf',
      position: 'top',
      timeout: 3000,
    })
  } catch (error) {
    console.error('Error exporting to PDF:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to export PDF',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  } finally {
    exportingPDF.value = false
  }
}

const viewImage = (imageUrl) => {
  $q.dialog({
    component: 'q-img',
    componentProps: {
      src: imageUrl,
      style: 'max-width: 80vw; max-height: 80vh',
    },
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
.disbursement-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

/*  Type navigation cards  */
.type-nav-card {
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: white;
}

.type-nav-card:hover {
  border-color: #bdbdbd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

/* Regular — active = primary green */
.type-nav-active {
  background: var(--q-primary) !important;
  border-color: var(--q-primary) !important;
  color: white !important;
}

.type-nav-active .text-subtitle2,
.type-nav-active .text-caption,
.type-nav-active .type-count {
  color: white !important;
}

/* BIR — active = deep-orange */
.type-nav-active-bir {
  /* background: var(--q-deep-orange) !important;
  border-color: var(--q-deep-orange) !important; */
  background: var(--q-primary) !important;
  border-color: var(--q-primary) !important;
  color: white !important;
}

/* SK — active = blue-10 */
.type-nav-active-sk {
  /* background: var(--q-blue-10) !important;
  border-color: var(--q-blue-10) !important; */
  background: var(--q-primary) !important;
  border-color: var(--q-primary) !important;
  color: white !important;
}

.type-count {
  opacity: 0.85;
}

/* Small + button in the top-right of active card */
.type-nav-add-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
}

/* Tabs inside dialog */
.tab-btn {
  color: rgba(0, 0, 0, 0.6);
  font-size: 13px;
}

.tab-btn:hover {
  background: transparent !important;
}

.tab-active {
  color: #16a34a !important;
  border-bottom: 2px solid #16a34a;
}

/* Regular: strict 2-column grid, always 2 per row */
.action-grid-regular {
  display: grid;
  grid-template-columns: repeat(2, 32px);
  gap: 4px;
  width: 72px;
}

/* BIR/SK: single horizontal row, no wrapping */
.action-row-flat {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 4px;
  align-items: center;
}

.remarks-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.5;
}

.expense-acc-block {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.expense-acc-header {
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  min-height: 36px;
}

.expense-acc-footer {
  background: #fafafa;
  border-top: 1px solid #e0e0e0;
  min-height: 34px;
}

.cheque-panel {
  background: #f1f8e9;
  border-top: 1px solid #c5e1a5;
  padding-top: 12px;
}

.expense-inline-table {
  border-collapse: collapse;
  font-size: 13px;
}

.expense-inline-table th {
  background: #fafafa;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #757575;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e0e0e0;
  text-align: left;
}

.expense-inline-table td {
  padding: 7px 10px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.expense-inline-table tr:last-child td {
  border-bottom: none;
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .q-card {
    min-width: 95vw !important;
  }

  .q-table {
    font-size: 12px;
  }

  .button-group .q-btn {
    min-width: 28px;
    padding: 4px;
  }

  .expense-account-hierarchy {
    font-size: 11px;
    max-width: 250px;
  }

  .expense-acc-block {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
  }

  .expense-acc-header {
    background: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
    min-height: 36px;
  }

  .expense-acc-footer {
    background: #fafafa;
    border-top: 1px solid #e0e0e0;
    min-height: 34px;
  }

  .expense-inline-table {
    border-collapse: collapse;
    font-size: 13px;
  }

  .expense-inline-table th {
    background: #fafafa;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 600;
    color: #757575;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid #e0e0e0;
    text-align: left;
  }

  .expense-inline-table td {
    padding: 7px 10px;
    border-bottom: 1px solid #f0f0f0;
    color: #333;
  }

  .expense-inline-table tr:last-child td {
    border-bottom: none;
  }

  :deep(.q-table__container) {
    overflow-x: auto;
    overflow-y: auto;
    max-height: 300px;
  }

  :deep(.q-table__middle) {
    overflow: unset;
  }

  :deep(.q-table thead tr th) {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #fafafa;
  }
}
</style>
