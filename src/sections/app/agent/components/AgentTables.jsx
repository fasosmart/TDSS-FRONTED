import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import { usePathname } from 'next/navigation';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
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
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { fDate } from 'src/utils/format-time';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';
import { CustomPopover, usePopover } from 'src/components/custom-popover';
import API from 'src/utils/api';
import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'reference', label: 'Référence', width: 120 },
  { id: 'title', label: 'Titre', width: 120 },
  { id: 'date', label: 'Date', width: 120 },
  { id: 'company', label: 'Entreprise', width: 180 },
  { id: 'employees', label: 'Employés', width: 100 },
  { id: 'status', label: 'Statut', width: 100 },
];

// Définition des statuts possibles avec leurs libellés et couleurs
const STATUS_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'submitted', label: 'Soumises' },
  { value: 'unsubmitted', label: 'Non Soumises' },
  { value: 'pending', label: 'En attente' },
  { value: 'billed', label: 'Facturées' },
  { value: 'paid', label: 'Payées' },
  { value: 'unpaid', label: 'Impayées' },
  { value: 'rejected', label: 'Rejetées' },
  { value: 'validated', label: 'Validées' },
];

// Fonction utilitaire pour obtenir la couleur d'un statut
export const getStatusColor = (status) => {
  switch (status) {
    case 'submitted':
    case 'billed':
    case 'paid':
    case 'validated':
      return 'success';
    case 'rejected':
    case 'unpaid':
      return 'error';
    case 'pending':
      return 'warning';
    case 'unsubmitted':
      return 'default';
    default:
      return 'info';
  }
};

// Fonction utilitaire pour obtenir le libellé d'un statut
export const getStatusLabel = (status) => {
  const statusOption = STATUS_OPTIONS.find(option => option.value === status);
  return statusOption ? statusOption.label : status.charAt(0).toUpperCase() + status.slice(1);
};

// ----------------------------------------------------------------------

export function AgentRecentDeclarations({ declarations = [] }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Extraire les statuts uniques des déclarations pour les options de filtre
  const availableStatuses = React.useMemo(() => {
    const statusSet = new Set(declarations.map(dec => dec.status));
    return STATUS_OPTIONS.filter(option => 
      option.value === 'all' || statusSet.has(option.value)
    );
  }, [declarations]);

  // Filtrer les déclarations par statut
  const filteredDeclarations = declarations.filter((dec) => {
    return filter === 'all' || dec.status === filter;
  });

  // Prioriser les déclarations non soumises (pending) et rejetées (rejected)
  const sortedDeclarations = [...filteredDeclarations].sort((a, b) => {
    // Priorité 1: Non soumises (pending)
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;

    // Priorité 2: Rejetées (rejected)
    if (a.status === 'rejected' && b.status !== 'rejected') return -1;
    if (a.status !== 'rejected' && b.status === 'rejected') return 1;

    // Priorité 3: Date (plus récente en premier)
    return new Date(b.date) - new Date(a.date);
  });

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify
                icon="mdi:clipboard-text-clock"
                width={24}
                sx={{
                  color: isDarkMode ? theme.palette.primary.light : theme.palette.primary.main,
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.common.black }}>
                Déclarations récentes
              </Typography>
              <Label color="info" sx={{ ml: 1 }}>
                {declarations.length}
              </Label>
              <Button
                size="small"
                color="inherit"
                endIcon={<Iconify icon="mdi:arrow-right" />}
                sx={{ textTransform: 'none', fontWeight: 500, color: 'text.secondary' }}
              >
                Voir tout
              </Button>
            </Stack>
          </Box>
        }
        sx={{
          pb: 0,

          '& .MuiCardHeader-title': {
            color: theme.palette.common.white,
            display: 'block',
            width: '100%',
          },
        }}
        action={
          <Stack direction="row" spacing={1} alignItems="center" marginBottom={3}>
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
                {availableStatuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        }
      />
      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table
            sx={{
              minWidth: 720,
              '& .MuiTableCell-head': {
                color: isDarkMode ? theme.palette.common.white : theme.palette.common.black,
                fontWeight: 600,
              },
            }}
          >
            <TableHeadCustom headLabel={TABLE_HEAD} />

            <TableBody>
              {sortedDeclarations
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <AgentDeclarationRow key={row.id} row={row} isDarkMode={isDarkMode} />
                ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <TablePagination
        page={page}
        component="div"
        count={sortedDeclarations.length}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        rowsPerPageOptions={[5, 10, 25]}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Card>
  );
}

function AgentDeclarationRow({ row, isDarkMode }) {
  const theme = useTheme();
  const popover = usePopover();
  const router = useRouter();
  const pathname = usePathname();

  const handleViewDetails = useCallback(() => {
    popover.onClose();
    // Redirection vers la page de détails de la déclaration
    router.push(`${pathname}/declarations/${row.id}`);
  }, [row.id, router, popover, pathname]);

  const handleEdit = useCallback(() => {
    popover.onClose();
    // Redirection vers la page d'édition de la déclaration
    router.push(`${pathname}/declarations/${row.id}/edit`);
  }, [row.id, router, popover, pathname]);

  const handleDelete = useCallback(() => {
    popover.onClose();
    // Logique de suppression avec confirmation
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette déclaration ?')) {
      console.log('Suppression de la déclaration:', row.id);
      // Envoyer la requête de suppression
      API.deleteDeclaration(row.id)
        .then(() => {
          console.log('Déclaration supprimée avec succès');
        })
        .catch((error) => {
          console.error('Erreur lors de la suppression de la déclaration:', error);
        });
    }
  }, [row.id, popover]);

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation();
      popover.onOpen(event);
    },
    [popover]
  );

  return (
    <>
      <TableRow
        hover
        sx={{
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
          {row.title}
        </TableCell>
        <TableCell sx={{ color: isDarkMode ? theme.palette.text.secondary : undefined }}>
          {fDate(row.date)}
        </TableCell>
        <TableCell sx={{ color: isDarkMode ? theme.palette.text.primary : undefined }}>
          {row.company}
        </TableCell>
        <TableCell sx={{ color: isDarkMode ? theme.palette.text.secondary : undefined }}>
          {row.employees}
        </TableCell>
        <TableCell>
          <Label
            variant="soft"
            color={getStatusColor(row.status)}
          >
            {getStatusLabel(row.status)}
          </Label>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 160 }}
      >
        <MenuItem onClick={handleViewDetails}>
          <Iconify icon="solar:eye-bold" width={20} sx={{ mr: 1 }} />
          Voir détails
        </MenuItem>

        <MenuItem onClick={handleEdit}>
          <Iconify icon="solar:pen-bold" />
          Modifier
        </MenuItem>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          Supprimer
        </MenuItem>
      </CustomPopover>
    </>
  );
}

// Définition des PropTypes pour AgentRecentDeclarations
AgentRecentDeclarations.propTypes = {
  declarations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      reference: PropTypes.string,
      number: PropTypes.string,
      date: PropTypes.string,
      company: PropTypes.string,
      status: PropTypes.string,
      employees: PropTypes.number,
      title: PropTypes.string,
      comment: PropTypes.string,
    })
  ),
};
