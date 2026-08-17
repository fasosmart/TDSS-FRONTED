'use client';

import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { CircularProgress } from '@mui/material';
import Tabs from '@mui/material/Tabs';
import axios from 'src/utils/axios';
import { useState, useEffect, useCallback, useRef } from 'react';

import { DashboardContent } from 'src/layouts/dashboard';
import { varAlpha } from 'src/theme/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import API from 'src/utils/api';
import { fIsBetween } from 'src/utils/format-time';
import { sumBy } from 'src/utils/helper';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { toast } from 'src/components/snackbar';
import {
  useTable,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { PaiementAnalytic } from '../paiement-analytic';
import { PaiementTableFiltersResult } from '../paiement-table-filters';
import { PaiementTableRow } from '../paiement-table-row';
import { PaiementTableToolbar } from '../paiement-table-toolbar';

import { fCurrency, fGNF } from 'src/utils/format-number';

import dayjs from 'dayjs';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'reference', label: 'Reference Paiement' },
  { id: 'invoiceNumber', label: 'Facture' },
  // { id: 'numero', label: 'Numero Déclaration' },
  { id: 'type', label: 'Methode de Paiement' },
  { id: 'payer', label: 'Entreprise' },
  { id: 'price', label: 'Montant' },
  { id: 'createDate', label: 'Date ' },
  { id: 'status', label: 'Status ' },

  { id: '' },
];

// ----------------------------------------------------------------------

export function PaiementListView() {
  const theme = useTheme();


  const router = useRouter();

  const table = useTable({ defaultOrderBy: 'createDate' });

  const confirm = useBoolean();

  const [currentTab, setCurrentTab] = useState('all');
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true); // État pour indiquer le chargement
  const [loader, setLoader] = useState(false); // État pour indiquer le chargement
  const [error, setError] = useState(null); // État pour gérer les erreurs
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const fetchRequestIdRef = useRef(0);

  const [summary, setSummary] = useState({
    totalCount: 0,
    totalAmountGnf: 0,
    totalAmountUsd: 0,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoader(true);
        const res = await axios.get(API.statsPaiements());

        const totalAmountGnf = res.data.total_amount_gnf;
        // Conversion GNF -> USD (taux fixe)
        const GNF_PER_USD = 9200;

        setSummary({
          totalCount: res.data.total_count,
          totalAmountGnf,
          totalAmountUsd: totalAmountGnf / GNF_PER_USD,
        });
      } catch (err) {
        console.error('Erreur summary paiements', err);
        toast.error('Impossible de charger le total des paiements');
      } finally {
        setLoader(false);
      }
    };

    fetchSummary();
  }, []);

  const [selectedFilter, setSelectedFilter] = useState('facture_number');

  const filters = useSetState({
    name: '',
    company: '',
    date_before: null,
    date_after: null,
    payment_method: [],
    facture_number: '',
    number: '',
  }, { persistByPath: true });

  const dateError = fIsBetween(filters.state.date_before, filters.state.date_after);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
    dateError,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.name ||
    filters?.state?.payment_method?.length > 0 ||
    (!!filters.state.date_before && !!filters.state.date_after) ||
    !!filters.state.facture_number ||
    !!filters.state.number;

  const notFound = pagination.count === 0 && canReset;

  const fetchTotalCount = () =>
    axios.get(API.listPaiments(), { params: { limit: 1 } }).then((res) => res.data.count);

  const getTotalAmount = () => sumBy((paiement) => paiement.amount);

  const getPercentByStatus = () => (getTotalAmount() / tableData.length) * 100;

  const TABS = [
    {
      value: 'all',
      label: 'Toutes',
      color: 'main',
      count: pagination.count,
    },
  ];

  const PaymentMethods = [
    { id: 'transfer', label: 'Virement' },
    { id: 'deposit', label: 'Espèces' },
    { id: 'cheque', label: 'Chèques' },
  ];

  const handleViewRow = useCallback(
    (slug) => {
      router.push(paths.dashboard.paiements.details(slug));
    },
    [router]
  );

  const handleValidate = useCallback(
    async (slug) => {
      try {
        const response = await axios.post(API.validatePayment(slug));

        if (response.data || response.status === 200) {
          toast.success('Paiement validé avec succès');
          setTableData((prevData) =>
            prevData.map((item) => (item.slug === slug ? { ...item, status: 'validated' } : item))
          );
          router.push(paths.dashboard.paiements.list);
        } else {
          toast.error('Erreur lors de la validation du paiement');
        }
      } catch (error) {
        const errorMessage = error?.error || error?.details || error?.message || error?.detail;
        setError(errorMessage);
        toast.error(`Erreur lors de la validation du paiement : ${errorMessage}`);
      }
    },
    [router]
  );

  const handleDelete = useCallback(async (slug) => {
    try {
      const response = await axios.delete(API.removePayment(slug));

      if (response.data || response.status === 200) {
        toast.success('Paiement supprimé avec succès');
        const deleteRows = tableData.filter((row) => row.slug !== slug);
        setTableData(deleteRows);
        // router.push(paths.dashboard.paiements.list);
      } else {
        toast.error('Erreur lors de la validation du paiement');
      }
    } catch (error) {
      const errorMessage = error?.error || error?.details || error?.message || error?.detail;
      setError(errorMessage);
      toast.error(`Erreur lors de la validation du paiement : ${errorMessage}`);
    }
  }, []);

  useEffect(() => {
    if (!filters.isHydrated) return;

    const requestId = fetchRequestIdRef.current + 1;
    fetchRequestIdRef.current = requestId;

    // Fonction pour récupérer les données
    const fetchPaiements = async () => {
      setLoading(true);
      try {
        const offset = table.page * table.rowsPerPage;
        const limit = table.rowsPerPage;
        const params = {
          offset,
          limit,
          ...(filters.state.date_before && filters.state.date_after && !dateError
            ? {
                date_before: dayjs(filters.state.date_before).format('YYYY-MM-DD'),
                date_after: dayjs(filters.state.date_after).format('YYYY-MM-DD'),
              }
            : {}),
          ...(filters.state.payment_method.length > 0 && {
            payment_method: filters.state.payment_method.join(','),
          }),
          ...(filters.state.facture_number && { facture_number: filters.state.facture_number }),
          ...(filters.state.company && { company: filters.state.company }),
          ...(filters.state.number && { number: filters.state.number }),
        };
        const response = await axios.get(API.listPaiments(), { params }); // Remplacez l'URL par celle de votre backend

        if (requestId !== fetchRequestIdRef.current) return;

        setTableData(response.data.results);
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        });
      } catch (err) {
        if (requestId !== fetchRequestIdRef.current) return;

        setError(
          err.message || err.details || err.error || 'Erreur lors du chargement des données.'
        );
        toast.error(error);
      } finally {
        if (requestId === fetchRequestIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchPaiements();
  }, [
    filters.isHydrated,
    table.page,
    table.rowsPerPage,
    filters.state.date_before,
    filters.state.date_after,
    filters.state.facture_number,
    filters.state.company,
    filters.state.number,
    JSON.stringify(filters.state.payment_method),
  ]); // La dépendance vide signifie que cette fonction est appelée une fois au montage

  if (loading) {
    console.info('Loading paiement...');
  }

  if (error) {
    console.error(`Error: ${error}`);
  }

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Listes des Paiements"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Paiements', href: paths.dashboard.paiements.list },
          { name: 'Listes des paiements' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* <Stack spacing={4}> */}
      <Grid container spacing={3} sx={{ mb: { xs: 3, md: 5 } }} lg={12}>
        <Grid size={{ xs: 6, md: 4 }}>
          <PaiementAnalytic
            title="Nombres Total Paiements"
            total={summary.totalCount}
            percent={100}
            loading={loader}
            // chart={{
            //   colors: [theme.vars.palette.info.main],
            //   categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            //   series: [20, 41, 63, 33, 28, 35, 50, 46],
            // }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <PaiementAnalytic
            title="Total En Dollars"
            percent={100}
            total={fCurrency(summary.totalAmountUsd)}
            loading={loader}
            // chart={{
            //   categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            //   series: [15, 18, 12, 51, 68, 11, 39, 37],
            // }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <PaiementAnalytic
            title="Total En GNF"
            percent={100}
            total={fGNF(summary.totalAmountGnf)}
            loading={loader}
            // chart={{
            //   colors: [theme.vars.palette.success.main],
            //   categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            //   series: [18, 19, 31, 8, 16, 37, 12, 33],
            // }}
          />
        </Grid>
      </Grid>
      {/* </Stack> */}

      <Card sx={{ mb: { xs: 3, md: 5 } }} lg={12}>
        <Tabs
          value={currentTab}
          onChange={(event, newValue) => setCurrentTab(newValue)}
          sx={{
            px: 2.5,
            boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {TABS.map(({ value, label, color, count }) => (
            <Tab
              key={value}
              value={value}
              label={label}
              iconPosition="end"
              icon={
                <Label variant={value === 'all' ? 'filled' : 'soft'} color={color}>
                  {count}
                </Label>
              }
            />
          ))}
        </Tabs>

        <PaiementTableToolbar
          filters={filters}
          dateError={dateError}
          onResetPage={table.onResetPage}
          options={{ payment_method: PaymentMethods }}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
        />

        {canReset && (
          <PaiementTableFiltersResult
            filters={filters}
            onResetPage={table.onResetPage}
            totalResults={pagination.count}
            options={{ payment_method: PaymentMethods }}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box sx={{ position: 'relative' }} lg={12}>
          <Scrollbar sx={{ minHeight: 444, minWidth: 1000 }}>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={TABLE_HEAD}
                rowCount={pagination.count}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    tableData.map((row) => row.slug)
                  )
                }
              />
              {loading ? (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={100}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          py: 6,
                        }}
                      >
                        <CircularProgress />
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : (
                <TableBody>
                  {tableData.map((row) => (
                    <PaiementTableRow
                      key={row.slug}
                      row={row}
                      selected={table.selected.includes(row.slug)}
                      onViewRow={() => handleViewRow(row.slug)}
                      onValidateRow={() => handleValidate(row.slug)}
                      onRemoveRow={() => handleDelete(row.slug)}
                    />
                  ))}
                  {tableData.length > 0 && tableData.length < table.rowsPerPage && (
                    <TableEmptyRows
                      height={table.dense ? 56 : 56 + 20}
                      emptyRows={table.rowsPerPage - tableData.length}
                    />
                  )}
                  <TableNoData notFound={notFound} />
                </TableBody>
              )}
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={pagination.count}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { name, date_before, date_after } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (paiement) =>
        paiement.reference.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        paiement.payer.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        paiement.payment_method.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (!dateError) {
    if (date_before && date_after) {
      inputData = inputData.filter((paiement) =>
        fIsBetween(paiement.date_paiement, date_before, date_after)
      );
    }
  }

  return inputData;
}

