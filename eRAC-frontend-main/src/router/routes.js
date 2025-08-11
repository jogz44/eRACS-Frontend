const routes = [
  {
    // Landing Page
    path: '/',
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      {
        name: 'Login',
        path: '',
        component: () => import('src/pages/Accounts/LoginPage.vue'),
      },

      {
        path: 'signup',
        name: 'Signup',
        component: () => import('src/pages/Accounts/SignupPage.vue'),
      },

      {
        path: 'admin/login',
        name: 'Admin',
        component: () => import('pages/Admin/LoginPage.vue'),
      },

      {
        path: 'forgotpage',
        name: 'forgotpage',
        component: () => import('src/pages/Accounts/ForgotPage.vue'),
      },
    ],
  },

  {
    path: '/reset-password',
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      {
        name: 'ResetPassword',
        path: '',
        component: () => import('src/pages/Accounts/ResetPasswordPage.vue'),
      },
    ],
  },

  {
    path: '/home',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // Dashboard
      {
        path: 'dashboard',
        name: 'UserDashboard',
        component: () => import('src/pages/User/DashBoard.vue'),
        meta: { title: 'Dashboard' },
      },
      // Transactions
      {
        path: 'transactions',
        name: 'Transactions',
        redirect: '/home/transactions/appropriation', // Empty component for parent
        children: [
          {
            path: 'appropriation',
            name: 'Appropriation',
            component: () => import('src/pages/User/Transaction/AppropriationTran.vue'),
          },
          {
            path: 'disbursement',
            name: 'Disbursement',
            component: () => import('src/pages/User/Transaction/DisbursementTran.vue'),
          },
          {
            path: 'augmentation',
            name: 'Augmentation',
            component: () => import('src/pages/User/Transaction/AugmentationTran.vue'),
          },
        ],
      },

      // Continuing
      {
        path: 'continuing',
        name: 'Continuing',
        redirect: '/home/continuing/appropriation', // Empty component for parent
        children: [
          {
            path: 'appropriation',
            name: 'ContAppropriation',
            component: () => import('src/pages/User/Continuing/ContAppr.vue'),
          },
          {
            path: 'disbursement',
            name: 'ContDisbursement',
            component: () => import('src/pages/User/Continuing/ContDis.vue'),
          },
          {
            path: 'augmentation',
            name: 'ContAugmentation',
            component: () => import('src/pages/User/Continuing/ContAug.vue'),
          },
        ],
      },

      // Libraries
      {
        path: 'libraries',
        name: 'Libraries',
        redirect: '/home/libraries/accounts', // Empty component for parent
        children: [
          {
            path: 'accounts',
            name: 'AccountsLib',
            component: () => import('src/pages/User/Libraries/AccountsLib.vue'),
          },
          {
            path: 'bank',
            name: 'BankLib',
            component: () => import('src/pages/User/Libraries/BankLib.vue'),
          },
        ],
      },
      // Reports
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('pages/ReportPage.vue'),
        meta: { title: 'Reports' },
      },
      // User Access
      {
        path: 'useraccess',
        name: 'userAccess',
        component: () => import ('src/pages/User/UserAccess.vue'),
        meta: {title: 'UserAccess'}
      },
      // Logs
      {
        path: 'logsview',
        name: 'Logsview',
        component: () => import ('src/pages/User/UserLogs.vue'),
        meta: {title: 'Logs' }

      }
    ],
  },

  {
    path: '/admin',
    component: () => import('layouts/AdMainLayout.vue'),
    children: [
      // Dashboard
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('pages/Admin/DashBoard.vue'),
        meta: { title: 'Dashboard' },
      },

      // User Control
      {
        path: 'usercontrol',
        name: 'UserControl',
        redirect: '/admin/usercontrol/pending', // Empty component for parent
        children: [
          {
            path: 'pending',
            name: 'Pending',
            component: () => import('pages/Admin/UserControl/PendingPage.vue'),
          },
          {
            path: 'accepted',
            name: 'Accepted',
            component: () => import('pages/Admin/UserControl/AcceptedPage.vue'),
          },
        ],
      },

      {
        path: 'userAccess',
        name: 'UserAccess',
        component: () => import('pages/Admin/UserAccessPage.vue'),
        meta: { title: 'UserAccess' },
      },

      {
        path: 'logs',
        name: 'Logs',
        component: () => import('pages/Admin/LogsPage.vue'),
        meta: { title: 'Logs' },
      },
      // Current Transactions
      {
        path: 'disbursement',
        name: 'adminDisbursement',
        component: () => import('pages/Admin/Transaction/DisbursementTran.vue'),
      },
      {
        path: 'appropriation',
        name: 'adminAppropriation',
        component: () => import('pages/Admin/Transaction/AppropriationTran.vue'),
      },
      {
        path: 'augmentation',
        name: 'adminAugmentation',
        component: () => import('pages/Admin/Transaction/AugmentationTran.vue'),
      },
      // Continuing Transactions
      {
        path: 'contAugmentation',
        name: 'AdminAugmentation',
        component: () => import('pages/Admin/Continuing/ContAug.vue'),
      },
      {
        path: 'contAppropriation',
        name: 'AdminAppropriation',
        component: () => import('pages/Admin/Continuing/ContAppr.vue'),
      },
      {
        path: 'contDisbursement',
        name: 'AdminDisbursement',
        component: () => import('pages/Admin/Continuing/ContDis.vue'),
      },


    ],
  },

  // Always leave this as last one
  {
    path: '/:catchAll(.*)*',
    name: 'ErrorNotFound',
    component: () => import('pages/ErrorNotFound.vue'),
    meta: { title: 'Page Not Found' },
  },
]

export default routes
