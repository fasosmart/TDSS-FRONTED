import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { TablePaginationCustom, TableEmptyRows, TableNoData } from 'src/components/table';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';
import { Label } from 'src/components/label';
import { fDateTime } from 'src/utils/format-time';
import CircularProgress from '@mui/material/CircularProgress';
import { fGNF } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export function DeclarationNew({
  title,
  subheader,
  tableData,
  headLabel,
  loading,
  table,
  totalCount,
  notFound,
  ...other
}) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <Scrollbar sx={{ minHeight: 402 }}>
        <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
          <TableHeadCustom
            headLabel={headLabel}
            order={table.order}
            orderBy={table.orderBy}
            onSort={table.onSort}
          />
          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={headLabel.length}>
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
              {tableData.map((row, index) => (
                <DynamicRow key={`${row.number}-${index}`} row={row} headLabel={headLabel} />
              ))}

              <TableEmptyRows
                height={table.dense ? 56 : 76}
                emptyRows={Math.max(0, table.rowsPerPage - tableData.length)}
              />

              <TableNoData notFound={notFound} />
            </TableBody>
          )}
        </Table>
      </Scrollbar>

      <TablePaginationCustom
        page={table.page}
        dense={table.dense}
        count={totalCount}
        rowsPerPage={table.rowsPerPage}
        onPageChange={table.onChangePage}
        onChangeDense={table.onChangeDense}
        onRowsPerPageChange={table.onChangeRowsPerPage}
      />

      <Divider sx={{ borderStyle: 'dashed' }} />
    </Card>
  );
}

function DynamicRow({ row, headLabel }) {
  const getLabelStatus = (status) => {
    switch (status) {
      case 'unsubmitted':
        return 'Non Soumise';
      case 'rejected':
        return 'Rejetée';
      case 'submitted':
        return 'Soumise';
      case 'validated':
        return 'Validée';
      case 'billed':
        return 'Facturée';
      case 'unpaid':
        return 'Non Payée';
      case 'paid':
        return 'Payée';
      case 'pending':
        return 'En attente';
      case 'processing':
        return 'En traitement';
      default:
        return status || '—';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unsubmitted':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'submitted':
        return 'primary';
      case 'validated':
        return 'success';
      case 'billed':
        return 'success';
      case 'unpaid':
        return 'warning';
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'warning';
      default:
        return 'default';
    }
  };

  const PAYMENT_METHOD = {
    transfer: 'Virement',
    cheque: 'Chèque',
    deposit: 'Dépôts',
  };

  const SEXE = {
    male: 'Homme',
    female: 'Femme',
  };

  const PERMIT = {
    A: 'Permis A',
    B: 'Permis B',
    C: 'Permis C',
  };

  const formatValue = (id, value) => {
    if (id === 'amount') return fGNF(value);
    if (id === 'createDate' || id === 'created_on' || id === 'printed_at')
      return fDateTime(value) || '-';
    if (id === 'status') {
      return (
        <Label variant="soft" color={getStatusColor(value)}>
          {getLabelStatus(value)}
        </Label>
      );
    }
    if (id === 'sexe') return SEXE[value] || value || '—';
    if (id === 'permit_type') return PERMIT[value] || value || '—';
    if (id === 'payment_method') return PAYMENT_METHOD[value] || value || '—';
    if (id === 'nber_employees') return value || 0;
    return value || '—';
  };

  return (
    <TableRow hover>
      {headLabel.map((col, i) => (
        <TableCell key={i}>{formatValue(col.id, row[col.id])}</TableCell>
      ))}
    </TableRow>
  );
}
