import React from 'react';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency, fGNF, fEuro } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { Iconify } from 'src/components/iconify';
import { toast } from 'sonner';

// ----------------------------------------------------------------------

export function PaiementTableRow({ row, selected, onViewRow, onDeleteRow }) {
  const confirm = useBoolean();
  const router = useRouter();
  const popover = usePopover();

  const afficherMontant = (montant) => {
    if (row?.devise === 'Franc Guinéen') {
      return fGNF(montant);
    } else if (row?.devise === 'US dollar') {
      return fCurrency(montant / 9200); // Exemple: 1 USD = 9200 GNF
    } else if (row?.devise === 'Euro') {
      return fEuro(montant / 10000); // Exemple: 1 EUR = 10000 GNF
    }
  };

  const methodsLabels = {
    transfer: 'Virement',
    cheque: 'Chèque',
    deposit: 'Espèces',
  };

  const handleDetailsFactures = () => {
    const factureSlug = row?.facture_slug;
    if (!factureSlug) {
      toast.error('Aucun slug de facture trouvé pour cette ligne');
      return;
    }
    router.push(paths.dashboard.factures.details(factureSlug));
  };

  return (
    <>
      <TableRow hover selected={selected} onClick={onViewRow} sx={{ cursor: 'pointer' }}>
        <TableCell padding="checkbox">
          {/* <Checkbox
            checked={selected}
            onClick={onSelectRow}
            inputProps={{ id: `row-checkbox-${row.id}`, 'aria-label': `Row checkbox` }}
          /> */}
        </TableCell>
        <TableCell>{row.number}</TableCell>

        <TableCell>
          <Stack spacing={2} direction="row" alignItems="center">
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2" noWrap sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' }, fontSize: '0.85rem' }}
                  onClick={(event) => {event.stopPropagation(); handleDetailsFactures();} }
                >
                  {row.facture_number}
                </Typography>
              }
              secondary={
                <Link
                  noWrap
                  variant="body2"
                  onClick={onViewRow}
                  sx={{ color: 'text.disabled', cursor: 'pointer' }}
                />
              }
            />
          </Stack>
        </TableCell>
        {/* <TableCell>{row.declaration_number}</TableCell> */}

        <TableCell>
          <Stack spacing={2} direction="row" alignItems="center">
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2" noWrap>
                  {methodsLabels[row.payment_method]}
                </Typography>
              }
              secondary={
                <Link
                  noWrap
                  variant="body2"
                  onClick={onViewRow}
                  sx={{ color: 'text.disabled', cursor: 'pointer' }}
                ></Link>
              }
            />
          </Stack>
        </TableCell>
        <TableCell>{row.payer}</TableCell>

        <TableCell>
          <ListItemText
            primary={<Typography variant="body2">{afficherMontant(row.amount)}</Typography>}
            // secondary={
            //   <Typography variant='body2'>
            //     {row.montantGnf}
            //   </Typography>
            // }
          />
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.created_on)}
            secondary={fTime(row.created_on)}
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
            onClick={() => {
              onViewRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            Voir
          </MenuItem>
        </MenuList>
      </CustomPopover>
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Payer"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Payer
          </Button>
        }
      />
    </>
  );
}
