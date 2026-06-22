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
import { DeclarationPDF } from 'src/sections/overview/declaration/declaration-pdf';
import DeclarationDetailsPrint from 'src/sections/overview/declaration/declaration-print';
import { WorkPermitCard } from './permit-print';

import { usePermissions } from 'src/auth/hooks';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export function PermitToolbar({
  permit,
  currentStatus,
  statusOptions,
  onChangeStatus,
  rejectReasons = [],
}) {
  const router = useRouter();

  const [openPrint, setOpenPrint] = useState(false);

  const { can } = usePermissions();

  // const [logoData, setLogoData] = useState(null);
  const logoUrl = permit?.company?.picture;
  const proxyBase = 'https://api.allorigins.win/raw?url=';
  const proxiedLogoUrl = logoUrl ? proxyBase + encodeURIComponent(logoUrl) : null;

  const view = useBoolean();
  const validateConfirm = useBoolean();

  const rejetConfirm = useBoolean();
  const submitConfirm = useBoolean();
  const editConfirm = useBoolean();
  const unsubmitConfirm = useBoolean();
  const deliverConfirm = useBoolean();

  const printConfirm = useBoolean();

  const [openRejetDialog, setOpenRejetDialog] = useState(false);
  const [rejectForm, setRejectForm] = useState({
    reject_reason_type: '',
    reject_reason_description: '',
  });
  const [errors, setError] = useState(null);

  const componentRef = useRef(null);

  const handlePrint = () => {
    setOpenPrint(true);
  };

  const handleSubmitRow = useCallback(async () => {
    try {
      // Appel à l'API backend pour valider le permis

      const response = await axios.post(API.submitPermit(permit?.slug), {});

      if (response) {
        // Si succès, rediriger ou mettre à jour l'interface utilisateur
        toast.success('Permis soumis avec succès !');
        // Mise à jour locale du statut dans tableData
        onChangeStatus('submitted');
      } else {
        console.error('Erreur lors de la validation:', response.data.error);
        toast.error('Une erreur est survenue.');
      }
    } catch (error) {
      const errorMessage =
        error?.error ||
        error?.details ||
        error?.message ||
        error?.detail ||
        error?.non_field_errors?.[0];
      setError(errorMessage);
      console.error('Erreur réseau ou serveur:', error);
      toast.error(errorMessage);
    }
  });

  const handleUnSubmitRow = useCallback(async () => {
    try {
      // Appel à l'API backend pour mettre en edition le permis en envoyant l'action
      const response = await axios.post(API.unsubmitPermit(permit?.slug), {});

      if (response) {
        // Si succès, rediriger ou mettre à jour l'interface utilisateur
        toast.success('Le statut du permis a été remis à non soumis avec succès !');
        // Mise à jour locale du statut dans tableData
        onChangeStatus('unsubmitted');
      } else {
        console.error('Erreur lors de la mise en edition:', response.data.error);
        toast.error('Une erreur est survenue.');
      }
    } catch (error) {
      const errorMessage =
        error?.error ||
        error?.details ||
        error?.message ||
        error?.detail ||
        error?.non_field_errors?.[0];
      setError(errorMessage);
      console.error('Erreur réseau ou serveur:', error);
      toast.error(errorMessage);
    }
  });

  const handleValidateRow = useCallback(async () => {
    try {
      // Appel à l'API backend pour valider le permis en envoyant l'action
      const response = await axios.post(API.validatePermit(permit?.slug), {});

      if (response) {
        // Si succès, rediriger ou mettre à jour l'interface utilisateur
        toast.success('Permit validée avec succès !');
        // Mise à jour locale du statut dans tableData
        onChangeStatus('validated');
      } else {
        console.error('Erreur lors de la validation:', response.data.error);
        toast.error('Une erreur est survenue.');
      }
    } catch (error) {
      const errorMessage =
        error?.error ||
        error?.details ||
        error?.message ||
        error?.detail ||
        error?.non_field_errors?.[0];
      setError(errorMessage);
      console.error('Erreur réseau ou serveur:', error);
      toast.error(errorMessage);
    }
  });

  const handleDeliver = useCallback(async () => {
    try {
      // Appel à l'API backend pour rejeter la déclaration

      const response = await axios.post(API.deliverPermit(permit?.slug));
      if (response?.data) {
        // Si succès, rediriger ou mettre à jour l'interface utilisateur
        toast.success('Permis delivré avec succès !');
        // Mise à jour locale du statut dans tableData
        onChangeStatus('delivered');
      } else {
        console.error('Erreur lors de la delivraison:', response.data.error);
        toast.error('Une erreur est survenue.');
      }
    } catch (error) {
      const errorMessage =
        error?.error ||
        error?.details ||
        error?.message ||
        error?.detail ||
        error?.non_field_errors?.[0];
      setError(errorMessage);
      console.error('Erreur réseau ou serveur:', error);
      toast.error(errorMessage);
    }
  });

  const handleRejetter = useCallback(async () => {
    if (!rejectForm.reject_reason_type) {
      toast.error('Veuillez sélectionner un type de rejet');
      return;
    }
    if (!rejectForm.reject_reason_description.trim()) {
      toast.error('Veuillez ajouter une description');
      return;
    }

    try {
      const payload = {
        reject_reason_type: rejectForm.reject_reason_type,
        reject_reason_description: rejectForm.reject_reason_description,
      };

      const response = await axios.post(API.rejectPermit(permit?.slug), payload);

      if (response) {
        toast.success('Permit rejeté avec succès !');
        onChangeStatus('correction');
        setRejectForm({ reject_reason_type: '', reject_reason_description: '' });
        setOpenRejetDialog(false);
      }
    } catch (error) {
      const errorMessage =
        error?.error ||
        error?.details ||
        error?.message ||
        error?.detail ||
        error?.non_field_errors?.[0];
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [rejectForm, permit?.slug, onChangeStatus]);

  const handlePrintPermis = useCallback(async () => {
    try {
      const payload = {
        declaration_employee_slugs: [permit.slug], // ✅ Correct
      };

      const response = await axios.post(API.printPermis(), payload);

      if (response.data || response?.status === 201 || response?.status === 200) {
        toast.success('Permis imprimé avec succès ');
        return true;
      } else {
        toast.error('Une erreur est survenue lors de la communication avec le serveur.');
        return false;
      }
    } catch (error) {
      const errorMessage =
        error?.error ||
        error?.details ||
        error?.message ||
        error?.detail ||
        error?.non_field_errors?.[0] ||
        'Une erreur est survenue lors de la communication avec le serveur.';
      setError(errorMessage);
      console.error('Erreur réseau ou serveur:', error);
      toast.error(errorMessage);
    }
  }, [permit?.slug]);

  return (
    <>
      <Stack
        spacing={3}
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-end', sm: 'center' }}
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <Stack direction="row" spacing={1} flexGrow={1} sx={{ width: 1 }}>
          {/* {renderDownload} */}
          <Box sx={{ display: 'none' }}>
            <WorkPermitCard
              open={openPrint}
              onClose={() => setOpenPrint(false)}
              permit={permit}
              onPrint={handlePrintPermis}
            />
          </Box>
          {can('can_mark_as_printed') && currentStatus === 'validated' && (
            <Tooltip title="Imprimer">
              <IconButton onClick={handlePrint}>
                <Iconify icon="solar:printer-minimalistic-bold" />
              </IconButton>
            </Tooltip>
          )}

          {can('can_deliver_permit') && currentStatus === 'printed' && (
            <Tooltip title="Delivrer">
              <IconButton onClick={() => deliverConfirm.onTrue()}>
                <Iconify icon="solar:send-square-bold" />
              </IconButton>
            </Tooltip>
          )}

          {can('can_submit_declaration_employee') &&
            (currentStatus === 'rejected' || currentStatus === 'submitted') && (
              <Tooltip title="Mettre en edition">
                <IconButton onClick={() => unsubmitConfirm.onTrue()}>
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Tooltip>
            )}

          {can('can_submit_declaration_employee') &&
            (currentStatus === 'paid' || currentStatus === 'correction') && (
              <Tooltip title="Soumettre">
                <IconButton onClick={() => submitConfirm.onTrue()}>
                  <Iconify icon="mdi:check-bold" />
                </IconButton>
              </Tooltip>
            )}

          {currentStatus === 'submitted' &&
            (can('can_validate_declaration_employee') ||
              can('can_correct_declaration_employee')) && (
              <>
                {can('can_validate_declaration_employee') && (
                  <Tooltip title="Valider">
                    <IconButton onClick={() => validateConfirm.onTrue()}>
                      <Iconify icon="mdi:check-bold" />
                    </IconButton>
                  </Tooltip>
                )}

                {can('can_correct_declaration_employee') && (
                  <Tooltip title="Rejeter">
                    <IconButton onClick={() => setOpenRejetDialog(true)}>
                      <Iconify icon="material-symbols:cancel" />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
        </Stack>
      </Stack>

      {/* Exemple de boîte de dialogue de confirmation pour la soumission */}
      <ConfirmDialog
        open={submitConfirm.value}
        onClose={submitConfirm.onFalse}
        title="Soumission "
        content="Voulez-vous vraiment soumettre cet permis ?"
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
        content="Voulez-vous vraiment mettre ce dossier en édition ?"
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
        title="Validation"
        content="Voulez-vous vraiment valider cet permis ?"
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
        open={deliverConfirm.value}
        onClose={deliverConfirm.onFalse}
        title="Delivraison"
        content="Voulez-vous vraiment delivrer ce dossier ?"
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              deliverConfirm.onFalse();
              handleDeliver();
            }}
          >
            Delivrer
          </Button>
        }
      />
      {/* Dialogue personnalisé pour le rejet avec motif */}
      <ConfirmDialog
        open={openRejetDialog}
        onClose={() => {
          setOpenRejetDialog(false);
          setRejectForm({ reject_reason_type: '', reject_reason_description: '' });
        }}
        title="Rejeter le permit"
        content={
          <>
            <TextField
              select
              fullWidth
              label="Type de rejet"
              value={rejectForm.reject_reason_type}
              onChange={(e) =>
                setRejectForm((prev) => ({ ...prev, reject_reason_type: e.target.value }))
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
                setRejectForm((prev) => ({ ...prev, reject_reason_description: e.target.value }))
              }
            />
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            disabled={
              !rejectForm.reject_reason_type || !rejectForm.reject_reason_description.trim()
            }
            onClick={handleRejetter}
          >
            Confirmer le rejet
          </Button>
        }
      />
    </>
  );
}
