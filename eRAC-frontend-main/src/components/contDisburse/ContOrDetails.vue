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

const orDetailsCount = computed(() => {
  return store.currentLiquidation?.orDetails?.length || 0
})

// Formatting utilities
const formatCurrency = (value) => {
  const num = Number(String(value).replace(/[,\s]/g, '')) || 0
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
  console.log('File selected for index:', index, 'File:', file)
  console.log('File type:', typeof file)
  console.log('File instanceof File:', file instanceof File)
  console.log('File name:', file?.name)
  console.log('File size:', file?.size)
  
  if (file) {
    // Store the file for later upload
    store.currentLiquidation.orDetails[index].orImage = file
    console.log('File stored in orDetails:', store.currentLiquidation.orDetails[index].orImage)

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

const isValid = computed(() => {
  // Validate all OR details
  const allDetails = store.currentLiquidation.orDetails || []

  // If no details exist, return false
  if (allDetails.length === 0) return false

  // Validate all details (photos are required)
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

// Actual return amount for validation (can be negative)
const actualReturnAmount = computed(() => {
  if (!store.currentLiquidation?.dvAmount) return 0
  return store.currentLiquidation.dvAmount - parseFloat(totalActualExpense.value)
})

const handlePartialLiquidation = async () => {
  savingPartial.value = true
  try {
    // First, upload all photos that haven't been uploaded yet
    for (let i = 0; i < store.currentLiquidation.orDetails.length; i++) {
      const orDetail = store.currentLiquidation.orDetails[i]
      if (orDetail.orImage && !orDetail.serverPhotoPath) {
        try {
          console.log('Uploading photo for OR detail:', i, 'File:', orDetail.orImage)
          console.log('File type:', typeof orDetail.orImage)
          console.log('File instanceof File:', orDetail.orImage instanceof File)
          console.log('File name:', orDetail.orImage?.name)
          console.log('File size:', orDetail.orImage?.size)
          
          // Check if the file is valid
          if (!orDetail.orImage || !(orDetail.orImage instanceof File)) {
            throw new Error('Invalid file object')
          }
          
          const uploadResult = await store.uploadOrPhoto(orDetail.orImage)
          console.log('Upload result:', uploadResult)
          
          if (uploadResult.success) {
            store.currentLiquidation.orDetails[i].serverPhotoPath = uploadResult.path
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
    // First, upload all photos that haven't been uploaded yet
    for (let i = 0; i < store.currentLiquidation.orDetails.length; i++) {
      const orDetail = store.currentLiquidation.orDetails[i]
      if (orDetail.orImage && !orDetail.serverPhotoPath) {
        try {
          console.log('Uploading photo for OR detail:', i, 'File:', orDetail.orImage)
          console.log('File type:', typeof orDetail.orImage)
          console.log('File instanceof File:', orDetail.orImage instanceof File)
          console.log('File name:', orDetail.orImage?.name)
          console.log('File size:', orDetail.orImage?.size)
          
          // Check if the file is valid
          if (!orDetail.orImage || !(orDetail.orImage instanceof File)) {
            throw new Error('Invalid file object')
          }
          
          const uploadResult = await store.uploadOrPhoto(orDetail.orImage)
          console.log('Upload result:', uploadResult)
          
          if (uploadResult.success) {
            store.currentLiquidation.orDetails[i].serverPhotoPath = uploadResult.path
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
