import type { AppLang } from '../context/AppUiContext';

export type UiRole =
  | 'admin'
  | 'clerical'
  | 'radiologist'
  | 'physician'
  | 'technologist';

export type AppStrings = {
  menu: string;
  settings: string;
  logout: string;
  roles: Record<UiRole, string>;
  nav: Record<string, string>;
  common: {
    loading: string;
    yes: string;
    no: string;
    save: string;
    add: string;
    email: string;
  };
  layout: {
    brandLine: string;
    menuAria: string;
    langSwitchToEn: string;
    langSwitchToFr: string;
  };
  login: {
    brandSmall: string;
    title: string;
    subtitle: string;
    email: string;
    password: string;
    emailPlaceholder: string;
    signIn: string;
    signingIn: string;
    forgotPassword: string;
    noAccount: string;
    requestAccess: string;
    publicRequisition: string;
    loginFailed: string;
  };
  settingsPage: {
    lead: string;
    preferredLanguage: string;
    english: string;
    french: string;
    displayName: string;
    firstName: string;
    lastName: string;
    profileHint: string;
    emailHeader: string;
  };
  physician: {
    newTitle: string;
    newLead: string;
    historyTitle: string;
    historyEmpty: string;
    flaggedTitle: string;
    flaggedEmpty: string;
    newReqLink: string;
  };
  signup: {
    title: string;
    lead: string;
    publicFormBtn: string;
    backSignIn: string;
  };
  publicForm: {
    externalTitle: string;
    externalLead: string;
    loadError: string;
    patientIdLabel: string;
    clinicLabel: string;
    siteLabel: string;
    additionalNotes: string;
    submitRequisition: string;
    requiredFieldsError: string;
    submitSuccess: string;
  };
  clerical: {
    title: string;
    lead: string;
    cardPatient: string;
    cardExam: string;
    patientName: string;
    patientNameHint: string;
    patientId: string;
    patientIdHint: string;
    patientDob: string;
    newExternal: string;
    orderingPhysician: string;
    orderingPhysicianHint: string;
    requestingClinic: string;
    requestingClinicHint: string;
    selectClinicOptional: string;
    typeClinicPlaceholder: string;
    siteReporting: string;
    siteHint: string;
    selectSiteOptional: string;
    typeSitePlaceholder: string;
    dateOfRequest: string;
    dateOfRequestHint: string;
    modality: string;
    modalityHint: string;
    imagingCategory: string;
    noCategoriesModality: string;
    examTypeInCategory: string;
    typicalSequences: string;
    timeDelay: string;
    timeDelayHint: string;
    notSpecified: string;
    imaging24h: string;
    clinicalNotes: string;
    clinicalNotesHint: string;
    submit: string;
    submitting: string;
    loadingCategories: string;
    loadError: string;
    failedCreate: string;
  };
  requisitions: {
    titleAll: string;
    titleSearch: string;
    titleList: string;
    downloadSample: string;
    uploadToReqs: string;
    importing: string;
    importHelp: string;
    loading: string;
    visitNum: string;
    patientId: string;
    orderingDoctor: string;
    clinic: string;
    site: string;
    status: string;
    modality: string;
    category: string;
    subcategories: string;
    requiredSpecialty: string;
    additionalNotes: string;
    rvu: string;
    created: string;
    dueDate: string;
    shift: string;
    actions: string;
    selectPlaceholder: string;
    noPredefinedSubcat: string;
    addCustomSubcatPh: string;
    noReqsYet: string;
    saveSchedule: string;
    saveImaging: string;
    saveNotes: string;
    approve: string;
    delete: string;
    saving: string;
    confirmApprove: string;
    confirmDelete: string;
    confirmImport: string;
  };
  assigning: {
    title: string;
    date: string;
    shift: string;
    refresh: string;
    loadingRefresh: string;
    approvedForSlot: string;
    eligibleToAssign: string;
    alreadyAssigned: string;
    completedLocked: string;
    totalEligibleRvu: string;
    totalMemberWeight: string;
    radiologistsForShift: string;
    naAllDayHint: string;
    selectRadiologist: string;
    addRadiologist: string;
    radiologist: string;
    source: string;
    weight: string;
    actions: string;
    calendarAuto: string;
    manual: string;
    remove: string;
    noRadiologistsYet: string;
    distribute: string;
    distributing: string;
    lastDistribution: string;
    targetRvu: string;
    assignedRvu: string;
    assignedCases: string;
    viewSchedule: string;
    viewList: string;
    downloadPdf: string;
    preparing: string;
    worklistOnPage: string;
    doneTotal: string;
    mrn: string;
    name: string;
    dob: string;
    reported: string;
    urgentFindings: string;
    modality: string;
    category: string;
    subcats: string;
    notes: string;
    noReqsForRad: string;
    swapFrom: string;
    swapTo: string;
    swapReason: string;
    swapReasonPh: string;
    allowUnequalRvu: string;
    swapCases: string;
    swapping: string;
  };
  admin: {
    settingsTitle: string;
    settingsLead: string;
    addUser: string;
    onlyAdminsAdd: string;
    name: string;
    email: string;
    password: string;
    role: string;
    roleRadiologist: string;
    roleClerical: string;
    rolePhysician: string;
    roleTechnologist: string;
    roleAdmin: string;
    addUserBtn: string;
    clinics: string;
    sites: string;
    placeholderClinic: string;
    placeholderSite: string;
    add: string;
    noClinicsYet: string;
    noSitesYet: string;
    timeDelayOptions: string;
    delayLabelPh: string;
    hoursPh: string;
    noOptionsYet: string;
    users: string;
    loadingUsers: string;
    colName: string;
    colEmail: string;
    colRole: string;
    colActive: string;
    colSubspecialties: string;
  };
  radiologistCal: {
    title: string;
    lead: string;
    previous: string;
    next: string;
    month: string;
    week: string;
    day: string;
    bookForRad: string;
    selectRad: string;
    defaultSite: string;
    team: string;
    capacity: string;
    radiologists: string;
    rAbbr: string;
    rvu: string;
    bookMe: string;
    removeMe: string;
    saving: string;
    saveRvu: string;
    phMaxRvuAdmin: string;
    phMaxRvuSelf: string;
    noRadBooked: string;
    loadingShifts: string;
    weekdays: [string, string, string, string, string, string, string];
  };
  rvuPage: {
    title: string;
    lead: string;
    total: string;
    earned: string;
    given: string;
    addEntry: string;
    radiologist: string;
    category: string;
    earnedCredits: string;
    givenCredits: string;
    amount: string;
    applyDate: string;
    noteOptional: string;
    notePlaceholder: string;
    addCredit: string;
    saving: string;
    history: string;
    colApplyDate: string;
    colRad: string;
    colCategory: string;
    colAmount: string;
    colNote: string;
    noEntries: string;
    loading: string;
    confirmAdd: string;
    addedOk: string;
    errAmountPositive: string;
    loadFailed: string;
    createFailed: string;
  };
  specialty: {
    title: string;
    lead: string;
    addSubPh: string;
    addSubBtn: string;
    subcatRulesHeader: string;
    saveRule: string;
    saving: string;
    savedMsg: string;
  };
};

const EN: AppStrings = {
  menu: 'Menu',
  settings: 'Settings',
  logout: 'Logout',
  roles: {
    admin: 'Administration',
    clerical: 'Clerical staff',
    radiologist: 'Radiologist',
    physician: 'Physician',
    technologist: 'Technologist',
  },
  nav: {
    clericalIntake: 'Clerical intake',
    requisitions: 'Requisitions',
    workloadSeparation: 'Radiology workload separation',
    assigning: 'Assigning',
    serviceRules: 'Service rules',
    radSchedule: 'Radiologist schedule',
    radScheduleHub: 'Radiologist schedule',
    userAccess: 'User access management',
    rvuCredits: 'RVU credits',
    radRequisitions: 'Requisitions',
    radWeekly: 'Weekly schedule',
    radCalendar: 'Calendar',
    physNew: 'New requisition',
    physHistory: 'History',
    physFlagged: 'Flagged requisitions',
    techList: 'Requisition list',
  },
  common: {
    loading: 'Loading…',
    yes: 'Yes',
    no: 'No',
    save: 'Save',
    add: 'Add',
    email: 'Email',
  },
  layout: {
    brandLine: 'Radiology workload',
    menuAria: 'Menu',
    langSwitchToEn: 'English',
    langSwitchToFr: 'Français',
  },
  login: {
    brandSmall: 'Radiology workload',
    title: 'Radiology RVU workload app',
    subtitle: 'Sign in with your work email and password.',
    email: 'E-mail',
    password: 'Password',
    emailPlaceholder: 'you@hospital.org',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    requestAccess: 'Request access',
    publicRequisition: 'Public requisition',
    loginFailed: 'Login failed',
  },
  settingsPage: {
    lead: 'Display preferences and profile summary (preview).',
    preferredLanguage: 'Preferred language',
    english: 'English',
    french: 'Français',
    displayName: 'Display name',
    firstName: 'First name',
    lastName: 'Last name',
    profileHint: 'Full profile editing will be available in a future update.',
    emailHeader: 'Email',
  },
  physician: {
    newTitle: 'New requisition',
    newLead: 'Submit an imaging requisition using the integrated public form.',
    historyTitle: 'History',
    historyEmpty: 'No history yet. This section will list requisitions for the signed-in physician.',
    flaggedTitle: 'Flagged requisitions',
    flaggedEmpty: 'No flagged items yet. Filters and alerts will appear here.',
    newReqLink: 'New requisition',
  },
  signup: {
    title: 'Request access',
    lead: 'Physician accounts are issued by your site administrator. Use the public requisition form or contact radiology IT.',
    publicFormBtn: 'Public requisition form',
    backSignIn: 'Back to sign in',
  },
  publicForm: {
    externalTitle: 'External requisition form',
    externalLead:
      'This form is for clinics outside the radiology department to request imaging. Please complete all required fields as accurately as possible.',
    loadError: 'Failed to load imaging categories/clinics/sites',
    patientIdLabel: 'Patient identifier (MRN or temp label) *',
    clinicLabel: 'Clinic',
    siteLabel: 'Site / location',
    additionalNotes: 'Additional notes',
    submitRequisition: 'Submit requisition',
    requiredFieldsError:
      'Required fields: Patient name, MRN/Patient ID, Patient DOB, and modality.',
    submitSuccess: 'Requisition submitted. Visit #{{visit}}.',
  },
  clerical: {
    title: 'Clerical intake',
    lead: 'Choose modality, then imaging category and exam types. Due date is derived from time delay and prior imaging when applicable.',
    cardPatient: 'Patient requisition information',
    cardExam: 'Exam requisition information',
    patientName: 'Patient name *',
    patientNameHint: "Enter the patient's first and last names.",
    patientId: 'Patient identifier *',
    patientIdHint: 'MRN, patient ID, or temporary label.',
    patientDob: 'Patient DOB *',
    newExternal: 'New external patient',
    orderingPhysician: 'Ordering physician',
    orderingPhysicianHint: 'Name of the requesting physician.',
    requestingClinic: 'Requesting clinic',
    requestingClinicHint: 'Select a saved clinic or type a name.',
    selectClinicOptional: 'Select saved clinic (optional)',
    typeClinicPlaceholder: 'Or type clinic name…',
    siteReporting: 'Site / reporting location',
    siteHint: 'Preferred site or reporting location.',
    selectSiteOptional: 'Select saved site (optional)',
    typeSitePlaceholder: 'Or type site/location…',
    dateOfRequest: 'Date of request',
    dateOfRequestHint: 'Date the request form is completed.',
    modality: 'Modality *',
    modalityHint: 'Choose the imaging modality.',
    imagingCategory: 'Imaging category',
    noCategoriesModality: 'No categories configured for this modality yet.',
    examTypeInCategory: 'Exam type within this category',
    typicalSequences: 'Typical sequences',
    timeDelay: 'Time delay allowed',
    timeDelayHint: 'Supports automatic due-date rules where configured.',
    notSpecified: 'Not specified',
    imaging24h: 'Patient has relevant imaging within last 24 hours',
    clinicalNotes: 'Clinical notes',
    clinicalNotesHint: 'History or context for the reading team.',
    submit: 'Submit exam requisition',
    submitting: 'Submitting…',
    loadingCategories: 'Loading categories…',
    loadError: 'Failed to load imaging categories/clinics/sites',
    failedCreate: 'Failed to create requisition',
  },
  requisitions: {
    titleAll: 'All requisitions',
    titleSearch: 'Requisition search',
    titleList: 'Requisition list',
    downloadSample: 'Download sample Excel',
    uploadToReqs: 'Upload to requisitions',
    importing: 'Importing…',
    importHelp: 'Use the template to add multiple requisitions in one upload.',
    loading: 'Loading requisitions…',
    visitNum: 'Visit #',
    patientId: 'Patient ID',
    orderingDoctor: 'Ordering doctor',
    clinic: 'Clinic',
    site: 'Site',
    status: 'Status',
    modality: 'Modality',
    category: 'Category',
    subcategories: 'Subcategories',
    requiredSpecialty: 'Required specialty',
    additionalNotes: 'Additional notes',
    rvu: 'RVU',
    created: 'Created',
    dueDate: 'Due date',
    shift: 'Shift',
    actions: 'Actions',
    selectPlaceholder: 'Select...',
    noPredefinedSubcat: 'No predefined options for this category.',
    addCustomSubcatPh: 'Add custom subcategory',
    noReqsYet: 'No requisitions yet.',
    saveSchedule: 'Save schedule',
    saveImaging: 'Save imaging',
    saveNotes: 'Save notes',
    approve: 'Approve',
    delete: 'Delete',
    saving: 'Saving…',
    confirmApprove: 'Approve this requisition?',
    confirmDelete: 'Delete this requisition?',
    confirmImport: 'Import requisitions from this Excel file?',
  },
  assigning: {
    title: 'Assigning',
    date: 'Date',
    shift: 'Shift',
    refresh: 'Refresh',
    loadingRefresh: 'Loading...',
    approvedForSlot: 'Approved for slot:',
    eligibleToAssign: 'Eligible to assign:',
    alreadyAssigned: 'Already assigned:',
    completedLocked: 'Completed (locked):',
    totalEligibleRvu: 'Total eligible RVU:',
    totalMemberWeight: 'Total member weight:',
    radiologistsForShift: 'Radiologists for this shift',
    naAllDayHint: 'N/A (All day) auto-loads radiologists from AM, PM, and Night shifts on this date.',
    selectRadiologist: 'Select radiologist',
    addRadiologist: 'Add radiologist',
    radiologist: 'Radiologist',
    source: 'Source',
    weight: 'Weight',
    actions: 'Actions',
    calendarAuto: 'Calendar auto-added',
    manual: 'Manual',
    remove: 'Remove',
    noRadiologistsYet: 'No radiologists selected yet.',
    distribute: 'Distribute / Redistribute',
    distributing: 'Distributing...',
    lastDistribution: 'Last distribution result',
    targetRvu: 'Target RVU',
    assignedRvu: 'Assigned RVU',
    assignedCases: 'Assigned cases',
    viewSchedule: 'View schedule',
    viewList: 'View list',
    downloadPdf: 'Download PDF',
    preparing: 'Preparing...',
    worklistOnPage: 'Worklist on page:',
    doneTotal: 'Done / Total:',
    mrn: 'MRN',
    name: 'Name',
    dob: 'DOB',
    reported: 'Reported',
    urgentFindings: 'Urgent findings',
    modality: 'Modality',
    category: 'Category',
    subcats: 'Sub-categories',
    notes: 'Notes',
    noReqsForRad: 'No requisitions assigned for this radiologist in the selected date/shift.',
    swapFrom: 'Swap from assignment ID',
    swapTo: 'Swap to assignment ID',
    swapReason: 'Swap reason',
    swapReasonPh: 'Distribution correction / personal relationship / other',
    allowUnequalRvu: 'Allow unequal RVU swap override',
    swapCases: 'Swap cases',
    swapping: 'Swapping…',
  },
  admin: {
    settingsTitle: 'Settings',
    settingsLead: 'Add radiologists, clerical staff, or other admins. Manage shifts and requisitions from here.',
    addUser: 'Add user',
    onlyAdminsAdd: 'Only admins can add users.',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    role: 'Role',
    roleRadiologist: 'Radiologist',
    roleClerical: 'Clerical',
    rolePhysician: 'Physician',
    roleTechnologist: 'Technologist',
    roleAdmin: 'Admin',
    addUserBtn: 'Add user',
    clinics: 'Clinics',
    sites: 'Sites / locations',
    placeholderClinic: 'Add clinic name…',
    placeholderSite: 'Add site name…',
    add: 'Add',
    noClinicsYet: 'No clinics yet.',
    noSitesYet: 'No sites yet.',
    timeDelayOptions: 'Time delay options',
    delayLabelPh: 'Label (e.g. "1 year")',
    hoursPh: 'Hours (e.g. 8760)',
    noOptionsYet: 'No options yet.',
    users: 'Users',
    loadingUsers: 'Loading users…',
    colName: 'Name',
    colEmail: 'Email',
    colRole: 'Role',
    colActive: 'Active',
    colSubspecialties: 'Subspecialties (radiologists)',
  },
  radiologistCal: {
    title: 'Radiologist Shift Calendar',
    lead: 'Calendar-style booking with team coverage and RVU capacity per shift.',
    previous: 'Previous',
    next: 'Next',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    bookForRad: 'Book shifts for radiologist',
    selectRad: 'Select radiologist...',
    defaultSite: 'Default Site',
    team: 'Team:',
    capacity: 'Capacity:',
    radiologists: 'radiologists',
    rAbbr: 'R',
    rvu: 'RVU',
    bookMe: 'Book me',
    removeMe: 'Remove me',
    saving: 'Saving...',
    saveRvu: 'Save RVU',
    phMaxRvuAdmin: 'Selected radiologist max RVU',
    phMaxRvuSelf: 'My max RVU for this shift',
    noRadBooked: 'No radiologists booked yet.',
    loadingShifts: 'Loading shifts...',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  rvuPage: {
    title: 'RVU credits',
    lead: "Admin-only manual credits. Earned and given categories are tracked separately, but both add RVU to the radiologist's workload on the selected apply date.",
    total: 'Total:',
    earned: 'Earned:',
    given: 'Given:',
    addEntry: 'Add credit entry',
    radiologist: 'Radiologist',
    category: 'Category',
    earnedCredits: 'Earned credits',
    givenCredits: 'Given credits',
    amount: 'RVU amount',
    applyDate: 'Apply date',
    noteOptional: 'Note (optional)',
    notePlaceholder: 'Reason / context',
    addCredit: 'Add RVU credit',
    saving: 'Saving…',
    history: 'Credit history',
    colApplyDate: 'Apply date',
    colRad: 'Radiologist',
    colCategory: 'Category',
    colAmount: 'Amount',
    colNote: 'Note',
    noEntries: 'No credit entries yet.',
    loading: 'Loading credits…',
    confirmAdd: 'Add this RVU credit entry? It will be applied to the selected date.',
    addedOk: 'RVU credit added successfully.',
    errAmountPositive: 'Amount must be a positive integer.',
    loadFailed: 'Failed to load RVU credits',
    createFailed: 'Failed to create RVU credit',
  },
  specialty: {
    title: 'Service to subspecialty mapping',
    lead: 'Default is General. Update one or more subspecialties for any modality/category/subcategory.',
    addSubPh: 'Add subcategory...',
    addSubBtn: 'Add subcategory',
    subcatRulesHeader: 'Subcategories (rules apply only here)',
    saveRule: 'Save subcategory rule',
    saving: 'Saving…',
    savedMsg: 'Saved.',
  },
};

const FR: AppStrings = {
  menu: 'Menu',
  settings: 'Paramètres',
  logout: 'Déconnexion',
  roles: {
    admin: 'Administration',
    clerical: 'Personnel administratif',
    radiologist: 'Radiologiste',
    physician: 'Médecin',
    technologist: 'Technologiste',
  },
  nav: {
    clericalIntake: 'Réception des demandes',
    requisitions: 'Demandes',
    workloadSeparation: 'Répartition de la charge',
    assigning: 'Attribution',
    serviceRules: 'Règles de service',
    radSchedule: 'Horaire des radiologistes',
    radScheduleHub: 'Horaire des radiologistes',
    userAccess: 'Gestion des accès',
    rvuCredits: 'Crédits RVU',
    radRequisitions: 'Demandes',
    radWeekly: 'Horaire hebdomadaire',
    radCalendar: 'Calendrier',
    physNew: 'Nouvelle demande',
    physHistory: 'Historique',
    physFlagged: 'Demandes signalées',
    techList: 'Liste des demandes',
  },
  common: {
    loading: 'Chargement…',
    yes: 'Oui',
    no: 'Non',
    save: 'Enregistrer',
    add: 'Ajouter',
    email: 'Courriel',
  },
  layout: {
    brandLine: 'Charge de travail en radiologie',
    menuAria: 'Menu',
    langSwitchToEn: 'English',
    langSwitchToFr: 'Français',
  },
  login: {
    brandSmall: 'Charge de travail en radiologie',
    title: 'Application de charge RVU en radiologie',
    subtitle: 'Connectez-vous avec votre courriel professionnel et votre mot de passe.',
    email: 'Courriel',
    password: 'Mot de passe',
    emailPlaceholder: 'vous@hopital.org',
    signIn: 'Connexion',
    signingIn: 'Connexion…',
    forgotPassword: 'Mot de passe oublié ?',
    noAccount: 'Pas encore de compte ?',
    requestAccess: 'Demander un accès',
    publicRequisition: 'Demande publique',
    loginFailed: 'Échec de la connexion',
  },
  settingsPage: {
    lead: "Préférences d'affichage et résumé du profil (aperçu).",
    preferredLanguage: 'Langue préférée',
    english: 'English',
    french: 'Français',
    displayName: 'Nom affiché',
    firstName: 'Prénom',
    lastName: 'Nom',
    profileHint: 'La modification du profil complet sera disponible dans une prochaine version.',
    emailHeader: 'Courriel',
  },
  physician: {
    newTitle: 'Nouvelle demande',
    newLead: "Soumettre une demande d'examen (formulaire externe intégré).",
    historyTitle: 'Historique',
    historyEmpty:
      'Aucun historique pour le moment. Cette section sera reliée aux demandes du médecin connecté.',
    flaggedTitle: 'Demandes signalées',
    flaggedEmpty: 'Aucune demande signalée. Les filtres et alertes seront ajoutés ici.',
    newReqLink: 'Nouvelle demande',
  },
  signup: {
    title: 'Demander un accès',
    lead: "Les comptes médecins sont créés par l'administration. Utilisez le formulaire public ou contactez le service de radiologie.",
    publicFormBtn: 'Formulaire public (sans compte)',
    backSignIn: 'Retour à la connexion',
  },
  publicForm: {
    externalTitle: 'Demande externe',
    externalLead:
      'Ce formulaire s’adresse aux cliniques externes pour demander un examen d’imagerie. Veuillez remplir tous les champs obligatoires avec soin.',
    loadError: 'Échec du chargement des catégories, cliniques ou sites',
    patientIdLabel: 'Identifiant patient (NIP ou étiquette temporaire) *',
    clinicLabel: 'Clinique',
    siteLabel: 'Site / lieu',
    additionalNotes: 'Notes additionnelles',
    submitRequisition: 'Soumettre la demande',
    requiredFieldsError:
      'Champs obligatoires : nom du patient, NIP ou identifiant, date de naissance et modalité.',
    submitSuccess: 'Demande soumise. Visite n° {{visit}}.',
  },
  clerical: {
    title: 'Réception des demandes',
    lead: "Choisissez la modalité, puis la catégorie d'imagerie et les types d'examen. La date d'échéance est calculée à partir du délai et de l'imagerie antérieure le cas échéant.",
    cardPatient: 'Renseignements sur la demande (patient)',
    cardExam: "Renseignements sur la demande d'examen",
    patientName: 'Nom du patient *',
    patientNameHint: 'Entrez le prénom et le nom du patient.',
    patientId: 'Identifiant patient *',
    patientIdHint: 'NIP, dossier ou étiquette temporaire.',
    patientDob: 'Date de naissance *',
    newExternal: 'Nouveau patient externe',
    orderingPhysician: 'Médecin prescripteur',
    orderingPhysicianHint: 'Nom du médecin demandeur.',
    requestingClinic: 'Clinique demandeuse',
    requestingClinicHint: 'Choisir une clinique enregistrée ou saisir un nom.',
    selectClinicOptional: 'Clinique enregistrée (optionnel)',
    typeClinicPlaceholder: 'Ou saisir le nom de la clinique…',
    siteReporting: 'Site / lieu de lecture',
    siteHint: 'Site préféré ou lieu de lecture.',
    selectSiteOptional: 'Site enregistré (optionnel)',
    typeSitePlaceholder: 'Ou saisir le site / lieu…',
    dateOfRequest: 'Date de la demande',
    dateOfRequestHint: 'Date de complétion du formulaire.',
    modality: 'Modalité *',
    modalityHint: "Choisir la modalité d'imagerie.",
    imagingCategory: "Catégorie d'imagerie",
    noCategoriesModality: 'Aucune catégorie configurée pour cette modalité.',
    examTypeInCategory: "Type d'examen dans cette catégorie",
    typicalSequences: 'Séquences typiques',
    timeDelay: 'Délai permis',
    timeDelayHint: 'Appuie sur les règles automatiques de date prévues.',
    notSpecified: 'Non précisé',
    imaging24h: 'Imagerie pertinente dans les dernières 24 h',
    clinicalNotes: 'Notes cliniques',
    clinicalNotesHint: 'Antécédents ou contexte pour l’équipe de lecture.',
    submit: 'Soumettre la demande',
    submitting: 'Envoi…',
    loadingCategories: 'Chargement des catégories…',
    loadError: 'Échec du chargement des catégories, cliniques ou sites',
    failedCreate: 'Échec de la création de la demande',
  },
  requisitions: {
    titleAll: 'Toutes les demandes',
    titleSearch: 'Recherche de demandes',
    titleList: 'Liste des demandes',
    downloadSample: 'Télécharger le modèle Excel',
    uploadToReqs: 'Téléverser vers les demandes',
    importing: 'Importation…',
    importHelp: 'Utilisez le modèle pour ajouter plusieurs demandes en une fois.',
    loading: 'Chargement des demandes…',
    visitNum: 'Visite #',
    patientId: 'ID patient',
    orderingDoctor: 'Médecin prescripteur',
    clinic: 'Clinique',
    site: 'Site',
    status: 'Statut',
    modality: 'Modalité',
    category: 'Catégorie',
    subcategories: 'Sous-catégories',
    requiredSpecialty: 'Spécialité requise',
    additionalNotes: 'Notes additionnelles',
    rvu: 'RVU',
    created: 'Créé',
    dueDate: 'Date prévue',
    shift: 'Quart',
    actions: 'Actions',
    selectPlaceholder: 'Choisir…',
    noPredefinedSubcat: 'Aucune option prédéfinie pour cette catégorie.',
    addCustomSubcatPh: 'Ajouter une sous-catégorie',
    noReqsYet: 'Aucune demande pour le moment.',
    saveSchedule: 'Enregistrer le calendrier',
    saveImaging: "Enregistrer l'imagerie",
    saveNotes: 'Enregistrer les notes',
    approve: 'Approuver',
    delete: 'Supprimer',
    saving: 'Enregistrement…',
    confirmApprove: 'Approuver cette demande ?',
    confirmDelete: 'Supprimer cette demande ?',
    confirmImport: 'Importer les demandes à partir de ce fichier Excel ?',
  },
  assigning: {
    title: 'Attribution',
    date: 'Date',
    shift: 'Quart',
    refresh: 'Actualiser',
    loadingRefresh: 'Chargement...',
    approvedForSlot: 'Approuvés pour le créneau :',
    eligibleToAssign: 'Éligibles à attribuer :',
    alreadyAssigned: 'Déjà attribués :',
    completedLocked: 'Terminés (verrouillés) :',
    totalEligibleRvu: 'RVU éligibles totaux :',
    totalMemberWeight: 'Poids total des membres :',
    radiologistsForShift: 'Radiologistes pour ce quart',
    naAllDayHint:
      'N/A (journée) charge automatiquement les radiologistes des quarts AM, PM et Nuit à cette date.',
    selectRadiologist: 'Choisir un radiologiste',
    addRadiologist: 'Ajouter un radiologiste',
    radiologist: 'Radiologiste',
    source: 'Source',
    weight: 'Poids',
    actions: 'Actions',
    calendarAuto: 'Ajout auto (calendrier)',
    manual: 'Manuel',
    remove: 'Retirer',
    noRadiologistsYet: 'Aucun radiologiste sélectionné.',
    distribute: 'Distribuer / redistribuer',
    distributing: 'Distribution...',
    lastDistribution: 'Dernier résultat de distribution',
    targetRvu: 'RVU cible',
    assignedRvu: 'RVU attribués',
    assignedCases: 'Cas attribués',
    viewSchedule: 'Voir le calendrier',
    viewList: 'Voir la liste',
    downloadPdf: 'Télécharger le PDF',
    preparing: 'Préparation...',
    worklistOnPage: 'Liste à l’écran :',
    doneTotal: 'Terminés / Total :',
    mrn: 'NIP',
    name: 'Nom',
    dob: 'Naissance',
    reported: 'Rapporté',
    urgentFindings: 'Urgences',
    modality: 'Modalité',
    category: 'Catégorie',
    subcats: 'Sous-catégories',
    notes: 'Notes',
    noReqsForRad: 'Aucune demande pour ce radiologiste à la date/quart choisis.',
    swapFrom: 'Échanger depuis ID de assignation',
    swapTo: 'Échanger vers ID de assignation',
    swapReason: 'Motif de l’échange',
    swapReasonPh: 'Correction de distribution / lien personnel / autre',
    allowUnequalRvu: 'Autoriser un échange à RVU inégaux',
    swapCases: 'Échanger les cas',
    swapping: 'Échange…',
  },
  admin: {
    settingsTitle: 'Paramètres',
    settingsLead:
      'Ajoutez des radiologistes, du personnel administratif ou d’autres administrateurs. Gérez les quarts et les demandes ici.',
    addUser: 'Ajouter un utilisateur',
    onlyAdminsAdd: 'Seuls les administrateurs peuvent ajouter des utilisateurs.',
    name: 'Nom',
    email: 'Courriel',
    password: 'Mot de passe',
    role: 'Rôle',
    roleRadiologist: 'Radiologiste',
    roleClerical: 'Administratif',
    rolePhysician: 'Médecin',
    roleTechnologist: 'Technologiste',
    roleAdmin: 'Administrateur',
    addUserBtn: 'Ajouter',
    clinics: 'Cliniques',
    sites: 'Sites / lieux',
    placeholderClinic: 'Nom de la clinique…',
    placeholderSite: 'Nom du site…',
    add: 'Ajouter',
    noClinicsYet: 'Aucune clinique pour le moment.',
    noSitesYet: 'Aucun site pour le moment.',
    timeDelayOptions: 'Options de délai',
    delayLabelPh: 'Libellé (ex. « 1 an »)',
    hoursPh: 'Heures (ex. 8760)',
    noOptionsYet: 'Aucune option pour le moment.',
    users: 'Utilisateurs',
    loadingUsers: 'Chargement des utilisateurs…',
    colName: 'Nom',
    colEmail: 'Courriel',
    colRole: 'Rôle',
    colActive: 'Actif',
    colSubspecialties: 'Sous-spécialités (radiologistes)',
  },
  radiologistCal: {
    title: 'Calendrier des quarts (radiologistes)',
    lead: 'Prise de quart avec couverture d’équipe et capacité RVU par quart.',
    previous: 'Précédent',
    next: 'Suivant',
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
    bookForRad: 'Réserver des quarts pour le radiologiste',
    selectRad: 'Choisir un radiologiste…',
    defaultSite: 'Site par défaut',
    team: 'Équipe :',
    capacity: 'Capacité :',
    radiologists: 'radiologistes',
    rAbbr: 'R',
    rvu: 'RVU',
    bookMe: 'Me réserver',
    removeMe: 'Me retirer',
    saving: 'Enregistrement...',
    saveRvu: 'Enregistrer RVU',
    phMaxRvuAdmin: 'RVU max du radiologiste sélectionné',
    phMaxRvuSelf: 'Mon RVU max pour ce quart',
    noRadBooked: 'Aucun radiologiste inscrit pour le moment.',
    loadingShifts: 'Chargement des quarts...',
    weekdays: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
  },
  rvuPage: {
    title: 'Crédits RVU',
    lead: 'Crédits manuels réservés aux admins. Les catégories « gagnés » et « donnés » sont suivies séparément ; les deux ajoutent des RVU à la charge du radiologiste à la date choisie.',
    total: 'Total :',
    earned: 'Gagnés :',
    given: 'Donnés :',
    addEntry: 'Ajouter une entrée de crédit',
    radiologist: 'Radiologiste',
    category: 'Catégorie',
    earnedCredits: 'Crédits gagnés',
    givenCredits: 'Crédits donnés',
    amount: 'Montant RVU',
    applyDate: "Date d'application",
    noteOptional: 'Note (optionnel)',
    notePlaceholder: 'Motif / contexte',
    addCredit: 'Ajouter le crédit RVU',
    saving: 'Enregistrement…',
    history: 'Historique des crédits',
    colApplyDate: "Date d'application",
    colRad: 'Radiologiste',
    colCategory: 'Catégorie',
    colAmount: 'Montant',
    colNote: 'Note',
    noEntries: 'Aucune entrée de crédit pour le moment.',
    loading: 'Chargement des crédits…',
    confirmAdd: 'Ajouter cette entrée de crédit RVU ? Elle sera appliquée à la date sélectionnée.',
    addedOk: 'Crédit RVU ajouté avec succès.',
    errAmountPositive: 'Le montant doit être un entier positif.',
    loadFailed: 'Échec du chargement des crédits RVU',
    createFailed: 'Échec de la création du crédit RVU',
  },
  specialty: {
    title: 'Correspondance service ↔ sous-spécialité',
    lead: 'Par défaut : général. Mettez à jour une ou plusieurs sous-spécialités pour chaque modalité / catégorie / sous-catégorie.',
    addSubPh: 'Ajouter une sous-catégorie...',
    addSubBtn: 'Ajouter une sous-catégorie',
    subcatRulesHeader: 'Sous-catégories (règles applicables ici seulement)',
    saveRule: 'Enregistrer la règle',
    saving: 'Enregistrement…',
    savedMsg: 'Enregistré.',
  },
};

export function appT(lang: AppLang): AppStrings {
  return lang === 'fr' ? FR : EN;
}
