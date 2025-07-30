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
                :color="actualReturnAmount < 0 ? 'negative' : undefined"
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

          <!-- Existing OR Details (Read-only for partial continuation) -->
          <div v-if="hasExistingOrDetails" class="q-mb-lg">
            <div class="text-subtitle2 q-mb-md text-grey-7">Previously Saved OR Details:</div>
            <div
              v-for="(orDetail, index) in existingOrDetails"
              :key="`existing-${index}`"
              class="q-mb-md"
            >
              <div class="row q-col-gutter-md">
                <!-- OR Date -->
                <div class="col-12 col-md-3">
                  <div class="text-bold q-mb-xs">OR Date:</div>
                  <q-input
                    outlined
                    :model-value="orDetail.orDate"
                    readonly
                    bg-color="grey-3"
                  />
                </div>

                <!-- OR Number -->
                <div class="col-12 col-md-3">
                  <div class="text-bold q-mb-xs">OR Number:</div>
                  <q-input
                    outlined
                    :model-value="orDetail.orNumber"
                    readonly
                    bg-color="grey-3"
                  />
                </div>

                <!-- OR Amount -->
                <div class="col-12 col-md-3">
                  <div class="text-bold q-mb-xs">OR Amount:</div>
                  <q-input
                    outlined
                    :model-value="orDetail.orAmount"
                    prefix="₱"
                    readonly
                    bg-color="grey-3"
                  />
                </div>

                <!-- OR Image -->
                <div class="col-12 col-md-3">
                  <div class="text-bold q-mb-xs">OR Image:</div>
                  <q-img
                    v-if="orDetail.orPhotoUrl"
                    :src="orDetail.orPhotoUrl"
                    style="max-width: 100%; max-height: 100px; border-radius: 4px; border: 1px solid #eee;"
                  />
                  <div v-else class="text-grey">No image uploaded</div>
                </div>
              </div>
            </div>
          </div>

          <!-- New OR Details (Editable) -->
          <div v-if="hasNewOrDetails" class="q-mb-lg">
            <div class="text-subtitle2 q-mb-md text-primary">New OR Details:</div>
            <div
              v-for="(orDetail, index) in newOrDetails"
              :key="`new-${index}`"
              class="q-mb-md"
            >
              <div class="row q-col-gutter-md">
                <!-- Remove Button Far Left -->
                <div class="col-auto flex flex-center" v-if="newOrDetails.length > 1" style="min-width: 40px;">
                  <q-btn
                    flat
                    round
                    dense
                    icon="remove"
                    color="red"
                    @click="removeNewOrDetail(index)"
                    title="Remove this OR"
                  />
                </div>
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
                            mask="DD/MM/YYYY"
                            @update:model-value="(val) => handleDateChange(val, getNewOrDetailIndex(index))"
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
                  <!-- Over-liquidation warning -->
                  <div v-if="actualReturnAmount < 0" class="text-negative q-mt-xs text-caption">
                    Exceeds DV amount
                  </div>
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
                      @click="removeNewOrImage(index)"
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
                      @click="triggerNewOrFileInput(index)"
                      style="min-width: 100px;"
                    />
                    <q-img
                      v-if="orDetail.orPhotoUrl"
                      :src="orDetail.orPhotoUrl"
                      style="max-width: 100%; max-height: 100%; border-radius: 4px; border: 1px solid #eee;"
                    />
                  </div>
                  <input
                    :ref="setNewOrImageInputRef(index)"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    style="display: none"
                    @change="(e) => onNewOrImageChange(e, index)"
                  />
                </div>
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
          :disable="!isValid || actualReturnAmount < 0"
          :loading="saving"
        />
        <q-btn 
          label="Submit" 
          color="green" 
          @click="handleSaveOrDetails" 
          :disable="!canSubmit"
          :loading="saving"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, watch, ref, nextTick } from 'vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const saving = ref(false)

const store = useDisbursementStore()
const newOrImageInputs = ref([])

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
      orPhotoUrl: null,
      serverPhotoPath: null,
      remarks: '',
      isReadOnly: false,
    }]
  } else {
    // For partial liquidations, add one empty row for new OR details
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    const todayFormatted = `${dd}/${mm}/${yyyy}`
    
    store.currentLiquidation.orDetails.push({
      orNumber: '',
      orAmount: '',
      orDate: todayFormatted,
      orImage: null,
      orPhotoUrl: null,
      serverPhotoPath: null,
      remarks: '',
      isReadOnly: false,
    })
  }
}

// Watch dialog open, fetch OR Details
watch(
  () => store.dialogs.orDetails,
  (isOpen) => {
    if (isOpen) {
      initializeOrDetails()
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
  const returnAmount = store.currentLiquidation.dvAmount - parseFloat(totalActualExpense.value)
  // Prevent negative return amounts - if over-liquidation occurs, show 0.00
  return Math.max(0, returnAmount).toFixed(2)
})

// Actual return amount for validation (can be negative)
const actualReturnAmount = computed(() => {
  if (!store.currentLiquidation?.dvAmount) return 0
  return store.currentLiquidation.dvAmount - parseFloat(totalActualExpense.value)
})



// Separate existing and new OR details
const existingOrDetails = computed(() => {
  if (!store.currentLiquidation?.orDetails) return []
  return store.currentLiquidation.orDetails.filter(or => or.isReadOnly)
})

const newOrDetails = computed(() => {
  if (!store.currentLiquidation?.orDetails) return []
  return store.currentLiquidation.orDetails.filter(or => !or.isReadOnly)
})

const hasExistingOrDetails = computed(() => {
  return existingOrDetails.value.length > 0
})

const hasNewOrDetails = computed(() => {
  return newOrDetails.value.length > 0
})

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
    orDate: todayFormatted,
    orImage: null,
    orPhotoUrl: null,
    serverPhotoPath: null,
    remarks: '',
    isReadOnly: false,
  })
}

// Helper function to get the actual index in the full orDetails array
const getNewOrDetailIndex = (newIndex) => {
  const existingCount = existingOrDetails.value.length
  return existingCount + newIndex
}

// Remove new OR detail
const removeNewOrDetail = (newIndex) => {
  const actualIndex = getNewOrDetailIndex(newIndex)
  if (store.currentLiquidation.orDetails) {
    store.currentLiquidation.orDetails.splice(actualIndex, 1)
  }
}

// New OR detail image functions
const setNewOrImageInputRef = (index) => {
  return (el) => {
    newOrImageInputs.value[index] = el
  }
}

const triggerNewOrFileInput = (index) => {
  nextTick(() => {
    const input = newOrImageInputs.value[index]
    if (input) {
      input.value = '' // allow re-uploading same file
      input.click()
    }
  })
}

const onNewOrImageChange = (e, newIndex) => {
  const file = e.target.files && e.target.files[0]
  if (file) {
    const actualIndex = getNewOrDetailIndex(newIndex)
    // Store the file for later upload
    store.currentLiquidation.orDetails[actualIndex].orImage = file
    
    // Create local file path for preview
    const localPath = URL.createObjectURL(file)
    store.currentLiquidation.orDetails[actualIndex].orPhotoUrl = localPath
    
    $q.notify({
      type: 'positive',
      message: 'Photo selected successfully!',
      position: 'top',
    })
  }
}

const removeNewOrImage = (newIndex) => {
  const actualIndex = getNewOrDetailIndex(newIndex)
  const prevUrl = store.currentLiquidation.orDetails[actualIndex].orPhotoUrl
  if (prevUrl && prevUrl.startsWith('blob:')) {
    URL.revokeObjectURL(prevUrl)
  }
  store.currentLiquidation.orDetails[actualIndex].orImage = null
  store.currentLiquidation.orDetails[actualIndex].orPhotoUrl = null
  store.currentLiquidation.orDetails[actualIndex].serverPhotoPath = null
  const input = newOrImageInputs.value[newIndex]
  if (input) input.value = ''
}



// function saveOrDetails() {
//   // Example: pass orImageFile.value to store action for upload
//   // store.saveOrDetails({ ...fields, orImage: orImageFile.value })
//   store.dialogs.orDetails = false
// }

const isValid = computed(() => {
  // Only validate new OR details (non-read-only ones)
  const newDetails = store.currentLiquidation.orDetails?.filter(or => !or.isReadOnly) || []
  
  // If no new details, check if there are any existing details (for view-only case)
  if (newDetails.length === 0) {
    const existingDetails = store.currentLiquidation.orDetails?.filter(or => or.isReadOnly) || []
    return existingDetails.length > 0
  }
  
  // Validate all new details
  return newDetails.every((or) => 
    or.orNumber && or.orAmount && or.orDate && or.orPhotoUrl
  )
})

const canSubmit = computed(() => {
  if (!isValid.value) return false
  
  const returnAmount = actualReturnAmount.value
  
  // Cannot submit if return amount is negative (over-liquidation)
  if (returnAmount < 0) return false
  
  // Can only submit when return amount is exactly 0 (full liquidation)
  return Math.abs(returnAmount) < 0.01
})

const handleDateChange = (date, index) => {
  console.log('Date changed:', date, 'for index:', index)
  store.currentLiquidation.orDetails[index].orDate = date
  calculateTotals()
}

const handlePartialLiquidation = async () => {
  saving.value = true
  try {
    // First, upload all photos that haven't been uploaded yet (only for new OR details)
    for (let i = 0; i < store.currentLiquidation.orDetails.length; i++) {
      const orDetail = store.currentLiquidation.orDetails[i]
      // Only process new OR details (non-read-only)
      if (!orDetail.isReadOnly && orDetail.orImage && !orDetail.serverPhotoPath) {
        try {
          const uploadResult = await store.uploadOrPhoto(orDetail.orImage)
          if (uploadResult.success) {
            store.currentLiquidation.orDetails[i].serverPhotoPath = uploadResult.path
            // Keep the local preview visible, don't replace it
            // The server path is stored separately for database
          } else {
            throw new Error(uploadResult.error)
          }
        } catch (error) {
          console.error('Error uploading photo:', error)
          $q.notify({
            type: 'negative',
            message: `Failed to upload photo for OR ${orDetail.orNumber || i + 1}: ${error.message}`,
            icon: 'error',
            position: 'top',
          })
          return
        }
      }
    }
    
    // Save as partial liquidation
    const result = await store.savePartialOrDetails()
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Partial liquidation saved successfully!',
        icon: 'check_circle',
        position: 'top',
      })
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
    saving.value = false
  }
}

const handleSaveOrDetails = async () => {
  saving.value = true
  try {
    // First, upload all photos that haven't been uploaded yet (only for new OR details)
    for (let i = 0; i < store.currentLiquidation.orDetails.length; i++) {
      const orDetail = store.currentLiquidation.orDetails[i]
      // Only process new OR details (non-read-only)
      if (!orDetail.isReadOnly && orDetail.orImage && !orDetail.serverPhotoPath) {
        try {
          const uploadResult = await store.uploadOrPhoto(orDetail.orImage)
          if (uploadResult.success) {
            store.currentLiquidation.orDetails[i].serverPhotoPath = uploadResult.path
            // Keep the local preview visible, don't replace it
            // The server path is stored separately for database
          } else {
            throw new Error(uploadResult.error)
          }
        } catch (error) {
          console.error('Error uploading photo:', error)
          $q.notify({
            type: 'negative',
            message: `Failed to upload photo for OR ${orDetail.orNumber || i + 1}: ${error.message}`,
            icon: 'error',
            position: 'top',
          })
          return
        }
      }
    }
    
    // Now save the OR details
    const result = await store.saveOrDetails()
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'OR Details saved successfully!',
        icon: 'check_circle',
        position: 'top',
      })
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
    saving.value = false
  }
}
</script>
