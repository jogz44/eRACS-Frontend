<template>
  <q-dialog v-model="store.dialogs.viewOrDetails" persistent>
    <q-card style="min-width: 1100px">
      <q-card-section>
        <div class="text-h6">
          View OR Details for Disbursement #{{ store.currentLiquidation.dvNumber }}
        </div>
        <div class="text-caption text-grey-6 q-mt-sm">
          View liquidation details and official receipt information
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Date Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Date:</q-item-label>
            <q-input
              filled
              outlined
              dense
              :model-value="store.currentLiquidation.date"
              :readonly="true"
              :disable="true"
            />
          </div>

          <!-- DV Number Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">DV Number:</q-item-label>
            <q-input 
              filled 
              outlined 
              dense 
              :model-value="store.currentLiquidation.dvNumber"
              :disable="true"
            />
          </div>

          <!-- DV Amount Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">DV Amount:</q-item-label>
            <q-input
              filled
              outlined
              dense
              :model-value="formatCurrency(store.currentLiquidation.dvAmount || 0)"
              prefix="₱"
              :disable="true"
            />
          </div>

          <!-- Actual Expense Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Actual Expense:</q-item-label>
            <q-input
              filled
              outlined
              dense
              :model-value="formatCurrency(totalActualExpense)"
              prefix="₱"
              :disable="true"
            />
          </div>

          <!-- Amount to Return Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Amount to Return to Appropriation:</q-item-label>
            <q-input
              filled
              outlined
              dense
              :model-value="formatCurrency(totalReturnAmount)"
              prefix="₱"
              :disable="true"
            />
          </div>

          <!-- Remarks Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Remarks:</q-item-label>
            <q-input
              filled
              outlined
              dense
              :model-value="store.currentLiquidation.remarks || ''"
              :disable="true"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Expense Accounts Section -->
      <q-card-section v-if="store.currentLiquidation?.expenses?.length > 0">
        <div class="text-subtitle1 q-mb-md">
          <strong>Expense Accounts:</strong>
        </div>
        
        <!-- Expense Accounts Table -->
        <q-table
          :rows="store.currentLiquidation.expenses"
          :columns="expenseAccountColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 5 }"
          flat
          bordered
        >
          <template v-slot:body-cell-amount="props">
            <q-td :props="props">
              {{ formatCurrency(props.value) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- Liquidation Details Section -->
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="text-subtitle1">
            <strong>Liquidation Details:</strong>
            <span class="text-caption text-grey-6 q-ml-sm">
              ({{ orDetailsCount }} record{{ orDetailsCount !== 1 ? 's' : '' }})
            </span>
          </div>
          <q-space />
          <q-btn
            flat
            dense
            icon="refresh"
            color="primary"
            @click="reloadOrDetails"
            title="Reload OR Details"
          />
        </div>

        <!-- OR Details Table -->
        <q-table
          :rows="store.currentLiquidation?.orDetails || []"
          :columns="orDetailsColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
          flat
          bordered
          :loading="loadingOrDetails"
        >
          <template v-slot:body-cell-orPhotoUrl="props">
            <q-td :props="props">
              <q-img
                v-if="props.value"
                :src="props.value"
                style="max-width: 100px; max-height: 100px"
                class="cursor-pointer"
                @click="viewImage(props.value)"
              />
              <div v-else class="text-grey">No image</div>
            </q-td>
          </template>
          
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm">
              <q-icon size="2em" name="inbox" />
              <span>No liquidation details found</span>
            </div>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <q-btn
          flat
          label="Close"
          class="modal-cancel-btn"
          @click="store.closeDialog('viewOrDetails')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useQuasar } from 'quasar'

const store = useDisbursementStore()
const $q = useQuasar()
const loadingOrDetails = ref(false)

// Table columns for Expense Accounts - matching the image structure
const expenseAccountColumns = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left',
    sortable: true
  },
  {
    name: 'accountName',
    label: 'Account Name',
    field: 'accountName',
    align: 'left',
    sortable: true
  },
  {
    name: 'amount',
    label: 'Amount',
    field: 'amount',
    align: 'right',
    sortable: true
  },
  {
    name: 'particular',
    label: 'Particular',
    field: 'particular',
    align: 'left',
    sortable: true
  }
]

// Table columns for OR Details - matching OrDetailsDialog structure
const orDetailsColumns = [
  {
    name: 'orDate',
    label: 'OR Date',
    field: 'orDate',
    align: 'left',
    sortable: true
  },
  {
    name: 'orNumber',
    label: 'OR Number',
    field: 'orNumber',
    align: 'left',
    sortable: true
  },
  {
    name: 'orAmount',
    label: 'OR Amount',
    field: 'orAmount',
    align: 'right',
    sortable: true,
    format: (val) => formatCurrency(val)
  },
  {
    name: 'orPhotoUrl',
    label: 'OR Image',
    field: 'orPhotoUrl',
    align: 'center',
    sortable: false
  }
]

// Debug: log liquidation data when dialog opens
watch(
  () => store.dialogs.viewOrDetails,
  (isOpen) => {
    if (isOpen) {
      console.log('=== ViewOrDetails dialog opened ===')
      console.log('Current liquidation:', store.currentLiquidation)
      console.log('OR Details array:', store.currentLiquidation?.orDetails)
      console.log('OR Details length:', store.currentLiquidation?.orDetails?.length)
      console.log('OR Details type:', typeof store.currentLiquidation?.orDetails)
      console.log('Is array:', Array.isArray(store.currentLiquidation?.orDetails))
      console.log('Expenses array:', store.currentLiquidation?.expenses)
      console.log('Expenses length:', store.currentLiquidation?.expenses?.length)
      console.log('Expense count:', expenseCount.value)
      
      // Debug expense structure
      if (store.currentLiquidation?.expenses && store.currentLiquidation.expenses.length > 0) {
        console.log('First expense structure:', store.currentLiquidation.expenses[0])
        console.log('All expense account names:', store.currentLiquidation.expenses.map(e => e.accountName))
        console.log('All expense particulars:', store.currentLiquidation.expenses.map(e => e.particular))
        console.log('All expense fields:', Object.keys(store.currentLiquidation.expenses[0] || {}))
      }
      
      if (store.currentLiquidation && store.currentLiquidation.orDetails) {
        console.log('Processing OR details:')
        store.currentLiquidation.orDetails.forEach((orDetail, idx) => {
          console.log(`OR Detail [${idx}]:`, orDetail)
          console.log(`  - orDate: ${orDetail.orDate}`)
          console.log(`  - orNumber: ${orDetail.orNumber}`)
          console.log(`  - orAmount: ${orDetail.orAmount}`)
          console.log(`  - orPhotoUrl: ${orDetail.orPhotoUrl}`)
        })
      } else {
        console.log('No OR details found or currentLiquidation is null')
      }
      console.log('=== End ViewOrDetails debug ===')
    }
  }
)

const totalActualExpense = computed(() => {
  if (!store.currentLiquidation?.orDetails) return 0
  return store.currentLiquidation.orDetails
    .reduce((sum, or) => sum + (parseFloat(or.orAmount) || 0), 0)
})

const totalReturnAmount = computed(() => {
  if (!store.currentLiquidation?.dvAmount) return 0
  const returnAmount = store.currentLiquidation.dvAmount - totalActualExpense.value
  // Prevent negative return amounts - if over-liquidation occurs, show 0
  return Math.max(0, returnAmount)
})

const orDetailsCount = computed(() => {
  return store.currentLiquidation?.orDetails?.length || 0
})

// Debug: log expense data when dialog opens
const expenseCount = computed(() => {
  return store.currentLiquidation?.expenses?.length || 0
})

// Method to manually reload OR details if needed
const reloadOrDetails = async () => {
  if (store.currentLiquidation?.id) {
    console.log('Manually reloading OR details for ID:', store.currentLiquidation.id)
    await store.openViewOrDetails(store.currentLiquidation)
  }
}

const viewImage = (imageUrl) => {
  $q.dialog({
    component: 'q-img',
    componentProps: {
      src: imageUrl,
      style: 'max-width: 80vw; max-height: 80vh'
    }
  })
}

// Formatting utilities to match OrDetailsDialog
const formatCurrency = (value) => {
  const num = Number(String(value).replace(/[,\s]/g, '')) || 0
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
/* Ensure proper spacing for the OR details table */
.q-table {
  margin-bottom: 16px;
}

/* Style for readonly inputs */
.q-input[readonly] {
  background-color: #f5f5f5;
}

/* Custom actions styling */
.custom-actions {
  padding: 16px;
}

.modal-cancel-btn {
  color: #666;
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .q-card {
    min-width: 95vw !important;
  }

  .q-table {
    font-size: 12px;
  }
}
</style>
