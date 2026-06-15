import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

// import { OverviewAnalyticsView } from 'src/sections/overview/analytics/declaration/view';
import { RapportDeclaration } from 'src/sections/overview/rapports/declaration';

// ----------------------------------------------------------------------

export const metadata = { title: `Analytics Declaration - ${CONFIG.appName}` };

export default function Page() {
  return <PermissionGuard permission="can_view_declaration_report"><RapportDeclaration /></PermissionGuard>;
}
