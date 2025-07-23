<template>
  <q-dialog v-model="store.dialogs.viewOrDetails" persistent>
    <q-card style="min-width: 900px">
      <q-card-section>
        <div class="row justify-between items-center">
          <div class="text-h6">{{ store.currentLiquidation.dvNumber }}</div>
          <q-btn flat icon="close" color="black" @click="store.closeDialog('viewOrDetails')" />
        </div>
      </q-card-section>

      <q-card-section>
        <!-- Single column layout -->
        <div class="row q-col-gutter-md">
          <!-- Left column - Financial details -->
          <div class="col-12 col-md-6">
            <!-- Actual Expense -->
            <div class="q-mb-md">
              <div class="text-bold q-mb-xs">Actual Expense:</div>
              <q-input
                outlined
                :model-value="totalActualExpense"
                placeholder="0.00"
                prefix="₱"
                disable and readonly
                bg-color="grey-3"
              />
            </div>

            <!-- DV Amount -->
            <div class="q-mb-md">
              <div class="text-bold q-mb-xs">DV Amount:</div>
              <q-input
                outlined
                :model-value="Number(store.currentLiquidation.dvAmount || 0).toFixed(2)"
                prefix="₱"
                disable and readonly
                bg-color="grey-3"
              />
            </div>

            <!-- Amount to Return -->
            <div class="q-mb-md">
              <div class="text-bold q-mb-xs">Amount to Return to Appropriation:</div>
              <q-input outlined :model-value="totalReturnAmount" prefix="₱" disable and readonly
                bg-color="grey-3" />
            </div>
          </div>

          <!-- Right column - Date and Remarks -->
          <div class="col-12 col-md-6">
            <!-- Date -->
            <div class="q-mb-md">
              <div class="text-bold q-mb-xs">Date:</div>
              <q-input outlined :model-value="store.currentLiquidation.date" disable and readonly
                bg-color="grey-3" />
            </div>

            <!-- Remarks -->
            <div class="q-mb-md">
              <div class="text-bold q-mb-xs">Remarks:</div>
              <q-input outlined :model-value="store.currentLiquidation.remarks" disable and readonly
                bg-color="grey-3" />
            </div>
          </div>
        </div>

        <!-- Liquidation Section -->
        <div class="q-mt-lg">
          <div class="text-bold q-mb-md">Liquidation Details:</div>

          <!-- OR Details List -->
          <div
            v-for="(orDetail, index) in store.currentLiquidation.orDetails"
            :key="index"
            class="q-mb-md"
          >
            <div class="row q-col-gutter-md">
              <!-- OR Date -->
              <div class="col-12 col-md-3">
                <div class="text-bold q-mb-xs">OR Date:</div>
                <q-input outlined :model-value="orDetail.orDate" readonly />
              </div>

              <!-- OR Number -->
              <div class="col-12 col-md-3">
                <div class="text-bold q-mb-xs">OR Number:</div>
                <q-input outlined :model-value="orDetail.orNumber" readonly />
              </div>

              <!-- OR Amount -->
              <div class="col-12 col-md-3">
                <div class="text-bold q-mb-xs">OR Amount:</div>
                <q-input outlined :model-value="orDetail.orAmount" prefix="₱" readonly />
              </div>

              <!-- OR Image -->
              <div class="col-12 col-md-3">
                <div class="text-bold q-mb-xs">OR Image:</div>
                <q-img
                  v-if="orDetail.orImage"
                  :src="orDetail.orImage"
                  style="max-width: 100%; max-height: 100px"
                />
                <div v-else class="text-grey">No image uploaded</div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Close" @click="store.closeDialog('viewOrDetails')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useDisbursementStore } from 'stores/disbursementStore'

const store = useDisbursementStore()

const totalActualExpense = computed(() => {
  if (!store.currentLiquidation?.orDetails) return '0.00'
  return store.currentLiquidation.orDetails
    .reduce((sum, or) => sum + (parseFloat(or.orAmount) || 0), 0)
    .toFixed(2)
})

const totalReturnAmount = computed(() => {
  if (!store.currentLiquidation?.dvAmount) return '0.00'
  return (store.currentLiquidation.dvAmount - parseFloat(totalActualExpense.value)).toFixed(2)
})
</script>

<style scoped>
.allocate-btn {
  color: #1976d2;
}
</style>
