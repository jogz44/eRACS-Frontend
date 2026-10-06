const getNestedValue = (row, key) => {
  if (typeof key === 'function') return key(row)
  if (!key) return ''

  return String(key)
    .split('.')
    .reduce((value, part) => value?.[part], row)
}

const buildFileName = (fileName) => {
  const safeName = String(fileName || 'export')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')

  const today = new Date().toISOString().slice(0, 10)
  return `${safeName || 'export'}_${today}.xlsx`
}

const downloadWorkbook = async (workbook, fileName) => {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = buildFileName(fileName)
  link.click()
  URL.revokeObjectURL(url)
}

const applyFillToMergedRow = (worksheet, rowNumber, totalColumns, fill, border) => {
  for (let columnNumber = 1; columnNumber <= totalColumns; columnNumber += 1) {
    const cell = worksheet.getCell(rowNumber, columnNumber)
    cell.fill = fill
    cell.border = border
  }
}

const normalizeHeaderValue = (value, fallback) => {
  const cleanValue = String(value || '').trim()
  return cleanValue || fallback
}

/**
 * Styled generic Excel exporter.
 * @param {Array} data - array of transaction objects
 * @param {Array} columns - [{ header, key, formatter?, width?, type? }]
 * @param {Object} options - { fileName, sheetName, header: { title, barangay, periodLabel, period } }
 */
export async function exportToExcel(data, columns, options = {}) {
  const {
    fileName = 'export',
    sheetName = 'Sheet1',
    header = {},
  } = options

  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)
  const totalColumns = Math.max(columns.length, 1)

  const borderColor = 'FFD3D3D3'
  const thinBorder = {
    top: { style: 'thin', color: { argb: borderColor } },
    bottom: { style: 'thin', color: { argb: borderColor } },
    left: { style: 'thin', color: { argb: borderColor } },
    right: { style: 'thin', color: { argb: borderColor } },
  }
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } }
  const tableHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF187C19' } }
  const evenRowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }

  worksheet.columns = columns.map((column) => ({ width: column.width || 15 }))
  worksheet.views = [{ state: 'frozen', ySplit: 5 }]
  worksheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
  }

  worksheet.mergeCells(1, 1, 1, totalColumns)
  const titleCell = worksheet.getCell(1, 1)
  titleCell.value = normalizeHeaderValue(header.title, 'Transaction Export')
  titleCell.font = { bold: true, size: 15, color: { argb: 'FF187C19' }, name: 'Arial' }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(1).height = 18

  worksheet.mergeCells(2, 1, 2, totalColumns)
  const barangayCell = worksheet.getCell(2, 1)
  barangayCell.value = `Barangay: ${normalizeHeaderValue(header.barangay, 'All Barangays')}`
  barangayCell.font = { bold: true, size: 11, color: { argb: 'FF187C19' }, name: 'Arial' }
  barangayCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(2).height = 16

  worksheet.mergeCells(3, 1, 3, totalColumns)
  const periodCell = worksheet.getCell(3, 1)
  const periodLabel = normalizeHeaderValue(header.periodLabel, 'Period')
  periodCell.value = `${periodLabel}: ${normalizeHeaderValue(header.period, 'All records')}`
  periodCell.font = { size: 9, color: { argb: 'FF666666' }, name: 'Arial' }
  periodCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(3).height = 14

  worksheet.mergeCells(4, 1, 4, totalColumns)
  const generatedCell = worksheet.getCell(4, 1)
  generatedCell.value = `Generated Date: ${new Date().toLocaleDateString()}`
  generatedCell.font = { italic: true, size: 9, color: { argb: 'FF777777' }, name: 'Arial' }
  generatedCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(4).height = 14

//   for (let rowNumber = 1; rowNumber <= 4; rowNumber += 1) {
//     applyFillToMergedRow(worksheet, rowNumber, totalColumns, headerFill)
//   }

  const headerRowNumber = 6
  columns.forEach((column, index) => {
    const cell = worksheet.getCell(headerRowNumber, index + 1)
    cell.value = String(column.header || '').toUpperCase()
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' }, name: 'Arial' }
    cell.fill = tableHeaderFill
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = thinBorder
  })
  worksheet.getRow(headerRowNumber).height = 28

  const dataStartRow = headerRowNumber + 1
  data.forEach((row, rowIndex) => {
    const excelRowNumber = dataStartRow + rowIndex
    const rowFill = rowIndex % 2 === 1 ? evenRowFill : null

    columns.forEach((column, columnIndex) => {
      const rawValue = column.key === 'index' ? rowIndex + 1 : getNestedValue(row, column.key)
      const value = column.formatter ? column.formatter(rawValue, row, rowIndex) : rawValue
      const cell = worksheet.getCell(excelRowNumber, columnIndex + 1)

      cell.value = value ?? ''
      cell.font = { size: 10, name: 'Arial' }
      cell.alignment = {
        horizontal: column.type === 'number' ? 'right' : 'left',
        vertical: 'middle',
        wrapText: true,
      }
      cell.border = thinBorder
      if (rowFill) cell.fill = rowFill
      if (column.type === 'number') cell.numFmt = '#,##0.00'
    })

    worksheet.getRow(excelRowNumber).height = 20
  })

  const summaryRowNumber = dataStartRow + data.length + 1
  worksheet.mergeCells(summaryRowNumber, 1, summaryRowNumber, totalColumns)
  const summaryCell = worksheet.getCell(summaryRowNumber, 1)
  summaryCell.value = `Total Records: ${data.length}`
  summaryCell.font = { bold: true, size: 10, color: { argb: 'FF187C19' }, name: 'Arial' }
  summaryCell.fill = headerFill
  summaryCell.alignment = { horizontal: 'right', vertical: 'middle' }
  summaryCell.border = thinBorder
  applyFillToMergedRow(worksheet, summaryRowNumber, totalColumns, headerFill, thinBorder)

  await downloadWorkbook(workbook, fileName)
}
