<template>
  <q-page class="q-pa-lg accountslib-page">
    <div class="page-header q-mb-lg">
         <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">Accounts Library</div>
          <q-btn
          icon="refresh"
          color="primary"
          flat
          round
          @click="loadPendingUsers"
          :loading="loading"
          title="Refresh pending users"
        />
    </div>
  </div>
    <!-- Top Controls -->
    <!-- Main Card -->
    <q-card
      class="q-pa-none shadow-3 rounded-borders q-mx-auto Main-card"
      style="overflow: hidden; max-width: 1200px; height: 70vh"
    >
      <!-- Header Section -->
      <div class="row items-center justify-between bg-grey-3 q-pa-md">
        <q-select
          v-model="selectedYear"
          :options="accountsStore.yearOptions"
          label="Select Year"
          outlined
          dense
          style="width: 300px"
          :loading="accountsStore.loading"
          :disable="accountsStore.loading || !accountsStore.yearOptions.length"
          emit-value
          map-options
        >
          <template v-slot:selected>
            <span v-if="selectedYearDisplay">
              {{ selectedYearDisplay }}
            </span>
            <span v-else class="text-grey"> Current Year: {{ currentYearDisplay }} </span>
          </template>
          <template
            v-if="accountsStore.yearOptions.length === 0 && !accountsStore.loading"
            #no-option
          >
            <q-item>
              <q-item-section class="text-grey">No years available</q-item-section>
            </q-item>
          </template>
        </q-select>

        <div>
          <q-btn
            icon="add"
            label="Add Year"
            class="allocate-btn"
            @click="showAddYearDialog = true"
          />
          <q-btn
            icon="content_copy"
            label="Copy to Another Year"
            @click="showCopyDialog = true"
            :disable="!selectedYear || yearOptions.length < 2"
            class="q-ml-sm allocate-btn"
          />
        </div>
      </div>

      <q-card flat class="q-pt-xs rounded-borders bg-white">
        <!-- Add Account Button -->
        <div class="scroll-content q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <!-- Search Input (left-aligned) -->
            <q-input
              v-model="searchQuery"
              dense
              outlined
              placeholder="Search..."
              class="col-md-4 col-sm-6 col-xs-12"
              style="min-width: 300px"
            >
              <template #append>
                <q-icon name="search" />
              </template>
            </q-input>

            <!-- Add Account Button  -->
            <q-btn
              icon="add"
              label="Add Account"
              @click="showAddClassForm"
              :disable="!selectedYear"
              class="col-auto allocate-btn"
            />
          </div>

          <!-- Account Entries Exapandable -->
          <div ref="sortableContainer" style="max-height: calc(70vh - 150px); overflow-y: auto" >
            <template v-for="expenseClass in filteredExpenseClasses" :key="expenseClass.id">
              <div
                class="draggable-item"
                :data-id="expenseClass.id"
                @mouseover="hoveredClass = expenseClass.id"
                @mouseleave="hoveredClass = null"

              >
                <q-card flat bordered class="q-mb-sm shadow-1">
                  <q-expansion-item
                    :model-value="expandedClasses[expenseClass.id]"
                    @update:model-value="toggleExpansion(expenseClass.id)"
                    class="rounded-borders"
                    header-class="q-pa-none"
                    expand-icon-class="hidden"
                    dense

                  >
                  <!--  EXPENSE CLASS -->
                    <template #header>
                      <div
                        class="bg-green-4 q-pa-md full-width row items-center justify-between rounded-borders "
                        style="border: 1px solid #e0e0e0"

                      >
                        <div class="row items-center " >
                          <q-icon name="drag_indicator" class="drag-handle q-mr-sm" />
                          <div class="text-body1 text-weight-medium " >{{ expenseClass.name }}</div>
                        </div>
                        <div class="row items-center q-gutter-sm ">
                          <q-btn

                            dense
                            flat
                            round
                            icon="edit"
                            class="edit-btn"
                            @click.stop="editExpenseClass(expenseClass)"
                          />
                          <q-btn
                            dense
                            flat
                            round
                            icon="delete"
                            class="delete-btn"
                            @click.stop="confirmDeleteExpenseClass(expenseClass)"
                          />
                          <q-btn
                            dense
                            flat
                            round
                            icon="add"
                            class="allocate-btn"
                            @click.stop="showAddTypeForm(expenseClass)"
                          />
                          <q-icon
                            :name="expandedClasses[expenseClass.id] ? 'expand_less' : 'expand_more'"
                            color="grey"
                          />
                        </div>
                      </div>
                    </template>

                    <!-- Expanded Content (with drag for types) -->
                    <div class="q-pa-md ">
                      <div class="text-subtitle1 text-weight-medium q-mb-xs "></div>
                      <div class="text-caption text-grey-7 q-mb-md ">
                        Expenses under {{ expenseClass.name }}
                      </div>

                      <!--Expense Type-->
                      <div

                        :ref="(el) => initTypeContainer(el, expenseClass.id)"
                        class="type-container"

                      >
                        <template
                          v-for="expenseType in getExpenseTypesForClass(expenseClass.id)"
                          :key="expenseType.id"
                        >
                          <div class="draggable-type" :data-id="expenseType.id">
                            <q-card flat bordered class="q-mb-xs shadow-1">
                              <q-expansion-item
                                v-model="expandedTypes[expenseType.id]"
                                class="type-expansion"
                                header-class="q-pa-none"
                                expand-icon-class="hidden"
                              >
                              <!-- EXPENSE TYPE -->
                                <template #header>
                                  <div
                                    class="bg-green-2 q-pa-sm full-width row items-center justify-between rounded-borders"
                                  >
                                    <div class="row items-center">
                                      <q-icon name="drag_indicator" class="drag-handle q-mr-sm" />
                                      <div class="text-body2">{{ expenseType.name }}</div>
                                    </div>
                                    <div class="row items-center q-gutter-xs">
                                      <q-btn
                                        dense
                                        flat
                                        round
                                        icon="edit"
                                        class="edit-btn"
                                        @click.stop="editExpenseType(expenseType)"
                                      />
                                      <q-btn
                                        dense
                                        flat
                                        round
                                        icon="delete"
                                        class="delete-btn"
                                        @click.stop="confirmDeleteExpenseType(expenseType)"
                                      />
                                      <q-btn
                                        dense
                                        flat
                                        round
                                        icon="add"
                                        class="allocate-btn"
                                        @click.stop="showAddItemDialogForType(expenseType)"
                                      />
                                      <q-icon
                                        :name="
                                          expandedTypes[expenseType.id]
                                            ? 'expand_less'
                                            : 'expand_more'
                                        "
                                        color="grey"
                                        class="q-ml-xs"
                                      />
                                    </div>
                                  </div>
                                </template>

                                <!-- Expense Items List as Expansion Item -->
                                <div class="q-ml-lg">
                                  <div class=" text-caption text-grey-7 q-mb-md q-ml-md">
                                    Expenses under {{ expenseType.name }}
                                  </div>
                                  <div class="q-p-xs item-container ">
                                    <div
                                      :ref="
                                        (el) => {
                                          if (el) initItemContainer(el, expenseType.id)
                                        }
                                      "
                                      class="item-container "
                                    >
                                      <template
                                        v-for="item in getExpenseItemsForType(expenseType.id)"
                                        :key="item.id"
                                      >
                                        <!-- EXPENSE ITEM -->
                                        <div class="draggable-item " :data-id="item.id">
                                          <q-card flat bordered style="max-width: 100%" >
                                            <div class="bg-green-1  q-pa-xs row items-center justify-between">
                                              <div class="row items-center justify-center">
                                                <q-icon
                                                  name="drag_indicator"
                                                  class="drag-handle q-mr-sm"
                                                />
                                                <div class="text-body2">{{ item.name }}</div>
                                              </div>
                                              <div class="row no-wrap items-center">
                                                <q-btn
                                                  dense
                                                  flat
                                                  round
                                                  icon="edit"
                                                  class="edit-btn"
                                                  @click="editExpenseItem(item)"
                                                />
                                                <q-btn
                                                  dense
                                                  flat
                                                  round
                                                  icon="delete"
                                                  class="delete-btn"
                                                  @click="confirmDeleteExpenseItem(item)"
                                                />
                                              </div>
                                            </div>
                                          </q-card>
                                        </div>
                                      </template>
                                    </div>
                                  </div>
                                </div>
                              </q-expansion-item>
                            </q-card>
                          </div>
                        </template>
                      </div>
                    </div>
                  </q-expansion-item>
                </q-card>
              </div>
            </template>
          </div>
        </div>
      </q-card>
    </q-card>

    <!-- Add Year Dialog -->
    <q-dialog v-model="showAddYearDialog" persistent>
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Add New Fiscal Year</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="newYear"
            filled
            label="Year (YYYY)"
            mask="####"
            outlined
            :rules="[
              (val) => !!val || 'Year is required',
              (val) => val?.length === 4 || 'Must be 4 digits',
              (val) =>
                !accountsStore.years.some((y) => y.year.toString() === val) ||
                'Year already exists',
            ]"
            :disable="accountsStore.loading"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="black" :disable="accountsStore.loading" v-close-popup />
          <q-btn
            flat
            label="Save"
            class="modal-save-btn"
            @click="addYear"
            :loading="accountsStore.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!--AddExpenseClass-->
    <q-dialog v-model="showAddClassDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add New Expense Class</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="newExpenseClass"
            label="Expense Class Name"
            outlined
            :rules="[(val) => !!val || 'Required']"
            @keyup.enter="saveExpenseClass"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup @click="resetClassForm" />
          <q-btn flat label="Save" class="modal-save-btn" @click="saveExpenseClass" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!--AddExpenseType-->
    <q-dialog v-model="showAddTypeDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <!-- Dynamic header showing parent class -->
          <div class="text-h6">Add New Expense Type in {{ getSelectedClassName() }}</div>
        </q-card-section>
        <q-card-section>
          <!-- Simple input (no select options) -->
          <q-input
            v-model="newExpenseType.name"
            label="Type Name"
            outlined
            :rules="[(val) => !!val || 'Required']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup @click="resetTypeForm" />
          <q-btn flat label="Save" class="modal-save-btn" @click="saveExpenseType" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Copy to Another Year -->
    <q-dialog v-model="showCopyDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Copy to Another Year</div>
        </q-card-section>

        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">Select Target Year:</div>
          <q-select
            v-model="copyTargetYear"
            :options="accountsStore.yearOptions.filter((y) => y.value !== selectedYear)"
            label="Target Year"
            outlined
            emit-value
            map-options
            option-value="value"
            option-label="label"
            :rules="[(val) => !!val || 'Required']"
            @update:model-value="checkForDuplicates"
          />
          <template v-slot:selected>
            {{
              copyTargetYear
                ? yearOptions.find((y) => y.value === copyTargetYear)?.label
                : 'Select year'
            }}
          </template>

          <div v-if="duplicateWarning" class="text-warning q-mt-sm q-mb-sm">
            <q-icon name="warning" /> {{ duplicateWarning }}
          </div>

          <div class="text-subtitle2 q-mt-md q-mb-sm">Select Classes to Copy:</div>

          <!-- Add Select All checkbox -->
          <q-item tag="label" class="q-mb-sm">
            <q-item-section side>
              <q-checkbox
                v-model="allSelected"
                @click="toggleSelectAll"
                :indeterminate="
                  selectedClassesToCopy.length > 0 &&
                  selectedClassesToCopy.length < availableClassesToCopy.length
                "
              />
            </q-item-section>
            <q-item-section>
              <q-item-label><strong>Select All</strong></q-item-label>
            </q-item-section>
          </q-item>

          <q-list bordered>
            <q-item
              v-for="expenseClass in filteredExpenseClasses"
              :key="expenseClass.id"
              tag="label"
            >
              <q-item-section side>
                <q-checkbox
                  v-model="selectedClassesToCopy"
                  :val="expenseClass.id"
                  :disable="classExistsInYear(expenseClass.name, copyTargetYear)"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ expenseClass.name }}</q-item-label>
                <q-item-label caption>
                  {{ getExpenseTypesForClass(expenseClass.id).length }} types
                  <span
                    v-if="classExistsInYear(expenseClass.name, copyTargetYear)"
                    class="text-warning"
                  >
                    (Already exists in {{ copyTargetYear }})
                  </span>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Copy"
            class="modal-save-btn"
            @click="copyClassesToYear"
            :loading="accountsStore.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Dialogs in Expense Class -->
    <q-dialog v-model="showEditClassDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Edit Expense Class</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="editingExpenseClass.name"
            label="Expense Class Name"
            outlined
            :rules="[(val) => !!val || 'Name is required']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="updateExpenseClass" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Expense Type Dialog -->
    <q-dialog v-model="showEditTypeDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Edit Expense Type</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="editingExpenseType.name"
            label="Expense Type Name"
            outlined
            :rules="[(val) => !!val || 'Name is required']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="updateExpenseType" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card style="border-radius: 10px; width: 500px; padding: 20px">
        <!-- Close button -->
        <q-btn
          flat
          round
          icon="close"
          style="position: absolute; top: 10px; right: 10px; color: #888"
          v-close-popup
        />

        <!-- Icon section -->
        <q-card-section class="text-center">
          <q-icon
            name="delete"
            size="40px"
            style="background-color: #ffe6e6; color: #ff4d4d; border-radius: 50%; padding: 15px"
          />
        </q-card-section>

        <!-- Title section -->
        <q-card-section class="text-center" style="padding-top: 0">
          <div class="text-h6" style="font-weight: bold; color: #333">Confirm Delete</div>
        </q-card-section>

        <!-- Description section -->
        <q-card-section class="text-center" style="padding-top: 0; color: #555">
          Are you sure you want to delete {{ itemToDelete?.name }}?<br />
        </q-card-section>

        <!-- Action buttons -->
        <q-card-actions align="center" style="padding-bottom: 20px">
          <q-btn
            flat
            label="Cancel"
            style="
              border: 1px solid #ccc;
              border-radius: 10px;
              padding: 8px 40px;
              margin-right: 20px;
              color: #333;
              background-color: #fff;
            "
            v-close-popup
          />
          <q-btn
            flat
            label="Delete"
            style="border-radius: 10px; padding: 8px 40px; color: #fff; background-color: #d32f2f"
            @click="confirmDelete"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Item Dialog -->
    <q-dialog v-model="showAddItemDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add New Expense Item</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="newExpenseItem.name"
            label="Item Name"
            outlined
            :rules="[(val) => !!val || 'Name is required']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Save" class="modal-save-btn" @click="saveExpenseItem" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Item Dialog -->
    <q-dialog v-model="showEditItemDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Edit Expense Item</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="editingExpenseItem.name"
            label="Item Name"
            outlined
            :rules="[(val) => !!val || 'Name is required']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="updateExpenseItem" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- (Same as previous implementation) -->
  </q-page>
</template>
<script setup>
const loading = ref(false)

const loadPendingUsers = async () => {
  loading.value = true
  try {
    await accountsStore.fetchYears()
    if (selectedYear.value) {
      await accountsStore.fetchExpenseClasses(selectedYear.value)
    }
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
import Sortable from 'sortablejs'
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useAccountsLibraryStore } from 'stores/accountsLibstore'

const $q = useQuasar()
const accountsStore = useAccountsLibraryStore()

// State
const searchQuery = ref('')
const newYear = ref((new Date().getFullYear() + 1).toString())
const selectedYearDisplay = ref(null)
const selectedYear = computed({
  get: () => accountsStore.selectedYear,
  set: (value) => {
    accountsStore.selectedYear = value
    selectedYearDisplay.value =
      accountsStore.yearOptions.find((y) => y.value === value)?.yearValue || null
    if (value) {
      loadExpenseClassesForYear(value)
    }
  },
})

const currentYearDisplay = computed(() => {
  return new Date().getFullYear().toString()
})

// Expense Classes
const expenseClasses = computed(() => accountsStore.expenseClasses)

const newExpenseClass = ref('')
const editingExpenseClass = ref(null)
const hoveredClass = ref(null)
const expandedClasses = ref({})
const currentParentClass = ref(null)

// Expense Types
//const expenseTypes = ref([])
const newExpenseType = ref({ name: '', classId: null })
const editingExpenseType = ref(null)
const expandedTypes = ref({})

// Expense Items
//const expenseItems = ref([])
const currentParentType = ref(null)
const newExpenseItem = ref({ name: '', typeId: null })
const editingExpenseItem = ref(null)

// Dialog controls
const showAddYearDialog = ref(false)
const showCopyDialog = ref(false)
const showAddClassDialog = ref(false)
const showAddTypeDialog = ref(false)
const showAddItemDialog = ref(false)
const showEditClassDialog = ref(false)
const showEditTypeDialog = ref(false)
const showEditItemDialog = ref(false)
const showDeleteConfirm = ref(false)

// Copy related
const copyTargetYear = ref(null)
const selectedClassesToCopy = ref([])
const duplicateWarning = ref(null)
const allSelected = ref(false)

// Sortable
const sortableContainer = ref(null)
const typeSortables = ref({})
const itemToDelete = ref(null)
const deleteType = ref('')

// Computed properties
const yearOptions = computed(() => accountsStore.yearOptions)

const filteredExpenseClasses = computed(() => {
  if (!selectedYear.value) return []

  return accountsStore.expenseClasses
    .filter((ec) => ec.year == selectedYear.value) // Note: == for string/number comparison
    .filter(
      (ec) =>
        ec.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (ec.types || []).some((et) =>
          et.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
        ),
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0))
})

const addYear = async () => {
  const yearStr = newYear.value?.toString().trim()

  if (!yearStr || yearStr.length !== 4 || isNaN(yearStr)) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a valid 4-digit year',
      position: 'top',
    })
    return
  }

  try {
    await accountsStore.addYear(yearStr)
    $q.notify({
      type: 'positive',
      message: `Year ${yearStr} added successfully`,
      position: 'top',
    })
    newYear.value = new Date().getFullYear().toString() // Reset to current year
    showAddYearDialog.value = false
    await accountsStore.fetchYears()
    selectedYear.value = yearStr
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to add year',
      position: 'top',
    })
  }
}

// Expense Class related functions
const showAddClassForm = () => {
  newExpenseClass.value = ''
  showAddClassDialog.value = true
}

const saveExpenseClass = async () => {
  if (!newExpenseClass.value) {
    $q.notify({ type: 'negative', message: 'Class name is required' })
    return
  }

  if (!selectedYear.value) {
    $q.notify({
      type: 'negative',
      message: 'Please select a year first',
      position: 'top',
    })
    return
  }

  try {
    // Convert to uppercase
    const upperCaseName = newExpenseClass.value.toUpperCase()

    await accountsStore.createExpenseClass({
      name: upperCaseName,
      fiscalYearId: selectedYear.value,
    })

    $q.notify({ type: 'positive', message: 'Class added successfully' })
    resetClassForm()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to add expense class',
      position: 'top',
    })
  }
}

const resetClassForm = () => {
  newExpenseClass.value = ''
  showAddClassDialog.value = false
}

const editExpenseClass = (expenseClass) => {
  editingExpenseClass.value = { ...expenseClass }
  showEditClassDialog.value = true
}

const updateExpenseClass = async () => {
  try {
    if (!selectedYear.value) {
      throw new Error('Please select a year first')
    }

    const fiscalYear = accountsStore.years.find((y) => y.id === selectedYear.value)
    if (!fiscalYear) {
      throw new Error('Selected year not found in database')
    }

    // Convert to uppercase
    const upperCaseName = editingExpenseClass.value.name.toUpperCase()

    await accountsStore.updateExpenseClass({
      ...editingExpenseClass.value,
      name: upperCaseName,
      fiscalYearId: fiscalYear.id,
    })

    $q.notify({
      type: 'positive',
      message: 'Class updated successfully',
      position: 'top',
    })
    showEditClassDialog.value = false
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to update expense class',
      position: 'top',
    })
  }
}
const confirmDeleteExpenseClass = (expenseClass) => {
  itemToDelete.value = expenseClass
  deleteType.value = 'class'
  showDeleteConfirm.value = true
}

// Methods
const loadExpenseClassesForYear = async (yearId) => {
  try {
    await accountsStore.fetchExpenseClasses(yearId)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to load expense classes',
      position: 'top',
    })
  }
}

const handleSortEnd = (evt) => {
  const items = [...filteredExpenseClasses.value]
  const [movedItem] = items.splice(evt.oldIndex, 1)
  items.splice(evt.newIndex, 0, movedItem)

  // Update order locally only
  items.forEach((item, index) => {
    const foundClass = accountsStore.expenseClasses.find((c) => c.id === item.id)
    if (foundClass) {
      foundClass.order = index
    }
  })

  $q.notify({
    type: 'info',
    message: 'Order changed (not saved to server)',
    timeout: 1000,
  })
}
// Expense Type related functions
const showAddTypeForm = (expenseClass) => {
  currentParentClass.value = expenseClass
  newExpenseType.value = { name: '', classId: expenseClass.id }
  showAddTypeDialog.value = true
}

const getSelectedClassName = () => {
  return currentParentClass.value?.name || 'Selected Class'
}

const saveExpenseType = async () => {
  try {
    // Debug logs
    console.log('Current parent class:', currentParentClass.value)
    console.log('Selected year:', selectedYear.value)
    console.log('New type name:', newExpenseType.value.name)

    if (!newExpenseType.value.name) {
      throw new Error('Type name is required')
    }

    if (!currentParentClass.value?.id) {
      throw new Error('Parent class not selected')
    }

    // Find the fiscal year (using ID from selectedYear)
    const fiscalYear = accountsStore.years.find((y) => y.id == selectedYear.value)
    console.log('Found fiscal year:', fiscalYear)

    if (!fiscalYear) {
      throw new Error('Selected year not found in database')
    }

    // Convert to uppercase
    const upperCaseName = newExpenseType.value.name.toUpperCase()

    // Add the new type
    const newType = await accountsStore.createExpenseType({
      name: upperCaseName,
      expenseClassId: currentParentClass.value.id,
      fiscalYearId: fiscalYear.id,
      year: fiscalYear.year.toString(),
    })

    console.log('Successfully created type:', newType)

    // Manually add to local state if needed
    if (!accountsStore.expenseTypes.some((t) => t.id === newType.id)) {
      accountsStore.expenseTypes.push({
        id: newType.id,
        name: newType.name,
        expense_class_id: newType.expense_class_id,
        year: fiscalYear.year.toString(),
        order: newType.order || 0,
      })
    }

    $q.notify({ type: 'positive', message: 'Type added successfully' })
    resetTypeForm()

    // Force update the display
    await nextTick()
  } catch (error) {
    console.error('Error adding expense type:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to add expense type',
      position: 'top',
    })
  }
}

const resetTypeForm = () => {
  newExpenseType.value = { name: '', classId: null }
  showAddTypeDialog.value = false
}

const editExpenseType = (expenseType) => {
  editingExpenseType.value = { ...expenseType }
  showEditTypeDialog.value = true
}

const updateExpenseType = async () => {
  try {
    // Convert to uppercase
    const upperCaseName = editingExpenseType.value.name.toUpperCase()

    await accountsStore.updateExpenseType({
      id: editingExpenseType.value.id,
      expenseClassId: editingExpenseType.value.expense_class_id,
      name: upperCaseName,
      order: editingExpenseType.value.order,
    })

    $q.notify({ type: 'positive', message: 'Type updated successfully' })
    showEditTypeDialog.value = false
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to update expense type',
      position: 'top',
    })
  }
}

const confirmDeleteExpenseType = async (expenseType) => {
  try {
    await accountsStore.deleteExpenseType({
      id: expenseType.id,
      expenseClassId: expenseType.expense_class_id,
    })

    $q.notify({ type: 'positive', message: 'Type deleted successfully' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to delete expense type',
      position: 'top',
    })
  }
}

// Expense Item related functions

const resetItemForm = () => {
  newExpenseItem.value = { name: '', typeId: null }
  currentParentType.value = null
  showAddItemDialog.value = false
}

const showAddItemDialogForType = (expenseType) => {
  // Debug log to verify the parent type
  console.log('Setting parent type for new item:', {
    typeId: expenseType.id,
    typeName: expenseType.name,
    classId: expenseType.expense_class_id,
  })

  currentParentType.value = expenseType
  newExpenseItem.value = {
    name: '',
    typeId: expenseType.id,
    // Include class ID for better debugging
    expense_class_id: expenseType.expense_class_id,
  }
  showAddItemDialog.value = true
}

const saveExpenseItem = async () => {
  try {
    if (!newExpenseItem.value.name) {
      throw new Error('Item name is required')
    }

    if (!currentParentType.value) {
      console.error('No parent type selected:', currentParentType.value)
      throw new Error('Parent type not selected')
    }

    // Capitalize first letter of each word
    const capitalizedName = newExpenseItem.value.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    await accountsStore.createExpenseItem({
      name: capitalizedName,
      expenseClassId: currentParentType.value.expense_class_id,
      expenseTypeId: currentParentType.value.id,
    })

    $q.notify({
      type: 'positive',
      message: 'Item added successfully',
      position: 'top',
    })
    resetItemForm()
  } catch (error) {
    console.error('Error saving expense item:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to add expense item',
      position: 'top',
    })
  }
}

const editExpenseItem = (item) => {
  editingExpenseItem.value = { ...item }
  showEditItemDialog.value = true
}

const updateExpenseItem = async () => {
  try {
    const parentType = accountsStore.expenseTypes.find(
      (et) => et.id === editingExpenseItem.value.expense_type_id,
    )

    if (!parentType) {
      throw new Error('Parent type not found')
    }

    await accountsStore.updateExpenseItem({
      id: editingExpenseItem.value.id,
      expenseClassId: parentType.expense_class_id,
      expenseTypeId: parentType.id,
      name: editingExpenseItem.value.name,
      order: editingExpenseItem.value.order || 0,
    })

    $q.notify({
      type: 'positive',
      message: 'Item updated successfully',
      position: 'top',
    })
    showEditItemDialog.value = false
  } catch (error) {
    console.error('Error updating item:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to update item',
      position: 'top',
    })
  }
}

const confirmDeleteExpenseItem = async (item) => {
  try {
    // Find parent type
    const parentType = accountsStore.expenseTypes.find((et) => et.id == item.expense_type_id)

    if (!parentType) {
      throw new Error('Parent type not found')
    }

    await accountsStore.deleteExpenseItem({
      id: item.id,
      expenseClassId: parentType.expense_class_id,
      expenseTypeId: parentType.id,
    })

    $q.notify({ type: 'positive', message: 'Item deleted successfully' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to delete expense item',
      position: 'top',
    })
  }
}

// Helper functions
const getExpenseTypesForClass = computed(() => (classId) => {
  if (!selectedYear.value || !classId) {
    console.warn('Missing required values:', {
      selectedYear: selectedYear.value,
      classId,
    })
    return []
  }

  // Find the fiscal year to get the year value
  const fiscalYear = accountsStore.years.find((y) => y.id == selectedYear.value)
  const yearValue = fiscalYear?.year?.toString()

  console.log('Filtering types for:', {
    classId,
    yearValue,
    allTypes: accountsStore.expenseTypes,
  })

  return accountsStore.expenseTypes
    .filter((et) => et.expense_class_id == classId && et.year == yearValue)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
})

const getExpenseItemsForType = (typeId) => {
  if (!selectedYear.value) {
    console.log('No year selected - returning empty items list')
    return []
  }

  // Find the fiscal year to get the year value
  const fiscalYear = accountsStore.years.find((y) => y.id == selectedYear.value)
  const yearValue = fiscalYear?.year?.toString()

  console.log(`Filtering items for type ${typeId} and year ${yearValue}`)

  return accountsStore.expenseItems
    .filter((item) => item.expense_type_id == typeId && item.year == yearValue)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

const classExistsInYear = (className, year) => {
  return expenseClasses.value.some(
    (ec) => ec.name.toLowerCase() === className.toLowerCase() && ec.year === year,
  )
}

/*const typeExistsInClass = (typeName, classId) => {
  return expenseTypes.value.some(
    (et) => et.name.toLowerCase() === typeName.toLowerCase() && et.classId === classId,
  )
}*/

// Copy related functions
const checkForDuplicates = () => {
  duplicateWarning.value = null
  if (copyTargetYear.value) {
    const duplicates = selectedClassesToCopy.value.filter((classId) => {
      const classToCheck = accountsStore.expenseClasses.find((ec) => ec.id === classId)
      return classExistsInYear(classToCheck?.name, copyTargetYear.value)
    })

    if (duplicates.length > 0) {
      duplicateWarning.value = `The following classes already exist in ${copyTargetYear.value}: ${duplicates
        .map((id) => {
          const cls = accountsStore.expenseClasses.find((ec) => ec.id === id)
          return cls?.name || 'Unknown'
        })
        .join(', ')}`
    }
  }
}

const copyClassesToYear = async () => {
  try {
    if (!copyTargetYear.value || selectedClassesToCopy.value.length === 0) {
      throw new Error('Please select a target year and at least one class')
    }

    console.log('Starting copy process', {
      sourceYearId: selectedYear.value,
      targetYearId: copyTargetYear.value,
      classes: selectedClassesToCopy.value,
      allYears: accountsStore.years,
    })

    const result = await accountsStore.copyClassesToYear(
      selectedYear.value,
      copyTargetYear.value,
      selectedClassesToCopy.value,
    )

    // Make the notification more resilient
    const copiedClasses = result?.stats?.copied_classes || 'unknown number of'
    const copiedTypes = result?.stats?.copied_types || 'unknown number of'

    $q.notify({
      type: 'positive',
      message: `Copied ${copiedClasses} classes and ${copiedTypes} types`,
      position: 'top',
    })

    // Reset dialog
    selectedClassesToCopy.value = []
    copyTargetYear.value = null
    showCopyDialog.value = false

    // Refresh data
    await accountsStore.fetchExpenseClasses(selectedYear.value)
  } catch (error) {
    console.error('Copy failed:', error)

    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || error.message || 'Failed to copy classes',
      position: 'top',
      timeout: 5000,
    })
  }
}

const availableClassesToCopy = computed(() => {
  return filteredExpenseClasses.value.filter(
    (ec) => !classExistsInYear(ec.name, copyTargetYear.value),
  )
})

// Method to toggle select all
const toggleSelectAll = () => {
  if (allSelected.value) {
    // Select all available (non-disabled) classes
    selectedClassesToCopy.value = availableClassesToCopy.value.map((ec) => ec.id)
  } else {
    // Clear selection
    selectedClassesToCopy.value = []
  }
}

// Watch for changes in selection to update the "Select All" checkbox state
watch(
  selectedClassesToCopy,
  (newVal) => {
    const availableIds = availableClassesToCopy.value.map((ec) => ec.id)
    const selectedAvailable = newVal.filter((id) => availableIds.includes(id))

    allSelected.value = selectedAvailable.length === availableIds.length && availableIds.length > 0
  },
  { deep: true },
)

// Delete function
const confirmDelete = async () => {
  try {
    if (deleteType.value === 'class') {
      await accountsStore.deleteExpenseClass(itemToDelete.value.id)
      $q.notify({
        type: 'positive',
        message: 'Class deleted successfully',
        position: 'top',
      })
    }
    showDeleteConfirm.value = false
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to delete',
      position: 'top',
    })
  }
}

// Sortable functions
const initTypeContainer = (el, classId) => {
  if (el && !typeSortables.value[classId]) {
    typeSortables.value[classId] = new Sortable(el, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: async (evt) => {
        // Call the computed function as a function
        const types = [...(getExpenseTypesForClass.value(classId) || [])]

        if (!types.length) {
          console.error('No types found for class:', classId)
          return
        }

        const [movedType] = types.splice(evt.oldIndex, 1)
        types.splice(evt.newIndex, 0, movedType)

        try {
          await Promise.all(
            types.map((type, index) =>
              accountsStore.updateExpenseType({
                id: type.id,
                expenseClassId: classId,
                name: type.name,
                order: index,
              }),
            ),
          )

          $q.notify({
            type: 'positive',
            message: 'Order updated successfully',
            timeout: 1000,
            position: 'top',
          })
        } catch (error) {
          console.error('Failed to update type order:', error)
          $q.notify({
            type: 'negative',
            message: 'Failed to save order: ' + error.message,
            position: 'top',
          })
        }
      },
    })
  }
}

const initItemContainer = (el, typeId) => {
  if (el && !el.sortable) {
    el.sortable = new Sortable(el, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: async (evt) => {
        const items = [...getExpenseItemsForType(typeId)]
        const [movedItem] = items.splice(evt.oldIndex, 1)
        items.splice(evt.newIndex, 0, movedItem)

        const parentType = accountsStore.expenseTypes.find((et) => et.id === typeId)
        if (!parentType) {
          console.error('Parent type not found for typeId:', typeId)
          return
        }

        try {
          await Promise.all(
            items.map((item, index) =>
              accountsStore.updateItemOrder({
                id: item.id,
                expenseClassId: parentType.expense_class_id,
                expenseTypeId: typeId,
                name: item.name,
                order: index,
              }),
            ),
          )
        } catch (error) {
          console.error('Failed to save item order:', error) // Now using the error
          $q.notify({
            type: 'negative',
            message: 'Failed to save item order: ' + error.message,
            position: 'top',
          })
        }
      },
    })
  }
}

const toggleExpansion = async (classId) => {
  console.log('Toggling expansion for class:', classId)
  console.log('Current selected year:', selectedYear.value)

  const newExpanded = { ...expandedClasses.value }

  if (!newExpanded[classId]) {
    // Close all other classes
    Object.keys(newExpanded).forEach((id) => {
      newExpanded[id] = false
    })
    newExpanded[classId] = true

    try {
      // Load types only if we have a selected year
      if (selectedYear.value) {
        console.log('Fetching types for class:', classId)
        await accountsStore.fetchExpenseTypes(classId)

        // After types are loaded, fetch items for the first type (or skip if already fetched)
        if (accountsStore.expenseTypes.length > 0) {
          const fiscalYear = accountsStore.years.find((y) => y.id == accountsStore.selectedYear)
          const yearValue = fiscalYear?.year?.toString() || ''

          const firstType = accountsStore.expenseTypes.find(
            (type) => type.expense_class_id == classId && type.year == yearValue,
          )

          if (firstType) {
            // ✅ Check if items are already fetched
            const alreadyFetchedItems = accountsStore.expenseItems.some(
              (item) =>
                item.expense_class_id == classId &&
                item.expense_type_id == firstType.id &&
                item.year == yearValue,
            )

            if (!alreadyFetchedItems) {
              console.log('Fetching items for type:', firstType.id)
              await accountsStore.fetchExpenseItems(classId, firstType.id)
            } else {
              console.log('Expense items already loaded, skipping fetch')
            }
          }
        }
      } else {
        console.warn('Cannot fetch types - no year selected')
      }
    } catch (error) {
      console.error('Error loading types or items:', error)
    }

    nextTick(() => {
      const container = document.querySelector(`[ref="typeContainer_${classId}"]`)
      if (container && !typeSortables.value[classId]) {
        initTypeContainer(container, classId)
      }
    })
  } else {
    newExpanded[classId] = false
  }

  expandedClasses.value = newExpanded
}

// Lifecycle hooks
onMounted(async () => {
  try {
    await accountsStore.fetchYears()
    if (accountsStore.selectedYear) {
      selectedYearDisplay.value =
        accountsStore.yearOptions.find((y) => y.value === accountsStore.selectedYear)?.yearValue ||
        null
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to load data',
      position: 'top',
    })
  }

  nextTick(() => {
    if (sortableContainer.value) {
      new Sortable(sortableContainer.value, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: handleSortEnd,
      })
    }
  })
})

// Add this in your component's setu

watch(selectedYear, (newYear) => {
  if (newYear) {
    loadExpenseClassesForYear(newYear)
  }
  showAddClassDialog.value = false
  resetClassForm()
})

watch(
  expandedTypes,
  (newVal) => {
    nextTick(() => {
      Object.keys(newVal).forEach((typeId) => {
        if (newVal[typeId]) {
          const containers = document.querySelectorAll(`[data-item-container="${typeId}"]`)
          containers.forEach((container) => {
            if (container && !container.sortable) {
              initItemContainer(container, typeId)
            }
          })
        }
      })
    })
  },
  { deep: true },
)

watch(selectedYear, (newVal) => {
  console.log('Selected year changed to:', newVal)
  console.log('Available years:', accountsStore.years)
  console.log('Current expanded class:', expandedClasses.value)
})

watch(
  currentParentClass,
  (newVal) => {
    console.log('Current parent class changed:', newVal)
  },
  { deep: true },
)

watch(
  () => accountsStore.expenseTypes,
  (newTypes) => {
    console.log('Expense types updated:', newTypes)
  },
  { deep: true },
)
</script>
<style scoped>
/* Hover effects for edit/delete buttons */
/* In your style section */
.q-expansion-item:hover {
  background-color: #f5f5f5;
}

.expense-type-item:hover {
  background-color: #f0f0f0;
}

.hover-effect {
  background-color: #f5f5f5;
  transition: background-color 0.3s;
}

.type-hover-effect {
  background-color: #f0f0f0;
  transition: background-color 0.3s;
}
.actions {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

/* Add these to your existing styles */
.draggable-item,
.draggable-type {
  cursor: grab;
}

.drag-handle {
  cursor: grab;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.drag-handle:hover {
  opacity: 1;
}

.sortable-ghost {
  opacity: 0.5;
  background: #f5f5f5;
}

.sortable-chosen {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.accountslib-page {
  background-color: #D9D9D9;
}

/* Responsive Design */
@media (max-width: 600px) {
  /* Mobile View */
  .Main-card {
    max-width: 100% !important;
    height: 80vh !important;
    margin: 0 !important;
  }
  
  /* Header section */
  .row.items-center.justify-between.bg-grey-3 {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
  }
  
  /* Year selector */
  .row.items-center.justify-between.bg-grey-3 .q-select {
    width: 100% !important;
    min-width: 0 !important;
  }
  
  /* Button group */
  .row.items-center.justify-between.bg-grey-3 > div:last-child {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    width: 100% !important;
  }
  
  .row.items-center.justify-between.bg-grey-3 .q-btn {
    width: 100% !important;
    margin: 0 !important;
  }
  
  /* Search and Add Account section */
  .row.items-center.justify-between.q-mb-sm {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
  }
  
  .row.items-center.justify-between.q-mb-sm .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }
  
  .row.items-center.justify-between.q-mb-sm .q-btn {
    width: 100% !important;
  }
  
  /* Expansion items */
  .q-expansion-item .row.items-center.justify-between {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
  }
  
  .q-expansion-item .row.items-center.justify-between > div:first-child {
    width: 100% !important;
  }
  
  .q-expansion-item .row.items-center.justify-between > div:last-child {
    display: flex !important;
    justify-content: flex-end !important;
    gap: 4px !important;
  }
  
  /* Type expansion items */
  .type-expansion .row.items-center.justify-between {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
  }
  
  .type-expansion .row.items-center.justify-between > div:first-child {
    width: 100% !important;
  }
  
  .type-expansion .row.items-center.justify-between > div:last-child {
    display: flex !important;
    justify-content: flex-end !important;
    gap: 4px !important;
  }
  
  /* Item cards */
  .bg-green-1 .row.items-center.justify-between {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
  }
  
  .bg-green-1 .row.items-center.justify-between > div:first-child {
    width: 100% !important;
  }
  
  .bg-green-1 .row.items-center.justify-between > div:last-child {
    display: flex !important;
    justify-content: flex-end !important;
    gap: 4px !important;
  }
  
  /* Dialog adjustments */
  .q-dialog .q-card {
    min-width: 90vw !important;
    max-width: 95vw !important;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  /* Small Tablet View */
  .Main-card {
    max-width: 95% !important;
    height: 75vh !important;
  }
  
  /* Header section */
  .row.items-center.justify-between.bg-grey-3 {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
  }
  
  /* Year selector */
  .row.items-center.justify-between.bg-grey-3 .q-select {
    width: 100% !important;
    min-width: 0 !important;
  }
  
  /* Button group */
  .row.items-center.justify-between.bg-grey-3 > div:last-child {
    display: flex !important;
    flex-direction: row !important;
    gap: 8px !important;
    width: 100% !important;
  }
  
  .row.items-center.justify-between.bg-grey-3 .q-btn {
    flex: 1 !important;
  }
  
  /* Search and Add Account section */
  .row.items-center.justify-between.q-mb-sm {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
  }
  
  .row.items-center.justify-between.q-mb-sm .q-input {
    width: 100% !important;
    min-width: 0 !important;
  }
  
  .row.items-center.justify-between.q-mb-sm .q-btn {
    width: 100% !important;
  }
  
  /* Dialog adjustments */
  .q-dialog .q-card {
    min-width: 80vw !important;
    max-width: 90vw !important;
  }
}

@media (min-width: 901px) and (max-width: 1200px) {
  /* Large Tablet View */
  .Main-card {
    max-width: 90% !important;
    height: 72vh !important;
  }
  
  /* Header section */
  .row.items-center.justify-between.bg-grey-3 {
    flex-direction: row !important;
    align-items: center !important;
    gap: 16px !important;
  }
  
  /* Year selector */
  .row.items-center.justify-between.bg-grey-3 .q-select {
    width: 300px !important;
  }
  
  /* Button group */
  .row.items-center.justify-between.bg-grey-3 > div:last-child {
    display: flex !important;
    flex-direction: row !important;
    gap: 8px !important;
  }
  
  /* Search and Add Account section */
  .row.items-center.justify-between.q-mb-sm {
    flex-direction: row !important;
    align-items: center !important;
    gap: 16px !important;
  }
  
  .row.items-center.justify-between.q-mb-sm .q-input {
    width: 300px !important;
    min-width: 300px !important;
  }
  
  .row.items-center.justify-between.q-mb-sm .q-btn {
    min-width: 150px !important;
  }
}

@media (min-width: 1201px) {
  /* Desktop View */
  .Main-card {
    max-width: 1200px !important;
    height: 70vh !important;
  }
  
  /* Header section */
  .row.items-center.justify-between.bg-grey-3 {
    flex-direction: row !important;
    align-items: center !important;
    gap: 16px !important;
  }
  
  /* Year selector */
  .row.items-center.justify-between.bg-grey-3 .q-select {
    width: 300px !important;
  }
  
  /* Button group */
  .row.items-center.justify-between.bg-grey-3 > div:last-child {
    display: flex !important;
    flex-direction: row !important;
    gap: 8px !important;
  }
  
  /* Search and Add Account section */
  .row.items-center.justify-between.q-mb-sm {
    flex-direction: row !important;
    align-items: center !important;
    gap: 16px !important;
  }
  
  .row.items-center.justify-between.q-mb-sm .q-input {
    width: 300px !important;
    min-width: 300px !important;
  }
  
  .row.items-center.justify-between.q-mb-sm .q-btn {
    min-width: 150px !important;
  }
}

/* General responsive improvements */
@media (max-width: 900px) {
  /* Adjust text sizes for better readability */
  .text-h5 {
    font-size: 1.2rem !important;
  }
  
  .text-body1 {
    font-size: 0.9rem !important;
  }
  
  .text-body2 {
    font-size: 0.85rem !important;
  }
  
  /* Adjust padding for better mobile experience */
  .q-pa-md {
    padding: 12px !important;
  }
  
  .q-pa-sm {
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
}

/* Ensure proper spacing in all views */
.q-gutter-sm > * {
  margin-bottom: 8px !important;
}

.q-gutter-xs > * {
  margin-bottom: 4px !important;
}
</style>
