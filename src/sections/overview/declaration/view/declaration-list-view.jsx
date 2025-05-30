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
import axios from 'src/utils/axios';
import { useState, useEffect, useCallback } from 'react';
import { DashboardContent } from 'src/layouts/dashboard';
import { varAlpha } from 'src/theme/styles';
import { Label } from 'src/components/label';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import API from 'src/utils/api';
import { fIsAfter, fIsBetween } from 'src/utils/format-time';
import { sumBy } from 'src/utils/helper';

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

import { useMockedUser } from 'src/auth/hooks';
import dayjs from 'dayjs';


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


  const { user } = useMockedUser();

  const type_user = user?.type_name?.toLowerCase().trim();
  // console.log('type_user:', type_user);


  const router = useRouter();

  const table = useTable({ defaultOrderBy: 'created_on' });

  const confirm = useBoolean();

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true); // État pour indiquer le chargement
  const [error, setError] = useState(null); // État pour gérer les erreurs
  const [selectedFilter, setSelectedFilter] = useState('title'); // options de recherche 
  const [count, setCount] = useState();

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,

  });

  const [summary, setSummary] = useState({ totalCount: 0, countByStatus: {} });


  const filters = useSetState({
    name: '', // mot-clé pour filtrer par numéro ou type de déclaration
    fonction: [],
    title: '',
    company: '',
    status: 'all',
    starts_at: null,
    ends_at: null,
    
  });

  const dateError = fIsAfter(filters.state.starts_at, filters.state.ends_at);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
    dateError,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.type ||
    !!filters.state.title ||
    !!filters.state.company ||
    filters.state.fonction.length > 0 ||
    filters.state.status !== 'all' ||
    (!!filters.state.starts_at && !!filters.state.ends_at);


  const notFound = pagination.count === 0 && canReset;;

  const fetchTotalCount = () =>
    axios 
      .get(API.listDeclarations(), {params: {limit: 1}})
      .then((res) => res.data.count);
  
  const fetchCountByStatus = (status) =>
    axios 
      .get(API.listDeclarations(), {params: {limit: 1, status}})
      .then((res) => res.data.count);
      
  useEffect (() => {
    Promise.all([
      fetchTotalCount(),
      fetchCountByStatus('UNSUBMITTED'),
      fetchCountByStatus('SUBMITTED'),
      fetchCountByStatus('VALIDATED'),
      fetchCountByStatus('BILLED'),
      fetchCountByStatus('REJECTED')
    ])
    .then(([totalCount, 
      unsubmitCount, 
      submitCount, 
      validatCount, 
      billedCount, 
      rejectCount]) => {
        setSummary({
          totalCount,
          countByStatus: { 
            UNSUBMITTED : unsubmitCount,
            SUBMITTED : submitCount,
            VALIDATED : validatCount,
            BILLED : billedCount,
            REJECTED : rejectCount
           }
        });
      }) ;
  }, [])

  const getDeclarationLength = (status) => summary.countByStatus[status];

 

  const getTotalAmount = (status) =>
    sumBy(
      tableData.filter((item) => item.status === status),
      (declaration) => declaration.montant_facture
    );

  // const getPercentByStatus = (status) => (useDeclarationCount(status) / pagination.count) * 100;
  const getPercentByStatus = (status) => (getDeclarationLength(status) / summary.totalCount) * 100;

  const allowedStatusByRole = {
    admin:       ['all','SUBMITTED','VALIDATED','BILLED','UNSUBMITTED','REJECTED'],
    agent:       ['all','SUBMITTED','VALIDATED','UNSUBMITTED','REJECTED'],
    superviseur: ['all','SUBMITTED','REJECTED'],
    comptable:   ['all', 'BILLED', 'VALIDATED'],
    default:     ['all'],
  };


  const TABS = [
    {
      value: 'all',
      label: 'Toutes',
      color: 'main',
      count: summary.totalCount,
    },
    {
      value: 'SUBMITTED',
      label: 'Soumises',
      color: 'warnning',
      count: getDeclarationLength('SUBMITTED'),
    },
    {
      value: 'VALIDATED',
      label: 'Validées',
      color: 'success',
      count: getDeclarationLength('VALIDATED'),
    },
    {
      value: 'BILLED',
      label: 'Facturées',
      color: 'primary',
      count: getDeclarationLength('BILLED'),
    },
    {
      value: 'UNSUBMITTED',
      label: 'Brouillon',
      color: 'warning',
      count: getDeclarationLength('UNSUBMITTED'),
    },

    {
      value: 'REJECTED',
      label: 'Rejetées',
      color: 'error',
      count: getDeclarationLength('REJECTED'),
    },

  ];


  function getTabsForUser(userType) {
    const allowed = allowedStatusByRole[userType] || allowedStatusByRole.default;
    return TABS.filter(tab => allowed.includes(tab.value));
  }

  const tabs = getTabsForUser(type_user);

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
      setError(errorMessage)
      console.error('Erreur réseau ou serveur:', error);
      toast.error(errorMessage);
    }
  };

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
        const response = await axios.post(API.submitDeclaration(slug), {

        });

        if (response) {
          // Si succès, rediriger ou mettre à jour l'interface utilisateur
          toast.success('Déclaration soumise avec succès !');
          // Mise à jour locale du statut dans tableData
          setTableData((prevData) =>
            prevData.map((item) =>
              item.slug === slug ? { ...item, status: 'SUBMITTED' } : item
            )
          );
          router.push(paths.dashboard.declaration.list);
        } else {
          console.error('Erreur lors de la validation:', response.data.error);
          toast.error('Une erreur est survenue.');
        }
      } catch (error) {
        const errorMessage = error?.error || error?.details || error?.message || error?.detail;
        setError(errorMessage)
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
        const response = await axios.post(API.unsubmitDeclaration(slug), {

        });

        if (response) {
          // Si succès, rediriger ou mettre à jour l'interface utilisateur
          toast.success('Le statut de la déclaration a été remis à non soumis avec succès !');
          // Mise à jour locale du statut dans tableData
          setTableData((prevData) =>
            prevData.map((item) =>
              item.slug === slug ? { ...item, status: 'UNSUBMITTED' } : item
            )
          );
          router.push(paths.dashboard.declaration.list);
        } else {
          console.error('Erreur lors de la validation:', response.data.error);
          toast.error('Une erreur est survenue.');
        }
      } catch (error) {
        const errorMessage = error?.error || error?.details || error?.message || error?.detail;
        setError(errorMessage)
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
        const response = await axios.post(API.validateDeclaration(slug), {

        });

        if (response) {
          // Si succès, rediriger ou mettre à jour l'interface utilisateur
          toast.success('Déclaration validée avec succès !');
          // Mise à jour locale du statut dans tableData
          setTableData((prevData) =>
            prevData.map((item) =>
              item.slug === slug ? { ...item, status: 'VALIDATED' } : item
            )
          );
          router.push(paths.dashboard.declaration.list);
        } else {
          console.error('Erreur lors de la validation:', response.data.error);
          toast.error('Une erreur est survenue.');
        }
      } catch (error) {
        const errorMessage = error?.error || error?.details || error?.message || error?.detail;
        setError(errorMessage)
        console.error('Erreur réseau ou serveur:', error);
        toast.error(errorMessage);
      }
    },
    [router]
  );


  const handleFacturer = useCallback(
    async (slug) => {
      try {
        // Appel à l'API backend pour rejeter la déclaration
        const response = await axios.post(API.facturerDeclaration(slug));
        if (response) {
          // Si succès, rediriger ou mettre à jour l'interface utilisateur
          toast.success('Déclaration facturée avec succès !');
          // Mise à jour locale du statut dans tableData
          setTableData((prevData) =>
            prevData.map((item) =>
              item.slug === slug ? { ...item, status: 'BILLED' } : item
            )
          );
          router.push(paths.dashboard.factures.list);
        } else {
          console.error('Erreur lors de la facturation:', response.data.error);
          toast.error('Une erreur est survenue.');
        }
      } catch (error) {
        const errorMessage = error?.error || error?.details || error?.message || error?.detail;
        setError(errorMessage)
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
          reject_reason: motifRejet
        });
        if (response) {
          toast.success('Déclaration rejetée avec succès !');
          setTableData((prevData) =>
            prevData.map((item) =>
              item.slug === slug ? { ...item, status: 'REJECTED' } : item
            )
          );
          router.push(paths.dashboard.declaration.list);
        } else {
          console.error('Erreur lors du rejet :', response.data.error);
          toast.error('Une erreur est survenue.');
        }
      } catch (error) {
        const errorMessage = error?.error || error?.details || error?.message || error?.detail;
        setError(errorMessage)
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

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );


  useEffect(() => {
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

            : {}
        ),

        ...(filters.state.status !== 'all' ? { status: filters.state.status } : {}),
         ...(filters.state.starts_at && filters.state.ends_at && !dateError
                              ? {
                                starts_at: dayjs(filters.state.dstarts_at).format('YYYY-MM-DD '),
                                ends_at: dayjs(filters.state.ends_at).format('YYYY-MM-DD ')
                              }
                              : {}
                            ),
      };

      const response = await axios.get(API.listDeclarations(), { params });
      setTableData(response.data.results);
      setCount(response.data.count);
      setPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,

      });
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des données.');
      const errormessage = err?.message || err?.details || err?.error;
      toast.error(errormessage);
    } finally {
      setLoading(false);
    }
  };

  // Requête lancée à chaque changement de page, du nombre de lignes ou des filtres
 
    fetchDeclarations();

  }, [table.page, table.rowsPerPage, filters.state.company, filters.state.title, filters.state.status, filters.state.starts_at, filters.state.ends_at]);


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
            type_user !== 'admin' && ( //  Cache le bouton si type_user est "admin"
              <>
                <Button
                  component={RouterLink}
                  href={paths.dashboard.declaration.new}
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                >
                  Ajouter
                </Button>

              </>
            )
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />


        <Grid container spacing={3} sx={{ mb: { xs: 3, md: 5 } }} >
          <Grid size={{ xs: 6, md: 3 }}>
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
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <DeclarationSummary
              title="Validées"
              total={getDeclarationLength('VALIDATED')}
              percent={getPercentByStatus('VALIDATED')}
              chart={{
                // colors: [theme.vars.palette.success.main],
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [15, 18, 12, 51, 68, 11, 39, 37],
              }}
            />
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <DeclarationSummary
              title="Brouillon"
              total={getDeclarationLength('UNSUBMITTED')}
              percent={getPercentByStatus('UNSUBMITTED')}
              chart={{
                colors: [theme.vars.palette.warning.main],
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [18, 19, 31, 8, 16, 37, 12, 33],
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <DeclarationSummary
              title="Rejetées"
              total={getDeclarationLength('REJECTED')}
              percent={getPercentByStatus('REJECTED')}
              chart={{
                colors: [theme.vars.palette.error.main],
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [18, 19, 31, 8, 16, 37, 12, 33],
              }}
            />
          </Grid>
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
                  <Tooltip title="Facturer">
                    <IconButton color="primary">
                      <Iconify icon="iconamoon:send-fill" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Telecharger">
                    <IconButton color="primary">
                      <Iconify icon="eva:download-outline" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Imprimer">
                    <IconButton color="primary">
                      <Iconify icon="solar:printer-minimalistic-bold" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Supprimer">
                    <IconButton color="primary" onClick={confirm.onTrue}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
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

                <TableBody>

                  {tableData
                    .map((row) => (
                      <DeclarationTableRow
                        user={user}
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
                      />
                    ))}

                  {tableData.length > 0 &&
                    tableData.length < table.rowsPerPage && (
                      <TableEmptyRows
                        height={table.dense ? 56 : 76}
                        emptyRows={table.rowsPerPage - tableData.length}
                      />
                    )}


                  <TableNoData notFound={notFound} />

                </TableBody>
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
    </>
  );
}

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { name, status, fonction, startDate, endDate } = filters;

  // Tri des données
  const stabilizedThis = inputData?.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  inputData = stabilizedThis?.map((el) => el[0]);

  // Filtrage par numéro de déclaration ou type de déclaration
  // Filtrage par numéro de déclaration ou par type via le mot-clé
  if (name) {
    inputData = inputData?.filter((declaration) =>
      declaration?.reference?.toLowerCase().includes(name.toLowerCase()) ||
      declaration?.title?.toLowerCase().includes(name.toLowerCase())
    );
  }

  // Filtrage par statut
  if (status !== 'all') {
    inputData = inputData?.filter((declaration) => declaration?.status === status);
  }

  // Filtrage par fonction (en s'assurant que declaration.items existe)
  if (fonction?.length) {
    inputData = inputData?.filter((declaration) =>
      (declaration?.employees || []).some((filterItem) => fonction?.includes(filterItem?.fonction))
    );
  }

  // Filtrage par date
  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData?.filter((declaration) =>
        fIsBetween(declaration?.createDate, startDate, endDate)
      );
    }
  }

  return inputData;
}
