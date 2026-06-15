'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import Tabs from '@mui/material/Tabs';

import { useCallback, useEffect, useRef, useState } from 'react';

import axios from 'src/utils/axios';
import API from 'src/utils/api';

import { DashboardContent } from 'src/layouts/dashboard';
import { varAlpha } from 'src/theme/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';
import { usePermissions } from 'src/auth/hooks';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { Iconify } from 'src/components/iconify';

import {
  useTable,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { EmployeeTableFiltersResult } from '../employee-filter-results';
import { EmployeeTableRow } from '../employee-table-row';
import { EmployeeTableToolbar } from '../employee-table-toolbar';
import { EmployeeCreateDialog } from '../employee-create-dialog';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'Tous' }];

const TABLE_HEAD = [
  // { id: 'reference', label: 'Reference ' },
  { id: 'numero', label: 'N° Passeport' },
  { id: 'name', label: 'Nom Complet' },
  { id: 'email', label: 'Email' },
  { id: 'phoneNumber', label: 'Telephone' },
  { id: 'declaration', label: 'Declaration.s' },
  { id: 'job', label: 'Fonction' },
  { id: 'status', label: 'Statut' },
];

// ----------------------------------------------------------------------

export function EmployeeListView() {
  const table = useTable();
  const router = useRouter();

  const confirm = useBoolean();
  const createDialog = useBoolean();

  const { can } = usePermissions();

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('name');
  const [refreshKey, setRefreshKey] = useState(0);
  const fetchRequestIdRef = useRef(0);

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const filters = useSetState(
    {
      name: '',
      job: [],
      status: 'all',
      passport_number: '',
      reference: '',
    },
    { persistByPath: true }
  );

  const canReset =
    !!filters.state.name ||
    filters.state.job.length > 0 ||
    filters.state.status !== 'all' ||
    !!filters.state.passport_number ||
    !!filters.state.reference;

  const notFound = pagination.count === 0 && canReset;

  const handleViewRow = useCallback(
    (slug) => {
      router.push(paths.dashboard.employee.details(slug));
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

  const fetchEmployees = useCallback(
    async (requestId) => {
      setLoading(true);
      setError(null);

      try {
        const offset = table.page * table.rowsPerPage;
        const params = {
          limit: table.rowsPerPage,
          offset,
          ...(filters.state.passport_number
            ? { passport_number: filters.state.passport_number }
            : filters.state.reference
              ? { reference: filters.state.reference }
              : filters.state.name
                ? { name: filters.state.name }
                : {}),
          ...(filters.state.status !== 'all' ? { status: filters.state.status } : {}),
          ...(filters.state.job?.length > 0 && {
            job:
              typeof filters.state.job[0] === 'object'
                ? filters.state.job[0].name
                : filters.state.job[0],
          }),
        };

        const response = await axios.get(API.listEmployee(), { params });

        if (requestId !== fetchRequestIdRef.current) return;

        setTableData(response.data.results || []);
        setPagination({
          count: response.data.count || 0,
          next: response.data.next,
          previous: response.data.previous,
        });
      } catch (err) {
        if (requestId !== fetchRequestIdRef.current) return;

        setError(err.message || 'Erreur lors du chargement des donnees.');
        console.error('Erreur lors du chargement des employes:', err);
      } finally {
        if (requestId !== fetchRequestIdRef.current) return;
        setLoading(false);
      }
    },
    [
      table.page,
      table.rowsPerPage,
      filters.state.name,
      filters.state.job,
      filters.state.passport_number,
      filters.state.reference,
      filters.state.status,
    ]
  );

  const handleEmployeeCreated = useCallback(() => {
    table.onResetPage();
    setRefreshKey((prev) => prev + 1);
  }, [table]);

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.slug));
    setTableData(deleteRows);
  }, [table.selected, tableData]);

  useEffect(() => {
    if (!filters.isHydrated) return;

    const requestId = fetchRequestIdRef.current + 1;
    fetchRequestIdRef.current = requestId;

    fetchEmployees(requestId);
  }, [fetchEmployees, refreshKey, filters.isHydrated]);

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
          heading="Listes des Employes"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Employes', href: paths.dashboard.employee.list },
            { name: 'Listes des employes' },
          ]}
          action={
            can('can_create_employee') && (
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={createDialog.onTrue}
              >
                Ajouter
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
                  <Label variant="filled" color="main">
                    {pagination.count}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <EmployeeTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            options={{
              roles: [...new Set(tableData.map((row) => row.job?.trim()).filter(Boolean))],
            }}
          />

          {canReset && (
            <EmployeeTableFiltersResult
              filters={filters}
              totalResults={pagination.count}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
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

                <TableBody>
                  {tableData.map((row) => (
                    <EmployeeTableRow
                      key={row.slug}
                      row={row}
                      selected={table.selected.includes(row.slug)}
                      onSelectRow={() => table.onSelectRow(row.slug)}
                      onViewRow={() => handleViewRow(row.slug)}
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
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            onPageChange={table.onChangePage}
            rowsPerPage={table.rowsPerPage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            dense={table.dense}
            count={pagination.count}
            onChangeDense={table.onChangeDense}
          />
        </Card>
      </DashboardContent>

      <EmployeeCreateDialog
        open={createDialog.value}
        onClose={createDialog.onFalse}
        onCreated={handleEmployeeCreated}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Supprimer"
        content={
          <>
            Etes vous sur de vouloir supprimer <strong>{table.selected.length}</strong> items?
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
  const { name, status, job } = filters;

  const stabilizedThis = inputData?.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData?.filter(
      (employee) =>
        employee?.reference?.toLowerCase().includes(name.toLowerCase()) ||
        employee?.last?.toLowerCase().includes(name.toLowerCase()) ||
        employee?.first?.toLowerCase().includes(name.toLowerCase()) ||
        employee?.passport_number?.toLowerCase().includes(name.toLowerCase()) ||
        employee?.job?.toLowerCase().includes(name.toLowerCase()) ||
        employee?.phone?.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (status !== 'all') {
    inputData = inputData?.filter((employee) => employee?.status === status);
  }

  if (job.length) {
    inputData = inputData?.filter((employee) => job?.includes(employee.job));
  }

  return inputData;
}
