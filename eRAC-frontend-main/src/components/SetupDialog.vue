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
        <q-input v-model="village" readonly filled />
        <q-input v-model="preparedByName" label="Prepared by:" filled />
        <q-input v-model="preparedByPosition" readonly filled />
        <q-input v-model="notedByName" label="Noted by:" filled />
        <q-input v-model="notedByPosition" readonly filled />
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
import { ref } from 'vue'

defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

// Form data
const village = ref('Barangay Visayab Village')
const preparedByName = ref('')
const preparedByPosition = ref('Barangay Treasurer')
const notedByName = ref('')
const notedByPosition = ref('Punong Barangay')
const certifiedByName = ref('')
const certifiedByPosition = ref('')

const saveSettings = () => {
  // Add your save logic here
  emit('update:modelValue', false) // Close dialog after save
}
</script>
