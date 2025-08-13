<template>
  <!-- Search and Date Filter -->
  <div class="q-mb-md">
    <div class="row items-center q-gutter-sm" style="width: 100%; margin-bottom: 16px;">
      <q-input
        bg-color="white"
        outlined
        dense
        placeholder="Search Description..."
        v-model="store.searchQuery"
        class="custom-search-input"
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-input
        bg-color="white"
        outlined
        dense
        :model-value="dateRangeDisplay"
        label="Date Range"
        class="custom-date-range"
        clearable
        @clear="onDateRangeClear"
        readonly
      >
        <template v-slot:append>
          <q-icon name="event" class="calend-icon">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date
                v-model="dateRange"
                range
                @update:model-value="onDateRangeChange"
              />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
        <q-btn
        dense
        outlined
        color="red-10"
        icon="clear_all"
        label="Clear All"
        @click="clearAllFilters"
        class="clear-all-btn"
      />
      <q-space />

      <q-btn
        label="Add"
        icon="add"
        class="add-table-btn"
        @click="$emit('add')"
        color="primary"
        style="min-width: 150px; border-radius: 3px; font-size: small !important;"
        v-permission="'add'"
      />

      <!-- Clear All Filters Button -->

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDisbursementStore } from 'stores/disbursementStore'

const store = useDisbursementStore()
const dateRange = ref(null)

const dateRangeDisplay = computed(() => {
  if (!dateRange.value || !dateRange.value.from || !dateRange.value.to) {
    return ''
  }
  const fromDate = new Date(dateRange.value.from).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
  const toDate = new Date(dateRange.value.to).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
  return `${fromDate} - ${toDate}`
})

const onDateRangeChange = (newRange) => {
  if (newRange && newRange.from && newRange.to) {
    // Convert date format from YYYY/MM/DD to DD/MM/YYYY
    const fromDate = new Date(newRange.from)
    const toDate = new Date(newRange.to)

    store.dateFrom = fromDate.toLocaleDateString('en-GB') // DD/MM/YYYY format
    store.dateTo = toDate.toLocaleDateString('en-GB') // DD/MM/YYYY format
  } else {
    store.dateFrom = ''
    store.dateTo = ''
  }
}

const onDateRangeClear = () => {
  dateRange.value = null
  store.dateFrom = ''
  store.dateTo = ''
}

const clearAllFilters = () => {
  store.searchQuery = ''
  store.dateFrom = ''
  store.dateTo = ''
  dateRange.value = null
}
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
  border-radius: 3px;
}

.clear-all-btn {
  min-width: 120px;
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
    max-width: 1200px !important;
  }
  .custom-date-range {
    width: 250px !important;
    min-width: 0 !important;
    max-width: 350px !important;
  }
}
</style>
