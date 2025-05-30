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
  Box
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import axios from 'src/utils/axios';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';
import { z } from 'zod';
import { toast } from 'sonner';
import API from 'src/utils/api';
import { getDevises, getCountries } from 'src/utils/options';
import { Form, Field , schemaHelper } from 'src/components/hook-form';

const NewPayeurSchema = z.object({
  payer_last: z.string().min(1, { message: 'Le nom est obligatoire' }),
  payer_first: z.string().min(1, { message: 'Le prénom est obligatoire' }),
  payer_email: z.string().email({ message: 'Email invalide' }),
  payer_phone: schemaHelper.phoneNumber({ isValidPhoneNumber }),
  payer_country_origin: z.string(),
  payer_address: z.string().min(1, { message: 'L’adresse est obligatoire' }),
  payment_document: z
    .any()
    // .refine(file => file instanceof File && file.type === 'application/pdf', {
    //   message: 'Le fichier doit être un PDF'
    // })
    ,
  payment_devise: z.string().min(1, { message: 'La devise est requise' }),
  payment_payment_method: z.string().min(1, { message: 'Le mode de paiement est requis' }),
  payment_comment: z.string().optional()
});

export function PayeurForm({ slug, open, onclose, onSuccess }) {
  const [devises, setDevises] = useState([]);
  const [countries, setCountries] = useState([]);
  const [step, setStep] = useState(1);

  const paymentTypes = [
    { id: 'TRANSFER', label: 'Virement' },
    { id: 'DEPOSIT',  label: 'Dêpot' },
    { id: 'CHEQUE',   label: 'Chèques' }
  ];

  const defaultValues = useMemo(() => ({
    payer_last: '',
    payer_first: '',
    payer_email: '',
    payer_phone: '',
    payer_country_origin: '',
    payer_address: '',
    payment_document: null,
    payment_devise: '',
    payment_payment_method: '',
    payment_comment: ''
  }), []);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(NewPayeurSchema),
    defaultValues
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset
  } = methods;

  useEffect(() => {
    getDevises().then(setDevises);
    getCountries().then(setCountries);
  }, []);

  const handleNext = () => {
  setStep(2);
};



  const onSubmit = handleSubmit(async data => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'payment_document' && value instanceof File) {
          formData.append(key, value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
  
      await axios.post(API.paidFacture(slug), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      reset();
      toast.success('Mise à jour réussie !');
      onSuccess();
      onclose();
    } catch (error) {
      console.error("Erreur lors de l'envoi au backend :", error);
      toast.error('Une erreur est survenue.');
    }
  });
  

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onclose} >
     <DialogTitle sx={{ color: 'text.disabled' }}>
        {step === 1 && "Information du Payeur"}
        {step === 2 && "Information du Paiement"}
       
      </DialogTitle>


      <Form methods={methods} onSubmit={onSubmit}>

        <DialogContent dividers>
          
          <Box sx={{ mt: 1 }}>
            {step ===  1 && (
               <>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 , md:6}}>
                <Field.Text label="Nom" name="payer_last" />
              </Grid>
              <Grid item size={{ xs: 12 , md:6}}>
                <Field.Text label="Prénom" name="payer_first" />
              </Grid>
              <Grid item size={{ xs: 12 , md:6}}>
                <Field.Text label="Email" name="payer_email" />
              </Grid>
              <Grid item size={{ xs: 12 , sm:6}}>
                <Field.Phone label="Téléphone" name="payer_phone" />
              </Grid>
              <Grid item size={{ xs: 12 , md:6}}>
                <Field.Text label="Adresse" name="payer_address" />
              </Grid>
              <Grid item size={{ xs: 12 , md:6}}>
                <Field.Select
                  fullWidth
                  // size="small"
                  name="payer_country_origin"
                  label="Nationalité"
                  placeholder="Sélectionnez un pays"
                  inputlabelprops={{ shrink: true }}
                >
                  {countries.map(c => (
                    <MenuItem key={c.slug} value={c.slug}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>
               
              </Grid>
              <Box sx={{ display:'flex', justifyContent:'flex-end' , mt: 3 }}>
                    <Button variant="contained" onClick={handleNext}>
                         "Suivant" 

                    </Button>
                </Box>
              </>
              )}

             {step === 2 && (
  <Grid container spacing={2}>
    {/* Partie gauche : Upload */}
    <Grid item size={{ xs: 12 , md:6}}>
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
        <Field.Upload
          name="payment_document"
          control={control}
          render={({ field }) => (
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => field.onChange(e.target.files?.[0])}
            />
          )}
        />
      </Card>
    </Grid>

    {/* Partie droite : Formulaire de paiement */}
    <Grid item size={{ xs: 12 , md:6}}>
      <Card
        sx={{
          p: 3,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12 , md:12}}>
            <Field.Select name="payment_devise" label="Devise">
              {devises.map((d) => (
                <MenuItem key={d.slug} value={d.slug}>
                  {d.name}
                </MenuItem>
              ))}
            </Field.Select>
          </Grid>
          <Grid item size={{ xs: 12 , md:12}}>
            <Field.Select name="payment_payment_method" label="Mode de Paiement">
              {paymentTypes.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.label}
                </MenuItem>
              ))}
            </Field.Select>
          </Grid>
          <Grid item size={{ xs: 12 }}>
            <Field.Text
              label="Commentaire"
              name="payment_comment"
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
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Payer
          </Button>
        </DialogActions>
        )}
      </Form>
    </Dialog>
  );
}
