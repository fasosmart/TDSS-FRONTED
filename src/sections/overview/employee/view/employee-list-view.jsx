'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';

import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import Tabs from '@mui/material/Tabs';

import axios from 'src/utils/axios';
import { useState, useEffect, useCallback } from 'react';
import { DashboardContent } from 'src/layouts/dashboard';
import { varAlpha } from 'src/theme/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import API from 'src/utils/api';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

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
// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'Tous' }];

const TABLE_HEAD = [
  { id: 'reference', label: 'Reference ' },
  { id: 'numero', label: 'Numéro Passport ' },
  { id: 'name', label: 'Nom Complet' },
  { id: 'declaration', label: 'Nombre declaration' },
  { id: 'phoneNumber', label: 'Numéro de téléphone' },
  { id: 'job', label: 'Fonction' },

  // { id: 'status', label: 'Status' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function EmployeeListView() {
  const table = useTable();

  const router = useRouter();

  const confirm = useBoolean();

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true); // État pour indiquer le chargement
  const [error, setError] = useState(null); // État pour gérer les erreurs
  const [selectedFilter, setSelectedFilter] = useState('name'); // filtre selectionné

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const filters = useSetState({
    name: '',
    job: [],
    status: 'all',
    passport_number: '',
    reference: '',
  });

  // Comme le filtrage est effectué côté backend,

  // On affichera directement tableData.
  const canReset =
    !!filters.state.name ||
    filters.state.job.length > 0 ||
    filters.state.status !== 'all' ||
    !!filters.state.passport_number ||
    !!filters.state.reference;

  // Pour indiquer l'absence de données, on vérifie le total
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

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      try {
        const offset = table.page * table.rowsPerPage;
        const url = API.listEmployee();
        // Construction des params avec des filtres

        const params = {
          limit: table.rowsPerPage,
          offset: offset,
          ...(filters.state.passport_number
            ? { passport_number: filters.state.passport_number }
            : filters.state.reference
              ? { reference: filters.state.reference }
              : filters.state.name
                ? { name: filters.state.name }
                : {}),
          ...(filters.state.job?.length > 0 && { 
            job: typeof filters.state.job[0] === 'object' 
              ? filters.state.job[0].name  // Envoyer le nom de la fonction
              : filters.state.job[0]       // Ou la valeur directe si c'est une chaîne
          }),
        };

        console.log('Paramètres de la requête:', params);
        const response = await axios.get(url, { params });
        console.log('Réponse de l\'API:', response.data);
        
        setTableData(response.data.results);
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        });
      } catch (err) {
        console.error('Erreur lors du chargement des employés:', err);
        setError(err.message || 'Erreur lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [
    table.page,
    table.rowsPerPage,
    filters.state.name,
    filters.state.job,
    filters.state.passport_number,
    filters.state.reference,
  ]);

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
          heading="Listes des Employés"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Employés', href: paths.dashboard.employee.list },
            { name: 'Listes des employés' },
          ]}
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
            onResetPage={table.onResetPage} // ou votre fonction de réinitialisation
            // onFilterChange={handleFilterChange}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            options={{
              roles: [...new Set(tableData.map((row) => row.job.trim()))],
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
