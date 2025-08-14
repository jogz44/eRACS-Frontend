import { defineStore } from "pinia";
import { api } from 'boot/axios'
import { useAuthStore } from './auth'

export const useReportStore = defineStore("reportStore", {
  state: () => ({

    reportRAC: [
      { accountTitle: "Salaries and Wages for Regular Employees", appropriation: 500000, dvNumber: "DV-001", date: "2024-06-01", payee: "Juan Dela Cruz", amount: 450000 },
      { accountTitle: "Purchase of Office Supplies including printer ink and bond papers", appropriation: 80000, dvNumber: "DV-002", date: "2024-06-05", payee: "ABC Stationery Co.", amount: 60000 },
      { accountTitle: "Travel Expenses for Official Business Trip to Manila", appropriation: 40000, dvNumber: "DV-003", date: "2024-06-10", payee: "Maria Santos", amount: 35000 },
      { accountTitle: "Salaries and Wages for Regular Employees", appropriation: 500000, dvNumber: "DV-001", date: "2024-06-01", payee: "Juan Dela Cruz", amount: 450000 },
      { accountTitle: "Purchase of Office Supplies including printer ink and bond papers", appropriation: 80000, dvNumber: "DV-002", date: "2024-06-05", payee: "ABC Stationery Co.", amount: 60000 },
      { accountTitle: "Travel Expenses for Official Business Trip to Manila", appropriation: 40000, dvNumber: "DV-003", date: "2024-06-10", payee: "Maria Santos", amount: 35000 },
      { accountTitle: "Utility Bills Payment - Electricity for Municipal Hall", appropriation: 120000, dvNumber: "DV-004", date: "2024-06-15", payee: "Meralco", amount: 118500 },
      { accountTitle: "Repair and Maintenance of Service Vehicle", appropriation: 90000, dvNumber: "DV-005", date: "2024-06-18", payee: "XYZ Auto Repair Shop", amount: 87500 },
      { accountTitle: "Purchase of Sports Equipment for Barangay Sportsfest", appropriation: 50000, dvNumber: "DV-006", date: "2024-06-20", payee: "Sports World Inc.", amount: 49800 },
      { accountTitle: "Catering Services for Barangay General Assembly", appropriation: 60000, dvNumber: "DV-007", date: "2024-06-25", payee: "Delicious Bites Catering", amount: 59700 },
      { accountTitle: "Salaries and Wages for Regular Employees", appropriation: 500000, dvNumber: "DV-001", date: "2024-06-01", payee: "Juan Dela Cruz", amount: 450000 },
      { accountTitle: "Purchase of Office Supplies including printer ink and bond papers", appropriation: 80000, dvNumber: "DV-002", date: "2024-06-05", payee: "ABC Stationery Co.", amount: 60000 },
      { accountTitle: "Travel Expenses for Official Business Trip to Manila", appropriation: 40000, dvNumber: "DV-003", date: "2024-06-10", payee: "Maria Santos", amount: 35000 },
      { accountTitle: "Salaries and Wages for Regular Employees", appropriation: 500000, dvNumber: "DV-001", date: "2024-06-01", payee: "Juan Dela Cruz", amount: 450000 },
      { accountTitle: "Purchase of Office Supplies including printer ink and bond papers", appropriation: 80000, dvNumber: "DV-002", date: "2024-06-05", payee: "ABC Stationery Co.", amount: 60000 },
      { accountTitle: "Travel Expenses for Official Business Trip to Manila", appropriation: 40000, dvNumber: "DV-003", date: "2024-06-10", payee: "Maria Santos", amount: 35000 },
      { accountTitle: "Utility Bills Payment - Electricity for Municipal Hall", appropriation: 120000, dvNumber: "DV-004", date: "2024-06-15", payee: "Meralco", amount: 118500 },
      { accountTitle: "Repair and Maintenance of Service Vehicle", appropriation: 90000, dvNumber: "DV-005", date: "2024-06-18", payee: "XYZ Auto Repair Shop", amount: 87500 },
      { accountTitle: "Purchase of Sports Equipment for Barangay Sportsfest", appropriation: 50000, dvNumber: "DV-006", date: "2024-06-20", payee: "Sports World Inc.", amount: 49800 },
      { accountTitle: "Catering Services for Barangay General Assembly", appropriation: 60000, dvNumber: "DV-007", date: "2024-06-25", payee: "Delicious Bites Catering", amount: 59700 },
      { accountTitle: "Salaries and Wages for Regular Employees", appropriation: 500000, dvNumber: "DV-001", date: "2024-06-01", payee: "Juan Dela Cruz", amount: 450000 },
      { accountTitle: "Purchase of Office Supplies including printer ink and bond papers", appropriation: 80000, dvNumber: "DV-002", date: "2024-06-05", payee: "ABC Stationery Co.", amount: 60000 },
      { accountTitle: "Travel Expenses for Official Business Trip to Manila", appropriation: 40000, dvNumber: "DV-003", date: "2024-06-10", payee: "Maria Santos", amount: 35000 },
      { accountTitle: "Salaries and Wages for Regular Employees", appropriation: 500000, dvNumber: "DV-001", date: "2024-06-01", payee: "Juan Dela Cruz", amount: 450000 },
      { accountTitle: "Purchase of Office Supplies including printer ink and bond papers", appropriation: 80000, dvNumber: "DV-002", date: "2024-06-05", payee: "ABC Stationery Co.", amount: 60000 },
      { accountTitle: "Travel Expenses for Official Business Trip to Manila", appropriation: 40000, dvNumber: "DV-003", date: "2024-06-10", payee: "Maria Santos", amount: 35000 },
      { accountTitle: "Utility Bills Payment - Electricity for Municipal Hall", appropriation: 120000, dvNumber: "DV-004", date: "2024-06-15", payee: "Meralco", amount: 118500 },
      { accountTitle: "Repair and Maintenance of Service Vehicle", appropriation: 90000, dvNumber: "DV-005", date: "2024-06-18", payee: "XYZ Auto Repair Shop", amount: 87500 },
      { accountTitle: "Purchase of Sports Equipment for Barangay Sportsfest", appropriation: 50000, dvNumber: "DV-006", date: "2024-06-20", payee: "Sports World Inc.", amount: 49800 },
      { accountTitle: "Catering Services for Barangay General Assembly", appropriation: 60000, dvNumber: "DV-007", date: "2024-06-25", payee: "Delicious Bites Catering", amount: 59700 },
      { accountTitle: "Salaries and Wages for Regular Employees", appropriation: 500000, dvNumber: "DV-001", date: "2024-06-01", payee: "Juan Dela Cruz", amount: 450000 },
      { accountTitle: "Purchase of Office Supplies including printer ink and bond papers", appropriation: 80000, dvNumber: "DV-002", date: "2024-06-05", payee: "ABC Stationery Co.", amount: 60000 },
      { accountTitle: "Travel Expenses for Official Business Trip to Manila", appropriation: 40000, dvNumber: "DV-003", date: "2024-06-10", payee: "Maria Santos", amount: 35000 },
      { accountTitle: "Salaries and Wages for Regular Employees", appropriation: 500000, dvNumber: "DV-001", date: "2024-06-01", payee: "Juan Dela Cruz", amount: 450000 },
      { accountTitle: "Purchase of Office Supplies including printer ink and bond papers", appropriation: 80000, dvNumber: "DV-002", date: "2024-06-05", payee: "ABC Stationery Co.", amount: 60000 },
      { accountTitle: "Travel Expenses for Official Business Trip to Manila", appropriation: 40000, dvNumber: "DV-003", date: "2024-06-10", payee: "Maria Santos", amount: 35000 },
      { accountTitle: "Utility Bills Payment - Electricity for Municipal Hall", appropriation: 120000, dvNumber: "DV-004", date: "2024-06-15", payee: "Meralco", amount: 118500 },
      { accountTitle: "Repair and Maintenance of Service Vehicle", appropriation: 90000, dvNumber: "DV-005", date: "2024-06-18", payee: "XYZ Auto Repair Shop", amount: 87500 },
      { accountTitle: "Purchase of Sports Equipment for Barangay Sportsfest", appropriation: 50000, dvNumber: "DV-006", date: "2024-06-20", payee: "Sports World Inc.", amount: 49800 },
      { accountTitle: "Catering Services for Barangay General Assembly", appropriation: 60000, dvNumber: "DV-007", date: "2024-06-25", payee: "Delicious Bites Catering", amount: 59700 },
      { accountTitle: "Salaries and Wages for Regular Employees", appropriation: 500000, dvNumber: "DV-001", date: "2024-06-01", payee: "Juan Dela Cruz", amount: 450000 },
      { accountTitle: "Purchase of Office Supplies including printer ink and bond papers", appropriation: 80000, dvNumber: "DV-002", date: "2024-06-05", payee: "ABC Stationery Co.", amount: 60000 },
      { accountTitle: "Travel Expenses for Official Business Trip to Manila", appropriation: 40000, dvNumber: "DV-003", date: "2024-06-10", payee: "Maria Santos", amount: 35000 },
      { accountTitle: "Salaries and Wages for Regular Employees", appropriation: 500000, dvNumber: "DV-001", date: "2024-06-01", payee: "Juan Dela Cruz", amount: 450000 },
      { accountTitle: "Purchase of Office Supplies including printer ink and bond papers", appropriation: 80000, dvNumber: "DV-002", date: "2024-06-05", payee: "ABC Stationery Co.", amount: 60000 },
      { accountTitle: "Travel Expenses for Official Business Trip to Manila", appropriation: 40000, dvNumber: "DV-003", date: "2024-06-10", payee: "Maria Santos", amount: 35000 },
      { accountTitle: "Utility Bills Payment - Electricity for Municipal Hall", appropriation: 120000, dvNumber: "DV-004", date: "2024-06-15", payee: "Meralco", amount: 118500 },
      { accountTitle: "Repair and Maintenance of Service Vehicle", appropriation: 90000, dvNumber: "DV-005", date: "2024-06-18", payee: "XYZ Auto Repair Shop", amount: 87500 },
      { accountTitle: "Purchase of Sports Equipment for Barangay Sportsfest", appropriation: 50000, dvNumber: "DV-006", date: "2024-06-20", payee: "Sports World Inc.", amount: 49800 },
      { accountTitle: "Catering Services for Barangay General Assembly", appropriation: 60000, dvNumber: "DV-007", date: "2024-06-25", payee: "Delicious Bites Catering", amount: 59700 }
    ],
    reportSACB: [],
    
    prepBy: '',
    prepPosition: null,
    notedBy: '',
    notedPosition: null,
    certBy: '',
    certPosition: null,
    
    expenseOptionsCurrent: [],
    expenseSelectedCurrent: null,
    expenseOptionsContinuing: [],
    expenseSelectedContinuing: null,
    positionsOptions: [],
    positionSelected: null,

    racColumn: [
      { name: "accountTitle", field: "accountTitle", align: "left" },
      { name: "appropriation", field: "appropriation", align: "right", format: val => val.toLocaleString() },
      { name: "dvNumber", field: "dvNumber", align: "left" },
      { name: "date", field: "date", align: "left" },
      { name: "payee", field: "payee", align: "left" },
      { name: "amount", field: "amount", align: "right", format: val => val.toLocaleString() }
    ],
    sacbColumn: [],

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
      }
    }
})