import { CONFIG } from 'src/config-global';

import { PermissionGuard } from 'src/auth/guard';

import { RegionListView } from 'src/sections/administration/region/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Region list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="can_view_referentials">
      <RegionListView />
    </PermissionGuard>
  );
}
