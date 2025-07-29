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
                          mask="DD/MM/YYYY"
                          @update:model-value="(val) => handleDateChange(val, index)"
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
        <q-btn 
          label="Submit" 
          color="green" 
          @click="handleSaveOrDetails" 
          :disable="!isValid"
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
import axios from 'axios'

const $q = useQuasar()
const saving = ref(false)

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
    store.currentLiquidation.orDetails = res.data.data.map(or => {
      // Convert YYYY-MM-DD to DD/MM/YYYY format
      let formattedDate = ''
      if (or.or_date) {
        const dateParts = or.or_date.split('-')
        if (dateParts.length === 3) {
          formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
        }
      }
      
      return {
        orDate: formattedDate,
        orNumber: or.or_number,
        orAmount: or.or_amount,
        orImage: null, // Image upload handled separately
        orPhotoUrl: or.or_photo ? `/storage/${or.or_photo}` : null,
        remarks: or.remarks || '',
      }
    })
  } catch {
    // fallback: initialize empty
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    const todayFormatted = `${dd}/${mm}/${yyyy}`
    
    store.currentLiquidation.orDetails = [
      { orNumber: '', orAmount: '', orDate: todayFormatted, orImage: null, orPhotoUrl: null, serverPhotoPath: null, remarks: '' },
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

function removeOrImage(index) {
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
  return (
    store.currentLiquidation.orDetails?.every((or) => 
      or.orNumber && or.orAmount && or.orDate && or.orPhotoUrl
    ) ??
    false
  )
})

const handleDateChange = (date, index) => {
  console.log('Date changed:', date, 'for index:', index)
  store.currentLiquidation.orDetails[index].orDate = date
  calculateTotals()
}

const handleSaveOrDetails = async () => {
  saving.value = true
  try {
    // First, upload all photos that haven't been uploaded yet
    for (let i = 0; i < store.currentLiquidation.orDetails.length; i++) {
      const orDetail = store.currentLiquidation.orDetails[i]
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
    saving.value = false
  }
}
</script>
