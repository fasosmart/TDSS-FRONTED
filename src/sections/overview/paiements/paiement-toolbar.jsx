'use client';

// eslint-disable-next-line import/no-extraneous-dependencies
// import PropTypes from 'prop-types';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { useReactToPrint } from 'react-to-print';
import { useCallback, useState } from 'react';
import axios from 'src/utils/axios';
import API from 'src/utils/api';
import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import NoSsr from '@mui/material/NoSsr';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';
import { Iconify } from 'src/components/iconify';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { usePermissions } from 'src/auth/hooks';
import { PaiementPDF } from './paiement-pdf';
import { UpdatePaiement } from './paiement-update';

// ----------------------------------------------------------------------

export function PaiementToolbar({ payment, componentRef, currentStatus, onChangeStatus }) {
  const { can } = usePermissions();
  const view = useBoolean();
  const confirm = useBoolean();
  const updateConfirm = useBoolean();
  const deleteConfirm = useBoolean();

  const router = useRouter();

  const [error, setError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!payment) return;

    setDownloadLoading(true);
    try {
      const blob = await pdf(<PaiementPDF payment={payment} />).toBlob();
      saveAs(blob, `recu-paiement-${payment?.number || ''}.pdf`);
    } catch (err) {
      toast.error('Impossible de télécharger le reçu de paiement.');
    } finally {
      setDownloadLoading(false);
    }
  }, [payment]);

  const handleValidate = useCallback(async (slug) => {
    try {
      const response = await axios.post(API.validatePayment(slug));

      if (response.data || response.status === 200) {
        toast.success('Paiement validé avec succès');
        onChangeStatus('validated');
      } else {
        toast.error('Erreur lors de la validation du paiement');
      }
    } catch (error) {
      const errorMessage = error?.error || error?.details || error?.message || error?.detail;
      setError(errorMessage);
      toast.error(`Erreur lors de la validation du paiement : ${error}`);
    }
  });

  const handleDelete = useCallback(
    async (slug) => {
      try {
        const response = await axios.delete(API.removePayment(slug));

        if (response || response.data || response.status === 200) {
          toast.success('Paiement supprimé avec succès');
          router.push(paths.dashboard.paiements.list);
        } else {
          toast.error('Erreur lors de la validation du paiement');
        }
      } catch (error) {
        const errorMessage = error?.error || error?.details || error?.message || error?.detail;
        setError(errorMessage);
        toast.error(`Erreur lors de la validation du paiement : ${errorMessage}`);
      }
    },
    [router]
  );

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Recu_Paiement_${payment?.reference || payment?.number || 'sans-reference'}`,
    onAfterPrint: () => console.log('Impression terminée'),
  });

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
            <IconButton onClick={view.onTrue}>
              <Iconify icon="eva:eye-fill" />
            </IconButton>
          </Tooltip>

          {/* Bouton de téléchargement PDF */}
          <NoSsr>
            {payment ? (
              <Tooltip title="Télécharger">
                <span>
                  <IconButton onClick={handleDownload} disabled={downloadLoading}>
                    {downloadLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <Iconify icon="eva:cloud-download-fill" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
          </NoSsr>

          {/* Bouton d'impression */}
          <Tooltip title="Imprimer">
            <IconButton onClick={handlePrint}>
              <Iconify icon="eva:printer-fill" />
            </IconButton>
          </Tooltip>

          {/* Bouton de validation */}
          {currentStatus === 'pending' && (
            <>
              {can('can_validate_payment') && (
                <Tooltip title="Valider">
                  <IconButton onClick={() => confirm.onTrue()}>
                    <Iconify icon="eva:checkmark-circle-2-fill" />
                  </IconButton>
                </Tooltip>
              )}
              {can('can_edit_payment') && (
                <Tooltip title="Modifier">
                  <IconButton onClick={() => updateConfirm.onTrue()}>
                    <Iconify icon="eva:edit-2-fill" />
                  </IconButton>
                </Tooltip>
              )}
              {can('can_delete_payment') && (
                <Tooltip title="Supprimer">
                  <IconButton onClick={() => deleteConfirm.onTrue()}>
                    <Iconify icon="eva:trash-2-outline" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Stack>
      </Stack>
      {/* Dialogue d'aperçu PDF */}
      <Dialog
        fullScreen
        open={view.value}
        onClose={view.onFalse}
        PaperProps={{
          sx: { maxWidth: 'calc(100% - 24px)', maxHeight: 'calc(100% - 24px)' },
        }}
      >
        <DialogActions sx={{ py: 2, px: 3 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Aperçu du reçu de paiement
          </Typography>

          {payment && (
            <Button
              color="primary"
              variant="contained"
              startIcon={<Iconify icon="eva:download-fill" />}
              disabled={downloadLoading}
              onClick={handleDownload}
            >
              {downloadLoading ? 'Chargement...' : 'Télécharger'}
            </Button>
          )}

          <IconButton onClick={view.onFalse}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </DialogActions>

        <DialogContent sx={{ p: 0, height: '100%' }}>
          {payment && (
            <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
              <PaiementPDF payment={payment} />
            </PDFViewer>
          )}
        </DialogContent>
      </Dialog>

      <UpdatePaiement
        paiement={payment}
        open={updateConfirm.value}
        onclose={updateConfirm.onFalse}
      />

      {/* Dialogue de confirmation de validation */}
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Valider le paiement"
        content="Êtes-vous sûr de vouloir valider ce paiement ?"
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              handleValidate(payment.slug);
              confirm.onFalse();
            }}
          >
            Valider
          </Button>
        }
      />

      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Supprimer le paiement"
        content="Êtes-vous sûr de vouloir supprimer ce paiement ?"
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDelete(payment?.slug);
              deleteConfirm.onFalse();
            }}
          >
            Supprimer
          </Button>
        }
      />
    </>
  );
}

// PaiementToolbar.propTypes = {
//   payment: PropTypes.shape({
//     reference: PropTypes.string,
//     number: PropTypes.string,
//   }),
//   componentRef: PropTypes.shape({
//     // eslint-disable-next-line react/forbid-prop-types
//     current: PropTypes.any,
//   }),
// };
