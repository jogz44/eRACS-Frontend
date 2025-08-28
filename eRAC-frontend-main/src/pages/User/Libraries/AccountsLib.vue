<template>
  <q-page class="q-pa-md accountslib-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">Accounts Library</div>
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

    <q-card flat bordered class="main-card">
      <!-- Header Section -->
      <div class="row items-center justify-between q-pa-md bg-grey-1">
        <q-select
          v-model="selectedYear"
          :options="accountsStore.yearOptions"
          label="Select Year"
          outlined
          dense
          style="width: 250px"
          :loading="accountsStore.loading"
          :disable="accountsStore.loading || !accountsStore.yearOptions.length"
          emit-value
          map-options
        >
          <template v-slot:selected>
            <span v-if="selectedYearDisplay">
              {{ selectedYearDisplay }}
            </span>
            <span v-else class="text-grey">Current Year: {{ currentYearDisplay }}</span>
          </template>
        </q-select>

        <div class="q-gutter-sm">
          <q-btn
            icon="add"
            label="Add Year"
            color="primary"
            @click="showAddYearDialog = true"
          />
          <q-btn
            icon="content_copy"
            label="Copy to Another Year"
            @click="showCopyDialog = true"
            :disable="!selectedYear || yearOptions.length < 2"
            color="secondary"
          />
        </div>
      </div>

      <q-card-section class="q-pa-md">
        <div class="row items-center justify-between q-mb-sm">
          <q-input
            v-model="searchQuery"
            dense
            outlined
            placeholder="Search..."
            style="min-width: 250px"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-btn
            icon="add"
            label="Add Account"
            @click="showAddClassForm"
            :disable="!selectedYear"
            color="primary"
          />
        </div>

        <!-- Account Entries -->
        <div ref="sortableContainer" style="max-height: 60vh; overflow-y: auto">
          <template v-for="expenseClass in filteredExpenseClasses" :key="expenseClass.id">
            <div
              class="draggable-item"
              :data-id="expenseClass.id"
              @mouseover="hoveredClass = expenseClass.id"
              @mouseleave="hoveredClass = null"
            >
              <q-card flat bordered class="q-mb-xs">
                <q-expansion-item
                  :model-value="expandedClasses[expenseClass.id]"
                  @update:model-value="toggleExpansion(expenseClass.id)"
                  header-class="q-pa-none"
                  expand-icon-class="hidden"
                  dense
                >
                  <template #header>
                    <div class="q-pa-sm full-width row items-center justify-between">
                      <div class="row items-center">
                        <q-icon name="drag_indicator" class="drag-handle q-mr-sm text-grey-6" />
                        <div class="text-body2 text-weight-medium">{{ expenseClass.name }}</div>
                      </div>
                      <div class="row items-center q-gutter-xs">
                        <q-btn
                          dense
                          flat
                          round
                          icon="edit"
                          color="orange"
                          @click.stop="editExpenseClass(expenseClass)"
                        />
                        <q-btn
                          dense
                          flat
                          round
                          icon="delete"
                          color="red"
                          @click.stop="confirmDeleteExpenseClass(expenseClass)"
                        />
                        <q-btn
                          dense
                          flat
                          round
                          icon="add"
                          color="primary"
                          @click.stop="showAddTypeForm(expenseClass)"
                        />
                        <q-icon
                          :name="expandedClasses[expenseClass.id] ? 'expand_less' : 'expand_more'"
                          color="grey"
                        />
                      </div>
                    </div>
                  </template>

                  <!-- Expanded Content -->
                  <div class="q-pa-sm">
                    <div class="text-caption text-grey-7 q-mb-sm">
                      Expenses under {{ expenseClass.name }}
                    </div>

                    <div
                      :ref="(el) => initTypeContainer(el, expenseClass.id)"
                      class="type-container"
                    >
                      <template
                        v-for="expenseType in getExpenseTypesForClass(expenseClass.id)"
                        :key="expenseType.id"
                      >
                        <div class="draggable-type" :data-id="expenseType.id">
                          <q-card flat bordered class="q-mb-xs">
                            <q-expansion-item
                              v-model="expandedTypes[expenseType.id]"
                              class="type-expansion"
                              header-class="q-pa-none"
                              expand-icon-class="hidden"
                            >
                              <template #header>
                                <div class="q-pa-xs full-width row items-center justify-between">
                                  <div class="row items-center">
                                    <q-icon name="drag_indicator" class="drag-handle q-mr-sm text-grey-6" />
                                    <div class="text-body2">{{ expenseType.name }}</div>
                                  </div>
                                  <div class="row items-center q-gutter-xs">
                                    <q-btn
                                      dense
                                      flat
                                      round
                                      icon="edit"
                                      color="orange"
                                      @click.stop="editExpenseType(expenseType)"
                                    />
                                    <q-btn
                                      dense
                                      flat
                                      round
                                      icon="delete"
                                      color="red"
                                      @click.stop="confirmDeleteExpenseType(expenseType)"
                                    />
                                    <q-btn
                                      dense
                                      flat
                                      round
                                      icon="add"
                                      color="primary"
                                      @click.stop="showAddItemDialogForType(expenseType)"
                                    />
                                    <q-icon
                                      :name="
                                        expandedTypes[expenseType.id]
                                          ? 'expand_less'
                                          : 'expand_more'
                                      "
                                      color="grey"
                                    />
                                  </div>
                                </div>
                              </template>

                              <!-- Expense Items List -->
                              <div class="q-ml-md">
                                <div class="text-caption text-grey-7 q-mb-sm q-ml-sm">
                                  Expenses under {{ expenseType.name }}
                                </div>
                                <div class="q-pa-xs item-container">
                                  <div
                                    :ref="
                                      (el) => {
                                        if (el) initItemContainer(el, expenseType.id)
                                      }
                                    "
                                    class="item-container"
                                  >
                                    <template
                                      v-for="item in getExpenseItemsForType(expenseType.id)"
                                      :key="item.id"
                                    >
                                      <div class="draggable-item" :data-id="item.id">
                                        <q-card flat bordered>
                                          <div class="q-pa-xs row items-center justify-between">
                                            <div class="row items-center">
                                              <q-icon
                                                name="drag_indicator"
                                                class="drag-handle q-mr-sm text-grey-6"
                                              />
                                              <div class="text-body2">{{ item.name }}</div>
                                            </div>
                                            <div class="row no-wrap items-center q-gutter-xs">
                                              <q-btn
                                                dense
                                                flat
                                                round
                                                icon="edit"
                                                color="orange"
                                                @click="editExpenseItem(item)"
                                              />
                                              <q-btn
                                                dense
                                                flat
                                                round
                                                icon="delete"
                                                color="red"
                                                @click.stop="confirmDeleteExpenseItem(item)"
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
      </q-card-section>
    </q-card>

    <!-- Add Year Dialog -->
    <q-dialog v-model="showAddYearDialog" @keydown.enter="handleYearEnterKey">
      <q-card style="min-width: 300px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Add New Fiscal Year</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="newYear"
            outlined
            label="Year (YYYY)"
            mask="####"
            :rules="[
              (val) => !!val || 'Year is required',
              (val) => val?.length === 4 || 'Must be 4 digits',
              (val) =>
                !accountsStore.years.some((y) => y.year.toString() === val) ||
                'Year already exists',
            ]"
            :disable="accountsStore.loading"
            @keydown.enter="handleYearEnterKey"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" :disable="accountsStore.loading" v-close-popup />
          <q-btn
            label="Save"
            color="primary"
            @click="handleYearSaveClick"
            :loading="accountsStore.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Expense Class Dialog -->
    <q-dialog v-model="showAddClassDialog" @keydown.enter="handleClassEnterKey">
      <q-card style="min-width: 400px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Add New Expense Class</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="newExpenseClass"
            label="Expense Class Name"
            outlined
            :rules="[(val) => !!val || 'Required']"
            @keydown.enter="handleClassEnterKey"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup @click="resetClassForm" />
          <q-btn label="Save" color="primary" @click="handleClassSaveClick" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Expense Type Dialog -->
    <q-dialog v-model="showAddTypeDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Add New Expense Type in {{ getSelectedClassName() }}</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="newExpenseType.name"
            label="Type Name"
            outlined
            :rules="[(val) => !!val || 'Required']"
            @keyup.enter="saveExpenseType"
            @keydown.enter.prevent
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup @click="resetTypeForm" />
          <q-btn label="Save" color="primary" @click="saveExpenseType" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Copy to Another Year Dialog -->
    <q-dialog v-model="showCopyDialog">
      <q-card style="min-width: 500px">
        <q-card-section class="q-pb-none">
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

          <div v-if="duplicateWarning" class="text-warning q-mt-sm q-mb-sm">
            <q-icon name="warning" /> {{ duplicateWarning }}
          </div>

          <div class="text-subtitle2 q-mt-md q-mb-sm">Select Classes to Copy:</div>

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

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            label="Copy"
            color="primary"
            @click="copyClassesToYear"
            :loading="accountsStore.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Dialogs -->
    <q-dialog v-model="showEditClassDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="q-pb-none">
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

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn label="Save" color="primary" @click="updateExpenseClass" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Expense Type Dialog -->
    <q-dialog v-model="showEditTypeDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="q-pb-none">
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

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn label="Save" color="primary" @click="updateExpenseType" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteConfirm">
      <q-card style="min-width: 400px">
        <q-card-section class="text-center">
          <q-icon name="delete" size="48px" color="negative" />
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          <div class="text-h6">Confirm Delete</div>
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          Are you sure you want to delete {{ itemToDelete?.name }}?
        </q-card-section>

        <q-card-actions align="center" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn label="Delete" color="negative" @click="confirmDelete" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Item Dialog -->
    <q-dialog v-model="showAddItemDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Add New Expense Item</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="newExpenseItem.name"
            label="Item Name"
            outlined
            :rules="[(val) => !!val || 'Name is required']"
            @keyup.enter="saveExpenseItem"
            @keydown.enter.prevent
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn label="Save" color="primary" @click="saveExpenseItem" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Item Dialog -->
    <q-dialog v-model="showEditItemDialog">
      <q-card style="min-width: 300px">
        <q-card-section class="q-pb-none">
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
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn label="Save" color="primary" @click="updateExpenseItem" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
import { usePageLogging } from '../../../composables/usePageLogging'

const $q = useQuasar()
const accountsStore = useAccountsLibraryStore()
const { logPageVisit } = usePageLogging()

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
const newExpenseType = ref({ name: '', classId: null })
const editingExpenseType = ref(null)
const expandedTypes = ref({})

// Expense Items
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
    .filter((ec) => ec.year == selectedYear.value)
    .filter(
      (ec) =>
        ec.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (ec.types || []).some((et) =>
          et.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
        ),
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0))
})

const validateAndAddYear = async () => {
  const yearStr = newYear.value?.toString().trim()

  if (!yearStr || yearStr.length !== 4 || isNaN(yearStr)) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a valid 4-digit year',
      position: 'top',
    })
    return
  }

  if (accountsStore.years.some((y) => y.year.toString() === yearStr)) {
    $q.notify({
      type: 'negative',
      message: 'Year already exists',
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
    newYear.value = new Date().getFullYear().toString()
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

const handleYearEnterKey = (event) => {
  event.preventDefault()
  validateAndAddYear()
}

const handleYearSaveClick = () => {
  validateAndAddYear()
}

// Expense Class related functions
const showAddClassForm = () => {
  newExpenseClass.value = ''
  showAddClassDialog.value = true
}

const validateAndSaveExpenseClass = async () => {
  if (!newExpenseClass.value || !newExpenseClass.value.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Class name is required',
      position: 'top',
    })
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

const handleClassEnterKey = (event) => {
  event.preventDefault()
  validateAndSaveExpenseClass()
}

const handleClassSaveClick = () => {
  validateAndSaveExpenseClass()
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

    if (!newExpenseType.value.name) {
      throw new Error('Type name is required')
    }

    if (!currentParentClass.value?.id) {
      throw new Error('Parent class not selected')
    }

    const fiscalYear = accountsStore.years.find((y) => y.id == selectedYear.value)
    console.log('Found fiscal year:', fiscalYear)

    if (!fiscalYear) {
      throw new Error('Selected year not found in database')
    }

    const upperCaseName = newExpenseType.value.name.toUpperCase()

    const newType = await accountsStore.createExpenseType({
      name: upperCaseName,
      expenseClassId: currentParentClass.value.id,
      fiscalYearId: fiscalYear.id,
      year: fiscalYear.year.toString(),
    })

    console.log('Successfully created type:', newType)

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

const confirmDeleteExpenseType = (expenseType) => {
  itemToDelete.value = expenseType
  deleteType.value = 'type'
  showDeleteConfirm.value = true
}

// Expense Item related functions
const resetItemForm = () => {
  newExpenseItem.value = { name: '', typeId: null }
  currentParentType.value = null
  showAddItemDialog.value = false
}

const showAddItemDialogForType = (expenseType) => {
  console.log('Setting parent type for new item:', {
    typeId: expenseType.id,
    typeName: expenseType.name,
    classId: expenseType.expense_class_id,
  })

  currentParentType.value = expenseType
  newExpenseItem.value = {
    name: '',
    typeId: expenseType.id,
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

const confirmDeleteExpenseItem = (item) => {
  itemToDelete.value = item
  deleteType.value = 'item'
  showDeleteConfirm.value = true
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

  const fiscalYear = accountsStore.years.find((y) => y.id == selectedYear.value)
  const yearValue = fiscalYear?.year?.toString()

  return accountsStore.expenseTypes
    .filter((et) => et.expense_class_id == classId && et.year == yearValue)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
})

const getExpenseItemsForType = (typeId) => {
  if (!selectedYear.value) {
    console.log('No year selected - returning empty items list')
    return []
  }

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

    $q.notify({
      type: 'positive',
      message: 'Successfully Copied',
      position: 'top',
    })

    selectedClassesToCopy.value = []
    copyTargetYear.value = null
    showCopyDialog.value = false

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

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedClassesToCopy.value = availableClassesToCopy.value.map((ec) => ec.id)
  } else {
    selectedClassesToCopy.value = []
  }
}

watch(
  selectedClassesToCopy,
  (newVal) => {
    const availableIds = availableClassesToCopy.value.map((ec) => ec.id)
    const selectedAvailable = newVal.filter((id) => availableIds.includes(id))

    allSelected.value = selectedAvailable.length === availableIds.length && availableIds.length > 0
  },
  { deep: true },
)

const resetAllDialogs = () => {
  showDeleteConfirm.value = false
  showAddYearDialog.value = false
  showAddClassDialog.value = false
  showAddTypeDialog.value = false
  showAddItemDialog.value = false
  showEditClassDialog.value = false
  showEditTypeDialog.value = false
  showEditItemDialog.value = false
  showCopyDialog.value = false

  itemToDelete.value = null
  deleteType.value = null
}

const confirmDelete = async () => {
  try {
    if (!itemToDelete.value?.id) {
      throw new Error('No item selected for deletion')
    }

    const id = Number(itemToDelete.value.id)
    if (isNaN(id)) {
      throw new Error('Invalid ID format')
    }

    if (deleteType.value === 'class') {
      await accountsStore.deleteExpenseClass(id)
      $q.notify({
        type: 'positive',
        message: 'Class and all associated types/items deleted successfully',
        position: 'top'
      })
    }
    else if (deleteType.value === 'type') {
      const typeData = {
        id: id,
        expenseClassId: itemToDelete.value.expense_class_id
      }
      await accountsStore.deleteExpenseType(typeData)
      $q.notify({
        type: 'positive',
        message: 'Type and all associated items deleted successfully',
        position: 'top'
      })
    }
    else if (deleteType.value === 'item') {
      const itemData = {
        id: id,
        expenseClassId: itemToDelete.value.expense_class_id,
        expenseTypeId: itemToDelete.value.expense_type_id
      }
      await accountsStore.deleteExpenseItem(itemData)
      $q.notify({
        type: 'positive',
        message: 'Item deleted successfully',
        position: 'top'
      })
    }

    if (selectedYear.value) {
      await accountsStore.fetchExpenseClasses(selectedYear.value)
    }

  } catch (error) {
    console.error('Delete error:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to delete',
      position: 'top',
      timeout: 5000
    })
  } finally {
    resetAllDialogs()
    await nextTick()
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
          console.error('Failed to save item order:', error)
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
    Object.keys(newExpanded).forEach((id) => {
      newExpanded[id] = false
    })
    newExpanded[classId] = true

    try {
      if (selectedYear.value) {
        console.log('Fetching types for class:', classId)
        await accountsStore.fetchExpenseTypes(classId)

        if (accountsStore.expenseTypes.length > 0) {
          const fiscalYear = accountsStore.years.find((y) => y.id == accountsStore.selectedYear)
          const yearValue = fiscalYear?.year?.toString() || ''

          const firstType = accountsStore.expenseTypes.find(
            (type) => type.expense_class_id == classId && type.year == yearValue,
          )

          if (firstType) {
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
    
    // Log page visit
    await logPageVisit('Accounts Library')
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
.accountslib-page {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.main-card {
  max-width: 2000px;
  margin: 0 auto;
}

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

@media (max-width: 768px) {
  .q-pa-md {
    padding: 8px;
  }

  .row.items-center.justify-between {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .q-gutter-sm > * {
    margin-bottom: 8px;
  }
}
</style>
