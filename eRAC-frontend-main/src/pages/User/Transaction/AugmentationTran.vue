<template>
  <q-page class="q-pa-lg augmentation-page">
    <div class="page-header q-mb-lg">
      <div class="text-h5 text-weight-bold">Augmentation Transaction</div>
    </div>
    <div class="q-mb-md">
      <SearchFilters />
      <AugmentationTable />
      <AugmentationDialog />
      <AugExpenseSelecDial />
      <AugExpenseDetailDial />
    </div>
  </q-page>
</template>

<script setup>
import AugmentationTable from '../../components/augmentation/AugmentationTable.vue'
import SearchFilters from '../../components/augmentation/SearchFilters.vue'
import AugmentationDialog from '../../components/augmentation/AugmentationDialog.vue'
import AugExpenseSelecDial from '../../components/augmentation/AugExpenseSelecDial.vue'
import AugExpenseDetailDial from '../../components/augmentation/AugExpenseDetailDial.vue'
</script>

<style scoped>
.augmentation-page{
  background-color: #D9D9D9; /* Light gray background */
  min-height: 100vh; /* Ensure full height */
}
</style>
