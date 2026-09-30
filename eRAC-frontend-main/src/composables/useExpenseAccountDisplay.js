// Shared helpers for rendering the expense account hierarchy
// (Class > Type > Item > Sub-Item > Sub-Type > Sub-Sub-Type) across the
// disbursement dialogs.
const pickName = (row, ...keys) => {
  for (const key of keys) {
    const val = row?.[key]
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      return String(val).trim()
    }
  }
  return ''
}

const LEVEL_ORDER = [
  'expenseClass',
  'expenseType',
  'expenseItem',
  'expenseSubItem',
  'expenseSubType',
  'expenseSubSubType',
]

const LEVEL_KEYS = [
  'expense_class_id',
  'expense_type_id',
  'expense_item_id',
  'expense_sub_item_id',
  'expense_sub_type_id',
  'expense_sub_sub_type_id',
]

const LEVEL_KEY_MAP = {
  expenseClass: ['expenseClass', 'expense_class_name', 'className', 'class_name'],
  expenseType: ['expenseType', 'expense_type_name'],
  expenseItem: ['expenseItem', 'expense_item_name'],
  expenseSubItem: [
    'expenseSubItem',
    'expenseSubitem',
    'expense_sub_item_name',
    'expense_subitem_name',
  ],
  expenseSubType: ['expenseSubType', 'expense_sub_type_name'],
  expenseSubSubType: ['expenseSubSubType', 'expense_sub_sub_type_name'],
}

// Reads the nested { appropriation: { expenseClass, expenseType, ... } } names
// the backend uses to build its account_name.
const appropriationName = (row, index) => {
  const appr = row?.appropriation
  if (!appr || typeof appr !== 'object') return ''
  const node = appr[LEVEL_ORDER[index]]
  if (!node || typeof node !== 'object' || node.name == null) return ''
  return String(node.name).trim()
}

// Splits a concatenated account_name into per-level slots aligned to which
// expense ids are present, so a missing intermediate level never shifts the
// deeper (sub-type / sub-sub-type) names into the wrong slot.
const alignedNameSplit = (row) => {
  const full = pickName(row, 'accountName', 'fullPath', 'account_name')
  const parts = String(full || '')
    .split(' > ')
    .map((p) => p.trim())
    .filter(Boolean)
  const present = LEVEL_KEYS.map((key) => row?.[key] != null && row[key] !== '')
  const names = new Array(6).fill('')
  let partIndex = 0
  for (let i = 0; i < 6; i++) {
    if (present[i] && partIndex < parts.length) {
      names[i] = parts[partIndex]
      partIndex++
    }
  }
  return names
}

const levelName = (row, index, keys) => {
  const flat = pickName(row, ...keys)
  if (flat) return flat
  return appropriationName(row, index) || alignedNameSplit(row)[index] || ''
}

export function useExpenseAccountDisplay() {
  // Returns each level of the expense account hierarchy as an array of strings
  const expenseAccountSegments = (row) => {
    if (!row) return []
    return LEVEL_ORDER.map((level, index) => levelName(row, index, LEVEL_KEY_MAP[level])).filter(
      Boolean,
    )
  }

  // Full label as a single " > "-joined string
  const expenseAccountLabel = (row) => {
    const segments = expenseAccountSegments(row)
    if (segments.length) return segments.join(' > ')
    return pickName(row, 'accountName', 'fullPath', 'account_name') || '—'
  }

  return { expenseAccountSegments, expenseAccountLabel }
}
