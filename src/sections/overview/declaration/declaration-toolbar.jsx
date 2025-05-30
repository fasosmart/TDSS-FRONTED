'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import NoSsr from '@mui/material/NoSsr';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import axios from 'src/utils/axios';
import API from 'src/utils/api';
import { useRef, useState, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';

// import { ShareSendDialog } from './components/ShareSendDialog';
import { DeclarationPDF } from './declaration-pdf';
import DeclarationDetailsPrint from './declaration-print';

import { useMockedUser } from 'src/auth/hooks';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { toast } from 'src/components/snackbar';


// ----------------------------------------------------------------------

export function DeclarationToolbar({
  declaration,
  currentStatus,
  statusOptions,
  onChangeStatus,
  employees,

}) {
  const router = useRouter();

  const {user} = useMockedUser();
  const type = user?.type_name?.toLowerCase().trim();
  const profil = user?.companies[0]?.type_name?.toLowerCase().trim();


 
  // const [logoData, setLogoData] = useState(null);
  const logoUrl = declaration?.company.picture;
  const proxyBase = 'https://api.allorigins.win/raw?url=';
  const proxiedLogoUrl = logoUrl
  ? proxyBase + encodeURIComponent(logoUrl)
  : null;


    const view = useBoolean();
  // Pour la validation (exemple)
    const validateConfirm = useBoolean();
    // Pour la facturation (exemple)
    const factureConfirm = useBoolean();
    // Pour la soumission
    const submitConfirm = useBoolean();
    // Pour la mise en édition
    const unsubmitConfirm = useBoolean();
   // Pour le dialogue de rejet
    const [openRejetDialog, setOpenRejetDialog] = useState(false);
    const [motifRejet, setMotifRejet] = useState('');
    const [error, setError] = useState(null);

  


  const handleEdit = useCallback(() => {
    router.push(paths.dashboard.declaration.edit(`${declaration?.slug}`));
  }, [declaration?.slug, router]);

  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Declaration_${declaration?.reference}`,
    onAfterPrint: () => console.log('Impression terminée'),
  });

  

  
   const handleSubmitRow = useCallback(
      async () => {
        try {
          // Appel à l'API backend pour valider la déclaration en envoyant l'action
         
          const response = await axios.post(API.submitDeclaration(declaration?.slug), {
  
          });
  
          if (response) {
            // Si succès, rediriger ou mettre à jour l'interface utilisateur
            toast.success('Déclaration soumise avec succès !');
            // Mise à jour locale du statut dans tableData
            onChangeStatus('SUBMITTED');
          } else {
            console.error('Erreur lors de la validation:', response.data.error);
            toast.error('Une erreur est survenue.');
          }
        } catch (error) {
          const errorMessage = error?.error || error?.details || error?.message || error?.detail;
          setError(errorMessage)
          console.error('Erreur réseau ou serveur:', error);
          toast.error(errorMessage);
        }
      },
     
    );
  
  
    const handleUnSubmitRow = useCallback(
      async () => {
        try {
          // Appel à l'API backend pour valider la déclaration en envoyant l'action
          const response = await axios.post(API.unsubmitDeclaration(declaration?.slug), {
  
          });
  
          if (response) {
            // Si succès, rediriger ou mettre à jour l'interface utilisateur
            toast.success('Le statut de la déclaration a été remis à non soumis avec succès !');
            // Mise à jour locale du statut dans tableData
           onChangeStatus('UNSUBMITTED');
          } else {
            console.error('Erreur lors de la validation:', response.data.error);
            toast.error('Une erreur est survenue.');
          }
        } catch (error) {
          const errorMessage = error?.error || error?.details || error?.message || error?.detail;
          setError(errorMessage)
          console.error('Erreur réseau ou serveur:', error);
          toast.error(errorMessage);
        }
      },
     
    );
  
    const handleValidateRow = useCallback(
      async () => {
        try {
          // Appel à l'API backend pour valider la déclaration en envoyant l'action
          const response = await axios.post(API.validateDeclaration(declaration?.slug), {
  
          });
  
          if (response) {
            // Si succès, rediriger ou mettre à jour l'interface utilisateur
            toast.success('Déclaration validée avec succès !');
            // Mise à jour locale du statut dans tableData
            onChangeStatus('VALIDATED');
          } else {
            console.error('Erreur lors de la validation:', response.data.error);
            toast.error('Une erreur est survenue.');
          }
        } catch (error) {
          const errorMessage = error?.error || error?.details || error?.message || error?.detail;
          setError(errorMessage)
          console.error('Erreur réseau ou serveur:', error);
          toast.error(errorMessage);
        }
      },
    );
  
  
    const handleFacturer = useCallback(
      async () => {
        try {
          // Appel à l'API backend pour rejeter la déclaration
          const response = await axios.post(API.facturerDeclaration(declaration?.slug));
          if (response) {
            // Si succès, rediriger ou mettre à jour l'interface utilisateur
            toast.success('Déclaration facturée avec succès !');
            // Mise à jour locale du statut dans tableData
            onChangeStatus('BILLED');
          } else {
            console.error('Erreur lors de la facturation:', response.data.error);
            toast.error('Une erreur est survenue.');
          }
        } catch (error) {
          const errorMessage = error?.error || error?.details || error?.message || error?.detail;
          setError(errorMessage)
          console.error('Erreur réseau ou serveur:', error);
          toast.error(errorMessage);
        }
      },
    );
  
    const handleRejetter = useCallback(
      async ( motifRejet) => {
        try {
          // Appel à l'API backend pour rejeter la déclaration
          const response = await axios.post(API.rejetterDeclaration(declaration?.slug), {
            reject_reason: motifRejet
          });
          if (response) {
          toast.success('Déclaration rejetée avec succès !');
          onChangeStatus('REJECTED');
          } else {
            console.error('Erreur lors du rejet :', response.data.error);
            toast.error('Une erreur est survenue.');
          }
        } catch (error) {
          const errorMessage = error?.error || error?.details || error?.message || error?.detail;
          setError(errorMessage)
          console.error('Erreur réseau ou serveur:', error);
          toast.error(errorMessage);
        }
      },
     
    );
  
  

  const renderDownload = (
    <NoSsr>
      {declaration && (
        <PDFDownloadLink
          document={declaration ? <DeclarationPDF declaration={declaration} employees={employees}  logoUrl={proxiedLogoUrl}/> : ''}
          fileName={declaration?.number}
          style={{ textDecoration: 'none' }}
        >
          {({ loading }) => (
            <Tooltip title="Telecharger">
              <IconButton>
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <Iconify icon="eva:cloud-download-fill" />
                )}
              </IconButton>
            </Tooltip>
          )}
        </PDFDownloadLink>
      )}
    </NoSsr>
  );

  return (
    <>
      <Stack
        spacing={3}
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-end', sm: 'center' }}
        sx={{ mb: { xs: 3, md: 5 } }}
      >

        <Stack direction="row" spacing={1} flexGrow={1} sx={{ width: 1 }}>
          {(type === 'admin' && profil === 'tdss') && declaration?.status === 'UNSUBMITTED' && (
            <Tooltip title="Modifier">
              <IconButton 
              onClick={handleEdit}>
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
          )}
          {renderDownload}
          <Box sx={{ display: 'none' }}>
            <DeclarationDetailsPrint ref={componentRef} declaration={declaration} employees={employees} />
          </Box>

          <Tooltip title="Imprimer">
            <IconButton onClick={handlePrint}>
              <Iconify icon="solar:printer-minimalistic-bold" />
            </IconButton>
          </Tooltip>

          {(type === 'agent' && currentStatus ==='REJECTED') && (
          <Tooltip title="Mettre en edition">
            <IconButton onClick={() => unsubmitConfirm.onTrue()}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>
          )}

          {(type === 'agent' && currentStatus ==='UNSUBMITTED') && (
          <Tooltip title="Soumettre">
            <IconButton onClick={() => submitConfirm.onTrue()}>
              <Iconify icon="mdi:check-bold" />
            </IconButton>
          </Tooltip>
          )}

          {(type === 'aguipe' && 
          profil === 'aguipe' && 
          currentStatus ==='SUBMITTED') && (
          <>
           <Tooltip title="Valider">
            <IconButton onClick={() => validateConfirm.onTrue()}>
              <Iconify icon="mdi:check-bold" />
            </IconButton>
          </Tooltip>
         

          
           <Tooltip title="Rejeter">
            <IconButton onClick={() => setOpenRejetDialog(true)}>
              <Iconify icon="material-symbols:cancel" />
            </IconButton>
          </Tooltip>
          </>
          )}

          {(type === 'comptable' && 
          currentStatus ==='VALIDATED') && (
       <Tooltip title="Facturer">
            <IconButton onClick={() => factureConfirm.onTrue()}>
              <Iconify icon="mdi:credit-card" />
            </IconButton>
          </Tooltip>
           )}
        </Stack>
         

        <TextField
          fullWidth
          select
          label="Status"
          value={currentStatus}
          onChange={onChangeStatus}
          sx={{ maxWidth: 160 }}
          slotProps={{
            htmlInput: { id: `status-select-label` },
            inputLabel: { htmlFor: `status-select-label` }
          }}>
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      
      <Dialog fullScreen open={view.value}>
        <Box sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <DialogActions sx={{ p: 1.5 }}>
            <Button color="inherit" variant="contained" onClick={view.onFalse}>
              Close
            </Button>
          </DialogActions>

          <Box sx={{ flexGrow: 1, height: 1, overflow: 'hidden' }}>
            <PDFViewer
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              declaration={declaration}
              currentStatus={currentStatus}
            />
          </Box>
        </Box>
      </Dialog>
      
      
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
                    handleSubmitRow();
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
                    handleUnSubmitRow();
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
                    handleValidateRow();
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
                    handleFacturer();
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
                    handleRejetter(motifRejet);
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
