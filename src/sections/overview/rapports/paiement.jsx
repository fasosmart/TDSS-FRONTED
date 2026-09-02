'use client';

import { DashboardContent } from 'src/layouts/dashboard';
import { Grid2 } from '@mui/material';
import { DeclarationNew } from '../analytics/declaration/declaration-new-invoice';
import { Button, Stack } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'src/utils/axios';
import API from 'src/utils/api';
import { useSetState } from 'src/hooks/use-set-state';
import { DeclarationreportFilters } from './components/declaration-filters';
import { DecReportToolbar } from './components/declaration-table-toolbar';
import { fIsBetween } from 'src/utils/format-time';
import { ExportDialog } from './components/export-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { exportToCSVM, exportToExcelM, exportToZipM, exportToPDFM } from 'src/utils/export-helpers';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { ColumnSelectorDialog } from './components/colums-selected';
import dayjs from 'dayjs';

export function ReportPaiement() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [count, setCount] = useState(0);
  const [isPaiement, setIsPaiement] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const exportDialog = useBoolean();
  const columnDialog = useBoolean();

  const table = useTable({ defaultOrderBy: 'created_on' });

  const filters = useSetState({
    number: '',
    client: '',
    status: 'all',
    payment_method: 'all',
    created_on_before: null,
    created_on_after: null,
  }, { persistByPath: true });

  const dateError = fIsBetween(filters.state.created_on_after, filters.state.created_on_before);

  const buildParams = (page = 0, limit = table.rowsPerPage) => {
    const params = {
      limit,
      offset: page * limit,
    };

    // Ajouter les filtres seulement s'ils sont définis
    if (filters.state.number) {
      params.number = filters.state.number;
    }
    if (filters.state.client) {
      params.client = filters.state.client;
    }
    if (filters.state.status !== 'all') {
      params.status = filters.state.status;
    }
    if (filters.state.payment_method !== 'all') {
      params.payment_method = filters.state.payment_method;
    }

    if (filters.state.created_on_after && !dateError) {
      params.created_on_after = dayjs(filters.state.created_on_after).format('YYYY-MM-DD');
    }
    if (filters.state.created_on_before && !dateError) {
      params.created_on_before = dayjs(filters.state.created_on_before).format('YYYY-MM-DD');
    }

    return params;
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = buildParams(table.page);
      const resp = await axios.get(API.reportsPaiement(), { params });
      const newData = resp?.data?.results || [];

      setPaiements(newData);
      setCount(resp?.data?.count || 0);
    } catch (error) {
      console.log(error);
      const errorMessage = error?.error || error?.details || error?.message || error?.detail;
      setError(errorMessage);
      toast.error(errors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [
    table.page,
    table.rowsPerPage,
    filters.state.number,
    filters.state.client,
    filters.state.status,
    filters.state.payment_method,
    filters.state.created_on_before,
    filters.state.created_on_after,
  ]);

  const canReset =
    !!filters.state.number ||
    !!filters.state.client ||
    filters.state.status !== 'all' ||
    filters.state.payment_method !== 'all' ||
    (!!filters.state.created_on_before && !!filters.state.created_on_after);

  const notFound = !loading && paiements.length === 0 && canReset;

  const STATUS_TRANSLATIONS = {
    pending: 'En  attente',
    validated: 'Validé',
  };

  const PAYMENT_METHOD = {
    transfer: 'Virement',
    cheque: 'Chèque',
    deposit: 'Dépôts',
  };

  const ALL_COLUMNS = useMemo(() => [
    { key: 'number', label: 'Numéro' },
    { key: 'client', label: 'Entreprise' },
    { key: 'nber_factures', label: 'Factures' },
    { key: 'payment_method', label: 'Méthode de Paiement', translate: PAYMENT_METHOD },
    { key: 'amount', label: 'Montant', isCurrency: true },
    { key: 'created_on', label: 'Date de Création', isDate: true },
    { key: 'status', label: 'Statut', translate: STATUS_TRANSLATIONS },
  ]);

  const DEFAULT_COLUMNS = [
    'number',
    'client',
    'nber_factures',
    'payment_method',
    'amount',
    'created_on',
    'status',
  ];

  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_COLUMNS);

  const visibleColumns = useMemo(
    () => ALL_COLUMNS.filter((col) => selectedColumns.includes(col.key)),
    [ALL_COLUMNS, selectedColumns]
  );

  const tableHeaders = useMemo(
    () => visibleColumns.map((col) => ({ id: col.key, label: col.label })),
    [visibleColumns]
  );

  const handleApplyColumns = useCallback((columns) => {
    setSelectedColumns(columns);
    toast.success('Colonnes mises à jour avec succès');
  }, []);

  const fetchAllDataForExport = async () => {
    try {
      const allData = [];
      let page = 0;
      const limit = count; // Taille de page pour l'export
      let hasMore = true;

      while (hasMore) {
        const params = buildParams(page, limit);
        const resp = await axios.get(API.reportsPaiement(), { params });
        const data = resp?.data.results || [];

        allData.push(...data);

        // Vérifier s'il y a encore des données
        if (data.length < limit || allData.length >= (resp?.data.count || 0)) {
          hasMore = false;
        } else {
          page++;
        }
      }

      return allData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données pour export:', error);
      throw error;
    }
  };

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const exportData = await fetchAllDataForExport();

      switch (format) {
        case 'pdf':
          await exportToPDFM(exportData, visibleColumns, 'paiemnts.pdf');
          break;
        case 'csv':
          exportToCSVM(exportData, visibleColumns, 'rapport-paiements.csv');
          break;
        case 'excel':
          exportToExcelM(exportData, visibleColumns, 'rapport-paiements.xlsx');
          break;
        case 'zip':
          await exportToZipM(exportData, visibleColumns, 'rapport-paiements.zip');
          break;
        default:
          console.error('Format non supporté');
      }

      exportDialog.onFalse();
      toast.success(`Export réussi: ${exportData.length}  paiements exportés`);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error("Erreur lors de l'export. Vérifiez la console pour plus de détails.");
    } finally {
      setIsExporting(false);
    }
  };

  // const statusOptions = Array.from(new Set(paiements.map((d) => d?.status).filter(Boolean))).map(
  //   (s) => ({ value: s, label: STATUS_TRANSLATIONS[s] || s })
  // );
  const statusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'validated', label: 'Validée' },
  ];

  const paymentOptions = [
    { value: 'transfer', label: 'Virement' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'deposit', label: 'Dépôts' },
  ];

  // const paymentOptions = Array.from(
  //   new Set(paiements.map((d) => d?.payment_method).filter(Boolean))
  // ).map((s) => ({ value: s, label: PAYMENT_METHOD[s] || s }));

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Rapport des paiements"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Rapports' }]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:options-2-outline" />}
              onClick={columnDialog.onTrue}
            >
              Colonnes ({selectedColumns.length})
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:download-fill" />}
              onClick={exportDialog.onTrue}
            >
              Exporter
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <DecReportToolbar
        filters={filters}
        dateError={dateError}
        options={{ status: statusOptions }}
        paymentOptions={paymentOptions}
        isPaiement={isPaiement}
      />

      {canReset && (
        <DeclarationreportFilters
          filters={filters}
          totalResults={count}
          sx={{ p: 2.5, pt: 0 }}
          isPaiement={isPaiement}
        />
      )}

      <Grid2 size={{ xs: 12, md: 12 }}>
        <DeclarationNew
          title="Rapports des paiemnts"
          tableData={paiements}
          totalCount={count}
          loading={loading}
          table={table}
          notFound={notFound}
          headLabel={tableHeaders}
        />
      </Grid2>

      <ColumnSelectorDialog
        open={columnDialog.value}
        onClose={columnDialog.onFalse}
        columns={ALL_COLUMNS}
        selectedColumns={selectedColumns}
        onApply={handleApplyColumns}
      />

      <ExportDialog
        open={exportDialog.value}
        onClose={exportDialog.onFalse}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </DashboardContent>
  );
}

