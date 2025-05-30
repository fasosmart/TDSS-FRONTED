import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState, useCallback, useEffect } from 'react';
import { fDate } from 'src/utils/format-time';

import { usePopover } from 'src/components/custom-popover';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';


import FilteredTable from './components/tableau';
import { DeclarationToolbar } from './declaration-toolbar';
import { DeclarationAddEmployee } from './declaration-add-employee';

import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function DeclarationDetails({ declaration, employees }) {

  const [open, setOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const [openDialog, setOpenDialog] = useState(true); // État pour le modal
  // const statusOptions = [{ value: declaration?.status, label: declaration?.status }];

  const user = useMockedUser();

  const popover = usePopover();




  const handleChangeStatus = useCallback((event) => {
    setCurrentStatus(event.target.value);
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const statusLabels = {
    UNSUBMITTED: 'Non soumise',
    SUBMITTED: 'Soumise',
    REJECTED: 'Rejetée',
    VALIDATED: 'Validée',
    BILLED: 'Facturée',
  };

  // Ajoute la couleur correspondante au statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'VALIDATED':
        return 'success';
      case 'SUBMITTED':
        return 'info';
      case 'UNSUBMITTED':
        return 'warning';
      case 'REJECTED':
        return 'error';
      case 'BILLED':
        return 'primary';
      default:
        return 'default';
    }
  };

  const statusOptions = [
    {
      value: declaration?.status,
      label: statusLabels[declaration?.status] || declaration?.status
    }
  ];

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  

  useEffect(() => {
    if (declaration?.status) {
      setCurrentStatus(declaration?.status);
    }
  }, [declaration?.status]);

  return (

    <>
{declaration?.status === 'REJECTED' && (
      <Dialog
            open={openDialog}
            onClose={() => { }}
            sx={{
              '& .MuiDialog-paper': {
                width: '40%', // Réduction de la largeur
                borderRadius: '12px', // Coins arrondis pour un look plus moderne
                padding: '5px' // Ajout de padding
              }
            }}
          >
            <DialogTitle sx={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
              Motif de rejet
            </DialogTitle>
            <DialogContent sx={{ fontSize: '14px', textAlign: 'center' }}>
              Cette declaration a été rejetée.
              <br />  
              Motif : {declaration?.reject_reason}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center' }}>
              <Button
                onClick={handleCloseDialog}
                variant="contained"
                color="primary"
                sx={{ borderRadius: '8px', padding: '6px 20px', fontSize: '14px' }}
              >
                OK
              </Button>
            </DialogActions>
          </Dialog>
          )}


      <DeclarationToolbar
        declaration={declaration}
        currentStatus={currentStatus || ''}
        onChangeStatus={(e) => {
        const value = typeof e === 'string' ? e : e.target.value;
        setCurrentStatus(value);
          }}
        statusOptions={statusOptions}
        employees={employees}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: { xs: 1, md: 2 } }}>
        {declaration?.status === 'UNSUBMITTED' && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleOpen}
            sx={{
              mb: { xs: 1, md: 1 },
              maxWidth: '100px',      // Limite la largeur du bouton
              minWidth: 'auto',
              px: 2,                  // Réduit le padding horizontal
              fontSize: '0.875rem',    // Taille de police réduite si nécessaire
            }}
          >
            Ajouter
          </Button>
        )}
      </Box>

      {/* <FormProvider > */}
      <DeclarationAddEmployee
        declaration={declaration}
        // type={type}
        open={open}
        onClose={handleClose}
      />
      {/* </FormProvider> */}
      <Card sx={{ pt: 5, px: 5 }}>
        <Box
          rowGap={5}
          display="grid"
          alignItems="center"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
        >
          <Box
            component="img"
            alt="logo"
            src={declaration?.company?.picture}
            sx={{ width: 48, height: 48 }}
          />
          <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
            <Label variant="soft" color={getStatusColor(currentStatus)}>
                        {statusLabels[currentStatus] || 'Inconnu'}
             </Label>

            <Typography variant="h6"> {declaration?.number}</Typography>
          </Stack>
          <Box
            gridColumn={{ xs: '1', sm: 'span 2' }}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={3}
          >
            <Stack sx={{ typography: 'body2' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Numero de la declaration
                <br />
                {declaration?.number}
              </Typography>
            </Stack>

            <Stack sx={{ typography: 'body2' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Date de creation
              </Typography>
              {fDate(declaration?.created_on)}
            </Stack>

            <Stack sx={{ typography: 'body2' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Montant Total
              </Typography>
              {declaration?.total_amount} GNF
            </Stack>
          </Box>
        </Box>
        <Divider sx={{ mt: 5, borderStyle: 'dashed' }} mb={4} />

        {declaration && (<FilteredTable declaration={declaration} employees={employees} />)}

        <Divider sx={{ mt: 5, borderStyle: 'dashed' }} />
      </Card>
    </>
  );
}