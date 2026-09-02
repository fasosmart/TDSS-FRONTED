import { CONFIG } from 'src/config-global';

import { PermissionGuard } from 'src/auth/guard';

import { ProfilTypeListView } from 'src/sections/administration/profilType/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Type Profil | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="can_view_referentials">
      <ProfilTypeListView />
    </PermissionGuard>
  );
}
