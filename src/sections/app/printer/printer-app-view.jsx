'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import { alpha, useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import { useMemo, useState, useEffect, useCallback } from 'react';

import API from 'src/utils/api';
import axios from 'src/utils/axios';
import { fNumber } from 'src/utils/format-number';
import { getEntreprisesSearch } from 'src/utils/options';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Chart, useChart } from 'src/components/chart';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const MONTHS = [
  { value: '', label: 'Tous les mois' },
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Fevrier' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Aout' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Decembre' },
];

const MONTH_LABELS = MONTHS.slice(1).map((month) => month.label.slice(0, 3));

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 4 }, (_, index) => CURRENT_YEAR - index);

const DEFAULT_FILTERS = {
  company: null,
  month: '',
  type: '',
  validated_at: '',
  year: '',
};

// ----------------------------------------------------------------------

function getCompanyLabel(company) {
  return (
    company?.name ||
    company?.company_name ||
    company?.raison_sociale ||
    company?.full_name ||
    company?.label ||
    ''
  );
}

function getCompanySlug(company) {
  return company?.slug || company?.value || '';
}

function getCompanyOptionKey(company) {
  return (
    company?.optionKey || company?.slug || company?.value || company?.id || getCompanyLabel(company)
  );
}

function normalizeCompanyOptions(items = []) {
  const seen = new Set();

  return items.reduce((options, company, index) => {
    const slug = getCompanySlug(company);
    const label = getCompanyLabel(company);
    const optionKey = String(slug || company?.id || `${label}-${index}`);

    if (seen.has(optionKey)) return options;

    seen.add(optionKey);
    options.push({
      ...company,
      slug,
      label,
      optionKey,
    });

    return options;
  }, []);
}

async function fetchPermitStats(params = {}) {
  const query = new URLSearchParams();

  const companySlug = getCompanySlug(params.company);

  if (companySlug) query.set('company', companySlug);
  if (params.month) query.set('month', String(params.month));
  if (params.type) query.set('type', params.type);
  if (params.validated_at) query.set('validated_at', params.validated_at);
  if (params.year) query.set('year', String(params.year));

  const res = await axios.get(`${API.dashboardPrinter()}?${query.toString()}`);
  return res.data;
}

function normalizeStats(data) {
  return {
    total_permits: Number(data?.total_permits ?? 0),
    printed_permits: Number(data?.printed_permits ?? 0),
    unprinted_permits: Number(data?.unprinted_permits ?? 0),
    by_type: Array.isArray(data?.by_type) ? data.by_type : [],
    monthly_evolution: {
      months:
        data?.monthly_evolution?.months ?? Array.from({ length: 12 }, (_, index) => index + 1),
      total: data?.monthly_evolution?.total ?? Array(12).fill(0),
      printed: data?.monthly_evolution?.printed ?? Array(12).fill(0),
      unprinted: data?.monthly_evolution?.unprinted ?? Array(12).fill(0),
    },
  };
}

function getStatusColor(percentage) {
  if (percentage >= 80) return 'success';
  if (percentage >= 40) return 'warning';
  return 'error';
}

function buildExportRows(stats) {
  return stats.by_type.map((item) => ({
    'Type de permis': item.permit_type,
    Total: item.total,
    Imprimes: item.printed,
    'Non imprimes': item.unprinted,
    'Taux imprime (%)': item.percentage_printed,
  }));
}

function buildExportName(filters, extension) {
  const parts = ['dashboard-printer', filters.year || 'toutes-annees'];
  if (filters.month) parts.push(`mois-${filters.month}`);
  if (filters.type) parts.push(`type-${filters.type}`);
  if (filters.company) parts.push(`entreprise-${getCompanySlug(filters.company)}`);
  return `${parts.join('-')}.${extension}`;
}

// ----------------------------------------------------------------------

function PrinterKpiCard({
  title,
  value,
  suffix = '',
  subtitle,
  icon,
  color = 'primary',
  progress,
}) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 2.5,
        height: 1,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette[color].main, 0.16)}`,
        bgcolor: alpha(theme.palette[color].main, 0.04),
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h3">
            {fNumber(value)}
            {suffix}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 44,
            height: 44,
            display: 'grid',
            borderRadius: 1.5,
            placeItems: 'center',
            color: `${color}.main`,
            bgcolor: alpha(theme.palette[color].main, 0.12),
          }}
        >
          <Iconify icon={icon} width={24} />
        </Box>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 2.5 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(progress ?? 0, 100)}
          color={color}
          sx={{ flex: 1, height: 7, borderRadius: 1 }}
        />
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', minWidth: 34, textAlign: 'right' }}
        >
          {Math.round(progress ?? 0)}%
        </Typography>
      </Stack>

      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1.25, display: 'block' }}>
        {subtitle}
      </Typography>
    </Card>
  );
}

function PrinterFilters({
  filters,
  typeOptions,
  companies,
  loadingCompanies,
  onChange,
  onApply,
  onReset,
}) {
  return (
    <Card sx={{ p: 2, borderRadius: 2 }}>
      <Stack
        spacing={2}
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <Autocomplete
          fullWidth
          size="small"
          options={companies}
          loading={loadingCompanies}
          value={filters.company}
          getOptionLabel={getCompanyLabel}
          getOptionKey={getCompanyOptionKey}
          isOptionEqualToValue={(option, value) => getCompanySlug(option) === getCompanySlug(value)}
          onChange={(_, value) => onChange('company', value)}
          renderOption={(props, option) => {
            const { key: optionKey, ...optionProps } = props;

            return (
              <li {...optionProps} key={getCompanyOptionKey(option) || optionKey}>
                {getCompanyLabel(option)}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} label="Entreprise" placeholder="Toutes" />
          )}
          sx={{ minWidth: { md: 230 } }}
        />

        <FormControl size="small" sx={{ minWidth: { md: 150 } }}>
          <InputLabel>Annee</InputLabel>
          <Select
            label="Annee"
            value={filters.year}
            onChange={(event) => onChange('year', event.target.value)}
          >
            <MenuItem value="">Toutes les annees</MenuItem>
            {YEAR_OPTIONS.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { md: 170 } }}>
          <InputLabel>Mois</InputLabel>
          <Select
            label="Mois"
            value={filters.month}
            onChange={(event) => onChange('month', event.target.value)}
          >
            {MONTHS.map((month) => (
              <MenuItem key={month.label} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { md: 150 } }}>
          <InputLabel>Type</InputLabel>
          <Select
            label="Type"
            value={filters.type}
            onChange={(event) => onChange('type', event.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            {typeOptions.map((type) => (
              <MenuItem key={type} value={type}>
                Permis {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          type="date"
          label="Date validation"
          value={filters.validated_at}
          onChange={(event) => onChange('validated_at', event.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: { md: 180 } }}
        />

        <Stack direction="row" spacing={1} sx={{ ml: { md: 'auto' } }}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:filter-bold" />}
            onClick={onApply}
          >
            Filtrer
          </Button>
          <IconButton color="default" onClick={onReset}>
            <Iconify icon="solar:restart-bold" />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
}

function MonthlyChart({ stats }) {
  const theme = useTheme();

  const chartOptions = useChart({
    colors: [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main],
    xaxis: { categories: MONTH_LABELS },
    stroke: { width: 3 },
    markers: { size: 4 },
    legend: { show: true },
    tooltip: { y: { formatter: (value) => fNumber(value) } },
  });

  return (
    <Card sx={{ height: 1, borderRadius: 2 }}>
      <CardHeader
        title="Evolution mensuelle"
        subheader="Total, imprimes et non imprimes selon le filtre annee"
      />
      <Chart
        type="area"
        height={360}
        series={[
          { name: 'Total', data: stats.monthly_evolution.total },
          { name: 'Imprimes', data: stats.monthly_evolution.printed },
          { name: 'Non imprimes', data: stats.monthly_evolution.unprinted },
        ]}
        options={chartOptions}
        sx={{ px: 2, pt: 2, pb: 3 }}
      />
    </Card>
  );
}

function TypeDonutChart({ stats }) {
  const theme = useTheme();
  const labels = stats.by_type.map((item) => `Permis ${item.permit_type}`);
  const series = stats.by_type.map((item) => Number(item.total ?? 0));

  const chartOptions = useChart({
    labels,
    colors: [
      theme.palette.primary.main,
      theme.palette.info.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
    ],
    legend: { show: true, position: 'bottom', horizontalAlign: 'center' },
    tooltip: { y: { formatter: (value) => fNumber(value) } },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            total: { label: 'Permis' },
          },
        },
      },
    },
  });

  return (
    <Card sx={{ height: 1, borderRadius: 2 }}>
      <CardHeader title="Repartition par type" subheader="Volume total par categorie de permis" />
      {series.length ? (
        <Chart type="donut" series={series} options={chartOptions} height={360} sx={{ p: 2 }} />
      ) : (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ height: 360, color: 'text.secondary' }}
        >
          <Iconify icon="solar:pie-chart-2-bold-duotone" width={48} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Aucune donnee disponible
          </Typography>
        </Stack>
      )}
    </Card>
  );
}

function TypeTable({ rows }) {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardHeader
        title="Performance par type de permis"
        subheader="Lecture operationnelle des impressions"
      />
      <Scrollbar>
        <TableContainer sx={{ minWidth: 720 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Imprimes</TableCell>
                <TableCell align="right">Non imprimes</TableCell>
                <TableCell sx={{ minWidth: 220 }}>Taux imprime</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.permit_type} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          display: 'grid',
                          borderRadius: 1,
                          placeItems: 'center',
                          color: 'primary.main',
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        <Iconify icon="solar:document-text-bold" width={18} />
                      </Box>
                      <Typography variant="subtitle2">Permis {row.permit_type}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{fNumber(row.total)}</TableCell>
                  <TableCell align="right">{fNumber(row.printed)}</TableCell>
                  <TableCell align="right">{fNumber(row.unprinted)}</TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(Number(row.percentage_printed ?? 0), 100)}
                        color={getStatusColor(row.percentage_printed)}
                        sx={{ flex: 1, height: 7, borderRadius: 1 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 42 }}>
                        {Math.round(row.percentage_printed ?? 0)}%
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Label color={getStatusColor(row.percentage_printed)}>
                      {row.percentage_printed >= 80
                        ? 'Maitrise'
                        : row.percentage_printed >= 40
                          ? 'A suivre'
                          : 'Prioritaire'}
                    </Label>
                  </TableCell>
                </TableRow>
              ))}

              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Stack alignItems="center" sx={{ py: 6, color: 'text.secondary' }}>
                      <Iconify icon="solar:documents-minimalistic-bold-duotone" width={44} />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Aucun type de permis pour les filtres selectionnes
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function PrinterAppView() {
  const [stats, setStats] = useState(() => normalizeStats());
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');

  const printedPercent = stats.total_permits
    ? Math.round((stats.printed_permits / stats.total_permits) * 100)
    : 0;

  const unprintedPercent = stats.total_permits
    ? Math.round((stats.unprinted_permits / stats.total_permits) * 100)
    : 0;

  const typeOptions = useMemo(
    () => [...new Set(stats.by_type.map((item) => item.permit_type).filter(Boolean))],
    [stats.by_type]
  );

  const activeFiltersCount = useMemo(
    () =>
      ['company', 'year', 'month', 'type', 'validated_at'].filter((key) =>
        Boolean(appliedFilters[key])
      ).length,
    [appliedFilters]
  );

  const loadStats = useCallback(async (nextFilters) => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchPermitStats(nextFilters);
      setStats(normalizeStats(data));
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les statistiques du printer.');
      setStats(normalizeStats());
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      const data = await getEntreprisesSearch({ limit: 100 });
      setCompanies(normalizeCompanyOptions(data));
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    loadStats(appliedFilters);
  }, [appliedFilters, loadStats]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleChangeFilter = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  }, []);

  const handleExportExcel = useCallback(async () => {
    setExporting('excel');
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      const overviewRows = [
        { Indicateur: 'Total permis', Valeur: stats.total_permits },
        { Indicateur: 'Permis imprimes', Valeur: stats.printed_permits },
        { Indicateur: 'Permis non imprimes', Valeur: stats.unprinted_permits },
        { Indicateur: "Taux d'impression", Valeur: `${printedPercent}%` },
      ];

      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(overviewRows), 'Synthese');
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(buildExportRows(stats)),
        'Par type'
      );
      XLSX.writeFile(workbook, buildExportName(appliedFilters, 'xlsx'));
    } finally {
      setExporting('');
    }
  }, [appliedFilters, printedPercent, stats]);

  const handleExportPdf = useCallback(async () => {
    setExporting('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Dashboard Printer', 14, 18);
      doc.setFontSize(10);
      doc.text(
        `Annee: ${appliedFilters.year || 'Toutes'} | Taux imprime: ${printedPercent}%`,
        14,
        26
      );

      autoTable(doc, {
        startY: 34,
        head: [['Indicateur', 'Valeur']],
        body: [
          ['Total permis', stats.total_permits],
          ['Permis imprimes', stats.printed_permits],
          ['Permis non imprimes', stats.unprinted_permits],
        ],
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Type', 'Total', 'Imprimes', 'Non imprimes', 'Taux imprime']],
        body: stats.by_type.map((item) => [
          `Permis ${item.permit_type}`,
          item.total,
          item.printed,
          item.unprinted,
          `${Math.round(item.percentage_printed ?? 0)}%`,
        ]),
      });

      doc.save(buildExportName(appliedFilters, 'pdf'));
    } finally {
      setExporting('');
    }
  }, [appliedFilters, printedPercent, stats]);

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h4">Dashboard printer</Typography>
              {activeFiltersCount > 0 && (
                <Chip size="small" label={`${activeFiltersCount} filtre(s)`} />
              )}
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Suivi des permis valides, imprimes et en attente d'impression.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              disabled={loading || exporting === 'pdf'}
              startIcon={<Iconify icon="solar:file-download-bold" />}
              onClick={handleExportPdf}
            >
              PDF
            </Button>
            <Button
              variant="contained"
              disabled={loading || exporting === 'excel'}
              startIcon={<Iconify icon="solar:export-bold" />}
              onClick={handleExportExcel}
            >
              Excel
            </Button>
          </Stack>
        </Stack>

        <PrinterFilters
          filters={filters}
          companies={companies}
          typeOptions={typeOptions}
          loadingCompanies={loadingCompanies}
          onChange={handleChangeFilter}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        {error && (
          <Card sx={{ p: 2, borderRadius: 2, color: 'error.main', bgcolor: 'error.lighter' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="solar:danger-triangle-bold" />
              <Typography variant="body2">{error}</Typography>
            </Stack>
          </Card>
        )}

        {loading && <LinearProgress sx={{ borderRadius: 1 }} />}

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <PrinterKpiCard
              title="Total permis"
              value={stats.total_permits}
              subtitle="Permis valides dans le perimetre filtre"
              icon="solar:documents-bold-duotone"
              color="primary"
              progress={100}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <PrinterKpiCard
              title="Permis imprimes"
              value={stats.printed_permits}
              subtitle={`${printedPercent}% du volume total`}
              icon="solar:printer-minimalistic-bold-duotone"
              color="success"
              progress={printedPercent}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <PrinterKpiCard
              title="Non imprimes"
              value={stats.unprinted_permits}
              subtitle="File de travail restante"
              icon="solar:clock-circle-bold-duotone"
              color="warning"
              progress={unprintedPercent}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <PrinterKpiCard
              title="Taux d'impression"
              value={printedPercent}
              suffix="%"
              subtitle={
                printedPercent >= 80 ? 'Cadence confortable' : 'Prioriser les lots en attente'
              }
              icon="solar:chart-2-bold-duotone"
              color={printedPercent >= 80 ? 'success' : 'info'}
              progress={printedPercent}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <MonthlyChart stats={stats} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TypeDonutChart stats={stats} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TypeTable rows={stats.by_type} />
          </Grid>
        </Grid>

        <Divider sx={{ borderStyle: 'dashed' }} />
      </Stack>
    </DashboardContent>
  );
}
