import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import { useBoolean } from 'src/hooks/use-boolean';
import { fDate, fTime } from 'src/utils/format-time';

import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';

export function DeclarationTableRow({
  row,
  user,
  selected,
  onSelectRow,
  onViewRow,
  onEditRow,
  onDeleteRow,
  onValidateRow,
  onFactureRow,
  onRejetRow,
  onSubmitRow,
  onUnSubmitRow,
}) {
  // Pour la suppression
  const deleteConfirm = useBoolean();
  // Pour la validation (exemple)
  const validateConfirm = useBoolean();
  // Pour la facturation (exemple)
  const factureConfirm = useBoolean();
  // Pour la soumission
  const submitConfirm = useBoolean();

  // Pour la non-soumission
  const unsubmitConfirm = useBoolean();

  // Pour le dialogue de rejet
  const [openRejetDialog, setOpenRejetDialog] = useState(false);
  const [motifRejet, setMotifRejet] = useState('');

  const popover = usePopover();

  const profil = user?.companies[0]?.type_name?.toLowerCase().trim();

  // Handler pour le rejet, après validation du motif
  const handleConfirmRejet = () => {
    onRejetRow(motifRejet); // On passe le motif en paramètre
    setMotifRejet('');
    setOpenRejetDialog(false);
  };

  const statusLabels = {
    unsubmitted: 'Non soumise',
    submitted: 'Soumise',
    rejected: 'Rejetée',
    validated: 'Validée',
    billed: 'Facturée',
  };

  // Ajoute la couleur correspondante au statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'validated':
        return 'success';
      case 'submitted':
        return 'info';
      case 'unsubmitted':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'billed':
        return 'primary';
      default:
        return 'default';
    }
  };

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
            onClick={(e) => {
              e.stopPropagation(); // Empêche le clic sur la checkbox de se propager au TableRow
              onSelectRow(e);
            }}
            slotProps={{ id: `row-checkbox-${row.id}`, 'aria-label': `Row checkbox` }}
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
        <TableCell>{row.title}</TableCell>
        <TableCell>{row.company}</TableCell>
        <TableCell>{row.nb_employees}</TableCell>
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
        {/* <TableCell>{fCurrency(row.total_amount)}</TableCell> */}
        <TableCell>
          <Label variant="soft" color={getStatusColor(row.status)}>
            {statusLabels[row.status] || 'Inconnu'}
          </Label>
        </TableCell>
        <TableCell align="right" sx={{ px: 1 }}>
          <IconButton
            color={popover.open ? 'inherit' : 'default'}
            onClick={(e) => {
              e.stopPropagation(); // Empêche la propagation vers le TableRow
              popover.onOpen(e); // Passe l'événement à la fonction onOpen
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

          {/* {user?.type_name === 'Admin' && ['unsubmitted'].includes(row.status) && ( */}
          {(user?.type_name === 'Agent' || user?.type_name === 'Admin') &&
            ['unsubmitted'].includes(row.status) && (
              <MenuItem
                onClick={() => {
                  onEditRow();
                  popover.onClose();
                }}
              >
                <Iconify icon="solar:pen-bold" />
                Modifier
              </MenuItem>
            )}

          {user?.type_name === 'Agent' && ['rejected', 'submitted'].includes(row.status) && (
            <MenuItem
              key="unsubmit"
              onClick={() => {
                unsubmitConfirm.onTrue();
                popover.onClose();
              }}
            >
              <Iconify icon="solar:pen-bold" />
              Mettre En Edition
            </MenuItem>
          )}

          {user?.type_name === 'Agent' &&
            !['validated', 'billed', 'rejected', 'submitted'].includes(row.status) && (
              <MenuItem
                key="submit"
                onClick={() => {
                  submitConfirm.onTrue();
                  popover.onClose();
                }}
              >
                <Iconify icon="mdi:check-bold" />
                Soumettre
              </MenuItem>
            )}

          {(user?.type_name === 'Aguipe' || user?.type_name === 'Comptable') &&
            profil === 'aguipe' &&
            !['validated', 'billed', 'rejected', 'unsubmitted'].includes(row.status) && (
              <MenuItem
                key="validate"
                onClick={() => {
                  validateConfirm.onTrue();
                  popover.onClose();
                }}
              >
                <Iconify icon="mdi:check-bold" />
                Valider
              </MenuItem>
            )}

          {(user?.type_name === 'Aguipe' || user?.type_name === 'Comptable') &&
            profil === 'aguipe' &&
            !['rejected', 'billed', 'validated', 'unsubmitted'].includes(row.status) && (
              <MenuItem
                key="reject"
                onClick={() => {
                  setOpenRejetDialog(true);
                  popover.onClose();
                }}
              >
                <Iconify icon="material-symbols:cancel" />
                Rejeter
              </MenuItem>
            )}

          {/* {user?.type === 'Agent' &&
            ['REJECTED'].includes(row.status) && (
              <MenuItem
                key="unsubmit"
                onClick={() => {
                  unsubmitConfirm.onTrue();
                  popover.onClose();
                }}
              >
                <Iconify icon="solar:pen-bold" />
                Mettre En Edition
              </MenuItem>
            )} */}

          {user?.type_name === 'Comptable' &&
            !['billed', 'rejected', 'unsublitted', 'submitted'].includes(row.status) && (
              <MenuItem
                key="facture"
                onClick={() => {
                  factureConfirm.onTrue();
                  popover.onClose();
                }}
              >
                <Iconify icon="mdi:credit-card" />
                Facturer
              </MenuItem>
            )}

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* <MenuItem
            onClick={() => {
              deleteConfirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Supprimer
          </MenuItem> */}
        </MenuList>
      </CustomPopover>

      {/* Boîte de dialogue de confirmation pour la suppression */}
      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Supprimer"
        content="Voulez-vous vraiment supprimer ?"
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              deleteConfirm.onTrue(); // Pour fermer le dialogue
              onDeleteRow(); // Appelle la fonction de suppression
            }}
          >
            Supprimer
          </Button>
        }
      />

      {/* Exemple de boîte de dialogue de confirmation pour la non-soumission */}
      <ConfirmDialog
        open={unsubmitConfirm.value}
        onClose={unsubmitConfirm.onFalse}
        title="Remettre le statut à non-soumise"
        content="Voulez-vous vraiment remettre le statut de cette déclaration à non-soumise ?"
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              unsubmitConfirm.onFalse();
              onUnSubmitRow();
            }}
          >
            Oui
          </Button>
        }
      />

      {/* Exemple de boîte de dialogue de confirmation pour la soumission */}
      <ConfirmDialog
        open={submitConfirm.value}
        onClose={submitConfirm.onFalse}
        title="Soumission"
        content="Voulez-vous vraiment soumettre cette déclaration ?"
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              submitConfirm.onFalse();
              onSubmitRow();
            }}
          >
            Soumettre
          </Button>
        }
      />
      {/* Exemple de boîte de dialogue de confirmation pour la soumission */}
      <ConfirmDialog
        open={unsubmitConfirm.value}
        onClose={unsubmitConfirm.onFalse}
        title="Mettre en édition"
        content="Voulez-vous vraiment mettre cette déclaration en édition ?"
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              unsubmitConfirm.onFalse();
              onUnSubmitRow();
            }}
          >
            Oui
          </Button>
        }
      />

      {/* Exemple de boîte de dialogue de confirmation pour la validation */}
      <ConfirmDialog
        open={validateConfirm.value}
        onClose={validateConfirm.onFalse}
        title="Valider"
        content="Voulez-vous vraiment valider cette déclaration ?"
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              validateConfirm.onFalse();
              onValidateRow();
            }}
          >
            Valider
          </Button>
        }
      />
      {/* Exemple de boîte de dialogue de confirmation pour la facturation */}
      <ConfirmDialog
        open={factureConfirm.value}
        onClose={factureConfirm.onFalse}
        title="Facturer"
        content="Voulez-vous vraiment facturer cette déclaration ?"
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              factureConfirm.onFalse();
              onFactureRow();
            }}
          >
            Facturer
          </Button>
        }
      />
      {/* Dialogue personnalisé pour le rejet avec motif */}
      <ConfirmDialog
        open={openRejetDialog}
        onClose={() => setOpenRejetDialog(false)}
        title="Rejeter"
        content={
          <TextField
            fullWidth
            label="Motif du rejet"
            multiline
            rows={3}
            value={motifRejet}
            onChange={(e) => setMotifRejet(e.target.value)}
          />
        }
        action={
          <Button
            variant="contained"
            color="error"
            disabled={!motifRejet.trim()}
            onClick={() => {
              // On passe le motif au parent via onRejetRow
              onRejetRow(motifRejet);
              setMotifRejet('');
              setOpenRejetDialog(false);
            }}
          >
            Rejeter
          </Button>
        }
      />
    </>
  );
}
