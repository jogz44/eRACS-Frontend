<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" @keydown.enter="handleEnterKey">
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="text-h6">Set-up</div>
          <q-btn
            flat
            round
            dense
            icon="close"
            v-close-popup
            @click="$emit('update:modelValue', false)"
          />
        </div>
      </q-card-section>
      <q-card-section></q-card-section>

      <q-card-section class="q-pt-none">
      <q-select
              outlined
              dense
              bg-color="light-green-1"
              v-model="barangay"
              :options="barangayOptions"
              label="Select Barangay"
              color="green"
              class="q-mb-sm"
              emit-value
              map-options
              option-label="name"
              option-value="posvalue"
              @keydown.enter="handleEnterKey"
              :rules="[(val) => !!val || 'Barangay is required']"
            />

        <q-input v-model="preparedByName" label="Prepared by:" filled @keydown.enter="handleEnterKey" />

        <q-select
              outlined
              dense
              bg-color="light-green-1"
              v-model="preparedposition"
              :options="preparedByPosition"
              label="Select Position"
              color="green"
              class="q-mb-sm"
              emit-value
              map-options
              option-label="name"
              option-value="value"
              @keydown.enter="handleEnterKey"
              :rules="[(val) => !!val || 'Position is required']"
            />

        <q-input v-model="notedByName" label="Noted by:" filled @keydown.enter="handleEnterKey" />
          <q-select
              outlined
              dense
              bg-color="light-green-1"
              v-model="notedposition"
              :options="notedByPosition"
              label="Select Position"
              color="green"
              class="q-mb-sm"
              emit-value
              map-options
              option-label="name"
              option-value="value"
              @keydown.enter="handleEnterKey"
              :rules="[(val) => !!val || 'Position is required']"
            />
        <q-input v-model="certifiedByName" label="Certified by:" filled @keydown.enter="handleEnterKey" />
        <q-select
              outlined
              dense
              bg-color="light-green-1"
              v-model="certifiedposition"
              :options="certifiedByPosition"
              label="Select Position"
              color="green"
              class="q-mb-sm"
              emit-value
              map-options
              option-label="name"
              option-value="value"
              @keydown.enter="handleEnterKey"
              :rules="[(val) => !!val || 'Position is required']"
            />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Save" class="modal-save-btn" v-close-popup @click="handleSaveClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>

import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

// Form data
const barangay = ref('')
const preparedByName = ref('')
const preparedposition = ref('')
const notedposition = ref('')
const certifiedposition = ref('')
const notedByName = ref('')
const notedByPosition = ref([])
const certifiedByName = ref('')
const certifiedByPosition = ref([])
const preparedByPosition = ref([])
const barangayOptions = ref([])
const $q = useQuasar()

// Validation function
const validateSettings = () => {
  if (!barangay.value) {
    $q.notify({
      type: 'negative',
      message: 'Barangay is required',
      position: 'top',
    })
    return false
  }
  if (!preparedByName.value) {
    $q.notify({
      type: 'negative',
      message: 'Prepared by name is required',
      position: 'top',
    })
    return false
  }
  if (!preparedposition.value) {
    $q.notify({
      type: 'negative',
      message: 'Prepared by position is required',
      position: 'top',
    })
    return false
  }
  if (!notedByName.value) {
    $q.notify({
      type: 'negative',
      message: 'Noted by name is required',
      position: 'top',
    })
    return false
  }
  if (!notedposition.value) {
    $q.notify({
      type: 'negative',
      message: 'Noted by position is required',
      position: 'top',
    })
    return false
  }
  if (!certifiedByName.value) {
    $q.notify({
      type: 'negative',
      message: 'Certified by name is required',
      position: 'top',
    })
    return false
  }
  if (!certifiedposition.value) {
    $q.notify({
      type: 'negative',
      message: 'Certified by position is required',
      position: 'top',
    })
    return false
  }
  return true
}

const handleEnterKey = () => {
  if (validateSettings()) {
    saveSettings()
  }
}

const handleSaveClick = () => {
  if (validateSettings()) {
    saveSettings()
  }
}

const saveSettings = () => {
  // Add your save logic here
  emit('update:modelValue', false) // Close dialog after save
}

onMounted(async () => {
  try {
    // Load barangay options
    const response = await api.get('/api/barangay/barangays')
    if (response.data && Array.isArray(response.data)) {
      barangayOptions.value = response.data.map((b) => ({
        name: b.name,
        value: b.name,
      }))
    }

    // Load position options
    const positionResponse = await api.get('/api/barangay/positions')
    if (positionResponse.data && Array.isArray(positionResponse.data)) {
      preparedByPosition.value = positionResponse.data.map((b) => ({
        name: b.name,
        value: b.name,
      }))
      notedByPosition.value = positionResponse.data.map((b) => ({
        name: b.name,
        value: b.name,
      }))
      certifiedByPosition.value = positionResponse.data.map((b) => ({
        name: b.name,
        value: b.name,
      }))
    }

  } catch (error) {
    console.error('Error loading setup data:', error)
    // Don't show notification if it might break the page
    // Just log the error for debugging
  }
})

</script>

<style scoped>
.q-input[disabled] {
  background-color: transparent !important;
  color: #000 !important; /* or whatever text color you want */
  opacity: 1 !important;
}
.village{
  width: 300px;

}
</style>
