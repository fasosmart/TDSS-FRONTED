import { CONFIG } from 'src/config-global';

import { paths } from 'src/routes/paths';

import { SvgColor } from 'src/components/svg-color';

import { usePermissions } from 'src/auth/hooks';

import { Iconify } from 'src/components/iconify';
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
  plan: icon('ic-earth'),
  // sidebar icons
};


// Permissions des différents tableaux de bord
const DASHBOARD_PERMS = [
  'can_view_agent_dashboard',
  'can_view_admin_dashboard',
  'can_view_accountant_dashboard',
  'can_view_treasurer_dashboard',
  'can_view_aguipe_dashboard',
  'can_view_supervisor_dashboard',
  'can_view_permit_dashboard',
];

// Permissions ouvrant le bloc d'administration TDSS (référentiels & gestion métier).
const ADMIN_MANAGE_PERMS = ['can_manage_jobs', 'can_manage_devises', 'can_manage_permits'];

// ----------------------------------------------------------------------

export function useNavData() {
  const { can, canAny } = usePermissions();

  // Rapports
  const reportChildren = [
    can('can_view_declaration_report') && {
      title: 'Declaration',
      path: paths.dashboard.analytics.declaration,
    },
    can('can_view_facture_report') && {
      title: 'Facture',
      path: paths.dashboard.analytics.facture,
    },
    can('can_view_payment_report') && {
      title: 'Paiement',
      path: paths.dashboard.analytics.paiement,
    },
    can('can_view_permit_report') && {
      title: 'Permis de travail',
      path: paths.dashboard.analytics.permis,
    },
    can('can_view_employee_report') && {
      title: 'Employés',
      path: paths.dashboard.analytics.employee,
    },
  ].filter(Boolean);

  return [
    /**
     * Overview
     */
    {
      subheader: "Vue d'ensemble",
      items: [
        ...(canAny(DASHBOARD_PERMS)
          ? [{ title: 'Dashboard', path: paths.dashboard.root, icon: ICONS.dashboard }]
          : []),

        ...(can('can_view_declaration')
          ? [
              {
                title: 'Déclarations',
                path: paths.dashboard.declaration.list,
                icon: ICONS.declaration,
              },
              // {
              //   title: 'Penalités',
              //   path: paths.dashboard.penalite.list,
              //   icon: ICONS.penalite,
              // },
            ]
          : []),

        ...(can('can_view_declaration_employee')
          ? [
              {
                title: 'Permis',
                path: paths.dashboard.permit.root,
                icon: ICONS.permis,
              },
            ]
          : []),

        ...(can('can_view_africanization_plan')
          ? [
              {
                title: "Plan d'Africanisation",
                path: paths.dashboard.planAfricanisation.root,
                icon: <Iconify icon="mdi:earth" width={24} />,
              },
            ]
          : []),

        ...(can('can_view_facture')
          ? [
              {
                title: 'Factures',
                path: paths.dashboard.factures.list,
                icon: ICONS.facture,
              },
            ]
          : []),

        ...(can('can_view_payment')
          ? [
              {
                title: 'Paiements',
                path: paths.dashboard.paiements.list,
                icon: ICONS.paiement,
              },
            ]
          : []),

        ...(can('can_view_employee')
          ? [
              {
                title: 'Employés',
                path: paths.dashboard.employee.list,
                icon: ICONS.employes,
              },
            ]
          : []),

        ...(reportChildren.length > 0
          ? [
              {
                title: 'Rapports',
                path: paths.dashboard.analytics.root,
                icon: ICONS.analytics,
                children: reportChildren,
              },
            ]
          : []),
      ],
    },
    /**
     * Management
     */
    ...(can('can_view_user') || canAny(ADMIN_MANAGE_PERMS)
      ? [
          {
            subheader: 'Administration',
            items: [
              ...(can('can_view_user')
                ? [
                    {
                      title: 'Utilisateurs',
                      path: paths.dashboard.user.list,
                      icon: ICONS.user,
                    },
                  ]
                : []),

              // Bloc TDSS : gestion métier & référentiels, réservé aux profils qui
              // gèrent les jobs, devises ou permits, qui est l'admin TDSS.
              ...(canAny(ADMIN_MANAGE_PERMS)
                ? [
                    ...(can('can_manage_jobs')
                      ? [
                          {
                            title: 'Catégories Fonctions',
                            path: paths.dashboard.jobCategory.root,
                            icon: ICONS.fonction_category,
                          },
                          {
                            title: 'Fonctions',
                            path: paths.dashboard.fonction.list,
                            icon: ICONS.fonction,
                          },
                        ]
                      : []),
                    ...(can('can_view_referentials')
                      ? [
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
                        ]
                      : []),
                    {
                      title: 'Paramètres',
                      icon: ICONS.parameter,
                      children: [
                        ...(can('can_view_referentials')
                          ? [
                              {
                                title: 'Regions',
                                path: paths.dashboard.region.root,
                                icon: ICONS.region,
                              },
                              {
                                title: 'Type Structure',
                                path: paths.dashboard.profilType.root,
                                icon: ICONS.typeStruct,
                              },
                              {
                                title: 'Type Utilisateur',
                                path: paths.dashboard.userType.root,
                                icon: ICONS.typeUser,
                              },
                            ]
                          : []),
                        ...(can('can_manage_devises')
                          ? [
                              {
                                title: 'Devises',
                                path: paths.dashboard.devise.root,
                                icon: ICONS.devise,
                              },
                            ]
                          : []),
                        ...(can('can_manage_permits')
                          ? [
                              {
                                title: 'Type Permis',
                                path: paths.dashboard.permitAdmin.root,
                                icon: ICONS.permis,
                              },
                            ]
                          : []),
                      ],
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
  ];
}
