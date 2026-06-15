'use client';

import { useCallback, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { CardHeader } from '@mui/material';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

import { Add as AddIcon } from '@mui/icons-material/Add';

import { Iconify } from 'src/components/iconify';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { usePermissions } from 'src/auth/hooks';

import { AfricanizationPlanNew } from '../plan-africanisation/new_plan-africanisation';
// ----------------------------------------------------------------------

export function PlanAfricanisation({
  info,
  employeeName,
  employeeId,
  isExpatriate,
  permitExpiryDate,
  onUpdate,
}) {
  const fileRef = useRef(null);
  const router = useRouter();

  const { can } = usePermissions();

  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const handleOpenEdit = () => {
    setIsEdit(true);
    setOpenForm(true);
  };

  const handleOpenCreate = () => {
    setIsEdit(false);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleAttach = () => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  };

  const handleViewEmployee = useCallback(() => {
    if (info?.employee_slug) {
      router?.push(paths.dashboard.employee.details(info?.employee_slug));
    }
  }, [router, info?.employee_slug]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const checkPermitExpiry = () => {
    if (!permitExpiryDate) return false;
    const expiryDate = new Date(permitExpiryDate);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    return expiryDate <= oneMonthFromNow;
  };

  const getStatusConfig = (status) => {
    const configs = {
      unenrolled: { color: 'warning', label: 'Non Enrôlé', icon: 'mdi:clock-outline' },
      enrolled: { color: 'success', label: 'Enrôlé', icon: 'mdi:check-circle' },
      rejected: { color: 'error', label: 'Rejeté', icon: 'mdi:close-circle' },
      processing: { color: 'warning', label: 'En cours', icon: 'mdi:clock-outline' },
      validated: { color: 'success', label: 'Validé', icon: 'mdi:check-circle' },
      printed: { color: 'info', label: 'Imprimé', icon: 'mdi:printer' },
      delivered: { color: 'primary', label: 'Délivré', icon: 'mdi:package-variant-closed' },
      actif: { color: 'success', label: 'Actif', icon: 'mdi:check-circle' },
      inactif: { color: 'error', label: 'Inactif', icon: 'mdi:close-circle' },
      termine: { color: 'success', label: 'Terminé', icon: 'mdi:check-circle' },
    };
    return configs[status] || { color: 'default', label: status, icon: 'mdi:information' };
  };

  const getTypeConfig = (type) => {
    const configs = {
      new: { color: 'info', label: 'Nouvelle', icon: 'mdi:new-box' },
      renewal: { color: 'warning', label: 'Renouvellement', icon: 'mdi:refresh' },
      duplicate: { color: 'default', label: 'Duplicata', icon: 'mdi:content-copy' },
    };
    return configs[type] || { color: 'default', label: type, icon: 'mdi:information' };
  };

  // Composant réutilisable pour les items d'information
  const InfoItem = ({ icon, label, value, isLink = false, onClick }) => (
    <Box
      sx={{
        minWidth: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)' },
        mb: 2.5,
        display: 'flex',
        alignItems: 'flex-start',
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'primary.lighter',
          mr: 1.5,
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={22} sx={{ color: 'primary.main' }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            textTransform: 'uppercase',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: 0.5,
            display: 'block',
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        {isLink ? (
          <Link
            variant="body2"
            onClick={onClick}
            sx={{
              fontWeight: 500,
              fontSize: '0.875rem',
              color: 'text.primary',
              textDecoration: 'none',
              cursor: onClick ? 'pointer' : 'default',
              wordBreak: 'break-all',
              '&:hover': {
                textDecoration: onClick ? 'underline' : 'none',
                color: onClick ? 'primary.main' : 'text.primary',
              },
            }}
          >
            {value || 'N/A'}
          </Link>
        ) : (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              fontSize: '0.875rem',
              color: 'text.primary',
              wordBreak: 'break-word',
            }}
          >
            {value || 'N/A'}
          </Typography>
        )}
      </Box>
    </Box>
  );

  const DocumentItem = ({ icon, label, fileUrl }) => {
    const handleView = () => {
      if (fileUrl) {
        window.open(fileUrl, '_blank'); // ouvre le document dans une nouvelle fenêtre/onglet
      }
    };

    return (
      <Box
        sx={{
          minWidth: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)' },
          mb: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.lighter',
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={22} sx={{ color: 'primary.main' }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: 0.5,
              display: 'block',
              mb: 0.5,
            }}
          >
            {label}
          </Typography>

          <Button variant="outlined" size="small" onClick={handleView} disabled={!fileUrl}>
            Voir
          </Button>
        </Box>
      </Box>
    );
  };
  // Composant pour les titres de section
  const SectionTitle = ({ title }) => (
    <Typography
      variant="subtitle2"
      sx={{
        color: 'primary.main',
        fontWeight: 700,
        mb: 2.5,
        fontSize: { xs: '0.8125rem', sm: '0.875rem' },
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        display: 'flex',
        alignItems: 'center',
        '&::before': {
          content: '""',
          width: 4,
          height: 16,
          bgcolor: 'primary.main',
          borderRadius: 1,
          mr: 1,
        },
      }}
    >
      {title}
    </Typography>
  );

  const statusConfig = getStatusConfig(info?.status);
  const typeConfig = getTypeConfig(info?.type);

  // Fonction pour déterminer quelles dates afficher selon le statut

  if (!isExpatriate) {
    return (
      <Card>
        <CardContent sx={{ pt: 3 }}>
          <Alert severity="info">
            Le plan d'africanisation s'applique uniquement aux employés expatriés.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid size={{ xs: 12, md: 4 }}>
      <Card
        sx={{
          position: 'relative',
          overflow: 'visible',
          boxShadow: (theme) => theme.customShadows?.card,
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: (theme) => theme.customShadows?.z8,
          },
        }}
      >
        {!info && (
          <>
            <CardHeader
              title="Plan d’Africanisation"
              subheader={`Gestion des assistants guinéens pour ${employeeName}`}
              action={
                can('can_create_africanization_plan') && (
                  <Button
                    variant="contained"
                    startIcon={<Iconify icon="eva:plus-fill" />}
                    onClick={handleOpenCreate}
                  >
                    Ajouter un plan
                  </Button>
                )
              }
            />
            <CardContent>
              {/* --- Alerte expiration permis --- */}
              {checkPermitExpiry() && (
                <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
                  <AlertTitle>Attention</AlertTitle>
                  Le permis de séjour expire dans moins d’un mois. Une alerte a été envoyée à
                  l’AGUIPEE.
                </Alert>
              )}
            </CardContent>
          </>
        )}

        {openForm && (
          <AfricanizationPlanNew
            open={openForm}
            onClose={handleCloseForm}
            plan={isEdit ? info : null}
            employeeId={employeeId}
            isEdit={isEdit}
            onUpdate={onUpdate}
          />
        )}
        {info && (
          <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
            {/* ================== Header ================== */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                mb: 3,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
                }}
              >
                <Iconify icon="mdi:account-details" width={{ xs: 24, sm: 28 }} sx={{ mr: 1.5 }} />
                Informations Guinéen
              </Typography>

              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<Iconify icon={statusConfig.icon} width={18} />}
                  label={statusConfig.label}
                  color={statusConfig.color}
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
                {can('can_edit_africanization_plan') && (
                  <Button variant="contained" onClick={handleOpenEdit}>
                    <Iconify icon="mdi:edit" width={20} sx={{ mr: 0.5 }} />
                    Modifier
                  </Button>
                )}
              </Stack>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* ================== Section Identification ================== */}
            <Box sx={{ mb: 3 }}>
              <SectionTitle title="Identification" />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {info?.identity_card_number && (
                  <InfoItem
                    icon="mdi:id-card"
                    label="Numéro de Carte d'Identité"
                    value={info.identity_card_number}
                  />
                )}
                {info?.passport_number && (
                  <InfoItem
                    icon="mdi:passport"
                    label="Passeport"
                    value={info?.passport_number}
                    isLink
                    onClick={info?.employee_slug ? handleViewEmployee : null}
                  />
                )}
                <InfoItem icon="mdi:account" label="Nom " value={info?.last_name} />
                <InfoItem icon="mdi:account" label="Prénom " value={info?.first_name} />
                {/* <InfoItem
                  icon={info?.sexe === 'male' ? 'mdi:gender-male' : 'mdi:gender-female'}
                  label="Sexe"
                  value={info?.sexe === 'male' ? 'Masculin' : 'Féminin'}
                /> */}
                <InfoItem
                  icon="mdi:calendar"
                  label="Date de Naissance"
                  value={formatDate(info?.birth_date)}
                />
                {info?.birth_place && (
                  <InfoItem
                    icon="mdi:map-marker"
                    label="Lieu de Naissance"
                    value={info?.birth_place}
                  />
                )}
                {/* <InfoItem icon="mdi:flag" label="Residence" value={info?.residence} /> */}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* ================== Section Contact ================== */}
            <Box sx={{ mb: 3 }}>
              <SectionTitle title="Contact" />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <InfoItem
                  icon="ic:baseline-phone"
                  label="Téléphone"
                  value={info?.phone_number}
                  isLink
                />
                {info?.email && (
                  <InfoItem icon="ic:baseline-email" label="Email" value={info?.email} isLink />
                )}
                {info?.address && (
                  <InfoItem icon="mdi:home" label="Adresse" value={info?.address} />
                )}
                {info?.residence && (
                  <InfoItem icon="mdi:home-city" label="Résidence" value={info?.residence} />
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* ================== Section Contrat ================== */}
            <Box sx={{ mb: 3 }}>
              <SectionTitle title="Contrat" />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <InfoItem icon="mdi:domain" label="Entreprise" value={info?.company_info?.name} />
                <InfoItem
                  icon="mdi:calendar-start"
                  label="Date d'embauche"
                  value={formatDate(info?.hire_date)}
                />
                <InfoItem
                  icon="mdi:calendar"
                  label="Date de Démobilisation"
                  value={formatDate(info?.expected_takeover_date)}
                />
                <InfoItem
                  icon="mdi:calendar-clock"
                  label="Durée"
                  value={
                    info?.duration_before_takeover
                      ? `${info?.duration_before_takeover} mois${info?.duration_before_takeover > 1 ? '' : ''}`
                      : 'N/A'
                  }
                />
                {info?.notes && (
                  <InfoItem icon="mdi:alert-circle" label="Motif de Rejet" value={info?.notes} />
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* ================== Section Documents ================== */}
            <Box sx={{ mb: 3 }}>
              <SectionTitle title="Documents" />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {info?.identity_card_scan && (
                  <DocumentItem
                    icon="mdi:id-card"
                    label="Scan Carte d'Identité"
                    fileUrl={info.identity_card_scan}
                  />
                )}
                {info?.contract_scan && (
                  <DocumentItem
                    icon="mdi:file-document-outline"
                    label="Scan Contrat"
                    fileUrl={info.contract_scan}
                  />
                )}
                {info?.training_plan_scan && (
                  <DocumentItem
                    icon="mdi:clipboard-text"
                    label="Plan de Formation"
                    fileUrl={info.training_plan_scan}
                  />
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Card>
    </Grid>
  );
}
