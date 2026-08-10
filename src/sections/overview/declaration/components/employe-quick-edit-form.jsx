'use client';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';
import { toast } from 'sonner';
import { z as zod } from 'zod';
import CircularProgress from '@mui/material/CircularProgress';
import { TextField, Autocomplete, MenuItem } from '@mui/material';

import { Form, Field, schemaHelper } from 'src/components/hook-form';

import API from 'src/utils/api';
import axios from 'src/utils/axios';

import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export const employeQuickEditSchema = zod.object({
  first: zod.string().min(1, { message: 'le prenom est obligatoire' }),
  last: zod.string().min(1, { message: 'le nom est obligatoire' }),
  passport_number: zod.string().min(1, { message: 'le numero de passeport est obligatoire' }),

  phone: schemaHelper.phoneNumber({ isValidPhoneNumber }),
  email: zod.string().email({ message: 'Email doit etre un email valide !' }).optional(),
  job: zod.string().min(1, { message: 'le type est requis!' }),
  country: zod.string().optional(),
  address: zod.string().optional(),
  sexe: zod.string().optional(),
  contract_starts_at: zod.string().date().optional(),
  birthday: zod.string().date().optional(),
  contract_duration: zod.number().optional().default(0),
  birth_place: zod.string().optional(),
});

// ----------------------------------------------------------------------

export function EmployeeQuickEditForm({
  currentEmployee,
  open,
  onClose,
  onUpdateRow,
  dec_slug,
  isPermit,
}) {
  const user = useMockedUser();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const genders = [
    { value: 'male', label: 'Homme' },
    { value: 'female', label: 'Femme' },
  ];

  const defaultValues = useMemo(() => {
    const currentJobSlug =
      typeof currentEmployee?.job === 'object' ? currentEmployee?.job?.slug : currentEmployee?.job;

    return {
      first: currentEmployee?.first || '',
      last: currentEmployee?.last || '',
      passport_number: currentEmployee?.passport_number || '',
      phone: currentEmployee?.phone || '',
      job: currentJobSlug || '',
      country: currentEmployee?.country || '',
      address: currentEmployee?.address || '',
      sexe: currentEmployee?.sexe || '',
      birthday: currentEmployee?.birthday || null,
      contract_starts_at: currentEmployee?.contract_starts_at || null,
      contract_duration: currentEmployee?.contract_duration || null,
      email: currentEmployee?.email || '',
      birth_place: currentEmployee?.birth_place || '',
    };
  }, [currentEmployee]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(employeQuickEditSchema),
    defaultValues,
  });

  const {
    reset,
    setValue,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    let isMounted = true; // à déclarer ici

    async function fetchCountries() {
      setLoadingCountries(true);
      try {
        // Premier appel (limite 100)
        const resp1 = await axios.get(API.listCountry(), {
          params: { offset: 0, limit: 100 },
        });

        const total = resp1.data.count;

        if (total > 100) {
          // Deuxième appel avec la vraie limite totale
          const resp2 = await axios.get(API.listCountry(), {
            params: { offset: 0, limit: total },
          });
          if (isMounted) setCountries(resp2.data.results);
        } else if (isMounted) setCountries(resp1.data.results);
      } catch (error) {
        console.error('Erreur lors du chargement des pays :', error);
      } finally {
        if (isMounted) setLoadingCountries(false);
      }
    }

    fetchCountries();

    return () => {
      isMounted = false;
    };
  }, []); // <= le tableau de dépendances vide

  // --- Dès que les pays sont chargés, normaliser la valeur country (nom -> slug) si besoin ---
  useEffect(() => {
    // si la valeur actuelle est vide, rien à faire
    const currentCountryValue = currentEmployee?.country;
    if (!currentCountryValue || countries.length === 0) return;

    // Si currentEmployee.country est déjà un slug présent dans la liste => on set tel quel
    const bySlug = countries.find((c) => c.slug === currentCountryValue);
    if (bySlug) {
      setValue('country', bySlug.slug);
      return;
    }

    // Sinon si c'est un nom (ex: "Gambie"), on cherche le slug correspondant
    const byName = countries.find(
      (c) => c.name?.toLowerCase() === String(currentCountryValue).toLowerCase()
    );
    if (byName) {
      setValue('country', byName.slug);
    }

    // Sinon on laisse la valeur telle quelle (backend utilise peut-être des noms non trouvés)
  }, [countries, currentEmployee, setValue]);

  useEffect(() => {
    let isMounted = true;

    async function fetchAllFonctions() {
      setLoading(true); // ✅ on affiche le loader

      try {
        // --- ÉTAPE 1 : Lecture cache session ---
        const cachedSession = sessionStorage.getItem('fonctions');
        let optionsToUse = cachedSession ? JSON.parse(cachedSession) : null;

        // --- ÉTAPE 2 : Lecture cache localStorage si session vide ---
        if (!optionsToUse) {
          const cachedLocal = localStorage.getItem('fonctions');
          if (cachedLocal) {
            const parsedLocal = JSON.parse(cachedLocal);
            const localData = Array.isArray(parsedLocal) ? parsedLocal : parsedLocal.data || []; // ✅ robustesse

            if (localData.length > 0) {
              optionsToUse = localData;
              // Copie vers la session pour cette session de navigation
              sessionStorage.setItem('fonctions', JSON.stringify(localData));
            }
          }
        }

        // --- ÉTAPE 3 : Afficher immédiatement ce qu’on a ---
        if (optionsToUse && Array.isArray(optionsToUse)) {
          setOptions(optionsToUse);
        }

        // --- ÉTAPE 4 : Vérifier si on doit rafraîchir depuis l’API ---
        const cachedLocal = localStorage.getItem('fonctions');
        let shouldFetch = true;

        if (cachedLocal) {
          try {
            const parsedLocal = JSON.parse(cachedLocal);
            const lastFetch = parsedLocal.lastFetch || 0;
            const now = Date.now();
            // Moins de 24h => pas besoin de refetch
            if (now - lastFetch < 24 * 60 * 60 * 1000) {
              shouldFetch = false;
            }
          } catch {
            shouldFetch = true; // cache corrompu
          }
        }

        if (!shouldFetch) {
          setLoading(false);

          return;
        }

        // --- ÉTAPE 5 : Fetch complet depuis l’API ---
        const resp1 = await axios.get(API.listFonctionAgent(), {
          params: { offset: 0, limit: 100 },
        });

        const total = resp1?.data?.count ?? 0;

        const resp2 = await axios.get(API.listFonctionAgent(), {
          params: { offset: 0, limit: total || 100 },
        });

        if (!isMounted) return;

        const results = resp2?.data?.results || [];
        const uniqueBySlug = results
          .filter((f, idx, arr) => arr.findIndex((item) => item.slug === f.slug) === idx)
          .map((f) => ({
            label: f.name || f.label || 'Fonction inconnue',
            value: f.slug,
          }));

        // --- ÉTAPE 6 : Sauvegarde cache ---
        const cachePayload = {
          data: uniqueBySlug,
          lastFetch: Date.now(),
        };

        localStorage.setItem('fonctions', JSON.stringify(cachePayload));
        sessionStorage.setItem('fonctions', JSON.stringify(uniqueBySlug));

        setOptions(uniqueBySlug);
      } catch (err) {
        console.error('Erreur lors du chargement des fonctions :', err);
        toast.error('Impossible de charger la liste des fonctions.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAllFonctions();

    return () => {
      isMounted = false;
    };
  }, []);

  const getModifiedFields = (originalData, newData, countriesList) => {
    const modifiedFields = {};

    Object.keys(newData).forEach((key) => {
      let originalValue = originalData[key];
      let newValue = newData[key];

      // job: si original est objet, compare par slug
      if (key === 'job' && typeof originalValue === 'object') {
        originalValue = originalValue?.slug;
      }

      // country: normaliser original -> slug (si original était un nom)
      if (key === 'country') {
        // obtenir originalSlug
        let originalSlug = originalValue;
        if (typeof originalValue === 'object') originalSlug = originalValue?.slug;
        else if (typeof originalValue === 'string') {
          // essayer de convertir nom en slug via countriesList
          const bySlug = countriesList.find((c) => c.slug === originalValue);
          const byName = countriesList.find(
            (c) => String(c.name).toLowerCase() === String(originalValue).toLowerCase()
          );
          originalSlug = bySlug ? bySlug.slug : byName ? byName.slug : originalValue;
        }

        // newValue doit déjà être un slug (on stocke slug dans onChange)
        // si newValue est un nom (improbable), tenter la conversion aussi
        if (typeof newValue === 'string') {
          const bySlug2 = countriesList.find((c) => c.slug === newValue);
          const byName2 = countriesList.find(
            (c) => String(c.name).toLowerCase() === String(newValue).toLowerCase()
          );
          newValue = bySlug2 ? bySlug2.slug : byName2 ? byName2.slug : newValue;
        }

        if (newValue !== originalSlug) {
          modifiedFields[key] = newValue;
        }
        return;
      }

      // comparaison simple pour les autres champs
      if (newValue !== originalValue) {
        modifiedFields[key] = newValue;
      }
    });

    return modifiedFields;
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const modifiedData = getModifiedFields(currentEmployee, data, countries);

      if (Object.keys(modifiedData).length === 0) {
        toast.info('Aucune modification détectée.');
        return;
      }

      // Création d'un FormData et ajout des champs modifiés
      const formData = new FormData();
      Object.keys(modifiedData).forEach((key) => {
        formData.append(key, modifiedData[key]);
      });

      // Ne pas définir manuellement le Content-Type pour laisser le navigateur gérer les délimitations
      const response = await axios.patch(API.UpdateEmploye(dec_slug, currentEmployee?.slug), data);

      if (response) {
        toast.success('Mise à jour réussie !');
        window.location.reload();

        // Fusionner les données modifiées avec le client courant pour obtenir la version à jour
        const updatedEmployee = { ...currentEmployee, ...modifiedData };
        onUpdateRow?.(updatedEmployee);
        reset();
        onClose();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour .');
      console.error('Erreur:', error.response?.data || error.message);
    }
  });

  // Obtenir la valeur actuelle de la fonction sélectionnée
  const currentJobValue = watch('job');
  const currentJobOption = options.find((option) => option.value === currentJobValue);

  const currentCountrySlug = watch('country');
  const currentCountryOption = countries.find((c) => c.slug === currentCountrySlug) || null;

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={onClose}
      slotProps={{ sx: { maxWidth: 720 } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Mise à jour rapide</DialogTitle>

        <DialogContent>
          <Box
            mt={4}
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
          >
            <Autocomplete
              options={countries}
              getOptionLabel={(option) => option.name}
              value={currentCountryOption || null}
              filterOptions={(opts, state) =>
                opts.filter((o) =>
                  o.name.toLowerCase().includes(state.inputValue.trim().toLowerCase())
                )
              }
              onChange={(e, option) => {
                if (option) {
                  setValue(`country`, option.slug);
                } else {
                  setValue(`country`, '');
                }
              }}
              renderOption={(props, option, { index }) => (
                <li {...props} key={`${option.value}-${index}`}>
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nationalité"
                  placeholder="Choisissez une nationalité"
                  fullWidth
                  error={!!methods.formState.errors.country}
                  helperText={methods.formState.errors.country?.message}
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
            <Field.Text name="passport_number" label="Numero du passeport " />
            <Field.Text name="last" label="Nom " />
            <Field.Text name="first" label="Prénom " />

            <Field.Text name="email" label="Email " />
            <Field.Phone name="phone" label="Numéro de Téléphone" />

            <Field.Select name="sexe" label="Genre">
              {genders.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.DatePicker name="birthday" label="Date Naissance" />
            <Field.Text name="birth_place" label="Lieu de naissance " />

            <Field.Text name="address" label="Adresse " />

            <Field.DatePicker name="contract_starts_at" label="Date de debut du contrat" />
            <Field.Text type="number" name="contract_duration" label="Duree du contrat" />

            {/* Remplacement du Field.Select par Autocomplete */}
            <Autocomplete
              options={options}
              getOptionLabel={(opt) => opt.label}
              loading={loading}
              fullWidth
              disabled={isPermit}
              value={currentJobOption || null}
              filterOptions={(opts, state) =>
                opts.filter((o) =>
                  o.label.toLowerCase().includes(state.inputValue.trim().toLowerCase())
                )
              }
              onChange={(e, option) => {
                if (option) {
                  setValue('job', option.value);
                } else {
                  setValue('job', '');
                }
              }}
              renderOption={(props, option, { index }) => (
                <li {...props} key={`${option.value}-${index}`}>
                  {option.label}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Fonction *"
                  // size="small"
                  fullWidth
                  error={!!methods.formState.errors.job}
                  helperText={methods.formState.errors.job?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading && <CircularProgress size={20} />}
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
          <Button variant="outlined" onClick={onClose}>
            Retour
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Mettre à jour
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
