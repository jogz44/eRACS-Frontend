<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Page Container -->
    <q-page-container>
      <q-page class="q-pa-lg">
        <!-- Summary Cards -->
        <div class="row summary-row q-mb-md">
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
            <div class="text-h6">Barangay Summary</div>
            <q-table
              flat
              bordered
              :rows="barangaySummary"
              :columns="summaryColumns"
              row-key="barangay"
              :pagination="{ rowsPerPage: 0 }"
              class="my-sticky-header-table"
              @row-click="onBarangayClick"
            />
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
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
        { name: 'budget', label: 'Total Budget', align: 'left', field: 'appropriation' },
        { name: 'appropriation', label: 'Total Expenses', align: 'right', field: 'appropriation' },
        { name: 'balance', label: 'Total Balance', align: 'right', field: 'balance' },
      ],

      barangaySummary: [
        { barangay: 'Apokon', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Bincungan', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Busaon', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Canocotan', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Cuambogan', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'La Filipina', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Liboganon', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Madsum', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Magugpo Pobledon', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Magugpo East', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Magugpo North', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Magugpo Poblacion', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Magugpo South', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Magugpo West', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Mankilam', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'New Balamban', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Nueva Fuerza', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Pagsabangan', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Pandapan', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'San Agustin', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'San Isidro', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'San Miguel (Camp 4)', appropriation: '28,000.00', balance: '28,000.00' },
        { barangay: 'Visayan Village', appropriation: '28,000.00', balance: '28,000.00' },
      ],
    }
  },
  methods: {
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
  },
}
</script>

<style scoped>
.summary-card {
  min-height: 120px !important; /* Override any defaults */

  justify-content: center;
width: 387px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  gap: 100px;
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
  height: 30px;
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
  max-height: 500px;
}
.my-sticky-header-table thead tr:first-child th {
  top: 0;
}
.my-sticky-header-table.q-table--loading thead tr:last-child th {
  top: 48px;
}
.summary-row {
  display: flex;
  gap: 30px; /* Creates space between summary cards */
}
</style>
