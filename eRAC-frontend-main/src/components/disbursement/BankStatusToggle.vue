<template>
  <div class="row items-center bank-status-toggle-wrap">
    <span v-if="label" class="text-caption text-grey-6 q-mr-xs">{{ label }}</span>
    <button
      type="button"
      role="switch"
      :aria-checked="isOnline"
      aria-label="Bank status toggle: Online or Offline"
      class="status-toggle"
      @click="toggle"
    >
      <span v-if="modelValue" class="knob" :class="{ 'knob--offline': isOffline }" />
      <span class="label" :class="{ 'label--active': isOnline }">Online</span>
      <span class="label" :class="{ 'label--active': isOffline }">Offline</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const isOnline = computed(() => props.modelValue === 'online')
const isOffline = computed(() => props.modelValue === 'offline')

const toggle = () => {
  emit('update:modelValue', isOnline.value ? 'offline' : 'online')
}
</script>

<style scoped>
.bank-status-toggle-wrap {
  display: inline-flex;
}
.status-toggle {
  position: relative;
  display: flex;
  align-items: center;
  width: 140px;
  height: 33px;
  border-radius: 22px;
  border: 1px solid #d0d0d0;
  background: #f5f5f5;
  cursor: pointer;
  padding: 3px;
  box-sizing: border-box;
  outline: none;
}
.status-toggle:focus-visible {
  box-shadow: 0 0 0 2px rgba(24, 124, 25, 0.35);
}
.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  border-radius: 19px;
  background: #187c19;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
  z-index: 0;
}
.knob--offline {
  transform: translateX(100%);
  background: #c62828;
}
.label {
  position: relative;
  flex: 1;
  z-index: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #757575;
  transition: color 0.2s ease;
  pointer-events: none;
}
.label--active {
  color: #ffffff;
}
</style>
