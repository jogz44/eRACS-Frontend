<template>
  <!--Edit Continuing Disbursement-->
  <q-dialog v-model="store.dialogs.editDisbursement" persistent>
    <q-card style="min-width: 1100px">
      <q-card-section>
        <div class="text-h6">
          Edit Expenses for Continuing Disbursement #{{ store.forms.disbursement.dvNumber }}
        </div>
        <div class="text-caption text-grey-6 q-mt-sm">
          Note: Total amount is locked to ₱{{ store.lockedTotalAmount?.toLocaleString() || '0' }}. You can only redistribute amounts between expenses.
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
              v-model="store.forms.disbursement.date"
              mask="##/##/####"
              :readonly="true"
              :disable="true"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="store.forms.disbursement.date" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Bank Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Bank:</q-item-label>
            <q-select
              filled
              outlined
              dense
              v-model="store.forms.disbursement.bank_id"
              :options="bankStore.banks"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              :label="currentBankLabel"
              :readonly="true"
              :disable="true"
            />
          </div>

          <!-- Check Number Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Cheque Number:</q-item-label>
            <q-input
              outlined
              dense
              v-model="store.forms.disbursement.chequeNumber"
              :disable="true"
            />
          </div>
          
          <!-- DV Number Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">DV Number:</q-item-label>
            <q-input filled outlined dense v-model="store.forms.disbursement.dvNumber" :disable="true"/>
          </div>

          <!-- Payee Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Payee:</q-item-label>
            <q-input filled outlined dense v-model="store.forms.disbursement.payee"/>
          </div>
        </div>
      </q-card-section>

      <!-- Expense Table Section -->
      <q-card-section>
        <!-- Expense Table -->
        <q-table
          :rows="store.expenses"
          :columns="store.expenseColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 5 }"
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="button-group">
                <q-btn
                  size="sm"
                  flat
                  round
                  color="green"
                  icon="edit"
                  @click="store.editItem(props.row)"
                />
                <q-btn
                  size="sm"
                  flat
                  round
                  color="red"
                  icon="delete"
                  @click="store.deleteItem(props.row)"
                />
              </div>
            </q-td>
          </template>
        </q-table>

        <!-- Amount Display -->
        <div class="q-mt-md">
          <q-item-label class="q-mb-xs">Total Amount:</q-item-label>
          <q-input
            outlined
            dense
            :model-value="`₱${(store.totalExpensesAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
            style="width: 300px"
            readonly
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" @click="store.closeDialog('editDisbursement')" />
        <q-btn
          label="Save Changes"
          color="primary"
          @click="handleSave"
          :loading="store.savingDisbursement"
          :disable="store.savingDisbursement"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useContDisbursementStore } from 'stores/contDisburseStore'
import { useBankStore } from 'src/stores/bankStore'

const store = useContDisbursementStore()
const bankStore = useBankStore()

const emit = defineEmits(['save'])

const currentBankLabel = computed(() => {
  if (store.forms.disbursement.bank_id) {
    const selectedBank = bankStore.banks.find(
      (bank) => bank.id === store.forms.disbursement.bank_id,
    )
    return selectedBank ? selectedBank.name : 'Select Bank'
  }
  return 'Select Bank'
})

const handleSave = async () => {
  const result = await store.saveEditedDisbursement()
  emit('save', result)
}
</script>

<style scoped>
.button-group {
  display: flex;
  gap: 4px;
}
</style>
