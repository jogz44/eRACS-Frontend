<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
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
              option-value="value"
              :rules="[(val) => !!val || 'Barangay is required']"
            />

        <q-input v-model="preparedByName" label="Prepared by:" filled />
        <q-input v-model="preparedByPosition" label="Position: " filled bg-color="light-green-1" class="input"/>
        <q-input v-model="notedByName" label="Noted by:" filled />
        <q-input v-model="notedByPosition" label="Position: " filled bg-color="light-green-1"/>
        <q-input v-model="certifiedByName" label="Certified by:" filled />
        <q-input v-model="certifiedByPosition" label="Input position" filled />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Save" class="modal-save-btn" v-close-popup @click="saveSettings" />
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
const preparedByPosition = ref('Barangay Treasurer')
const notedByName = ref('')
const notedByPosition = ref('Punong Barangay')
const certifiedByName = ref('')
const certifiedByPosition = ref('')
const barangayOptions = ref([])
const $q = useQuasar()

const saveSettings = () => {
  // Add your save logic here
  emit('update:modelValue', false) // Close dialog after save
}

onMounted(async () => {
  try {
    const response = await api.get('/api/barangay/barangays')
    barangayOptions.value = response.data.map((b) => ({
      name: b.name,
      value: b.name, // Still showing name to user but will convert to ID later
    }))
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Failed to load barangays list: ${error.message}`,
      position: 'top',
    })
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
