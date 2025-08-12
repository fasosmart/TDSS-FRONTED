import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
  Alert,
  AlertTitle,
  IconButton,
} from '@mui/material';
import { Scrollbar } from 'src/components/scrollbar';
import { useTheme, alpha } from '@mui/material/styles';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import { Iconify } from 'src/components/iconify';
import { useResponsive } from 'src/hooks/use-responsive';
import ComptableService from 'src/services/comptableService';
import { CurrencySelector, CURRENCIES } from 'src/components/CurrencySelector';
import { fDate } from 'src/utils/format-time';

import { ComptableDeclarationTable } from './ComptableTables';
import { ComptableFacturationChart } from './ComptableCharts';
import { ComptableWidgetSummary } from './ComptableWidgetSummary';
import API from 'src/utils/api';
import axios from 'src/utils/axios';
import { useRouter } from 'next/navigation';
import { fCurrency, fEuro , fGNF } from 'src/utils/format-number';

// ----------------------------------------------------------------------

const UPCOMING_DUE_DATES = [
  {
    id: '1',
    title: 'Facture #INV-2023-045',
    dueDate: new Date('2023-06-15'),
    amount: 1250000,
    status: 'pending',
    daysLeft: 12,
  },
  {
    id: '2',
    title: 'Facture #INV-2023-042',
    dueDate: new Date('2023-06-20'),
    amount: 875000,
    status: 'pending',
    daysLeft: 17,
  },
  {
    id: '3',
    title: 'Facture #INV-2023-038',
    dueDate: new Date('2023-06-05'),
    amount: 1500000,
    status: 'overdue',
    daysLeft: -2,
  },
];

// ----------------------------------------------------------------------



export function ComptableDashboard() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const isDesktop = useResponsive('up', 'md');
  const [period, setPeriod] = useState('month');
  const [statusFilter, setStatusFilter] = useState([]);
  const [chartRange, setChartRange] = useState('month');
  const [declarations, setDeclarations] = useState([]);
  const [currency, setCurrency] = useState('XOF');
  const [echeances, setEcheances] = useState([]);
  const [loadingEcheances, setLoadingEcheances] = useState(true);
  const [errorEcheances, setErrorEcheances] = useState(null);
  const [devise, setDevise] = useState('GNF');
  const router = useRouter();


  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i); // 5 dernières années

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    // Recharger les données pour la nouvelle année sélectionnée
    fetchInvoicesData();
  };

  const afficherMontant = (montant) => {
  if (devise === 'GNF') {
    return fGNF(montant);
  } else if (devise === 'USD') {
    return fCurrency(montant / 9200); // Exemple: 1 USD = 9200 GNF
  } else if (devise === 'EUR') {
    return fEuro(montant / 10000); // Exemple: 1 EUR = 10000 GNF
  }
};

  // États pour les données du dashboard
  const [dashboardData, setDashboardData] = useState({
    declarationsToInvoice: 0,
    totalInvoices: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    monthlyData: { months: [], data: [] },
    lastDeclarations: [],
  });

  const [loading, setLoading] = useState({
    summary: false,
    declarations: false,
    invoices: false,
    charts: false,
  });

  const [errors, setErrors] = useState({
    summary: null,
    declarations: null,
    invoices: null,
    charts: null,
  });

  // Données pour le graphique d'objectif mensuel
  const targetAmount = 20000000; // 20 000 000 FCFA
  const progress = Math.min(Math.round((dashboardData.totalRevenue / targetAmount) * 100), 100);

  const chartData = useMemo(
    () => ({
      series: [
        {
          name: 'Nombre de factures',
          data: dashboardData.monthlyData.data || [],
        },
      ],
      categories:
        dashboardData.monthlyData.months?.map((month) => {
          // Convertir le numéro du mois en nom de mois
          const date = new Date(2023, parseInt(month, 10) - 1, 1);
          return date.toLocaleString('fr-FR', { month: 'short' });
        }) || [],
      stats: [
        {
          label: 'Total annuel',
          value: dashboardData.monthlyData.data?.reduce((sum, val) => sum + val, 0) || 0,
        },
      ],
    }),
    [dashboardData.monthlyData]
  );

  const chartOptions = useMemo(
    () => ({
      chart: {
        toolbar: { show: false },
        zoom: { enabled: false },
        sparkline: { enabled: false },
      },
      colors: [theme.palette.primary.main],
      xaxis: {
        categories: chartData.categories,
      },
      yaxis: {
        title: {
          text: 'Nombre de factures',
        },
        labels: {
          formatter: (value) => (Math.round(value) === value ? value : ''), // Affiche uniquement les entiers
        },
      },
      tooltip: {
        y: {
          formatter: (value) => fCurrency(value),
        },
      },
      stroke: {
        width: 2,
        curve: 'smooth',
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0.1,
          stops: [0, 100],
        },
      },
    }),
    [chartData.categories, theme.palette.primary.main]
  );

  /* // Gestion des changements de filtre
  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
    // Ici, vous pourriez ajouter une logique pour recharger les données en fonction de la période sélectionnée
    console.log('Période sélectionnée:', event.target.value);
  }; */

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    // Ici, vous pourriez filtrer les données en fonction du statut sélectionné
    console.log('Statuts sélectionnés:', event.target.value);
  };

  const handleChartRangeChange = (event) => {
    setChartRange(event.target.value);
    // Ici, vous pourriez ajuster la plage de données affichée dans les graphiques
    console.log('Plage de graphique sélectionnée:', event.target.value);
  };

  const handleExport = () => {
    // Logique d'exportation des données
    console.log('Exportation des données...');
    // Ici, vous pourriez implémenter la logique pour exporter les données au format CSV, Excel, etc.
  };

  const handleCreateNew = () => {
    // Logique de création d'un nouvel élément (déclaration, facture, etc.)
    console.log("Création d'un nouvel élément...");
    // Ici, vous pourriez implémenter la navigation vers un formulaire de création
  };

  const handleRowClick = (id) => console.log('Row clicked:', id);
  // Navigation vers la page de détail
  // router.push(`/dashboard/declarations/${id}`);

  const handleNotificationClose = () => {
    // Gestion de la fermeture de la notification
    console.log('Notification fermée');
    // Ici, vous pourriez mettre à jour l'état pour masquer la notification
  };

  // Fonction utilitaire pour le choix de la money
  const formatAmount = (amount) => {
    const formatter = CURRENCIES[currency]?.formatter || 'fCurrency';
    const formatFn =
      {
        fCurrency: fCurrency,
        fEuro: fEuro,
        fGNF: fGNF,
      }[formatter] || fCurrency;

    return formatFn(amount, {
      minimumFractionDigits: 0,
      maximumFractionDigits: currency === 'GNF' ? 0 : 2,
    });
  };

  // Fonction pour obtenir la couleur en fonction du statut
  const getStatusColor = (status) => {
    const statusColors = {
      paid: 'success',
      pending: 'warning',
      overdue: 'error',
      draft: 'default',
    };
    return statusColors[status] || 'default';
  };

  // Fonction pour obtenir l'icône en fonction du statut
  const getStatusIcon = (status) => {
    const statusIcons = {
      paid: 'mdi:check-circle',
      pending: 'mdi:clock-time-four',
      overdue: 'mdi:alert-circle',
      draft: 'mdi:pencil-circle',
    };
    return statusIcons[status] || 'mdi:circle';
  };

  // Récupérer les données de synthèse
  const fetchSummaryData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, summary: true }));
      const data = await ComptableService.getAccountantFirstLine();
      setDashboardData((prev) => ({
        ...prev,
        totalInvoices: data.number_total_factures || 0,
        pendingPayments: data.number_factures_unpaid || 0,
        totalRevenue: data.total_factures_amount || 0,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des données de synthèse:', error);
      setErrors((prev) => ({
        ...prev,
        summary: 'Erreur lors du chargement des données de synthèse',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, summary: false }));
    }
  }, []);

  // Fonction pour charger les échéances
  const fetchEcheances = async () => {
    try {
      setLoadingEcheances(true);
      setErrorEcheances(null);
      
      // Utiliser l'instance axios configurée qui gère déjà l'authentification
      const response = await axios.get(API.getEcheances());
      
      // Vérifier que la réponse contient des données valides
      if (!response.data) {
        throw new Error('Aucune donnée reçue du serveur');
      }
      
      // S'assurer que les données sont un tableau avant d'utiliser slice
      const echeancesData = Array.isArray(response.data) ? response.data : [];
      setEcheances(echeancesData.slice(0, 5));
      
    } catch (err) {
      console.error('Erreur lors du chargement des échéances:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      // Afficher un message d'erreur plus détaillé
      const errorMessage = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         'Impossible de charger les échéances. Veuillez réessayer.';
      setErrorEcheances(errorMessage);
      
      // Si l'erreur est une erreur d'authentification (401), déconnecter l'utilisateur
      if (err.response?.status === 401) {
        console.error('Erreur d\'authentification - Déconnexion...');
        // Vous pourriez vouloir rediriger vers la page de connexion ici
        // ou déclencher une déconnexion
      }
      
    } finally {
      setLoadingEcheances(false);
    }
  };

  // Appel au chargement du composant
  useEffect(() => {
    fetchEcheances();
  }, []);

  // Recuper les declarations dernierement validated
  const fetchLastValidatedDeclarations = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, declarations: true }));
      const data = await ComptableService.getLastValidatedDeclarations();
      setDeclarations(data);
    } catch (error) {
      console.error('Erreur lors du chargement des déclarations:', error);
      setErrors((prev) => ({
        ...prev,
        declarations: 'Erreur lors du chargement des déclarations',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, declarations: false }));
    }
  }, []);

  // Récupérer les déclarations
  const fetchDeclarationsData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, declarations: true }));
      const data = await ComptableService.getDeclarationsToInvoice();
      setDashboardData((prev) => ({
        ...prev,
        declarationsToInvoice: data.number_declarations_to_invoice || 0,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des déclarations:', error);
      setErrors((prev) => ({
        ...prev,
        declarations: 'Erreur lors du chargement des déclarations',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, declarations: false }));
    }
  }, []);

  // Récupérer les données des factures
  const fetchInvoicesData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, invoices: true }));
      const data = await ComptableService.getMonthlyInvoices(selectedYear);
      setDashboardData((prev) => ({
        ...prev,
        monthlyData: {
          months: data.month || [],
          data: data.data || [],
        },
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      setErrors((prev) => ({ ...prev, invoices: 'Erreur lors du chargement des factures' }));
    } finally {
      setLoading((prev) => ({ ...prev, invoices: false }));
    }
  }, [selectedYear]); // N'oubliez pas d'ajouter selectedYear aux dépendances

  // 4. Ensuite le useEffect qui appelle ces fonctions
  useEffect(() => {
    fetchSummaryData();
    fetchDeclarationsData();
    fetchInvoicesData();
    fetchLastValidatedDeclarations();
  }, [fetchSummaryData, fetchDeclarationsData, fetchInvoicesData, fetchLastValidatedDeclarations]);

  return (
    <Container maxWidth="xl">
      {/* En-tête amélioré avec dégradé */}
      <Box
        sx={{
          mb: 5,
          p: 3,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.common.white, 0.1),
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.common.white, 0.05),
          },
        }}
      >
        <Box position="relative" zIndex={1}>
          <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
            Tableau de bord Comptable
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Devise
              </Typography>
              <Box
                component="select"
                value={devise}
                onChange={(e) => setDevise(e.target.value)}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  border: '1px solid #ccc',
                  backgroundColor: '#fff',
                  fontSize: 14,
                  minWidth: 80,
                }}
              >
                <option value="GNF">GNF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Box>
            </Box>
           
          </Stack>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'rgba(255,255,255,0.15)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="mdi:finance" width={32} height={32} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ opacity: 0.9, fontSize: '1.1rem' }}>
                {user ? `Bienvenue, ${user.name || 'Utilisateur'}` : 'Bienvenue, Utilisateur'}
              </Typography>
              <Typography
                variant="body2"
                sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
              >
                <Iconify icon="mdi:shield-account" width={16} />
                {user?.type_name || 'Comptable'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Notification d'alerte */}
      {false && (
        <Alert
          severity="info"
          icon={<Iconify icon="mdi:bell-alert" />}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleNotificationClose}
            >
              <Iconify icon="mdi:close" />
            </IconButton>
          }
          sx={{ mb: 3 }}
        >
          <AlertTitle>Nouvelles notifications</AlertTitle>
          Vous avez 3 nouvelles notifications non lues.
          <Button color="inherit" size="small" sx={{ ml: 1, textTransform: 'none' }}>
            Voir
          </Button>
        </Alert>
      )}

      {/* Widgets de résumé améliorés */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ComptableWidgetSummary
            title="Déclarations à facturer"
            total={dashboardData.declarationsToInvoice}
            icon="mdi:file-document-edit"
            color="info"
            loading={loading.summary}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ComptableWidgetSummary
            title="Total Factures"
            total={dashboardData.totalInvoices}
            icon="mdi:file-document-multiple"
            color="success"
            loading={loading.summary}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ComptableWidgetSummary
            title="Paiements en attente"
            total={dashboardData.pendingPayments}
            icon="mdi:clock-time-four"
            color="warning"
            loading={loading.summary}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ComptableWidgetSummary
            title="Revenu total"
            total={dashboardData.totalRevenue}
            icon="mdi:cash-multiple"
            color="primary"
            isCurrency
            loading={loading.summary}
            currency={devise}
            isRevenue
          />
        </Grid>
      </Grid>

      {/* Filtres avancés */}
      {/* <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Filtres avancés</Typography>
          <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>Période</InputLabel>
              <Select value={period} label="Période" onChange={handlePeriodChange}>
                <MenuItem value="today">Aujourd'hui</MenuItem>
                <MenuItem value="week">Cette semaine</MenuItem>
                <MenuItem value="month">Ce mois</MenuItem>
                <MenuItem value="year">Cette année</MenuItem>
                <MenuItem value="custom">Personnalisée</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                multiple
                value={statusFilter}
                label="Statut"
                onChange={handleStatusChange}
                renderValue={(selected) => selected.length === 0 ? 'Tous' : `${selected.length} sélectionnés`}
              >
                <MenuItem value="paid">Payées</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="overdue">En retard</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:filter" />}
              onClick={() => console.log('Filtres appliqués')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Appliquer
            </Button>
          </Stack>
        </Stack>
      </Card> */}

      <Grid container spacing={3}>
        {/* Section Évolution des factures */}
        <Grid item xs={12}>
          <Card sx={{ p: 3, height: '100%', boxShadow: 3, borderRadius: 2 }}>
            {/* En-tête de section */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 3,
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 'bold', color: 'text.primary' }}
                >
                  Évolution des factures
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Analyse des facturations sur la période sélectionnée
                </Typography>
              </Box>

              {/* <FormControl size="small" variant="outlined" sx={{ minWidth: 200 }}>
              <InputLabel id="chart-range-label">Période</InputLabel>
              <Select
                labelId="chart-range-label"
                value={chartRange}
                onChange={handleChartRangeChange}
                label="Période"
              >
                <MenuItem value="week">7 derniers jours</MenuItem>
                <MenuItem value="month">30 derniers jours</MenuItem>
                <MenuItem value="year">12 derniers mois</MenuItem>
              </Select>
            </FormControl> */}
            </Box>

            {/* Contenu du graphique */}
            <Box
              sx={{
                height: 350,
                mt: 2,
                position: 'relative',
                backgroundColor: 'background.paper',
                borderRadius: 1,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {loading.charts ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'background.paper',
                    zIndex: 1,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <ComptableFacturationChart
                  series={[
                    {
                      name: 'Factures',
                      data: dashboardData.monthlyData.data || [],
                    },
                  ]}
                  options={chartOptions}
                  selectedYear={selectedYear}
                  years={years}
                  onYearChange={handleYearChange}
                />
              )}
            </Box>

            {/* Légende et statistiques */}
            <Box
              sx={{
                mt: 3,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'space-between',
                alignItems: 'center',
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Montant facturé
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Données mises à jour à {new Date().toLocaleTimeString()}
              </Typography>
            </Box>
          </Card>
        </Grid>

        
        {/* Tableau des déclarations récentes */}
        <Grid item xs={12} md={9}>
          <Card>
            <Box sx={{ p: 3, pb: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Déclarations récentes</Typography>
                <Button
                  size="small"
                  color="inherit"
                  endIcon={<Iconify icon="mdi:chevron-right" />}
                  onClick={() => router.push('/dashboard/declaration/list')}
                >
                  Voir tout
                </Button>
              </Stack>
            </Box>
            <Divider />
            <Box sx={{ p: 3 }}>
              {loading.declarations ? (
                <Stack spacing={2}>
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} variant="rectangular" width="100%" height={60} />
                  ))}
                </Stack>
              ) : (
                <ComptableDeclarationTable
                  title=""
                  onRowClick={handleRowClick}
                  declarations={declarations}
                  loading={loading.declarations}
                />
              )}
            </Box>
          </Card>
        </Grid>

        {/* Échéances à venir */}
        <Grid item xs={12} md={3}>
          <Card>
            <Box sx={{ p: 3, pb: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Échéances à venir</Typography>
                <Button
                  size="small"
                  color="inherit"
                  endIcon={<Iconify icon="mdi:calendar-month" />}
                  onClick={fetchEcheances}
                  disabled={loadingEcheances}
                >
                  {loadingEcheances ? 'Chargement...' : 'Actualiser'}
                </Button>
              </Stack>
            </Box>
            <Divider />
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Stack spacing={0}>
                {loadingEcheances ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : errorEcheances ? (
                  <Alert severity="error" sx={{ m: 2 }}>
                    {errorEcheances}
                  </Alert>
                ) : echeances.length === 0 ? (
                  <Typography variant="body2" sx={{ p: 3, color: 'text.secondary', textAlign: 'center' }}>
                    Aucune échéance à venir
                  </Typography>
                ) : (
                  echeances.map((echeance) => (
                    <Box
                      key={echeance.slug}
                      sx={{
                        p: 2,
                        '&:not(:last-child)': {
                          borderBottom: (theme) => `dashed 1px ${theme.palette.divider}`,
                        },
                        '&:hover': {
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle2" noWrap>
                            Facture #{echeance.number}
                          </Typography>
                          <Typography variant="caption">
                            Montant : {fCurrency(parseFloat(echeance.amount))}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
                          >
                            Échéance: {new Date(echeance.due_date).toLocaleDateString()}
                            {echeance.days_between && ` (${echeance.days_between} jours)`}
                          </Typography>
                        </Box>
                        
                      </Stack>
                    </Box>
                  ))
                )}
              </Stack>
            </Box>
            <Divider />
            {/* <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button
                size="small"
                color="inherit"
                endIcon={<Iconify icon="mdi:plus" />}
                onClick={() => console.log('Créer un rappel')}
              >
                Ajouter un rappel
              </Button>
            </Box> */}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
