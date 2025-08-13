<template>
  <q-page class="q-pa-lg report-page">

    <!-- Fullscreen blocking loading modal -->
    <q-dialog :model-value="loading" persistent>
      <q-card class="q-pa-lg flex flex-center column" style="width: 200px;">
        <q-spinner color="primary" size="50px" />
        <div class="text-subtitle1 q-mt-md">Loading...</div>
      </q-card>
    </q-dialog>

    <!-- Main Header with bottom border -->
    <div class="section-header q-mb-xl">
      <div class="section-title">Current Year Reports</div>
    </div>

    <SetupDialog v-model="showSetupDialog" />

    <!-- Current Year Reports Card -->
    <q-card class="report-card q-mb-xl" flat bordered>
      <q-card-section class="q-pb-none">
        <div class="subsection-title">Registry of Appropriation and Commitment (RAC)</div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-6 col-md-3">
            <q-input outlined dense label="From" v-model="racDateFromCurrent" mask="##/##/####"
              placeholder="25/11/2022">
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="racDateFromCurrent" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-input outlined dense label="To" v-model="racDateToCurrent" mask="##/##/####" placeholder="25/11/2022">
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="racDateToCurrent" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-4">
            <q-select outlined dense v-model="reportStore.expenseSelectedCurrent" label="Expense Category"
              :options="reportStore.expenseOptionsCurrent" map-options option-label="name" option-value="id" />
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-btn color="primary" icon="settings" label="Generate Report" class="full-width"
              @click="openRACModal('current-rac')" />
          </div>
        </div>
      </q-card-section>

      <q-separator class="q-my-md" />

      <q-card-section class="q-pb-none">
        <div class="subsection-title">Status of Appropriation and Obligation (SACB)</div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-6 col-md-4">
            <q-input outlined dense label="From" v-model="sacbDateFromCurrent" mask="##/##/####"
              placeholder="25/11/2022">
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="sacbDateFromCurrent" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-4">
            <q-input outlined dense label="To" v-model="sacbDateToCurrent" mask="##/##/####" placeholder="25/11/2022">
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="sacbDateToCurrent" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-12 col-md-4">
            <q-btn color="primary" icon="settings" label="Generate Report" class="full-width"
              @click="openSACBModal('current-sacb')" />
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
      <q-card-section class="q-pb-none">
        <div class="subsection-title">Registry of Appropriation and Commitment (RAC)</div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-6 col-md-3">
            <q-input outlined dense label="From" v-model="racDateFromCont" mask="##/##/####" placeholder="25/11/2022">
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="racDateFromCont" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-input outlined dense label="To" v-model="racDateToCont" mask="##/##/####" placeholder="25/11/2022">
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="racDateToCont" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-4">
            <q-select outlined dense v-model="reportStore.expenseSelectedContinuing" label="Expense Category"
              map-options :options="reportStore.expenseOptionsContinuing" option-value="id" option-label="name" />
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-btn color="primary" icon="settings" label="Generate Report" class="full-width"
              @click="openRACModal('continuing-rac')" />
          </div>
        </div>
      </q-card-section>

      <q-separator class="q-my-md" />

      <q-card-section class="q-pb-none">
        <div class="subsection-title">Status of Appropriation and Obligation (SACB)</div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-6 col-md-4">
            <q-input outlined dense label="From" v-model="sacbDateFromCont" mask="##/##/####" placeholder="25/11/2022">
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="sacbDateFromCont" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-4">
            <q-input outlined dense label="To" v-model="sacbDateToCont" mask="##/##/####" placeholder="25/11/2022">
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="sacbDateToCont" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-12 col-md-4">
            <q-btn color="primary" icon="settings" label="Generate Report" class="full-width" style="width: 100px;"
              @click="openSACBModal('continuing-sacb')" />
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
          <div class="row justify-between q-gutter-sm q-mb-md">
            <div class="row q-gutter-sm">
              <q-btn outline label="Load Reports" color="orange" />
              <q-btn outline label="Export Reports" color="green" />
            </div>
          </div>

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
          <q-btn unelevated label="Print" color="primary" @click="handleSACBPrint" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- RAC Modal -->

    <q-dialog v-model="RACModal.show" persistent>
      <q-card class="print-modal">
        <q-card-section class="q-pb-none">
          <div class="text-h6">
            {{ RACModal.reportType }}</div>
        </q-card-section>

        <q-card-section class="q-pb-none">
          <div class="text-h6">Barangay {{ authStore.user?.barangay_name }}</div>
        </q-card-section>


        <q-card-section>
          <div class="q-mt-md">
            <div class="text-subtitle1 q-mb-sm">Expense Class: {{ reportStore.expenseSelectedCurrent?.name }}</div>
            <q-table :rows="RACModal.report" :columns="activityColumns" row-key="id" :pagination="{ rowsPerPage: 5 }"
              flat bordered>
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
          <q-btn flat label="Cancel" color="grey-7" @click="closeRACModal" />
          <q-btn unelevated label="Print" color="primary" @click="handleRACPrint" />
        </q-card-actions>
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
  SACBModal.reportType = getReportTypeLabel(type)
  SACBModal.show = true
}

const closeSACBModal = () => { SACBModal.show = false }

const openRACModal = (type) => {
  // if (!current.racFrom || !current.racTo) {
  //   return notifyError('Please select both From and To dates.')
  // }
  // if (current.racFrom >= current.racTo) {
  //   return notifyError('The From date must be before the To date.')
  // }
  if (!reportStore.expenseSelectedCurrent) {
    return notifyError('Please select an Expense Category.')
  }
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
  console.log('Printing report:', SACBModal.reportType)
  closeSACBModal()
  notifySuccess('Report sent to printer successfully!')
}

const handleRACPrint = () => {
  console.log('Printing report:', RACModal.reportType)
  closeRACModal()
  notifySuccess('Report sent to printer successfully!')
}

/* -------------------- HELPERS -------------------- */
const notifyError = (msg) => $q.notify({ type: 'negative', message: msg, position: 'top' })
const notifySuccess = (msg) => $q.notify({ type: 'positive', message: msg, position: 'top' })

/* -------------------- COMPUTED -------------------- */
const activityColumns = computed(() => [
  { name: 'time', label: 'Time', field: 'time', align: 'left', sortable: true, style: 'width: 120px' },
  { name: 'description', label: 'Activity Description', field: 'description', align: 'left', sortable: true }
])

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
  margin-bottom: 24px;
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
  margin-bottom: 8px;
}

/* Setup button styling */
.setup-btn {
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
}

/* Card styling */
.report-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

/* Modal styling */
.setup-modal {
  min-width: 500px;
  max-width: 600px;
  border-radius: 12px;
}

.print-modal {
  /* A4 aspect ratio (height / width = 1.414) */
  aspect-ratio: 310 / 397;

  
  max-width: 100%;
  width: min(100%, 210mm);
  max-height: 90vh;
  overflow-y: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
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
}

@media (max-width: 600px) {
  .report-page {
    padding: 12px;
    background-color: whitesmoke;
  }

  .section-title {
    font-size: 1.2rem;
  }

  .subsection-title {
    font-size: 1rem;
  }
}

.q-input {
  background-color: white;
}
</style>
