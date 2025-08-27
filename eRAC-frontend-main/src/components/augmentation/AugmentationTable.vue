<template>
  <q-card>
    <q-table
      :rows="store.augmentation"
      :columns="store.augmentationColumns"
      row-key="id"
      :pagination="store.pagination"
      :loading="store.loadingAugmentations"
    >

    </q-table>
  </q-card>
</template>

<script setup>
import { useAugmentationStore } from 'stores/augmentation'

const store = useAugmentationStore()


</script>
