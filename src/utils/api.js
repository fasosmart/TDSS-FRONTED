// const BASE_URL = 'http://192.168.1.152:8000/api'; // Adresse de votre backend


const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`; // Adresse de votre backend

const API = {
  nextjsPage: () => `${BASE_URL}/nextjs/page`, // Vue Next.js
  login: () => `${BASE_URL}/auth/jwt/create/`, // api connexion
  me: () => `${BASE_URL}/users/me/`, // informations de l'utilisateur connecté
  myAssignments: () => `${BASE_URL}/users/my-assignments/`, // permissions granulaires de l'assignment actif
  logout: () => `${BASE_URL}/auth/jwt/logout/`, // deconnexion
  resetPassword: () => `${BASE_URL}/users/reset_password/`, // reinitialisation du password
  resetPasswordConfirmation: () => `${BASE_URL}/users/reset_password_confirm/`, // reinitialisation du password
  changePassword: () => `${BASE_URL}/users/set_password/`, // changer le mot de passe
  changeEmail: () => `${BASE_URL}/users/set_email/`, // changer l'email de l'utilisateur

  dashboardAdmin: () => `${BASE_URL}/declarations/dashboard-admin/`, // Dashboard admin

  dashboardPrinter: () => `${BASE_URL}/declarations/dashboard-printer/`, // Dashboard imprimeur

  createUser: () => `${BASE_URL}/users/`, // Création d'un utilisateur
  listUsers: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return `${BASE_URL}/users/?${searchParams}`;
  }, // Liste des utilisateurs avec paramètres
  listUserTypes: () => `${BASE_URL}/profiles/user-types/`, // Liste des types d'utilisateurs
  deleteUser: (slug) => `${BASE_URL}/users/${slug}/`, // Suppression d'un utilisateur
  updateUser: (slug) => `${BASE_URL}/users/${slug}/`, // Mise à jour d'un utilisateur
  userDetails: (slug) => `${BASE_URL}/users/${slug}/`, // Détails d'un utilisateur
  userDelete: (slug) => `${BASE_URL}/users/${slug}/`, // Supprimer un utilisateur
  activateAccount: () => `${BASE_URL}/users/activation/`, // activer le compte d'un utilisateur
  addProfileToUser: () => `${BASE_URL}/users/add-profile/`, // Ajouter un profil à un utilisateur

  listDeclarations: () => `${BASE_URL}/declarations/`, // Liste des déclarations
  createDeclaration: () => `${BASE_URL}/declarations/`, // Création d'une déclaration
  detailsDeclaration: (slug) => `${BASE_URL}/declarations/${slug}/`, // Voir les details d'une déclaration
  validateDeclaration: (slug) => `${BASE_URL}/declarations/${slug}/validate/`, // Validation d'une déclaration
  submitDeclaration: (slug) => `${BASE_URL}/declarations/${slug}/submit/`, // Soumettre une déclaration
  // unsubmitDeclaration: (slug) => `${BASE_URL}/declarations/${slug}/unsubmit/`, // mettre le statut rejet en statut non-soumise d'une déclaration
  facturerDeclaration: (slug) => `${BASE_URL}/declarations/${slug}/facturer/`, // facturer une déclaration

  FacturerDeclaration: () => `${BASE_URL}/declarations/facturer/`,
  rejetterDeclaration: (slug) => `${BASE_URL}/declarations/${slug}/reject/`, // Rejetter une déclaration
  supprimerDeclaration: (slug) => `${BASE_URL}/declarations/${slug}/`, // Supprimer une déclaration

  retirerDeclaration: (slug) => `${BASE_URL}/factures/${slug}/remove-declaration/`, // Supprimer une déclaration dans une facture
  ajouterDeclaration: (slug) => `${BASE_URL}/factures/${slug}/add-declaration/`, // Ajouter une déclaration dans une facture

  updateDeclaration: (slug) => `${BASE_URL}/declarations/${slug}/`, // Modifier une déclaration
  move: (slug) => `${BASE_URL}/declarations/${slug}/move-employees/`, // deplacer des employés d'une déclaration à une autre
  unsubmitDeclaration: (slug) => `${BASE_URL}/declarations/${slug}/unsubmit/`, // remettre le statut a non soumettre

  statsDeclaration: () => `${BASE_URL}/declarations/stats/`,

  // Dashboard Agent
  agentDashboard: (year = null) => {
    let url = `${BASE_URL}/declarations/dashboard-agent/`;
    if (year && year !== 'all') {
      url += `?year=${year}`;
    }
    return url;
  },

  Employe: (slug) => `${BASE_URL}/declarations/employees/?declaration=${slug}`, // Liste des employés d'une declaration
  CreateEmployee: `${BASE_URL}/employees/create/`, // Ajouter un employé
  UpdateEmploye: (declarationSlug, employeeSlug) =>
    `${BASE_URL}/declarations/${declarationSlug}/employees/${employeeSlug}/`, // Modifier un employé d'une déclaration
  DeleteEmploye: (slug) => `${BASE_URL}/declarations/${slug}/delete-employees/`, // Supprimer un ou plusieurs employés d'une déclaration
  AddEmploye: (slug) => `${BASE_URL}/declarations/${slug}/add-employees/`, // Ajouter un employé à une déclaration
  listEmployee: () => `${BASE_URL}/employees/`, // liste de tous les employés
  detailsEmployee: (slug) => `${BASE_URL}/employees/${slug}/`, // details d'un employé

  listFactures: () => `${BASE_URL}/factures/`, // Liste des factures
  paidFacture: () => `${BASE_URL}/factures/mark-paid/`, // Paiement d'une facture
  detailsFacture: (slug) => `${BASE_URL}/factures/${slug}/`, // Details d'une facture
  facturesFirstLineDashboardCaissier: (month) =>
    `${BASE_URL}/factures/dashboard-caissier/first-line/?month=${month}`, // Premiere ligne du tableau de bord des caissiers
  facturesLastUnpaid: () => `${BASE_URL}/factures/last-unpaid/`, // dernieres Factures non payées
  statsFactures: () => `${BASE_URL}/factures/stats`,

  listPaiments: () => `${BASE_URL}/payments/`, // Liste des paiements
  statsPaiements: () => `${BASE_URL}/payments/stats/`, // Agrégats (total nombre + montants)
  detailsPaiement: (slug) => `${BASE_URL}/payments/${slug}/`, // Details d'un paiement
  removePayment: (slug) => `${BASE_URL}/payments/${slug}/`, // supprimer un paiement
  updatepayment: (slug) => `${BASE_URL}/payments/${slug}/`, // modifier les informations d'un paiment
  addInvoiceToPayment: (slug) => `${BASE_URL}/payments/${slug}/add_factures/`, // Ajouter une facture à un paiement
  removeInvoiceFromPayment: (slug) => `${BASE_URL}/payments/${slug}/remove_factures/`, // Supprimer une facture d'un paiement
  validatePayment: (slug) => `${BASE_URL}/payments/${slug}/validate/`, // Valider un paiement

  paiementsMonthly: (year) => `${BASE_URL}/payments/payment-monthly/?year=${year}`, // Paiements

  createFonction: () => `${BASE_URL}/jobs/`, // Ajouter une fonction
  listFonctions: () => `${BASE_URL}/jobs/`, // Liste des fonctions

  detailsFonction: (slug) => `${BASE_URL}/jobs/${slug}/`, // details d'une fonction
  deleteFonction: (slug) => `${BASE_URL}/jobs/${slug}/`, // Supprimer une fonction
  editFonction: (slug) => `${BASE_URL}/jobs/${slug}/`, // modifier une fonction
  listCategories: () => `${BASE_URL}/jobs/agent/job-categories/`,
  listFonctionAgent: () => `${BASE_URL}/jobs/agent/jobs-list/`, // Liste des fonctions des agents

  CreateBank: () => `${BASE_URL}/bank/create`,
  listBank: () => `${BASE_URL}/list_bank/`,

  CreatePayeur: () => `${BASE_URL}/api/payeur/`,

  listRegions: () => `${BASE_URL}/regions/`,

  createAgence: () => `${BASE_URL}/agency/`,
  listAgences: () => `${BASE_URL}/regions/agencies/?limit=100&offset=100/`,

  // activate: (id) => `${BASE_URL}/activate-user/${id}/`,
  banni: (id) => `${BASE_URL}/banni-user/${id}/`,

  searchIdentifier: (identifier) => `${BASE_URL}/api/search_identifier/?identifier=${identifier}`,
  searchPassport: (passport_number) => `${BASE_URL}/employees/passport/${passport_number}`,

  createPermission: () => `${BASE_URL}/permission/`,
  listPermissions: () => `${BASE_URL}/permission/`, // Liste des fonctions

  listProfilesTypes: () => `${BASE_URL}/profiles/types/`,

  createProfile: () => `${BASE_URL}/profiles/`,
  getProfile: (profile_code) => `${BASE_URL}/profiles/profile-types/${profile_code}/`, // recuperer les roles en fonction du profil
  listProfiles: () => `${BASE_URL}/profiles/?limit=200&offset=200/`,
  detailsProfile: (slug) => `${BASE_URL}/profiles/${slug}/`,
  UpdateProfile: (slug) => `${BASE_URL}/profiles/${slug}/`,
  listActiveProfile: () => `${BASE_URL}/profiles/active-profiles/`,
  // listEntreprises: () => `${BASE_URL}/profiles/active-profiles/?type=entreprise`, // Liste des entreprises
  listEntreprises: (params = {}) => {
    const searchParams = new URLSearchParams({ type: 'entreprise', ...params }).toString();
    return `${BASE_URL}/profiles/active-profiles/?${searchParams}`;
  }, // Liste des entreprises avec des params

  // Endpoints pour le dashboard agent
  getAgentCompanies: () => `${BASE_URL}/agent/companies/`, // Liste des entreprises gérées par l'agent
  getAgentSummary: (companyId = 'all') => `${BASE_URL}/agent/summary/?company=${companyId}`, // Résumé des données de l'agent
  getAgentChartData: (companyId = 'all') => `${BASE_URL}/agent/charts/?company=${companyId}`, // Données pour les graphiques
  getAgentRecentDeclarations: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return `${BASE_URL}/agent/declarations/?${searchParams}`;
  }, // Déclarations récentes de l'agent
  getAgentRecentEmployees: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return `${BASE_URL}/agent/employees/?${searchParams}`;
  }, // Employés récents de l'agent
  getAgentNotifications: () => `${BASE_URL}/agent/notifications/`, // Notifications de l'agent
  exportAgentData: (companyId = 'all', period = 'month') =>
    `${BASE_URL}/agent/export/?company=${companyId}&period=${period}`, // Exporter les données de l'agent

  listDevises: () => `${BASE_URL}/devises/`,
  Devises: () => `${BASE_URL}/devises/list/`,
  listPermits: () => `${BASE_URL}/permits/`,

  listCountry: () => `${BASE_URL}/regions/countries/`,

  listCountries: () => `${BASE_URL}/payments/countries/`,

  // job-category
  createJobCategory: () => `${BASE_URL}/jobs/job-category/`,
  listJobCategory: () => `${BASE_URL}/jobs/job-category/`,
  detailsJobCategory: (slug) => `${BASE_URL}/jobs/job-category/${slug}/`,
  editJobCategory: (slug) => `${BASE_URL}/jobs/job-category/${slug}/`,
  deleteJobCategory: (slug) => `${BASE_URL}/jobs/job-category/${slug}/`,

  // Listes des  api pour les permis des employés
  listPermitsEmployees: () => `${BASE_URL}/declarations/employees/`,
  listPendingPermitsEmployees: () => `${BASE_URL}/declarations/employees/pending-print/`,
  listPrintedPermitsEmployees: () => `${BASE_URL}/declarations/employees/printed/`,
  detailPermitEmployee: (slug) => `${BASE_URL}/declarations/employees/${slug}/`,
  printPermis: () => `${BASE_URL}/declarations/employees/mark-as-print/`,
  deliverPermit: (slug) => `${BASE_URL}/declarations/employees/${slug}/deliver/`,
  rejectPermit: (slug) => `${BASE_URL}/declarations/employees/${slug}/correction/`,
  submitPermit: (slug) => `${BASE_URL}/declarations/employees/${slug}/submit/`,
  unsubmitPermit: (slug) => `${BASE_URL}/declarations/employees/${slug}/unsubmit/`,
  validatePermit: (slug) => `${BASE_URL}/declarations/employees/${slug}/validate/`,
  updateFile: (slug) => `${BASE_URL}/declarations/employees/${slug}/update-file/`,
  listRejectReasons: () => `${BASE_URL}/declarations/employees/type-reject-reason/`,
  updatePermit: (declarationSlug, employeeSlug) =>
    `${BASE_URL}/declarations/${declarationSlug}/employees/${employeeSlug}/`,

  // Listes des api pour les penalités
  listPenalties: () => `${BASE_URL}/penalties/`,
  createPenalty: () => `${BASE_URL}/penalties/`,
  detailsPenalty: (slug) => `${BASE_URL}/penalties/${slug}/`,
  billPenalty: (slug) => `${BASE_URL}/penalties/${slug}/bill/`,
  cancelPenalty: (slug) => `${BASE_URL}/penalties/${slug}/cancel/`,

  // Listes des api pour le plan de panafricanisation

  listAfricanizationPlan: () => `${BASE_URL}/documents/africanization-plans/`,
  detailsAfricanizationPlan: (slug) => `${BASE_URL}/documents/africanization-plans/${slug}/`,
  createAfricanizationPlan: () => `${BASE_URL}/documents/create-africanization-plan/`,
  reassign: (slug) => `${BASE_URL}/documents/africanization-plans/${slug}/reassign/`,
  replaceGuinean: (slug) => `${BASE_URL}/documents/africanization-plans/${slug}/replace-guinean/`,

  // listes des api pour les documents des employés
  addDocument: () => `${BASE_URL}/documents/`,

  documents: () => `${BASE_URL}/documents/types/`,
  updateDocument: (slug) => `${BASE_URL}/documents/${slug}/`,

  // Listes des api pour les documents des entreprises
  listCompanyDocuments: () => `${BASE_URL}/profiles/documents/`,
  typesCompanyDocuments: () => `${BASE_URL}/profiles/documents/types/`,
  addCompanyDocument: () => `${BASE_URL}/profiles/documents/`,
  updateCompanyDocument: (slug) => `${BASE_URL}/profiles/documents/${slug}/`,

  // Tableau de bord comptable
  getDeclarationsToInvoice: (month = null) => {
    const url = `${BASE_URL}/declarations/to-invoice/`;
    return month ? `${url}?month=${month}` : url;
  },
  getAccountantFirstLine: (month = null) => {
    const url = `${BASE_URL}/factures/accountant-dashboard/first-line/`;
    return month ? `${url}?month=${month}` : url;
  },
  getMonthlyInvoices: (year = null) => {
    const url = `${BASE_URL}/factures/facture-monthly/`;
    return year ? `${url}?year=${year}` : url;
  },
  getLastValidatedDeclarations: () => `${BASE_URL}/declarations/last-validated/`,

  getEcheances: () => `${BASE_URL}/factures/echeances/`,

  // Tableau de bord AGUIP
  getAguipDashboard: (startDate = null, endDate = null) => {
    const url = `${BASE_URL}/declarations/dashboard-aguip/`;
    const params = new URLSearchParams();

    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  },

  // listes des api pour les différents rapports
  reportsDeclaration: () => `${BASE_URL}/reports/declarations/`,
  reportsFactures: () => `${BASE_URL}/reports/factures/`,
  reportsPaiement: () => `${BASE_URL}/reports/payments/`,
  reportsPermits: () => `${BASE_URL}/reports/permits/`,
  reportsEmployees: () => `${BASE_URL}/reports/employees/`,

  // Endpoint ABIS
  // ABIS désactivé 
  // saveEmployeeToABIS: (slug) => `${BASE_URL}/abis/employees/${slug}/enroll/`,
  // getEmployeeFromABIS: (slug) => `${BASE_URL}/abis/employees/${slug}`,
  // updateABISEmployee: (slug) => `${BASE_URL}/abis/employees/${slug}/update/`,
};

export default API;
