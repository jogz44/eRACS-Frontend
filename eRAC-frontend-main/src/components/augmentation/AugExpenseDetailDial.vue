<template>
  <q-dialog v-model="store.dialogs.AugexpenseDetail">
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Add Expense</div>
      </q-card-section>

      <q-card-section>
        <!-- Display selected account info -->
        <div class="text-subtitle1 q-mb-sm">
          <strong>Account:</strong> {{ store.forms.augExpense.account }}
        </div>
        <div class="text-subtitle1 q-mb-md">
          <strong>Balance:</strong> ₱{{ store.forms.augExpense.balance.toLocaleString() }}
        </div>

        <!-- Particulars Field -->
        <q-input
          outlined
          dense
          v-model="store.forms.augExpense.particulars"
          label="Particulars"
          class="q-mb-md"
          type="textarea"
          autogrow
        />

        <!-- Amount Field -->
        <q-input
          outlined
          dense
          v-model="store.forms.augExpense.amount"
          label="Amount"
          class="q-mb-md"
          prefix="₱"
          type="number"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancel"
          color="negative"
          @click="store.closeDialog('AugexpenseDetail')"
        />
        <q-btn label="Save" color="primary" @click="store.saveExpense" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useAugmentationStore } from '../../stores/augmentation'
const store = useAugmentationStore()
</script>
