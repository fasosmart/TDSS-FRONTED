import { CONFIG } from 'src/config-global';

import { PermissionGuard } from 'src/auth/guard';

import { UserTypeListView } from 'src/sections/administration/userType/user-type-list-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Type User | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="can_view_referentials">
      <UserTypeListView />
    </PermissionGuard>
  );
}
