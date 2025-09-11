<template>
  <q-page class="q-pa-md appropriation-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">Appropriation Transaction</div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="loadAppropriation"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Budget Type Selection Cards -->
    <div class="budget-type-selection q-mb-md">
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Budget Type</div>
      <div class="row q-col-gutter-sm">
        <div class="col-md-4 col-sm-12">
          <q-card
            :class="['budget-type-card', { selected: selectedBudgetType === 'all' }]"
            @click="selectedBudgetType = 'all'"
            clickable
          >
            <q-card-section class="text-center q-pa-md">
              <q-icon name="list" size="md" class="q-mb-sm" />
              <div class="text-subtitle2 text-weight-medium">All Budgets</div>
              <div class="text-caption text-grey-6">View all budget types</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-4 col-sm-12">
          <q-card
            :class="['budget-type-card', { selected: selectedBudgetType === 'annual' }]"
            @click="selectedBudgetType = 'annual'"
            clickable
          >
            <q-card-section class="text-center q-pa-md">
              <q-icon name="calendar_today" size="md" class="q-mb-sm" />
              <div class="text-subtitle2 text-weight-medium">Annual Budget</div>
              <div class="text-caption text-grey-6">
                {{ annualBudgetCount }} budget{{ annualBudgetCount !== 1 ? 's' : '' }}
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-4 col-sm-12">
          <q-card
            :class="['budget-type-card', { selected: selectedBudgetType === 'supplemental' }]"
            @click="selectedBudgetType = 'supplemental'"
            clickable
          >
            <q-card-section class="text-center q-pa-md">
              <q-icon name="add_circle" size="md" class="q-mb-sm" />
              <div class="text-subtitle2 text-weight-medium">Supplemental Budget</div>
              <div class="text-caption text-grey-6">
                {{ supplementalBudgetCount }} budget{{ supplementalBudgetCount !== 1 ? 's' : '' }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Budget Summary Cards -->
    <div class="budget-summary q-mb-md" v-if="selectedBudgetType === 'all'">
      <div class="row q-col-gutter-md">
        <div class="col-md-4 col-sm-12">
          <q-card class="summary-card annual-budget">
            <q-card-section class="text-center">
              <div class="text-h6 text-primary">Annual Budget</div>
              <div class="text-h5 text-weight-bold">
                {{ appropriationStore.formatCurrency(annualBudgetTotal) }}
              </div>
              <div class="text-caption text-grey-6">
                {{ annualBudgetCount }} budget{{ annualBudgetCount !== 1 ? 's' : '' }}
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-4 col-sm-12">
          <q-card class="summary-card supplemental-budget">
            <q-card-section class="text-center">
              <div class="text-h6 text-secondary">Supplemental Budget</div>
              <div class="text-h5 text-weight-bold">
                {{ appropriationStore.formatCurrency(supplementalBudgetTotal) }}
              </div>
              <div class="text-caption text-grey-6">
                {{ supplementalBudgetCount }} budget{{ supplementalBudgetCount !== 1 ? 's' : '' }}
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-4 col-sm-12">
          <q-card class="summary-card transfer-summary">
            <q-card-section class="text-center">
              <div class="text-h6 text-accent">Transfer Activity</div>
              <div class="text-h5 text-weight-bold">
                {{ appropriationStore.formatCurrency(totalTransferredAmount) }}
              </div>
              <div class="text-caption text-grey-6">
                Total transferred this period
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <q-card flat bordered class="q-mb-md filters-section">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Search Input -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-item-label class="q-mb-xs text-weight-medium">Search:</q-item-label>
            <q-input
              outlined
              dense
              v-model="appropriationStore.searchQuery"
              placeholder="Search description..."
              clearable
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
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
              outlined
              color="red-10"
              icon="clear_all"
              label="Clear"
              @click="clearAllFilters"
              class="full-width btn-match-input"
            />
          </div>

          <!-- Flexible spacer to push Add button to the right -->
          <div class="col"></div>

          <!-- Transfer Button -->
          <div class="col-auto">
            <q-btn
              label="Transfer"
              color="secondary"
              icon="swap_horiz"
              @click="openTransferDialog"
              :disable="supplementalBudgets.length === 0 || annualBudgets.length === 0"
              class="full-width btn-match-input"
              v-permission="'add'"
            />
          </div>

          <!-- Add Button - Hidden for supplemental budget -->
          <div class="col-auto" v-if="selectedBudgetType !== 'supplemental'">
            <q-btn
              label="Add"
              color="primary"
              icon="add"
              @click="addBudget"
              :loading="addLoading"
              :disable="addLoading"
              class="full-width btn-match-input"
              v-permission="'add'"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Add Budget Dialog -->
    <q-dialog v-model="showDialog" @keydown.enter="handleEnterKey">
      <q-card style="min-width: 500px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Add New Budget</div>
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <q-select
            outlined
            v-model="selectedFiscalYear"
            :options="accountLibraryStore.yearOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Fiscal Year"
            :rules="[(val) => !!val || 'Required']"
            @keydown.enter="handleEnterKey"
          />

          <q-input
            outlined
            v-model="startDate"
            label="Start Date"
            mask="date"
            :rules="['date']"
            @keydown.enter="handleEnterKey"
          >
            <template v-slot:append>
              <q-icon name="event">
                <q-popup-proxy>
                  <q-date v-model="startDate" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-select
            outlined
            v-model="budgetType"
            :options="budgetTypeOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Budget Type"
            :rules="[(val) => !!val || 'Required']"
            @keydown.enter="handleEnterKey"
          />

          <q-input
            outlined
            v-model="description"
            label="Description"
            @keydown.enter="handleEnterKey"
          />

          <q-input
            outlined
            :model-value="formatInputValue(amount)"
            @update:model-value="handleAmountInput"
            @blur="handleAmountBlur"
            label="Amount"
            prefix="₱"
            @keydown.enter="handleEnterKey"
            placeholder="0.00"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn label="Save" color="primary" @click="saveBudget" :loading="addLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Data Table -->
    <q-card flat bordered class="table-container">
      <q-table
        :rows="appropriationStore.filteredAppropriations"
        :columns="columns"
        :loading="appropriationStore.loading"
        row-key="id"
        flat
      >
        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ props.pageIndex + 1 }}
          </q-td>
        </template>

        <template v-slot:body-cell-amount="props">
          <q-td :props="props">
            {{ appropriationStore.formatCurrency(props.row.amount) }}
          </q-td>
        </template>

        <template v-slot:body-cell-unappropriated="props">
          <q-td :props="props">
            {{ appropriationStore.formatCurrency(props.row.unappropriated) }}
          </q-td>
        </template>

        <template v-slot:body-cell-budgetType="props">
          <q-td :props="props">
            <q-badge
              :color="getBudgetTypeColor(props.row.description)"
              :label="getBudgetTypeLabel(props.row.description)"
              class="budget-type-badge"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-description="props">
          <q-td :props="props">
            <span>{{ getDescriptionOnly(props.row.description) }}</span>
          </q-td>
        </template>

        <template v-slot:body-cell-commit="props">
          <q-td :props="props">
            <q-btn
              dense
              label="Commit"
              :color="props.row.unappropriated <= 0 ? 'grey' : 'primary'"
              @click="openAllocationDialog(props.row)"
              :disable="props.row.unappropriated <= 0"
              v-permission="'add'"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-xs">
              <!-- Edit button - hidden for supplemental budgets -->
              <q-btn
                v-if="selectedBudgetType !== 'supplemental'"
                dense
                icon="edit"
                color="orange"
                @click="openEditAllocationDialog(props.row)"
                :disable="
                  !props.row.allocations ||
                  props.row.allocations.length === 0 ||
                  editLoading[props.row.id]
                "
                :loading="editLoading[props.row.id]"
                v-permission="'edit'"
              />
              <q-btn
                dense
                icon="visibility"
                color="blue"
                @click="openViewDialog(props.row)"
                :loading="viewLoading[props.row.id]"
                :disable="viewLoading[props.row.id]"
                v-permission="'view'"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <CommitDialog />
    <ViewCommitDialog ref="viewDialogRef" />

    <!-- Supplemental Budget View Dialog -->
    <q-dialog v-model="showSupplementalViewDialog">
      <q-card style="min-width: 900px; max-width: 90vw">
        <q-card-section class="q-pb-none">
          <div class="row items-center justify-between">
            <div class="text-h6">View Supplemental Budget Details</div>
            <q-btn icon="close" flat round dense @click="showSupplementalViewDialog = false" />
          </div>
        </q-card-section>

        <q-card-section>
          <!-- Summary section -->
          <div class="row q-mb-md q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="text-caption">Description:</div>
              <strong>{{ selectedSupplementalRow.description || '-' }}</strong>
            </div>

            <div class="col-12 col-sm-6">
              <div class="text-caption">Created Date:</div>
              <strong>{{ selectedSupplementalRow.created_at || '-' }}</strong>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption">Total Amount:</div>
              <strong>{{
                appropriationStore.formatCurrency(selectedSupplementalRow.amount)
              }}</strong>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption">Available for Transfer:</div>
              <strong>{{
                appropriationStore.formatCurrency(selectedSupplementalRow.unappropriated)
              }}</strong>
            </div>
          </div>

          <!-- Transferred Funds in this supplemental budget -->
          <div class="q-mb-md">
            <div class="text-h6 text-weight-medium q-mb-sm">
              Transferred Funds in this Supplemental Budget
            </div>
            <div class="text-caption q-mb-sm">
              These funds were transferred from unused expenses and are available for transfer to
              annual budgets
            </div>

            <div class="hierarchical-table" style="border: 1px solid #e0e0e0">
              <div class="row q-pa-sm bg-grey-2 text-weight-medium">
                <div class="col-6">Account</div>
                <div class="col-6 text-right">Amount (₱)</div>
              </div>

              <div class="hierarchical-body">
                <!-- Loading state -->
                <div v-if="loadingSupplementalData" class="row q-pa-sm">
                  <div class="col-12 text-center text-grey-6">
                    <q-spinner size="1.5em" class="q-mb-xs" />
                    <div>Loading appropriation details...</div>
                  </div>
                </div>
                <!-- Data loaded -->
                <template
                  v-else-if="
                    selectedSupplementalRow.appropriations &&
                    selectedSupplementalRow.appropriations.length > 0
                  "
                >
                  <div
                    v-for="appropriation in selectedSupplementalRow.appropriations"
                    :key="'appropriation-' + appropriation.id"
                    class="row q-pa-sm"
                    style="border-bottom: 1px solid #f0f0f0"
                  >
                    <div class="col-6">
                      <div class="text-weight-medium">
                        {{ appropriation.account_name || 'Unknown Account' }}
                      </div>
                    </div>
                    <div class="col-6 text-right">
                      <div class="text-weight-medium">
                        {{ appropriationStore.formatCurrency(appropriation.amount) }}
                      </div>
                    </div>
                  </div>
                </template>
                <!-- No data -->
                <div v-else class="row q-pa-sm">
                  <div class="col-12 text-center text-grey-6">
                    <q-icon name="info" size="1.5em" class="q-mb-xs" />
                    <div>No appropriation details available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Transfer Information -->
          <div class="q-mb-md">
            <div class="text-h6 text-weight-medium q-mb-sm">Transfer Information</div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-card flat bordered class="q-pa-md">
                  <div class="text-caption text-grey-7">Purpose</div>
                  <div class="text-h6 text-primary">Available for Transfer</div>
                </q-card>
              </div>
              <div class="col-12 col-sm-6">
                <q-card flat bordered class="q-pa-md">
                  <div class="text-caption text-grey-7">Available Amount</div>
                  <div class="text-h6 text-secondary">
                    {{ appropriationStore.formatCurrency(selectedSupplementalRow.unappropriated) }}
                  </div>
                </q-card>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Allocation Dialog -->
    <q-dialog v-model="showEditAllocationDialog">
      <q-card style="min-width: 900px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Edit Allocation</div>
        </q-card-section>

        <q-card-section>
          <div class="hierarchical-table" style="border: 1px solid #e0e0e0">
            <div class="row q-pa-sm bg-grey-2 text-weight-medium">
              <div class="col-6">Type</div>
              <div class="col-6 text-right">Amount (₱)</div>
            </div>

            <div class="hierarchical-body" style="max-height: 400px; overflow-y: auto">
              <template
                v-for="expenseClass in editDisplayAccounts"
                :key="'class-' + expenseClass.id"
              >
                <div class="row q-pa-sm bg-grey-1 text-weight-medium">
                  <div class="col-12">{{ expenseClass.name }}</div>
                </div>

                <template
                  v-for="expenseType in expenseClass.children"
                  :key="'type-' + expenseType.id"
                >
                  <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                    <div
                      class="col-6"
                      style="padding-left: 16px; display: flex; align-items: center"
                    >
                      <q-btn
                        dense
                        flat
                        :icon="
                          expenseType.children &&
                          expenseType.children.length > 0 &&
                          expandedEditTypes[expenseType.id]
                            ? 'expand_more'
                            : 'chevron_right'
                        "
                        @click="
                          expenseType.children && expenseType.children.length > 0
                            ? toggleEditType(expenseType.id)
                            : null
                        "
                        size="sm"
                      />
                      <span>{{ expenseType.name }}</span>
                    </div>
                    <div class="col-6 text-right">
                      <q-input
                        v-if="canEditType(expenseType)"
                        :model-value="formatInputValue(expenseType.amount)"
                        @update:model-value="(val) => handleEditAmountInput(expenseType, val)"
                        @blur="(event) => handleEditAmountBlur(expenseType, event.target.value)"
                        @keypress="blockNonNumeric"
                        dense
                        outlined
                        class="edit-allocation-input"
                        :class="{ 'text-negative': typeErrorMap[expenseType.id] }"
                        prefix="₱"
                        placeholder="0.00"
                      />
                      <div v-else class="text-weight-medium">
                        {{ appropriationStore.formatCurrency(calculateTypeTotal(expenseType)) }}
                      </div>
                    </div>
                  </div>

                  <template
                    v-if="
                      expandedEditTypes[expenseType.id] &&
                      expenseType.children &&
                      expenseType.children.length > 0
                    "
                  >
                    <template
                      v-for="expenseItem in expenseType.children"
                      :key="'item-' + expenseItem.id"
                    >
                      <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                        <div
                          class="col-6"
                          style="padding-left: 32px; display: flex; align-items: center"
                        >
                          <q-icon name="arrow_right" size="xs" class="q-mr-xs" />
                          <span :class="expenseItem.children && expenseItem.children.length > 0 ? 'text-weight-bold' : 'text-weight-regular'">{{ expenseItem.name }}</span>
                        </div>
                        <div class="col-6 text-right">
                          <!-- Only show input if item has no sub-items -->
                          <template v-if="!expenseItem.children || expenseItem.children.length === 0">
                            <q-input
                              :model-value="formatInputValue(expenseItem.amount)"
                              @update:model-value="(val) => handleEditAmountInput(expenseItem, val)"
                              @blur="(event) => handleEditAmountBlur(expenseItem, event.target.value)"
                              @keypress="blockNonNumeric"
                              dense
                              outlined
                              class="edit-allocation-input"
                              prefix="₱"
                              placeholder="0.00"
                            />
                          </template>
                          <!-- Show amount display if item has sub-items -->
                          <template v-else>
                            <span class="text-weight-regular">{{ appropriationStore.formatCurrency(calculateItemTotal(expenseItem)) }}</span>
                          </template>
                        </div>
                      </div>
                      <!-- Sub-Item Rows (only if item has sub-items) -->
                      <template v-if="expenseItem.children && expenseItem.children.length > 0">
                        <template v-for="expenseSubItem in expenseItem.children" :key="'subitem-' + expenseSubItem.id">
                          <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                            <div class="col-6" style="padding-left: 48px; display: flex; align-items: center">
                              <q-icon name="arrow_right" size="xs" class="q-mr-xs" />
                              <span class="text-weight-regular">{{ expenseSubItem.name }}</span>
                            </div>
                            <div class="col-6 text-right">
                              <q-input
                                :model-value="formatInputValue(expenseSubItem.amount)"
                                @update:model-value="(val) => handleEditAmountInput(expenseSubItem, val)"
                                @blur="(event) => handleEditAmountBlur(expenseSubItem, event.target.value)"
                                @keypress="blockNonNumeric"
                                dense
                                outlined
                                class="edit-allocation-input"
                                prefix="₱"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </template>
                      </template>
                    </template>
                  </template>
                </template>
              </template>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            label="Cancel"
            v-close-popup
            @click="closeEditAllocationDialog"
            :disable="editSaveLoading"
          />
          <q-btn
            label="Save Changes"
            color="primary"
            @click="saveEditedAllocation"
            :loading="editSaveLoading"
            :disable="editSaveLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Transfer Budget Dialog -->
    <q-dialog v-model="showTransferDialog">
      <q-card style="min-width: 600px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Transfer from Supplemental to Annual Budget</div>
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <q-select
            outlined
            v-model="selectedSupplementalBudget"
            :options="supplementalBudgets"
            option-label="description"
            option-value="id"
            emit-value
            map-options
            label="From Supplemental Budget"
            :rules="[(val) => !!val || 'Required']"
            @update:model-value="onSupplementalBudgetChange"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.description }}</q-item-label>
                  <q-item-label caption>
                    Available: {{ appropriationStore.formatCurrency(scope.opt.unused_amount || 0) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Available Balance Display -->
          <div v-if="selectedSupplementalBudget" class="q-mt-sm q-mb-md">
            <q-card flat bordered class="bg-primary-1">
              <q-card-section class="q-pa-md">
                <div class="row items-center">
                  <div class="col">
                    <div class="text-caption text-grey-7">Available Balance for Transfer</div>
                    <div class="text-h6 text-green-8">
                      {{
                        appropriationStore.formatCurrency(
                          getSelectedSupplementalBudget()?.unused_amount || 0,
                        )
                      }}
                    </div>
                    <div class="text-caption text-grey-6 q-mt-xs">
                      Maximum transferable amount
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-icon name="account_balance_wallet" size="24px" color="green-6" />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Transfer Amount Validation Display -->
          <div v-if="transferAmount && selectedSupplementalBudget" class="q-mt-sm q-mb-md">
            <q-card flat bordered :class="getTransferValidationClass()">
              <q-card-section class="q-pa-sm">
                <div class="row items-center">
                  <div class="col">
                    <div class="text-caption text-grey-7">Transfer Validation</div>
                    <div class="text-subtitle2" :class="getTransferValidationTextClass()">
                      {{ getTransferValidationMessage() }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-icon :name="getTransferValidationIcon()" :color="getTransferValidationColor()" size="20px" />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <q-select
            outlined
            v-model="selectedAnnualBudget"
            :options="annualBudgets"
            option-label="description"
            option-value="id"
            emit-value
            map-options
            label="To Annual Budget"
            :rules="[(val) => !!val || 'Required']"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.description }}</q-item-label>
                  <q-item-label caption>
                    Unappropriated:
                    {{ appropriationStore.formatCurrency(scope.opt.unappropriated) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-input
            outlined
            :model-value="formatInputValue(transferAmount)"
            @update:model-value="handleTransferAmountInput"
            @blur="handleTransferAmountBlur"
            label="Transfer Amount"
            prefix="₱"
            placeholder="0.00"
            type="text"
            inputmode="decimal"
            step="0.01"
            min="0"
            :rules="[
              (val) => {
                const cleanVal = val ? String(val).replace(/[₱,\s]/g, '') : ''
                if (!cleanVal || cleanVal === '') return 'Transfer amount is required'
                const num = parseCurrency(val)
                return !isNaN(num) && num > 0 || 'Amount must be greater than 0'
              },
              (val) => {
                const cleanVal = val ? String(val).replace(/[₱,\s]/g, '') : ''
                if (!cleanVal || cleanVal === '') return true
                if (!selectedSupplementalBudget) return true
                const supplementalBudget = supplementalBudgets.find(
                  (b) => b.id === selectedSupplementalBudget,
                )
                const availableAmount = supplementalBudget?.unused_amount || 0
                const requestedAmount = parseCurrency(val) || 0
                return (
                  !supplementalBudget ||
                  requestedAmount <= availableAmount ||
                  `Amount cannot exceed available balance of ₱${availableAmount.toLocaleString()}`
                )
              },
              (val) => {
                const cleanVal = val ? String(val).replace(/[₱,\s]/g, '') : ''
                if (!cleanVal || cleanVal === '') return true
                const num = parseCurrency(val)
                return num <= 10000000 || 'Amount cannot exceed ₱10,000,000'
              }
            ]"
            @keypress="blockNonNumeric"
            @paste.prevent="handlePasteNumeric"
            reactive-rules
          />

          <q-input
            outlined
            v-model="transferDescription"
            label="Transfer Description (Optional)"
            hint="Leave blank for auto-generated description"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            label="Cancel"
            v-close-popup
            @click="closeTransferDialog"
            :disable="transferLoading"
          />
          <q-btn

            color="secondary"
            @click="executeTransfer"
            :loading="transferLoading"
            :disable="!canTransfer || transferLoading"
            :class="{ 'q-btn--loading': transferLoading }"

          >
            <template v-if="!transferLoading">
              <q-icon name="swap_horiz" class="q-mr-xs" />
              Transfer ₱{{ transferAmount ? parseCurrency(transferAmount).toLocaleString() : '0' }}
            </template>
            <template v-else>
              <q-spinner size="16px" class="q-mr-xs" />
              Processing Transfer...
            </template>
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>

  <!-- Mobile Action Buttons -->
  <div class="mobile-action-btn-container">
    <q-btn
      round
      dense
      color="secondary"
      icon="swap_horiz"
      class="mobile-transfer-btn"
      @click="openTransferDialog"
      :disable="supplementalBudgets.length === 0 || annualBudgets.length === 0"
      v-permission="'add'"
    />
    <q-btn
      v-if="selectedBudgetType !== 'supplemental'"
      round
      dense
      color="primary"
      icon="add"
      class="mobile-add-btn"
      @click="addBudget"
      :loading="addLoading"
      :disable="addLoading"
      v-permission="'add'"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import CommitDialog from 'components/appropriation/CommitDialog.vue'
import ViewCommitDialog from 'components/appropriation/ViewCommitDialog.vue'
import { useAppropriationStore } from 'stores/appropriationStore'
import { useAccountsLibraryStore } from 'stores/accountsLibstore'
import { api } from 'src/boot/axios'
import { usePageLogging } from '../../../composables/usePageLogging'
import { useAuthStore } from 'stores/auth'

const $q = useQuasar()
const accountLibraryStore = useAccountsLibraryStore()
const appropriationStore = useAppropriationStore()
const authStore = useAuthStore()

const showDialog = ref(false)
const selectedFiscalYear = ref(null)
const startDate = ref('')
const endDate = ref('')
const description = ref('')
const amount = ref(null)
const loading = ref(false)
const addLoading = ref(false)
const editSaveLoading = ref(false)
const dateRange = ref(null)
const selectedBudgetType = ref('all')
const budgetType = ref('annual')

const budgetTypeOptions = [{ label: 'Annual Budget', value: 'annual' }]

const loadAppropriation = async () => {
  loading.value = true
  try {
    // Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled([
      appropriationStore.fetchBudgets(),
      appropriationStore.fetchAppropriations()
    ])

    // Check for any failures
    const failures = results.filter(result => result.status === 'rejected')

    if (failures.length === 0) {
      $q.notify({
        type: 'positive',
        message: 'Appropriation data refreshed successfully!',
        icon: 'refresh',
        position: 'top',
        timeout: 3000
      })
    } else if (failures.length < results.length) {
      // Partial success
      $q.notify({
        type: 'warning',
        message: 'Some data could not be refreshed. Please try again.',
        icon: 'warning',
        position: 'top',
        timeout: 4000
      })
    } else {
      // Complete failure
      throw new Error('Failed to refresh data')
    }
  } catch (error) {
    console.error('Error loading appropriation data:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || error.message || 'Failed to refresh data',
      icon: 'error',
      position: 'top',
      timeout: 5000
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

// Budget summary computed properties
const annualBudgetTotal = computed(() => {
  return appropriationStore.appropriations
    .filter((budget) => budget.description?.toLowerCase().includes('annual'))
    .reduce((total, budget) => total + (parseFloat(budget.amount) || 0), 0)
})

const supplementalBudgetTotal = computed(() => {
  return appropriationStore.appropriations
    .filter((budget) => {
      const isSupplemental = budget.description?.toLowerCase().includes('supplemental')
      const hasUnappropriated = (budget.unappropriated || 0) > 0
      return isSupplemental && hasUnappropriated
    })
    .reduce((total, budget) => total + (parseFloat(budget.amount) || 0), 0)
})

const annualBudgetCount = computed(() => {
  return appropriationStore.appropriations.filter((budget) =>
    budget.description?.toLowerCase().includes('annual'),
  ).length
})

const supplementalBudgetCount = computed(() => {
  // Only count supplemental budgets that have unappropriated amount > 0
  return appropriationStore.appropriations.filter((budget) => {
    const isSupplemental = budget.description?.toLowerCase().includes('supplemental')
    const hasUnappropriated = (budget.unappropriated || 0) > 0
    return isSupplemental && hasUnappropriated
  }).length
})

// Calculate total transferred amount (difference between original and current amounts)
const totalTransferredAmount = computed(() => {
  return appropriationStore.appropriations
    .filter((budget) => budget.description?.toLowerCase().includes('supplemental'))
    .reduce((total, budget) => {
      // Calculate how much has been transferred by comparing original amount with current unappropriated
      const originalAmount = parseFloat(budget.amount) || 0
      const unappropriatedAmount = parseFloat(budget.unappropriated) || 0
      const transferredAmount = Math.max(0, originalAmount - unappropriatedAmount)
      return total + transferredAmount
    }, 0)
})

// Transfer functionality computed properties
const supplementalBudgets = computed(() => {
  return appropriationStore.appropriations
    .filter((budget) => budget.description?.toLowerCase().includes('supplemental'))
    .filter((budget) => {
      // Only show supplemental budgets that have unappropriated amount > 0
      // This will hide budgets that have been fully transferred
      return (budget.unappropriated || 0) > 0
    })
    .map((budget) => {
      // For supplemental budgets, use the unappropriated amount as available amount
      // This reflects the actual available amount after any transfers
      const availableAmount = budget.unappropriated || 0

      return {
        ...budget,
        unused_amount: availableAmount, // Use unappropriated amount as available for transfer
        available_amount: availableAmount,
      }
    })
})

const annualBudgets = computed(() => {
  return appropriationStore.appropriations.filter((budget) =>
    budget.description?.toLowerCase().includes('annual'),
  )
})

const canTransfer = computed(() => {
  if (
    !selectedSupplementalBudget.value ||
    !selectedAnnualBudget.value ||
    !transferAmount.value ||
    transferAmount.value === ''
  ) {
    return false
  }

  // Find the full supplemental budget object
  const supplementalBudget = supplementalBudgets.value.find(
    (budget) => budget.id === selectedSupplementalBudget.value,
  )
  if (!supplementalBudget) {
    return false
  }

  const amount = parseCurrency(transferAmount.value)
  const availableAmount = supplementalBudget.unused_amount || 0

  return !isNaN(amount) && amount > 0 && amount <= availableAmount
})



// Transfer validation helper functions
const getTransferValidationClass = () => {
  if (!transferAmount.value || !selectedSupplementalBudget.value) return 'bg-grey-1'

  const amount = parseCurrency(transferAmount.value)
  const availableAmount = getSelectedSupplementalBudget()?.unused_amount || 0

  if (isNaN(amount) || amount <= 0) return 'bg-orange-1'
  if (amount > availableAmount) return 'bg-red-1'
  if (amount > availableAmount * 0.9) return 'bg-yellow-1'
  return 'bg-green-1'
}

const getTransferValidationTextClass = () => {
  if (!transferAmount.value || !selectedSupplementalBudget.value) return 'text-grey-6'

  const amount = parseCurrency(transferAmount.value)
  const availableAmount = getSelectedSupplementalBudget()?.unused_amount || 0

  if (isNaN(amount) || amount <= 0) return 'text-orange-8'
  if (amount > availableAmount) return 'text-red-8'
  if (amount > availableAmount * 0.9) return 'text-yellow-8'
  return 'text-green-8'
}

const getTransferValidationMessage = () => {
  if (!transferAmount.value || !selectedSupplementalBudget.value) return 'Enter transfer amount'

  const amount = parseCurrency(transferAmount.value)
  const availableAmount = getSelectedSupplementalBudget()?.unused_amount || 0

  if (isNaN(amount) || amount <= 0) return 'Please enter a valid amount'
  if (amount > availableAmount) return `Amount exceeds available balance by ₱${(amount - availableAmount).toLocaleString()}`
  if (amount > availableAmount * 0.9) return `Transfer will use ${Math.round((amount / availableAmount) * 100)}% of available balance`
  return `Transfer amount is valid (${Math.round((amount / availableAmount) * 100)}% of available balance)`
}

const getTransferValidationIcon = () => {
  if (!transferAmount.value || !selectedSupplementalBudget.value) return 'help'

  const amount = parseCurrency(transferAmount.value)
  const availableAmount = getSelectedSupplementalBudget()?.unused_amount || 0

  if (isNaN(amount) || amount <= 0) return 'warning'
  if (amount > availableAmount) return 'error'
  if (amount > availableAmount * 0.9) return 'warning'
  return 'check_circle'
}

const getTransferValidationColor = () => {
  if (!transferAmount.value || !selectedSupplementalBudget.value) return 'grey-6'

  const amount = parseCurrency(transferAmount.value)
  const availableAmount = getSelectedSupplementalBudget()?.unused_amount || 0

  if (isNaN(amount) || amount <= 0) return 'orange-8'
  if (amount > availableAmount) return 'red-8'
  if (amount > availableAmount * 0.9) return 'yellow-8'
  return 'green-8'
}

const onDateRangeChange = (newRange) => {
  if (newRange && newRange.from && newRange.to) {
    const fromDate = new Date(newRange.from)
    const toDate = new Date(newRange.to)
    appropriationStore.dateFrom = fromDate.toLocaleDateString('en-GB')
    appropriationStore.dateTo = toDate.toLocaleDateString('en-GB')
  } else {
    appropriationStore.dateFrom = ''
    appropriationStore.dateTo = ''
  }
}

const onDateRangeClear = () => {
  dateRange.value = null
  appropriationStore.dateFrom = ''
  appropriationStore.dateTo = ''
}

// Helper function to get selected supplemental budget
const getSelectedSupplementalBudget = () => {
  if (!selectedSupplementalBudget.value) return null
  return supplementalBudgets.value.find((budget) => budget.id === selectedSupplementalBudget.value)
}

// Handle supplemental budget selection change
const onSupplementalBudgetChange = (value) => {
  selectedSupplementalBudget.value = value
  // Don't clear transfer amount automatically
}

const clearAllFilters = () => {
  appropriationStore.searchQuery = ''
  appropriationStore.dateFrom = ''
  appropriationStore.dateTo = ''
  dateRange.value = null
}

const showEditAllocationDialog = ref(false)
const editAllocations = ref([])
const expandedEditTypes = ref({})
const typeErrorMap = ref({})
const editDisplayAccounts = ref([])
const editLoading = ref({})
const viewLoading = ref({})

// Transfer functionality
const showTransferDialog = ref(false)
const transferLoading = ref(false)
const selectedSupplementalBudget = ref(null)
const selectedAnnualBudget = ref(null)
const transferAmount = ref('')
const transferDescription = ref('')

// Supplemental budget view dialog
const showSupplementalViewDialog = ref(false)
const loadingSupplementalData = ref(false)
const selectedSupplementalRow = ref({
  id: null,
  description: '',
  amount: 0,
  unappropriated: 0,
  created_at: '',
  appropriations: [],
})

const initializeEditDisplayAccounts = () => {
  if (!editAllocations.value || editAllocations.value.length === 0) {
    editDisplayAccounts.value = []
    return
  }

  const classMap = {}
  editAllocations.value.forEach((alloc) => {
    const classId = alloc.expense_class_id || 'unclassified'
    const className = alloc.expense_class_name || 'Unclassified'
    const typeId = alloc.expense_type_id
    const typeName = alloc.expense_type_name || `Type ${typeId}`
    const itemId = alloc.expense_item_id
    const itemName = alloc.expense_item_name || `Item ${itemId}`
    const subItemId = alloc.expense_sub_item_id
    const subItemName = alloc.expense_sub_item_name || `Sub-item ${subItemId}`

    if (!classMap[classId]) {
      classMap[classId] = {
        id: classId,
        name: className,
        children: [],
      }
    }

    if (typeId && !itemId) {
      const existingType = classMap[classId].children.find((t) => t.id === typeId)
      if (existingType) {
        existingType.amount += alloc.amount
      } else {
        classMap[classId].children.push({
          id: typeId,
          name: typeName,
          amount: alloc.amount,
          children: [],
        })
      }
    }

    if (itemId) {
      let type = classMap[classId].children.find((t) => t.id === typeId)
      if (!type) {
        type = {
          id: typeId,
          name: typeName,
          amount: 0,
          children: [],
        }
        classMap[classId].children.push(type)
      } else {
        type.amount = 0
      }

      // Check if this is a sub-item allocation
      if (subItemId) {
        // Handle sub-item allocation
        let item = type.children.find((i) => i.id === itemId)
        if (!item) {
          item = {
            id: itemId,
            name: itemName,
            amount: 0,
            children: [],
          }
          type.children.push(item)
        }

        // Add the sub-item
        item.children.push({
          id: subItemId,
          name: subItemName,
          amount: alloc.amount,
        })
      } else {
        // Handle regular item allocation
        let item = type.children.find((i) => i.id === itemId)
        if (item) {
          item.amount += alloc.amount
        } else {
          type.children.push({
            id: itemId,
            name: itemName,
            amount: alloc.amount,
            children: [],
          })
        }
      }
    }
  })

  const classArr = Object.values(classMap)
  classArr.forEach((cls) => {
    cls.children.sort((a, b) => a.id - b.id)
    cls.children.forEach((type) => {
      if (type.children) {
        type.children.sort((a, b) => a.id - b.id)
        type.children.forEach(item => {
          if (item.children) {
            item.children.sort((a, b) => a.id - b.id)
          }
        })
      }
    })
  })

  editDisplayAccounts.value = classArr
}

watch(
  () => editDisplayAccounts.value,
  (newVal) => {
    if (Array.isArray(newVal)) {
      const expanded = {}
      newVal.forEach((expenseClass) => {
        if (expenseClass && Array.isArray(expenseClass.children)) {
          expenseClass.children.forEach((expenseType) => {
            if (
              expenseType &&
              expenseType.id &&
              expenseType.children &&
              expenseType.children.length > 0
            ) {
              expanded[expenseType.id] = true
            }
          })
        }
      })
      expandedEditTypes.value = expanded
    }
  },
  { immediate: true },
)

const toggleEditType = (typeId) => {
  let hasChildren = false
  editDisplayAccounts.value.forEach((expenseClass) => {
    const expenseType = expenseClass.children?.find((type) => type.id === typeId)
    if (expenseType && expenseType.children && expenseType.children.length > 0) {
      hasChildren = true
    }
  })

  if (hasChildren) {
    expandedEditTypes.value[typeId] = !expandedEditTypes.value[typeId]
  }
}

const openAllocationDialog = async (row) => {
  await appropriationStore.openAllocationDialog(row)
}

const viewDialogRef = ref(null)

// Fetch appropriations data for supplemental budget
const fetchSupplementalBudgetAppropriations = async (budgetId) => {
  loadingSupplementalData.value = true
  try {
    const authStore = useAuthStore()
    const endpoint = authStore.admin
      ? `/api/admin/supplemental-budgets`
      : `/api/barangay/supplemental-budgets`
    const token = authStore.admin ? authStore.adminToken : authStore.token

    const params = { year: new Date().getFullYear() }

    // Add barangay filter for admin users
    if (authStore.admin) {
      const selectedBarangayId = authStore.getSelectedBarangay()
      if (selectedBarangayId) {
        params.barangay_id = selectedBarangayId
      }
    }

    const response = await api.get(endpoint, {
      params: params,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })

    const supplementalBudgets = response.data.data || []
    const targetBudget = supplementalBudgets.find((budget) => budget.id === budgetId)

    if (targetBudget) {
      selectedSupplementalRow.value = {
        id: targetBudget.id,
        description: targetBudget.description,
        amount: targetBudget.total_amount,
        unappropriated: targetBudget.unused_amount,
        created_at: targetBudget.created_at,
        appropriations: targetBudget.appropriations || [],
      }
    } else {
      // Fallback to current row data if not found in supplemental budgets
      const currentRow = appropriationStore.appropriations.find((budget) => budget.id === budgetId)
      selectedSupplementalRow.value = {
        ...currentRow,
        appropriations: [],
      }
    }
  } catch (error) {
    console.error('Failed to fetch supplemental budget appropriations:', error)
    // Fallback to current row data
    const currentRow = appropriationStore.appropriations.find((budget) => budget.id === budgetId)
    selectedSupplementalRow.value = {
      ...currentRow,
      appropriations: [],
    }
  } finally {
    loadingSupplementalData.value = false
  }
}

const openViewDialog = async (row) => {
  viewLoading.value[row.id] = true
  try {
    // Check if this is a supplemental budget
    if (row.description?.toLowerCase().includes('supplemental')) {
      // Fetch appropriations data for supplemental budget
      await fetchSupplementalBudgetAppropriations(row.id)
      showSupplementalViewDialog.value = true
    } else {
      // Open regular view dialog for annual budgets
      if (viewDialogRef.value) {
        await viewDialogRef.value.openDialog(row)
      } else {
        console.error('View dialog reference is not available')
      }
    }
  } catch (error) {
    console.error('Failed to open view dialog:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open view dialog',
      icon: 'error',
      position: 'top',
    })
  } finally {
    viewLoading.value[row.id] = false
  }
}

watch(selectedFiscalYear, (newYearId) => {
  if (newYearId) {
    const yearObj = accountLibraryStore.yearOptions.find((y) => y.value === newYearId)
    if (yearObj) {
      const today = new Date()
      const formattedToday = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
      startDate.value = formattedToday
      endDate.value = `${yearObj.yearValue}/12/31`
    }
  }
})

// Watch for budget type changes and sync with store
watch(selectedBudgetType, (newBudgetType) => {
  appropriationStore.setSelectedBudgetType(newBudgetType)
})

// Watch for changes in appropriations data to trigger reactive updates
watch(() => appropriationStore.appropriations, () => {
  // Force reactivity update for computed properties
  // This ensures indicators update when data changes
}, { deep: true })

const openEditAllocationDialog = async (row) => {
  editLoading.value[row.id] = true
  try {
    // Use different endpoints for admin vs regular users
    const endpoint = authStore.admin
      ? `/api/admin/budgets/${row.id}/history`
      : `/api/barangay/budgets/${row.id}/history`
    const token = authStore.admin ? authStore.adminToken : authStore.token

    const response = await api.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    const allHistory = response.data.data?.history || []

    // Combine ALL allocations from all history sessions, not just the latest
    const allAllocations = allHistory.flatMap((session) => session.allocations || [])

    // Group by expense hierarchy to combine amounts for the same expense items/types
    const allocationMap = new Map()


    allAllocations.forEach(allocation => {
      // Include sub-item ID in the key to properly distinguish sub-item allocations
      const key = `${allocation.expense_class_id}-${allocation.expense_type_id}-${allocation.expense_item_id || 'null'}-${allocation.expense_sub_item_id || 'null'}`


      if (allocationMap.has(key)) {
        // Add amounts for the same expense
        allocationMap.get(key).amount += allocation.amount
      } else {
        // Create new entry
        allocationMap.set(key, { ...allocation })
      }
    })

    editAllocations.value = Array.from(allocationMap.values())
    initializeEditDisplayAccounts()
    appropriationStore.selectedRow = row
    showEditAllocationDialog.value = true
  } catch (error) {
    console.error('Failed to load allocation details for editing:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load allocation details for editing',
      icon: 'error',
      position: 'top',
    })
  } finally {
    editLoading.value[row.id] = false
  }
}

const closeEditAllocationDialog = () => {
  showEditAllocationDialog.value = false
  typeErrorMap.value = {}
  editDisplayAccounts.value = []
}

// Transfer functions
const openTransferDialog = () => {
  selectedSupplementalBudget.value = null
  selectedAnnualBudget.value = null
  transferAmount.value = ''
  transferDescription.value = ''
  showTransferDialog.value = true
}

const closeTransferDialog = () => {
  showTransferDialog.value = false
  selectedSupplementalBudget.value = null
  selectedAnnualBudget.value = null
  transferAmount.value = ''
  transferDescription.value = ''
}

const executeTransfer = async () => {
  // Enhanced validation
  if (!canTransfer.value) {
    $q.notify({
      type: 'negative',
      message: 'Please fill in all required fields and ensure transfer amount is valid',
      icon: 'error',
      position: 'top',
    })
    return
  }

  // Prevent multiple executions
  if (transferLoading.value) {
    return
  }

  // Additional validation before transfer
  if (!transferAmount.value || transferAmount.value === '') {
    $q.notify({
      type: 'negative',
      message: 'Please enter a transfer amount',
      icon: 'error',
      position: 'top',
    })
    return
  }

  const transferAmountNum = parseCurrency(transferAmount.value)
  if (isNaN(transferAmountNum) || transferAmountNum <= 0) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a valid transfer amount greater than 0',
      icon: 'error',
      position: 'top',
    })
    return
  }

  // Validate supplemental budget has sufficient funds
  const supplementalBudget = getSelectedSupplementalBudget()
  if (!supplementalBudget || transferAmountNum > (supplementalBudget.unused_amount || 0)) {
    $q.notify({
      type: 'negative',
      message: 'Insufficient funds in selected supplemental budget',
      icon: 'error',
      position: 'top',
    })
    return
  }

  // Show confirmation dialog for transfers
  const fromBudget = supplementalBudgets.value.find(b => b.id === selectedSupplementalBudget.value)
  const toBudget = annualBudgets.value.find(b => b.id === selectedAnnualBudget.value)

  const confirmed = await new Promise((resolve) => {
    $q.dialog({
      title: 'Confirm Budget Transfer',
      message: `
        <div class="q-pa-md">
          <div class="text-h6 q-mb-md">Transfer Details</div>
          <div class="q-mb-sm">
            <strong>From:</strong> ${fromBudget?.description || 'Supplemental Budget'}<br>
            <strong>To:</strong> ${toBudget?.description || 'Annual Budget'}<br>
            <strong>Amount:</strong> ₱${transferAmountNum.toLocaleString()}
          </div>
          ${transferDescription.value ? `<div class="q-mb-sm"><strong>Description:</strong> ${transferDescription.value}</div>` : ''}
          <div class="text-caption text-grey-6 q-mt-md">
            ${transferAmountNum > 100000 ? '⚠️ This is a large transfer amount. Please verify all details before proceeding.' : 'Please verify all details before proceeding.'}
          </div>
        </div>
      `,
      html: true,
      persistent: true,
      ok: {
        label: 'Confirm Transfer',
        color: 'primary',
        icon: 'check_circle'
      },
      cancel: {
        label: 'Cancel',
        color: 'grey',
        icon: 'cancel'
      }
    }).onOk(() => resolve(true)).onCancel(() => resolve(false))
  })

  if (!confirmed) return

  // Snapshot current selections BEFORE closing (closing clears refs)
  const snapshotFromBudgetId = selectedSupplementalBudget.value
  const snapshotToBudgetId = selectedAnnualBudget.value
  const snapshotAmount = transferAmountNum
  const snapshotDescription = transferDescription.value?.trim() || null
  const snapshotFromBudget = supplementalBudgets.value.find(b => b.id === snapshotFromBudgetId)
  const snapshotToBudget = annualBudgets.value.find(b => b.id === snapshotToBudgetId)

  // Close dialog immediately after confirmation
  closeTransferDialog()

  transferLoading.value = true

  try {
    const payload = {
      from_budget_id: snapshotFromBudgetId,
      to_budget_id: snapshotToBudgetId,
      amount: snapshotAmount,
      description: snapshotDescription,
    }

    // Debug logging
    console.log('Transfer payload:', payload)
    console.log('Selected supplemental budget:', snapshotFromBudgetId)
    console.log('Selected annual budget:', snapshotToBudgetId)
    console.log('Transfer amount:', snapshotAmount)

    // Call the transfer API with enhanced error handling
    const authStore = useAuthStore()
    const endpoint = authStore.admin
      ? '/api/admin/budget-transfer'
      : '/api/barangay/budget-transfer'
    const token = authStore.admin ? authStore.adminToken : authStore.token

    console.log('API endpoint:', endpoint)
    console.log('Auth token exists:', !!token)

    const response = await api.post(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout for large transfers
    })

    if (response.data?.status) {
      // Success notification with detailed information (use snapshots)
      const fromBudget = snapshotFromBudget
      const toBudget = snapshotToBudget

      $q.notify({
        type: 'positive',
        message: `Successfully transferred ₱${snapshotAmount.toLocaleString()} from "${fromBudget?.description || 'Supplemental Budget'}" to "${toBudget?.description || 'Annual Budget'}"`,
        icon: 'check_circle',
        position: 'top',
        timeout: 5000,
        actions: [
          {
            label: 'View Details',
            color: 'white',
            handler: () => {
              // Could open a detailed view here
            }
          }
        ]
      })

      // Refresh data in background
      refreshDataAfterTransfer()
    } else {
      throw new Error(response.data?.message || 'Transfer failed - no status returned')
    }
  } catch (error) {
    console.error('Transfer error:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    console.error('Error headers:', error.response?.headers)

    let errorMessage = 'Failed to transfer budget'
    let errorDetails = ''

    if (error.response?.data) {
      console.log('Full error response data:', JSON.stringify(error.response.data, null, 2))
      
      if (error.response.data.message) {
        errorMessage = error.response.data.message
      }

      if (error.response.data.errors) {
        // Handle validation errors with detailed feedback
        const errors = error.response.data.errors
        console.log('Validation errors:', errors)
        const errorMessages = Object.entries(errors).map(([field, messages]) => {
          const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
        })
        errorDetails = errorMessages.join('\n')
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Transfer request timed out. Please try again.'
    } else if (error.message) {
      errorMessage = error.message
    }

    // Show detailed error notification
    $q.notify({
      type: 'negative',
      message: errorMessage,
      caption: errorDetails,
      icon: 'error',
      position: 'top',
      timeout: 8000,
      actions: [
        {
          label: 'Retry',
          color: 'white',
          handler: () => {
            // Allow user to retry the transfer
            executeTransfer()
          }
        }
      ]
    })
  } finally {
    transferLoading.value = false
  }
}

// Enhanced data refresh function
const refreshDataAfterTransfer = async () => {
  try {
    // Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled([
      appropriationStore.fetchBudgets(),
      appropriationStore.fetchAppropriations()
    ])

    // Check for any failures
    const failures = results.filter(result => result.status === 'rejected')

    if (failures.length > 0) {
      console.warn('Some data refresh operations failed:', failures)
      // Show warning but don't block the user
      $q.notify({
        type: 'warning',
        message: 'Transfer completed but some data may not be fully updated. Please refresh the page if needed.',
        icon: 'warning',
        position: 'top',
        timeout: 3000
      })
    }
  } catch (error) {
    console.error('Error refreshing data after transfer:', error)
    // Don't show error to user as transfer was successful
  }
}

const saveBudget = async () => {
  addLoading.value = true
  try {
    // Only allow annual budget creation
    const finalDescription = description.value
      ? `Annual Budget - ${description.value}`
      : 'Annual Budget'

    const payload = {
      fiscal_year_id: selectedFiscalYear.value,
      original_amount: parseFloat(amount.value),
      description: finalDescription,
      start_date: startDate.value.replace(/\//g, '-'),
      end_date: endDate.value.replace(/\//g, '-'),
    }

    await appropriationStore.addBudget(payload)

    // Refresh the budgets list to show the new budget
    await appropriationStore.fetchBudgets()

    $q.notify({
      type: 'positive',
      message: 'Annual budget added successfully!',
      icon: 'check_circle',
      position: 'top',
    })

    showDialog.value = false
    description.value = ''
    amount.value = null
  } catch (error) {
    console.error('Save error:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to save budget',
      icon: 'error',
      position: 'top',
    })
  } finally {
    addLoading.value = false
  }
}

const parseCurrency = (value) => {
  if (!value && value !== 0) return 0
  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
}

const calculateTypeTotal = (type) => {
  if (!type || !type.children) return 0

  let total = 0

  type.children.forEach((item) => {
    // Use the item total which includes the item's own amount plus all of its sub-items
    total += calculateItemTotal(item)
  })

  return Math.round(total * 100) / 100
}

const calculateItemTotal = (expenseItem) => {
  let total = 0

  // Include the item's own amount if it exists
  if (expenseItem.amount) {
    total += parseCurrency(expenseItem.amount)
  }

  // Include all sub-item amounts
  expenseItem.children?.forEach((subItem) => {
    if (subItem.amount) {
      total += parseCurrency(subItem.amount)
    }
  })

  return Math.round(total * 100) / 100
}

const canEditType = (expenseType) => {
  return !expenseType.children || expenseType.children.length === 0
}

const saveEditedAllocation = async () => {
  editSaveLoading.value = true
  try {
    const allocations = []
    let totalAllocated = 0

    editDisplayAccounts.value.forEach((expenseClass) => {
      if (!expenseClass || !Array.isArray(expenseClass.children)) return

      expenseClass.children.forEach((expenseType) => {
        if (canEditType(expenseType)) {
          const typeAmount = parseCurrency(expenseType.amount)
          if (typeAmount > 0) {
            totalAllocated += typeAmount
          }
          allocations.push({
            id: expenseType.id,
            type: 'type',
            amount: typeAmount,
            expense_class_id: expenseClass.id,
            expense_type_id: expenseType.id,
            expense_item_id: null,
          })
        }

        if (!canEditType(expenseType) && parseCurrency(expenseType.amount) > 0) {
          throw new Error(
            `Cannot set amount for type "${expenseType.name}" because it has items. Type amount should be the sum of its items.`,
          )
        }

        if (expenseType.children && Array.isArray(expenseType.children)) {
          expenseType.children.forEach((item) => {
            if (!item) return

            if (item.children && item.children.length > 0) {
              // For items with sub-items, only allocate to sub-items
              item.children.forEach((subItem) => {
                const subItemAmount = parseCurrency(subItem.amount)
                if (subItemAmount > 0) {
                  totalAllocated += subItemAmount
                }
                allocations.push({
                  id: subItem.id,
                  type: 'sub-item',
                  amount: subItemAmount,
                  expense_class_id: expenseClass.id,
                  expense_type_id: expenseType.id,
                  expense_item_id: item.id,
                  expense_sub_item_id: subItem.id
                })
              })
            } else {
              // For items without sub-items, allocate to the item
              const itemAmount = parseCurrency(item.amount)
              if (itemAmount > 0) {
                totalAllocated += itemAmount
              }
              allocations.push({
                id: item.id,
                type: 'item',
                amount: itemAmount,
                expense_class_id: expenseClass.id,
                expense_type_id: expenseType.id,
                expense_item_id: item.id,
                expense_sub_item_id: null
              })
            }


          })
        }
      })
    })

    const currentUnappropriated = appropriationStore.selectedRow?.unappropriated || 0

    const originalAllocationsTotal = editAllocations.value.reduce((sum, allocation) => {
      return sum + (allocation.amount || 0)
    }, 0)

    // Calculate available budget by adding back the original allocations
    const availableBudgetForEdit = currentUnappropriated + originalAllocationsTotal

    if (totalAllocated > availableBudgetForEdit) {
      throw new Error(
        `Total allocation (₱${totalAllocated.toFixed(2)}) exceeds available budget (₱${availableBudgetForEdit.toFixed(2)})`,
      )
    }

    // Use the appropriation store's commitAllocation method with background refresh for better performance
    await appropriationStore.commitAllocation(appropriationStore.selectedRow.id, allocations, {
      backgroundRefresh: true,
    })

    // Update the local state instead of refetching all budgets
    if (appropriationStore.selectedRow) {
      // Update the selected row's allocations locally
      appropriationStore.selectedRow.allocations = allocations
    }

    $q.notify({
      type: 'positive',
      message: 'Allocations updated',
      icon: 'check_circle',
      position: 'top',
    })
    showEditAllocationDialog.value = false
    typeErrorMap.value = {}
  } catch (error) {
    console.error('Save error:', error)
    let message = error.message || 'Failed to update allocations'

    // Handle backend validation errors specifically
    if (
      error.response &&
      error.response.status === 422 &&
      error.response.data &&
      error.response.data.message
    ) {
      message = error.response.data.message

      // If it's a disbursement validation error, show it clearly
      if (message.includes('disbursed amount')) {
        message = `${message}`
      }

      const errorMap = {}
      editDisplayAccounts.value.forEach((expenseClass) => {
        if (!expenseClass || !Array.isArray(expenseClass.children)) return
        expenseClass.children.forEach((expenseType) => {
          if (expenseType && expenseType.id) {
            errorMap[expenseType.id] = true
          }
        })
      })
      typeErrorMap.value = errorMap
    } else {
      typeErrorMap.value = {}
    }

    $q.notify({
      type: 'negative',
      message: message,
      icon: 'error',
      position: 'top',
    })
  } finally {
    editSaveLoading.value = false
  }
}

onMounted(async () => {
  try {
    // Load both budgets and appropriations to ensure complete data
    await appropriationStore.fetchBudgets()
    await appropriationStore.fetchAppropriations()

    // Log page visit
    const { logPageVisit } = usePageLogging()
    await logPageVisit('Current Appropriation')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to load budgets',
      icon: 'error',
      position: 'top',
    })
  }
})

// Base columns definition
const baseColumns = [
  {
    name: 'index',
    label: '#',
    field: 'index',
    align: 'left',
    sortable: false,
  },
  {
    name: 'startdate',
    label: 'Entry Date',
    field: 'date',
    align: 'left',
    sortable: true,
    format: (val) => appropriationStore.formatDate(val),
  },
  {
    name: 'budgetType',
    label: 'Budget Type',
    field: 'budgetType',
    align: 'left',
  },
  {
    name: 'description',
    label: 'Description',
    field: 'description',
    align: 'left',
  },
  {
    name: 'amount',
    label: 'Amount',
    field: 'amount',
    align: 'left',
    format: (val) => appropriationStore.formatCurrency(val),
  },
  {
    name: 'unappropriated',
    label: 'Unappropriated',
    field: 'unappropriated',
    align: 'left',
    format: (val) => appropriationStore.formatCurrency(val),
  },
  {
    name: 'action',
    label: 'Action',
    align: 'center',
    field: 'action',
  },
  {
    name: 'commit',
    label: 'Commit',
    field: 'commit',
    align: 'center',
  },
]

// Dynamic columns based on selected budget type
const columns = computed(() => {
  if (selectedBudgetType.value === 'all') {
    // For "All Budgets": Show only Entry date, Budget Type, Description, and Amount
    return baseColumns.filter((col) =>
      ['startdate', 'budgetType', 'description', 'amount'].includes(col.name),
    )
  } else if (selectedBudgetType.value === 'supplemental') {
    // For "Supplemental Budget": Show like SupplementalTran.vue (remove amount, commit, but keep action for view button)
    return baseColumns
      .filter((col) => !['amount', 'commit'].includes(col.name))
      .map((col) => {
        if (col.name === 'unappropriated') {
          return {
            ...col,
            label: 'Untransferred Amount',
          }
        }
        return col
      })
  } else {
    // For "Annual Budget": Show all columns (stay as is)
    return baseColumns
  }
})

// Real-time input formatting function: strings (typing) show commas only; numbers (after blur) show two decimals
const formatInputValue = (value) => {
  if (!value && value !== 0) return ''
  const isNumber = typeof value === 'number'
  const cleanValue = String(value).replace(/,/g, '')
  const num = parseFloat(cleanValue)
  if (isNaN(num)) return ''
  return isNumber
    ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : num.toLocaleString('en-US')
}

// Handle input changes while typing: keep cleaned STRING, prevent >2 decimals
const handleAmountInput = (value) => {
  let cleanValue = String(value).replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }
  amount.value = cleanValue
}

// Handle edit allocation input while typing: keep cleaned STRING
const handleEditAmountInput = (item, value) => {
  let cleanValue = String(value).replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }
  item.amount = cleanValue
}

// Handle edit allocation input on blur: format to two decimals
const handleEditAmountBlur = (item, value) => {
  const formatted = formatToTwoDecimals(value)
  item.amount = formatted
}

// Transfer amount input handlers
const handleTransferAmountInput = (value) => {
  let cleanValue = String(value).replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }
  transferAmount.value = cleanValue
  console.log('Transfer amount input:', { value, cleanValue, transferAmount: transferAmount.value })
}

const handleTransferAmountBlur = (event) => {
  const value = event.target.value
  const formatted = formatToTwoDecimals(value)
  transferAmount.value = formatted
}

const handlePasteNumeric = (event) => {
  event.preventDefault()
  const pastedText = event.clipboardData.getData('text')
  let cleanText = pastedText.replace(/[^\d.]/g, '')
  const parts = cleanText.split('.')
  if (parts.length > 2) {
    cleanText = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length === 2 && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2)
    cleanText = parts[0] + '.' + parts[1]
  }
  const num = parseFloat(cleanText)
  if (!isNaN(num)) {
    transferAmount.value = cleanText
  }
}



// Format input value to exactly two decimal places
const formatToTwoDecimals = (value) => {
  // Remove peso sign, commas, and spaces
  const cleanValue = String(value).replace(/[₱,\s]/g, '')

  if (cleanValue === '') return ''

  // Handle multiple decimal points
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    const collapsed = parts[0] + '.' + parts.slice(1).join('')
    return formatToTwoDecimals(collapsed)
  }

  // Limit decimal places to 2
  if (parts.length === 2 && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2)
  }

  const num = parseFloat(parts.join('.'))
  if (isNaN(num)) return ''

  // Return numeric value with two decimals
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

const handleEnterKey = (event) => {
  event.preventDefault()
  if (showDialog.value && !addLoading.value) {
    saveBudget()
  }
}

const addBudget = async () => {
  addLoading.value = true
  try {
    await openDialog()
  } catch (error) {
    console.error('Error opening dialog:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open dialog',
      icon: 'error',
      position: 'top',
    })
  } finally {
    addLoading.value = false
  }
}

const openDialog = async () => {
  try {
    await accountLibraryStore.fetchYears()
    const currentYear = new Date().getFullYear().toString()
    const currentYearOption = accountLibraryStore.yearOptions.find(
      (y) => y.yearValue === currentYear,
    )
    selectedFiscalYear.value = currentYearOption?.value || accountLibraryStore.yearOptions[0]?.value
    budgetType.value = 'annual' // Reset to annual by default
    description.value = '' // Reset description
    amount.value = null // Reset amount
    showDialog.value = true
  } catch (error) {
    console.error('Error loading fiscal years:', error)
  }
}

// Budget type helper functions
const getBudgetTypeColor = (description) => {
  if (description?.toLowerCase().includes('annual')) {
    return 'primary'
  } else if (description?.toLowerCase().includes('supplemental')) {
    return 'secondary'
  }
  return 'grey'
}

const getBudgetTypeLabel = (description) => {
  if (description?.toLowerCase().includes('annual')) {
    return 'Annual'
  } else if (description?.toLowerCase().includes('supplemental')) {
    return 'Supplemental'
  }
  return 'Other'
}

const getDescriptionOnly = (description) => {
  if (!description) return ''

  // Remove budget type prefixes
  if (description.toLowerCase().startsWith('annual budget - ')) {
    return description.substring('Annual Budget - '.length)
  } else if (description.toLowerCase().startsWith('supplemental budget - ')) {
    return description.substring('Supplemental Budget - '.length)
  } else if (description.toLowerCase() === 'annual budget') {
    return 'Annual Budget'
  } else if (description.toLowerCase() === 'supplemental budget') {
    return 'Supplemental Budget'
  }

  return description
}
</script>

<style scoped>
.appropriation-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.budget-type-selection {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.budget-type-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  background: white;
}

.budget-type-card:hover {
  border-color: #2e7d32;
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.2);
  transform: translateY(-2px);
}

.budget-type-card.selected {
  border-color: #2e7d32;
  background: linear-gradient(135deg, #c8e6c9 0%, #e8f5e9 100%);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.25);
}

.budget-type-card.selected .q-icon {
  color: #2e7d32;
}

.budget-type-card.selected .text-subtitle2 {
  color: #2e7d32;
  font-weight: 600;
}

.budget-type-badge {
  font-size: 0.75rem;
  font-weight: 500;
}

.filters-section {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.budget-summary .summary-card {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.budget-summary .summary-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.budget-summary .annual-budget {
  border-left: 4px solid #1976d2;
}

.budget-summary .supplemental-budget {
  border-left: 4px solid #9c27b0;
}

.budget-summary .transfer-summary {
  border-left: 4px solid #ff9800;
}

.hierarchical-table {
  border-radius: 4px;
  overflow: hidden;
}

.hierarchical-body {
  background: white;
}

/* Added specific styles for inputs to replace inline styles */
.search-input {
  min-width: 400px;
  background-color: white;
}

.date-input {
  min-width: 250px;
  background-color: white;
}

/* Edit Allocation Dialog Text Box Styles */
.edit-allocation-input {
  min-width: 180px;
  width: 180px;
}

/* Make action buttons match the height of dense text fields */
.btn-match-input {
  height: 40px;
  padding: 0 16px;
  border-radius: 4px;
}

.btn-match-input :deep(.q-btn__content) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1; /* let align-items center do the vertical alignment */
}

.btn-match-input :deep(.q-icon) {
  font-size: 18px;
}

/* Responsive text box sizing for Edit Allocation dialog */
@media (max-width: 1200px) {
  .edit-allocation-input {
    min-width: 150px;
    width: 150px;
  }
}

@media (max-width: 900px) {
  .edit-allocation-input {
    min-width: 120px;
    width: 120px;
  }
}

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }

  .budget-type-selection {
    padding: 12px;
  }

  .budget-type-card .q-card-section {
    padding: 12px;
  }

  .budget-type-card .q-icon {
    font-size: 1.5rem;
  }

  .budget-type-card .text-subtitle2 {
    font-size: 0.9rem;
  }

  .budget-type-card .text-caption {
    font-size: 0.75rem;
  }

  .row.items-center.q-gutter-sm {
    flex-direction: column;
    align-items: stretch;
  }

  .row.items-center.q-gutter-sm > * {
    margin-bottom: 8px;
    width: 100%;
  }

  .search-input,
  .date-input {
    min-width: 100%;
  }

  /* Hide desktop buttons on mobile */
  .desktop-clear-btn,
  .desktop-add-btn {
    display: none !important;
  }

  /* Show mobile Clear All button */
  .mobile-clear-btn-container {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 10px;
  }

  .mobile-clear-btn {
    display: block !important;
  }

  /* Show mobile action buttons */
  .mobile-action-btn-container {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    position: fixed;
    bottom: 32px;
    right: 16px;
    z-index: 1000;
  }

  .mobile-add-btn,
  .mobile-transfer-btn {
    display: block !important;
    width: 56px !important;
    height: 56px !important;
    font-size: 24px !important;
  }

  /* Make table container relative for absolute positioning */
  .table-container {
    position: relative;
  }

  /* Mobile adjustments for Edit Allocation dialog */
  .edit-allocation-input {
    min-width: 100px;
    width: 100px;
  }

  /* Ensure dialog is properly sized on mobile */
  .q-dialog .q-card {
    min-width: 95vw !important;
    max-width: 95vw !important;
    width: 95vw !important;
  }
}

/* Tablet styles - show desktop layout but stack inputs vertically */
@media (min-width: 769px) and (max-width: 1023px) {
  .budget-type-selection {
    padding: 14px;
  }

  .budget-type-card .q-card-section {
    padding: 14px;
  }

  .budget-type-card .q-icon {
    font-size: 1.75rem;
  }

  .mobile-clear-btn-container,
  .mobile-action-btn-container {
    display: none !important;
  }

  .mobile-clear-btn,
  .mobile-add-btn,
  .mobile-transfer-btn {
    display: none !important;
  }

  .desktop-clear-btn,
  .desktop-add-btn {
    display: block !important;
  }

  /* Stack search and date range vertically on tablet */
  .row.items-center.q-gutter-sm {
    flex-direction: column;
    align-items: stretch;
  }

  .row.items-center.q-gutter-sm > * {
    margin-bottom: 8px;
    width: 100%;
  }

  .search-input,
  .date-input {
    min-width: 100%;
  }

  /* Create a separate row for buttons aligned to the right */
  .row.items-center.q-gutter-sm .desktop-clear-btn,
  .row.items-center.q-gutter-sm .desktop-add-btn {
    width: auto;
    margin-bottom: 0;
  }

  /* Add a new button container for tablet view */
  .row.items-center.q-gutter-sm::after {
    content: '';
    display: block;
    height: 0;
    clear: both;
  }

  /* Position buttons in a row on the right side */
  .row.items-center.q-gutter-sm .desktop-clear-btn {
    float: right;
    margin-left: 8px;
  }

  .row.items-center.q-gutter-sm .desktop-add-btn {
    float: right;
  }
}

/* Desktop styles - hide mobile buttons and show full layout */
@media (min-width: 1024px) {
  .mobile-clear-btn-container,
  .mobile-action-btn-container {
    display: none !important;
  }

  .mobile-clear-btn,
  .mobile-add-btn,
  .mobile-transfer-btn {
    display: none !important;
  }

  .desktop-clear-btn,
  .desktop-add-btn {
    display: block !important;
  }

  /* Reset to horizontal layout for desktop */
  .row.items-center.q-gutter-sm {
    flex-direction: row;
    align-items: center;
  }

  .row.items-center.q-gutter-sm > * {
    margin-bottom: 0;
    width: auto;
  }

  .search-input {
    min-width: 400px;
  }

  .date-input {
    min-width: 250px;
  }
}
</style>
