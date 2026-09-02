import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { Reportfacture } from 'src/sections/overview/rapports/facture';

// ----------------------------------------------------------------------

export const metadata = { title: `Analytics Factures - ${CONFIG.appName}` };

export default function Page() {
  return <PermissionGuard permission="can_view_facture_report"><Reportfacture /></PermissionGuard>;
}
