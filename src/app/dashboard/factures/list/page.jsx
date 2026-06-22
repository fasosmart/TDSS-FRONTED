import { CONFIG } from 'src/config-global';

import { PermissionGuard } from 'src/auth/guard';

import { FactureListView } from 'src/sections/overview/factures/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Factures | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="can_view_facture">
      <FactureListView />
    </PermissionGuard>
  );
}
