'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
// import CircularProgress from '@mui/material/CircularProgress';
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
import { useRef } from 'react';

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
  // États pour contrôler l'ouverture des dialogues share et send
  

  const view = useBoolean();
 const type = user?.type_name?.toLowerCase().trim();
//  const profil = user?.companies?.[0]?.type_name?.toLowerCase().trim() ;

  
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
      {(type === 'caissier' && currentStatus === 'UNPAID') && (
          <Tooltip title="Payer la facture">
            <IconButton onClick={() => payeurForm.onTrue()}>
              <Iconify icon="mdi:credit-card" />
            </IconButton>
          </Tooltip>
      )}
        </Stack>


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
              facture={facture}
              currentStatus={currentStatus}
            />
          </Box>
        </Box>
      </Dialog>

            <PayeurForm 
            slug={facture?.slug} 
            open={payeurForm.value} 
            onclose={payeurForm.onFalse} 
            onSuccess ={() => {
              onChangeStatus('PAID'); // Met à jour le statut local de la facture
              payeurForm.onFalse(); // Ferme la boîte de dialogue de paiement
            }} />
    </>
  );
}
