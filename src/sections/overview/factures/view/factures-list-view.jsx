'use client';

import { Grid2 } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import axios from 'src/utils/axios';
import { CircularProgress } from '@mui/material';
import { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
import { DashboardContent } from 'src/layouts/dashboard';
import { varAlpha } from 'src/theme/styles';
import Autocomplete from '@mui/material/Autocomplete';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import Typography from '@mui/material/Typography';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';
import TextField from '@mui/material/TextField';
import API from 'src/utils/api';
import { fIsBetween } from 'src/utils/format-time';
import { sumBy } from 'src/utils/helper';
import { PDFDocument } from 'pdf-lib';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Iconify } from 'src/components/iconify';
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
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { FactureAnalytic } from '../factures-analytics';
import { FactureTableFilters } from '../factures-table-filters';
import { FactureTableRow } from '../factures-table-row';
import { FactureTableToolbar } from '../factures-table-toolbar';
import { PayeurForm } from '../form-factures';
import { generateFactureDocument } from '../facture-pdf-service';

import { usePermissions } from 'src/auth/hooks';

import dayjs from 'src/utils/format-time'; // Ensure this imports the correct dayjs instance

import { label } from 'yet-another-react-lightbox';

dayjs.locale('fr'); // Set the default locale to French
// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'facture', label: 'Numero Facture' },
  { id: 'numero', label: 'Déclaration' },
  { id: 'company', label: 'Entreprise' },
  { id: 'price', label: 'Montant' },
  // {id: 'payment' , label: 'Paiement'},
  { id: 'createDate', label: 'Date ' },
  { id: 'statut', label: 'Statut' },

  { id: '' },
];

// ----------------------------------------------------------------------

/**
 * @typedef {{ totalCount: number; countByStatus: Record<string, number> }} Summary
 */

// ----------------------------------------------------------------------

export function FactureListView() {
  const theme = useTheme();

  const { can } = usePermissions();

  const router = useRouter();

  const table = useTable({ defaultOrderBy: 'created_on' });

  const confirm = useBoolean();
  const confirmDownload = useBoolean();
  const downloadZip = useBoolean();
  const downloadMultiplePDF = useBoolean();
  const payeurForm = useBoolean();

  const [totalCount, setTotalCount] = useState();
  const [paidCount, setPaidCount] = useState();
  const [unpaidCount, setUnpaidCount] = useState();
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadPDF, setIsLoadPDF] = useState(false);
  const [isLoadZip, setIsLoadZip] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true); // État pour indiquer le chargement
  const [loader, setLaoder] = useState(false); // Etat pour indiquer le chargement des données sur les cards
  const [error, setError] = useState(null); // État pour gérer les erreurs
  const [selectedBanque, setSelectedBanque] = useState(null); // Etat pour la banque sélectionnée
  const [openFirstDialog, setOpenFirstDialog] = useState(false);
  const [openSecondDialog, setOpenSecondDialog] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('number');
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const fetchRequestIdRef = useRef(0);

  /** @type {[Summary, Function]} */
  const [summary, setSummary] = useState({ totalCount: 0, countByStatus: {} });
  // …

  const filters = useSetState(
    {
      number: '',
      declaration_number: '',
      company: '',
      service: [],
      status: 'all',
      date_before: null,
      date_after: null,
    },
    { persistByPath: true }
  );

  const dateError = fIsBetween(filters.state.date_before, filters.state.date_after);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
    dateError,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.number ||
    !!filters.state.company ||
    !!filters.state.declaration_number ||
    !!filters.state.company ||
    filters.state.service.length > 0 ||
    filters.state.status !== 'all' ||
    (!!filters.state.date_before && !!filters.state.date_after);

  const notFound = pagination.count === 0 && canReset;

  useEffect(() => {
    const fetchStats = async () => {
      setLaoder(true);
      try {
        const { data } = await axios.get(API.statsFactures());
        setTotalCount(data?.total_factures);
        setPaidCount(data?.paid);
        setUnpaidCount(data?.unpaid);
      } catch (err) {
        toast.error('Erreur lors des chargements des stats', err);
      } finally {
        setLaoder(false);
      }
    };
    fetchStats();
  }, []);

  const getPercentByStatus = (number) => {
    if (!totalCount || totalCount === 0) return 0;
    return (number / totalCount) * 100;
  };

  const TABS = [
    {
      value: 'all',
      label: 'Toutes',
      color: 'white',
      count: totalCount,
    },
    {
      value: 'paid',
      label: 'Payées',
      color: 'success',
      count: paidCount,
    },
    {
      value: 'unpaid',
      label: 'En attente',
      color: 'warning',
      count: unpaidCount,
    },
  ];

  const handleDeleteRow = useCallback(
    (slug) => {
      const deleteRow = tableData.filter((row) => row.slug !== slug);

      toast.success('Suppression reussie!');

      setTableData(deleteRow);

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.slug));

    toast.success('Suppression reussie!');

    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleViewRow = useCallback(
    (slug) => {
      router.push(paths.dashboard.factures.details(slug));
    },
    [router]
  );

  const handleViewPayment = useCallback(
    (slug) => {
      router.push(paths.dashboard.paiements.details(slug));
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

  useEffect(() => {}, [selectedBanque]);

  const handlePaidRow = useCallback(
    async (slug) => {
      // if (!selectedBanque) {
      //   toast.error("Veuillez sélectionner une banque avant de valider le paiement.");
      //   return;
      // }

      try {
        // Appel à l'API backend pour valider la déclaration
        const response = await axios.post(API.paidFacture(slug));

        if (response.data.success) {
          toast.success('Facture payée avec succès !');
          router.push(paths.dashboard.factures.list);
        } else {
          console.error('Erreur lors du paiement:', response.data.error);
          toast.error('Une erreur est survenue.');
        }
      } catch (error) {
        console.error('Erreur réseau ou serveur:', error);
        alert('Erreur lors de la communication avec le serveur.');
      }
    },
    [router] // S'assurer de la dépendance à selectedBanque
  );

  const handleChangeBanque = (event, newValue) => {
    setSelectedBanque(newValue);
  };

  useEffect(() => {
    if (!filters.isHydrated) return;

    const requestId = fetchRequestIdRef.current + 1;
    fetchRequestIdRef.current = requestId;

    // Fonction pour récupérer les données
    const fetchFactures = async () => {
      setLoading(true);
      try {
        const offset = table.page * table.rowsPerPage;
        const params = {
          limit: table.rowsPerPage,
          offset: offset,
          ...(filters.state.status !== 'all' ? { status: filters.state.status } : {}),
          ...(filters.state.number ? { number: filters.state.number } : {}),
          ...(filters.state.company ? { company: filters.state.company } : {}),
          ...(filters.state.declaration_number
            ? { declaration_number: filters.state.declaration_number }
            : {}),

          ...(filters.state.date_before && filters.state.date_after && !dateError
            ? {
                date_before: dayjs(filters.state.date_before).format('YYYY-MM-DD'),
                date_after: dayjs(filters.state.date_after).format('YYYY-MM-DD'),
              }
            : {}),
        };

        const response = await axios.get(API.listFactures(), { params });

        if (requestId !== fetchRequestIdRef.current) return;

        setTableData(response.data.results);
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        });
      } catch (err) {
        if (requestId !== fetchRequestIdRef.current) return;
        setError(err.message || 'Erreur lors du chargement des données.');
      } finally {
        if (requestId !== fetchRequestIdRef.current) return;
        setLoading(false);
      }
    };

    fetchFactures();
  }, [
    filters.isHydrated,
    table.page,
    table.rowsPerPage,
    filters.state.status,
    filters.state.company,
    filters.state.date_before,
    filters.state.date_after,
    filters.state.number,
    filters.state.declaration_number,
  ]); // La dépendance vide signifie que cette fonction est appelée une fois au montage

  const fetchFactures = async (slugs) => {
    const responses = await Promise.all(slugs.map((slug) => axios.get(API.detailsFacture(slug))));
    return responses.map((res) => res.data);
  };

  const handleDownload = async () => {
    if (!table.selected || table.selected.length === 0) {
      toast.warn('Aucune facture sélectionnée.');
      return;
    }

    setIsLoadPDF(true); // Début du chargement

    try {
      const slugs = table.selected;
      const factures = await fetchFactures(slugs);

      for (const facture of factures) {
        await generateFactureDocument(facture, facture.devise, { download: true });
      }

      table.onSelectAllRows(false, []);
      toast.success('Téléchargement réussi !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du téléchargement !');
    } finally {
      setIsLoadPDF(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!table.selected || table.selected.length === 0) {
      toast.warn('Aucune facture sélectionnée.');
      return;
    }

    setIsLoadZip(true);

    try {
      const slugs = table.selected;
      const factures = await fetchFactures(slugs);

      const zip = new JSZip();

      for (const facture of factures) {
        const blob = await generateFactureDocument(facture, facture.devise, {
          download: false, // Ne pas télécharger individuellement
        });

        const filename = `facture-${facture.number}.pdf`;
        zip.file(filename, blob);
      }

      // Générer le fichier ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'factures.zip');
      toast.success('Téléchargement ZIP terminé !');
      table.onSelectAllRows(false, []);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du téléchargement ZIP.');
    } finally {
      setIsLoadZip(false);
    }
  };

  const handleDownloadMultiplePDF = async () => {
    if (!table.selected || table.selected.length === 0) {
      toast.warn('Aucune facture sélectionnée.');
      return;
    }

    setIsLoading(true);

    try {
      const slugs = table.selected;
      const factures = await fetchFactures(slugs);

      // 1. Nouveau document final
      const mergedPdf = await PDFDocument.create();

      for (const facture of factures) {
        // 2. Génération du PDF de cette facture (sous forme de bytes)
        const singlePdfBytes = await generateFactureDocument(facture, facture.devise, {
          download: false,
        });

        // 3. Charger le PDF source
        const singlePdfDoc = await PDFDocument.load(singlePdfBytes);

        // 4. Copier toutes les pages dans le document final
        const copiedPages = await mergedPdf.copyPages(singlePdfDoc, singlePdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      // 5. Sauvegarde et téléchargement
      const mergedPdfBytes = await mergedPdf.save();
      saveAs(new Blob([mergedPdfBytes], { type: 'application/pdf' }), 'factures_ensemble.pdf');
      toast.success('Téléchargement PDF groupé terminé !');
      table.onSelectAllRows(false, []);
    } catch (error) {
      console.error('Erreur fusion PDF :', error);
      toast.error('Erreur lors de la génération du PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = useCallback(() => {
    const selectedSlugs = table.selected;
    // Mettre à jour l'état des factures sélectionnées
    const updatedData = tableData.map((row) => {
      if (selectedSlugs.includes(row.slug)) {
        return { ...row, status: 'paid' }; // Mettre à jour le statut à 'paid'
      }
    });
    setTableData(updatedData);
  }, []);

  if (isLoading) {
    toast.info('Téléchargement en cours, veuillez patienter...');
  }

  if (loading) {
    console.info('Loading factures...');
  }

  if (error) {
    console.error(`Error: ${error}`);
  }

  return (
    <>
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="Listes des Factures"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Factures', href: paths.dashboard.factures.root },
            { name: 'Listes des factures' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {/* <Stack spacing={4}> */}
        <Grid2 container spacing={3} sx={{ mb: { xs: 3, md: 5 } }} lg={12}>
          <Grid2 size={{ xs: 6, md: 4 }}>
            <FactureAnalytic
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
          </Grid2>
          <Grid2 size={{ xs: 6, md: 4 }}>
            <FactureAnalytic
              title="Payées"
              percent={getPercentByStatus(paidCount)}
              total={paidCount}
              loading={loader}
              chart={{
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [15, 18, 12, 51, 68, 11, 39, 37],
              }}
            />
          </Grid2>
          <Grid2 size={{ xs: 6, md: 4 }}>
            <FactureAnalytic
              title="En attente"
              percent={getPercentByStatus(unpaidCount)}
              total={unpaidCount}
              loading={loader}
              chart={{
                colors: [theme.vars.palette.error.main],
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [18, 19, 31, 8, 16, 37, 12, 33],
              }}
            />
          </Grid2>
        </Grid2>
        {/* </Stack> */}

        <Card sx={{ mb: { xs: 3, md: 5 } }} lg={12}>
          <Tabs
            value={filters?.state?.status || []}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }}
          >
            {TABS.map((tab) => (
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

          <FactureTableToolbar
            filters={filters}
            dateError={dateError}
            onResetPage={table.onResetPage}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            options={{ services: tableData.map((option) => option.name) }}
          />

          {canReset && (
            <FactureTableFilters
              filters={filters}
              onResetPage={table.onResetPage}
              totalResults={pagination.count}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }} lg={12}>
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
                  <Tooltip title="Télécharger toutes les factures (PDF unique)">
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

                  <Tooltip title="Telecharger en pdf">
                    <IconButton
                      color="primary"
                      onClick={confirmDownload.onTrue}
                      disabled={isLoadPDF}
                    >
                      {isLoadPDF ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Iconify icon="eva:download-outline" />
                      )}
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Télécharger en ZIP">
                    <IconButton color="primary" onClick={downloadZip.onTrue} disabled={isLoadZip}>
                      {isLoadZip ? <CircularProgress size={24} /> : <Iconify icon="mdi:zip-box" />}
                    </IconButton>
                  </Tooltip>

                  {can('can_mark_facture_paid') && (
                    <Tooltip title="Payer">
                      <IconButton
                        color="primary"
                        onClick={() => {
                          confirm.onTrue();
                          // Ouvre la première boîte de dialogue
                        }}
                      >
                        <Iconify icon="mdi:credit-card" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              }
            />

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
                      <FactureTableRow
                        key={row.slug}
                        row={row}
                        selected={table.selected.includes(row.slug)}
                        onSelectRow={() => table.onSelectRow(row.slug)}
                        onViewRow={() => handleViewRow(row.slug)}
                        // onEditRow={() => handleEditRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.slug)}
                        onPaidRow={() => handlePaidRow(row.slug)}
                        Options={options}
                        setOptions={setOptions}
                        selectedBanque={selectedBanque}
                        setSelectedBanque={setSelectedBanque}
                        onViewPayment={() => handleViewPayment(row.payment_slug)}
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
        open={confirmDownload.value}
        onClose={confirmDownload.onFalse}
        title="Télécharger"
        content={
          <>
            Etes vous sûr de vouloir Télécharger <strong> {table.selected.length} </strong>{' '}
            factures?
          </>
        }
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              handleDownload(); // Action pour "Télécharger"
              confirmDownload.onFalse();
            }}
          >
            Telecharger
          </Button>
        }
      />
      <ConfirmDialog
        open={downloadMultiplePDF.value}
        onClose={downloadMultiplePDF.onFalse}
        title="Télécharger"
        content={
          <>
            Etes vous sûr de vouloir télécharger <strong> {table.selected.length} </strong> factures
            dans un seul fichier?
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
        open={downloadZip.value}
        onClose={downloadZip.onFalse}
        title="Télécharger en ZIP"
        content={
          <>
            Etes vous sûr de vouloir télécharger en ZIP <strong> {table.selected.length} </strong>{' '}
            factures?
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
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Payer"
        content={
          <>
            Etes vous sûr de vouloir payer <strong> {table.selected.length} </strong> factures?
          </>
        }
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              payeurForm.onTrue(); // Ouvre la première boîte de dialogue
              confirm.onFalse();
            }}
          >
            Suivant
          </Button>
        }
      />
      <ConfirmDialog
        fullWidth
        open={openFirstDialog}
        onClose={() => setOpenFirstDialog(false)} // Ferme la première boîte de dialogue
        title="Payer"
        content={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography sx={{ mb: 2 }}>
              Sélectionnez la banque avec laquelle vous voulez payer cette facture
            </Typography>
            <Autocomplete
              options={options}
              getOptionLabel={(option) => option.label}
              loading={loading}
              value={selectedBanque}
              onChange={handleChangeBanque}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Rechercher ou sélectionner une banque"
                  placeholder="Taper pour rechercher"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
              sx={{ width: '100%' }}
            />
          </Box>
        }
        action={
          <Button
            variant="contained"
            color="success"
            disabled={!selectedBanque}
            onClick={() => {
              setOpenFirstDialog(false); // Ferme la première boîte de dialogue
              setOpenSecondDialog(true); // Ouvre la deuxième boîte de dialogue
            }}
          >
            Suivant
          </Button>
        }
      />
      <PayeurForm
        slug={table.selected.filter((s) => {
          const selectedRow = tableData.find((row) => row.slug === s);
          return selectedRow && selectedRow.status === 'unpaid' && !selectedRow.has_payment;
        })}
        open={payeurForm.value}
        onclose={payeurForm.onFalse}
        onSuccess={() => {
          handleUpdateStatus();
          payeurForm.onFalse();
        }}
      />
    </>
  );
}

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { name, status, service, date_before, date_after } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (facture) =>
        facture.numero.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        facture.declaration_ref.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((facture) => facture.status === status);
  }

  if (service.length) {
    inputData = inputData.filter((invoice) =>
      invoice.items.some((filterItem) => service.includes(filterItem.service))
    );
  }

  if (!dateError) {
    if (date_before && date_after) {
      inputData = inputData.filter((facture) =>
        fIsBetween(facture.created_at, date_before, date_after)
      );
    }
  }

  return inputData;
}
