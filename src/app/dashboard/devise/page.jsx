import { CONFIG } from 'src/config-global';

import { PermissionGuard } from 'src/auth/guard';

import { DeviseListView } from 'src/sections/administration/devise/devise-list-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Devise | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="can_manage_devises">
      <DeviseListView />
    </PermissionGuard>
  );
}
