export type Language = 'en' | 'bm';

export interface Translations {
  // Common
  appName: string;
  appSubtitle: string;
  portalDescription: string;
  online: string;
  offline: string;
  cancel: string;
  save: string;
  close: string;
  delete: string;
  edit: string;
  confirm: string;
  loading: string;
  success: string;
  error: string;
  open: string;
  copy: string;
  copied: string;
  synced: string;

  // Login Page
  signInTitle: string;
  signInSubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  signInButton: string;
  signingIn: string;
  orDivider: string;
  googleOAuthButton: string;
  quickFillLabel: string;
  createAccountLink: string;
  alreadyHaveAccount: string;
  signUpTitle: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  confirmPasswordLabel: string;
  createAccountButton: string;
  creatingAccount: string;
  passwordMinLength: string;
  passwordMismatch: string;
  googlePrivacyNotice: string;
  help: string;
  privacy: string;
  terms: string;
  languageSelectLabel: string;

  // Header
  productionHub: string;
  cloudSync: string;
  signOut: string;
  lockTerminal: string;

  // Sidebar
  workspaceModules: string;
  trafficController: string;
  workspace: string;
  teamChat: string;
  dailySummary: string;
  savedLinks: string;
  quickTools: string;
  sheetLink: string;
  version: string;

  // Workspace
  tools: string;
  properties: string;
  layers: string;
  bleed: string;
  exportPdf: string;
  exportIdml: string;
  zoom: string;
  grid: string;
  rulers: string;
  guides: string;

  // Traffic Controller
  trafficTitle: string;
  trafficSubtitle: string;
  jobId: string;
  client: string;
  edition: string;
  section: string;
  status: string;
  deadline: string;
  operator: string;
  actions: string;
  addNewJob: string;
  updateStatus: string;
  openGoogleSheet: string;

  // Daily Summary
  dailySummaryTitle: string;
  dailySummarySubtitle: string;
  totalJobs: string;
  completedJobs: string;
  inProgressJobs: string;
  pendingJobs: string;
  operatorPerformance: string;
  archiveShift: string;

  // Saved Links
  savedLinksTitle: string;
  savedLinksSubtitle: string;
  addNewLink: string;
  linkTitle: string;
  linkUrl: string;
  linkCategory: string;
  pinned: string;
  pinLink: string;
  unpinLink: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Common
    appName: 'Studio8 Production Engine',
    appSubtitle: 'Prepress & Editorial Publishing Hub · NSTP',
    portalDescription: 'Sign in to access your editorial & prepress workspace',
    online: 'Online',
    offline: 'Offline',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    open: 'Open',
    copy: 'Copy',
    copied: 'Copied!',
    synced: 'Cloud Synced',

    // Login Page
    signInTitle: 'Sign in',
    signInSubtitle: 'with your Google / NSTP Account to continue to Studio8',
    emailLabel: 'Email or phone',
    emailPlaceholder: 'name@nstp.com.my or user@gmail.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    showPassword: 'Show',
    hidePassword: 'Hide',
    signInButton: 'Sign In',
    signingIn: 'Verifying Credentials...',
    orDivider: 'or',
    googleOAuthButton: 'Sign in with Google Account (Popup)',
    quickFillLabel: 'Quick Account Fill (Prepress Roster):',
    createAccountLink: 'Create account',
    alreadyHaveAccount: 'Already have an account? Sign in',
    signUpTitle: 'Create your account',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'e.g. Ahmad Razak',
    confirmPasswordLabel: 'Confirm Password',
    createAccountButton: 'Create Account & Sign In',
    creatingAccount: 'Creating Account in Cloud...',
    passwordMinLength: 'Password must be at least 6 characters.',
    passwordMismatch: 'Passwords do not match.',
    googlePrivacyNotice: 'To continue, Google shares your name, email address, and profile info with Studio8 Production Engine.',
    help: 'Help',
    privacy: 'Privacy',
    terms: 'Terms',
    languageSelectLabel: 'Language',

    // Header
    productionHub: 'PRODUCTION HUB',
    cloudSync: 'Firestore Cloud',
    signOut: 'Sign Out',
    lockTerminal: 'Sign Out & Lock',

    // Sidebar
    workspaceModules: 'WORKSPACE MODULES',
    trafficController: 'Traffic Controller',
    workspace: 'Workspace Canvas',
    teamChat: 'Team Live Chat',
    dailySummary: 'Daily Summary & Shift',
    savedLinks: 'Cloud Saved Links',
    quickTools: 'QUICK TOOLS',
    sheetLink: 'Open Traffic Sheet',
    version: 'CS5.5 Engine · NSTP Prepress',

    // Workspace
    tools: 'Tools',
    properties: 'Document Properties',
    layers: 'Layers & Guides',
    bleed: 'Bleed (mm)',
    exportPdf: 'Export Hi-Res PDF',
    exportIdml: 'Export Adobe IDML',
    zoom: 'Zoom',
    grid: 'Newspaper Grid',
    rulers: 'Rulers',
    guides: 'Guides',

    // Traffic Controller
    trafficTitle: 'Traffic Controller & Live Job Queue',
    trafficSubtitle: 'Manage incoming newspaper adverts, legal notices, and editorial requests',
    jobId: 'Job ID',
    client: 'Client / Agency',
    edition: 'Edition',
    section: 'Section',
    status: 'Status',
    deadline: 'Deadline',
    operator: 'Operator',
    actions: 'Actions',
    addNewJob: 'Add New Job',
    updateStatus: 'Update Status',
    openGoogleSheet: 'Open Google Sheet',

    // Daily Summary
    dailySummaryTitle: 'Daily Production Summary',
    dailySummarySubtitle: 'Shift metrics, completed adverts, and editorial output tracking',
    totalJobs: 'Total Jobs',
    completedJobs: 'Completed',
    inProgressJobs: 'In Progress',
    pendingJobs: 'Pending / Queued',
    operatorPerformance: 'Operator Output & Desk Allocation',
    archiveShift: 'Archive Current Shift',

    // Saved Links
    savedLinksTitle: 'Saved Links & Cloud Folders',
    savedLinksSubtitle: 'Synchronized team links stored in Firebase Firestore for quick access across terminals',
    addNewLink: 'Add New Link',
    linkTitle: 'Link Title',
    linkUrl: 'Destination URL',
    linkCategory: 'Category',
    pinned: 'Pinned',
    pinLink: 'Pin',
    unpinLink: 'Unpin'
  },
  bm: {
    // Common
    appName: 'Studio8 Production Engine',
    appSubtitle: 'Hab Penerbitan Prepress & Editorial · NSTP',
    portalDescription: 'Log masuk untuk mengakses ruang kerja editorial & prepress anda',
    online: 'Dalam Talian',
    offline: 'Luar Talian',
    cancel: 'Batal',
    save: 'Simpan',
    close: 'Tutup',
    delete: 'Padam',
    edit: 'Sunting',
    confirm: 'Sahkan',
    loading: 'Memuatkan...',
    success: 'Berjaya',
    error: 'Ralat',
    open: 'Buka',
    copy: 'Salin',
    copied: 'Disalin!',
    synced: 'Segerak Awan',

    // Login Page
    signInTitle: 'Log masuk',
    signInSubtitle: 'dengan Akaun Google / NSTP anda untuk meneruskan ke Studio8',
    emailLabel: 'Emel atau telefon',
    emailPlaceholder: 'nama@nstp.com.my atau pengguna@gmail.com',
    passwordLabel: 'Kata Laluan',
    passwordPlaceholder: 'Masukkan kata laluan anda',
    showPassword: 'Papar',
    hidePassword: 'Sembunyi',
    signInButton: 'Log Masuk',
    signingIn: 'Mengesahkan Pengguna...',
    orDivider: 'atau',
    googleOAuthButton: 'Log masuk dengan Akaun Google (Pop-up)',
    quickFillLabel: 'Isian Pantas Akaun Roster Prepress:',
    createAccountLink: 'Cipta akaun',
    alreadyHaveAccount: 'Sudah mempunyai akaun? Log masuk',
    signUpTitle: 'Cipta akaun anda',
    fullNameLabel: 'Nama Penuh',
    fullNamePlaceholder: 'cth: Ahmad Razak',
    confirmPasswordLabel: 'Sahkan Kata Laluan',
    createAccountButton: 'Cipta Akaun & Masuk',
    creatingAccount: 'Mencipta Akaun dalam Awan...',
    passwordMinLength: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.',
    passwordMismatch: 'Kata laluan tidak sepadan.',
    googlePrivacyNotice: 'Untuk meneruskan, Google berkongsi nama, emel, dan foto profil dengan Studio8 Production Engine.',
    help: 'Bantuan',
    privacy: 'Privasi',
    terms: 'Terma',
    languageSelectLabel: 'Bahasa',

    // Header
    productionHub: 'HAB PENGELUARAN',
    cloudSync: 'Awan Firestore',
    signOut: 'Log Keluar',
    lockTerminal: 'Log Keluar & Kunci',

    // Sidebar
    workspaceModules: 'MODUL RUANG KERJA',
    trafficController: 'Traffic Controller',
    workspace: 'Ruang Kanvas',
    teamChat: 'Mesej Langsung Pasukan',
    dailySummary: 'Ringkasan Harian & Syif',
    savedLinks: 'Pautan Tersimpan Firebase',
    quickTools: 'ALAT PANTAS',
    sheetLink: 'Buka Traffic Sheet',
    version: 'Enjin CS5.5 · NSTP Prepress',

    // Workspace
    tools: 'Alatan',
    properties: 'Sifat Dokumen',
    layers: 'Lapisan & Garis Panduan',
    bleed: 'Limpahan (Bleed mm)',
    exportPdf: 'Eksport PDF Resolusi Tinggi',
    exportIdml: 'Eksport Adobe IDML',
    zoom: 'Zum',
    grid: 'Grid Akhbar',
    rulers: 'Pembaris',
    guides: 'Garis Panduan',

    // Traffic Controller
    trafficTitle: 'Traffic Controller & Barisan Kerja Langsung',
    trafficSubtitle: 'Urus iklan akhbar masuk, notis mahkamah, dan permintaan editorial',
    jobId: 'ID Kerja',
    client: 'Klien / Agensi',
    edition: 'Edisi',
    section: 'Bahagian',
    status: 'Status',
    deadline: 'Tarikh Akhir',
    operator: 'Operator',
    actions: 'Tindakan',
    addNewJob: 'Tambah Kerja Baru',
    updateStatus: 'Kemas Kini Status',
    openGoogleSheet: 'Buka Google Sheet',

    // Daily Summary
    dailySummaryTitle: 'Ringkasan Pengeluaran Harian',
    dailySummarySubtitle: 'Metrik syif, iklan siap, dan pengesanan hasil editorial',
    totalJobs: 'Jumlah Kerja',
    completedJobs: 'Selesai',
    inProgressJobs: 'Sedang Diproses',
    pendingJobs: 'Menunggu / Beratur',
    operatorPerformance: 'Prestasi Operator & Peruntukan Meja',
    archiveShift: 'Arkib Syif Semasa',

    // Saved Links
    savedLinksTitle: 'Pautan Tersimpan & Folder Awan',
    savedLinksSubtitle: 'Pautan pasukan yang disegerakkan dalam Firebase Firestore untuk capaian merentas terminal',
    addNewLink: 'Tambah Pautan Baru',
    linkTitle: 'Tajuk Pautan',
    linkUrl: 'URL Destinasi',
    linkCategory: 'Kategori',
    pinned: 'Disematkan',
    pinLink: 'Semat',
    unpinLink: 'Batal Semat'
  }
};
