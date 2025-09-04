<template>
  <q-dialog v-model="store.dialogs.orDetails" persistent>
    <q-card style="min-width: 1100px">
      <q-card-section>
        <div class="text-h6">
          Liquidation Details for Disbursement #{{ store.currentLiquidation.dvNumber }}
        </div>
        <div class="text-caption text-grey-6 q-mt-sm">
          Add official receipt details for liquidation
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
              v-model="store.currentLiquidation.date"
              mask="##/##/####"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="store.currentLiquidation.date" mask="DD/MM/YYYY" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
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
              :color="actualReturnAmount < 0 ? 'negative' : undefined"
            />
          </div>

          <!-- Remarks Field -->
          <div class="col-md-4 col-sm-12">
            <q-item-label class="q-mb-xs">Remarks:</q-item-label>
            <q-input
              filled
              outlined
              dense
              v-model="store.currentLiquidation.remarks"
              placeholder="Enter remarks"
              @update:model-value="handleRemarksChange"
            />
          </div>
        </div>
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
            color="green"
            icon="add"
            label="Add OR"
            flat
            @click="addOrDetail"
          />
        </div>

          <!-- OR Details (All Editable) -->
          <div v-if="store.currentLiquidation?.orDetails?.length > 0" class="q-mb-lg">
            <div
              v-for="(orDetail, index) in store.currentLiquidation.orDetails"
              :key="orDetail.id || `new-or-${index}`"
              class="q-mb-md"
            >
              <div class="row items-center q-col-gutter-md">
                <!-- Remove Button -->
                <div class="col-auto" v-if="store.currentLiquidation.orDetails.length > 1">
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

                <div class="col row q-col-gutter-md no-wrap">
                  <!-- OR Date -->
                  <div class="col">
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
                              @update:model-value="(val) => handleDateChange(val, index)"
                            />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>

                  <!-- OR Number -->
                  <div class="col">
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
                  <div class="col">
                    <div class="text-bold q-mb-xs">OR Amount:</div>
                    <q-input
                      filled
                      unelaveted
                      outlined
                      :model-value="formatInputValue(orDetail.orAmount)"
                      @update:model-value="(val) => { orDetail.orAmount = handleAmountInput(val); calculateTotals() }"
                      @blur="(e) => { orDetail.orAmount = formatToTwoDecimals(e.target.value); calculateTotals() }"
                      placeholder="0.00"
                      prefix="₱"
                      inputmode="decimal"
                      pattern="\\d*\\.?\\d{0,2}"
                      @keypress="blockNonNumeric"
                      @paste.prevent="handlePasteNumeric"
                    />
                    <!-- Over-liquidation warning -->
                    <div v-if="actualReturnAmount < 0" class="text-negative q-mt-xs text-caption">
                      Exceeds DV amount
                    </div>
                  </div>

                  <!-- OR Image -->
                  <div class="col">
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
                        style="max-width: 100%; max-height: 100px; border-radius: 4px; border: 1px solid #eee;"
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
          </div>
      </q-card-section>

      <q-card-actions align="right" class="custom-actions">
        <q-btn
          flat
          label="Cancel"
          class="modal-cancel-btn"
          @click="store.closeDialog('orDetails')"
        />
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
import { computed, watch, ref, nextTick } from 'vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const savingPartial = ref(false)
const savingSubmit = ref(false)
const showConfirmationDialog = ref(false)

const store = useDisbursementStore()

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

// Watch remarks changes to ensure they're properly updated
watch(
  () => store.currentLiquidation?.remarks,
  (newRemarks) => {
    if (newRemarks !== undefined) {
      // Ensure remarks are properly set in the store
      store.currentLiquidation.remarks = newRemarks
    }
  },
  { deep: true }
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

const orDetailsCount = computed(() => {
  return store.currentLiquidation?.orDetails?.length || 0
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
  })
}



// Remove OR detail (unified function)
const removeOrDetail = async (index) => {
  console.log('Removing OR detail at index:', index)
  console.log('Current OR details before removal:', JSON.parse(JSON.stringify(store.currentLiquidation.orDetails)))

  if (store.currentLiquidation.orDetails && store.currentLiquidation.orDetails.length > 0) {
    // Ensure we don't go below minimum rows
    if (store.currentLiquidation.orDetails.length <= 1) {
      $q.notify({
        type: 'warning',
        message: 'Cannot remove the last OR detail. At least one row is required.',
        icon: 'warning',
        position: 'top',
      })
      return
    }

    const orDetail = store.currentLiquidation.orDetails[index]
    console.log('Removing OR detail:', orDetail)

    // If it's an existing OR detail (has ID), delete it from backend first
    if (orDetail.id) {
      try {
        const result = await store.deleteOrDetail(store.currentLiquidation.id, orDetail.id)
        if (result.success) {
          // Find the correct index again in case the array changed
          const currentIndex = store.currentLiquidation.orDetails.findIndex(detail => detail.id === orDetail.id)
          if (currentIndex !== -1) {
            store.currentLiquidation.orDetails.splice(currentIndex, 1)
            console.log('OR detail removed from backend and local array at index:', currentIndex)
          } else {
            console.warn('OR detail not found in array after backend deletion')
          }
          $q.notify({
            type: 'positive',
            message: 'OR Detail removed successfully!',
            icon: 'check_circle',
            position: 'top',
          })
        } else {
          $q.notify({
            type: 'negative',
            message: result.message || 'Failed to remove OR Detail',
            icon: 'error',
            position: 'top',
          })
        }
      } catch (error) {
        console.error('Error removing OR detail:', error)
        $q.notify({
          type: 'negative',
          message: 'An error occurred while removing OR Detail',
          icon: 'error',
          position: 'top',
        })
      }
    } else {
      // If it's a new OR detail (no ID), find it by comparing the object reference
      const currentIndex = store.currentLiquidation.orDetails.findIndex(detail =>
        detail === orDetail ||
        (detail.orNumber === orDetail.orNumber &&
         detail.orAmount === orDetail.orAmount &&
         detail.orDate === orDetail.orDate)
      )
      if (currentIndex !== -1) {
        store.currentLiquidation.orDetails.splice(currentIndex, 1)
        console.log('New OR detail removed from local array at index:', currentIndex)
      } else {
        console.warn('New OR detail not found in array')
      }
    }

    console.log('OR details after removal:', JSON.parse(JSON.stringify(store.currentLiquidation.orDetails)))
  }
}



// Unified OR detail image functions
const orImageInputs = ref([])

const setOrImageInputRef = (index) => {
  return (el) => {
    orImageInputs.value[index] = el
  }
}

const triggerOrFileInput = (index) => {
  nextTick(() => {
    const input = orImageInputs.value[index]
    if (input) {
      input.value = '' // allow re-uploading same file
      input.click()
    }
  })
}

const onOrImageChange = (e, index) => {
  const file = e.target.files && e.target.files[0]
  if (file) {
    // Store the file for later upload
    store.currentLiquidation.orDetails[index].orImage = file

    // Create local file path for preview
    const localPath = URL.createObjectURL(file)
    store.currentLiquidation.orDetails[index].orPhotoUrl = localPath

    $q.notify({
      type: 'positive',
      message: 'Photo selected successfully!',
      position: 'top',
    })
  }
}

const removeOrImage = (index) => {
  const prevUrl = store.currentLiquidation.orDetails[index].orPhotoUrl
  if (prevUrl && prevUrl.startsWith('blob:')) {
    URL.revokeObjectURL(prevUrl)
  }
  store.currentLiquidation.orDetails[index].orImage = null
  store.currentLiquidation.orDetails[index].orPhotoUrl = null
  store.currentLiquidation.orDetails[index].serverPhotoPath = null
  const input = orImageInputs.value[index]
  if (input) input.value = ''
}





// function saveOrDetails() {
//   // Example: pass orImageFile.value to store action for upload
//   // store.saveOrDetails({ ...fields, orImage: orImageFile.value })
//   store.dialogs.orDetails = false
// }

const isValid = computed(() => {
  // Validate all OR details since they're all editable now
  const allDetails = store.currentLiquidation.orDetails || []

  // If no details exist, return false
  if (allDetails.length === 0) return false

  // Validate all details
  return allDetails.every((or) =>
    or.orNumber && or.orAmount && or.orDate && or.orPhotoUrl
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

const handleDateChange = (date, index) => {
  console.log('Date changed:', date, 'for index:', index)
  store.currentLiquidation.orDetails[index].orDate = date
  calculateTotals()
}



const handleRemarksChange = (newRemarks) => {
  // Ensure remarks are properly updated in the store
  store.currentLiquidation.remarks = newRemarks
  console.log('Remarks updated:', newRemarks)
}

const handlePartialLiquidation = async () => {
  savingPartial.value = true
  try {
    // First, upload all photos that haven't been uploaded yet (for all OR details)
    for (let i = 0; i < store.currentLiquidation.orDetails.length; i++) {
      const orDetail = store.currentLiquidation.orDetails[i]
      // Process all OR details since they're all editable now
      if (orDetail.orImage && !orDetail.serverPhotoPath) {
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
    // First, upload all photos that haven't been uploaded yet (for all OR details)
    for (let i = 0; i < store.currentLiquidation.orDetails.length; i++) {
      const orDetail = store.currentLiquidation.orDetails[i]
      // Process all OR details since they're all editable now
      if (orDetail.orImage && !orDetail.serverPhotoPath) {
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
    savingSubmit.value = false
  }
}

// Formatting utilities for currency inputs
const formatCurrency = (value) => {
  const num = Number(String(value).replace(/[,\s]/g, '')) || 0
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatInputValue = (value) => {
  if (value === '' || value === null || value === undefined) return ''
  const isNumber = typeof value === 'number'
  const cleanValue = String(value).replace(/[₱,\s]/g, '').replace(/,/g, '')
  const num = parseFloat(cleanValue)
  if (isNaN(num)) return ''
  return isNumber ?
    num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
    num.toLocaleString('en-US')
}

const handleAmountInput = (value) => {
  let cleanValue = String(value).replace(/[₱,\s]/g, '')
  cleanValue = cleanValue.replace(/[^\d.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
  }
  return cleanValue
}

const formatToTwoDecimals = (value) => {
  const cleanValue = String(value).replace(/[₱,\s]/g, '')
  if (cleanValue === '') return 0
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    const collapsed = parts[0] + '.' + parts.slice(1).join('')
    return formatToTwoDecimals(collapsed)
  }
  if (parts.length === 2 && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2)
  }
  const num = parseFloat(parts.join('.'))
  if (isNaN(num)) return 0
  return Math.round(num * 100) / 100
}

const blockNonNumeric = (event) => {
  const key = event.key
  const isControl = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(key)
  if (isControl) return
  const isDigit = /\d/.test(key)
  const isDot = key === '.'
  if (isDot && event.target?.value?.includes?.('.')) {
    event.preventDefault()
    return
  }
  if (!isDigit && !isDot) {
    event.preventDefault()
  }
}

const handlePasteNumeric = (event) => {
  const text = (event.clipboardData || window.clipboardData).getData('text')
  let clean = String(text).replace(/[^\d.]/g, '')
  const parts = clean.split('.')
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts.length >= 2) {
    parts[1] = parts[1].slice(0, 2)
    clean = parts[0] + '.' + parts[1]
  }
  const input = event.target
  const start = input.selectionStart
  const end = input.selectionEnd
  const current = input.value
  input.value = current.slice(0, start) + clean + current.slice(end)
  const e = new Event('input', { bubbles: true })
  input.dispatchEvent(e)
}
</script>

<style scoped>
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
}
</style>
