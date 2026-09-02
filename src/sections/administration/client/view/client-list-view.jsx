'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import axios from 'src/utils/axios';
import { useState, useEffect, useCallback } from 'react';
import { DashboardContent } from 'src/layouts/dashboard';
import { varAlpha } from 'src/theme/styles';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';

import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import API from 'src/utils/api';

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

import { ClientTableFiltersResult } from '../client-table-filters-result';
import { ClientTableRow } from '../client-table-row';
import { ClientTableToolbar } from '../client-table-toolbar';

import { getRegions , getProfileTypes} from 'src/utils/options';
// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
    { value: 'all', label: 'Tous' },
    // { value: 'ON', label: 'Actif' },

    // { value: 'inactif', label: 'Inactif' },
];

const TABLE_HEAD = [
    { id: 'name', label: 'Nom ' },
    { id: 'role', label: 'Type' },
    { id: 'phoneNumber', label: 'Numéro de téléphone' },
    { id: 'region', label: 'Région' },

    { id: 'status', label: 'Status' },
    { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function ClientListView() {
    const table = useTable();

    const router = useRouter();

    const confirm = useBoolean();

    const [regions, setRegions] = useState([]);
    const [profileTypes, setProfileTypes] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(true); // État pour indiquer le chargement
    const [error, setError] = useState(null); // État pour gérer les erreurs

    const [pagination, setPagination] = useState({
        count: 0,
        next: null,
        previous: null,
    });

    const filters = useSetState({ name: '', type: [], location:'', status: 'all' }, { persistByPath: true });

    const dataFiltered = applyFilter({
        inputData: tableData,
        comparator: getComparator(table.order, table.orderBy),
        filters: filters.state,
    });

    const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

    const canReset =
        !!filters.state.name || 
        !!filters.state.location ||
        filters.state.type.length > 0 || 
        filters.state.status !== 'all';

    const notFound = pagination.count === 0 && canReset;


    const handleDeleteRow = useCallback(
        async (slug) => {
            try {
                // Appel à l'API backend pour supprimer l'élément
                const response = await axios.delete(API.UpdateProfile(slug));

                if (response) {
                    // Mise à jour des données côté frontend après suppression réussie
                    const updatedTableData = tableData.filter((row) => row.slug !== slug);
                    setTableData(updatedTableData);

                    toast.success('Suppression réussie !');

                    // Mise à jour de la pagination ou des données affichées
                    table.onUpdatePageDeleteRow(dataInPage.length);
                } else {
                    console.error("Erreur lors de la suppression :", response.data.error);
                    toast.error('Une erreur est survenue.');
                }
            } catch (error) {
                console.error('Erreur réseau ou serveur :', error);
                toast.error('Erreur lors de la communication avec le serveur.');
            }
        },
        [dataInPage.length, table, tableData]
    );


    const handleDeleteRows = useCallback(() => {
        const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

        toast.success('Suppression reussie!');

        setTableData(deleteRows);

        table.onUpdatePageDeleteRows({
            totalRowsInPage: dataInPage.length,
            totalRowsFiltered: dataFiltered.length,
        });
    }, [dataFiltered.length, dataInPage.length, table, tableData]);


    const handleUpdateRow = useCallback((updatedClient) => {
        setTableData((prevData) =>
            prevData.map((row) =>
                row.slug === updatedClient.slug ? updatedClient : row
            )
        );
    }, []);



    const handleViewRow = useCallback(
        (slug) => {
            router.push(paths.dashboard.client.details(slug));
        },
        [router]
    );

    const handleEditRow = useCallback(
        (slug) => {
            router.push(paths.dashboard.client.edit(slug));
        }, [router]
    );

    const handleFilterStatus = useCallback(
        (event, newValue) => {
            table.onResetPage();
            filters.setState({ status: newValue });
        },
        [filters, table]
    );


    useEffect(() => {
        // Fonction pour récupérer les données
        const fetchClient = async () => {
            setLoading(true); // Indique que le chargement commence
            try {
                const offset = table.page * table.rowsPerPage;
                const params = {
                    limit: table.rowsPerPage,
                    offset: offset,
                    ...(filters.state.name && { name: filters.state.name }),
                    ...(filters.state.type.length && { type: filters.state.type.join(',') }),
                    ...(filters.state.location && { location: filters.state.location }),
                    ...(filters.state.status !== 'all' && { status: filters.state.status }),
                }
                const response = await axios.get(API.listProfiles(), { params });
                setTableData(response.data.results); // Assurez-vous que votre API renvoie un tableau
                setPagination({
                    count: response.data.count,
                    next: response.data.next,
                    previous: response.data.previous,
                })
            } catch (err) {
                setError(err.message || 'Erreur lors du chargement des données.');
            } finally {
                setLoading(false);
            }
        };

        fetchClient();
    }, [table.page, table.rowsPerPage, filters.state.name, filters.state.type, filters.state.location, filters.state.status]); // La dépendance vide signifie que cette fonction est appelée une fois au montage

useEffect(() => {
    getRegions().then((data) => setRegions(data));
    getProfileTypes().then((data) => setProfileTypes(data));
}, [])

    if (loading) {
        console.info('Loading ...');
    }

    if (error) {
        console.error(`Error: ${error}`);
    }
    return (
        <>
            <DashboardContent maxWidth="xl">
                <CustomBreadcrumbs
                    heading="Listes des structures"
                    links={[
                        { name: 'Dashboard', href: paths.dashboard.root },
                        { name: 'Structures', href: paths.dashboard.client.root },
                        { name: 'Listes des Structures' },
                    ]}
                    action={
                        <Button
                            component={RouterLink}
                            href={paths.dashboard.client.new}
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                        >
                            Nouvelle
                        </Button>
                    }
                    sx={{ mb: { xs: 3, md: 5 } }}
                />

                <Card>
                    <Tabs
                        value={filters.state.status}
                        onChange={handleFilterStatus}
                        sx={{
                            px: 2.5,
                            boxShadow: (theme) =>
                                `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
                        }}
                    >
                        {STATUS_OPTIONS.map((tab) => (
                            <Tab
                                key={tab.value}
                                iconPosition="end"
                                value={tab.value}
                                label={tab.label}
                                icon={
                                    <Label
                                        variant={
                                            ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                                            'soft'
                                        }
                                        color={
                                            (tab.value === 'ON' && 'success') ||
                                            (tab.value === 'pending' && 'warning') ||
                                            (tab.value === 'banned' && 'error') ||
                                            'main'
                                        }
                                    >
                                        {['ON', 'inactif'].includes(tab.value)
                                            ? tableData.filter((client) => client.status === tab.value).length
                                            : pagination.count}
                                    </Label>
                                }
                            />
                        ))}
                    </Tabs>

                    <ClientTableToolbar
                        filters={filters}
                        onResetPage={table.onResetPage}
                        options={{ roles: profileTypes , regions: regions}}

                    />

                    {canReset && (
                        <ClientTableFiltersResult
                            filters={filters}
                            totalResults={pagination.count}
                            onResetPage={table.onResetPage}
                            sx={{ p: 2.5, pt: 0 }}
                        />
                    )}

                    <Box sx={{ position: 'relative' }}>
                        <TableSelectedAction
                            dense={table.dense}
                            numSelected={table.selected.length}
                            rowCount={pagination.count}
                            onSelectAllRows={(checked) =>
                                table.onSelectAllRows(
                                    checked,
                                    tableData.map((row) => row.slug)
                                )
                            }
                            action={
                                <Tooltip title="Supprimer">
                                    <IconButton color="primary" onClick={confirm.onTrue}>
                                        <Iconify icon="solar:trash-bin-trash-bold" />
                                    </IconButton>
                                </Tooltip>
                            }
                        />

                        <Scrollbar>
                            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
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
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                                    <CircularProgress />
                                    </Box>
                                </TableCell>
                                </TableRow>
                            </TableBody>
                                ):
                                (
                            

                                <TableBody>
                                    {tableData

                                        .map((row) => (
                                            <ClientTableRow
                                                key={row.slug}
                                                row={row}
                                                selected={table.selected.includes(row.slug)}
                                                onSelectRow={() => table.onSelectRow(row.slug)}
                                                onDeleteRow={() => handleDeleteRow(row.slug)}
                                                onEditRow={() => handleEditRow(row.slug)}
                                                onViewRow={() => handleViewRow(row.slug)}
                                                onUpdateRow={handleUpdateRow}
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
                                )
                                }
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
                        Etes vous sûr de vouloir supprimer <strong> {table.selected.length} </strong> items?
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

function applyFilter({ inputData, comparator, filters }) {
    const { name, status, type } = filters;

    const stabilizedThis = inputData?.map((el, index) => [el, index]);

    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });

    inputData = stabilizedThis.map((el) => el[0]);

    if (name) {
        inputData = inputData?.filter(
            (client) => client?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
        );
    }

    if (status !== 'all') {
        inputData = inputData?.filter((client) => client?.status === status);
    }

    if (type.length) {
        inputData = inputData?.filter((client) => type?.includes(client.type));
    }

    return inputData;
}
