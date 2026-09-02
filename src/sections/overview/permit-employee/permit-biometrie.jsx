import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import axios from 'src/utils/axios';
import API from 'src/utils/api';
import { usePermissions } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function BiometricData({
  picture,
  signature,
  fingerprints_picture,
  onUpdate,
  employee_slug,
  status,
  abisLastRetrievedAt,
}) {
  const { can } = usePermissions();
  const [openPreview, setOpenPreview] = useState(false);
  const [previewData, setPreviewData] = useState({ type: '', url: '' });

  // États séparés pour chaque type de donnée biométrique
  const [pictureDialog, setPictureDialog] = useState(false);
  const [signatureDialog, setSignatureDialog] = useState(false);
  const [fingerprintsDialog, setFingerprintsDialog] = useState(false);

  const [pictureFile, setPictureFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [fingerprintsFile, setFingerprintsFile] = useState(null);

  const [picturePreview, setPicturePreview] = useState(picture || '');
  const [signaturePreview, setSignaturePreview] = useState(signature || '');
  const [fingerprintsPreview, setFingerprintsPreview] = useState(fingerprints_picture || '');

  const [loadingPicture, setLoadingPicture] = useState(false);
  const [loadingSignature, setLoadingSignature] = useState(false);
  const [loadingFingerprints, setLoadingFingerprints] = useState(false);
  const [loadingABIS, setLoadingABIS] = useState(false);
  const abisActionLabel = 'Récupérer les données';

  // L'utilisateur peut-il déclencher la récupération des données ABIS ?
  const canRetrieveABIS =
    can('can_retrieve_abis_data') &&
    status !== 'printed' &&
    status !== 'delivered' &&
    status !== 'enrolled';

  const handleOpenPreview = (type, url) => {
    setPreviewData({ type, url });
    setOpenPreview(true);
  };

  // Fonction générique pour gérer le changement de fichier
  const handleFileChange = (type, file, setFile, setPreview) => {
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFetchABIS = useCallback(async () => {
    setLoadingABIS(true);
    try {
      const response = await axios.get(API.getEmployeeFromABIS(employee_slug));
      const data = response.data; // 👈 très important

      if (data.success) {
        toast.success(data.message || 'Données biométriques récupérées avec succès');

        // Exemple : afficher infos utiles
        if (data?.biometrics_status && !data.biometrics_status.is_complete) {
          toast.warning(
            `Biométrie incomplète :
           Face: ${data.biometrics_status.has_face ? '✔' : '❌'},
           Empreintes: ${data.biometrics_status.fingerprints_count}`
          );
        }

        if (data?.biometrics_status && !data.biometrics_status.has_signature) {
          toast.info("La signature n'est pas récupérée depuis ABIS, ajoutez-la manuellement.");
        }

        if (!data.is_enrolled) {
          toast.info('Employé non encore enrôlé ');
        }

        window.location.reload();
      } else {
        toast.error(data.message || 'Échec de récupération des données biométriques');
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        'Erreur inconnue';

      toast.error(errorMessage);
    } finally {
      setLoadingABIS(false);
    }
  }, [employee_slug]);

  // Fonction générique pour sauvegarder un fichier
  const handleSaveFile = useCallback(
    async (fieldName, file, setLoading, setDialog, originalValue) => {
      if (!file) {
        toast.warning('Aucun fichier sélectionné');
        return;
      }

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append(fieldName, file);

        const response = await axios.patch(API.updateFile(employee_slug), formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        toast.success(
          `${fieldName === 'picture' ? 'Photo' : fieldName === 'signature' ? 'Signature' : 'Empreintes digitales'} mise à jour avec succès`
        );

        if (onUpdate) {
          onUpdate(response.data);
        }

        setDialog(false);

        // Réinitialiser le fichier après succès
        if (fieldName === 'picture') setPictureFile(null);
        if (fieldName === 'signature') setSignatureFile(null);
        if (fieldName === 'fingerprints_picture') setFingerprintsFile(null);
      } catch (error) {
        const errorMessage =
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.response?.data?.[fieldName]?.[0] ||
          error?.message ||
          'Erreur lors de la mise à jour';
        toast.error(errorMessage);

        // Restaurer l'aperçu original en cas d'erreur
        if (fieldName === 'picture') setPicturePreview(originalValue);
        if (fieldName === 'signature') setSignaturePreview(originalValue);
        if (fieldName === 'fingerprints_picture') setFingerprintsPreview(originalValue);
      } finally {
        setLoading(false);
      }
    },
    [employee_slug, onUpdate]
  );

  const BiometricCard = ({ type, label, icon, url, color = 'primary', onEdit }) => {
    const hasData = !!url;

    return (
      <Card
        sx={{
          p: 3,
          height: '100%',
          boxShadow: (theme) => theme.customShadows?.card,
          transition: 'all 0.3s ease-in-out',
          border: '2px solid',
          borderColor: hasData ? `${color}.lighter` : 'divider',
          '&:hover': {
            boxShadow: (theme) => theme.customShadows?.z8,
            borderColor: `${color}.main`,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: hasData ? `${color}.lighter` : 'action.hover',
              mb: 2,
            }}
          >
            <Iconify
              icon={icon}
              width={40}
              sx={{ color: hasData ? `${color}.main` : 'text.disabled' }}
            />
          </Box>

          {/* Label */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: 1,
              color: 'text.primary',
            }}
          >
            {label}
          </Typography>

          {/* Status */}
          <Chip
            label={hasData ? 'Disponible' : 'Non disponible'}
            size="small"
            color={hasData ? 'success' : 'default'}
            icon={<Iconify icon={hasData ? 'mdi:check' : 'mdi:close'} width={16} />}
            sx={{ mb: 2 }}
          />

          {/* Preview Image */}
          {hasData && (
            <Box
              sx={{
                width: '100%',
                height: 150,
                bgcolor: 'grey.100',
                borderRadius: 2,
                overflow: 'hidden',
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
              onClick={() => handleOpenPreview(label, url)}
            >
              <img
                src={url}
                alt={label}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={1} sx={{ mt: 'auto', width: '100%' }}>
            {hasData && (
              <Button
                variant="outlined"
                color={color}
                fullWidth
                startIcon={<Iconify icon="mdi:eye" />}
                onClick={() => handleOpenPreview(label, url)}
                sx={{ fontWeight: 600 }}
              >
                Voir
              </Button>
            )}
            {/* Seule la signature reste peut etre modifier manuellement : la photo et les
                empreintes proviennent d'ABIS (onEdit n'est fourni que pour la signature). */}
            {onEdit && can('can_update_employee_file') && (
              <Button
                variant={hasData ? 'outlined' : 'contained'}
                color={color}
                fullWidth
                startIcon={<Iconify icon={hasData ? 'mdi:pencil' : 'mdi:upload'} />}
                onClick={onEdit}
                sx={{ fontWeight: 600 }}
              >
                {hasData ? 'Modifier' : 'Ajouter'}
              </Button>
            )}
          </Stack>
        </Box>
      </Card>
    );
  };

  // Dialog générique pour upload
  const UploadDialog = ({
    open,
    onClose,
    title,
    icon,
    file,
    preview,
    originalValue,
    loading,
    onFileChange,
    onSave,
    onClear,
  }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Iconify icon={icon} width={24} />
            {title}
          </Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="mdi:close" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Alert severity="info" icon={<Iconify icon="mdi:information" />}>
            Formats acceptés: JPG, PNG. Taille maximale: 5MB.
          </Alert>

          <Box
            sx={{
              border: '2px dashed',
              borderColor: preview ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              bgcolor: preview ? 'primary.lighter' : 'background.neutral',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.lighter',
              },
            }}
          >
            {preview ? (
              <Box>
                <Box
                  sx={{
                    width: '100%',
                    height: 300,
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 2,
                    bgcolor: 'white',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <img
                    src={preview}
                    alt={title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Iconify icon="mdi:image-edit" />}
                  >
                    Changer le fichier
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => onFileChange(e.target.files[0])}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Iconify icon="mdi:delete" />}
                    onClick={onClear}
                  >
                    Supprimer
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<Iconify icon="mdi:cloud-upload" />}
                sx={{
                  width: '100%',
                  py: 8,
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Iconify icon="mdi:cloud-upload" width={48} sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Cliquez pour télécharger
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ou glissez-déposez votre fichier ici
                  </Typography>
                </Box>
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => onFileChange(e.target.files[0])}
                />
              </Button>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={() => {
            onClear();
            onClose();
          }}
          color="inherit"
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={loading || !file}
          startIcon={loading ? <CircularProgress size={20} /> : <Iconify icon="mdi:content-save" />}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      {/* Carte principale d'affichage */}
      <Card
        sx={{
          p: { xs: 2.5, sm: 3, md: 4 },
          boxShadow: (theme) => theme.customShadows?.card,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
            }}
          >
            <Iconify icon="mdi:fingerprint" width={{ xs: 24, sm: 28 }} />
            Données Biométriques
          </Typography>
          <Stack direction="row" spacing={1}>
            {abisLastRetrievedAt && (
              <Chip
                icon={<Iconify icon="solar:refresh-bold" width={14} />}
                label={`Récupéré le : ${new Date(abisLastRetrievedAt).toLocaleString('fr-FR')}`}
                size="small"
                color="default"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  px: 1,
                  height: { xs: 28, sm: 32 },
                  '& .MuiChip-icon': { ml: 0.5 },
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  },
                }}
              />
            )}
            {canRetrieveABIS && (
                <Chip
                  icon={
                    loadingABIS ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Iconify icon="solar:refresh-bold" width={18} />
                    )
                  }
                  label={loadingABIS ? 'Chargement...' : abisActionLabel}
                  color="default"
                  onClick={loadingABIS ? undefined : handleFetchABIS}
                  disabled={loadingABIS}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    px: 1,
                    height: { xs: 28, sm: 32 },
                    '& .MuiChip-icon': { ml: 0.5 },
                    '& .MuiChip-label': {
                      px: 1,
                      fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    },
                  }}
                />
              )}
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <BiometricCard
              type="picture"
              label="Photo"
              icon="mdi:camera"
              url={picturePreview}
              color="primary"
              // Photo recuperee depuis ABIS
              // onEdit={() => setPictureDialog(true)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <BiometricCard
              type="signature"
              label="Signature"
              icon="mdi:draw"
              url={signaturePreview}
              color="secondary"
              onEdit={() => setSignatureDialog(true)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <BiometricCard
              type="fingerprints_picture"
              label="Empreintes Digitales"
              icon="mdi:fingerprint"
              url={fingerprintsPreview}
              color="info"
              // Empreintes recuperees depuis ABIS
              // onEdit={() => setFingerprintsDialog(true)}
            />
          </Grid>
        </Grid>

        {canRetrieveABIS && !picturePreview && !signaturePreview && !fingerprintsPreview && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              Aucune donnée biométrique n'a été enregistrée. Cliquez sur "{abisActionLabel}" pour
              obtenir les fichiers.
            </Typography>
          </Alert>
        )}
      </Card>

      {/* Dialog pour Photo */}
      {/* <UploadDialog
        open={pictureDialog}
        onClose={() => setPictureDialog(false)}
        title="Photo d'Identité"
        icon="mdi:camera"
        file={pictureFile}
        preview={picturePreview}
        originalValue={picture}
        loading={loadingPicture}
        onFileChange={(file) =>
          handleFileChange('picture', file, setPictureFile, setPicturePreview)
        }
        onSave={() =>
          handleSaveFile('picture', pictureFile, setLoadingPicture, setPictureDialog, picture)
        }
        onClear={() => {
          setPictureFile(null);
          setPicturePreview(picture || '');
        }}
      /> */}

      {/* Dialog pour Signature */}
      <UploadDialog
        open={signatureDialog}
        onClose={() => setSignatureDialog(false)}
        title="Signature"
        icon="mdi:draw"
        file={signatureFile}
        preview={signaturePreview}
        originalValue={signature}
        loading={loadingSignature}
        onFileChange={(file) =>
          handleFileChange('signature', file, setSignatureFile, setSignaturePreview)
        }
        onSave={() =>
          handleSaveFile(
            'signature',
            signatureFile,
            setLoadingSignature,
            setSignatureDialog,
            signature
          )
        }
        onClear={() => {
          setSignatureFile(null);
          setSignaturePreview(signature || '');
        }}
      />

      {/* Dialog pour Empreintes */}
      {/* <UploadDialog
        open={fingerprintsDialog}
        onClose={() => setFingerprintsDialog(false)}
        title="Empreintes Digitales"
        icon="mdi:fingerprint"
        file={fingerprintsFile}
        preview={fingerprintsPreview}
        originalValue={fingerprints_picture}
        loading={loadingFingerprints}
        onFileChange={(file) =>
          handleFileChange(
            'fingerprints_picture',
            file,
            setFingerprintsFile,
            setFingerprintsPreview
          )
        }
        onSave={() =>
          handleSaveFile(
            'fingerprints_picture',
            fingerprintsFile,
            setLoadingFingerprints,
            setFingerprintsDialog,
            fingerprints_picture
          )
        }
        onClear={() => {
          setFingerprintsFile(null);
          setFingerprintsPreview(fingerprints_picture || '');
        }}
      /> */}

      {/* Dialog de prévisualisation */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {previewData.type}
            </Typography>
            <IconButton onClick={() => setOpenPreview(false)}>
              <Iconify icon="mdi:close" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              width: '100%',
              minHeight: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <img
              src={previewData.url}
              alt={previewData.type}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="mdi:download" />}
            component="a"
            href={previewData.url}
            download
          >
            Télécharger
          </Button>
          <Button onClick={() => setOpenPreview(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
