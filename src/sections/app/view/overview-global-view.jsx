'use client';

import { DashboardContent } from 'src/layouts/dashboard';
import { usePermissions } from 'src/auth/hooks';

// Import des vues des différents rôles
import { OverviewAppView } from '../overview-app-view';
import { AgentAppView } from '../agent/agent-app-view';
import { SuperviserAppView } from '../superviseur/superviseur-app-view';
import { ComptableAppView } from '../comptable/comptable-app-view';
import { CaissierAppView } from '../caissier/caissier-app-view';
import { PrinterAppView } from '../printer';
import AguipeAppView from '../aguipe/AguipeAppView';
import Loading from 'src/app/dashboard/loading';

// ----------------------------------------------------------------------

export function OverviewGlobalView() {
  const { can } = usePermissions();

  // Sélection du dashboard par permission (chaque rôle a SA permission de dashboard).
  const renderView = () => {
    if (can('can_view_admin_dashboard')) return <OverviewAppView />;
    if (can('can_view_agent_dashboard')) return <AgentAppView />;
    if (can('can_view_supervisor_dashboard')) return <SuperviserAppView />;
    if (can('can_view_accountant_dashboard')) return <ComptableAppView />;
    if (can('can_view_treasurer_dashboard')) return <CaissierAppView />;
    if (can('can_view_aguipe_dashboard')) return <AguipeAppView />;
    if (can('can_view_permit_dashboard')) return <PrinterAppView />;
    return <Loading />;
  };

  return <DashboardContent maxWidth="xl">{renderView()}</DashboardContent>;
}
