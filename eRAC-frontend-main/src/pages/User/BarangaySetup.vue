<template>
  <q-page class="q-pa-md barangay-setup-page">
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-medium">Barangay Setup</div>
          <div class="text-caption text-grey-6">
            Manage report signatories and bank account details
          </div>
        </div>
        <q-btn icon="refresh" color="primary" flat dense @click="resetForm" />
      </div>
    </div>

    <q-form ref="setupFormRef" @submit="saveSetup" flat bordered>
      <div>
        <q-card flat class="q-mb-md">
          <q-card-section>
            <div class="row items-center">
              <q-icon name="approval" size="24px" color="primary" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-medium">Signatories</div>
            </div>
          </q-card-section>

          <q-card-section style="margin-top: -0.5%">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <div class="signatory-panel">
                  <div class="text-subtitle2 text-weight-medium q-mb-sm">Prepared By</div>
                  <q-input
                    v-model="preparedByName"
                    label="Full Name"
                    outlined
                    dense
                    :rules="[(val) => !!val || 'Full name is required']"
                  />
                  <q-select
                    v-model="setupForm.barangay_position_id"
                    :options="positionOptions"
                    label="Barangay Position"
                    outlined
                    dense
                    emit-value
                    map-options
                    option-label="name"
                    option-value="value"
                    :loading="loadingPositions"
                  />
                </div>
              </div>

              <div class="col-12 col-md-4">
                <div class="signatory-panel">
                  <div class="text-subtitle2 text-weight-medium q-mb-sm">Noted By</div>
                  <q-input
                    v-model="setupForm.noted_by"
                    label="Full Name"
                    outlined
                    dense
                    :rules="[(val) => !!val || 'Full name is required']"
                  />
                  <q-select
                    v-model="setupForm.noted_by_position_id"
                    :options="positionOptions"
                    label="Barangay Position"
                    outlined
                    dense
                    emit-value
                    map-options
                    option-label="name"
                    option-value="value"
                    :loading="loadingPositions"
                    :rules="[(val) => !!val || 'Position is required']"
                  />
                </div>
              </div>

              <div class="col-12 col-md-4">
                <div class="signatory-panel">
                  <div class="text-subtitle2 text-weight-medium q-mb-sm">Certified By</div>
                  <q-input
                    v-model="setupForm.certified_by"
                    label="Full Name"
                    outlined
                    dense
                    :rules="[(val) => !!val || 'Full name is required']"
                  />
                  <q-select
                    v-model="setupForm.certified_by_position_id"
                    :options="positionOptions"
                    label="Barangay Position"
                    outlined
                    dense
                    emit-value
                    map-options
                    option-label="name"
                    option-value="value"
                    :loading="loadingPositions"
                    :rules="[(val) => !!val || 'Position is required']"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Bank Accounts -->
      <q-card flat class="q-mt-md">
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="row items-center">
              <q-icon name="account_balance" size="24px" color="primary" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-medium">Bank Accounts</div>
            </div>
            <q-btn
              icon="add"
              label="Add Bank Account"
              color="primary"
              unelevated
              no-caps
              dense
              @click="openAddBankAccount"
            />
          </div>
        </q-card-section>

        <q-card-section class="q-py-xs">
          <q-table
            flat
            :rows="bankAccounts"
            :columns="bankAccountColumns"
            row-key="id"
            :loading="loadingBankAccounts"
            :pagination="{ rowsPerPage: 10 }"
            no-data-label="No bank accounts added yet"
          >
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" class="text-right q-gutter-xs">
                <q-btn
                  icon="edit"
                  color="green"
                  flat
                  dense
                  round
                  size="sm"
                  :loading="deletingId === props.row.id"
                  @click="editBankAccount(props.row)"
                >
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <!-- <q-btn
                  icon="delete"
                  color="negative"
                  flat
                  dense
                  round
                  size="sm"
                  :loading="deletingId === props.row.id"
                  @click="confirmDeleteBankAccount(props.row)"
                >
                  <q-tooltip>Remove</q-tooltip>
                </q-btn> -->
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <div class="row justify-end q-gutter-sm q-mt-md q-mr-md">
        <q-btn flat color="grey" label="Reset" @click="resetForm" />
        <q-btn type="submit" color="primary" label="Save Setup" :loading="saving" />
      </div>
    </q-form>

    <!-- Add Bank Account Dialog -->
    <q-dialog v-model="bankAccountDialog.show" persistent>
      <q-card style="min-width: 380px" class="q-pa-sm">
        <q-card-section class="row items-center">
          <div class="text-subtitle1 text-weight-medium">
            {{ bankAccountDialog.mode === 'edit' ? 'Edit Bank Account' : 'Add Bank Account' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-form ref="bankAccountFormRef" @submit="saveBankAccount">
          <q-card-section class="q-gutter-xs q-pt-md">
            <!--
             <q-select
              v-model="bankAccountDialog.bank_selection"
              v-model:input-value="bankInputText"
              :options="filteredBankOptions"
              label="Bank"
              outlined
              dense
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              new-value-mode="add-unique"
              option-label="name"
              :loading="loadingBanks"
              @filter="filterBankOptions"
              @new-value="onNewBankValue"
              @blur="onBankBlur"
              @keydown.enter.prevent
              :rules="[(val) => !!val?.name?.trim() || 'Bank is required']"
            />
            -->
            <q-input
              v-model="bankAccountDialog.bank_name"
              label="Bank Name"
              outlined
              dense
              :rules="[(val) => !!val?.trim() || 'Bank name is required']"
            />
            <q-input
              v-model="bankAccountDialog.account_number"
              label="Account Number"
              outlined
              dense
              mask="##############################"
              unmasked-value
              :rules="[(val) => !!val || 'Account number is required']"
            />
            <div class="row col-12 q-mt-none">
              <button
                type="button"
                role="switch"
                :aria-checked="isOnline"
                aria-label="Bank status toggle: Online or Offline"
                class="status-toggle"
                @click="toggle"
              >
                <span class="knob" :class="{ 'knob--offline': isOffline }" />
                <span class="label" :class="{ 'label--active': isOnline }">Online</span>
                <span class="label" :class="{ 'label--active': isOffline }">Offline</span>
              </button>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md q-pt-none">
            <q-btn flat color="grey" label="Cancel" v-close-popup />
            <q-btn
              type="submit"
              color="primary"
              :label="bankAccountDialog.mode === 'edit' ? 'Update Account' : 'Add Account'"
              :loading="bankAccountDialog.saving"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth'
import { usePageLogging } from 'src/composables/usePageLogging'
import { useBankStore } from 'stores/bankStore'

const $q = useQuasar()
const authStore = useAuthStore()
const { logPageVisit } = usePageLogging()
const bankStore = useBankStore()

const setupFormRef = ref(null)
const loadingPositions = ref(false)
const saving = ref(false)
const positionOptions = ref([])
const bankAccounts = ref([])
const loadingBankAccounts = ref(false)
const deletingId = ref(null)
const bankAccountFormRef = ref(null)

// Display-only fields returned by the server (barangay name, position name, etc.)
const preparedByName = ref('')
const displayInfo = ref({
  barangay: '',
  barangay_position: '',
})

const userFullName = computed(() => {
  const user = authStore.user || {}
  return [user.first_name, user.middle_name, user.last_name, user.suffix]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
})

const createEmptyForm = () => ({
  id: null,
  barangay_id: authStore.user?.barangay_id || null,
  registered_user_id: authStore.user?.id || null,
  barangay_position_id: null,
  noted_by: '',
  noted_by_position_id: null,
  certified_by: '',
  certified_by_position_id: null,
})

const setupForm = ref(createEmptyForm())

// Bank accounts now carry a free-text bank_name instead of a bank_id
// selected from a fixed list. bank_id is kept only if the record already
// came back from the server with one attached (e.g. it matched an
// existing library entry) so we don't lose that link on edit.
const normalizeBankAccount = (account, index = 0) => ({
  id: account.id ?? `new-${Date.now()}-${index}`,
  bank_id: account.bank_id != null ? Number(account.bank_id) : null,
  bank_name:
    account.bank_name ||
    (typeof account.bank === 'string' ? account.bank : account.bank?.name) ||
    '',
  account_number: account.account_number || '',
  bank_status: account.bank_status || account.bankStatus || 'offline',
  is_default: Boolean(account.is_default),
})

const bankAccountsPayload = () =>
  bankAccounts.value.map((account, index) => ({
    id: typeof account.id === 'number' ? account.id : undefined,
    // Send bank_id when we have one (matches an existing library entry),
    // otherwise send bank_name so the backend can create/find the bank
    // in the library and link it.
    bank_id: account.bank_id || undefined,
    bank_name: account.bank_id ? undefined : account.bank_name,
    account_number: account.account_number,
    bank_status: account.bank_status,
    is_default: bankAccounts.value.some((item) => item.is_default)
      ? Boolean(account.is_default)
      : index === 0,
  }))

const resolveUserPositionId = () => {
  if (!positionOptions.value.length) return null

  const rawPosition =
    authStore.user?.position_name ||
    authStore.user?.position?.name ||
    authStore.user?.position ||
    ''

  const normalized = String(rawPosition).trim().toLowerCase()
  if (!normalized) return null

  const match = positionOptions.value.find((option) => {
    const optionName = String(option.name || '').trim().toLowerCase()
    return optionName === normalized
  })

  return match ? Number(match.value) : null
}

const loadPositions = async () => {
  loadingPositions.value = true
  try {
    const response = await api.get('/api/barangay/positions')
    positionOptions.value = (response.data || []).map((position) => ({
      name: position.name,
      value: Number(position.id),
    }))

    if (!setupForm.value.barangay_position_id) {
      const userPositionId = resolveUserPositionId()
      if (userPositionId != null) {
        setupForm.value.barangay_position_id = userPositionId
      }
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to load barangay positions',
      position: 'top',
    })
  } finally {
    loadingPositions.value = false
  }
}

/* -------------------- Signatories setup -------------------- */
const applyRecord = (record) => {
  if (!record) {
    setupForm.value = createEmptyForm()
    const userPositionId = resolveUserPositionId()
    if (userPositionId != null) {
      setupForm.value.barangay_position_id = userPositionId
    }
    bankAccounts.value = []
    preparedByName.value = userFullName.value
    displayInfo.value = { barangay: '', barangay_position: '' }
    return
  }

  setupForm.value = {
    id: record.id,
    barangay_id: record.barangay_id,
    registered_user_id: record.registered_user_id,
    barangay_position_id:
      record.barangay_position_id != null
        ? Number(record.barangay_position_id)
        : resolveUserPositionId(),
    noted_by: record.noted_by || '',
    noted_by_position_id:
      record.noted_by_position_id != null ? Number(record.noted_by_position_id) : null,
    certified_by: record.certified_by || '',
    certified_by_position_id:
      record.certified_by_position_id != null ? Number(record.certified_by_position_id) : null,
  }

  preparedByName.value = record.prepared_by || userFullName.value
  bankAccounts.value = (record.bank_accounts || []).map(normalizeBankAccount)
  displayInfo.value = {
    barangay: record.barangay || '',
    barangay_position: record.barangay_position || '',
  }
}

const loadSetup = async () => {
  try {
    const response = await api.get('/api/barangay/setup')
    const payload = response.data?.data ?? response.data

    // index route may return a single object or a list — handle both,
    // matching on the current user's barangay when it's a list
    let record = null
    if (Array.isArray(payload)) {
      record =
        payload.find((item) => item.barangay_id === authStore.user?.barangay_id) ||
        payload[0] ||
        null
    } else if (payload && typeof payload === 'object') {
      record = payload
    }

    applyRecord(record)
  } catch {
    // No existing setup yet is expected for a new barangay — start with an empty form
    applyRecord(null)
  }
}

const resetForm = async () => {
  await loadSetup()
  setupFormRef.value?.resetValidation()
}

const saveSetup = async () => {
  saving.value = true
  try {
    const payload = {
      barangay_id: setupForm.value.barangay_id,
      registered_user_id: setupForm.value.registered_user_id,
      barangay_position_id: setupForm.value.barangay_position_id,
      noted_by: setupForm.value.noted_by,
      noted_by_position_id: setupForm.value.noted_by_position_id,
      certified_by: setupForm.value.certified_by,
      certified_by_position_id: setupForm.value.certified_by_position_id,
      bank_accounts: bankAccountsPayload(),
    }

    const response = setupForm.value.id
      ? await api.put(`/api/barangay/setup/${setupForm.value.id}`, payload)
      : await api.post('/api/barangay/setup', payload)

    const record = response.data?.data
    applyRecord(record)

    // Refresh the shared bank library so any newly-typed bank names that
    // the backend just created show up elsewhere in the app immediately.
    bankStore.fetchBanks?.().catch(() => {})

    $q.notify({
      type: 'positive',
      message: response.data?.message || 'Barangay setup saved successfully',
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to save barangay setup',
      position: 'top',
    })
  } finally {
    saving.value = false
  }
}

const bankAccountColumns = [
  {
    name: 'bank',
    label: 'Bank',
    field: (row) => row.bank_name || '',
    align: 'left',
  },
  { name: 'account_number', label: 'Account Number', field: 'account_number', align: 'left' },
  { name: 'bank_status', label: 'Status', field: 'bank_status', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

const createEmptyBankAccountDialog = () => ({
  show: false,
  mode: 'add',
  editingId: null,
  bank_name: '',
  account_number: '',
  bank_status: 'offline',
  saving: false,
})

const bankAccountDialog = reactive(createEmptyBankAccountDialog())

const resetBankAccountDialog = () => {
  bankAccountDialog.mode = 'add'
  bankAccountDialog.editingId = null
  bankAccountDialog.bank_name = ''
  bankAccountDialog.account_number = ''
  bankAccountDialog.bank_status = 'offline'
  bankAccountDialog.saving = false
}

const openAddBankAccount = () => {
  resetBankAccountDialog()
  bankAccountDialog.show = true
  nextTick(() => bankAccountFormRef.value?.resetValidation())
}

const editBankAccount = (row) => {
  bankAccountDialog.mode = 'edit'
  bankAccountDialog.editingId = row.id
  bankAccountDialog.bank_name = row.bank_name || ''
  bankAccountDialog.account_number = row.account_number || ''
  bankAccountDialog.bank_status = row.bank_status || 'offline'
  bankAccountDialog.show = true
  nextTick(() => bankAccountFormRef.value?.resetValidation())
}

const isOnline = computed(() => bankAccountDialog.bank_status === 'online')
const isOffline = computed(() => bankAccountDialog.bank_status === 'offline')

const toggle = () => {
  bankAccountDialog.bank_status = isOffline.value ? 'online' : 'offline'
}

const saveBankAccount = async () => {
  bankAccountDialog.saving = true
  try {
    const typedName = bankAccountDialog.bank_name.trim()

    if (bankAccountDialog.mode === 'edit' && bankAccountDialog.editingId != null) {
      const existingIndex = bankAccounts.value.findIndex(
        (acc) => acc.id === bankAccountDialog.editingId,
      )
      if (existingIndex >= 0) {
        const existingAccount = bankAccounts.value[existingIndex]
        // If the bank name changed, drop any previously-linked bank_id so
        // the backend treats it as a (possibly new) bank on save.
        const bankNameChanged = existingAccount.bank_name !== typedName
        const updatedAccount = normalizeBankAccount({
          ...existingAccount,
          bank_id: bankNameChanged ? null : existingAccount.bank_id,
          bank_name: typedName,
          account_number: bankAccountDialog.account_number,
          bank_status: bankAccountDialog.bank_status,
        })

        bankAccounts.value = bankAccounts.value.map((acc) =>
          acc.id === existingAccount.id ? updatedAccount : acc,
        )
      }

      $q.notify({
        type: 'positive',
        message: 'Bank account updated. Save setup to apply changes.',
        position: 'top',
      })
    } else {
      const account = normalizeBankAccount({
        bank_name: typedName,
        account_number: bankAccountDialog.account_number,
        bank_status: bankAccountDialog.bank_status,
        is_default: bankAccounts.value.length === 0,
      })
      bankAccounts.value = [...bankAccounts.value, account]

      $q.notify({
        type: 'positive',
        message: 'Bank account added. Save setup to apply changes.',
        position: 'top',
      })
    }

    bankAccountDialog.show = false
    resetBankAccountDialog()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to save bank account',
      position: 'top',
    })
  } finally {
    bankAccountDialog.saving = false
  }
}

// const confirmDeleteBankAccount = (row) => {
//   $q.dialog({
//     title: 'Remove Bank Account',
//     message: `Remove ${row.bank_name || 'this bank'} — ${row.account_number}?`,
//     cancel: true,
//     persistent: true,
//   }).onOk(() => deleteBankAccount(row))
// }

// const deleteBankAccount = async (row) => {
//   deletingId.value = row.id
//   try {
//     bankAccounts.value = bankAccounts.value.filter((acc) => acc.id !== row.id)
//     $q.notify({
//       type: 'positive',
//       message: 'Bank account removed. Save setup to apply changes.',
//       position: 'top',
//     })
//   } catch (error) {
//     $q.notify({
//       type: 'negative',
//       message: error.response?.data?.message || 'Failed to remove bank account',
//       position: 'top',
//     })
//   } finally {
//     deletingId.value = null
//   }
// }

onMounted(async () => {
  if (!authStore.user) {
    await authStore.initialize()
  }

  preparedByName.value = userFullName.value

  await loadPositions()
  await loadSetup()
  await logPageVisit('Barangay Setup')
})
</script>

<style scoped>
.barangay-setup-page {
  background: whitesmoke;
  min-height: 100vh;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.signatory-panel {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px;
  background: white;
  height: 100%;
}

@media (max-width: 768px) {
  .barangay-setup-page {
    padding: 8px;
  }
}

.bank-status-toggle-wrap {
  display: inline-flex;
}
.status-toggle {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 33px;
  border-radius: 22px;
  border: 1px solid #d0d0d0;
  background: #f5f5f5;
  cursor: pointer;
  padding: 3px;
  box-sizing: border-box;
  outline: none;
}
.status-toggle:focus-visible {
  box-shadow: 0 0 0 2px rgba(24, 124, 25, 0.35);
}
.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  border-radius: 19px;
  background: #187c19;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
  z-index: 0;
}
.knob--offline {
  transform: translateX(100%);
  background: #c62828;
}
.label {
  position: relative;
  flex: 1;
  z-index: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #757575;
  transition: color 0.2s ease;
  pointer-events: none;
}
.label--active {
  color: #ffffff;
}
</style>
