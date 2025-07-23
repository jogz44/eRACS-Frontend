<template>
  <q-page class="q-pa-lg">
    <!-- Summary Cards -->
    <div class="row q-col-gutter-lg q-mb-md">
      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="summary-card cursor-pointer" @click="onCardClick('budget')" v-ripple>
          <div class="card-top-strip"></div>
          <q-card-section>
            <q-icon name="account_balance" class="summary-icon" />
            <div class="summary-text">Total Budget</div>
            <div class="summary-value">₱{{ selectedData.budget }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="summary-card cursor-pointer" @click="onCardClick('expenses')" v-ripple>
          <div class="card-top-strip"></div>
          <q-card-section>
            <q-icon name="payment" class="summary-icon" />
            <div class="summary-text">Total Expenses</div>
            <div class="summary-value">₱{{ selectedData.expenses }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="summary-card cursor-pointer" @click="onCardClick('balance')" v-ripple>
          <div class="card-top-strip"></div>
          <q-card-section>
            <q-icon name="balance" class="summary-icon" />
            <div class="summary-text">Total Balance</div>
            <div class="summary-value">₱{{ selectedData.balance }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Barangay Summary Table -->
    <q-card>
      <q-card-section>
        <div class="text-h6 q-mb-sm">Barangay Summary</div>
        <q-table
          virtual-scroll
          flat
          bordered
          wrap-cells
          :rows="barangaySummary"
          :columns="summaryColumns"
          row-key="barangay"
          :pagination="{ rowsPerPage: 0 }"
          class="my-sticky-header-table"
          @row-click="onBarangayClick"
          :loading="isLoading"
          :table-header-style="{ position: 'sticky', top: '0', zIndex: 3, background: 'white' }"
        >
          <template v-slot:body-cell-budget="props">
            <q-td :props="props">
              ₱{{ props.row.budget }}
            </q-td>
          </template>
          <template v-slot:body-cell-appropriation="props">
            <q-td :props="props">
              ₱{{ props.row.appropriation }}
            </q-td>
          </template>
          <template v-slot:body-cell-balance="props">
            <q-td :props="props">
              ₱{{ props.row.balance }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { api } from 'boot/axios'
import { ref, onMounted, computed, onUnmounted } from 'vue'

export default {
  setup() {
    const barangaySummary = ref([])
    const isLoading = ref(true)
    const totalBudget = ref(0)
    const totalExpenses = ref(0)
    const totalBalance = ref(0)
    const refreshInterval = ref(null)

    const selectedData = computed(() => ({
      budget: totalBudget.value.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      expenses: totalExpenses.value.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      balance: totalBalance.value.toLocaleString(undefined, { minimumFractionDigits: 2 })
    }))

    const summaryColumns = [
      { name: 'barangay', label: 'Barangay', align: 'left', field: 'barangay' },
      { name: 'budget', label: 'Total Budget', align: 'right', field: 'budget' },
      { name: 'appropriation', label: 'Total Expenses', align: 'right', field: 'appropriation' },
      { name: 'balance', label: 'Total Balance', align: 'right', field: 'balance' }
    ]

    const fetchDashboardData = async () => {
      try {
        isLoading.value = true
        
        // Fetch barangay-wise data
        const response = await api.get('/api/admin/per-barangay-budgets')
        
        // Calculate totals
        let budgetSum = 0
        let balanceSum = 0
        
        barangaySummary.value = response.data.map((b) => {
          const budget = parseFloat(b.total_original_amount || '0')
          const balance = parseFloat(b.total_current_amount || '0')
          const expenses = budget - balance
          
          // Add to sums
          budgetSum += budget
          balanceSum += balance

          return {
            barangay: b.barangay_name || 'Unknown',
            budget: budget.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            appropriation: expenses.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            balance: balance.toLocaleString(undefined, { minimumFractionDigits: 2 })
          }
        })

        // Update the totals
        totalBudget.value = budgetSum
        totalBalance.value = balanceSum
        totalExpenses.value = budgetSum - balanceSum

      } catch (error) {
        console.error('API error:', error)
        this.$q.notify({
          type: 'negative',
          message: `Failed to load dashboard data: ${error.message}`,
          position: 'top',
        })
      } finally {
        isLoading.value = false
      }
    }

    // Start auto-refresh
    const startAutoRefresh = () => {
      fetchDashboardData() // Initial fetch
      refreshInterval.value = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    }

    // Clean up on component unmount
    onUnmounted(() => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
      }
    })

    onMounted(() => {
      startAutoRefresh()
    })

    const onCardClick = (type) => {
      this.$q.notify({
        message: `You clicked on ${type.toUpperCase()}`,
        color: 'green-4',
        textColor: 'white',
        icon: 'info',
        position: 'top-right',
      })
    }

    const onBarangayClick = (row) => {
      this.$q.notify({
        message: `You clicked on Barangay: ${row.barangay}`,
        color: 'primary',
        textColor: 'white',
        icon: 'location_on',
        position: 'top-right',
      })
    }

    return {
      barangaySummary,
      summaryColumns,
      selectedData,
      isLoading,
      onCardClick,
      onBarangayClick
    }
  }
}
</script>

<style scoped>
.summary-card {
  min-height: 120px !important;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(88, 178, 101, 0.321);
}

.card-top-strip {
  height: 10px;
  width: 100%;
  background-color: #2e7d32;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.summary-icon {
  font-size: 30px;
  color: green;
}

.summary-text {
  font-size: 16px;
  font-weight: bold;
  margin-top: 10px;
}

.summary-value {
  font-size: 18px;
  color: #333;
  margin-top: 5px;
}

.my-sticky-header-table {
  max-height: 390px;
  overflow-y: auto;
}

.my-sticky-header-table thead tr {
  position: sticky;
  top: 0;
  background: white;
  z-index: 2;
}

.my-sticky-header-table thead th {
  position: sticky;
  top: 0;
  background: white;
  z-index: 3;
}

@media (max-width: 599px) {
  .summary-card {
    min-height: 100px !important;
  }

  .summary-text {
    font-size: 14px;
  }

  .summary-value {
    font-size: 16px;
  }

  .summary-icon {
    font-size: 24px;
  }
}

@media (min-width: 600px) and (max-width: 1023px) {
  .summary-card {
    min-height: 110px !important;
  }
}
</style>
