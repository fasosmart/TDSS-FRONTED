// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      // signUp: `${ROOTS.AUTH}/jwt/sign-up`,
      resetPassword: `${ROOTS.AUTH}/jwt/reset-password`,
      updatePassword: `${ROOTS.AUTH}/jwt/update-password`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    two: `${ROOTS.DASHBOARD}/two`,
    three: `${ROOTS.DASHBOARD}/three`,
    analytics: {
      root: `${ROOTS.DASHBOARD}/analytics`,
      declaration: `${ROOTS.DASHBOARD}/analytics/declaration`,
      facture: `${ROOTS.DASHBOARD}/analytics/facture`,
      paiement: `${ROOTS.DASHBOARD}/analytics/paiement`,
      permis: `${ROOTS.DASHBOARD}/analytics/permis`,
    },
    declaration: {
      root: `${ROOTS.DASHBOARD}/declaration`,
      list: `${ROOTS.DASHBOARD}/declaration/list`,
      new: `${ROOTS.DASHBOARD}/declaration/new`,
      edit: (slug) => `${ROOTS.DASHBOARD}/declaration/${slug}/edit`,
      details: (slug) => `/dashboard/declaration/${slug}`,
      renew: `${ROOTS.DASHBOARD}/declaration/renew`,
      duplica: `${ROOTS.DASHBOARD}/declaration/duplica`,
    },
    factures: {
      root: `${ROOTS.DASHBOARD}/factures`,
      list: `${ROOTS.DASHBOARD}/factures/list`,
      details: (slug) => `/dashboard/factures/${slug}`,
    },
    paiements: {
      root: `${ROOTS.DASHBOARD}/paiements`,
      list: `${ROOTS.DASHBOARD}/paiements/list`,
      details: (slug) => `/dashboard/paiements/${slug}`,
    },
    employee: {
      list : `${ROOTS.DASHBOARD}/employee/list`,
      details:(slug) => `${ROOTS.DASHBOARD}/employee/${slug}`,
    },
    // penalite: {
    //   root: `${ROOTS.DASHBOARD}/penalite`,
    //   list: `${ROOTS.DASHBOARD}/penalite/list`,
    // },

    // Administration    
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      new: `${ROOTS.DASHBOARD}/user/new`,
      list: `${ROOTS.DASHBOARD}/user/list`,
      account: `${ROOTS.DASHBOARD}/user/account`,
      edit: (slug) => `${ROOTS.DASHBOARD}/user/${slug}/edit`,
      details: (slug) => `${ROOTS.DASHBOARD}/user/${slug}`,
    },
    jobCategory: {
      root: `${ROOTS.DASHBOARD}/jobCategory`,
      new: `${ROOTS.DASHBOARD}/jobCategory/new`,
      list: `${ROOTS.DASHBOARD}/jobCategory/list`, 
      details: (slug) => `${ROOTS.DASHBOARD}/jobCategory/${slug}`,
      edit: (slug) => `${ROOTS.DASHBOARD}/jobCategory/${slug}/edit`,
      delete: (slug) => `${ROOTS.DASHBOARD}/jobCategory/${slug}/delete`,
    },
    fonction: {
      root: `${ROOTS.DASHBOARD}/fonction`,
      new: `${ROOTS.DASHBOARD}/fonction/new`,
      list: `${ROOTS.DASHBOARD}/fonction/list`,
      edit: (slug) => `${ROOTS.DASHBOARD}/fonction/${slug}/edit`,
    },
    client: {
      root: `${ROOTS.DASHBOARD}/client`,
      new: `${ROOTS.DASHBOARD}/client/new`,
      details: (slug) => `/dashboard/client/${slug}`,
      edit: (slug) => `${ROOTS.DASHBOARD}/client/${slug}/edit`,
    },
    agence :{
      root: `${ROOTS.DASHBOARD}/agence`,
      new: `${ROOTS.DASHBOARD}/agence/new`,
    },
    region: {
      root: `${ROOTS.DASHBOARD}/region`,
      // list: `${ROOTS.DASHBOARD}/region/list`,
    },
    profilType: {
      root: `${ROOTS.DASHBOARD}/profilType`,
    },
    userType: {
      root: `${ROOTS.DASHBOARD}/userType`,
    },
    devise: {
      root: `${ROOTS.DASHBOARD}/devise`, 
    },
    permit: {
      root: `${ROOTS.DASHBOARD}/permit`,
    },

    // permission: {
    //   root: `${ROOTS.DASHBOARD}/permission`,
    //   new: `${ROOTS.DASHBOARD}/permission/new`,
    //   list: `${ROOTS.DASHBOARD}/permission/list`,
     
    // },
    
    group: {
      root: `${ROOTS.DASHBOARD}/group`,
      five: `${ROOTS.DASHBOARD}/group/five`,
      six: `${ROOTS.DASHBOARD}/group/six`,
    },
  },
};