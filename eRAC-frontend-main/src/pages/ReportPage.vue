<template>
  <q-page class="q-pa-lg report-page">
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
            <q-input
              outlined
              dense
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

          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              outlined
              dense
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

          <div class="col-12 col-sm-6 col-md-4">
            <q-select
              outlined
              dense
              v-model="expenseCategoryCurrent"
              label="Expense Category"
              :options="expenseOptionsCurrent"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-btn
              color="primary"
              icon="settings"
              label="Generate Report"
              class="full-width"
              @click="openPrintModal('current-rac')"
            />
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
            <q-input
              outlined
              dense
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

          <div class="col-12 col-sm-6 col-md-4">
            <q-input
              outlined
              dense
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

          <div class="col-12 col-sm-12 col-md-4">
            <q-btn
              color="primary"
              icon="settings"
              label="Generate Report"
              class="full-width"
              @click="openPrintModal('current-sacb')"
            />
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
            <q-input
              outlined
              dense
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

          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              outlined
              dense
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

          <div class="col-12 col-sm-6 col-md-4">
            <q-select
              outlined
              dense
              v-model="expenseCategoryCont"
              label="Expense Category"
              :options="expenseOptionsCont"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-btn
              color="primary"
              icon="settings"
              label="Generate Report"
              class="full-width"
              @click="openPrintModal('continuing-rac')"
            />
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
            <q-input
              outlined
              dense
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

          <div class="col-12 col-sm-6 col-md-4">
            <q-input
              outlined
              dense
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

          <div class="col-12 col-sm-12 col-md-4">
            <q-btn
              color="primary"
              icon="settings"
              label="Generate Report"
              class="full-width"
              style="width: 100px;"
              @click="openPrintModal('continuing-sacb')"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
    
    <!-- SACB Modal -->
    <q-dialog v-model="printModal.show" persistent>
      <q-card class="print-modal">
        <q-card-section class="q-pb-none">
          <div class="text-h6">
            Report Type: {{ printModal.reportType }}</div>
        </q-card-section>
        
        <q-card-section class="q-pb-none">
          <div class="text-h6">Print Report Setup</div>
        </q-card-section>

        <q-card-section>
          <q-input
            outlined
            dense
            v-model="SetupModal.selectedBarangay.barangay_name"
            label="Barangay"
            readonly
            class="q-mb-md"
          />

          <q-input
            outlined
            dense
            label="Prepared by"
            v-model="SetupModal.Preparedby"
            class="q-mb-md"
          />

          <q-select
            outlined
            dense
            :options="positionOptions"
            v-model="SetupModal.Preparedposition"
            label="Position"
            class="q-mb-md"
          />

          <q-input
            outlined
            dense
            v-model="SetupModal.Notedby"
            label="Noted by"
            class="q-mb-md"
          />

          <q-select
            outlined
            dense
            v-model="SetupModal.Notedposition"
            :options="positionOptions"
            label="Position"
            class="q-mb-md"
          />

          <q-input
            outlined
            dense
            v-model="SetupModal.Certifiedby"
            label="Certified by"
            class="q-mb-md"
          />

          <q-select
            outlined
            dense
            v-model="SetupModal.Certifiedposition"
            :options="positionOptions"
            label="Position"
          />
        </q-card-section>
        <q-card-section>
          <div class="row justify-between q-gutter-sm q-mb-md">
            <div class="row q-gutter-sm">
              <q-btn
                outline
                label="Load Reports"
                color="orange"
              />
              <q-btn
                outline
                label="Export Reports"
                color="green"
              />
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="text-subtitle2 q-mb-md text-grey-7">
            Report Type: {{ printModal.reportType }}
          </div>

          <div class="q-mt-md">
            <div class="text-subtitle1 q-mb-sm">Activity Log</div>
            <q-table
              :rows="printModal.activities"
              :columns="activityColumns"
              row-key="id"
              :pagination="{ rowsPerPage: 5 }"
              flat
              bordered
            >
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
          <q-btn flat label="Cancel" color="grey-7" @click="closePrintModal" />
          <q-btn
            unelevated
            label="Print"
            color="primary"
            @click="handlePrint"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    
    <!-- RAC Modal -->
     
    <q-dialog v-model="printModal.show" persistent>
      <q-card class="print-modal">
        <q-card-section class="q-pb-none">
          <div class="text-h6">
            Report Type: {{ printModal.reportType }}</div>
        </q-card-section>
        
        <q-card-section class="q-pb-none">
          <div class="text-h6">Print Report Setup</div>
        </q-card-section>

        <q-card-section>
          <q-input
            outlined
            dense
            v-model="SetupModal.selectedBarangay.barangay_name"
            label="Barangay"
            readonly
            class="q-mb-md"
          />

          <q-input
            outlined
            dense
            label="Prepared by"
            v-model="SetupModal.Preparedby"
            class="q-mb-md"
          />

          <q-select
            outlined
            dense
            :options="positionOptions"
            v-model="SetupModal.Preparedposition"
            label="Position"
            class="q-mb-md"
          />

          <q-input
            outlined
            dense
            v-model="SetupModal.Notedby"
            label="Noted by"
            class="q-mb-md"
          />

          <q-select
            outlined
            dense
            v-model="SetupModal.Notedposition"
            :options="positionOptions"
            label="Position"
            class="q-mb-md"
          />

          <q-input
            outlined
            dense
            v-model="SetupModal.Certifiedby"
            label="Certified by"
            class="q-mb-md"
          />

          <q-select
            outlined
            dense
            v-model="SetupModal.Certifiedposition"
            :options="positionOptions"
            label="Position"
          />
        </q-card-section>
        <q-card-section>
          <div class="row justify-between q-gutter-sm q-mb-md">
            <div class="row q-gutter-sm">
              <q-btn
                outline
                label="Load Reports"
                color="orange"
              />
              <q-btn
                outline
                label="Export Reports"
                color="green"
              />
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="text-subtitle2 q-mb-md text-grey-7">
            Report Type: {{ printModal.reportType }}
          </div>

          <div class="q-mt-md">
            <div class="text-subtitle1 q-mb-sm">Activity Log</div>
            <q-table
              :rows="printModal.activities"
              :columns="activityColumns"
              row-key="id"
              :pagination="{ rowsPerPage: 5 }"
              flat
              bordered
            >
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
          <q-btn flat label="Cancel" color="grey-7" @click="closePrintModal" />
          <q-btn
            unelevated
            label="Print"
            color="primary"
            @click="handlePrint"
          />
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
      printModal: {
        show: false,
        reportType: '',
        activities: [
          {
            id: 1,
            time: '09:30 AM',
            description: 'Report generated successfully'
          },
          {
            id: 2,
            time: '09:25 AM',
            description: 'Data validation completed'
          },
          {
            id: 3,
            time: '09:20 AM',
            description: 'Report parameters configured'
          },
          {
            id: 4,
            time: '09:15 AM',
            description: 'Print dialog opened'
          }
        ]
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
    OpenSetupModal() {
      this.SetupModal.selectedBarangay.barangay_name = this.authStore.user?.barangay_name || ''
      this.SetupModal.show = true
    },
    closeSetupModal() {
      this.SetupModal.show = false
    },
    async saveSetupModal() {
      try {
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
        this.positionOptions = [
          { label: 'Punong Barangay', value: 'Punong Barangay' },
          { label: 'Barangay Secretary', value: 'Barangay Secretary' },
          { label: 'Barangay Treasurer', value: 'Barangay Treasurer' },
          { label: 'Barangay Councilor', value: 'Barangay Councilor' }
        ]
      }
    },
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
      console.log('Printing report:', this.printModal.reportType)
      this.closePrintModal()
      this.$q.notify({
        type: 'positive',
        message: 'Report sent to printer successfully!',
        position: 'top'
      })
    }
  },
  computed: {
    activityColumns() {
      return [
        {
          name: 'time',
          label: 'Time',
          field: 'time',
          align: 'left',
          sortable: true,
          style: 'width: 120px'
        },
        {
          name: 'description',
          label: 'Activity Description',
          field: 'description',
          align: 'left',
          sortable: true
        }
      ]
    }
  },
  async mounted() {
    await this.loadPositionOptions()
  }
}
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
  min-width: 700px;
  max-width: 800px;
  border-radius: 12px;
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
}.q-input{
  background-color: white;
}
</style>
