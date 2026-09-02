import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { AnalyticPaiementView } from 'src/sections/overview/analytics/paiement/view';
import { ReportPaiement } from 'src/sections/overview/rapports/paiement';

// ----------------------------------------------------------------------

export const metadata = { title: `Analytics Paiements - ${CONFIG.appName}` };

export default function Page() {
  return <PermissionGuard permission="can_view_payment_report"><ReportPaiement /></PermissionGuard>;
}
