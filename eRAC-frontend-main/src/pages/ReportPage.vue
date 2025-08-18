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
              option-label="name" />
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
    <q-dialog v-model="SACBModal.show" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-layout view="lHh Lpr lFf" class="sacb-layout">

        <!-- Header -->
        <q-header elevated class="bg-white text-dark sacb-header">
          <q-toolbar class="q-px-md">
            <q-btn flat icon="menu" @click="toggleSACBDrawer" class="q-mr-md"
              :color="sacbDrawerOpen ? '#187C19' : '#666'" size="md">
              <q-tooltip>Toggle Settings Panel</q-tooltip>
            </q-btn>

            <q-toolbar-title class="text-h6 text-weight-medium" style="color: #187C19;">
              Status of Appropriation and Obligation (SACB)
            </q-toolbar-title>

            <q-space />

            <!-- Action Buttons -->
            <div class="q-gutter-sm">
              <q-btn outline icon="file_download" label="Export PDF" color="#69B31E" @click="exportSACBToPDF" size="sm"
                no-caps />

              <q-btn unelevated icon="print" label="Print" color="#187C19" @click="handleSACBPrint" size="sm" no-caps />

              <q-btn flat icon="close" @click="closeSACBModal" color="#666" size="md">
                <q-tooltip>Close</q-tooltip>
              </q-btn>
            </div>
          </q-toolbar>
        </q-header>

        <!-- Left Drawer for Report Signatories -->
        <q-drawer v-model="sacbDrawerOpen" side="left" bordered :width="350" :breakpoint="768" :show-if-above="false"
          class="bg-grey-1 sacb-drawer">
          <div class="drawer-content-sacb">
            <q-scroll-area class="drawer-scrollable-content">
              <div class="q-pa-lg drawer-content">
                <!-- Drawer Header -->
                <div class="drawer-header q-mb-lg">
                  <div class="text-h6 q-mb-sm" style="color: #187C19;">
                    <q-icon name="edit" class="q-mr-sm" />
                    Report Setup
                  </div>
                  <div class="text-caption" style="color: #666;">
                    Configure report signatories and settings
                  </div>
                </div>

                <!-- Report Information -->
                <q-card flat bordered class="q-mb-lg info-card">
                  <q-card-section class="q-pb-sm">
                    <div class="text-subtitle2 text-weight-medium q-mb-sm" style="color: #187C19;">
                      <q-icon name="info" class="q-mr-xs" />
                      Report Information
                    </div>
                    <div class="info-item">
                      <span class="info-label">Barangay:</span>
                      <span class="info-value">{{ authStore.user?.barangay_name }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Date Range:</span>
                      <span class="info-value">{{ getSACBDateRangeDisplay() }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Report Type:</span>
                      <span class="info-value">SACB</span>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Signatories Setup -->
                <q-card flat bordered class="signatories-card">
                  <q-card-section>
                    <div class="text-subtitle2 text-weight-medium q-mb-md" style="color: #187C19;">
                      <q-icon name="people" class="q-mr-xs" />
                      Report Signatories
                    </div>

                    <!-- Prepared by -->
                    <div class="signatory-group q-mb-lg">
                      <div class="signatory-header">
                        <q-icon name="create" size="sm" style="color: #69B31E;" class="q-mr-xs" />
                        <span class="text-weight-medium">Prepared by</span>
                      </div>
                      <q-input outlined dense v-model="SetupModal.Preparedby" placeholder="Enter full name"
                        class="q-mb-sm" clearable />
                      <q-select outlined dense :options="reportStore.positionsOptions" map-options option-label="label"
                        option-value="value" v-model="SetupModal.Preparedposition" placeholder="Select position"
                        clearable />
                    </div>

                    <!-- Noted by -->
                    <div class="signatory-group q-mb-lg">
                      <div class="signatory-header">
                        <q-icon name="visibility" size="sm" style="color: #E0FFE7;" class="q-mr-xs" />
                        <span class="text-weight-medium">Noted by</span>
                      </div>
                      <q-input outlined dense v-model="SetupModal.Notedby" placeholder="Enter full name" class="q-mb-sm"
                        clearable />
                      <q-select outlined dense :options="reportStore.positionsOptions" map-options option-label="label"
                        option-value="value" v-model="SetupModal.Notedposition" placeholder="Select position"
                        clearable />
                    </div>

                    <!-- Certified by -->
                    <div class="signatory-group q-mb-md">
                      <div class="signatory-header">
                        <q-icon name="verified" size="sm" style="color: #187C19;" class="q-mr-xs" />
                        <span class="text-weight-medium">Certified by</span>
                      </div>
                      <q-input outlined dense v-model="SetupModal.Certifiedby" placeholder="Enter full name"
                        class="q-mb-sm" clearable />
                      <q-select outlined dense :options="reportStore.positionsOptions" map-options option-label="label"
                        option-value="value" v-model="SetupModal.Certifiedposition" placeholder="Select position"
                        clearable />
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Quick Actions -->
                <q-card flat bordered class="q-mt-lg">
                  <q-card-section>
                    <div class="text-subtitle2 text-weight-medium q-mb-md" style="color: #187C19;">
                      <q-icon name="flash_on" class="q-mr-xs" />
                      Quick Actions
                    </div>
                    <div class="q-gutter-sm">
                      <q-btn outline size="sm" icon="refresh" label="Reset Form" color="#E0FFE7"
                        @click="resetSignatories" class="full-width" />
                      <q-btn outline size="sm" icon="save" label="Save as Template" color="#69B31E"
                        @click="saveAsTemplate" class="full-width" />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </q-scroll-area>
          </div>
        </q-drawer>

        <!-- Main Content Area -->
        <q-page-container style="background: #f5f5f5;">
          <div class="print-content-wrapper q-pa-md">
            <q-card class="print-modal" id="sacb-print-content">
              <q-card-section class="q-pb-none">
                <div class="text-h5 text-center text-weight-bold q-mb-sm" style="color: #187C19;">
                  Status of Appropriation and Obligation (SACB)
                </div>
                <div class="text-h6 text-center text-weight-medium" style="color: #187C19;">
                  Barangay {{ authStore.user?.barangay_name }}
                </div>
                <div class="text-subtitle1 text-center q-mb-lg" style="color: #666;">
                  Period: {{ getSACBDateRangeDisplay() }}
                </div>
              </q-card-section>

              <q-card-section>
                <!-- SACB Table with improved styling -->
                <q-table :rows="computedSACBRows" :columns="sacbColumns" row-key="ppa" flat bordered dense
                  separator="cell" class="sacb-table" hide-pagination :pagination="{ rowsPerPage: 0 }">
                  <template v-slot:body="props">
                    <!-- Section Header -->
                    <tr v-if="props.row.isSection">
                      <td :colspan="sacbColumns.length" class="text-bold text-left bg-grey-3">
                        {{ props.row.ppa }}
                      </td>
                    </tr>

                    <!-- Total Row -->
                    <tr v-else-if="props.row.isTotal">
                      <td class="text-right text-bold">TOTAL</td>
                      <td class="text-right text-bold">{{ props.row.appropriation }}</td>
                      <td class="text-right text-bold">{{ props.row.obligation }}</td>
                      <td class="text-right text-bold">{{ props.row.balance }}</td>
                    </tr>

                    <!-- Regular Row -->
                    <tr v-else>
                      <td class="text-left">{{ props.row.ppa }}</td>
                      <td class="text-right">{{ props.row.appropriation }}</td>
                      <td class="text-right">{{ props.row.obligation }}</td>
                      <td class="text-right">{{ props.row.balance }}</td>
                    </tr>


                  </template>
                </q-table>


                <!-- Report Summary Section -->
                <div class="report-summary q-mt-xl">
                  <div class="row q-col-gutter-lg">
                    <div class="col-12 col-md-6">
                      <q-card flat bordered class="summary-card">
                        <q-card-section>
                          <div class="text-subtitle2 text-weight-medium q-mb-sm">
                            <q-icon name="assessment" class="q-mr-xs" />
                            Summary Statistics
                          </div>
                          <div class="summary-stats">
                            <div class="stat-item">
                              <span class="stat-label">Total Appropriation:</span>
                              <span class="stat-value">₱{{ totalAppropriation }}</span>
                            </div>
                            <div class="stat-item">
                              <span class="stat-label">Total Obligation:</span>
                              <span class="stat-value">₱{{ totalObligation }}</span>
                            </div>
                            <div class="stat-item">
                              <span class="stat-label">Remaining Balance:</span>
                              <span class="stat-value">₱{{ totalBalance }}</span>
                            </div>
                          </div>
                        </q-card-section>
                      </q-card>
                    </div>
                    <div class="col-12 col-md-6">
                      <q-card flat bordered class="summary-card">
                        <q-card-section>
                          <div class="text-subtitle2 text-weight-medium q-mb-sm">
                            <q-icon name="draw" class="q-mr-xs" />
                            Signature Block
                          </div>
                          <div class="signature-block">
                            <div class="signature-line">
                              <div class="signature-name">{{ SetupModal.Preparedby || '_________________________' }}
                              </div>
                              <div class="signature-position">{{ SetupModal.Preparedposition?.label || 'Position' }}
                              </div>
                              <div class="signature-label">Prepared by</div>
                            </div>
                            <div class="signature-line">
                              <div class="signature-name">{{ SetupModal.Notedby || '_________________________' }}</div>
                              <div class="signature-position">{{ SetupModal.Notedposition?.label || 'Position' }}</div>
                              <div class="signature-label">Noted by</div>
                            </div>
                            <div class="signature-line">
                              <div class="signature-name">{{ SetupModal.Certifiedby || '_________________________' }}
                              </div>
                              <div class="signature-position">{{ SetupModal.Certifiedposition?.label || 'Position' }}
                              </div>
                              <div class="signature-label">Certified by</div>
                            </div>
                          </div>
                        </q-card-section>
                      </q-card>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-page-container>
      </q-layout>
    </q-dialog>

    <!-- RAC Modal -->
    <q-dialog v-model="RACModal.show" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-layout view="lHh Lpr lFf" class="rac-layout">

        <!-- Header -->
        <q-header elevated class="bg-white text-dark rac-header">
          <q-toolbar class="q-px-md">
            <q-toolbar-title class="text-h6 text-weight-medium" style="color: #187C19;">
              {{ RACModal.reportType }}
            </q-toolbar-title>

            <q-space />

            <!-- Action Buttons -->
            <div class="q-gutter-sm">
              <q-btn outline icon="file_download" label="Export PDF" color="#69B31E" @click="exportToPDF" size="sm"
                no-caps />

              <q-btn unelevated icon="print" label="Print" color="#187C19" @click="handleRACPrint" size="sm" no-caps />

              <q-btn flat icon="close" @click="closeRACModal" color="#666" size="md">
                <q-tooltip>Close</q-tooltip>
              </q-btn>
            </div>
          </q-toolbar>
        </q-header>

        <!-- Main Content Area -->
        <q-page-container style="background: #f5f5f5;">
          <div class="print-content-wrapper q-pa-md">
            <q-card class="print-modal" id="rac-print-content">
              <q-card-section class="q-pb-none">
                <div class="text-h5 text-center text-weight-bold q-mb-sm" style="color: #187C19;">
                  {{ RACModal.reportType }}
                </div>
                <div class="text-h6 text-center text-weight-medium" style="color: #187C19;">
                  Barangay {{ authStore.user?.barangay_name }}
                </div>
                <div class="text-subtitle1 text-center q-mb-lg" style="color: #666;">
                  Date: {{ dateRangeDisplay }}
                </div>
                <div class="text-subtitle1 text-center q-mb-lg" style="color: #666;">
                  Expense Class: {{ reportStore.expenseRacSelected?.name }}
                </div>
              </q-card-section>

              <q-card-section>
                <!-- RAC Table with improved styling -->
                <q-table :rows="reportStore.reportRAC" :columns="reportStore.racColumn" row-key="dvNumber" flat bordered
                  dense separator="cell" class="rac-table q-mt-md" hide-pagination :pagination="{ rowsPerPage: 0 }">
                  <!-- Custom two-row header -->
                  <template v-slot:header>
                    <q-tr>
                      <q-th rowspan="2" style="width:25%;">Account Title</q-th>
                      <q-th rowspan="2" style="width:12%;" class="text-right">Appropriation</q-th>
                      <q-th colspan="5" class="text-center" style="width:55%;">Obligation</q-th>
                    </q-tr>
                    <q-tr>
                      <q-th style="width:15%;">Particular</q-th>
                      <q-th style="width:15%;">DV#</q-th>
                      <q-th style="width:10%;">Date</q-th>
                      <q-th style="width:15%;">Payee</q-th>
                      <q-th style="width:15%;" class="text-right">Amount</q-th>
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
                      <q-td colspan="4" class="text-right text-bold">Total Obligation</q-td>
                      <q-td class="text-right text-bold">
                        {{reportStore.reportRAC.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}}
                      </q-td>
                    </q-tr>
                  </template>
                </q-table>

                <!-- Report Summary Section -->
                <div class="report-summary q-mt-xl">
                  <div class="row q-col-gutter-lg">
                    <div class="col-12 col-md-6">
                      <q-card flat bordered class="summary-card">
                        <q-card-section>
                          <div class="text-subtitle2 text-weight-medium q-mb-sm">
                            <q-icon name="assessment" class="q-mr-xs" />
                            Summary Statistics
                          </div>
                          <div class="summary-stats">
                            <div class="stat-item">
                              <span class="stat-label">Total Appropriation:</span>
                              <span class="stat-value">₱{{reportStore.reportRAC.reduce((sum, r) => sum +
                                r.appropriation,
                                0).toLocaleString()}}</span>
                            </div>
                            <div class="stat-item">
                              <span class="stat-label">Total Obligation:</span>
                              <span class="stat-value">₱{{reportStore.reportRAC.reduce((sum, r) => sum + r.amount,
                                0).toLocaleString()}}</span>
                            </div>
                            <div class="stat-item">
                              <span class="stat-label">Remaining Balance:</span>
                              <span class="stat-value">₱{{(reportStore.reportRAC.reduce((sum, r) => sum +
                                r.appropriation,
                                0) - reportStore.reportRAC.reduce((sum, r) => sum + r.amount,
                                  0)).toLocaleString()}}</span>
                            </div>
                          </div>
                        </q-card-section>
                      </q-card>
                    </div>
                    <div class="col-12 col-md-6">
                      <q-card flat bordered class="summary-card">
                        <q-card-section>
                          <div class="text-subtitle2 text-weight-medium q-mb-sm">
                            <q-icon name="info" class="q-mr-xs" />
                            Report Information
                          </div>
                          <div class="summary-stats">
                            <div class="stat-item">
                              <span class="stat-label">Report Type:</span>
                              <span class="stat-value">RAC</span>
                            </div>
                            <div class="stat-item">
                              <span class="stat-label">Total Records:</span>
                              <span class="stat-value">{{ reportStore.reportRAC.length }}</span>
                            </div>
                            <div class="stat-item">
                              <span class="stat-label">Generated Date:</span>
                              <span class="stat-value">{{ new Date().toLocaleDateString() }}</span>
                            </div>
                          </div>
                        </q-card-section>
                      </q-card>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-page-container>
      </q-layout>
    </q-dialog>
  </q-page>
</template>
<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import SetupDialog from 'components/SetupDialog.vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { useReportStore } from 'stores/reportStore'

const computedSACBRows = computed(() => {
  const result = [];
  let sectionItems = [];

  reportStore.reportSACB.forEach((row, index) => {
    if (row.isSection) {
      // If sectionItems has data, push a total before starting new section
      if (sectionItems.length) {
        result.push(makeTotalRow(sectionItems));
        sectionItems = [];
      }
      result.push(row); // push the section header
    } else {
      result.push(row);
      sectionItems.push(row);
    }

    // Last row check
    if (index === reportStore.reportSACB.length - 1 && sectionItems.length) {
      result.push(makeTotalRow(sectionItems));
    }
  });

  return result;
});

function makeTotalRow(items) {
  const sum = (field) =>
    items.reduce((acc, item) => acc + parseFloat(item[field].replace(/,/g, '')), 0);

  return {
    isTotal: true,
    ppa: 'TOTAL',
    appropriation: sum('appropriation').toLocaleString('en-US', { minimumFractionDigits: 2 }),
    obligation: sum('obligation').toLocaleString('en-US', { minimumFractionDigits: 2 }),
    balance: sum('balance').toLocaleString('en-US', { minimumFractionDigits: 2 }),
  };
}

const totalAppropriation = computed(() => {
  return reportStore.reportSACB
    .filter(row => !row.isSection) // skip section headers
    .reduce((sum, row) => {
      return sum + parseFloat(row.appropriation.replace(/,/g, ''));
    }, 0)
    .toLocaleString('en-US', { minimumFractionDigits: 2 });
});

const totalObligation = computed(() => {
  return reportStore.reportSACB
    .filter(row => !row.isSection)
    .reduce((sum, row) => sum + parseFloat(row.obligation.replace(/,/g, '')), 0)
    .toLocaleString('en-US', { minimumFractionDigits: 2 });
});

const totalBalance = computed(() => {
  return reportStore.reportSACB
    .filter(row => !row.isSection)
    .reduce((sum, row) => sum + parseFloat(row.balance.replace(/,/g, '')), 0)
    .toLocaleString('en-US', { minimumFractionDigits: 2 });
});


// stores & composables
const $q = useQuasar()
const reportStore = useReportStore()
const authStore = useAuthStore()

/* -------------------- STATE -------------------- */
const showSetupDialog = ref(false)
const loading = ref(false)
const exportingPDF = ref(false)
const exportingSACBPDF = ref(false)
const sacbDrawerOpen = ref(true)

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
  
  loadSacbReport();
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
const sacbColumns = computed(() => [
  { name: 'ppa', label: 'Account Title', field: 'ppa', align: 'left', sortable: true },
  { name: 'appropriation', label: 'Appropriation', field: 'appropriation', align: 'right', sortable: true, format: val => val?.toLocaleString() },
  { name: 'obligation', label: 'Obligation', field: 'obligation', align: 'right', sortable: true, format: val => val?.toLocaleString() },
  { name: 'balance', label: 'Balance', field: 'balance', align: 'right', sortable: true, format: val => val?.toLocaleString() }
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
  try {
    await reportStore.fetchRacReport($date)
  } catch (error) {
    console.error(error)
    this.$q.notify({
      type: 'negative',
      message: 'Failed to generate RAC Report',
    })
  }
}

async function loadSacbReport() {
  try {
    await reportStore.fetchSacbReport(getSACBDateRangeDisplay())
  } catch (error) {
    console.error(error)
    this.$q.notify({
      type: 'negative',
      message: 'Failed to generate SACB Report',
    })
  }
}

async function exportToPDF() {
  exportingPDF.value = true
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).default;
  try {

    const element = document.querySelector('#rac-print-content')

    if (!element) {
      $q.notify({
        type: 'negative',
        message: 'No RAC content found to export!',
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


    pdf.save('rac-report.pdf')

    $q.notify({
      type: 'positive',
      message: 'RAC PDF Exported Successfully!',
    })
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: 'Failed to export PDF',
    })
  } finally {
    exportingPDF.value = false
  }
}

async function exportSACBToPDF() {
  exportingSACBPDF.value = true
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).default;
  try {

    const element = document.querySelector('#sacb-print-content')

    if (!element) {
      $q.notify({
        type: 'negative',
        message: 'No SACB content found to export!',
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

    pdf.save('sacb-report.pdf')

    $q.notify({
      type: 'positive',
      message: 'SACB PDF Exported Successfully!',
    })
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: 'Failed to export SACB PDF',
    })
  } finally {
    exportingSACBPDF.value = false
  }
}

function getSACBDateRangeDisplay() {
  // Determine which SACB date range to use based on which modal was opened
  const currentDisplay = currentSacbDateRangeDisplay.value
  const continuingDisplay = continuingSacbDateRangeDisplay.value

  // Return the one that has data, prioritizing current
  if (currentDisplay) return currentDisplay
  if (continuingDisplay) return continuingDisplay
  return 'No date range selected'
}

function toggleSACBDrawer() {
  sacbDrawerOpen.value = !sacbDrawerOpen.value
}

function resetSignatories() {
  SetupModal.Preparedby = ''
  SetupModal.Preparedposition = null
  SetupModal.Notedby = ''
  SetupModal.Notedposition = null
  SetupModal.Certifiedby = ''
  SetupModal.Certifiedposition = null

  notifySuccess('Signatory fields have been reset')
}

function saveAsTemplate() {
  // This could save to localStorage or send to backend
  const template = {
    preparedBy: SetupModal.Preparedby,
    preparedPosition: SetupModal.Preparedposition,
    notedBy: SetupModal.Notedby,
    notedPosition: SetupModal.Notedposition,
    certifiedBy: SetupModal.Certifiedby,
    certifiedPosition: SetupModal.Certifiedposition
  }

  localStorage.setItem('sacbSignatoryTemplate', JSON.stringify(template))
  notifySuccess('Signatory template saved successfully')
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
  color: #187C19;
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
  box-shadow: 0 6px 25px rgba(24, 124, 25, 0.12);
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
  width: min(100%, 310mm);
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
  padding: 60px;
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
  box-shadow: 0 2px 8px rgba(24, 124, 25, 0.1);
}

.calend-icon {
  cursor: pointer;
  transition: color 0.3s ease;
}

.calend-icon:hover {
  color: #187C19;
}

/* Input and button enhancements */
.q-input,
.q-select {
  background-color: white;
  transition: all 0.3s ease;
}

.q-input:hover,
.q-select:hover {
  box-shadow: 0 2px 8px rgba(24, 124, 25, 0.1);
}

.q-btn {
  transition: all 0.3s ease;
  font-weight: 500;
}

.q-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 124, 25, 0.15);
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

.small-table-font td {
  font-size: 12px;
}

.small-table-font th {
  font-size: 14px;
}

/* Enhanced SACB Modal Styles */
.sacb-layout {
  height: 100vh;
  background-color: #f5f5f5;
}

.sacb-header {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 2000;
}

.sacb-header .q-toolbar {
  min-height: 64px;
  padding: 8px 16px;
}

.sacb-drawer {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* Drawer Content Structure */
.drawer-content-sacb {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.drawer-header {
  flex-shrink: 0;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px;
  background-color: white;
}

.drawer-scrollable-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Drawer Styles */
.drawer-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}

.info-card {
  background: linear-gradient(135deg, #E0FFE7 0%, #69B31E 100%);
  border: 1px solid #187C19;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: #666;
  font-size: 0.85em;
}

.info-value {
  font-weight: 600;
  color: #187C19;
  font-size: 0.9em;
  text-align: right;
  flex: 1;
  margin-left: 8px;
}

.signatories-card {
  background-color: white;
  border: 1px solid #e0e0e0;
}

.signatory-group {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.signatory-group:hover {
  background-color: #E0FFE7;
  border-color: #187C19;
  box-shadow: 0 2px 8px rgba(24, 124, 25, 0.1);
}

.signatory-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

/* Print Content Wrapper - Natural Scrolling */
.print-content-wrapper {
  max-width: 210mm;
  /* A4 width */
  margin: 0 auto;
  padding: 20px;
}

.print-content-wrapper .print-modal {
  background-color: white;
  box-shadow: 0 4px 20px rgba(24, 124, 25, 0.1);
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: visible;
  transform: none;
  margin: 0;
  padding: 32px;
  min-height: auto;
}

/* Enhanced Header Styling */
.sacb-layout .q-toolbar {
  padding: 12px 24px;
}

.sacb-layout .q-toolbar-title {
  font-size: 1.2em;
  font-weight: 600;
}

/* Enhanced Button Styling in Header */
.sacb-layout .q-btn {
  transition: all 0.3s ease;
  font-weight: 500;
}

.sacb-layout .q-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 124, 25, 0.15);
}

/* SACB Table Styles */
.sacb-table {
  border: 2px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.sacb-table .q-table__top,
.sacb-table .q-table__bottom {
  background-color: #f8f9fa;
}

.sacb-table th {
  background-color: #e9ecef;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.sacb-table td {
  border-bottom: 1px solid #dee2e6;
}

.sacb-table tr:nth-child(even) {
  background-color: #f8f9fa;
}

.sacb-table tr:hover {
  background-color: #E0FFE7;
}

/* Enhanced table header styling for SACB */
.sacb-table .q-table thead tr:first-child th {
  background: linear-gradient(135deg, #187C19 0%, #0E780E 100%);
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.sacb-table .q-table thead tr:last-child th {
  background: linear-gradient(135deg, #69B31E 0%, #187C19 100%);
  color: white;
  font-weight: 500;
}

/* Report Summary Styles */
.report-summary {
  margin-top: 32px;
}

.summary-card {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.summary-card:hover {
  box-shadow: 0 4px 20px rgba(24, 124, 25, 0.08);
  transform: translateY(-2px);
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-weight: 500;
  color: #424242;
}

.stat-value {
  font-weight: 600;
  color: #187C19;
  font-size: 1.1em;
}

/* Signature Block Styles */
.signature-block {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.signature-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.signature-line:hover {
  background-color: #E0FFE7;
  border-color: #187C19;
  box-shadow: 0 2px 8px rgba(24, 124, 25, 0.1);
}

.signature-name {
  font-weight: 600;
  font-size: 1em;
  color: #187C19;
  margin-bottom: 4px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 4px;
  min-height: 20px;
  width: 100%;
}

.signature-position {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 8px;
  font-style: italic;
}

.signature-label {
  font-size: 0.8em;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* RAC Layout Styles */
.rac-layout {
  height: 100vh;
  background-color: #f5f5f5;
}

.rac-header {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 2000;
}

.rac-header .q-toolbar {
  min-height: 64px;
  padding: 8px 16px;
}

.rac-table {
  border: 2px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.rac-table .q-table__top,
.rac-table .q-table__bottom {
  background-color: #f8f9fa;
}

.rac-table th {
  background-color: #e9ecef;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.rac-table td {
  border-bottom: 1px solid #dee2e6;
}

.rac-table tr:nth-child(even) {
  background-color: #f8f9fa;
}

.rac-table tr:hover {
  background-color: #E0FFE7;
}

/* Enhanced table header styling for RAC */
.rac-table .q-table thead tr:first-child th {
  background: linear-gradient(135deg, #187C19 0%, #0E780E 100%);
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.rac-table .q-table thead tr:last-child th {
  background: linear-gradient(135deg, #69B31E 0%, #187C19 100%);
  color: white;
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .sacb-drawer {
    width: 300px !important;
  }

  .drawer-header {
    padding: 16px 0;
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
  }

  .sacb-header .q-toolbar {
    min-height: 56px;
    padding: 4px 8px;
  }

  .rac-header .q-toolbar {
    min-height: 56px;
    padding: 4px 8px;
  }

  .sacb-header .q-toolbar-title,
  .rac-header .q-toolbar-title {
    font-size: 1rem;
  }
}

@media (max-width: 600px) {
  .sacb-drawer {
    width: 280px !important;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .info-value {
    text-align: left;
    margin-left: 0;
  }

  .signatory-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .print-content-wrapper {
    padding: 5px;
  }

  .print-content-wrapper .print-modal {
    padding: 12px;
  }

  .sacb-header .q-toolbar-title,
  .rac-header .q-toolbar-title {
    font-size: 0.9rem;
  }
}
</style>
