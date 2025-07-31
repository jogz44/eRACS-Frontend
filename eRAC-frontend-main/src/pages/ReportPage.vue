<template>
  <q-page class="q-pa-lg report-page">
    <q-toolbar class="q-pr-md items-center" style="display: flex; flex-direction: row;">
      <div class="text-h5 text-weight-bold">{{ authStore.user?.first_name || 'User' }}</div>
      <div class="text-h5 text-weight-bold">Current Year Reports</div>
      <q-space />
      <q-btn flat square dense style="background-color: green; border-radius: 10px;" color="white" icon="settings" @click="OpenSetupModal">
        <div>Setup</div>
      </q-btn>
    </q-toolbar>

    <SetupDialog v-model="showSetupDialog" />

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Registry of Appropriation and Commitment (RAC)</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-sm">
          <div class="col">
            <q-input
              filled
              label="From"
              v-model="racDateFromCurrent"
              mask="##/##/####"
              placeholder="25/11/2022"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="racDateFromCurrent" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col">
            <q-input
              filled
              label="To"
              v-model="racDateToCurrent"
              mask="##/##/####"
              placeholder="25/11/2022"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="racDateToCurrent" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col">
            <q-select
              filled
              v-model="expenseCategoryCurrent"
              label="Expense Category:"
              :options="expenseOptionsCurrent"
            />
          </div>
          <div class="col-auto">
            <q-btn color="secondary" icon="print" label="Print" @click="openPrintModal('current-rac')" />
          </div>
        </div>
      </q-card-section>

      <!-- SACB Section with adjusted alignment -->
      <q-card-section>
        <div class="text-h6 q-mt-md">Status of Appropriation and Obligation (SACB)</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md">
          <div class="col">
            <q-input
              filled
              label="From"
              v-model="sacbDateFromCurrent"
              mask="##/##/####"
              placeholder="25/11/2022"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="sacbDateFromCurrent" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col">
            <q-input
              filled
              label="To"
              v-model="sacbDateToCurrent"
              mask="##/##/####"
              placeholder="25/11/2022"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="sacbDateToCurrent" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn color="secondary" icon="print" label="Print" @click="openPrintModal('current-sacb')" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="page-header q-mb-lg">
      <div class="text-h5 text-weight-bold">Continuing Reports</div>
    </div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Registry of Appropriation and Commitment (RAC)</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-sm">
          <div class="col">
            <q-input
              filled
              label="From"
              v-model="racDateFromCont"
              mask="##/##/####"
              placeholder="25/11/2022"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="racDateFromCont" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col">
            <q-input
              filled
              label="To"
              v-model="racDateToCont"
              mask="##/##/####"
              placeholder="25/11/2022"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="racDateToCont" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col">
            <q-select
              filled
              v-model="expenseCategoryCont"
              label="Expense Category:"
              :options="expenseOptionsCont"
            />
          </div>
          <div class="col-auto">
            <q-btn color="secondary" icon="print" label="Print" @click="openPrintModal('continuing-rac')" />
          </div>
        </div>
      </q-card-section>

      <!-- SACB Section with adjusted alignment -->
      <q-card-section>
        <div class="text-h6 q-mt-md">Status of Appropriation and Obligation (SACB)</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md">
          <div class="col">
            <q-input
              filled
              label="From"
              v-model="sacbDateFromCont"
              mask="##/##/####"
              placeholder="25/11/2022"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="sacbDateFromCont" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col">
            <q-input
              filled
              label="To"
              v-model="sacbDateToCont"
              mask="##/##/####"
              placeholder="25/11/2022"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy>
                    <q-date v-model="sacbDateToCont" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn color="secondary" icon="print" label="Print" @click="openPrintModal('continuing-sacb')" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Setup Modal -->
    <q-dialog v-model="SetupModal.show" persistent>
      <q-card style="min-width: 600px; align-items: center; position: relative;height: 700px;">
        <q-card-section>
          <div class="text-h6">Print Report Setup</div>
        </q-card-section>

        <!-- Setup Info -->
        <q-card-section class="q-pt-none">
          <!-- Welcome Message -->


          <!-- Barangay Information -->
          <q-input
            filled
            v-model="SetupModal.selectedBarangay.barangay_name"
            label="Barangay"
            readonly
            class="q-mb-md"
          />

          <!-- Prepared By Section -->
          <q-input
            filled
            v-model="SetupModal.Preparedby"
            label="Prepared by"
            class="q-mb-md"
            readonly
          />
          <q-input
            filled
            v-model="SetupModal.Preparedposition"
            label="Position"
            class="q-mb-md"
            readonly
          />

          <!-- Noted By Section -->
          <q-input
            filled
            v-model="SetupModal.Notedby"
            label="Noted by"
            class="q-mb-md"
          />
          <q-select
            filled
            v-model="SetupModal.Notedposition"
            :options="positionOptions"
            label="Position"
            class="q-mb-md"
          />

          <!-- Certified By Section -->
          <q-input
            filled
            v-model="SetupModal.Certifiedby"
            label="Certified by"
            class="q-mb-md"
          />
          <q-select
            filled
            v-model="SetupModal.Certifiedposition"
            :options="positionOptions"
            label="Position"
            class="q-mb-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Save" color="primary" @click="saveSetupModal" />
          <q-btn flat label="Cancel" color="primary" @click="closeSetupModal" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Print Modal -->
    <q-dialog v-model="printModal.show" persistent>
      <q-card style="min-width: 700px; align-items: center; position: relative;height: 500px;">
        <q-card-section>
          <div class="text-h6">Print Report</div>
        </q-card-section>

        <q-card-section class="q-pt-none row">
          <div class="q-gutter-sm">
            <q-btn
              label="Load Reports"
              color="red-12"
            />
            <q-btn
              label="Export Reports"
              color="orange"
            />
                 <q-btn style="align-self: flex-end; justify-self: end;" label="Print" color="primary" @click="handlePrint" />

          </div>
          <q-card-section>

          </q-card-section>


          <q-separator class="q-my-md" />
          <div class="text-subtitle2 q-mb-md">Report Type: {{ printModal.reportType }}</div>


        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="closePrintModal" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import SetupDialog from 'components/SetupDialog.vue'
import { useAuthStore } from 'src/stores/auth'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'

export default {
  name: 'FinancialDashboard',
  components: {
    SetupDialog
  },
  setup() {
    const authStore = useAuthStore()
    const $q = useQuasar()

    return {
      authStore,
      $q
    }
  },
  data() {
    return {
      showSetupDialog: false,
      racDateFromCurrent: null,
      racDateToCurrent: null,
      sacbDateFromCurrent: null,
      sacbDateToCurrent: null,
      expenseCategoryCurrent: null,
      expenseOptionsCurrent: ['Select Expense Class...', 'Class A', 'Class B', 'Class C'],
      racDateFromCont: null,
      racDateToCont: null,
      sacbDateFromCont: null,
      sacbDateToCont: null,
      expenseCategoryCont: null,
      expenseOptionsCont: ['Select Expense Class...', 'Capital Outlay'],
      // Print Modal Data
      printModal: {
        show: false,
        reportType: '',
      },
      SetupModal: {
        selectedBarangay: {
          barangay_name: ''
        },
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
        Certifiedposition: '',
      },
      positionOptions: []
    }
  },
  methods: {
    openSetupDialog() {
      this.showSetupDialog = true
    },
    // Setup Modal
    OpenSetupModal() {
      // Set current user's barangay
      this.SetupModal.selectedBarangay.barangay_name = this.authStore.user?.barangay_name || ''

      // Pre-fill with current user's information
      this.SetupModal.Preparedby = this.authStore.user?.first_name + ' ' + (this.authStore.user?.last_name || '')
      this.SetupModal.Preparedposition = this.authStore.user?.position + ' ' + (this.authStore.user?.position_name || '')
      // this.SetupModal.Certifiedby = this.authStore.user?.first_name + ' ' + (this.authStore.user?.last_name || '')

      this.SetupModal.show = true
    },
    closeSetupModal() {
      this.SetupModal.show = false
    },
    async saveSetupModal() {
      // Save the setup configuration
      try {
        // Here you can add logic to save the setup configuration
        console.log('Setup saved:', this.SetupModal)

        this.$q.notify({
          type: 'positive',
          message: 'Setup configuration saved successfully!',
          position: 'top'
        })

        this.closeSetupModal()
      } catch (error) {

        console.error(error)
          this.$q.notify({
            type: 'negative',
            message: 'Failed to save setup configuration',
            position: 'top'
          })
      }
    },
    async loadPositionOptions() {
      try {
        const response = await api.get('/api/barangay/positions')
        this.positionOptions = response.data.map((position) => ({
          label: position.name,
          value: position.name
        }))
      } catch (error) {
        console.error('Failed to load positions:', error)
        // Fallback options
        this.positionOptions = [
          { label: 'Punong Barangay', value: 'Punong Barangay' },
          { label: 'Barangay Secretary', value: 'Barangay Secretary' },
          { label: 'Barangay Treasurer', value: 'Barangay Treasurer' },
          { label: 'Barangay Councilor', value: 'Barangay Councilor' }
        ]
      }
    },
    // Print Modal
    openPrintModal(reportType) {
      this.printModal.reportType = this.getReportTypeLabel(reportType)
      this.printModal.show = true
    },
    closePrintModal() {
      this.printModal.show = false
    },
    getReportTypeLabel(type) {
      const labels = {
        'current-rac': 'Current Year - Registry of Appropriation and Commitment (RAC)',
        'current-sacb': 'Current Year - Status of Appropriation and Obligation (SACB)',
        'continuing-rac': 'Continuing Reports - Registry of Appropriation and Commitment (RAC)',
        'continuing-sacb': 'Continuing Reports - Status of Appropriation and Obligation (SACB)'
      }
      return labels[type] || 'Unknown Report'
    },
    handlePrint() {
      // Add your print logic here
      console.log('Printing report:', this.printModal.reportType)

      // Close modal after printing
      this.closePrintModal()

      // Show success message
      this.$q.notify({
        type: 'positive',
        message: 'Report sent to printer successfully!',
        position: 'top'
      })
    }
  },
  async mounted() {
    // Load position options when component is mounted
    await this.loadPositionOptions()
  }
}
</script>

<style scoped>
.report-page {
  background-color: #D9D9D9; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
}

/* Responsive Design */
@media (max-width: 600px) {
  /* Mobile View */
  /* Toolbar adjustments */
  .q-toolbar {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
    padding: 12px !important;
  }

  .q-toolbar .text-h5 {
    font-size: 1.2rem !important;
    text-align: center !important;
  }

  .q-toolbar .q-btn {
    width: 100% !important;
    margin: 0 !important;
  }

  /* Card sections */
  .q-card-section {
    padding: 12px !important;
  }

  /* Row adjustments */
  .row.q-col-gutter-sm,
  .row.q-col-gutter-md {
    flex-direction: column !important;
    gap: 12px !important;
  }

  .row.q-col-gutter-sm > *,
  .row.q-col-gutter-md > * {
    width: 100% !important;
    margin: 0 !important;
  }

  /* Input adjustments */
  .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .q-select {
    width: 100% !important;
    min-width: 0 !important;
  }

  /* Button adjustments */
  .q-btn {
    width: 100% !important;
    min-height: 44px !important;
  }

  /* Text adjustments */
  .text-h5 {
    font-size: 1.2rem !important;
  }

  .text-h6 {
    font-size: 1.1rem !important;
  }

  /* Page header adjustments */
  .page-header {
    margin-bottom: 16px !important;
  }

  .page-header .text-h5 {
    font-size: 1.2rem !important;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  /* Small Tablet View */
  /* Toolbar adjustments */
  .q-toolbar {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
    padding: 12px !important;
  }

  .q-toolbar .text-h5 {
    font-size: 1.3rem !important;
    text-align: center !important;
  }

  .q-toolbar .q-btn {
    width: 100% !important;
    margin: 0 !important;
  }

  /* Card sections */
  .q-card-section {
    padding: 12px !important;
  }

  /* Row adjustments */
  .row.q-col-gutter-sm,
  .row.q-col-gutter-md {
    flex-direction: column !important;
    gap: 12px !important;
  }

  .row.q-col-gutter-sm > *,
  .row.q-col-gutter-md > * {
    width: 100% !important;
    margin: 0 !important;
  }

  /* Input adjustments */
  .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .q-select {
    width: 100% !important;
    min-width: 0 !important;
  }

  /* Button adjustments */
  .q-btn {
    width: 100% !important;
    min-height: 44px !important;
  }

  /* Text adjustments */
  .text-h5 {
    font-size: 1.3rem !important;
  }

  .text-h6 {
    font-size: 1.2rem !important;
  }
}

@media (min-width: 901px) and (max-width: 1200px) {
  /* Large Tablet View */
  /* Toolbar adjustments */
  .q-toolbar {
    flex-direction: row !important;
    align-items: center !important;
    gap: 16px !important;
  }

  .q-toolbar .text-h5 {
    font-size: 1.4rem !important;
  }

  .q-toolbar .q-btn {
    min-width: 120px !important;
  }

  /* Row adjustments */
  .row.q-col-gutter-sm,
  .row.q-col-gutter-md {
    flex-direction: row !important;
    gap: 16px !important;
  }

  .row.q-col-gutter-sm > .col,
  .row.q-col-gutter-md > .col {
    flex: 1 !important;
  }

  .row.q-col-gutter-sm > .col-auto,
  .row.q-col-gutter-md > .col-auto {
    flex: 0 0 auto !important;
  }

  /* Input adjustments */
  .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .q-select {
    width: 100% !important;
    min-width: 0 !important;
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
}

@media (min-width: 1201px) {
  /* Desktop View */
  /* Toolbar adjustments */
  .q-toolbar {
    flex-direction: row !important;
    align-items: center !important;
    gap: 16px !important;
  }

  .q-toolbar .text-h5 {
    font-size: 1.5rem !important;
  }

  .q-toolbar .q-btn {
    min-width: 120px !important;
  }

  /* Row adjustments */
  .row.q-col-gutter-sm,
  .row.q-col-gutter-md {
    flex-direction: row !important;
    gap: 16px !important;
  }

  .row.q-col-gutter-sm > .col,
  .row.q-col-gutter-md > .col {
    flex: 1 !important;
  }

  .row.q-col-gutter-sm > .col-auto,
  .row.q-col-gutter-md > .col-auto {
    flex: 0 0 auto !important;
  }

  /* Input adjustments */
  .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .q-select {
    width: 100% !important;
    min-width: 0 !important;
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

  /* Ensure proper spacing in all views */
  .q-col-gutter-sm > * {
    margin-bottom: 8px !important;
  }

  .q-col-gutter-md > * {
    margin-bottom: 12px !important;
  }
}

/* Ensure proper spacing in all views */
.q-col-gutter-sm > * {
  margin-bottom: 8px !important;
}

.q-col-gutter-md > * {
  margin-bottom: 12px !important;
}

/* Card responsive improvements */
@media (max-width: 600px) {
  .q-card {
    margin: 4px !important;
  }

  .q-card-section {
    padding: 12px !important;
  }

  /* Make form inputs full width on mobile */
  .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }

  .q-select {
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

/* Toolbar responsive improvements */
@media (max-width: 600px) {
  .q-toolbar {
    padding: 8px !important;
  }

  .q-toolbar .q-btn {
    padding: 8px 16px !important;
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

/* Welcome user styling */
.welcome-user {
  font-size: 1.2em;
  font-weight: bold;
  color: #1976d2;
  text-align: center;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
}
</style>
