import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { alpha, useTheme } from '@mui/material/styles';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ComptableWidgetSummary({
  title,
  total,
  icon,
  color = 'primary',
  isCurrency = false,
  loading = false,
  sx,
  percent = 0,
  currency = 'GNF',
  isRevenue = false,
  ...other
}) {
  const theme = useTheme();

  // -------- Helpers ---------------------------------------------------

  // Format abrégé (ex. 12,5M).  Utilisé uniquement si isCurrency === false
  const formatLargeNumber = (num) => {
    if (!num) return '0';
    const value =
      typeof num === 'string' ? parseFloat(num.replace(/[^0-9.-]+/g, '')) : num;

    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9)  return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6)  return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3)  return `${(value / 1e3).toFixed(2)}K`;

    return value.toString();
  };

  // Format détaillé avec séparateurs + code devise
  const afficherMontant = (montant) => {
    if (!montant || isNaN(montant)) return '0';

    const format = (n, locale = 'fr-FR') =>
      Number(n).toLocaleString(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });

    switch (currency) {
      case 'GNF':
        // Pas de conversion : on affiche “12 500 000 GNF”
        return `${format(montant, 'fr-FR')} GNF`;

      case 'USD':
        // Conversion approximative GNF → USD, puis format US “1,000.00 USD”
        return `${format(montant / 9200, 'en-US')} USD`;

      case 'EUR':
        // Conversion approximative GNF → EUR, puis format FR “1 000,00 EUR”
        return `${format(montant / 10000, 'fr-FR')} EUR`;

      default:
        return format(montant, 'fr-FR');
    }
  };

  // Sélectionne le format selon les props
  const formatValue = (value, asCurrency = false) => {
    if (!asCurrency) {
      return formatLargeNumber(value);
    }
    // Si on souhaite afficher les revenus, on applique quand même la conversion/formatage de devise
    const rawNumber =
      typeof value === 'string' ? parseFloat(value) : value;
    return afficherMontant(rawNumber);
  };

  // --------------------------------------------------------------------

  if (loading) {
    return (
      <Card sx={{ height: 120, p: 2, ...sx }} {...other}>
        <Stack spacing={1}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={32} />
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: (theme) => theme.customShadows.z16,
        },
        ...sx,
      }}
      {...other}
    >
      <Stack direction="row" justifyContent="space-between" sx={{ flexGrow: 1 }}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {formatValue(total, isCurrency)}
          </Typography>
        </Stack>

        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette[color].main, 0.16),
            color: (theme) => theme.palette[color].dark,
          }}
        >
          <Iconify icon={icon} width={24} height={24} />
        </Box>
      </Stack>
    </Card>
  );
}

ComptableWidgetSummary.propTypes = {
  title: PropTypes.string,
  total: PropTypes.number,
  icon: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  color: PropTypes.string,
  isCurrency: PropTypes.bool,
  isRevenue: PropTypes.bool,
  loading: PropTypes.bool,
  currency: PropTypes.oneOf(['GNF', 'USD', 'EUR']),
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
};
