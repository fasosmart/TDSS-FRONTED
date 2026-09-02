import { useCallback, useEffect, useState } from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import { Iconify } from 'src/components/iconify';
import { toast } from 'sonner';
import axios from 'src/utils/axios';
import API from 'src/utils/api';

const iconMap = {
  Passeport: 'mdi:passport',
  'Contrat de travail': 'mdi:file-sign',
  'Dossier criminel': 'mdi:police-badge',
  'Dossier médical': 'mdi:medical-bag',
  'Copies des diplômes': 'mdi:school',
  CV: 'mdi:account-box',
  "Déclaration d'attestation": 'mdi:file-document',
  'Plan de panafricanisation': 'mdi:earth',
  'Certificat de régulation sociale': 'mdi:certificate',
};

export function PermitEmployeeDoc({ type, documents = [], employee, onDocumentUploaded }) {
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [documentList, setDocumentList] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingDocument, setExistingDocument] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const openDocument = (document) => {
    if (document?.file || document?.url) {
      const url = document.file || document.url;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('URL du document non disponible');
    }
  };

  const getDocuments = useCallback(async () => {
    try {
      const response = await axios.get(API.documents());
      setDocumentList(response.data.results);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }, []);

  useEffect(() => {
    getDocuments();
  }, [getDocuments]);

  const filteredDocuments = documentList.filter((docType) => {
    if (type === 'new') {
      return docType.name !== 'Permis expiré';
    }
    return true;
  });

  // Trouver un document existant chez l'employé
  const getDocumentBySlug = (name) =>
    documents?.find((doc) => doc.type === name || doc.name === name);

  const handleAddDocument = (docType) => {
    setSelectedDocType(docType);
    setIsEditMode(false);
    setExistingDocument(null);
    setExpiryDate('');
    setSelectedFile(null);
    setFilePreview(null);
    setOpenUploadDialog(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 10MB)');
        return;
      }

      setSelectedFile(file);

      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview({
          url: e.target.result,
          type: file.type,
          name: file.name,
          size: file.size,
        });
      };

      if (file.type === 'application/pdf') {
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    // Réinitialiser l'input file
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'mdi:file-pdf';
      case 'doc':
      case 'docx':
        return 'mdi:file-word';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'mdi:file-image';
      default:
        return 'mdi:file';
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile && !isEditMode) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      // Pour l'ajout d'un nouveau document
      if (!isEditMode) {
        formData.append('type', selectedDocType.slug);
        formData.append('name', selectedDocType.name);
        formData.append('declaration_employee', employee?.slug);

        if (selectedDocType.has_expiry_date && expiryDate) {
          formData.append('expiry_date', expiryDate);
        }

        await axios.post(API.addDocument(), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Document ajouté avec succès');
      }
      // Pour la modification d'un document existant
      else {
        if (selectedDocType.has_expiry_date) {
          formData.append('expiry_date', expiryDate || '');
        }

        await axios.patch(API.updateDocument(existingDocument.slug), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Document modifié avec succès');
      }

      onDocumentUploaded();
      handleCloseDialog();
    } catch (error) {
      console.error('Erreur upload:', error);
      const errorMessage =
        error?.error || error?.details || error?.message || error?.detail || error?.error?.[0];
      console.error('Erreur réseau ou serveur:', error?.error?.[0]);
      toast.error(errorMessage);
      console.error('Erreur réseau ou serveur:', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleModifyDocument = (docType, existingDoc) => {
    setSelectedDocType(docType);
    setExistingDocument(existingDoc);
    setIsEditMode(true);
    setExpiryDate(existingDoc.expiry_date || '');
    setSelectedFile(null);
    setFilePreview(null);
    setOpenUploadDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenUploadDialog(false);
    setSelectedFile(null);
    setSelectedDocType(null);
    setExpiryDate('');
    setIsEditMode(false);
    setExistingDocument(null);
    setFilePreview(null);
  };

  const getButtonText = () => {
    if (uploading) return 'Envoi...';
    return isEditMode ? 'Modifier' : 'Ajouter';
  };

  const getDialogTitle = () => {
    if (!selectedDocType) return 'Ajouter un document';
    return isEditMode ? `Modifier - ${selectedDocType.name}` : `Ajouter - ${selectedDocType.name}`;
  };

  const renderFilePreview = () => {
    const renderPreviewBox = (url, type, name, size, onRemove) => (
      <Box
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          position: 'relative',
          width: '500px',
        }}
      >
        {/* Bouton de suppression */}
        <IconButton
          size="small"
          onClick={onRemove}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'error.main',
            color: 'white',
            '&:hover': { bgcolor: 'error.dark' },
          }}
        >
          <Iconify icon="mdi:close" width={16} />
        </IconButton>

        {/* Affichage selon le type */}
        {type.startsWith('image/') ? (
          <Box sx={{ textAlign: 'center' }}>
            <img
              src={url}
              alt={name}
              style={{
                maxWidth: '100%',
                maxHeight: '250px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid #ddd',
              }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {name}
            </Typography>
          </Box>
        ) : type === 'application/pdf' ? (
          <Box sx={{ textAlign: 'center' }}>
            <iframe
              src={url}
              title={name}
              style={{
                width: '100%',
                height: '300px',
                border: '1px solid #ccc',
                borderRadius: '8px',
              }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {name}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Iconify icon={getFileIcon(name)} width={64} sx={{ color: 'primary.main', mb: 1 }} />
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              {name}
            </Typography>
            {size && (
              <Typography variant="caption" color="text.secondary">
                {(size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );

    // 1️⃣ Si on a un fichier sélectionné (nouvel upload)
    if (filePreview) {
      return renderPreviewBox(
        filePreview.url,
        filePreview.type,
        filePreview.name,
        selectedFile?.size,
        handleRemoveFile
      );
    }

    // 2️⃣ Si on est en mode édition et qu’il y a un document existant
    if (isEditMode && existingDocument?.file) {
      const url = existingDocument.file;
      const fileName = url.split('/').pop();
      const fileType = url.endsWith('.pdf')
        ? 'application/pdf'
        : url.match(/\.(jpg|jpeg|png)$/i)
          ? 'image/*'
          : 'application/octet-stream';

      // Fonction pour retirer le document actuel avant remplacement
      const handleRemoveExisting = () => {
        setExistingDocument(null);
        setFilePreview(null);
        setSelectedFile(null);
      };

      return renderPreviewBox(url, fileType, fileName, null, handleRemoveExisting);
    }

    // 3️⃣ Aucun aperçu à afficher
    return null;
  };

  return (
    <>
      <Card sx={{ overflow: 'visible' }}>
        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Documents de l'employé</Typography>
              <Chip
                label={`${documents?.length || 0}/${filteredDocuments.length} documents`}
                color={documents?.length === filteredDocuments.length ? 'success' : 'warning'}
                size="small"
              />
            </Box>

            <Grid container spacing={2}>
              {filteredDocuments.map((docType) => {
                const existingDoc = getDocumentBySlug(docType.name);
                const hasDocument = !!existingDoc;

                return (
                  <Grid key={docType.slug} xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        p: 2,
                        height: '100%',
                        border: '1px solid',
                        borderColor: hasDocument ? 'success.main' : 'divider',
                        bgcolor: hasDocument ? 'success' : 'background.paper',
                        transition: 'all 0.3s',
                        '&:hover': {
                          boxShadow: (theme) => theme.customShadows.z8,
                          borderColor: hasDocument ? 'success.main' : 'primary.main',
                        },
                      }}
                    >
                      <Stack spacing={2}>
                        {/* En-tête avec icône et statut */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 1.5,
                              bgcolor: hasDocument ? 'success.main' : 'grey.300',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Iconify icon={iconMap[docType.name] || 'mdi:file'} width={24} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap>
                              {docType.name}
                            </Typography>
                            <Chip
                              label={hasDocument ? 'Disponible' : 'Manquant'}
                              size="small"
                              color={hasDocument ? 'success' : 'default'}
                              sx={{ mt: 0.5, height: 20, fontSize: '0.75rem' }}
                            />
                            {hasDocument && existingDoc.expiry_date && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Expire le:{' '}
                                {new Date(existingDoc.expiry_date).toLocaleDateString('fr-FR')}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Date d'ajout si disponible */}
                        {hasDocument && existingDoc?.created_at && (
                          <Typography variant="caption" color="text.secondary">
                            Ajouté le {new Date(existingDoc.created_at).toLocaleDateString('fr-FR')}
                          </Typography>
                        )}

                        {/* Actions */}
                        <Stack direction="row" spacing={1}>
                          {hasDocument ? (
                            <>
                              <Tooltip title="Ouvrir le document">
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<Iconify icon="mdi:open-in-new" />}
                                  onClick={() => openDocument(existingDoc)}
                                  fullWidth
                                >
                                  Ouvrir
                                </Button>
                              </Tooltip>
                              {docType.name !== 'Plan de panafricanisation' && (
                                <Tooltip title="modifier le document">
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => handleModifyDocument(docType, existingDoc)}
                                    sx={{
                                      border: '1px solid',
                                      borderColor: 'info',
                                    }}
                                  >
                                    <Iconify icon="mdi:pencil" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            docType.name !== 'Plan de panafricanisation' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                startIcon={<Iconify icon="mdi:plus" />}
                                onClick={() => handleAddDocument(docType)}
                                fullWidth
                              >
                                Ajouter
                              </Button>
                            )
                          )}
                        </Stack>
                      </Stack>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Stack>
        </Box>
      </Card>

      {/* Dialog pour ajouter/modifier un document */}
      <Dialog open={openUploadDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Zone de dépôt de fichier avec prévisualisation intégrée */}
            <Box
              sx={{
                p: 2,
                border: '2px dashed',
                borderColor:
                  filePreview || (isEditMode && existingDocument) ? 'primary' : 'divider',
                borderRadius: 2,
                textAlign: 'center',
                // bgcolor:
                //   filePreview || (isEditMode && existingDocument) ? 'primary.lighter' : 'default',
                cursor: 'pointer',
                transition: 'all 0.3s',
                position: 'relative',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: filePreview || (isEditMode && existingDocument) ? 'primary' : '',
                },
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />

              {renderFilePreview()}
              {!filePreview && (
                <>
                  {' '}
                  <Iconify
                    icon="mdi:cloud-upload"
                    width={48}
                    sx={{ mb: 2, color: 'text.secondary' }}
                  />{' '}
                  <Typography variant="body1" gutterBottom>
                    {' '}
                    {isEditMode && existingDocument?.file
                      ? 'Cliquez pour sélectionner un nouveau fichier'
                      : 'Cliquez pour sélectionner un fichier'}{' '}
                  </Typography>{' '}
                  <Typography variant="caption" color="text.secondary">
                    {' '}
                    PDF, DOC, DOCX, JPG, PNG (Max 10MB){' '}
                  </Typography>{' '}
                </>
              )}
            </Box>

            {selectedDocType?.has_expiry_date && (
              <TextField
                type="date"
                label="Date d'expiration"
                InputLabelProps={{ shrink: true }}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                fullWidth
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="outlined">
            Annuler
          </Button>

          <Button
            onClick={handleUploadDocument}
            variant="contained"
            disabled={(!selectedFile && !isEditMode) || uploading}
          >
            {getButtonText()}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
