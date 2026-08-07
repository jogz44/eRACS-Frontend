const routes = [
  {
    // Landing Page
    path: '/',
    component: () => import('../layouts/LoginLayout.vue'),
    children: [
      {
        name: 'Login',
        path: '',
        component: () => import('../pages/Accounts/LoginPage.vue'),
        meta: { title: 'Login' },
      },

      {
        path: 'signup',
        name: 'Signup',
        component: () => import('../pages/Accounts/SignupPage.vue'),
        meta: { title: 'Signup' },
      },

      {
        path: 'admin/login',
        name: 'Admin',
        component: () => import('../pages/Admin/LoginPage.vue'),
        meta: { title: 'Admin Login' },
      },

      {
        path: 'forgotpage',
        name: 'forgotpage',
        component: () => import('../pages/Accounts/ForgotPage.vue'),
        meta: { title: 'Forgot Password' },
      },
    ],
  },

  {
    path: '/reset-password',
    component: () => import('../layouts/LoginLayout.vue'),
    children: [
      {
        name: 'ResetPassword',
        path: '',
        component: () => import('../pages/Accounts/ResetPasswordPage.vue'),
      },
    ],
  },

  {
    path: '/home',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      // Dashboard
      {
        path: 'dashboard',
        name: 'UserDashboard',
        component: () => import('../pages/User/DashBoard.vue'),
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
            component: () => import('../pages/User/Transaction/AppropriationTran.vue'),
            meta: { title: 'Appropriation' },
          },
          {
            path: 'disbursement',
            name: 'Disbursement',
            component: () => import('../pages/User/Transaction/DisbursementTran.vue'),
            meta: { title: 'Disbursement' },
          },
          {
            path: 'augmentation',
            name: 'Augmentation',
            component: () => import('../pages/User/Transaction/AugmentationTran.vue'),
            meta: { title: 'Augmentation' },
          },
          {
            path: 'supplemental',
            name: 'Supplemental',
            component: () => import('../pages/User/Transaction/SupplementalTran.vue'),
            meta: { title: 'Supplemental' },
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
            component: () => import('../pages/User/Continuing/ContAppr.vue'),
            meta: { title: 'Cont Appropriation' },
          },
          {
            path: 'disbursement',
            name: 'ContDisbursement',
            component: () => import('../pages/User/Continuing/ContDis.vue'),
            meta: { title: 'Cont Disbursement' },
          },
          {
            path: 'augmentation',
            name: 'ContAugmentation',
            component: () => import('../pages/User/Continuing/ContAug.vue'),
            meta: { title: 'Cont Augmentation' },
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
            component: () => import('../pages/User/Libraries/AccountsLib.vue'),
            meta: { title: 'Accounts' },
          },
          {
            path: 'bank',
            name: 'BankLib',
            component: () => import('../pages/User/Libraries/BankLib.vue'),
            meta: { title: 'Bank' },
          },
          {
            path: 'payee',
            name: 'PayeeLib',
            component: () => import('../pages/User/Libraries/PayeesLib.vue'),
            meta: { title: 'Payees' },
          },
        ],
      },
      // Reports
      {
        path: 'reports',
        name: 'Reports',
        redirect: '/home/reports/reports', // Empty component for parent
        children: [
          {
            path: 'reports',
            name: 'Current Reports',
            component: () => import('../pages/ReportPage.vue'),
            meta: { title: 'Reports' },
          },
          {
            path: 'continuing-reports',
            name: 'Continuing Reports',
            component: () => import('../pages/ContinuingReport.vue'),
            meta: { title: 'Reports' },
          },
        ],
      },
      // User Access
      {
        path: 'useraccess',
        name: 'userAccess',
        component: () => import('../pages/User/UserAccess.vue'),
        meta: { title: 'UserAccess' },
      },
      // Logs
      {
        path: 'logsview',
        name: 'Logsview',
        component: () => import('../pages/User/UserLogs.vue'),
        meta: { title: 'Logs' },
      },
      // Profile Settings
      {
        path: 'profile-settings',
        name: 'ProfileSettings',
        component: () => import('../pages/User/ProfileSettings.vue'),
        meta: { title: 'Profile Settings' },
      },
      {
        path: 'barangay-setup',
        name: 'BarangaySetup',
        component: () => import('../pages/User/BarangaySetup.vue'),
        meta: { title: 'Barangay Setup' },
      },
    ],
  },

  {
    path: '/admin',
    component: () => import('../layouts/AdMainLayout.vue'),
    children: [
      // Dashboard
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../pages/Admin/DashBoard.vue'),
        meta: { title: 'Dashboard' },
      },
      // {
      //   path: 'reportPage',
      //   name: 'aDminReportPage',
      //   component: () => import('../pages/Admin/AdminReportpage.vue'),
      //   meta: { title: 'Report page' },
      // },
      {
        path: 'reports',
        name: 'AdminReports',
        redirect: '/admin/reports/reports',
        children: [
          {
            path: 'reports',
            name: 'AdminCurrentReports',
            component: () => import('../pages/Admin/AdminReportpage.vue'),
            meta: { title: 'Reports' },
          },
          {
            path: 'continuing-reports',
            name: 'AdminContinuingReports',
            component: () => import('../pages/Admin/AdminContinuingReport.vue'),
            meta: { title: 'Reports' },
          },
        ],
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
            component: () => import('../pages/Admin/UserControl/PendingPage.vue'),
            meta: { title: 'Pending' },
          },
          {
            path: 'accepted',
            name: 'Accepted',
            component: () => import('../pages/Admin/UserControl/AcceptedPage.vue'),
            meta: { title: 'Accepted' },
          },
        ],
      },

      {
        path: 'userAccess',
        name: 'UserAccess',
        component: () => import('../pages/Admin/UserAccessPage.vue'),
        meta: { title: 'UserAccess' },
      },

      {
        path: 'logs',
        name: 'Logs',
        component: () => import('../pages/Admin/LogsPage.vue'),
        meta: { title: 'Logs' },
      },
      // Current Transactions
      {
        path: 'disbursement',
        name: 'adminDisbursement',
        component: () => import('../pages/Admin/Transaction/DisbursementTran.vue'),
        meta: { title: 'Disbursement' },
      },
      {
        path: 'appropriation',
        name: 'adminAppropriation',
        component: () => import('../pages/Admin/Transaction/AppropriationTran.vue'),
        meta: { title: 'Appropriation' },
      },
      {
        path: 'augmentation',
        name: 'adminAugmentation',
        component: () => import('../pages/Admin/Transaction/AugmentationTran.vue'),
        meta: { title: 'Augmentation' },
      },
      {
        path: 'supplemental',
        name: 'adminSupplemental',
        component: () => import('../pages/Admin/Transaction/SupplementalTran.vue'),
        meta: { title: 'Supplemental' },
      },

      // Continuing Transactions

      {
        path: 'contAppropriation',
        name: 'AdminAppropriation',
        component: () => import('../pages/Admin/Continuing/ContAppr.vue'),
        meta: { title: 'Cont Appropriation' },
      },
      {
        path: 'contDisbursement',
        name: 'AdminDisbursement',
        component: () => import('../pages/Admin/Continuing/ContDis.vue'),
        meta: { title: 'Cont Disbursement' },
      },
    ],
  },

  // Always leave this as last one
  {
    path: '/:catchAll(.*)*',
    name: 'ErrorNotFound',
    component: () => import('../pages/ErrorNotFound.vue'),
    meta: { title: 'Page Not Found' },
  },
]

export default routes
