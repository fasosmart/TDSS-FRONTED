'use client';

import { DashboardContent } from 'src/layouts/dashboard';
import { Grid2 } from '@mui/material';
import { DeclarationNew } from '../analytics/declaration/declaration-new-invoice';
import { Button, Stack } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'src/utils/axios';
import API from 'src/utils/api';
import { useSetState } from 'src/hooks/use-set-state';
import { DeclarationreportFilters } from './components/declaration-filters';
import { DecReportToolbar } from './components/declaration-table-toolbar';
import { fIsBetween } from 'src/utils/format-time';
import { ExportDialog } from './components/export-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { exportToPDFM, exportToCSVM, exportToExcelM, exportToZipM } from 'src/utils/export-helpers';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { ColumnSelectorDialog } from './components/colums-selected';
import dayjs from 'dayjs';

const STATUS_TRANSLATIONS = {
  submitted: 'Soumise',
  validated: 'Validée',
  rejected: 'Rejetée',
  billed: 'Facturée',
  unsubmitted: 'Non soumise',
  processing: 'En traitement',
  printed: 'Imprimée',
  delivered: 'Delivrée',
  pending: 'En attente',
};

export function RapportDeclaration() {
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [count, setCount] = useState(0);
  const [isDeclaration, setIsDeclaration] = useState(true);
  const exportDialog = useBoolean();
  const columnDialog = useBoolean();

  const table = useTable({ defaultOrderBy: 'created_on' });

  const ALL_COLUMNS = useMemo(() => [
    { key: 'number', label: 'Numéro' },
    { key: 'company', label: 'Entreprise' },
    { key: 'nber_employees', label: 'Employés' },
    { key: 'facture_number', label: 'Facture' },
    { key: 'created_on', label: 'Date de Création' },
    { key: 'status', label: 'Statut', translate: STATUS_TRANSLATIONS },
  ]);

  const DEFAULT_COLUMNS = ['number', 'company', 'nber_employees', 'created_on', 'status'];

  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_COLUMNS);

  const filters = useSetState({
    number: '',
    company: '',
    status: 'all',
    created_on_before: null,
    created_on_after: null,
  }, { persistByPath: true });

  const dateError = fIsBetween(filters.state.created_on_after, filters.state.created_on_before);

  // Fonction pour construire les paramètres
  const buildParams = (page = 0, limit = table.rowsPerPage) => {
    const params = {
      limit,
      offset: page * limit,
    };

    // Ajouter les filtres seulement s'ils sont définis
    if (filters.state.number) {
      params.number = filters.state.number;
    }
    if (filters.state.company) {
      params.company = filters.state.company;
    }
    if (filters.state.status !== 'all') {
      params.status = filters.state.status;
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
      const resp = await axios.get(API.reportsDeclaration(), { params });
      const data = resp?.data.results || [];

      setDeclarations(data);
      setCount(resp?.data.count || 0);
    } catch (error) {
      console.log(error);
      const errorMessage =
        error?.response?.data?.error || error?.message || 'Erreur lors du chargement';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer TOUTES les données pour l'export
  const fetchAllDataForExport = async () => {
    try {
      const allData = [];
      let page = 0;
      const limit = count; // Taille de page pour l'export
      let hasMore = true;

      while (hasMore) {
        const params = buildParams(page, limit);
        const resp = await axios.get(API.reportsDeclaration(), { params });
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

  useEffect(() => {
    fetchReport();
  }, [
    table.page,
    table.rowsPerPage,
    filters.state.number,
    filters.state.company,
    filters.state.status,
    filters.state.created_on_before,
    filters.state.created_on_after,
  ]);

  const canReset =
    !!filters.state.number ||
    !!filters.state.company ||
    filters.state.status !== 'all' ||
    (!!filters.state.created_on_after && !!filters.state.created_on_before);

  const notFound = !loading && declarations.length === 0 && canReset;

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

  // Fonction pour exporter toutes les données avec les filtres
  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      // Récupérer TOUTES les données avec les mêmes filtres
      const exportData = await fetchAllDataForExport();

      if (exportData.length === 0) {
        toast.error('Aucune donnée à exporter avec les filtres actuels');
        return;
      }

      switch (format) {
        case 'pdf':
          await exportToPDFM(exportData, visibleColumns, 'rapport-declarations.pdf');
          break;
        case 'csv':
          exportToCSVM(exportData, visibleColumns, 'rapport-declarations.csv');
          break;
        case 'excel':
          exportToExcelM(exportData, visibleColumns, 'rapport-declarations.xlsx');
          break;
        case 'zip':
          await exportToZipM(exportData, visibleColumns, 'rapport-declarations.zip');
          break;
        default:
          console.error('Format non supporté');
      }

      exportDialog.onFalse();
      toast.success(`Export réussi: ${exportData.length} déclarations exportées`);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      const errorMessage =
        error?.response?.data?.error || error?.message || "Erreur lors de l'export";
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const statusOptions = [
    { value: 'submitted', label: 'Soumise' },
    { value: 'validated', label: 'Validée' },
    { value: 'rejected', label: 'Rejetée' },
    { value: 'billed', label: 'Facturée' },
    { value: 'unsubmitted', label: 'Non soumise' },
  ];

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Rapport des déclarations"
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
        isDeclaration={isDeclaration}
      />

      {canReset && (
        <DeclarationreportFilters
          filters={filters}
          totalResults={count}
          sx={{ p: 2.5, pt: 0 }}
          isDeclaration={isDeclaration}
        />
      )}

      <Grid2 size={{ xs: 12, md: 12 }}>
        <DeclarationNew
          title="Rapports des déclarations"
          tableData={declarations}
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
        totalItems={count}
      />
    </DashboardContent>
  );
}

