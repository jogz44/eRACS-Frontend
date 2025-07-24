<template>
  <!-- Search and Date Filter -->
  <div class="q-mb-md">
    <div class="justify-end q-mb-md"></div>
    <div class="row items-center justify-between q-gutter-sm">
      <!-- Search Input -->
      <q-input
         bg-color="white"
        outlined
        dense
        placeholder="Search..."
        v-model="store.searchQuery"
        class="responsive-search-input"
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>

      <div class="t q-px-xl"></div>

      <!-- Date Range Group -->
      <div class="row items-center justify-between">
        <!-- From Date -->
        <q-input
         bg-color="white"
          outlined
          label="From"
          dense
          v-model="store.dateFrom"
          mask="##/##/####"
          class="custom-date-from"
          style="width: 200px"
        >
          <template v-slot:append>
            <q-icon name="event" class="calend-icon">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="store.dateFrom" mask="DD/MM/YYYY" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <!-- To Label -->
        <div class="t q-px-xs"></div>
        <div class="t q-px-xs"></div>

        <!-- To Date -->
        <q-input
         bg-color="white"
          outlined
          label="To"
          dense
          v-model="store.dateTo"
          mask="##/##/####"
          class="custom-date-to"
          style="width: 200px"
        >
          <template v-slot:append>
            <q-icon name="event" class="calend-icon">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="store.dateTo" mask="DD/MM/YYYY" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>

      <div class="row q-mt-sm q-mb-sm">
        <div class="col-auto">
          <q-btn
            icon="add"
            label="Add"
            class="add-table-btn"
            @click="$emit('add')"
            color="primary"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDisbursementStore } from 'stores/disbursementStore'
const store = useDisbursementStore()
</script>
<style scoped>
.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}

.custom-actions {
  margin-right: 10px;
  margin-top: 10px;
  margin-bottom: 25px;
}
.custom-actions .q-btn:not(:last-child) {
  margin-right: 5px; /* Adjust this value as needed */
}

/* Using the deep selector (Vue 3 syntax) */
.q-mb-md :deep(.q-input .q-field__control) {
  border-radius: 10px;
}
.responsive-search-input {
  width: 100%;
  min-width: 0;
  max-width: 400px;
  box-sizing: border-box;
}
@media (max-width: 900px) {
  .responsive-search-input {
    max-width: 100%;
  }
}
</style>
