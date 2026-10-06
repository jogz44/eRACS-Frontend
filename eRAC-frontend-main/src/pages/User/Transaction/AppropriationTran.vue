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
          <q-card class="summary-card allocation-summary">
            <q-card-section class="text-center">
              <div class="text-h6 text-accent">Total Allocated</div>
              <div class="text-h5 text-weight-bold">
                {{ appropriationStore.formatCurrency(totalAllocatedAmount) }}
              </div>
              <div class="text-caption text-grey-6">Total allocated to expense accounts</div>
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

          <!-- Add Button - Hidden for supplemental budget -->
          <div class="col-auto" v-if="selectedBudgetType !== 'supplemental'">
            <q-btn
              label="Add"
              color="secondary"
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
              :label="selectedBudgetType === 'supplemental' ? 'Commit' : 'Commit'"
              :color="props.row.unappropriated <= 0 ? 'grey' : 'secondary'"
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
                :color="
                  editLoading[props.row.id] || props.row.unappropriated <= 0 ? 'grey' : 'orange'
                "
                @click="openEditAllocationDialog(props.row)"
                :disable="
                  !props.row.allocations ||
                  props.row.allocations.length === 0 ||
                  editLoading[props.row.id] ||
                  props.row.unappropriated <= 0
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

    <!-- Edit Allocation Dialog -->
    <q-dialog v-model="showEditAllocationDialog">
      <q-card style="min-width: 900px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Edit Allocation</div>
        </q-card-section>

        <q-card-section>
          <div class="hierarchical-table" style="border: 1px solid #e0e0e0">
            <div class="row q-pa-sm bg-grey-2 text-weight-medium">
              <div class="col-6">Account</div>
              <div class="col-6 text-right">Amount (₱)</div>
            </div>

            <div class="hierarchical-body" style="max-height: 500px; overflow-y: auto">
              <template
                v-for="expenseClass in editDisplayAccounts"
                :key="'class-' + expenseClass.id"
              >
                <!-- EXPENSE CLASS -->
                <div
                  class="row q-pa-sm bg-grey-1 text-weight-medium"
                  style="border-bottom: 1px solid #e0e0e0"
                >
                  <div class="col-6">
                    {{ expenseClass.name }}
                  </div>

                  <div class="col-6 text-right">
                    <q-input
                      v-if="!expenseClass.children || expenseClass.children.length === 0"
                      :model-value="formatInputValue(expenseClass.amount)"
                      @update:model-value="(val) => handleEditAmountInput(expenseClass, val)"
                      @blur="(event) => handleEditAmountBlur(expenseClass, event.target.value)"
                      @keypress="blockNonNumeric"
                      dense
                      outlined
                      class="edit-allocation-input"
                      prefix="₱"
                      placeholder="0.00"
                    />

                    <template v-else-if="calculateClassTotal(expenseClass) > 0">
                      {{ appropriationStore.formatCurrency(calculateClassTotal(expenseClass)) }}
                    </template>
                  </div>
                </div>

                <!-- EXPENSE TYPES -->
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
                        v-if="!expenseType.children || expenseType.children.length === 0"
                        :model-value="formatInputValue(expenseType.amount)"
                        @update:model-value="(val) => handleEditAmountInput(expenseType, val)"
                        @blur="(event) => handleEditAmountBlur(expenseType, event.target.value)"
                        @keypress="blockNonNumeric"
                        dense
                        outlined
                        class="edit-allocation-input"
                        :class="{
                          'text-negative': typeErrorMap[expenseType.id],
                        }"
                        prefix="₱"
                        placeholder="0.00"
                      />

                      <template v-else>
                        <template v-if="calculateTypeTotal(expenseType) > 0">
                          <div class="text-weight-medium">
                            {{ appropriationStore.formatCurrency(calculateTypeTotal(expenseType)) }}
                          </div>
                        </template>
                      </template>
                    </div>
                  </div>

                  <!-- ITEMS -->
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
                          style="padding-left: 48px; display: flex; align-items: center"
                        >
                          <q-icon name="arrow_right" size="xs" class="q-mr-xs" />

                          <span
                            :class="
                              expenseItem.children && expenseItem.children.length > 0
                                ? 'text-weight-bold'
                                : 'text-weight-regular'
                            "
                          >
                            {{ expenseItem.name }}
                          </span>
                        </div>

                        <div class="col-6 text-right">
                          <!-- ITEM IS LEAF -->
                          <q-input
                            v-if="!expenseItem.children || expenseItem.children.length === 0"
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

                          <!-- ITEM HAS CHILDREN -->
                          <template v-else>
                            <span
                              v-if="calculateItemTotal(expenseItem) > 0"
                              class="text-weight-regular"
                            >
                              {{
                                appropriationStore.formatCurrency(calculateItemTotal(expenseItem))
                              }}
                            </span>
                          </template>
                        </div>
                      </div>

                      <!-- SUB ITEMS -->
                      <template v-if="expenseItem.children && expenseItem.children.length > 0">
                        <template
                          v-for="expenseSubItem in expenseItem.children"
                          :key="'subitem-' + expenseSubItem.id"
                        >
                          <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                            <div
                              class="col-6"
                              style="padding-left: 80px; display: flex; align-items: center"
                            >
                              <q-icon name="arrow_right" size="xs" class="q-mr-xs" />

                              <span
                                :class="
                                  expenseSubItem.children && expenseSubItem.children.length > 0
                                    ? 'text-weight-bold'
                                    : 'text-weight-regular'
                                "
                              >
                                {{ expenseSubItem.name }}
                              </span>
                            </div>

                            <div class="col-6 text-right">
                              <!-- SUB ITEM IS LEAF -->
                              <q-input
                                v-if="
                                  !expenseSubItem.children || expenseSubItem.children.length === 0
                                "
                                :model-value="formatInputValue(expenseSubItem.amount)"
                                @update:model-value="
                                  (val) => handleEditAmountInput(expenseSubItem, val)
                                "
                                @blur="
                                  (event) =>
                                    handleEditAmountBlur(expenseSubItem, event.target.value)
                                "
                                @keypress="blockNonNumeric"
                                dense
                                outlined
                                class="edit-allocation-input"
                                prefix="₱"
                                placeholder="0.00"
                              />

                              <!-- SUB ITEM HAS SUB TYPES -->
                              <template v-else>
                                <span
                                  v-if="parseCurrency(expenseSubItem.amount) > 0"
                                  class="text-weight-regular"
                                >
                                  {{ appropriationStore.formatCurrency(expenseSubItem.amount) }}
                                </span>
                              </template>
                            </div>
                          </div>

                          <!-- SUB TYPES -->
                          <template
                            v-if="expenseSubItem.children && expenseSubItem.children.length > 0"
                          >
                            <template
                              v-for="expenseSubType in expenseSubItem.children"
                              :key="'subtype-' + expenseSubType.id"
                            >
                              <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                                <div
                                  class="col-6"
                                  style="padding-left: 112px; display: flex; align-items: center"
                                >
                                  <q-icon name="arrow_right" size="xs" class="q-mr-xs" />

                                  <span
                                    :class="
                                      expenseSubType.children && expenseSubType.children.length > 0
                                        ? 'text-weight-bold'
                                        : 'text-weight-regular'
                                    "
                                  >
                                    {{ expenseSubType.name }}
                                  </span>
                                </div>

                                <div class="col-6 text-right">
                                  <!-- SUB TYPE IS LEAF -->
                                  <q-input
                                    v-if="
                                      !expenseSubType.children ||
                                      expenseSubType.children.length === 0
                                    "
                                    :model-value="formatInputValue(expenseSubType.amount)"
                                    @update:model-value="
                                      (val) => handleEditAmountInput(expenseSubType, val)
                                    "
                                    @blur="
                                      (event) =>
                                        handleEditAmountBlur(expenseSubType, event.target.value)
                                    "
                                    @keypress="blockNonNumeric"
                                    dense
                                    outlined
                                    class="edit-allocation-input"
                                    prefix="₱"
                                    placeholder="0.00"
                                  />

                                  <!-- SUB TYPE HAS SUB-SUB TYPES -->
                                  <template v-else>
                                    <span
                                      v-if="parseCurrency(expenseSubType.amount) > 0"
                                      class="text-weight-regular"
                                    >
                                      {{ appropriationStore.formatCurrency(expenseSubType.amount) }}
                                    </span>
                                  </template>
                                </div>
                              </div>

                              <!-- SUB SUB TYPES -->
                              <template
                                v-if="expenseSubType.children && expenseSubType.children.length > 0"
                              >
                                <template
                                  v-for="expenseSubSubType in expenseSubType.children"
                                  :key="'subsubtype-' + expenseSubSubType.id"
                                >
                                  <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                                    <div
                                      class="col-6"
                                      style="
                                        padding-left: 144px;
                                        display: flex;
                                        align-items: center;
                                      "
                                    >
                                      <q-icon name="arrow_right" size="xs" class="q-mr-xs" />

                                      <span>
                                        {{ expenseSubSubType.name }}
                                      </span>
                                    </div>

                                    <div class="col-6 text-right">
                                      <q-input
                                        :model-value="formatInputValue(expenseSubSubType.amount)"
                                        @update:model-value="
                                          (val) => handleEditAmountInput(expenseSubSubType, val)
                                        "
                                        @blur="
                                          (event) =>
                                            handleEditAmountBlur(
                                              expenseSubSubType,
                                              event.target.value,
                                            )
                                        "
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
  </q-page>

  <!-- Mobile Action Buttons -->
  <div class="mobile-action-btn-container">
    <q-btn
      v-if="selectedBudgetType !== 'supplemental'"
      round
      dense
      color="secondary"
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
import { ref, watch, onMounted, onActivated, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
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
const route = useRoute()

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
  // try {
  //   // Use Promise.allSettled to handle partial failures gracefully
  //   const results = await Promise.allSettled([
  //     appropriationStore.fetchBudgets(),
  //     appropriationStore.fetchAppropriations()
  //   ])
  try {
    const year = route.query.year ? parseInt(route.query.year) : null
    const results = await Promise.allSettled([
      appropriationStore.fetchBudgets(year),
      appropriationStore.fetchAppropriations(year),
    ])

    // Check for any failures
    const failures = results.filter((result) => result.status === 'rejected')

    if (failures.length === 0) {
      $q.notify({
        type: 'positive',
        message: 'Appropriation data refreshed successfully!',
        icon: 'refresh',
        position: 'top',
        timeout: 3000,
      })
    } else if (failures.length < results.length) {
      // Partial success
      $q.notify({
        type: 'warning',
        message: 'Some data could not be refreshed. Please try again.',
        icon: 'warning',
        position: 'top',
        timeout: 4000,
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
      timeout: 5000,
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
      return isSupplemental
    })
    .reduce((total, budget) => total + (parseFloat(budget.amount) || 0), 0)
})

const annualBudgetCount = computed(() => {
  return appropriationStore.appropriations.filter((budget) =>
    budget.description?.toLowerCase().includes('annual'),
  ).length
})

const supplementalBudgetCount = computed(() => {
  // Count all supplemental budgets regardless of unappropriated amount
  return appropriationStore.appropriations.filter((budget) => {
    const isSupplemental = budget.description?.toLowerCase().includes('supplemental')
    return isSupplemental
  }).length
})

// Calculate total allocated amount across all budgets
const totalAllocatedAmount = computed(() => {
  return appropriationStore.appropriations.reduce((total, budget) => {
    const originalAmount = parseFloat(budget.amount) || 0
    const unappropriatedAmount = parseFloat(budget.unappropriated) || 0

    // Calculate how much has been allocated (original - unappropriated)
    const allocatedAmount = originalAmount - unappropriatedAmount
    return total + Math.max(0, allocatedAmount)
  }, 0)
})

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

const initializeEditDisplayAccounts = () => {
  if (!editAllocations.value || editAllocations.value.length === 0) {
    editDisplayAccounts.value = []
    return
  }

  const classMap = {}

  const ensureClass = (alloc) => {
    const classId = alloc.expense_class_id || 'unclassified'

    if (!classMap[classId]) {
      classMap[classId] = {
        id: classId,
        name: alloc.expense_class_name || 'Unclassified',
        order: alloc.expense_class_order,
        amount: 0,
        children: [],
      }
    }

    return classMap[classId]
  }

  const ensureType = (expenseClass, alloc) => {
    let type = expenseClass.children.find((item) => item.id === alloc.expense_type_id)

    if (!type) {
      type = {
        id: alloc.expense_type_id,
        name: alloc.expense_type_name || `Type ${alloc.expense_type_id}`,
        order: alloc.expense_type_order,
        amount: 0,
        children: [],
      }

      expenseClass.children.push(type)
    }

    return type
  }

  const ensureItem = (expenseType, alloc) => {
    let item = expenseType.children.find((entry) => entry.id === alloc.expense_item_id)

    if (!item) {
      item = {
        id: alloc.expense_item_id,
        name: alloc.expense_item_name || `Item ${alloc.expense_item_id}`,
        order: alloc.expense_item_order,
        amount: 0,
        children: [],
      }

      expenseType.children.push(item)
    }

    return item
  }

  const ensureSubItem = (expenseItem, alloc) => {
    let subItem = expenseItem.children.find((entry) => entry.id === alloc.expense_sub_item_id)

    if (!subItem) {
      subItem = {
        id: alloc.expense_sub_item_id,
        name: alloc.expense_sub_item_name || `Sub-item ${alloc.expense_sub_item_id}`,
        order: alloc.expense_sub_item_order,
        amount: 0,
        children: [],
      }

      expenseItem.children.push(subItem)
    }

    return subItem
  }

  const ensureSubType = (expenseSubItem, alloc) => {
    let subType = expenseSubItem.children.find((entry) => entry.id === alloc.expense_sub_type_id)

    if (!subType) {
      subType = {
        id: alloc.expense_sub_type_id,
        name: alloc.expense_sub_type_name || `Sub-type ${alloc.expense_sub_type_id}`,
        order: alloc.expense_sub_type_order,
        amount: 0,
        children: [],
      }

      expenseSubItem.children.push(subType)
    }

    return subType
  }

  editAllocations.value.forEach((alloc) => {
    const amount = parseCurrency(alloc.amount)

    const expenseClass = ensureClass(alloc)

    /*
     * CLASS-LEVEL ALLOCATION
     */
    if (
      alloc.expense_class_id &&
      !alloc.expense_type_id &&
      !alloc.expense_item_id &&
      !alloc.expense_sub_item_id &&
      !alloc.expense_sub_type_id &&
      !alloc.expense_sub_sub_type_id
    ) {
      expenseClass.amount += amount
      return
    }

    /*
     * TYPE-LEVEL ALLOCATION
     */
    if (
      alloc.expense_type_id &&
      !alloc.expense_item_id &&
      !alloc.expense_sub_item_id &&
      !alloc.expense_sub_type_id &&
      !alloc.expense_sub_sub_type_id
    ) {
      const expenseType = ensureType(expenseClass, alloc)

      expenseType.amount += amount
      return
    }

    /*
     * ITEM-LEVEL ALLOCATION
     */
    if (
      alloc.expense_item_id &&
      !alloc.expense_sub_item_id &&
      !alloc.expense_sub_type_id &&
      !alloc.expense_sub_sub_type_id
    ) {
      const expenseType = ensureType(expenseClass, alloc)
      const expenseItem = ensureItem(expenseType, alloc)

      expenseItem.amount += amount
      return
    }

    /*
     * SUB-ITEM-LEVEL ALLOCATION
     */
    if (alloc.expense_sub_item_id && !alloc.expense_sub_type_id && !alloc.expense_sub_sub_type_id) {
      const expenseType = ensureType(expenseClass, alloc)
      const expenseItem = ensureItem(expenseType, alloc)
      const expenseSubItem = ensureSubItem(expenseItem, alloc)

      expenseSubItem.amount += amount
      return
    }

    /*
     * SUB-TYPE-LEVEL ALLOCATION
     */
    if (alloc.expense_sub_type_id && !alloc.expense_sub_sub_type_id) {
      const expenseType = ensureType(expenseClass, alloc)
      const expenseItem = ensureItem(expenseType, alloc)
      const expenseSubItem = ensureSubItem(expenseItem, alloc)
      const expenseSubType = ensureSubType(expenseSubItem, alloc)

      expenseSubType.amount += amount
      return
    }

    /*
     * SUB-SUB-TYPE-LEVEL ALLOCATION
     */
    if (alloc.expense_sub_sub_type_id) {
      const expenseType = ensureType(expenseClass, alloc)
      const expenseItem = ensureItem(expenseType, alloc)
      const expenseSubItem = ensureSubItem(expenseItem, alloc)
      const expenseSubType = ensureSubType(expenseSubItem, alloc)

      let expenseSubSubType = expenseSubType.children.find(
        (entry) => entry.id === alloc.expense_sub_sub_type_id,
      )

      if (!expenseSubSubType) {
        expenseSubSubType = {
          id: alloc.expense_sub_sub_type_id,
          name: alloc.expense_sub_sub_type_name || `Sub-subtype ${alloc.expense_sub_sub_type_id}`,
          order: alloc.expense_sub_sub_type_order,
          amount: 0,
          children: [],
        }

        expenseSubType.children.push(expenseSubSubType)
      }

      expenseSubSubType.amount += amount
    }
  })

  const sortByLibraryOrder = (a, b) => {
    const orderA = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER

    const orderB = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER

    if (orderA !== orderB) {
      return orderA - orderB
    }

    return Number(a.id || 0) - Number(b.id || 0)
  }

  const sortChildrenRecursively = (node) => {
    if (!Array.isArray(node.children)) {
      return
    }

    node.children.sort(sortByLibraryOrder)

    node.children.forEach((child) => {
      sortChildrenRecursively(child)
    })
  }

  const classArr = Object.values(classMap).sort(sortByLibraryOrder)

  classArr.forEach((expenseClass) => {
    sortChildrenRecursively(expenseClass)
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

const openViewDialog = async (row) => {
  viewLoading.value[row.id] = true
  try {
    // Use the same view dialog for both annual and supplemental budgets
    if (viewDialogRef.value) {
      await viewDialogRef.value.openDialog(row)
    } else {
      console.error('View dialog reference is not available')
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

//watch for year filtering
watch(
  () => route.query.year,
  async (newYear) => {
    const year = newYear ? parseInt(newYear) : null
    await appropriationStore.fetchBudgets(year)
    await appropriationStore.fetchAppropriations(year)
  },
)

// Watch for budget type changes and sync with store
watch(selectedBudgetType, (newBudgetType) => {
  appropriationStore.setSelectedBudgetType(newBudgetType)
})

// Watch for changes in appropriations data to trigger reactive updates
watch(
  () => appropriationStore.appropriations,
  () => {
    // Force reactivity update for computed properties
    // This ensures indicators update when data changes
  },
  { deep: true },
)

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

    allAllocations.forEach((allocation) => {
      // Include sub-item ID in the key to properly distinguish sub-item allocations
      const key = [
        allocation.expense_class_id || 'null',
        allocation.expense_type_id || 'null',
        allocation.expense_item_id || 'null',
        allocation.expense_sub_item_id || 'null',
        allocation.expense_sub_type_id || 'null',
        allocation.expense_sub_sub_type_id || 'null',
      ].join('-')

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
  // Only show the type's own direct allocation amount, not children amounts
  return type.amount || 0
}

const calculateItemTotal = (expenseItem) => {
  // Only show the item's own direct allocation amount, not children amounts
  return expenseItem.amount || 0
}

const calculateClassTotal = (expenseClass) => {
  let total = 0

  const calculateNodeTotal = (node) => {
    if (!node) return 0

    const children = Array.isArray(node.children) ? node.children : []

    /*
     * Leaf node:
     * use its direct allocation amount.
     */
    if (children.length === 0) {
      return parseCurrency(node.amount)
    }

    /*
     * Parent node:
     * total all descendants.
     */
    return children.reduce((sum, child) => {
      return sum + calculateNodeTotal(child)
    }, 0)
  }

  /*
   * If the class itself has a direct allocation,
   * include it only when it is a leaf.
   */
  if (!expenseClass.children || expenseClass.children.length === 0) {
    total = parseCurrency(expenseClass.amount)
  } else {
    total = expenseClass.children.reduce((sum, child) => {
      return sum + calculateNodeTotal(child)
    }, 0)

    /*
     * Include a direct class allocation if one exists.
     * This supports a class-level allocation coexisting
     * with hierarchy data.
     */
    total += parseCurrency(expenseClass.amount)
  }

  return Math.round(total * 100) / 100
}

// const canEditType = (expenseType) => {
//   return !expenseType.children || expenseType.children.length === 0
// }

const saveEditedAllocation = async () => {
  editSaveLoading.value = true

  try {
    const allocations = []
    let totalAllocated = 0

    const addAllocation = ({
      id,
      type,
      amount,
      expense_class_id = null,
      expense_type_id = null,
      expense_item_id = null,
      expense_sub_item_id = null,
      expense_sub_type_id = null,
      expense_sub_sub_type_id = null,
    }) => {
      const parsedAmount = parseCurrency(amount)

      if (parsedAmount > 0) {
        totalAllocated += parsedAmount
      }

      allocations.push({
        id,
        type,
        amount: parsedAmount,

        expense_class_id,
        expense_type_id,
        expense_item_id,
        expense_sub_item_id,
        expense_sub_type_id,
        expense_sub_sub_type_id,
      })
    }

    editDisplayAccounts.value.forEach((expenseClass) => {
      if (!expenseClass) return

      /*
       * CLASS LEVEL
       */
      if (
        (!expenseClass.children || expenseClass.children.length === 0) &&
        parseCurrency(expenseClass.amount) > 0
      ) {
        addAllocation({
          id: expenseClass.id,
          type: 'class',
          amount: expenseClass.amount,
          expense_class_id: expenseClass.id,
        })
      }

      if (!Array.isArray(expenseClass.children)) {
        return
      }

      expenseClass.children.forEach((expenseType) => {
        if (!expenseType) return

        /*
         * TYPE LEVEL
         */
        if (!expenseType.children || expenseType.children.length === 0) {
          addAllocation({
            id: expenseType.id,
            type: 'type',
            amount: expenseType.amount,
            expense_class_id: expenseClass.id,
            expense_type_id: expenseType.id,
          })

          return
        }

        /*
         * ITEMS
         */
        expenseType.children.forEach((expenseItem) => {
          if (!expenseItem) return

          /*
           * ITEM LEVEL
           */
          if (!expenseItem.children || expenseItem.children.length === 0) {
            addAllocation({
              id: expenseItem.id,
              type: 'item',
              amount: expenseItem.amount,
              expense_class_id: expenseClass.id,
              expense_type_id: expenseType.id,
              expense_item_id: expenseItem.id,
            })

            return
          }

          /*
           * SUB ITEMS
           */
          expenseItem.children.forEach((expenseSubItem) => {
            if (!expenseSubItem) return

            /*
             * SUB-ITEM LEVEL
             */
            if (!expenseSubItem.children || expenseSubItem.children.length === 0) {
              addAllocation({
                id: expenseSubItem.id,
                type: 'sub-item',
                amount: expenseSubItem.amount,
                expense_class_id: expenseClass.id,
                expense_type_id: expenseType.id,
                expense_item_id: expenseItem.id,
                expense_sub_item_id: expenseSubItem.id,
              })

              return
            }

            /*
             * SUB TYPES
             */
            expenseSubItem.children.forEach((expenseSubType) => {
              if (!expenseSubType) return

              /*
               * SUB-TYPE LEVEL
               */
              if (!expenseSubType.children || expenseSubType.children.length === 0) {
                addAllocation({
                  id: expenseSubType.id,
                  type: 'sub-type',
                  amount: expenseSubType.amount,
                  expense_class_id: expenseClass.id,
                  expense_type_id: expenseType.id,
                  expense_item_id: expenseItem.id,
                  expense_sub_item_id: expenseSubItem.id,
                  expense_sub_type_id: expenseSubType.id,
                })

                return
              }

              /*
               * SUB-SUB-TYPES
               */
              expenseSubType.children.forEach((expenseSubSubType) => {
                if (!expenseSubSubType) return

                addAllocation({
                  id: expenseSubSubType.id,
                  type: 'sub-sub-type',
                  amount: expenseSubSubType.amount,
                  expense_class_id: expenseClass.id,
                  expense_type_id: expenseType.id,
                  expense_item_id: expenseItem.id,
                  expense_sub_item_id: expenseSubItem.id,
                  expense_sub_type_id: expenseSubType.id,
                  expense_sub_sub_type_id: expenseSubSubType.id,
                })
              })
            })
          })
        })
      })
    })

    const currentUnappropriated = parseCurrency(appropriationStore.selectedRow?.unappropriated || 0)

    const originalAllocationsTotal = editAllocations.value.reduce((sum, allocation) => {
      return sum + parseCurrency(allocation.amount)
    }, 0)

    /*
     * Add the original allocations back to determine
     * the amount available while editing.
     */
    const availableBudgetForEdit = currentUnappropriated + originalAllocationsTotal

    if (totalAllocated > availableBudgetForEdit) {
      throw new Error(
        `Total allocation (₱${totalAllocated.toFixed(
          2,
        )}) exceeds available budget (₱${availableBudgetForEdit.toFixed(2)})`,
      )
    }

    await appropriationStore.commitAllocation(appropriationStore.selectedRow.id, allocations, {
      backgroundRefresh: true,
    })

    if (appropriationStore.selectedRow) {
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

    if (
      error.response &&
      error.response.status === 422 &&
      error.response.data &&
      error.response.data.message
    ) {
      message = error.response.data.message

      const errorMap = {}

      editDisplayAccounts.value.forEach((expenseClass) => {
        if (!expenseClass) return

        if (expenseClass.id) {
          errorMap[expenseClass.id] = true
        }

        expenseClass.children?.forEach((expenseType) => {
          if (expenseType?.id) {
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
      message,
      icon: 'error',
      position: 'top',
    })
  } finally {
    editSaveLoading.value = false
  }
}

// Apply navigation parameters from dashboard
const applyNavigationFilters = () => {
  const query = route.query

  if (query.budgetType) {
    selectedBudgetType.value = query.budgetType
  }
}

// onMounted(async () => {
//   try {
//     // Apply navigation filters first
//     applyNavigationFilters()

//     // Load both budgets and appropriations to ensure complete data
//     await appropriationStore.fetchBudgets()
//     await appropriationStore.fetchAppropriations()

//     // Log page visit
//     const { logPageVisit } = usePageLogging()
//     await logPageVisit('Current Appropriation')
//   } catch (error) {
//     $q.notify({
//       type: 'negative',
//       message: error.response?.data?.message || 'Failed to load budgets',
//       icon: 'error',
//       position: 'top',
//     })
//   }
// })

onMounted(async () => {
  try {
    applyNavigationFilters()

    // Read year from route query — same as the layout sends it
    const year = route.query.year ? parseInt(route.query.year) : null

    await appropriationStore.fetchBudgets(year)
    await appropriationStore.fetchAppropriations(year)

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
    // For "Supplemental Budget": Show all columns exactly like annual budget
    return baseColumns.map((col) => {
      if (col.name === 'commit') {
        return {
          ...col,
          label: 'Commit',
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

onActivated(() => {
  const year = route.query.year ? parseInt(route.query.year) : null
  appropriationStore.fetchBudgets(year, { silent: true })
})
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

.budget-summary .allocation-summary {
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

  .mobile-add-btn {
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
  .mobile-add-btn {
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
  .mobile-add-btn {
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
