<template>
  <div class="q-mb-md">
    <div class="justify-end q-mb-md"></div>
    <div class="row items-center justify-between q-gutter-sm">
      <!-- Search Input -->
      <q-input
        outlined
        dense
        placeholder="Search..."
        v-model="store.searchQuery"
        class="col-md-3 col-sm-5 custom-search-input"
        style="min-width: 450px"
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

      <div class="t q-px-xs"></div>

      <div class="t q-px-xs"></div>

      <!-- Add Button Disbursement -->
      <q-btn
        label="Add"
        icon="add"
        class="add-table-btn"
        @click="store.openDialog('augmentation')"
      />
    </div>
  </div>
</template>

<script setup>
import { useAugmentationStore } from '../../stores/augmentation'
const store = useAugmentationStore()
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
  border-radius: 12px;
}
</style>
