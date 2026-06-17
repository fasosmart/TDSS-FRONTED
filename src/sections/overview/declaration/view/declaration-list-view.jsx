'use client';

import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
// import { Popover, MenuItem } from '@mui/material';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'src/utils/axios';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DashboardContent } from 'src/layouts/dashboard';
import { varAlpha } from 'src/theme/styles';
import { Label } from 'src/components/label';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import API from 'src/utils/api';
import { fIsBetween } from 'src/utils/format-time';
import { sumBy } from 'src/utils/helper';
import { PDFDocument } from 'pdf-lib';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Iconify } from 'src/components/iconify';

import { Scrollbar } from 'src/components/scrollbar';
import { toast } from 'src/components/snackbar';
import {
  useTable,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { DeclarationSummary } from '../declaration-analytic';
import { DeclarationTableFiltersResult } from '../declaration-table-filters';
import { DeclarationTableRow } from '../declaration-table-row';
import { DeclarationTableToolbar } from '../declaration-table-toolbar';
import { DeclarationPDF, generateDeclarationPDF } from '../declaration-pdf';

import { usePermissions } from 'src/auth/hooks';

import dayjs from 'src/utils/format-time'; // Ensure this imports the correct dayjs instance
dayjs.locale('fr'); // Set the default locale to French

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'declarationNumber', label: 'Déclaration' },
  { id: 'type', label: 'Titre Déclaration' },
  { id: 'company', label: 'Entreprise' },
  { id: 'Number', label: 'Nombre Personnel' },
  { id: 'createDate', label: 'Date de Création' },
  // { id: 'price', label: 'Montant' },
  { id: 'status', label: 'Status' },

  { id: '' },
];

// ----------------------------------------------------------------------

export function DeclarationListView() {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();

  const { can } = usePermissions();


  const allowedTabStatuses = useMemo(() => {
    if (can('can_view_admin_dashboard'))
      return ['all', 'submitted', 'validated', 'billed', 'unsubmitted', 'rejected'];
    if (can('can_view_agent_dashboard'))
      return ['all', 'submitted', 'validated', 'unsubmitted', 'rejected'];
    if (can('can_view_aguipe_dashboard')) return ['all', 'submitted', 'rejected'];
    if (can('can_view_accountant_dashboard')) return ['all', 'billed', 'validated'];
    return ['all'];
  }, [can]);

  const allowedCardStatuses = useMemo(() => {
    if (can('can_view_admin_dashboard')) return ['all', 'submitted', 'validated', 'billed'];
    if (can('can_view_agent_dashboard')) return ['all', 'submitted', 'validated', 'unsubmitted'];
    if (can('can_view_aguipe_dashboard')) return ['all', 'submitted', 'rejected'];
    if (can('can_view_accountant_dashboard')) return ['all', 'billed', 'validated'];
    return ['all'];
  }, [can]);

  const router = useRouter();
  const fetchRequestIdRef = useRef(0);

  const table = useTable({ defaultOrderBy: 'created_on' });

  const confirm = useBoolean();

  const confirmDownload = useBoolean();
  const downloadZip = useBoolean();

  const billConfirm = useBoolean();

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true); // État pour indiquer le chargement
  const [loader, setLoader] = useState(false); // Etat pour indiquer les chargements sur les cards
  const [error, setError] = useState(null); // État pour gérer les erreurs
  const [selectedFilter, setSelectedFilter] = useState('number'); // options de recherche
  // const [selectedDeclarations, setSelectedDeclarations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadZip, setIsLoadZip] = useState(false);

  const [count, setCount] = useState();
  const [totalCount, setTotalCount] = useState();
  const [submitCount, setSubmitCount] = useState();
  const [UnSubmitCount, setUnSubmitCount] = useState();
  const [validCount, setValidCount] = useState();
  const [rejectCount, setRejectCount] = useState();
  const [billCount, setBillCount] = useState();

  const downloadMultiplePDF = useBoolean();

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const filters = useSetState({
    number: '', // mot-clé pour filtrer par numéro ou type de déclaration
    fonction: [],
    title: '',
    company: '',
    passport_number: '',
    status: 'all',
    starts_at: null,
    ends_at: null,
  }, { persistByPath: true });

  const dateError = fIsBetween(filters.state.starts_at, filters.state.ends_at);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
    dateError,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.number ||
    // !!filters.state.type ||
    !!filters.state.title ||
    !!filters.state.company ||
    !!filters.state.passport_number ||
    filters.state.fonction.length > 0 ||
    filters.state.status !== 'all' ||
    (!!filters.state.starts_at && !!filters.state.ends_at);

  const notFound = pagination.count === 0 && canReset;

  useEffect(() => {
    const fetchStats = async () => {
      setLoader(true);
      try {
        const { data } = await axios.get(API.statsDeclaration());

        setTotalCount(data?.total_declarations);
        setSubmitCount(data?.submitted);
        setUnSubmitCount(data?.unsubmitted);
        setValidCount(data?.validated);
        setRejectCount(data?.rejected);
        setBillCount(data?.billed);
      } catch (err) {
        toast.error('Erreur lors du chargement des stats', err);
      } finally {
        setLoader(false);
      }
    };

    fetchStats();
  }, []);

  const fetchEmployeesBySlug = async (slug) => {
    if (!slug) return [];

    try {
      // 1. Premier appel pour avoir count et premiers résultats paginés
      const {
        data: { count, results },
      } = await axios.get(API.Employe(slug));

      let allEmployees = results;

      // 2. Si les résultats sont paginés, on récupère tout d’un coup
      if (count > results.length) {
        const {
          data: { results: fullResults },
        } = await axios.get(API.Employe(slug), {
          params: { limit: count, offset: 0 },
        });
        allEmployees = fullResults;
      }

      return allEmployees;
    } catch (error) {
      console.error('Erreur lors du chargement des employés :', error);
      return [];
    }
  };

  const fetchDeclarations = async (slugs) => {
    const responses = await Promise.all(
      slugs.map((slug) => axios.get(API.detailsDeclaration(slug)))
    );
    return Promise.all(
      responses.map(async (res) => {
        const declaration = res.data;
        const employees = await fetchEmployeesBySlug(declaration.slug);
        return { ...declaration, employees };
      })
    );
  };

  const getPercentByCount = (number) => {
    if (!totalCount || totalCount === 0) return 0;
    return (number / totalCount) * 100;
  };

  // Mapping des statuts aux composants/cards
  const statusCards = {
    all: (
      <Grid size={{ xs: 6, md: 3 }} key="all">
        <DeclarationSummary
          title="Total"
          total={totalCount}
          percent={100}
          loading={loader}
          chart={{
            colors: [theme.vars.palette.info.main],
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            series: [20, 41, 63, 33, 28, 35, 50, 46],
          }}
        />
      </Grid>
    ),
    validated: (
      <Grid size={{ xs: 6, md: 3 }} key="validated">
        <DeclarationSummary
          title="Validées"
          total={validCount}
          percent={getPercentByCount(validCount)}
          loading={loader}
          chart={{
            colors: [theme.vars.palette.success.main],
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            series: [15, 18, 12, 51, 68, 11, 39, 37],
          }}
        />
      </Grid>
    ),
    unsubmitted: (
      <Grid size={{ xs: 6, md: 3 }} key="unsubmitted">
        <DeclarationSummary
          title="Brouillon"
          total={UnSubmitCount}
          percent={getPercentByCount(UnSubmitCount)}
          loading={loader}
          chart={{
            colors: [theme.vars.palette.warning.main],
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            series: [18, 19, 31, 8, 16, 37, 12, 33],
          }}
        />
      </Grid>
    ),
    rejected: (
      <Grid size={{ xs: 6, md: 3 }} key="rejected">
        <DeclarationSummary
          title="Rejetées"
          total={rejectCount}
          percent={getPercentByCount(rejectCount)}
          loading={loader}
          chart={{
            colors: [theme.vars.palette.error.main],
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            series: [18, 19, 31, 8, 16, 37, 12, 33],
          }}
        />
      </Grid>
    ),
    billed: (
      <Grid size={{ xs: 6, md: 3 }} key="billed">
        <DeclarationSummary
          title="Facturées"
          total={billCount}
          percent={getPercentByCount(billCount)}
          loading={loader}
          chart={{
            colors: [theme.vars.palette.primary.main],
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            series: [10, 22, 15, 44, 30, 25, 20, 40],
          }}
        />
      </Grid>
    ),
    submitted: (
      <Grid size={{ xs: 6, md: 3 }} key="submitted">
        <DeclarationSummary
          title="Soumises"
          total={submitCount}
          percent={getPercentByCount(submitCount)}
          loading={loader}
          chart={{
            colors: [theme.vars.palette.secondary.main],
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            series: [12, 34, 22, 40, 45, 36, 28, 50],
          }}
        />
      </Grid>
    ),
  };

  const TABS = [
    {
      value: 'all',
      label: 'Toutes',
      color: 'main',
      count: totalCount,
    },
    {
      value: 'submitted',
      label: 'Soumises',
      color: 'warnning',
      count: submitCount,
    },
    {
      value: 'validated',
      label: 'Validées',
      color: 'success',
      count: validCount,
    },
    {
      value: 'billed',
      label: 'Facturées',
      color: 'primary',
      count: billCount,
    },
    {
      value: 'unsubmitted',
      label: 'Brouillon',
      color: 'warning',
      count: UnSubmitCount,
    },

    {
      value: 'rejected',
      label: 'Rejetées',
      color: 'error',
      count: rejectCount,
    },
  ];

  const tabs = TABS.filter((tab) => allowedTabStatuses.includes(tab.value));

  const handleDeleteRow = async (id) => {
    try {
      const response = await axios.delete(API.supprimerDeclaration(id));
      if (response.data.success) {
        toast.success('Déclaration supprimée avec succès !');
      } else {
        console.error('Erreur lors de la suppression:', response.data.error);
        toast.error(`Erreur : ${response.data.error}`);
      }
    } catch (error) {
      const errorMessage = error?.error || error?.details || error?.message || error?.detail;
      setError(errorMessage);
      console.error('Erreur réseau ou serveur:', error);
      toast.error(errorMessage);
    }
  };

  const handleDownload = async () => {
    if (!table.selected || table.selected.length === 0) {
      console.warn('Aucune déclaration sélectionnée.');
      return;
    }

    setIsLoading(true); // Début du chargement

    try {
      const slugs = table.selected;
      const declarations = await fetchDeclarations(slugs);

      for (const declaration of declarations) {
        const logoUrl = declaration?.company?.picture;
        const proxyBase = 'https://api.allorigins.win/raw?url=';
        const proxiedLogoUrl = logoUrl ? proxyBase + encodeURIComponent(logoUrl) : null;

        const blob = await pdf(
          <DeclarationPDF
            declaration={declaration}
            employees={declaration.employees}
            logoUrl={proxiedLogoUrl}
          />
        ).toBlob();

        saveAs(blob, `declaration-${declaration.number}.pdf`);
      }
    } catch (err) {
      toast.error('Erreur lors du téléchargement :', err);
    } finally {
      setIsLoading(false); // Fin du chargement
    }
  };
  // Fonction pour télécharger plusieurs declarations PDF en un seul fichier
  const handleDownloadMultiplePDF = async () => {
    if (!table.selected || table.selected.length === 0) {
      toast.warn('Aucune déclaration sélectionnée.');
      return;
    }

    setIsLoading(true);

    try {
      const slugs = table.selected;
      const declarations = await fetchDeclarations(slugs);

      // 1. Nouveau document final
      const mergedPdf = await PDFDocument.create();

      for (const declaration of declarations) {
        // 2. Génération du PDF de cette déclaration (sous forme de bytes)
        const singlePdfBytes = await generateDeclarationPDF(declaration, { download: false });

        // 3. Charger le PDF source
        const singlePdfDoc = await PDFDocument.load(singlePdfBytes);

        // 4. Copier toutes les pages dans le document final
        const copiedPages = await mergedPdf.copyPages(singlePdfDoc, singlePdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      // 5. Sauvegarde et téléchargement
      const mergedPdfBytes = await mergedPdf.save();
      saveAs(new Blob([mergedPdfBytes], { type: 'application/pdf' }), 'declarations_ensemble.pdf');
      toast.success('Téléchargement PDF déclarations groupées terminé !');
      table.onSelectAllRows(false, []);
    } catch (error) {
      console.error('Erreur fusion PDF :', error);
      toast.error('Erreur lors de la génération du PDF.');
    } finally {
      setIsLoading(false);
    }
  };
  // Fonction pour télécharger plusieurs declarations en un fichier ZIP
  const handleDownloadZip = async () => {
    if (!table.selected || table.selected.length === 0) {
      toast.warn('Aucune déclaration sélectionnée.');
      return;
    }

    setIsLoadZip(true);

    try {
      const slugs = table.selected;
      const declarations = await fetchDeclarations(slugs);

      const zip = new JSZip();

      for (const declaration of declarations) {
        const blob = await generateDeclarationPDF(declaration, {
          download: false, // Ne pas télécharger individuellement
        });

        const filename = `declaration-${declaration.number}.pdf`;
        zip.file(filename, blob);
      }

      // Générer le fichier ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'declarations.zip');
      toast.success('Téléchargement ZIP terminé !');
      table.onSelectAllRows(false, []);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du téléchargement ZIP.');
    } finally {
      setIsLoadZip(false);
    }
  };

  const handleBilledRows = useCallback(async () => {
    const selectedSlugs = table.selected;

    if (selectedSlugs.length === 0) {
      toast.error('Aucune déclaration sélectionnée.');
      return;
    }

    const requestBody = {
      declarations: selectedSlugs,
      comment: "Déclaration facturée via l'interface.", // ou récupéré dynamiquement
    };

    try {
      await axios.post(API.FacturerDeclaration(), requestBody);

      // Mettre à jour localement le status
      const updatedData = tableData.map((item) =>
        selectedSlugs.includes(item.slug) ? { ...item, status: 'billed' } : item
      );

      setTableData(updatedData);
      toast.success('Facturation réussie !');
      table.onSelectAllRows(false, []);
      router.push(paths.dashboard.factures.list);
    } catch (error) {
      console.error('Erreur lors de la facturation :', error);

      const data = error.response?.data || error;
      const messages = [];

      if (data.declarations) {
        messages.push(
          ...(Array.isArray(data.declarations) ? data.declarations : [data.declarations])
        );
      }
      if (data.details) messages.push(data.details);
      if (data.error) messages.push(data.error);
      if (data.message) messages.push(data.message);

      const errorMessage = messages.join('');

      toast.error(errorMessage);
      table.onSelectAllRows(false, []);
    }
  }, [table, tableData, router]);

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

    toast.success('Suppression reussie!');

    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleEditRow = useCallback(
    (slug) => {
      router.push(paths.dashboard.declaration.edit(slug));
    },
    [router]
  );

  const handleSubmitRow = useCallback(
    async (slug) => {
      try {
        // Appel à l'API backend pour valider la déclaration en envoyant l'action
        const response = await axios.post(API.submitDeclaration(slug), {});

        if (response) {
          // Si succès, rediriger ou mettre à jour l'interface utilisateur
          toast.success('Déclaration soumise avec succès !');
          // Mise à jour locale du statut dans tableData
          setTableData((prevData) =>
            prevData.map((item) => (item.slug === slug ? { ...item, status: 'submitted' } : item))
          );
          router.push(paths.dashboard.declaration.list);
        } else {
          console.error('Erreur lors de la validation:', response.data.error);
          toast.error('Une erreur est survenue.');
        }
      } catch (error) {
        const errorMessage = error?.error || error?.details || error?.message || error?.detail;
        setError(errorMessage);
        console.error('Erreur réseau ou serveur:', error);
        toast.error(errorMessage);
      }
    },
    [router]
  );

  const handleUnSubmitRow = useCallback(
    async (slug) => {
      try {
        // Appel à l'API backend pour valider la déclaration en envoyant l'action
        const response = await axios.post(API.unsubmitDeclaration(slug), {});

        if (response) {
          // Si succès, rediriger ou mettre à jour l'interface utilisateur
          toast.success('Le statut de la déclaration a été remis à non soumis avec succès !');
          // Mise à jour locale du statut dans tableData
          setTableData((prevData) =>
            prevData.map((item) => (item.slug === slug ? { ...item, status: 'unsubmitted' } : item))
          );
          router.push(paths.dashboard.declaration.list);
        } else {
          console.error('Erreur lors de la validation:', response.data.error);
          toast.error('Une erreur est survenue.');
        }
      } catch (error) {
        const errorMessage = error?.error || error?.details || error?.message || error?.detail;
        setError(errorMessage);
        console.error('Erreur réseau ou serveur:', error);
        toast.error(errorMessage);
      }
    },
    [router]
  );

  const handleValidateRow = useCallback(
    async (slug) => {
      try {
        // Appel à l'API backend pour valider la déclaration en envoyant l'action
        const response = await axios.post(API.validateDeclaration(slug), {});

        if (response) {
          // Si succès, rediriger ou mettre à jour l'interface utilisateur
          toast.success('Déclaration validée avec succès !');
          // Mise à jour locale du statut dans tableData
          setTableData((prevData) =>
            prevData.map((item) => (item.slug === slug ? { ...item, status: 'validated' } : item))
          );
          router.push(paths.dashboard.declaration.list);
        } else {
          console.error('Erreur lors de la validation:', response.data.error);
          toast.error('Une erreur est survenue.');
        }
      } catch (error) {
        const errorMessage = error?.error || error?.details || error?.message || error?.detail;
        setError(errorMessage);
        console.error('Erreur réseau ou serveur:', error);
        toast.error(errorMessage);
      }
    },
    [router]
  );

  const handleFacturer = useCallback(
    async (slug) => {
      try {
        // Construction du corps de la requête
        const requestBody = {
          declarations: [slug], // tableau contenant un seul slug
          comment: "Facturation individuelle depuis l'interface", // facultatif ou dynamique
        };

        // Appel de la route (attention à bien exécuter la fonction)
        const response = await axios.post(API.FacturerDeclaration(), requestBody);

        // En cas de succès
        if (response.status === 200 || response.status === 201) {
          toast.success('Déclaration facturée avec succès !');
          // Mise à jour locale du statut
          setTableData((prevData) =>
            prevData.map((item) => (item.slug === slug ? { ...item, status: 'billed' } : item))
          );
          router.push(paths.dashboard.factures.list);
        } else {
          console.error('Erreur inattendue lors de la facturation:', response.data);
          toast.error('Une erreur est survenue.');
        }
      } catch (error) {
        const errorMessage =
          error?.response?.data?.message || error?.message || 'Erreur lors de la facturation.';
        setError(errorMessage);
        console.error('Erreur réseau ou serveur:', error);
        toast.error(errorMessage);
      }
    },
    [router]
  );

  const handleRejetter = useCallback(
    async (slug, motifRejet) => {
      try {
        // Appel à l'API backend pour rejeter la déclaration
        const response = await axios.post(API.rejetterDeclaration(slug), {
          reject_reason: motifRejet,
        });
        if (response) {
          toast.success('Déclaration rejetée avec succès !');
          setTableData((prevData) =>
            prevData.map((item) => (item.slug === slug ? { ...item, status: 'rejected' } : item))
          );
          router.push(paths.dashboard.declaration.list);
        } else {
          console.error('Erreur lors du rejet :', response.data.error);
          toast.error('Une erreur est survenue.');
        }
      } catch (error) {
        const errorMessage = error?.error || error?.details || error?.message || error?.detail;
        setError(errorMessage);
        console.error('Erreur réseau ou serveur:', error);
        toast.error(errorMessage);
      }
    },
    [router]
  );

  const handleViewRow = useCallback(
    (slug) => {
      router.push(paths.dashboard.declaration.details(slug));
    },
    [router]
  );

  const handleViewFacture = useCallback(
    (slug) => {
      router.push(paths.dashboard.factures.details(slug));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  useEffect(() => {
    if (!filters.isHydrated) return;

    const requestId = fetchRequestIdRef.current + 1;
    fetchRequestIdRef.current = requestId;

    // Fonction pour récupérer les données paginées en fonction des filtres et la page courante
    const fetchDeclarations = async () => {
      setLoading(true);
      try {
        const offset = table.page * table.rowsPerPage;
        const params = {
          limit: table.rowsPerPage,
          offset: offset,
          ...(filters.state.company
            ? { company: filters.state.company }
            : filters.state.title
              ? { title: filters.state.title }
              : filters.state.passport_number
                ? { passport_number: filters.state.passport_number }
                : filters.state.number
                  ? { number: filters.state.number }
                  : {}),
          ...(filters.state.status !== 'all' ? { status: filters.state.status } : {}),
        };

        // Gestion des dates selon la spécification de l'API
        if (filters.state.starts_at) {
          // Format: YYYY-MM-DD
          params.starts_at = dayjs(filters.state.starts_at).format('YYYY-MM-DD');
        }

        if (filters.state.ends_at) {
          // Format: YYYY-MM-DD
          // On ajoute 1 jour et on soustrait 1 milliseconde pour inclure toute la journée
          const endOfDay = dayjs(filters.state.ends_at).add(1, 'day').subtract(1, 'millisecond');
          params.ends_at = endOfDay.format('YYYY-MM-DD');
        }

        // console.log('Fetching declarations with params:', params);
        const response = await axios.get(API.listDeclarations(), { params });

        if (requestId !== fetchRequestIdRef.current) return;

        setTableData(response.data.results);
        setCount(response.data.count);
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        });
      } catch (err) {
        if (requestId !== fetchRequestIdRef.current) return;

        console.error('Error fetching declarations:', err);
        setError(err.message || 'Erreur lors du chargement des données.');
        const errormessage =
          err?.response?.data?.detail || err?.message || 'Une erreur est survenue';
        toast.error(errormessage);
      } finally {
        if (requestId !== fetchRequestIdRef.current) return;

        setLoading(false);
      }
    };

    // Requête lancée à chaque changement de page, du nombre de lignes ou des filtres

    fetchDeclarations();
  }, [
    filters.isHydrated,
    table.page,
    table.rowsPerPage,
    filters.state.number,
    filters.state.company,
    filters.state.title,
    filters.state.passport_number,
    filters.state.status,
    filters.state.starts_at,
    filters.state.ends_at,
  ]);

  if (loading) {
    console.info('Loading declarations...');
  }

  if (error) {
    console.error(`Error: ${error}`);
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'declaration-popover' : undefined;

  const allowedStatuses = allowedCardStatuses;

  {
    isLoading && toast.info('Téléchargement en cours, veuillez patienter...');
  }

  return (
    <>
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="Listes des Déclarations"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Déclaration', href: paths.dashboard.declaration.list },
            { name: 'Listes des déclarations' },
          ]}
          action={
            can('can_create_declaration') && (
              <Button
                component={RouterLink}
                href={paths.dashboard.declaration.new}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                Ajouter
              </Button>
            )
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Grid container spacing={3} sx={{ mb: { xs: 3, md: 5 } }}>
          {allowedStatuses.map((status) => statusCards[status]).filter(Boolean)}
          {/* <Grid size={{ xs: 6, md: 3 }}>
            <DeclarationSummary
              title="Total"
              total={summary.totalCount}
              percent={100}
              chart={{
                colors: [theme.vars.palette.info.main],
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [20, 41, 63, 33, 28, 35, 50, 46],
              }}
            />
          </Grid> */}
          {/* <Grid size={{ xs: 6, md: 3 }}>
            <DeclarationSummary
              title="Validées"
              total={getDeclarationLength('validated')}
              percent={getPercentByStatus('validated')}
              chart={{
        larations        // colors: [theme.vars.palette.success.main],
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [15, 18, 12, 51, 68, 11, 39, 37],
              }}
            />
          </Grid> */}

          {/* <Grid size={{ xs: 6, md: 3 }}>
            <DeclarationSummary
              title="Brouillon"
              total={getDeclarationLength('unsubmitted')}
              percent={getPercentByStatus('unsubmitted')}
              chart={{
                colors: [theme.vars.palette.warning.main],
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [18, 19, 31, 8, 16, 37, 12, 33],
              }}
            />
          </Grid> */}
          {/* <Grid size={{ xs: 6, md: 3 }}>
            <DeclarationSummary
              title="Rejetées"
              total={getDeclarationLength('rejected')}
              percent={getPercentByStatus('rejected')}
              chart={{
                colors: [theme.vars.palette.error.main],
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [18, 19, 31, 8, 16, 37, 12, 33],
              }}
            />
          </Grid> */}
        </Grid>

        <Card>
          <Tabs
            value={filters.state.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                iconPosition="end"
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                      'soft'
                    }
                    color={tab.color}
                  >
                    {tab.count}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <DeclarationTableToolbar
            filters={filters}
            dateError={dateError}
            onResetPage={table.onResetPage}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            options={{
              fonctions: [...new Set(tableData.map((option) => option.title.trim()))],
            }}
          />

          {canReset && (
            <DeclarationTableFiltersResult
              filters={filters}
              onResetPage={table.onResetPage}
              totalResults={pagination.count}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={pagination.count}
              onSelectAllRows={(checked) => {
                table.onSelectAllRows(
                  checked,
                  tableData.map((row) => row.slug)
                );
              }}
              action={
                <Stack direction="row">
                  {/* telecharger toutes les declarations en un seul fichier */}
                  {can('can_invoice_declaration') && (
                    <Tooltip title="Facturer">
                      <IconButton
                        color="primary"
                        onClick={() => {
                          // On récupère les lignes sélectionnées
                          const selectedRows = tableData.filter((row) =>
                            table.selected.includes(row.slug)
                          );

                          // Vérifie si toutes ont le statut validé
                          const hasInvalid = selectedRows.some(
                            (row) => row.status?.toLowerCase() !== 'validated'
                          );

                          if (hasInvalid) {
                            toast.error(
                              'Certaines déclarations sélectionnées ne sont pas validées. Vous ne pouvez pas les facturer.'
                            );
                            table.onSelectAllRows(false, []);
                            return;
                          }

                          // Si tout est bon → on lance la facturation
                          billConfirm.onTrue();
                        }}
                      >
                        <Iconify icon="mdi:credit-card" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Telecharger">
                    <IconButton color="primary" onClick={confirmDownload.onTrue}>
                      <Iconify icon="eva:download-outline" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Télécharger toutes les déclarations (PDF unique)">
                    <span>
                      <IconButton
                        color="primary"
                        onClick={downloadMultiplePDF.onTrue}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Iconify icon="mdi:file-download-outline" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Télécharger en ZIP">
                    <IconButton color="primary" onClick={downloadZip.onTrue} disabled={isLoadZip}>
                      {isLoadZip ? <CircularProgress size={24} /> : <Iconify icon="mdi:zip-box" />}
                    </IconButton>
                  </Tooltip>
                  {/* <Tooltip title="Imprimer">
                    <IconButton color="primary">
                      <Iconify icon="solar:printer-minimalistic-bold" />
                    </IconButton>
                  </Tooltip> */}

                  {/* <Tooltip title="Supprimer">
                    <IconButton color="primary" onClick={confirm.onTrue}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip> */}
                </Stack>
              }
            />

            <Scrollbar sx={{ minHeight: 444 }}>
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
                      <DeclarationTableRow
                        key={row.slug}
                        row={row}
                        selected={table.selected.includes(row.slug)}
                        onSelectRow={() => table.onSelectRow(row.slug)}
                        onViewRow={() => handleViewRow(row.slug)}
                        onEditRow={() => handleEditRow(row.slug)}
                        onSubmitRow={() => handleSubmitRow(row.slug)}
                        onUnSubmitRow={() => handleUnSubmitRow(row.slug)}
                        onDeleteRow={() => handleDeleteRow(row.slug)}
                        onValidateRow={() => handleValidateRow(row.slug)}
                        onFactureRow={() => handleFacturer(row.slug)}
                        onRejetRow={(rejectReason) => handleRejetter(row.slug, rejectReason)}
                        onViewFacture={handleViewFacture}
                      />
                    ))}

                    {tableData.length > 0 && tableData.length < table.rowsPerPage && (
                      <TableEmptyRows
                        height={table.dense ? 56 : 76}
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

      <ConfirmDialog
        open={downloadMultiplePDF.value}
        onClose={downloadMultiplePDF.onFalse}
        title="Télécharger"
        content={
          <>
            Etes vous sûr de vouloir télécharger <strong> {table.selected.length} </strong>{' '}
            déclarations dans un seul fichier?
          </>
        }
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              handleDownloadMultiplePDF(); // Action pour "Télécharger"
              downloadMultiplePDF.onFalse();
            }}
          >
            Telecharger
          </Button>
        }
      />
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Supprimer"
        content={
          <>
            Etes vous sûr de vouloir supprimer <strong> {table.selected.length} </strong>{' '}
            declarations?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Supprimer
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmDownload.value}
        onClose={confirmDownload.onFalse}
        title="Télécharger"
        content={
          <>
            Etes vous sûr de vouloir télécharger <strong> {table.selected.length} </strong>{' '}
            declarations?
          </>
        }
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              handleDownload();
              confirmDownload.onFalse();
            }}
          >
            Telecharger
          </Button>
        }
      />
      {/* modal confirmation telechargement zip de plusieurs declarations */}
      <ConfirmDialog
        open={downloadZip.value}
        onClose={downloadZip.onFalse}
        title="Télécharger en ZIP"
        content={
          <>
            Etes vous sûr de vouloir télécharger en ZIP <strong> {table.selected.length} </strong>{' '}
            déclarations?
          </>
        }
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              handleDownloadZip(); // Action pour "Télécharger"
              downloadZip.onFalse();
            }}
          >
            Telecharger en ZIP
          </Button>
        }
      />

      <ConfirmDialog
        open={billConfirm.value}
        onClose={billConfirm.onFalse}
        title="Facturer"
        content={
          <>
            Etes vous sûr de vouloir facturer <strong> {table.selected.length} </strong>{' '}
            declarations?
          </>
        }
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              handleBilledRows();
              billConfirm.onFalse();
            }}
          >
            Facturer
          </Button>
        }
      />
    </>
  );
}

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { name, status, fonction, starts_at, ends_at } = filters;

  // Tri des données
  const stabilizedThis = inputData?.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  inputData = stabilizedThis?.map((el) => el[0]);

  // Filtrage par numéro de déclaration ou type de déclaration
  if (name) {
    inputData = inputData?.filter(
      (declaration) =>
        declaration?.reference?.toLowerCase().includes(name.toLowerCase()) ||
        declaration?.title?.toLowerCase().includes(name.toLowerCase())
    );
  }

  // Filtrage par statut
  if (status !== 'all') {
    inputData = inputData?.filter((declaration) => declaration?.status === status);
  }

  // Filtrage par fonction (en s'assurant que declaration.employees existe)
  if (fonction?.length) {
    inputData = inputData?.filter((declaration) =>
      (declaration?.employees || []).some((filterItem) => fonction?.includes(filterItem?.fonction))
    );
  }

  // Filtrage par date
  if (!dateError) {
    if (starts_at && ends_at) {
      inputData = inputData?.filter((declaration) =>
        fIsBetween(declaration?.createDate, starts_at, ends_at)
      );
    }
  }

  return inputData;
}

