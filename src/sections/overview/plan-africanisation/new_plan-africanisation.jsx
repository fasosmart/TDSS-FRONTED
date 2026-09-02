'use client';

import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Alert,
  AlertTitle,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import {
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Event as EventIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { Form, Field, schemaHelper } from 'src/components/hook-form';
import API from 'src/utils/api';
import axios from 'src/utils/axios';
import { toast } from 'src/components/snackbar';
import { useBoolean } from 'src/hooks/use-boolean';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import { FileInputPreview } from './file-input-preview';

// ✅ --- Schéma de validation Zod ---
const documentSchema = (isEdit = false) =>
  z.object({
    name: isEdit
      ? z.string().optional() // facultatif ou désactivé en édition
      : z.string().min(1, 'Le nom du plan est requis'),
    file: isEdit ? z.any().optional() : schemaHelper.file(),
    description: z.string().optional(),
    expiry_date: isEdit ? z.string().optional() : z.string().date().optional(),

    first_name: z.string().min(1, 'Le prénom est requis'),
    last_name: z.string().min(1, 'Le nom de famille est requis'),
    birth_date: z.union([z.string().length(0), z.string().date()]),

    birth_place: z.string().optional(),
    residence: z.string().optional(),
    phone_number: schemaHelper.phoneNumber({ isValidPhoneNumber }),
    email: z.string().email('Adresse e-mail invalide'),
    identity_card_number: z.string().optional(),
    identity_card_scan: isEdit ? z.any().optional() : schemaHelper.file(),
    hire_date: z.union([z.string().length(0), z.string().date()]),
    contract_scan: isEdit ? z.any().optional() : schemaHelper.file(),
    duration_before_takeover: z
      .union([z.number(), z.literal('')])
      .transform((val) => (val === '' ? 0 : val)),
    training_plan_scan: isEdit ? z.any().optional() : schemaHelper.file(),
    notes: z.string().optional(),
    expected_takeover_date: z.union([z.string().length(0), z.string().date()]).optional(),
  });

export function AfricanizationPlanNew({ employeeId, plan, open, onClose, isEdit, onUpdate }) {
  const loadingSend = useBoolean();

  // --- Valeurs par défaut ---
  const defaultFormValues = useMemo(
    () => ({
      name: 'Plan de panafricanisation' || plan?.name,
      file: plan?.file || '',
      description: plan?.description || '',
      expiry_date: plan?.expiry_date || '',
      first_name: plan?.first_name || '',
      last_name: plan?.last_name || '',
      birth_date: plan?.birth_date || '',
      birth_place: plan?.birth_place || '',
      residence: plan?.residence || '',
      phone_number: plan?.phone_number || '',
      email: plan?.email || '',
      identity_card_number: plan?.identity_card_number || '',
      identity_card_scan: plan?.identity_card_scan || '',
      hire_date: plan?.hire_date || '',
      contract_scan: plan?.contract_scan || '',
      duration_before_takeover: plan?.duration_before_takeover || 0,
      training_plan_scan: plan?.training_plan_scan || '',
      notes: plan?.notes || '',
      expected_takeover_date: plan?.expected_takeover_date || '',
    }),
    [plan]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(documentSchema(isEdit)),
    defaultValues: defaultFormValues,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = methods;

  const [previews, setPreviews] = useState({});

  // --- Gestion upload fichiers + aperçu ---
  const handleFileChange = (event, fieldName) => {
    const file = event.target.files[0];
    if (file) {
      // on garde l'objet File pour le FormData
      setValue(fieldName, file, { shouldValidate: true });

      // Aperçu (optionnel)
      const previewUrl = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [fieldName]: previewUrl }));
    }
  };

  // --- Vérifie si le permis expire bientôt ---

  // --- Soumission du formulaire ---
  const onSubmit = async (values) => {
    loadingSend.onTrue();
    try {
      const formData = new FormData();

      // On parcourt toutes les paires clé/valeur du formulaire
      Object.entries(values).forEach(([key, value]) => {
        // ✅ Cas particulier : fichiers
        if (['identity_card_scan', 'contract_scan', 'training_plan_scan'].includes(key)) {
          // on n’ajoute que s’il y a un nouveau fichier
          if (value instanceof File) {
            formData.append(key, value);
          }
          return; // sinon, on saute
        }
        // ✅ Autres champs : on ignore ceux vides
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });

      formData.append('declaration_employee', employeeId);

      let response;
      if (isEdit && plan?.slug) {
        response = await axios.patch(API.detailsAfricanizationPlan(plan.slug), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success("Plan d'africanisation mis à jour avec succès");
        onUpdate(response.data);
      } else {
        response = await axios.post(API.createAfricanizationPlan(), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success("Plan d'africanisation créé avec succès");
        onUpdate(response.data);
      }

      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting Africanization Plan:', error?.error?.[0]);
      const errorMessage =
        error?.error?.[0] ||
        error?.details ||
        error?.detail ||
        error?.message ||
        "Une erreur est survenue lors de la soumission du plan d'africanisation.";
      toast.error(errorMessage);
    } finally {
      loadingSend.onFalse();
    }
  };

  useEffect(() => {
    if (isEdit && plan) {
      setPreviews({
        identity_card_scan: plan.identity_card_scan || null,
        contract_scan: plan.contract_scan || null,
        training_plan_scan: plan.training_plan_scan || null,
      });
    }
  }, [isEdit, plan]);

  // --- Si non expatrié, pas de plan ---

  return (
    <Card>
      {/* --- Dialog Formulaire --- */}
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {plan ? 'Modifier le plan d’africanisation' : 'Nouveau plan d’africanisation'}
          </DialogTitle>

          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              {/* Informations du plan de panafricanisation */}
              {!isEdit && (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <PersonIcon fontSize="small" /> Informations du plan de panafricanisation
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Field.Text
                        name="name"
                        label="Nom du plan *"
                        fullWidth
                        error={!!errors.name}
                        helperText={errors.name?.message}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Field.DatePicker
                        name="expiry_date"
                        label="Date d’expiration"
                        fullWidth
                        error={!!errors.expiry_date}
                        helperText={errors.expiry_date?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field.Upload
                        name="file"
                        label="Nom du plan *"
                        small
                        onDelete={() => setValue('file', null, { shouldValidate: true })}
                        error={!!errors.file}
                        helperText={errors.file?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field.Text
                        name="description"
                        label="Description"
                        fullWidth
                        error={!!errors.description}
                        helperText={errors.description?.message}
                      />
                    </Grid>
                  </Grid>
                </>
              )}
              <Divider />
              {/* --- Informations personnelles --- */}
              <Typography
                variant="subtitle1"
                sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <PersonIcon fontSize="small" /> Informations personnelles
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Field.Text
                    name="first_name"
                    label="Prénom(s) *"
                    fullWidth
                    error={!!errors.first_name}
                    helperText={errors.first_name?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field.Text
                    name="last_name"
                    label="Nom de famille *"
                    fullWidth
                    error={!!errors.last_name}
                    helperText={errors.last_name?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field.DatePicker
                    name="birth_date"
                    label="Date de naissance"
                    fullWidth
                    error={!!errors.birth_date}
                    helperText={errors.birth_date?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field.Text
                    name="birth_place"
                    label="Lieu de naissance *"
                    fullWidth
                    error={!!errors.birth_place}
                    helperText={errors.birth_place?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field.Text
                    name="residence"
                    label="Résidence *"
                    fullWidth
                    error={!!errors.residence}
                    helperText={errors.residence?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field.Phone
                    name="phone_number"
                    label="Numéro de téléphone *"
                    fullWidth
                    error={!!errors.phone_number}
                    helperText={errors.phone_number?.message}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field.Text
                    name="email"
                    label="Adresse e-mail *"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                </Grid>
              </Grid>

              <Divider />

              {/* --- Documents d'identité --- */}
              <Typography
                variant="subtitle1"
                sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <DescriptionIcon fontSize="small" /> Documents d'identité
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Field.Text
                    name="identity_card_number"
                    label="Numéro de la carte *"
                    fullWidth
                    error={!!errors.identity_card_number}
                    helperText={errors.identity_card_number?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FileInputPreview
                    label="Scan carte"
                    name="identity_card_scan"
                    previews={previews}
                    setPreviews={setPreviews}
                    setValue={setValue}
                    error={errors.identity_card_scan}
                    isEdit={isEdit}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FileInputPreview
                    label="Scan contrat"
                    name="contract_scan"
                    previews={previews}
                    setPreviews={setPreviews}
                    setValue={setValue}
                    error={errors.contract_scan}
                    isEdit={isEdit}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FileInputPreview
                    label="Plan de formation"
                    name="training_plan_scan"
                    previews={previews}
                    setPreviews={setPreviews}
                    setValue={setValue}
                    error={errors.training_plan_scan}
                    isEdit={isEdit}
                  />
                </Grid>
              </Grid>

              <Divider />

              {/* --- Informations professionnelles --- */}
              <Typography
                variant="subtitle1"
                sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <EventIcon fontSize="small" /> Informations professionnelles
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Field.DatePicker name="hire_date" label="Date d’embauche *" fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field.Text
                    name="duration_before_takeover"
                    label="Durée avant reprise (en mois) *"
                    type="number"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field.DatePicker
                    name="expected_takeover_date"
                    label="Date prévue de reprise"
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose}>Annuler</Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting || loadingSend.value}
            >
              {plan ? 'Mettre à jour' : 'Créer'}
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>
    </Card>
  );
}
