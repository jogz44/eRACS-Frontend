import { exportToExcel } from './excelExport'

const formatDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatAmount = (value) => {
  return Number(value) || 0
}

const getExpenseClasses = (row) => {
  if (!Array.isArray(row.details)) return ''

  const classes = new Set()
  row.details.forEach((detail) => {
    ;[detail.from_account, detail.to_account].forEach((account) => {
      const className = String(account || '').split(' > ')[0]?.trim()
      if (className) classes.add(className)
    })
  })

  return Array.from(classes).join(', ')
}

export const appropriationColumns = [
  { header: '#', key: 'index', width: 6 },
  { header: 'Date', key: 'date', formatter: formatDate, width: 16 },
  { header: 'Barangay', key: 'barangay_name', width: 24 },
  { header: 'Description', key: 'description', width: 36 },
  { header: 'Amount', key: 'amount', formatter: formatAmount, type: 'number', width: 18 },
  { header: 'Unappropriated', key: 'unappropriated', formatter: formatAmount, type: 'number', width: 18 },
  { header: 'Fiscal Year', key: 'fiscal_year', width: 14 },
]

export const disbursementColumns = [
  { header: '#', key: 'index', width: 6 },
  { header: 'Date', key: 'date', formatter: formatDate, width: 16 },
  { header: 'DV No.', key: 'dvNumber', width: 18 },
  { header: 'Barangay', key: 'barangay_name', width: 24 },
  { header: 'Payee', key: 'payee', width: 28 },
  { header: 'Particular', key: 'particular', width: 36 },
  { header: 'Bank', key: 'bank', width: 24 },
  { header: 'Cheque No.', key: 'chequeNumber', width: 18 },
  { header: 'Net Amount', key: 'netAmount', formatter: formatAmount, type: 'number', width: 18 },
  { header: 'Status', key: 'status', width: 16 },
  { header: 'Aging', key: 'aging', width: 14 },
  { header: 'Type', key: 'type', width: 16 },
]

export const augmentationColumns = [
  { header: '#', key: 'index', width: 6 },
  { header: 'Ref No.', key: 'ref_number', width: 18 },
  { header: 'Date', key: 'augmentation_date', formatter: formatDate, width: 16 },
  { header: 'Amount', key: 'total_amount', formatter: formatAmount, type: 'number', width: 18 },
  { header: 'Description', key: 'remarks', width: 36 },
  { header: 'Expense Classes', key: getExpenseClasses, width: 34 },
  { header: 'Barangay', key: 'barangay_name', width: 24 },
]

export const transactionExportConfigs = {
  appropriation: {
    columns: appropriationColumns,
    fileName: 'Appropriation-Transactions',
    sheetName: 'Appropriations',
  },
  disbursement: {
    columns: disbursementColumns,
    fileName: 'Disbursement-Transactions',
    sheetName: 'Disbursements',
  },
  augmentation: {
    columns: augmentationColumns,
    fileName: 'Augmentation-Transactions',
    sheetName: 'Augmentations',
  },
}

export async function exportTransactionToExcel(type, rows, options = {}) {
  const config = transactionExportConfigs[type]
  if (!config) {
    throw new Error(`Unknown transaction export type: ${type}`)
  }

  await exportToExcel(rows, config.columns, {
    fileName: config.fileName,
    sheetName: config.sheetName,
    ...options,
  })
}
