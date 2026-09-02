import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';
import { JobCategoryCreateView } from 'src/sections/administration/JobCategory/view';
// ----------------------------------------------------------------------

export const metadata = { title: `New Job Category | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <PermissionGuard permission="can_manage_jobs"><JobCategoryCreateView /></PermissionGuard>;
}
