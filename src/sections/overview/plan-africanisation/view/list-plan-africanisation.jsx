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
import { useState, useEffect, useCallback } from 'react';
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
import dayjs from 'src/utils/format-time';
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
import { useMockedUser } from 'src/auth/hooks';

import { PlanTableRow } from '../plan-africantion-row';

const TABLE_HEAD = [
  // { id: 'reference', label: 'Référence' },
  { id: 'full_name', label: 'Nom Complet' },
  { id: 'email', label: 'Email' },
  { id: 'phone_number', label: 'Téléphone' },
  { id: 'company_name', label: 'Entreprise' },
  { id: 'hire_date', label: "Date d'embauche" },
  { id: 'expatriate_name', label: 'Expatrié' },
  { id: 'created_on', label: 'Date de création' },
  { id: 'status', label: 'Statut' },

  { id: '' },
];

export function ListPlanAfricanisationView() {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const { user } = useMockedUser();

  const router = useRouter();

  const table = useTable({ defaultOrderBy: 'created_on' });

  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const filters = useSetState(
    {
      company: '',
      expatriate_name: '',
      declaration_employee: '',
      reference: '',
      status: 'all',
      expatriate_passport: '',
      hire_date_from: null,
      hire_date_to: null,
      first_name: '',
      last_name: '',
    },
    { persistByPath: true }
  );

  const dateError = fIsBetween(filters.state.hire_date_from, filters.state.hire_date_to);

  const dataInpage = rowInPage(plans, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.company ||
    !!filters.state.expatriate_name ||
    !!filters.state.declaration_employee ||
    !!filters.state.reference ||
    filters.state.status !== 'all' ||
    !!filters.state.expatriate_passport ||
    (!!filters.state.hire_date_from && !!filters.state.hire_date_to) ||
    !!filters.state.first_name ||
    !!filters.state.last_name;

  const notFound = pagination.count === 0 && canReset;

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        const offset = table.page * table.rowsPerPage;
        const params = {
          limit: table.rowsPerPage,
          offset: offset,
          ...(filters.state.company ? { company: filters.state.company } : {}),
          ...(filters.state.expatriate_name
            ? { expatriate_name: filters.state.expatriate_name }
            : {}),
          ...(filters.state.declaration_employee
            ? { declaration_employee: filters.state.declaration_employee }
            : {}),
          ...(filters.state.reference ? { reference: filters.state.reference } : {}),
          ...(filters.state.status !== 'all' ? { status: filters.state.status } : {}),
          ...(filters.state.expatriate_passport
            ? { expatriate_passport: filters.state.expatriate_passport }
            : {}),
          ...(filters.state.hire_date_from && filters.state.hire_date_to && !dateError
            ? {
                hire_date_from: dayjs(filters.state.hire_date_from).format('YYYY-MM-DD'),
                hire_date_to: dayjs(filters.state.hire_date_to).format('YYYY-MM-DD'),
              }
            : {}),
          ...(filters.state.first_name ? { first_name: filters.state.first_name } : {}),
          ...(filters.state.last_name ? { last_name: filters.state.last_name } : {}),
        };
        const response = await axios.get(API.listAfricanizationPlan(), { params });
        setPlans(response.data.results);
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        });
      } catch (error) {
        console.error('Error fetching Africanization Plans:', error);
        const errorMessage =
          error.data ||
          error?.message ||
          error?.details ||
          'Erreur lors du chargement des plans de panafricanisation.';
        setError(errorMessage);
        toast.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, [
    table.page,
    table.rowsPerPage,
    filters.state.company,
    filters.state.expatriate_name,
    filters.state.declaration_employee,
    filters.state.reference,
    filters.state.status,
    filters.state.expatriate_passport,
    filters.state.hire_date_from,
    filters.state.hire_date_to,
    filters.state.first_name,
    filters.state.last_name,
  ]);

  if (isLoading) {
    console.log('Loading plans...');
  }

  if (error) {
    console.log('Error:', error);
  }

  const handleViewRow = useCallback(
    async (slug) => {
      router.push(paths.dashboard.planAfricanisation.detail(slug));
    },
    [router]
  );

  // return a valid JSX element from the component
  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Plan de Panafricanisation"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },

            { name: 'Plan de Panafricanisation' },
          ]}
          // action={
          //   <Button
          //     // component={RouterLink}
          //     variant="contained"
          //     startIcon={<Iconify icon="download" />}
          //   >
          //     Exporter
          //   </Button>
          // }
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Card>
          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={pagination.count}
              onSelectAllRows={(checked) => {
                table.onSelectAllRows(
                  checked,
                  plans.map((row) => row.slug)
                );
              }}
              actions={
                <Tooltip title="Supprimer">
                  <IconButton color="primary">
                    <Iconify icon="eva:trash-2-outline" />
                  </IconButton>
                </Tooltip>
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
                      plans.map((row) => row.slug)
                    )
                  }
                />
                {isLoading ? (
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
                    {plans.map((row) => (
                      <PlanTableRow
                        user={user}
                        key={row.slug}
                        row={row}
                        selected={table.selected.includes(row.slug)}
                        onSelectRow={() => table.onSelectRow(row.slug)}
                        onViewRow={() => handleViewRow(row.slug)}
                      />
                    ))}

                    {plans.length > 0 && plans.length < table.rowsPerPage && (
                      <TableEmptyRows
                        height={table.dense ? 56 : 76}
                        emptyRows={table.rowsPerPage - plans.length}
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
    </>
  );
}
