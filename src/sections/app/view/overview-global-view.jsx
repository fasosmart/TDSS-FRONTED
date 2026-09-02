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
import { EmptyContent } from 'src/components/empty-content';

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
    return (
      <EmptyContent
        filled
        title="Aucun tableau de bord disponible"
        description="Votre compte ne dispose d'aucun tableau de bord. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur."
        sx={{ py: 10 }}
      />
    );
  };

  return <DashboardContent maxWidth="xl">{renderView()}</DashboardContent>;
}
