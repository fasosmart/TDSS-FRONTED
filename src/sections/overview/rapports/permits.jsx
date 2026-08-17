'use client';

import { DashboardContent } from 'src/layouts/dashboard';
import { Grid2 } from '@mui/material';
import { DeclarationNew } from '../analytics/declaration/declaration-new-invoice';
import { Button } from '@mui/material';
import { Stack } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'src/utils/axios';
import API from 'src/utils/api';
import { useSetState } from 'src/hooks/use-set-state';
import { DeclarationreportFilters } from './components/declaration-filters';
import { DecReportToolbar } from './components/declaration-table-toolbar';
import { ExportDialog } from './components/export-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { exportToCSVM, exportToExcelM, exportToZipM, exportToPDFM } from 'src/utils/export-helpers';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { ColumnSelectorDialog } from './components/colums-selected';
import { useLocalStorage } from 'src/hooks/use-local-storage';
import { create } from '@mui/material/styles/createTransitions';
import { fIsBetween } from 'src/utils/format-time';
import dayjs from 'dayjs';

const STATUS_TRANSLATIONS = {
  processing: 'En traitement',
  submitted: 'Soumis',
  validated: 'Validé',
  rejected: 'Rejeté',
  printed: 'Imprimé',
  delivered: 'Délivré',
};

const SEXE_TRANSLATIONS = {
  male: 'Homme',
  female: 'Femme',
};

export function ReportPermit() {
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [errors, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [count, setCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [countries, setCountries] = useState([]);

  const [jobs, setJobs] = useState([]);
  const exportDialog = useBoolean();
  const columnDialog = useBoolean();

  const table = useTable({ defaultOrderBy: 'created_on' });

  const ALL_COLUMNS = useMemo(
    () => [
      { key: 'reference', label: 'Référence' },
      { key: 'card_number', label: 'N° Carte' },
      { key: 'passport_number', label: 'Passeport' },
      { key: 'first', label: 'Prénom' },
      { key: 'last', label: 'Nom' },
      { key: 'nationality', label: 'Nationalité' },
      { key: 'sexe', label: 'Sexe', translate: SEXE_TRANSLATIONS },
      { key: 'company', label: 'Entreprise' },
      { key: 'job', label: 'Fonction' },
      { key: 'permit_type', label: 'Permis' },
      { key: 'created_on', label: 'Date de création', isDate: true },
      { key: 'status', label: 'Statut', translate: STATUS_TRANSLATIONS },
    ],
    []
  );

  const DEFAULT_COLUMNS = [
    'reference',
    'card_number',
    'passport_number',
    'first',
    'last',
    'nationality',
    'sexe',
    'company',
    'job',
    'permit_type',
    'status',
    'created_on',
  ];

  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_COLUMNS);

  const filters = useSetState(
    {
      card_number: '',
      reference: '',
      company: '',
      declaration_number: '',
      passport: '',
      status: 'all',
      job: null,
      name: '',
      nationality: 'all',
      sexe: 'all',
      permit_type: 'all',
      created_on_before: null,
      created_on_after: null,
    },
    { persistByPath: true }
  );

  const fectCountries = async () => {
    try {
      const response = await axios.get(API.listCountries());
      setCountries(response.data?.results || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des pays:', error);
    }
  };

  const permitTypes = [
    { value: 'A', name: 'Permis A' },
    { value: 'B', name: 'Permis B' },
    { value: 'C', name: 'Permis C' },
  ];

  useEffect(() => {
    fectCountries();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchAllFonctions() {
      setLoadingOptions(true);

      // Vérifier si on a déjà le cache en session
      const cachedSession = sessionStorage.getItem('fonctions');
      let optionsToUse = cachedSession ? JSON.parse(cachedSession) : null;

      // Sinon, lecture cache localStorage
      if (!optionsToUse) {
        const cachedLocal = localStorage.getItem('fonctions');
        if (cachedLocal) {
          const parsedLocal = JSON.parse(cachedLocal);
          optionsToUse = parsedLocal.data;
          sessionStorage.setItem('fonctions', JSON.stringify(optionsToUse));
        }
      }

      // Afficher immédiatement ce qu'on a
      if (optionsToUse) {
        const uniqueClean = Array.from(
          new Map(optionsToUse.map((item) => [item.value, item])).values()
        );
        setJobs(uniqueClean);
      }

      // Vérifier si on doit rafraîchir depuis l'API
      const cachedLocal = localStorage.getItem('fonctions');
      let shouldFetch = true;

      if (cachedLocal) {
        const parsedLocal = JSON.parse(cachedLocal);
        const lastFetch = parsedLocal.lastFetch || 0;
        const now = Date.now();

        // Si le cache a moins de 24h → pas besoin de recharger
        if (now - lastFetch < 24 * 60 * 60 * 1000) {
          shouldFetch = false;
        }
      }

      if (!shouldFetch) {
        setLoadingOptions(false);
        return;
      }

      try {
        // Premier appel pour obtenir le count
        const resp1 = await axios.get(API.listFonctionAgent(), {
          params: { offset: 0, limit: 1 },
        });
        const total = resp1.data.count;

        // Récupérer toutes les fonctions
        const resp2 = await axios.get(API.listFonctionAgent(), {
          params: { offset: 0, limit: total },
        });

        if (!isMounted) return;

        // Filtre pour n'avoir qu'un slug unique
        const uniqueBySlug = resp2.data.results
          .filter((f, idx, arr) => arr.findIndex((item) => item.slug === f.slug) === idx)
          .map((f) => ({ label: f.name, value: f.slug }));

        // Sauvegarde avec la date du fetch
        const cachePayload = {
          data: uniqueBySlug,
          lastFetch: Date.now(),
        };

        localStorage.setItem('fonctions', JSON.stringify(cachePayload));
        sessionStorage.setItem('fonctions', JSON.stringify(uniqueBySlug));

        setJobs(uniqueBySlug);
      } catch (err) {
        console.error('Erreur lors du chargement des fonctions:', err);
        toast.error('Erreur lors du chargement des fonctions');
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }

    fetchAllFonctions();
    return () => {
      isMounted = false;
    };
  }, []);

  const dateError = fIsBetween(filters.state.created_on_after, filters.state.created_on_before);

  const buildParams = (page = 0, limit = table.rowsPerPage) => {
    const params = {
      limit,
      offset: page * limit,
    };

    // Ajouter les filtres seulement s'ils sont définis
    if (filters.state.card_number) {
      params.card_number = filters.state.card_number;
    }
    if (filters.state.passport) {
      params.passport = filters.state.passport;
    }
    if (filters.state.reference) {
      params.reference = filters.state.reference;
    }
    if (filters.state.company) {
      params.company = filters.state.company;
    }
    if (filters.state.declaration_number) {
      params.declaration_number = filters.state.declaration_number;
    }
    if (filters.state.status !== 'all') {
      params.status = filters.state.status;
    }
    if (filters.state.permit_type !== 'all') {
      params.permit_type = filters.state.permit_type;
    }
    if (filters.state.name) {
      params.name = filters.state.name;
    }
    if (filters.state.job) {
      // Si job est un objet avec value, utiliser value, sinon utiliser directement
      params.job =
        typeof filters.state.job === 'object' ? filters.state.job.value : filters.state.job;
    }
    if (filters.state.nationality !== 'all') {
      params.nationality = filters.state.nationality;
    }
    if (filters.state.sexe !== 'all') {
      params.sexe = filters.state.sexe;
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
      const resp = await axios.get(API.reportsPermits(), { params });
      const newData = resp?.data?.results || [];

      if (newData.length < table.rowsPerPage) {
        setHasMore(false);
      }
      setPermits(newData);
      setCount(resp?.data?.count || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      const errorMessage = error?.error || error?.details || error?.message || error?.detail;
      setError(errorMessage);
      toast.error(errorMessage || 'Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [
    table.page,
    table.rowsPerPage,
    selectedColumns,
    filters.state.card_number,
    filters.state.passport,
    filters.state.reference,
    filters.state.company,
    filters.state.declaration_number,
    filters.state.status,
    filters.state.permit_type,
    filters.state.name,
    filters.state.job,
    filters.state.nationality,
    filters.state.sexe,
    filters.state.created_on_after,
    filters.state.created_on_before,
  ]);

  const canReset =
    !!filters.state.card_number ||
    !!filters.state.passport ||
    !!filters.state.reference ||
    !!filters.state.company ||
    !!filters.state.declaration_number ||
    filters.state.status !== 'all' ||
    filters.state.permit_type !== 'all' ||
    !!filters.state.name ||
    !!filters.state.job ||
    filters.state.nationality !== 'all' ||
    filters.state.sexe !== 'all' ||
    (!!filters.state.created_on_after && !!filters.state.created_on_before);

  const notFound = !loading && permits.length === 0 && canReset;
  // Colonnes filtrées selon la sélection
  const visibleColumns = useMemo(
    () => ALL_COLUMNS.filter((col) => selectedColumns.includes(col.key)),
    [ALL_COLUMNS, selectedColumns]
  );

  const tableHeaders = useMemo(
    () => visibleColumns.map((col) => ({ id: col.key, label: col.label })),
    [visibleColumns]
  );

  // Handler pour appliquer la sélection de colonnes
  const handleApplyColumns = useCallback((columns) => {
    setSelectedColumns(columns);
    toast.success('Colonnes mises à jour avec succès');
  }, []);

  const columns = [
    { key: 'reference', label: 'Reference' },
    { key: 'card_number', label: 'N Carte' },
    { key: 'passport_number', label: 'Passeport' },
    { key: 'first', label: 'Prénom' },
    { key: 'last', label: 'Nom' },
    { key: 'nationality', label: 'Nationalité' },
    { key: 'sexe', label: 'Sexe', translate: SEXE_TRANSLATIONS },
    { key: 'company', label: 'Entreprise' },
    { key: 'job', label: 'Fonction' },
    { key: 'permit_type', label: 'Permis' },
    { key: 'status', label: 'Statut', translate: STATUS_TRANSLATIONS },
  ];

  const fetchAllDataForExport = async () => {
    try {
      const allData = [];
      let page = 0;
      const limit = count;
      let hasMore = true;

      while (hasMore) {
        const params = buildParams(page, limit);
        const resp = await axios.get(API.reportsPermits(), { params });
        const data = resp?.data.results || [];

        allData.push(...data);

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
          await exportToPDFM(exportData, visibleColumns, 'rapport-permits.pdf');
          break;
        case 'csv':
          exportToCSVM(exportData, visibleColumns, 'rapport-permits.csv');
          break;
        case 'excel':
          exportToExcelM(exportData, visibleColumns, 'rapport-permits.xlsx');
          break;
        case 'zip':
          await exportToZipM(exportData, visibleColumns, 'rapport-permits.zip');
          break;
        default:
          console.error('Format non supporté');
      }

      exportDialog.onFalse();
      toast.success('Export réussi !');
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error("Erreur lors de l'export. Vérifiez la console pour plus de détails.");
    } finally {
      setIsExporting(false);
    }
  };

  const statusOptions = [
    { value: 'processing', label: STATUS_TRANSLATIONS.processing },
    { value: 'submitted', label: STATUS_TRANSLATIONS.submitted },
    { value: 'validated', label: STATUS_TRANSLATIONS.validated },
    { value: 'rejected', label: STATUS_TRANSLATIONS.rejected },
    { value: 'printed', label: STATUS_TRANSLATIONS.printed },
    { value: 'delivered', label: STATUS_TRANSLATIONS.delivered },
  ];

  const sexeOptions = [
    { value: 'male', label: SEXE_TRANSLATIONS.male },
    { value: 'female', label: SEXE_TRANSLATIONS.female },
  ];

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Rapport des permits"
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
        options={{ status: statusOptions }}
        sexeOptions={sexeOptions}
        jobOptions={jobs}
        countryOptions={countries}
        permitTypeOptions={permitTypes}
        isPermit={true}
        loading={loadingOptions}
      />

      {canReset && (
        <DeclarationreportFilters
          filters={filters}
          totalResults={count}
          sx={{ p: 2.5, pt: 0 }}
          isPermit={true}
        />
      )}

      <Grid2 size={{ xs: 12, md: 12 }}>
        <DeclarationNew
          title="Rapports des permis"
          tableData={permits}
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
