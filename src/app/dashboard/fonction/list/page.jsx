import { CONFIG } from 'src/config-global';

import { PermissionGuard } from 'src/auth/guard';

import { JobListView } from 'src/sections/administration/fonction/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Fonction | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="can_manage_jobs">
      <JobListView />
    </PermissionGuard>
  );
}
