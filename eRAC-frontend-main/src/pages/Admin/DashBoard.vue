  <template>
    <q-page class="q-pa-lg">
      <!-- Summary Cards -->
      <div class="row summary-row q-mb-md dashboard-cards-scroll">
        <q-card class="col-4 summary-card cursor-pointer" @click="onCardClick('budget')" v-ripple>
          <div class="card-top-strip"></div>
          <q-card-section>
            <q-icon name="account_balance" class="summary-icon" />
            <div class="summary-text">Total Budget</div>
            <div class="summary-value">{{ selectedData.budget }}</div>
          </q-card-section>
        </q-card>

        <q-card
          class="col-4 summary-card cursor-pointer"
          @click="onCardClick('expenses')"
          v-ripple
        >
          <div class="card-top-strip"></div>
          <q-card-section>
            <q-icon name="payment" class="summary-icon" />
            <div class="summary-text">Total Expenses</div>
            <div class="summary-value">{{ selectedData.expenses }}</div>
          </q-card-section>
        </q-card>

        <q-card
          class="col-4 summary-card cursor-pointer"
          @click="onCardClick('balance')"
          v-ripple
        >
          <div class="card-top-strip"></div>
          <q-card-section>
            <q-icon name="balance" class="summary-icon" />
            <div class="summary-text">Total Balance</div>
            <div class="summary-value">{{ selectedData.balance }}</div>
          </q-card-section>
        </q-card>
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
            row-key="barangay_name"
            :pagination="{ rowsPerPage: 0 }"
            class="my-sticky-header-table"
            @row-click="onBarangayClick"
            :table-header-style="{ position: 'sticky', top: '0', zIndex: 3, background: 'white' }"
          />
        </q-card-section>
      </q-card>
    </q-page>
  </template>

<script>
import { api } from 'boot/axios'

export default {
  data() {
    return {
      selectedData: {
        expenses: '39,000,000,000.00',
        budget: '39,000,000,000.00',
        balance: '39,000,000,000.00',
      },

      summaryColumns: [
        { name: 'barangay', label: 'Barangay', align: 'left', field: 'barangay' },
        { name: 'budget', label: 'Total Budget', align: 'right', field: 'budget' },
        { name: 'appropriation', label: 'Total Expenses', align: 'right', field: 'appropriation' },
        { name: 'balance', label: 'Total Balance', align: 'right', field: 'balance' },
      ],

      barangaySummary: [] // initially empty, will be filled by API
    }
  },

  mounted() {
    this.fetchBarangaySummary()
  },

  methods: {
    async fetchBarangaySummary() {
      try {
        const response = await api.get('/api/admin/per-barangay-budgets')
        console.log('API response:', response.data)
        this.barangaySummary = response.data.map((b) => {
          // Fallback to 0 if empty string or invalid
          const totalBudget = parseFloat(b.total_original_amount || '0') || 0
          const balance = parseFloat(b.total_current_amount || '0') || 0
          const totalExpenses = totalBudget - balance

          return {
            barangay: b.barangay_name || 'Unknown',
            budget: totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            appropriation: totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            balance: balance.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          }
        })
      } catch (error) {
        console.error('API error:', error)
        this.$q.notify({
          type: 'negative',
          message: `Failed to load barangays list: ${error.message}`,
          position: 'top',
        })
      }
    },

    onCardClick(type) {
      this.$q.notify({
        message: `You clicked on ${type.toUpperCase()}`,
        color: 'green-4',
        textColor: 'white',
        icon: 'info',
        position: 'top-right',
      })
    },

    onBarangayClick(row) {
      this.$q.notify({
        message: `You clicked on Barangay: ${row.barangay}`,
        color: 'primary',
        textColor: 'white',
        icon: 'location_on',
        position: 'top-right',
      })
    },
  }
}
</script>


  <style scoped>
  .summary-card {
    min-height: 120px !important; /* Override any defaults */
    /* align-items: center; */
    justify-content: center;
    width: 375px;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    gap: 110px;
    border-radius: 12px;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
    height: 100%;
    padding: 20px;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(88, 178, 101, 0.321);
    }

    &.card-0 {
      border-top: 4px solid rgba(88, 178, 101, 1);
    }
    &.card-1 {
      border-top: 4px solid rgba(88, 178, 101, 1);
    }
    &.card-2 {
      border-top: 4px solid rgba(88, 178, 101, 1);
    }
  }
  .summary-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);

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
  }
  .summary-value {
    font-size: 18px;
    color: #333;
  }

.my-sticky-header-table {
  max-height: 390px;
  overflow-y: auto;
}
.my-sticky-header-table thead tr {
  position: sticky;
  top: 0;
  background: white; /* Or match your theme */
  z-index: 2;
}
.my-sticky-header-table thead th {
  position: sticky;
  top: 0;
  background: white;
  z-index: 3;
}

  .summary-row {
    display: flex;
    gap: 30px; /* Creates space between summary cards */
  }
.container{
  background-color: #D9D9D9;
}
.dashboard-cards-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
@media (max-width: 767px) {
  .summary-row.dashboard-cards-scroll {
    flex-wrap: nowrap !important;
    gap: 16px;
  }
  .summary-card {
    min-width: 280px !important;
    max-width: 90vw;
    flex: 0 0 auto !important;
  }
}
  </style>
