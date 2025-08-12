'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';

import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import Tabs from '@mui/material/Tabs';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import axios from 'src/utils/axios';
import { useState, useEffect, useCallback } from 'react';
import { DashboardContent } from 'src/layouts/dashboard';
import { varAlpha } from 'src/theme/styles';

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

  TablePaginationCustom,
} from 'src/components/table';

import { UserTableFiltersResult } from '../user-table-filters-result';
import { UserTableRow } from '../user-table-row';
import { UserTableToolbar } from '../user-table-toolbar';
import { CircularProgress } from '@mui/material'

import { getUserTypes } from 'src/utils/options';
import { useMockedUser } from 'src/auth/hooks';
// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous' },
  // { value: 'is_active', label: 'Actif' },
  // { value: 'is_active', label: 'Inactif' },
];

const TABLE_HEAD = [
  { id: 'name', label: 'Nom Complet' },
  { id: 'phoneNumber', label: 'Numéro de téléphone', width: 180 },
  { id: 'company', label: 'Company', width: 220 },
  { id: 'role', label: 'Role', width: 180 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 88 },
];


// ----------------------------------------------------------------------

export function UserListView() {
  const table = useTable();

  const router = useRouter();

  const confirm = useBoolean();

 const { user } = useMockedUser();

  const company = user?.companies[0]?.type_code?.toLowerCase().trim();

  const [tableData, setTableData] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true); // État pour indiquer le chargement
  const [error, setError] = useState(null); // État pour gérer les erreurs

  const filters = useSetState({ name: '', type: '', status: 'all' });

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,

  });

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.name || filters.state.type || filters.state.status !== 'all';

  const notFound = pagination.count === 0 && canReset;

  const handleDeleteRow = useCallback(
    (slug) => {
      try {
        const response = axios.delete(API.userDelete(slug));

        if (response.data.success) {
          const updatedTableData = tableData.filter((row) => row.slug !== slug);
          setTableData(updatedTableData)

          toast.success('Suppression réussie !')

          table.onUpdatePageDeleteRow(dataInPage.length)
        } else {
          console.error('Erreur lors de la suppression ',)
          toast.error('Une erreur est survenue.');
        }
      } catch (error) {
        console.error('Erreur réseau ou serveur :', error)
        const errorMessage =
          error.error || error.details || error.message;
        toast.error(`Erreur : ${errorMessage}`);
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

  const handleEditRow = useCallback(
    (slug) => {
      router.push(paths.dashboard.user.edit(slug));
    },
    [router]
  );

  const handleViewRow = useCallback(
    (slug) => {
      router.push(paths.dashboard.user.details(slug));
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

  const handleUpdateRow = useCallback((updateUser) => {
    setTableData((prevData) =>
      prevData.map((row) => (row.slug === updateUser.slug ? updateUser : row))
    );
  }, []);


  // Fonction pour récupérer les données
  const fetchUtilisateurs = async () => {
    setLoading(true);
    try {
      const offset = table.page * table.rowsPerPage;
      const url = API.listUsers()
      const params = {
        limit: table.rowsPerPage,
        offset: offset,
        ...(filters.state.name && { name: filters.state.name }),
        ...(filters.state.type && { type: filters.state.type }),
      };
      const response = await axios.get(url, { params });
      setTableData(response.data.results);
      // setRoles([
      //   ...new Set(response.data.results.map((role) => role.type.trim()))
      // ]);

      setPagination((prev) => ({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,

      }));
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchUtilisateurs();
  }, [table.page, table.rowsPerPage , filters.state.name, filters.state.type]);

  if (loading) {
    console.info('Loading utilisateurs...');
  }

  if (error) {
    console.error(`Error: ${error}`);
  }

useEffect(() => {
  getUserTypes().then(data => setRoles(data));
})


  return (
    <>
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="Listes des utilisateurs"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Utilisateurs', href: paths.dashboard.user.list },
            { name: 'Listes des utilisateurs' },
          ]}
          
          action={
           company === 'tdss' && (
            <Button
              component={RouterLink}
              href={paths.dashboard.user.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Nouvel Utilisateur
            </Button>
          )
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
                      (tab.value === true && 'success') ||
                      (tab.value === false && 'warning') ||

                      'main'
                    }
                  >
                    {['actif', 'inactif'].includes(tab.value)
                      ? tableData.filter((user) => user.status === tab.value).length
                      : pagination.count}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <UserTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ roles: roles }}
          />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              totalResults={pagination.count}
              onResetPage={table.onResetPage}
              options={{ roles: roles }}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            {/* <TableSelectedAction
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
            /> */}

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
              { loading ? (
                <TableBody>
                 <TableRow>
                <TableCell colSpan={100}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
                </TableBody>
              ) : (
             
                <TableBody>
                  {tableData

                    .map((row) => (
                      <UserTableRow
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
      </DashboardContent >

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

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (user) => user.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((user) => user.status === status);
  }

  if (type.length) {
    inputData = inputData.filter((user) => type.includes(user.type));
  }

  return inputData;
}