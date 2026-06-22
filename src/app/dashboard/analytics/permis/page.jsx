import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { ReportPermit } from 'src/sections/overview/rapports/permits';
// ----------------------------------------------------------------------

export const metadata = { title: `Rapport Permits - ${CONFIG.appName}` };

export default function Page() {
  return <PermissionGuard permission="can_view_permit_report"><ReportPermit /></PermissionGuard>;
}
