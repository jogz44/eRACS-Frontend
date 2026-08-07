<template>
  <q-page class="q-pa-lg report-page">
    <!-- Main Header with bottom border -->
    <div class="dashboard-card q-mb-xs">
      <div class="section-header row items-center justify-between q-mb-xs">
        <div class="section-title col-12 col-md-8">Current Year Reports</div>
        <!-- Year Filter Section -->

        <div class="col-12 col-md-4">
          <div class="year-filter-section">
            <div class="row items-center justify-end q-gutter-sm">
              <div class="text-subtitle2 text-weight-medium">Year Filter:</div>
              <q-select
                v-model="reportStore.selectedYear"
                :options="reportStore.availableYears"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                dense
                outlined
                style="min-width: 120px"
                @update:model-value="onYearChange"
              >
                <template v-slot:prepend>
                  <q-icon name="calendar_today" />
                </template>
              </q-select>

              <q-btn icon="refresh" color="primary" flat dense size="sm" @click="refreshYears">
                <q-tooltip>Refresh available years</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SetupDialog v-model="showSetupDialog" />

    <div class="row q-col-gutter-md q-px-md">
      <div class="col-12">
        <q-card flat bordered class="q-mb-sm filters-section">
          <q-card-section>
            <div class="row q-col-gutter-xs items-center justify-between">
              <div class="col-4 col-md-4 justify-start">
                <div class="text-subtitle1 text-weight-medium">List of Advice</div>
                <div class="text-caption text-grey-6">History of generated PBC advices</div>
              </div>

              <div class="row col-8 justify-end q-gutter-sm">
                <div class="col-12 col-md-4">
                  <q-input outlined dense v-model="searchQuery" placeholder="Search..." clearable>
                    <template v-slot:append><q-icon name="search" /></template>
                  </q-input>
                </div>

                <div class="col-12 col-md-1 justify-center">
                  <q-btn
                    dense
                    outlined
                    color="red-10"
                    icon="clear"
                    no-caps
                    @click="clearAllFilters"
                    class="full-width"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered>
          <q-table
            flat
            :rows="filteredPbcAdviceList"
            :columns="pbcAdviceColumns"
            row-key="id"
            :pagination="{ rowsPerPage: 5 }"
            no-data-label="No PBC advice generated yet"
          >
            <template v-slot:body-cell-pbcDate="props">
              <q-td :props="props">{{ formatFullDate(props.row.pbcDate) }}</q-td>
            </template>
            <template v-slot:body-cell-pbcDateRange="props">
              <q-td :props="props">
                {{ formatDateRange(props.row.from) }} - {{ formatDateRange(props.row.to) }}
              </q-td>
            </template>

            <template v-slot:body-cell-amount="props">
              <q-td :props="props" class="text-right">₱{{ formatCurrency(props.row.amount) }}</q-td>
            </template>

            <template v-slot:body-cell-action="props">
              <q-td :props="props" class="text-right">
                <!-- <q-btn
                  icon="visibility"
                  color="primary"
                  flat
                  dense
                  round
                  size="sm"
                  :loading="viewingAdvice && loading"
                  @click="viewPbcAdvice(props.row)"
                > -->
                <q-btn
                  dense
                  outlined
                  color="green"
                  label="Preview"
                  no-caps
                  :loading="previewAdviceLoading"
                  @click="viewPbcAdvice(props.row)"
                  class="q-pl-sm q-pr-sm"
                >
                  <q-tooltip>View / Preview</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>
    </div>

    <!-- Current Year Reports Card -->
    <div class="row q-col-gutter-md q-pa-md">
      <!-- RAC Card -->
      <div class="col-12 col-md-6">
        <q-card class="report-card" flat bordered>
          <q-card-section class="q-pb-none q-pt-lg">
            <div class="subsection-title">Registry of Appropriation and Commitment (RAC)</div>
          </q-card-section>

          <q-card-section class="q-pt-md q-pb-lg">
            <div class="col q-col-gutter-sm items-end">
              <div class="col-12 col-sm-6 col-md-4">
                <!-- <q-input bg-color="white" outlined dense :model-value="dateRangeDisplay" label="Date Range"
                  class="custom-date-range" clearable @clear="onDateRangeClear" readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="calend-icon">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="CurrentRacDateRange" range @update:model-value="onDateRangeChange" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input> -->
                <q-input
                  v-model="CurrentRacDateRange.from"
                  filled
                  type="date"
                  hint="From Date"
                  @update:model-value="changeMonth"
                />
                <br />
                <q-input v-model="CurrentRacDateRange.to" filled type="date" hint="To Date" />
                <br />
              </div>

              <div class="col-12 col-sm-6 col-md-4">
                <q-select
                  outlined
                  dense
                  v-model="expenseSelectedCurrent"
                  label="Expense Category"
                  :options="reportStore.expenseOptionsCurrent"
                  map-options
                  option-label="name"
                  option-value="id"
                  :loading="initialDataLoading"
                />
              </div>

              <div class="col-12 col-sm-6 col-md-4">
                <q-btn
                  color="primary"
                  icon="settings"
                  label="Generate Report"
                  class="full-width"
                  @click="openRACModal('current-rac')"
                  :loading="generatingRacReportLoading"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- PBC Card -->
      <div class="col-12 col-md-6">
        <q-card class="report-card" flat bordered>
          <q-card-section class="q-pb-none q-pt-lg">
            <div class="subsection-title">Punong Barangay Certification (PBC)</div>
          </q-card-section>

          <q-card-section class="q-pt-md q-pb-lg">
            <div class="col q-col-gutter-sm items-end">
              <div class="col-12 col-sm-6 col-md-6">
                <q-input
                  v-model="pbcDateRange.from"
                  filled
                  type="date"
                  hint="From Date"
                  @update:model-value="(v) => onPbcDateChange('from', v)"
                />
                <br />
                <q-input
                  v-model="pbcDateRange.to"
                  filled
                  type="date"
                  hint="To Date"
                  @update:model-value="(v) => onPbcDateChange('to', v)"
                />
                <br />
              </div>
              <div class="col-12 col-sm-6 col-md-4">
                <q-select
                  outlined
                  dense
                  v-model="bankSelectedPBC"
                  label="Select Bank"
                  :options="reportStore.bankOptions"
                  map-options
                  emit-value
                  option-label="name"
                  option-value="id"
                  :loading="initialDataLoading"
                />
              </div>

              <div class="col-12 col-sm-6 col-md-4">
                <q-btn
                  color="primary"
                  icon="settings"
                  label="Generate Report"
                  class="full-width"
                  @click="openPBCModal"
                  :loading="generatingPbcReportLoading"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-pa-md">
      <!-- SACB Card -->
      <div class="col-12 col-md-6">
        <q-card class="report-card" flat bordered>
          <q-card-section class="q-pb-none q-pt-lg">
            <div class="subsection-title">Status of Appropriation and Obligation (SACB)</div>
          </q-card-section>

          <q-card-section class="q-pt-md q-pb-lg">
            <div class="col q-col-gutter-sm items-end">
              <div class="col-12 col-sm-6 col-md-6">
                <!-- <q-input
                  bg-color="white"
                  outlined
                  dense
                  :model-value="currentSacbDateRangeDisplay"
                  label="Date Range"
                  class="custom-date-range"
                  clearable
                  @clear="onCurrentSacbDateRangeClear"
                  readonly
                >
                  <template v-slot:append>
                    <q-icon name="event" class="calend-icon">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date
                          v-model="currentSacbDateRange"
                          range
                          @update:model-value="onCurrentSacbDateRangeChange"
                        />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input> -->

                <q-input
                  v-model="currentSacbDateRange.from"
                  filled
                  type="date"
                  hint="From Date"
                  @update:model-value="(v) => onDateChange('from', v)"
                />
                <br />
                <q-input
                  v-model="currentSacbDateRange.to"
                  filled
                  type="date"
                  hint="To Date"
                  @update:model-value="(v) => onDateChange('to', v)"
                />
                <br />
              </div>

              <div class="col-12 col-sm-6 col-md-6">
                <q-btn
                  color="primary"
                  icon="settings"
                  label="Generate Report"
                  class="full-width"
                  @click="openSACBModal('current-sacb')"
                  :loading="generatingSacbReportLoading"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Transmittal Card -->
      <div class="col-12 col-md-6">
        <q-card class="transmittal-card" flat bordered>
          <q-card-section class="q-pb-none q-pt-lg">
            <div class="subsection-title">Transmittal</div>
          </q-card-section>

          <q-card-section class="q-pt-md q-pb-lg">
            <div class="col q-col-gutter-md items-end">
              <div class="col-12 col-sm-6 col-md-4">
                <q-select
                  outlined
                  dense
                  v-model="transmittalMonthSelected"
                  label="Select Month"
                  :options="monthOptions"
                  map-options
                  emit-value
                  option-label="label"
                  option-value="value"
                  :loading="initialDataLoading"
                />
              </div>

              <div class="col-12 col-sm-6 col-md-4">
                <q-btn
                  color="primary"
                  icon="settings"
                  label="Generate Report"
                  class="full-width"
                  @click="openTransmittalModal"
                  :loading="generatingTransmittalLoading"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- SACB Modal -->
    <q-dialog
      v-model="SACBModal.show"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-layout view="lHh Lpr lFf" class="sacb-layout">
        <!-- Header -->
        <q-header elevated class="bg-white text-dark sacb-header">
          <q-toolbar class="q-px-md">
            <q-btn
              flat
              icon="menu"
              @click="toggleSACBDrawer"
              class="q-mr-md"
              :color="sacbDrawerOpen ? '#187C19' : '#666'"
              size="md"
            >
              <q-tooltip>Toggle Settings Panel</q-tooltip>
            </q-btn>

            <q-toolbar-title class="text-h6 text-weight-medium" style="color: #187c19">
              Status of Appropriation and Obligation (SACB)
            </q-toolbar-title>

            <q-space />

            <!-- Action Buttons -->
            <div class="q-gutter-sm">
              <q-btn
                outline
                icon="file_download"
                label="Export PDF"
                color="#69B31E"
                @click="exportSACBToPDF"
                v-permission="'print'"
                size="sm"
                no-caps
              />

              <q-btn
                unelevated
                icon="print"
                label="Print"
                color="#187C19"
                @click="handleSACBPrint"
                v-permission="'print'"
                size="sm"
                no-caps
              />

              <q-btn flat icon="close" @click="closeSACBModal" color="#666" size="md">
                <q-tooltip>Close</q-tooltip>
              </q-btn>
            </div>
          </q-toolbar>
        </q-header>

        <!-- Left Drawer for Report Signatories -->
        <q-drawer
          v-model="sacbDrawerOpen"
          side="left"
          bordered
          :width="350"
          :breakpoint="768"
          :show-if-above="false"
          class="bg-grey-1 sacb-drawer"
        >
          <div class="drawer-content-sacb">
            <q-scroll-area class="drawer-scrollable-content">
              <div class="q-pa-lg drawer-content">
                <!-- Drawer Header -->
                <div class="drawer-header q-mb-lg">
                  <div class="text-h6 q-mb-sm" style="color: #187c19">
                    <q-icon name="edit" class="q-mr-sm" />
                    Report Setup
                  </div>
                  <div class="text-caption" style="color: #666">
                    Configure report signatories and settings
                  </div>
                </div>

                <!-- Report Information -->
                <q-card flat bordered class="q-mb-lg info-card">
                  <q-card-section class="q-pb-sm">
                    <div class="text-subtitle2 text-weight-medium q-mb-sm" style="color: #187c19">
                      <q-icon name="info" class="q-mr-xs" />
                      Report Information
                    </div>
                    <div class="info-item">
                      <span class="info-label">Barangay:</span>
                      <span class="info-value">{{ authStore.user?.barangay_name }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Date Range:</span>
                      <span class="info-value"
                        >{{ formatFullDate(currentSacbDateRange.from) }} -
                        {{ formatFullDate(currentSacbDateRange.to) }}</span
                      >
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
                    <div class="text-subtitle2 text-weight-medium q-mb-md" style="color: #187c19">
                      <q-icon name="people" class="q-mr-xs" />
                      Report Signatories
                    </div>

                    <!-- Prepared by -->
                    <div class="signatory-group q-mb-lg">
                      <div class="signatory-header">
                        <q-icon name="create" size="sm" style="color: #69b31e" class="q-mr-xs" />
                        <span class="text-weight-medium">Prepared by</span>
                      </div>
                      <q-input
                        outlined
                        dense
                        v-model="SetupModal.Preparedby"
                        placeholder="Enter full name"
                        class="q-mb-sm"
                        clearable
                      />
                      <q-select
                        outlined
                        dense
                        :options="reportStore.positionsOptions"
                        map-options
                        option-label="label"
                        option-value="value"
                        v-model="SetupModal.Preparedposition"
                        placeholder="Select position"
                        clearable
                      />
                    </div>

                    <!-- Noted by -->
                    <div class="signatory-group q-mb-lg">
                      <div class="signatory-header">
                        <q-icon
                          name="visibility"
                          size="sm"
                          style="color: #e0ffe7"
                          class="q-mr-xs"
                        />
                        <span class="text-weight-medium">Noted by</span>
                      </div>
                      <q-input
                        outlined
                        dense
                        v-model="SetupModal.Notedby"
                        placeholder="Enter full name"
                        class="q-mb-sm"
                        clearable
                      />
                      <q-select
                        outlined
                        dense
                        :options="reportStore.positionsOptions"
                        map-options
                        option-label="label"
                        option-value="value"
                        v-model="SetupModal.Notedposition"
                        placeholder="Select position"
                        clearable
                      />
                    </div>

                    <!-- Certified by -->
                    <div class="signatory-group q-mb-md">
                      <div class="signatory-header">
                        <q-icon name="verified" size="sm" style="color: #187c19" class="q-mr-xs" />
                        <span class="text-weight-medium">Certified by</span>
                      </div>
                      <q-input
                        outlined
                        dense
                        v-model="SetupModal.Certifiedby"
                        placeholder="Enter full name"
                        class="q-mb-sm"
                        clearable
                      />
                      <q-select
                        outlined
                        dense
                        :options="reportStore.positionsOptions"
                        map-options
                        option-label="label"
                        option-value="value"
                        v-model="SetupModal.Certifiedposition"
                        placeholder="Select position"
                        clearable
                      />
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Quick Actions -->
                <q-card flat bordered class="q-mt-lg">
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
                        color="#E0FFE7"
                        @click="resetSignatories"
                        class="full-width"
                      />
                      <q-btn
                        outline
                        size="sm"
                        icon="save"
                        label="Save as Template"
                        color="#69B31E"
                        @click="saveAsTemplate"
                        class="full-width"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </q-scroll-area>
          </div>
        </q-drawer>

        <!-- Main Content Area -->
        <q-page-container style="background: #f5f5f5">
          <div class="print-content-wrapper q-pa-md">
            <q-card class="print-modal" id="sacb-print-content">
              <q-card-section class="q-pb-none">
                <div class="text-h5 text-center text-weight-bold q-mb-sm" style="color: #187c19">
                  Status of Appropriation and Obligation (SACB)
                </div>
                <div class="text-h6 text-center text-weight-medium" style="color: #187c19">
                  Barangay {{ authStore.user?.barangay_name }}
                </div>
                <div class="text-subtitle1 text-center q-mb-lg" style="color: #666">
                  Period: {{ formatFullDate(currentSacbDateRange.from) }} -
                  {{ formatFullDate(currentSacbDateRange.to) }}
                </div>
              </q-card-section>

              <q-card-section>
                <!-- SACB Table with hierarchical totals -->
                <div class="financial-report-table">
                  <div class="table-header">
                    <div class="header-row">
                      <div class="col-description">PROGRAM / PROJECT / ACTIVITY</div>
                      <div class="col-appropriation">APPROPRIATION</div>
                      <div class="col-obligation">OBLIGATION</div>
                      <div class="col-balance">BALANCE</div>
                    </div>
                  </div>

                  <div class="table-body">
                    <template v-for="(row, index) in reportStore.reportSACB" :key="index">
                      <!-- Section Header (Main Category like "1. PERSONAL SERVICES") -->
                      <div v-if="row.isSection" class="main-section">
                        <div class="main-section-header">
                          <div class="col-description">
                            <span class="main-section-title">{{ row.ppa }}</span>
                          </div>
                          <div class="col-appropriation text-right">
                            <span class="main-section-total">{{
                              row.appropriation ? formatCurrency(row.appropriation) : ''
                            }}</span>
                          </div>
                          <div class="col-obligation text-right">
                            <span class="main-section-total">{{
                              row.obligation ? formatCurrency(row.obligation) : ''
                            }}</span>
                          </div>
                          <div class="col-balance text-right">
                            <span class="main-section-total">{{
                              row.balance ? formatCurrency(row.balance) : ''
                            }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Sub-category (like "Honorarium", "Other Personnel Benefits") -->
                      <div v-else-if="row.isType" class="subcategory-row">
                        <div class="col-description">
                          <span class="subcategory-indent">></span>
                          <span class="subcategory-text">{{ row.ppa }}</span>
                        </div>
                        <div class="col-appropriation text-right">
                          {{ row.appropriation ? formatCurrency(row.appropriation) : '' }}
                        </div>
                        <div class="col-obligation text-right">
                          {{ row.obligation ? formatCurrency(row.obligation) : '' }}
                        </div>
                        <div class="col-balance text-right">
                          {{ row.balance ? formatCurrency(row.balance) : '' }}
                        </div>
                      </div>

                      <!-- Sub-sub-category (like "Monetization of Leave Credits", "Productivity Enhancement Incentive") -->
                      <div v-else-if="row.isItem" class="subsubcategory-row">
                        <div class="col-description">
                          <span class="subsubcategory-indent">></span>
                          <span class="subsubcategory-text">{{ row.ppa }}</span>
                        </div>
                        <div class="col-appropriation text-right">
                          {{ row.appropriation ? formatCurrency(row.appropriation) : '' }}
                        </div>
                        <div class="col-obligation text-right">
                          {{ row.obligation ? formatCurrency(row.obligation) : '' }}
                        </div>
                        <div class="col-balance text-right">
                          {{ row.balance ? formatCurrency(row.balance) : '' }}
                        </div>
                      </div>

                      <!-- Sub-sub-sub-category (like individual sub-items) -->
                      <div v-else-if="row.isSubItem" class="subsubsubcategory-row">
                        <div class="col-description">
                          <span class="subsubsubcategory-indent">></span>
                          <span class="subsubsubcategory-text">{{ row.ppa }}</span>
                        </div>
                        <div class="amount-group">
                          <div class="col-appropriation text-right">
                            {{ row.appropriation ? formatCurrency(row.appropriation) : '' }}
                          </div>
                          <div class="col-obligation text-right">
                            {{ row.obligation ? formatCurrency(row.obligation) : '' }}
                          </div>
                          <div class="col-balance text-right">
                            {{ row.balance ? formatCurrency(row.balance) : '' }}
                          </div>
                        </div>
                      </div>

                      <!-- Total Row -->
                      <div v-else-if="row.isTotal" class="total-row">
                        <div class="col-description text-right text-bold">TOTAL</div>
                        <div class="col-appropriation text-right text-bold">
                          {{ row.appropriation ? formatCurrency(row.appropriation) : '' }}
                        </div>
                        <div class="col-obligation text-right text-bold">
                          {{ row.obligation ? formatCurrency(row.obligation) : '' }}
                        </div>
                        <div class="col-balance text-right text-bold">
                          {{ row.balance ? formatCurrency(row.balance) : '' }}
                        </div>
                      </div>
                    </template>

                    <!-- No data message -->
                    <div
                      v-if="!reportStore.reportSACB || reportStore.reportSACB.length === 0"
                      class="no-data-message"
                    >
                      <div class="col-description">No SACB data available</div>
                      <div class="col-appropriation"></div>
                      <div class="col-obligation"></div>
                      <div class="col-balance"></div>
                    </div>
                  </div>
                </div>

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
                              <div class="signature-name">
                                {{ SetupModal.Preparedby || '_________________________' }}
                              </div>
                              <div class="signature-position">
                                {{ SetupModal.Preparedposition?.label || 'Position' }}
                              </div>
                              <div class="signature-label">Prepared by</div>
                            </div>
                            <div class="signature-line">
                              <div class="signature-name">
                                {{ SetupModal.Notedby || '_________________________' }}
                              </div>
                              <div class="signature-position">
                                {{ SetupModal.Notedposition?.label || 'Position' }}
                              </div>
                              <div class="signature-label">Noted by</div>
                            </div>
                            <div class="signature-line">
                              <div class="signature-name">
                                {{ SetupModal.Certifiedby || '_________________________' }}
                              </div>
                              <div class="signature-position">
                                {{ SetupModal.Certifiedposition?.label || 'Position' }}
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
    <q-dialog
      v-model="RACModal.show"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-layout view="lHh Lpr lFf" class="rac-layout">
        <!-- Header -->
        <q-header elevated class="bg-white text-dark rac-header">
          <q-toolbar class="q-px-md">
            <q-toolbar-title class="text-h6 text-weight-medium" style="color: #187c19">
              {{ RACModal.reportType }}
            </q-toolbar-title>

            <q-space />

            <!-- Action Buttons -->
            <div class="q-gutter-sm">
              <q-btn
                outline
                icon="file_download"
                label="Export PDF"
                color="#69B31E"
                @click="exportToPDF"
                v-permission="'print'"
                size="sm"
                no-caps
              />

              <q-btn
                outline
                icon="table_view"
                label="Export Excel"
                color="#69B31E"
                @click="exportToExcel"
                v-permission="'print'"
                size="sm"
                no-caps
              />

              <!-- <q-btn
                unelevated
                icon="print"
                label="Print"
                color="#187C19"
                @click="handleRACPrint"
                size="sm"
                no-caps
              /> -->

              <q-btn flat icon="close" @click="closeRACModal" color="#666" size="md">
                <q-tooltip>Close</q-tooltip>
              </q-btn>
            </div>
          </q-toolbar>
        </q-header>

        <!-- Main Content Area -->
        <q-page-container style="background: #f5f5f5">
          <div class="print-content-wrapper q-pa-md">
            <q-card class="print-modal" id="rac-print-content">
              <q-card-section class="q-pb-none">
                <div
                  class="row items-center justify-between text-h6 text-weight-bold"
                  style="color: #187c19"
                >
                  <span>{{ RACModal.reportType }}</span>
                  <span class="stat-label text-h10"
                    >Generated Date: {{ new Date().toLocaleDateString() }}</span
                  >
                </div>
                <div class="text-h6 text-weight-medium" style="color: #187c19">
                  Barangay {{ authStore.user?.barangay_name }}
                  <span class="text-subtitle1 text-center" style="color: #666"> </span>
                </div>

                <div></div>
              </q-card-section>

              <q-card-section>
                <!-- Updated RAC Table to match preview table layout -->
                <div class="preview-table-container">
                  <!-- Header matching preview table style -->
                  <!-- Table with preview layout structure -->
                  <table
                    v-if="reportStore.reportRAC && reportStore.reportRAC.length > 0"
                    class="preview-table"
                    :data-columns="dynamicColumnsCount"
                  >
                    <thead>
                      <!-- First header row with expense class and obligation -->

                      <tr class="header-row-main">
                        <th :colspan="5 + dynamicColumnsCount" class="col-expense-class">
                          {{ reportStore.expenseRacSelected?.name || 'Not Selected' }}
                        </th>
                      </tr>
                      <tr class="header-row-main">
                        <th colspan="5" class="col-expense-class">OBLIGATION</th>
                        <th
                          v-if="hasDynamicColumns"
                          :colspan="dynamicColumnsCount"
                          class="col-obligation-header"
                        >
                          ACCOUNT TITLE
                        </th>
                        <th v-else :colspan="1" class="col-obligation-header">ACCOUNT TITLE</th>
                      </tr>
                      <!-- Second header row with individual column names -->
                      <tr class="header-row">
                        <th class="col-date">Date</th>
                        <th class="col-particulars">Particulars</th>
                        <th class="col-dv">DV#</th>
                        <th class="col-payee">Payee</th>
                        <th class="col-appropriation">Appropriation</th>
                        <!-- Dynamic Account Title Columns -->
                        <th
                          v-for="accountTitle in reportStore.dynamicAccountColumns"
                          :key="accountTitle"
                          class="col-account-title"
                        >
                          {{ accountTitle }}
                        </th>
                        <!-- Fallback when no dynamic columns -->
                        <th v-if="!hasDynamicColumns" class="col-account-title">
                          No Account Titles Found
                        </th>
                      </tr>

                      <!-- <tr class="header-row-main">
                        <th :colspan="5 + dynamicColumnsCount" style="background-color: whitesmoke"></th>
                      </tr> -->
                    </thead>
                    <tbody>
                      <tr
                        v-for="(row, index) in reportStore.reportRAC"
                        :key="index"
                        class="data-row"
                      >
                        <td class="col-date">{{ row.date || '' }}</td>
                        <td class="col-particulars">{{ row.particular || '' }}</td>
                        <td class="col-dv">{{ row.dvNumber || '' }}</td>
                        <td class="col-payee">{{ row.payee || '' }}</td>
                        <td class="col-appropriation text-right">
                          {{ (row.appropriation || 0).toLocaleString() }}
                        </td>
                        <!-- Dynamic Account Title Cells -->
                        <td
                          v-for="accountTitle in reportStore.dynamicAccountColumns"
                          :key="accountTitle"
                          class="col-account-title text-right"
                        >
                          {{
                            row[reportStore.accountTitleKeyMap[accountTitle]]
                              ? row[reportStore.accountTitleKeyMap[accountTitle]].toLocaleString()
                              : ''
                          }}
                        </td>
                        <!-- Fallback when no dynamic columns -->
                        <td v-if="!hasDynamicColumns" class="col-account-title text-right">-</td>
                      </tr>
                      <!-- Total row -->
                      <tr class="total-row">
                        <td class="col-date"></td>
                        <td class="col-particulars font-weight-bold">Total Appropriation</td>
                        <td class="col-dv"></td>
                        <td class="col-payee"></td>
                        <td class="col-appropriation text-right font-weight-bold">
                          {{
                            reportStore.reportRAC
                              .reduce((sum, r) => sum + (r.appropriation || 0), 0)
                              .toLocaleString()
                          }}
                        </td>
                        <!-- Dynamic Account Title Total Cells -->
                        <td
                          v-for="accountTitle in reportStore.dynamicAccountColumns"
                          :key="accountTitle"
                          class="col-account-title text-right font-weight-bold"
                        >
                          {{
                            reportStore.reportRAC
                              .reduce(
                                (sum, r) =>
                                  sum + (r[reportStore.accountTitleKeyMap[accountTitle]] || 0),
                                0,
                              )
                              .toLocaleString()
                          }}
                        </td>
                        <!-- Fallback when no dynamic columns -->
                        <td
                          v-if="!hasDynamicColumns"
                          class="col-account-title text-right font-weight-bold"
                        >
                          -
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- No data message -->
                  <div v-else class="q-pa-lg text-center text-grey-6">
                    <q-icon name="info" size="48px" class="q-mb-md" />
                    <div class="text-h6">No RAC data available</div>
                    <div class="text-body2">
                      Please select a date range and expense category to generate the report.
                    </div>
                  </div>
                </div>

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
                              <span class="stat-value"
                                >₱{{
                                  reportStore.reportRAC
                                    .reduce((sum, r) => sum + (r.appropriation || 0), 0)
                                    .toLocaleString()
                                }}</span
                              >
                            </div>
                            <div class="stat-item">
                              <span class="stat-label">Total Obligation:</span>
                              <span class="stat-value"
                                >₱{{
                                  reportStore.reportRAC
                                    .reduce((sum, r) => sum + (r.amount || 0), 0)
                                    .toLocaleString()
                                }}</span
                              >
                            </div>
                            <div class="stat-item">
                              <span class="stat-label">Remaining Balance:</span>
                              <span class="stat-value"
                                >₱{{
                                  (
                                    reportStore.reportRAC.reduce(
                                      (sum, r) => sum + (r.appropriation || 0),
                                      0,
                                    ) -
                                    reportStore.reportRAC.reduce(
                                      (sum, r) => sum + (r.amount || 0),
                                      0,
                                    )
                                  ).toLocaleString()
                                }}</span
                              >
                            </div>
                            <!-- Dynamic Account Title Totals -->
                            <!-- <div v-for="accountTitle in reportStore.dynamicAccountColumns"
                                 :key="accountTitle"
                                 class="stat-item">
                              <span class="stat-label">Total {{ accountTitle }}:</span>
                              <span class="stat-value">₱{{reportStore.reportRAC.reduce((sum, r) =>
                                 sum + (r[`amount_${accountTitle.replace(/\s+/g, '_').toLowerCase()}`] || 0), 0).toLocaleString()}}</span>
                            </div> -->
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
                              <span class="stat-value">{{
                                reportStore.reportRAC ? reportStore.reportRAC.length : 0
                              }}</span>
                            </div>

                            <div class="stat-item">
                              <span class="stat-label">Date Range:</span>
                              <span class="stat-value">
                                {{ dateRangeDisplay || 'No date range selected' }}</span
                              >
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

    <!-- Transmittal Modal -->
    <q-dialog
      v-model="transmittalModal.show"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-layout view="lHh Lpr lFf" class="sacb-layout">
        <!-- Header -->
        <q-header elevated class="bg-white text-dark sacb-header">
          <q-toolbar class="q-px-md">
            <q-btn
              flat
              icon="menu"
              @click="toggleSACBDrawer"
              class="q-mr-md"
              :color="sacbDrawerOpen ? '#187C19' : '#666'"
              size="md"
            >
              <q-tooltip>Toggle Settings Panel</q-tooltip>
            </q-btn>

            <q-toolbar-title class="text-h6 text-weight-medium" style="color: #187c19">
              Transmittal Letter
            </q-toolbar-title>

            <q-space />

            <!-- Action Buttons -->
            <div class="q-gutter-sm">
              <q-btn
                outline
                icon="file_download"
                label="Export PDF"
                color="#69B31E"
                @click="exportTransmittalToPDF"
                v-permission="'print'"
                size="sm"
                no-caps
              />

              <!-- <q-btn
                unelevated
                icon="print"
                label="Print"
                color="#187C19"
                @click="handleSACBPrint"
                v-permission="'print'"
                size="sm"
                no-caps
              /> -->

              <q-btn flat icon="close" @click="closeTransmittalModal" color="#666" size="md">
                <q-tooltip>Close</q-tooltip>
              </q-btn>
            </div>
          </q-toolbar>
        </q-header>

        <!-- Left Drawer for Report Signatories -->
        <q-drawer
          v-model="sacbDrawerOpen"
          side="left"
          bordered
          :width="350"
          :breakpoint="768"
          :show-if-above="false"
          class="bg-grey-1 sacb-drawer"
        >
          <div class="drawer-content-sacb">
            <q-scroll-area class="drawer-scrollable-content">
              <div class="q-pa-lg drawer-content">
                <!-- Drawer Header -->
                <div class="drawer-header q-mb-lg">
                  <div class="text-h6 q-mb-sm" style="color: #187c19">
                    <q-icon name="edit" class="q-mr-sm" />
                    Transmittal Letter Setup
                  </div>
                  <div class="text-caption" style="color: #666">
                    Configure transmittal signatories
                  </div>
                </div>

                <!-- Report Information -->
                <q-card flat bordered class="q-mb-lg info-card">
                  <q-card-section class="q-pb-sm">
                    <div class="text-subtitle2 text-weight-medium q-mb-sm" style="color: #187c19">
                      <q-icon name="info" class="q-mr-xs" />
                      Report Information
                    </div>
                    <div class="info-item">
                      <span class="info-label">Barangay:</span>
                      <span class="info-value">{{ authStore.user?.barangay_name }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Date Range:</span>
                      <span class="info-value">
                        {{ formatFullDate(currentSacbDateRange.from) }} -
                        {{ formatFullDate(currentSacbDateRange.to) }}</span
                      >
                    </div>
                    <div class="info-item">
                      <span class="info-label">Report Type:</span>
                      <span class="info-value">Transmittal</span>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Signatories Setup -->
                <q-card flat bordered class="signatories-card">
                  <q-card-section>
                    <div class="text-subtitle2 text-weight-medium q-mb-md" style="color: #187c19">
                      <q-icon name="people" class="q-mr-xs" />
                      Signatories
                    </div>

                    <!-- Prepared by -->
                    <div class="signatory-group q-mb-lg">
                      <div class="signatory-header">
                        <q-icon name="send" size="sm" style="color: #69b31e" class="q-mr-sm" />
                        <span class="text-weight-medium">Sent to</span>
                      </div>
                      <q-input
                        outlined
                        dense
                        v-model="transmittalModal.recipientName"
                        placeholder="Enter full name"
                        class="q-mb-sm"
                        clearable
                      />
                      <q-select
                        outlined
                        dense
                        :options="reportStore.positionsOptions"
                        map-options
                        option-label="label"
                        option-value="value"
                        v-model="transmittalModal.recipientPosition"
                        placeholder="Select position"
                        clearable
                      />
                    </div>

                    <!-- Noted by -->
                    <div class="signatory-group q-mb-lg">
                      <div class="signatory-header">
                        <q-icon name="create" size="sm" style="color: #69b31e" class="q-mr-xs" />
                        <span class="text-weight-medium">Noted by</span>
                      </div>
                      <q-input
                        outlined
                        dense
                        v-model="SetupModal.Notedby"
                        placeholder="Enter full name"
                        class="q-mb-sm"
                        clearable
                      />
                      <q-select
                        outlined
                        dense
                        :options="reportStore.positionsOptions"
                        map-options
                        option-label="label"
                        option-value="value"
                        v-model="SetupModal.Notedposition"
                        placeholder="Select position"
                        clearable
                      />
                    </div>

                    <!-- Certified by -->
                    <div class="signatory-group q-mb-md">
                      <div class="signatory-header">
                        <q-icon name="verified" size="sm" style="color: #187c19" class="q-mr-xs" />
                        <span class="text-weight-medium">Certified by</span>
                      </div>
                      <q-input
                        outlined
                        dense
                        v-model="SetupModal.Certifiedby"
                        placeholder="Enter full name"
                        class="q-mb-sm"
                        clearable
                      />
                      <q-select
                        outlined
                        dense
                        :options="reportStore.positionsOptions"
                        map-options
                        option-label="label"
                        option-value="value"
                        v-model="SetupModal.Certifiedposition"
                        placeholder="Select position"
                        clearable
                      />
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Quick Actions -->
                <q-card flat bordered class="q-mt-lg">
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
                        color="#E0FFE7"
                        @click="resetSignatories"
                        class="full-width"
                      />
                      <q-btn
                        outline
                        size="sm"
                        icon="save"
                        label="Save as Template"
                        color="#69B31E"
                        @click="saveAsTemplate"
                        class="full-width"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </q-scroll-area>
          </div>
        </q-drawer>

        <!-- Main Content Area -->
        <q-page-container>
          <div class="print-content-wrapper q-pa-md">
            <q-card class="print-modal transmittal-modal" id="transmittal-print-content">
              <q-card-section class="q-pb-none">
                <div class="annex-label">ANNEX "B"</div>

                <div class="text-center text-weight-bold text-uppercase transmittal-serif">
                  BARANGAY {{ authStore.user?.barangay_name }}
                </div>
                <div class="text-subtitle1 text-center q-mb-none transmittal-serif-body">
                  City of Tagum
                </div>
                <div class="text-subtitle1 text-center q-mb-sm transmittal-serif-body">
                  Province of Davao del Norte
                </div>

                <div class="text-center text-uppercase q-mb-lg q-mt-md after-body">
                  Transmittal Letter
                </div>

                <!-- TO / DATE row -->
                <div class="row justify-between items-start q-mb-lg" style="font-size: 14px">
                  <div>
                    <div class="row">
                      <div class="text-weight-bold">TO :</div>
                      <div class="text-weight-bold q-ml-lg">
                        {{ transmittalModal.recipientName || 'RECIPIENT NAME' }}
                      </div>
                    </div>
                    <div
                      class="text-caption text-weight-medium text-uppercase"
                      style="font-size: 11px; margin-left: 70px"
                    >
                      {{ transmittalModal.recipientPosition?.label || 'POSITION' }}
                    </div>
                  </div>
                  <div class="text-right">
                    {{
                      formatFullDate(transmittalModal.date || new Date().toISOString().slice(0, 10))
                    }}
                  </div>
                </div>

                <div class="text-weight-bold q-mb-sm text-uppercase" style="font-size: 14px">
                  Dear {{ transmittalModal.recipientName || "Recipient's Name" }}
                </div>

                <div class="q-mb-sm transmittal-body">
                  We submit herewith the following financial transaction documents and reports
                  covering the period of
                  <span class="text-weight-bold">{{
                    formatFullDate(transmittalModal.periodFrom)
                  }}</span>
                  -
                  <span class="text-weight-bold">{{
                    formatFullDate(transmittalModal.periodTo)
                  }}</span
                  >, to wit:
                </div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <!-- ===================== TABLE A: DV/PAYROLL ===================== -->
                <table class="transmittal-table-payroll">
                  <thead>
                    <tr>
                      <th colspan="2" class="text-left">A. DV/PAYROLL</th>
                      <th colspan="2">CHECK</th>
                      <th rowspan="2">PAYEE</th>
                      <th rowspan="2">AMOUNT</th>
                      <th colspan="2">PB CERTIFICATION</th>
                    </tr>
                    <tr>
                      <th>DATE</th>
                      <th>NO.</th>
                      <th>DATE</th>
                      <th>NO.</th>
                      <th>DATE</th>
                      <th>NO.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, index) in reportStore.reportTransmittal.dvRows" :key="index">
                      <td class="text-center">{{ row.dvDate }}</td>
                      <td class="text-center">{{ row.dvNo }}</td>
                      <td class="text-center">{{ row.checkDate }}</td>
                      <td class="text-center">{{ row.checkNo }}</td>
                      <td class="text-uppercase text-left">{{ row.payee }}</td>
                      <td class="text-right">{{ formatCurrency(row.amount) }}</td>
                      <td class="text-center">{{ row.pbDate }}</td>
                      <td class="text-center">{{ row.pbNo }}</td>
                    </tr>

                    <tr
                      v-if="
                        !reportStore.reportTransmittal.dvRows ||
                        reportStore.reportTransmittal.dvRows.length === 0
                      "
                    >
                      <td colspan="8" class="text-center text-grey-6">No records available</td>
                    </tr>

                    <tr class="transmittal-total-row">
                      <td colspan="5" class="text-right text-weight-bold" style="color: #a10909">
                        TOTAL
                      </td>
                      <td class="text-right text-weight-bold">
                        {{ formatCurrency(transmittalDvTotal) }}
                      </td>
                      <td colspan="2"></td>
                    </tr>
                  </tbody>
                </table>

                <!-- ===================== TABLE B: RCDs / RCRs ===================== -->
                <table class="transmittal-table">
                  <thead>
                    <tr>
                      <th colspan="4" class="details text-left">
                        B. RCDs and RCRs and the duplicate copies of the ORs issued
                      </th>
                    </tr>
                    <tr>
                      <th>RCD / RCR Number</th>
                      <th>Period Covered</th>
                      <th>Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, index) in reportStore.reportTransmittal.rcdRows" :key="index">
                      <td>{{ row.rcdNumber }}</td>
                      <td>{{ row.periodCovered }}</td>
                      <td>{{ row.date }}</td>
                      <td class="text-right">{{ formatCurrency(row.amount) }}</td>
                    </tr>
                    <!-- <tr v-if="!transmittalModal.rcdRows || transmittalModal.rcdRows.length === 0">
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr> -->

                    <tr
                      v-if="
                        !reportStore.reportTransmittal.rcdRows ||
                        reportStore.reportTransmittal.rcdRows.length === 0
                      "
                    >
                      <td colspan="8" class="text-center text-grey-6">No records available</td>
                    </tr>
                  </tbody>
                </table>

                <!-- ===================== TABLE C: Other Reports ===================== -->
                <table class="transmittal-table q-mb-xs">
                  <thead>
                    <tr>
                      <th colspan="2" class="details text-left">C. Other Reports</th>
                    </tr>
                    <tr>
                      <th>Type of Report</th>
                      <th>Period Covered</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, index) in reportStore.reportTransmittal.otherReports"
                      :key="index"
                    >
                      <td>{{ row.typeOfReport }}</td>
                      <td>{{ row.periodCovered }}</td>
                    </tr>
                    <tr
                      v-if="
                        !reportStore.reportTransmittal.otherReports ||
                        reportStore.reportTransmittal.otherReports.length === 0
                      "
                    >
                      <td colspan="8" class="text-center text-grey-6">No records available</td>
                    </tr>
                  </tbody>
                </table>

                <div class="q-mb-xl transmittal-bottom q-ml-xs">
                  Please acknowledge receipt hereof.
                </div>

                <!-- ===================== SIGNATURE BLOCK ===================== -->
                <div class="row justify-end q-mb-xl">
                  <div class="text-right" style="min-width: 260px">
                    <div class="q-mb-md text-left" style="font-size: 14px; font-weight: 500">
                      Very truly yours,
                    </div>
                    <div class="transmittal-signature-name text-center">
                      {{ SetupModal.Certifiedby }}
                    </div>
                    <div class="transmittal-signature-position text-center">
                      {{ SetupModal.Certifiedposition?.label || 'Position' }}
                    </div>
                  </div>
                </div>

                <div class="row justify-between">
                  <div style="min-width: 300px" class="q-ml-md">
                    <div class="q-mb-md" style="font-size: 14px; font-weight: 500">Noted by:</div>
                    <div class="transmittal-signature-name text-center">
                      {{ SetupModal.Notedby }}
                    </div>
                    <div class="transmittal-signature-position text-center">
                      {{ SetupModal.Notedposition?.label || 'Position' }}
                    </div>
                  </div>

                  <div class="text-center q-mr-md" style="min-width: 300px">
                    <div class="q-mb-md text-left" style="font-size: 14px; font-weight: 500">
                      Received by:
                    </div>
                    <div class="transmittal-signature-name">&nbsp;</div>
                    <div class="transmittal-signature-position">
                      Signature, Name and Designation
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-page-container>
      </q-layout>
    </q-dialog>

    <!-- PCB Modal -->
    <q-dialog
      v-model="PBCModal.show"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-layout view="lHh Lpr lFf" class="sacb-layout">
        <!-- Header -->
        <q-header elevated class="bg-white text-dark sacb-header">
          <q-toolbar class="q-px-md">
            <q-btn
              flat
              icon="menu"
              @click="toggleSACBDrawer"
              class="q-mr-md"
              :color="sacbDrawerOpen ? '#187C19' : '#666'"
              size="md"
            >
              <q-tooltip>Toggle Settings Panel</q-tooltip>
            </q-btn>

            <q-toolbar-title class="text-h6 text-weight-medium" style="color: #187c19">
              Punong Barangay Certification(PBC)
            </q-toolbar-title>

            <q-space />

            <!-- Action Buttons -->
            <div class="q-gutter-sm">
              <q-btn
                outline
                icon="file_download"
                label="Export PDF"
                color="#69B31E"
                @click="exportPBCToPDF"
                v-permission="'print'"
                size="sm"
                no-caps
              />
              <q-btn flat icon="close" @click="closePBCModal" color="#666" size="md">
                <q-tooltip>Close</q-tooltip>
              </q-btn>
            </div>
          </q-toolbar>
        </q-header>

        <!-- Left Drawer for Report Signatories -->
        <q-drawer
          v-model="sacbDrawerOpen"
          side="left"
          bordered
          :width="350"
          :breakpoint="768"
          :show-if-above="false"
          class="bg-grey-1 sacb-drawer"
        >
          <div class="drawer-content-sacb">
            <q-scroll-area class="drawer-scrollable-content">
              <div class="q-pa-lg drawer-content">
                <!-- Drawer Header -->
                <div class="drawer-header q-mb-lg">
                  <div class="text-h6 q-mb-sm" style="color: #187c19">
                    <q-icon name="edit" class="q-mr-sm" />
                    Report Setup
                  </div>
                  <div class="text-caption" style="color: #666">
                    Configure report signatories and settings
                  </div>
                </div>

                <!-- Report Information -->
                <q-card flat bordered class="q-mb-lg info-card">
                  <q-card-section class="q-pb-sm">
                    <div class="text-subtitle2 text-weight-medium q-mb-sm" style="color: #187c19">
                      <q-icon name="info" class="q-mr-xs" />
                      Certification Details
                    </div>
                    <q-input
                      outlined
                      dense
                      v-model="PBCModal.pbcNo"
                      label="PBC No."
                      class="q-mb-sm"
                    />
                    <q-input
                      outlined
                      dense
                      v-model="PBCModal.date"
                      type="date"
                      label="Date"
                      class="q-mb-sm"
                    />
                    <q-input
                      outlined
                      dense
                      v-model="PBCModal.recipient"
                      label="Recipient (e.g. The Bank Manager)"
                      class="q-mb-sm text-uppercase"
                    />
                    <q-input
                      outlined
                      dense
                      v-model="PBCModal.bankName"
                      label="Bank Name"
                      class="q-mb-sm"
                    />
                    <q-input
                      outlined
                      dense
                      v-model="PBCModal.bankBranch"
                      label="Branch"
                      class="q-mb-sm"
                    />
                    <q-input outlined dense v-model="PBCModal.bankCity" label="City" />
                  </q-card-section>
                </q-card>

                <!-- Signatories Setup -->
                <q-card flat bordered class="signatories-card">
                  <q-card-section>
                    <div class="text-subtitle2 text-weight-medium q-mb-md" style="color: #187c19">
                      <q-icon name="people" class="q-mr-xs" />
                      Report Signatories
                    </div>

                    <!-- Prepared by -->
                    <!-- <div class="signatory-group q-mb-lg">
                      <div class="signatory-header">
                        <q-icon name="create" size="sm" style="color: #69b31e" class="q-mr-xs" />
                        <span class="text-weight-medium">Prepared by</span>
                      </div>
                      <q-input
                        outlined
                        dense
                        v-model="SetupModal.Preparedby"
                        placeholder="Enter full name"
                        class="q-mb-sm"
                        clearable
                      />
                      <q-select
                        outlined
                        dense
                        :options="reportStore.positionsOptions"
                        map-options
                        option-label="label"
                        option-value="value"
                        v-model="SetupModal.Preparedposition"
                        placeholder="Select position"
                        clearable
                      />
                    </div> -->

                    <!-- Prepared by -->
                    <div class="signatory-group q-mb-lg">
                      <div class="signatory-header">
                        <q-icon name="create" size="sm" style="color: #69b31e" class="q-mr-xs" />
                        <span class="text-weight-medium">Prepared by</span>
                      </div>
                      <q-input
                        outlined
                        dense
                        v-model="SetupModal.Preparedby"
                        placeholder="Enter full name"
                        class="q-mb-sm"
                        clearable
                      />
                      <q-select
                        outlined
                        dense
                        :options="reportStore.positionsOptions"
                        map-options
                        option-label="label"
                        option-value="value"
                        v-model="SetupModal.Notedposition"
                        placeholder="Select position"
                        clearable
                      />
                    </div>

                    <!-- Certified by -->
                    <div class="signatory-group q-mb-md">
                      <div class="signatory-header">
                        <q-icon name="verified" size="sm" style="color: #187c19" class="q-mr-xs" />
                        <span class="text-weight-medium">Delivered by</span>
                      </div>
                      <q-input
                        outlined
                        dense
                        v-model="SetupModal.Deliveredby"
                        placeholder="Enter full name"
                        class="q-mb-sm"
                        clearable
                      />
                      <q-select
                        outlined
                        dense
                        :options="reportStore.positionsOptions"
                        map-options
                        option-label="label"
                        option-value="value"
                        v-model="SetupModal.Certifiedposition"
                        placeholder="Select position"
                        clearable
                      />
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Quick Actions -->
                <q-card flat bordered class="q-mt-lg">
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
                        color="#E0FFE7"
                        @click="resetSignatories"
                        class="full-width"
                      />
                      <q-btn
                        outline
                        size="sm"
                        icon="save"
                        label="Save as Template"
                        color="#69B31E"
                        @click="saveAsTemplate"
                        class="full-width"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </q-scroll-area>
          </div>
        </q-drawer>

        <!-- Main Content Area -->
        <q-page-container style="background: #f5f5f5">
          <div class="print-content-wrapper q-pa-md">
            <q-card class="print-modal" id="pbc-print-content">
              <div class="pbc-header-block q-mt-md">
                <div class="pbc-republic">Republic of the Philippines</div>
                <div class="pbc-province">Province of Davao del Norte</div>
                <div class="pbc-city">CITY OF TAGUM</div>
                <div class="pbc-barangay">BARANGAY {{ authStore.user?.barangay_name }}</div>
              </div>
              <div class="pbc-title">Punong Barangay's Certification (PBC)</div>

              <q-card-section class="q-pt-xs">
                <!-- TO / PBC No. -->
                <div class="row justify-between items-start q-mb-md pbc-to-block">
                  <div>
                    <div style="-webkit-text-stroke: 0.5px currentColor" class="text-uppercase">
                      To: {{ PBCModal.recipient || 'Recipient Name' }}
                    </div>
                    <div
                      class="text-weight-bold uppercase"
                      style="-webkit-text-stroke: 0.5px currentColor"
                    >
                      {{ PBCModal.bankName || 'Bank Name' }}
                    </div>
                    <div>{{ PBCModal.bankBranch || 'Tagum Branch' }}</div>
                    <div>{{ PBCModal.bankCity || 'Tagum City' }}</div>
                  </div>
                  <div class="text-right">
                    <div>
                      <span
                        class="text-weight-bold"
                        style="-webkit-text-stroke: 0.5px currentColor; color: #a10909"
                        >PBC No.:</span
                      >
                      {{ PBCModal.pbcNo || '—' }}
                    </div>
                    <div>
                      <span class="text-weight-bold" style="-webkit-text-stroke: 0.5px currentColor"
                        >DATE:</span
                      >
                      {{ formatFullDate(PBCModal.date) }}
                    </div>
                  </div>
                </div>

                <!-- Certification body (EN / FIL pairs) -->
                <div class="pbc-body q-mb-md">
                  <div class="pbc-en" style="margin-left: 10%">
                    This is to certify that the following checks were duly issued by Barangay
                    {{ authStore.user?.barangay_name }}
                  </div>
                  <div class="pbc-fil" style="margin-left: 10%">
                    (Ito ay pagpapatunay na ang mga cheke na nakalista sa ibaba ay na-isyu ng
                    Barangay {{ authStore.user?.barangay_name }})
                  </div>
                  <div class="pbc-en">
                    complete with respective Disbursement Vouchers and supporting documents
                  </div>
                  <div class="pbc-fil">
                    (na kompleto ng kanya-kanyang Disbursement Vouchers at kalakip na mga
                    dokumento.)
                  </div>
                </div>

                <!-- Checks Table -->
                <table class="pbc-table">
                  <thead>
                    <tr>
                      <th>CHECK NO.</th>
                      <th>CHECK DATE</th>
                      <th>PAYEE</th>
                      <th>AMOUNT</th>
                      <th>PURPOSE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(group, gIndex) in reportStore.reportPBC" :key="gIndex">
                      <tr class="pbc-bank-group-row">
                        <td colspan="5" class="text-left text-weight-bold">
                          {{ group.bankGroup }}
                        </td>
                      </tr>
                      <tr v-for="(check, cIndex) in group.checks" :key="cIndex">
                        <td class="text-center">{{ check.checkNo }}</td>
                        <td class="text-center">{{ check.checkDate }}</td>
                        <td class="text-left text-uppercase">{{ check.payee }}</td>
                        <td class="text-right">{{ formatCurrency(check.amount) }}</td>
                        <td class="text-left text-uppercase">{{ check.purpose }}</td>
                      </tr>
                    </template>

                    <tr v-if="!reportStore.reportPBC || reportStore.reportPBC.length === 0">
                      <td colspan="5" class="text-center text-grey-6">No checks available</td>
                    </tr>

                    <tr class="pbc-nothing-follows-row">
                      <td colspan="5" class="text-center">**** NOTHING FOLLOWS ****</td>
                    </tr>

                    <tr class="pbc-total-row" style="-webkit-text-stroke: 0.5px currentColor">
                      <td colspan="3" class="text-right text-weight-bold">TOTAL:</td>
                      <td class="text-right text-weight-bold">{{ formatCurrency(pbcTotal) }}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>

                <!-- Footer certification text -->
                <div class="pbc-footer-text q-mt-xl">
                  <div class="pbc-en">
                    This Certification is issued, pursuant to COA Circular 2018-<span
                      class="pbc-blank"
                      >____</span
                    >, dated <span class="pbc-blank">____________</span>,
                  </div>
                  <div class="pbc-fil">
                    (Itong Patunay ay ginawa alinsunod sa COA Circular 2018-<span class="pbc-blank"
                      >____</span
                    >
                    na may petsang <span class="pbc-blank">________________</span>)
                  </div>
                  <div class="pbc-en">as a condition for the encashment of said checks.</div>
                  <div class="pbc-fil">
                    (bilang kondisyon para sa pagpapapalit ng mga nasabing cheke.)
                  </div>
                  <div class="pbc-en">
                    The undersigned attests to the truthfulness of the foregoing facts, under pain
                    of
                  </div>
                  <div class="pbc-fil">
                    (Pinapatotohanan ko may lagda ang mga nakasaad sa itaas, batid ang.....)
                  </div>
                  <div class="pbc-en">
                    liability for falsification, pursuant to Article 171(4) of the Revised Penal
                    Code.
                  </div>
                  <div class="pbc-fil">
                    (pananagutan sa kasong "Falsification," sang-ayon sa Article 171(4) ng Revised
                    Penal Code.)
                  </div>
                </div>

                <!-- Very truly yours -->
                <div class="row justify-end q-mb-xl q-mt-xl">
                  <div class="text-center" style="min-width: 280px">
                    <div class="text-left q-mb-md">Very truly yours,</div>
                    <div class="pbc-signature-name">
                      {{ SetupModal.Preparedby }}
                    </div>
                    <div class="pbc-signature-position">
                      {{ SetupModal.Notedposition?.label || 'Position' }}
                    </div>
                  </div>
                </div>

                <!-- Delivered by / Received by -->
                <div class="row justify-between q-mb-lg">
                  <div style="min-width: 300px" class="q-ml-md">
                    <div class="q-mb-md">Delivered by:</div>
                    <div class="pbc-signature-name text-center">
                      {{ SetupModal.Deliveredby }}
                    </div>
                    <div class="pbc-signature-position text-center">
                      {{ SetupModal.Certifiedposition?.label || 'Position' }}
                    </div>
                  </div>
                  <div class="text-center q-mr-md" style="min-width: 300px">
                    <div class="text-left q-mb-md">Received by:</div>
                    <div class="pbc-signature-name">&nbsp;</div>
                    <div class="pbc-signature-position">BANK REPRESENTATIVE</div>
                  </div>
                </div>

                <div class="text-center pbc-page-footer">Page 1 of 1</div>
              </q-card-section>
            </q-card>
          </div>
        </q-page-container>
      </q-layout>
    </q-dialog>

    <!-- Loading Overlay for Year Changes -->
    <q-inner-loading :showing="reportStore.isLoading && isYearChanging" color="primary">
      <q-spinner size="50px" color="primary" />
      <div class="text-center q-mt-md">
        <div class="text-h6">Loading Data</div>
        <div class="text-caption">Please wait while we fetch data for the selected year...</div>
      </div>
    </q-inner-loading>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import SetupDialog from 'components/SetupDialog.vue'
import { useQuasar, date } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { useReportStore } from 'stores/reportStore'
import { usePageLogging } from '../composables/usePageLogging'
import { useActivityLogging } from '../composables/useActivityLogging'

// Remove the old computedSACBRows since we're using hierarchical structure directly

const totalAppropriation = computed(() => {
  return reportStore.reportSACB
    .filter((row) => row.isType || row.isItem) // only count type and item rows
    .reduce((sum, row) => {
      return sum + (row.appropriation || 0)
    }, 0)
    .toLocaleString('en-US', { minimumFractionDigits: 2 })
})

const totalObligation = computed(() => {
  return reportStore.reportSACB
    .filter((row) => row.isType || row.isItem) // only count type and item rows
    .reduce((sum, row) => {
      return sum + (row.obligation || 0)
    }, 0)
    .toLocaleString('en-US', { minimumFractionDigits: 2 })
})

const totalBalance = computed(() => {
  return reportStore.reportSACB
    .filter((row) => row.isType || row.isItem) // only count type and item rows
    .reduce((sum, row) => {
      return sum + (row.balance || 0)
    }, 0)
    .toLocaleString('en-US', { minimumFractionDigits: 2 })
})

// Computed property for dynamic columns count
const dynamicColumnsCount = computed(() => {
  return reportStore.dynamicAccountColumns.length
})

// Check if there are dynamic columns
const hasDynamicColumns = computed(() => {
  return reportStore.dynamicAccountColumns.length > 0
})

// stores & composables
const $q = useQuasar()
const reportStore = useReportStore()
const authStore = useAuthStore()
const { logPageVisit } = usePageLogging()
const { logAdminActivity } = useActivityLogging()

/* -------------------- STATE -------------------- */
const showSetupDialog = ref(false)
const initialDataLoading = ref(false)
const generatingRacReportLoading = ref(false)
const generatingSacbReportLoading = ref(false)
const generatingPbcReportLoading = ref(false)
const generatingTransmittalLoading = ref(false)
const previewAdviceLoading = ref(false)
const exportingPDF = ref(false)
const exportingSACBPDF = ref(false)
const exportingTransmittalPDF = ref(false)
const exportingPBCPDF = ref(false)
const sacbDrawerOpen = ref(true)

function pad(n) {
  return String(n).padStart(2, '0')
}

// Date ranges
const currentYear = new Date().getFullYear()
const currentdate = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
const laterMonthNum = new Date().getMonth() + 1
const laterMonth = pad(laterMonthNum)
const laterlastday = new Date(currentYear, laterMonthNum, 0).getDate()

//Year Filter
const selectedYear = ref(null)

const isYearChanging = ref(false)

//refresh years after filtering
function refreshYears() {
  reportStore.fetchAvailableYears()

  selectedYear.value = null
  onYearChange(null)

  notifySuccess('Filters reset to defaults.')
}

async function onYearChange(year) {
  isYearChanging.value = true
  initialDataLoading.value = true

  try {
    // Sync store's selectedYear with what the dropdown emitted
    reportStore.selectedYear = year

    if (year === null) {
      const today = new Date()
      const month = today.getMonth()
      const lastDay = new Date(currentYear, month + 1, 0).getDate()
      const mm = pad(month + 1)
      // const todayStr = today.toLoocaleDateString('en-CA') // YYYY-MM-DD format

      CurrentRacDateRange.value = {
        from: `${currentYear}-${mm}-01`,
        to: `${currentYear}-${mm}-${pad(lastDay)}`,
      }
      continuingRacDateRange.value = {
        from: `${currentYear}-${mm}-01`,
        to: `${currentYear}-${mm}-${pad(lastDay)}`,
      }
      currentSacbDateRange.value = {
        from: `${currentYear}-01-01`,
        to: new Date().toISOString().slice(0, 10),
      }
      pbcDateRange.value = {
        from: `${currentYear}-01-01`,
        to: new Date().toISOString().slice(0, 10),
      }
      continuingSacbDateRange.value = {
        from: `${currentYear}-01-01`,
        to: new Date().toISOString().slice(0, 10),
      }
      continuingPbcDateRange.value = {
        from: `${currentYear - 1}-01-01`,
        to: new Date().toISOString().slice(0, 10),
      }
    } else {
      const y = parseInt(year)
      if (!y || String(y).length !== 4) return

      const today = new Date()
      const isCurrentYear = y === today.getFullYear()
      const sacbFrom = `${y}-01-01`
      const sacbTo = isCurrentYear ? today.toISOString().slice(0, 10) : `${y}-12-31`
      const month = today.getMonth()
      const lastDay = new Date(y, month + 1, 0).getDate()
      const mm = pad(month + 1)

      currentSacbDateRange.value = { from: sacbFrom, to: sacbTo }
      pbcDateRange.value = { from: sacbFrom, to: sacbTo }
      continuingSacbDateRange.value = { from: sacbFrom, to: sacbTo }
      CurrentRacDateRange.value = { from: `${y}-${mm}-01`, to: `${y}-${mm}-${pad(lastDay)}` }
      continuingRacDateRange.value = { from: `${y}-${mm}-01`, to: `${y}-${mm}-${pad(lastDay)}` }
      continuingPbcDateRange.value = { from: `${y - 1}-01-01`, to: sacbTo }
    }

    expenseSelectedCurrent.value = null
    expenseSelectedContinuing.value = null

    // Only re-fetch expense classes — years list doesn't need to reload
    await reportStore.fetchData(reportStore.selectedYear)
  } finally {
    isYearChanging.value = false
    initialDataLoading.value = false
  }
}

const CurrentRacDateRange = ref({
  from: `${currentYear}-${laterMonth}-01`,
  to: `${currentYear}-${laterMonth}-${pad(laterlastday)}`,
})
const currentSacbDateRange = ref({ from: `${currentYear}-01-01`, to: currentdate })
const pbcDateRange = ref({ from: `${currentYear}-01-01`, to: currentdate })
const continuingRacDateRange = ref({
  from: `${currentYear}-${laterMonth}-01`,
  to: `${currentYear}-${laterMonth}-${pad(laterlastday)}`,
})
const continuingSacbDateRange = ref({ from: `${currentYear}-01-01`, to: currentdate })

const expenseSelectedCurrent = ref(null)
const expenseSelectedContinuing = ref(null)
const bankSelectedPBC = ref(null)
const transmittalMonthSelected = ref(laterMonth)

const continuingPbcDateRange = ref({
  from: `${currentYear - 1}-01-01`,
  to: currentdate,
})
// const continuingBankSelectedPBC = ref(null)
// const continuingTransmittalMonthSelected = ref(laterMonth)

function formatDateRange(dateString) {
  return date.formatDate(dateString, 'MM-DD-YYYY')
}

const monthOptions = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
]

// Modals
const RACModal = reactive({
  show: false,
  reportType: '',
  report: [
    { id: 1, time: '09:30 AM', description: 'Report generated successfully' },
    { id: 2, time: '09:25 AM', description: 'Data validation completed' },
    { id: 3, time: '09:20 AM', description: 'Report parameters configured' },
    { id: 4, time: '09:15 AM', description: 'Print dialog opened' },
  ],
})

const transmittalModal = reactive({
  show: false,
  date: new Date().toISOString().slice(0, 10),
  periodFrom: `${currentYear}-${laterMonth}-01`,
  periodTo: `${currentYear}-${laterMonth}-${pad(laterlastday)}`,
  recipientName: '',
  recipientPosition: null,
})

const PBCModal = reactive({
  show: false,
  pbcNo: '',
  recipient: '',
  bankName: '',
  bankBranch: '',
  bankCity: '',
  date: new Date().toISOString().slice(0, 10),
})

const pbcTotal = computed(() => {
  if (!reportStore.reportPBC) return 0
  return reportStore.reportPBC.reduce((sum, group) => {
    return sum + (group.checks || []).reduce((s, c) => s + (c.amount || 0), 0)
  }, 0)
})

const transmittalDvTotal = computed(() => {
  return (reportStore.reportTransmittal.dvRows || []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0,
  )
})

function buildNextPbcNo(dateString) {
  const baseDate = dateString ? new Date(dateString) : new Date()
  const dateForNumber = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate
  const yy = String(dateForNumber.getFullYear()).slice(-2)
  const mm = pad(dateForNumber.getMonth() + 1)
  const key = `pbc-number-sequence:${yy}-${mm}`
  const lastNumber = Number(localStorage.getItem(key) || 0) + 1

  localStorage.setItem(key, String(lastNumber))
  return `${yy}-${mm}-${String(lastNumber).padStart(5, '0')}`
}

const SACBModal = reactive({
  show: false,
  reportType: '',
  activities: [
    { id: 1, time: '09:30 AM', description: 'Report generated successfully' },
    { id: 2, time: '09:25 AM', description: 'Data validation completed' },
    { id: 3, time: '09:20 AM', description: 'Report parameters configured' },
    { id: 4, time: '09:15 AM', description: 'Print dialog opened' },
  ],
})

const pbcAdviceColumns = [
  { name: 'pbcDate', label: 'Date Advice', field: 'pbcDate', align: 'left' },
  { name: 'pbcNo', label: 'Advice No.', field: 'pbcNo', align: 'left' },
  { name: 'pbcDateRange', label: 'Date Range', field: 'pbcDateRange', align: 'left' },
  { name: 'bankName', label: 'Bank Name', field: 'bankName', align: 'left' },
  { name: 'voucherCount', label: 'No. of Vouchers', field: 'voucherCount', align: 'right' },
  { name: 'amount', label: 'Amount', field: 'amount', align: 'right' },
  { name: 'action', label: 'Action', field: 'action', align: 'right' },
]

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
  Certifiedposition: '',
})

const loadAllData = async () => {
  initialDataLoading.value = true
  try {
    await reportStore.fetchAvailableYears()
    await reportStore.fetchData(reportStore.selectedYear)
    await reportStore.fetchSignatories()
    applySavedSignatories()
  } catch (error) {
    console.error('Error loading data:', error)
    notifyError('Failed to load data. Please try again later.')
  } finally {
    initialDataLoading.value = false
  }
}

function applySavedSignatories() {
  SetupModal.Preparedby = reportStore.prepBy || ''
  SetupModal.Preparedposition = reportStore.prepPosition
  SetupModal.Notedby = reportStore.notedBy || ''
  SetupModal.Notedposition = reportStore.notedPosition
  SetupModal.Certifiedby = reportStore.certBy || ''
  SetupModal.Certifiedposition = reportStore.certPosition
}

// const loadAllData = async () => {
//   loading.value = true
//   try {
//     await Promise.all([
//       reportStore.fetchData(reportStore.selectedYear),  // ← pass year here
//       reportStore.fetchAvailableYears()
//     ])
//   } catch (error) {
//     console.error('Error loading data:', error)
//     notifyError('Failed to load data. Please try again later.')
//   } finally {
//     loading.value = false
//   }
// }

const openSACBModal = async (type) => {
  if (type === 'current-sacb') {
    if (!currentSacbDateRange.value.from || !currentSacbDateRange.value.to) {
      return notifyError('Please select a valid current SACB date range.')
    }
  } else if (type === 'continuing-sacb') {
    if (!continuingSacbDateRange.value.from || !continuingSacbDateRange.value.to) {
      return notifyError('Please select a valid continuing SACB date range.')
    }
  }

  // Log report generation activity
  const reportType = getReportTypeLabel(type)
  const dateRange =
    type === 'current-sacb'
      ? `${currentSacbDateRange.value.from} to ${currentSacbDateRange.value.to}`
      : type === 'continuing-sacb'
        ? `${continuingSacbDateRange.value.from} to ${continuingSacbDateRange.value.to}`
        : 'No date range'
  logAdminActivity(
    'Report Generated',
    `Generated ${reportType} report for date range: ${dateRange}`,
  )

  generatingSacbReportLoading.value = true
  try {
    await loadSacbReport(
      type === 'current-sacb'
        ? currentSacbDateRange.value.from
        : type === 'continuing-sacb'
          ? continuingSacbDateRange.value.from
          : null,
      type === 'current-sacb'
        ? currentSacbDateRange.value.to
        : type === 'continuing-sacb'
          ? continuingSacbDateRange.value.to
          : null,
    )
    SACBModal.reportType = reportType
    SACBModal.show = true
  } finally {
    generatingSacbReportLoading.value = false
  }
}

const closeSACBModal = () => {
  SACBModal.show = false
}

const openRACModal = async (type) => {
  if (type === 'current-rac') {
    if (!CurrentRacDateRange.value.from || !CurrentRacDateRange.value.to) {
      return notifyError('Please select a valid current RAC date range.')
    }
  } else if (type === 'continuing-rac') {
    if (!continuingRacDateRange.value.from || !continuingRacDateRange.value.to) {
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

  // Log report generation activity
  const reportType = getReportTypeLabel(type)
  const expenseCategory = reportStore.expenseRacSelected?.name || 'Unknown'
  const dateRange =
    type === 'current-rac'
      ? `${CurrentRacDateRange.value.from} to ${CurrentRacDateRange.value.to}`
      : type === 'continuing-rac'
        ? `${continuingRacDateRange.value.from} to ${continuingRacDateRange.value.to}`
        : 'No date range'
  logAdminActivity(
    'Report Generated',
    `Generated ${reportType} report for expense category: ${expenseCategory} with date range: ${dateRange}`,
  )

  generatingRacReportLoading.value = true
  try {
    await loadRacReport(
      type === 'current-rac'
        ? CurrentRacDateRange
        : type === 'continuing-rac'
          ? continuingRacDateRange
          : null,
    )
    RACModal.reportType = reportType
    RACModal.show = true
  } finally {
    generatingRacReportLoading.value = false
  }
}

const closeRACModal = () => {
  RACModal.show = false
}

const searchQuery = ref('')

const filteredPbcAdviceList = computed(() => {
  const list = reportStore.pbcAdviceList || []
  const q = searchQuery.value?.trim().toLowerCase()
  if (!q) return list

  return list.filter((row) => {
    return (
      String(row.pbcNo || '')
        .toLowerCase()
        .includes(q) ||
      String(row.bankName || '')
        .toLowerCase()
        .includes(q) ||
      formatFullDate(row.pbcDate || '')
        .toLowerCase()
        .includes(q)
    )
  })
})

const clearAllFilters = () => {
  searchQuery.value = ''
}

const viewPbcAdvice = async (row) => {
  previewAdviceLoading.value = true
  try {
    PBCModal.pbcNo = row.pbcNo
    PBCModal.date = row.pbcDate
    PBCModal.recipient = row.recipient || PBCModal.recipient || 'The Bank Manager'
    PBCModal.bankName = row.bankName || PBCModal.bankName
    PBCModal.bankBranch = row.bankBranch || PBCModal.bankBranch
    PBCModal.bankCity = row.bankCity || PBCModal.bankCity

    await reportStore.fetchPbcReport({
      from: row.from,
      to: row.to,
      bankId: row.bankId,
      pbcNo: row.pbcNo,
      pbcDate: row.pbcDate,
      source: row.source || 'regular',
    })

    PBCModal.show = true
  } catch (error) {
    console.error(error)
    notifyError('Failed to load this PBC advice for preview')
  } finally {
    previewAdviceLoading.value = false
  }
}

const openTransmittalModal = async () => {
  if (!transmittalMonthSelected.value) {
    return notifyError('Please select a month for the transmittal report.')
  }

  generatingTransmittalLoading.value = true
  try {
    const year = Number(reportStore.selectedYear || currentYear)
    const month = String(transmittalMonthSelected.value).padStart(2, '0')
    const lastDay = new Date(year, Number(month), 0).getDate()

    transmittalModal.periodFrom = `${year}-${month}-01`
    transmittalModal.periodTo = `${year}-${month}-${pad(lastDay)}`
    transmittalModal.date = new Date().toISOString().slice(0, 10)

    await reportStore.fetchTransmittalReport({
      from: transmittalModal.periodFrom,
      to: transmittalModal.periodTo,
      year,
      pbcNo: PBCModal.pbcNo,
      pbcDate: PBCModal.date,
    })

    logAdminActivity(
      'Report Generated',
      `Generated Transmittal report for date range: ${transmittalModal.periodFrom} to ${transmittalModal.periodTo}`,
    )
    transmittalModal.show = true
  } catch (error) {
    console.error(error)
    notifyError('Failed to generate Transmittal report')
  } finally {
    generatingTransmittalLoading.value = false
  }
}

const closeTransmittalModal = () => {
  transmittalModal.show = false
}

const openPBCModal = async () => {
  if (!pbcDateRange.value.from || !pbcDateRange.value.to) {
    return notifyError('Please select a valid PBC date range.')
  }
  if (!bankSelectedPBC.value) {
    return notifyError('Please select a bank.')
  }

  generatingPbcReportLoading.value = true
  try {
    const selectedBank = reportStore.bankOptions.find(
      (bank) => String(bank.id) === String(bankSelectedPBC.value?.id || bankSelectedPBC.value),
    )

    if (selectedBank) {
      PBCModal.recipient = PBCModal.recipient || 'The Bank Manager'
      PBCModal.bankName = selectedBank.name || PBCModal.bankName
      PBCModal.bankBranch = selectedBank.branch || PBCModal.bankBranch
      PBCModal.bankCity = selectedBank.city || PBCModal.bankCity
    }

    PBCModal.pbcNo = buildNextPbcNo(PBCModal.date)

    await reportStore.fetchPbcReport({
      from: pbcDateRange.value.from,
      to: pbcDateRange.value.to,
      bankId: bankSelectedPBC.value?.id || bankSelectedPBC.value,
      pbcNo: PBCModal.pbcNo,
      pbcDate: PBCModal.date,
    })

    // reportStore.recordPbcAdvice({
    //   pbcNo: PBCModal.pbcNo,
    //   pbcDate: PBCModal.date,
    //   voucherCount: pbcVoucherCount.value,
    //   amount: pbcTotal.value,
    // })

    await reportStore.recordPbcAdvice({
      pbcNo: PBCModal.pbcNo,
      pbcDate: PBCModal.date,
      voucherCount: pbcVoucherCount.value,
      amount: pbcTotal.value,
      from: pbcDateRange.value.from,
      to: pbcDateRange.value.to,
      bankId: bankSelectedPBC.value?.id || bankSelectedPBC.value,
      bankName: PBCModal.bankName,
      recipient: PBCModal.recipient,
      bankBranch: PBCModal.bankBranch,
      bankCity: PBCModal.bankCity,
      source: 'regular',
    })

    logAdminActivity(
      'Report Generated',
      `Generated PBC report for bank: ${selectedBank?.name || 'Unknown'} with date range: ${pbcDateRange.value.from} to ${pbcDateRange.value.to}`,
    )
    PBCModal.show = true
  } catch (error) {
    console.error(error)
    // notifyError('Failed to generate PBC report')
    notifyError(getErrorMessage(error, 'Failed to generate PBC report'))
  } finally {
    generatingPbcReportLoading.value = false
  }
}

const pbcVoucherCount = computed(() => {
  if (!reportStore.reportPBC) return 0
  return reportStore.reportPBC.reduce((sum, group) => sum + (group.checks?.length || 0), 0)
})

const closePBCModal = () => {
  PBCModal.show = false
}


const getReportTypeLabel = (type) =>
  ({
    'current-rac': 'Current Year - Registry of Appropriation and Commitment (RAC)',
    'current-sacb': 'Current Year - Status of Appropriation and Obligation (SACB)',
    'continuing-rac': 'Continuing Reports - Registry of Appropriation and Commitment (RAC)',
    'continuing-sacb': 'Continuing Reports - Status of Appropriation and Obligation (SACB)',
  })[type] || 'Unknown Report'

const handleSACBPrint = () => {
  logAdminActivity('Report Printed', `Printed ${SACBModal.reportType} report`)
  closeSACBModal()
  notifySuccess('Report sent to printer successfully!')
}

// const handleRACPrint = () => {
//   logAdminActivity('Report Printed', `Printed ${RACModal.reportType} report`)
//   closeRACModal()
//   notifySuccess('Report sent to printer successfully!')
// }
// Cur-Rac Date range
// const onDateRangeChange = (newRange) => {
//   CurrentRacDateRange.value = newRange
// }

// const onDateRangeClear = () => {
//   CurrentRacDateRange.value = { from: '', to: '' }
// }

// const onContinuingDateRangeChange = (newRange) => {
//   continuingRacDateRange.value = newRange
// }

// const onContinuingDateRangeClear = () => {
//   continuingRacDateRange.value = { from: '', to: '' }
//   logAdminActivity('Date Range Cleared', 'Cleared continuing RAC date range')
// }

// const onCurrentSacbDateRangeChange = (newRange) => {
//   currentSacbDateRange.value = newRange
// }

// const onCurrentSacbDateRangeClear = () => {
//   currentSacbDateRange.value = { from: '', to: '' }
// }

// const onContinuingSacbDateRangeChange = (newRange) => {
//   continuingSacbDateRange.value = newRange
// }

// const onContinuingSacbDateRangeClear = () => {
//   continuingSacbDateRange.value = { from: '', to: '' }
// }

/* -------------------- HELPERS -------------------- */
function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message || // axios error shape: { response: { data: { message } } }
    error?.message ||
    fallback
  )
}

const notifyError = (msg, timeout = 10000) =>
  $q.notify({
    type: 'negative',
    message: msg,
    position: 'top',
    timeout,
    // multiLine: true,
    // classes: 'q-pb-sm',
    actions: [{ icon: 'close', color: 'white', round: true, dense: true }],
  })

const notifySuccess = (msg) => $q.notify({ type: 'positive', message: msg, position: 'top' })

/* -------------------- COMPUTED -------------------- */
// Removed sacbColumns as we're using custom hierarchical table structure

const dateRangeDisplay = computed(() => {
  if (!CurrentRacDateRange.value.from && !CurrentRacDateRange.value.to) return ''
  if (CurrentRacDateRange.value.from && !CurrentRacDateRange.value.to)
    return `From ${CurrentRacDateRange.value.from}`
  if (!CurrentRacDateRange.value.from && CurrentRacDateRange.value.to)
    return `To ${CurrentRacDateRange.value.to}`
  return `${CurrentRacDateRange.value.from} - ${CurrentRacDateRange.value.to}`
})

async function loadRacReport($date) {
  try {
    await reportStore.fetchRacReport($date)
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: 'Failed to generate RAC Report',
    })
  }
}

async function loadSacbReport($from, $to) {
  try {
    await reportStore.fetchSacbReport($from, $to)
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: 'Failed to generate SACB Report',
    })
  }
}

async function exportToPDF() {
  exportingPDF.value = true
  const html2canvas = (await import('html2canvas')).default
  const jsPDF = (await import('jspdf')).default
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
    // Create PDF in landscape orientation with A4 dimensions
    const pdf = new jsPDF('l', 'mm', 'a4') // 'l' for landscape

    const pageWidth = pdf.internal.pageSize.getWidth() // 297mm (A4 landscape width)
    const pageHeight = pdf.internal.pageSize.getHeight() // 210mm (A4 landscape height)
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

    // Log PDF export activity
    logAdminActivity('Report Exported', `Exported ${RACModal.reportType} report to PDF`)

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

async function exportToExcel() {
  try {
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('RAC Report')

    const dynamicCols = reportStore.dynamicAccountColumns
    const totalCols = 5 + dynamicCols.length

    // ── Helper: apply border to a cell ──
    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    }
    // const mediumBorder = {
    //   top:    { style: 'medium', color: { argb: 'FF000000' } },
    //   bottom: { style: 'medium', color: { argb: 'FF000000' } },
    //   left:   { style: 'medium', color: { argb: 'FF000000' } },
    //   right:  { style: 'medium', color: { argb: 'FF000000' } },
    // }

    const outerBorder = {
      top: { style: 'medium', color: { argb: 'FFD3D3D3' } },
      bottom: { style: 'medium', color: { argb: 'FFD3D3D3' } },
      left: { style: 'medium', color: { argb: 'FFD3D3D3' } },
      right: { style: 'medium', color: { argb: 'FFD3D3D3' } },
    }

    // const applyBorderRange = (startRow, endRow, startCol, endCol, border) => {
    //   for (let r = startRow; r <= endRow; r++) {
    //     for (let c = startCol; c <= endCol; c++) {
    //       const cell = ws.getCell(r, c)
    //       cell.border = border
    //     }
    //   }
    // }

    // ── Column widths ──
    ws.columns = [
      { width: 20 }, // A - Date
      { width: 32 }, // B - Particulars
      { width: 18 }, // C - DV#
      { width: 26 }, // D - Payee
      { width: 16 }, // E - Appropriation
      ...dynamicCols.map(() => ({ width: 22 })),
    ]

    // ROW 1 — Report Title
    ws.mergeCells(1, 1, 1, totalCols)
    const titleCell = ws.getCell(1, 1)
    titleCell.value = RACModal.reportType
    titleCell.font = { bold: true, color: { argb: 'FF187C19' }, size: 14, name: 'Arial' }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(1).height = 28

    // ROW 2 — Barangay
    ws.mergeCells(2, 1, 2, totalCols)
    const barangayCell = ws.getCell(2, 1)
    barangayCell.value = `Barangay ${authStore.user?.barangay_name || ''}`
    barangayCell.font = { color: { argb: 'FF187C19' }, size: 11, name: 'Arial' }
    barangayCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(2).height = 20

    // ROW 3 — Generated Date
    ws.mergeCells(3, 1, 3, totalCols)
    const dateCell = ws.getCell(3, 1)
    dateCell.value = `Generated Date: ${new Date().toLocaleDateString()}`
    dateCell.font = { color: { argb: 'FF666666' }, size: 10, name: 'Arial' }
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(3).height = 16

    // ROW 4 — Spacer
    ws.getRow(4).height = 20

    // ROW 5 — Expense Class Name
    ws.mergeCells(5, 1, 5, totalCols)
    const expenseCell = ws.getCell(5, 1)
    expenseCell.value = reportStore.expenseRacSelected?.name || 'Not Selected'
    expenseCell.font = { bold: true, size: 12, name: 'Arial' }
    expenseCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
    expenseCell.alignment = { horizontal: 'center', vertical: 'middle' }
    expenseCell.border = outerBorder
    ws.getRow(5).height = 24

    // Fill empty merged cells in row 5 with same fill & border
    for (let c = 2; c <= totalCols; c++) {
      const cell = ws.getCell(5, c)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
      cell.border = {
        top: { style: 'medium', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'medium', color: { argb: 'FFD3D3D3' } },
        right:
          c === 0
            ? { style: 'medium', color: { argb: 'FFD3D3D3' } }
            : { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left:
          c === totalCols
            ? { style: 'medium', color: { argb: 'FFD3D3D3' } }
            : { style: 'thin', color: { argb: 'FFCCCCCC' } },
      }
    }

    // ROW 6 — OBLIGATION / ACCOUNT TITLE grouped header
    ws.mergeCells(6, 1, 6, 4)
    const obligCell = ws.getCell(6, 1)
    obligCell.value = 'OBLIGATION'
    obligCell.font = { bold: true, size: 11, name: 'Arial' }
    obligCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
    obligCell.alignment = { horizontal: 'center', vertical: 'middle' }
    obligCell.border = {
      top: { style: 'medium', color: { argb: 'FFD3D3D3' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'medium', color: { argb: 'FFD3D3D3' } },
      right: { style: 'medium', color: { argb: 'FFD3D3D3' } },
    }

    // Fill merged cells 2-4 in row 6
    for (let c = 2; c <= 4; c++) {
      const cell = ws.getCell(6, c)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
      cell.border = {
        top: { style: 'medium', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      }
    }

    if (dynamicCols.length > 0) {
      ws.mergeCells(6, 5, 6, totalCols)
    }
    const acctCell = ws.getCell(6, 5)
    acctCell.value = 'ACCOUNT TITLE'
    acctCell.font = { bold: true, size: 11, name: 'Arial' }
    acctCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
    acctCell.alignment = { horizontal: 'center', vertical: 'middle' }
    acctCell.border = {
      top: { style: 'medium', color: { argb: 'FFD3D3D3' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'medium', color: { argb: 'FFD3D3D3' } },
      right: { style: 'medium', color: { argb: 'FFD3D3D3' } },
    }

    for (let c = 6; c <= totalCols; c++) {
      const cell = ws.getCell(6, c)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
      cell.border = {
        top: { style: 'medium', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: c === 0 ? { style: 'medium', color: { argb: 'FFD3D3D3' } } : undefined,
        right: c === totalCols ? { style: 'medium', color: { argb: 'FFD3D3D3' } } : undefined,
      }
    }

    ws.getRow(6).height = 24

    // ROW 7 — Column Headers
    const colHeaders = [
      'DATE',
      'PARTICULARS',
      'DV#',
      'PAYEE',
      'APPROPRIATION',
      ...dynamicCols.map((c) => c.toUpperCase()),
    ]
    colHeaders.forEach((header, i) => {
      const cell = ws.getCell(7, i + 1)
      cell.value = header
      cell.font = { bold: true, size: 10, name: 'Arial' }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'medium', color: { argb: 'FFD3D3D3' } },
        left:
          i === 0
            ? { style: 'medium', color: { argb: 'FFD3D3D3' } }
            : { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right:
          i === colHeaders.length - 1
            ? { style: 'medium', color: { argb: 'FFD3D3D3' } }
            : { style: 'thin', color: { argb: 'FFCCCCCC' } },
      }
    })
    ws.getRow(7).height = 44

    // DATA ROWS — starting at row 8
    const dataStartExcelRow = 8
    reportStore.reportRAC.forEach((row, i) => {
      const excelRow = dataStartExcelRow + i
      const isEven = i % 2 === 1
      const rowFill = isEven
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
        : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }

      const values = [
        row.date || '',
        row.particular || '',
        row.dvNumber || '',
        row.payee || '',
        row.appropriation || 0,
        ...dynamicCols.map((col) => row[reportStore.accountTitleKeyMap[col]] ?? ''),
      ]

      values.forEach((val, ci) => {
        const cell = ws.getCell(excelRow, ci + 1)
        cell.value = val
        cell.fill = rowFill
        cell.font = { size: 10, name: 'Arial' }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left:
            ci === 0
              ? { style: 'medium', color: { argb: 'FFD3D3D3' } }
              : { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right:
            ci === values.length - 1
              ? { style: 'medium', color: { argb: 'FFD3D3D3' } }
              : { style: 'thin', color: { argb: 'FFDDDDDD' } },
        }

        // Numbers: right-align and format
        if (ci >= 4) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' }
          cell.numFmt = '#,##0.00'
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' }
        }
      })

      ws.getRow(excelRow).height = 18
    })

    // TOTAL ROW
    const totalExcelRow = dataStartExcelRow + reportStore.reportRAC.length

    const totalValues = [
      '',
      'Total Appropriation',
      '',
      '',
      reportStore.reportRAC.reduce((s, r) => s + (r.appropriation || 0), 0),
      ...dynamicCols.map((col) =>
        reportStore.reportRAC.reduce(
          (s, r) => s + (r[reportStore.accountTitleKeyMap[col]] || 0),
          0,
        ),
      ),
    ]

    // Merge label columns A–D
    ws.mergeCells(totalExcelRow, 1, totalExcelRow, 4)

    totalValues.forEach((val, ci) => {
      const cell = ws.getCell(totalExcelRow, ci + 1)
      cell.value = val
      cell.font = { bold: true, size: 10, name: 'Arial' }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } }
      cell.border = {
        top: { style: 'medium', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'medium', color: { argb: 'FFD3D3D3' } },
        left:
          ci === 0
            ? { style: 'medium', color: { argb: 'FFD3D3D3' } }
            : { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right:
          ci === totalValues.length - 1
            ? { style: 'medium', color: { argb: 'FFD3D3D3' } }
            : { style: 'thin', color: { argb: 'FFCCCCCC' } },
      }
      if (ci >= 4) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
        cell.numFmt = '#,##0.00'
      } else if (ci === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
    })

    ws.getRow(totalExcelRow).height = 22

    // SPACER ROWS
    const spacer1 = totalExcelRow + 1
    const spacer2 = totalExcelRow + 2
    ws.getRow(spacer1).height = 12
    ws.getRow(spacer2).height = 12

    // SUMMARY STATISTICS + REPORT INFORMATION
    const summaryStartRow = totalExcelRow + 3

    const totalAppr = reportStore.reportRAC.reduce((s, r) => s + (r.appropriation || 0), 0)
    const totalOblig = reportStore.reportRAC.reduce((s, r) => s + (r.amount || 0), 0)
    const totalBal = totalAppr - totalOblig
    //remove this when the time comes

    const summaryHeaderStyle = (cell, label) => {
      cell.value = label
      cell.font = { bold: true, size: 11, name: 'Arial', color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '58B265FF' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = outerBorder
    }

    // Section header row
    ws.mergeCells(summaryStartRow, 1, summaryStartRow, 2)
    summaryHeaderStyle(ws.getCell(summaryStartRow, 1), 'SUMMARY STATISTICS')
    ws.getCell(summaryStartRow, 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF187C19' },
    }
    ws.getCell(summaryStartRow, 2).border = outerBorder

    ws.mergeCells(summaryStartRow, 3, summaryStartRow, 5)
    summaryHeaderStyle(ws.getCell(summaryStartRow, 3), 'REPORT INFORMATION')
    for (let c = 4; c <= 5; c++) {
      ws.getCell(summaryStartRow, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF187C19' },
      }
      ws.getCell(summaryStartRow, c).border = outerBorder
    }
    ws.getRow(summaryStartRow).height = 22

    // Summary data rows
    const summaryData = [
      ['Total Appropriation:', totalAppr, 'Report Type:', 'RAC'],
      ['Total Obligation:', totalOblig, 'Total Records:', reportStore.reportRAC.length],
      ['Remaining Balance:', totalBal, 'Date Range:', dateRangeDisplay.value || 'N/A'],
    ]

    summaryData.forEach((rowData, i) => {
      const excelRow = summaryStartRow + 1 + i
      const isEven = i % 2 === 1
      const rowFill = isEven
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
        : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }

      // Col A - label
      const labelCell = ws.getCell(excelRow, 1)
      labelCell.value = rowData[0]
      labelCell.font = { bold: true, size: 10, name: 'Arial' }
      labelCell.fill = rowFill
      labelCell.alignment = { horizontal: 'left', vertical: 'middle' }
      labelCell.border = thinBorder

      // Col B - value (number)
      const valCell = ws.getCell(excelRow, 2)
      valCell.value = rowData[1]
      valCell.font = { bold: true, size: 10, name: 'Arial', color: { argb: 'FF187C19' } }
      valCell.fill = rowFill
      valCell.alignment = { horizontal: 'right', vertical: 'middle' }
      valCell.border = thinBorder
      if (typeof rowData[1] === 'number' && i < 2) valCell.numFmt = '#,##0.00'

      // Col C - info label
      const infoLabelCell = ws.getCell(excelRow, 3)
      infoLabelCell.value = rowData[2]
      infoLabelCell.font = { bold: true, size: 10, name: 'Arial' }
      infoLabelCell.fill = rowFill
      infoLabelCell.alignment = { horizontal: 'left', vertical: 'middle' }
      infoLabelCell.border = thinBorder

      // Col D-E - info value (merged)
      ws.mergeCells(excelRow, 4, excelRow, 5)
      const infoValCell = ws.getCell(excelRow, 4)
      infoValCell.value = rowData[3]
      infoValCell.font = { size: 10, name: 'Arial' }
      infoValCell.fill = rowFill
      infoValCell.alignment = { horizontal: 'left', vertical: 'middle' }
      infoValCell.border = thinBorder
      ws.getCell(excelRow, 5).fill = rowFill
      ws.getCell(excelRow, 5).border = thinBorder

      ws.getRow(excelRow).height = 18
    })

    const applyOuterBorder = (startRow, endRow, startCol, endCol) => {
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cell = ws.getCell(r, c)

          cell.border = {
            top:
              r === startRow ? { style: 'medium', color: { argb: 'FFD3D3D3' } } : cell.border?.top,
            bottom:
              r === endRow ? { style: 'medium', color: { argb: 'FFD3D3D3' } } : cell.border?.bottom,
            left:
              c === startCol ? { style: 'medium', color: { argb: 'FFD3D3D3' } } : cell.border?.left,
            right:
              c === endCol ? { style: 'medium', color: { argb: 'FFD3D3D3' } } : cell.border?.right,
          }
        }
      }
    }

    const summaryEndRow = summaryStartRow + summaryData.length

    applyOuterBorder(summaryStartRow, summaryEndRow, 1, 5)

    // WRITE FILE
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const barangay = authStore.user?.barangay_name?.replace(/\s+/g, '_') || 'Barangay'
    link.href = url
    link.download = `RAC_${barangay}_${CurrentRacDateRange.value.from}_to_${CurrentRacDateRange.value.to}.xlsx`
    link.click()
    URL.revokeObjectURL(url)

    logAdminActivity('Report Exported', `Exported ${RACModal.reportType} report to Excel`)
    $q.notify({ type: 'positive', message: 'RAC Excel Exported Successfully!' })
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Failed to export Excel' })
  }
}

async function exportSACBToPDF() {
  exportingSACBPDF.value = true
  const html2canvas = (await import('html2canvas')).default
  const jsPDF = (await import('jspdf')).default
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
    // Create PDF in landscape orientation with A4 dimensions
    const pdf = new jsPDF('l', 'mm', 'a4') // 'l' for landscape

    const pageWidth = pdf.internal.pageSize.getWidth() // 297mm (A4 landscape width)
    const pageHeight = pdf.internal.pageSize.getHeight() // 210mm (A4 landscape height)
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

    // Log PDF export activity
    logAdminActivity('Report Exported', `Exported ${SACBModal.reportType} report to PDF`)

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

async function exportTransmittalToPDF() {
  exportingTransmittalPDF.value = true
  const html2canvas = (await import('html2canvas')).default
  const jsPDF = (await import('jspdf')).default
  try {
    const element = document.querySelector('#transmittal-print-content')

    if (!element) {
      $q.notify({
        type: 'negative',
        message: 'No Transmittal content found to export!',
      })
      return
    }
    element.classList.add('pdf-export-mode')

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    })

    element.classList.remove('pdf-export-mode')

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('2', 'mm', 'legal')

    const pageWidth = pdf.internal.pageSize.getWidth() // 297mm (A4 landscape width)
    const pageHeight = pdf.internal.pageSize.getHeight() // 210mm (A4 landscape height)
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

    const exportDate = (transmittalModal.date || new Date().toISOString().slice(0, 10)).replace(
      /-/g,
      '',
    )
    pdf.save(`transmittal-letter_${exportDate}.pdf`)

    // Log PDF export activity
    logAdminActivity('Report Exported', `Exported ${SACBModal.reportType} report to PDF`)

    $q.notify({
      type: 'positive',
      message: 'Transmittal Letter PDF Exported Successfully!',
    })
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: 'Failed to export Transmittal Letter PDF',
    })
  } finally {
    exportingTransmittalPDF.value = false
  }
}

async function exportPBCToPDF() {
  exportingPBCPDF.value = true
  const html2canvas = (await import('html2canvas')).default
  const jsPDF = (await import('jspdf')).default
  try {
    const element = document.querySelector('#pbc-print-content')

    if (!element) {
      $q.notify({
        type: 'negative',
        message: 'No PBC content found to export!',
      })
      return
    }
    element.classList.add('pdf-export-mode')

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    })

    element.classList.remove('pdf-export-mode')

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('2', 'mm', 'legal')

    const pageWidth = pdf.internal.pageSize.getWidth() // 297mm (A4 landscape width)
    const pageHeight = pdf.internal.pageSize.getHeight() // 210mm (A4 landscape height)
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

    const exportDate = (PBCModal.date || new Date().toISOString().slice(0, 10)).replace(/-/g, '')
    pdf.save(`PBC_${exportDate}.pdf`)

    // Log PDF export activity
    logAdminActivity('Report Exported', `Exported PBC to PDF`)

    $q.notify({
      type: 'positive',
      message: 'PBC Letter PDF Exported Successfully!',
    })
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: 'Failed to export PBC Letter PDF',
    })
  } finally {
    exportingPBCPDF.value = false
  }
}

// function getSACBDateRangeDisplay() {
//   // Determine which SACB date range to use based on which modal was opened
//   const currentDisplay = currentSacbDateRangeDisplay.value
//   const continuingDisplay = continuingSacbDateRangeDisplay.value

//   // Return the one that has data, prioritizing current
//   if (currentDisplay) return currentDisplay
//   if (continuingDisplay) return continuingDisplay
//   return 'No date range selected'
// }

//displaying full date format
function formatFullDate(dateString) {
  return date.formatDate(dateString, 'MMMM DD, YYYY')
}
//auto change sacb year
function onDateChange(field, newValue) {
  // Extract the year from the changed field
  const changedYear = new Date(newValue).getFullYear()

  // Copy existing dates
  const from = new Date(currentSacbDateRange.value.from)
  const to = new Date(currentSacbDateRange.value.to)

  // Apply the year to BOTH using the year the user actually changed
  from.setFullYear(changedYear)
  to.setFullYear(changedYear)

  currentSacbDateRange.value.from = from.toISOString().slice(0, 10)
  currentSacbDateRange.value.to = to.toISOString().slice(0, 10)
}

function onPbcDateChange(field, newValue) {
  pbcDateRange.value[field] = newValue
}

//auto change rac month
function changeMonth(newDate) {
  if (!newDate) return

  const date = new Date(newDate)

  const year = date.getFullYear()
  const month = date.getMonth() // 0–11
  const lastDay = new Date(year, month + 1, 0).getDate()

  // Update ONLY the `to` date
  CurrentRacDateRange.value.to = `${year}-${pad(month + 1)}-${pad(lastDay)}`
}

function toggleSACBDrawer() {
  sacbDrawerOpen.value = !sacbDrawerOpen.value
}

// function resetSignatories() {
//   SetupModal.Preparedby = ''
//   SetupModal.Preparedposition = null
//   SetupModal.Notedby = ''
//   SetupModal.Notedposition = null
//   SetupModal.Certifiedby = ''
//   SetupModal.Certifiedposition = null

//   logAdminActivity('Signatory Form Reset', 'Reset all signatory fields in report setup')
//   notifySuccess('Signatory fields have been reset')
// }
function resetSignatories() {
  applySavedSignatories()
  logAdminActivity('Signatory Form Reset', 'Reset signatory fields to saved barangay setup')
  notifySuccess('Signatory fields reset to your saved setup')
}

function saveAsTemplate() {
  // This could save to localStorage or send to backend
  const template = {
    preparedBy: SetupModal.Preparedby,
    preparedPosition: SetupModal.Preparedposition,
    notedBy: SetupModal.Notedby,
    notedPosition: SetupModal.Notedposition,
    certifiedBy: SetupModal.Certifiedby,
    certifiedPosition: SetupModal.Certifiedposition,
  }

  localStorage.setItem('sacbSignatoryTemplate', JSON.stringify(template))
  logAdminActivity('Signatory Template Saved', 'Saved signatory template for future use')
  notifySuccess('Signatory template saved successfully')
}
function formatCurrency(value) {
  if (value == null || value === '') return ''
  if (typeof value !== 'number') return ''
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
//
/* -------------------- LIFECYCLE -------------------- */
// onMounted(async () => {
//   await loadAllData()
//   reportStore.loadPbcAdviceList()
//   await logPageVisit('Reports')
// })

onMounted(async () => {
  await loadAllData()
  await reportStore.loadPbcAdviceList()
  await logPageVisit('Reports')
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
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 14px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #187c19;
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
  min-height: 280px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

/* Card styling */
.transmittal-card {
  min-height: 220px;
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
  /* A4 Landscape aspect ratio (width:height = 1.414:1) */
  width: min(100%, 420mm); /* A4 landscape width */
  min-height: 297mm; /* A4 landscape height */
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

.print-modal > .a4-divider {
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
  color: #187c19;
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
  background: linear-gradient(135deg, #e0ffe7 0%, #69b31e 100%);
  border: 1px solid #187c19;
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
  color: #187c19;
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
  background-color: #e0ffe7;
  border-color: #187c19;
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
/* Configured for A4 Landscape layout (297mm x 210mm) */
.print-content-wrapper {
  max-width: 297mm; /* A4 landscape height (now width) */
  margin: 0 auto;
  padding: 20px;
}

.print-modal.pdf-export-mode {
  box-shadow: none !important;
  border: none !important;
  border-radius: 0 !important;
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
  background-color: #e0ffe7;
}

/* Enhanced table header styling for SACB */
.sacb-table .q-table thead tr:first-child th {
  background: linear-gradient(135deg, #187c19 0%, #0e780e 100%);
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.sacb-table .q-table thead tr:last-child th {
  background: linear-gradient(135deg, #69b31e 0%, #187c19 100%);
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
  font-weight: 100;
  color: #424242;
  font-size: small;
}

.stat-value {
  font-weight: 600;
  color: #187c19;
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
  background-color: #e0ffe7;
  border-color: #187c19;
  box-shadow: 0 2px 8px rgba(24, 124, 25, 0.1);
}

.signature-name {
  font-weight: 600;
  font-size: 1em;
  color: #187c19;
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
  background-color: #e0ffe7;
}

/* Enhanced table header styling for RAC */
.rac-table .q-table thead tr:first-child th {
  background: linear-gradient(135deg, #187c19 0%, #0e780e 100%);
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.rac-table .q-table thead tr:last-child th {
  background: linear-gradient(135deg, #69b31e 0%, #187c19 100%);
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
    /* Adjust for mobile landscape */
    width: 100% !important;
    transform: scale(1) !important;
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

  .year-filter-section {
    .filter-card .q-card__section {
      padding: 12px 16px;

      .row {
        gap: 12px;

        .mobile-actions {
          gap: 8px;

          .q-btn {
            min-height: 36px;
            font-size: 12px;

            .q-btn__content {
              .q-btn__label {
                font-size: 12px;
              }
            }
          }
        }
      }

      .q-select {
        min-width: 120px !important;
      }

      .q-btn {
        font-size: 12px;
        padding: 8px 12px;
      }
    }
  }
}

@media (max-width: 1024px) {
  .year-filter-section {
    .filter-main-section {
      .filter-desktop-layout {
        .filter-controls-section {
          .filter-input-section .year-select {
            min-width: 140px;
            max-width: 180px;
          }
        }

        .filter-actions-section {
          .reset-year-btn {
            .q-btn__content {
              .q-btn__label {
                display: none;
              }
            }
          }
        }
      }
    }
  }
}

@media (max-width: 360px) {
  .year-filter-section {
    .filter-main-section {
      .filter-mobile-layout {
        .mobile-actions {
          .q-btn {
            .q-btn__content {
              .q-btn__label {
                font-size: 11px;
              }
            }
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .summary-card {
    min-width: unset !important;
    width: 100% !important;
  }

  .chart-card,
  .responsive-card,
  .responsive-table {
    width: 100% !important;
    min-width: unset !important;
  }

  .year-filter-section {
    .filter-card .q-card__section {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;

      .row {
        justify-content: center;
      }
    }
  }
}

/* Year filter section improvements */
.year-filter-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.year-filter-section .row {
  align-items: center;
  gap: 8px;
}

.year-filter-section .q-select {
  min-width: 120px;
}

.year-filter-section .q-btn {
  border-radius: 6px;
  transition: all 0.2s ease;
}

.year-filter-section .q-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
}

/* Added preview table styles to match the reference design */
.preview-table-container {
  width: 100%;
  margin: 20px 0;
  border: 2px solid #dee2e6;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  text-align: center;
  font-weight: bold;
  font-size: 14px;
  padding: 12px;
  background: linear-gradient(135deg, #187c19 0%, #0e780e 100%);
  color: white;
  border-bottom: 2px solid #dee2e6;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.preview-table th,
.preview-table td {
  border: 1px solid #dee2e6;
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}

/* Main header row styling */
.preview-table .header-row-main th {
  background: whitesmoke;
  color: black;
  font-weight: 600;
  font-size: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-transform: uppercase;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  text-align: center;
  justify-content: center;
  align-items: center;
}

/* Expense class header styling */
.preview-table .col-expense-class {
  background: whitesmoke !important;
  color: black !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-transform: uppercase !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
  text-align: center !important;
  justify-content: center;
  align-items: center;
}

/* Obligation header styling */
.preview-table .col-obligation-header {
  background: whitesmoke !important;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: black !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  text-transform: uppercase !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
  text-align: center !important;
  justify-content: center;
  align-items: center;
}

/* Regular header row styling */
.preview-table .header-row th {
  background: whitesmoke;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: black;
  font-weight: 600;
  font-size: 12px;
  justify-content: center;
  align-items: center;
  text-align: center;
  text-transform: uppercase;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.preview-table .text-right {
  text-align: right;
}

.preview-table .font-weight-bold {
  font-weight: bold;
}

.preview-table tr:nth-child(even) {
  background-color: #f8f9fa;
}

.preview-table tr:hover {
  background-color: #e0ffe7;
}

.preview-table .data-row:nth-child(even) {
  background: #f8f9fa;
}

.preview-table .total-row {
  background: #e9ecef;
  font-weight: bold;
}

/* Column widths to match preview */
.col-date {
  width: 8%;
}
.col-particulars {
  width: 20%;
}
.col-dv {
  width: 15%;
}
.col-payee {
  width: 15%;
}
.col-appropriation {
  width: 12%;
}
.col-account-title {
  width: calc((100% - 70%) / max(1, var(--dynamic-columns, 1)));
  min-width: 80px;
  text-align: center;
}

/* Set CSS custom property for dynamic columns */
.preview-table {
  --dynamic-columns: 1;
}

.preview-table[data-columns='0'] {
  --dynamic-columns: 1;
}
.preview-table[data-columns='1'] {
  --dynamic-columns: 1;
}
.preview-table[data-columns='2'] {
  --dynamic-columns: 2;
}
.preview-table[data-columns='3'] {
  --dynamic-columns: 3;
}
.preview-table[data-columns='4'] {
  --dynamic-columns: 4;
}
.preview-table[data-columns='5'] {
  --dynamic-columns: 5;
}

/* Print styles */
@media print {
  .preview-table-container {
    page-break-inside: avoid;
    border: 2px solid #dee2e6;
    border-radius: 8px;
  }

  .preview-table {
    font-size: 10px;
  }

  .preview-table th,
  .preview-table td {
    padding: 4px 6px;
    border: 1px solid #dee2e6;
  }

  .preview-header {
    background: linear-gradient(135deg, #187c19 0%, #0e780e 100%) !important;
    color: black !important;
  }

  /* Main header row print styling */
  .preview-table .header-row-main th {
    background: linear-gradient(135deg, #187c19 0%, #0e780e 100%) !important;
    color: black !important;

    font-size: 20px;
  }

  /* Regular header row print styling */
  .preview-table .header-row th {
    background: linear-gradient(135deg, #69b31e 0%, #187c19 100%) !important;
    color: black !important;
  }

  /* Landscape print optimization */
  .print-modal {
    transform: none !important;
    margin: 0 !important;
    padding: 20px !important;
    width: 100% !important;
    min-height: auto !important;
  }

  .print-content-wrapper {
    max-width: none !important;
    padding: 10px !important;
  }
}

/* Financial Report Table - Exact Match to Reference Image */
.financial-report-table {
  border: 2px solid #000;
  background: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
}

.table-header {
  background: #f0f0f0;
  border-bottom: 2px solid #000;
}

/* .header-row {
  display: grid;
  grid-template-columns: 1fr 120px 120px 120px;
  min-height: 40px;
  align-items: center;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #000;
} */
.header-row {
  /* display:inline-tabl; */
  grid-template-columns: auto 1fr repeat(auto-fill, 120px);
  min-height: 40px;
  align-items: center;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #000;
}
.table-body {
  background: white;
}

.main-section {
  border-bottom: 2px solid #000;
}

.main-section:last-child {
  border-bottom: none;
}

.main-section-header {
  display: grid;
  grid-template-columns: 1fr 120px 120px 120px;
  min-height: 40px;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #000;
  font-weight: 600;
  font-size: 16px;
  color: #000;
}

.main-section-title {
  font-weight: 600;
  font-size: 16px;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.main-section-total {
  font-weight: 600;
  font-size: 14px;
  color: #000;
  font-family: 'Courier New', monospace;
}

.subcategory-row,
.subsubcategory-row {
  display: grid;
  grid-template-columns: 1fr 120px 120px 120px;
  min-height: 32px;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 14px;
  color: #000;
}

.subcategory-row:hover,
.subsubcategory-row:hover {
  background-color: #f8f9fa;
}

/* Sub-category (like "Honorarium", "Other Personnel Benefits") */
.subcategory-row {
  background-color: white;
  font-weight: 400;
  padding-left: 20px;
}

.subcategory-text {
  font-weight: 400;
  font-size: 14px;
  color: #000;
}

.subcategory-indent {
  margin-right: 8px;
  font-weight: bold;
  color: #000;
  font-size: 16px;
}

/* Sub-sub-category (like "Monetization of Leave Credits") */
.subsubcategory-row {
  background-color: white;
  font-weight: 400;
  padding-left: 40px;
}

.subsubcategory-text {
  font-weight: 400;
  font-size: 14px;
  color: #000;
}

.subsubcategory-indent {
  margin-right: 8px;
  font-weight: bold;
  color: #000;
  font-size: 16px;
}

/* Sub-sub-sub-category (like individual sub-items) */
.subsubsubcategory-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 32px;
  padding: 4px 16px 4px 60px;
  background-color: white;
  border-bottom: 1px solid #f0f0f0;
}

.subsubsubcategory-text {
  font-weight: 400;
  font-size: 13px;
  color: #666;
}

.subsubsubcategory-indent {
  margin-right: 8px;
  font-weight: bold;
  color: #666;
  font-size: 14px;
}

.amount-group {
  display: grid;
  grid-template-columns: 120px 120px 120px;
  gap: 8px;
  align-items: center;
}

.col-description {
  text-align: left;
  padding-right: 16px;
}

.col-appropriation,
.col-obligation,
.col-balance {
  text-align: right;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #000;
}

/* Total Row */
.total-row {
  /* display: grid; */
  grid-template-columns: auto 1fr repeat(auto-fill, 120px);
  min-height: 40px;
  align-items: center;
  padding: 8px 12px;
  background: #e9ecef;
  border-top: 2px solid #000;
  font-weight: 600;
  font-size: 14px;
  color: #000;
}

/* No Data Message */
.no-data-message {
  display: grid;
  grid-template-columns: 1fr 120px 120px 120px;
  min-height: 40px;
  align-items: center;
  padding: 8px 12px;
  text-align: center;
  color: #666;
  font-style: italic;
}

/* Expand/collapse functionality styles */
.section-content,
.type-content,
.item-content-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-btn {
  min-width: 24px !important;
  width: 24px !important;
  height: 24px !important;
  padding: 0 !important;
  margin: 0 !important;
  color: #187c19 !important;
}

.expand-btn:hover {
  background-color: rgba(24, 124, 25, 0.1) !important;
}

.expand-spacer {
  width: 24px;
  height: 24px;
  display: inline-block;
}

.annex-label {
  font-family: 'Times New Roman', Times, serif;
  text-align: right;
  font-weight: 500;
  font-size: 11px;
  margin-bottom: 1px;
}

.transmittal-serif {
  margin-bottom: -4px;
  font-size: 18px;
  font-family: 'Times New Roman', Times, serif;
}

.transmittal-serif-body {
  margin-bottom: -6px;
  font-size: 14px;
  font-family: 'Times New Roman', Times, serif;
}

.after-body {
  font-weight: 900;
  -webkit-text-stroke: 2px currentColor;
  letter-spacing: 2px;
  font-size: 16px;
}

.transmittal-body {
  /* font-family: 'Times New Roman', Times, serif; */
  margin-left: 50px;
  font-weight: 300;
  font-size: 14px;
  line-height: 1.5;
}

.transmittal-bottom {
  /* font-family: 'Times New Roman', Times, serif; */
  font-weight: 300;
  font-size: 14px;
  line-height: 1.5;
}

.transmittal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.transmittal-table-payroll {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.transmittal-table th,
.transmittal-table td {
  border: 1px solid #000;
  padding: 6px 10px;
  vertical-align: middle;
  text-align: center;
}

.transmittal-table-payroll th {
  border: 1px solid #000;
  padding: 6px 10px;
  text-align: center;
  vertical-align: middle;
}

.transmittal-table-payroll td {
  border: 1px solid #000;
  padding: 6px 10px;
  vertical-align: middle;
}

.transmittal-table thead th {
  font-weight: 700;
  text-transform: uppercase;
}

.transmittal-table tbody td:nth-child(5) {
  /* PAYEE column left-aligned */
  text-align: left;
}

.transmittal-total-row td {
  font-weight: 700;
}

.transmittal-signature-name {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  border-bottom: 1px solid #000;
  padding-bottom: 4px;
  margin-bottom: 4px;
  min-height: 20px;
}

.transmittal-signature-position {
  font-size: 13px;
  color: #555;
}

.pbc-header-block {
  text-align: center;
  font-family: 'Times New Roman', Times, serif;
}
.pbc-republic,
.pbc-province {
  font-size: 12px;
}
.pbc-city,
.pbc-barangay {
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
}
.pbc-title {
  text-align: center;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  -webkit-text-stroke: 1.5px currentColor;
  letter-spacing: 1.5px;
  margin: 16px 0 24px;
  color: #000;
}
.pbc-to-block {
  font-size: 13px;
  color: #000;
}
.pbc-body,
.pbc-footer-text {
  font-size: 13px;
  line-height: 1.6;
}
/* .pbc-en {
  color: #187c19;
} */
.pbc-fil {
  font-style: italic;
  font-weight: 600;
  letter-spacing: -0.2px;
  margin-bottom: 6px;
}
.pbc-footer-text .pbc-en,
.pbc-footer-text .pbc-fil {
  text-indent: 80px;
}
.pbc-blank {
  border-bottom: 1px solid #000;
  padding: 0 4px;
}
.pbc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-top: 16px;
}
.pbc-table th,
.pbc-table td {
  border: 1px dotted #666;
  padding: 6px 10px;
  /* text-align: center; */
}
.pbc-table thead th {
  font-weight: 700;
  text-transform: uppercase;
  border-bottom: 1px solid #000;
}
/* .pbc-bank-group-row td {
  background: #f5f5f5;
  align-items: start;
} */
.pbc-nothing-follows-row td {
  font-style: italic;
  font-weight: 600;
}
.pbc-total-row td {
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
}
.pbc-signature-name {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  border-bottom: 1px solid #000;
  padding-bottom: 4px;
  margin-bottom: 4px;
  min-height: 20px;
}
.pbc-signature-position {
  font-size: 13px;
  color: #555;
}
.pbc-page-footer {
  font-size: 11px;
  color: #666;
  margin-top: 24px;
}

/* Responsive adjustments for financial report table */
@media (max-width: 768px) {
  .header-row,
  .main-section-header,
  .subcategory-row,
  .subsubcategory-row,
  .total-row,
  .no-data-message {
    grid-template-columns: 1fr 80px 80px 80px;
    padding: 6px 8px;
    min-height: 36px;
  }

  .subsubsubcategory-row {
    padding: 6px 8px 6px 48px;
  }

  .amount-group {
    grid-template-columns: 80px 80px 80px;
    gap: 6px;
  }

  .col-appropriation,
  .col-obligation,
  .col-balance {
    font-size: 11px;
  }

  .main-section-title {
    font-size: 14px;
  }

  .subcategory-text {
    font-size: 13px;
  }

  .subsubcategory-text {
    font-size: 12px;
  }

  .subcategory-row {
    padding-left: 16px;
  }

  .subsubcategory-row {
    padding-left: 32px;
  }
}

@media (max-width: 600px) {
  .header-row,
  .main-section-header,
  .subcategory-row,
  .subsubcategory-row,
  .total-row,
  .no-data-message {
    grid-template-columns: 1fr 60px 60px 60px;
    padding: 4px 6px;
    min-height: 32px;
  }

  .subsubsubcategory-row {
    padding: 4px 6px 4px 36px;
  }

  .amount-group {
    grid-template-columns: 60px 60px 60px;
    gap: 4px;
  }

  .col-appropriation,
  .col-obligation,
  .col-balance {
    font-size: 10px;
  }

  .main-section-title {
    font-size: 13px;
  }

  .subcategory-text {
    font-size: 12px;
  }

  .subsubcategory-text {
    font-size: 11px;
  }

  .subcategory-row {
    padding-left: 12px;
  }

  .subsubcategory-row {
    padding-left: 24px;
  }
}
</style>
