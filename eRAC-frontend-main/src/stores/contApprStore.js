import { defineStore } from 'pinia'
import { api } from '../boot/axios'
import { useAuthStore } from './auth'

const authStore = useAuthStore()

export const useContApprStore = defineStore('continuing-appropriation', {
  state: () => ({
    years: [],
    selectedYear: null,
    continueAccounts: [],
    allContinueAccounts: [],
    continuingAppropriations: [],
    expenseHierarchy: [],
    loading: false,
    error: null,
    selectedRow: null,
  }),

  getters: {
    fiscalYearOptions: (state) => state.years,

    fiscalYears: (state) => state.years.map((y) => String(y.label)),

    selectedFiscalYear: (state) => state.selectedYear,

    availableContinueAccounts: (state) => {
      return state.continueAccounts.filter(
        (account) => Number(account.balance) > 0,
      )
    },
  },

  actions: {
    getAuthConfig() {
      const authStore = useAuthStore()

      const token = authStore.admin
        ? authStore.adminToken
        : authStore.token

      if (!token) {
        throw new Error('Authentication token not found')
      }

      return {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    },

    buildAdminParams() {
      const authStore = useAuthStore()
      const params = {}

      if (authStore.admin) {
        const selectedBarangay = authStore.getSelectedBarangay()

        if (selectedBarangay) {
          params.barangay_id = selectedBarangay
        }
      }

      return params
    },  

    extractRows(responseData) {
      return (
        responseData?.data?.rows ||
        (Array.isArray(responseData?.data)
          ? responseData.data
          : null) ||
        responseData?.rows ||
        []
      )
    },

    parseAmount(value) {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0
      }

      if (
        value === null ||
        value === undefined ||
        value === ''
      ) {
        return 0
      }

      const parsed = Number(
        String(value).replace(/[₱,\s]/g, ''),
      )

      return Number.isFinite(parsed) ? parsed : 0
    },

    remainingAmountFrom(row) {
      if (
        row?.remaining_amount != null &&
        row.remaining_amount !== ''
      ) {
        return this.parseAmount(row.remaining_amount)
      }

      if (
        row?.remainingAmount != null &&
        row.remainingAmount !== ''
      ) {
        return this.parseAmount(row.remainingAmount)
      }

      if (
        row?.balance != null &&
        row.balance !== ''
      ) {
        return this.parseAmount(row.balance)
      }

      if (
        row?.total_amount != null &&
        row.total_amount !== ''
      ) {
        return (
          this.parseAmount(row.total_amount) -
          this.parseAmount(row.details_amount)
        )
      }

      if (
        row?.amount != null &&
        row.amount !== ''
      ) {
        return this.parseAmount(row.amount)
      }

      return this.parseAmount(
        row?.unappropriated ??
        row?.current_amount,
      )
    },

    pickAccountName(...values) {
      for (const value of values) {
        if (value == null || value === '') {
          continue
        }

        if (typeof value === 'object') {
          const nested = this.pickAccountName(
            value.name,
            value.label,
            value.title,
          )

          if (nested) {
            return nested
          }

          continue
        }

        return String(value)
      }

      return ''
    },

    getChildren(node) {
      if (!node || typeof node !== 'object') {
        return []
      }

      const childKeys = [
        'expenseTypes',
        'expense_types',
        'items',
        'expenseItems',
        'expense_items',
        'subItems',
        'sub_items',
        'subTypes',
        'sub_types',
        'subSubTypes',
        'sub_sub_types',
        'children',
      ]

      const seen = new Set()
      const children = []

      childKeys.forEach((key) => {
        const list = node[key]

        if (!Array.isArray(list)) {
          return
        }

        list.forEach((child, index) => {
          if (!child || typeof child !== 'object') {
            return
          }

          const mark =
            child?.id != null
              ? `${key}:id:${child.id}`
              : `${key}:index:${index}:${JSON.stringify(child)}`

          if (seen.has(mark)) {
            return
          }

          seen.add(mark)
          children.push(child)
        })
      })

      return children
    },

    normalizeSubSubTypes(list) {
      if (!Array.isArray(list)) {
        return []
      }

      return list
        .map((node) => ({
          id: node?.id,

          name: this.pickAccountName(
            node?.name,
            node?.expenseSubSubType,
            node?.expense_sub_sub_type,
          ),
        }))
        .filter((node) => node.name)
    },

    normalizeSubTypes(list) {
      if (!Array.isArray(list)) {
        return []
      }

      return list
        .map((node) => ({
          id: node?.id,

          name: this.pickAccountName(
            node?.name,
            node?.expenseSubType,
            node?.expense_sub_type,
          ),

          subSubTypes: this.normalizeSubSubTypes(
            node?.subSubTypes ||
              node?.sub_sub_types ||
              node?.children,
          ),
        }))
        .filter(
          (node) =>
            node.name ||
            node.subSubTypes.length,
        )
    },

    normalizeSubItems(list) {
      if (!Array.isArray(list)) {
        return []
      }

      return list
        .map((node) => ({
          id: node?.id,

          name: this.pickAccountName(
            node?.name,
            node?.expenseSubItem,
            node?.expense_sub_item,
          ),

          subTypes: this.normalizeSubTypes(
            node?.subTypes ||
              node?.sub_types ||
              node?.children,
          ),
        }))
        .filter(
          (node) =>
            node.name ||
            node.subTypes.length,
        )
    },

    normalizeExpenseTypes(list) {
      if (!Array.isArray(list)) {
        return []
      }

      return list
        .map((node) => ({
          id: node?.id,

          name: this.pickAccountName(
            node?.name,
            node?.expenseType,
            node?.expense_type,
          ),

          items: (
            node?.items ||
            node?.expenseItems ||
            node?.children ||
            []
          )
            .map((item) => ({
              id: item?.id,

              name: this.pickAccountName(
                item?.name,
                item?.expenseItem,
                item?.expense_item,
              ),

              subItems: this.normalizeSubItems(
                item?.subItems ||
                  item?.sub_items ||
                  item?.children,
              ),
            }))
            .filter(
              (item) =>
                item.name ||
                item.subItems.length,
            ),
        }))
        .filter(
          (node) =>
            node.name ||
            node.items.length,
        )
    },

    normalizeContinuingAccount(row) {
      const expenseClass =
        this.pickAccountName(
          row?.expenseClass,
          row?.expense_class,
        )

      const expenseType =
        this.pickAccountName(
          row?.expenseType,
          row?.expense_type,
        )

      const expenseItem =
        this.pickAccountName(
          row?.expenseItem,
          row?.expense_item,
        )

      const expenseSubItem =
        this.pickAccountName(
          row?.expenseSubItem,
          row?.expense_sub_item,
        )

      const expenseSubType =
        this.pickAccountName(
          row?.expenseSubType,
          row?.expense_sub_type,
        )

      const expenseSubSubType =
        this.pickAccountName(
          row?.expenseSubSubType,
          row?.expense_sub_sub_type,
        )

      const expenseTypes =
        this.normalizeExpenseTypes(
          row?.expenseTypes ||
            row?.expense_types,
        )

      const subItems =
        this.normalizeSubItems(
          row?.subItems ||
            row?.sub_items,
        )

      const displayPath = [
        expenseClass,
        expenseType,
        expenseItem,
        expenseSubItem,
        expenseSubType,
        expenseSubSubType,
      ].filter(Boolean)

      const remaining =
        this.remainingAmountFrom(row)

      const year =
        row?.year ??
        row?.fiscal_year ??
        row?.budget?.fiscalYear?.year ??
        row?.fiscalYear?.year ??
        ''

      const tranAppropriationId =
        row?.tranAppropriationId ??
        row?.tran_appropriation_id ??
        row?.tranAppropriation_id ??
        row?.id

      const account = {
        id: tranAppropriationId,

        sourceId: tranAppropriationId,

        rowId: row?.id,

        rowKey: [
          row?.id,
          year,
          expenseClass,
          expenseType,
          expenseItem,
          expenseSubItem,
          expenseSubType,
          expenseSubSubType,
        ]
          .filter(
            (part) =>
              part !== undefined &&
              part !== null &&
              part !== '',
          )
          .join('-'),

        year,

        expenseClass,
        expenseType,
        expenseItem,
        expenseSubItem,
        expenseSubType,
        expenseSubSubType,

        expenseTypes,
        subItems,

        accountName:
          displayPath.join(' > ') ||
          '(Unnamed account)',

        balance:
          remaining > 0 ? remaining : 0,

        tranAppropriationId,

        tran_appropriation_id:
          tranAppropriationId,

        barangay_id:
          row?.barangay_id ??
          row?.barangayId ??
          null,

        continuingAppropriationId:
          row?.continuingAppropriationId ??
          row?.continuing_appropriation_id ??
          row?.contAppropriation_id ??
          null,

        rawAmount: remaining,
      }

      account.displayLines =
        this.buildAccountDisplayLines(account)

      return account
    },

    buildAccountDisplayLines(account) {
      const lines = []

      const push = (name, indent) => {
        if (!name) {
          return
        }

        lines.push({
          name,
          indent,
        })
      }

      const pushSubItems = (
        items,
        indent,
      ) => {
        if (!Array.isArray(items)) {
          return
        }

        items.forEach((subItem) => {
          push(
            subItem.name,
            indent,
          )

          if (
            Array.isArray(
              subItem.subTypes,
            )
          ) {
            subItem.subTypes.forEach(
              (subType) => {
                push(
                  subType.name,
                  indent + 1,
                )

                if (
                  Array.isArray(
                    subType.subSubTypes,
                  )
                ) {
                  subType.subSubTypes.forEach(
                    (subSubType) => {
                      push(
                        subSubType.name,
                        indent + 2,
                      )
                    },
                  )
                }
              },
            )
          }
        })
      }

      push(
        account?.expenseClass,
        0,
      )

      if (
        account?.expenseTypes?.length
      ) {
        account.expenseTypes.forEach(
          (type) => {
            push(type.name, 1)

            ;(type.items || []).forEach(
              (item) => {
                push(item.name, 2)

                pushSubItems(
                  item.subItems,
                  3,
                )
              },
            )
          },
        )

        return lines
      }

      push(
        account?.expenseType,
        1,
      )

      push(
        account?.expenseItem,
        2,
      )

      if (
        account?.subItems?.length
      ) {
        pushSubItems(
          account.subItems,
          3,
        )

        return lines
      }

      push(
        account?.expenseSubItem,
        3,
      )

      push(
        account?.expenseSubType,
        4,
      )

      push(
        account?.expenseSubSubType,
        5,
      )

      return lines.length
        ? lines
        : [
            {
              name:
                account?.accountName ||
                '(Unnamed account)',
              indent: 0,
            },
          ]
    },

    /*
     * Flatten:
     *
     * Class
     *   -> Type
     *      -> Item
     *         -> Sub Item
     *            -> Sub Type
     *               -> Sub Sub Type
     *
     * into selectable rows.
     */
        flattenAccountRow(
          row,
          // index = 0, 
        ) 
        {
          const explicitAccounts = []
          const seenAccountIds = new Set()

          const pick = (...values) => {
            for (const value of values) {
              if (
                value !== undefined &&
                value !== null &&
                value !== ''
              ) {
                return value
              }
            }

            return ''
          }

          const walkExplicitAccounts = (
            node,
            path = {},
          ) => {
            if (
              !node ||
              typeof node !== 'object'
            ) {
              return
            }

            const currentPath = {
              year: pick(
                node?.year,
                path.year,
              ),

              expenseClass: pick(
                node?.expenseClass,
                node?.expense_class,
                path.expenseClass,
              ),

              expenseType: pick(
                node?.expenseType,
                node?.expense_type,
                path.expenseType,
              ),

              expenseItem: pick(
                node?.expenseItem,
                node?.expense_item,
                path.expenseItem,
              ),

              expenseSubItem: pick(
                node?.expenseSubItem,
                node?.expense_sub_item,
                path.expenseSubItem,
              ),

              expenseSubType: pick(
                node?.expenseSubType,
                node?.expense_sub_type,
                path.expenseSubType,
              ),

              expenseSubSubType: pick(
                node?.expenseSubSubType,
                node?.expense_sub_sub_type,
                path.expenseSubSubType,
              ),
            }

            if (
              Array.isArray(
                node.accounts,
              )
            ) {
              node.accounts.forEach(
                (sourceAccount) => {
                  if (
                    !sourceAccount ||
                    typeof sourceAccount !==
                      'object'
                  ) {
                    return
                  }

                  const tranId =
                    sourceAccount?.tranAppropriationId ??
                    sourceAccount?.tran_appropriation_id ??
                    sourceAccount?.tranAppropriation_id ??
                    sourceAccount?.id

                  if (
                    tranId === null ||
                    tranId === undefined ||
                    tranId === ''
                  ) {
                    return
                  }

                  const numericTranId =
                    Number(tranId)

                  if (
                    !Number.isInteger(
                      numericTranId,
                    ) ||
                    numericTranId <= 0
                  ) {
                    return
                  }

                  const idKey =
                    String(numericTranId)

                  if (
                    seenAccountIds.has(idKey)
                  ) {
                    return
                  }

                  const mergedAccount = {
                    ...sourceAccount,

                    id: numericTranId,

                    tranAppropriationId:
                      numericTranId,

                    tran_appropriation_id:
                      numericTranId,

                    tranAppropriation_id:
                      numericTranId,

                    year: pick(
                      sourceAccount?.year,
                      currentPath.year,
                    ),

                    expenseClass: pick(
                      sourceAccount?.expenseClass,
                      sourceAccount?.expense_class,
                      currentPath.expenseClass,
                    ),

                    expenseType: pick(
                      sourceAccount?.expenseType,
                      sourceAccount?.expense_type,
                      currentPath.expenseType,
                    ),

                    expenseItem: pick(
                      sourceAccount?.expenseItem,
                      sourceAccount?.expense_item,
                      currentPath.expenseItem,
                    ),

                    expenseSubItem: pick(
                      sourceAccount?.expenseSubItem,
                      sourceAccount?.expense_sub_item,
                      currentPath.expenseSubItem,
                    ),

                    expenseSubType: pick(
                      sourceAccount?.expenseSubType,
                      sourceAccount?.expense_sub_type,
                      currentPath.expenseSubType,
                    ),

                    expenseSubSubType: pick(
                      sourceAccount?.expenseSubSubType,
                      sourceAccount?.expense_sub_sub_type,
                      currentPath.expenseSubSubType,
                    ),

                    barangay_id:
                      sourceAccount?.barangay_id ??
                      sourceAccount?.barangayId ??
                      row?.barangay_id ??
                      null,
                  }

                  const normalized =
                    this.normalizeContinuingAccount(
                      mergedAccount,
                    )

                  if (
                    Number(
                      normalized.balance,
                    ) <= 0
                  ) {
                    return
                  }

                  normalized.id =
                    numericTranId

                  normalized.sourceId =
                    numericTranId

                  normalized.rowId =
                    numericTranId

                  normalized.accountId =
                    numericTranId

                  normalized.tranAppropriationId =
                    numericTranId

                  normalized.tran_appropriation_id =
                    numericTranId

                  normalized.tranAppropriation_id =
                    numericTranId

                  normalized.barangay_id =
                    mergedAccount.barangay_id

                  normalized.rowKey =
                    `tran-${numericTranId}-${normalized.year ?? ''}`

                  normalized.displayLines =
                    this.buildAccountDisplayLines(
                      normalized,
                    )

                  seenAccountIds.add(
                    idKey,
                  )

                  explicitAccounts.push(
                    normalized,
                  )
                },
              )
            }

            const childArrays = [
              node?.subItems,
              node?.sub_items,
              node?.subTypes,
              node?.sub_types,
              node?.subSubTypes,
              node?.sub_sub_types,
              node?.items,
              node?.expenseItems,
              node?.expense_items,
              node?.expenseTypes,
              node?.expense_types,
              node?.children,
            ]

            childArrays.forEach(
              (children) => {
                if (
                  !Array.isArray(children)
                ) {
                  return
                }

                children.forEach(
                  (child) => {
                    walkExplicitAccounts(
                      child,
                      currentPath,
                    )
                  },
                )
              },
            )
          }

          if (
            !row ||
            typeof row !== 'object'
          ) {
            return []
          }

          const initialPath = {
            year:
              row?.year ??
              row?.fiscal_year ??
              row?.budget?.fiscalYear?.year ??
              row?.fiscalYear?.year ??
              '',

            expenseClass:
              this.pickAccountName(
                row?.expenseClass,
                row?.expense_class,
                row?.class_name,
                row?.className,
              ),

            expenseType:
              this.pickAccountName(
                row?.expenseType,
                row?.expense_type,
              ),

            expenseItem:
              this.pickAccountName(
                row?.expenseItem,
                row?.expense_item,
              ),

            expenseSubItem:
              this.pickAccountName(
                row?.expenseSubItem,
                row?.expense_sub_item,
              ),

            expenseSubType:
              this.pickAccountName(
                row?.expenseSubType,
                row?.expense_sub_type,
              ),

            expenseSubSubType:
              this.pickAccountName(
                row?.expenseSubSubType,
                row?.expense_sub_sub_type,
              ),
          }

          walkExplicitAccounts(
            row,
            initialPath,
          )

          if (
            explicitAccounts.length > 0
          ) {
            return explicitAccounts
          }

          const balance =
            this.remainingAmountFrom(row)

          const tranAppropriationId =
            row?.tranAppropriationId ??
            row?.tran_appropriation_id ??
            row?.tranAppropriation_id ??
            row?.id

          if (
            balance > 0 &&
            Number.isInteger(
              Number(tranAppropriationId),
            )
          ) {
            const numericId =
              Number(tranAppropriationId)

            const normalized =
              this.normalizeContinuingAccount({
                ...row,

                id: numericId,

                tranAppropriationId:
                  numericId,

                tran_appropriation_id:
                  numericId,

                tranAppropriation_id:
                  numericId,
              })

            normalized.id =
              numericId

            normalized.sourceId =
              numericId

            normalized.rowId =
              numericId

            normalized.accountId =
              numericId

            normalized.tranAppropriationId =
              numericId

            normalized.tran_appropriation_id =
              numericId

            normalized.tranAppropriation_id =
              numericId

            return [normalized]
          }

          return []
        },

    /*
     * Walks:
     *
     * Class
     * -> Types
     * -> Items
     * -> Sub Items
     * -> Sub Types
     * -> Sub Sub Types
     */
    walkExpenseNode(
      node,
      path,
      results,
      index = 0,
    ) 
    {
      if (
        !node ||
        typeof node !== 'object'
      ) {
        return
      }

      const currentPath = {
        ...path,

        expenseClass:
          this.pickAccountName(
            node?.expenseClass,
            node?.expense_class,
          ) ||
          path.expenseClass,

        expenseType:
          this.pickAccountName(
            node?.expenseType,
            node?.expense_type,
          ) ||
          path.expenseType,

        expenseItem:
          this.pickAccountName(
            node?.expenseItem,
            node?.expense_item,
          ) ||
          path.expenseItem,

        expenseSubItem:
          this.pickAccountName(
            node?.expenseSubItem,
            node?.expense_sub_item,
          ) ||
          path.expenseSubItem,

        expenseSubType:
          this.pickAccountName(
            node?.expenseSubType,
            node?.expense_sub_type,
          ) ||
          path.expenseSubType,

        expenseSubSubType:
          this.pickAccountName(
            node?.expenseSubSubType,
            node?.expense_sub_sub_type,
          ) ||
          path.expenseSubSubType,
      }

      const balance =
        this.remainingAmountFrom(node)

      if (balance > 0) {
        const displayPath = [
          currentPath.expenseClass,
          currentPath.expenseType,
          currentPath.expenseItem,
          currentPath.expenseSubItem,
          currentPath.expenseSubType,
          currentPath.expenseSubSubType,
        ].filter(Boolean)

        results.push({
          id: currentPath.rowId,

          sourceId:
            currentPath.rowId,

          rowId:
            currentPath.rowId,

          rowKey:
            [
              currentPath.rowId,
              currentPath.year,
              ...displayPath,
            ]
              .filter(
                (p) =>
                  p !== undefined &&
                  p !== null &&
                  p !== '',
              )
              .join('-') ||
            `account-${index}-${results.length}-${node?.id || ''}`,

          year:
            currentPath.year,

          expenseClass:
            currentPath.expenseClass,

          expenseType:
            currentPath.expenseType,

          expenseItem:
            currentPath.expenseItem,

          expenseSubItem:
            currentPath.expenseSubItem,

          expenseSubType:
            currentPath.expenseSubType,

          expenseSubSubType:
            currentPath.expenseSubSubType,

          accountName:
            displayPath.join(' > ') ||
            '(Unnamed account)',

          balance,
        })
      }

      const types =
        node?.expenseTypes ||
        node?.expense_types ||
        node?.subItems ||
        node?.sub_items

      if (Array.isArray(types)) {
        types.forEach(
          (type) =>
            this.walkExpenseNode(
              type,
              {
                ...currentPath,

                expenseType:
                  this.pickAccountName(
                    type?.name,
                    type?.expenseType,
                    type?.expense_type,
                  ) ||
                  currentPath.expenseType,
              },
              results,
              index,
            ),
        )
      }

      const items =
        node?.items ||
        node?.expenseItems ||
        node?.expense_items

      if (Array.isArray(items)) {
        items.forEach(
          (item) =>
            this.walkExpenseNode(
              item,
              {
                ...currentPath,

                expenseItem:
                  this.pickAccountName(
                    item?.name,
                    item?.expenseItem,
                    item?.expense_item,
                  ) ||
                  currentPath.expenseItem,
              },
              results,
              index,
            ),
        )
      }

      const subItems =
        node?.subItems ||
        node?.sub_items

      if (Array.isArray(subItems)) {
        subItems.forEach(
          (subItem) =>
            this.walkExpenseNode(
              subItem,
              {
                ...currentPath,

                expenseSubItem:
                  this.pickAccountName(
                    subItem?.name,
                    subItem?.expenseSubItem,
                    subItem?.expense_sub_item,
                  ) ||
                  currentPath.expenseSubItem,
              },
              results,
              index,
            ),
        )
      }

      const subTypes =
        node?.subTypes ||
        node?.sub_types

      if (Array.isArray(subTypes)) {
        subTypes.forEach(
          (subType) =>
            this.walkExpenseNode(
              subType,
              {
                ...currentPath,

                expenseSubType:
                  this.pickAccountName(
                    subType?.name,
                    subType?.expenseSubType,
                    subType?.expense_sub_type,
                  ) ||
                  currentPath.expenseSubType,
              },
              results,
              index,
            ),
        )
      }

      const subSubTypes =
        node?.subSubTypes ||
        node?.sub_sub_types

      if (Array.isArray(subSubTypes)) {
        subSubTypes.forEach(
          (subSubType) =>
            this.walkExpenseNode(
              subSubType,
              {
                ...currentPath,

                expenseSubSubType:
                  this.pickAccountName(
                    subSubType?.name,
                    subSubType?.expenseSubSubType,
                    subSubType?.expense_sub_sub_type,
                  ) ||
                  currentPath.expenseSubSubType,
              },
              results,
              index,
            ),
        )
      }
    },

    isAlreadyContinued(account) {
      const normalize = (value) =>
        String(value ?? '')
          .trim()
          .toLowerCase()

      const getId = (value) => {
        if (
          value === null ||
          value === undefined ||
          value === ''
        ) {
          return ''
        }

        return String(value).trim()
      }

      const accountTranId =
        getId(
          account?.tranAppropriationId ??
            account?.tran_appropriation_id ??
            account?.sourceId ??
            account?.id,
        )

      const accountName =
        normalize(
          account?.accountName,
        )

      const accountYear =
        normalize(account?.year)

      if (
        !accountTranId &&
        !accountName
      ) {
        return false
      }

      return this.continuingAppropriations.some(
        (appropriation) => {
          const accounts =
            Array.isArray(
              appropriation?.accounts,
            )
              ? appropriation.accounts
              : []

          return accounts.some(
            (continuedAccount) => {
              const continuedTranId =
                getId(
                  continuedAccount?.tranAppropriationId ??
                    continuedAccount?.tran_appropriation_id,
                )

              if (
                accountTranId &&
                continuedTranId
              ) {
                return (
                  continuedTranId ===
                  accountTranId
                )
              }

              const continuedName =
                normalize(
                  continuedAccount?.accountName,
                )

              const continuedYear =
                normalize(
                  continuedAccount?.year,
                )

              return (
                !!accountName &&
                continuedName ===
                  accountName &&
                (!accountYear ||
                  !continuedYear ||
                  continuedYear ===
                    accountYear)
              )
            },
          )
        },
      )
    },

    getAvailableContinueAccounts() {
      return this.continueAccounts.filter(
        (account) => {
          const hasBalance =
            Number(account?.balance) > 0

          if (!hasBalance) {
            return false
          }

          return !this.isAlreadyContinued(
            account,
          )
        },
      )
    },

    async fetchContinueAccounts() 
    {
      const authStore = useAuthStore()

      const config =
        this.getAuthConfig()

      const endpoint =
        authStore.admin
          ? '/api/admin/continuing-appropriations'
          : '/api/barangay/continuing-appropriations'

      const params =
        this.buildAdminParams()

      try {
        this.loading = true
        this.error = null

        const response =
          await api.get(endpoint, {
            ...config,
            params,
          })

        if (
          response.data?.status ===
          false
        ) {
          this.continueAccounts = []
          this.allContinueAccounts = []

          this.error =
            response.data?.message ||
            'Failed to fetch continue accounts'

          return []
        }

        const rows =
          this.extractRows(
            response.data,
          )

        const responseBarangayId =
          Number(
            response.data?.barangay_id ||
              0,
          )

        console.log(
          '[Continuing Accounts] Raw API rows:',
          rows,
        )

        console.log(
          '[Continuing Accounts] API barangay_id:',
          responseBarangayId,
        )

        const allAccounts =
          rows.flatMap(
            (row, index) => {
              const flattened =
                this.flattenAccountRow(
                  row,
                  index,
                )

              if (
                flattened.length > 0
              ) {
                return flattened
              }

              const normalized =
                this.normalizeContinuingAccount(
                  row,
                )

              if (
                Number(
                  normalized.balance,
                ) > 0
              ) {
                return [normalized]
              }

              return []
            },
          )

        /*
         * IMPORTANT:
         *
         * Do not allow accounts from another
         * barangay into Pinia state.
         *
         * The backend should already filter these,
         * but this provides a second safety layer.
         */
        const barangaySafeAccounts =
          responseBarangayId
            ? allAccounts.filter(
                (account) =>
                  Number(
                    account?.barangay_id,
                  ) ===
                  responseBarangayId,
              )
            : allAccounts

        if (
          responseBarangayId &&
          barangaySafeAccounts.length !==
            allAccounts.length
        ) {
          console.warn(
            '[Continuing Accounts] Removed cross-barangay accounts:',
            allAccounts
              .filter(
                (account) =>
                  Number(
                    account?.barangay_id,
                  ) !==
                  responseBarangayId,
              )
              .map(
                (account) => ({
                  id:
                    account?.tranAppropriationId ??
                    account?.id,

                  barangay_id:
                    account?.barangay_id,
                }),
              ),
          )
        }

        const uniqueAccounts =
          Array.from(
            new Map(
              barangaySafeAccounts.map(
                (
                  account,
                  index,
                ) => [
                  account.rowKey ||
                    `tran-${account.sourceId}-${index}`,
                  account,
                ],
              ),
            ).values(),
          )

        this.allContinueAccounts =
          uniqueAccounts

        this.continueAccounts =
          uniqueAccounts.filter(
            (account) => {
              const hasBalance =
                Number(
                  account?.balance,
                ) > 0

              if (!hasBalance) {
                return false
              }

              return !this.isAlreadyContinued(
                account,
              )
            },
          )

        console.log(
          '[Continuing Accounts] All normalized accounts:',
          this.allContinueAccounts,
        )

        console.log(
          '[Continuing Accounts] Selectable accounts:',
          this.continueAccounts,
        )

        return this.continueAccounts
      } catch (error) {
        console.error(
          '[Continuing Accounts] Failed to fetch:',
          error,
        )

        this.error =
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch continue accounts'

        this.continueAccounts = []
        this.allContinueAccounts = []

        return []
      } finally {
        this.loading = false
      }
    },

    setSelectedFiscalYear(value) {
      this.selectedYear = value
    },

    async initialize() {
      this.loading = true
      this.error = null

      try {
        await this.fetchYears()

        await this.fetchContinuingAppropriations(
          this.selectedYear,
        )

        await this.fetchContinueAccounts()
      } finally {
        this.loading = false
      }
    },

    async fetchYears() 
    {
      const authStore = useAuthStore()

      const config =
        this.getAuthConfig()

      const endpoint =
        authStore.admin
          ? '/api/admin/fiscal-years'
          : '/api/barangay/fiscal-years'

      try {
        const response =
          await api.get(
            endpoint,
            config,
          )

        const currentYear =
          new Date().getFullYear()

        const rawYears =
          response.data.data || []

        const filteredYears =
          rawYears.filter(
            (y) =>
              Number(y.year) !==
              currentYear,
          )

        const uniqueByYear =
          new Map()

        for (const y of filteredYears) {
          const yearKey =
            String(y.year)

          if (
            !uniqueByYear.has(
              yearKey,
            )
          ) {
            uniqueByYear.set(
              yearKey,
              {
                label: yearKey,
                value: y.id,
                year: Number(
                  y.year,
                ),
              },
            )
          }
        }

        const uniqueYears =
          Array.from(
            uniqueByYear.values(),
          ).sort(
            (a, b) =>
              b.year - a.year,
          )

        this.years =
          uniqueYears.map(
            ({
              label,
              value,
            }) => ({
              label,
              value,
            }),
          )

        this.selectedYear =
          uniqueYears.length > 0
            ? uniqueYears[0].value
            : null

        if (
          filteredYears.length >
          0
        ) {
          const latest =
            filteredYears.reduce(
              (max, y) =>
                Number(y.year) >
                Number(max.year)
                  ? y
                  : max,
            )

          this.selectedYear =
            latest.id
        } else {
          this.selectedYear =
            null
        }
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          error.message

        this.years = []
      } finally {
        this.loading = false
      }
    },

    async fetchContinuingAppropriations(fiscalYearId = null,) 
    {
      const authStore =
        useAuthStore()

      const config =
        this.getAuthConfig()

      const params = {
        ...this.buildAdminParams(),
      }

      const yearId =
        fiscalYearId ??
        this.selectedYear

      if (yearId) {
        params.fiscal_year_id =
          yearId
      }

      try {
        this.loading = true

        const endpoint =
          authStore.admin
            ? '/api/admin/continuing-appropriations/list'
            : '/api/barangay/continuing-appropriations/list'

        const response =
          await api.get(
            endpoint,
            {
              ...config,
              params,
            },
          )

        if (
          response.data?.status ===
          false
        ) {
          this.error =
            response.data.message ||
            'Failed to fetch continuing appropriations'

          this.continuingAppropriations =
            []

          return []
        }

        const data =
          this.extractRows(
            response.data,
          )

        this.continuingAppropriations =
          data.map((item) => ({
            ...item,

            accounts: (
              item.accounts || []
            ).map(
              (account) => {
                const tranId =
                  account?.tranAppropriationId ??
                  account?.tran_appropriation_id ??
                  account?.tranAppropriation_id ??
                  account?.transactionAppropriation?.id

                const normalized =
                  this.normalizeContinuingAccount(
                    {
                      ...account,

                      id:
                        tranId ??
                        account?.id,

                      tranAppropriationId:
                        tranId ??
                        account?.id,

                      tran_appropriation_id:
                        tranId ??
                        account?.id,

                      tranAppropriation_id:
                        tranId ??
                        account?.id,
                    },
                  )

                return {
                  ...normalized,

                  continuingAppropriationId:
                    account?.continuingAppropriationId ??
                    account?.contAppropriationId ??
                    account?.contAppropriation_id ??
                    item?.id ??
                    null,

                  contAppropriationId:
                    account?.contAppropriationId ??
                    account?.contAppropriation_id ??
                    item?.id ??
                    null,
                }
              },
            ),
          }))

        return this.continuingAppropriations
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          error.message

        this.continuingAppropriations =
          []

        return []
      } finally {
        this.loading = false
      }
    },

    async createContinuingAppropriation(
      data,
    ) 
    {
      const config =
        this.getAuthConfig()

      try {
        this.loading = true

        const endpoint =
          authStore.admin
            ? '/api/admin/continuing-appropriations'
            : '/api/barangay/continuing-appropriations'

        const response =
          await api.post(
            endpoint,
            data,
            config,
          )

        if (
          response.data.status
        ) {
          await this.fetchContinuingAppropriations(
            this.selectedYear,
          )

          await this.fetchContinueAccounts()

          return {
            success: true,
            data:
              response.data.data,
          }
        }

        this.error =
          response.data.message ||
          'Failed to create continuing appropriation'

        return {
          success: false,
          message:
            response.data.message,
        }
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          error.message

        return {
          success: false,
          message: this.error,
        }
      } finally {
        this.loading = false
      }
    },

    async updateContinuingAppropriationStatus(
      id,
      status,
    ) 
    {
      const config =
        this.getAuthConfig()

      try {
        this.loading = true

        const response =
          await api.patch(
            `/api/barangay/continuing-appropriations/${id}/status`,
            { status },
            config,
          )

        if (
          response.data.status
        ) {
          const index =
            this.continuingAppropriations.findIndex(
              (item) =>
                item.id === id,
            )

          if (index !== -1) {
            this.continuingAppropriations[
              index
            ].status = status
          }

          return {
            success: true,
            data:
              response.data.data,
          }
        }

        this.error =
          response.data.message ||
          'Failed to update status'

        return {
          success: false,
          message:
            response.data.message,
        }
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          error.message

        return {
          success: false,
          message: this.error,
        }
      } finally {
        this.loading = false
      }
    },

    async fetchExpenseHierarchy(
      fiscalYearId,
      budgetId = null,
    ) 
    {
      const config =
        this.getAuthConfig()

      try {
        const params = {
          fiscal_year_id:
            fiscalYearId,
        }

        if (budgetId) {
          params.budget_id =
            budgetId
        }

        const response =
          await api.get(
            '/api/barangay/expense-hierarchy',
            {
              ...config,
              params,
            },
          )

        if (
          response.data.status
        ) {
          this.expenseHierarchy =
            response.data.data

          return this.expenseHierarchy
        }

        this.error =
          response.data.message ||
          'Failed to fetch expense hierarchy'

        return []
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          error.message

        return []
      }
    },

    async commitAllocation(
      id,
      allocations,
    ) 
    {
      const config =
        this.getAuthConfig()

      try {
        const response =
          await api.post(
            `/api/barangay/continuing-appropriations/${id}/allocate`,
            {
              allocations,
            },
            config,
          )

        if (
          response.data.status
        ) {
          const index =
            this.continuingAppropriations.findIndex(
              (item) =>
                item.id === id,
            )

          if (index !== -1) {
            this.continuingAppropriations[
              index
            ] = {
              ...this
                .continuingAppropriations[
                index
              ],

              ...response.data
                .data,
            }
          }

          return {
            success: true,
            data:
              response.data.data,
          }
        }

        throw new Error(
          response.data.message ||
            'Failed to commit allocation',
        )
      } catch (error) {
        throw new Error(
          error.response?.data?.message ||
            error.message,
        )
      }
    },

    formatCurrency(value) {
      if (
        !value &&
        value !== 0
      ) {
        return '₱0.00'
      }

      return new Intl.NumberFormat(
        'en-PH',
        {
          style: 'currency',
          currency: 'PHP',
        },
      ).format(value)
    },

    formatDate(date) {
      if (!date) {
        return '-'
      }

      return new Date(
        date,
      ).toLocaleDateString(
        'en-PH',
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        },
      )
    },
  },
})
