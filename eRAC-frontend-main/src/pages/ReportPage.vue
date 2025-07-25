<template>
  <q-page class="q-pa-lg report-page">
    <q-toolbar class="q-pr-md items-center" style="display: flex; flex-direction: row;">
      <div class="text-h5 text-weight-bold">Current Year Reports</div>
      <q-space />
      <q-btn flat square dense style="background-color: #589b16;" color="white" icon="settings" @click="openSetupDialog">
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
                    <q-date v-model="racDateFrom" mask="DD/MM/YYYY" />
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
            <q-btn color="secondary" icon="print" label="Print" />
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
            <q-btn color="secondary" icon="print" label="Print" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card-section> </q-card-section>

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
            <q-btn color="secondary" icon="print" label="Print" />
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
            <q-btn color="secondary" icon="print" label="Print" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import SetupDialog from 'components/SetupDialog.vue'

export default {
  name: 'FinancialDashboard',
  components: {
    SetupDialog
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
    }
  },
  methods: {
    openSetupDialog() {
      this.showSetupDialog = true
    }
  }
}
</script>

<style scoped>
.report-page {
  background-color: #D9D9D9; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
}
</style>
