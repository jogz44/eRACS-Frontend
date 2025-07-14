<template>
  <!--Edit Disbursement-->
  <q-dialog v-model="store.dialogs.editDisbursement" persistent>
    <q-card style="min-width: 1100px">
      <q-card-section>
        <div class="text-h6">
          Add Expenses to Disbursement #{{ store.forms.disbursement.dvNumber }}
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
              v-model="store.forms.disbursement.bank"
              :options="['BDO', 'Metro Bank', 'BPI', 'PNB']"
            />
          </div>

          <!-- Check Number Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Cheque Number:</q-item-label>
            <q-select
              filled
              outlined
              dense
              v-model="store.selectedBooklet"
              @update:model-value="store.selectBooklet"
              :options="
                store.chequeBooklets.map((b) => ({
                  label: `${b.label} (${b.range})`,
                  value: b.range,
                }))
              "
              option-label="label"
              option-value="value"
              emit-value
              map-options
              label="Choose Booklet"
              class="q-mb-sm"
            />

            <!-- Cheque Number Selection Dropdown -->
            <q-select
              filled
              outlined
              dense
              v-model="store.selectedChequeNumber"
              @update:model-value="store.selectChequeNumber"
              :options="store.availableChequeNumbers"
              :disable="!store.selectedBooklet"
              label="Select Cheque Number"
              :rules="[(val) => !!val || 'Field is required']"
            />
          </div>
          <!-- DV Number Field -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">DV Number:</q-item-label>
            <q-input filled outlined dense v-model="store.forms.disbursement.dvNumber" />
          </div>

          <!-- Payee Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Payee:</q-item-label>
            <q-input filled outlined dense v-model="store.forms.disbursement.payee" />
          </div>
        </div>
      </q-card-section>

      <!-- Add Expense Button -->
      <q-card-section>
        <div class="row justify-end q-mb-md">
          <q-btn
            label="Add"
            class="add-table-btn"
            icon="add"
            @click="store.openDialog('expense')"
          />
        </div>
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
          <q-item-label class="q-mb-xs">Amount:</q-item-label>
          <q-input
            filled
            outlined
            dense
            :model-value="`₱${(store.totalExpensesAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
            style="width: 40%"
            readonly
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <q-btn
          flat
          label="Cancel"
          class="modal-cancel-btn"
          @click="
            () => {
              store.closeDialog('editDisbursement')
              store.resetEditDisbursement()
            }
          "
        />
        <q-btn label="Save" class="modal-save-btn" @click="store.saveEditedDisbursement" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDisbursementStore } from '../../stores/disbursementStore'

const store = useDisbursementStore()
</script>
