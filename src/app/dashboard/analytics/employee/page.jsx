import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { ReportEmployee } from 'src/sections/overview/rapports/employees';
// ----------------------------------------------------------------------

export const metadata = { title: `Rapport Employés - ${CONFIG.appName}` };

export default function Page() {
  return <PermissionGuard permission="can_view_employee_report"><ReportEmployee /></PermissionGuard>;
}
