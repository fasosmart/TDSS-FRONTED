import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { fNumber } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';

import { getPenaltyStatusLabel, getPenaltyTypeLabel } from './penalite-filter-options';

// ----------------------------------------------------------------------

const STATUS_COLOR = {
  OPEN: 'warning',
  BILLED: 'success',
  PAID: 'success',
  CANCELLED: 'error',
  CANCELED: 'error',
  CLOSED: 'default',
};

function formatPenaltyAmount(amount, currencySign) {
  if (amount === null || amount === undefined || amount === '') {
    return '-';
  }

  const parsedAmount = Number(amount);

  if (Number.isNaN(parsedAmount)) {
    return [amount, currencySign].filter(Boolean).join(' ');
  }

  return [fNumber(parsedAmount), currencySign].filter(Boolean).join(' ');
}

export function PenaliteTableRow({ row, onBillRow, onCancelRow, loading = false }) {
  const billConfirm = useBoolean();
  const cancelConfirm = useBoolean();
  const popover = usePopover();

  const companyName = row.company || row.company_name || '-';
  const employeeName =
    row.employee_name || [row.employee?.first, row.employee?.last].filter(Boolean).join(' ') || '-';
  const displayName =
    (companyName !== '-' && companyName) ||
    (employeeName !== '-' && employeeName) ||
    row.reference ||
    'P';
  const status = row.status?.toUpperCase() || '';
  const isOpen = status === 'OPEN';
  const isCancelled = ['CANCELLED', 'CANCELED'].includes(status);
  const isBilled = status === 'BILLED';
  const isCancelDisabled = !onCancelRow || isCancelled || isBilled;

  return (
    <>
      <TableRow hover>
        {/* Selection multiple desactivee pour l'instant, faute d'API bulk.
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            inputProps={{ id: `row-checkbox-${row.slug}`, 'aria-label': 'Row checkbox' }}
          />
        </TableCell>
        */}

        <TableCell>
          <Stack spacing={2} direction="row" alignItems="center">
            <Avatar alt={displayName}>{displayName.charAt(0).toUpperCase()}</Avatar>

            {row.slug ? (
              <Typography
                component={RouterLink}
                href={paths.dashboard.penalite.details(row.slug)}
                variant="body2"
                noWrap
                sx={{
                  display: 'block',
                  maxWidth: 240,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                  color: 'text.primary',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {row.reference || '-'}
              </Typography>
            ) : (
              <Typography variant="body2" noWrap>
                {row.reference || '-'}
              </Typography>
            )}
          </Stack>
        </TableCell>

        <TableCell>{getPenaltyTypeLabel(row.type) || '-'}</TableCell>
        <TableCell>{companyName}</TableCell>
        <TableCell>{employeeName}</TableCell>
        <TableCell>{formatPenaltyAmount(row.amount, row.currency_sign || row.currency)}</TableCell>
        <TableCell>{row.currency_sign || row.currency || '-'}</TableCell>

        <TableCell>
          <Label variant="soft" color={STATUS_COLOR[status] || 'default'}>
            {getPenaltyStatusLabel(status) || '-'}
          </Label>
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.created_on) || '-'}
            secondary={fTime(row.created_on) || '-'}
            slotProps={{
              primary: { typography: 'body2', noWrap: true },
              secondary: { mt: 0.5, component: 'span', typography: 'caption' },
            }}
          />
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.infraction_date) || '-'}
            secondary={fTime(row.infraction_date) || '-'}
            slotProps={{
              primary: { typography: 'body2', noWrap: true },
              secondary: { mt: 0.5, component: 'span', typography: 'caption' },
            }}
          />
        </TableCell>

        <TableCell align="right" sx={{ px: 1 }}>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            disabled={!onBillRow || !isOpen || loading}
            onClick={() => {
              billConfirm.onTrue();
              popover.onClose();
            }}
          >
            <Iconify icon="mdi:credit-card" />
            Facturer
          </MenuItem>

          <MenuItem
            disabled={isCancelDisabled || loading}
            onClick={() => {
              cancelConfirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: isCancelDisabled ? 'text.disabled' : 'error.main' }}
          >
            <Iconify icon="solar:close-circle-bold" />
            Annuler
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={billConfirm.value}
        onClose={billConfirm.onFalse}
        title="Facturer"
        content="Voulez-vous vraiment facturer cette penalite ?"
        action={
          <Button
            variant="contained"
            onClick={async () => {
              await onBillRow?.();
              billConfirm.onFalse();
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress color="inherit" size={20} /> : 'Facturer'}
          </Button>
        }
      />

      <ConfirmDialog
        open={cancelConfirm.value}
        onClose={cancelConfirm.onFalse}
        title="Annuler"
        content="Voulez-vous vraiment annuler cette penalite ?"
        action={
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              await onCancelRow?.();
              cancelConfirm.onFalse();
            }}
            disabled={loading || isCancelDisabled}
          >
            {loading ? <CircularProgress color="inherit" size={20} /> : 'Annuler'}
          </Button>
        }
      />
    </>
  );
}
