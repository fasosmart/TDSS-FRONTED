import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';
import { CustomPopover, usePopover } from 'src/components/custom-popover';
import { Label } from 'src/components/label';
import { useRouter } from 'next/navigation';

// ----------------------------------------------------------------------

const ALL_INVOICES = [
  {
    id: 'INV-001',
    date: new Date('2023-05-21'),
    company: 'Entreprise ABC',
    amount: 240000,
    declarationId: 'DEC-001',
    status: 'paid',
    paymentDate: new Date('2023-05-25'),
  },
  {
    id: 'INV-002',
    date: new Date('2023-05-19'),
    company: 'Société XYZ',
    amount: 160000,
    declarationId: 'DEC-002',
    status: 'pending',
    paymentDate: null,
  },
  {
    id: 'INV-003',
    date: new Date('2023-05-17'),
    company: 'Compagnie 123',
    amount: 300000,
    declarationId: 'DEC-003',
    status: 'overdue',
    paymentDate: null,
  },
  {
    id: 'INV-004',
    date: new Date('2023-05-16'),
    company: 'Entreprise DEF',
    amount: 100000,
    declarationId: 'DEC-004',
    status: 'paid',
    paymentDate: new Date('2023-05-18'),
  },
  {
    id: 'INV-005',
    date: new Date('2023-05-15'),
    company: 'Société GHI',
    amount: 200000,
    declarationId: 'DEC-005',
    status: 'pending',
    paymentDate: null,
  },
];

// ----------------------------------------------------------------------

const DECLARATION_TABLE_HEAD = [
  { id: 'id', label: 'ID' },
  { id: 'date', label: 'Date' },
  { id: 'company', label: 'Entreprise' },
  { id: 'nb_employees', label: "Nombre d'employés" },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

const INVOICE_TABLE_HEAD = [
  { id: 'id', label: 'ID' },
  { id: 'date', label: 'Date' },
  { id: 'company', label: 'Entreprise' },
  { id: 'comment', label: 'Commentaire', align: 'right' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

// ----------------------------------------------------------------------

export function ComptableDeclarationTable({ title, declarations, loading }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  return (
    <Card
      sx={{
        boxShadow: isDarkMode ? '0 4px 8px 0 rgba(0, 0, 0, 0.4)' : '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        borderRadius: 1,
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: isDarkMode
            ? '0 6px 12px 0 rgba(0, 0, 0, 0.5)'
            : '0 4px 8px 0 rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <CardHeader
        title={
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ color: isDarkMode ? theme.palette.background.paper : theme.palette.common.dark }}
          >
            <Iconify icon="mdi:clipboard-text-clock" width={24} />
            <Typography variant="h6">{title || 'Déclarations à facturer'}</Typography>
            <Label color="info" sx={{ ml: 1 }}>
              {declarations.length}
            </Label>
          </Stack>
        }
        subheader={
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 1 }}>
            Liste des déclarations validées en attente de facturation
          </Typography>
        }
        sx={{
          pb: 0,
          '& .MuiCardHeader-title': {
            color: isDarkMode ? theme.palette.common.white : theme.palette.text.primary,
          },
        }}

        /* action={
          <Button
            size="medium"
            startIcon={<Iconify icon="mdi:file-document-plus" />}
            variant="contained"
            color="primary"
          >
            Facturer tout
          </Button>
        } */

      />
      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table
            sx={{
              minWidth: 720,
              '& .MuiTableCell-head': {
                color: isDarkMode ? theme.palette.common.white : theme.palette.text.primary,
                backgroundColor: isDarkMode
                  ? theme.palette.background.paper
                  : theme.palette.background.neutral,
                fontWeight: 600,
              },
            }}
          >
            <TableHeadCustom headLabel={DECLARATION_TABLE_HEAD} />

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={DECLARATION_TABLE_HEAD.length} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : declarations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={DECLARATION_TABLE_HEAD.length} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Aucune déclaration trouvée
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                declarations
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => <DeclarationRow key={row.slug} row={row} isDarkMode={isDarkMode} />)
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <TablePagination
        page={page}
        component="div"
        count={declarations.length}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        rowsPerPageOptions={[5, 10, 25]}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

function DeclarationRow({ row, isDarkMode }) {
  const theme = useTheme();
  const popover = usePopover();
  const router = useRouter();

  const handleGenerateInvoice = () => {
    console.log('Générer facture pour:', row.slug);
    popover.onClose();
  };

  const handleViewDetails = () => {
    router.push(`/dashboard/declaration/${row.slug}`); // ou le chemin approprié vers la page de détails
    popover.onClose();
  };

   const statusLabels = {
    validated: 'Validée',
   
  };

   const getStatusColor = (status) => {
    switch (status) {
      case 'validated':
        return 'success';
      
      default:
        return 'default';
    }
  };

  return (
    <TableRow
      hover
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&:last-child td, &:last-child th': { border: 0 },
        '&:hover': {
          backgroundColor: isDarkMode
            ? theme.palette.action.hover
            : theme.palette.background.neutral,
        },
      }}
    >
      <TableCell sx={{ color: isDarkMode ? theme.palette.text.secondary : undefined }}>
        {row.number}
      </TableCell>
      <TableCell sx={{ color: isDarkMode ? theme.palette.text.secondary : undefined }}>
        {new Date(row.created_on).toLocaleDateString('fr-FR')}
      </TableCell>
      <TableCell sx={{ color: isDarkMode ? theme.palette.text.primary : undefined }}>
        {row.title}
      </TableCell>
      <TableCell sx={{ color: isDarkMode ? theme.palette.text.secondary : undefined }}>
        {row.nb_employees}
      </TableCell>
      <TableCell>
        <Label variant="soft" color={getStatusColor(row.status)}>
          {statusLabels[row.status] || 'Inconnu'} 
        </Label>
      </TableCell>
      <TableCell align="right">
        <IconButton
          color={popover.open ? 'primary' : 'default'}
          onClick={popover.onOpen}
          sx={{
            color: popover.open
              ? theme.palette.primary.main
              : isDarkMode
                ? theme.palette.text.secondary
                : undefined,
          }}
        >
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </TableCell>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        anchorEl={popover.open ? popover.anchorEl : null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{ '& .MuiPopover-paper': {
      width: 220,
      mt: 1,
      ml: 1,
      overflow: 'visible',
      '&:before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        top: 0,
        right: 14,
        width: 10,
        height: 10,
        bgcolor: 'background.paper',
        transform: 'translateY(-50%) rotate(45deg)',
        zIndex: 0,
      }
    } }}
      >
       {/*  <MenuItem onClick={handleGenerateInvoice} sx={{ 
      color: 'success.main',
      '&:hover': {
        bgcolor: 'action.hover',
      }
      }}>
          <Iconify icon="mdi:file-document-plus" />
          Générer facture
        </MenuItem> */}

        <MenuItem onClick={handleViewDetails} sx={{ 
      '&:hover': {
        bgcolor: 'action.hover',
      }
    }}>
          <Iconify icon="solar:eye-bold" />
          Voir détails
        </MenuItem>
      </CustomPopover>
    </TableRow>
  );
}
// ----------------------------------------------------------------------

export function ComptableFactureTable({ title }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Filtrer les factures par statut
  const invoices =
    filter === 'all' ? ALL_INVOICES : ALL_INVOICES.filter((inv) => inv.status === filter);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    setPage(0);
  };

  return (
    <Card
      sx={{
        boxShadow: isDarkMode ? '0 4px 8px 0 rgba(0, 0, 0, 0.4)' : '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        borderRadius: 1,
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: isDarkMode
            ? '0 6px 12px 0 rgba(0, 0, 0, 0.5)'
            : '0 4px 8px 0 rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <CardHeader
        title={
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              color: isDarkMode ? theme.palette.background.paper : theme.palette.background.neutral,
            }}
          >
            <Iconify icon="mdi:file-document-multiple" width={24} />
            <Typography variant="h6">{title || 'Factures récentes'}</Typography>
            <Label color="info" sx={{ ml: 1 }}>
              {invoices.length}
            </Label>
          </Stack>
        }
        subheader={
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 1 }}>
            Liste des factures générées et leur statut de paiement
          </Typography>
        }
        sx={{
          pb: 0,
          '& .MuiCardHeader-title': {
            color: isDarkMode ? theme.palette.common.white : theme.palette.text.primary,
          },
        }}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel id="status-filter-label">Statut</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filter}
                label="Statut"
                onChange={handleFilterChange}
                startAdornment={
                  <Iconify icon="mdi:filter-variant" width={20} sx={{ mr: 0.5, ml: -0.5 }} />
                }
              >
                <MenuItem value="all">Toutes</MenuItem>
                <MenuItem value="paid">Payées</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="overdue">En retard</MenuItem>
              </Select>
            </FormControl>
            <Button
              size="medium"
              startIcon={<Iconify icon="mdi:file-export" />}
              variant="outlined"
              color="primary"
            >
              Exporter
            </Button>
          </Stack>
        }
      />
      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table
            sx={{
              minWidth: 720,
              '& .MuiTableCell-head': {
                color: isDarkMode ? theme.palette.common.white : theme.palette.text.primary,
                backgroundColor: isDarkMode
                  ? theme.palette.background.paper
                  : theme.palette.background.neutral,
                fontWeight: 600,
              },
            }}
          >
            <TableHeadCustom headLabel={INVOICE_TABLE_HEAD} />

            <TableBody>
              {invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <InvoiceRow key={row.id} row={row} isDarkMode={isDarkMode} />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <TablePagination
        page={page}
        component="div"
        count={invoices.length}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        rowsPerPageOptions={[5, 10, 25]}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

function InvoiceRow({ row, isDarkMode }) {
  const theme = useTheme();
  const popover = usePopover();

  const handleMarkAsPaid = () => {
    console.log('Marquer comme payée:', row.id);
    popover.onClose();
  };

  const handleSendReminder = () => {
    console.log('Envoyer rappel pour:', row.id);
    popover.onClose();
  };

  const handleViewInvoice = () => {
    console.log('Voir facture:', row.id);
    popover.onClose();
  };

  const handlePrintInvoice = () => {
    console.log('Imprimer facture:', row.id);
    popover.onClose();
  };

  // Déterminer la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  // Traduire le statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'pending':
        return 'En attente';
      case 'overdue':
        return 'En retard';
      default:
        return status;
    }
  };

  return (
    <TableRow
      hover
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&:last-child td, &:last-child th': { border: 0 },
        '&:hover': {
          backgroundColor: isDarkMode
            ? theme.palette.action.hover
            : theme.palette.background.neutral,
        },
      }}
    >
      <TableCell sx={{ color: isDarkMode ? theme.palette.text.secondary : undefined }}>
        {row.id}
      </TableCell>
      <TableCell sx={{ color: isDarkMode ? theme.palette.text.secondary : undefined }}>
        {fDate(row.date)}
      </TableCell>
      <TableCell sx={{ color: isDarkMode ? theme.palette.text.primary : undefined }}>
        {row.company}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          color: isDarkMode ? theme.palette.success.lighter : theme.palette.success.darker,
          fontWeight: 600,
        }}
      >
        {fCurrency(row.amount)}
      </TableCell>
      <TableCell>
        <Label variant="soft" color={getStatusColor(row.status)}>
          {getStatusLabel(row.status)}
        </Label>
      </TableCell>
      <TableCell align="right">
        <IconButton
          color={popover.open ? 'primary' : 'default'}
          onClick={popover.onOpen}
          sx={{
            color: popover.open
              ? theme.palette.primary.main
              : isDarkMode
                ? theme.palette.text.secondary
                : undefined,
          }}
        >
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </TableCell>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 180 }}
      >
        <MenuItem onClick={handleViewInvoice}>
          <Iconify icon="solar:eye-bold" />
          Voir facture
        </MenuItem>

        <MenuItem onClick={handlePrintInvoice}>
          <Iconify icon="mdi:printer" />
          Imprimer
        </MenuItem>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {row.status !== 'paid' && (
          <MenuItem onClick={handleMarkAsPaid} sx={{ color: theme.palette.success.main }}>
            <Iconify icon="mdi:check-circle" />
            Marquer payée
          </MenuItem>
        )}

        {(row.status === 'pending' || row.status === 'overdue') && (
          <MenuItem onClick={handleSendReminder} sx={{ color: theme.palette.warning.main }}>
            <Iconify icon="mdi:bell" />
            Envoyer rappel
          </MenuItem>
        )}
      </CustomPopover>
    </TableRow>
  );
}
