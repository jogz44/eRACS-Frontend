<template>
  <q-dialog v-model="model" maximized transition-show="slide-up" transition-hide="slide-down">
    <q-layout view="lHh Lpr lFf" class="voucher-layout">
      <!-- Header -->
      <q-header elevated class="bg-white text-dark modal-header">
        <q-toolbar class="q-px-md">
          <q-btn
            flat
            icon="menu"
            @click="voucherDrawerOpen = !voucherDrawerOpen"
            class="q-mr-md"
            :color="voucherDrawerOpen ? '#187C19' : '#666'"
            size="md"
          >
            <q-tooltip>Toggle Settings Panel</q-tooltip>
          </q-btn>

          <q-toolbar-title class="text-h6 text-weight-medium" style="color: #187c19">
            Disbursement Voucher
          </q-toolbar-title>

          <!-- <div class="text-caption text-grey-7 q-mr-md">{{ voucherData.dvNumber || '' }}</div> -->

          <q-space />

          <div class="q-gutter-sm">
            <q-btn
              outline
              icon="picture_as_pdf"
              label="Export PDF"
              color="green"
              :loading="exporting"
              @click="exportPdf"
              size="13px"
              no-caps
            />
            <!-- <q-btn
              unelevated
              icon="print"
              label="Print"
              color="green"
              @click="printVoucher"
              size="sm"
              no-caps
            /> -->
            <q-btn flat icon="close" color="grey" v-close-popup>
              <q-tooltip>Close</q-tooltip>
            </q-btn>
          </div>
        </q-toolbar>
      </q-header>

      <!-- Left Drawer -->
      <q-drawer
        v-model="voucherDrawerOpen"
        side="left"
        bordered
        :width="350"
        :breakpoint="768"
        :show-if-above="false"
        class="bg-grey-1 voucher-drawer"
      >
        <q-scroll-area style="height: 100%">
          <div class="q-pa-lg">
            <!-- Drawer Header -->
            <div class="q-mb-lg drawer-header">
              <div class="text-h6 q-mb-sm" style="color: #187c19">
                <q-icon name="edit" class="q-mr-sm" />
                Voucher Setup
              </div>
              <div class="text-caption" style="color: #666">
                Configure voucher signatories and settings
              </div>
            </div>

            <!-- Voucher Info -->
            <q-card flat bordered class="q-mb-md info-card">
              <q-card-section class="q-pb-sm">
                <div class="text-subtitle2 text-weight-medium q-mb-sm" style="color: #187c19">
                  <q-icon name="info" class="q-mr-xs" />
                  Voucher Information
                </div>
                <div
                  v-for="item in [
                    { label: 'DV No.', value: voucherData.dvNumber },
                    { label: 'Payee', value: voucherData.payee },
                    { label: 'Date', value: voucherData.date },
                  ]"
                  :key="item.label"
                  class="row justify-between q-py-xs"
                  style="font-size: 13px"
                >
                  <span style="color: #666; font-weight: 500">{{ item.label }}:</span>
                  <span
                    style="color: #333; text-align: right; max-width: 60%; word-break: break-word"
                    >{{ item.value }}</span
                  >
                </div>
              </q-card-section>
            </q-card>

            <!-- Signatories -->
            <q-card flat bordered class="q-mb-sm">
              <q-card-section>
                <div class="text-subtitle2 text-weight-medium q-mb-md" style="color: #187c19">
                  <q-icon name="people" class="q-mr-xs" />
                  Signatories
                </div>

                <div
                  v-for="(signatory, index) in signatories"
                  :key="signatory.key"
                  class="q-mb-sm signatory-group"
                  style="border-left: 3px solid #69b31e; padding-left: 12px"
                >
                  <div
                    class="row items-center q-mb-sm"
                    style="font-size: 13px; color: #444; font-weight: 500"
                  >
                    <q-icon name="verified_user" size="sm" color="green" class="q-mr-xs" />
                    {{
                      [
                        'A.) Certified (Appropriation)',
                        'B.) Certified (Funds)',
                        'C.) Approved for Payment',
                      ][index]
                    }}
                  </div>
                  <q-input
                    outlined
                    dense
                    v-model="signatory.name"
                    :label="signatory.nameLabel"
                    class="q-mb-sm"
                    clearable
                  />
                  <q-input
                    outlined
                    dense
                    v-model="signatory.title"
                    :label="signatory.titleLabel"
                    clearable
                  />
                </div>
              </q-card-section>
            </q-card>

            <!-- Quick Actions -->
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle2 text-weight-medium q-mb-md" style="color: #187c19">
                  <q-icon name="flash_on" class="q-mr-xs" />
                  Quick Actions
                </div>
                <div class="q-gutter-sm">
                  <q-btn
                    outline
                    size="sm"
                    icon="refresh"
                    label="Reset Form"
                    color="green"
                    class="full-width"
                    @click="
                      signatories.forEach((s) => {
                        s.name = ''
                        s.title = ''
                      })
                    "
                  />
                  <q-btn
                    outline
                    size="sm"
                    icon="save"
                    label="Save as Template"
                    color="green"
                    class="full-width"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-scroll-area>
      </q-drawer>

      <!-- Main Content -->
      <q-page-container style="background: #f5f5f5">
        <div class="q-pa-md" style="max-width: 1000px; margin: 0 auto">
          <q-card class="print-modal">
            <q-card-section class="preview-wrap">
              <div ref="voucherRef" class="voucher-page">
                <div class="voucher-header">
                  <div>Republic of the Philippines</div>
                  <div>Province of Davao del Norte</div>
                  <div class="city">CITY OF TAGUM</div>
                  <div class="office">OFFICE OF THE PUNONG BARANGAY {{ barangayName }}</div>
                </div>

                <div class="voucher-title-row">
                  <div class="voucher-title">D I S B U R S E M E N T&nbsp;&nbsp; V O U C H E R</div>
                  <div class="voucher-meta">
                    <div>
                      <strong>DV NO.:</strong>
                      <span class="meta-value red">{{ voucherData.dvNumber }}</span>
                    </div>
                  </div>
                </div>

                <div class="voucher-info-row">
                  <div class="payee"><strong>PAYEE:</strong> {{ voucherData.payee }}</div>
                  <div class="voucher-meta">
                    <div>
                      <strong>DV DATE:</strong> <span class="q-ml-sm">{{ voucherData.date }}</span>
                    </div>
                    <div>
                      <strong>TIN:</strong> <span class="q-ml-sm">{{ voucherData.tin }}</span>
                    </div>
                    <div>
                      <strong>FUND:</strong> <span class="q-ml-sm">{{ voucherData.fund }}</span>
                    </div>
                  </div>
                </div>

                <table class="voucher-table main-table">
                  <thead>
                    <tr style="border-top: 1px solid #000">
                      <th class="particulars-col">PARTICULARS</th>
                      <th class="amount-col">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="particular-amount">
                      <td class="particulars-row">
                        <div class="particulars">
                          <div v-for="item in voucherData.particulars" :key="item">{{ item }}</div>
                        </div>

                        <div class="deductions">
                          <div
                            v-for="deduction in voucherData.deductions"
                            :key="deduction.label"
                            class="deduction-line"
                          >
                            <span>{{ deduction.label }}</span>
                            <span>{{ formatCurrency(deduction.amount) }}</span>
                          </div>
                          <div class="deduction-total">
                            <span>TOTAL DEDUCTION:</span>
                            <span>{{ formatCurrency(voucherData.totalDeduction) }}</span>
                          </div>
                        </div>

                        <div class="account-block">
                          <div>ACCOUNT:</div>
                          <strong>{{ voucherData.account }}</strong>
                        </div>
                      </td>
                      <td class="amount top-amount">
                        {{ formatCurrency(voucherData.grossAmount) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr style="border-bottom: 2px solid #000; border-top: 1px solid #000">
                      <td class="amount-due-label">AMOUNT DUE:</td>
                      <td class="amount">{{ formatCurrency(voucherData.netAmount) }}</td>
                    </tr>
                  </tfoot>
                </table>

                <table class="voucher-table certification-table">
                  <tbody>
                    <tr>
                      <td style="border-right: 1px solid #000">
                        <strong>A.)</strong> Certified as to existence of appropriation for
                        obligation.
                        <hr style="height: 4px; color: white; border-color: #f5f5f5" />
                        <div class="signature">{{ signatories[0].name }}</div>
                        <div class="signature-title">{{ signatories[0].title }}</div>
                      </td>
                      <td style="border-right: 1px solid #000">
                        <strong>B.)</strong> Certified as to availability of funds for the purpose
                        and completeness and propriety of supporting documents.
                        <div class="signature">{{ signatories[1].name }}</div>
                        <div class="signature-title">{{ signatories[1].title }}</div>
                      </td>
                      <td>
                        <strong>C.)</strong> Certified as to the validity, propriety and legality of
                        claim and approved for payment.
                        <div class="signature">{{ signatories[2].name }}</div>
                        <div class="signature-title">{{ signatories[2].title }}</div>
                      </td>
                    </tr>
                    <tr class="date-row">
                      <td style="border-right: 1px solid #000"><strong>DATE:</strong></td>
                      <td style="border-right: 1px solid #000"><strong>DATE:</strong></td>
                      <td><strong>DATE:</strong></td>
                    </tr>
                  </tbody>
                </table>

                <table class="voucher-table payment-table">
                  <tbody>
                    <tr>
                      <td class="payment-left">
                        <strong>D.) Received Payment</strong>
                        <div class="payee-signature">{{ voucherData.payee }}</div>
                        <div class="signature-line"></div>
                        <div class="signature-title">Signature over Printed Name</div>
                      </td>
                      <td class="payment-right">
                        <div class="payment-field">
                          <strong>Cheque Date:</strong><span>{{ voucherData.chequeDate }}</span>
                        </div>
                        <div class="payment-field">
                          <strong>Cheque No.:</strong
                          ><span>{{ voucherData.chequeNumbersDisplay }}</span>
                        </div>
                        <div class="payment-field">
                          <strong>Bank Name:</strong><span>{{ voucherData.bankNamesDisplay }}</span>
                        </div>
                        <div class="payment-field">
                          <strong>O.R. No.:</strong><span>{{ voucherData.orNumber }}</span>
                        </div>
                      </td>
                      <!-- <td
                        class="payment-right" >
                        <div class="payment-field">
                          <strong>Cheque Date:</strong><span>{{ voucherData.chequeDate }}</span>
                        </div>
                        <div class="payment-field">
                          <strong>Cheque No.:</strong><span>{{ voucherData.chequeNumber }}</span>
                        </div>
                        <div class="payment-field">
                          <strong>Bank Name:</strong><span>{{ voucherData.bankName }}</span>
                        </div>
                        <div class="payment-field">
                          <strong>O.R. No.:</strong><span>{{ voucherData.orNumber }}</span>
                        </div>
                      </td> -->
                    </tr>
                  </tbody>
                </table>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-page-container>
    </q-layout>
  </q-dialog>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { usePayeeStore } from 'stores/payeeStore'

const model = defineModel({ type: Boolean, default: false })
const props = defineProps({
  disbursement: {
    type: Object,
    default: null,
  },
})

const $q = useQuasar()
const authStore = useAuthStore()
const payeeStore = usePayeeStore()
const voucherRef = ref(null)
const exporting = ref(false)
const voucherDrawerOpen = ref(true)

//TEMPORARY: only change when the backend passes/return the right data value
const signatories = reactive([
  {
    key: 'appropriation',
    nameLabel: 'Chairman Comm. On Appropriation',
    titleLabel: 'Title',
    name: '',
    title: 'Chairman Comm. On Appropriation',
  },
  {
    key: 'treasurer',
    nameLabel: 'Barangay Treasurer',
    titleLabel: 'Title',
    name: '',
    title: 'Barangay Treasurer',
  },
  {
    key: 'punong',
    nameLabel: 'Punong Barangay',
    titleLabel: 'Title',
    name: '',
    title: 'Punong Barangay',
  },
])

const asArray = (value) => (Array.isArray(value) ? value : [])
const asNumber = (value) => Number(String(value ?? '').replace(/[^0-9.-]/g, '')) || 0
const formatCurrency = (value) =>
  asNumber(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const firstPresent = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') || ''
const formatDvNumber = (value) => String(value || '').replace(/\bDV[-\s]*/gi, '')
const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
const registeredPayee = (payeeName) => {
  const selected = normalizeText(payeeName)
  if (!selected) return null
  return (
    (payeeStore.payees || []).find(
      (payee) => normalizeText(payee.payee_name || payee.name || payee.payee) === selected,
    ) || null
  )
}
const barangayName = computed(() => {
  const row = props.disbursement || {}
  return String(
    firstPresent(
      authStore.admin ? authStore.getSelectedBarangayName?.() : '',
      authStore.user?.barangay_name,
      authStore.user?.barangay?.name,
      authStore.user?.barangay,
      row.barangay_name,
      row.barangay,
    ),
  ).toUpperCase()
})

const voucherData = computed(() => {
  const row = props.disbursement || {}
  const expenses = asArray(row.expenses?.length ? row.expenses : row.expenseRows)
  const firstExpense = expenses[0] || {}
  const deductions = asArray(row.deductions || row.expense?.deductions)
  const orDetails = asArray(row.orDetails || row.or_details)
  const payee = firstPresent(row.payee, row.payee2)
  const payeeMeta = registeredPayee(payee)
  const grossAmount =
    asNumber(firstPresent(row.dvAmount, row.dv_amount, row.amount)) ||
    expenses.reduce((sum, expense) => sum + asNumber(expense.amount), 0)
  const totalDeduction =
    asNumber(firstPresent(row.totalDeduction, row.total_deduction)) ||
    deductions.reduce((sum, deduction) => sum + asNumber(deduction.amount), 0)
  const netAmount =
    asNumber(firstPresent(row.netAmount, row.net_amount)) ||
    Math.max(0, grossAmount - totalDeduction)

  // Collect all cheques from bank_cheques/entries; fall back to a single
  // legacy cheque built from the flat chequeNumber/bank fields
  const rawChequeRows = asArray(row.bank_cheques || row.entries)
  const chequeEntries = (
    rawChequeRows.length
      ? rawChequeRows.map((c) => ({
          chequeNumber: firstPresent(c.cheque_number, c.chequeNumber),
          bankName: firstPresent(c.bank_name, c.bankName, c.bank),
          chequeDate: firstPresent(c.cheque_date, c.chequeDate),
          amount: asNumber(c.amount),
        }))
      : [
          {
            chequeNumber: firstPresent(row.chequeNumber, row.cheque_number),
            bankName: firstPresent(
              firstExpense.bankName,
              firstExpense.bank,
              row.bank_name,
              row.bank,
            ),
            chequeDate: firstPresent(
              firstExpense.cheque_date,
              firstExpense.chequeDate,
              row.cheque_date,
              row.chequeDate,
            ),
            amount: asNumber(row.dvAmount ?? row.dv_amount ?? row.amount),
          },
        ]
  ).filter((entry) => entry.chequeNumber || entry.bankName)

  return {
    dvNumber: formatDvNumber(firstPresent(row.dvNumber, row.dv_number)),
    date: firstPresent(row.date, row.dvDate, row.dv_date),
    payee,
    tin: firstPresent(
      row.tin,
      row.tin_number,
      row.tinNumber,
      payeeMeta?.tin_number,
      payeeMeta?.tin,
    ),
    fund: firstPresent(firstExpense.fund, firstExpense.budget_source, row.fund, row.funds),
    particulars: expenses.length
      ? expenses.map((expense) => firstPresent(expense.particular, expense.particulars, '—'))
      : [firstPresent(row.particular, row.particulars, '—')],
    deductions: deductions.map((deduction) => ({
      label: firstPresent(deduction.description, deduction.label, 'DEDUCTION'),
      amount: asNumber(deduction.amount),
    })),
    totalDeduction,
    grossAmount,
    netAmount,
    account: firstPresent(firstExpense.accountName, firstExpense.account, row.account, '—'),
   
    chequeDate: chequeEntries[0]?.chequeDate || '',
    chequeNumber: chequeEntries[0]?.chequeNumber || '',
    bankName: chequeEntries[0]?.bankName || '',
    chequeEntries,

    chequeNumbersDisplay: chequeEntries
      .map((e) => e.chequeNumber)
      .filter(Boolean)
      .join(', '),
    bankNamesDisplay: [...new Set(chequeEntries.map((e) => e.bankName).filter(Boolean))].join(', '),

    orNumber: firstPresent(
      row.orNumber,
      row.or_number,
      orDetails[0]?.orNumber,
      orDetails[0]?.or_number,
    ),
  }
})

onMounted(() => {
  payeeStore.fetchPayees().catch((error) => {
    console.warn('Failed to load registered payees for voucher:', error)
  })
})

// const printVoucher = async () => {
//   await nextTick()
//   window.print()
// }

const exportPdf = async () => {
  if (!voucherRef.value) return
  exporting.value = true
  try {
    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).default
    const canvas = await html2canvas(voucherRef.value, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })
    const pdf = new jsPDF('p', 'mm', 'letter')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = pageWidth - 17
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 9, 9, imgWidth, Math.min(imgHeight, pageHeight - 17))
    pdf.save(`Disbursement-Voucher-${voucherData.value.dvNumber || 'export'}.pdf`)
  } catch (error) {
    console.error('Failed to export voucher:', error)
    $q.notify({ type: 'negative', message: 'Failed to export voucher', position: 'top' })
  } finally {
    exporting.value = false
  }
}

watch(model, async (open) => {
  if (open) await nextTick()
})
</script>

<style scoped>
.voucher-layout {
  background: #f5f5f5;
}

.modal-header {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 2000;
}

.modal-header .q-toolbar {
  min-height: 64px;
  padding: 8px 16px;
}

.preview-wrap {
  display: flex;
  justify-content: center;
  background: #f3f4f6;
  flex: 1;
  min-height: 1160px;
}

.voucher-page {
  width: 216mm;
  max-height: 265mm;
  transform: scale(1.1);
  margin-top: 20px;
  margin-bottom: 15px;
  transform-origin: top center;
  background: #fff;
  color: #000;
  border: 2px solid #000;
  font-family: 'Times New Roman', serif;
  font-size: 12px;
  line-height: 1.2;
}

.voucher-drawer {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.voucher-header {
  text-align: center;
  padding: 10px 6px 6px;
  font-weight: 700;
  line-height: 1.4;
}

.voucher-header .city {
  font-size: 14px;
}

.voucher-header .office {
  font-size: 21px;
  margin-top: 10px;
}

.voucher-title-row,
.voucher-info-row {
  display: grid;
  grid-template-columns: 1fr 220px;
  border-top: 1px solid #000;
}

.voucher-title,
.payee {
  padding: 6px;
  border-right: 1px solid #000;
}

.voucher-title {
  text-align: center;
  font-size: 23px;
  font-weight: 700;
  letter-spacing: 0px;
}

.voucher-meta > div {
  min-height: 24px;
  padding: 5px;
  border-bottom: 1px solid #000;
}

.voucher-meta > div:last-child {
  border-bottom: 0;
}

.meta-value {
  font-size: 18px;
  margin-left: 18px;
}

.info-card {
  background: linear-gradient(135deg, #e0ffe7 0%, #69b31e 100%);
  border: 1px solid #187c19;
}

.red {
  color: #990101;
}

.voucher-table {
  width: 100%;
  border-collapse: collapse;
}

.voucher-table th,
.voucher-table td {
  vertical-align: top;
}

.main-table th {
  text-align: center;
  font-weight: 700;
  font-size: 14px;
  padding: 4px;
}

.amount-col {
  border-left: 1px solid #000;
  border-bottom: 2px solid #000;
  width: 221px;
}

.particulars-col {
  border-bottom: 2px solid #000;
}

.particular-amount td {
  height: 410px;
  padding: 8px;
}

.particular-amount tr {
  display: grid;
  grid-template-columns: 1fr 212px;
  border-top: 1px solid #000;
}

.particulars-row {
  border-right: 1px solid #000;
}

.particulars {
  min-height: 250px;
  font-size: 14px;
}

.deductions {
  width: 250px;
  margin-left: auto;
}

.deduction-line,
.deduction-total {
  display: flex;
  justify-content: space-between;
}

.deduction-total {
  border-top: 1px solid #000;
  font-weight: 700;
  margin-top: 2px;
  padding-top: 2px;
}

.account-block {
  margin-top: 18px;
  font-size: 12px;
}

.amount {
  text-align: center;
  font-weight: 700;
  font-size: 21px;
}

.top-amount {
  padding-top: 8px;
  margin-top: 20px;
}

.amount-due-label {
  border-right: 1px solid #000;
  text-align: right;
  font-weight: 700;
  padding: 6px 12px;
}

.certification-table td {
  width: 33.333%;
  height: 120px;
  padding: 6px;
  font-size: 10px;
  font-weight: 700;
}

.signature {
  margin-top: 48px;
  text-align: center;
  font-size: 12px;
}

.signature-title {
  text-align: center;
  font-size: 9px;
  font-weight: 700;
}

.date-row td {
  height: 20px;
  padding: 5px;
  border-bottom: 2px solid #000;
  border-top: 1px solid #000;
}

/* Drawer Styles */
.drawer-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}

.drawer-header {
  flex-shrink: 0;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px;
}

.payment-table td {
  height: 24px;
  padding: 10px;
}

.payment-left {
  border-right: 1px solid #000;
  width: 41%;
}

.payment-right {
  width: 59%;
}

.payee-signature {
  margin-top: 58px;
  text-align: center;
  font-weight: 700;
}

.signature-line {
  border-top: 1px solid #000;
  margin: 18px 8px 2px;
}

.payment-field {
  display: grid;
  grid-template-columns: 90px 1fr;
  align-items: end;
  margin: 16px 28px;
}

.payment-field span {
  border-bottom: 1px solid #000;
  min-height: 16px;
  padding-left: 8px;
  font-weight: 700;
}

.signatory-group {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 5px;
  background-color: #fafafa;
  transition: all 0.3s ease;
}
.signatory-group:hover {
  background-color: #e0ffe7;
  border-color: #187c19;
  box-shadow: 0 2px 8px rgba(24, 124, 25, 0.1);
}

@media (max-width: 768px) {
  .voucher-drawer {
    width: 300px !important;
  }

  .drawer-header {
    padding: 16px 0;
    background-color: #f5f5f5;
  }

  .signatory-group {
    padding: 12px;
  }

  .print-content-wrapper {
    padding: 10px;
  }

  .print-content-wrapper .print-modal {
    padding: 16px;
    min-height: auto;
    /* Adjust for mobile landscape */
    width: 100% !important;
    transform: scale(1) !important;
  }

  .modal-header .q-toolbar {
    min-height: 56px;
    padding: 4px 8px;
  }

  .modal-header .q-toolbar-title,
  .rac-header .q-toolbar-title {
    font-size: 1rem;
  }
}

.modal-header .q-toolbar-title {
  font-size: 0.9rem;
}

@media print {
  :global(body *) {
    visibility: hidden;
  }

  .voucher-page,
  .voucher-page * {
    visibility: visible;
  }

  .voucher-page {
    position: fixed;
    left: 0;
    top: 0;
    width: 216mm;
    min-height: 330mm;
    border: 2px solid #000;
  }

  .no-print {
    display: none !important;
  }
}
</style>
