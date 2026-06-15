import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { JobCreateView } from 'src/sections/administration/fonction/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Create a new job | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <PermissionGuard permission="can_manage_jobs"><JobCreateView /></PermissionGuard>;
}
