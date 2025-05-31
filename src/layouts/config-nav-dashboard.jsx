import { CONFIG } from 'src/config-global';

import { paths } from 'src/routes/paths';

import { SvgColor } from 'src/components/svg-color';

import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  penalite: icon('ic-course'),
  facture: icon('ic-invoice'),
  booking: icon('ic-booking'),
  paiement: icon('ic-banking'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  declaration: icon('ic-declaration'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-settings'),
  company: icon('ic-agence'),
  permis: icon('ic-permit'),
  devise: icon('ic-devise'),
  employes: icon('ic-employes'),
  fonction: icon('ic-job'),
  fonction_category: icon('ic-fonction-category'),
  region: icon('ic-region'),
  permission: icon('ic-permission'),
  typeUser: icon('ic-type-user'),
  typeStruct: icon('ic-type-struct'),
  // sidebar icons
  
};

// ----------------------------------------------------------------------

export function useNavData () {

  const {user} = useMockedUser();


  const type = user?.type_name?.toLowerCase().trim();


  const profil = user?.companies[0]?.type_name.toLowerCase().trim();


  return [
  /**
   * Overview
   */
  {
    subheader: "Vue d'ensemble",
    items: [
      ...(type === 'admin' || type === 'caissier' || type === 'comptable' || type === 'agent' || type === 'aguipe'
        ? [
            { title: 'Dashboard', path: paths.dashboard.root, icon: ICONS.dashboard },
            ]
        : []),

            
        ...(type === 'admin' || type === 'aguipe' || type === 'ministère' ?
          [
            {
              title: 'Statistiques',
              path: paths.dashboard.analytics.root,
              icon: ICONS.analytics,
              children: [
                { title: 'Declaration', path: paths.dashboard.analytics.declaration },
                { title: 'Facture', path: paths.dashboard.analytics.facture },
                { title: 'Paiement', path: paths.dashboard.analytics.paiement },
                { title: 'Penalité', path: paths.dashboard.group.root },
                { title: 'Permis de travail', path: paths.dashboard.analytics.permis },
              ],
            },
            ]
          : []),
        

      ...(type === 'comptable' || type === 'agent' || type === 'aguipe' || type === 'admin'
        ? [
            {
              title: 'Déclarations',
              path: paths.dashboard.declaration.list,
              icon: ICONS.declaration,
            },
          ]
        : []),
      ...(type === 'comptable' || type === 'caissier' || type === 'admin'
        ? [
            {
              title: 'Factures',
              path: paths.dashboard.factures.list,
              icon: ICONS.facture,
            },
          ]
        : []),
      ...(type === 'caissier' || type === 'admin'
        ? [
            {
              title: 'Paiements',
              path: paths.dashboard.paiements.list,
              icon: ICONS.paiement,
            },
          ]
        : []),
      ...(type === 'agent' || type === 'admin'
        ? [
            {
              title: 'Employés',
              path: paths.dashboard.employee.list,
              icon: ICONS.employes,
            },
          ]
        : []),
    ],
  },
  /**
   * Management
   */
  ...(type === 'admin'
    ? [
      {
        subheader: 'Administration',
        items: [
          {
            title: 'Utilisateurs',
            path: paths.dashboard.user.list,
            icon: ICONS.user,
            // children: [
            //   { title: 'Listes Utilisateurs', path: paths.dashboard.user.list },
            //   { title: 'Nouveau', path: paths.dashboard.user.new },
            // ],
          },

          ...(profil === 'tdss' ? 
            [
          {

            title: 'Catégories Fonctions',
            path: paths.dashboard.jobCategory.root,
            icon: ICONS.fonction_category,
            // children: [
            //   { title: 'Listes Catégories Professionnelles', path: paths.dashboard.jobCategory.list },
            //   { title: 'Nouvelle', path: paths.dashboard.jobCategory.new },
            // ]
          },
          {
            title: 'Fonctions',
            path: paths.dashboard.fonction.list,
            icon: ICONS.fonction,
            // children: [
            //   { title: 'Listes Fonctions', path: paths.dashboard.fonction.list },
            //   { title: 'Nouvelle', path: paths.dashboard.fonction.new },
            // ],
          },
          {
            title: 'Structures',
            path: paths.dashboard.client.root,
            icon: ICONS.tour,
          },
          {
            title: 'Agence',
            path: paths.dashboard.agence.root,
            icon: ICONS.company,
          },
          // {
          //   title: 'Permissions',
          //   path: paths.dashboard.permission.list,
          //   icon: ICONS.permission,
            // },
            {
            title: 'Paramètres',
            icon: ICONS.parameter,
            children: [
              { title: 'Regions', path: paths.dashboard.region.root, icon: ICONS.region },
              { title: 'Type Structure', path: paths.dashboard.profilType.root, icon: ICONS.typeStruct },
              { title: 'Type Utilisateur', path: paths.dashboard.userType.root, icon: ICONS.typeUser },
              { title: 'Devises', path: paths.dashboard.devise.root, icon: ICONS.devise },
              { title: 'Permits', path: paths.dashboard.permit.root, icon: ICONS.permis },
            ],
            },
            ]
          : []),
          // {
          //   title: 'Regions',
          //   path: paths.dashboard.region.root,
          //   icon: ICONS.region,
          // },
          // {
          //   title: 'Type  Structure',
          //   path: paths.dashboard.profilType.root,
          //   icon: ICONS.typeStruct,
          // },
          // {
          //   title: 'Type Utilisateur',
          //   path: paths.dashboard.userType.root,
          //   icon: ICONS.typeUser,
          // },
          // {
          //   title: 'Devises',
          //   path: paths.dashboard.devise.root,
          //   icon: ICONS.devise,
          // },
          // {
          //   title: 'Permits',
          //   path: paths.dashboard.permit.root,
          //   icon: ICONS.permis,
          // }
        ],
      },
    ]
    : []),

]
};