<template>
  <q-page class="q-pa-lg contaug-page">
    <div class="page-header q-mb-lg">
       <div class="row items-center justify-between">
      <div class="text-h5 text-weight-bold">Continuing Augmentation</div>
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

    <div class="q-mb-md">
      <div class="justify-end q-mb-md"></div>
      <div class="row items-center justify-between q-gutter-sm">
        <!-- Search Input -->
        <q-input
        bg-color="white"
          outlined
          dense
          placeholder="Search..."
          v-model="store.searchQuery"
          class="col-md-3 col-sm-5 custom-search-input"
          style="min-width: 450px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <div class="t q-px-xl"></div>

        <!-- Date Range Group -->
        <div class="row items-center justify-between">
          <!-- From Date -->
          <!-- <q-input
          bg-color="white"
            outlined
            label="From"
            dense
            v-model="store.dateFrom"
            mask="##/##/####"
            class="custom-date-from"
            style="width: 200px"
          >
            <template v-slot:append>
              <q-icon name="event" class="calend-icon">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="store.dateFrom" mask="DD/MM/YYYY" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input> -->

          <!-- To Label -->
          <div class="t q-px-xs"></div>
          <div class="t q-px-xs"></div>

          <!-- To Date -->
          <!-- <q-input
          bg-color="white"
            outlined
            label="To"
            dense
            v-model="store.dateTo"
            mask="##/##/####"
            class="custom-date-to"
            style="width: 200px"
          >
            <template v-slot:append>
              <q-icon name="event" class="calend-icon">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="store.dateTo" mask="DD/MM/YYYY" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input> -->
        </div>

        <div class="t q-px-xs"></div>

        <div class="t q-px-xs"></div>

        <!-- Add Button Disbursement -->
        <q-btn
          label="Add"
          icon="add"
          class="add-table-btn"
          @click="store.openDialog('augmentation')"
        />
      </div>
      <div class="justify-end q-mb-md"></div>

      <!--Augmentation Main Table-->
      <q-card>
        <q-table
          :rows="store.augmentation"
          :columns="store.augmentationColumns"
          row-key="id"
          :pagination="store.pagination"
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="button-group">
                <q-btn class="edit-btn" icon="edit" @click="store.editDisbursement(props.row)" />
                <q-btn
                  outlined
                  class="view-btn"
                  icon="visibility"
                  @click="store.openLiquidationTable(props.row)"
                />
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>
      <!--Augmenation Dialog-->
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

      <!-- Expense Selection Dialog -->
      <q-dialog v-model="store.dialogs.augExpense">
        <q-card style="min-width: 800px">
          <q-card-section>
            <div class="text-h6">Select Expense Account</div>
          </q-card-section>

          <q-card-section>
            <q-input
              outlined
              dense
              placeholder="Search expense account..."
              v-model="store.expenseSearch"
              class="q-mb-md"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>

            <!-- Expense Account Selection Table -->
            <q-table
              :rows="store.AugexpenseAccounts"
              :columns="store.AugexpenseAccountColumns"
              row-key="id"
              :filter="store.expenseSearch"
            >
              <template v-slot:body-cell-action="props">
                <q-td :props="props">
                  <q-btn
                    flat
                    label="Select"
                    color="primary"
                    @click="store.openExpenseDetail(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="negative" @click="store.closeDialog('augExpense')" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!--Expense Detail Dialog -->
      <q-dialog v-model="store.dialogs.AugexpenseDetail">
        <q-card style="min-width: 500px">
          <q-card-section>
            <div class="text-h6">Add Expense</div>
          </q-card-section>

          <q-card-section>
            <!-- Display selected account info -->
            <div class="text-subtitle1 q-mb-sm">
              <strong>Account:</strong> {{ store.forms.augExpense.account }}
            </div>
            <div class="text-subtitle1 q-mb-md">
              <strong>Balance:</strong> ₱{{ store.forms.augExpense.balance.toLocaleString() }}
            </div>

            <!-- Particulars Field -->
            <q-input
              outlined
              dense
              v-model="store.forms.augExpense.particulars"
              label="Particulars"
              class="q-mb-md"
              type="textarea"
              autogrow
            />

            <!-- Amount Field -->
            <q-input
              outlined
              dense
              v-model="store.forms.augExpense.amount"
              label="Amount"
              class="q-mb-md"
              prefix="₱"
              type="number"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Cancel"
              color="negative"
              @click="store.closeDialog('AugexpenseDetail')"
            />
            <q-btn label="Save" color="primary" @click="store.saveExpense" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)

const loadPendingUsers = async () => {
  loading.value = true
  try {
    // TODO: Replace with actual API call to fetch continuing augmentations
    // Example: await store.fetchAugmentations()
    // For now, just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 500))
    $q.notify({
      type: 'positive',
      message: 'Augmentation refreshed!',
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
import { useContAugmentationStore } from 'stores/contAugmentation'
const store = useContAugmentationStore()
</script>

<style scoped>
.contaug-page {
  background-color: #D9D9D9; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
}
</style>
