<template>
  <q-dialog
    v-model="model"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-layout view="lHh Lpr lFf" class="cheque-layout">

      <!-- Header -->
      <q-header elevated class="bg-white text-dark modal-header">
        <q-toolbar class="q-px-md">
          <q-btn
            flat
            icon="menu"
            @click="chequeDrawerOpen = !chequeDrawerOpen"
            class="q-mr-md"
            :color="chequeDrawerOpen ? '#187C19' : '#666'"
            size="md"
          >
            <q-tooltip>Toggle Settings Panel</q-tooltip>
          </q-btn>

          <q-toolbar-title class="text-h6 text-weight-medium" style="color: #187c19">
            Print Cheque
          </q-toolbar-title>

          <q-space />

          <div class="q-gutter-sm">
            <q-btn
              outline
              icon="picture_as_pdf"
              label="Export PDF"
              color="green"
              :loading="exporting"
              @click="exportCheque"
              size="sm"
              no-caps
            />
            <q-btn
              unelevated
              icon="print"
              label="Print"
              color="green"
              @click="printCheque"
              size="sm"
              no-caps
            />
            <q-btn flat icon="close" color="grey" v-close-popup>
              <q-tooltip>Close</q-tooltip>
            </q-btn>
          </div>
        </q-toolbar>
      </q-header>

      <!-- Left Drawer -->
      <q-drawer
        v-model="chequeDrawerOpen"
        side="left"
        bordered
        :width="380"
        :breakpoint="768"
        :show-if-above="false"
        class="bg-grey-1 cheque-drawer"
      >
        <q-scroll-area style="height: 100%;">
          <div class="q-pa-lg">

            <!-- Drawer Header -->
            <div class="q-mb-lg drawer-header">
              <div class="text-h6 q-mb-sm" style="color: #187c19">
                <q-icon name="tune" class="q-mr-sm" />
                Cheque Setup
              </div>
              <div class="text-caption" style="color: #666">
                Configure cheque format and layout
              </div>
            </div>

            <!-- Cheque Info -->
            <q-card flat bordered class="q-mb-md info-card">
              <q-card-section class="q-pb-sm">
                <div class="text-subtitle2 text-weight-medium q-mb-sm" style="color: #187c19">
                  <q-icon name="info" class="q-mr-xs" />
                  Cheque Information
                </div>
                <div
                  v-for="item in [
                    { label: 'DV No.', value: disbursement?.dvNumber },
                    { label: 'Payee', value: disbursement?.payee2 || disbursement?.payee },
                    { label: 'Date', value: disbursement?.date },
                  ]"
                  :key="item.label"
                  class="row justify-between q-py-xs"
                  style="font-size:13px"
                >
                  <span style="color:#666; font-weight:500">{{ item.label }}:</span>
                  <span style="color:#333; text-align:right; max-width:60%; word-break:break-word">{{ item.value }}</span>
                </div>
              </q-card-section>
            </q-card>

            <!-- Cheque & Bank Format -->
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <div class="text-subtitle2 text-weight-medium q-mb-md" style="color: #187c19">
                  <q-icon name="account_balance" class="q-mr-xs" />
                  Cheque Selection
                </div>
                <q-select
                  outlined dense
                  v-model="selectedChequeKey"
                  :options="chequeOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Cheque"
                  class="q-mb-sm"
                />
                <q-select
                  outlined dense
                  v-model="selectedProfileName"
                  :options="profileNames"
                  label="Bank format"
                />
              </q-card-section>
            </q-card>

            <!-- Layout Settings -->
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <div class="text-subtitle2 text-weight-medium q-mb-md" style="color: #187c19">
                  <q-icon name="straighten" class="q-mr-xs" />
                  Layout Settings
                </div>

                <div class="row q-col-gutter-xs items-end q-mb-sm">
                  <div class="col-4">
                    <q-input outlined dense v-model.number="settings.width" type="number" suffix="mm" label="Width" />
                  </div>
                  <div class="col-4">
                    <q-input outlined dense v-model.number="settings.height" type="number" suffix="mm" label="Height" />
                  </div>
                  <div class="col-4">
                    <q-input outlined dense v-model.number="settings.fontSize" type="number" suffix="mm" label="Font" />
                  </div>
                </div>

                <div
                  v-for="field in layoutFields"
                  :key="field.key"
                  class="q-mb-sm layout-field-group"
                >
                  <div class="text-caption text-grey-7 q-mb-xs">{{ field.label }}</div>
                  <div class="row q-col-gutter-xs">
                    <div class="col-6">
                      <q-input outlined dense v-model.number="settings.fields[field.key].x" type="number" suffix="Horiz" />
                    </div>
                    <div class="col-6">
                      <q-input outlined dense v-model.number="settings.fields[field.key].y" type="number" suffix="Vert" />
                    </div>
                  </div>
                </div>

                <q-btn
                  outline
                  size="sm"
                  icon="save"
                  label="Save Format"
                  color="green"
                  class="full-width q-mt-sm"
                  @click="saveCurrentProfile"
                />
              </q-card-section>
            </q-card>

          </div>
        </q-scroll-area>
      </q-drawer>

      <!-- Main Content -->
      <q-page-container style="background: #f5f5f5">
        <div class="q-pa-md" style="max-width: 1000px; margin: 200px auto; ">
          <q-card class="print-modal">
            <q-card-section class="preview-wrap">
              <div ref="chequeRef" class="cheque-paper" :class="{ guide: showGuide }" :style="paperStyle">
                <div class="cheque-text cheque-number" :style="fieldStyle('chequeNumber')">{{ printData.chequeNumber }}</div>
                <div class="cheque-text cheque-date" :style="fieldStyle('date')">{{ printData.date }}</div>
                <div class="cheque-text cheque-payee" :style="fieldStyle('payee')">{{ printData.payee }}</div>
                <div class="cheque-text cheque-amount-words" :style="fieldStyle('amountWords')">
                  {{ printData.amountWords }}
                </div>
                <div class="cheque-text cheque-amount" :style="fieldStyle('amount')">{{ printData.amount }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-page-container>

    </q-layout>
  </q-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'

const model = defineModel({ type: Boolean, default: false })
const props = defineProps({
  disbursement: {
    type: Object,
    default: null,
  },
})

const $q = useQuasar()
const chequeRef = ref(null)
const showGuide = ref(false)
const chequeDrawerOpen = ref(true)
const selectedChequeKey = ref('')
const selectedProfileName = ref('Default PH Cheque')
const exporting = ref(false)

const STORAGE_KEY = 'chequePrintProfiles'

const layoutFields = [
  { key: 'chequeNumber', label: 'Cheque No.' },
  { key: 'date', label: 'Date' },
  { key: 'payee', label: 'Payee' },
  { key: 'amountWords', label: 'Amount in words' },
  { key: 'amount', label: 'Amount' },
]

const defaultProfiles = {
  'Default PH Cheque': {
    width: 220,
    height: 80,
    fontSize: 3.6,
    fields: {
      chequeNumber: { x: 90, y: 15, width: 42 },
      date: { x: 155, y: 15, width: 62 },
      payee: { x: 31, y: 25, width: 150 },
      amountWords: { x: 22, y: 35, width: 185 },
      amount: { x: 125, y: 25, width: 62 }
    },
  },
  Landbank: {
    width: 220,
    height: 80,
    fontSize: 3.6,
    fields: {
      chequeNumber: { x: 90, y: 15, width: 42 },
      date: { x: 155, y: 15, width: 62 },
      payee: { x: 31, y: 25, width: 150 },
      amountWords: { x: 22, y: 35, width: 185 },
      amount: { x: 125, y: 25, width: 62 }
    },
  },
    BPI: {
    width: 220,
    height: 80,
    fontSize: 3.6,
    fields: {
      chequeNumber: { x: 90, y: 15, width: 42 },
      date: { x: 155, y: 15, width: 62 },
      payee: { x: 31, y: 25, width: 150 },
      amountWords: { x: 22, y: 35, width: 185 },
      amount: { x: 125, y: 25, width: 62 }
    },
  },
    BDO: {
    width: 220,
    height: 80,
    fontSize: 3.6,
    fields: {
      chequeNumber: { x: 90, y: 15, width: 42 },
      date: { x: 155, y: 15, width: 62 },
      payee: { x: 31, y: 25, width: 150 },
      amountWords: { x: 22, y: 35, width: 185 },
      amount: { x: 125, y: 25, width: 62 }
    },
  },
}

const exportCheque = async () => {
  if (!chequeRef.value) return

  exporting.value = true
  try {
    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).default

    showGuide.value = false
    await nextTick()

    const canvas = await html2canvas(chequeRef.value, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })

    const pdf = new jsPDF({
      orientation: settings.width > settings.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [settings.width, settings.height],
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgData = canvas.toDataURL('image/png')

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight)
    
    const chequeNo = printData.value.chequeNumber || 'export'
    const dvNo = props.disbursement?.dvNumber || ''
    pdf.save(`Cheque-${chequeNo}${dvNo ? `-${dvNo}` : ''}.pdf`)
  } catch (error) {
    console.error('Failed to export cheque:', error)
    $q.notify({ type: 'negative', message: 'Failed to export cheque', position: 'top' })
  } finally {
    exporting.value = false
  }
}

const isStorageAvailable = () => {
  try {
    const testKey = '__cheque_storage_test__'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch (err) {
    console.error('localStorage is not available:', err)
    return false
  }
}

const normalizeProfile = (profile, profileKey = 'Default PH Cheque') => {
  const base = defaultProfiles[profileKey] || defaultProfiles['Default PH Cheque']
  const next = JSON.parse(JSON.stringify(profile || base))

  return {
    ...base,
    ...next,
    fields: {
      ...base.fields,
      ...(next.fields || {}),
    },
  }
}

const loadProfiles = () => {
  let saved = {}

  if (isStorageAvailable()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) saved = JSON.parse(raw)
    } catch (err) {
      // Don't silently wipe everything - just log it so it's diagnosable,
      // and fall through to defaults for whichever keys failed to parse.
      console.error('Failed to parse saved cheque profiles, using defaults:', err)
      saved = {}
    }
  }

  const merged = {}
  for (const key of Object.keys(defaultProfiles)) {
    try {
      merged[key] = normalizeProfile(saved[key], key)
    } catch (err) {
      console.error(`Failed to normalize cheque profile "${key}", using default:`, err)
      merged[key] = JSON.parse(JSON.stringify(defaultProfiles[key]))
    }
  }
  return merged
}

const profiles = ref(loadProfiles())
const profileNames = computed(() => Object.keys(profiles.value))
const settings = reactive(JSON.parse(JSON.stringify(defaultProfiles['Default PH Cheque'])))

const applyProfile = (profile) => {
  const next = normalizeProfile(profile)
  settings.width = next.width
  settings.height = next.height
  settings.fontSize = next.fontSize
  settings.fields = next.fields
}

watch(selectedProfileName, (name) => applyProfile(profiles.value[name]), { immediate: true })

const amountRows = computed(() => {
  const rows = props.disbursement?.bank_cheques?.length
    ? props.disbursement.bank_cheques
    : props.disbursement?.expenses?.length
    ? props.disbursement.expenses
    : [props.disbursement].filter(Boolean)

  return rows
    .map((row, idx) => ({
      ...row,
      _key: `${row.id || idx}-${row.chequeNumber || row.cheque_number || idx}`,
      chequeNumber: row.chequeNumber || row.cheque_number || props.disbursement?.chequeNumber || '',
      bankName: row.bankName || row.bank_name || row.bank || props.disbursement?.bank_name || props.disbursement?.bank || '',
      amount: Number(row.amount || row.dvAmount || props.disbursement?.dvAmount || props.disbursement?.netAmount || 0),
    }))
    .filter(row => row.chequeNumber || row.amount)
})

const chequeOptions = computed(() =>
  amountRows.value.map((row, idx) => ({
    label: `${idx + 1}. ${row.chequeNumber || 'No cheque'} - ${formatCurrency(row.amount)}`,
    value: row._key,
  }))
)

const selectedRow = computed(() =>
  amountRows.value.find(row => row._key === selectedChequeKey.value) || amountRows.value[0] || {}
)

watch(
  () => props.disbursement,
  () => {
    const first = amountRows.value[0]
    selectedChequeKey.value = first?._key || ''
    const bankProfile = profileNames.value.find(name =>
      first?.bankName?.toLowerCase?.().includes(name.toLowerCase())
    )
    selectedProfileName.value = bankProfile || 'Default PH Cheque'
  },
  { immediate: true }
)

watch(model, async (open) => {
  if (open) {
    chequeDrawerOpen.value = true
    await nextTick()
  }
})

const paperStyle = computed(() => ({
  width: `${settings.width}mm`,
  height: `${settings.height}mm`,
  fontSize: `${settings.fontSize}mm`,
}))

const fieldStyle = (key) => {
  const field = settings.fields[key]
  return {
    left: `${field.x}mm`,
    top: `${field.y}mm`,
    width: `${field.width}mm`,
  }
}

const printData = computed(() => {
  const amount = Number(selectedRow.value.amount || 0)
  return {
    chequeNumber: selectedRow.value.chequeNumber || '',
    date: formatChequeDate(props.disbursement?.date, true),
    payee: (props.disbursement?.payee2 || props.disbursement?.payee || '').toUpperCase(),
    amount: formatCurrency(amount),
    amountWords: amountToWords(amount).toUpperCase(),
  }
})

const saveCurrentProfile = () => {
  if (!isStorageAvailable()) {
    $q.notify({
      type: 'negative',
      message: 'Cannot save: browser storage is unavailable (private/incognito mode or blocked storage).',
      position: 'top',
    })
    return
  }

  try {
    const profileKey = selectedProfileName.value
    const normalized = normalizeProfile(JSON.parse(JSON.stringify(settings)), profileKey)

    profiles.value = { ...profiles.value, [profileKey]: normalized }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.value))

    // Verify the write actually stuck (some browsers no-op writes when
    // storage is full or restricted, instead of throwing).
    const verify = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (JSON.stringify(verify[profileKey]) !== JSON.stringify(normalized)) {
      throw new Error('Storage write did not persist (quota exceeded or storage restricted)')
    }

    $q.notify({ type: 'positive', message: 'Cheque format saved.', position: 'top' })
  } catch (err) {
    console.error('Failed to save cheque format:', err)
    $q.notify({
      type: 'negative',
      message: 'Failed to save cheque format. Please check your browser storage settings.',
      position: 'top',
    })
  }
}

const printCheque = async () => {
  showGuide.value = false
  await nextTick()
  window.print()
}

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatChequeDate = (value, spaced = false) => {
  if (!value) return ''
  const formatted = String(value)
  let mm = ''
  let dd = ''
  let yyyy = ''

  if (!formatted.includes('/')) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      mm = String(date.getMonth() + 1).padStart(2, '0')
      dd = String(date.getDate()).padStart(2, '0')
      yyyy = String(date.getFullYear())
    } else {
      const digits = formatted.replace(/\D/g, '')
      mm = digits.slice(0, 2)
      dd = digits.slice(2, 4)
      yyyy = digits.slice(4, 8)
    }
  } else {
    const parts = formatted.split('/')
    if (parts.length === 3) {
      mm = parts[0].padStart(2, '0')
      dd = parts[1].padStart(2, '0')
      yyyy = parts[2]
    } else {
      const digits = formatted.replace(/\D/g, '')
      mm = digits.slice(0, 2)
      dd = digits.slice(2, 4)
      yyyy = digits.slice(4, 8)
    }
  }

  if (!mm || !dd || !yyyy) return formatted
  if (!spaced) return `${mm}-${dd}-${yyyy}`

  const spread = (part) => String(part).split('').join('  ')
  return `${spread(mm)}    ${spread(dd)}    ${spread(yyyy)}`
}

const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

const underThousandToWords = (num) => {
  const parts = []
  if (num >= 100) {
    parts.push(`${ones[Math.floor(num / 100)]} hundred`)
    num %= 100
  }
  if (num >= 20) {
    parts.push(tens[Math.floor(num / 10)])
    num %= 10
  }
  if (num >= 10) {
    parts.push(teens[num - 10])
    num = 0
  }
  if (num > 0) parts.push(ones[num])
  return parts.join(' ')
}

const amountToWords = (value) => {
  const amount = Math.round(Number(value || 0) * 100) / 100
  const pesos = Math.floor(amount)
  const cents = Math.round((amount - pesos) * 100)
  if (pesos === 0 && cents === 0) return 'zero pesos'

  const scales = ['', 'thousand', 'million', 'billion']
  let num = pesos
  let scale = 0
  const words = []
  while (num > 0) {
    const chunk = num % 1000
    if (chunk) words.unshift(`${underThousandToWords(chunk)} ${scales[scale]}`.trim())
    num = Math.floor(num / 1000)
    scale += 1
  }

  const pesoWords = `${words.join(' ')} pesos`
  return cents ? `${pesoWords} and ${underThousandToWords(cents)} centavos` : pesoWords
}
</script>

<style scoped>
.cheque-layout {
  background: #f5f5f5;
}

.modal-header {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 2000;
}

.modal-header .q-toolbar {
  min-height: 64px;
  padding: 8px 16px;
}

.cheque-drawer {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.drawer-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}

.info-card {
  background: linear-gradient(135deg, #e0ffe7 0%, #69b31e 100%);
  border: 1px solid #187c19;
}

.layout-field-group {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 8px;
  background-color: #fafafa;
}

.preview-wrap {
  display: flex;
  justify-content: center;
  background: #f3f4f6;
  overflow: auto;
}

.cheque-paper {
  position: relative;
  background: white;
  margin: 12px auto;
  color: #111;
  font-family: Arial, Helvetica, sans-serif;
}

.cheque-paper.guide {
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
  background-size: 5mm 5mm;
}

.cheque-text {
  position: absolute;
  white-space: nowrap;
  overflow: hidden;
  line-height: 1.15;
  font-weight: 500;
}

.cheque-amount {
  text-align: right;
  font-weight: 700;
}

.cheque-date {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  white-space: pre;
  letter-spacing: 0;
}

.cheque-amount-words {
  white-space: normal;
}

@media (max-width: 768px) {
  .cheque-drawer {
    width: 300px !important;
  }

  .modal-header .q-toolbar {
    min-height: 56px;
    padding: 4px 8px;
  }

  .modal-header .q-toolbar-title {
    font-size: 0.9rem;
  }
}

@media print {
  :global(body *) {
    visibility: hidden !important;
  }

  .cheque-paper,
  .cheque-paper * {
    visibility: visible !important;
  }

  .cheque-paper {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }

  .no-print {
    display: none !important;
  }

  @page {
    margin: 0;
  }
}
</style>