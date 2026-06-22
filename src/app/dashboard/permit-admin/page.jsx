import { CONFIG } from 'src/config-global';

import { PermissionGuard } from 'src/auth/guard';

import { PermitListView } from 'src/sections/administration/permit/permit-list-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Permit | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="can_manage_permits">
      <PermitListView />
    </PermissionGuard>
  );
}
