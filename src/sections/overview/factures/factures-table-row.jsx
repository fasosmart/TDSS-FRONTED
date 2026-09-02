'use client';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import { useState } from 'react';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency, fGNF } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';

import { usePermissions } from 'src/auth/hooks';

import { PayeurForm } from './form-factures';

// import { fetchOptions, banks } from 'src/utils/options';

// ----------------------------------------------------------------------

export function FactureTableRow({
  row,
  selected,
  onSelectRow,
  onViewRow,
  onEditRow,
  onDeleteRow,
  onPaidRow,
  Options,
  setOptions,
  onViewPayment,
  setSelectedBanque,
  selectedBanque,
}) {
  const confirm = useBoolean();
  const router = useRouter();
  const [loading, setLoading] = useState(false); // Etat pour gérer l'affichage du loader pendant le chargement des options de banque
  const [openFirstDialog, setOpenFirstDialog] = useState(false);
  const [openSecondDialog, setOpenSecondDialog] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [selectedBanqueLocal, setSelectedBanqueLocal] = useState(null);
  const [localStatus, setLocalStatus] = useState(row?.status); // Etat local pour le statut de la facture

  const handleChangeBanque = (event, newValue) => {
    setSelectedBanqueLocal(newValue);
    setSelectedBanque(newValue); // Remonte l'objet complet
  };

  const statusLabels = {
    paid: 'Payée',
    unpaid: 'En attente',
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'unpaid':
        return 'warning';
      case 'paid':
        return 'success';
      default:
        return 'default';
    }
  };

  const popover = usePopover();
  const payeurForm = useBoolean();
  const { can } = usePermissions();

  const handleViewDeclaration = (e) => {
    e.stopPropagation(); // Empêche la propagation de l'événement de clic
    const slug = row?.declaration?.slug || row?.declaration_slug; // Utilise le slug de la déclaration
    if (!slug) {
      console.error('Aucun slug de déclaration trouvé pour cette facture');
      return;
    }
    // Redirige vers la page de détails de la déclaration
    router.push(paths.dashboard.declaration.details(slug)); // Redirige vers la page de détails de la déclaration
  };
  // console.log('row', row);
  return (
    <>
      <TableRow
        hover
        selected={selected}
        onClick={onViewRow}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            // onClick={onSelectRow}
            onClick={(e) => {
              e.stopPropagation(); // Empêche le clic sur la checkbox de se propager au TableRow
              onSelectRow(e);
            }}
            slotProps={{ slug: `row-checkbox-${row.slug}`, 'aria-label': `Row checkbox` }}
          />
        </TableCell>

        <TableCell>
          <Stack spacing={2} direction="row" alignItems="center">
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2" noWrap>
                  {row.number}
                </Typography>
              }
            />
          </Stack>
        </TableCell>
        {row.nb_declarations > 1 ? (
          <TableCell>{row.nb_declarations}</TableCell>
        ) : (
          <TableCell
            onClick={handleViewDeclaration}
            sx={{
              cursor: 'pointer',
              '&:hover': { color: 'primary.main', textDecoration: 'underline' },
            }}
          >
            {row.declaration_number}
          </TableCell>
        )}
        <TableCell>{row.client}</TableCell>
        <TableCell>
          <ListItemText
            primary={fGNF(row.amount)}
            secondary={fCurrency(row.amount / 9200)}
            slotProps={{
              primary: { typography: 'body2', noWrap: true },
              secondary: { mt: 0.5, component: 'span', typography: 'caption' },
            }}
          />
        </TableCell>

        {/* <TableCell
          onClick={(e) => {
            e.stopPropagation(); // Empêche la propagation de l'événement de clic
            onViewPayment();
          }}
          sx={{
            cursor: 'pointer',
            '&:hover': { color: 'primary.main', textDecoration: 'underline' },
          }}
        >
          {row.payment_number}
        </TableCell> */}

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

        <TableCell>
          <Label variant="soft" color={getStatusColor(localStatus)}>
            {statusLabels[localStatus] || 'Inconnu'}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ px: 1 }}>
          <IconButton
            color={popover.open ? 'inherit' : 'default'}
            onClick={(e) => {
              popover.onOpen(e);
              e.stopPropagation(); // Empêche la propagation de l'événement de clic
            }}
          >
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

          {/* <MenuItem
            onClick={() => {
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Modifier
          </MenuItem> */}

          {can('can_mark_facture_paid') && row.status === 'unpaid' && !row.has_payment && (
            <MenuItem
              color={payeurForm.value ? 'inherit' : 'default'}
              onClick={() => {
                // confirm.onTrue();
                popover.onClose();
                payeurForm.onTrue(); // Ouvre la boîte de dialogue de paiement
              }}
            >
              <Iconify icon="mdi:credit-card" />
              Payer
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>

      <PayeurForm
        slug={[row.slug]}
        open={payeurForm.value}
        onclose={payeurForm.onFalse}
        onSuccess={() => {
          setLocalStatus('paid'); // Met à jour le statut local de la facture
          payeurForm.onFalse(); // Ferme la boîte de dialogue de paiement
        }}
      />
      {/* <ConfirmDialog
        fullWidth
        open={openFirstDialog}
        onClose={() => setOpenFirstDialog(false)} // Ferme la première boîte de dialogue
        title="Payer"
        content={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography sx={{ mb: 2 }}>
              Sélectionnez la banque avec laquelle vous voulez payer cette facture
            </Typography>
            <Autocomplete
              options={banks}
              getOptionLabel={(bank) => bank.name}
              loading={loading}
              value={selectedBanque || null}
              onChange={handleChangeBanque}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Rechercher ou sélectionner une banque"
                  placeholder="Taper pour rechercher"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }
                  }}
                />
              )}
              sx={{ width: '100%' }}
            />
          </Box>
        }
        action={
          <Button
            variant="contained"
            color="success"
            disabled={!selectedBanque}
            onClick={() => {
              setOpenFirstDialog(false); // Ferme la première boîte de dialogue
              setOpenSecondDialog(true); // Ouvre la deuxième boîte de dialogue

            }}
          >
            Suivant
          </Button>
        }
      /> */}
      {/* <ConfirmDialog
        open={openSecondDialog}
        onClose={() => setOpenSecondDialog(false)} // Ferme la deuxième boîte de dialogue
        title="Veuillez fournir les informations suivantes"
        content={<PayeurForm slug={row.slug} />}
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              setOpenSecondDialog(false); // Ferme la deuxième boîte de dialogue
              onPaidRow(); // Action pour "Payer"
            }}
          >
            Payer
          </Button>
        }
      /> */}
    </>
  );
}
