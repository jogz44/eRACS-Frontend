<template>
  <q-card>
    <q-table
      :rows="store.augmentation"
      :columns="store.augmentationColumns"
      row-key="id"
      :pagination="store.pagination"
    >
      <template v-slot:body-cell-action="props">
        <q-td :props="props">
          <div class="button-group">
            <q-btn class="edit-btn" icon="edit" @click="store.editDisbursement(props.row)" />
            <q-btn
              outlined
              class="view-btn"
              icon="visibility"
              @click="store.openLiquidationTable(props.row)"
            />
          </div>
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
import { useAugmentationStore } from '../../stores/augmentation'
const store = useAugmentationStore()
</script>
