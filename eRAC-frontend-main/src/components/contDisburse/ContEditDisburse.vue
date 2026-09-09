<template>
  <!--Edit Continuing Disbursement-->
  <q-dialog v-model="store.dialogs.editDisbursement" persistent>
    <q-card style="min-width: 1100px">
      <q-card-section>
        <div class="text-h6">
          Edit Expenses for Continuing Disbursement #{{ store.forms.disbursement.dvNumber }}
        </div>
        <div class="text-caption text-grey-6 q-mt-sm">
          Note: Total amount is locked to ₱{{ store.lockedTotalAmount?.toLocaleString() || '0' }}.
          You can only redistribute amounts between expenses.
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Date Field -->
          <div class="col-md-4 col-sm-6 q-mb-md">
            <div class="text-caption q-mb-xs" style="font-weight: bold; font-size: 13px">Date</div>
            <div class="text-body1 text-weight-medium">
              {{ store.forms.disbursement.date }}
            </div>
          </div>

          <!-- DV Number Field -->
          <div class="col-md-4 col-sm-6 q-mb-md">
            <div class="text-caption q-mb-xs" style="font-weight: bold; font-size: 13px">
              DV Number
            </div>
            <div class="text-body1 text-weight-medium">
              {{ store.forms.disbursement.dvNumber }}
            </div>
          </div>
          <div class="col-4">
            <q-item-label class="text-caption q-mb-xs" style="font-weight: bold; font-size: 13px"
              >Fund: <strong class="text-red">*</strong></q-item-label
            >
            <q-select
              filled
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
          <!-- Payee Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="text-caption q-mb-xs" style="font-weight: bold; font-size: 13px"
              >Payee:</q-item-label
            >
            <q-input
              filled
              outlined
              dense
              v-model="store.forms.disbursement.payee"
              :disable="!isChequeCancelled"
            />
          </div>
          <div class="col-md-4 col-sm-12">
            <q-item-label class="text-caption q-mb-xs" style="font-weight: bold; font-size: 13px"
              >Payee 2:</q-item-label
            >
            <q-input
              filled
              outlined
              dense
              v-model="store.forms.disbursement.payee2"
              :disable="!isChequeCancelled"
            />
          </div>
          <div class="col-4">
            <q-item-label class="text-caption q-mb-xs" style="font-weight: bold; font-size: 13px"
              >Taxpayer Type: <strong class="text-red">*</strong></q-item-label
            >
            <q-select
              filled
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
        </div>
      </q-card-section>

      <q-separator />
      <div>
        <q-dialog v-model="showConfirmDialog">
          <q-card style="min-width: 400px">
            <q-card-section>
              <div class="text-h6">Cancel Cheque</div>
            </q-card-section>

            <q-card-section>
              <div class="text-body1">Are you sure you want to cancel this cheque?</div>
              <div class="q-mt-md">
                <div>
                  <strong>Cheque Number:</strong> {{ store.forms.disbursement.chequeNumber }}
                </div>
                <div><strong>Bank:</strong> {{ currentBankLabel }}</div>
                <div><strong>Payee:</strong> {{ store.forms.disbursement.payee }}</div>
              </div>
              <div class="text-caption text-grey-6 q-mt-sm">
                After canceling, you may edit the payee, select a different bank for a new cheque,
                and add expenses.
              </div>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="No" v-close-popup />
              <q-btn color="negative" label="Yes, Cancel" @click="confirmCancelCheque" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>

      <!-- Expense Table Section -->
      <q-card-section class="q-pt-sm q-pb-none">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle1"><strong>Expense Accounts:</strong></div>
          <q-btn
            v-if="isChequeCancelled"
            label="Add"
            color="primary"
            icon="add"
            @click="handleAddExpense"
            @mouseenter="preloadExpenseAccounts"
            :loading="addingExpense || store.expenseTypeLoading"
            v-permission="'add'"
          />
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
                        store.expenseAccounts.find((a) => String(a.id) === String(row.accountId))
                          ?.balance ?? 0
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
                    (Number(row.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
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
          </table>

          <!-- Footer subtotal -->
          <div
            v-if="store.expenses && store.expenses.length > 0"
            class="expense-acc-footer row items-center justify-end q-px-md q-py-xs"
          >
            <span class="text-caption text-grey-8">
              Total Gross Amount:
              <span class="text-grey-10 q-ml-sm" style="font-size: 14px">
                ₱{{
                  (store.totalExpensesAmount || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })
                }}
              </span>
            </span>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle1"><strong>Deductions</strong></div>
          <!-- <q-btn label="" unelevated size="sm" color="primary" outline class="shadow-1 text-weight-bold"
                style="background: #f5a623; color: white; min-width: 20px" @click="openDeductionDialog">
                <q-icon name="add" size="18px" class="text-weight-bold" />
              </q-btn> -->
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
                    (Number(ded.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
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
              <span class="text-grey-10 q-ml-sm" style="font-size: 14px; color: #e53935">
                ₱{{ totalDeductionAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </span>
            </span>
          </div>
        </div>
      </q-card-section>

      <!-- Net Amount -->
      <q-card-section class="q-pt-sm q-pb-none">
        <div class="row items-center justify-end q-gutter-sm">
          <span class="text-caption text-grey-8 text-weight-bold">Net amount:</span>
          <q-input
            outlined
            dense
            readonly
            style="width: 220px"
            input-class="text-right text-weight-bold text-md"
            :model-value="`₱${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
          />
        </div>
      </q-card-section>

      <q-card-section class="q-pb-xs">
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-medium"><strong>Bank Cheques</strong></div>
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
                <th style="text-align: right; width: 140px">Amount</th>
                <th></th>
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

          <!-- Footer subtotal -->
          <div
            v-if="bankChequeRows.length > 0"
            class="expense-acc-footer row items-center justify-end q-px-md q-py-xs"
          >
            <span class="text-caption text-grey-8">
              Total Cheque Amount:
              <span class="text-grey-10 q-ml-sm" style="font-size: 14px">
                ₱{{ bankChequeTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
            </span>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <q-btn
          flat
          label="Cancel"
          class="modal-cancel-btn"
          @click="
            () => {
              isChequeCancelled = false
              store.closeDialog('editDisbursement')
            }
          "
        />
        <q-btn
          label="Save"
          class="modal-save-btn"
          @click="handleSaveEditedDisbursement"
          :loading="saving"
          :disable="
            !store.expenses ||
            store.expenses.length === 0 ||
            bankChequeRows.length === 0 ||
            !chequeTotalsMatch
          "
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="addExpenseDialogOpen">
    <q-card style="min-width: 1000px; max-width: 950px">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Expense</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="addExpenseDialogOpen = false" />
      </q-card-section>

      <q-card-section>
        <div class="text-subtitle1">
          <strong>Account:</strong> {{ store.forms.expense.account }}
        </div>
        <div class="text-subtitle1 q-mb-md">
          <strong>Available Balance:</strong> ₱{{ store.forms.expense.balance.toLocaleString() }}
        </div>

        <!-- <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-4">
            <div class="text-caption q-mb-xs">Fund: <strong class="text-red">*</strong></div>
            <q-input outlined dense v-model="store.forms.expense.fund" label="Fund" />
          </div>
        </div> -->

        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-8">
            <div class="text-caption q-mb-xs">Particulars: <strong class="text-red">*</strong></div>
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
              @update:model-value="(val) => (store.forms.expense.amount = handleAmountInput(val))"
              @blur="(e) => (store.forms.expense.amount = formatToTwoDecimals(e.target.value))"
              prefix="₱"
              inputmode="decimal"
              @keypress="blockNonNumeric"
              @paste.prevent="handlePasteNumeric"
              input-class="text-right"
            />
          </div>
        </div>
      </q-card-section>
      <!-- Save Button -->
      <q-card-actions align="right" class="q-pa-md q-pt-none">
        <q-btn
          label="SAVE"
          @click="handleSaveExpense"
          unelevated
          style="background: #2e7d32; color: white; min-width: 120px; font-weight: bold"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Deduction Dialog -->
  <q-dialog v-model="deductionDialogOpen" persistent>
    <q-card style="min-width: 680px; max-width: 720px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Deduction</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDeductionDialog" />
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-sm q-mb-sm">
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
              @update:model-value="onTaxTypeChange"
            />
          </div>
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
              @update:model-value="onDeductionTypeChange"
            />
          </div>
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
              @update:model-value="onCodeChange"
            />
          </div>
        </div>

        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-4">
            <div class="text-caption q-mb-xs">Divisor:</div>
            <q-input
              outlined
              dense
              v-model="deductionForm.divisor"
              readonly
              @update:model-value="recalcDeduction"
            />
          </div>
          <div class="col-4">
            <div class="text-caption q-mb-xs">VAT %:</div>
            <q-input
              outlined
              dense
              v-model="deductionForm.vatPercent"
              readonly
              suffix="%"
              @update:model-value="recalcDeduction"
            />
          </div>
          <div class="col-4">
            <div class="text-caption q-mb-xs">EWT %:</div>
            <q-input
              outlined
              dense
              v-model="deductionForm.ewtPercent"
              readonly
              suffix="%"
              @update:model-value="recalcDeduction"
            />
          </div>
        </div>
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-4">
            <div class="text-caption q-mb-xs">Description:</div>
            <q-input outlined dense v-model="deductionForm.description" />
          </div>
          <div class="col-4">
            <div class="text-caption q-mb-xs">Gross VAT INC.:</div>
            <q-input
              outlined
              dense
              :model-value="formatPeso(deductionForm.grossVatInc)"
              prefix="₱"
              input-class="text-right"
            />
          </div>
          <div class="col-4">
            <div class="text-caption q-mb-xs">Gross VAT EXC.:</div>
            <q-input
              outlined
              dense
              :model-value="formatPeso(deductionForm.grossVatExc)"
              prefix="₱"
              input-class="text-right"
            />
          </div>
        </div>

        <!-- <div class="row justify-end items-center q-gutter-sm">
                <span class="text-caption text-weight-bold text-uppercase" style="color:#555">Deduction Amount</span>
                <div class="text-subtitle1 text-weight-bold" style="color:#e53935; min-width:160px; text-align:right; border-bottom:2px solid #303030; padding-bottom:4px;">
                  ₱ {{ formatPeso(deductionForm.amount) }}
                </div>
              </div> -->

        <!-- Computed Deduction Amount -->
        <div class="row justify-end items-center q-gutter-md">
          <span class="text-caption text-weight-bold text-uppercase" style="color: #555"
            >Deduction Amount</span
          >

          <!-- Manual input -->
          <q-input
            v-model="deductionAmountDisplay"
            prefix="₱"
            placeholder="0.00"
            inputmode="decimal"
            input-class="text-right text-weight-bold"
            style="color: #e53935; min-width: 160px; border-bottom: 2px solid #303030"
            :input-style="{ padding: '0', marginBottom: '0' }"
            :readonly="!deductionForm.isManual"
            dense
            borderless
            @blur="deductionForm.amount = parseFloat(deductionForm.amount || 0)"
            @keydown="blockNonNumeric"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md q-pt-none">
        <q-btn
          :label="editingDeductionIndex !== -1 ? 'SAVE' : 'ADD'"
          unelevated
          @click="confirmAddDeduction"
          style="background: #2e7d32; color: white; min-width: 100px; font-weight: bold"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="selectAccountDialogOpen">
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
                @click="
                  () => {
                    store.openExpenseDetail(props.row)
                    selectAccountDialogOpen.value = false
                    addExpenseDialogOpen.value = true
                  }
                "
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" @click="selectAccountDialogOpen = false" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Bank Cheque Add/Edit Dialog -->
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
              :options="bankStore.availableBanks"
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
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md q-pt-none">
        <q-btn flat label="Cancel" @click="closeBankChequeDialog" />
        <q-btn
          :label="editingBankChequeId ? 'Save' : 'Add'"
          color="primary"
          @click="confirmAddBankCheque"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useContDisbursementStore } from 'stores/contDisburseStore'
import { useAuthStore } from 'stores/auth'
import { api } from 'src/boot/axios'
import { useBankStore } from 'stores/bankStore'
import { onMounted, ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'

const store = useContDisbursementStore()
const authStore = useAuthStore()
const bankStore = useBankStore()
const $q = useQuasar()
const saving = ref(false)

const showConfirmDialog = ref(false)
const addingExpense = ref(false)
const isChequeCancelled = ref(store.isChequeCancel) // Track if cheque is cancelled

const filteredParticulars = ref(store.particulars)
const expenseParticularInput = ref(store.forms.expense.particulars || '')

const deductionDialogOpen = ref(false)
const bankChequeDialogOpen = ref(false)
const editingDeductionId = ref(null)
const editingDeductionIndex = ref(-1)
const editingBankChequeId = ref(null)
const deductionLibrary = ref([])
const deductionLibraryLoading = ref(false)
const deductionTypesFromApi = ref([])
const taxTypesFromApi = ref([])

const selectAccountDialogOpen = ref(false)
const addExpenseDialogOpen = ref(false)

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

const getBankStatusForBank = (bankId) => {
  if (!bankId) return 'offline'
  const match = barangaySetupBankAccounts.value.find(
    (acc) => String(acc.bank_id) === String(bankId) && acc.account_number,
  )
  return String(match?.bank_status || 'offline').toLowerCase()
}

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

const bankChequeForm = ref({
  bank_id: null,
  booklet_id: null,
  bankName: '',
  cheque_number: '',
  cheque_date: '',
  amount: '',
  amountDisplay: '',
})

const totalDeductionAmount = computed(() =>
  (store.forms.expense.deductions || []).reduce(
    (sum, r) => sum + (Number(r.deduction_amount ?? r.amount) || 0),
    0,
  ),
)

const netAmount = computed(() =>
  Math.max(0, (Number(store.totalExpensesAmount) || 0) - totalDeductionAmount.value),
)

// const totalsMatch = computed(() => {
//   const total = Math.round((Number(store.totalExpensesAmount) || 0) * 100)
//   const locked = Math.round((Number(store.lockedTotalAmount) || 0) * 100)
//   return total === locked
// })

const removeBankCheque = (id) => {
  store.bankCheques = (store.bankCheques || []).filter((row) => row.id !== id)
}

const emptyDeductionForm = () => ({
  deductionType: null,
  taxType: null,
  code: null,
  codeText: '',
  deduction_code_id: null,
  divisor: null,
  vatPercent: null,
  ewtPercent: null,
  description: '',
  grossVatInc: 0,
  grossVatExc: 0,
  amount: 0,
  isManual: false,
})
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

const findDeductionCode = (value) => {
  if (value === null || value === undefined || value === '') return null
  return (
    deductionLibrary.value.find((code) => String(code.id) === String(value)) ||
    deductionLibrary.value.find((code) => String(code.code) === String(value)) ||
    null
  )
}

const openBankChequeDialog = () => {
  editingBankChequeId.value = null
  bankChequeForm.value = {
    bank_id: null,
    booklet_id: null,
    bankName: '',
    cheque_number: '',
    cheque_date: todayFormatted(),
    amount: '',
    amountDisplay: '',
  }
  bankChequeDialogOpen.value = true
}

const selectedDeductionCodeId = (deduction) => {
  const directId = deduction.deduction_code_id ?? deduction.deductionCodeId
  if (directId) return directId

  const match = deductionLibrary.value.find((code) => {
    const sameCode = String(code.code || '') === String(deduction.code || '')
    const sameType =
      !deduction.deductionTypeName ||
      normalizedText(fieldText(code, 'deduction_type', 'deductionType')) ===
        normalizedText(deduction.deductionTypeName)
    const sameTax =
      !deduction.taxTypeName ||
      normalizedText(fieldText(code, 'tax_type', 'taxType')) ===
        normalizedText(deduction.taxTypeName)
    return sameCode && sameType && sameTax
  })

  return match?.id ?? deduction.code ?? null
}

const codeOptions = computed(() => {
  const { deductionType, taxType } = deductionForm.value

  if (normalizedText(deductionType) === 'others') {
    return deductionLibrary.value
      .filter((c) => isOthersDeductionCode(c))
      .map((c) => ({ label: c.description ?? c.code, value: c.id }))
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
    .map((c) => ({ label: `${c.code} - ${c.description}`, value: c.id }))
})

function onDeductionTypeChange() {
  const isOthers = normalizedText(deductionForm.value.deductionType) === 'others'
  const othersCode = isOthers ? deductionLibrary.value.find((c) => isOthersDeductionCode(c)) : null

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

function onCodeChange(code) {
  const { taxType, deductionType } = deductionForm.value
  const selectedCode = findDeductionCode(code)

  if (normalizedText(deductionType) === 'others') {
    // Others = manual amount entry; clear computed fields
    deductionForm.value.deduction_code_id = selectedCode?.id ?? code ?? null
    deductionForm.value.codeText = selectedCode?.code ?? ''
    deductionForm.value.description = selectedCode?.description ?? selectedCode?.code ?? code
    deductionForm.value.divisor = null
    deductionForm.value.vatPercent = null
    deductionForm.value.ewtPercent = null
    deductionForm.value.grossVatInc = 0
    deductionForm.value.grossVatExc = 0
    deductionForm.value.amount = 0
    deductionForm.value.isManual = true
    return
  }

  const cfg = selectedCode
    ? {
        divisor: selectedCode.divisor ?? 1,
        vatPercent: selectedCode.vat_percent ?? selectedCode.vatPercent ?? 0,
        ewtPercent: selectedCode.ewt_percent ?? selectedCode.ewtPercent ?? 0,
        description: selectedCode.description ?? selectedCode.code ?? '',
      }
    : findConfig(taxType, deductionType, code)
  if (!cfg) return

  deductionForm.value.deduction_code_id = selectedCode?.id ?? null
  deductionForm.value.codeText = selectedCode?.code ?? String(code ?? '')
  deductionForm.value.divisor = cfg.divisor
  deductionForm.value.vatPercent = cfg.vatPercent
  deductionForm.value.ewtPercent = cfg.ewtPercent
  deductionForm.value.description = cfg.description
  deductionForm.value.isManual = false
  recalcDeduction()
}

function recalcDeduction() {
  if (deductionForm.value.isManual) return // others: do not overwrite user input

  const grossAmount = Number(store.totalExpensesAmount) || 0
  const divisor = parseFloat(deductionForm.value.divisor) || 1
  const vatPct = parseFloat(deductionForm.value.vatPercent) || 0
  const ewtPct = parseFloat(deductionForm.value.ewtPercent) || 0
  const type = deductionForm.value.deductionType

  const grossVatInc = grossAmount // always the full amount
  const grossVatExc = grossVatInc / divisor // VAT-exclusive portion

  deductionForm.value.grossVatInc = grossVatInc
  deductionForm.value.grossVatExc = grossVatExc

  let deductionAmt = 0
  if (type === 'businessTax') {
    deductionAmt = grossVatExc * (vatPct / 100)
  } else if (type === 'EWT') {
    deductionAmt = grossVatExc * (ewtPct / 100)
  }
  // others → amount stays as-is (manual)

  deductionForm.value.amount = deductionAmt
}

const deductionAmountDisplay = computed({
  get: () => (parseFloat(deductionForm.value.amount) || 0).toFixed(2),
  set: (val) => {
    deductionForm.value.amount = parseFloat(val) || 0
  },
})

const optionText = (item, keys = []) => {
  if (typeof item === 'string' || typeof item === 'number') return String(item)
  for (const key of keys) {
    if (item?.[key] !== null && item?.[key] !== undefined && item?.[key] !== '') {
      return String(item[key])
    }
  }
  return ''
}

const formatTaxTypeLabel = (value) => TAX_TYPE_LABELS[value] || humanizeCamelCase(value)
const formatDeductionTypeLabel = (value) => DEDUCTION_TYPE_LABELS[value] || humanizeCamelCase(value)
// Explicit label overrides for known tax/deduction type values
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

const fieldText = (item, ...keys) => optionText(item, keys)
const normalizedText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
const isOthersDeductionCode = (code) =>
  normalizedText(fieldText(code, 'deduction_type', 'deductionType')) === 'others' ||
  Boolean(code?.is_others)

const taxTypeOptions = computed(() =>
  uniqueOptions(
    taxTypesFromApi.value.length ? taxTypesFromApi.value : deductionLibrary.value,
    ['tax_type', 'taxType'],
    formatTaxTypeLabel,
  ),
)

const formatPeso = (val) => {
  const n = parseFloat(val) || 0
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// function openDeductionDialog() {
//   editingDeductionId.value = null
//   editingDeductionIndex.value = -1
//   deductionForm.value = emptyDeductionForm()
//   store.forms.expense.amount = Number(store.totalExpensesAmount) || 0

//   // Fetch library data if not yet loaded
//   if (!deductionLibrary.value.length) {
//     fetchDeductionLibrary()
//   }

//   deductionDialogOpen.value = true
// }

async function openDeductionDialog() {
  editingDeductionId.value = null
  editingDeductionIndex.value = -1
  deductionForm.value = emptyDeductionForm()
  store.forms.expense.amount = Number(store.totalExpensesAmount) || 0

  if (!deductionLibrary.value.length) {
    await fetchDeductionLibrary()
  }

  deductionDialogOpen.value = true
}
void openDeductionDialog

const editDeductionRow = async (deduction) => {
  if (!deductionLibrary.value.length) {
    await fetchDeductionLibrary()
  }

  editingDeductionId.value = deduction.id
  editingDeductionIndex.value = (store.forms.expense.deductions || []).findIndex(
    (row) => row === deduction || (deduction.id != null && String(row.id) === String(deduction.id)),
  )

  const taxType = deduction.taxTypeName
    ? (taxTypeOptions.value.find((t) => t.label === deduction.taxTypeName)?.value ?? null)
    : null
  const deductionType = normalizeDeductionType(deduction.deductionTypeName)
  const code = deduction.code || ''
  const codeId = selectedDeductionCodeId(deduction)
  const cfg = findConfig(taxType, deductionType, code)
  const selectedCode = findDeductionCode(codeId)

  deductionForm.value = {
    ...emptyDeductionForm(),
    deductionType,
    taxType,
    code: codeId,
    codeText: selectedCode?.code ?? deduction.code ?? '',
    deduction_code_id: selectedCode?.id ?? deduction.deduction_code_id ?? null,
    description: deduction.description || code || '',
    divisor: selectedCode?.divisor ?? cfg?.divisor ?? deduction.divisor ?? null,
    vatPercent:
      selectedCode?.vat_percent ??
      selectedCode?.vatPercent ??
      cfg?.vatPercent ??
      deduction.vatPercent ??
      null,
    ewtPercent:
      selectedCode?.ewt_percent ??
      selectedCode?.ewtPercent ??
      cfg?.ewtPercent ??
      deduction.ewtPercent ??
      null,
    grossVatInc: Number(deduction.gross_vat_inc) || 0,
    grossVatExc: Number(deduction.gross_vat_exc) || 0,
    amount: Number(deduction.amount) || 0,
    isManual: deduction.isManual ?? false,
  }

  deductionDialogOpen.value = true
}

function normalizeDeductionType(value) {
  const raw = String(value || '').trim()
  const option = deductionTypeOptions.value.find((opt) => opt.value === raw || opt.label === raw)
  return option?.value || raw
}

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

  const grossAmount = Number(store.totalExpensesAmount) || 0
  const deductionAmount = Number(deductionForm.value.amount) || 0
  const displayPercent =
    deductionForm.value.deductionType === 'businessTax'
      ? (deductionForm.value.vatPercent ?? 0)
      : (deductionForm.value.ewtPercent ?? 0)

  const row = {
    id: editingDeductionId.value || Date.now(),
    deduction_code_id: deductionForm.value.deduction_code_id,
    deductionTypeName: deductionForm.value.deductionType,
    taxTypeName: deductionForm.value.taxType
      ? (taxTypeOptions.value.find((t) => t.value === deductionForm.value.taxType)?.label ?? '—')
      : '—',
    code: deductionForm.value.codeText || '', // CHANGED from deductionForm.value.code
    description:
      deductionForm.value.description ||
      deductionForm.value.codeText || // CHANGED
      deductionForm.value.deductionType,
    gross_vat_inc: Number(deductionForm.value.grossVatInc) || grossAmount,
    gross_vat_exc: deductionForm.value.grossVatExc,
    percent: deductionForm.value.isManual ? null : displayPercent,
    deduction_amount: deductionAmount,
    net_amount: Math.max(0, grossAmount - deductionAmount),
    amount: deductionAmount,
    isManual: deductionForm.value.isManual,
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

const closeDeductionDialog = () => {
  deductionDialogOpen.value = false
  editingDeductionId.value = null
  editingDeductionIndex.value = -1
  deductionForm.value = emptyDeductionForm()
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

// const editDeductionRow = (deduction) => {
//   editingDeductionId.value = deduction.id
//   editingDeductionIndex.value = (store.forms.expense.deductions || []).findIndex(row =>
//     row === deduction || (deduction.id != null && String(row.id) === String(deduction.id))
//   )

//   const taxType = deduction.taxTypeName
//     ? taxTypeOptions.find(t => t.label === deduction.taxTypeName)?.value ?? null
//     : null
//   const deductionType = normalizeDeductionType(deduction.deductionTypeName)
//   const code = deduction.code || ''
//   const cfg = findConfig(taxType, deductionType, code)

//   deductionForm.value = {
//     ...emptyDeductionForm(),
//     deductionType,
//     taxType,
//     code,
//     description : deduction.description || code || '',
//     divisor     : cfg?.divisor     ?? null,
//     vatPercent  : cfg?.vatPercent  ?? null,
//     ewtPercent  : cfg?.ewtPercent  ?? null,
//     grossVatInc : Number(deduction.gross_vat_inc)  || 0,
//     grossVatExc : Number(deduction.gross_vat_exc)  || 0,
//     amount      : Number(deduction.deduction_amount ?? deduction.amount) || 0,
//     isManual    : deduction.isManual ?? false,
//   }

//   deductionDialogOpen.value = true
// }

const handleBankChequeBankSelect = async (bankId) => {
  const normalizedBankId = bankId ? Number(bankId) : null
  bankChequeForm.value.bank_id = normalizedBankId
  bankChequeForm.value.booklet_id = null
  bankChequeForm.value.cheque_number = ''
  const bank = bankStore.availableBanks.find((b) => b.id === normalizedBankId)
  bankChequeForm.value.bankName = bank?.name || ''
  bankChequeForm.value.bank_status = getBankStatusForBank(normalizedBankId)
  if (!normalizedBankId) return
  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.get(`/api/barangay/banks/${normalizedBankId}/available-cheques`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    const taken = (store.bankCheques || []).map((r) => r.cheque_number).filter(Boolean)
    const next = (res.data?.data?.cheque || []).find((c) => !taken.includes(c.cheque_number))
    bankChequeForm.value.booklet_id = res.data?.data?.id || null
    bankChequeForm.value.cheque_number = next?.cheque_number || ''
  } catch (e) {
    console.error('Bank cheque select error:', e)
    bankChequeForm.value.bank_id = null
    bankChequeForm.value.bankName = ''
  }
}

const onBankChequeAmountInput = (val) => {
  let v = String(val).replace(/[^\d.]/g, '')
  const p = v.split('.')
  if (p.length > 2) v = p[0] + '.' + p.slice(1).join('')
  if (p.length === 2 && p[1].length > 2) v = p[0] + '.' + p[1].slice(0, 2)
  bankChequeForm.value.amount = v
  bankChequeForm.value.amountDisplay = v
}
const onBankChequeAmountBlur = () => {
  const n = Number(bankChequeForm.value.amount) || 0
  bankChequeForm.value.amountDisplay = n.toLocaleString('en-PH', { minimumFractionDigits: 2 })
}
const onBankChequeAmountFocus = () => {
  bankChequeForm.value.amountDisplay = bankChequeForm.value.amount
}

const confirmAddBankCheque = () => {
  const f = bankChequeForm.value
  const amount = Number(f.amount) || 0
  if (!f.bank_id || !f.cheque_number || amount <= 0) {
    return $q.notify({
      type: 'negative',
      message: 'Select a bank, cheque number, and valid amount',
      position: 'top',
    })
  }
  const row = {
    id: editingBankChequeId.value || Date.now(),
    bank_id: f.bank_id,
    booklet_id: f.booklet_id,
    bankName: f.bankName,
    cheque_number: f.cheque_number,
    cheque_date: f.cheque_date,
    bank_status: f.bank_status,
    amount,
  }

  store.bankCheques = editingBankChequeId.value
    ? (store.bankCheques || []).map((cheque) =>
        String(cheque.id) === String(editingBankChequeId.value) ? row : cheque,
      )
    : [...(store.bankCheques || []), row]

  closeBankChequeDialog()
}

const bankChequeRows = computed(() => {
  return (store.bankCheques || []).map((row, idx) => ({
    id: row.id,
    key: `${row.id || idx}-${row.cheque_number || row.chequeNumber || idx}`,
    bank_id: row.bank_id != null ? Number(row.bank_id) : null,
    booklet_id: row.booklet_id || null,
    bank: row.bankName || row.bank || '',
    bankName: row.bankName || row.bank || '',
    cheque_number: row.cheque_number || row.chequeNumber || '',
    chequeNumber: row.cheque_number || row.chequeNumber || '',
    cheque_date: row.cheque_date || row.chequeDate || '',
    chequeDate: row.cheque_date || row.chequeDate || '',
    bank_status: row.bank_status || row.bankStatus || '',
    bankStatus: row.bank_status || row.bankStatus || '',
    amount: Number(row.amount) || 0,
  }))
})
const bankChequeTotal = computed(() =>
  bankChequeRows.value.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
)

const closeBankChequeDialog = () => {
  bankChequeDialogOpen.value = false
  editingBankChequeId.value = null
  bankChequeForm.value = {
    bank_id: null,
    booklet_id: null,
    bankName: '',
    cheque_number: '',
    cheque_date: '',
    amount: '',
    amountDisplay: '',
  }
}

const editBankCheque = (row) => {
  editingBankChequeId.value = row.id
  bankChequeForm.value = {
    bank_id: row.bank_id != null ? Number(row.bank_id) : null,
    booklet_id: row.booklet_id || null,
    bankName: row.bankName || row.bank || '',
    cheque_number: row.cheque_number || '',
    cheque_date: row.cheque_date || todayFormatted(),
    amount: String(row.amount || ''),
    amountDisplay: (Number(row.amount) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }),
    bank_status: row.bank_status || row.bankStatus || getBankStatusForBank(row.bank_id),
  }
  bankChequeDialogOpen.value = true
}

// optional: keep for display only, e.g. a warning banner, but don't disable Save on it
const chequeTotalsMatch = computed(() => {
  const cheques = Math.round((Number(bankChequeTotal.value) || 0) * 100)
  const net = Math.round((Number(netAmount.value) || 0) * 100)
  return cheques === net
})

// const editDeductionColumns = computed(() =>
//   (store.deductionColumns || []).map(column =>
//     column.name === 'action'
//       ? { ...column, label: 'Action', style: 'width: 96px' }
//       : column
//   )
// )

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
  if (val === '') {
    update(() => {
      filteredParticulars.value = store.particulars.slice(0, 5)
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    const results = store.particulars.filter((opt) => opt.label.toLowerCase().includes(needle))

    filteredParticulars.value = results.slice(0, 5)
  })
}

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

// Example bank list (replace with your data)

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

onMounted(async () => {
  await bankStore.fetchBanks()
  await fetchBarangaySetupBankAccounts()
})

// Watch for dialog close to reset form data
watch(
  () => store.dialogs.editDisbursement,
  (isOpen) => {
    if (!isOpen) {
      // Dialog is closed, reset form data after a short delay to allow for data persistence
      setTimeout(() => {
        store.resetEditDisbursement()
      }, 100)
    }
  },
)

watch(
  () => store.dialogs.editDisbursement,
  (isOpen) => {
    if (isOpen) {
      isChequeCancelled.value = store.isChequeCancel
    } else {
      setTimeout(() => {
        store.resetEditDisbursement()
      }, 100)
    }
  },
)

const handleSaveEditedDisbursement = async () => {
  if (!store.expenses || store.expenses.length === 0) {
    $q.notify({
      type: 'negative',
      message: 'Add at least one expense before saving.',
      icon: 'warning',
      position: 'top',
      timeout: 4000,
    })
    return
  }

  if (bankChequeRows.value.length === 0) {
    $q.notify({
      type: 'negative',
      message: 'Add at least one bank cheque before saving.',
      icon: 'warning',
      position: 'top',
      timeout: 4000,
    })
    return
  }

  const chequeTotal = Math.round((Number(bankChequeTotal.value) || 0) * 100)
  const net = Math.round((Number(netAmount.value) || 0) * 100)

  if (chequeTotal !== net) {
    const diff = Math.abs(net - chequeTotal) / 100
    $q.notify({
      type: 'negative',
      message:
        chequeTotal > net
          ? `Cheque amount exceeds the net amount by ₱${diff.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          : `Cheque amount is short of the net amount by ₱${diff.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: 'warning',
      position: 'top',
      timeout: 5000,
    })
    return
  }

  saving.value = true
  try {
    const result = await store.saveEditedDisbursement()
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Disbursement updated successfully!',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000,
      })
      isChequeCancelled.value = false
      store.isChequeCancel = false
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Failed to update disbursement',
        icon: 'error',
        position: 'top',
        timeout: 5000,
      })
    }
  } catch (error) {
    console.error('Error saving edited disbursement:', error)
    $q.notify({
      type: 'negative',
      message: 'An error occurred while saving',
      icon: 'error',
      position: 'top',
      timeout: 5000,
    })
  } finally {
    saving.value = false
  }
}

const showExtraCheques = ref(false)
const extraCheques = ref([])

// const grandTotal = computed(() => {
//   const primary = parseFloat(store.forms.expense.amount) || 0
//   const extra = extraCheques.value.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
//   return primary + extra
// })

const todayFormatted = () => {
  const t = new Date()
  const mm = String(t.getMonth() + 1).padStart(2, '0')
  const dd = String(t.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${t.getFullYear()}`
}

const addHiddenChequeRow = () => {
  if (extraCheques.value.length >= 8) return
  showExtraCheques.value = true
  extraCheques.value.push({
    id: Date.now(),
    bank_id: null,
    cheque_number: '', // start empty — filled by onExtraBankSelect
    cheque_date: todayFormatted(),
    amount: '',
    amountDisplay: '',
  })
}
void addHiddenChequeRow

// const removeExtraCheque = (idx) => {
//   extraCheques.value.splice(idx, 1)
//   if (!extraCheques.value.length) showExtraCheques.value = false
// }

// const onExtraBankSelect = async (idx, bankId) => {
//   extraCheques.value[idx].cheque_number = ''
//   if (!bankId) return
//   try {
//     const token = authStore.admin ? authStore.adminToken : authStore.token
//     const res = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, {
//       headers: { Authorization: `Bearer ${token}` }
//     })
//     const taken = [
//       store.forms.expense.cheque_number,
//       ...extraCheques.value.map(r => r.cheque_number).filter(Boolean)
//     ]
//     const next = (res.data?.data?.cheque || []).find(c => !taken.includes(c.cheque_number))
//     extraCheques.value[idx].cheque_number = next?.cheque_number || ''
//   } catch {
//     extraCheques.value[idx].bank_id = null
//   }
// }

// const onExtraAmountInput = (idx, val) => {
//   let v = String(val).replace(/[^\d.]/g, '')
//   const p = v.split('.')
//   if (p.length > 2) v = p[0] + '.' + p.slice(1).join('')
//   if (p.length === 2 && p[1].length > 2) v = p[0] + '.' + p[1].slice(0, 2)
//   extraCheques.value[idx].amount = v
//   extraCheques.value[idx].amountDisplay = v
// }
// const onExtraAmountBlur = (idx) => {
//   const n = parseFloat(extraCheques.value[idx].amount) || 0
//   extraCheques.value[idx].amountDisplay = n.toLocaleString('en-PH', { minimumFractionDigits: 2 })
// }
// const onExtraAmountFocus = (idx) => {
//   extraCheques.value[idx].amountDisplay = extraCheques.value[idx].amount
// }

const editExpenseInline = (expense) => {
  store.openExpenseDetailForEdit(expense)
  addExpenseDialogOpen.value = true
}

// const getExpenseBalance = (expense) => {
//   const account = store.expenseAccounts.find(item => String(item.id) === String(expense.accountId))
//   return Number(account?.balance ?? expense.balance ?? 0)
// }

const confirmCancelExpenseCheque = (expense) => {
  const chequeNumber = expense.chequeNumber || expense.cheque_number
  $q.dialog({
    title: 'Cancel Cheque',
    message: `Cancel cheque ${chequeNumber}? You can assign a replacement by editing this row before saving.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    const result = store.markExpenseChequeCancelled(expense)
    if (result.success) {
      isChequeCancelled.value = true
      $q.notify({
        type: 'positive',
        message: 'Cheque marked for cancellation. Edit the row to assign a replacement cheque.',
        icon: 'check_circle',
        position: 'top',
        timeout: 4000,
      })
    } else {
      $q.notify({
        type: 'negative',
        message: result.message || 'Failed to cancel cheque',
        icon: 'error',
        position: 'top',
        timeout: 3000,
      })
    }
  })
}
void confirmCancelExpenseCheque

// const getTotalAmountClass = () => {
//   const currentTotal = store.totalExpensesAmount || 0
//   const lockedTotal = store.lockedTotalAmount || 0

//   if (currentTotal > lockedTotal) {
//     return 'text-negative'
//   } else if (currentTotal < lockedTotal) {
//     return 'text-warning'
//   } else {
//     return 'text-positive'
//   }
// }

// const getAmountDifference = () => {
//   const currentTotal = store.totalExpensesAmount || 0
//   const lockedTotal = store.lockedTotalAmount || 0
//   return currentTotal - lockedTotal
// }

// const getAmountDifferenceMessage = () => {
//   const difference = getAmountDifference()

//   if (difference > 0 && !isChequeCancelled.value) {
//     return `Amount exceeds original DV amount by ₱${difference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
//   } else if (difference < 0 && !isChequeCancelled.value) {
//     return `Amount is less than original DV amount by ₱${Math.abs(difference).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
//   }
//   return ''
// }

const handleSaveExpense = async () => {
  try {
    await store.saveExpense()
    $q.notify({
      type: 'positive',
      message: 'Expense updated successfully!',
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

// Formatting helpers (match CommitDialog behavior)
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
  if (cleanValue === '') return 0
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    const collapsed = parts[0] + '.' + parts.slice(1).join('')
    return formatToTwoDecimals(collapsed)
  }
  if (parts.length === 2 && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2)
  }
  const num = parseFloat(parts.join('.'))
  if (isNaN(num)) return 0
  return Math.round(num * 100) / 100
}

const blockNonNumeric = (event) => {
  const key = event.key
  const isControl = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(key)
  if (isControl) return
  const isDigit = /\d/.test(key)
  const isDot = key === '.'
  if (isDot && event.target?.value?.includes?.('.')) {
    event.preventDefault()
    return
  }
  if (!isDigit && !isDot) {
    event.preventDefault()
  }
}

const handlePasteNumeric = (event) => {
  const text = (event.clipboardData || window.clipboardData).getData('text')
  let clean = String(text).replace(/[^\d.]/g, '')
  const parts = clean.split('.')
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length >= 2) {
    parts[1] = parts[1].slice(0, 2)
    clean = parts[0] + '.' + parts[1]
  }
  const input = event.target
  const start = input.selectionStart
  const end = input.selectionEnd
  const current = input.value
  input.value = current.slice(0, start) + clean + current.slice(end)
  const e = new Event('input', { bubbles: true })
  input.dispatchEvent(e)
}

// Handle cancel cheque button
const handleCancelCheque = () => {
  showConfirmDialog.value = true
}
void handleCancelCheque

// Confirm cancel cheque action
const confirmCancelCheque = async () => {
  try {
    showConfirmDialog.value = false

    // Call backend API to mark cheque as cancelled
    store.isChequeCancel = true

    if (store.isChequeCancel) {
      // Clear the cheque number and enable bank selection
      store.forms.disbursement.chequeNumber = ''
      store.forms.disbursement.bank_id = null
      store.autoCheque = ''

      isChequeCancelled.value = true

      // Refresh bank data to reflect the cancelled cheque status
      await bankStore.fetchBanks()

      $q.notify({
        type: 'positive',
        message: 'Cancelling Cheque! Edit details and save to confirm.',
        icon: 'check_circle',
        position: 'top',
        timeout: 5000,
      })
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to cancel cheque',
        icon: 'error',
        position: 'top',
        timeout: 3000,
      })
    }
  } catch (error) {
    console.error('Error cancelling cheque:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to cancel cheque',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    })
  }
}

const preloadExpenseAccounts = () => {
  // Preload expense accounts when user hovers over Add button
  if (store.expenseAccounts.length === 0 && !store.expenseAccountsLoading) {
    store.refreshExpenseAccountsWithBalances().catch((error) => {
      console.warn('Failed to preload expense accounts:', error)
    })
  }
}

// const handleAddExpense = async () => {
//   addingExpense.value = true
//   try {
//     await store.openDialog('expense')
//   } catch (error) {
//     console.error('Error opening expense dialog:', error)
//     $q.notify({
//       type: 'negative',
//       message: 'Failed to open expense dialog',
//       icon: 'error',
//       position: 'top',
//       timeout: 3000,
//     })
//   } finally {
//     addingExpense.value = false
//   }
// }
const handleAddExpense = async () => {
  addingExpense.value = true
  try {
    if (store.expenseData.length === 0) {
      await store.fetchContinuingAppropriations()
    }
    selectAccountDialogOpen.value = true // local, not store.dialogs.expense
  } catch (error) {
    console.error('Error opening expense dialog:', error)
    $q.notify({ type: 'negative', message: 'Failed to open expense dialog', position: 'top' })
  } finally {
    addingExpense.value = false
  }
}

watch(
  () => store.dialogs.expense,
  async (open) => {
    if (open && store.expenseAccounts.length === 0) store.refreshExpenseAccountsWithBalances()
  },
)

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

/* Responsive design for mobile */
@media (max-width: 768px) {
  .q-card {
    min-width: 95vw !important;
  }

  .q-table {
    font-size: 12px;
  }

  .button-group .q-btn {
    min-width: 28px;
    padding: 4px;
  }

  .expense-account-hierarchy {
    font-size: 11px;
    max-width: 250px;
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

  :deep(.q-table__container) {
    overflow-x: auto;
    overflow-y: auto;
    max-height: 300px;
  }

  :deep(.q-table__middle) {
    overflow: unset;
  }

  :deep(.q-table thead tr th) {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #fafafa;
  }
}
</style>
