import { CONFIG } from 'src/config-global';

import { PermissionGuard } from 'src/auth/guard';

import { UserListView } from 'src/sections/administration/user/view';

// ----------------------------------------------------------------------

export const metadata = { title: `User list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="can_view_user">
      <UserListView />
    </PermissionGuard>
  );
}
