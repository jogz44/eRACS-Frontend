<template>
  <q-dialog v-model="store.dialogs.orDetails" persistent>
    <q-card style="min-width: 900px">
      <q-card-section>
        <div class="row justify-between items-center">
          <div class="text-h6">{{ store.currentLiquidation.dvNumber }}</div>
          <q-btn flat icon="close" color="black" @click="store.closeDialog('orDetails')" />
        </div>
      </q-card-section>

      <q-card-section>
        <!-- Single column layout matching the image -->
        <div class="row q-col-gutter-md">
          <!-- Left column - Financial details -->
          <div class="col-12 col-md-6">
            <!-- Actual Expense -->
            <div class="q-mb-md">
              <div class="text-bold q-mb-xs">Actual Expense:</div>
              <q-input
                filled
                unelaveted
                outlined
                :model-value="totalActualExpense"
                placeholder="0.00"
                type="number"
                prefix="₱"
                readonly
              />
            </div>

            <!-- DV Amount -->
            <div class="q-mb-md">
              <div class="text-bold q-mb-xs">DV Amount:</div>
              <q-input
                filled
                unelaveted
                outlined
                :model-value="`${store.currentLiquidation.dvAmount.toFixed(2)}`"
                prefix="₱"
                readonly
              />
            </div>

            <!-- Amount to Return to Appropriation -->
            <div class="q-mb-md">
              <div class="text-bold q-mb-xs">Amount to Return to Appropriation:</div>
              <q-input
                filled
                unelaveted
                outlined
                :model-value="totalReturnAmount"
                prefix="₱"
                readonly
              />
            </div>
          </div>

          <!-- Right column - Date and Remarks -->
          <div class="col-12 col-md-6">
            <!-- Date -->
            <div class="q-mb-md">
              <div class="text-bold q-mb-xs">Date:</div>
              <q-input filled unelaveted outlined v-model="store.currentLiquidation.date">
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="store.currentLiquidation.date" mask="DD/MM/YYYY" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- Remarks -->
            <div class="q-mb-md">
              <div class="text-bold q-mb-xs">Remarks:</div>
              <q-input
                filled
                unelaveted
                outlined
                v-model="store.currentLiquidation.remarks"
                placeholder="Enter remarks"
              />
            </div>
          </div>
        </div>

        <!-- Liquidation Section -->
        <div class="q-mt-lg">
          <div class="row items-center q-mb-md">
            <div class="text-bold q-mb-xs">Liquidation:</div>
            <q-space />
            <q-btn color="green" icon="add" label="Add" flat @click="addOrDetail" />
          </div>

          <!-- OR Details List - Maintains original styling with added OR Date -->
          <!-- OR Details List - Maintains original styling with added OR Date -->
          <div
            v-for="(orDetail, index) in store.currentLiquidation.orDetails"
            :key="index"
            class="q-mb-md"
          >
            <div class="row q-col-gutter-md">
              <!-- OR Date -->
              <div class="col-12 col-md-3">
                <div class="text-bold q-mb-xs">OR Date:</div>
                <q-input
                  filled
                  unelaveted
                  outlined
                  v-model="orDetail.orDate"
                  placeholder="Select Date"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date
                          v-model="orDetail.orDate"
                          mask="YYYY-MM-DD"
                          @update:model-value="calculateTotals"
                        />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <!-- OR Number -->
              <div class="col-12 col-md-3">
                <div class="text-bold q-mb-xs">OR Number:</div>
                <q-input
                  filled
                  unelaveted
                  outlined
                  v-model="orDetail.orNumber"
                  placeholder="OR Number"
                />
              </div>

              <!-- OR Amount -->
              <div class="col-12 col-md-3">
                <div class="text-bold q-mb-xs">OR Amount:</div>
                <q-input
                  filled
                  unelaveted
                  outlined
                  v-model="orDetail.orAmount"
                  placeholder="0.00"
                  type="number"
                  prefix="₱"
                  @update:model-value="calculateTotals"
                />
              </div>

              <!-- OR Image -->
              <div class="col-12 col-md-3">
                <div class="text-bold q-mb-xs">OR Image:</div>
                <q-btn
                  v-if="!orDetail.orImage"
                  flat
                  dense
                  outline
                  color="green"
                  class="full-width"
                  icon="upload"
                  label="Upload Image"
                  @click="$refs[`orImageUploader${index}`][0].pickFiles()"
                />
                <q-uploader
                  :ref="`orImageUploader${index}`"
                  style="display: none"
                  accept=".jpg,.png,.pdf"
                  @added="(files) => uploadOrImage(files, index)"
                />
                <q-img
                  v-if="orDetail.orImage"
                  :src="orDetail.orImage"
                  style="max-width: 100%; max-height: 100px; margin-top: 10px"
                />
                <q-btn
                  v-if="store.currentLiquidation.orDetails.length > 1"
                  flat
                  dense
                  icon="remove"
                  color="red"
                  @click="removeOrDetail(index)"
                  class="q-mt-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Partial" color="warning" @click="store.closeDialog('orDetails')" />
        <q-btn label="Submit" color="green" @click="store.saveOrDetails" :disable="!isValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useDisbursementStore } from '../../stores/disbursementStore'

const store = useDisbursementStore()

// Initialize orDetails when dialog opens
watch(
  () => store.dialogs.orDetails,
  (isOpen) => {
    if (
      isOpen &&
      (!store.currentLiquidation.orDetails || !store.currentLiquidation.orDetails.length)
    ) {
      store.currentLiquidation.orDetails = [
        {
          orNumber: '',
          orAmount: '',
          orImage: null,
        },
      ]
    }
  },
)

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

const calculateTotals = () => {
  // Computed properties will update automatically
}

const addOrDetail = () => {
  if (!store.currentLiquidation.orDetails) {
    store.currentLiquidation.orDetails = []
  }
  store.currentLiquidation.orDetails.push({
    orNumber: '',
    orAmount: '',
    orImage: null,
  })
}

const removeOrDetail = (index) => {
  if (store.currentLiquidation.orDetails) {
    store.currentLiquidation.orDetails.splice(index, 1)
  }
}

const uploadOrImage = (files, index) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    if (store.currentLiquidation.orDetails?.[index]) {
      store.currentLiquidation.orDetails[index].orImage = e.target.result
    }
  }
  reader.readAsDataURL(files[0])
}

const isValid = computed(() => {
  return (
    store.currentLiquidation.orDetails?.every((or) => or.orNumber && or.orAmount && or.orImage) ??
    false
  )
})
</script>
