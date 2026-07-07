'use client';

import { useCallback, useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import { TextField } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from 'src/components/snackbar';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { useBoolean } from 'src/hooks/use-boolean';
import { ConfirmDialog } from 'src/components/custom-dialog';
import API from 'src/utils/api';
import axios from 'src/utils/axios';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { AfricanizationPlanNew } from '../new_plan-africanisation';
import { DetailNotFoundView } from 'src/sections/error';

// ----------------------------------------------------------------------

// Composant InfoItem
function InfoItem({ icon, label, value, isLink = false, onClick, fullWidth = false }) {
  return (
    <Box
      sx={{
        minWidth: fullWidth
          ? '100%'
          : { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)' },
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
          <Button
            variant="text"
            color="primary"
            onClick={onClick}
            startIcon={<Iconify icon="mdi:open-in-new" width={16} />}
            sx={{
              p: 0,
              minWidth: 'auto',
              textTransform: 'none',
              justifyContent: 'flex-start',
              fontWeight: 500,
              fontSize: '0.875rem',
              '&:hover': {
                bgcolor: 'transparent',
                textDecoration: 'underline',
              },
            }}
          >
            {value}
          </Button>
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
}

// Composant SectionTitle
function SectionTitle({ title, icon }) {
  return (
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
      <Iconify icon={icon} width={20} sx={{ mr: 1 }} />
      {title}
    </Typography>
  );
}

// ----------------------------------------------------------------------

export function AfricanizationPlanDetails({ slug }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [permits, setPermits] = useState([]);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [loadingP, setLoadingP] = useState(false);

  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const editConfirm = useBoolean();
  const reassignConfirm = useBoolean();

  const handleOpenEdit = () => {
    setIsEdit(true);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  useEffect(() => {
    const fecthPermits = async () => {
      setLoadingP(true);
      try {
        const resp1 = await axios.get(API.listPermitsEmployees(), {
          params: { offset: 0, limit: 100, status: 'processing' },
        });
        if (resp1?.data) {
          const permits = resp1?.data?.results
            .filter((p) => p.reference !== plan?.associated_declarations[0]?.reference)
            .map((p) => ({
              value: p?.slug,
              label: `${p?.job?.permit} - ${p?.first} ${p?.last} - ${p?.company_name}`,
            }));
          setPermits(permits);
        }

        const total = resp1?.data?.count;
        if (total > 100) {
          const resp2 = await axios.get(API.listPermitsEmployees(), {
            params: { offset: 0, limit: total },
          });
          if (resp2?.data) {
            const permits = resp2?.data?.results
              .filter((p) => p.reference !== plan?.associated_declarations[0]?.reference)
              .map((p) => ({
                value: p?.slug,
                label: `${p?.job?.permit} - ${p?.first} ${p?.last} - ${p?.company_name}`,
              }));
            setPermits(permits);
          }
        }
      } catch (error) {
        const errorMessage = error?.error || error?.details || error?.message || error?.detail;
        setError(errorMessage);
        console.error('Erreur réseau ou serveur:', error);
        toast.error(errorMessage);
      } finally {
        setLoadingP(false);
      }
    };
    if (reassignConfirm.value) {
      fecthPermits();
    }
  }, [reassignConfirm?.value]);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const response = await axios.get(API.detailsAfricanizationPlan(slug));
      setPlan(response?.data);
    } catch (err) {
      if (err?.status === 404) {
        setNotFound(true);
      } else {
        const errorMessage =
          err?.error ||
          err?.details ||
          err?.message ||
          err?.detail ||
          'Erreur lors de la récupération des détails du plan';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleUpdate = () => {
    fetchPlans();
  };

  const handleReassign = async (slug) => {
    try {
      const payload = {
        new_declaration_employee_slug: selectedPermit?.value,
      };
      const response = await axios.post(API.reassign(slug), payload);
      if (response?.data || response?.status === 201) {
        toast.success('Réassignation de ce plan avec succès');
        handleUpdate();
      } else {
        toast.error(`Erreur : ${response?.data?.error}`);
      }
    } catch (error) {
      const errorMessage = error?.error || error?.details || error?.message || error?.detail;
      setError(errorMessage);
      console.error('Erreur réseau ou serveur:', error);
      toast.error(error);
    }
  };

  const handleDetailViewPermit = async (slug) => {
    router?.push(paths?.dashboard?.permit?.details(slug));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      actif: { color: 'success', label: 'Actif', icon: 'mdi:check-circle' },
      inactif: { color: 'default', label: 'Inactif', icon: 'mdi:cancel' },
      termine: { color: 'info', label: 'Terminé', icon: 'mdi:check-all' },
    };
    return configs[status] || { color: 'default', label: status, icon: 'mdi:information' };
  };

  const getDeclarationStatusConfig = (status) => {
    const configs = {
      processing: { color: 'warning', label: 'En cours', icon: 'mdi:clock-outline' },
      validated: { color: 'success', label: 'Validé', icon: 'mdi:check-circle' },
      rejected: { color: 'error', label: 'Rejeté', icon: 'mdi:close-circle' },
      submitted: { color: 'primary', label: 'Soumis', icon: 'mdi:package-variant-closed' },
      delivered: { color: 'success', label: 'Délivré', icon: 'mdi:package-variant-closed' },
      printed: { color: 'info', label: 'Imprimé', icon: 'mdi:printer' },
    };
    return configs[status] || { color: 'default', label: status, icon: 'mdi:information' };
  };

  // Loading State
  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <CustomBreadcrumbs
            heading="Détails"
            links={[
              { name: 'Dashboard', href: paths.dashboard.root },
              { name: 'Plan Africanisation', href: paths.dashboard.planAfricanisation.root },
              { name: 'Détails Plan Africanisation' },
            ]}
            sx={{ mb: { xs: 3, md: 5 } }}
          />
        </Box>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 3 }}>
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
            </Card>
          </Grid>
        </Grid>
      </DashboardContent>
    );
  }

  // Error State
  if (notFound) {
    return (
      <DashboardContent>
        <DetailNotFoundView
          title="Plan d'africanisation introuvable"
          href={paths.dashboard.planAfricanisation.root}
        />
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <CustomBreadcrumbs
            heading="Détails"
            links={[
              { name: 'Dashboard', href: paths.dashboard.root },
              { name: 'Plan Africanisation', href: paths.dashboard.planAfricanisation.root },
              { name: 'Détails Plan Africanisation' },
            ]}
            sx={{ mb: { xs: 3, md: 5 } }}
          />
        </Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </DashboardContent>
    );
  }

  // Empty State
  if (!plan) {
    return (
      <DashboardContent>
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <CustomBreadcrumbs
            heading="Détails"
            links={[
              { name: 'Dashboard', href: paths.dashboard.root },
              { name: 'Plan Africanisation', href: paths.dashboard.planAfricanisation.root },
              { name: 'Détails Plan Africanisation' },
            ]}
            sx={{ mb: { xs: 3, md: 5 } }}
          />
        </Box>
        <Alert severity="info">Aucun plan trouvé</Alert>
      </DashboardContent>
    );
  }

  const statusConfig = getStatusConfig(plan?.status);

  return (
    <DashboardContent>
      {/* <Box sx={{ mb: { xs: 3, md: 5 } }}> */}
      <CustomBreadcrumbs
        heading="Détails"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Plan Africanisation', href: paths.dashboard.planAfricanisation.root },
          { name: 'Détails Plan Africanisation' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      {/* </Box> */}
      {plan?.status !== 'termine' && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            mb: 2,
          }}
        >
          <Button variant="contained" onClick={editConfirm.onTrue}>
            Modifier
          </Button>
          <Button variant="contained" onClick={reassignConfirm.onTrue}>
            Assigner
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Hero Card - Informations principales */}

        <Grid size={{ xs: 12 }}>
          <Card
            sx={{
              p: { xs: 3, md: 4 },
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.lighter} 0%, ${theme.palette.background.paper} 100%)`,
              boxShadow: (theme) => theme.customShadows?.z8,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: { xs: 60, md: 80 },
                    height: { xs: 60, md: 80 },
                    bgcolor: 'primary.main',
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    fontWeight: 700,
                  }}
                >
                  {plan?.first_name?.charAt(0)}
                  {plan?.last_name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {plan?.full_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Iconify icon="mdi:identifier" width={16} />
                    {plan?.reference}
                  </Typography>
                </Box>
              </Box>
              <Chip
                icon={<Iconify icon={statusConfig.icon} width={20} />}
                label={statusConfig.label}
                color={statusConfig.color}
                sx={{
                  height: 40,
                  px: 2,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              />
            </Box>
          </Card>
        </Grid>

        {/* Informations Personnelles */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              p: { xs: 2.5, sm: 3, md: 4 },
              height: '100%',
              boxShadow: (theme) => theme.customShadows?.card,
              transition: 'box-shadow 0.3s ease-in-out',
              '&:hover': {
                boxShadow: (theme) => theme.customShadows?.z8,
              },
            }}
          >
            <SectionTitle title="Informations Personnelles" icon="mdi:account-details" />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <InfoItem icon="mdi:account" label="Prénom" value={plan?.first_name} />
              <InfoItem icon="mdi:account" label="Nom" value={plan?.last_name} />
              <InfoItem
                icon="mdi:cake-variant"
                label="Date de Naissance"
                value={formatDate(plan?.birth_date)}
              />
              <InfoItem icon="mdi:map-marker" label="Lieu de Naissance" value={plan?.birth_place} />
              <InfoItem icon="mdi:home-city" label="Résidence" value={plan?.residence} />
              <InfoItem icon="ic:baseline-phone" label="Téléphone" value={plan?.phone_number} />
              <InfoItem icon="ic:baseline-email" label="Email" value={plan?.email} />
              <InfoItem
                icon="mdi:card-account-details"
                label="N° Carte d'Identité"
                value={plan?.identity_card_number}
              />
            </Box>
          </Card>
        </Grid>

        {/* Informations du Plan */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              p: { xs: 2.5, sm: 3, md: 4 },
              height: '100%',
              boxShadow: (theme) => theme.customShadows?.card,
              transition: 'box-shadow 0.3s ease-in-out',
              '&:hover': {
                boxShadow: (theme) => theme.customShadows?.z8,
              },
            }}
          >
            <SectionTitle title="Informations Professionnelles" icon="mdi:calendar-clock" />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <InfoItem
                icon="mdi:calendar-start"
                label="Date d'Embauche"
                value={formatDate(plan?.hire_date)}
              />
              <InfoItem
                icon="mdi:timer-sand"
                label="Durée avant Prise de Fonction"
                value={
                  plan?.duration_before_takeover ? `${plan.duration_before_takeover} mois` : 'N/A'
                }
              />
              <InfoItem
                icon="mdi:calendar-check"
                label="Date de Prise de Fonction Prévue"
                value={formatDate(plan?.expected_takeover_date)}
              />
              {plan?.actual_takeover_date && (
                <InfoItem
                  icon="mdi:calendar-star"
                  label="Date de Prise de Fonction Réelle"
                  value={formatDate(plan?.actual_takeover_date)}
                />
              )}
              {plan?.notes && (
                <InfoItem icon="mdi:note-text" label="Notes" value={plan?.notes} fullWidth />
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Documents
            </Typography>
            <Stack spacing={1.5}>
              {plan?.identity_card_scan && (
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="mdi:card-account-details" />}
                  href={plan.identity_card_scan}
                  target="_blank"
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Carte d'Identité
                </Button>
              )}
              {plan?.contract_scan && (
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="mdi:file-document" />}
                  href={plan.contract_scan}
                  target="_blank"
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Contrat de Travail
                </Button>
              )}
              {plan?.training_plan_scan && (
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="mdi:school" />}
                  href={plan.training_plan_scan}
                  target="_blank"
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Plan de Formation
                </Button>
              )}
            </Stack>
          </Card>
        </Grid>

        {/* Informations Expatrié */}
        {plan?.expatriate_info && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: { xs: 2.5, sm: 3, md: 4 },
                height: '100%',
                boxShadow: (theme) => theme.customShadows?.card,
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: (theme) => theme.customShadows?.z8,
                },
              }}
            >
              <SectionTitle title="Expatrié Associé" icon="mdi:passport" />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <InfoItem
                  icon="mdi:account"
                  label="Nom Complet"
                  value={`${plan.expatriate_info.first} ${plan.expatriate_info.last}`}
                />
                <InfoItem
                  icon="mdi:passport"
                  label="N° Passeport"
                  value={plan.expatriate_info.passport_number}
                />
                <InfoItem icon="mdi:briefcase" label="Poste" value={plan.expatriate_info.job} />
                <InfoItem
                  icon="mdi:calendar-start"
                  label="Début de Contrat"
                  value={formatDate(plan.expatriate_info.contract_starts_at)}
                />
                <InfoItem
                  icon="mdi:calendar-clock"
                  label="Durée du Contrat"
                  value={
                    plan.expatriate_info.contract_duration
                      ? `${plan.expatriate_info.contract_duration} mois `
                      : 'N/A'
                  }
                />
              </Box>
            </Card>
          </Grid>
        )}

        {/* Informations Entreprise */}
        {plan?.company_info && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: { xs: 2.5, sm: 3, md: 4 },
                height: '100%',
                boxShadow: (theme) => theme.customShadows?.card,
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: (theme) => theme.customShadows?.z8,
                },
              }}
            >
              <SectionTitle title="Entreprise" icon="mdi:domain" />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <InfoItem
                  icon="mdi:domain"
                  label="Nom de l'Entreprise"
                  value={plan.company_info.name}
                  fullWidth
                />
                <InfoItem
                  icon="ic:baseline-email"
                  label="Email"
                  value={plan.company_info.email}
                  fullWidth
                />
              </Box>
            </Card>
          </Grid>
        )}

        {openForm && (
          <AfricanizationPlanNew
            open={openForm}
            onClose={handleCloseForm}
            plan={isEdit ? plan : null}
            employeeId={plan?.associated_declarations?.[0]?.slug}
            isEdit={isEdit}
            onUpdate={handleUpdate}
          />
        )}

        {/* Déclarations Associées */}
        {plan?.associated_declarations && plan.associated_declarations.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                p: { xs: 2.5, sm: 3, md: 4 },
                boxShadow: (theme) => theme.customShadows?.card,
              }}
            >
              <SectionTitle title="Permis Associées" icon="mdi:file-multiple" />
              <Stack spacing={2}>
                {plan.associated_declarations.map((declaration) => {
                  const declStatusConfig = getDeclarationStatusConfig(declaration.status);
                  return (
                    <Card
                      key={declaration.slug}
                      onClick={() => handleDetailViewPermit(declaration.slug)}
                      sx={{
                        p: 2.5,
                        bgcolor: 'background.neutral',
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'primary.lighter',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Référence: {declaration.reference}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Déclaration: {declaration.declaration_reference}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            Créée le: {formatDate(declaration.created_on)}
                          </Typography>
                        </Box>
                        <Chip
                          icon={<Iconify icon={declStatusConfig.icon} width={16} />}
                          label={declStatusConfig.label}
                          color={declStatusConfig.color}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Card>
                  );
                })}
              </Stack>
            </Card>
          </Grid>
        )}
      </Grid>
      <ConfirmDialog
        open={editConfirm.value}
        onClose={editConfirm.onFalse}
        title="Modifier le plan de panafricanisation"
        content="Voulez-vous vraiment modifier ce plan  ?"
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              editConfirm.onFalse();
              handleOpenEdit();
            }}
          >
            Oui
          </Button>
        }
      />

      <ConfirmDialog
        open={reassignConfirm.value}
        onClose={reassignConfirm.onFalse}
        title="Reassigner ce plan à un autre permit"
        content={
          <Autocomplete
            size="small"
            sx={{ mb: 2 }}
            options={permits}
            getOptionLabel={(opt) => opt?.label}
            loading={loadingP}
            fullWidth
            value={selectedPermit}
            onChange={(event, newValue) => setSelectedPermit(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Rechercher ou selectionner un permit "
                placeholder="Taper pour rechercher"
                variant="outlined"
                size="small"
                sx={{ mt: 2 }}
                fullWidth
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingP ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
        }
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              reassignConfirm.onFalse();
              handleReassign(slug);
            }}
          >
            Assigner
          </Button>
        }
      />
    </DashboardContent>
  );
}
