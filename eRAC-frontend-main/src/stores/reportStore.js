import { defineStore } from "pinia";
import { api } from 'boot/axios'
import { useAuthStore } from './auth'


export const useReportStore = defineStore("report", {
  state: () => ({

    reportRAC: [
  { accountTitle: "MOOE - Travelling Expenses", appropriation: 500000, particular: "C/A Honorarium of Barangay Official", dvNumber: "DV-25-08-001", date: "June 1", payee: "Juan Dela Cruz", amount: 450000 },
  { accountTitle: "LOCALLY FUNDED PROGRAM - Training Expense", appropriation: 320000, particular: "Training on Disaster Preparedness", dvNumber: "DV-25-08-002", date: "June 2", payee: "Maria Santos", amount: 310000 },
  { accountTitle: "CAPITAL OUTLAY - Office Supplies", appropriation: 150000, particular: "Purchase of Printer and Toner", dvNumber: "DV-25-08-003", date: "June 3", payee: "Pedro Ramirez", amount: 140000 },
  { accountTitle: "Honorarium - Utility Expenses", appropriation: 200000, particular: "Monthly Water and Electricity Bills", dvNumber: "DV-25-08-004", date: "June 4", payee: "Ana Cruz", amount: 195000 },
  { accountTitle: "Cash Gift - Membership Dues & Contribution to Organization", appropriation: 100000, particular: "Annual Membership Renewal", dvNumber: "DV-25-08-005", date: "June 5", payee: "Jose Martinez", amount: 98000 },
  { accountTitle: "Leave Credit Benefits - Repair & Maintenance - Vehicles", appropriation: 250000, particular: "Repair of Barangay Patrol Vehicle", dvNumber: "DV-25-08-006", date: "June 6", payee: "Luis Mendoza", amount: 240000 },
  { accountTitle: "Year-End Bonus - Fuel & Lubricants", appropriation: 120000, particular: "Fuel for Barangay Operations", dvNumber: "DV-25-08-007", date: "June 7", payee: "Carmen Reyes", amount: 118000 },
  { accountTitle: "MID-YEAR BONUS - Repair & Maintenance of Government Facilities", appropriation: 300000, particular: "Repair of Barangay Hall Roofing", dvNumber: "DV-25-08-008", date: "June 8", payee: "Mario Villanueva", amount: 295000 },
  { accountTitle: "Productivity Enhancement Incentive (PEI) - Financial Assistance for Brgy. Functionaries", appropriation: 400000, particular: "Assistance to Barangay Workers", dvNumber: "DV-25-08-009", date: "June 9", payee: "Andrea Bautista", amount: 390000 },
  { accountTitle: "MOOE - Fidelity Bond", appropriation: 80000, particular: "Fidelity Bond Renewal", dvNumber: "DV-25-08-010", date: "June 10", payee: "Ricardo Gomez", amount: 78000 },
  { accountTitle: "LOCALLY FUNDED PROGRAM - Subscription Expense", appropriation: 60000, particular: "Internet and Software Subscriptions", dvNumber: "DV-25-08-011", date: "June 11", payee: "Bea Hernandez", amount: 59000 },
  { accountTitle: "CAPITAL OUTLAY - Repair of Office Equipment", appropriation: 90000, particular: "Printer and Computer Repair", dvNumber: "DV-25-08-012", date: "June 12", payee: "Oscar Valdez", amount: 88000 },
  { accountTitle: "Honorarium - Rent Expense", appropriation: 70000, particular: "Rental of Barangay Event Hall", dvNumber: "DV-25-08-013", date: "June 13", payee: "Marites Dela Cruz", amount: 69000 },
  { accountTitle: "Cash Gift - Cable, satellite, telegraph & radio expense", appropriation: 50000, particular: "Cable TV Subscription", dvNumber: "DV-25-08-014", date: "June 14", payee: "Ramon Garcia", amount: 49000 },
  { accountTitle: "Leave Credit Benefits - Extraordinary Expense", appropriation: 45000, particular: "Emergency Relief Operations", dvNumber: "DV-25-08-015", date: "June 15", payee: "Karen Lim", amount: 44000 },
  { accountTitle: "Year-End Bonus - Repair & maint. of other Public Infrastructure", appropriation: 120000, particular: "Repair of Barangay Covered Court", dvNumber: "DV-25-08-016", date: "June 16", payee: "Victor Ong", amount: 118000 },
  { accountTitle: "MID-YEAR BONUS - Accountable Forms Expense", appropriation: 60000, particular: "Purchase of Barangay Forms", dvNumber: "DV-25-08-017", date: "June 17", payee: "Paula Reyes", amount: 59000 },
  { accountTitle: "Productivity Enhancement Incentive (PEI) - Auditing Services", appropriation: 75000, particular: "Annual Barangay Audit Fee", dvNumber: "DV-25-08-018", date: "June 18", payee: "Danilo Perez", amount: 74000 },
  { accountTitle: "MOOE - Insurance Premium", appropriation: 100000, particular: "Insurance for Barangay Vehicles", dvNumber: "DV-25-08-019", date: "June 19", payee: "Agnes Salvador", amount: 98000 },
  { accountTitle: "LOCALLY FUNDED PROGRAM - Other MOE", appropriation: 50000, particular: "Miscellaneous Barangay Expenses", dvNumber: "DV-25-08-020", date: "June 20", payee: "Joel Navarro", amount: 49000 },
  { accountTitle: "CAPITAL OUTLAY - Travelling Expenses", appropriation: 150000, particular: "Travel for Barangay Officials", dvNumber: "DV-25-08-021", date: "June 21", payee: "Grace Fernandez", amount: 148000 },
  { accountTitle: "Honorarium - Training Expense", appropriation: 90000, particular: "Barangay Skills Enhancement Training", dvNumber: "DV-25-08-022", date: "June 22", payee: "Francisco Torres", amount: 88000 },
  { accountTitle: "Cash Gift - Office Supplies", appropriation: 60000, particular: "Purchase of Stationery", dvNumber: "DV-25-08-023", date: "June 23", payee: "Emily Santos", amount: 59000 },
  { accountTitle: "Leave Credit Benefits - Utility Expenses", appropriation: 80000, particular: "Barangay Water and Electricity Bills", dvNumber: "DV-25-08-024", date: "June 24", payee: "Martin Castro", amount: 78000 },
  { accountTitle: "Year-End Bonus - Membership Dues & Contribution to Organization", appropriation: 50000, particular: "Membership Renewal Fees", dvNumber: "DV-25-08-025", date: "June 25", payee: "Jessica Morales", amount: 49000 },
  { accountTitle: "MID-YEAR BONUS - Repair & Maintenance - Vehicles", appropriation: 150000, particular: "Maintenance of Ambulance", dvNumber: "DV-25-08-026", date: "June 26", payee: "Albert Rivera", amount: 148000 },
  { accountTitle: "Productivity Enhancement Incentive (PEI) - Fuel & Lubricants", appropriation: 120000, particular: "Fuel for Barangay Service Vehicle", dvNumber: "DV-25-08-027", date: "June 27", payee: "Angela Dizon", amount: 118000 },
  { accountTitle: "MOOE - Repair & Maintenance of Government Facilities", appropriation: 300000, particular: "Repair of Barangay Health Center", dvNumber: "DV-25-08-028", date: "June 28", payee: "Benjamin Lim", amount: 295000 },
  { accountTitle: "LOCALLY FUNDED PROGRAM - Financial Assistance for Brgy. Functionaries", appropriation: 400000, particular: "Assistance for Barangay Workers", dvNumber: "DV-25-08-029", date: "June 29", payee: "Sharon Tan", amount: 390000 },
  { accountTitle: "CAPITAL OUTLAY - Fidelity Bond", appropriation: 80000, particular: "Fidelity Bond Renewal", dvNumber: "DV-25-08-030", date: "June 30", payee: "Evelyn Bautista", amount: 78000 },
  { accountTitle: "Honorarium - Subscription Expense", appropriation: 60000, particular: "Software Subscription for Barangay Office", dvNumber: "DV-25-08-031", date: "July 1", payee: "Cesar Aquino", amount: 59000 },
  { accountTitle: "Cash Gift - Repair of Office Equipment", appropriation: 90000, particular: "Repair of Barangay Computers", dvNumber: "DV-25-08-032", date: "July 2", payee: "Regina Santos", amount: 88000 },
  { accountTitle: "Leave Credit Benefits - Rent Expense", appropriation: 70000, particular: "Office Space Rental", dvNumber: "DV-25-08-033", date: "July 3", payee: "Gilbert Ramos", amount: 69000 },
  { accountTitle: "Year-End Bonus - Cable, satellite, telegraph & radio expense", appropriation: 50000, particular: "Radio Communication Service", dvNumber: "DV-25-08-034", date: "July 4", payee: "Lorna David", amount: 49000 },
  { accountTitle: "MID-YEAR BONUS - Extraordinary Expense", appropriation: 45000, particular: "Emergency Aid", dvNumber: "DV-25-08-035", date: "July 5", payee: "Paulo Cruz", amount: 44000 },
  { accountTitle: "Productivity Enhancement Incentive (PEI) - Repair & maint. of other Public Infrastructure", appropriation: 120000, particular: "Repair of Drainage System", dvNumber: "DV-25-08-036", date: "July 6", payee: "Andrea Soriano", amount: 118000 },
  { accountTitle: "MOOE - Accountable Forms Expense", appropriation: 60000, particular: "Purchase of Barangay Receipts", dvNumber: "DV-25-08-037", date: "July 7", payee: "Eduardo Ponce", amount: 59000 },
  { accountTitle: "LOCALLY FUNDED PROGRAM - Auditing Services", appropriation: 75000, particular: "Barangay Annual Audit", dvNumber: "DV-25-08-038", date: "July 8", payee: "Helen Cruz", amount: 74000 },
  { accountTitle: "CAPITAL OUTLAY - Insurance Premium", appropriation: 100000, particular: "Insurance for Barangay Properties", dvNumber: "DV-25-08-039", date: "July 9", payee: "Mark Villanueva", amount: 98000 },
  { accountTitle: "Honorarium - Other MOE", appropriation: 50000, particular: "Miscellaneous Operating Expenses", dvNumber: "DV-25-08-040", date: "July 10", payee: "Isabel Bautista", amount: 49000 },
  { accountTitle: "Cash Gift - Travelling Expenses", appropriation: 150000, particular: "Travel for Barangay Officials", dvNumber: "DV-25-08-041", date: "July 11", payee: "Jerome Santos", amount: 148000 },
  { accountTitle: "Leave Credit Benefits - Training Expense", appropriation: 90000, particular: "Barangay Skills Training", dvNumber: "DV-25-08-042", date: "July 12", payee: "Felicidad Diaz", amount: 88000 },
  { accountTitle: "Year-End Bonus - Office Supplies", appropriation: 60000, particular: "Office Stationery", dvNumber: "DV-25-08-043", date: "July 13", payee: "Adrian Lopez", amount: 59000 },
  { accountTitle: "MID-YEAR BONUS - Utility Expenses", appropriation: 80000, particular: "Monthly Utilities", dvNumber: "DV-25-08-044", date: "July 14", payee: "Teresa Garcia", amount: 78000 },
  { accountTitle: "Productivity Enhancement Incentive (PEI) - Membership Dues & Contribution to Organization", appropriation: 50000, particular: "Annual Membership", dvNumber: "DV-25-08-045", date: "July 15", payee: "Oscar Fernandez", amount: 49000 },
  { accountTitle: "MOOE - Repair & Maintenance - Vehicles", appropriation: 150000, particular: "Vehicle Maintenance", dvNumber: "DV-25-08-046", date: "July 16", payee: "Patricia Ramos", amount: 148000 },
  { accountTitle: "LOCALLY FUNDED PROGRAM - Fuel & Lubricants", appropriation: 120000, particular: "Fuel for Barangay Vehicle", dvNumber: "DV-25-08-047", date: "July 17", payee: "Francis Mendoza", amount: 118000 },
  { accountTitle: "CAPITAL OUTLAY - Repair & Maintenance of Government Facilities", appropriation: 300000, particular: "Repair of Barangay Gym", dvNumber: "DV-25-08-048", date: "July 18", payee: "Jocelyn Torres", amount: 295000 },
  { accountTitle: "Honorarium - Financial Assistance for Brgy. Functionaries", appropriation: 400000, particular: "Support for Barangay Officials", dvNumber: "DV-25-08-049", date: "July 19", payee: "Manuel Perez", amount: 390000 },
  { accountTitle: "Cash Gift - Fidelity Bond", appropriation: 80000, particular: "Fidelity Bond Renewal", dvNumber: "DV-25-08-050", date: "July 20", payee: "Rosario Chavez", amount: 78000 }
    ],
    reportSACB: [
      { isSection: true, ppa: '1. PERSONAL SERVICES' },
      { ppa: '• Honorarium', appropriation: '17,000,858.00', obligation: '13,305,598.54', balance: '3,695,259.46' },
      { ppa: '• Leave Credit Benefits', appropriation: '350,089.19', obligation: '308,198.26', balance: '41,890.93' },
      { ppa: '• Productivity Enhancement Incentive (PEI)', appropriation: '60,000.00', obligation: '0.00', balance: '60,000.00' },
      { ppa: '• Cash Gift', appropriation: '60,000.00', obligation: '0.00', balance: '60,000.00' },
      { ppa: '• Year-End Bonus', appropriation: '303,625.00', obligation: '0.00', balance: '303,625.00' },
      { ppa: '• Mid-Year Bonus', appropriation: '276,411.00', obligation: '254,221.00', balance: '22,190.00' },

      { isSection: true, ppa: '2. MOOE' },
      { ppa: '• Travelling Expenses', appropriation: '300,000.00', obligation: '41,100.00', balance: '258,900.00' },
      { ppa: '• Training Expense', appropriation: '200,000.00', obligation: '200,000.00', balance: '0.00' },
      { ppa: '• Internet Expenses', appropriation: '50,000.00', obligation: '0.00', balance: '50,000.00' }],
    
    prepBy: '',
    prepPosition: null,
    notedBy: '',
    notedPosition: null,
    certBy: '',
    certPosition: null,
    
    expenseOptionsCurrent: [],
    expenseOptionsContinuing: [],
    expenseRacSelected: null,
    positionsOptions: [],
    positionSelected: null,

    racColumn: [
      { name: "accountTitle", field: "accountTitle", align: "left" },
      { name: "appropriation", field: "appropriation", align: "right", format: val => val.toLocaleString() },
      { name: "particular", field: "particular", align: "left" },
      { name: "dvNumber", field: "dvNumber", align: "left" },
      { name: "date", field: "date", align: "left" },
      { name: "payee", field: "payee", align: "left" },
      { name: "amount", field: "amount", align: "right", format: val => val.toLocaleString() }
    ],
    sacbColumn: [
      { name: 'ppa', label: 'PROGRAM / PROJECT / ACTIVITY', align: 'left', field: 'ppa' },
      { name: 'appropriation', label: 'APPROPRIATION', align: 'right', field: 'appropriation' },
      { name: 'obligation', label: 'OBLIGATION', align: 'right', field: 'obligation' },
      { name: 'balance', label: 'BALANCE', align: 'right', field: 'balance' }],

    }),
  getters: {


  },
  actions: {
    getAuthConfig() {
      const authStore = useAuthStore()
      if (!authStore.token) {
        throw new Error('Authentication token not found')
      }
      return {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    },
    async fetchData() {
      try{
        const config = this.getAuthConfig();
        const currentYear = new Date().getFullYear();
        const expenseClasses = await api.get(
          `/api/barangay/expense-classes?fiscal_year=${currentYear}`, config);
        const positionsOptions = await api.get('/api/barangay/positions', config);

        const list = expenseClasses?.data?.data?.data || [];

        this.expenseOptionsCurrent = list.map(expense => ({
          id: expense.id,
          name: expense.name
        }));

        this.expenseOptionsContinuing = list.map(expense => ({
          id: expense.id,
          name: expense.name
        }));

        this.positionsOptions = positionsOptions?.data?.map(pos => ({
          label: pos.name,
          value: pos.id
        })) || [];
      } catch (error) {
        console.error('Error:', error)
        throw error
      }
      },
      async fetchRacReport($date){
      try{
        const config = this.getAuthConfig();
        const response = await api.get(`/api/`,
          { params: { to: $date.value.to, from: $date.value.from, expense_class_id: this.expenseRacSelected  }}
          ,config);

        this.reportRAC=response?.data?.map(pos => ({
          accountTitle: pos.accountTitle,
          appropriation: pos.appropriation,
          dvNumber: pos.dvNumber,
          date: pos.date,
          payee: pos.payee,
          amount: pos.amount
        }))
      }catch (error) {
        console.error('Error:', error)
        throw error
      }
    },
    async fetchSacbReport($to,$from){
      try{
        const config = this.getAuthConfig();
        console.error('steve ',$to)
        const response = await api.get(`/api/barangay/report/sacb`,
          { params: { to: $to, from: $from  }}
          ,config);

        // assuming response.data.rows contains your array
        const grouped = {};

        // Group by order + expense
        response?.data?.rows.forEach(row => {
          const key = `${row.order}-${row.expense}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(row);
        });

        // Prepare the final reportRAC array
        this.reportRAC = [];

        Object.keys(grouped).sort().forEach((key) => {
          const items = grouped[key];
          const firstItem = items[0];

          // Add section header
          this.reportRAC.push({
            isSection: true,
            ppa: `${parseInt(firstItem.order) + 1}. ${firstItem.expense}`
          });

          // Add the items
          items.forEach(item => {
            this.reportRAC.push({
              ppa: `• ${item.ppa}`,
              appropriation: Number(item.appropriation).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              obligation: Number(item.obligation).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              balance: Number(item.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            });
          });
        });
      //   { isSection: true, ppa: '1. PERSONAL SERVICES' },
      // { ppa: '• Honorarium', appropriation: '17,000,858.00', obligation: '13,305,598.54', balance: '3,695,259.46' },
      
      }catch (error) {
        console.error('Fetch by steve - Error:', error)
        throw error
      }
    
    }
    },
})