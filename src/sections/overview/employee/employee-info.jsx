// ABIS désactivé
// import { useState } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
// import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';
import { fDate } from 'src/utils/format-time';

// import { useBoolean } from 'src/hooks/use-boolean';

// import { ConfirmDialog } from 'src/components/custom-dialog';
// import { toast } from 'src/components/snackbar';

// ABIS désactivé
// import API from 'src/utils/api';
// import axios from 'src/utils/axios';

// ----------------------------------------------------------------------

export function EmployeeInfo({ info, type, onSyncSuccess }) {
  // ABIS désactivé
  // const syncOpen = useBoolean();
  // const [syncing, setSyncing] = useState(false);

  // const hasRetrievedABIS = Boolean(info?.abis_last_retrieved_at || info?.is_registered_in_abis);
  // const canSendToABIS = !hasRetrievedABIS;
  // const abisActionLabel = "Envoyer a l'enrollement";
  // const abisActionTitle = "Envoyer les donnees a l'enrollement";
  // const abisActionContent =
  //   "Etes-vous sur de vouloir envoyer les donnees de cet employe a l'enrollement ?";

  const getStatusConfig = (status) => {
    const configs = {
      unenrolled: { color: 'warning', label: 'Non Enrole', icon: 'mdi:clock-outline' },
      enrolled: { color: 'success', label: 'Enrole', icon: 'mdi:check-circle' },
      rejected: { color: 'error', label: 'Rejete', icon: 'mdi:close-circle' },
    };
    return configs[status] || { color: 'default', label: status, icon: 'mdi:information' };
  };

  const statusConfig = getStatusConfig(info?.status);

  // ABIS désactivé
  // const handleSync = async () => {
  //   const employeeSlug = info?.slug || info?.employee_slug;

  //   if (!employeeSlug) {
  //     toast.error("Impossible d'envoyer à l'enrollement: employé introuvable.");
  //     return false;
  //   }

  //   if (!canSendToABIS) {
  //     toast.info("Mise à jour de l'envoi de l'employé à l'enrollement temporairement désactivée.");
  //     return false;
  //   }

  //   setSyncing(true);
  //   try {
  //     // TEMP: backend issue on ABIS update endpoint.
  //     // const response = await axios.put(API.updateABISEmployee(employeeSlug));
  //     const response = await axios.post(API.saveEmployeeToABIS(employeeSlug));

  //     const isSuccess =
  //       response?.status === 200 || response?.status === 201 || response?.data?.success;

  //     const message =
  //       response?.data?.message ||
  //       (isSuccess ? "Employé envoyé à l'enrollement avec succès" : null);

  //     if (isSuccess) {
  //       toast.success(message);
  //       if (onSyncSuccess) {
  //         await onSyncSuccess();
  //       }
  //       return true;
  //     }

  //     toast.error(response?.data?.message || "Echec lors de l'envoi à l'enrollement");
  //     return false;
  //   } catch (error) {
  //     const errorMessage =
  //       error?.response?.data?.message ||
  //       error?.response?.data?.detail ||
  //       error?.response?.data?.error ||
  //       error?.response?.data?.details ||
  //       error?.response?.data?.non_field_errors?.[0] ||
  //       error?.message ||
  //       'Erreur inconnue';
  //     toast.error(`Echec lors de l'envoi à l'enrollement: ${errorMessage}`);
  //     return false;
  //   } finally {
  //     setSyncing(false);
  //   }
  // };

  // Composant reutilisable pour les items d'information
  const InfoItem = ({ icon, label, value, isLink = false }) => (
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
            sx={{
              fontWeight: 500,
              fontSize: '0.875rem',
              color: 'text.primary',
              textDecoration: 'none',
              wordBreak: 'break-all',
              '&:hover': {
                textDecoration: 'underline',
                color: 'primary.main',
              },
            }}
          >
            {value || '-'}
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
            {value || '-'}
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

  const renderAbout = (
    <Card
      sx={{
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
            Informations Employe
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
            {/* <Chip
              icon={
                <Iconify
                  icon={info?.is_registered_in_abis ? 'mdi:check-circle' : 'mdi:close-circle'}
                  width={16}
                />
              }
              label={
                info?.is_registered_in_abis
                  ? "Envoye a l'enrollement"
                  : "Non envoye a l'enrollement"
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
            /> */}
            {/* {type === 'agent' && canSendToABIS && (
              <Chip
                icon={<Iconify icon="solar:refresh-bold" width={18} />}
                label={abisActionLabel}
                color="default"
                onClick={syncOpen.onTrue}
                disabled={syncing}
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
            )} */}
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* ================== Section Suivi ABIS ================== */}
        {/* ABIS désactivé  */}
        {/* {(info?.abis_last_sync_at || info?.abis_last_retrieved_at) && (
          <>
            <Box sx={{ mb: 3 }}>
              <SectionTitle title="Suivi Enrollement" />
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                {info?.abis_last_sync_at && (
                  <InfoItem
                    icon="solar:refresh-bold"
                    label="Derniere envoie a l'enrollement"
                    value={new Date(info?.abis_last_sync_at).toLocaleString('fr-FR')}
                  />
                )}
                {info?.abis_last_retrieved_at && (
                  <InfoItem
                    icon="mdi:download-circle"
                    label="Derniere recuperation depuis l'enrollement"
                    value={new Date(info?.abis_last_retrieved_at).toLocaleString('fr-FR')}
                  />
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />
          </>
        )} */}

        {/* ================== Section Identification ================== */}
        <Box sx={{ mb: 3 }}>
          <SectionTitle title="Identification" />
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <InfoItem icon="mdi:identifier" label="Reference" value={info?.reference} />
            <InfoItem icon="mdi:passport" label="Passeport" value={info?.passport_number} />
            <InfoItem
              icon={info?.sexe === 'male' ? 'mdi:gender-male' : 'mdi:gender-female'}
              label="Sexe"
              value={info?.sexe === 'male' ? 'Masculin' : 'Feminin'}
            />
            <InfoItem icon="mdi:calendar" label="Date de naissance" value={fDate(info?.birthday)} />
            <InfoItem icon="mdi:map-marker" label="Lieu de naissance" value={info?.birth_place} />
            <InfoItem icon="mdi:flag" label="Nationalite" value={info?.country} />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* ================== Section Contact ================== */}
        <Box sx={{ mb: 3 }}>
          <SectionTitle title="Contact" />
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <InfoItem icon="ic:baseline-phone" label="Telephone" value={info?.phone} />
            <InfoItem icon="ic:baseline-email" label="Email" value={info?.email} />
            <InfoItem icon="mdi:home" label="Adresse" value={info?.address} />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* ================== Section Contrat ================== */}
        <Box>
          <SectionTitle title="Contrat" />
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <InfoItem
              icon="mdi:calendar-start"
              label="Date de debut"
              value={fDate(info?.contract_starts_at)}
            />
            <InfoItem
              icon="mdi:calendar-clock"
              label="Duree"
              value={
                info?.contract_duration ? `${info?.contract_duration} mois` : '-'
              }
            />
            {info?.motif_rejet && (
              <InfoItem icon="mdi:alert-circle" label="Motif de rejet" value={info?.motif_rejet} />
            )}
          </Box>
        </Box>

        {/* ABIS désactivé  */}
        {/* <ConfirmDialog
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
        /> */}
      </Box>
    </Card>
  );

  return (
    <Grid size={{ xs: 12, md: 4 }}>
      <Stack spacing={3}>{renderAbout}</Stack>
    </Grid>
  );
}
