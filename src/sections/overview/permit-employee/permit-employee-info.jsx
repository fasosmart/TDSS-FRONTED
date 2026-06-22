import { useCallback, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useBoolean } from 'src/hooks/use-boolean';
import { usePermissions } from 'src/auth/hooks';

import { EmployeeQuickEditForm } from '../declaration/components/employe-quick-edit-form';

import { ConfirmDialog } from 'src/components/custom-dialog';
import { toast } from 'src/components/snackbar';

import API from 'src/utils/api';
import axios from 'src/utils/axios';

// ----------------------------------------------------------------------

export function PermitEmloyeeInfo({ info, onSyncSuccess }) {
  const fileRef = useRef(null);
  const router = useRouter();
  const { can } = usePermissions();

  const editOpen = useBoolean();

  const syncOpen = useBoolean();
  const [syncing, setSyncing] = useState(false);

  const hasRetrievedABIS = Boolean(info?.abis_last_retrieved_at || info?.is_registered_in_abis);
  const canSendToABIS = !hasRetrievedABIS;
  const abisActionLabel = "Envoyer à l'enrollement";
  const abisActionTitle = "Envoyer les données à l'enrollement";
  const abisActionContent =
    "Êtes-vous sûr de vouloir envoyer les données de cet employé à l'enrollement ?";

  // TEMP: update flow disabled until backend issue is fixed.
  // const abisActionLabel = hasRetrievedABIS ? 'Mise à jour des données' : "Envoyer à l'enrollement";
  // const abisActionTitle = hasRetrievedABIS
  //   ? 'Mettre à jour les données de l’employé'
  //   : "Envoyer les données à l'enrollement";
  // const abisActionContent = hasRetrievedABIS
  //   ? "Êtes-vous sûr de vouloir mettre à jour les données de cet employé dans l'enrollement ?"
  //   : "Êtes-vous sûr de vouloir envoyer les données de cet employé à l'enrollement ?";

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

  const handleSync = async () => {
    const employeeSlug = info?.employee_slug;

    if (!employeeSlug) {
      toast.error('Impossible de synchroniser: employé introuvable.');
      return false;
    }

    if (!canSendToABIS) {
      toast.info('Mise à jour ABIS temporairement désactivée.');
      return false;
    }

    setSyncing(true);
    try {
      // TEMP: backend issue on ABIS update endpoint.
      // const response = await axios.put(API.updateABISEmployee(employeeSlug));
      const response = await axios.post(API.saveEmployeeToABIS(employeeSlug));

      const isSuccess =
        response?.status === 200 || response?.status === 201 || response?.data?.success;

      if (isSuccess) {
        toast.success('Synchronisation réussie avec ABIS');
        if (onSyncSuccess) {
          await onSyncSuccess();
        }
        return true;
      }

      toast.error(response?.data?.message || 'Échec de la synchronisation avec ABIS');
      return false;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.details ||
        error?.response?.data?.non_field_errors?.[0] ||
        error?.message ||
        'Erreur inconnue';
      toast.error(`Échec de la synchronisation avec ABIS: ${errorMessage}`);
      return false;
    } finally {
      setSyncing(false);
    }
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
      submitted: { color: 'success', label: 'Soumis', icon: 'mdi:check-circle' },
      correction: { color: 'error', label: 'Correction', icon: 'mdi:alert-circle' },
      expired: { color: 'error', label: 'Expiré', icon: 'mdi:calendar-alert' },
      billed: { color: 'info', label: 'Facturé', icon: 'mdi:receipt' },
      paid: { color: 'success', label: 'Payé', icon: 'mdi:check-circle' },
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
  const getRelevantDates = () => {
    const dates = [];

    if (info?.validated_at) {
      dates.push({
        icon: 'mdi:check-decagram',
        label: 'Date de Validation',
        value: formatDate(info.validated_at),
      });
    }

    if (info?.printed_at) {
      dates.push({
        icon: 'mdi:printer-check',
        label: "Date d'Impression",
        value: formatDate(info.printed_at),
      });
    }

    if (info?.delivered_at) {
      dates.push({
        icon: 'mdi:package-variant-closed-check',
        label: 'Date de Livraison',
        value: formatDate(info.delivered_at),
      });
    }

    if (info?.card_issued_at) {
      dates.push({
        icon: 'mdi:card-account-details',
        label: "Date d'Émission",
        value: formatDate(info.card_issued_at),
      });
    }

    if (info?.card_expires_at) {
      dates.push({
        icon: 'mdi:calendar-alert',
        label: "Date d'Expiration",
        value: formatDate(info.card_expires_at),
      });
    }

    return dates;
  };

  const relevantDates = getRelevantDates();

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
              Informations Employé
            </Typography>

            <Stack direction="row" spacing={1}>
              <Chip
                icon={<Iconify icon="solar:user-id-bold" width={18} />}
                label={info?.job?.permit}
                color={typeConfig.color}
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
              <Chip
                icon={<Iconify icon={typeConfig.icon} width={18} />}
                label={typeConfig.label}
                color={typeConfig.color}
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
              <Chip
                icon={
                  <Iconify
                    icon={info?.is_registered_in_abis ? 'mdi:check-circle' : 'mdi:close-circle'}
                    width={16}
                  />
                }
                label={
                  info?.is_registered_in_abis
                    ? "Envoyé à l'enrollement"
                    : "Non envoyé à l'enrollement"
                }
                color={info?.is_registered_in_abis ? 'success' : 'error'}
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

              {can('can_enroll_employee_abis') &&
                info?.status !== 'printed' &&
                info?.status !== 'delivered' &&
                info?.status !== 'enrolled' &&
                canSendToABIS && (
                  <Chip
                    icon={<Iconify icon="solar:refresh-bold" width={18} />}
                    label={abisActionLabel}
                    color="default"
                    onClick={syncOpen.onTrue}
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

              {info?.status === 'correction' && can('can_edit_declaration_employee') && (
                <Chip
                  icon={<Iconify icon="mdi:pen" width={18} />}
                  label="Modifier"
                  color="default"
                  onClick={editOpen.onTrue}
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

          {/* ================== Section Identification ================== */}
          <Box sx={{ mb: 3 }}>
            <SectionTitle title="Identification" />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {info?.card_number && (
                <InfoItem icon="mdi:credit-card" label="Numéro de Carte" value={info.card_number} />
              )}
              <InfoItem
                icon="mdi:passport"
                label="Passeport"
                value={info?.passport_number}
                isLink
                onClick={info?.employee_slug ? handleViewEmployee : null}
              />
              <InfoItem
                icon="mdi:account"
                label="Nom Complet"
                value={`${info?.first || ''} ${info?.last || ''}`.trim()}
              />
              <InfoItem
                icon={info?.sexe === 'male' ? 'mdi:gender-male' : 'mdi:gender-female'}
                label="Sexe"
                value={info?.sexe === 'male' ? 'Masculin' : 'Féminin'}
              />
              <InfoItem
                icon="mdi:calendar"
                label="Date de Naissance"
                value={formatDate(info?.birthday)}
              />
              {info?.birth_place && (
                <InfoItem
                  icon="mdi:map-marker"
                  label="Lieu de Naissance"
                  value={info?.birth_place}
                />
              )}
              <InfoItem icon="mdi:flag" label="Pays" value={info?.country} />
              <InfoItem icon="mdi:account-card" label="Nationalité" value={info?.nationality} />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* ================== Section Contact ================== */}
          <Box sx={{ mb: 3 }}>
            <SectionTitle title="Contact" />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <InfoItem icon="ic:baseline-phone" label="Téléphone" value={info?.phone} isLink />
              {info?.email && (
                <InfoItem icon="ic:baseline-email" label="Email" value={info?.email} isLink />
              )}
              {info?.address && <InfoItem icon="mdi:home" label="Adresse" value={info?.address} />}
              {/* {info?.residence && (
                <InfoItem icon="mdi:home-city" label="Résidence" value={info?.residence} />
              )} */}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* ================== Section Contrat ================== */}
          <Box sx={{ mb: 3 }}>
            <SectionTitle title="Contrat" />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <InfoItem icon="mdi:domain" label="Entreprise" value={info?.company_name} />
              <InfoItem
                icon="mdi:calendar-start"
                label="Date de Début"
                value={formatDate(info?.contract_starts_at)}
              />
              <InfoItem
                icon="mdi:calendar-clock"
                label="Durée"
                value={info?.contract_duration ? `${info?.contract_duration} mois` : 'N/A'}
              />
              {info?.motif_rejet && (
                <InfoItem
                  icon="mdi:alert-circle"
                  label="Motif de Rejet"
                  value={info?.motif_rejet}
                />
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* ================== Section Fonction ================== */}
          <Box sx={{ mb: relevantDates.length > 0 ? 3 : 0 }}>
            <SectionTitle title="Fonction" />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <InfoItem icon="mdi:briefcase" label="Fonction" value={info?.job?.name} />
              <InfoItem icon="mdi:tag" label="Catégorie de Fonction" value={info?.job?.category} />
            </Box>
          </Box>

          {/* ================== Section Dates importantes (selon statut) ================== */}
          {/* {relevantDates.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box>
                <SectionTitle title="Suivi du Permis" />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {relevantDates.map((date, index) => (
                    <InfoItem key={index} icon={date.icon} label={date.label} value={date.value} />
                  ))}
                </Box>
              </Box>
            </>
          )} */}

          <EmployeeQuickEditForm
            currentEmployee={info}
            open={editOpen.value}
            onClose={editOpen.onFalse}
            isPermit={true}
            dec_slug={info?.declaration_slug}
          />

          <ConfirmDialog
            open={syncOpen.value}
            onClose={syncOpen.onFalse}
            title={abisActionTitle}
            content={abisActionContent}
            action={
              <Button
                variant="contained"
                disabled={syncing}
                onClick={async () => {
                  const isSynced = await handleSync();
                  if (isSynced) {
                    syncOpen.onFalse();
                  }
                }}
              >
                {syncing ? 'Synchronisation...' : abisActionLabel}
              </Button>
            }
          />
        </Box>
      </Card>
    </Grid>
  );
}
