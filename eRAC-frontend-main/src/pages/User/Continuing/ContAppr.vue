<template>
  <q-page class="q-pa-md cont-appr">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">Continuing Appropriation</div>
        <q-btn
          icon="refresh"
          color="primary"
          flat
          dense
          @click="loadPendingUsers"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Simplified the search and filter section structure -->
    <div class="q-mb-sm">
      <div class="row items-center q-gutter-sm">
        <q-input
          outlined
          dense
          placeholder="Search Description..."
          v-model="searchQuery"
          class="search-input"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-btn
          dense
          outlined
          color="red-10"
          icon="clear_all"
          label="Clear All"
          @click="clearAllFilters"
        />

        <q-space />

        <q-btn
          label="Continue Accounts"
          @click="showContinueDialog = true"
          color="secondary"
          v-permission="'add'"
          :loading="generalLoading"
        />
      </div>
    </div>

    <!-- Dialog for Selecting Accounts -->
    <q-dialog v-model="showContinueDialog" @keydown.enter="handleEnterKey">
      <q-card style="min-width: 600px; max-width: 90vw">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Select Accounts to Continue Last Year</div>
        </q-card-section>

        <q-card-section>
          <div class="row items-center q-gutter-sm q-mb-md">
            <q-input
              dense
              outlined
              debounce="300"
              v-model="dialogSearchQuery"
              placeholder="Search accounts..."
              style="min-width: 250px"
              @keydown.enter="handleEnterKey"
            />
          </div>

          <q-table
            :rows="filteredDialogAccounts"
            :columns="continueColumns"
            row-key="id"
            selection="multiple"
            v-model:selected="selectedAccounts"
            :pagination="{ rowsPerPage: 0 }"
            style="max-height: 400px"
            flat
            bordered
          >
            <template v-slot:header-selection="scope">
              <q-checkbox color="secondary" v-model="scope.selected" />
            </template>
            <template v-slot:body-selection="scope">
              <q-checkbox color="secondary" v-model="scope.selected" />
            </template>
          </q-table>

          <q-input
            outlined
            v-model="description"
            label="Description"
            type="text"
            placeholder="e.g., Carried-over balances from previous year"
            class="q-mt-md"
            @keydown.enter="handleEnterKey"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            label="Continue"
            color="primary"
            @click="handleContinueClick"
            :disable="selectedAccounts.length === 0 || !description"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Main Data Table -->
    <q-card flat bordered>

      <q-table
        :rows="filteredAppropriations"
        :columns="columns"
        :loading="loading"
        row-key="id"
        flat
      >
        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ props.pageIndex + 1 }}
          </q-td>
        </template>

        <template v-slot:body-cell-continued_date="props">
          <q-td :props="props">
            {{ props.row.continued_date || '-' }}
          </q-td>
        </template>

        <template v-slot:body-cell-year="props">
          <q-td :props="props">
            {{ props.row.year || '-' }}
          </q-td>
        </template>

        <template v-slot:body-cell-expense_class="props">
          <q-td :props="props">
            {{ props.row.expense_class || '-' }}
          </q-td>
        </template>

                 <template v-slot:body-cell-amount="props">
           <q-td :props="props">
             {{ formatCurrency(props.row.appropriation || props.row.amount) }}
           </q-td>
         </template>

         <template v-slot:body-cell-total_appropriated="props">
           <q-td :props="props">
             {{ formatCurrency(props.row.total_appropriated || 0) }}
           </q-td>
         </template>

         <template v-slot:body-cell-unappropriated="props">
           <q-td :props="props">
             {{ formatCurrency(props.row.unappropriated) }}
           </q-td>
         </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-xs">
              <q-btn
                dense
                icon="edit"
                color="orange"
                @click="openEditAllocationDialog(props.row)"
                :disable="!props.row.total_appropriated || props.row.total_appropriated <= 0 || editLoading[props.row.id]"
                :loading="editLoading[props.row.id]"
                v-permission="'edit'"
              />
              <q-btn
                dense
                icon="visibility"
                color="blue"
                @click="openViewDialog(props.row)"
                v-permission="'view'"
              />
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-commit="props">
          <q-td :props="props">
            <q-btn
              dense
              label="Commit"
              :color="props.row.unappropriated <= 0 ? 'grey' : 'primary'"
              @click="openCommitDialog(props.row)"
              :disable="props.row.unappropriated <= 0"
              v-permission="'edit'"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Allocation Dialog -->
    <q-dialog v-model="showAllocationDialog" persistent @keydown.enter="handleAllocationEnterKey">
      <q-card style="min-width: 900px; max-width: 90vw">
        <q-card-section class="q-pb-none">
          <div class="row items-center justify-between">
            <div class="text-h6">Allocate Amounts</div>
            <q-btn
              icon="close"
              flat
              round
              dense
              @click="showAllocationDialog = false"
            />
          </div>
        </q-card-section>

        <q-card-section>
          <!-- Summary section -->
          <div class="row q-mb-sm q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <div class="text-caption">Total Budget:</div>
              <strong>{{ formatCurrency(selectedRow.amount) }}</strong>
            </div>
            <div class="col-12 col-sm-4">
              <div class="text-caption">Return Amount:</div>
              <strong>{{ formatCurrency(selectedRow.returnAmount || 0) }}</strong>
            </div>
            <div class="col-12 col-sm-4">
              <div class="text-caption">Available Budget:</div>
              <strong>{{ formatCurrency(availableBudget) }}</strong>
            </div>
          </div>

          <!-- Hierarchical Table -->
          <div class="hierarchical-table" style="border: 1px solid #e0e0e0">
            <div class="row q-pa-sm bg-grey-2 text-weight-medium">
              <div class="col-6">Type</div>
              <div class="col-6 text-right">Amount (₱)</div>
            </div>

            <div class="hierarchical-body" style="max-height: 400px; overflow-y: auto">
              <template v-for="expenseClass in displayAccounts" :key="'class-' + expenseClass.id">
                <div class="row q-pa-sm bg-grey-1 text-weight-medium">
                  <div class="col-12">{{ expenseClass.name }}</div>
                </div>

                <template v-for="expenseType in expenseClass.children" :key="'type-' + expenseType.id">
                  <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                    <div class="col-6" style="padding-left: 16px; display: flex; align-items: center">
                      <q-btn
                        dense
                        flat
                        :icon="(expenseType.children && expenseType.children.length > 0 && expandedTypes[expenseType.id]) ? 'expand_more' : 'chevron_right'"
                        @click="(expenseType.children && expenseType.children.length > 0) ? toggleType(expenseType.id) : null"
                        size="sm"
                      />
                      <span>{{ expenseType.name }}</span>
                    </div>
                    <div class="col-6 text-right">
                      <q-input
                        v-if="canEditType(expenseType)"
                        :model-value="formatInputValue(expenseType.amount)"
                        @update:model-value="(val) => handleAmountInput(expenseType, val)"
                        @blur="(event) => handleAmountBlur(expenseType, event.target.value)"
                        dense
                        outlined
                        class="allocation-input"
                        prefix="₱"
                        placeholder="0.00"
                        @keydown.enter="handleAllocationEnterKey"
                      />
                      <div v-else class="text-weight-medium">
                        {{ formatCurrency(calculateTypeTotal(expenseType)) }}
                      </div>
                    </div>
                  </div>

                  <template v-if="expandedTypes[expenseType.id] && expenseType.children && expenseType.children.length > 0">
                    <template v-for="expenseItem in expenseType.children" :key="'item-' + expenseItem.id">
                      <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                        <div class="col-6" style="padding-left: 32px; display: flex; align-items: center">
                          <q-icon name="arrow_right" size="xs" class="q-mr-xs" />
                          <span>{{ expenseItem.name }}</span>
                        </div>
                        <div class="col-6 text-right">
                          <q-input
                            :model-value="formatInputValue(expenseItem.amount)"
                            @update:model-value="(val) => handleAmountInput(expenseItem, val)"
                            @blur="(event) => handleAmountBlur(expenseItem, event.target.value)"
                            dense
                            outlined
                            class="allocation-input"
                            prefix="₱"
                            placeholder="0.00"
                            @keydown.enter="handleAllocationEnterKey"
                          />
                        </div>
                      </div>
                    </template>
                  </template>
                </template>
              </template>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            label="Save"
            color="primary"
            @click="handleAllocationSaveClick"
            :disable="!canSaveAllocation"
            v-permission="'edit'"
          />
        </q-card-actions>
      </q-card>
         </q-dialog>

           <!-- View Dialog -->
      <q-dialog v-model="showViewDialog">
        <q-card style="min-width: 900px; max-width: 90vw">
          <q-card-section class="q-pb-none">
            <div class="row items-center justify-between">
              <div class="text-h6">View Appropriation Details</div>
              <q-btn
                icon="close"
                flat
                round
                dense
                @click="showViewDialog = false"
              />
            </div>
          </q-card-section>

          <q-card-section>
            <!-- Summary section -->
            <div class="row q-mb-md q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="text-caption">Description:</div>
                <strong>{{ selectedRow.description || '-' }}</strong>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption">Continued Date:</div>
                <strong>{{ selectedRow.continued_date || '-' }}</strong>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption">Total Budget:</div>
                <strong>{{ formatCurrency(selectedRow.amount) }}</strong>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption">Unappropriated:</div>
                <strong>{{ formatCurrency(selectedRow.unappropriated) }}</strong>
              </div>
            </div>

            <!-- Loading state -->
            <div v-if="viewLoading" class="text-center q-pa-md">
              <q-spinner size="2em" />
              <div class="q-mt-sm">Loading allocation history...</div>
            </div>

            <!-- Allocation History by Year -->
            <div v-else>
              <!-- Original appropriation from previous year -->
              <div class="q-mb-md">
                <div class="text-h6 text-weight-medium q-mb-sm">
                  Year {{ selectedRow.year || 'Previous Year' }}
                </div>
                <div class="text-caption q-mb-sm">Original appropriation continued from previous year</div>
                <div class="hierarchical-table" style="border: 1px solid #e0e0e0">
                  <div class="row q-pa-sm bg-grey-2 text-weight-medium">
                    <div class="col-6">Account</div>
                    <div class="col-6 text-right">Amount (₱)</div>
                  </div>
                  <div class="hierarchical-body">
                    <div class="row q-pa-sm" style="border-bottom: 1px solid #f0f0f0">
                      <div class="col-6">
                        <div class="text-weight-medium">{{ selectedRow.expense_class || 'Unknown' }}</div>
                      </div>
                      <div class="col-6 text-right">
                        <div class="text-weight-medium">{{ formatCurrency(selectedRow.amount) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Current year allocations -->
              <div v-if="viewAllocationHistory.length > 0" class="q-mb-md">
                <div class="text-h6 text-weight-medium q-mb-sm">
                  Year {{ contApprStore.selectedYear }}
                </div>
                <div class="text-caption q-mb-sm">Allocations made in current year</div>
                
                <template v-for="(session, sessionIndex) in viewAllocationHistory" :key="'session-' + sessionIndex">
                  <div class="q-mb-sm">
                    <div class="text-subtitle2 text-weight-medium q-mb-xs">
                      Session {{ sessionIndex + 1 }} - {{ session.created_at ? new Date(session.created_at).toLocaleDateString() : 'Unknown Date' }}
                    </div>
                    <div class="hierarchical-table" style="border: 1px solid #e0e0e0">
                      <div class="row q-pa-sm bg-grey-2 text-weight-medium">
                        <div class="col-6">Account</div>
                        <div class="col-6 text-right">Amount (₱)</div>
                      </div>
                      <div class="hierarchical-body">
                        <template v-for="allocation in session.allocations || []" :key="'alloc-' + allocation.id">
                          <div class="row q-pa-sm" style="border-bottom: 1px solid #f0f0f0">
                            <div class="col-6">
                              <div class="text-weight-medium">
                                {{ getExpenseName(allocation) }}
                              </div>
                            </div>
                            <div class="col-6 text-right">
                              <div class="text-weight-medium">{{ formatCurrency(allocation.amount) }}</div>
                            </div>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- No allocations message -->
              <div v-else class="text-center q-pa-md text-grey-6">
                <q-icon name="info" size="2em" class="q-mb-sm" />
                <div>No allocations have been made yet for this appropriation.</div>
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Close" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Commit Dialog -->
      <q-dialog v-model="showCommitDialog" persistent>
        <q-card class="allocation-card" style="min-width: 1050px; height: 800px; font-size: medium;">
          <!-- Header with reduced padding -->
          <q-card-section class="q-pb-sm q-pt-sm">
            <div class="row items-center justify-between">
              <div class="text-h6">Allocate Amounts</div>
              <q-icon
                name="close"
                class="cursor-pointer"
                size="sm"
                @click="showCommitDialog = false"
              />
            </div>
          </q-card-section>

          <q-card-section class="q-py-lg">
            <div class="row q-mb-sm">
              <div class="col-md-6 col-12 q-mb-md text-weight-regular">
                Total Budget:
                <strong>{{ formatCurrency(commitSelectedRow?.amount || 0) }}</strong>
              </div>
              <div class="col-md-6 col-12 text-weight-regular">
                Available for allocation:
                <strong>{{ formatCurrency(commitAvailableBudget) }}</strong>
              </div>

              <div class="col-md-6 col-12 q-mb-md text-weight-regular">
                New Allocations:
                <strong>{{ formatCurrency(commitNewAllocationsTotal) }}</strong>
              </div>

              <div class="col-md-6 col-12 q-mb-md text-weight-regular">
                Net Change:
                <strong
                  :class="commitNetChange < 0 ? 'text-positive' : commitNetChange > commitAvailableBudget ? 'text-negative' : 'text-primary'"
                >
                  {{ formatCurrency(commitNetChange) }}
                </strong>
              </div>

              <div class="col-md-6 col-12 q-mb-md text-weight-regular">
                Remaining after changes:
                <strong
                  :class="commitRemainingAfterChanges < 0 ? 'text-negative' : 'text-positive'"
                >
                  {{ formatCurrency(commitRemainingAfterChanges) }}
                </strong>
              </div>
            </div>

            <q-input
              outlined
              dense
              placeholder="Search accounts..."
              class="q-mb-sm"
              v-model="commitSearchQuery"
              style="max-width: 500px"
              clearable
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>

            <!-- Compact Hierarchical Table -->
            <div class="hierarchical-table" style="border: 1px solid #e0e0e0; border-radius: 4px">
              <!-- Table Header -->
              <div
                class="row q-table__top bg-grey-3 text-weight-bold"
                style="padding: 8px 12px; min-height: 40px"
              >
                <div class="col-6" style="display: flex; align-items: center">Account</div>
                <div
                  class="col-6 text-right"
                  style="display: flex; align-items: center; justify-content: flex-end"
                >
                  Amount (₱)
                </div>
              </div>

              <!-- Table Body -->
              <div class="hierarchical-body" style="max-height: 300px; overflow-y: auto">
                <template v-for="expenseClass in commitDisplayAccounts" :key="'class-' + expenseClass.id">
                  <!-- Expense Class Row -->
                  <div
                    class="row bg-grey-3 text-weight-bold"
                    style="padding: 12px 12px; min-height: 32px"
                  >
                    <div class="col-6" style="display: flex; align-items: center">
                      {{ expenseClass.name }}
                    </div>
                    <div
                      class="col-6 text-right"
                      style="display: flex; align-items: center; justify-content: flex-end"
                    >
                      {{ formatCurrency(calculateCommitClassTotal(expenseClass)) }}
                    </div>
                  </div>

                  <!-- Expense Type Rows -->
                  <template
                    v-for="expenseType in expenseClass.children"
                    :key="'type-' + expenseType.id"
                  >
                    <div
                      class="row"
                      :class="getCommitTypeClass(expenseType)"
                      style="padding: 6px 12px; min-height: 32px; border-bottom: 1px solid #f0f0f0"
                    >
                      <div class="col-6" style="padding-left: 24px; display: flex; align-items: center">
                        <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                        {{ expenseType.name }}
                      </div>
                      <div class="col-6 text-right">
                                                 <q-input
                           v-if="!expenseType.children || expenseType.children.length === 0"
                           dense
                           :model-value="commitInputCache[`type-${expenseType.id}`] || ''"
                           @update:model-value="
                             (val) => {
                               const cleanValue = handleCommitAmountInput(val)
                               updateCommitAllocationAmount(`type-${expenseType.id}`, cleanValue)
                               updateCommitUnappropriated()
                             }
                           "
                           @blur="
                             (event) => {
                               const formatted = formatToTwoDecimals(event.target.value)
                               const formattedDisplay = formatNumberWithCommas(formatted)
                               updateCommitAllocationAmount(`type-${expenseType.id}`, formattedDisplay)
                               updateCommitUnappropriated()
                             }
                           "
                           prefix="₱"
                           placeholder="0.00"
                           style="max-width: 230px; width: 100%; display: inline-block"
                           class="q-pa-none"
                           input-class="q-py-xs"
                         />
                        <div v-else class="text-weight-medium">
                          {{ formatCurrency(calculateCommitTypeTotal(expenseType)) }}
                        </div>
                      </div>
                    </div>

                                         <!-- Expense Item Rows -->
                     <template v-if="expenseType.children && expenseType.children.length > 0">
                       <template
                         v-for="expenseItem in expenseType.children"
                         :key="'item-' + expenseItem.id"
                       >
                      <div
                        class="row"
                        style="padding: 6px 12px; min-height: 32px; border-bottom: 1px solid #f0f0f0"
                      >
                        <div
                          class="col-6"
                          style="padding-left: 48px; display: flex; align-items: center"
                        >
                          <q-icon name="arrow_right" size="xs" class="q-mr-sm" />
                          <span class="text-weight-regular">{{ expenseItem.name }}</span>
                        </div>
                        <div class="col-6 text-right">
                                                     <q-input
                             dense
                             :model-value="commitInputCache[`item-${expenseItem.id}`] || ''"
                             @update:model-value="
                               (val) => {
                                 const cleanValue = handleCommitAmountInput(val)
                                 updateCommitAllocationAmount(`item-${expenseItem.id}`, cleanValue)
                                 updateCommitUnappropriated()
                               }
                             "
                             @blur="
                               (event) => {
                                 const formatted = formatToTwoDecimals(event.target.value)
                                 const formattedDisplay = formatNumberWithCommas(formatted)
                                 updateCommitAllocationAmount(`item-${expenseItem.id}`, formattedDisplay)
                                 updateCommitUnappropriated()
                               }
                             "
                             prefix="₱"
                             placeholder="0.00"
                             style="max-width: 230px; width: 100%; display: inline-block"
                             class="q-pa-none"
                             input-class="q-py-xs"
                           />
                                                 </div>
                       </div>
                       </template>
                     </template>
                   </template>
                 </template>
               </div>
             </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-sm">
            <q-btn flat label="Cancel" color="secondary" v-close-popup />
            <q-btn
              label="Allocate"
              class="modal-save-btn"
              @click="submitCommitAllocation"
              :loading="commitLoading"
              :disable="commitLoading || !canCommitSave"
            />
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
                <template v-for="expenseClass in editDisplayAccounts" :key="'class-' + expenseClass.id">
                  <div class="row q-pa-sm bg-grey-1 text-weight-medium">
                    <div class="col-12">{{ expenseClass.name }}</div>
                  </div>

                  <template v-for="expenseType in expenseClass.children" :key="'type-' + expenseType.id">
                    <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                      <div class="col-6" style="padding-left: 16px; display: flex; align-items: center">
                        <q-btn
                          dense
                          flat
                          :icon="(expenseType.children && expenseType.children.length > 0 && expandedEditTypes[expenseType.id]) ? 'expand_more' : 'chevron_right'"
                          @click="(expenseType.children && expenseType.children.length > 0) ? toggleEditType(expenseType.id) : null"
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
                          dense
                          outlined
                          class="edit-allocation-input"
                          :class="{ 'text-negative': typeErrorMap[expenseType.id] }"
                          prefix="₱"
                          placeholder="0.00"
                        />
                        <div v-else class="text-weight-medium">
                          {{ formatCurrency(calculateTypeTotal(expenseType)) }}
                        </div>
                      </div>
                    </div>

                    <template v-if="expandedEditTypes[expenseType.id] && expenseType.children && expenseType.children.length > 0">
                      <template v-for="expenseItem in expenseType.children" :key="'item-' + expenseItem.id">
                        <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                          <div class="col-6" style="padding-left: 32px; display: flex; align-items: center">
                            <q-icon name="arrow_right" size="xs" class="q-mr-xs" />
                            <span>{{ expenseItem.name }}</span>
                          </div>
                          <div class="col-6 text-right">
                            <q-input
                              :model-value="formatInputValue(expenseItem.amount)"
                              @update:model-value="(val) => handleEditAmountInput(expenseItem, val)"
                              @blur="(event) => handleEditAmountBlur(expenseItem, event.target.value)"
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
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" v-close-popup @click="closeEditAllocationDialog" />
            <q-btn label="Save Changes" color="primary" @click="saveEditedAllocation" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  </template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'
import { useContApprStore } from 'src/stores/contApprStore'
import { usePageLogging } from '../../../composables/usePageLogging'
import { api } from 'src/boot/axios'

const $q = useQuasar()
const contApprStore = useContApprStore();
const { continueAccounts, continuingAppropriations } = storeToRefs(contApprStore)

const loading = ref(false)
const showContinueDialog = ref(false)
const showAllocationDialog = ref(false)
const showViewDialog = ref(false)
const showCommitDialog = ref(false)
const description = ref('')
const selectedAccounts = ref([])
const searchQuery = ref('')
const dialogSearchQuery = ref('')
const returnAmount = ref(0)
const augmentationAmount = ref(0)
const generalLoading = ref(true)

// Commit dialog state variables
const commitLoading = ref(false)
const commitSearchQuery = ref('')
const commitSelectedRow = ref(null)
const commitDisplayAccounts = ref([])
const commitInputCache = ref({})
const commitExistingAllocationsTotal = ref(0)

// Edit allocation dialog state variables
const showEditAllocationDialog = ref(false)
const editAllocations = ref([])
const expandedEditTypes = ref({})
const typeErrorMap = ref({})
const editDisplayAccounts = ref([])
const editLoading = ref({})

// New state variables for enhanced functionality
const expandedTypes = ref({})
const selectedRow = ref({
  id: null,
  amount: 0,
  unappropriated: 0,
  returnAmount: 0,
  augmentationAmount: 0,
})

const continueColumns = [
  { name: 'accountName', label: 'Accounts Name', field: 'accountName', align: 'left' },
  {
    name: 'balance',
    label: 'Remaining Balance',
    field: 'balance',
    align: 'right',
    format: (val) => `₱ ${val.toLocaleString()}`,
  },
]

// Use store data instead of local state
const mergedAppropriations = computed(() => {
  return continuingAppropriations.value || []
})

const columns = [
  {
    name: 'index',
    label: '#',
    field: 'index',
    align: 'left',
    sortable: false,
  },
  {
    name: 'continued_date',
    label: 'Continued Date',
    field: 'continued_date',
    align: 'left',
    sortable: true,
  },
  {
    name: 'year',
    label: 'Year',
    field: 'year',
    align: 'left',
    sortable: true,
  },
  {
    name: 'expense_class',
    label: 'Expense Class',
    field: 'expense_class',
    align: 'left',
    sortable: true,
  },
  {
    name: 'description',
    label: 'Description',
    field: 'description',
    align: 'left',
    sortable: true,
  },
  {
    name: 'amount',
    label: 'Total Budget',
    field: 'amount',
    align: 'right',
    sortable: true
  },
  {
    name: 'total_appropriated',
    label: 'Total Appropriated',
    field: 'total_appropriated',
    align: 'right',
    sortable: true
  },
  {
    name: 'unappropriated',
    label: 'Unappropriated',
    field: 'unappropriated',
    align: 'right',
    sortable: true
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
    align: 'center',
    field: 'commit',
  },
]

const availableBudget = computed(() => {
  const base = selectedRow.value.unappropriated || 0
  const returns = selectedRow.value.returnAmount || 0
  const augmentation = selectedRow.value.augmentationAmount || 0
  return base + returns + augmentation
})

// Commit dialog computed properties
const commitAvailableBudget = computed(() => {
  return parseCurrency(commitSelectedRow.value?.unappropriated || 0)
})

const commitNewAllocationsTotal = computed(() => {
  let total = 0
  if (!commitDisplayAccounts.value) return total

  commitDisplayAccounts.value.forEach((expenseClass) => {
    if (!expenseClass.children) return

    expenseClass.children.forEach((expenseType) => {
      if (expenseType.children?.length) {
        expenseType.children.forEach((item) => {
          const currentAmount = commitInputCache.value[`item-${item.id}`] || 0
          if (currentAmount > 0 || (typeof currentAmount === 'string' && currentAmount.trim() !== '')) {
            // Always parse as currency to handle both numeric and formatted string values
            const amount = parseCurrency(currentAmount)
            total += amount
          }
        })
      } else {
        const currentAmount = commitInputCache.value[`type-${expenseType.id}`] || 0
        if (currentAmount > 0 || (typeof currentAmount === 'string' && currentAmount.trim() !== '')) {
          // Always parse as currency to handle both numeric and formatted string values
          const amount = parseCurrency(currentAmount)
          total += amount
        }
      }
    })
  })

  return Math.round(total * 100) / 100
})

const commitNetChange = computed(() => {
  const existingTotal = commitExistingAllocationsTotal.value || 0
  const newTotal = commitNewAllocationsTotal.value
  const netChange = Math.round((newTotal - existingTotal) * 100) / 100
  return netChange
})

const commitRemainingAfterChanges = computed(() => {
  const remaining = Math.round((commitAvailableBudget.value - commitNetChange.value) * 100) / 100
  return remaining
})

const canCommitSave = computed(() => {
  const hasValidAllocation = commitNewAllocationsTotal.value > 0
  const withinBudget = commitNetChange.value <= (commitAvailableBudget.value + 0.01)
  const hasValidAmounts = commitNewAllocationsTotal.value >= 0
  
  return hasValidAllocation && withinBudget && hasValidAmounts
})

const filteredDialogAccounts = computed(() => {
  if (!dialogSearchQuery.value) return continueAccounts.value

  return continueAccounts.value.filter((account) =>
    Object.values(account).join(' ').toLowerCase().includes(dialogSearchQuery.value.toLowerCase()),
  )
})

const filteredAppropriations = computed(() => {
  const query = searchQuery.value.toLowerCase()

  return mergedAppropriations.value.filter((row) => {
    return row.description.toLowerCase().includes(query) ||
           row.expense_class?.toLowerCase().includes(query) ||
           row.year?.toString().includes(query)
  })
})

const sampleAccounts = [
  {
    id: 1,
    name: 'Capital Outlays',
    children: [
      { id: 11, name: 'OFFICE EQUIPMENT', amount: 12000 },
      { id: 12, name: 'IT EQUIPMENT AND SOFTWARE', amount: 7600 },
      { id: 13, name: 'VEHICLES', amount: 50000 },
      { id: 14, name: 'FURNITURE AND FIXTURES', amount: 8300 },
      { id: 15, name: 'BUILDING IMPROVEMENTS', amount: 42000 },
      { id: 16, name: 'MEDICAL EQUIPMENT', amount: 15000 },
    ],
  },
]

const loadPendingUsers = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    $q.notify({
      type: 'positive',
      message: 'Appropriation refreshed!',
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

const clearAllFilters = () => {
  searchQuery.value = ''
  dialogSearchQuery.value = ''
}

const validateAndContinue = () => {
  if (showContinueDialog.value) {
    const hasSelectedAccounts = selectedAccounts.value && selectedAccounts.value.length > 0
    const hasDescription = description.value && description.value.trim() !== ''

    if (!hasSelectedAccounts) {
      $q.notify({
        type: 'negative',
        message: 'Please select at least one account to continue',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    if (!hasDescription) {
      $q.notify({
        type: 'negative',
        message: 'Please provide a description before continuing',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    continueSelected()
  }
}

const handleEnterKey = (event) => {
  event.preventDefault()
  validateAndContinue()
}

const handleContinueClick = () => {
  validateAndContinue()
}

const continueSelected = async () => {
  const totalAmount = selectedAccounts.value.reduce((sum, acc) => sum + acc.balance, 0)
  const currentDate = new Date().toISOString().split('T')[0] // Format as YYYY-MM-DD for database

  // Get the expense class from the first selected account
  // The accountName format is "expenseClass > expenseType > expenseItem"
  const firstAccount = selectedAccounts.value[0]
  const expenseClass = firstAccount.accountName.split(' > ')[0] || 'CAPITAL OUTLAYS'

  try {
    const data = {
      description: description.value,
      fiscal_year_id: contApprStore.selectedYear,
      expense_class: expenseClass,
      appropriation_amount: totalAmount,
      unappropriated_amount: totalAmount,
      continued_date: currentDate,
      accounts: selectedAccounts.value.map(acc => ({
        id: acc.id,
        balance: acc.balance
      }))
    }

    const result = await contApprStore.createContinuingAppropriation(data)
    
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Continuing appropriation created successfully!',
        icon: 'check_circle',
        position: 'top',
      })

      // Remove the used accounts from the local continueAccounts array
      const selectedAccountIds = selectedAccounts.value.map(acc => acc.id)
      contApprStore.continueAccounts = contApprStore.continueAccounts.filter(
        account => !selectedAccountIds.includes(account.id)
      )

      selectedAccounts.value = []
      description.value = ''
      dialogSearchQuery.value = ''
      showContinueDialog.value = false
    } else {
      $q.notify({
        type: 'negative',
        message: result.message || 'Failed to create continuing appropriation',
        icon: 'error',
        position: 'top',
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'An error occurred while creating continuing appropriation',
      icon: 'error',
      position: 'top',
    })
  }
}

const formatCurrency = (value) => {
  if (!value && value !== 0) return '₱0.00'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value)
}

// Utility function to safely parse currency values
const parseCurrency = (value) => {
  if (!value && value !== 0) return 0
  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
}

const displayAccounts = ref(JSON.parse(JSON.stringify(sampleAccounts)))

const openAllocationDialog = (row) => {
  selectedRow.value = {
    ...row,
    amount: row.appropriation,
    unappropriated: row.unappropriated,
    returnAmount: row.returnAmount || 0,
    augmentationAmount: row.augmentationAmount || 0,
  }

  if (row.accounts && row.accounts.length > 0) {
    displayAccounts.value = [
      {
        id: 1,
        name: 'CAPITAL OUTLAYS',
        children: row.accounts.map((acc) => ({
          id: acc.id,
          name: acc.accountName || 'Unknown Account',
          amount: acc.balance,
        })),
      },
    ]
  } else {
    displayAccounts.value = [
      {
        id: 1,
        name: 'CAPITAL OUTLAYS',
        children: [
          { id: 11, name: 'OFFICE EQUIPMENT', amount: 12000 },
          { id: 12, name: 'IT EQUIPMENT AND SOFTWARE', amount: 7600 },
          { id: 13, name: 'VEHICLES', amount: 50000 },
          { id: 14, name: 'FURNITURE AND FIXTURES', amount: 8300 },
          { id: 15, name: 'BUILDING IMPROVEMENTS', amount: 42000 },
          { id: 16, name: 'MEDICAL EQUIPMENT', amount: 15000 },
        ],
      },
    ]
  }

  showAllocationDialog.value = true
}

const calculateCategoryTotal = (category) => {
  return category.children.reduce((sum, item) => sum + (item.amount || 0), 0)
}

const calculateTypeTotal = (type) => {
  if (!type || !type.children) return 0
  return type.children.reduce((sum, item) => sum + (item.amount || 0), 0)
}

const totalAllocated = computed(() => {
  return displayAccounts.value.reduce((total, category) => {
    return total + calculateCategoryTotal(category)
  }, 0)
})

const canEditType = (expenseType) => {
  return !expenseType.children || expenseType.children.length === 0
}

const toggleType = (typeId) => {
  let hasChildren = false
  displayAccounts.value.forEach(expenseClass => {
    const expenseType = expenseClass.children?.find(type => type.id === typeId)
    if (expenseType && expenseType.children && expenseType.children.length > 0) {
      hasChildren = true
    }
  })

  if (hasChildren) {
    expandedTypes.value[typeId] = !expandedTypes.value[typeId]
  }
}

// Enhanced input handling functions - matching AppropriationTran.vue pattern
const formatInputValue = (value) => {
  if (!value && value !== 0) return ''
  const isNumber = typeof value === 'number'
  const cleanValue = String(value).replace(/,/g, '')
  const num = parseFloat(cleanValue)
  if (isNaN(num) || num === 0) return ''
  return isNumber
    ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : num.toLocaleString('en-US')
}

const handleAmountInput = (item, value) => {
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

const handleAmountBlur = (item, value) => {
  const parsed = parseFloat(value.replace(/[₱,\s]/g, ''))
  if (!isNaN(parsed)) {
    item.amount = Math.round(parsed * 100) / 100
  }
}



const canSaveAllocation = computed(() => {
  return totalAllocated.value > 0 && totalAllocated.value <= availableBudget.value
})

const validateAndSaveAllocation = async () => {
  if (showAllocationDialog.value) {
    if (!canSaveAllocation.value) {
      $q.notify({
        type: 'negative',
        message: 'Please ensure total allocated amount is greater than 0 and within available budget',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    await saveAllocation()
  }
}

const handleAllocationEnterKey = async (event) => {
  event.preventDefault()
  await validateAndSaveAllocation()
}

const handleAllocationSaveClick = async () => {
  await validateAndSaveAllocation()
}

const saveAllocation = async () => {
  const allocationData = {
    budgetId: selectedRow.value.id,
    returnAmount: returnAmount.value,
    augmentationAmount: augmentationAmount.value,
    allocations: displayAccounts.value,
    totalAllocated: totalAllocated.value,
  }

  console.log('Saving allocation:', allocationData)

  try {
    // Update the unappropriated amount in the store
    const rowIndex = continuingAppropriations.value.findIndex((r) => r.id === selectedRow.value.id)
    if (rowIndex !== -1) {
      continuingAppropriations.value[rowIndex].unappropriated -= totalAllocated.value
    }

    showAllocationDialog.value = false

    $q.notify({
      type: 'positive',
      message: 'Allocation saved successfully!',
      icon: 'check_circle',
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'An error occurred while saving allocation',
      icon: 'error',
      position: 'top',
    })
  }
}

const openViewDialog = async (row) => {
  try {
    selectedRow.value = {
      ...row,
      amount: row.appropriation,
      unappropriated: row.unappropriated,
      returnAmount: row.returnAmount || 0,
      augmentationAmount: row.augmentationAmount || 0,
    }

    // Fetch allocation history to show what was originally continued and what was allocated
    await fetchViewAllocationHistory(row.id)

    showViewDialog.value = true
  } catch (error) {
    console.error('Error opening view dialog:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load allocation history',
      icon: 'error',
      position: 'top',
    })
  }
}

// New state for view dialog
const viewAllocationHistory = ref([])
const viewLoading = ref(false)

const fetchViewAllocationHistory = async (id) => {
  try {
    viewLoading.value = true
    const config = contApprStore.getAuthConfig()
    const response = await api.get(`/api/barangay/continuing-appropriations/${id}/history`, config)
    
    const allHistory = response.data.data?.history || []
    viewAllocationHistory.value = allHistory
  } catch (error) {
    console.error('Error fetching view allocation history:', error)
    // If no history, that's fine - just show empty
    viewAllocationHistory.value = []
  } finally {
    viewLoading.value = false
  }
}

// Function to get expense name from allocation data
const getExpenseName = (allocation) => {
  if (allocation.expense_item_name) {
    return allocation.expense_item_name
  } else if (allocation.expense_type_name) {
    return allocation.expense_type_name
  } else if (allocation.expense_class_name) {
    return allocation.expense_class_name
  } else {
    return 'Unknown Expense'
  }
}

// Commit dialog functions
const openCommitDialog = async (row) => {
  try {
    commitLoading.value = true
    commitSelectedRow.value = {
      id: row.id,
      amount: parseCurrency(row.appropriation || row.amount || 0),
      unappropriated: parseCurrency(row.unappropriated || row.balance || 0),
      description: row.description || "",
    }

    // Fetch expense hierarchy and existing allocations
    await Promise.all([
      fetchCommitExpenseHierarchy(),
      fetchCommitExistingAllocations(row.id)
    ])

    showCommitDialog.value = true
  } catch (error) {
    console.error('Error opening commit dialog:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to open commit dialog',
      icon: 'error',
      position: 'top',
    })
  } finally {
    commitLoading.value = false
  }
}

const fetchCommitExpenseHierarchy = async () => {
  try {
    const config = contApprStore.getAuthConfig()
    const response = await api.get('/api/barangay/expense-hierarchy', {
      ...config,
      params: { fiscal_year_id: contApprStore.selectedYear }
    })
    
    if (response.data.status) {
      commitDisplayAccounts.value = response.data.data
    } else {
      throw new Error(response.data.message || 'Failed to fetch expense hierarchy')
    }
  } catch (error) {
    console.error('Error fetching expense hierarchy:', error)
    throw error
  }
}

const fetchCommitExistingAllocations = async (id) => {
  try {
    const config = contApprStore.getAuthConfig()
    const response = await api.get(`/api/barangay/continuing-appropriations/${id}/history`, config)
    
    const allHistory = response.data.data?.history || []
    const allAllocations = allHistory.flatMap(session => session.allocations || [])
    
    // Calculate existing allocations total
    commitExistingAllocationsTotal.value = allAllocations.reduce((sum, alloc) => sum + (alloc.amount || 0), 0)
    
    // Initialize input cache with existing allocations
    allAllocations.forEach(allocation => {
      const key = allocation.expense_item_id ? `item-${allocation.expense_item_id}` : `type-${allocation.expense_type_id}`
      commitInputCache.value[key] = allocation.amount || 0
    })
  } catch (error) {
    console.error('Error fetching existing allocations:', error)
    // If no existing allocations, that's fine
    commitExistingAllocationsTotal.value = 0
  }
}

const updateCommitAllocationAmount = (key, value) => {
  if (!value || value === '') {
    commitInputCache.value[key] = ''
    return
  }
  
  // If the value contains commas, it's a formatted display value
  if (typeof value === 'string' && value.includes(',')) {
    commitInputCache.value[key] = value
    return
  }
  
  const parsed = parseCurrency(value)
  // Ensure the value is stored with exactly 2 decimal places
  commitInputCache.value[key] = Number(parsed.toFixed(2))
}

const updateCommitUnappropriated = () => {
  // This function can be used to update any real-time calculations
}

const calculateCommitClassTotal = (expenseClass) => {
  let total = 0
  expenseClass.children?.forEach((expenseType) => {
    if ((!expenseType.children || expenseType.children.length === 0)) {
      const amount = commitInputCache.value[`type-${expenseType.id}`] || 0
      total += parseCurrency(amount)
    }
    expenseType.children?.forEach((item) => {
      const amount = commitInputCache.value[`item-${item.id}`] || 0
      total += parseCurrency(amount)
    })
  })
  return Math.round(total * 100) / 100
}

const calculateCommitTypeTotal = (type) => {
  if (!type || !type.children) return 0
  return type.children.reduce((sum, item) => {
    const amount = commitInputCache.value[`item-${item.id}`] || 0
    return sum + parseCurrency(amount)
  }, 0)
}

const getCommitTypeClass = (expenseType) => {
  return expenseType.children?.length > 0 ? 'text-weight-bold' : 'text-weight-regular'
}

const handleCommitAmountInput = (value) => {
  // Remove all non-numeric characters except decimal point
  let cleanValue = String(value).replace(/[^\d.]/g, '')
  
  // Handle multiple decimal points - keep only the first one
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }
  
  // Limit decimal places to 2
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }
  
  // Don't allow leading zeros unless it's a decimal number
  if (cleanValue.length > 1 && cleanValue[0] === '0' && cleanValue[1] !== '.') {
    cleanValue = cleanValue.substring(1)
  }
  
  // Format with commas for display
  if (cleanValue) {
    const numParts = cleanValue.split('.')
    const wholePart = numParts[0]
    const decimalPart = numParts[1] || ''
    
    // Add commas to whole number part
    const formattedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    
    // Combine with decimal part
    cleanValue = decimalPart ? `${formattedWhole}.${decimalPart}` : formattedWhole
  }
  
  return cleanValue
}

const formatToTwoDecimals = (value) => {
  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  if (cleanValue === '') return 0
  const num = parseFloat(cleanValue)
  if (isNaN(num)) return 0
  // Ensure exactly 2 decimal places
  return Number(num.toFixed(2))
}

// Function to format number with commas for display
const formatNumberWithCommas = (value) => {
  if (!value && value !== 0) return ''
  const num = parseFloat(value)
  if (isNaN(num)) return ''
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}



const submitCommitAllocation = async () => {
  try {
    const allocations = []
    let hasValidAllocation = false

    // Build allocations array
    commitDisplayAccounts.value.forEach((expenseClass) => {
      expenseClass.children?.forEach((expenseType) => {
                 if (expenseType.children?.length) {
           expenseType.children.forEach((item) => {
             const amount = commitInputCache.value[`item-${item.id}`] || 0
             const parsedAmount = parseCurrency(amount)
             if (parsedAmount > 0) {
               allocations.push({
                 id: item.id,
                 type: 'item',
                 amount: parsedAmount,
                 expense_class_id: expenseClass.id,
                 expense_type_id: expenseType.id,
                 expense_item_id: item.id
               })
               hasValidAllocation = true
             }
           })
         } else {
           const amount = commitInputCache.value[`type-${expenseType.id}`] || 0
           const parsedAmount = parseCurrency(amount)
           if (parsedAmount > 0) {
             allocations.push({
               id: expenseType.id,
               type: 'type',
               amount: parsedAmount,
               expense_class_id: expenseClass.id,
               expense_type_id: expenseType.id,
               expense_item_id: null
             })
             hasValidAllocation = true
           }
         }
      })
    })

    if (!hasValidAllocation) {
      throw new Error('Please enter at least one valid amount')
    }

    // Calculate total new allocation amount
    const totalNewAllocation = allocations.reduce((sum, allocation) => sum + allocation.amount, 0)
    const existingTotal = commitExistingAllocationsTotal.value || 0
    const actualAllocationAmount = totalNewAllocation - existingTotal

    // Validate budget
    const tolerance = 0.01
    if (actualAllocationAmount > (commitAvailableBudget.value + tolerance)) {
      const errorMsg = `Allocation amount exceeds available budget!
        Available Budget: ₱${commitAvailableBudget.value.toFixed(2)}
        New Allocation Total: ₱${totalNewAllocation.toFixed(2)}
        Existing Allocations: ₱${existingTotal.toFixed(2)}
        Net Allocation Amount: ₱${actualAllocationAmount.toFixed(2)}
        Excess Amount: ₱${(actualAllocationAmount - commitAvailableBudget.value).toFixed(2)}`
      throw new Error(errorMsg)
    }

    // Submit allocation
    await contApprStore.commitAllocation(commitSelectedRow.value.id, allocations)

    showCommitDialog.value = false
    commitInputCache.value = {}
    commitDisplayAccounts.value = []

    $q.notify({
      type: 'positive',
      message: 'Allocation saved successfully',
      icon: 'check_circle',
      position: 'top',
    })

    // Refresh the appropriations list
    await contApprStore.fetchContinuingAppropriations()
  } catch (error) {
    console.error('[ERROR] submitCommitAllocation:', error)
    let message = error.message || 'Failed to save allocation'

    if (error.response && error.response.status === 422) {
      const backendMessage = error.response.data.message || error.response.data.error
      message = `Backend Error: ${backendMessage}`
    }

    $q.notify({
      type: 'negative',
      message: message,
      icon: 'error',
      position: 'top',
    })
  }
}

// Edit allocation dialog functions
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
      type.children.push({
        id: itemId,
        name: itemName,
        amount: alloc.amount,
      })
    }
  })

  const classArr = Object.values(classMap)
  classArr.forEach(cls => {
    cls.children.sort((a, b) => a.id - b.id)
    cls.children.forEach(type => {
      if (type.children) {
        type.children.sort((a, b) => a.id - b.id)
      }
    })
  })

  editDisplayAccounts.value = classArr
}

const toggleEditType = (typeId) => {
  let hasChildren = false
  editDisplayAccounts.value.forEach(expenseClass => {
    const expenseType = expenseClass.children?.find(type => type.id === typeId)
    if (expenseType && expenseType.children && expenseType.children.length > 0) {
      hasChildren = true
    }
  })

  if (hasChildren) {
    expandedEditTypes.value[typeId] = !expandedEditTypes.value[typeId]
  }
}

const openEditAllocationDialog = async (row) => {
  editLoading.value[row.id] = true
  try {
    const config = contApprStore.getAuthConfig()
    const response = await api.get(`/api/barangay/continuing-appropriations/${row.id}/history`, config)
    const allHistory = response.data.data?.history || []

    // Combine ALL allocations from all history sessions, not just the latest
    const allAllocations = allHistory.flatMap(session => session.allocations || [])

    // Group by expense hierarchy to combine amounts for the same expense items/types
    const allocationMap = new Map()

    allAllocations.forEach(allocation => {
      const key = `${allocation.expense_class_id}-${allocation.expense_type_id}-${allocation.expense_item_id || 'null'}`

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
    selectedRow.value = row
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

const handleEditAmountBlur = (item, value) => {
  const parsed = parseFloat(value.replace(/[₱,\s]/g, ''))
  if (!isNaN(parsed)) {
    item.amount = Math.round(parsed * 100) / 100
  }
}

const saveEditedAllocation = async () => {
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
            expense_item_id: null
          })
        }

        if (!canEditType(expenseType) && parseCurrency(expenseType.amount) > 0) {
          throw new Error(`Cannot set amount for type "${expenseType.name}" because it has items. Type amount should be the sum of its items.`)
        }

        if (expenseType.children && Array.isArray(expenseType.children)) {
          expenseType.children.forEach((item) => {
            if (!item) return

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
              expense_item_id: item.id
            })
          })
        }
      })
    })

    const currentUnappropriated = selectedRow.value?.unappropriated || 0

    const originalAllocationsTotal = editAllocations.value.reduce((sum, allocation) => {
      return sum + (allocation.amount || 0)
    }, 0)

    // Calculate available budget by adding back the original allocations
    const availableBudgetForEdit = currentUnappropriated + originalAllocationsTotal

    if (totalAllocated > availableBudgetForEdit) {
      throw new Error(`Total allocation (₱${totalAllocated.toFixed(2)}) exceeds available budget (₱${availableBudgetForEdit.toFixed(2)})`)
    }

    // Use the appropriation store's commitAllocation method instead of calling API directly
    await contApprStore.commitAllocation(selectedRow.value.id, allocations)

    $q.notify({
      type: 'positive',
      message: 'Allocations updated',
      icon: 'check_circle',
      position: 'top',
    })
    showEditAllocationDialog.value = false
    typeErrorMap.value = {}
    await contApprStore.fetchContinuingAppropriations()
  } catch (error) {
    let message = error.message || 'Failed to update allocations'
    if (error.response && error.response.status === 422 && error.response.data && error.response.data.message) {
      message = error.response.data.message
      const errorMap = {}
      editDisplayAccounts.value.forEach(expenseClass => {
        if (!expenseClass || !Array.isArray(expenseClass.children)) return
        expenseClass.children.forEach(expenseType => {
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
      message,
      icon: 'error',
      position: 'top',
    })
    console.error(error)
  }
}

onMounted(async () => {
  try {
    await contApprStore.fetchContinueAccounts()
    await contApprStore.fetchYears()
    await contApprStore.fetchContinuingAppropriations()

    // Log page visit
    const { logPageVisit } = usePageLogging()
    await logPageVisit('Continuing Appropriation')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to load data',
      position: 'top',
    })
  } finally {
    generalLoading.value = false
  }
})

defineExpose({
  openAllocationDialog,
})
</script>

<style scoped>
.cont-appr {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
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

/* Allocation Dialog Text Box Styles */
.allocation-input {
  min-width: 180px;
  width: 180px;
}

/* Edit Allocation Dialog Text Box Styles */
.edit-allocation-input {
  min-width: 180px;
  width: 180px;
}

/* Responsive text box sizing for Allocation dialog */
@media (max-width: 1200px) {
  .allocation-input {
    min-width: 150px;
    width: 150px;
  }
  
  .edit-allocation-input {
    min-width: 150px;
    width: 150px;
  }
}

@media (max-width: 900px) {
  .allocation-input {
    min-width: 120px;
    width: 120px;
  }
  
  .edit-allocation-input {
    min-width: 120px;
    width: 120px;
  }
}

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }

  .row.items-center.q-gutter-sm {
    flex-direction: column;
    align-items: stretch;
  }

  .row.items-center.q-gutter-sm > * {
    margin-bottom: 8px;
    width: 100%;
  }

  .search-input {
    min-width: 100%;
  }

  /* Mobile adjustments for Allocation dialog */
  .allocation-input {
    min-width: 100px;
    width: 100px;
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
</style>
