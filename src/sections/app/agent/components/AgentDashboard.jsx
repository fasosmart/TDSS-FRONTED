import { useState, useEffect, useCallback } from 'react';
import { Container } from '@mui/material';
import { toast } from 'src/components/snackbar';
import { useAuthContext } from 'src/auth/hooks';
import { useSettingsContext } from 'src/components/settings/context/use-settings-context';

// Import du service API
import { AgentDashboardService } from 'src/services/api/agent-dashboard';

// Importation des composants modulaires
import {
  AgentDashboardHeader,
  AgentStatCards,
  AgentChartSection,
  AgentDeclarationsSection
} from './dashboard';

// ----------------------------------------------------------------------

// Obtenir la liste des entreprises de l'agent (sera remplacé par un appel API réel)
const AGENT_COMPANIES = [
  'Entreprise ABC',
  'Société XYZ',
];

// ----------------------------------------------------------------------

export  function AgentDashboard() {
  // Utiliser le contexte d'authentification pour obtenir l'utilisateur actuel
  const { user } = useAuthContext();
  const settings = useSettingsContext();

  // États pour les filtres
  const [companyFilter, setCompanyFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  // États pour les données
  const [summaryData, setSummaryData] = useState({
    totalDeclarations: 0,
    unsubmittedDeclarations: 0,
    rejectedDeclarations: 0
  });
  const [chartData, setChartData] = useState([]);
  const [recentDeclarations, setRecentDeclarations] = useState([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // États pour le chargement et les erreurs
  const [loading, setLoading] = useState({
    summary: true,
    charts: true,
    declarations: true
  });
  const [errors, setErrors] = useState({
    summary: '',
    charts: '',
    declarations: ''
  });

  // Fonction pour gérer l'exportation des données
  const handleExportData = async () => {
    try {
      // Utiliser le service API pour exporter les données
      const filters = {
        company: companyFilter,
        period: periodFilter
      };
      
      await AgentDashboardService.exportDashboardData(filters);
      toast.success('Exportation terminée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      toast.error('Erreur lors de l\'exportation');
    }
  };

  // Fonction pour charger les données de l'agent
  const fetchAgentData = useCallback(async () => {
    
    // Charger les données du dashboard
    setLoading(prev =>({
      ...prev,
      summary: true,
      charts: true,
      declarations: true
    }));

    // Réinitialiser les erreurs
    setErrors({
      summary: '',
      charts: '',
      declarations: ''
    });
    
    try {
      // Appel à l'API pour récupérer les données du dashboard
      const dashboardData = await AgentDashboardService.getDashboardData(
        selectedYear // Ajouter l'année sélectionnée
      );

      // Mettre à jour les données du graphique
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const chartDataFormatted = Object.entries(dashboardData.number_declaration_of_year || {}).map(([month, value]) => ({
        month: monthNames[parseInt(month, 10) - 1],
        value
      }));
      setChartData(chartDataFormatted);
      
      // Mettre à jour les données de résumé
      setSummaryData({
        totalDeclarations: dashboardData.statistiques.total_number_declaration || 0,
        unsubmittedDeclarations: dashboardData.statistiques.unsumit_number_declaration || 0,
        rejectedDeclarations: dashboardData.statistiques.rejected_number_declaration || 0
      });

      // Mettre à jour les déclarations récentes
      /* if (dashboardData.recent_declarations) {
        setRecentDeclarations(dashboardData.recent_declarations);
      }
       */

      // Transformer les données des déclarations
      const declarationsFormatted = (dashboardData.declarations || []).map(declaration => ({
        id: declaration.slug,
        reference: declaration.reference,
        number: declaration.number,
        date: declaration.created_on,
        company: declaration.company,
        status: declaration.status.toLowerCase(),
        employees: declaration.nb_employees,
        title: declaration.title,
        comment: declaration.comment
      }));
      setRecentDeclarations(declarationsFormatted);
      
      // Mettre à jour l'état de chargement
      setLoading({
        summary: false,
        charts: false,
        declarations: false
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données du dashboard:', error);
      setErrors({
        summary: 'Erreur lors du chargement des données',
        charts: 'Erreur lors du chargement des données',
        declarations: 'Erreur lors du chargement des données'
      });
      setLoading({
        summary: false,
        charts: false,
        declarations: false
      });
    } finally {
      setLoading({
        summary: false,
        charts: false,
        declarations: false
      });
    }
  }, [periodFilter, selectedYear]);

  // Fonction pour gérer le changement d'année
const handleYearChange = (year) => {
  setSelectedYear(year);
  // Pas besoin d'appeler fetchAgentData ici car l'effet sera déclenché par le changement de selectedYear
};

  // Charger les données au chargement du composant
  useEffect(() => {
    fetchAgentData();
  }, [fetchAgentData]);

  // Gérer le changement de filtre d'entreprise
  const handleCompanyFilterChange = (event) => {
    setCompanyFilter(event.target.value);
  };

  // Gérer le changement de filtre de période
  const handlePeriodFilterChange = (event) => {
    setPeriodFilter(event.target.value);
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {/* En-tête avec filtres et boutons d'action */}
      <AgentDashboardHeader 
        user={user}
        companyFilter={companyFilter}
        onCompanyChange={handleCompanyFilterChange}
        companies={AGENT_COMPANIES}
        onRefresh={fetchAgentData}
        onExport={handleExportData}
        loading={loading.summary || loading.charts || loading.declarations}
      />

      {/* Cartes de statistiques */}
      <AgentStatCards 
        stats={{
          total: summaryData.totalDeclarations,
          pending: summaryData.unsubmittedDeclarations,
          rejected: summaryData.rejectedDeclarations
        }}
        loading={loading.summary}
      />

      {/* Section graphique */}
      <AgentChartSection 
        chartData={chartData}
        loading={loading.charts}
        error={errors.charts}
        onRetry={() => fetchAgentData()}
        onYearChange={handleYearChange}
        selectedYear={selectedYear}
      />

      {/* Section déclarations récentes */}
      <AgentDeclarationsSection 
        declarations={recentDeclarations}
        loading={loading.declarations}
        error={errors.declarations}
        onRetry={() => fetchAgentData()}
      />
    </Container>
  );
}