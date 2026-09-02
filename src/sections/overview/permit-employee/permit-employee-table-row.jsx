'use client';
import { useState } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import { useBoolean } from 'src/hooks/use-boolean';

import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';

import { fDate } from 'src/utils/format-time';
import { usePermissions } from 'src/auth/hooks';

export function TableRowComPermit({
  row,
  selected,
  onEditRow,
  onSelectRow,
  onDeleteRow,
  onViewRow,
  onValidateRow,
  onRejetRow,
  onSubmitRow,
  onUnsubmitRow,
  onDeliverRow,
  onPrintRow,
  visibleColumns,
  rejectReasons,
}) {
  const confirm = useBoolean();

  const popover = usePopover();

  const { can } = usePermissions();

  const quickEdit = useBoolean();

  const validateConfirm = useBoolean();

  const rejetConfirm = useBoolean();
  const submitConfirm = useBoolean();
  const editConfirm = useBoolean();
  const unsubmitConfirm = useBoolean();
  const deliverConfirm = useBoolean();

  const printConfirm = useBoolean();
  const isSelectable = can('can_mark_as_printed') && Boolean(onSelectRow);

  const [rejectForm, setRejectForm] = useState({
    reject_reason_type: '',
    reject_reason_description: '',
  });

  // Remplace handleConfirmRejet par ceci :

  const handleConfirmRejet = () => {
    if (!rejectForm.reject_reason_type) {
      toast.error('Veuillez sélectionner un type de rejet');
      return;
    }

    if (!rejectForm.reject_reason_description.trim()) {
      toast.error('Veuillez ajouter une description');
      return;
    }

    onRejetRow(rejectForm);

    setRejectForm({
      reject_reason_type: '',
      reject_reason_description: '',
    });

    rejetConfirm.onFalse();
  };

  const statusLabels = {
    unsubmitted: 'non soumise',
    submitted: 'soumise',
    rejected: 'rejetée',
    validated: 'validée',
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'printed':
        return 'success';
      case 'delivered':
        return 'primary';
      case 'submitted':
        return 'info';
      case 'rejected':
        return 'error';
      case 'validated':
        return 'success';
      case 'processing':
        return 'warning';
      case 'billed':
        return 'info';
      case 'paid':
        return 'success';
      case 'correction':
        return 'warning';
      case 'expired':
        return 'error';

      default:
        return 'default';
    }
  };

  return (
    <>
      <TableRow
        hover
        selected={selected}
        aria-checked={selected}
        tabIndex={-1}
        onClick={onViewRow}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        {isSelectable && (
          <TableCell padding="checkbox">
            <Checkbox
              id={row.slug}
              checked={selected}
              onClick={(e) => {
                e.stopPropagation(); // Empêche le clic sur la checkbox de se propager au TableRow
                onSelectRow(e);
              }}
            />
          </TableCell>
        )}

        {/* {visibleColumns.includes('number') && (
          <TableCell sx={{ whiteSpace: 'nowrap' }}>{row?.number}</TableCell>
        )} */}

        {/* {visibleColumns.includes('reference') && (
          <TableCell sx={{ whiteSpace: 'nowrap' }}>{row?.reference}</TableCell>
        )} */}

        {visibleColumns.includes('passport') && (
          <TableCell sx={{ whiteSpace: 'nowrap' }}>{row?.passport_number}</TableCell>
        )}

        {visibleColumns.includes('name') && (
          <TableCell>
            <ListItemText
              primary={row?.first}
              secondary={row?.last}
              slotProps={{
                primary: { typography: 'body2', noWrap: true },
                secondary: { mt: 0.5, component: 'span', typography: 'caption' },
              }}
            />
          </TableCell>
        )}
        {visibleColumns.includes('phone') && <TableCell>{row.phone}</TableCell>}

        {/* {visibleColumns.includes('sexe') && <TableCell>{row.sexe}</TableCell>} */}

        {/* {visibleColumns.includes('country') && <TableCell>{row.country}</TableCell>} */}

        {visibleColumns.includes('function') && <TableCell>{row.job?.name}</TableCell>}

        {visibleColumns.includes('entreprise') && <TableCell>{row.company_name}</TableCell>}

        {visibleColumns.includes('contract_starts_at') && (
          <TableCell>{fDate(row.contract_starts_at)}</TableCell>
        )}

        {visibleColumns.includes('contract_duration') && (
          <TableCell>{row.contract_duration} mois</TableCell>
        )}

        {visibleColumns.includes('type') && <TableCell>{row.job?.permit}</TableCell>}

        {visibleColumns.includes('typedec') && <TableCell>{row.type_display}</TableCell>}
        {visibleColumns.includes('created_on') && <TableCell>{fDate(row.created_on)}</TableCell>}

        {visibleColumns.includes('card_expires_at') && (
          <TableCell>{fDate(row.card_expires_at)}</TableCell>
        )}

        {visibleColumns.includes('statut') && (
          <TableCell>
            <Label variant="soft" color={getStatusColor(row.status)}>
              {row.status_display || 'Inconnu'}
            </Label>
          </TableCell>
        )}
        <TableCell>
          <Stack direction="row" alignItems="center">
            <IconButton
              color={popover.open ? 'inherit' : 'default'}
              onClick={(e) => {
                e.stopPropagation(); // Empêche la propagation vers le TableRow
                popover.onOpen(e); // Passe l'événement à la fonction onOpen
              }}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          {can('can_submit_declaration_employee') &&
            (row.status === 'paid' || row.status === 'correction') && (
              <MenuItem
                onClick={() => {
                  submitConfirm.onTrue();
                  popover.onClose();
                }}
                sx={{ color: 'success.main' }}
              >
                <Iconify icon="mdi:check-bold" />
                Soumettre
              </MenuItem>
            )}

          {row.status === 'submitted' &&
            can('can_validate_declaration_employee') && (
              <MenuItem
                onClick={() => {
                  validateConfirm.onTrue();
                  popover.onClose();
                }}
                sx={{ color: 'success.main' }}
              >
                <Iconify icon="solar:check-bold" />
                Valider
              </MenuItem>
            )}

          {row.status === 'submitted' &&
            can('can_correct_declaration_employee') && (
              <MenuItem
                onClick={() => {
                  rejetConfirm.onTrue();
                  popover.onClose();
                }}
                sx={{ color: 'error.main' }}
              >
                <Iconify icon="solar:check-bold" />
                Rejeter
              </MenuItem>
            )}

          {can('can_mark_as_printed') && row.status === 'validated' && (
            <MenuItem
              onClick={() => {
                printConfirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'success.main' }}
            >
              <Iconify icon="solar:printer-minimalistic-bold" />
              imprimer le permis
            </MenuItem>
          )}

          {can('can_deliver_permit') && row.status === 'printed' && (
            <MenuItem
              onClick={() => {
                deliverConfirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'success.main' }}
            >
              <Iconify icon="mdi:check-bold" />
              Livrer
            </MenuItem>
          )}

          <MenuItem
            onClick={() => {
              popover.onClose();
              onViewRow();
            }}
            sx={{ color: 'info.main' }}
          >
            <Iconify icon="solar:eye-bold" />
            Voir
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Supprimer"
        content="Etes vous sur de vouloir supprimer?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Supprimer
          </Button>
        }
      />

      <ConfirmDialog
        open={submitConfirm.value}
        onClose={submitConfirm.onFalse}
        title="Soumettre"
        content="Etes vous sur de vouloir soumettre ce dossier?"
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              onSubmitRow();
              submitConfirm.onFalse();
            }}
          >
            Soumettre
          </Button>
        }
      />

      <ConfirmDialog
        open={validateConfirm.value}
        onClose={validateConfirm.onFalse}
        title="Valider"
        content="Etes vous sur de vouloir valider ce dossier?"
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              onValidateRow();
              validateConfirm.onFalse();
            }}
          >
            Valider
          </Button>
        }
      />

      <ConfirmDialog
        open={deliverConfirm.value}
        onClose={deliverConfirm.onFalse}
        title="Delivrer"
        content="Etes vous sur de vouloir delivrer ce dossier?"
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              onDeliverRow();
              deliverConfirm.onFalse();
            }}
          >
            Delivrer
          </Button>
        }
      />

      <ConfirmDialog
        open={printConfirm.value}
        onClose={printConfirm.onFalse}
        title="Imprimer"
        content="Etes vous sur de vouloir imprimer ce dossier?"
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              onPrintRow();
              printConfirm.onFalse();
            }}
          >
            Imprimer
          </Button>
        }
      />

      <ConfirmDialog
        open={unsubmitConfirm.value}
        onClose={unsubmitConfirm.onFalse}
        title="Mettre en édition"
        content="Etes vous sur de vouloir mettre en édition ce dossier?"
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              onUnsubmitRow();
              unsubmitConfirm.onFalse();
            }}
          >
            Mettre en édition
          </Button>
        }
      />

      <ConfirmDialog
        open={rejetConfirm.value}
        onClose={() => {
          rejetConfirm.onFalse();
          setRejectForm({
            reject_reason_type: '',
            reject_reason_description: '',
          });
        }}
        title="Rejeter le permis"
        content={
          <>
            <TextField
              select
              fullWidth
              label="Type de rejet"
              value={rejectForm.reject_reason_type}
              onChange={(e) =>
                setRejectForm((prev) => ({
                  ...prev,
                  reject_reason_type: e.target.value,
                }))
              }
              sx={{ mb: 2, mt: 1 }}
            >
              {rejectReasons?.map((reason) => (
                <MenuItem key={reason.slug} value={reason.slug}>
                  {reason.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              placeholder="Ajouter la raison détaillée du rejet"
              value={rejectForm.reject_reason_description}
              onChange={(e) =>
                setRejectForm((prev) => ({
                  ...prev,
                  reject_reason_description: e.target.value,
                }))
              }
            />
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleConfirmRejet}>
            Confirmer le rejet
          </Button>
        }
      />
    </>
  );
}
