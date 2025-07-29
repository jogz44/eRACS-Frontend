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
</style>
