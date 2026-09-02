import { CONFIG } from 'src/config-global';

import { PermissionGuard } from 'src/auth/guard';

import { AgenceListView } from 'src/sections/administration/agence/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Agence | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="can_view_referentials">
      <AgenceListView />
    </PermissionGuard>
  );
}
