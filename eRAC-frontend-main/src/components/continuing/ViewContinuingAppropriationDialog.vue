<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 900px">
      <q-card-section class="q-pb-none">
        <div class="text-h6">View Continuing Appropriation</div>
      </q-card-section>

      <q-card-section>
        <!-- Summary section -->
        <div class="row q-mb-sm q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <div class="text-caption">Total Budget:</div>
            <strong>{{ formatCurrency(row.appropriation) }}</strong>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption">Unappropriated Amount:</div>
            <strong>{{ formatCurrency(row.unappropriated) }}</strong>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption">Status:</div>
            <strong>{{ row.status }}</strong>
          </div>
        </div>

        <!-- Hierarchical Table -->
        <div class="hierarchical-table" style="border: 1px solid #e0e0e0">
          <div class="row q-pa-sm bg-grey-2 text-weight-medium">
            <div class="col-6">Type</div>
            <div class="col-6 text-right">Amount (₱)</div>
          </div>

          <div class="hierarchical-body" style="max-height: 400px; overflow-y: auto">
            <template v-for="expenseClass in displayAccounts" :key="'class-' + expenseClass.id">
              <div class="row q-pa-sm bg-grey-1 text-weight-medium">
                <div class="col-12">{{ expenseClass.name }}</div>
              </div>

              <template v-for="expenseType in expenseClass.children" :key="'type-' + expenseType.id">
                <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                  <div class="col-6" style="padding-left: 16px; display: flex; align-items: center">
                    <q-btn
                      dense
                      flat
                      :icon="(expenseType.children && expenseType.children.length > 0 && expandedTypes[expenseType.id]) ? 'expand_more' : 'chevron_right'"
                      @click="(expenseType.children && expenseType.children.length > 0) ? toggleType(expenseType.id) : null"
                      size="sm"
                    />
                    <span>{{ expenseType.name }}</span>
                  </div>
                  <div class="col-6 text-right">
                    <div v-if="!canEditType(expenseType)" class="text-weight-medium">
                      {{ formatCurrency(calculateTypeTotal(expenseType)) }}
                    </div>
                    <div v-else class="text-weight-medium">
                      {{ formatCurrency(expenseType.amount) }}
                    </div>
                  </div>
                </div>

                <template v-if="expandedTypes[expenseType.id] && expenseType.children && expenseType.children.length > 0">
                  <template v-for="expenseItem in expenseType.children" :key="'item-' + expenseItem.id">
                    <div class="row q-pa-xs" style="border-bottom: 1px solid #f0f0f0">
                      <div class="col-6" style="padding-left: 32px; display: flex; align-items: center">
                        <q-icon name="arrow_right" size="xs" class="q-mr-xs" />
                        <span>{{ expenseItem.name }}</span>
                      </div>
                      <div class="col-6 text-right">
                        <div class="text-weight-medium">
                          {{ formatCurrency(expenseItem.amount) }}
                        </div>
                      </div>
                    </div>
                  </template>
                </template>
              </template>
            </template>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDialogPluginComponent } from 'quasar'

const props = defineProps({
  row: {
    type: Object,
    required: true
  },
  displayAccounts: {
    type: Array,
    required: true
  },
  formatCurrency: {
    type: Function,
    required: true
  }
})

const { dialogRef, onDialogHide } = useDialogPluginComponent()
const expandedTypes = ref({})

onMounted(() => {
  // Expand all types by default
  props.displayAccounts.forEach(expenseClass => {
    expenseClass.children.forEach(expenseType => {
      if (expenseType.children && expenseType.children.length > 0) {
        expandedTypes.value[expenseType.id] = true
      }
    })
  })
})

const toggleType = (typeId) => {
  let hasChildren = false
  props.displayAccounts.forEach(expenseClass => {
    const expenseType = expenseClass.children?.find(type => type.id === typeId)
    if (expenseType && expenseType.children && expenseType.children.length > 0) {
      hasChildren = true
    }
  })

  if (hasChildren) {
    expandedTypes.value[typeId] = !expandedTypes.value[typeId]
  }
}

const canEditType = (expenseType) => {
  return !expenseType.children || expenseType.children.length === 0
}

const calculateTypeTotal = (type) => {
  if (!type || !type.children) return 0
  return type.children.reduce((sum, item) => sum + (item.amount || 0), 0)
}
</script>

<style scoped>
.hierarchical-table {
  border-radius: 4px;
  overflow: hidden;
}

.hierarchical-body {
  background: white;
}
</style>
