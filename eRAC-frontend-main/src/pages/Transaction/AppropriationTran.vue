<template>
  <q-page class="q-pa-lg">
    <div class="page-header q-mb-lg">
      <div class="text-h5 text-weight-bold">Appropriation Transaction</div>
    </div>
    <div class="q-mb-md">
      <div class="row items-center justify-between q-gutter-sm">
        <!-- Search Input -->
        <q-input
          outlined
          dense
          placeholder="Search..."
          class="col-md-3 col-sm-5 custom-search-input"
          style="min-width: 450px"
          v-model="appropriationStore.searchQuery"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <div class="t q-px-xl"></div>

        <!-- Date Range Group -->
        <div class="row items-center justify-between q-xs">
          <!-- From Date -->
          <q-input
            outlined
            label="From"
            dense
            v-model="appropriationStore.dateFrom"
            mask="##/##/####"
            class="custom-date-from"
            style="width: 200px"
          >
            <template v-slot:append>
              <q-icon name="event" class="calend-icon">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="appropriationStore.dateFrom" mask="DD/MM/YYYY" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <div class="t q-px-xs"></div>
          <div class="t q-px-xs"></div>

          <!-- To Date -->
          <q-input
            outlined
            label="To"
            dense
            v-model="appropriationStore.dateTo"
            mask="##/##/####"
            class="custom-date-to"
            style="width: 200px"
          >
            <template v-slot:append>
              <q-icon name="event" class="calend-icon">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="appropriationStore.dateTo" mask="DD/MM/YYYY" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <!-- Add Button -->
        <q-btn label="Add" icon="add" class="add-table-btn" @click="addBudget" />
      </div>
    </div>

    <!-- Add Budget Dialog-->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add New Budget</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <!-- Fiscal Year Selection -->
          <q-select
            filled
            v-model="selectedFiscalYear"
            :options="accountLibraryStore.yearOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Fiscal Year"
            :rules="[(val) => !!val || 'Required']"
          />

          <!-- Auto-filled Dates Based on Selected Year -->

          <q-input
            class="col"
            filled
            v-model="startDate"
            label="Start Date"
            mask="date"
            :rules="['date']"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy>
                  <q-date v-model="startDate" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <div class="q-mb-md">
            <strong>Description:</strong><br />
            <q-input filled v-model="description" placeholder="Budget description" />
          </div>
          <div class="q-mb-md">
            <strong>Amount:</strong><br />
            <q-input filled v-model="amount" prefix="₱" placeholder="0.00" type="number" />
          </div>
        </q-card-section>
        <q-card-actions align="right" class="custom-actions">
          <q-btn flat label="Cancel" v-close-popup class="modal-cancel-btn" />
          <q-btn label="Save" class="modal-save-btn" @click="saveBudget" :loading="loading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Budget Dialog -->
    <q-dialog v-model="editBudgetDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Edit Budget</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <!-- Fiscal Year Selection -->
          <q-select
            filled
            v-model="selectedFiscalYear"
            :options="accountLibraryStore.yearOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Fiscal Year"
            :rules="[(val) => !!val || 'Required']"
          />

          <!-- Auto-filled Dates Based on Selected Year -->
          <q-input
            class="col"
            filled
            v-model="startDate"
            label="Start Date"
            mask="date"
            :rules="['date']"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy>
                  <q-date v-model="startDate" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <div class="q-mb-md">
            <strong>Description:</strong><br />
            <q-input filled v-model="description" placeholder="Budget description" />
          </div>
          <div class="q-mb-md">
            <strong>Amount:</strong><br />
            <q-input filled v-model="amount" prefix="₱" placeholder="0.00" type="number" />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="custom-actions">
          <q-btn flat label="Cancel" v-close-popup class="modal-cancel-btn" />
          <q-btn
            label="Save Changes"
            class="modal-save-btn"
            @click="saveBudget"
            :loading="loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Data Table -->
    <q-card>
      <q-table
        :rows="appropriationStore.filteredAppropriations"
        :columns="columns"
        :loading="appropriationStore.loading"
        row-key="id"
      >
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

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="button-group">
              <q-btn
                class="edit-btn"
                icon="edit"
                @click="editBudgetDialog(props.row)"
                :disable="props.row.has_allocations"
              />

              <q-btn class="allocate-btn" icon="visibility" @click="openViewDialog(props.row)" />
              <q-btn
                class="allocate-btn"
                label="Commit"
                @click="openAllocationDialog(props.row)"
                :disable="props.row.unappropriated <= 0"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>
    <CommitDialog />
    <ViewCommitDialog ref="viewDialogRef" />
  </q-page>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import CommitDialog from '../../components/appropriation/CommitDialog.vue'
import ViewCommitDialog from '../../components/appropriation/ViewCommitDialog.vue'
import { useAppropriationStore } from '../../stores/appropriationStore'
import { useAccountsLibraryStore } from '../../stores/accountsLibstore'

const $q = useQuasar()
const accountLibraryStore = useAccountsLibraryStore()
const appropriationStore = useAppropriationStore()

const showDialog = ref(false)
const selectedFiscalYear = ref(null)
const startDate = ref('')
const endDate = ref('')
const description = ref('')
const amount = ref(null)
const loading = ref(false)

const openAllocationDialog = async (row) => {
  await appropriationStore.openAllocationDialog(row)
}

const viewDialogRef = ref(null)

const openViewDialog = (row) => {
  if (viewDialogRef.value) {
    viewDialogRef.value.openDialog(row)
  } else {
    console.error('View dialog reference is not available')
  }
}

// Automatically set dates when fiscal year changes
// Automatically set dates when fiscal year changes
watch(selectedFiscalYear, (newYearId) => {
  if (newYearId) {
    const yearObj = accountLibraryStore.yearOptions.find((y) => y.value === newYearId)
    if (yearObj) {
      const today = new Date()
      const formattedToday = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`

      startDate.value = formattedToday // Set to current date (YYYY/MM/DD)
      endDate.value = `${yearObj.yearValue}/12/31` // Keep original end date logic
    }
  }
})

const editBudgetDialog = (row) => {
  if (row.has_allocations) {
    $q.notify({
      type: 'warning',
      message: 'Cannot edit budget with existing allocations',
      icon: 'warning',
    })
    return
  }

  // Proceed with editing logic
  selectedFiscalYear.value = row.fiscal_year_id
  description.value = row.description
  amount.value = row.amount
  // ... other edit dialog setup ...
  editBudgetDialog.value = true
}

const openDialog = async () => {
  try {
    await accountLibraryStore.fetchYears()
    // Auto-select current year if available
    const currentYear = new Date().getFullYear().toString()
    const currentYearOption = accountLibraryStore.yearOptions.find(
      (y) => y.yearValue === currentYear,
    )
    selectedFiscalYear.value = currentYearOption?.value || accountLibraryStore.yearOptions[0]?.value
    showDialog.value = true
  } catch (error) {
    console.error('Error loading fiscal years:', error)
  }
}

// Fix the saveBudget function
const saveBudget = async () => {
  loading.value = true
  try {
    const payload = {
      fiscal_year_id: selectedFiscalYear.value,
      original_amount: parseFloat(amount.value),
      description: description.value,
      start_date: startDate.value.replace(/\//g, '-'),
      end_date: endDate.value.replace(/\//g, '-'),
    }

    // Call the store action
    await appropriationStore.addBudget(payload)

    // Show success message
    $q.notify({
      type: 'positive',
      message: 'Budget added successfully!',
      icon: 'check_circle',
    })

    // Reset form
    showDialog.value = false
    description.value = ''
    amount.value = null

    // Optional: Refresh data (only if your API returns incomplete data)
    // await appropriationStore.fetchBudgets()
  } catch (error) {
    console.error('Save error:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to save budget',
      icon: 'error',
    })
  } finally {
    loading.value = false
  }
}

// Initialize component
onMounted(async () => {
  try {
    await appropriationStore.fetchBudgets()

    // Access the loaded data
    console.log('Appropriations:', appropriationStore.appropriations)
    console.log('Total Available:', appropriationStore.totalAvailable)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to load budgets',
      icon: 'error',
    })
  }
})

/*const editAllocate = (row) => {
  appropriationStore.editAllocate(row)
}
*/
const columns = [
  {
    name: 'id',
    required: true,
    label: 'ID',
    align: 'left',
    field: 'id',
  },
  {
    name: 'date',
    label: 'Date',
    field: 'date',
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
    align: 'right',
    format: (val) => appropriationStore.formatCurrency(val),
  },
  {
    name: 'unappropriated',
    label: 'Unappropriated',
    field: 'unappropriated',
    align: 'right',
    format: (val) => appropriationStore.formatCurrency(val),
  },
  {
    name: 'action',
    label: 'Action',
    align: 'center',
    field: 'action',
  },
]

const addBudget = () => {
  openDialog()
}
</script>

<style scoped>
.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}

.custom-actions {
  margin-right: 10px;
}
.custom-actions .q-btn:not(:last-child) {
  margin-right: 5px; /* Adjust this value as needed */
}

/* Using the deep selector (Vue 3 syntax) */
.q-mb-md :deep(.q-input .q-field__control) {
  border-radius: 8px;
}
</style>
