'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
// import NoSsr from '@mui/material/NoSsr';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
// import { BlobProvider } from '@react-pdf/renderer';
// import { saveAs } from 'file-saver';
import { PDFViewer } from '@react-pdf/renderer';
// import axios from 'src/utils/axios';
import { useRef, useState } from 'react';

import { useReactToPrint } from 'react-to-print';

import { useRouter } from 'src/routes/hooks';
// import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';
import { PayeurForm } from './form-factures';

import { generateFacturePDF } from './facture-pdf';
// import { FactureDetails } from './facture-details';

// ----------------------------------------------------------------------

export function FactureToolbar({
  facture,
  user,
  currentStatus,
  onChangeStatus,
  devise

}) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const view = useBoolean();
  
 const type = user?.type_name?.toLowerCase().trim();
//  const profil = user?.companies?.[0]?.type_name?.toLowerCase().trim() ;

const handlePreview = async () => {
    setLoading(true);

    try {
      // 1. génération (aucun onglet n’est encore ouvert)
      const pdfBytes = await generateFacturePDF(facture, devise, { download: false });

      // 2. création de l’URL blob
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);

      // 3. ouverture du nouvel onglet une fois prêt
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erreur génération PDF :', error);
      // → facultatif : afficher un snackbar / toast d’erreur ici
    } finally {
      setLoading(false);
    }
  };

// const handlePreview = async () => {
//   const bytes = await generateFacturePDF(facture, devise, { download: false });
//   const blob = new Blob([bytes], { type: 'application/pdf' });
//   setPreviewUrl(URL.createObjectURL(blob));
//   view.onTrue();
// };
  
  const payeurForm = useBoolean();
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Declaration_${facture?.numero}`,
    onAfterPrint: () => console.log('Impression terminée'),
  });

  
 

  // const renderDownload = (
  //   <NoSsr>
  //     {facture && (
  //       <BlobProvider document={<FacturePDF facture={facture} devise={devise} />}>
  //         {({ blob, url, loading, error }) => (
  //           <Tooltip title="Télécharger">
  //             <span>
  //               <IconButton
  //                 onClick={() => {
  //                   if (blob) saveAs(blob, `Facture_${facture.number}.pdf`);
  //                 }}
  //                 disabled={loading || error}
  //               >
  //                 {loading ? <CircularProgress size={24} /> : <Iconify icon="eva:cloud-download-fill" />}
  //               </IconButton>
  //             </span>
  //           </Tooltip>
  //         )}
  //       </BlobProvider>
  //     )}
  //   </NoSsr>
  // );

  return (
    <>
      <Stack
        spacing={3}
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-end', sm: 'center' }}
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <Stack direction="row" spacing={1} flexGrow={1} sx={{ width: 1 }}>
          
          {/* Bouton d'aperçu PDF */}
          <Tooltip title="Aperçu PDF">
             <span>
        <IconButton onClick={handlePreview} disabled={loading}>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <Iconify icon="eva:eye-fill" />
          )}
        </IconButton>
      </span>
          </Tooltip>

        <IconButton onClick={() => generateFacturePDF(facture, devise)}>
          <Iconify icon="eva:cloud-download-fill" />
        </IconButton>

          {/* {renderDownload} */}
          <Box sx={{ display: 'none' }}>
            {/* <FactureDetails ref={componentRef}  /> */}
          </Box>

          {/* <Tooltip title="Imprimer">
            <IconButton onClick={handlePrint}>
              <Iconify icon="solar:printer-minimalistic-bold" />
            </IconButton>
          </Tooltip> */}
      {((type === 'caissier'|| type === 'comptable') && currentStatus === 'unpaid') && (
          <Tooltip title="Payer la facture">
            <IconButton onClick={() => payeurForm.onTrue()}>
              <Iconify icon="mdi:credit-card" />
            </IconButton>
          </Tooltip>
      )}
        </Stack>


      </Stack>

      
     
      <Dialog 
      fullScreen 
      open={view.value}
      onClose={view.onFalse}
      sx={{ '& .MuiDialog-paper': { width: '100%', height: '100%' } }}
      >
        <Box sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <DialogActions sx={{ p: 1.5 }}>
            <Button color="inherit" variant="contained" onClick={view.onFalse}>
              Fermer
            </Button>
          </DialogActions>

          <Box sx={{ flexGrow: 1, height: 1, overflow: 'hidden' }}>
             <iframe src={previewUrl ?? ''} style={{ width: '100%', height: '100%', border: 'none' }} />
          </Box>
        </Box>
      </Dialog>

            <PayeurForm 
            slug={facture?.slug} 
            open={payeurForm.value} 
            onclose={payeurForm.onFalse} 
            onSuccess ={() => {
              onChangeStatus('paid'); // Met à jour le statut local de la facture
              payeurForm.onFalse(); // Ferme la boîte de dialogue de paiement
            }} />
    </>
  );
}