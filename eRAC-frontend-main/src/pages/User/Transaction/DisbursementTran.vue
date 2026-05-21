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
        <q-btn icon="refresh" color="primary" flat dense @click="refreshData" :loading="loading"
          title="Refresh disbursements" />
      </div>
    </div>

    <!-- TYPE NAVIGATION CARDS -->
    <div class="q-mb-md">
      <div class="row q-col-gutter-sm">

        <!-- Regular -->
        <div class="col-md-4 col-sm-12">
          <q-card :class="['type-nav-card', { 'type-nav-active': selectedDisbursementType === 'regular' }]"
            @click="handleTypeNavClick('regular')" clickable v-ripple>
            <q-card-section class="text-center q-pa-md">
              <q-icon name="list" size="md" class="q-mb-sm"
                :color="selectedDisbursementType === 'regular' ? 'white' : 'grey-7'" />
              <div class="text-subtitle2 text-weight-medium">Regular</div>
              <div class="text-caption q-mt-xs type-count">
                {{ typeCounts.regular }} transaction{{ typeCounts.regular !== 1 ? 's' : '' }}
              </div>
            </q-card-section>
            <!-- Add button shown when this card is active -->
            <div v-if="selectedDisbursementType === 'regular'" class="type-nav-add-btn">
              <q-btn round flat dense icon="add" size="sm" @click.stop="openDialogForType('regular')"
                v-permission="'add'" title="Add Regular Disbursement" />
            </div>
          </q-card>
        </div>

        <!-- BIR Remittance -->
        <div class="col-md-4 col-sm-12">
          <q-card
            :class="['type-nav-card', 'type-nav-bir', { 'type-nav-active type-nav-active-bir': selectedDisbursementType === 'bir' }]"
            @click="handleTypeNavClick('bir')" clickable v-ripple>
            <q-card-section class="text-center q-pa-md">
              <q-icon name="receipt" size="md" class="q-mb-sm"
                :color="selectedDisbursementType === 'bir' ? 'white' : 'deep-orange'" />
              <div class="text-subtitle2 text-weight-medium">BIR Remittance</div>
              <div class="text-caption q-mt-xs type-count">
                {{ typeCounts.bir }} transaction{{ typeCounts.bir !== 1 ? 's' : '' }}
              </div>
            </q-card-section>
            <div v-if="selectedDisbursementType === 'bir'" class="type-nav-add-btn">
              <q-btn round flat dense icon="add" size="sm" @click.stop="openDialogForType('bir')" v-permission="'add'"
                title="Add BIR Remittance" />
            </div>
          </q-card>
        </div>

        <!-- SK / Provincial Aid -->
        <div class="col-md-4 col-sm-12">
          <q-card
            :class="['type-nav-card', 'type-nav-sk', { 'type-nav-active type-nav-active-sk': selectedDisbursementType === 'sk' }]"
            @click="handleTypeNavClick('sk')" clickable v-ripple>
            <q-card-section class="text-center q-pa-md">
              <q-icon name="swap_horiz" size="md" class="q-mb-sm"
                :color="selectedDisbursementType === 'sk' ? 'white' : 'blue-10'" />
              <div class="text-subtitle2 text-weight-medium">SK / Provincial Aid</div>
              <div class="text-caption q-mt-xs type-count">
                {{ typeCounts.sk }} transaction{{ typeCounts.sk !== 1 ? 's' : '' }}
              </div>
            </q-card-section>
            <div v-if="selectedDisbursementType === 'sk'" class="type-nav-add-btn">
              <q-btn round flat dense icon="add" size="sm" @click.stop="openDialogForType('sk')" v-permission="'add'"
                title="Add SK / Provincial Aid" />
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <q-card flat bordered class="q-mb-md filters-section">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Status Filter -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Status:</q-item-label>
            <q-select outlined dense v-model="selectedStatus" :options="statusOptions" option-label="label"
              option-value="value" emit-value map-options :label="currentStatusLabel" clearable />
          </div>

          <!-- Search Input -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Search:</q-item-label>
            <q-input outlined dense v-model="searchQuery" placeholder="Search payee, DV number..." clearable>
              <template v-slot:append><q-icon name="search" /></template>
            </q-input>
          </div>

          <!-- Date Range Filter -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Date Range:</q-item-label>
            <q-input outlined dense v-model="dateRangeDisplay" placeholder="Select date range..." readonly clearable
              @clear="onDateRangeClear">
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
            <q-btn dense outlined color="red-10" icon="clear_all" label="Clear" @click="clearAllFilters"
              class="full-width" />
          </div>

          <div class="col"></div>

          <!-- Add Button -->
          <div class="col-auto">
            <q-btn :label="`Add ${currentTypeLabel}`" color="primary" icon="add"
              @click="openDialogForType(selectedDisbursementType)" v-permission="'add'" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- MAIN DISBURSEMENT DIALOG                                           -->
    <div class="q-mb-sm">
      <!--  REGULAR DISBURSEMENT DIALOG  -->
      <q-dialog v-model="store.dialogs.disbursement" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 960px; max-width: 96vw">
          <q-card-section class="q-pb-none">
            <div class="row items-center q-gutter-sm">
              <q-icon name="list" color="primary" size="sm" />
              <div class="text-h6">Regular Disbursement</div>
            </div>
          </q-card-section>

          <!-- Header fields: Date, DV Number, Payee -->
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">Date:</q-item-label>
                <q-input outlined dense v-model="store.forms.disbursement.date" mask="##/##/####"
                  @keydown.enter="handleEnterKey">
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-not-allowed" />
                  </template>
                </q-input>
              </div>
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">DV Number:</q-item-label>
                <q-input outlined dense v-model="store.forms.disbursement.dvNumber" @keydown.enter="handleEnterKey" />
              </div>
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Payee:</q-item-label>
                <q-input outlined dense v-model="store.forms.disbursement.payee" @keydown.enter="handleEnterKey" />
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <!-- Expense Accounts Section -->
          <q-card-section class="q-pt-sm q-pb-none">
            <div class="row items-center justify-between q-mb-sm">
              <span class="text-subtitle2 text-weight-medium text-grey-7">Expense Accounts</span>
              <q-btn label="Add Expense Account" color="primary" icon="add" size="sm" @click="handleAddExpense"
                @mouseenter="preloadExpenseAccounts" :loading="addingExpense || store.expenseTypeLoading"
                v-permission="'add'" />
            </div>

            <!-- Empty state -->
            <div v-if="!store.expenses || store.expenses.length === 0"
              class="text-center text-grey-5 q-pa-lg text-body2">
              No expense accounts added yet. Click "Add Expense Account" to begin.
            </div>

            <!-- Grouped expense account blocks -->
            <div v-for="group in groupedExpenses" :key="group.accountId" class="expense-acc-block q-mb-sm">

              <!-- Account header -->
              <div class="expense-acc-header row items-center q-px-md q-py-xs">
                <q-icon name="folder" size="xs" color="grey-6" class="q-mr-xs" />
                <span class="text-caption text-weight-medium text-grey-8 col">
                  {{ group.accountName }}
                </span>
                <span class="text-caption text-grey-6 q-mr-sm">
                  Balance: ₱{{ (group.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </span>
                <q-btn flat dense round icon="delete" color="red-4" size="xs"
                  @click="removeAllForAccount(group.accountId)" v-permission="'add'"
                  title="Remove this account's rows" />
              </div>

              <!-- Rows table for this account -->
              <table class="expense-inline-table full-width">
                <thead>
                  <tr>
                    <th style="width:36px">#</th>
                    <th>Particular</th>
                    <th>Bank</th>
                    <th>Cheque No.</th>
                    <th style="text-align:right; width:140px">Amount</th>
                    <th style="width:48px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in group.rows" :key="row.id">
                    <td class="text-grey-6">{{ idx + 1 }}</td>
                    <td>{{ row.particular || '—' }}</td>
                    <td>{{ row.bankName || '—' }}</td>
                    <td>
                      <q-chip v-if="row.chequeNumber" dense color="blue-1" text-color="blue-8" size="sm" icon="receipt">
                        {{ row.chequeNumber }}
                      </q-chip>
                      <span v-else class="text-grey-5 text-caption">—</span>
                    </td>
                    <td style="text-align:right" class="text-weight-medium">
                      ₱{{ (Number(row.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                    </td>
                    <td>
                      <q-btn flat dense round icon="close" color="red-4" size="xs" @click="handleDeleteExpense(row)" />
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Add Cheque button + inline panel per account -->
              <div class="expense-acc-footer row items-center justify-between q-px-md q-py-xs">
                <q-btn flat dense size="sm" icon="add" label="Add cheque" color="primary"
                  @click="toggleChequePanel(group.accountId)" />
                <span class="text-caption text-grey-6">
                  Subtotal:
                  <strong class="text-grey-9">
                    ₱{{ group.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                  </strong>
                </span>
              </div>

              <!-- Inline cheque panel (toggled per account) -->
              <div v-if="openChequePanels[group.accountId]" class="cheque-panel q-px-md q-pb-md">
                <div class="row q-col-gutter-sm items-end">
                  <div class="col-md-3 col-sm-6">
                    <q-item-label class="q-mb-xs text-caption">Bank</q-item-label>
                    <q-select outlined dense v-model="chequePanelForms[group.accountId].bank_id"
                      :options="bankStore.availableBanks" option-label="name" option-value="id" emit-value map-options
                      label="Select bank"
                      @update:model-value="(bid) => handleChequePanelBankSelect(group.accountId, bid)" />
                  </div>
                  <div class="col-md-3 col-sm-6">
                    <q-item-label class="q-mb-xs text-caption">Cheque No.</q-item-label>
                    <q-input outlined dense v-model="chequePanelForms[group.accountId].cheque_number" :disable="true"
                      placeholder="Auto-generated" />
                  </div>
                  <div class="col-md-3 col-sm-6">
                    <q-item-label class="q-mb-xs text-caption">Particular</q-item-label>
                    <q-select outlined dense v-model="chequePanelForms[group.accountId].particular"
                      :options="filteredParticulars" use-input hide-selected fill-input new-value-mode="add-unique"
                      option-label="label" option-value="label" emit-value @filter="filterFn"
                      @new-value="(val, done) => done(val, 'add-unique')" label="Particular" />
                  </div>
                  <div class="col-md-2 col-sm-6">
                    <q-item-label class="q-mb-xs text-caption">Amount</q-item-label>
                    <q-input outlined dense :model-value="chequePanelForms[group.accountId].amountDisplay" prefix="₱"
                      placeholder="0.00" inputmode="decimal"
                      @update:model-value="(v) => onChequePanelAmountInput(group.accountId, v)"
                      @blur="() => onChequePanelAmountBlur(group.accountId)"
                      @focus="() => onChequePanelAmountFocus(group.accountId)" @keydown="blockNonNumeric" />
                  </div>
                  <div class="col-auto">
                    <q-btn flat dense label="Cancel" size="sm" @click="toggleChequePanel(group.accountId)" />
                    <q-btn dense label="Add row" color="primary" size="sm" class="q-ml-xs"
                      :loading="chequePanelForms[group.accountId].saving" @click="saveChequeRow(group)" />
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>

          <!-- Total -->
          <q-card-section class="q-pt-sm">
            <div class="row items-center justify-end q-gutter-sm">
              <span class="text-caption text-grey-6">Total disbursement amount:</span>
              <q-input outlined dense readonly style="width: 220px"
                :model-value="`₱${(store.totalExpensesAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`" />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="handleDialogClose('disbursement')" />
            <q-btn label="Disburse" color="primary" @click="handleSaveClick" v-permission="'add'"
              :loading="store.savingDisbursement" :disable="store.savingDisbursement" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!--  BIR REMITTANCE DIALOG  -->
      <q-dialog v-model="showBirDialog" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 960px; max-width: 96vw">
          <q-card-section class="q-pb-none">
            <div class="row items-center q-gutter-sm">
              <q-icon name="receipt" color="deep-orange" size="sm" />
              <div class="text-h6 text-deep-orange">BIR Remittance</div>
            </div>
          </q-card-section>

          <!-- Banner -->
          <q-card-section class="q-pb-none">
            <q-banner class="bg-amber-1 text-amber-10" rounded dense>
              <template v-slot:avatar><q-icon name="info" color="amber-10" /></template>
              BIR Remittance will not reflect on SACB and RAC reports.
              <span v-if="pendingTaxTotal > 0" class="q-ml-sm">
                — Pending tax:
                <strong>₱{{ pendingTaxTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</strong>
              </span>
            </q-banner>
          </q-card-section>

          <!-- Header fields: Date, DV Number, Payee -->
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">Date: <span class="text-red">*</span></q-item-label>
                <q-input outlined dense v-model="birForm.date" mask="##/##/####" @keydown.enter="handleEnterKey">
                  <template v-slot:append><q-icon name="event" class="cursor-not-allowed" /></template>
                </q-input>
              </div>
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">
                  DV Number: <span class="text-red">*</span>
                  <q-chip dense color="blue-1" text-color="blue-8" class="q-ml-xs" size="sm">Editable</q-chip>
                </q-item-label>
                <q-input outlined dense v-model="birForm.dv_number" @keydown.enter="handleEnterKey" />
              </div>
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Payee:</q-item-label>
                <q-input outlined dense model-value="Bureau of Internal Revenue" :disable="true" bg-color="grey-2" />
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
                    <th style="width:36px">#</th>
                    <th>Bank</th>
                    <th>Cheque No.</th>
                    <th>Particular</th>
                    <th style="text-align:right; width:160px">Amount</th>
                    <th style="width:48px"></th>
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
                    <td style="min-width:180px">
                      <q-select outlined dense v-model="row.bank_id" :options="bankStore.availableBanks"
                        option-label="name" option-value="id" emit-value map-options label="Select bank"
                        hide-bottom-space @update:model-value="(bid) => handleBirRowBankSelect(idx, bid)" />
                    </td>
                    <td style="min-width:140px">
                      <q-input outlined dense v-model="row.cheque_number" :disable="true" placeholder="Auto-generated"
                        hide-bottom-space />
                    </td>
                    <td style="min-width:160px">
                      <q-input outlined dense v-model="row.particular" placeholder="e.g. Remittance to BIR"
                        hide-bottom-space />
                    </td>
                    <td>
                      <q-input outlined dense :model-value="row.amountDisplay" prefix="₱" placeholder="0.00"
                        inputmode="decimal" hide-bottom-space @update:model-value="(v) => onBirRowAmountInput(idx, v)"
                        @blur="() => onBirRowAmountBlur(idx)" @focus="() => onBirRowAmountFocus(idx)"
                        @keydown="blockNonNumeric" />
                    </td>
                    <td>
                      <q-btn flat dense round icon="close" color="red-4" size="xs" @click="removeBirChequeRow(idx)" />
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Footer: Add button + subtotal, matching regular dialog style -->
              <div class="expense-acc-footer row items-center justify-between q-px-md q-py-xs">
                <q-btn flat dense size="sm" icon="add" label="Add cheque" color="deep-orange"
                  @click="addBirChequeRow" />
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
              <q-input outlined dense readonly style="width:220px"
                :model-value="`₱${birTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`" />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="showBirDialog = false" />
            <q-btn label="Disburse" color="deep-orange" icon="receipt" @click="handleSaveBir" v-permission="'add'"
              :loading="savingBir" :disable="savingBir" />
          </q-card-actions>
        </q-card>
      </q-dialog>

       <!--  SK / PROVINCIAL AID DIALOG ─ -->
      <q-dialog v-model="showSkDialog" persistent @keydown.enter="handleEnterKey">
        <q-card style="min-width: 900px; max-width: 95vw">
          <q-card-section class="q-pb-none">
            <div class="row items-center q-gutter-sm">
              <q-icon name="swap_horiz" color="blue-10" size="sm" />
              <div class="text-h6 text-blue-10">SK / Provincial Aid</div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-banner class="bg-blue-1 text-blue-10 q-mb-md" rounded>
              <template v-slot:avatar><q-icon name="info" color="blue-10" /></template>
              SK Transfer and Provincial Aid will <strong>not reflect on SACB</strong>.
            </q-banner>
            <div class="row q-col-gutter-md">
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">Date: <span class="text-red">*</span></q-item-label>
                <q-input outlined dense v-model="skForm.date" mask="##/##/####">
                  <template v-slot:append><q-icon name="event" /></template>
                </q-input>
              </div>
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">DV Number: <span class="text-red">*</span></q-item-label>
                <q-input outlined dense v-model="skForm.dv_number" placeholder="Enter DV number" />
              </div>
              <div class="col-md-4 col-sm-12">
                <q-item-label class="q-mb-xs">Payee: <span class="text-red">*</span></q-item-label>
                <q-input outlined dense v-model="skForm.payee" placeholder="Enter payee name" />
              </div>
            </div>
            
            <div class="row q-col-gutter-md q-mt-xs">
              <div class="col-md-4 col-sm-6">
                <q-item-label class="q-mb-xs">Type: <span class="text-red">*</span></q-item-label>
                <q-select outlined dense v-model="skForm.type" :options="skTypeOptions" option-label="label"
                  option-value="value" emit-value map-options label="Select Type" />
              </div>
            </div>
          </q-card-section>

          <q-separator class="q-my-md" />

          <q-card-section class="q-pt-sm q-pb-none">
             <div class="row items-center justify-between q-mb-sm">
          <span class="text-subtitle2 text-weight-medium text-grey-7">Cheque Entries</span>
        </div>

        <div class="expense-acc-block q-mb-sm">
          <table class="expense-inline-table full-width">
            <thead>
              <tr>
                <th style="width:36px">#</th>
                <th>Bank</th>
                <th>Cheque No.</th>
                <th style="text-align:right; width:160px">Amount</th>
                <th style="width:48px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!skChequeRows.length">
                <td colspan="6" class="text-center text-grey-5 text-caption q-pa-md">
                  No cheque entries yet.
                </td>
              </tr>
              <tr v-for="(row, idx) in skChequeRows" :key="idx">
                <td class="text-grey-6">{{ idx + 1 }}</td>
                <td style="min-width:180px">
                  <q-select outlined dense v-model="row.bank_id"
                    :options="bankStore.availableBanks" option-label="name" option-value="id"
                    emit-value map-options label="Select bank" hide-bottom-space
                    @update:model-value="(bid) => handleSkRowBankSelect(idx, bid)" />
                </td>
                <td style="min-width:140px">
                  <q-input outlined dense v-model="row.cheque_number" :disable="true"
                    placeholder="Auto-generated" hide-bottom-space />
                </td>
                <td>
                  <q-input outlined dense :model-value="row.amountDisplay" prefix="₱"
                    placeholder="0.00" inputmode="decimal" hide-bottom-space
                    @update:model-value="(v) => onSkRowAmountInput(idx, v)"
                    @blur="() => onSkRowAmountBlur(idx)"
                    @focus="() => onSkRowAmountFocus(idx)"
                    @keydown="blockNonNumeric" />
                </td>
                <td>
                  <q-btn flat dense round icon="close" color="red-4" size="xs"
                    @click="removeSkChequeRow(idx)" />
                </td>
              </tr>
            </tbody>
          </table>

          <div class="expense-acc-footer row items-center justify-between q-px-md q-py-xs">
            <q-btn flat dense size="sm" icon="add" label="Add cheque" color="deep-orange"
              @click="addSkChequeRow" />
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
              <q-input outlined dense readonly style="width:220px"
                :model-value="`₱${skTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`" />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="showSkDialog = false" />
            <q-btn label="Disburse" color="primary" icon="swap_horiz" @click="handleSaveSk" v-permission="'add'"
              :loading="savingSk" :disable="savingSk" />
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
            <q-input outlined dense placeholder="Search expense account..." v-model="store.expenseSearch"
              class="q-mb-sm" style="width: 300px">
              <template v-slot:append><q-icon name="search" /></template>
            </q-input>
            <q-table :rows="store.filteredExpenseAccounts" :columns="store.expenseAccountColumns" row-key="id"
              :loading="store.loading || store.expenseTypeLoading" :filter="store.expenseSearch" flat bordered>
              <template v-slot:body-cell-action="props">
                <q-td :props="props">
                  <q-btn dense label="Select" color="primary" @click="store.openExpenseDetail(props.row)" />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="handleDialogClose('expense')" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Main Data Table -->
      <q-card flat bordered>
        <!-- Table header showing current view -->
        <q-card-section class="q-pb-none q-pt-sm">
          <div class="row items-center">
            <q-icon :name="currentTypeIcon" :color="currentTypeColor" size="sm" class="q-mr-sm" />
            <span class="text-subtitle2 text-weight-medium" :style="`color: var(--q-${currentTypeColor})`">
              {{ currentTypeLabel }} Transactions
            </span>
            <q-chip dense :color="currentTypeColor" text-color="white" class="q-ml-sm" size="sm">
              {{ filteredDisbursements.length }}
            </q-chip>
          </div>
        </q-card-section>

        <q-table :rows="filteredDisbursements" :columns="mainTableColumns" row-key="row_id"
          :pagination="store.pagination" :loading="store.loadingDisbursements" flat
          @row-dblclick="(evt, row) => handleViewDisbursement(row)">
          <template v-slot:body-cell-type="props">
            <q-td :props="props">
              <q-chip dense :color="getTypeColor(props.row.type)" text-color="white"
                :label="getTypeLabel(props.row.type)" />
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip :color="getStatusColor(props.row.status)" :text-color="getStatusTextColor(props.row.status)" dense
                :label="props.row.status" />
            </q-td>
          </template>

          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="row q-gutter-xs items-left">
                <q-btn v-if="isApprover || authStore.admin || isTreasurer" dense icon="edit"
                  :color="props.row.status === 'Unliquidated' || props.row.status === 'Partial' ? 'orange' : 'grey'"
                  :disable="props.row.status !== 'Unliquidated' && props.row.status !== 'Partial'"
                  :loading="store.loadingEditDisbursement === props.row.id" @click="handleEditDisbursement(props.row)"
                  v-permission="'edit'" />
                <q-btn dense icon="visibility" color="blue" @click="handleViewDisbursement(props.row)"
                  :loading="viewLoading[props.row.id]" :disable="viewLoading[props.row.id]" v-permission="'view'" />
                <q-btn dense icon="block" color="red" v-if="isTreasurer
                  && (props.row.status === 'Unliquidated' || props.row.status === 'Partial')
                  && canVoid(props.row) && props.row.status !== 'Stale'"
                  @click.stop="() => handleVoidDisbursement(props.row)" v-permission="'delete'" />
                <q-btn dense icon="block" color="red" v-if="isApprover
                  && (props.row.status === 'Unliquidated' || props.row.status === 'Partial')
                  && canVoid(props.row) && props.row.status !== 'Stale'"
                  @click.stop="() => handleDirectVoidDisbursement(props.row)" v-permission="'delete'" />
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-liquidate="props">
            <q-td :props="props">
              <q-btn dense label="Liquidate" color="primary" v-if="props.row.type === 'regular'
                && (props.row.status === 'Unliquidated' || props.row.status === 'Partial')"
                @click="handleLiquidateDisbursement(props.row)" :loading="liquidateLoading[props.row.id]"
                :disable="liquidateLoading[props.row.id] || props.row.status === 'Stale'" v-permission="'add'" />
            </q-td>
          </template>
        </q-table>
      </q-card>

      <OrDetailsDialog v-model="store.dialogs.orDetails" />
      <ViewOrDetails v-model="store.dialogs.viewOrDetails" />
      <EditDisbursement />

      <!-- Void Request Dialog -->
      <q-dialog v-model="store.dialogs.void" persistent>
        <q-card style="min-width: 500px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Request Void</div>
          </q-card-section>
          <q-card-section>
            <div class="text-body1 q-mb-md">Please provide remarks for this void request.</div>
            <q-input outlined v-model="store.forms.void.remarks" label="Remarks (Required)" type="textarea" rows="3"
              :rules="[(val) => (!!val && val.trim() !== '') || 'Remarks are required']"
              hint="Reason for requesting to void this disbursement" />
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="handleDialogClose('void')" />
            <q-btn label="Submit Void Request" color="red" :loading="store.voidingDisbursement"
              :disable="!store.forms.void.remarks || store.forms.void.remarks.trim() === ''"
              @click="handleSubmitVoidRequest" />
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
            <div class="text-body1 q-mb-sm"><strong>Disbursement:</strong> {{ selectedRemarksData?.dvNumber || 'N/A' }}
            </div>
            <div class="text-body1 q-mb-sm"><strong>Payee:</strong> {{ selectedRemarksData?.payee || 'N/A' }}</div>
            <div class="text-body1 q-mb-md">
              <strong>Status:</strong>
              <q-chip :color="getStatusColor(selectedRemarksData?.status)"
                :text-color="getStatusTextColor(selectedRemarksData?.status)" dense :label="selectedRemarksData?.status"
                class="q-ml-sm" />
            </div>
            <q-separator class="q-mb-md" />
            <div class="text-subtitle1 q-mb-sm text-weight-medium">Remarks:</div>
            <div class="remarks-content q-pa-md" style="background:#f5f5f5;border-radius:8px;min-height:100px">
              <div v-if="selectedRemarksData?.remarks">{{ selectedRemarksData.remarks }}</div>
              <div v-else-if="selectedRemarksData?.rejection_remarks">{{ selectedRemarksData.rejection_remarks }}</div>
              <div v-else class="text-grey-6 text-italic">No remarks available</div>
            </div>
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Close" @click="closeRemarksDialog" color="primary" />
            <q-btn label="View Details" @click="openViewOrDetailsFromRemarks" color="primary" unelevated />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { api } from 'src/boot/axios'

import OrDetailsDialog from 'components/disbursement/OrDetailsDialog.vue'
import ViewOrDetails from 'components/disbursement/ViewOrDetails.vue'
import EditDisbursement from 'components/disbursement/EditDisbursement.vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useAuthStore } from 'stores/auth'
import { useBankStore } from 'stores/bankStore'
import { usePageLogging } from '../../../composables/usePageLogging'

const $q = useQuasar()
const store = useDisbursementStore()
const bankStore = useBankStore()
const authStore = useAuthStore()
const route = useRoute()

//  Cheque panel state (per account group)
const openChequePanels = ref({})
const chequePanelForms = ref({})

const defaultChequeForm = () => ({
  bank_id: null,
  cheque_number: '',
  particular: '',
  amount: '',
  amountDisplay: '',
  saving: false,
})

//  Group store.expenses by accountId
const groupedExpenses = computed(() => {
  const rows = store.expenses || []
  const map = new Map()

  rows.forEach(row => {
    const key = String(row.accountId)
    if (!map.has(key)) {
      // Find balance from the store's expense accounts list
      const accInfo = store.expenseAccounts.find(a => String(a.id) === key)
      map.set(key, {
        accountId: row.accountId,
        accountName: row.accountName,
        balance: accInfo?.balance ?? 0,
        rows: [],
        subtotal: 0,
      })
    }
    const group = map.get(key)
    group.rows.push(row)
    group.subtotal += Number(row.amount) || 0
  })

  return [...map.values()]
})

//  Toggle cheque panel for an account
const toggleChequePanel = (accountId) => {
  const key = String(accountId)
  if (openChequePanels.value[key]) {
    openChequePanels.value[key] = false
  } else {
    openChequePanels.value[key] = true
    if (!chequePanelForms.value[key]) {
      chequePanelForms.value[key] = defaultChequeForm()
    }
  }
}

const handleChequePanelBankSelect = async (accountId, bankId) => {
  const key = String(accountId)
  chequePanelForms.value[key].cheque_number = ''
  if (!bankId) return
  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    })
    const cheques = res.data?.data?.cheque || []
    // Skip cheques already assigned in this session
    const next = cheques.find(c => !store.pendingChequeNumbers.includes(c.cheque_number))
    chequePanelForms.value[key].cheque_number = next?.cheque_number || ''
  } catch (e) {
    console.error('Cheque panel bank selection error:', e)
    chequePanelForms.value[key].bank_id = null
    chequePanelForms.value[key].cheque_number = ''
  }
}

//  Amount helpers for cheque panel─
const onChequePanelAmountInput = (accountId, val) => {
  const key = String(accountId)
  let v = String(val).replace(/[^\d.]/g, '')
  const p = v.split('.')
  if (p.length > 2) v = p[0] + '.' + p.slice(1).join('')
  if (p.length === 2 && p[1].length > 2) v = p[0] + '.' + p[1].slice(0, 2)
  chequePanelForms.value[key].amount = v
  chequePanelForms.value[key].amountDisplay = v
}
const onChequePanelAmountBlur = (accountId) => {
  const key = String(accountId)
  chequePanelForms.value[key].amountDisplay =
    formatAmountDisplay(chequePanelForms.value[key].amount)
}
const onChequePanelAmountFocus = (accountId) => {
  const key = String(accountId)
  chequePanelForms.value[key].amountDisplay = chequePanelForms.value[key].amount
}

const saveChequeRow = async (group) => {
  const key = String(group.accountId)
  const form = chequePanelForms.value[key]

  if (!form.bank_id) return $q.notify({ type: 'negative', message: 'Select a bank', position: 'top' })
  if (!form.particular) return $q.notify({ type: 'negative', message: 'Enter a particular', position: 'top' })
  if (!form.amount || parseFloat(form.amount) <= 0) return $q.notify({ type: 'negative', message: 'Enter a valid amount', position: 'top' })

  const bankObj = bankStore.availableBanks.find(b => b.id === form.bank_id)

  // Register this cheque as pending so the next selection skips it
  if (form.cheque_number && !store.pendingChequeNumbers.includes(form.cheque_number)) {
    store.pendingChequeNumbers.push(form.cheque_number)
  }

  store.expenses.push({
    id: store.getNextExpenseId(),
    accountId: group.accountId,
    accountName: group.accountName,
    amount: parseFloat(form.amount),
    particular: form.particular,
    bankName: bankObj?.name || '',
    bank_id: form.bank_id,
    cheque_number: form.cheque_number,
    chequeNumber: form.cheque_number,
    expense_class_id: group.rows[0]?.expense_class_id,
    expense_type_id: group.rows[0]?.expense_type_id,
    expense_item_id: group.rows[0]?.expense_item_id,
    expense_sub_item_id: group.rows[0]?.expense_sub_item_id,
  })
  store.expenses = [...store.expenses]

  chequePanelForms.value[key] = defaultChequeForm()
  openChequePanels.value[key] = false
}

//  Remove all rows for an account
const removeAllForAccount = (accountId) => {
  store.expenses = store.expenses.filter(e => String(e.accountId) !== String(accountId))
  delete openChequePanels.value[String(accountId)]
  delete chequePanelForms.value[String(accountId)]
  store.refreshExpenseAccountsWithBalances()
}

// selectedDisbursementType controls BOTH the table filter AND which tab opens in dialog
const selectedDisbursementType = ref('regular')

// When user clicks a type card: filter the table and remember it
const handleTypeNavClick = (type) => {
  selectedDisbursementType.value = type
}

// try first
const openDialogForType = async (type) => {
  try {
    await bankStore.fetchBanks()
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
    regular: all.filter(d => !d.type || d.type === 'regular').length,
    bir: all.filter(d => d.type === 'bir').length,
    sk: all.filter(d => d.type === 'sk' || d.type === 'provincial_aid').length,
  }
})

// Label/icon/color for the currently selected type (used in table header + Add button)
const currentTypeLabel = computed(() => {
  switch (selectedDisbursementType.value) {
    case 'bir': return 'BIR Remittance'
    case 'sk': return 'SK / Provincial Aid'
    default: return 'Regular'
  }
})
const currentTypeIcon = computed(() => {
  switch (selectedDisbursementType.value) {
    case 'bir': return 'receipt'
    case 'sk': return 'swap_horiz'
    default: return 'list'
  }
})
const currentTypeColor = computed(() => {
  switch (selectedDisbursementType.value) {
    case 'bir': return 'deep-orange'
    case 'sk': return 'blue-10'
    default: return 'primary'
  }
})

//  Dialog tab state 
const activeTab = ref('disbursement')

//  BIR form 
const birChequeRows = ref([])
const birForm = ref({ date: '', bank_id: null, cheque_number: '', dv_number: '', dv_amount: '' })
const birAmountDisplay = ref('')
const savingBir = ref(false)
const pendingTaxTotal = ref(0)

const birTotalAmount = computed(() =>
  birChequeRows.value.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
)

const defaultBirRow = () => ({
  bank_id: null,
  cheque_number: '',
  particular: 'Remittance to BIR',
  amount: '',
  amountDisplay: '',
})

const addBirChequeRow = () => {
  birChequeRows.value.push(defaultBirRow())
}

const removeBirChequeRow = (idx) => {
  birChequeRows.value.splice(idx, 1)
}

const handleBirRowBankSelect = async (idx, bankId) => {
  birChequeRows.value[idx].cheque_number = ''
  if (!bankId) return
  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    })
    const cheques = res.data?.data?.cheque || []
    // Skip cheques already taken by other rows in this session
    const taken = birChequeRows.value.map(r => r.cheque_number).filter(Boolean)
    const next = cheques.find(c => !taken.includes(c.cheque_number))
    birChequeRows.value[idx].cheque_number = next?.cheque_number || ''
  } catch (e) {
    console.error('BIR row bank select error:', e)
    birChequeRows.value[idx].bank_id = null
    birChequeRows.value[idx].cheque_number = ''
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
const skForm = ref({ type: 'sk', date: '', bank_id: null, cheque_number: '', dv_number: '', payee: '', amount: '', remarks: '' })
const skAmountDisplay = ref('')
const savingSk = ref(false)
const skTypeOptions = [
  { label: 'SK Transfer', value: 'sk' },
  { label: 'Provincial Aid', value: 'provincial_aid' },
]

const skTotalAmount = computed(() =>
  skChequeRows.value.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
)

const defaultSkRow = () => ({
  bank_id: null,
  cheque_number: '',
  amount: '',
  amountDisplay: '',
})

const addSkChequeRow = () => {
  skChequeRows.value.push(defaultSkRow())
}

const removeSkChequeRow = (idx) => {
  skChequeRows.value.splice(idx, 1)
}

const handleSkRowBankSelect = async (idx, bankId) => {
  skChequeRows.value[idx].cheque_number = ''
  if (!bankId) return

  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.get(`/api/barangay/banks/${bankId}/available-cheques`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    })

    const cheques = res.data?.data?.cheque || []
    const taken = skChequeRows.value.map(r => r.cheque_number).filter(Boolean)
    const next = cheques.find(c => !taken.includes(c.cheque_number))

    skChequeRows.value[idx].cheque_number = next?.cheque_number || ''
  } catch (e) {
    console.error('SK row bank select error:', e)
    skChequeRows.value[idx].bank_id = null
    skChequeRows.value[idx].cheque_number = ''
  }
}

const onSkRowAmountInput = (idx, val) => {
  let v = String(val).replace(/[^\d.]/g, '')
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

const statusOptions = [
  { label: 'All Status', value: null },
  { label: 'Unliquidated', value: 'Unliquidated' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Liquidated', value: 'Liquidated' },
  { label: 'Void Requested', value: 'Void Requested' },
  { label: 'Voided', value: 'Voided' },
  { label: 'Stale', value: 'Stale' },
]

//  Table columns 
// const mainTableColumns = computed(() => {
//   const base = (store.disbursementColumns || []).filter(c => c.name !== 'remarks')

//   // Only inject the type column for the SK card (which mixes sk + provincial_aid rows)
//   if (selectedDisbursementType.value === 'sk') {
//     if (!base.some(c => c.name === 'type')) {
//       const statusIdx = base.findIndex(c => c.name === 'status')
//       if (statusIdx !== -1) {
//         base.splice(statusIdx + 1, 0, {
//           name: 'type', label: 'Type', field: 'type', align: 'center', sortable: true,
//         })
//       }
//     }
//   }

//   return base
// })

const mainTableColumns = computed(() => {
  const base = (store.disbursementColumns || []).filter(c => {
    if (c.name === 'remarks') return false
    if (selectedDisbursementType.value === 'sk' && c.name === 'particular') return false
    return true
  })

  if (selectedDisbursementType.value === 'sk' && !base.some(c => c.name === 'type')) {
    const payeeIdx = base.findIndex(c => c.name === 'payee')
    base.splice(payeeIdx + 1, 0, {
      name: 'type',
      label: 'Type',
      field: 'type',
      align: 'center',
      sortable: true,
    })
  }

  return base
})

//  Filtered rows 
// selectedDisbursementType drives the primary filter; status/search/date are secondary
const filteredDisbursements = computed(() => {
  let rows = store.disbursements || []

  // Primary: type card selection
  if (selectedDisbursementType.value === 'regular') {
    rows = rows.filter(d => !d.type || d.type === 'regular')
  } else if (selectedDisbursementType.value === 'bir') {
    rows = rows.filter(d => d.type === 'bir')
  } else if (selectedDisbursementType.value === 'sk') {
    // SK card shows both SK and Provincial Aid together
    rows = rows.filter(d => d.type === 'sk' || d.type === 'provincial_aid')
  }

  // Secondary filters
  if (selectedStatus.value) {
    rows = rows.filter(d => d.status === selectedStatus.value)
  }
  if (searchQuery.value?.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    rows = rows.filter(d =>
      [d.payee, d.dvNumber, d.chequeNumber, d.bank, d.status]
        .some(f => f && f.toString().toLowerCase().includes(q))
    )
  }
  if (store.dateFrom && store.dateTo) {
    rows = rows.filter(d => {
      if (!d.date) return false
      const date = new Date(d.date).toLocaleDateString('en-GB')
      return date >= store.dateFrom && date <= store.dateTo
    })
  }

  return rows.sort((a, b) => new Date(b.date) - new Date(a.date))
})

//  Type display helpers 
const getTypeLabel = (type) => ({ regular: 'Regular', bir: 'BIR', sk: 'SK', provincial_aid: 'Prov. Aid' }[type] || 'Regular')
const getTypeColor = (type) => ({ regular: 'grey-7', bir: 'deep-orange', sk: 'blue-10', provincial_aid: 'indigo' }[type] || 'grey-7')

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
  const invalid = birChequeRows.value.find(r => !r.bank_id || !r.cheque_number || !r.amount || parseFloat(r.amount) <= 0)
  if (invalid) {
    $q.notify({ type: 'negative', message: 'Each row must have a bank, cheque number, and amount.', position: 'top' })
    return
  }

  const firstRow = birChequeRows.value[0]

  savingBir.value = true
  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.post('/api/barangay/bir-remittances', {
      date: f.date,
      dv_number: f.dv_number,
      bank_id: firstRow.bank_id,
      cheque_number: firstRow.cheque_number,
      dv_amount: birTotalAmount.value,
      entries: birChequeRows.value.map(r => ({
        bank_id: r.bank_id,
        cheque_number: r.cheque_number,
        particular: r.particular,
        amount: parseFloat(r.amount),
      }))
    }, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })

    if (res.data.status) {
      $q.notify({ type: 'positive', message: 'BIR Remittance created!', position: 'top', timeout: 3000 })
      showBirDialog.value = false
      await store.fetchDisbursements()
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: e.response?.data?.message || 'Failed.', position: 'top' })
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

  const invalid = skChequeRows.value.find(r =>
    !r.bank_id || !r.cheque_number || !r.amount || parseFloat(r.amount) <= 0
  )

  if (invalid) {
    $q.notify({ type: 'negative', message: 'Each row must have a bank, cheque number, and amount.', position: 'top' })
    return
  }

  const firstRow = skChequeRows.value[0]

  savingSk.value = true
  try {
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.post('/api/barangay/fund-transfers', {
      type: f.type,
      date: f.date,
      dv_number: f.dv_number,
      payee: f.payee,
      bank_id: firstRow.bank_id,
      cheque_number: firstRow.cheque_number,
      amount: skTotalAmount.value,
      remarks: f.remarks,
      entries: skChequeRows.value.map(r => ({
        bank_id: r.bank_id,
        cheque_number: r.cheque_number,
        amount: parseFloat(r.amount),
      }))
    }, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })

    if (res.data.status) {
      $q.notify({
        type: 'positive',
        message: `${f.type === 'sk' ? 'SK Transfer' : 'Provincial Aid'} created!`,
        position: 'top',
        timeout: 3000
      })
      resetSkForm()
      showSkDialog.value = false
      await store.fetchDisbursements()
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: e.response?.data?.message || 'Failed.', position: 'top' })
  } finally {
    savingSk.value = false
  }
}

watch(showSkDialog, async (open) => {
  if (open) {
    skForm.value.date = todayDMY()
    skForm.value.dv_number = await fetchNewDvNumber()
    skAmountDisplay.value = ''
  }
})

// Watch BIR tab open → load pending tax total
watch(activeTab, async (tab) => {
  if (tab === 'bir') {
    try { const res = await axios.get('/api/bir-remittances/pending-tax-total'); pendingTaxTotal.value = res.data.pending_total || 0 }
    catch (e) { console.error(e) }
  }
})

// Helper: today as DD/MM/YYYY
const todayDMY = () => {
  const t = new Date()
  return [
    String(t.getDate()).padStart(2, '0'),
    String(t.getMonth() + 1).padStart(2, '0'),
    t.getFullYear(),
  ].join('/')
}

// const fetchNewDvNumber = async () => {
//   try {
//     const { api } = await import('src/boot/axios')
//     const token = authStore.admin ? authStore.adminToken : authStore.token
//     const res = await api.get('/api/barangay/generate-dvnumber', {
//       headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
//     })
//     return res.data?.data?.dv_number || ''
//   } catch (e) {
//     console.error('DV fetch failed', e)
//     return ''
//   }
// }

const fetchNewDvNumber = async () => {
  try {
    const { api } = await import('src/boot/axios')
    const token = authStore.admin ? authStore.adminToken : authStore.token
    const res = await api.get('/api/barangay/generate-dvnumber', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    })
    const apiDv = res.data?.data?.dv_number || ''

    // Cross-check against ALL types (regular + BIR + SK) already in the store
    const alreadyExists = !!(apiDv && (store.disbursements || [])
      .some(d => d.dvNumber === apiDv))

    return alreadyExists
      ? store.generateLocalDvNumber()
      : (apiDv || store.generateLocalDvNumber())
  } catch (e) {
    console.error('DV fetch failed, using local fallback:', e)
    return store.generateLocalDvNumber()
  }
}

const formatAmountDisplay = (raw) => {
  const n = parseFloat(String(raw).replace(/[₱,\s]/g, ''))
  return isNaN(n) ? '' : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// const onBirAmountInput = (val) => {
//   if (val === null || val === undefined) return
//   let v = String(val).replace(/[^\d.]/g, '')
//   const p = v.split('.')
//   if (p.length > 2) v = p[0] + '.' + p.slice(1).join('')
//   if (p.length === 2 && p[1].length > 2) v = p[0] + '.' + p[1].slice(0, 2)
//   birForm.value.dv_amount = v
//   birAmountDisplay.value = v
// }
// const onBirAmountBlur = () => {
//   birAmountDisplay.value = formatAmountDisplay(birForm.value.dv_amount)
// }
// const onBirAmountFocus = () => {
//   birAmountDisplay.value = birForm.value.dv_amount
// }

// const onSkAmountInput = (val) => {
//   if (val === null || val === undefined) return
//   let v = String(val).replace(/[^\d.]/g, '')
//   const p = v.split('.')
//   if (p.length > 2) v = p[0] + '.' + p.slice(1).join('')
//   if (p.length === 2 && p[1].length > 2) v = p[0] + '.' + p[1].slice(0, 2)
//   skForm.value.amount = v
//   skAmountDisplay.value = v
// }
// const onSkAmountBlur = () => {
//   skAmountDisplay.value = formatAmountDisplay(skForm.value.amount)
// }
// const onSkAmountFocus = () => {
//   skAmountDisplay.value = skForm.value.amount
// }

const resetBirForm = () => {
  birForm.value = { date: '', bank_id: null, cheque_number: '', dv_number: '', dv_amount: '' }
  birAmountDisplay.value = ''
}

// Watch BIR dialog open → load pending tax total + auto-fill date & DV
// watch(showBirDialog, async (open) => {
//   if (open) {
//     // Fill form on open
//     birForm.value.date = todayDMY()
//     birForm.value.dv_number = await fetchNewDvNumber()
//     birForm.value.bank_id = null
//     birForm.value.cheque_number = ''
//     birForm.value.dv_amount = ''
//     birAmountDisplay.value = ''
//     try {
//       const token = authStore.admin ? authStore.adminToken : authStore.token
//       const res = await api.get('/api/barangay/bir-remittances/pending-tax-total', {
//         headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
//       })
//       pendingTaxTotal.value = res.data.pending_total || 0
//     } catch (e) {
//       // console.error(e)
//       console.warn('pending-tax-total endpoint unavailable:', e.response?.status)
//       pendingTaxTotal.value = 0
//     }
//   } else {
//     resetBirForm()
//   }
// })

watch(showBirDialog, async (open) => {
  if (open) {
    birForm.value.date = todayDMY()
    birForm.value.dv_number = await fetchNewDvNumber()
    birForm.value.bank_id = null
    birForm.value.cheque_number = ''
    birForm.value.dv_amount = ''
    birAmountDisplay.value = ''
    birChequeRows.value = [defaultBirRow()] // start with one empty row
    try {
      const token = authStore.admin ? authStore.adminToken : authStore.token
      const res = await api.get('/api/barangay/bir-remittances/pending-tax-total', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      })
      pendingTaxTotal.value = res.data.pending_total || 0
    } catch {
      pendingTaxTotal.value = 0
    }
  } else {
    resetBirForm()
    birChequeRows.value = []
  }
})

// const resetSkForm = () => {
//   skForm.value = { type: 'sk', date: '', bank_id: null, cheque_number: '', dv_number: '', payee: '', amount: '', remarks: '' }
//   skAmountDisplay.value = ''
// }

const resetSkForm = () => {
  skForm.value = { type: 'sk', date: '', dv_number: '', payee: '', remarks: '' }
  skAmountDisplay.value = ''
  skChequeRows.value = []
}

watch(showSkDialog, async (open) => {
  if (open) {

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

const filteredParticulars = ref(store.particulars)
const filterFn = (val, update) => {
  update(() => {
    filteredParticulars.value = val === '' ? store.particulars : store.particulars.filter(o => o.label.toLowerCase().includes(val.toLowerCase()))
  })
}

// const formatInputValue = (value) => {
//   if (value === '' || value == null) return '';
//   const num = parseFloat(String(value).replace(/[₱,\s]/g, ''));
//   return isNaN(num) ? '' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// }

// const handleAmountInput = (value) => {
//   let v = String(value).replace(/[₱,\s]/g, '').replace(/[^\d.]/g, '');
//   const p = v.split('.'); if (p.length > 2) v = p[0] + '.' + p.slice(1).join('');
//   if (p.length === 2 && p[1].length > 2) v = p[0] + '.' + p[1].substring(0, 2);
//   return v
// }
// const formatToTwoDecimals = (value) => {
//   const num = parseFloat(String(value).replace(/[₱,\s]/g, ''));
//   return isNaN(num) ? '' : Math.round(num * 100) / 100
// }
const blockNonNumeric = (e) => {
  const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  if (allowed.includes(e.key)) return;
  if (e.key === '.' && !e.target.value.includes('.')) return;
  if (!/^\d$/.test(e.key)) e.preventDefault()
}

// const blockNonNumericBir = (e) => {
//   const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
//   if (allowed.includes(e.key)) return
//   if (e.key === '.' && !birForm.value.dv_amount.includes('.')) return
//   if (/^\d$/.test(e.key)) return
//   e.preventDefault()
// }

// const blockNonNumericSk = (e) => {
//   const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
//   if (allowed.includes(e.key)) return
//   if (e.key === '.' && !skForm.value.amount.includes('.')) return
//   if (/^\d$/.test(e.key)) return
//   e.preventDefault()
// }

// const handlePasteNumeric = (e) => {
//   e.preventDefault();
//   const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/[^\d.]/g, '');
//   const p = paste.split('.');
//   store.forms.expense.amount = p[0] + (p.length > 1 ? '.' + p[1].substring(0, 2) : '')
// }

const canVoid = (row) => row.status === 'Unliquidated' || row.status === 'Partial'
const clearAllFilters = () => {
  selectedStatus.value = null;
  searchQuery.value = '';
  dateRange.value = null; store.dateFrom = '';
  store.dateTo = ''
}
const dateRangeDisplay = computed(() => {
  if (!dateRange.value?.from || !dateRange.value?.to) return '';
  const fmt = d => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  return `${fmt(dateRange.value.from)} - ${fmt(dateRange.value.to)}`
})

const onDateRangeChange = (r) => {
  if (r?.from && r?.to) {
    store.dateFrom = new Date(r.from).toLocaleDateString('en-GB');
    store.dateTo = new Date(r.to).toLocaleDateString('en-GB')
  } else {
    store.dateFrom = ''; store.dateTo = ''
  }
}
const onDateRangeClear = () => {
  dateRange.value = null;
  store.dateFrom = '';
  store.dateTo = ''
}
const getStatusColor = (s) => ({
  Unliquidated: 'blue', Partial: 'amber', Liquidated: 'green', 'Void Requested': 'deep-orange', Voided: 'red', Stale: 'purple'
}[s] || 'grey')
const getStatusTextColor = (s) => ['Unliquidated', 'Partial', 'Liquidated', 'Void Requested', 'Voided', 'Stale'].includes(s) ? 'white' : 'black'
const userPosition = computed(() => authStore.user?.position_name || '')
const isTreasurer = computed(() => /treasurer/i.test(userPosition.value))
const isApprover = computed(() => /(captain|chairperson)/i.test(userPosition.value))
const currentFiscalYear = computed(() => new Date().getFullYear())
// const currentBankLabel = computed(() => bankStore.banks?.find(b => b.id === store.forms.disbursement.bank_id)?.name || 'Select Bank')
const currentStatusLabel = computed(() => statusOptions.find(o => o.value === selectedStatus.value)?.label || 'All Status')
const loadAllData = async () => {
  if (loading.value) return
  loading.value = true;
  try {
    await Promise.all([store.fetchDisbursements(), bankStore.fetchBanks()]);
    console.log('Available banks:', bankStore.availableBanks)
    store.refreshExpenseAccountsWithBalances().catch(() => { })
  } finally {
    loading.value = false;
    initialLoading.value = false
  }
}
const refreshData = async () => {
  await loadAllData()
}
const applyNavigationFilters = () => {
  const q = route.query; if (q.search) {
    searchQuery.value = q.search;
    store.searchQuery = q.search
  };
  if (q.status) selectedStatus.value = q.status;
  if (q.dateFrom && q.dateTo) {
    const from = new Date(q.dateFrom), to = new Date(q.dateTo);
    if (!isNaN(from) && !isNaN(to)) {
      dateRange.value = {
        from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0]
      };
      store.dateFrom = from.toLocaleDateString('en-GB');
      store.dateTo = to.toLocaleDateString('en-GB')
    }
  }
}
onMounted(async () => {
  applyNavigationFilters();
  await loadAllData();
  const { logPageVisit } = usePageLogging(); await logPageVisit('Current Disbursement')
})

watch(() => route.query, (nq, oq) => {
  if (JSON.stringify(nq) !== JSON.stringify(oq)) applyNavigationFilters()
}, {
  deep: true
})
watch(() => store.dialogs.expense, async (open) => {
  if (open && store.expenseAccounts.length === 0) store.refreshExpenseAccountsWithBalances()
})

const handleAddExpense = async () => {
  addingExpense.value = true;
  try {
    await store.openDialog('expense')
  }
  finally { addingExpense.value = false }
}
const preloadExpenseAccounts = () => {
  if (!store.expenseAccounts.length && !store.expenseAccountsLoading) store.refreshExpenseAccountsWithBalances().catch(() => { })
}
// const handleSaveExpense = async () => {
//   const e = store.forms.expense; if (!e.account) return $q.notify({ type: 'negative', message: 'Select an account', position: 'top' });
//   if (!e.amount || parseFloat(e.amount) <= 0) return $q.notify({ type: 'negative', message: 'Enter a valid amount', position: 'top' });
//   if (parseFloat(e.amount) > e.balance) return $q.notify({ type: 'negative', message: 'Amount exceeds balance', position: 'top' }); 
//   await store.saveExpense()
// }
const handleDeleteExpense = async (row) => { await store.deleteItem(row) }
const handleEnterKey = (e) => { if (e) e.preventDefault() }
const handleSaveClick = async () => {
  const f = store.forms.disbursement

  if (!f.date || !f.dvNumber || !f.payee) {
    return $q.notify({ type: 'negative', message: 'Fill all required fields', position: 'top' })
  }

  if (!store.expenses?.length) {
    return $q.notify({ type: 'negative', message: 'Add at least one expense', position: 'top' })
  }

  const invalidExpense = store.expenses.find(e =>
    !e.bank_id || !e.cheque_number || !e.particular || !e.amount
  )

  if (invalidExpense) {
    return $q.notify({
      type: 'negative',
      message: 'Each expense must have bank, cheque number, particular, and amount',
      position: 'top'
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
  } else if (name === 'expense' || name === 'expenseDetail') {
    store.resetForm('expense')
  } else if (name === 'void') {
    store.resetForm('void')
  }
  store.closeDialog(name)
}

const handleVoidDisbursement = (row) => store.openVoidDialog(row)
const handleSubmitVoidRequest = async () => {
  if (!store.forms.void.remarks?.trim()) return $q.notify({ type: 'negative', message: 'Remarks required', position: 'top' });
  const res = await store.submitVoidRequest();
  if (res.success) {
    $q.notify({ type: 'positive', message: 'Void request submitted!', position: 'top' });
    await refreshData()
  } else $q.notify({ type: 'negative', message: res.message || 'Failed', position: 'top' })
}
const handleDirectVoidDisbursement = (row) => {
  $q.dialog({
    title: 'Void Disbursement', message: 'Provide remarks:', prompt: {
      model: '', type: 'textarea', isValid: v => !!v?.trim()
    },
    cancel: true, persistent: true
  }).onOk(async (remarks) => {
    const res = await store.voidDisbursementDirectly(row.id, remarks?.trim() || '');
    if (res.success) $q.notify({ type: 'positive', message: 'Voided successfully!', position: 'top' });
    else $q.notify({ type: 'negative', message: res.message || 'Failed', position: 'top' })
  })
}

const getOpenRow = (row) => ({
  ...row,
  id: row.disbursement_id || row.id,
})

const handleEditDisbursement = async (row) => {
  try {
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
// const handleViewDisbursement = async (row) => {
//   viewLoading.value[row.id] = true; try {
//     if (hasRemarks(row)) openRemarksDialog(row);
//     else await store.openViewOrDetails(row)
//   } finally {
//     viewLoading.value[row.id] = false
//   }
// }

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
  liquidateLoading.value[row.id] = true;
  try {
    await store.openOrDetailsDialog(row)
  } finally {
    liquidateLoading.value[row.id] = false
  }
}
const hasRemarks = (row) => (row.status === 'Void Requested' && row.remarks) || (row.status === 'Voided' && row.remarks) || row.rejection_remarks
const openRemarksDialog = (row) => {
  selectedRemarksData.value = row;
  remarksDialog.value = true
}
const closeRemarksDialog = () => {
  remarksDialog.value = false;
  selectedRemarksData.value = null
}
const openViewOrDetailsFromRemarks = async () => {
  const data = { ...selectedRemarksData.value };
  closeRemarksDialog();
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
</style>