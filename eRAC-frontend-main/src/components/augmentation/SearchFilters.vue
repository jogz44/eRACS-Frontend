<template>
  <div class="q-mb-md">
    <div class="row items-center q-gutter-sm" style="width: 100%; margin-bottom: 16px;">
      <q-input
        bg-color="white"
        outlined
        dense
        placeholder="Search..."
        v-model="store.searchQuery"
        class="custom-search-input"
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-space />
      <q-input
        bg-color="white"
        outlined
        dense
        label="From"
        v-model="store.dateFrom"
        mask="##/##/####"
        class="custom-date-from"
      >
        <template v-slot:append>
          <q-icon name="event" class="calend-icon">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="store.dateFrom" mask="DD/MM/YYYY" />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
      <q-input
        bg-color="white"
        outlined
        dense
        label="To"
        v-model="store.dateTo"
        mask="##/##/####"
        class="custom-date-to"
      >
        <template v-slot:append>
          <q-icon name="event" class="calend-icon">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="store.dateTo" mask="DD/MM/YYYY" />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
      <q-btn
        label="Add"
        icon="add"
        class="add-table-btn"
        @click="store.openDialog('augmentation')"
        color="primary"
        style="min-width: 180px;"
      />
    </div>
  </div>
</template>

<script setup>
import { useAugmentationStore } from 'stores/augmentation'
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
@media (max-width: 900px) {
  .row.q-gutter-sm {
    flex-wrap: wrap;
  }
  .row.q-gutter-sm > *:not(.q-space) {
    flex: 1 1 100%;
    max-width: 100%;
    margin-bottom: 8px;
  }
  .q-space {
    display: none !important;
  }
}
@media (min-width: 768px) and (max-width: 1024px) {
  .row.q-gutter-sm {
    flex-wrap: wrap;
  }
  .row.q-gutter-sm > .q-input:not(:first-child) {
    flex: 1 1 0;
    min-width: 0;
    max-width: calc(50% - 8px);
  }
  .row.q-gutter-sm > .q-btn {
    flex: 1 1 100%;
    max-width: 100%;
    margin-top: 8px;
  }
  .q-space {
    display: none !important;
  }
}
@media (min-width: 1025px) {
  .custom-search-input {
    width: 400px !important;
    min-width: 0 !important;
    max-width: 700px !important;
  }
  .custom-date-from,
  .custom-date-to {
    width: 220px !important;
    min-width: 0 !important;
    max-width: 300px !important;
  }
}
</style>
