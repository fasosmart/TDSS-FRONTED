import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import { useBoolean } from 'src/hooks/use-boolean';

import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';

import { usePermissions } from 'src/auth/hooks';

import { UserQuickEditForm } from './user-quick-edit-form';

// ----------------------------------------------------------------------

export function UserTableRow({
  row,
  selected,
  onEditRow,
  onSelectRow,
  onDeleteRow,
  onViewRow,
  onUpdateRow,
}) {
  const confirm = useBoolean();

  const popover = usePopover();

  const quickEdit = useBoolean();

  const { can } = usePermissions();

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
        <TableCell padding="checkbox">
          {/* <BpCheckbox id={row.slug} checked={selected} onClick={onSelectRow} /> */}
        </TableCell>

        <TableCell>
          <Stack spacing={2} direction="row" alignItems="center">
            <Avatar alt={row?.first_name} src={row.picture} />

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link
                color="inherit"
                onClick={onEditRow}
                sx={{ cursor: 'pointer' }}
                underline="hover"
              >
                {row.name}
              </Link>
              <Box component="span" sx={{ color: 'text.disabled' }}>
                {row.email}
              </Box>
            </Stack>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.phone}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.profile}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.type}</TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.is_active === true && 'success') ||
              (row.is_active === false && 'warning') ||
              // (row.status === 'banned' && 'error') ||
              'default'
            }
          >
            {row.is_active === true ? 'Actif' : 'Inactif'}
          </Label>
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center">
            {/* <Tooltip title="Quick Edit" placement="top" arrow>
              <IconButton
                color={quickEdit.value ? 'inherit' : 'default'}
                // onClick={quickEdit.onTrue}
                onClick={(e) => {
                  e.stopPropagation();
                  quickEdit.onTrue(e);
                }}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip> */}

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

      <UserQuickEditForm
        currentUser={row}
        open={quickEdit.value}
        onClose={quickEdit.onFalse}
        onUpdateRow={onUpdateRow}
      />

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

          {can('can_edit_user') && (
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

          {/* Suppression désactivée au niveau produit. Pour la réactiver, dégater par can_delete_user :
          {can('can_delete_user') && (
            <MenuItem
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Supprimer
            </MenuItem>
          )} */}
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
    </>
  );
}
