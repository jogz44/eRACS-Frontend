<template>
  <!-- Expense Selection Dialog -->
  <q-dialog v-model="store.dialogs.augExpense">
    <q-card style="min-width: 800px">
      <q-card-section>
        <div class="text-h6">Select Expense Account</div>
      </q-card-section>

      <q-card-section>
        <q-input
          outlined
          dense
          placeholder="Search expense account..."
          v-model="store.expenseSearch"
          class="q-mb-md"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- Expense Account Selection Table -->
        <q-table
          :rows="store.AugexpenseAccounts"
          :columns="store.AugexpenseAccountColumns"
          row-key="id"
          :filter="store.expenseSearch"
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <q-btn
                flat
                label="Select"
                color="primary"
                @click="store.openExpenseDetail(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="negative" @click="store.closeDialog('augExpense')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useAugmentationStore } from '../../stores/augmentation'
const store = useAugmentationStore()
</script>

<style scoped></style>
