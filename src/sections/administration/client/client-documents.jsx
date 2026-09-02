import { useCallback, useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import axios from 'src/utils/axios';
import API from 'src/utils/api';

import { Iconify } from 'src/components/iconify';
import { toast } from 'sonner';

const iconMap = {
  Passeport: 'mdi:passport',
  'Registre de commerce': 'mdi:file-document-outline',
  NIF: 'mdi:file-certificate-outline',
  Statuts: 'mdi:file-sign',
  'Attestation fiscale': 'mdi:file-check-outline',
  'Attestation CNSS': 'mdi:shield-check-outline',
  'Plan de panafricanisation': 'mdi:earth',
};

function getResponseList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizeDocTypeValue(typeValue) {
  if (!typeValue) return '';
  if (typeof typeValue === 'string') return typeValue;
  return typeValue.slug || typeValue.name || '';
}

function matchesDocType(document, docType) {
  const docTypeValue = normalizeDocTypeValue(document?.type);
  const docTypeName = document?.type_name || document?.name || '';

  return (
    docTypeValue === docType?.slug ||
    docTypeValue === docType?.name ||
    docTypeName === docType?.name ||
    docTypeName === docType?.slug
  );
}

export function ClientDocuments({ profileSlug, profileName }) {
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);

  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingDocument, setExistingDocument] = useState(null);
  const [editingDocumentSlug, setEditingDocumentSlug] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const fetchCompanyDocuments = useCallback(async () => {
    if (!profileSlug) return;

    try {
      const response = await axios.get(API.listCompanyDocuments(), {
        params: { profile: profileSlug },
      });
      setDocuments(getResponseList(response.data));
    } catch (error) {
      console.error('Erreur lors du chargement des documents entreprise:', error);
      toast.error("Impossible de charger les documents de l'entreprise");
    }
  }, [profileSlug]);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const response = await axios.get(API.typesCompanyDocuments());
      setDocumentTypes(getResponseList(response.data));
    } catch (error) {
      console.error('Erreur lors du chargement des types de documents:', error);
      toast.error('Impossible de charger les types de documents');
    }
  }, []);

  useEffect(() => {
    fetchCompanyDocuments();
  }, [fetchCompanyDocuments]);

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  const displayDocumentTypes = useMemo(() => {
    if (documentTypes.length > 0) return documentTypes;

    return documents.map((doc) => ({
      slug: normalizeDocTypeValue(doc.type) || doc.slug,
      name: doc.name || doc.type_name || normalizeDocTypeValue(doc.type),
      has_expiry_date: !!doc.expiry_date,
    }));
  }, [documentTypes, documents]);

  const findExistingDoc = useCallback(
    (docType) => documents.find((doc) => matchesDocType(doc, docType)),
    [documents]
  );

  const openDocument = (document) => {
    const url = document?.file || document?.url;

    if (!url) {
      toast.error('URL du document non disponible');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddDocument = (docType) => {
    setSelectedDocType(docType);
    setIsEditMode(false);
    setExistingDocument(null);
    setSelectedFile(null);
    setFilePreview(null);
    setExpiryDate('');
    setOpenUploadDialog(true);
  };

  const handleModifyDocument = (docType, doc) => {
    setSelectedDocType(docType);
    setExistingDocument(doc);
    setEditingDocumentSlug(doc?.slug || null);
    setIsEditMode(true);
    setSelectedFile(null);
    setFilePreview(null);
    setExpiryDate(doc?.expiry_date || '');
    setOpenUploadDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenUploadDialog(false);
    setSelectedDocType(null);
    setSelectedFile(null);
    setFilePreview(null);
    setExpiryDate('');
    setIsEditMode(false);
    setExistingDocument(null);
    setEditingDocumentSlug(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 10MB)');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview({
        url: e.target.result,
        type: file.type,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setExistingDocument(null);

    const input = document.getElementById('company-document-file-input');
    if (input) input.value = '';
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

  const renderPreview = () => {
    if (filePreview) {
      if (filePreview.type.startsWith('image/')) {
        return (
          <img
            src={filePreview.url}
            alt={filePreview.name}
            style={{
              maxWidth: '100%',
              maxHeight: '250px',
              objectFit: 'contain',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}
          />
        );
      }

      if (filePreview.type === 'application/pdf') {
        return (
          <iframe
            src={filePreview.url}
            title={filePreview.name}
            style={{
              width: '100%',
              height: '300px',
              border: '1px solid #ccc',
              borderRadius: '8px',
            }}
          />
        );
      }

      return (
        <Stack alignItems="center" spacing={1}>
          <Iconify icon={getFileIcon(filePreview.name)} width={64} sx={{ color: 'primary.main' }} />
          <Typography variant="body2">{filePreview.name}</Typography>
        </Stack>
      );
    }

    if (isEditMode && existingDocument?.file) {
      return (
        <Stack alignItems="center" spacing={1}>
          <Iconify
            icon={getFileIcon(existingDocument.file?.split('/').pop())}
            width={64}
            sx={{ color: 'primary.main' }}
          />
          <Typography variant="body2">
            {existingDocument.file?.split('/').pop() || 'Fichier existant'}
          </Typography>
        </Stack>
      );
    }

    return (
      <>
        <Iconify icon="mdi:cloud-upload" width={48} sx={{ mb: 1.5, color: 'text.secondary' }} />
        <Typography variant="body2" gutterBottom>
          Cliquer pour selectionner un fichier
        </Typography>
        <Typography variant="caption" color="text.secondary">
          PDF, DOC, DOCX, JPG, PNG (max 10MB)
        </Typography>
      </>
    );
  };

  const handleUploadDocument = async () => {
    if (!selectedDocType) {
      toast.error('Type de document invalide');
      return;
    }

    if (!isEditMode && !selectedFile) {
      toast.error('Veuillez selectionner un fichier');
      return;
    }

    if (!profileSlug && !isEditMode) {
      toast.error('Profil entreprise introuvable');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      if (!isEditMode) {
        formData.append('type', selectedDocType.slug);
        formData.append('name', selectedDocType.name);
        formData.append('profile', profileSlug);

        if (selectedDocType.has_expiry_date && expiryDate) {
          formData.append('expiry_date', expiryDate);
        }

        await axios.post(API.addCompanyDocument(), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        toast.success('Document ajoute avec succes');
      } else {
        const documentSlug = editingDocumentSlug || existingDocument?.slug;
        if (!documentSlug) {
          toast.error('Document a modifier introuvable');
          return;
        }

        if (selectedDocType.has_expiry_date) {
          formData.append('expiry_date', expiryDate || '');
        }

        await axios.patch(API.updateCompanyDocument(documentSlug), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        toast.success('Document modifie avec succes');
      }

      await fetchCompanyDocuments();
      handleCloseDialog();
    } catch (error) {
      console.error('Erreur upload document entreprise:', error);
      const errorMessage =
        error?.details ||
        error?.detail ||
        error?.message ||
        error?.error ||
        error?.file?.[0] ||
        "Erreur lors de l'operation sur le document";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Card sx={{ overflow: 'visible' }}>
        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Documents de l&apos;entreprise {profileName ? `- ${profileName}` : ''}
              </Typography>
              <Chip
                label={`${documents.length}/${displayDocumentTypes.length || documents.length} documents`}
                color={
                  displayDocumentTypes.length > 0 &&
                  documents.length === displayDocumentTypes.length
                    ? 'success'
                    : 'warning'
                }
                size="small"
              />
            </Box>

            <Grid container spacing={2}>
              {displayDocumentTypes.map((docType) => {
                const existingDoc = findExistingDoc(docType);
                const hasDocument = !!existingDoc;

                return (
                  <Grid key={docType.slug || docType.name} xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        p: 2,
                        height: '100%',
                        border: '1px solid',
                        borderColor: hasDocument ? 'success.main' : 'divider',
                        bgcolor: hasDocument ? 'success.lighter' : 'background.paper',
                        transition: 'all 0.3s',
                        '&:hover': {
                          boxShadow: (theme) => theme.customShadows.z8,
                          borderColor: hasDocument ? 'success.main' : 'primary.main',
                        },
                      }}
                    >
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 1.5,
                              bgcolor: hasDocument ? 'success.main' : 'grey.400',
                              color: 'common.white',
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
                                Expire le{' '}
                                {new Date(existingDoc.expiry_date).toLocaleDateString('fr-FR')}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {hasDocument && existingDoc?.created_at && (
                          <Typography variant="caption" color="text.secondary">
                            Ajoute le {new Date(existingDoc.created_at).toLocaleDateString('fr-FR')}
                          </Typography>
                        )}

                        <Stack direction="row" spacing={1}>
                          {hasDocument ? (
                            <>
                              <Tooltip title="Ouvrir le document">
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Iconify icon="mdi:open-in-new" />}
                                  onClick={() => openDocument(existingDoc)}
                                  fullWidth
                                >
                                  Ouvrir
                                </Button>
                              </Tooltip>

                              <Tooltip title="Modifier le document">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => handleModifyDocument(docType, existingDoc)}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'info.main',
                                  }}
                                >
                                  <Iconify icon="mdi:pencil" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Iconify icon="mdi:plus" />}
                              onClick={() => handleAddDocument(docType)}
                              fullWidth
                            >
                              Ajouter
                            </Button>
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

      <Dialog open={openUploadDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditMode
            ? `Modifier - ${selectedDocType?.name || ''}`
            : `Ajouter - ${selectedDocType?.name || ''}`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box
              sx={{
                p: 2,
                border: '2px dashed',
                borderColor:
                  filePreview || (isEditMode && existingDocument) ? 'primary.main' : 'divider',
                borderRadius: 2,
                textAlign: 'center',
                cursor: 'pointer',
                minHeight: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                '&:hover': {
                  borderColor: 'primary.main',
                },
              }}
              onClick={() => document.getElementById('company-document-file-input')?.click()}
            >
              <input
                id="company-document-file-input"
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />

              {(filePreview || (isEditMode && existingDocument)) && (
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveFile();
                  }}
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    bgcolor: 'error.main',
                    color: 'common.white',
                    '&:hover': { bgcolor: 'error.dark' },
                  }}
                >
                  <Iconify icon="mdi:close" width={16} />
                </IconButton>
              )}

              {renderPreview()}
            </Box>

            {selectedDocType?.has_expiry_date && (
              <TextField
                type="date"
                label="Date d'expiration"
                InputLabelProps={{ shrink: true }}
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
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
            disabled={uploading || (!selectedFile && !isEditMode)}
          >
            {uploading ? 'Envoi...' : isEditMode ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
