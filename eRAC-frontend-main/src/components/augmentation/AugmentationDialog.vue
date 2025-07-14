<template>
  <q-dialog v-model="store.dialogs.augmentation" persistent>
    <q-card style="min-width: 1100px">
      <q-card-section>
        <div class="text-h6">Augmentation</div>
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
              v-model="store.forms.augmentation.date"
              mask="##/##/####"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="store.forms.augmentation.date" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <!-- Ref No. -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Ref No.:</q-item-label>
            <q-input filled outlined dense v-model="store.forms.augmentation.refNo" />
          </div>

          <!-- Remarks -->
          <div class="col-md-4 col-sm-6">
            <q-item-label class="q-mb-xs">Remarks:</q-item-label>
            <q-input filled outlined dense v-model="store.forms.augmentation.remarks" />
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
            @click="store.openDialog('augExpense')"
          />
        </div>

        <!-- Expense Table -->
        <q-table
          :rows="store.Augexpenses"
          :columns="store.expenseAugColumns"
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
        <!-- Amount Field -->
        <div class="q-mt-md">
          <q-item-label class="q-mb-xs">Amount:</q-item-label>
          <q-input filled outlined readonly="true" dense prefix="₱" style="width: 40%" />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <q-btn
          flat
          label="Cancel"
          class="modal-cancel-btn"
          @click="store.closeDialog('augmentation')"
        />
        <q-btn label="Save" class="modal-save-btn" @click="store.saveDisbursement" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useAugmentationStore } from '../../stores/augmentation'
const store = useAugmentationStore()
</script>

<style scoped></style>
