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
                @update:model-value="handleRemarksChange"
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
</template>

<script setup>
import { computed, watch, ref, nextTick } from 'vue'
import { useDisbursementStore } from 'stores/disbursementStore'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const savingPartial = ref(false)
const savingSubmit = ref(false)

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

  // Show Quasar confirmation dialog
  $q.dialog({
    title: 'Confirm Liquidation',
    message: 'Are you sure you want to submit this liquidation? This action cannot be undone.',
    ok: {
      label: 'Confirm',
      color: 'green',
      flat: false
    },
    cancel: {
      label: 'Cancel',
      color: 'grey',
      flat: true
    },
    persistent: true
  }).onOk(() => {
    console.log('User confirmed liquidation, proceeding...')
    handleSaveOrDetails()
  }).onCancel(() => {
    console.log('User cancelled liquidation')
  })
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
</script>
