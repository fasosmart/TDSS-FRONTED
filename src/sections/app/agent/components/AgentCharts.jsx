import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { useTheme } from '@mui/material/styles';
import { Iconify } from 'src/components/iconify';
import { Chart } from 'src/components/chart';
import CircularProgress from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';

// ----------------------------------------------------------------------

export function AgentPermitCategoryChart() {
  const [permitCategories, setPermitCategories] = useState([]);
  const { palette, customShadows } = useTheme();
  const isDarkMode = palette.mode === 'dark';

  // Filtrer les catégories de permis pour n'afficher que celles de l'agent connecté
  useEffect(() => {
    const filteredCategories = ALL_PERMIT_CATEGORIES.filter(cat => cat.agentId === CURRENT_USER.id);
    setPermitCategories(filteredCategories);
  }, []);

  const chartOptions = {
    chart: {
      width: 400,
      background: 'transparent',
    },
    colors: isDarkMode ? [
      '#66d9ef',
      '#f7d2c4',
      '#8bc34a',
      '#ff9800',
      '#03a9f4',
    ] : [
      '#00A76F',
      '#FFAB00',
      '#00B8D9',
      '#FF5630',
      '#05C3FF',
    ],
    labels: permitCategories.map(i => i.category),
    stroke: { show: false },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '14px',
      fontWeight: 600,
      markers: {
        radius: 12,
      },
      itemMargin: {
        horizontal: 12,
      },
      labels: {
        colors: palette.text.primary,
      },
    },
    tooltip: {
      fillSeriesColor: false,
      y: {
        formatter: (value) => `${value} déclarations`,
        title: {
          formatter: (seriesName) => `${seriesName}:`,
        },
      },
    },
    plotOptions: {
      pie: {
        customScale: 0.85,
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              formatter: (value) => `${value}`,
            },
            total: {
              show: true,
              fontSize: '16px',
              fontWeight: 700,
              label: 'Total',
              formatter: (w) => {
                const sum = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                return `${sum}`;
              },
              color: palette.text.primary,
            },
          },
        },
      },
    },
  };

  // Calculer le total des déclarations
  const totalDeclarations = permitCategories.reduce((sum, category) => sum + category.value, 0);

  return (
    <Card sx={{
      boxShadow: isDarkMode ? '0 4px 8px 0 rgba(0, 0, 0, 0.4)' : '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
      borderRadius: 1,
      overflow: 'hidden',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: isDarkMode ? '0 6px 12px 0 rgba(0, 0, 0, 0.5)' : '0 4px 8px 0 rgba(0, 0, 0, 0.15)',
      },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 3, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <Iconify icon="mdi:chart-pie" width={24} sx={{ mr: 1 }} />
          Répartition par Catégorie
        </Typography>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          Total: {totalDeclarations} déclarations
        </Typography>
      </Box>
      <Box sx={{ p: 3, pt: 1 }} dir="ltr">
        <Chart
          type="donut"
          series={permitCategories.map(i => i.value)}
          options={chartOptions}
          height={300}
        />
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function AgentDeclarationChart({ 
  chartData = [], 
  loading = false, 
  error = '',
  onYearChange,
  selectedYear: propSelectedYear
}) {
  const [selectedYear, setSelectedYear] = useState(propSelectedYear || '');
  const [availableYears, setAvailableYears] = useState([]);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const currentYear = new Date().getFullYear();

  // Mettre à jour l'état local si la prop selectedYear change
  useEffect(() => {
    if (propSelectedYear && propSelectedYear !== selectedYear) {
      setSelectedYear(propSelectedYear);
    }
  }, [propSelectedYear]);

  // Définir les 5 dernières années comme années disponibles
  useEffect(() => {
    // Générer un tableau des 5 dernières années
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push((currentYear - i).toString());
    }
    setAvailableYears(years);
    
    // Si aucune année n'est sélectionnée, utiliser l'année courante
    if (!selectedYear) {
      const yearToSet = currentYear.toString();
      setSelectedYear(yearToSet);
      // Appeler onYearChange si fourni
      if (onYearChange) {
        onYearChange(yearToSet);
      }
    }
  }, [currentYear, selectedYear, onYearChange]);

  // Préparer les données pour le graphique
  const chartSeries = useMemo(() => {
    // Si pas de données ou chargement en cours, retourner un tableau vide
    if (!chartData || chartData.length === 0 || loading) {
      return [{ name: 'Déclarations', data: Array(12).fill(0) }];
    }
    
    // Créer un tableau avec 12 mois initialisés à 0
    const monthlyData = Array(12).fill(0);
    
    // Remplir avec les données disponibles
    chartData.forEach(item => {
      // Extraire l'index du mois (0-11) à partir du nom du mois
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const monthIndex = monthNames.findIndex(m => m === item.month);
      
      if (monthIndex !== -1) {
        monthlyData[monthIndex] = item.value || 0;
      }
    });
    
    return [{ name: 'Déclarations', data: monthlyData }];
  }, [chartData, loading]);

  const handleYearChange = (event) => {
    const newYear = event.target.value;
    setSelectedYear(newYear);
    
    // Appeler la fonction parente pour notifier du changement d'année
    if (onYearChange) {
      onYearChange(newYear);
    }
  };

  const chartOptions = {
    chart: {
      stacked: false,
      zoom: { enabled: false },
      background: 'transparent',
      foreColor: isDarkMode ? theme.palette.text.primary : undefined,
    },
    colors: [isDarkMode ? theme.palette.primary.light : theme.palette.primary.main],
    xaxis: {
      categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
      labels: {
        style: {
          colors: isDarkMode ? theme.palette.text.secondary : undefined,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDarkMode ? theme.palette.text.secondary : undefined,
        },
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} déclarations`,
      },
      theme: isDarkMode ? 'light' : 'dark',
    },
    grid: {
      borderColor: isDarkMode ? theme.palette.divider : undefined,
    },
    plotOptions: {
      area: {
        fillTo: 'end',
        opacity: isDarkMode ? 0.2 : 0.1,
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.5,
          opacityTo: 0.3,
        },
      },
    },
  };

  return (
    <Card>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <Iconify icon="mdi:chart-line" width={24} sx={{ mr: 1 }} />
          Évolution des déclarations
        </Typography>
        
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel id="year-select-label">Année</InputLabel>
          <Select
            labelId="year-select-label"
            value={selectedYear}
            label="Année"
            onChange={handleYearChange}
            disabled={loading || availableYears.length === 0}
          >
            {availableYears.map(year => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ p: 3, pb: 1 }} dir="ltr">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Chart
            type="area"
            series={chartSeries}
            options={chartOptions}
            height={320}
          />
        )}
      </Box>
    </Card>
  );
}

AgentDeclarationChart.propTypes = {
  chartData: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string,
      value: PropTypes.number,
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onYearChange: PropTypes.func,
  selectedYear: PropTypes.string,
};

AgentDeclarationChart.defaultProps = {
  chartData: [],
  loading: false,
  error: '',
  onYearChange: undefined,
  selectedYear: undefined,
};