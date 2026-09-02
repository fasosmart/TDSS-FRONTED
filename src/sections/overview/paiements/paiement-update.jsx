'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  Button,
  MenuItem,
  Box,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import axios from 'src/utils/axios';
import React, { useEffect, useState } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';
import { z } from 'zod';
import { toast } from 'sonner';
import API from 'src/utils/api';
import { getDevises, getCountries } from 'src/utils/options';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import LoadingButton from '@mui/lab/LoadingButton';
import IconButton from '@mui/material/IconButton';
import { Iconify } from 'src/components/iconify';

const NewPayeurSchema = z.object({
  payer: z.object({
    last: z.string().min(1, { message: 'Le nom est obligatoire' }),
    first: z.string().min(1, { message: 'Le prénom est obligatoire' }),
    email: z.string().email({ message: 'Email invalide' }),
    phone: schemaHelper.phoneNumber({ isValidPhoneNumber }),
    country_origin: z.string(),
    address: z.string().min(1, { message: 'L’adresse est obligatoire' }),
  }),
  document: z.any(),
  devise: z.string().min(1, { message: 'La devise est requise' }),
  comment: z.string().optional(),
  payment_method: z.string().optional(),
});

export function UpdatePaiement({ paiement, open, onclose, onSuccess }) {
  const [devises, setDevises] = useState([]);
  const [countries, setCountries] = useState([]);
  const [step, setStep] = useState(1);
  const [showPdf, setShowPdf] = useState(true);

  const methodsLabels = {
    transfer: 'Virement',
    cheque: 'Chèque',
    deposit: 'Espèces',
  };

  // Form initialisation
  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(NewPayeurSchema),
    defaultValues: {
      payer: {
        last: '',
        first: '',
        email: '',
        phone: '',
        country_origin: '',
        address: '',
      },
      document: null,
      devise: '',
      comment: '',
      payment_method: '',
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    setValue,
  } = methods;

  const documentValue = useWatch({
    control,
    name: 'document',
  });

  // Charger devises & pays
  useEffect(() => {
    getDevises().then(setDevises);
    getCountries().then(setCountries);
  }, []);

  // Mettre à jour le formulaire quand paiement est dispo
  useEffect(() => {
    if (paiement) {
      const currentCountry = countries.find(
        (country) => country.name === paiement?.payer?.country_origin
      );
      reset({
        payer: {
          last: paiement?.payer?.last || '',
          first: paiement?.payer?.first || '',
          email: paiement?.payer?.email || '',
          phone: paiement?.payer?.phone || '',
          country_origin: currentCountry
            ? currentCountry.slug
            : paiement?.payer?.country_origin || '',
          address: paiement?.payer?.address || '',
        },
        document: paiement?.document || null,
        devise: paiement?.devise?.slug || '',
        comment: paiement?.comment || '',
        payment_method: paiement?.payment_method || '',
      });
    }
  }, [paiement, countries]);

  const handleNext = () => setStep(2);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const formData = new FormData();

      // Champs payer
      formData.append('payer[first]', data.payer.first);
      formData.append('payer[last]', data.payer.last);
      formData.append('payer[email]', data.payer.email);
      formData.append('payer[phone]', data.payer.phone);
      formData.append('payer[country_origin]', data.payer.country_origin);
      formData.append('payer[address]', data.payer.address);

      // Champs simples
      formData.append('devise', data.devise);
      formData.append('comment', data.comment || '');
      formData.append('payment_method', data.payment_method || '');
      // Fichier
      if (data.document instanceof File) {
        formData.append('document', data.document);
      }

      await axios.patch(API.updatepayment(paiement?.slug), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      reset();
      toast.success('Paiement mis à jour avec succès !');
      onSuccess?.();
      onclose?.();
    } catch (error) {
      console.error("Erreur lors de l'envoi au backend :", error);
      toast.error('Une erreur est survenue.');
    }
  });

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onclose}>
      <DialogTitle sx={{ color: 'text.disabled' }}>
        {step === 1 && 'Information du Payeur'}
        {step === 2 && 'Information du Paiement'}
        <IconButton
          onClick={() => {
            onclose();
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'grey.300' },
          }}
        >
          <Iconify icon="mdi:close" width={20} height={20} />
        </IconButton>
      </DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent dividers>
          <Box sx={{ mt: 1 }}>
            {step === 1 && (
              <>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Field.Text label="Nom *" name="payer.last" />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <Field.Text label="Prénom *" name="payer.first" />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <Field.Text label="Email *" name="payer.email" />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <Field.Phone label="Téléphone *" name="payer.phone" />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <Field.Text label="Adresse *" name="payer.address" />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <Field.Select
                      fullWidth
                      name="payer.country_origin"
                      label="Nationalité"
                      placeholder="Sélectionnez un pays"
                      inputlabelprops={{ shrink: true }}
                    >
                      {countries.map((c) => (
                        <MenuItem key={c.slug} value={c.slug}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button variant="contained" onClick={handleNext}>
                    Suivant
                  </Button>
                </Box>
              </>
            )}

            {step === 2 && (
              <Grid container spacing={2}>
                {/* Partie gauche : Upload */}
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Card
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      boxShadow: 3,
                      borderRadius: 2,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    {/* Aperçu du PDF déjà existant */}
                    {paiement?.document && showPdf ? (
                      <Box sx={{ width: '100%', height: 300, mb: 2, position: 'relative' }}>
                        <IconButton
                          onClick={() => {
                            setShowPdf(false);
                            setValue('document', null, { shouldValidate: true });
                          }}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'grey.200' },
                          }}
                        >
                          <Iconify icon="mdi:close" width={20} height={20} />
                        </IconButton>
                        <iframe
                          src={paiement.document}
                          title="Document PDF"
                          width="100%"
                          height="100%"
                          style={{ border: 'none' }}
                        />
                      </Box>
                    ) : (
                      // Composant upload
                      <Field.Upload
                        name="document"
                        onDelete={() => setValue('document', null, { shouldValidate: true })}
                      />
                    )}
                  </Card>
                </Grid>

                {/* Partie droite : Formulaire de paiement */}
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Card
                    sx={{
                      p: 3,
                      boxShadow: 3,
                      borderRadius: 2,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item size={{ xs: 12, md: 12 }}>
                        <Field.Select name="devise" label="Devise *">
                          {devises.map((d) => (
                            <MenuItem key={d.slug} value={d.slug}>
                              {d.name}
                            </MenuItem>
                          ))}
                        </Field.Select>
                      </Grid>

                      <Grid item size={{ xs: 12, md: 12 }}>
                        <Field.Select name="payment_method" label="Méthode de paiement">
                          {Object.entries(methodsLabels).map(([value, label]) => (
                            <MenuItem key={value} value={value}>
                              {label}
                            </MenuItem>
                          ))}
                        </Field.Select>
                      </Grid>

                      <Grid item size={{ xs: 12 }}>
                        <Field.Text
                          label="Commentaire"
                          name="comment"
                          multiline
                          rows={3}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>

        {step === 2 && (
          <DialogActions sx={{ pr: 3, pb: 2 }}>
            <Button variant="outlined" onClick={() => setStep(1)}>
              Retour
            </Button>

            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              Enregistrer
            </LoadingButton>
          </DialogActions>
        )}
      </Form>
    </Dialog>
  );
}
