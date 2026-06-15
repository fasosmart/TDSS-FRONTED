import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { PermitListView } from 'src/sections/overview/permit-employee/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Permit | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <PermissionGuard permission="can_view_declaration_employee"><PermitListView /></PermissionGuard>;
}
