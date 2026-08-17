'use client';

import { useTheme } from '@mui/material/styles';
import { Card, CardHeader, Box, CardContent, Skeleton, Typography } from '@mui/material';
import { fNumber } from 'src/utils/format-number';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

const MONTHS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

// Fonction pour formater les données du graphique
const formatChartData = (data) => {
  if (!data || typeof data !== 'object') {
    return Array(12).fill(0);
  }

  // Créer un tableau de 12 mois avec les valeurs correspondantes
  const monthlyData = Array(12).fill(0);

  // Parcourir les clés de l'objet de données
  Object.entries(data).forEach(([key, value]) => {
    const monthIndex = parseInt(key, 10) - 1; // Convertir en index 0-11
    if (monthIndex >= 0 && monthIndex < 12) {
      monthlyData[monthIndex] = Number(value) || 0;
    }
  });

  return monthlyData;
};

export function AguipeCharts({ statistique_shart, loading = false, period = 'this_month' }) {
  const theme = useTheme();

  // Vérifier si on a des données
  const hasData =
    statistique_shart &&
    (Object.keys(statistique_shart.declaration || {}).length > 0 ||
      Object.keys(statistique_shart.facture || {}).length > 0 ||
      Object.keys(statistique_shart.payment || {}).length > 0);

  // Préparer les données pour le graphique
  const chartData = [
    {
      name: 'Déclarations',
      type: 'line',
      data: formatChartData(statistique_shart?.declaration),
    },
    {
      name: 'Factures',
      type: 'line',
      data: formatChartData(statistique_shart?.facture),
    },
    {
      name: 'Paiements',
      type: 'line',
      data: formatChartData(statistique_shart?.payment),
    },
  ];

  const chartOptions = useChart({
    chart: {
      type: 'line',
      stacked: false,
      toolbar: { show: true },
      zoom: { enabled: true },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
      dropShadow: {
        enabled: true,
        top: 3,
        left: 2,
        blur: 4,
        opacity: 0.1,
      },
    },
    stroke: {
      width: [3, 3, 3],
      curve: 'smooth',
    },
    markers: {
      size: 5,
      strokeWidth: 0,
      hover: {
        size: 7,
      },
    },
    xaxis: {
      categories: MONTHS,
      labels: {
        style: {
          colors: theme.palette.text.secondary,
        },
        formatter: (value, index) =>
          // Afficher tous les mois, même ceux sans données
          value,
      },
      axisBorder: {
        show: true,
      },
      axisTicks: {
        show: true,
      },
      tooltip: {
        enabled: true,
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => fNumber(value),
        style: {
          colors: theme.palette.text.secondary,
        },
      },
    },
    tooltip: {
      y: {
        formatter: (value) => fNumber(value),
      },
      marker: {
        show: true,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      markers: {
        radius: 12,
      },
      itemMargin: {
        vertical: 8,
      },
    },
    colors: [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main],
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 3,
    },
    noData: {
      text: 'Aucune donnée disponible',
      align: 'center',
      verticalAlign: 'middle',
      offsetX: 0,
      offsetY: 0,
      style: {
        color: theme.palette.text.secondary,
        fontSize: '14px',
        fontFamily: theme.typography.fontFamily,
      },
    },
  });

  if (loading) {
    return (
      <Card>
        <CardHeader title="Chargement des statistiques..." />
        <Box sx={{ p: 3, pb: 1 }}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Statistiques mensuelles"
        subheader="Évolution des déclarations, factures et paiements"
      />
      <CardContent>
        <Box sx={{ height: 400, minWidth: '100%' }}>
          {hasData ? (
            <Chart type="line" series={chartData} options={chartOptions} height="100%" />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography variant="body1">
                Aucune donnée disponible pour la période sélectionnée
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
