<template>
  <q-page class="q-pa-lg report-page">


    <!-- Main Header with bottom border -->
    <div class="section-header q-mb-xl">
      <div class="section-title">Current Year Reports</div>
    </div>

    <SetupDialog v-model="showSetupDialog" />

    <!-- Current Year Reports Card -->
    <q-card class="report-card q-mb-xl" flat bordered>
      <q-card-section class="q-pb-none q-pt-lg">
        <div class="subsection-title">Registry of Appropriation and Commitment (RAC)</div>
      </q-card-section>

      <q-card-section class="q-pt-md q-pb-lg">
        <div class="row q-col-gutter-lg items-end">
          <div class="col-12 col-sm-6 col-md-4">

            <q-input bg-color="white" outlined dense :model-value="dateRangeDisplay" label="Date Range"
              class="custom-date-range" clearable @clear="onDateRangeClear" readonly>
              <template v-slot:append>
                <q-icon name="event" class="calend-icon">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="dateRange" range @update:model-value="onDateRangeChange" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

          </div>


          <div class="col-12 col-sm-6 col-md-4">
            <q-select outlined dense v-model="expenseSelectedCurrent" label="Expense Category"
              :options="reportStore.expenseOptionsCurrent" map-options option-label="name" option-value="id"
              :loading="loading" />
          </div>

          <div class="col-12 col-sm-6 col-md-4">
            <q-btn color="primary" icon="settings" label="Generate Report" class="full-width"
              @click="openRACModal('current-rac')" :loading="loading" />
          </div>
        </div>
      </q-card-section>

      <q-separator class="q-my-lg" />

      <q-card-section class="q-pb-none q-pt-lg">
        <div class="subsection-title">Status of Appropriation and Obligation (SACB)</div>
      </q-card-section>

      <q-card-section class="q-pt-md q-pb-lg">
        <div class="row q-col-gutter-lg items-end">
          <div class="col-12 col-sm-6 col-md-6">

            <q-input bg-color="white" outlined dense :model-value="currentSacbDateRangeDisplay" label="Date Range"
              class="custom-date-range" clearable @clear="onCurrentSacbDateRangeClear" readonly>
              <template v-slot:append>
                <q-icon name="event" class="calend-icon">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="currentSacbDateRange" range @update:model-value="onCurrentSacbDateRangeChange" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

          </div>


          <div class="col-12 col-sm-6 col-md-6">
            <q-btn color="primary" icon="settings" label="Generate Report" class="full-width"
              @click="openSACBModal('current-sacb')" :loading="loading" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Continuing Reports Header with bottom border -->
    <div class="section-header q-mb-xl">
      <div class="section-title">Continuing Reports</div>
    </div>

    <!-- Continuing Reports Card -->
    <q-card class="report-card q-mb-xl" flat bordered>
      <q-card-section class="q-pb-none q-pt-lg">
        <div class="subsection-title">Registry of Appropriation and Commitment (RAC)</div>
      </q-card-section>

      <q-card-section class="q-pt-md q-pb-lg">
        <div class="row q-col-gutter-lg items-end">
          <div class="col-12 col-sm-6 col-md-4">

            <q-input bg-color="white" outlined dense :model-value="continuingDateRangeDisplay" label="Date Range"
              class="custom-date-range" clearable @clear="onContinuingDateRangeClear" readonly>
              <template v-slot:append>
                <q-icon name="event" class="calend-icon">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="continuingDateRange" range @update:model-value="onContinuingDateRangeChange" />

                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-4">
            <q-select outlined dense v-model="expenseSelectedContinuing" label="Expense Category" map-options
              :options="reportStore.expenseOptionsContinuing" :loading="loading" option-value="id"
              option-label="name"/>
          </div>

          <div class="col-12 col-sm-6 col-md-4">
            <q-btn color="primary" icon="settings" label="Generate Report" class="full-width"
              @click="openRACModal('continuing-rac')" :loading="loading" />
          </div>
        </div>
      </q-card-section>

      <q-separator class="q-my-lg" />

      <q-card-section class="q-pb-none q-pt-lg">
        <div class="subsection-title">Status of Appropriation and Obligation (SACB)</div>
      </q-card-section>

      <q-card-section class="q-pt-md q-pb-lg">
        <div class="row q-col-gutter-lg items-end">
          <div class="col-12 col-sm-6 col-md-6">

            <q-input bg-color="white" outlined dense :model-value="continuingSacbDateRangeDisplay" label="Date Range"
              class="custom-date-range" clearable @clear="onContinuingSacbDateRangeClear" readonly>
              <template v-slot:append>
                <q-icon name="event" class="calend-icon">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="continuingSacbDateRange" range
                      @update:model-value="onContinuingSacbDateRangeChange" />

                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-6">
            <q-btn color="primary" icon="settings" label="Generate Report" class="full-width"
              @click="openSACBModal('continuing-sacb')" :loading="loading" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- SACB Modal -->
    <q-dialog v-model="SACBModal.show" persistent>
      <q-card class="print-modal">
        <q-card-section class="q-pb-none">
          <div class="text-h6">
            {{ SACBModal.reportType }}</div>
        </q-card-section>
        <q-card-section class="q-pb-none">
          <div class="text-h6">Barangay {{ authStore.user?.barangay_name }}</div>
          <div class="text-h6">Print Report Setup</div>

          <!-- First row: Prepared by, Noted by, Certified by -->
          <div class="row q-mb-md q-col-gutter-md">
            <div class="col-4">
              <q-input outlined dense label="Prepared by" v-model="SetupModal.Preparedby" />
            </div>
            <div class="col-4">
              <q-input outlined dense label="Noted by" v-model="SetupModal.Notedby" />
            </div>
            <div class="col-4">
              <q-input outlined dense label="Certified by" v-model="SetupModal.Certifiedby" />
            </div>
          </div>

          <!-- Second row: Positions -->
          <div class="row q-mb-md q-col-gutter-md">
            <div class="col-4">
              <q-select outlined dense :options="reportStore.positionsOptions" map-options option-label="label"
                option-value="value" v-model="SetupModal.Preparedposition" label="Position" />
            </div>
            <div class="col-4">
              <q-select outlined dense :options="reportStore.positionsOptions" map-options option-label="label"
                option-value="value" v-model="SetupModal.Notedposition" label="Position" />
            </div>
            <div class="col-4">
              <q-select outlined dense :options="reportStore.positionsOptions" map-options option-label="label"
                option-value="value" v-model="SetupModal.Certifiedposition" label="Position" />
            </div>
          </div>
        </q-card-section>

        <q-card-section>

          <q-separator class="q-my-md" />

          <div class="text-subtitle2 q-mb-md text-grey-7">
            Report Type: In Need for Improvement
          </div>

          <div class="q-mt-md">
            <div class="text-subtitle1 q-mb-sm">Activity Log</div>
            <q-table :rows="SACBModal.activities" :columns="activityColumns" row-key="id"
              :pagination="{ rowsPerPage: 5 }" flat bordered>
              <template v-slot:body-cell-time="props">
                <q-td :props="props">
                  <div class="text-caption">{{ props.value }}</div>
                </q-td>
              </template>
              <template v-slot:body-cell-description="props">
                <q-td :props="props">
                  <div class="text-body2">{{ props.value }}</div>
                </q-td>
              </template>
            </q-table>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" color="grey-7" @click="closeSACBModal" />
          <q-btn outline label="Export Reports to PDF" color="green" />
          <q-btn unelevated label="Print" color="primary" @click="handleSACBPrint" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- RAC Modal -->

    <q-dialog v-model="RACModal.show" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class=" full-height pages-group scroll ">

        <!-- Header menu -->
        <q-card-actions align="right" class="q-pa-md bg-grey-2 print-header">
          <q-btn flat label="Close" color="black-7" @click="closeRACModal" />
          <q-btn outline label="Export Reports to PDF" color="green" @click="exportToPDF" />
          <q-btn unelevated label="Print" color="primary" @click="handleRACPrint" />
        </q-card-actions>

        <!-- Page To Print -->
        <q-card class="print-modal q-mb-lg">
          <q-card-section class="q-pb-none">
            <div class="text-h6">
              {{ RACModal.reportType }}
            </div>
          </q-card-section>

          <q-card-section class="q-pb-none">
            <div class="text-h6">Barangay {{ authStore.user?.barangay_name }}</div>
            <div class="text-h6">Date {{ dateRangeDisplay }}</div>
          </q-card-section>
          <q-card-section>
            <div class="q-mt-md">
              <div class="text-subtitle1 q-mb-sm">Expense Class: {{ reportStore.expenseRacSelected?.name }}</div>

              <!-- Modified Excel Report Table with Obligation Amount and Subcolumns -->
              <q-table :rows="reportStore.reportRAC" :columns="reportStore.racColumn" row-key="dvNumber" flat bordered
                dense separator="cell" class="q-mt-md small-table-font" hide-pagination
                :pagination="{ rowsPerPage: 0 }">
                <!-- Custom two-row header -->
                <template v-slot:header>
                  <q-tr>
                    <q-th rowspan="2" style="width:200px;">Account Title</q-th>
                    <q-th rowspan="2" style="width:120px;" class="text-right">Appropriation</q-th>
                    <q-th colspan="4" class="text-center">Obligation</q-th>
                  </q-tr>
                  <q-tr>
                    <q-th style="width:80px;">DV#</q-th>
                    <q-th style="width:100px;">Date</q-th>
                    <q-th style="width:150px;">Payee</q-th>
                    <q-th style="width:120px;" class="text-right">Amount</q-th>
                  </q-tr>
                </template>

                <!-- Wrap text in all body cells -->
                <template v-slot:body-cell="props">
                  <q-td :props="props" style="white-space: normal; word-break: break-word;">
                    {{ props.value }}
                  </q-td>
                </template>

                <!-- Bottom total row -->
                <template v-slot:bottom-row>
                  <q-tr>
                    <q-td colspan="1" class="text-right text-bold">Total Appropriation</q-td>
                    <q-td class="text-right text-bold">
                      {{reportStore.reportRAC.reduce((sum, r) => sum + r.appropriation, 0).toLocaleString()}}
                    </q-td>
                    <q-td colspan="3" class="text-right text-bold">Total Obligation</q-td>
                    <q-td class="text-right text-bold">
                      {{reportStore.reportRAC.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}}
                    </q-td>
                  </q-tr>
                </template>
              </q-table>

              <!-- End Modified Table -->
            </div>
          </q-card-section>
        </q-card>

      </q-card>

    </q-dialog>
  </q-page>
</template>
<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import SetupDialog from 'components/SetupDialog.vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { useReportStore } from 'stores/reportStore'

// stores & composables
const $q = useQuasar()
const reportStore = useReportStore()
const authStore = useAuthStore()

/* -------------------- STATE -------------------- */
const showSetupDialog = ref(false)
const loading = ref(false)

// Date ranges
const dateRange = ref({ from: '', to: '' })
const continuingDateRange = ref({ from: '', to: '' })
const currentSacbDateRange = ref({ from: '', to: '' })
const continuingSacbDateRange = ref({ from: '', to: '' })

const expenseSelectedCurrent = ref(null);
const expenseSelectedContinuing = ref(null);


// Modals
const RACModal = reactive({
  show: false,
  reportType: '',
  report: [
    { id: 1, time: '09:30 AM', description: 'Report generated successfully' },
    { id: 2, time: '09:25 AM', description: 'Data validation completed' },
    { id: 3, time: '09:20 AM', description: 'Report parameters configured' },
    { id: 4, time: '09:15 AM', description: 'Print dialog opened' }
  ]
})

const SACBModal = reactive({
  show: false,
  reportType: '',
  activities: [
    { id: 1, time: '09:30 AM', description: 'Report generated successfully' },
    { id: 2, time: '09:25 AM', description: 'Data validation completed' },
    { id: 3, time: '09:20 AM', description: 'Report parameters configured' },
    { id: 4, time: '09:15 AM', description: 'Print dialog opened' }
  ]
})

const SetupModal = reactive({
  selectedBarangay: { barangay_name: '' },
  selectedpreparedby: null,
  selectedpreparedpos: null,
  selectednotedby: null,
  selectednotedpos: null,
  selectedcertifiedby: null,
  selectedcertifiedpos: null,
  show: false,
  Position: '',
  Preparedby: '',
  Preparedposition: '',
  Notedby: '',
  Notedposition: '',
  Certifiedby: '',
  Certifiedposition: ''
})

const loadAllData = async () => {
  loading.value = true
  try {
    const criticalPromises = [
      reportStore.fetchData(),
    ]

    await Promise.all(criticalPromises)
  } catch (error) {
    console.error('Error loading data:', error)
    notifyError('Failed to load data. Please try again later.')
  } finally {
    loading.value = false
  }
}

const openSACBModal = (type) => {
  if (type === 'current-sacb') {
    if (!currentSacbDateRange.value.from || !currentSacbDateRange.value.to) {
      return notifyError('Please select a valid current SACB date range.')
    }
  } else if (type === 'continuing-sacb') {
    if (!continuingSacbDateRange.value.from || !continuingSacbDateRange.value.to) {
      return notifyError('Please select a valid continuing SACB date range.')
    }
  }
  SACBModal.reportType = getReportTypeLabel(type)
  SACBModal.show = true
}

const closeSACBModal = () => { SACBModal.show = false }

const openRACModal = (type) => {
  if (type === 'current-rac') {
    if (!dateRange.value.from || !dateRange.value.to) {
      return notifyError('Please select a valid current RAC date range.')
    }
  } else if (type === 'continuing-rac') {
    if (!continuingDateRange.value.from || !continuingDateRange.value.to) {
      return notifyError('Please select a valid continuing RAC date range.')
    }
  }
  if (
    (type === 'current-rac' && !expenseSelectedCurrent.value) ||
    (type === 'continuing-rac' && !expenseSelectedContinuing.value)
  ) {
    return notifyError('Please select an Expense Category.')
  }

  reportStore.expenseRacSelected =
    type === 'current-rac'
      ? expenseSelectedCurrent
      : type === 'continuing-rac'
        ? expenseSelectedContinuing
        : null

  if (!reportStore.expenseRacSelected) {
    return notifyError('Please select an Expense Category.')
  }

  loadRacReport(
    type === 'current-rac'
      ? dateRange
      : type === 'continuing-rac'
        ? continuingDateRange
        : null)
  RACModal.reportType = getReportTypeLabel(type)
  RACModal.show = true
}

const closeRACModal = () => { RACModal.show = false }

const getReportTypeLabel = (type) => ({
  'current-rac': 'Current Year - Registry of Appropriation and Commitment (RAC)',
  'current-sacb': 'Current Year - Status of Appropriation and Obligation (SACB)',
  'continuing-rac': 'Continuing Reports - Registry of Appropriation and Commitment (RAC)',
  'continuing-sacb': 'Continuing Reports - Status of Appropriation and Obligation (SACB)'
}[type] || 'Unknown Report')

const handleSACBPrint = () => {
  if (dateRangeDisplay.value === '') {
    return notifyError('Please select a date range.')
  }
  if (dateRange.value.from === '' || dateRange.value.to === '') {
    return notifyError('Please select a valid date range.')
  }
  console.log('Printing report:', SACBModal.reportType)
  closeSACBModal()
  notifySuccess('Report sent to printer successfully!')
}

const handleRACPrint = () => {
  console.log('Printing report:', RACModal.reportType)
  closeRACModal()
  notifySuccess('Report sent to printer successfully!')
}
// Cur-Rac Date range
const onDateRangeChange = (newRange) => {
  dateRange.value = newRange
}

const onDateRangeClear = () => {
  dateRange.value = { from: '', to: '' }
}

const onContinuingDateRangeChange = (newRange) => {
  continuingDateRange.value = newRange
}

const onContinuingDateRangeClear = () => {
  continuingDateRange.value = { from: '', to: '' }
}

const onCurrentSacbDateRangeChange = (newRange) => {
  currentSacbDateRange.value = newRange
}

const onCurrentSacbDateRangeClear = () => {
  currentSacbDateRange.value = { from: '', to: '' }
}

const onContinuingSacbDateRangeChange = (newRange) => {
  continuingSacbDateRange.value = newRange
}

const onContinuingSacbDateRangeClear = () => {
  continuingSacbDateRange.value = { from: '', to: '' }
}

/* -------------------- HELPERS -------------------- */
const notifyError = (msg) => $q.notify({ type: 'negative', message: msg, position: 'top' })
const notifySuccess = (msg) => $q.notify({ type: 'positive', message: msg, position: 'top' })

/* -------------------- COMPUTED -------------------- */
const activityColumns = computed(() => [
  { name: 'time', label: 'Time', field: 'time', align: 'left', sortable: true, style: 'width: 120px' },
  { name: 'description', label: 'Activity Description', field: 'description', align: 'left', sortable: true }
])

const dateRangeDisplay = computed(() => {
  if (!dateRange.value.from && !dateRange.value.to) return ''
  if (dateRange.value.from && !dateRange.value.to) return `From ${dateRange.value.from}`
  if (!dateRange.value.from && dateRange.value.to) return `To ${dateRange.value.to}`
  return `${dateRange.value.from} - ${dateRange.value.to}`
})

const continuingDateRangeDisplay = computed(() => {
  if (!continuingDateRange.value.from && !continuingDateRange.value.to) return ''
  if (continuingDateRange.value.from && !continuingDateRange.value.to) return `From ${continuingDateRange.value.from}`
  if (!continuingDateRange.value.from && continuingDateRange.value.to) return `To ${continuingDateRange.value.to}`
  return `${continuingDateRange.value.from} - ${continuingDateRange.value.to}`
})

const currentSacbDateRangeDisplay = computed(() => {
  if (!currentSacbDateRange.value.from && !currentSacbDateRange.value.to) return ''
  if (currentSacbDateRange.value.from && !currentSacbDateRange.value.to) return `From ${currentSacbDateRange.value.from}`
  if (!currentSacbDateRange.value.from && currentSacbDateRange.value.to) return `To ${currentSacbDateRange.value.to}`
  return `${currentSacbDateRange.value.from} - ${currentSacbDateRange.value.to}`
})

const continuingSacbDateRangeDisplay = computed(() => {
  if (!continuingSacbDateRange.value.from && !continuingSacbDateRange.value.to) return ''
  if (continuingSacbDateRange.value.from && !continuingSacbDateRange.value.to) return `From ${continuingSacbDateRange.value.from}`
  if (!continuingSacbDateRange.value.from && continuingSacbDateRange.value.to) return `To ${continuingSacbDateRange.value.to}`
  return `${continuingSacbDateRange.value.from} - ${continuingSacbDateRange.value.to}`
})

async function loadRacReport($date) {
  try{
    await reportStore.fetchRacReport($date)
  }catch (error) {
    console.error(error)
    this.$q.notify({
      type: 'negative',
      message: 'Failed to generate Report',
    })
  }
}

async function exportToPDF() {
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).default;
  try {

    const element = document.querySelector('.print-modal')

    if (!element) {
      this.$q.notify({
        type: 'negative',
        message: 'No content found to export!',
      })
      return
    }


    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')


    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0


    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight


    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }


    pdf.save('report.pdf')

    this.$q.notify({
      type: 'positive',
      message: 'PDF Exported Successfully!',
    })
  } catch (error) {
    console.error(error)
    this.$q.notify({
      type: 'negative',
      message: 'Failed to export PDF',
    })
  }
}

/* -------------------- LIFECYCLE -------------------- */
onMounted(async () => {
  await loadAllData()
})
onActivated(async () => {
  await loadAllData()
})
</script>


<style scoped>
.report-page {
  background-color: #fafafa;
  min-height: 100vh;
}

/* Section Headers with bottom borders */
.section-header {
  display: flex;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f6c0e;
  margin: 0;
}

.subsection-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #424242;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

/* Setup button styling */
.setup-btn {
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
}

/* Card styling */
.report-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.report-card:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* Modal styling */
.setup-modal {
  min-width: 500px;
  max-width: 600px;
  border-radius: 12px;
}

.print-modal {
  /* A4 aspect ratio (width:height = 1:1.414) */
  width: min(100%, 210mm);
  min-height: 297mm;
  /* Minimum height is A4 */
  max-width: 100%;
  overflow-y: auto;
  display: block;
  overflow: visible;
  position: sticky;
  /* Zoom in the modal */
  transform: scale(1.15);
  transform-origin: center top;
  margin: 30px auto 30px auto;
  padding: 24px;
  /* Allow height to grow with content */
  box-sizing: border-box;
}

/* Divider for every A4 "page" of content */
.print-modal {
  position: relative;
}

.print-modal>.a4-divider {
  width: 100%;
  height: 0;
  border-top: 2px dashed #bdbdbd;
  margin: 0;
  position: absolute;
  left: 0;
  /* Top will be set inline via JS or template for each A4 page */
  z-index: 2;
}

/* Utility class for A4 height */
.a4-page {
  min-height: 297mm;
  position: relative;
}

/* Example: Add this to your template for every A4 "page" of content
<div class="a4-page"> ...content... </div>
<div class="a4-divider" style="top: 297mm"></div>
*/

/* Custom date range styling */
.custom-date-range {
  transition: all 0.3s ease;
}

.custom-date-range:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.calend-icon {
  cursor: pointer;
  transition: color 0.3s ease;
}

.calend-icon:hover {
  color: #1976d2;
}

/* Input and button enhancements */
.q-input,
.q-select {
  background-color: white;
  transition: all 0.3s ease;
}

.q-input:hover,
.q-select:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.q-btn {
  transition: all 0.3s ease;
  font-weight: 500;
}

.q-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Custom date range styling */
.custom-date-range {
  transition: all 0.3s ease;
}

.custom-date-range:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.calend-icon {
  cursor: pointer;
  transition: color 0.3s ease;
}

.calend-icon:hover {
  color: #1976d2;
}

/* Input and button enhancements */
.q-input,
.q-select {
  background-color: white;
  transition: all 0.3s ease;
}

.q-input:hover,
.q-select:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.q-btn {
  transition: all 0.3s ease;
  font-weight: 500;
}

.q-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Responsive Design */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 24px;
  }

  .section-title {
    font-size: 1.3rem;
    text-align: center;
  }

  .setup-btn {
    width: 100%;
  }

  .setup-modal,
  .print-modal {
    min-width: 90vw;
    max-width: 95vw;
  }


  .report-card {
    margin-bottom: 20px;
  }
}

@media (max-width: 600px) {
  .report-page {
    padding: 16px;
    background-color: #fafafa;
  }

  .section-title {
    font-size: 1.2rem;
  }

  .subsection-title {
    font-size: 1rem;
  }

  .section-header {
    margin-bottom: 20px;
  }
}

.print-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;

}

.pages-group {
  background-color: gray;
}

.small-table-font td,
.small-table-font th {
  font-size: 12px;
}
</style>
