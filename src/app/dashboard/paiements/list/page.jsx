import { CONFIG } from 'src/config-global';

import { PermissionGuard } from 'src/auth/guard';

import { PaiementListView } from 'src/sections/overview/paiements/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Paiements | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="can_view_payment">
      <PaiementListView />
    </PermissionGuard>
  );
}
