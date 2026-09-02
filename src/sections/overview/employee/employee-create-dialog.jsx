'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';
import { z as zod } from 'zod';

import LoadingButton from '@mui/lab/LoadingButton';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import API from 'src/utils/api';
import axios from 'src/utils/axios';
import { toast } from 'src/components/snackbar';
import { Field, Form, schemaHelper } from 'src/components/hook-form';

const SEXE_OPTIONS = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
];

const EmployeeCreateSchema = zod.object({
  passport_number: zod.string().min(1, { message: 'Le numero de passeport est obligatoire.' }),
  first: zod.string().min(1, { message: 'Le prenom est obligatoire.' }),
  last: zod.string().min(1, { message: 'Le nom est obligatoire.' }),
  sexe: zod.enum(['male', 'female'], {
    required_error: 'Le sexe est obligatoire.',
    invalid_type_error: 'Le sexe est obligatoire.',
  }),
  birthday: zod
    .string()
    .min(1, { message: 'La date de naissance est obligatoire.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date de naissance invalide.' }),
  birth_place: zod.string().min(1, { message: 'Le lieu de naissance est obligatoire.' }),
  email: zod
    .string()
    .min(1, { message: "L'email est obligatoire." })
    .email({ message: 'Email invalide.' }),
  phone: schemaHelper.phoneNumber({
    isValidPhoneNumber,
    message: { required_error: 'Le telephone est obligatoire.' },
  }),
  address: zod.string().min(1, { message: "L'adresse est obligatoire." }),
  country: zod.string().min(1, { message: 'Veuillez selectionner un pays.' }),
});

const getDefaultValues = () => ({
  passport_number: '',
  first: '',
  last: '',
  sexe: 'male',
  birthday: new Date().toISOString().slice(0, 10),
  birth_place: '',
  email: '',
  phone: '',
  address: '',
  country: '',
});

function getErrorMessage(error) {
  const fallback = "Erreur lors de l'ajout de l'employe.";
  const data = error?.response?.data;

  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.filter(Boolean).join(' ') || fallback;

  if (typeof data === 'object') {
    const messages = Object.entries(data).flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value.map((message) => `${field}: ${message}`);
      }
      return value ? [`${field}: ${value}`] : [];
    });

    return messages.join(' ') || fallback;
  }

  return fallback;
}

export function EmployeeCreateDialog({ open, onClose, onCreated }) {
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(EmployeeCreateSchema),
    defaultValues: getDefaultValues(),
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = methods;

  useEffect(() => {
    if (!open) return;
    reset(getDefaultValues());
  }, [open, reset]);

  useEffect(() => {
    let isMounted = true;

    const fetchCountries = async () => {
      if (!open || countries.length > 0) return;

      setLoadingCountries(true);
      try {
        const firstResponse = await axios.get(API.listCountry(), {
          params: { offset: 0, limit: 100 },
        });

        const total = firstResponse?.data?.count || 0;

        if (total > 100) {
          const fullResponse = await axios.get(API.listCountry(), {
            params: { offset: 0, limit: total },
          });

          if (isMounted) setCountries(fullResponse?.data?.results || []);
        } else if (isMounted) {
          setCountries(firstResponse?.data?.results || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des pays:', error);
        toast.error('Impossible de charger la liste des pays.');
      } finally {
        if (isMounted) setLoadingCountries(false);
      }
    };

    fetchCountries();

    return () => {
      isMounted = false;
    };
  }, [open, countries.length]);

  const handleClose = () => {
    if (isSubmitting) return;
    reset(getDefaultValues());
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axios.post(API.CreateEmployee, data, {
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success('Employe ajoute avec succes.');
      reset(getDefaultValues());
      onClose();
      onCreated?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const selectedCountrySlug = watch('country');
  const selectedCountryOption =
    countries.find((country) => country.slug === selectedCountrySlug) || null;

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={handleClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Ajouter un employe</DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              mt: 1,
              gap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <Field.Text required name="passport_number" label="Numero de passeport" />

            <Field.Text required name="first" label="Prenom" />

            <Field.Text required name="last" label="Nom" />

            <Field.Select required name="sexe" label="Sexe">
              {SEXE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.DatePicker
              name="birthday"
              label="Date de naissance"
              slotProps={{
                textField: {
                  required: true,
                  fullWidth: true,
                },
              }}
            />

            <Field.Text required name="birth_place" label="Lieu de naissance" />

            <Field.Text required name="email" label="Email" type="email" />

            <Field.Phone required name="phone" label="Telephone" />

            <Field.Text required name="address" label="Adresse" />

            <Autocomplete
              options={countries}
              loading={loadingCountries}
              fullWidth
              getOptionLabel={(option) => option?.name || ''}
              isOptionEqualToValue={(option, value) => option.slug === value.slug}
              value={selectedCountryOption}
              filterOptions={(options, state) =>
                options.filter((option) =>
                  option.name?.toLowerCase().includes(state.inputValue.trim().toLowerCase())
                )
              }
              onChange={(event, option) => {
                setValue('country', option?.slug || '', { shouldValidate: true });
              }}
              renderOption={(props, option, { index }) => (
                <li {...props} key={`${option.slug}-${index}`}>
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Pays"
                  error={!!errors.country}
                  helperText={errors.country?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingCountries ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>
            Annuler
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Ajouter
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
