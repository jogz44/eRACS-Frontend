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
                :model-value="formatAmount(store.currentLiquidation.dvAmount)"
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
        <q-btn
          flat
          label="Partial"
          color="warning"
          @click="handlePartialLiquidation"
          :disable="!isValid || !canSubmit || savingSubmit"
          :loading="savingPartial"
        />
        <q-btn
          label="Submit"
          color="green"
          @click="showSubmitConfirmation"
          :disable="!canSubmit || savingPartial"
          :loading="savingSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Custom Confirmation Dialog -->
  <q-dialog v-model="showConfirmationDialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="text-left">
        <div class="text-h6 q-mb-md">Confirm Liquidation</div>
        <div v-if="parseFloat(totalReturnAmount) > 0" class="text-body1 text-negative q-mb-md">
          There's still an amount to return to appropriation: <strong>₱{{ totalReturnAmount }}</strong>
        </div>
        <div class="text-body1 q-mb-md">
          Are you sure you want to submit this liquidation? This action cannot be undone.
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" @click="showConfirmationDialog = false" />
        <q-btn flat label="Partial" color="warning" @click="handleConfirmationPartial" />
        <q-btn label="Submit" color="green" @click="handleConfirmationSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useContDisbursementStore } from 'stores/contDisburseStore'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const store = useContDisbursementStore()
const savingPartial = ref(false)
const savingSubmit = ref(false)
const showConfirmationDialog = ref(false)

const emit = defineEmits(['save'])

// Initialize OR Details when dialog opens
function initializeOrDetails() {
  // If no OR details exist, add one empty row for new liquidation
  if (!store.currentLiquidation.orDetails || store.currentLiquidation.orDetails.length === 0) {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    const todayFormatted = `${dd}/${mm}/${yyyy}`

    store.currentLiquidation.orDetails = [{
      orNumber: '',
      orAmount: '',
      orDate: todayFormatted,
      orImage: null,
      orImageFile: null,
      orPhotoUrl: null,
      serverPhotoPath: null,
      remarks: '',
    }]
  }
  // Don't add additional rows automatically - let users add them as needed
}

// Watch dialog open, fetch OR Details
watch(
  () => store.dialogs.orDetails,
  (isOpen) => {
    if (isOpen) {
      // Only initialize if we don't already have OR details
      if (!store.currentLiquidation?.orDetails || store.currentLiquidation.orDetails.length === 0) {
        initializeOrDetails()
      }
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
  const dvAmount = typeof store.currentLiquidation.dvAmount === 'string' ? parseFloat(store.currentLiquidation.dvAmount) : store.currentLiquidation.dvAmount
  const actualExpense = parseFloat(totalActualExpense.value) || 0
  return (dvAmount - actualExpense).toFixed(2)
})

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2)
}

const calculateTotals = () => {
  // Computed properties will update automatically
}

const addOrDetail = () => {
  if (!store.currentLiquidation.orDetails) {
    store.currentLiquidation.orDetails = []
  }
  
  // Get today's date in DD/MM/YYYY format
  const today = new Date()
  const dd = String(today.getDate()).padStart(2, '0')
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const yyyy = today.getFullYear()
  const todayFormatted = `${dd}/${mm}/${yyyy}`

  store.currentLiquidation.orDetails.push({
    orNumber: '',
    orAmount: '',
    orDate: todayFormatted, // Preload with today's date
    orImage: null,
    orImageFile: null,
    orPhotoUrl: null,
    serverPhotoPath: null,
    remarks: '',
  })
}

const removeOrDetail = (index) => {
  if (store.currentLiquidation.orDetails) {
    store.currentLiquidation.orDetails.splice(index, 1)
  }
}

const uploadOrImage = (files, index) => {
  if (store.currentLiquidation.orDetails?.[index]) {
    // Store the actual File object for later upload
    store.currentLiquidation.orDetails[index].orImageFile = files[0]
    
    // Also create a preview URL for display
    const reader = new FileReader()
    reader.onload = (e) => {
      store.currentLiquidation.orDetails[index].orImage = e.target.result
    }
    reader.readAsDataURL(files[0])
  }
}

const isValid = computed(() => {
  // Validate all OR details
  const allDetails = store.currentLiquidation.orDetails || []

  // If no details exist, return false
  if (allDetails.length === 0) return false

  // Validate all details (photos are optional)
  return allDetails.every((or) =>
    or.orNumber && or.orAmount && or.orDate
  )
})

const canSubmit = computed(() => {
  if (!isValid.value) return false

  const returnAmount = actualReturnAmount.value

  // Cannot submit if return amount is negative (over-liquidation)
  if (returnAmount < 0) return false

  // Allow submit when form is valid and return amount is 0 or positive
  return returnAmount >= 0
})

// Actual return amount for validation (can be negative)
const actualReturnAmount = computed(() => {
  if (!store.currentLiquidation?.dvAmount) return 0
  return store.currentLiquidation.dvAmount - parseFloat(totalActualExpense.value)
})

const handlePartialLiquidation = async () => {
  savingPartial.value = true
  try {
    // Save as partial liquidation
    const result = await store.savePartialOrDetails()
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Partial liquidation saved successfully!',
        icon: 'check_circle',
        position: 'top',
      })
      emit('save', result)
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Failed to save partial liquidation',
        icon: 'error',
        position: 'top',
      })
    }
  } catch (error) {
    console.error('Error saving partial liquidation:', error)
    $q.notify({
      type: 'negative',
      message: 'An error occurred while saving',
      icon: 'error',
      position: 'top',
    })
  } finally {
    savingPartial.value = false
  }
}

const showSubmitConfirmation = () => {
  console.log('Showing confirmation dialog...')
  showConfirmationDialog.value = true
}

const handleConfirmationSubmit = () => {
  showConfirmationDialog.value = false
  console.log('User confirmed liquidation, proceeding...')
  handleSaveOrDetails()
}

const handleConfirmationPartial = () => {
  showConfirmationDialog.value = false
  console.log('User chose partial liquidation...')
  handlePartialLiquidation()
}

const handleSaveOrDetails = async () => {
  console.log('handleSaveOrDetails called - starting liquidation process...')
  savingSubmit.value = true
  try {
    // Save the OR details as complete liquidation
    const result = await store.saveOrDetails()
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'OR Details saved successfully!',
        icon: 'check_circle',
        position: 'top',
      })
      emit('save', result)
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Failed to save OR details',
        icon: 'error',
        position: 'top',
      })
    }
  } catch (error) {
    console.error('Error saving OR details:', error)
    $q.notify({
      type: 'negative',
      message: 'An error occurred while saving',
      icon: 'error',
      position: 'top',
    })
  } finally {
    savingSubmit.value = false
  }
}
</script>
