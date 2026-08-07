//DisbursementTran.vue
<template>
  <q-page class="q-pa-md disbursement-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-medium">Disbursement Transaction</div>
          <div class="text-caption text-grey-6">
            Showing transactions for fiscal year {{ currentFiscalYear }}
          </div>
        </div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="refreshData"
          :loading="loading"
          title="Refresh disbursements"
        />
      </div>
    </div>

    <!-- TYPE NAVIGATION CARDS -->
    <div class="q-mb-md">
      <div class="row q-col-gutter-sm">
        <!-- Regular -->
        <div class="col-md-4 col-sm-12">
          <q-card
            :class="[
              'type-nav-card',
              { 'type-nav-active': selectedDisbursementType === 'regular' },
            ]"
            @click="handleTypeNavClick('regular')"
            clickable
            v-ripple
          >
            <q-card-section class="text-center q-pa-md">
              <q-icon
                name="list"
                size="md"
                class="q-mb-sm"
                :color="selectedDisbursementType === 'regular' ? 'white' : 'grey-7'"
              />
              <div class="text-subtitle2 text-weight-medium">Regular</div>
              <div class="text-caption q-mt-xs type-count">
                {{ typeCounts.regular }} transaction{{ typeCounts.regular !== 1 ? 's' : '' }}
              </div>
            </q-card-section>
            <!-- Add button shown when this card is active -->
            <div v-if="selectedDisbursementType === 'regular'" class="type-nav-add-btn">
              <q-btn
                round
                flat
                dense
                icon="add"
                size="sm"
                @click.stop="openDialogForType('regular')"
                v-permission="'add'"
                title="Add Regular Disbursement"
              />
            </div>
          </q-card>
        </div>

        <!-- BIR Remittance -->
        <div class="col-md-4 col-sm-12">
          <q-card
            :class="[
              'type-nav-card',
              'type-nav-bir',
              { 'type-nav-active type-nav-active-bir': selectedDisbursementType === 'bir' },
            ]"
            @click="handleTypeNavClick('bir')"
            clickable
            v-ripple
          >
            <q-card-section class="text-center q-pa-md">
              <q-icon
                name="receipt"
                size="md"
                class="q-mb-sm"
                :color="selectedDisbursementType === 'bir' ? 'white' : 'deep-orange'"
              />
              <div class="text-subtitle2 text-weight-medium">BIR Remittance</div>
              <div class="text-caption q-mt-xs type-count">
                {{ typeCounts.bir }} transaction{{ typeCounts.bir !== 1 ? 's' : '' }}
              </div>
            </q-card-section>
            <div v-if="selectedDisbursementType === 'bir'" class="type-nav-add-btn">
              <q-btn
                round
                flat
                dense
                icon="add"
                size="sm"
                @click.stop="openDialogForType('bir')"
                v-permission="'add'"
                title="Add BIR Remittance"
              />
            </div>
          </q-card>
        </div>

        <!-- SK / Provincial Aid -->
        <div class="col-md-4 col-sm-12">
          <q-card
            :class="[
              'type-nav-card',
              'type-nav-sk',
              { 'type-nav-active type-nav-active-sk': selectedDisbursementType === 'sk' },
            ]"
            @click="handleTypeNavClick('sk')"
            clickable
            v-ripple
          >
            <q-card-section class="text-center q-pa-md">
              <q-icon
                name="swap_horiz"
                size="md"
                class="q-mb-sm"
                :color="selectedDisbursementType === 'sk' ? 'white' : 'blue-10'"
              />
              <div class="text-subtitle2 text-weight-medium">SK / Provincial Aid</div>
              <div class="text-caption q-mt-xs type-count">
                {{ typeCounts.sk }} transaction{{ typeCounts.sk !== 1 ? 's' : '' }}
              </div>
            </q-card-section>
            <div v-if="selectedDisbursementType === 'sk'" class="type-nav-add-btn">
              <q-btn
                round
                flat
                dense
                icon="add"
                size="sm"
                @click.stop="openDialogForType('sk')"
                v-permission="'add'"
                title="Add SK / Provincial Aid"
              />
            </div>
          </q-card>
        </div>
      </div>

      <!-- BIR SUMMARY STRIP — shows only when BIR card is active -->
      <q-slide-transition>
        <div v-if="selectedDisbursementType === 'bir'" class="q-mb-xs q-mt-md">
          <q-card flat bordered class="bir-summary-strip full-width">
            <div class="row items-stretch">
              <div class="col-4 bir-summary-cell">
                <div class="row q-col-gutter-sm">
                  <q-icon name="receipt_long" size="20px" color="deep-orange" />
                  <div class="bir-summary-label">Total Withheld</div>
                </div>
                <div class="bir-summary-value text-deep-orange">
                  ₱{{ birTotalWithheld.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </div>
              </div>

              <q-separator vertical inset />

              <div class="col-4 bir-summary-cell">
                <div class="row q-col-gutter-sm">
                  <q-icon name="check_circle" size="20px" color="green-7" />
                  <div class="bir-summary-label">Remitted</div>
                </div>
                <div class="bir-summary-value text-green-8">
                  ₱{{ birRemitted.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </div>
              </div>

              <q-separator vertical inset />

              <div class="col-4 bir-summary-cell">
                <div class="row q-col-gutter-sm">
                  <q-icon name="schedule" size="20px" color="amber-9" />
                  <div class="bir-summary-label">Available for Remittance</div>
                </div>
                <div class="bir-summary-value text-amber-9">
                  ₱{{ birAvailable.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </div>
              </div>
            </div>

            <!-- Signature element: proportion of withheld tax already remitted -->
            <div class="bir-progress-track">
              <div class="bir-progress-fill" :style="{ width: birRemittedPercent + '%' }" />
            </div>
            <div class="row items-center justify-end q-px-md q-pb-xs">
              <span class="text-caption text-grey-6">
                {{ birRemittedPercent.toFixed(0) }}% of withheld tax remitted
              </span>
            </div>
          </q-card>
        </div>
      </q-slide-transition>
    </div>

    <!-- Filters Section -->
    <q-card flat bordered class="q-mb-md filters-section">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Status Filter -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Status:</q-item-label>
            <q-select
              outlined
              dense
              v-model="selectedStatus"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              :label="currentStatusLabel"
              clearable
            />
          </div>

          <!-- Search Input -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Search:</q-item-label>
            <q-input
              outlined
              dense
              v-model="searchQuery"
              placeholder="Search payee, DV number..."
              clearable
            >
              <template v-slot:append><q-icon name="search" /></template>
            </q-input>
          </div>

          <!-- Date Range Filter -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Date Range:</q-item-label>
            <q-input
              outlined
              dense
              v-model="dateRangeDisplay"
              placeholder="Select date range..."
              readonly
              clearable
              @clear="onDateRangeClear"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="dateRange" range @update:model-value="onDateRangeChange">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Clear Button -->
          <div class="col-md-1 col-sm-6 col-xs-12">
            <q-btn
              dense
              outlined
              color="red-10"
              icon="clear_all"
              label="Clear"
              @click="clearAllFilters"
              class="full-width"
            />
          </div>

          <div class="col"></div>

          <!-- Add Button -->
          <div class="col-auto">
            <q-btn
              :label="`Add`"
              color="primary"
              icon="add"
              @click="openDialogForType(selectedDisbursementType)"
              v-permission="'add'"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- MAIN DISBURSEMENT DIALOG -->
    <div class="q-mb-sm">
      <!--  REGULAR DISBURSEMENT DIALOG  -->
      <q-dialog v-model="store.dialogs.disbursement" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 960px; max-width: 96vw">
          <q-card-section class="q-pb-none justify-between row">
            <div class="row items-center q-gutter-sm">
              <q-icon name="list" color="primary" size="sm" />
              <div class="text-h6">Regular Disbursement</div>
            </div>
          </q-card-section>

          <!-- Header fields: Date, DV Number, Payee -->
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px"
                  >Date:</q-item-label
                >
                <q-input
                  outlined
                  dense
                  v-model="store.forms.disbursement.date"
                  mask="##/##/####"
                  @keydown.enter="handleEnterKey"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-not-allowed" />
                  </template>
                </q-input>
              </div>
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px"
                  >DV Number:</q-item-label
                >
                <q-input
                  outlined
                  dense
                  v-model="store.forms.disbursement.dvNumber"
                  @keydown.enter="handleEnterKey"
                />
              </div>
              <div class="col-md-4 col-sm-6">
                <q-item-label
                  class="text-caption q-mb-xs"
                  style="font-weight: bold; font-size: 13px"
                  >Fund: <strong class="text-red">*</strong></q-item-label
                >
                <q-select
                  outlined
                  dense
                  v-model="store.forms.expense.fund"
                  :options="fundOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Select Fund"
                  @update:model-value="onDeductionTypeChange"
                />
              </div>
            </div>
            <div class="row q-col-gutter-sm q-mb-sm q-mt-xs">
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px"
                  >Payee: <strong class="text-red">*</strong></q-item-label
                >
                <q-select
                  outlined
                  dense
                  v-model="store.forms.disbursement.payee"
                  :options="filteredPayeeOptions"
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="0"
                  new-value-mode="add-unique"
                  label="Select Payee"
                  option-label="label"
                  option-value="label"
                  map-options
                  emit-value
                  @filter="filterPayeeOptions"
                  @input-value="onPayeeInputValue"
                  @update:model-value="onPayeeSelected"
                  @keydown.enter="handleEnterKey"
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey"> Type a new payee name </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px"
                  >Payee 2:</q-item-label
                >
                <q-input
                  outlined
                  dense
                  v-model="store.forms.disbursement.payee2"
                  @update:model-value="onPayee2Input"
                  @keydown.enter="handleEnterKey"
                />
              </div>

              <div class="col-4">
                <q-item-label
                  class="text-caption q-mb-xs"
                  style="font-weight: bold; font-size: 13px"
                  >Taxpayer Type: <strong class="text-red">*</strong></q-item-label
                >
                <q-select
                  outlined
                  dense
                  v-model="store.forms.expense.taxpayerType"
                  :options="taxpayerTypeOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Select Type"
                  @update:model-value="onDeductionTypeChange"
                />
              </div>
              <!-- <div class="col-4">
                <div class="text-caption q-mb-xs" style="font-weight: bold; font-size: 13px;">Tax Type: <strong
                    class="text-red">*</strong></div>
                <q-select outlined dense v-model="store.forms.expense.taxType" :options="taxTypeOptions"
                  option-label="label" option-value="value" emit-value map-options label="Select Type"
                  @update:model-value="onDeductionTypeChange" />
              </div> -->
            </div>
          </q-card-section>

          <q-separator />

          <!-- Expense Accounts Section -->
          <q-card-section class="q-pt-sm q-pb-none">
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-subtitle2 text-weight-medium">Expense Accounts</span>
              <q-btn
                label=""
                size="sm"
                color="primary"
                class="shadow-1"
                outline
                style="min-width: 20px"
                @click="handleAddExpense"
                @mouseenter="preloadExpenseAccounts"
                :loading="addingExpense || store.expenseTypeLoading"
                v-permission="'add'"
              >
                <q-icon name="add" size="18px" class="text-weight-bold" />
              </q-btn>
            </div>

            <div class="expense-acc-block">
              <table class="expense-inline-table full-width">
                <thead>
                  <tr>
                    <th style="width: 36px">#</th>
                    <th>Acc</th>
                    <th>Particulars</th>
                    <th style="text-align: right; width: 140px">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!store.expenses || store.expenses.length === 0">
                    <td colspan="8" class="text-center text-grey-5 text-caption q-pa-md">
                      No expense accounts added yet. Click "Add Expense Account" to begin.
                    </td>
                  </tr>
                  <tr
                    v-for="(row, idx) in store.expenses"
                    :key="row.id"
                    class="text-weight-medium text-grey-8"
                    style="font-size: 12px"
                  >
                    <td class="text-grey-6">{{ idx + 1 }}</td>
                    <td>
                      <div class="text-weight-medium text-grey-8" style="font-size: 12px">
                        {{ row.accountName }}
                      </div>
                      <div class="text-grey-5" style="font-size: 11px">
                        Bal: ₱{{
                          (
                            store.expenseAccounts.find(
                              (a) => String(a.id) === String(row.accountId),
                            )?.balance ?? 0
                          ).toLocaleString('en-US', { minimumFractionDigits: 2 })
                        }}
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
                    <td class="row items-center justify-end q-gutter-xs">
                      <q-btn
                        size="sm"
                        flat
                        round
                        color="green"
                        icon="edit"
                        @click="editExpenseInline(row)"
                      />
                      <q-btn
                        flat
                        round
                        color="negative"
                        icon="cancel"
                        size="sm"
                        @click="handleDeleteExpense(row)"
                      />
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="bankChequeRows.length > 0">
                  <tr class="expense-acc-footer">
                    <td colspan="3" class="text-right text-caption text-grey-8">
                      Total Bank Cheques:
                    </td>
                    <td style="text-align: right" class="text-weight-bold">
                      ₱{{ bankChequeTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>

              <!-- Footer subtotal -->
              <div
                v-if="store.expenses && store.expenses.length > 0"
                class="expense-acc-footer row items-center justify-end q-px-md q-py-xs"
              >
                <span class="text-caption text-grey-8">
                  Total Gross Amount:
                  <strong class="text-grey-10 q-ml-sm" style="font-size: 14px">
                    ₱{{
                      (store.totalExpensesAmount || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })
                    }}
                  </strong>
                </span>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-subtitle2 text-weight-medium">Deductions</div>
              <q-btn
                label=""
                unelevated
                size="sm"
                color="primary"
                outline
                class="shadow-1 text-weight-bold"
                style="background: #f5a623; color: white; min-width: 20px"
                @click="openDeductionDialog"
              >
                <q-icon name="add" size="18px" class="text-weight-bold" />
              </q-btn>
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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-if="
                      !store.forms.expense.deductions || store.forms.expense.deductions.length === 0
                    "
                  >
                    <td
                      colspan="8"
                      class="text-center text-grey-5 text-caption q-pa-md"
                      style="min-height: 80px"
                    >
                      No deductions added yet.
                    </td>
                  </tr>
                  <tr
                    v-for="(ded, idx) in store.forms.expense.deductions || []"
                    :key="ded.id"
                    class="text-weight-medium text-grey-8"
                    style="font-size: 12px"
                  >
                    <td class="text-grey-6">{{ idx + 1 }}</td>
                    <td>{{ ded.deductionTypeName || '—' }}</td>
                    <td>{{ ded.taxTypeName || '—' }}</td>
                    <td>{{ ded.description || '—' }}</td>
                    <td>
                      ₱{{
                        (Number(ded.gross_vat_inc) || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })
                      }}
                    </td>
                    <td>
                      {{ ded.percent != null ? `${ded.percent}%` : '—' }}
                    </td>
                    <td style="text-align: right" class="text-weight-medium">
                      ₱{{
                        (Number(ded.amount) || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })
                      }}
                    </td>
                    <td class="row items-center justify-end q-gutter-xs">
                      <q-btn
                        size="sm"
                        flat
                        round
                        color="green"
                        icon="edit"
                        @click="editDeductionRow(ded)"
                      />
                      <q-btn
                        size="sm"
                        flat
                        round
                        color="negative"
                        icon="cancel"
                        @click="removeRow(ded)"
                      />
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
                  <strong class="text-grey-10 q-ml-sm" style="font-size: 14px; color: #e53935">
                    ₱{{
                      totalDeductionAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                    }}
                  </strong>
                </span>
              </div>
            </div>
          </q-card-section>

          <!-- Total -->
          <q-card-section class="q-pt-sm q-pb-none">
            <div class="row items-center justify-end q-gutter-sm">
              <span class="text-caption text-grey-6">Net amount:</span>
              <q-input
                outlined
                dense
                readonly
                style="width: 220px"
                :model-value="`₱${netDisbursementAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
              />
            </div>
          </q-card-section>

          <q-card-section class="q-pb-xs">
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-subtitle2 text-weight-medium">Bank Cheques</div>

              <div class="row items-center">
                <q-btn
                  label=""
                  size="sm"
                  color="primary"
                  outline
                  class="shadow-1"
                  style="min-width: 20px; height: 15px"
                  @click="openBankChequeDialog"
                >
                  <q-icon name="add" size="18px" class="text-weight-bold" />
                </q-btn>
              </div>
            </div>

            <div class="expense-acc-block">
              <table class="expense-inline-table full-width">
                <thead>
                  <tr>
                    <th>Bank</th>
                    <th>Cheque Number</th>
                    <th>Cheque Date</th>
                    <!-- <th>Status</th> -->
                    <th style="text-align: right; width: 140px">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="bankChequeRows.length === 0">
                    <td colspan="6" class="text-center text-grey-5 text-caption q-pa-md">
                      No bank cheques added yet.
                    </td>
                  </tr>
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
                    <td class="row items-center justify-end q-gutter-xs">
                      <q-btn
                        size="sm"
                        flat
                        round
                        color="green"
                        icon="edit"
                        @click="editBankCheque(row)"
                      />
                      <q-btn
                        size="sm"
                        flat
                        round
                        color="negative"
                        icon="cancel"
                        @click="removeBankCheque(row.id)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="handleDialogClose('disbursement')" />
            <q-btn
              label="Disburse"
              color="primary"
              style="min-width: 145px"
              @click="handleSaveClick"
              v-permission="'add'"
              :loading="store.savingDisbursement"
              :disable="store.savingDisbursement"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="bankChequeDialogOpen" persistent>
        <q-card style="min-width: 560px; max-width: 90vw">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">{{ editingBankChequeId ? 'Edit Cheque' : 'Add Cheque' }}</div>
            <q-space />
            <q-btn icon="close" flat round dense @click="closeBankChequeDialog" />
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption q-mb-xs">Bank: <strong class="text-red">*</strong></div>
                <q-select
                  outlined
                  dense
                  v-model="bankChequeForm.bank_id"
                  :options="configuredBankOptions"
                  option-label="name"
                  option-value="id"
                  emit-value
                  map-options
                  label="Select bank"
                  @update:model-value="handleBankChequeBankSelect"
                />
              </div>
              <div class="col-6">
                <div class="text-caption q-mb-xs">
                  Cheque Number: <strong class="text-red">*</strong>
                </div>
                <q-input
                  outlined
                  dense
                  readonly
                  v-model="bankChequeForm.cheque_number"
                  placeholder="Auto-generated"
                />
              </div>
              <div class="col-6">
                <div class="text-caption q-mb-xs">Cheque Date:</div>
                <q-input
                  outlined
                  dense
                  v-model="bankChequeForm.cheque_date"
                  mask="##/##/####"
                  placeholder="MM/DD/YYYY"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="bankChequeForm.cheque_date" mask="MM/DD/YYYY">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-6">
                <div class="text-caption q-mb-xs">Amount: <strong class="text-red">*</strong></div>
                <q-input
                  outlined
                  dense
                  :model-value="bankChequeForm.amountDisplay"
                  prefix="₱"
                  placeholder="0.00"
                  inputmode="decimal"
                  input-class="text-right"
                  @update:model-value="onBankChequeAmountInput"
                  @blur="onBankChequeAmountBlur"
                  @focus="onBankChequeAmountFocus"
                  @keydown="blockNonNumeric"
                />
              </div>
            </div>
            <div class="row justify-between">
              <div class="row col-6 justify-start">
                <q-chip
                  dense
                  square
                  :color="bankChequeForm.bank_status === 'online' ? 'green-1' : 'grey-3'"
                  :text-color="bankChequeForm.bank_status === 'online' ? 'green-9' : 'grey-8'"
                  class="q-mr-sm q-mt-sm text-capitalize"
                >
                  {{ bankChequeForm.bank_status || 'Status from setup' }}
                </q-chip>
              </div>
              <div
                class="col balance-chip q-mt-xs justify-end"
                :class="{ 'balance-chip--zero': bankChequeBalance <= 0 }"
                @click="applyBalanceToChequeAmount"
                title="Click to fill remaining balance"
              >
                <q-icon name="account_balance_wallet" size="13px" class="q-mr-xs" />
                <span>Balance:</span>
                <span class="balance-chip__amount"
                  >₱{{
                    bankChequeBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                  }}</span
                >
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md q-pt-none">
            <q-btn flat label="Cancel" @click="closeBankChequeDialog" />
            <q-btn label="Add" color="primary" @click="confirmAddBankCheque" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!--  BIR REMITTANCE DIALOG  -->
      <q-dialog v-model="showBirDialog" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 960px; max-width: 96vw">
          <q-card-section class="q-pb-none">
            <div class="row items-center q-gutter-sm">
              <q-icon name="receipt" color="deep-orange" size="sm" />
              <div class="text-h6 text-deep-orange">
                {{ editingBirId ? 'Edit BIR Remittance' : 'BIR Remittance' }}
              </div>
            </div>
          </q-card-section>

          <!-- Banner -->
          <q-card-section class="q-pb-none">
            <q-banner class="bg-amber-1 text-amber-10" rounded dense>
              <template v-slot:avatar><q-icon name="info" color="amber-10" /></template>
              BIR Remittance will not reflect on SACB and RAC reports.
            </q-banner>
          </q-card-section>

          <!-- Header fields: Date, DV Number, Payee -->
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-md-4">
                <q-item-label class="q-mb-xs">Date: <span class="text-red">*</span></q-item-label>
                <q-input
                  outlined
                  dense
                  v-model="birForm.date"
                  mask="##/##/####"
                  @keydown.enter="handleEnterKey"
                >
                  <template v-slot:append
                    ><q-icon name="event" class="cursor-not-allowed"
                  /></template>
                </q-input>
              </div>
              <div class="col-md-4">
                <q-item-label class="q-mb-xs">
                  DV Number: <span class="text-red">*</span>
                  <!-- <q-chip dense color="blue-1" text-color="blue-8" class="q-ml-xs" size="sm">Editable</q-chip> -->
                </q-item-label>
                <q-input
                  outlined
                  dense
                  v-model="birForm.dv_number"
                  @keydown.enter="handleEnterKey"
                />
              </div>
              <div class="col-md-4">
                <q-item-label class="q-mb-xs">Payee:</q-item-label>
                <q-input
                  outlined
                  dense
                  model-value="Bureau of Internal Revenue"
                  :disable="true"
                  bg-color="grey-2"
                />
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <!-- Cheque Rows Section -->
          <q-card-section class="q-pt-sm q-pb-none">
            <div class="row items-center justify-between q-mb-sm">
              <span class="text-subtitle2 text-weight-medium text-grey-7">Cheque Entries</span>
            </div>

            <!-- Always-visible table -->
            <div class="expense-acc-block q-mb-sm">
              <table class="expense-inline-table full-width">
                <thead>
                  <tr>
                    <th style="width: 36px">#</th>
                    <th>Bank</th>
                    <th>Cheque No.</th>
                    <th>Particular</th>
                    <th style="text-align: right; width: 160px">Amount</th>
                    <th style="width: 48px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!birChequeRows.length">
                    <td colspan="6" class="text-center text-grey-5 text-caption q-pa-md">
                      No cheque entries yet.
                    </td>
                  </tr>
                  <tr v-for="(row, idx) in birChequeRows" :key="idx">
                    <td class="text-grey-6">{{ idx + 1 }}</td>
                    <td style="min-width: 180px">
                      <q-select
                        dense
                        v-model="row.bank_id"
                        :options="configuredBankOptions"
                        option-label="name"
                        option-value="id"
                        emit-value
                        map-options
                        label="Select bank"
                        hide-bottom-space
                        @update:model-value="(bid) => handleBirRowBankSelect(idx, bid)"
                      />
                    </td>
                    <td style="min-width: 140px">
                      <q-input
                        dense
                        v-model="row.cheque_number"
                        :disable="true"
                        placeholder="Auto-generated"
                        hide-bottom-space
                      />
                    </td>
                    <td style="min-width: 160px">
                      <q-input
                        dense
                        v-model="row.particular"
                        placeholder="e.g. Remittance to BIR"
                        hide-bottom-space
                      />
                    </td>
                    <td>
                      <q-input
                        dense
                        :model-value="row.amountDisplay"
                        prefix="₱"
                        placeholder="0.00"
                        inputmode="decimal"
                        hide-bottom-space
                        @update:model-value="(v) => onBirRowAmountInput(idx, v)"
                        @blur="() => onBirRowAmountBlur(idx)"
                        @focus="() => onBirRowAmountFocus(idx)"
                        @keydown="blockNonNumeric"
                      />
                    </td>
                    <td>
                      <q-btn
                        flat
                        dense
                        round
                        icon="close"
                        color="red-4"
                        size="xs"
                        @click="removeBirChequeRow(idx)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Footer: Add button + subtotal, matching regular dialog style -->
              <div class="expense-acc-footer row items-center justify-between q-px-md q-py-xs">
                <q-btn
                  flat
                  dense
                  size="sm"
                  icon="add"
                  label="Add cheque"
                  color="deep-orange"
                  @click="addBirChequeRow"
                />
                <span class="text-caption text-grey-6">
                  Total:
                  <strong class="text-grey-9">
                    ₱{{ birTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                  </strong>
                </span>
              </div>
            </div>
          </q-card-section>

          <!-- Total -->
          <q-card-section class="q-pt-sm">
            <div class="row items-center justify-end q-gutter-sm">
              <span class="text-caption text-grey-6">Total BIR remittance amount:</span>
              <q-input
                outlined
                dense
                readonly
                style="width: 220px"
                :model-value="`₱${birTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="showBirDialog = false" />
            <q-btn
              :label="editingBirId ? 'Save' : 'Disburse'"
              color="deep-orange"
              icon="receipt"
              @click="handleSaveBir"
              v-permission="'add'"
              :loading="savingBir"
              :disable="savingBir"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!--  SK / PROVINCIAL AID DIALOG ─ -->
      <q-dialog v-model="showSkDialog" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 900px; max-width: 95vw">
          <q-card-section class="q-pb-none">
            <div class="row items-center q-gutter-sm">
              <q-icon name="swap_horiz" color="blue-10" size="sm" />
              <div class="text-h6 text-blue-10">
                {{ editingSkId ? 'Edit SK / Provincial Aid' : 'SK / Provincial Aid' }}
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-banner class="bg-blue-1 text-blue-10 q-mb-md" rounded>
              <template v-slot:avatar><q-icon name="info" color="blue-10" /></template>
              SK Transfer and Provincial Aid will <strong>not reflect on SACB</strong>.
            </q-banner>
            <div class="row q-col-gutter-sm">
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px"
                  >Date: <span class="text-red">*</span></q-item-label
                >
                <q-input outlined dense v-model="skForm.date" mask="##/##/####">
                  <template v-slot:append><q-icon name="event" /></template>
                </q-input>
              </div>
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px"
                  >DV Number: <span class="text-red">*</span></q-item-label
                >
                <q-input outlined dense v-model="skForm.dv_number" placeholder="Enter DV number" />
              </div>
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px"
                  >Payee: <span class="text-red">*</span></q-item-label
                >
                <!-- <q-input outlined dense v-model="" placeholder="Enter payee name" /> -->
                <q-select
                  outlined
                  dense
                  v-model="skForm.payee"
                  :options="filteredPayeeOptions"
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="0"
                  new-value-mode="add-unique"
                  label="Select Payee"
                  option-label="label"
                  option-value="label"
                  map-options
                  emit-value
                  @filter="filterPayeeOptions"
                  @input-value="onPayeeInputValue"
                  @update:model-value="onPayeeSelected"
                  @keydown.enter="handleEnterKey"
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey"> Type a new payee name </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>

            <div class="row q-col-gutter-md q-mt-xs">
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs" style="font-weight: bold; font-size: 13px"
                  >Type: <span class="text-red">*</span></q-item-label
                >
                <q-select
                  outlined
                  dense
                  v-model="skForm.type"
                  :options="skTypeOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Select Type"
                />
              </div>
            </div>
          </q-card-section>

          <q-separator class="q-my-sm" />

          <q-card-section class="q-pt-xs q-pb-none">
            <div class="row items-center justify-between q-mb-sm">
              <span class="text-subtitle2 text-weight-medium text-grey-7">Cheque Entries</span>
            </div>

            <div class="expense-acc-block q-mb-sm">
              <table class="expense-inline-table full-width">
                <thead>
                  <tr>
                    <th style="width: 36px">#</th>
                    <th>Bank</th>
                    <th>Cheque No.</th>
                    <th style="text-align: right; width: 160px">Amount</th>
                    <th style="width: 48px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!skChequeRows.length">
                    <td colspan="5" class="text-center text-grey-5 text-caption q-pa-md">
                      No cheque entries yet.
                    </td>
                  </tr>
                  <tr v-for="(row, idx) in skChequeRows" :key="idx">
                    <td class="text-grey-6">{{ idx + 1 }}</td>
                    <td style="min-width: 180px">
                      <q-select
                        dense
                        v-model="row.bank_id"
                        :options="configuredBankOptions"
                        option-label="name"
                        option-value="id"
                        emit-value
                        map-options
                        label="Select bank"
                        hide-bottom-space
                        @update:model-value="(bid) => handleSkRowBankSelect(idx, bid)"
                      />
                    </td>
                    <td style="min-width: 140px">
                      <q-input
                        dense
                        v-model="row.cheque_number"
                        :disable="true"
                        placeholder="Auto-generated"
                        hide-bottom-space
                      />
                    </td>
                    <td>
                      <q-input
                        dense
                        :model-value="row.amountDisplay"
                        prefix="₱"
                        placeholder="0.00"
                        inputmode="decimal"
                        hide-bottom-space
                        @update:model-value="(v) => onSkRowAmountInput(idx, v)"
                        @blur="() => onSkRowAmountBlur(idx)"
                        @focus="() => onSkRowAmountFocus(idx)"
                        @keydown="blockNonNumeric"
                      />
                    </td>
                    <td>
                      <q-btn
                        flat
                        dense
                        round
                        icon="close"
                        color="red-4"
                        size="xs"
                        @click="removeSkChequeRow(idx)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <div class="expense-acc-footer row items-center justify-between q-px-md q-py-xs">
                <q-btn
                  flat
                  dense
                  size="sm"
                  icon="add"
                  label="Add cheque"
                  color="deep-orange"
                  @click="addSkChequeRow"
                />
                <span class="text-caption text-grey-6">
                  Total:
                  <strong class="text-grey-9">
                    ₱{{ skTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                  </strong>
                </span>
              </div>
            </div>
          </q-card-section>

          <q-card-section class="q-pt-sm">
            <div class="row items-center justify-end q-gutter-sm">
              <span class="text-caption text-grey-6">Total SK remittance amount:</span>
              <q-input
                outlined
                dense
                readonly
                style="width: 220px"
                :model-value="`₱${skTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="showSkDialog = false" />
            <q-btn
              :label="editingSkId ? 'Save' : 'Disburse'"
              color="primary"
              icon="swap_horiz"
              @click="handleSaveSk"
              v-permission="'add'"
              :loading="savingSk"
              :disable="savingSk"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Expense Selection Dialog -->
      <q-dialog v-model="store.dialogs.expense" persistent>
        <q-card style="min-width: 800px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Select Expense Account</div>
          </q-card-section>
          <q-card-section>
            <q-input
              outlined
              dense
              placeholder="Search expense account..."
              v-model="store.expenseSearch"
              class="q-mb-sm"
              style="width: 300px"
            >
              <template v-slot:append><q-icon name="search" /></template>
            </q-input>
            <q-table
              :rows="store.filteredExpenseAccounts"
              :columns="store.expenseAccountColumns"
              row-key="id"
              :loading="store.loading || store.expenseTypeLoading"
              :filter="store.expenseSearch"
              flat
              bordered
            >
              <template v-slot:body-cell-action="props">
                <q-td :props="props">
                  <q-btn
                    dense
                    label="Select"
                    color="primary"
                    @click="store.openExpenseDetail(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="handleDialogClose('expense')" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- add deduction -->
      <q-dialog v-model="deductionDialogOpen" persistent>
        <q-card style="min-width: 680px; max-width: 720px">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">Deduction</div>
            <q-space />
            <q-btn icon="close" flat round dense @click="closeDeductionDialog" />
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-sm q-mb-sm">
              <!-- Tax Type — now from API -->
              <div class="col-4">
                <div class="text-caption q-mb-xs">Tax Type:</div>
                <q-select
                  outlined
                  dense
                  v-model="deductionForm.taxType"
                  :options="taxTypeOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Select tax type"
                  :loading="deductionLibraryLoading"
                  @update:model-value="onTaxTypeChange"
                />
              </div>

              <!-- Deduction Type — now from API -->
              <div class="col-4">
                <div class="text-caption q-mb-xs">
                  Deduction Type: <strong class="text-red">*</strong>
                </div>
                <q-select
                  outlined
                  dense
                  v-model="deductionForm.deductionType"
                  :options="deductionTypeOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Select type"
                  :loading="deductionLibraryLoading"
                  @update:model-value="onDeductionTypeChange"
                />
              </div>

              <!-- Code — filtered from API library -->
              <div class="col-4">
                <div class="text-caption q-mb-xs">Code:</div>
                <q-select
                  outlined
                  dense
                  v-model="deductionForm.code"
                  :options="codeOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Select code"
                  :loading="deductionLibraryLoading || previewLoading"
                  @update:model-value="onCodeChange"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm q-mb-sm">
              <!-- Divisor (readonly, filled by preview) -->
              <div class="col-4">
                <div class="text-caption q-mb-xs">Divisor:</div>
                <q-input outlined dense readonly v-model="deductionForm.divisor" placeholder="0" />
              </div>

              <!-- VAT % (readonly) -->
              <div class="col-4">
                <div class="text-caption q-mb-xs">VAT %:</div>
                <q-input
                  outlined
                  dense
                  readonly
                  v-model="deductionForm.vatPercent"
                  placeholder="0.00"
                  suffix="%"
                />
              </div>

              <!-- EWT % (readonly) -->
              <div class="col-4">
                <div class="text-caption q-mb-xs">EWT %:</div>
                <q-input
                  outlined
                  dense
                  readonly
                  v-model="deductionForm.ewtPercent"
                  placeholder="0.00"
                  suffix="%"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm q-mb-md">
              <!-- Description -->
              <div class="col-4">
                <div class="text-caption q-mb-xs">Description:</div>
                <q-input
                  outlined
                  dense
                  v-model="deductionForm.description"
                  placeholder="Description"
                />
              </div>

              <!-- Gross VAT INC. (readonly, set by preview) -->
              <div class="col-4">
                <div class="text-caption q-mb-xs">Gross VAT INC.:</div>
                <q-input
                  outlined
                  dense
                  readonly
                  :model-value="formatPeso(deductionForm.grossVatInc)"
                  prefix="₱"
                  input-class="text-right"
                />
              </div>

              <!-- Gross VAT EXC. (readonly, set by preview) -->
              <div class="col-4">
                <div class="text-caption q-mb-xs">Gross VAT EXC.:</div>
                <q-input
                  outlined
                  dense
                  readonly
                  :model-value="formatPeso(deductionForm.grossVatExc)"
                  prefix="₱"
                  input-class="text-right"
                />
              </div>
            </div>

            <!-- Deduction Amount -->
            <div class="row justify-end items-center q-gutter-md">
              <span class="text-caption text-weight-bold text-uppercase" style="color: #555">
                Deduction Amount
                <q-spinner v-if="previewLoading" size="xs" class="q-ml-xs" color="primary" />
              </span>
              <q-input
                v-model="deductionAmountDisplay"
                prefix="₱"
                placeholder="0.00"
                inputmode="decimal"
                input-class="text-right text-weight-bold"
                style="min-width: 160px; border-bottom: 2px solid #303030"
                :readonly="!deductionForm.isManual"
                dense
                borderless
                @keydown="blockNonNumeric"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md q-pt-none">
            <q-btn
              :label="editingDeductionIndex !== -1 ? 'SAVE' : 'ADD'"
              unelevated
              :loading="previewLoading"
              @click="confirmAddDeduction"
              style="background: #2e7d32; color: white; min-width: 100px; font-weight: bold"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Main Data Table -->
      <q-card flat bordered>
        <!-- <q-table
  :rows="filteredDisbursements"
  :columns="mainTableColumns"
  row-key="row_id"
  v-model:pagination="store.pagination"
  :loading="store.loadingDisbursements"
  flat
  @row-dblclick="(evt, row) => handleViewDisbursement(row)"
> -->
        <q-table
          :rows="filteredDisbursements"
          :columns="mainTableColumns"
          row-key="row_id"
          :pagination="store.pagination"
          :loading="store.loadingDisbursements"
          flat
          @row-dblclick="(evt, row) => handleViewDisbursement(row)"
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <!-- <q-chip
                :color="getStatusColor(props.row.status)"
                :text-color="getStatusTextColor(props.row.status)"
                dense
                :label="props.row.status"
              /> -->
              <div
                class="text-weight-bold"
                :style="{
                  color: getStatusColor(props.row.status),
                  fontSize: '13px',
                  lineHeight: '1.4',
                }"
              >
                {{ props.row.status || '—' }}
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-bank_cheque="props">
            <q-td :props="props">
              <div class="text-weight-medium text-grey-8" style="font-size: 13px; line-height: 1.4">
                {{ props.row.bank || '—' }}
              </div>
              <div style="font-size: 12px; line-height: 1.4">
                <q-chip
                  v-if="props.row.chequeNumber"
                  dense
                  text-color="black-8"
                  size="md"
                  class="q-ma-none"
                >
                  {{ props.row.chequeNumber }}
                </q-chip>
                <span v-else class="text-grey-5 text-caption">—</span>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <!-- Regular buttons -->
              <template v-if="!props.row.type || props.row.type === 'regular'">
                <div class="action-grid-regular">
                  <q-btn
                    v-if="isApprover || authStore.admin || isTreasurer"
                    dense
                    icon="edit"
                    :color="
                      props.row.status === 'Unliquidated' || props.row.status === 'Partial'
                        ? 'orange'
                        : 'grey'
                    "
                    :disable="props.row.status !== 'Unliquidated' && props.row.status !== 'Partial'"
                    :loading="store.loadingEditDisbursement === props.row.id"
                    @click="handleEditDisbursement(props.row)"
                    v-permission="'edit'"
                  />
                  <q-btn
                    dense
                    icon="visibility"
                    color="blue"
                    @click="handleViewDisbursement(props.row)"
                    :loading="viewLoading[props.row.id]"
                    :disable="viewLoading[props.row.id]"
                    v-permission="'view'"
                  />
                  <q-btn
                    dense
                    icon="block"
                    color="red"
                    v-if="
                      isTreasurer &&
                      (props.row.status === 'Unliquidated' || props.row.status === 'Partial') &&
                      canVoid(props.row) &&
                      props.row.status !== 'Stale'
                    "
                    @click.stop="() => handleVoidDisbursement(props.row)"
                    v-permission="'delete'"
                  />
                  <q-btn
                    dense
                    icon="block"
                    color="red"
                    v-if="
                      isApprover &&
                      (props.row.status === 'Unliquidated' || props.row.status === 'Partial') &&
                      canVoid(props.row) &&
                      props.row.status !== 'Stale'
                    "
                    @click.stop="() => handleDirectVoidDisbursement(props.row)"
                    v-permission="'delete'"
                  />
                  <q-btn
                    dense
                    icon="receipt_long"
                    color="primary"
                    v-if="
                      props.row.type === 'regular' &&
                      (props.row.status === 'Unliquidated' || props.row.status === 'Partial')
                    "
                    @click="handleLiquidateDisbursement(props.row)"
                    :loading="liquidateLoading[props.row.id]"
                    :disable="liquidateLoading[props.row.id] || props.row.status === 'Stale'"
                    v-permission="'add'"
                  >
                    <q-tooltip>Liquidate</q-tooltip>
                  </q-btn>
                </div>
              </template>

              <!-- BIR / SK buttons -->
              <template v-else>
                <div class="action-row-flat">
                  <q-btn
                    v-if="isApprover || authStore.admin || isTreasurer"
                    dense
                    icon="edit"
                    color="orange"
                    :loading="store.loadingEditDisbursement === props.row.id"
                    @click="handleEditDisbursement(props.row)"
                    v-permission="'edit'"
                  />
                  <q-btn
                    dense
                    icon="visibility"
                    color="blue"
                    @click="handleViewDisbursement(props.row)"
                    :loading="viewLoading[props.row.id]"
                    :disable="viewLoading[props.row.id]"
                    v-permission="'view'"
                  />
                  <q-btn
                    dense
                    icon="block"
                    color="red"
                    v-if="isTreasurer"
                    @click.stop="() => handleVoidDisbursement(props.row)"
                    v-permission="'delete'"
                  />
                  <q-btn
                    dense
                    icon="block"
                    color="red"
                    v-if="
                      isApprover &&
                      (props.row.status === 'Unliquidated' || props.row.status === 'Partial') &&
                      canVoid(props.row) &&
                      props.row.status !== 'Stale'
                    "
                    @click.stop="() => handleDirectVoidDisbursement(props.row)"
                    v-permission="'delete'"
                  />
                </div>
              </template>
            </q-td>
          </template>
          <template v-slot:body-cell-acic="props">
            <q-td :props="props">
              <q-btn
                v-if="isOnlineBankStatus(props.row)"
                dense
                round
                flat
                icon="description"
                size="18px"
                color="primary"
                :loading="acicExportLoading[props.row.id]"
                :disable="acicExportLoading[props.row.id]"
                @click.stop="exportAcicTextFile(props.row)"
              >
                <q-tooltip>Export ACIC text file</q-tooltip>
              </q-btn>
              <span v-else class="text-grey-5">-</span>
            </q-td>
          </template>

          <template v-slot:body-cell-print="props">
            <q-td :props="props">
              <div class="column q-gutter-xs items-start">
                <q-btn
                  dense
                  label="Print Cheque"
                  color="teal"
                  @click="handlePrintCheque(props.row)"
                  v-permission="'print'"
                  style="width: 10em; font-size: 13px"
                />
                <q-btn
                  dense
                  label="Print Voucher"
                  color="teal"
                  @click="handlePrintVoucher(props.row)"
                  v-permission="'print'"
                  style="width: 10em; font-size: 13px"
                />
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>

      <OrDetailsDialog v-model="store.dialogs.orDetails" />
      <ViewOrDetails v-model="store.dialogs.viewOrDetails" />
      <EditDisbursement />
      <ChequePrintDialog v-model="chequePrintDialog" :disbursement="selectedChequeDisbursement" />
      <VoucherPrintDialog
        v-model="voucherPrintDialog"
        :disbursement="selectedVoucherDisbursement"
      />

      <!-- Void Request Dialog -->
      <q-dialog v-model="store.dialogs.void" persistent>
        <q-card style="min-width: 500px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Request Void</div>
          </q-card-section>
          <q-card-section>
            <div class="text-body1 q-mb-md">Please provide remarks for this void request.</div>
            <q-input
              outlined
              v-model="store.forms.void.remarks"
              label="Remarks (Required)"
              type="textarea"
              rows="3"
              :rules="[(val) => (!!val && val.trim() !== '') || 'Remarks are required']"
              hint="Reason for requesting to void this disbursement"
            />
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="handleDialogClose('void')" />
            <q-btn
              label="Submit Void Request"
              color="red"
              :loading="store.voidingDisbursement"
              :disable="!store.forms.void.remarks || store.forms.void.remarks.trim() === ''"
              @click="handleSubmitVoidRequest"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Remarks Dialog -->
      <q-dialog v-model="remarksDialog" persistent>
        <q-card style="min-width: 500px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Remarks</div>
          </q-card-section>
          <q-card-section>
            <div class="text-body1 q-mb-sm">
              <strong>Disbursement:</strong> {{ selectedRemarksData?.dvNumber || 'N/A' }}
            </div>
            <div class="text-body1 q-mb-sm">
              <strong>Payee:</strong> {{ selectedRemarksData?.payee || 'N/A' }}
            </div>
            <div class="text-body1 q-mb-md">
              <strong>Status:</strong>
              <!-- <q-chip
                :color="getStatusColor(selectedRemarksData?.status)"
                :text-color="getStatusTextColor(selectedRemarksData?.status)"
                dense
                :label="selectedRemarksData?.status"
                class="q-ml-sm"
              /> -->
              <div
                class="text-weight-bold q-ml-sm"
                :style="{ color: getStatusColor(selectedRemarksData?.status), fontSize: '13px' }"
              >
                {{ selectedRemarksData?.status || '—' }}
              </div>
            </div>
            <q-separator class="q-mb-md" />
            <div class="text-subtitle1 q-mb-sm text-weight-medium">Remarks:</div>
            <div
              class="remarks-content q-pa-md"
              style="background: #f5f5f5; border-radius: 8px; min-height: 100px"
            >
              <div v-if="selectedRemarksData?.remarks">{{ selectedRemarksData.remarks }}</div>
              <div v-else-if="selectedRemarksData?.rejection_remarks">
                {{ selectedRemarksData.rejection_remarks }}
              </div>
              <div v-else class="text-grey-6 text-italic">No remarks available</div>
            </div>
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Close" @click="closeRemarksDialog" color="primary" />
            <q-btn
              label="View Details"
              @click="openViewOrDetailsFromRemarks"
              color="primary"
              unelevated
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar, debounce } from 'quasar'
import { useRoute } from 'vue-router'
import { api } from 'src/boot/axios'

import OrDetailsDialog from 'components/disbursement/OrDetailsDialog.vue'
import ViewOrDetails from 'components/disbursement/ViewOrDetails.vue'
import ChequePrintDialog from 'components/disbursement/ChequePrintDialog.vue'
import VoucherPrintDialog from 'components/disbursement/VoucherPrintDialog.vue'
import EditDisbursement from 'components/disbursement/EditDisbursement.vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useAuthStore } from 'stores/auth'
import { useBankStore } from 'stores/bankStore'
import { usePayeeStore } from 'stores/payeeStore'
import { usePageLogging } from '../../../composables/usePageLogging'

const $q = useQuasar()
const store = useDisbursementStore()
const bankStore = useBankStore()
const authStore = useAuthStore()
const payeeStore = usePayeeStore()
const route = useRoute()

// selectedDisbursementType controls BOTH the table filter AND which tab opens in dialog
const selectedDisbursementType = ref('regular')

const acicExportLoading = ref({})

const padLeft = (value, length, char = '0') =>
  String(value ?? '')
    .replace(/\D/g, '')
    .padStart(length, char)
    .slice(-length)

const padRight = (value, length, char = ' ') =>
  String(value ?? '')
    .toUpperCase()
    .padEnd(length, char)
    .slice(0, length)

const formatAcicDate = (value) => {
  if (!value) return ''
  const raw = String(value)

  if (raw.includes('/')) {
    const [mm, dd, yyyy] = raw.split('/')
    return `${padLeft(mm, 2)}${padLeft(dd, 2)}${padLeft(yyyy, 4)}`
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''

  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = String(date.getFullYear())

  return `${mm}${dd}${yyyy}`
}

const formatAcicTime = () => {
  const now = new Date()
  return [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')
}

const formatAcicAmount = (value) => {
  const cents = Math.round((Number(value) || 0) * 100)
  return String(cents).padStart(14, '0').slice(-14)
}

const getAcicAmountValue = (row, cheque = {}) =>
  cheque.amount ?? cheque.cheque_amount ?? row.netAmount ?? row.dvAmount ?? row.amount ?? 0

const getBankAccountNumber = (row, cheque = {}) => {
  const bankId = cheque.bank_id ?? cheque.bankId ?? row.bank_id ?? row.bankId
  return (
    cheque.account_number ||
    cheque.accountNumber ||
    row.account_number ||
    row.accountNumber ||
    getBankAccountNumberForBank(bankId) ||
    barangaySetupAccountNumber.value ||
    ''
  )
}

const getChequeRowsForAcic = (row) => {
  const rows = row.bank_cheques?.length
    ? row.bank_cheques
    : row.entries?.length
      ? row.entries
      : [row]

  return rows.filter((cheque) => {
    const bankId = cheque.bank_id ?? cheque.bankId ?? row.bank_id ?? row.bankId
    const status =
      getBankStatusForBank(bankId) ||
      cheque.bank_status ||
      cheque.bankStatus ||
      row.bank_status ||
      row.bankStatus
    return String(status || '').toLowerCase() === 'online'
  })
}

const isOnlineBankStatus = (row) => getChequeRowsForAcic(row).length > 0

const buildAcicTextFromRow = async (row) => {
  await fetchBarangaySetupBankAccounts()
  await fetchBarangaySetupAccountNumber()

  const transactionDate = formatAcicDate(row.date)
  const transactionTime = formatAcicTime()
  const chequeRows = getChequeRowsForAcic(row)

  if (!chequeRows.length) {
    throw new Error('ACIC file can only be generated for online bank disbursements.')
  }

  const detailLines = chequeRows.map((cheque) => {
    const accountNumber = getBankAccountNumber(row, cheque)
    const chequeNumber = cheque.cheque_number || cheque.chequeNumber || row.chequeNumber
    const chequeDate = formatAcicDate(cheque.cheque_date || cheque.chequeDate || row.date)
    const amount = getAcicAmountValue(row, cheque)
    const payee = row.payee2 || row.payee

    if (!accountNumber || !chequeNumber || !chequeDate || !transactionDate) {
      throw new Error('Missing account number, cheque number, or date for ACIC export.')
    }

    return [
      padLeft(accountNumber, 10),
      padLeft(chequeNumber, 10),
      transactionDate,
      transactionTime,
      formatAcicAmount(amount),
      padRight(payee, 40),
      chequeDate,
      '00',
      '1',
      '0',
      '001',
      ' '.repeat(10),
    ].join('')
  })

  const hashTotal = chequeRows.reduce((sum, cheque) => {
    const accountNumber = padLeft(getBankAccountNumber(row, cheque), 10)
    const accountMid = Number(accountNumber.substring(4, 10))

    const checkAmount = Math.round(Number(getAcicAmountValue(row, cheque)) * 100)

    const checkStatus = Number(cheque.checkStatus ?? cheque.check_status ?? 0)
    const checkNew = Number(cheque.checkNew ?? cheque.check_new ?? 1)
    const checkUpdate = Number(cheque.checkUpdate ?? cheque.check_update ?? 0)
    const transactionCode = Number(cheque.transactionCode ?? cheque.transaction_code ?? 1)

    const flagSum = checkStatus + checkNew + checkUpdate + transactionCode

    // flagSum must be scaled ×100 to align with checkAmount's cents scale,
    // same as amount×100 = pesos.cents → integer
    return sum + accountMid * checkAmount + flagSum * 100
  }, 0)

  const totalAmount = chequeRows.reduce((sum, cheque) => {
    const amount = getAcicAmountValue(row, cheque)
    return sum + Math.round((Number(amount) || 0) * 100)
  }, 0)

  const trailerLine = [
    '9999999999',
    String(hashTotal).padStart(20, '0').slice(-20),
    String(detailLines.length).padStart(6, '0'),
    String(totalAmount).padStart(16, '0').slice(-16),
  ].join('')

  return [...detailLines, trailerLine].join('\r\n')
}

const acicExportState = ref({
  sequence: 0,
  date: '',
})

const getAcicFileName = () => {
  const now = new Date()
  const datePart = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getFullYear()).slice(-2)}`

  if (acicExportState.value.date !== datePart) {
    acicExportState.value.date = datePart
    acicExportState.value.sequence = 0
  }

  acicExportState.value.sequence += 1

  return `REGACIC${datePart}${String(acicExportState.value.sequence).padStart(3, '0')}.txt`
}

const downloadAcicFile = (content) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = getAcicFileName()
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const exportAcicTextFile = async (row) => {
  acicExportLoading.value[row.id] = true

  try {
    const acicText = await buildAcicTextFromRow(row)
    downloadAcicFile(acicText)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to export ACIC text file.',
      position: 'top',
    })
  } finally {
    acicExportLoading.value[row.id] = false
  }
}

const barangaySetupBankAccounts = ref([])
const barangaySetupLoaded = ref(false)

const fetchBarangaySetupBankAccounts = async () => {
  if (barangaySetupLoaded.value) return barangaySetupBankAccounts.value

  try {
    const response = await api.get('/api/barangay/setup')
    const payload = response.data?.data || response.data

    const record = Array.isArray(payload)
      ? payload.find((item) => item.barangay_id === authStore.user?.barangay_id) || payload[0]
      : payload

    barangaySetupBankAccounts.value = record?.bank_accounts || []
  } catch (error) {
    console.error('Failed to fetch barangay setup bank accounts:', error)
    barangaySetupBankAccounts.value = []
  } finally {
    barangaySetupLoaded.value = true
  }

  return barangaySetupBankAccounts.value
}

const getBankAccountNumberForBank = (bankId) => {
  if (!bankId) return ''
  const match = barangaySetupBankAccounts.value.find(
    (acc) => String(acc.bank_id) === String(bankId),
  )
  return match?.account_number || ''
}

const getBankSetupAccountForBank = (bankId) => {
  if (!bankId) return null
  return barangaySetupBankAccounts.value.find(
    (acc) => String(acc.bank_id) === String(bankId) && acc.account_number,
  )
}

const getBankStatusForBank = (bankId) =>
  String(getBankSetupAccountForBank(bankId)?.bank_status || 'offline').toLowerCase()

const configuredBankOptions = computed(() => {
  const configuredIds = new Set(
    barangaySetupBankAccounts.value
      .filter((account) => account.account_number)
      .map((account) => String(account.bank_id)),
  )

  return (bankStore.availableBanks || []).filter(
    (bank) => Number(bank.id) !== 0 && configuredIds.has(String(bank.id)),
  )
})

const getBankNameById = (bankId) => {
  if (!bankId) return ''
  const bank = configuredBankOptions.value.find((item) => String(item.id) === String(bankId))
  return bank?.name || bank?.bank_name || ''
}

const buildSpecialChequePayload = (rows, fallbackParticular = '') =>
  rows.map((row) => ({
    bank_id: row.bank_id,
    bank_name: row.bankName || row.bank_name || getBankNameById(row.bank_id),
    bankName: row.bankName || row.bank_name || getBankNameById(row.bank_id),
    booklet_id: row.booklet_id || null,
    cheque_number: row.cheque_number,
    chequeNumber: row.cheque_number,
    cheque_date: row.cheque_date || null,
    chequeDate: row.cheque_date || null,
    bank_status: row.bank_status,
    bankStatus: row.bank_status,
    particular: row.particular || fallbackParticular,
    amount: parseFloat(row.amount) || 0,
    cheque_amount: parseFloat(row.amount) || 0,
  }))

const barangaySetupAccountNumber = ref('')

const fetchBarangaySetupAccountNumber = async () => {
  if (barangaySetupAccountNumber.value) return barangaySetupAccountNumber.value

  const response = await api.get('/api/barangay/setup')
  const payload = response.data?.data || response.data

  const record = Array.isArray(payload)
    ? payload.find((item) => item.barangay_id === authStore.user?.barangay_id) || payload[0]
    : payload

  barangaySetupAccountNumber.value = record?.account_number || ''

  return barangaySetupAccountNumber.value
}

// console.log(store.disbursements[0])
// When user clicks a type card: filter the table and remember it
const handleTypeNavClick = (type) => {
  selectedDisbursementType.value = type
}

// try first
const openDialogForType = async (type) => {
  try {
    await Promise.all([bankStore.fetchBanks(), fetchBarangaySetupBankAccounts()])
  } catch (e) {
    console.error('Bank fetch failed, dialog will open with cached banks:', e)
  }

  if (type === 'bir') {
    showBirDialog.value = true
  } else if (type === 'sk') {
    skForm.value.type = 'sk'
    showSkDialog.value = true
  } else {
    store.openDialog('disbursement')
    showRegularDialog.value = false
  }
}

// Transaction counts per type for the nav cards
const typeCounts = computed(() => {
  const all = store.disbursements || []
  return {
    regular: all.filter((d) => !d.type || d.type === 'regular').length,
    bir: all.filter((d) => d.type === 'bir').length,
    sk: all.filter((d) => d.type === 'sk' || d.type === 'provincial_aid').length,
  }
})

// BIR summary figures
const birTotalWithheld = computed(() => {
  const all = store.disbursements || []
  return all
    .filter((d) => !d.type || d.type === 'regular')
    .reduce((sum, d) => {
      const deductions = d.deductions || d.expenseRows?.flatMap((r) => r.deductions || []) || []
      return sum + deductions.reduce((s, ded) => s + (Number(ded.amount) || 0), 0)
    }, 0)
})

const birRemitted = computed(() => {
  const all = store.disbursements || []
  return all
    .filter((d) => d.type === 'bir')
    .reduce((sum, d) => sum + (Number(d.dvAmount) || Number(d.netAmount) || 0), 0)
})

const birAvailable = computed(() => Math.max(0, birTotalWithheld.value - birRemitted.value))

const birRemittedPercent = computed(() => {
  if (!birTotalWithheld.value) return 0
  return Math.min(100, (birRemitted.value / birTotalWithheld.value) * 100)
})

// const activeTab = ref('disbursement')
const editingBankChequeId = ref(null)
const editBankCheque = (ded) => {
  editingBankChequeId.value = ded.id
  bankChequeForm.value = {
    bank_id: ded.bank_id,
    booklet_id: ded.booklet_id || null,
    bankName: ded.bankName || ded.bank || '',
    bank_status: ded.bank_status || ded.bankStatus || '',
    cheque_number: ded.cheque_number || '',
    cheque_date: ded.cheque_date || todayFormatted(),
    amount: String(ded.amount || ''),
    amountDisplay: (Number(ded.amount) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }),
  }
  bankChequeDialogOpen.value = true
}

//  BIR form
const birChequeRows = ref([])
const birForm = ref({ date: '', bank_id: null, cheque_number: '', dv_number: '', dv_amount: '' })
const birAmountDisplay = ref('')
const savingBir = ref(false)
const editingBirId = ref(null)

const birTotalAmount = computed(() =>
  birChequeRows.value.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
)

const defaultBirRow = () => ({
  bank_id: null,
  booklet_id: null,
  bankName: '',
  cheque_number: '',
  cheque_date: todayFormatted(),
  particular: 'Remittance to BIR',
  amount: '',
  amountDisplay: '',
  bank_status: '',
})

const addBirChequeRow = () => {
  birChequeRows.value.push(defaultBirRow())
}

const removeBirChequeRow = (idx) => {
  birChequeRows.value.splice(idx, 1)
}

const handleBirRowBankSelect = async (idx, bankId) => {
  birChequeRows.value[idx].cheque_number = ''
  birChequeRows.value[idx].bankName = getBankNameById(bankId)
  if (!bankId) return

  birChequeRows.value[idx].bank_status = getBankStatusForBank(bankId)

  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    const cheques = res.data?.data?.cheque || []
    // Skip cheques already taken by other rows in this session
    const taken = birChequeRows.value.map((r) => r.cheque_number).filter(Boolean)
    const next = cheques.find((c) => !taken.includes(c.cheque_number))
    birChequeRows.value[idx].cheque_number = next?.cheque_number || ''
    birChequeRows.value[idx].booklet_id = next?.booklet_id || next?.booklet?.id || null
  } catch (e) {
    console.error('BIR row bank select error:', e)
    birChequeRows.value[idx].bank_id = null
    birChequeRows.value[idx].booklet_id = null
    birChequeRows.value[idx].bankName = ''
    birChequeRows.value[idx].cheque_number = ''
  }
}

const editExpenseInline = (expense) => {
  store.openExpenseDetailForEdit(expense)
}

const deductionAmountDisplay = computed({
  get: () => (parseFloat(deductionForm.value.amount) || 0).toFixed(2),
  set: (val) => {
    deductionForm.value.amount = parseFloat(val) || 0
  },
})

const removeRow = (row) => {
  if (!row) return

  const deductionId = row.id != null ? String(row.id) : null
  const isDeduction =
    deductionId &&
    (store.forms.expense.deductions || []).some((deduction) => String(deduction.id) === deductionId)

  if (isDeduction) {
    store.removeDeductionRow(row.id)
    return
  }

  const expense = (store.expenses || []).find(
    (expenseRow) => String(expenseRow.id) === String(row.id),
  )
  if (expense) {
    store.deleteItem(expense)
  }
}

const onBirRowAmountInput = (idx, val) => {
  let v = String(val).replace(/[^\d.]/g, '')
  const p = v.split('.')
  if (p.length > 2) v = p[0] + '.' + p.slice(1).join('')
  if (p.length === 2 && p[1].length > 2) v = p[0] + '.' + p[1].slice(0, 2)
  birChequeRows.value[idx].amount = v
  birChequeRows.value[idx].amountDisplay = v
}
const onBirRowAmountBlur = (idx) => {
  birChequeRows.value[idx].amountDisplay = formatAmountDisplay(birChequeRows.value[idx].amount)
}
const onBirRowAmountFocus = (idx) => {
  birChequeRows.value[idx].amountDisplay = birChequeRows.value[idx].amount
}

//  SK form
const skChequeRows = ref([])
const skForm = ref({
  type: 'sk',
  date: '',
  bank_id: null,
  cheque_number: '',
  dv_number: '',
  payee: '',
  amount: '',
  remarks: '',
})
const skAmountDisplay = ref('')
const savingSk = ref(false)
const editingSkId = ref(null)
const skTypeOptions = [
  { label: 'SK Transfer', value: 'sk' },
  { label: 'Provincial Aid', value: 'provincial_aid' },
]

const skTotalAmount = computed(() =>
  skChequeRows.value.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
)

const defaultSkRow = () => ({
  bank_id: null,
  booklet_id: null,
  bankName: '',
  cheque_number: '',
  cheque_date: todayFormatted(),
  amount: '',
  amountDisplay: '',
  bank_status: '',
})

const addSkChequeRow = () => {
  skChequeRows.value.push(defaultSkRow())
}

const removeSkChequeRow = (idx) => {
  skChequeRows.value.splice(idx, 1)
}

const handleSkRowBankSelect = async (idx, bankId) => {
  skChequeRows.value[idx].cheque_number = ''
  skChequeRows.value[idx].bankName = getBankNameById(bankId)
  if (!bankId) return

  await fetchBarangaySetupBankAccounts()
  skChequeRows.value[idx].bank_status = getBankStatusForBank(bankId)

  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })

    const cheques = res.data?.data?.cheque || []
    const taken = skChequeRows.value.map((r) => r.cheque_number).filter(Boolean)
    const next = cheques.find((c) => !taken.includes(c.cheque_number))

    skChequeRows.value[idx].cheque_number = next?.cheque_number || ''
    skChequeRows.value[idx].booklet_id = next?.booklet_id || next?.booklet?.id || null
  } catch (e) {
    console.error('SK row bank select error:', e)
    skChequeRows.value[idx].bank_id = null
    skChequeRows.value[idx].booklet_id = null
    skChequeRows.value[idx].bankName = ''
    skChequeRows.value[idx].cheque_number = ''
  }
}

const onSkRowAmountInput = (idx, val) => {
  let v = String(val).replace(/[^\d.] /g, '')
  const p = v.split('.')
  if (p.length > 2) v = p[0] + '.' + p.slice(1).join('')
  if (p.length === 2 && p[1].length > 2) v = p[0] + '.' + p[1].slice(0, 2)

  skChequeRows.value[idx].amount = v
  skChequeRows.value[idx].amountDisplay = v
}

const onSkRowAmountBlur = (idx) => {
  skChequeRows.value[idx].amountDisplay = formatAmountDisplay(skChequeRows.value[idx].amount)
}

const onSkRowAmountFocus = (idx) => {
  skChequeRows.value[idx].amountDisplay = skChequeRows.value[idx].amount
}

//  Filters
const selectedStatus = ref(null)
const searchQuery = ref('')
const dateRange = ref(null)
// const particularInputVal = ref('')
const loading = ref(false)
const initialLoading = ref(true)
const addingExpense = ref(false)
const viewLoading = ref({})
const liquidateLoading = ref({})
const remarksDialog = ref(false)
const selectedRemarksData = ref(null)
const showRegularDialog = ref(false)
const showBirDialog = ref(false)
const showSkDialog = ref(false)
const chequePrintDialog = ref(false)
const selectedChequeDisbursement = ref(null)
const voucherPrintDialog = ref(false)
const selectedVoucherDisbursement = ref(null)
const filteredPayeeOptions = ref([])
const typedPayeeOptions = ref([])
const payee2Edited = ref(false)
const editingDeductionId = ref(null)
const editingDeductionIndex = ref(-1)
const bankChequeDialogOpen = ref(false)
const bankChequeForm = ref({
  bank_id: null,
  booklet_id: null,
  bankName: '',
  cheque_number: '',
  cheque_date: '',
  amount: '',
  amountDisplay: '',
})

const statusOptions = [
  { label: 'All Status', value: null },
  { label: 'Unliquidated', value: 'Unliquidated' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Liquidated', value: 'Liquidated' },
  { label: 'Void Requested', value: 'Void Requested' },
  { label: 'Voided', value: 'Voided' },
  { label: 'Stale', value: 'Stale' },
]

const totalDeductionAmount = computed(() => {
  return (store.forms.expense.deductions || []).reduce((sum, row) => {
    return sum + (Number(row.amount) || 0)
  }, 0)
})

const netDisbursementAmount = computed(() => {
  return Math.max(0, (Number(store.totalExpensesAmount) || 0) - totalDeductionAmount.value)
})

const bankChequeTotal = computed(() => {
  return (store.bankCheques || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
})

// Total of all OTHER cheques already saved (excludes the one currently being edited, if any)
const otherBankChequeTotal = computed(() => {
  return (store.bankCheques || [])
    .filter((row) => row.id !== editingBankChequeId.value)
    .reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
})

// How much of the net amount is still left to allocate to cheques.
// Starts equal to the net amount, and shrinks live as the user types into Amount.
const bankChequeBalance = computed(() => {
  const net = Number(netDisbursementAmount.value) || 0
  const currentAmount = Number(bankChequeForm.value.amount) || 0
  const remaining = net - otherBankChequeTotal.value - currentAmount
  return Math.max(0, Math.round(remaining * 100) / 100)
})

// Clicking the balance chip fills the Amount field with whatever is left unallocated
const applyBalanceToChequeAmount = () => {
  const net = Number(netDisbursementAmount.value) || 0
  const remaining = Math.max(0, Math.round((net - otherBankChequeTotal.value) * 100) / 100)
  if (remaining <= 0) return
  bankChequeForm.value.amount = String(remaining)
  bankChequeForm.value.amountDisplay = remaining.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
  })
}

const bankChequeRows = computed(() => {
  return (store.bankCheques || []).map((row, idx) => ({
    id: row.id,
    key: `${row.id || idx}-${row.cheque_number || idx}`,
    bank_id: row.bank_id ?? null,
    booklet_id: row.booklet_id ?? null,
    bank: row.bankName || row.bank || '',
    chequeNumber: row.cheque_number || '',
    chequeDate: row.cheque_date || '',
    bank_status: row.bank_status || row.bankStatus || '',
    bankStatus: row.bank_status || row.bankStatus || '',
    amount: Number(row.amount) || 0,
  }))
})

const todayFormatted = () => {
  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const yyyy = today.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

const resetBankChequeForm = () => {
  bankChequeForm.value = {
    bank_id: null,
    booklet_id: null,
    bankName: '',
    cheque_number: '',
    cheque_date: todayFormatted(),
    amount: '',
    amountDisplay: '',
    bank_status: '',
  }
}

const openBankChequeDialog = () => {
  resetBankChequeForm()
  bankChequeDialogOpen.value = true
}

const closeBankChequeDialog = () => {
  bankChequeDialogOpen.value = false
}

const handleBankChequeBankSelect = async (bankId) => {
  bankChequeForm.value.cheque_number = ''
  bankChequeForm.value.booklet_id = null
  const bank = configuredBankOptions.value.find((bank) => String(bank.id) === String(bankId))
  bankChequeForm.value.bankName = bank?.name || ''
  if (!bankId) return

  bankChequeForm.value.bank_status = getBankStatusForBank(bankId)

  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    // const taken = (store.bankCheques || []).map((row) => row.cheque_number).filter(Boolean)
    const taken = [
      ...(store.bankCheques || []).map((row) => row.cheque_number),
      ...(store.pendingChequeNumbers || []),
    ].filter(Boolean)

    const res = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      // params: { exclude: taken }, // <-- backend uses this to skip claimed cheques and cascade booklets
      params: { exclude: taken.join(',') },
    })

    // const cheque = res.data?.data?.cheque?.[0] || null
    const cheques = res.data?.data?.cheque || []
    const available = cheques.filter((c) => !taken.includes(c.cheque_number))
    const cheque = available[0] || cheques[0] || null

    bankChequeForm.value.booklet_id = res.data?.data?.id || null
    bankChequeForm.value.cheque_number = cheque?.cheque_number || ''

    if (!cheque) {
      $q.notify({
        type: 'warning',
        message: `${bankChequeForm.value.bankName || 'This bank'} has no more available cheques across any booklet. Please select a different bank or add a new booklet.`,
        position: 'top',
        timeout: 4000,
      })
    }
  } catch (error) {
    console.error('Bank cheque selection error:', error)
    bankChequeForm.value.bank_id = null
    bankChequeForm.value.bankName = ''
  }
}

const onBankChequeAmountInput = (value) => {
  let nextValue = String(value).replace(/[^\d.]/g, '')
  const parts = nextValue.split('.')
  if (parts.length > 2) nextValue = parts[0] + '.' + parts.slice(1).join('')
  if (parts.length === 2 && parts[1].length > 2) nextValue = parts[0] + '.' + parts[1].slice(0, 2)
  bankChequeForm.value.amount = nextValue
  bankChequeForm.value.amountDisplay = nextValue
}

const onBankChequeAmountBlur = () => {
  const amount = Number(bankChequeForm.value.amount) || 0
  bankChequeForm.value.amountDisplay = amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

const onBankChequeAmountFocus = () => {
  bankChequeForm.value.amountDisplay = bankChequeForm.value.amount
}

// const confirmAddBankCheque = () => {
//   const form = bankChequeForm.value
//   const amount = Number(form.amount) || 0

//   form.bank_status = getBankStatusForBank(form.bank_id)

//   if (!form.bank_id || !form.cheque_number || amount <= 0) {
//     return $q.notify({
//       type: 'negative',
//       message: 'Select a bank, cheque number, and valid amount',
//       position: 'top',
//     })
//   }

//    const isDuplicate = (store.bankCheques || []).some(
//     (row) =>
//       row.id !== editingBankChequeId.value &&
//       String(row.cheque_number) === String(form.cheque_number),
//   )
//   if (isDuplicate) {
//     return $q.notify({
//       type: 'negative',
//       message: `Cheque number ${form.cheque_number} is already added to this disbursement. Pick a different bank/booklet.`,
//       position: 'top',
//     })
//   }

//   const nextTotal = Math.round((bankChequeTotal.value + amount) * 100) / 100
//   const netTotal = Math.round(netDisbursementAmount.value * 100) / 100

//   if (nextTotal > netTotal) {
//     return $q.notify({
//       type: 'negative',
//       message: `Cheque amount exceeded the net amount by ₱${(nextTotal - netTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
//       position: 'top',
//     })
//   }

//   store.bankCheques = [
//     ...(store.bankCheques || []),
//     {
//       id: Date.now(),
//       bank_id: form.bank_id,
//       booklet_id: form.booklet_id,
//       bankName: form.bankName,
//       cheque_number: form.cheque_number,
//       cheque_date: form.cheque_date,
//       bank_status: form.bank_status,
//       amount,
//     },
//   ]

//   if (!store.pendingChequeNumbers.includes(form.cheque_number)) {
//     store.pendingChequeNumbers.push(form.cheque_number)
//   }

//   closeBankChequeDialog()
// }
const confirmAddBankCheque = () => {
  const form = bankChequeForm.value
  const amount = Number(form.amount) || 0

  form.bank_status = getBankStatusForBank(form.bank_id)

  if (!form.bank_id || !form.cheque_number || amount <= 0) {
    return $q.notify({
      type: 'negative',
      message: 'Select a bank, cheque number, and valid amount',
      position: 'top',
    })
  }

  const isDuplicate = (store.bankCheques || []).some(
    (row) =>
      row.id !== editingBankChequeId.value &&
      String(row.cheque_number) === String(form.cheque_number),
  )
  if (isDuplicate) {
    return $q.notify({
      type: 'negative',
      message: `Cheque number ${form.cheque_number} is already added to this disbursement. Pick a different bank/booklet.`,
      position: 'top',
    })
  }

  const nextTotal = Math.round((otherBankChequeTotal.value + amount) * 100) / 100
  const netTotal = Math.round(netDisbursementAmount.value * 100) / 100

  if (nextTotal > netTotal) {
    return $q.notify({
      type: 'negative',
      message: `Cheque amount exceeded the net amount by ₱${(nextTotal - netTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      position: 'top',
    })
  }

  if (editingBankChequeId.value != null) {
    // EDIT: replace the existing row in place
    store.bankCheques = (store.bankCheques || []).map((row) =>
      row.id === editingBankChequeId.value
        ? {
            ...row,
            bank_id: form.bank_id,
            booklet_id: form.booklet_id,
            bankName: form.bankName,
            cheque_number: form.cheque_number,
            cheque_date: form.cheque_date,
            bank_status: form.bank_status,
            amount,
          }
        : row,
    )
  } else {
    // ADD: push a new row
    store.bankCheques = [
      ...(store.bankCheques || []),
      {
        id: Date.now(),
        bank_id: form.bank_id,
        booklet_id: form.booklet_id,
        bankName: form.bankName,
        cheque_number: form.cheque_number,
        cheque_date: form.cheque_date,
        bank_status: form.bank_status,
        amount,
      },
    ]
  }

  if (!store.pendingChequeNumbers.includes(form.cheque_number)) {
    store.pendingChequeNumbers.push(form.cheque_number)
  }

  editingBankChequeId.value = null
  closeBankChequeDialog()
}

const removeBankCheque = (id) => {
  store.bankCheques = (store.bankCheques || []).filter((row) => row.id !== id)
}

const normalizePayee = (value) => String(value || '').trim()
const payeeNameOf = (payee) =>
  payee?.payee_name || payee?.name || payee?.payee || payee?.label || payee
const selectedPayeeMeta = (value) => {
  const selected = normalizePayee(value).toLowerCase()
  if (!selected) return null
  return (
    (payeeStore.payees || []).find(
      (payee) => normalizePayee(payeeNameOf(payee)).toLowerCase() === selected,
    ) || null
  )
}

const resolveTaxpayerType = (value) => {
  const normalized = normalizePayee(value).toLowerCase()
  return (
    taxpayerTypeOptions.find(
      (option) =>
        normalizePayee(option.value).toLowerCase() === normalized ||
        normalizePayee(option.label).toLowerCase() === normalized,
    )?.value || value
  )
}

const applySelectedPayeeMeta = (value) => {
  const payee = selectedPayeeMeta(value)
  if (!payee) return

  if (!payee2Edited.value || !normalizePayee(store.forms.disbursement.payee2)) {
    store.forms.disbursement.payee2 = payee.payee2_name || payee.payee2 || value || ''
  }

  if (payee.taxpayer_type) {
    store.forms.expense.taxpayerType = resolveTaxpayerType(payee.taxpayer_type)
  }

  store.forms.disbursement.tin = payee.tin_number || payee.tin || ''
}

const payeeOptions = computed(() => {
  const seen = new Set()
  const options = []
  const addPayee = (value) => {
    const payee = normalizePayee(value)
    const key = payee.toLowerCase()
    if (!payee || seen.has(key)) return
    seen.add(key)
    options.push(payee)

    // if (!payee || seen.has(key))
  }

  ;(payeeStore.payees || []).forEach((payee) => addPayee(payeeNameOf(payee)))
  ;(store.disbursements || []).forEach((disbursement) => {
    addPayee(disbursement.payee)
    addPayee(disbursement.payee2)
  })
  typedPayeeOptions.value.forEach(addPayee)

  return options.sort((a, b) => a.localeCompare(b))
})

const rememberPayeeOption = (value) => {
  const payee = normalizePayee(value)
  if (!payee) return
  const exists = payeeOptions.value.some((option) => option.toLowerCase() === payee.toLowerCase())
  if (!exists) typedPayeeOptions.value.push(payee)
}

const syncPayee2FromPayee = (payee) => {
  if (!payee2Edited.value || !normalizePayee(store.forms.disbursement.payee2)) {
    store.forms.disbursement.payee2 = payee || ''
  }
}

const onPayeeSelected = (value) => {
  const payee = normalizePayee(value)
  store.forms.disbursement.payee = payee
  rememberPayeeOption(payee)
  syncPayee2FromPayee(payee)
  applySelectedPayeeMeta(payee)
}

const onPayeeInputValue = (value) => {
  store.forms.disbursement.payee = value || ''
  syncPayee2FromPayee(store.forms.disbursement.payee)
  applySelectedPayeeMeta(store.forms.disbursement.payee)
}

const onPayee2Input = (value) => {
  payee2Edited.value = normalizePayee(value) !== normalizePayee(store.forms.disbursement.payee)
}

const filterPayeeOptions = (value, update) => {
  update(() => {
    const needle = String(value || '').toLowerCase()
    filteredPayeeOptions.value = !needle
      ? payeeOptions.value
      : payeeOptions.value.filter((option) => option.toLowerCase().includes(needle))
  })
}

const mainTableColumns = computed(() => {
  const base = (store.disbursementColumns || []).filter((c) => {
    if (c.name === 'remarks') return false
    if (selectedDisbursementType.value === 'sk' && c.name === 'particular') return false
    if (
      (selectedDisbursementType.value === 'bir' || selectedDisbursementType.value === 'sk') &&
      c.name === 'status'
    )
      return false

    return true
  })

  if (selectedDisbursementType.value === 'sk' && !base.some((c) => c.name === 'type')) {
    const payeeIdx = base.findIndex((c) => c.name === 'payee')
    base.splice(payeeIdx + 1, 0, {
      name: 'type',
      label: 'Type',
      field: 'type',
      align: 'center',
      sortable: true,
    })
  }
  if (!base.some((c) => c.name === 'acic')) {
    const actionIdx = base.findIndex((c) => c.name === 'action')
    base.splice(actionIdx === -1 ? base.length : actionIdx, 0, {
      name: 'acic',
      label: 'ACIC',
      field: '',
      align: 'center',
      style: 'width: 70px; min-width: 70px',
    })
  }

  return base
})

//  Filtered rows
// selectedDisbursementType drives the primary filter; status/search/date are secondary
const getDisbursementDateValue = (row) => row?.date || row?.created_at || row?.updated_at || ''

const getLatestDisbursementDateValue = (values) => {
  const parsed = values
    .filter(Boolean)
    .map((value) => parseSortDate(value))
    .filter((value) => value > 0)

  return parsed.length ? Math.max(...parsed) : 0
}

const collapseRegularRowsByDv = (rows) => {
  const grouped = new Map()

  rows.forEach((row) => {
    const key = row.disbursement_id || row.id || row.dvNumber
    if (!grouped.has(key)) {
      grouped.set(key, {
        ...row,
        id: row.disbursement_id || row.id,
        row_id: `regular-${key}`,
        expenseRows: [],
        date: getDisbursementDateValue(row),
      })
    }

    const group = grouped.get(key)
    group.expenseRows.push(row)
    const latestDate = getLatestDisbursementDateValue([
      getDisbursementDateValue(group),
      ...group.expenseRows.map(getDisbursementDateValue),
    ])
    group.date = latestDate
      ? new Date(latestDate).toISOString().slice(0, 10)
      : getDisbursementDateValue(group)

    // NEW: pull cheque/bank info from each row's bank_cheques[] first,
    // falling back to the row's flat bank/chequeNumber for older records
    const allCheques = group.expenseRows.flatMap((r) =>
      r.bank_cheques && r.bank_cheques.length
        ? r.bank_cheques
        : r.bank || r.chequeNumber
          ? [{ bank: r.bank, bankName: r.bank, cheque_number: r.chequeNumber }]
          : [],
    )

    const uniqueCheques = [
      ...new Set(allCheques.map((c) => c.cheque_number || c.chequeNumber).filter(Boolean)),
    ]
    const uniqueBanks = [
      ...new Set(allCheques.map((c) => c.bank || c.bankName || c.bank_name).filter(Boolean)),
    ]
    const uniqueParticulars = [
      ...new Set(group.expenseRows.map((r) => r.particular).filter(Boolean)),
    ]

    group.chequeNumber =
      uniqueCheques.length > 1 ? `${uniqueCheques.length} cheques` : uniqueCheques[0] || ''
    group.bank = uniqueBanks.length > 1 ? `${uniqueBanks.length} banks` : uniqueBanks[0] || ''
    group.particular =
      uniqueParticulars.length > 1
        ? `${uniqueParticulars.length} particulars`
        : uniqueParticulars[0] || ''
    group.dvAmount = Number(group.expenseRows.find((r) => Number(r.dvAmount))?.dvAmount) || 0
    const netRow = group.expenseRows.find(
      (r) => r.netAmount !== null && r.netAmount !== undefined && r.netAmount !== '',
    )
    group.netAmount = netRow ? Number(netRow.netAmount) || 0 : group.dvAmount
  })

  return [...grouped.values()]
}

const parseSortDate = (value) => {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()

  const raw = String(value).trim()
  if (!raw) return 0

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const parsed = new Date(raw)
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split('/')
    const parsed = new Date(`${year}-${month}-${day}`)
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
  }

  const fallback = new Date(raw)
  return Number.isNaN(fallback.getTime()) ? 0 : fallback.getTime()
}

const parseAgingDays = (value) => {
  if (value === null || value === undefined || value === '') return Number.MAX_SAFE_INTEGER
  if (typeof value === 'number') return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER

  const raw = String(value).trim().toLowerCase()
  const match = raw.match(/(-?\d+)/)
  if (!match) return Number.MAX_SAFE_INTEGER

  return Number(match[1])
}

const getMainTableBankChequeDisplay = (row = {}) => {
  const cheques =
    Array.isArray(row.bank_cheques) && row.bank_cheques.length
      ? row.bank_cheques
      : Array.isArray(row.entries) && row.entries.length
        ? row.entries
        : []

  const uniqueCheques = [
    ...new Set(
      cheques
        .map(
          (entry) =>
            entry.cheque_number || entry.chequeNumber || entry.cheque_no || entry.chequeNo || '',
        )
        .filter(Boolean),
    ),
  ]

  const uniqueBanks = [
    ...new Set(
      cheques.map((entry) => entry.bank_name || entry.bankName || entry.bank || '').filter(Boolean),
    ),
  ]

  return {
    bank: uniqueBanks.length
      ? uniqueBanks.length > 1
        ? `${uniqueBanks.length} banks`
        : uniqueBanks[0]
      : row.bank || row.bank_name || row.bankName || '',
    chequeNumber: uniqueCheques.length
      ? uniqueCheques.length > 1
        ? `${uniqueCheques.length} cheques`
        : uniqueCheques[0]
      : row.chequeNumber || row.cheque_number || row.cheque_no || row.chequeNo || '',
  }
}

const filteredDisbursements = computed(() => {
  let rows = store.disbursements || []

  // Primary: type card selection
  if (selectedDisbursementType.value === 'regular') {
    rows = collapseRegularRowsByDv(rows.filter((d) => !d.type || d.type === 'regular'))
  } else if (selectedDisbursementType.value === 'bir') {
    rows = rows.filter((d) => d.type === 'bir')
  } else if (selectedDisbursementType.value === 'sk') {
    // SK card shows both SK and Provincial Aid together
    rows = rows.filter((d) => d.type === 'sk' || d.type === 'provincial_aid')
  }

  // Secondary filters
  if (selectedStatus.value) {
    rows = rows.filter((d) => d.status === selectedStatus.value)
  }
  if (searchQuery.value?.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    rows = rows.filter((d) =>
      [d.payee, d.payee2, d.dvNumber, d.chequeNumber, d.bank, d.status, d.particular].some(
        (f) => f && f.toString().toLowerCase().includes(q),
      ),
    )
  }
  if (store.dateFrom && store.dateTo) {
    const fromTime = parseSortDate(store.dateFrom)
    const toTime = parseSortDate(store.dateTo)

    rows = rows.filter((d) => {
      if (!d.date) return false
      const rowTime = parseSortDate(d.date)
      return rowTime >= fromTime && rowTime <= toTime
    })
  }

  return rows
    .map((row) => {
      const displayInfo = getMainTableBankChequeDisplay(row)
      return {
        ...row,
        bank: row.bank || row.bank_name || row.bankName || displayInfo.bank || '',
        chequeNumber:
          row.chequeNumber ||
          row.cheque_number ||
          row.cheque_no ||
          row.chequeNo ||
          displayInfo.chequeNumber ||
          '',
      }
    })
    .sort((a, b) => {
      const aAging = parseAgingDays(a.aging)
      const bAging = parseAgingDays(b.aging)

      if (aAging !== bAging) return aAging - bAging

      const aTime = parseSortDate(a.created_at || a.updated_at || a.date)
      const bTime = parseSortDate(b.created_at || b.updated_at || b.date)

      if (bTime !== aTime) return bTime - aTime
      return String(b.id || '').localeCompare(String(a.id || ''))
    })
})

const handleSaveBir = async () => {
  const f = birForm.value
  if (!f.date || !f.dv_number) {
    $q.notify({ type: 'negative', message: 'Please fill in Date and DV Number.', position: 'top' })
    return
  }
  if (!birChequeRows.value.length) {
    $q.notify({ type: 'negative', message: 'Add at least one cheque entry.', position: 'top' })
    return
  }
  birChequeRows.value.forEach((row) => {
    row.bank_status = getBankStatusForBank(row.bank_id)
  })

  const invalid = birChequeRows.value.find(
    (r) => !r.bank_id || !r.cheque_number || !r.amount || parseFloat(r.amount) <= 0,
  )
  if (invalid) {
    $q.notify({
      type: 'negative',
      message: 'Each row must have a bank, cheque number, and amount.',
      position: 'top',
    })
    return
  }

  const firstRow = birChequeRows.value[0]

  savingBir.value = true
  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const chequeEntries = buildSpecialChequePayload(birChequeRows.value, 'Remittance to BIR')
    const payload = {
      date: f.date,
      dv_number: f.dv_number,
      bank_id: firstRow.bank_id,
      bank_name: firstRow.bankName || getBankNameById(firstRow.bank_id),
      cheque_number: firstRow.cheque_number,
      cheque_date: firstRow.cheque_date || null,
      cheque_booklet: firstRow.booklet_id || null,
      cheque_amount: parseFloat(firstRow.amount) || 0,
      bank_status: firstRow.bank_status,
      dv_amount: birTotalAmount.value,
      amount: birTotalAmount.value,
      entries: chequeEntries,
      bank_cheques: chequeEntries,
    }
    const res = editingBirId.value
      ? await api.put(`/api/barangay/bir-remittances/${editingBirId.value}`, payload, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
      : await api.post('/api/barangay/bir-remittances', payload, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })

    if (res.data.status) {
      $q.notify({
        type: 'positive',
        message: `BIR Remittance ${editingBirId.value ? 'updated' : 'created'}!`,
        position: 'top',
        timeout: 3000,
      })
      editingBirId.value = null
      showBirDialog.value = false

      // await store.fetchDisbursements()
      await store.fetchDisbursements(selectedYear.value, true)
    }
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: e.response?.data?.message || 'Failed.',
      position: 'top',
    })
  } finally {
    savingBir.value = false
  }
}

const handleSaveSk = async () => {
  const f = skForm.value

  if (!f.type || !f.date || !f.dv_number || !f.payee) {
    $q.notify({ type: 'negative', message: 'Please fill in all required fields.', position: 'top' })
    return
  }

  if (!skChequeRows.value.length) {
    $q.notify({ type: 'negative', message: 'Add at least one cheque entry.', position: 'top' })
    return
  }

  skChequeRows.value.forEach((row) => {
    row.bank_status = getBankStatusForBank(row.bank_id)
  })

  const invalid = skChequeRows.value.find(
    (r) => !r.bank_id || !r.cheque_number || !r.amount || parseFloat(r.amount) <= 0,
  )

  if (invalid) {
    $q.notify({
      type: 'negative',
      message: 'Each row must have a bank, cheque number, and amount.',
      position: 'top',
    })
    return
  }

  const firstRow = skChequeRows.value[0]

  savingSk.value = true
  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const chequeEntries = buildSpecialChequePayload(skChequeRows.value)
    const payload = {
      type: f.type,
      date: f.date,
      dv_number: f.dv_number,
      payee: f.payee,
      bank_id: firstRow.bank_id,
      bank_name: firstRow.bankName || getBankNameById(firstRow.bank_id),
      cheque_number: firstRow.cheque_number,
      cheque_date: firstRow.cheque_date || null,
      cheque_booklet: firstRow.booklet_id || null,
      cheque_amount: parseFloat(firstRow.amount) || 0,
      bank_status: firstRow.bank_status,
      amount: skTotalAmount.value,
      dv_amount: skTotalAmount.value,
      remarks: f.remarks,
      entries: chequeEntries,
      bank_cheques: chequeEntries,
    }
    const res = editingSkId.value
      ? await api.put(`/api/barangay/fund-transfers/${editingSkId.value}`, payload, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
      : await api.post('/api/barangay/fund-transfers', payload, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })

    if (res.data.status) {
      $q.notify({
        type: 'positive',
        message: `${f.type === 'sk' ? 'SK Transfer' : 'Provincial Aid'} ${editingSkId.value ? 'updated' : 'created'}!`,
        position: 'top',
        timeout: 3000,
      })
      editingSkId.value = null
      resetSkForm()
      showSkDialog.value = false
      // await store.fetchDisbursements()
      await store.fetchDisbursements(selectedYear.value, true)
    }
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: e.response?.data?.message || 'Failed.',
      position: 'top',
    })
  } finally {
    savingSk.value = false
  }
}

// Deduction library data fetched from backend
const deductionLibrary = ref([]) // raw list from /deduction-codes
const deductionTypesFromApi = ref([]) // from /deduction-codes/deduction-types
const taxTypesFromApi = ref([]) // from /deduction-codes/tax-types
const deductionLibraryLoading = ref(false)
const previewLoading = ref(false)

const fetchDeductionLibrary = async () => {
  deductionLibraryLoading.value = true
  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }

    // const [codesRes, typesRes, taxRes] = await Promise.allSettled([
    //   api.get('/api/barangay/deduction-codes', { headers }),
    //   api.get('/api/barangay/deduction-codes/deduction-types', { headers }),
    //   api.get('/api/barangay/deduction-codes/tax-types', { headers }),
    // ])

    const [codesRes, typesRes, taxRes] = await Promise.allSettled([
      api.get('/api/barangay/deduction-codes', { headers }),
      api.get('/api/barangay/deduction-codes/deduction-types', {
        headers,
        params: { tax_type: deductionForm.value.taxType || undefined },
      }),
      api.get('/api/barangay/deduction-codes/tax-types', { headers }),
    ])

    const codes = responseArray(codesRes)
    deductionLibrary.value = codes
    deductionTypesFromApi.value = responseArray(typesRes)
    taxTypesFromApi.value = responseArray(taxRes)

    if (typesRes.status === 'rejected' || taxRes.status === 'rejected') {
      console.warn('Deduction option endpoint failed; using /deduction-codes fallback.', {
        deductionTypes: typesRes.reason?.response?.data || typesRes.reason?.message,
        taxTypes: taxRes.reason?.response?.data || taxRes.reason?.message,
      })
    }
  } catch (e) {
    console.error('Failed to fetch deduction library:', e)
  } finally {
    deductionLibraryLoading.value = false
  }
}

const responseArray = (result) => {
  if (result?.status !== 'fulfilled') return []
  return asArray(result.value?.data?.data ?? result.value?.data)
}

const asArray = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

const optionText = (item, keys = []) => {
  if (typeof item === 'string' || typeof item === 'number') return String(item)
  for (const key of keys) {
    if (item?.[key] !== null && item?.[key] !== undefined && item?.[key] !== '') {
      return String(item[key])
    }
  }
  return ''
}

const fieldText = (item, ...keys) => optionText(item, keys)
const normalizedText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
const isOthersDeductionCode = (code) =>
  normalizedText(fieldText(code, 'deduction_type', 'deductionType')) === 'others' ||
  Boolean(code?.is_others)

const uniqueOptions = (items, keys, labelFormatter = null) => {
  const seen = new Set()
  return items
    .map((item) => {
      const value = optionText(item, ['value', ...keys, 'name', 'label', 'id'])
      let label = optionText(item, ['label', 'name', ...keys]) || value
      if (labelFormatter) label = labelFormatter(value) || label
      return value ? { label, value } : null
    })
    .filter((option) => {
      if (!option || seen.has(option.value)) return false
      seen.add(option.value)
      return true
    })
}

const deductionTypeOptions = computed(() =>
  uniqueOptions(
    deductionTypesFromApi.value.length ? deductionTypesFromApi.value : deductionLibrary.value,
    ['deduction_type', 'deductionType'],
    formatDeductionTypeLabel,
  ),
)

const taxTypeOptions = computed(() =>
  uniqueOptions(
    taxTypesFromApi.value.length ? taxTypesFromApi.value : deductionLibrary.value,
    ['tax_type', 'taxType'],
    formatTaxTypeLabel,
  ),
)

const codeOptions = computed(() => {
  const { deductionType, taxType } = deductionForm.value

  if (normalizedText(deductionType) === 'others') {
    return deductionLibrary.value
      .filter((c) => isOthersDeductionCode(c))
      .map((c) => ({ label: c.label ?? c.code, value: c.id }))
  }

  return deductionLibrary.value
    .filter((c) => {
      const matchType =
        !deductionType ||
        normalizedText(fieldText(c, 'deduction_type', 'deductionType')) ===
          normalizedText(deductionType)
      const matchTax =
        !taxType || normalizedText(fieldText(c, 'tax_type', 'taxType')) === normalizedText(taxType)
      return matchType && matchTax
    })
    .map((c) => ({ label: `${c.label}`, value: c.id }))
})

function onDeductionTypeChange() {
  const isOthers = normalizedText(deductionForm.value.deductionType) === 'others'
  const othersCode = isOthers ? deductionLibrary.value.find((c) => isOthersDeductionCode(c)) : null

  deductionForm.value.code = null
  deductionForm.value.divisor = null
  deductionForm.value.vatPercent = null
  deductionForm.value.ewtPercent = null
  deductionForm.value.label = ''
  deductionForm.value.amount = 0
  deductionForm.value.netAmount = 0
  deductionForm.value.grossVatInc = 0
  deductionForm.value.grossVatExc = 0
  deductionForm.value.isManual = isOthers
  deductionForm.value.deduction_code_id = othersCode?.id ?? null

  if (othersCode) {
    deductionForm.value.code = othersCode.id
    deductionForm.value.description =
      othersCode.description ?? othersCode.code ?? 'Manual Deduction'
    deductionForm.value.divisor = othersCode.divisor ?? null
    deductionForm.value.vatPercent = othersCode.vat_percent ?? null
    deductionForm.value.ewtPercent = othersCode.ewt_percent ?? null
  }
}

function onTaxTypeChange() {
  const isOthers = normalizedText(deductionForm.value.deductionType) === 'others'
  deductionForm.value.code = null
  deductionForm.value.divisor = null
  deductionForm.value.vatPercent = null
  deductionForm.value.ewtPercent = null
  deductionForm.value.description = ''
  deductionForm.value.amount = 0
  deductionForm.value.netAmount = 0
  deductionForm.value.grossVatInc = 0
  deductionForm.value.grossVatExc = 0
  deductionForm.value.isManual = isOthers
  deductionForm.value.deduction_code_id = null
  fetchDeductionTypesForTax(deductionForm.value.taxType)
}

async function fetchDeductionTypesForTax(taxType) {
  if (!taxType) return

  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.get('/api/barangay/deduction-codes/deduction-types', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      params: { tax_type: taxType },
    })
    const filteredTypes = asArray(res.data?.data ?? res.data)
    if (filteredTypes.length) {
      deductionTypesFromApi.value = filteredTypes
    }
  } catch (e) {
    console.warn(
      'Could not fetch deduction types by tax type; keeping local fallback.',
      e.response?.data || e.message,
    )
  }
}

async function onCodeChange(codeId) {
  // Find the selected code entry from the library
  const entry = deductionLibrary.value.find((c) => String(c.id) === String(codeId))
  if (!entry) return

  deductionForm.value.deduction_code_id = codeId
  deductionForm.value.divisor = entry.divisor ?? 1
  deductionForm.value.vatPercent = entry.vat_percent ?? 0
  deductionForm.value.ewtPercent = entry.ewt_percent ?? 0
  deductionForm.value.description = entry.description ?? entry.code ?? ''
  deductionForm.value.isManual =
    String(entry.deduction_type || '').toLowerCase() === 'others' || !!entry.is_others

  if (deductionForm.value.isManual) {
    // others = manual entry; clear computed fields
    deductionForm.value.grossVatInc = 0
    deductionForm.value.grossVatExc = 0
    deductionForm.value.amount = 0
    deductionForm.value.netAmount = 0
    return
  }

  // Auto-preview from backend
  await previewDeduction()
}

async function previewDeduction() {
  const codeId = deductionForm.value.deduction_code_id
  const grossAmount = Number(store.totalExpensesAmount) || 0

  if (!codeId || deductionForm.value.isManual) return

  previewLoading.value = true
  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.post(
      '/api/barangay/deductions/preview',
      {
        deduction_code_id: codeId,
        gross_vat_inc: grossAmount,
        description: deductionForm.value.description || '',
      },
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
    )

    const d = res.data?.data ?? res.data
    if (d) {
      deductionForm.value.divisor = d.divisor ?? deductionForm.value.divisor
      deductionForm.value.vatPercent = d.vat_percent ?? deductionForm.value.vatPercent
      deductionForm.value.ewtPercent = d.ewt_percent ?? deductionForm.value.ewtPercent
      deductionForm.value.grossVatInc = Number(d.gross_vat_inc) || grossAmount
      deductionForm.value.grossVatExc = Number(d.gross_vat_exc) || 0
      deductionForm.value.amount = Number(d.deduction_amount) || 0
      deductionForm.value.netAmount = Number(d.net_amount) || 0
    }
  } catch (e) {
    console.error('Deduction preview failed:', e)
    $q.notify({ type: 'warning', message: 'Could not preview deduction amount.', position: 'top' })
  } finally {
    previewLoading.value = false
  }
}

watch(
  () => store.totalExpensesAmount,
  () => {
    if (!deductionForm.value.isManual && deductionForm.value.deduction_code_id) {
      previewDeduction()
    }
  },
)

async function confirmAddDeduction() {
  const isManual = deductionForm.value.isManual

  // Non-manual: a code must be selected
  if (!isManual && !deductionForm.value.deduction_code_id) {
    return $q.notify({
      type: 'negative',
      message: 'Please select a deduction code.',
      position: 'top',
    })
  }

  // Manual ("Others"): amount must be entered by hand
  if (isManual && !(Number(deductionForm.value.amount) > 0)) {
    return $q.notify({
      type: 'negative',
      message: 'Please enter the deduction amount.',
      position: 'top',
    })
  }

  const disbursementId = store.currentItem?.id ?? null

  // Only code-based deductions go straight to the backend "/deductions" endpoint,
  // since that endpoint calculates the amount from deduction_code_id and has
  // no field for a manually typed amount. "Others" deductions are handled below
  // and get saved together with the rest of the disbursement.
  if (disbursementId && editingDeductionIndex.value === -1 && !isManual) {
    try {
      const token = authStore.admin ? authStore.adminToken : authStore.token
      const payload = {
        disbursement_id: disbursementId,
        deduction_code_id: deductionForm.value.deduction_code_id,
        gross_vat_inc: deductionForm.value.grossVatInc || Number(store.totalExpensesAmount) || 0,
        description: deductionForm.value.description || '',
      }
      const res = await api.post('/api/barangay/deductions', payload, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      const saved = res.data?.data
      if (saved) {
        const row = mapApiDeductionToRow(saved)
        store.addDeductionRow(row)
        closeDeductionDialog()
        return
      }
    } catch (e) {
      console.error('Failed to save deduction:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'Failed to save deduction.',
        position: 'top',
      })
      return
    }
  }

  // In-memory path: new disbursement not yet saved, editing an existing row,
  // OR a manual "Others" deduction — amount is taken as typed.
  const grossAmount = Number(store.totalExpensesAmount) || 0
  const deductionAmount = Number(deductionForm.value.amount) || 0
  const displayPercent =
    deductionForm.value.deductionType === 'businessTax'
      ? (deductionForm.value.vatPercent ?? 0)
      : (deductionForm.value.ewtPercent ?? 0)

  const row = {
    id: editingDeductionId.value || Date.now(),
    deduction_code_id: deductionForm.value.deduction_code_id,
    deductionTypeName:
      deductionTypeOptions.value.find((o) => o.value === deductionForm.value.deductionType)
        ?.label ?? deductionForm.value.deductionType,
    taxTypeName: deductionForm.value.taxType
      ? (taxTypeOptions.value.find((t) => t.value === deductionForm.value.taxType)?.label ?? '—')
      : '—',
    code: (() => {
      const entry = deductionLibrary.value.find(
        (c) => String(c.id) === String(deductionForm.value.deduction_code_id),
      )
      return entry?.code ?? deductionForm.value.description
    })(),
    description: deductionForm.value.description || deductionForm.value.deductionType,
    divisor: deductionForm.value.divisor,
    vatPercent: deductionForm.value.vatPercent,
    ewtPercent: deductionForm.value.ewtPercent,
    gross_vat_inc: Number(deductionForm.value.grossVatInc) || grossAmount,
    gross_vat_exc: deductionForm.value.grossVatExc,
    percent: isManual ? null : displayPercent,
    deduction_amount: deductionAmount,
    net_amount: Number(deductionForm.value.netAmount) || Math.max(0, grossAmount - deductionAmount),
    amount: deductionAmount,
    isManual,
  }

  if (editingDeductionIndex.value !== -1) {
    store.forms.expense.deductions = (store.forms.expense.deductions || []).map((d, i) =>
      i === editingDeductionIndex.value ? row : d,
    )
    store._recalcDeductionTotals()
  } else {
    store.addDeductionRow(row)
  }

  closeDeductionDialog()
}

function mapApiDeductionToRow(d) {
  const deductionType = d.deduction_type
  return {
    id: d.id,
    deduction_code_id: d.deduction_code_id,
    deductionTypeName: deductionType,
    taxTypeName: d.tax_type,
    code: d.code,
    description: d.description,
    divisor: d.divisor,
    vatPercent: d.vat_percent,
    ewtPercent: d.ewt_percent,
    gross_vat_inc: Number(d.gross_vat_inc) || 0,
    gross_vat_exc: Number(d.gross_vat_exc) || 0,
    percent: Number(d.vat_percent || d.ewt_percent) || 0,
    deduction_amount: Number(d.deduction_amount) || 0,
    net_amount: Number(d.net_amount) || 0,
    amount: Number(d.deduction_amount) || 0,
    isManual: String(deductionType || '').toLowerCase() === 'others' || Boolean(d.is_manual),
  }
}

function openDeductionDialog() {
  editingDeductionId.value = null
  editingDeductionIndex.value = -1
  deductionForm.value = emptyDeductionForm()
  store.forms.expense.amount = Number(store.totalExpensesAmount) || 0

  // Fetch library data if not yet loaded
  if (!deductionLibrary.value.length) {
    fetchDeductionLibrary()
  }

  deductionDialogOpen.value = true
}

// Explicit label overrides for known tax/deduction type values
const TAX_TYPE_LABELS = {
  percentage: 'Percentage',
  professionalServices: 'Professional Services',
  vatExempt: 'VAT Exempt',
}

const DEDUCTION_TYPE_LABELS = {
  businessTax: 'Business Tax',
}

// Fallback formatter for camelCase values that aren't in the maps above
// e.g. 'someNewType' -> 'Some New Type'
const humanizeCamelCase = (value) => {
  if (!value) return ''
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
}

const formatTaxTypeLabel = (value) => TAX_TYPE_LABELS[value] || humanizeCamelCase(value)
const formatDeductionTypeLabel = (value) => DEDUCTION_TYPE_LABELS[value] || humanizeCamelCase(value)

const editDeductionRow = (deduction) => {
  editingDeductionId.value = deduction.id
  editingDeductionIndex.value = (store.forms.expense.deductions || []).findIndex(
    (row) => row === deduction || (deduction.id != null && String(row.id) === String(deduction.id)),
  )

  const taxType = deduction.taxTypeName
    ? (taxTypeOptions.value.find((t) => t.label === deduction.taxTypeName)?.value ?? null)
    : null
  const deductionType = normalizeDeductionType(deduction.deductionTypeName)
  const code = deduction.code || ''
  const cfg = findConfig(taxType, deductionType, code)

  deductionForm.value = {
    ...emptyDeductionForm(),
    deductionType,
    taxType,
    code,
    description: deduction.description || code || '',
    divisor: cfg?.divisor ?? null,
    vatPercent: cfg?.vatPercent ?? null,
    ewtPercent: cfg?.ewtPercent ?? null,
    grossVatInc: Number(deduction.gross_vat_inc) || 0,
    grossVatExc: Number(deduction.gross_vat_exc) || 0,
    amount: Number(deduction.amount) || 0,
    isManual: deduction.isManual ?? false,
  }

  if (!deductionLibrary.value.length) {
    fetchDeductionLibrary()
  }

  deductionDialogOpen.value = true
}

function normalizeDeductionType(value) {
  const raw = String(value || '').trim()
  const option = deductionTypeOptions.value.find((opt) => opt.value === raw || opt.label === raw)
  return option?.value || raw
}

const taxTypeConfigs = {
  percentage: {
    EWT: {
      WI640: { divisor: 1, vatPercent: 0, ewtPercent: 1, description: 'WI640 - GOODS' },
      WI157: { divisor: 1, vatPercent: 0, ewtPercent: 2, description: 'WI157 - SERVICES' },
      WI100: { divisor: 1, vatPercent: 0, ewtPercent: 5, description: 'WI100 - RENTALS' },
    },
    businessTax: {
      WV010: { divisor: 1, vatPercent: 3, ewtPercent: 0, description: 'WV010 - GOODS' },
      WV020: {
        divisor: 1,
        vatPercent: 3,
        ewtPercent: 0,
        description: 'WV020 - SERVICES / RENTALS',
      },
      WB080: { divisor: 1, vatPercent: 3, ewtPercent: 0, description: 'WB080 - PERCENTAGE' },
    },
    others: {},
  },
  VAT: {
    EWT: {
      WI640: { divisor: 1.12, vatPercent: 0, ewtPercent: 1, description: 'WI640 - GOODS' },
      WI157: { divisor: 1.12, vatPercent: 0, ewtPercent: 2, description: 'WI157 - SERVICES' },
      WI100: { divisor: 1.12, vatPercent: 0, ewtPercent: 5, description: 'WI100 - RENTALS' },
    },
    businessTax: {
      WV010: { divisor: 1.12, vatPercent: 5, ewtPercent: 0, description: 'WV010 - GOODS' },
      WV020: {
        divisor: 1.12,
        vatPercent: 5,
        ewtPercent: 0,
        description: 'WV020 - SERVICES / RENTALS',
      },
      WB080: { divisor: 1.12, vatPercent: 5, ewtPercent: 0, description: 'WB080 - PERCENTAGE' },
    },
    others: {},
  },
  VatExempt: {
    EWT: {
      WI640: { divisor: 1, vatPercent: 0, ewtPercent: 1, description: 'WI640 - GOODS' },
      WI157: { divisor: 1, vatPercent: 0, ewtPercent: 2, description: 'WI157 - SERVICES' },
      WI100: { divisor: 1, vatPercent: 0, ewtPercent: 5, description: 'WI100 - RENTALS' },
    },
    businessTax: {
      WV010: { divisor: 1, vatPercent: 0, ewtPercent: 0, description: 'WV010 - GOODS' },
      WV020: {
        divisor: 1,
        vatPercent: 0,
        ewtPercent: 0,
        description: 'WV020 - SERVICES / RENTALS',
      },
      WB080: { divisor: 1, vatPercent: 0, ewtPercent: 0, description: 'WB080 - PERCENTAGE' },
    },
    others: {},
  },
  professionalServices: {
    EWT: {
      WI080: { divisor: 1, vatPercent: 0, ewtPercent: 5, description: 'WI080 - PROFESSIONAL FEE' },
      WI081: { divisor: 1, vatPercent: 0, ewtPercent: 10, description: 'WI081 - PROFESSIONAL FEE' },
    },
    businessTax: {
      WV010: { divisor: 1, vatPercent: 3, ewtPercent: 0, description: 'WV010 - GOODS' },
      WV020: {
        divisor: 1,
        vatPercent: 3,
        ewtPercent: 0,
        description: 'WV020 - SERVICES / RENTALS',
      },
      WB080: { divisor: 1, vatPercent: 3, ewtPercent: 0, description: 'WB080 - PERCENTAGE' },
    },
    others: {},
  },
  // noTax is a valid selection but always zero effect; keep for completeness
  noTax: {
    EWT: {},
    businessTax: {},
    others: {},
  },
}

function findConfig(taxType, deductionType, code) {
  return taxTypeConfigs[taxType]?.[deductionType]?.[code] ?? null
}

// Helper: today as DD/MM/YYYY

const todayDMY = () => {
  const t = new Date()
  return [
    String(t.getDate()).padStart(2, '0'),
    String(t.getMonth() + 1).padStart(2, '0'),
    t.getFullYear(),
  ].join('/')
}

const formatDialogDate = (value) => {
  if (!value) return todayDMY()
  const text = String(value)
  if (text.includes('/')) return text
  if (text.includes('-')) {
    const [yyyy, mm, dd] = text.split('T')[0].split('-')
    return `${dd}/${mm}/${yyyy}`
  }
  return text
}

const fetchNewDvNumber = async () => {
  try {
    const { api } = await import('src/boot/axios')
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.get('/api/barangay/generate-dvnumber', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    const apiDv = res.data?.data?.dv_number || ''

    // Cross-check against ALL types (regular + BIR + SK) already in the store
    const alreadyExists = !!(apiDv && (store.disbursements || []).some((d) => d.dvNumber === apiDv))

    return alreadyExists ? store.generateLocalDvNumber() : apiDv || store.generateLocalDvNumber()
  } catch (e) {
    console.error('DV fetch failed, using local fallback:', e)
    return store.generateLocalDvNumber()
  }
}

const formatAmountDisplay = (raw) => {
  const n = parseFloat(String(raw).replace(/[₱,\s]/g, ''))
  return isNaN(n)
    ? ''
    : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const resetBirForm = () => {
  birForm.value = { date: '', bank_id: null, cheque_number: '', dv_number: '', dv_amount: '' }
  birAmountDisplay.value = ''
  editingBirId.value = null
}

watch(showBirDialog, async (open) => {
  if (open) {
    if (editingBirId.value) return
    birForm.value.date = todayDMY()
    birForm.value.dv_number = await fetchNewDvNumber()
    birForm.value.bank_id = null
    birForm.value.cheque_number = ''
    birForm.value.dv_amount = ''
    birAmountDisplay.value = ''
    birChequeRows.value = [defaultBirRow()] // start with one empty row
  } else {
    resetBirForm()
    birChequeRows.value = []
  }
})

const resetSkForm = () => {
  skForm.value = { type: 'sk', date: '', dv_number: '', payee: '', remarks: '' }
  skAmountDisplay.value = ''
  skChequeRows.value = []
  editingSkId.value = null
}

watch(showSkDialog, async (open) => {
  if (open) {
    if (editingSkId.value) return

    // Fill form on open
    skForm.value.date = todayDMY()
    skForm.value.dv_number = await fetchNewDvNumber()
    skForm.value.bank_id = null
    skForm.value.cheque_number = ''
    skForm.value.payee = ''
    skForm.value.amount = ''
    skForm.value.remarks = ''
    skForm.value.type = 'sk'
    skAmountDisplay.value = ''
    skChequeRows.value = [defaultSkRow()]
  } else {
    resetSkForm()
  }
})

const blockNonNumeric = (e) => {
  const allowed = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
  ]
  if (allowed.includes(e.key)) return
  if (e.key === '.' && !e.target.value.includes('.')) return
  if (!/^\d$/.test(e.key)) e.preventDefault()
}

const canVoid = (row) => row.status === 'Unliquidated' || row.status === 'Partial'
const clearAllFilters = () => {
  selectedStatus.value = null
  searchQuery.value = ''
  dateRange.value = null
  store.dateFrom = ''
  store.dateTo = ''
}
const dateRangeDisplay = computed(() => {
  if (!dateRange.value?.from || !dateRange.value?.to) return ''
  const fmt = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  return `${fmt(dateRange.value.from)} - ${fmt(dateRange.value.to)}`
})

const onDateRangeChange = (r) => {
  if (r?.from && r?.to) {
    store.dateFrom = new Date(r.from).toLocaleDateString('en-GB')
    store.dateTo = new Date(r.to).toLocaleDateString('en-GB')
  } else {
    store.dateFrom = ''
    store.dateTo = ''
  }
}
const onDateRangeClear = () => {
  dateRange.value = null
  store.dateFrom = ''
  store.dateTo = ''
}
// const getStatusColor = (s) =>
//   ({
//     Unliquidated: 'blue',
//     Partial: 'amber',
//     Liquidated: 'green',
//     'Void Requested': 'deep-orange',
//     Voided: 'red',
//     Stale: 'purple',
//   })[s] || 'grey'
// const getStatusTextColor = (s) =>
//   ['Unliquidated', 'Partial', 'Liquidated', 'Void Requested', 'Voided', 'Stale'].includes(s)
//     ? 'white'
//     : 'black'
const getStatusColor = (s) =>
  ({
    Unliquidated: '#1976D2', // blue
    Partial: '#FFA000', // amber
    Liquidated: '#43A047', // green
    'Void Requested': '#FF5722', // deep-orange
    Voided: '#F44336', // red
    Stale: '#9C27B0', // purple
  })[s] || '#9E9E9E' // grey

const userPosition = computed(() => authStore.user?.position_name || '')
const isTreasurer = computed(() => /treasurer/i.test(userPosition.value))
const isApprover = computed(() => /(captain|chairperson)/i.test(userPosition.value))
const currentFiscalYear = computed(() => selectedYear.value)
// const currentBankLabel = computed(() => bankStore.banks?.find(b => b.id === store.forms.disbursement.bank_id)?.name || 'Select Bank')
const currentStatusLabel = computed(
  () => statusOptions.find((o) => o.value === selectedStatus.value)?.label || 'All Status',
)
// const loadAllData = async () => {
//   if (loading.value) return
//   loading.value = true
//   try {
//     await Promise.all([
//       store.fetchDisbursements(selectedYear.value, true), // pass the year, force refresh
//       bankStore.fetchBanks(),
//       fetchBarangaySetupBankAccounts(),
//       payeeStore.fetchPayees().catch((error) => {
//         console.warn('Failed to load registered payees:', error)
//       }),
//     ])
//     store.refreshExpenseAccountsWithBalances().catch(() => {})
//   } finally {
//     loading.value = false
//     initialLoading.value = false
//   }
// }

const loadAllDataRaw = async () => {
  if (loading.value) return
  loading.value = true
  try {
    await Promise.all([
      store.fetchDisbursements(selectedYear.value, true),
      bankStore.fetchBanks(),
      fetchBarangaySetupBankAccounts(),
      payeeStore.fetchPayees().catch((error) => {
        console.warn('Failed to load registered payees:', error)
      }),
    ])
    store.refreshExpenseAccountsWithBalances().catch(() => {})
  } finally {
    loading.value = false
    initialLoading.value = false
  }
}

const loadAllData = debounce(loadAllDataRaw, 500)

// const refreshData = async () => {
//   await loadAllData()
// }

const refreshData = debounce(async () => {
  await loadAllDataRaw()
}, 500)

const selectedYear = ref(new Date().getFullYear())

const applyNavigationFilters = () => {
  const q = route.query
  if (q.search) {
    searchQuery.value = q.search
    store.searchQuery = q.search
  }
  if (q.status) selectedStatus.value = q.status
  if (q.year) {
    selectedYear.value = Number(q.year)
  }
  if (q.dateFrom && q.dateTo) {
    const from = new Date(q.dateFrom),
      to = new Date(q.dateTo)
    if (!isNaN(from) && !isNaN(to)) {
      dateRange.value = {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      }
      store.dateFrom = from.toLocaleDateString('en-GB')
      store.dateTo = to.toLocaleDateString('en-GB')
    }
  }
}

onMounted(async () => {
  applyNavigationFilters()
  // fetchDeductionCodes()
  await loadAllData()
  const { logPageVisit } = usePageLogging()
  await logPageVisit('Current Disbursement')
})

watch(
  () => route.query,
  (nq, oq) => {
    if (JSON.stringify(nq) !== JSON.stringify(oq)) {
      applyNavigationFilters()
      loadAllData() // reload with new year if it changed
    }
  },
  { deep: true },
)
watch(
  () => store.dialogs.expense,
  async (open) => {
    if (open && store.expenseAccounts.length === 0) store.refreshExpenseAccountsWithBalances()
  },
)

const handleAddExpense = async () => {
  addingExpense.value = true
  try {
    await store.openDialog('expense')
  } finally {
    addingExpense.value = false
  }
}
const preloadExpenseAccounts = () => {
  if (!store.expenseAccounts.length && !store.expenseAccountsLoading)
    store.refreshExpenseAccountsWithBalances().catch(() => {})
}

const handleDeleteExpense = async (row) => {
  await store.deleteItem(row)
}
const handleEnterKey = (e) => {
  if (e) e.preventDefault()
}
const handleSaveClick = async () => {
  const f = store.forms.disbursement

  if (!f.date || !f.dvNumber || !f.payee) {
    return $q.notify({ type: 'negative', message: 'Fill all required fields', position: 'top' })
  }

  if (!store.expenses?.length) {
    return $q.notify({ type: 'negative', message: 'Add at least one expense', position: 'top' })
  }

  const invalidExpense = store.expenses.find((e) => !e.particular || !e.amount)

  if (invalidExpense) {
    return $q.notify({
      type: 'negative',
      message: 'Each expense must have particulars and amount',
      position: 'top',
    })
  }

  if (!store.bankCheques?.length) {
    return $q.notify({ type: 'negative', message: 'Add at least one bank cheque', position: 'top' })
  }

  const chequeTotal = Math.round(bankChequeTotal.value * 100) / 100
  const netTotal = Math.round(netDisbursementAmount.value * 100) / 100

  if (chequeTotal !== netTotal) {
    const difference = Math.abs(netTotal - chequeTotal)
    return $q.notify({
      type: 'negative',
      message:
        chequeTotal > netTotal
          ? `Cheque amount exceeded the net amount by ₱${difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          : `Cheque amount is lacking ₱${difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      position: 'top',
    })
  }

  const res = await store.saveDisbursement()

  if (res.success) {
    $q.notify({ type: 'positive', message: 'Disbursement saved!', position: 'top', timeout: 3000 })
    await store.fetchDisbursements()
  } else {
    $q.notify({ type: 'negative', message: res.error || 'Failed to save', position: 'top' })
  }
}
const handleDialogClose = (name) => {
  if (name === 'disbursement') {
    store.resetForm('disbursement')
    store.expenses = []
    store.autoCheque = null
    store.autoBookletID = null
    store.pendingChequeNumbers = []
    store.bankCheques = []
  } else if (name === 'expense' || name === 'expenseDetail') {
    store.resetForm('expense')
  } else if (name === 'void') {
    store.resetForm('void')
  }
  store.closeDialog(name)
}

const handleVoidDisbursement = (row) => store.openVoidDialog(row)
const handleSubmitVoidRequest = async () => {
  if (!store.forms.void.remarks?.trim())
    return $q.notify({ type: 'negative', message: 'Remarks required', position: 'top' })
  const res = await store.submitVoidRequest()
  if (res.success) {
    $q.notify({ type: 'positive', message: 'Void request submitted!', position: 'top' })
    await refreshData()
  } else $q.notify({ type: 'negative', message: res.message || 'Failed', position: 'top' })
}
const handleDirectVoidDisbursement = (row) => {
  $q.dialog({
    title: 'Void Disbursement',
    message: 'Provide remarks:',
    prompt: {
      model: '',
      type: 'textarea',
      isValid: (v) => !!v?.trim(),
    },
    cancel: true,
    persistent: true,
  }).onOk(async (remarks) => {
    const res = await store.voidDisbursementDirectly(row.id, remarks?.trim() || '')
    if (res.success)
      $q.notify({ type: 'positive', message: 'Voided successfully!', position: 'top' })
    else $q.notify({ type: 'negative', message: res.message || 'Failed', position: 'top' })
  })
}

const getOpenRow = (row) => ({
  ...row,
  id: row.disbursement_id || row.id,
})

const handleEditDisbursement = async (row) => {
  try {
    if (row.type === 'bir') {
      openBirEditDialog(row)
      return
    }
    if (row.type === 'sk' || row.type === 'provincial_aid') {
      openSkEditDialog(row)
      return
    }
    await store.openEditDisbursement(getOpenRow(row))
  } catch (error) {
    console.error('Error opening edit disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open edit disbursement',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
  }
}

const formatPeso = (val) => {
  const n = parseFloat(val) || 0
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const emptyDeductionForm = () => ({
  deductionType: null,
  taxType: null,
  code: null, // holds the deduction-code id
  deduction_code_id: null, // explicit FK for backend
  divisor: null,
  vatPercent: null,
  ewtPercent: null,
  description: '',
  grossVatInc: 0,
  grossVatExc: 0,
  amount: 0,
  netAmount: 0,
  isManual: false,
})

function closeDeductionDialog() {
  deductionDialogOpen.value = false
  editingDeductionId.value = null
  editingDeductionIndex.value = -1
  deductionForm.value = emptyDeductionForm()
}

const deductionDialogOpen = ref(false)

const deductionForm = ref(emptyDeductionForm())

const fundOptions = [
  { label: 'General Fund', value: 'generalFund' },
  { label: 'Special Education Fund', value: 'specialEducationFund' },
  { label: 'Trust Fund', value: 'trustFund' },
]

const taxpayerTypeOptions = [
  { label: 'Individual', value: 'individual' },
  { label: 'Non-Individual', value: 'nonIndividual' },
]

watch(
  () => store.forms.disbursement.payee,
  (newPayee, oldPayee) => {
    if (!payee2Edited.value || store.forms.disbursement.payee2 === oldPayee) {
      store.forms.disbursement.payee2 = newPayee
    }
  },
)

watch(
  () => store.dialogs.disbursement,
  (open) => {
    if (open) {
      payee2Edited.value = false
      filteredPayeeOptions.value = payeeOptions.value
    }
  },
)

const handleViewDisbursement = async (row) => {
  const openRow = getOpenRow(row)
  viewLoading.value[row.id] = true
  try {
    if (hasRemarks(row)) openRemarksDialog(openRow)
    else await store.openViewOrDetails(openRow)
  } finally {
    viewLoading.value[row.id] = false
  }
}

const handleLiquidateDisbursement = async (row) => {
  liquidateLoading.value[row.id] = true
  try {
    await store.openOrDetailsDialog(row)
  } finally {
    liquidateLoading.value[row.id] = false
  }
}

const handlePrintCheque = async (row) => {
  const openRow = getOpenRow(row)
  viewLoading.value[row.id] = true
  try {
    if (row.type === 'regular') {
      const data = await store.fetchDisbursementForView(openRow.id)
      selectedChequeDisbursement.value = data || openRow
    } else {
      selectedChequeDisbursement.value = buildPrintableChequeData(row)
    }
    chequePrintDialog.value = true
  } catch (error) {
    console.error('Error opening cheque print dialog:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load cheque details',
      position: 'top',
    })
  } finally {
    viewLoading.value[row.id] = false
  }
}

const normalizeChequeRowsForEdit = (row) => {
  const entries = row.bank_cheques || row.entries || []
  if (entries.length) {
    return entries.map((entry) => ({
      bank_id: entry.bank_id || row.bank_id || null,
      bankName: entry.bankName || entry.bank_name || entry.bank || row.bank || '',
      booklet_id: entry.booklet_id || null,
      cheque_number: entry.cheque_number || entry.chequeNumber || row.chequeNumber || '',
      cheque_date: entry.cheque_date || entry.chequeDate || row.cheque_date || '',
      bank_status: entry.bank_status || entry.bankStatus || row.bank_status || '',
      particular: entry.particular || row.particular || '',
      amount: String(entry.amount || ''),
      amountDisplay: formatAmountDisplay(entry.amount || ''),
    }))
  }

  return [
    {
      bank_id: row.bank_id || null,
      bankName: row.bank || row.bank_name || '',
      booklet_id: row.booklet_id || null,
      cheque_number: row.chequeNumber || row.cheque_number || '',
      cheque_date: row.cheque_date || '',
      bank_status: row.bank_status || '',
      particular: row.particular || 'Remittance to BIR',
      amount: String(row.dvAmount || row.amount || ''),
      amountDisplay: formatAmountDisplay(row.dvAmount || row.amount || ''),
    },
  ]
}

const openBirEditDialog = (row) => {
  editingBirId.value = row._rawId || row.id
  birForm.value = {
    date: formatDialogDate(row.date),
    bank_id: row.bank_id || null,
    cheque_number: row.chequeNumber || row.cheque_number || '',
    dv_number: row.dvNumber || row.dv_number || '',
    dv_amount: row.dvAmount || '',
  }
  birChequeRows.value = normalizeChequeRowsForEdit(row).map((entry) => ({
    ...defaultBirRow(),
    ...entry,
    particular: entry.particular || 'Remittance to BIR',
  }))
  showBirDialog.value = true
}

const openSkEditDialog = (row) => {
  editingSkId.value = row._rawId || row.id
  skForm.value = {
    type: row.type || row._originalType || 'sk',
    date: formatDialogDate(row.date),
    bank_id: row.bank_id || null,
    cheque_number: row.chequeNumber || row.cheque_number || '',
    dv_number: row.dvNumber || row.dv_number || '',
    payee: row.payee || '',
    amount: row.dvAmount || row.amount || '',
    remarks: row.remarks || '',
  }
  skChequeRows.value = normalizeChequeRowsForEdit(row).map((entry) => ({
    ...defaultSkRow(),
    ...entry,
  }))
  showSkDialog.value = true
}

const buildPrintableChequeData = (row) => ({
  ...row,
  id: row._rawId || row.id,
  date: row.date,
  dvNumber: row.dvNumber || row.dv_number,
  chequeNumber: row.chequeNumber || row.cheque_number,
  bank: row.bank || row.bank_name,
  bank_name: row.bank || row.bank_name,
  payee: row.payee || (row.type === 'bir' ? 'Bureau of Internal Revenue' : ''),
  dvAmount: row.dvAmount || row.amount,
  netAmount:
    row.netAmount !== null && row.netAmount !== undefined && row.netAmount !== ''
      ? row.netAmount
      : row.dvAmount || row.amount,
  bank_cheques: (row.bank_cheques || row.entries || []).filter((entry) => Number(entry.amount) > 0)
    .length
    ? (row.bank_cheques || row.entries || []).filter((entry) => Number(entry.amount) > 0)
    : [
        {
          bank_name: row.bank || row.bank_name,
          cheque_number: row.chequeNumber || row.cheque_number,
          amount: Number(row.netAmount || row.dvAmount || row.amount || 0),
        },
      ],
})

const handlePrintVoucher = async (row) => {
  const openRow = getOpenRow(row)
  viewLoading.value[row.id] = true
  try {
    const data = await store.fetchDisbursementForView(openRow.id, row.type || 'regular')
    selectedVoucherDisbursement.value = data || openRow
    voucherPrintDialog.value = true
  } catch (error) {
    console.error('Error opening voucher print dialog:', error)
    $q.notify({ type: 'negative', message: 'Failed to load voucher details', position: 'top' })
  } finally {
    viewLoading.value[row.id] = false
  }
}

const hasRemarks = (row) =>
  (row.status === 'Void Requested' && row.remarks) ||
  (row.status === 'Voided' && row.remarks) ||
  row.rejection_remarks
const openRemarksDialog = (row) => {
  selectedRemarksData.value = row
  remarksDialog.value = true
}
const closeRemarksDialog = () => {
  remarksDialog.value = false
  selectedRemarksData.value = null
}
const openViewOrDetailsFromRemarks = async () => {
  const data = { ...selectedRemarksData.value }
  closeRemarksDialog()
  try {
    await store.openViewOrDetails(data)
  } catch (e) {
    console.error(e)
  }
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
  background: #ffffff;
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

/* Balance chip under the cheque Amount field */
.balance-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 4px 10px;
  border-radius: 6px;
  background: #e8f5e9;
  border: 1px solid #a5d6a7;
  color: #2e7d32;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.balance-chip:hover {
  background: #c8e6c9;
  border-color: #81c784;
}

.balance-chip:active {
  transform: scale(0.98);
}

.balance-chip__amount {
  margin-left: auto;
  font-weight: 700;
}

.balance-chip--zero {
  background: #f5f5f5;
  border-color: #e0e0e0;
  color: #9e9e9e;
  cursor: default;
}

.balance-chip--zero:hover {
  background: #f5f5f5;
  border-color: #e0e0e0;
  transform: none;
}

/* BIR SUMMARY STRIP */
.bir-summary-strip {
  border-radius: 12px;
  border-color: #ffffff;
  overflow: hidden;
  background: #ffffff;
  width: 100%;
  border-color: #bdbdbd;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
}

.bir-summary-strip .row {
  flex-wrap: nowrap;
}

.bir-summary-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 14px 8px;
  text-align: center;
  min-width: 0; /* lets flex children shrink instead of forcing wrap */
}

.bir-summary-label {
  font-size: 11px;
  font-weight: 600;
  color: #9e9e9e;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.bir-summary-value {
  font-size: 17px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.bir-progress-track {
  height: 5px;
  background: #ffe0b2;
  margin: 0 16px;
  border-radius: 3px;
  overflow: hidden;
}

.bir-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #43a047, #66bb6a);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.status-toggle {
  position: relative;
  display: flex;
  align-items: center;
  width: 140px;
  height: 33px;
  border-radius: 22px;
  border: 1px solid #d0d0d0;
  background: #f5f5f5;
  cursor: pointer;
  padding: 3px;
  box-sizing: border-box;
  outline: none;
}

.status-toggle:focus-visible {
  box-shadow: 0 0 0 2px rgba(24, 124, 25, 0.35);
}

.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  border-radius: 19px;
  background: #187c19;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
  z-index: 0;
}

.knob--offline {
  transform: translateX(100%);
  background: #c62828;
}

.label {
  position: relative;
  flex: 1;
  z-index: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #757575;
  transition: color 0.2s ease;
  pointer-events: none;
}

.label--active {
  color: #ffffff;
}
</style>
