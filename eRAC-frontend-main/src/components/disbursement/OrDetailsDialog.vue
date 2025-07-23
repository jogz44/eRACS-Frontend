<template>
  <q-dialog v-model="store.dialogs.orDetails" persistent>
    <q-card style="min-width: 900px; max-width: 98vw;">
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
          <div class="col-12 col-md-6" style="max-width: 400px; min-width: 0; flex: 1 1 300px;">
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
                :model-value="Number(store.currentLiquidation.dvAmount || 0).toFixed(2)"
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
          <div class="col-12 col-md-6" style="max-width: 400px; min-width: 0; flex: 1 1 300px;">
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
          <div
            v-for="(orDetail, index) in store.currentLiquidation.orDetails"
            :key="index"
            class="q-mb-md"
          >
            <div class="row q-col-gutter-md">
              <!-- Remove Button Far Left -->
              <div class="col-auto flex flex-center" v-if="store.currentLiquidation.orDetails.length > 1" style="min-width: 40px;">
                <q-btn
                  flat
                  round
                  dense
                  icon="remove"
                  color="red"
                  @click="removeOrDetail(index)"
                  title="Remove this OR"
                />
              </div>
              <!-- OR Date -->
              <div class="col-12 col-md-2">
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
              <div class="col-12 col-md-2">
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
              <div class="col-12 col-md-2">
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
                <div class="text-bold q-mb-xs" style="display: flex; align-items: center;">
                  OR Image:
                  <q-btn
                    v-if="orDetail.orPhotoUrl"
                    flat
                    dense
                    round
                    icon="delete"
                    color="red"
                    @click="removeOrImage(index)"
                    style="margin-left: 8px;"
                  />
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
                    <q-btn
                    v-if="!orDetail.orPhotoUrl"
                    flat
                    dense
                    color="primary"
                    icon="upload"
                    label="Upload"
                    @click="triggerOrFileInput(index)"
                    style="min-width: 100px;"
                  />
                  <q-img
                    v-if="orDetail.orPhotoUrl"
                    :src="orDetail.orPhotoUrl"
                    style="max-width: 100%; max-height: 100%; border-radius: 4px; border: 1px solid #eee;"
                  />
                </div>
                <input
                  :ref="setOrImageInputRef(index)"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  style="display: none"
                  @change="(e) => onOrImageChange(e, index)"
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
import { computed, watch, ref, nextTick } from 'vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import axios from 'axios'

const store = useDisbursementStore()
const orImageInputs = ref([])

// Fetch OR Details from backend when dialog opens
async function fetchOrDetails() {
  console.log('Fetching OR Details for disbursement ID:', store.currentLiquidation.id)
  if (!store.currentLiquidation.id || isNaN(Number(store.currentLiquidation.id))) {
    alert('Invalid disbursement ID!');
    return;
  }
  try {
    const res = await axios.get(`/api/barangay/disbursements/${store.currentLiquidation.id}/or-details`)
    // Map backend fields to frontend fields
    store.currentLiquidation.orDetails = res.data.data.map(or => ({
      orDate: or.or_date,
      orNumber: or.or_number,
      orAmount: or.or_amount,
      orImage: null, // Image upload handled separately
      orPhotoUrl: or.or_photo ? `/storage/${or.or_photo}` : null,
      remarks: or.remarks || '',
    }))
  } catch {
    // fallback: initialize empty
    store.currentLiquidation.orDetails = [
      { orNumber: '', orAmount: '', orImage: null, remarks: '' },
    ]
  }
}

// Watch dialog open, fetch OR Details
watch(
  () => store.dialogs.orDetails,
  (isOpen) => {
    if (isOpen) {
      fetchOrDetails()
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
    remarks: '',
  })
}

const removeOrDetail = (index) => {
  if (store.currentLiquidation.orDetails) {
    store.currentLiquidation.orDetails.splice(index, 1)
  }
}

function setOrImageInputRef(index) {
  return (el) => {
    orImageInputs.value[index] = el
  }
}

function triggerOrFileInput(index) {
  nextTick(() => {
    const input = orImageInputs.value[index]
    if (input) {
      input.value = '' // allow re-uploading same file
      input.click()
    }
  })
}

function onOrImageChange(e, index) {
  const file = e.target.files && e.target.files[0]
  if (file) {
    // Clean up previous object URL if any
    const prevUrl = store.currentLiquidation.orDetails[index].orPhotoUrl
    if (prevUrl) URL.revokeObjectURL(prevUrl)
    store.currentLiquidation.orDetails[index].orImage = file
    store.currentLiquidation.orDetails[index].orPhotoUrl = URL.createObjectURL(file)
  }
}

function removeOrImage(index) {
  const prevUrl = store.currentLiquidation.orDetails[index].orPhotoUrl
  if (prevUrl) URL.revokeObjectURL(prevUrl)
  store.currentLiquidation.orDetails[index].orImage = null
  store.currentLiquidation.orDetails[index].orPhotoUrl = null
  const input = orImageInputs.value[index]
  if (input) input.value = ''
}

// function saveOrDetails() {
//   // Example: pass orImageFile.value to store action for upload
//   // store.saveOrDetails({ ...fields, orImage: orImageFile.value })
//   store.dialogs.orDetails = false
// }

const isValid = computed(() => {
  return (
    store.currentLiquidation.orDetails?.every((or) => or.orNumber && or.orAmount && or.orImage) ??
    false
  )
})
</script>
