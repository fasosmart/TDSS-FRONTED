import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

import { fNumber, fPercent } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function DeclarationSummary({ title, percent, total, loading, chart = {}, sx, ...other }) {
  const theme = useTheme();

  // Utilisation de valeurs par défaut si les propriétés `chart` sont undefined
  const chartColors = chart.colors ?? [theme.palette.primary.main];
  const chartSeries = chart.series ?? [];
  const chartCategories = chart.categories ?? [];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    stroke: { width: 0 },
    xaxis: { categories: chartCategories },
    tooltip: {
      y: { formatter: (value) => fNumber(value), title: { formatter: () => '' } },
    },
    plotOptions: { bar: { borderRadius: 1.5, columnWidth: '64%' } },
    ...chart.options,
  });

  const renderTrending = (
    <Box sx={{ gap: 0.5, display: 'flex', alignItems: 'center' }}>
      <Iconify
        width={24}
        icon={
          percent < 0
            ? 'solar:double-alt-arrow-down-bold-duotone'
            : 'solar:double-alt-arrow-up-bold-duotone'
        }
        sx={{ flexShrink: 0, color: 'success.main', ...(percent < 0 && { color: 'error.main' }) }}
      />
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {percent > 0 && '+'}
        {fPercent(percent)}
      </Box>
      <Box component="span" sx={{ typography: 'body2', color: 'text.secondary' }}>
        last 7 days
      </Box>
    </Box>
  );

  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 3,
        ...sx,
      }}
      {...other}
    >
      <Box sx={{ flexGrow: 1 }}>
         <Box sx={{ typography: 'subtitle2' }}>{title}</Box>
         {loading ? (
          <CircularProgress size={32} sx={{ my: 2 }} />
        ) : (
         <Box sx={{ mt: 1.5, mb: 1, typography: 'h3' }}>{fNumber(total)}</Box>
         )}

        {renderTrending}
      </Box>

      <Chart
        type="bar"
        series={[{ data: chartSeries }]}
        options={chartOptions}
        width={60}
        height={40}
      />
    </Card>
  );
}
