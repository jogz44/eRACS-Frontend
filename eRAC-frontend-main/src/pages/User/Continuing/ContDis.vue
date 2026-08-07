<template>
  <q-page class="q-pa-md contdis-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-medium">Continuing Disbursement</div>
          <div class="text-caption text-grey-6">
            Showing transactions for fiscal year {{ currentFiscalYear }}
          </div>
        </div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="loadPendingUsers"
          :loading="loading"
          title="Refresh disbursements"
          label=""
        />
      </div>
    </div>

    <!-- Status Summary Cards -->
    <!-- <div class="status-indicators-container q-mb-md"> -->
    <!-- <div class="row q-col-gutter-md justify-center">
        <div class="col-md-2 col-sm-4 col-xs-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h4 text-weight-bold text-orange">{{ statusCounts.pending }}</div>
              <div class="text-subtitle2 text-grey-7">Pending</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-2 col-sm-4 col-xs-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h4 text-weight-bold text-amber">{{ statusCounts.partial }}</div>
              <div class="text-subtitle2 text-grey-7">Partial</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-2 col-sm-4 col-xs-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h4 text-weight-bold text-green">{{ statusCounts.liquidated }}</div>
              <div class="text-subtitle2 text-grey-7">Liquidated</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-2 col-sm-4 col-xs-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h4 text-weight-bold text-red">{{ statusCounts.voided }}</div>
              <div class="text-subtitle2 text-grey-7">Voided</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-2 col-sm-4 col-xs-6">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <div class="text-h4 text-weight-bold text-purple">{{ statusCounts.stale }}</div>
              <div class="text-subtitle2 text-grey-7">Stale</div>
            </q-card-section>
          </q-card>
        </div>
      </div> -->
    <!-- </div> -->

    <!-- Filters Section -->
    <q-card flat bordered class="q-mb-md filters-section">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Search Input -->
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Search:</q-item-label>
            <q-input
              outlined
              dense
              v-model="store.searchQuery"
              placeholder="Search payee, DV number..."
              clearable
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Date Range Filter -->
          <div class="col-md-3 col-sm-6 col-xs-12">
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

          <!-- Flexible spacer to push Add button to the right -->
          <div class="col"></div>

          <!-- Add Button -->
          <div class="col-auto">
            <q-btn
              label="Add"
              color="primary"
              icon="add"
              @click="store.openDialog('disbursement')"
              class="full-width"
              v-permission="'add'"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="q-mb-sm">
      <!-- Disbursement Dialog -->
      <q-dialog v-model="store.dialogs.disbursement" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 960px; max-width: 96vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Continuing Disbursement</div>
          </q-card-section>

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
                :loading="store.loading || store.expenseTypeLoading"
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
                        size="sm"
                        flat
                        round
                        color="negative"
                        icon="cancel"
                        @click="handleDeleteExpense(row)"
                      />
                    </td>
                  </tr>
                </tbody>
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
          <!-- <q-card-section class="q-pt-sm q-pb-none">
            <div class="row items-center justify-end q-gutter-sm">
              <span class="text-caption text-black"><strong>Net amount:</strong></span>
              <q-input outlined dense readonly style="width: 220px; font-weight: bold; font-size: 15px"
                :model-value="`₱${netDisbursementAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`" />
            </div>
          </q-card-section> -->
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
              <q-btn
                label=""
                size="sm"
                color="primary"
                outline
                class="shadow-1"
                style="min-width: 20px"
                @click="openBankChequeDialog"
              >
                <q-icon name="add" size="18px" class="text-weight-bold" />
              </q-btn>
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
                    <th style="width: 48px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="bankChequeRows.length === 0">
                    <td colspan="5" class="text-center text-grey-5 text-caption q-pa-md">
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
                    <td class="text-right">
                      <div class="row items-center justify-end q-gutter-xs no-wrap">
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
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="store.closeDialog('disbursement')" />
            <q-btn
              label="Disburse"
              color="primary"
              @click="handleSaveClick"
              v-permission="'add'"
              :loading="store.savingDisbursement"
              :disable="store.savingDisbursement"
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
              <template v-slot:append>
                <q-icon name="search" />
              </template>
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

              <template v-slot:no-data>
                <div class="full-width row flex-center text-grey q-gutter-sm">
                  <q-icon size="2em" name="info" />
                  <span v-if="store.loading || store.expenseTypeLoading">
                    Loading expense accounts...
                  </span>
                  <span v-else>
                    No continuing appropriation accounts available.
                    <br />
                    Please create continuing appropriations first in the Continuing Appropriation
                    module.
                  </span>
                </div>
              </template>
            </q-table>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="store.closeDialog('expense')" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Add Expense Dialog -->
      <q-dialog v-model="store.dialogs.expenseDetail">
        <q-card style="min-width: 1000px; max-width: 950px">
          <!-- Header -->
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">Add Expense</div>
            <q-space />
            <q-btn icon="close" flat round dense @click="store.closeDialog('expenseDetail')" />
          </q-card-section>

          <q-card-section>
            <div class="text-subtitle1">
              <strong>Account:</strong> {{ store.forms.expense.account }}
            </div>
            <div class="text-subtitle1 q-mb-md">
              <strong>Available Balance:</strong> ₱{{
                store.forms.expense.balance.toLocaleString()
              }}
            </div>

            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-8">
                <div class="text-caption q-mb-xs">
                  Particulars: <strong class="text-red">*</strong>
                </div>
                <q-select
                  outlined
                  dense
                  v-model="store.forms.expense.particulars"
                  :options="filteredParticulars"
                  label="Particulars"
                  use-input
                  fill-input
                  hide-selected
                  new-value-mode="add-unique"
                  option-label="label"
                  option-value="label"
                  map-options
                  emit-value
                  @filter="filterFn"
                  @input-value="onParticularInputValue"
                  @new-value="onParticularNewValue"
                  @blur="handleParticularBlur"
                  @keydown.enter.prevent
                />
              </div>
              <div class="col-4">
                <div class="text-caption q-mb-xs">Amount: <strong class="text-red">*</strong></div>
                <q-input
                  outlined
                  dense
                  :model-value="formatInputValue(store.forms.expense.amount)"
                  @update:model-value="
                    (val) => (store.forms.expense.amount = handleAmountInput(val))
                  "
                  @blur="(e) => (store.forms.expense.amount = formatToTwoDecimals(e.target.value))"
                  label="Amount"
                  class="q-mb-md"
                  prefix="₱"
                  inputmode="decimal"
                  pattern="\\d*\\.?\\d{0,2}"
                  @keypress="blockNonNumeric"
                  @paste.prevent="handlePasteNumeric"
                  placeholder="0.00"
                  :error="isAmountExceedingBalance"
                  :error-message="amountErrorMessage"
                />
              </div>
            </div>
          </q-card-section>

          <!-- Save Button -->
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="store.closeDialog('expenseDetail')" />
            <q-btn
              label="Save"
              @click="handleSaveExpense"
              color="primary"
              :disable="isAmountExceedingBalance || !store.forms.expense.particulars?.trim()"
            />
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

      <!-- Main Data Table -->
      <q-card flat bordered>
        <q-table
          :rows="filteredDisbursements"
          :columns="mainTableColumns"
          row-key="id"
          :pagination="store.pagination"
          :loading="store.loadingDisbursements"
          flat
        >
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th v-for="col in props.cols" :key="col.name" :props="props">
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <!-- <q-chip :color="getStatusColor(props.row.status)" :text-color="getStatusTextColor(props.row.status)" dense
                :label="props.row.status" /> -->
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
              <div v-if="props.row.bank_cheques && props.row.bank_cheques.length">
                <div v-for="(c, i) in props.row.bank_cheques" :key="i" class="q-mb-xs">
                  <div class="text-weight-medium text-grey-8" style="font-size: 13px">
                    {{ c.bank_name || c.bank || '-' }}
                  </div>
                  <q-chip
                    v-if="c.cheque_number"
                    dense
                    text-color="black-8"
                    size="md"
                    class="q-ma-none"
                  >
                    {{ c.cheque_number }}
                  </q-chip>
                </div>
              </div>
              <span v-else class="text-grey-5 text-caption">-</span>
            </q-td>
          </template>
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="action-grid-regular">
                <q-btn
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
                  icon="receipt_long"
                  color="primary"
                  v-if="props.row.status === 'Unliquidated' || props.row.status === 'Partial'"
                  @click="handleLiquidateDisbursement(props.row)"
                  :loading="liquidateLoading[props.row.id]"
                  :disable="liquidateLoading[props.row.id]"
                  v-permission="'add'"
                >
                  <q-tooltip>Liquidate</q-tooltip>
                </q-btn>
              </div>
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

      <ContLiquidateDialog v-model="store.dialogs.orDetails" @save="handleLiquidateSave" />
      <ContViewOr v-model="store.dialogs.viewOrDetails" />
      <ContEditDisburse v-model="store.dialogs.editDisbursement" @save="handleEditSave" />
      <ChequePrintDialog v-model="chequePrintDialog" :disbursement="selectedChequeDisbursement" />
      <VoucherPrintDialog
        v-model="voucherPrintDialog"
        :disbursement="selectedVoucherDisbursement"
      />
    </div>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { ref, onMounted, computed, watch } from 'vue'
import { useContDisbursementStore } from 'src/stores/contDisburseStore'
import { useBankStore } from 'src/stores/bankStore'
import { useAuthStore } from 'src/stores/auth'
import { usePayeeStore } from 'src/stores/payeeStore'
import { api } from 'src/boot/axios'
import { useRoute } from 'vue-router'
import ContLiquidateDialog from 'src/components/contDisburse/ContOrDetails.vue'
import ContViewOr from 'src/components/contDisburse/ContViewOr.vue'
import ContEditDisburse from 'src/components/contDisburse/ContEditDisburse.vue'
import ChequePrintDialog from 'components/disbursement/ChequePrintDialog.vue'
import VoucherPrintDialog from 'components/disbursement/VoucherPrintDialog.vue'
import { usePageLogging } from 'src/composables/usePageLogging'

const $q = useQuasar()
const route = useRoute()
const loading = ref(false)
const store = useContDisbursementStore()
const bankStore = useBankStore()
const authStore = useAuthStore()
const payeeStore = usePayeeStore()
const dateRange = ref(null)
const filteredPayeeOptions = ref([])
const typedPayeeOptions = ref([])
const payee2Edited = ref(false)
const viewLoading = ref({})
const liquidateLoading = ref({})
const chequePrintDialog = ref(false)
const selectedChequeDisbursement = ref(null)
const voucherPrintDialog = ref(false)
const selectedVoucherDisbursement = ref(null)
const filteredParticulars = ref((store.particulars || []).slice(0, 5))
const expenseParticularInput = ref(store.forms.expense.particulars || '')
const deductionDialogOpen = ref(false)
const bankChequeDialogOpen = ref(false)
const editingDeductionId = ref(null)
const bankChequeForm = ref({
  bank_id: null,
  bankName: '',
  cheque_number: '',
  cheque_date: '',
  amount: '',
  amountDisplay: '',
})

const selectedRouteYear = () => {
  const year = route.query.year ? parseInt(route.query.year, 10) : null
  return year || new Date().getFullYear()
}

const editingDeductionIndex = ref(-1)

const emptyDeductionForm = () => ({
  deductionType: null,
  taxType: null,
  code: null,
  deduction_code_id: null,
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
const deductionForm = ref(emptyDeductionForm())
// const emptyDeductionForm = () => ({
//   deductionType: null,
//   taxType: null,
//   code: '',
//   divisor: null,
//   vatPercent: null,
//   ewtPercent: null,
//   description: '',
//   grossVatInc: 0,
//   grossVatExc: 0,
//   amount: 0,
// })

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

// function findConfig(taxType, deductionType, code) {
//   return taxTypeConfigs[taxType]?.[deductionType]?.[code] ?? null
// }

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

// const codeOptions = computed(() => {
//   const type = deductionForm.value.deductionType

//   return Object.entries(codeConfigMap)
//     .filter(([, cfg]) => !type || cfg.deductionTypes.includes(type))
//     .flatMap(([value, cfg]) => {
//       if (Array.isArray(cfg.label)) {
//         return cfg.label.map(label => ({
//           label,
//           value: label
//         }))
//       }

//       return [{
//         label: cfg.label,
//         value
//       }]
//     })
// })

// function findCodeConfig(code) {
//   if (!code) return null
//   if (codeConfigMap[code]) return codeConfigMap[code]

//   return Object.values(codeConfigMap).find((cfg) =>
//     Array.isArray(cfg.label) ? cfg.label.includes(code) : false,
//   )
// }

// function onCodeChange(code) {
//   const cfg = findCodeConfig(code)
//   if (!cfg) return
//   deductionForm.value.divisor    = cfg.divisor
//   deductionForm.value.vatPercent = cfg.vatPercent
//   deductionForm.value.ewtPercent = cfg.ewtPercent
//   deductionForm.value.description = typeof cfg.label === 'string' ? cfg.label : code
//   recalcDeduction()
// }

// function normalizeDeductionType(value) {
//   const raw = String(value || '').trim()
//   const option = deductionTypeOptions.find(opt => opt.value === raw || opt.label === raw)
//   return option?.value || raw
// }

// function recalcDeduction() {
//   if (deductionForm.value.isManual) return   // others: do not overwrite user input

//   const grossAmount = Number(store.totalExpensesAmount) || 0
//   const divisor     = parseFloat(deductionForm.value.divisor)  || 1
//   const vatPct      = parseFloat(deductionForm.value.vatPercent)  || 0
//   const ewtPct      = parseFloat(deductionForm.value.ewtPercent)  || 0
//   const type        = deductionForm.value.deductionType

//   const grossVatInc = grossAmount                  // always the full amount
//   const grossVatExc = grossVatInc / divisor        // VAT-exclusive portion

//   deductionForm.value.grossVatInc = grossVatInc
//   deductionForm.value.grossVatExc = grossVatExc

//   let deductionAmt = 0
//   if (type === 'businessTax') {
//     deductionAmt = grossVatExc * (vatPct / 100)
//   } else if (type === 'EWT') {
//     deductionAmt = grossVatExc * (ewtPct / 100)
//   }
//   // others → amount stays as-is (manual)

//   deductionForm.value.amount = deductionAmt
// }

// const mainTableColumns = computed(() => [
//   { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true, classes: 'hidden', headerClasses: 'hidden' },
//   { name: 'dvNumber', label: 'DV Number', field: 'dvNumber', align: 'left', sortable: true },
//   { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
//   { name: 'payee', label: 'Payee', field: 'payee', align: 'left', sortable: true },
//   { name: 'particular', label: 'Particular', field: 'particular', align: 'left', sortable: true },
//   { name: 'bank_cheque', label: 'Bank / Cheque No.', field: 'bank', align: 'left', sortable: true },
//   {
//     name: 'netAmount', label: 'Net Amount', field: 'netAmount', align: 'left', sortable: true,
//     format: (val) => {
//       const num = Number(val) || 0
//       return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
//     },
//   },
//   { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
//   { name: 'aging', label: 'Aging', field: 'aging', align: 'center', sortable: true },
//   { name: 'remarks', label: 'Remarks', field: '', align: 'center' },
//   { name: 'action', label: 'Action', field: '', align: 'center', style: 'width: 90px; min-width: 90px' },
//   { name: 'print', label: 'Print Cheque', field: '', align: 'center' },
// ])

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

  // const hashTotal = chequeRows.reduce((sum, cheque) => {
  //   const accountNumber = padLeft(getBankAccountNumber(row, cheque), 10)

  //   // Mid(accountnumber, 5, 6) in MS Access
  //   // JavaScript is 0-based, so substring(4, 10)
  //   const accountMid = Number(accountNumber.substring(4, 10))

  //   // Check amount without decimal point
  //   const checkAmount = Math.round(Number(getAcicAmountValue(row, cheque)) * 100)

  //   const checkStatus = Number(
  //     cheque.checkStatus ?? cheque.check_status ?? 0
  //   )

  //   const checkNew = Number(
  //     cheque.checkNew ?? cheque.check_new ?? 1
  //   )

  //   const checkUpdate = Number(
  //     cheque.checkUpdate ?? cheque.check_update ?? 0
  //   )

  //   const transactionCode = Number(
  //     cheque.transactionCode ?? cheque.transaction_code ?? 1
  //   )

  //   return sum + accountMid * checkAmount + checkStatus + checkNew + checkUpdate + transactionCode
  // }, 0)

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

const mainTableColumns = computed(() => {
  const base = (store.disbursementColumns || []).filter((c) => {
    if (c.name === 'remarks') return false

    return true
  })

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

// Current fiscal year
const currentFiscalYear = computed(() => new Date().getFullYear())

// Amount validation computed properties
const isAmountExceedingBalance = computed(() => {
  const amount = Number(store.forms.expense.amount) || 0
  const balance = store.forms.expense.balance || 0
  return amount > balance && amount > 0
})

const amountErrorMessage = computed(() => {
  if (isAmountExceedingBalance.value) {
    const amount = Number(store.forms.expense.amount) || 0
    const balance = store.forms.expense.balance || 0
    return `Amount exceeds available balance. Available: ₱${balance.toLocaleString()}, Requested: ₱${amount.toLocaleString()}`
  }
  return ''
})

// Status counts for summary cards
// const statusCounts = computed(() => {
//   const counts = {
//     pending: 0,
//     partial: 0,
//     liquidated: 0,
//     voided: 0,
//     stale: 0,
//   }

//   store.disbursements.forEach((disbursement) => {
//     switch (disbursement.status) {
//       case 'Pending':
//         counts.pending++
//         break
//       case 'Partial':
//         counts.partial++
//         break
//       case 'Liquidated':
//         counts.liquidated++
//         break
//       case 'Void Requested':
//       case 'Voided':
//         counts.voided++
//         break
//       case 'Stale':
//         counts.stale++
//         break
//     }
//   })

//   return counts
// })

// Removed particulars filtering logic since particulars is now a simple text input

// Computed properties
// const currentBankLabel = computed(() => {
//   if (store.forms.disbursement.bank_id) {
//     const selectedBank = bankStore.banks.find(
//       (bank) => bank.id === store.forms.disbursement.bank_id,
//     )
//     return selectedBank ? selectedBank.name : 'Select Bank'
//   }
//   return 'Select Bank'
// })

// Filtered disbursements based on search and date range
const filteredDisbursements = computed(() => {
  let filtered = store.disbursements

  // Filter by search query
  if (store.searchQuery && store.searchQuery.trim()) {
    const query = store.searchQuery.toLowerCase().trim()
    filtered = filtered.filter(
      (disbursement) =>
        disbursement.payee?.toLowerCase().includes(query) ||
        disbursement.dvNumber?.toLowerCase().includes(query) ||
        disbursement.chequeNumber?.toLowerCase().includes(query),
    )
  }

  // Filter by date range
  if (store.dateFrom && store.dateTo) {
    filtered = filtered.filter((disbursement) => {
      if (!disbursement.date) return false

      // Convert disbursement date to DD/MM/YYYY format for comparison
      const disbursementDate = disbursement.date.includes('/')
        ? disbursement.date
        : new Date(disbursement.date).toLocaleDateString('en-GB')

      return disbursementDate >= store.dateFrom && disbursementDate <= store.dateTo
    })
  }

  return filtered
})

const closeBankChequeDialog = () => {
  bankChequeDialogOpen.value = false
  bankChequeForm.value = {
    bank_id: null,
    bankName: '',
    cheque_number: '',
    cheque_date: '',
    amount: '',
    amountDisplay: '',
  }
}

const todayFormatted = () => {
  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const yyyy = today.getFullYear()
  return `${mm}/${dd}/${yyyy}`
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

const openBankChequeDialog = async () => {
  await fetchBarangaySetupBankAccounts()
  bankChequeForm.value = {
    bank_id: null,
    bankName: '',
    cheque_number: '',
    cheque_date: todayFormatted(),
    amount: '',
    amountDisplay: '',
  }
  bankChequeDialogOpen.value = true
}

const handleBankChequeBankSelect = async (bankId) => {
  bankChequeForm.value.cheque_number = ''
  const bank = configuredBankOptions.value.find((item) => String(item.id) === String(bankId))
  bankChequeForm.value.bankName = bank?.name || ''
  if (!bankId) return

  bankChequeForm.value.bank_status = getBankStatusForBank(bankId)

  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    const taken = (store.bankCheques || []).map((row) => row.cheque_number).filter(Boolean)
    const next = (res.data?.data?.cheque || []).find(
      (cheque) => !taken.includes(cheque.cheque_number),
    )
    bankChequeForm.value.cheque_number = next?.cheque_number || ''
  } catch (error) {
    console.error('Bank cheque selection error:', error)
    bankChequeForm.value.bank_id = null
    bankChequeForm.value.bankName = ''
  }
}

const editingBankChequeId = ref(null)
const editBankCheque = (ded) => {
  editingBankChequeId.value = ded.id
  bankChequeForm.value = {
    bank_id: ded.bank_id,
    booklet_id: ded.booklet_id || null,
    bankName: ded.bankName || ded.bank || '',
    cheque_number: ded.cheque_number || '',
    cheque_date: ded.cheque_date || todayFormatted(),
    bank_status: ded.bank_status || ded.bankStatus || '',
    amount: String(ded.amount || ''),
    amountDisplay: (Number(ded.amount) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }),
  }
  bankChequeDialogOpen.value = true
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

const confirmAddBankCheque = () => {
  const form = bankChequeForm.value
  const amount = Number(form.amount) || 0

  if (!form.bank_id || !form.cheque_number || amount <= 0) {
    return $q.notify({
      type: 'negative',
      message: 'Select a bank, cheque number, and valid amount',
      position: 'top',
    })
  }

  const nextTotal = Math.round((bankChequeTotal.value + amount) * 100) / 100
  const netTotal = Math.round(netDisbursementAmount.value * 100) / 100

  if (nextTotal > netTotal) {
    return $q.notify({
      type: 'negative',
      message: `Cheque amount exceeded the net amount by ₱${(nextTotal - netTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      position: 'top',
    })
  }

  store.bankCheques = [
    ...(store.bankCheques || []),
    {
      id: Date.now(),
      bank_id: form.bank_id,
      bankName: form.bankName,
      cheque_number: form.cheque_number,
      cheque_date: form.cheque_date,
      bank_status: getBankStatusForBank(form.bank_id),
      amount,
    },
  ]
  closeBankChequeDialog()
}

const removeBankCheque = (id) => {
  store.bankCheques = (store.bankCheques || []).filter((row) => row.id !== id)
}

const formatPeso = (val) => {
  const n = parseFloat(val) || 0
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

function normalizeDeductionType(value) {
  const raw = String(value || '').trim()
  const option = deductionTypeOptions.value.find((opt) => opt.value === raw || opt.label === raw)
  return option?.value || raw
}

function findConfig(taxType, deductionType, code) {
  return taxTypeConfigs[taxType]?.[deductionType]?.[code] ?? null
}

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

// const recalcDeduction = () => {
//   const grossAmount = Number(store.totalExpensesAmount) || 0
//   const divisor = parseFloat(deductionForm.value.divisor) || 1
//   const vatPct = parseFloat(deductionForm.value.vatPercent) || 0
//   const ewtPct = parseFloat(deductionForm.value.ewtPercent) || 0
//   const type = deductionForm.value.deductionType

//   const grossVatInc = grossAmount / divisor
//   deductionForm.value.grossVatInc = grossVatInc
//   const vatAmount = vatPct > 0 ? grossVatInc * (vatPct / 100) : 0
//   const grossVatExc = grossVatInc - vatAmount
//   deductionForm.value.grossVatExc = grossVatExc

//   let amount = 0
//   if (type === 'businessTax') amount = vatAmount
//   else if (type === 'EWT') amount = grossVatExc * (ewtPct / 100)
//   else if (type === 'VAT_EWT') amount = vatAmount + grossVatExc * (ewtPct / 100)
//   deductionForm.value.amount = amount
// }

const fundOptions = [
  { label: 'General Fund', value: 'generalFund' },
  { label: 'Trust Fund', value: 'trustFund' },
  { label: 'Continuing', value: 'continuing' },
]

const taxpayerTypeOptions = [
  { label: 'Individual', value: 'individual' },
  { label: 'Non-Individual', value: 'nonIndividual' },
]

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

function closeDeductionDialog() {
  deductionDialogOpen.value = false
  editingDeductionId.value = null
  editingDeductionIndex.value = -1
  deductionForm.value = emptyDeductionForm()
}

const TAX_TYPE_LABELS = {
  percentage: 'Percentage',
  professionalServices: 'Professional Services',
  vatExempt: 'VAT Exempt',
}

const DEDUCTION_TYPE_LABELS = {
  businessTax: 'Business Tax',
}

const humanizeCamelCase = (value) => {
  if (!value) return ''
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
}

const formatTaxTypeLabel = (value) => TAX_TYPE_LABELS[value] || humanizeCamelCase(value)
const formatDeductionTypeLabel = (value) => DEDUCTION_TYPE_LABELS[value] || humanizeCamelCase(value)

// const confirmAddDeduction = () => {
//   if (!deductionForm.value.deductionType) {
//     return $q.notify({ type: 'negative', message: 'Please select a Deduction Type', position: 'top' })
//   }
//   if ((deductionForm.value.amount || 0) <= 0) {
//     return $q.notify({ type: 'negative', message: 'Deduction amount must be greater than 0', position: 'top' })
//   }

//   // store.addDeductionRow({
//   //   id: Date.now(),
//   //   description: deductionForm.value.description || deductionForm.value.deductionType,
//   //   gross_vat_inc: deductionForm.value.grossVatInc,
//   //   percent: deductionForm.value.vatPercent || deductionForm.value.ewtPercent || 0,
//   //   amount: deductionForm.value.amount,
//   // })

//     const cfg = findCodeConfig(deductionForm.value.code)

//   store.addDeductionRow({
//     id: Date.now(),
//     deductionTypeName: deductionForm.value.deductionType,   // for table col
//     taxTypeName: cfg?.taxType
//       ? taxTypeOptions.find(t => t.value === cfg.taxType)?.label
//       : (deductionForm.value.taxType
//           ? taxTypeOptions.find(t => t.value === deductionForm.value.taxType)?.label
//           : '—'),
//     description:   deductionForm.value.description || deductionForm.value.code || deductionForm.value.deductionType,
//     gross_vat_inc: deductionForm.value.grossVatInc,
//     percent:       deductionForm.value.vatPercent || deductionForm.value.ewtPercent || 0,
//     amount:        deductionForm.value.amount,
//   })

//   closeDeductionDialog()
// }

// function confirmAddDeduction() {

//   // const cfg = deductionForm.value.isManual
//   //   ? null
//   //   : findConfig(
//   //       deductionForm.value.taxType,
//   //       deductionForm.value.deductionType,
//   //       deductionForm.value.code
//   //     )

//   const displayPercent = deductionForm.value.deductionType === 'businessTax'
//     ? (deductionForm.value.vatPercent ?? 0)
//     : (deductionForm.value.ewtPercent ?? 0)

// const row = {
//     id: Date.now(),
//     // deductionTypeName: deductionForm.value.deductionType,
//     deductionTypeName: deductionTypeOptions.find(o => o.value === deductionForm.value.deductionType)?.label ?? deductionForm.value.deductionType,
//     taxTypeName     : deductionForm.value.taxType
//       ? taxTypeOptions.find(t => t.value === deductionForm.value.taxType)?.label ?? '—'
//       : '—',
//     code            : deductionForm.value.code,
//     description     : deductionForm.value.description
//       || deductionForm.value.code
//       || deductionForm.value.deductionType,
//     gross_vat_inc   : deductionForm.value.grossVatInc,
//     gross_vat_exc   : deductionForm.value.grossVatExc,
//     percent         : deductionForm.value.isManual ? null : displayPercent,
//     amount          : deductionForm.value.amount,
//     isManual        : deductionForm.value.isManual,
//   }

//   if (editingDeductionIndex.value !== -1) {
//     store.forms.expense.deductions = (store.forms.expense.deductions || []).map(
//       (d, i) => i === editingDeductionIndex.value ? row : d
//     )
//     store._recalcDeductionTotals()
//   } else {
//     store.addDeductionRow(row)
//   }

//   closeDeductionDialog()
// }
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

function handleParticularBlur() {
  const input = expenseParticularInput.value?.trim()
  if (!input) {
    return
  }

  if (store.forms.expense.particulars === input) {
    return
  }

  if (!filteredParticulars.value.some((opt) => opt.label === input)) {
    filteredParticulars.value = [{ label: input }, ...filteredParticulars.value].slice(0, 5)
  }

  store.forms.expense.particulars = input
}

function rememberParticularOption(value) {
  const input = String(value || '').trim()
  if (!input) return

  const exists = filteredParticulars.value.some(
    (option) => String(option.label || option).toLowerCase() === input.toLowerCase(),
  )

  if (!exists) {
    filteredParticulars.value = [{ label: input }, ...filteredParticulars.value].slice(0, 5)
  }
}

function onParticularInputValue(value) {
  expenseParticularInput.value = value || ''
  store.forms.expense.particulars = value || ''
}

function onParticularNewValue(value, done) {
  const input = String(value || '').trim()
  if (!input) {
    done()
    return
  }

  rememberParticularOption(input)
  expenseParticularInput.value = input
  store.forms.expense.particulars = input
  done(input, 'add-unique')
}

function filterFn(val, update) {
  const particulars = store.particulars || [] // ← guard here

  if (val === '') {
    update(() => {
      filteredParticulars.value = particulars.slice(0, 5)
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    filteredParticulars.value = particulars
      .filter((opt) =>
        String(opt.label || opt)
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 5)
  })
}

const validateAndSave = () => {
  if (store.dialogs.disbursement) {
    // const form = store.forms.disbursement
    // const hasRequiredFields = form.date && form.bank_id && form.dvNumber && form.payee
    const hasExpenses = store.expenses && store.expenses.length > 0

    // if (!hasRequiredFields) {
    //   $q.notify({
    //     type: 'negative',
    //     message: 'Please fill in all required fields before saving',
    //     icon: 'warning',
    //     position: 'top',
    //   })
    //   return
    // }

    if (!hasExpenses) {
      $q.notify({
        type: 'negative',
        message: 'Please add at least one expense before saving',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    store.saveDisbursement().then((result) => {
      if (!result.success) {
        $q.notify({
          type: 'negative',
          message: result.error || 'Failed to save disbursement',
          icon: 'error',
          position: 'top',
          timeout: 5000,
        })
      }
    })
  }
}

const handleEnterKey = (event) => {
  if (event) {
    event.preventDefault()
  }
  validateAndSave()
}
const getStatusColor = (status) => {
  switch (status) {
    case 'Unliquidated':
      return 'orange'
    case 'Partial':
      return 'amber'
    case 'Liquidated':
      return 'green'
    case 'Void Requested':
      return 'deep-orange'
    case 'Voided':
      return 'red'
    case 'Stale':
      return 'purple'
    default:
      return 'grey'
  }
}
// const getStatusTextColor = (status) => {
//   switch (status) {
//     case 'Unliquidated':
//     case 'Partial':
//     case 'Liquidated':
//     case 'Void Requested':
//     case 'Voided':
//     case 'Stale':
//       return 'white'
//     default:
//       return 'black'
//   }
// }

const handleSaveClick = async () => {
  await validateAndSave()
  // Refresh the disbursement list after saving
  await store.fetchDisbursements(selectedRouteYear())
}

// const handleBankSelection = async (bankId) => {
//   if (bankId) {
//     try {
//       await store.selectBank(bankId)
//     } catch (error) {
//       $q.notify({
//         type: 'negative',
//         message: `Failed to load booklets for selected bank: ${error.message}`,
//         icon: 'error',
//         position: 'top',
//       })
//     }
//   }
// }

const handleAddExpense = async () => {
  store.loading = true
  try {
    await store.openDialog('expense')
  } catch (error) {
    console.error('Error opening expense dialog:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open expense dialog: ' + (error.message || 'Unknown error'),
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  } finally {
    store.loading = false
    store.expenseTypeLoading = false
  }
}

const handleSaveExpense = async () => {
  try {
    await store.saveExpense()
    $q.notify({
      type: 'positive',
      message: 'Expense added successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
  } catch (error) {
    console.error('Error saving expense:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to save expense',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

const handleDeleteExpense = async (row) => {
  try {
    await store.deleteItem(row)
    $q.notify({
      type: 'positive',
      message: 'Expense deleted successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to delete expense',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

// Track if preload has been attempted
const preloadAttempted = ref(false)

const preloadExpenseAccounts = async () => {
  // Only attempt preload once and only if not already loading
  if (!preloadAttempted.value && !store.loading && !store.expenseTypeLoading) {
    preloadAttempted.value = true
    store.expenseTypeLoading = true
    try {
      await store.refreshExpenseAccountsWithBalances()
    } catch (error) {
      console.warn('Failed to preload expense accounts:', error)
    } finally {
      store.expenseTypeLoading = false
    }
  }
}

const loadPendingUsers = async () => {
  loading.value = true
  try {
    // Refresh both disbursements and banks
    const refreshPromises = [store.fetchDisbursements(selectedRouteYear()), bankStore.fetchBanks()]
    await Promise.all(refreshPromises)

    $q.notify({
      type: 'positive',
      message: 'Continuing disbursements refreshed!',
      icon: 'refresh',
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to refresh data',
      icon: 'error',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const dateRangeDisplay = computed(() => {
  if (!dateRange.value || !dateRange.value.from || !dateRange.value.to) {
    return ''
  }
  const fromDate = new Date(dateRange.value.from).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const toDate = new Date(dateRange.value.to).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${fromDate} - ${toDate}`
})

const onDateRangeChange = (newRange) => {
  if (newRange && newRange.from && newRange.to) {
    const fromDate = new Date(newRange.from)
    const toDate = new Date(newRange.to)
    store.dateFrom = fromDate.toLocaleDateString('en-GB')
    store.dateTo = toDate.toLocaleDateString('en-GB')
  } else {
    store.dateFrom = ''
    store.dateTo = ''
  }
}

const bankChequeRows = computed(() => {
  return (store.bankCheques || []).map((row, idx) => ({
    id: row.id,
    key: `${row.id || idx}-${row.cheque_number || idx}`,
    bank: row.bankName || row.bank || '',
    chequeNumber: row.cheque_number || '',
    chequeDate: row.cheque_date || '',
    bank_status: row.bank_status || row.bankStatus || '',
    bankStatus: row.bank_status || row.bankStatus || '',
    amount: Number(row.amount) || 0,
  }))
})

const onDateRangeClear = () => {
  dateRange.value = null
  store.dateFrom = ''
  store.dateTo = ''
}

const clearAllFilters = () => {
  store.searchQuery = ''
  store.dateFrom = ''
  store.dateTo = ''
  dateRange.value = null
}

// Handle edit disbursement with loading state
const handleEditDisbursement = async (row) => {
  try {
    await store.openEditDisbursement(row)
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

// Handle edit save result
const handleEditSave = async (result) => {
  if (result.success) {
    $q.notify({
      type: 'positive',
      message: 'Disbursement updated successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    })
  } else {
    $q.notify({
      type: 'negative',
      message: result.error || 'Failed to update disbursement',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

// Handle liquidate save result
const handleLiquidateSave = async (result) => {
  if (result.success) {
    // Success message is already handled by ContOrDetails.vue component
    // Just refresh the data
    await store.fetchDisbursements(selectedRouteYear())
  } else {
    $q.notify({
      type: 'negative',
      message: result.error || 'Failed to liquidate disbursement',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  }
}

// Handle view disbursement with loading state
const handleViewDisbursement = async (row) => {
  viewLoading.value[row.id] = true
  try {
    await store.openViewOrDetails(row)
  } catch (error) {
    console.error('Error opening view disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open view disbursement',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
  } finally {
    viewLoading.value[row.id] = false
  }
}

// Handle liquidate disbursement with loading state
const handleLiquidateDisbursement = async (row) => {
  liquidateLoading.value[row.id] = true
  try {
    await store.openOrDetailsDialog(row)
  } catch (error) {
    console.error('Error opening liquidate disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open liquidate disbursement',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
  } finally {
    liquidateLoading.value[row.id] = false
  }
}

const getOpenRow = (row) => ({
  ...row,
  id: row.disbursement_id || row.id,
})

const buildPrintableDisbursementData = (row) => {
  const entries = (row.bank_cheques || row.entries || []).filter(
    (entry) => Number(entry.amount) > 0,
  )
  const grossAmount = Number(row.dvAmount || row.dv_amount || row.amount || 0)
  const netAmount =
    row.netAmount !== null && row.netAmount !== undefined && row.netAmount !== ''
      ? Number(row.netAmount) || 0
      : Number(row.net_amount) || grossAmount

  return {
    ...row,
    id: row.disbursement_id || row.id,
    date: row.date,
    dvNumber: row.dvNumber || row.dv_number,
    chequeNumber: row.chequeNumber || row.cheque_number,
    bank: row.bank || row.bank_name,
    bank_name: row.bank || row.bank_name,
    payee: row.payee || '',
    payee2: row.payee2 || row.payee || '',
    dvAmount: grossAmount,
    netAmount,
    deductions: row.deductions || row.expense?.deductions || [],
    expenses: row.expenses || [],
    bank_cheques: entries.length
      ? entries
      : [
          {
            bank_id: row.bank_id || null,
            bank_name: row.bank || row.bank_name,
            cheque_number: row.chequeNumber || row.cheque_number,
            cheque_date: row.cheque_date || row.chequeDate || row.date,
            amount: netAmount,
          },
        ],
  }
}

const loadPrintableDisbursement = async (row) => {
  const openRow = getOpenRow(row)
  const data = await store.fetchDisbursementForView(openRow.id)
  return buildPrintableDisbursementData(data || openRow)
}

const handlePrintCheque = async (row) => {
  viewLoading.value[row.id] = true
  try {
    selectedChequeDisbursement.value = await loadPrintableDisbursement(row)
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

const handlePrintVoucher = async (row) => {
  viewLoading.value[row.id] = true
  try {
    selectedVoucherDisbursement.value = await loadPrintableDisbursement(row)
    voucherPrintDialog.value = true
  } catch (error) {
    console.error('Error opening voucher print dialog:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load voucher details',
      position: 'top',
    })
  } finally {
    viewLoading.value[row.id] = false
  }
}

// Formatting helpers for amount input
const formatInputValue = (value) => {
  if (value === '' || value === null || value === undefined) return ''
  const isNumber = typeof value === 'number'
  const cleanValue = String(value)
    .replace(/[₱,\s]/g, '')
    .replace(/,/g, '')
  const num = parseFloat(cleanValue)
  if (isNaN(num)) return ''
  return isNumber
    ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : num.toLocaleString('en-US')
}

const handleAmountInput = (value) => {
  let cleanValue = String(value).replace(/[₱,\s]/g, '')
  cleanValue = cleanValue.replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }
  return cleanValue
}

const formatToTwoDecimals = (value) => {
  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  if (cleanValue === '') return ''
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    const collapsed = parts[0] + '.' + parts.slice(1).join('')
    return formatToTwoDecimals(collapsed)
  }
  if (parts.length === 2 && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2)
  }
  const num = parseFloat(parts.join('.'))
  if (isNaN(num)) return ''
  return Math.round(num * 100) / 100
}

const blockNonNumeric = (event) => {
  const key = event.key
  const allowedKeys = [
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

  if (allowedKeys.includes(key)) {
    return
  }

  // Allow decimal point only if there isn't one already
  if (key === '.' && !event.target.value.includes('.')) {
    return
  }

  // Block all other characters except digits
  if (!/^\d$/.test(key)) {
    event.preventDefault()
  }
}

const handlePasteNumeric = (event) => {
  event.preventDefault()
  const paste = (event.clipboardData || window.clipboardData).getData('text')
  const cleanValue = paste.replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  let finalValue = parts[0]
  if (parts.length > 1) {
    finalValue += '.' + parts.slice(1).join('').substring(0, 2)
  }
  store.forms.expense.amount = finalValue
}

// Function to load all data with optimized loading strategy
const loadAllData = async () => {
  loading.value = true

  try {
    // Load critical data first (disbursements and banks) in parallel
    const criticalPromises = [
      store.fetchDisbursements(selectedRouteYear()),
      bankStore.fetchBanks(),
      fetchBarangaySetupBankAccounts(),
      store.fetchParticulars(),
      payeeStore.fetchPayees().catch((error) => {
        console.warn('Failed to load registered payees:', error)
      }),
    ]

    await Promise.all(criticalPromises)
    filteredParticulars.value = (store.particulars || []).slice(0, 5)

    // Load expense accounts in background (non-blocking)
    store.refreshExpenseAccountsWithBalances().catch((error) => {
      console.warn('Failed to load expense accounts in background:', error)
    })

    $q.notify({
      type: 'positive',
      message: 'Continuing disbursement data loaded successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 2000,
    })
  } catch (error) {
    console.error('Error during data loading:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load continuing disbursement data: ' + (error.message || 'Unknown error'),
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  } finally {
    loading.value = false
  }
}

// Keep the input-value in sync with the selected/viewed particulars value
watch(
  () => store.forms.expense.particulars,
  (val) => {
    expenseParticularInput.value = val || ''
  },
)

// Watch for changes in the expense detail dialog
watch(
  () => store.dialogs.expenseDetail,
  (isOpen) => {
    if (isOpen) {
      // Auto-fill today's date
      const today = new Date()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      const yyyy = today.getFullYear()
      store.forms.expense.cheque_date = `${mm}/${dd}/${yyyy}`
    } else {
      store.resetForm('expense')
    }
  },
)

onMounted(async () => {
  await loadAllData()

  // Log page visit
  const { logPageVisit } = usePageLogging()
  await logPageVisit('Continuing Disbursement')
})

watch(
  () => route.query.year,
  async () => {
    await store.fetchDisbursements(selectedRouteYear())
  },
)
</script>

<style scoped>
.contdis-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

/* Status Indicators Container */
.status-indicators-container {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

/* Summary Cards Styling */
.summary-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  background: white;
  border: 2px solid transparent;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.filters-section {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-grid-regular {
  display: grid;
  grid-template-columns: repeat(2, 32px);
  gap: 4px;
  width: 72px;
}

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }

  .status-indicators-container {
    padding: 12px;
  }

  .row.items-center.q-gutter-sm {
    flex-direction: column;
    align-items: stretch;
  }

  .row.items-center.q-gutter-sm > * {
    margin-bottom: 8px;
    width: 100%;
  }

  .row.q-col-gutter-md {
    flex-direction: column;
  }

  .col-md-2,
  .col-sm-4,
  .col-xs-6 {
    margin-bottom: 8px;
  }

  .col-md-4,
  .col-sm-6,
  .col-sm-12 {
    width: 100%;
    margin-bottom: 8px;
  }

  .summary-card .q-card-section {
    padding: 12px;
  }

  .text-h4 {
    font-size: 1.5rem;
  }
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
  background: #fafafa;
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
</style>
