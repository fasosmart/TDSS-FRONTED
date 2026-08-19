import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import axios from 'src/utils/axios';

import { useState, useEffect, useCallback } from 'react';
import { get, useFieldArray, useFormContext } from 'react-hook-form';
// import { Step, Modal, Stepper, StepLabel, IconButton } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { TextField, Autocomplete } from '@mui/material';

import API from 'src/utils/api';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export function DeclarationNewEditDetails({ formData }) {
  const { control, setValue, watch, reset, formState } = useFormContext();
  const DEFAULT_LIMIT = 100;
  const MAX_EMPLOYEES = 20;
  const [options, setOptions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [passportInput, setPassportInput] = useState('');
  const [params, setParams] = useState({
    offset: 0,
    limit: DEFAULT_LIMIT,
    name: '',
  });

  // const typedec = type?.trim();

  const genders = [
    { value: 'male', label: 'Homme' },
    { value: 'female', label: 'Femme' },
  ];

  const { fields, append, remove } = useFieldArray({ control, name: 'employees' });

  const values = watch();

  const handleAdd = () => {
    if (fields.length >= MAX_EMPLOYEES) {
      toast.error(`Vous ne pouvez pas ajouter plus de ${MAX_EMPLOYEES} employés.`);
      return;
    }
    append({
      passport_number: '',
      last: '',
      job: '',
      first: '',
      phone: '',
      country: '',
      email: '',
      address: '',
      sexe: '',
      birthday: '',
      birth_place: '',
      contract_starts_at: '',
      contract_duration: '',
      locked: false,
      passportExists: false,
    });
  };

  const handleRemove = (index) => {
    remove(index);
  };

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
  }, []); // <=  le tableau de dépendances vide

  useEffect(() => {
    let isMounted = true;

    async function fetchAllFonctions() {
      setLoadingOptions(true);
      try {
        // Étape 1 : lecture cache session
        const cachedSession = sessionStorage.getItem('fonctions');
        let optionsToUse = cachedSession ? JSON.parse(cachedSession) : null;

        // Étape 2 : sinon, lecture cache localStorage
        if (!optionsToUse) {
          const cachedLocal = localStorage.getItem('fonctions');
          if (cachedLocal) {
            const parsedLocal = JSON.parse(cachedLocal);
            optionsToUse = parsedLocal.data;
            // Copier en session pour la session courante
            sessionStorage.setItem('fonctions', JSON.stringify(optionsToUse));
          }
        }

        // Afficher immédiatement ce qu’on a
        if (optionsToUse) {
          setOptions(optionsToUse);
        }

        // Étape 3 : Vérifier si on doit rafraîchir depuis l’API
        const cachedLocal = localStorage.getItem('fonctions');
        let shouldFetch = true;

        if (cachedLocal) {
          const parsedLocal = JSON.parse(cachedLocal);
          const lastFetch = parsedLocal.lastFetch || 0;
          const now = Date.now();

          // ex : si le cache a moins de 24h → pas besoin de recharger
          if (now - lastFetch < 24 * 60 * 60 * 1000) {
            shouldFetch = false;
          }
        }

        if (!shouldFetch) {
          setLoadingOptions(false);
          return;
        }

        // Étape 4 : fetch complet depuis l’API
        const resp1 = await axios.get(API.listFonctionAgent(), {
          params: { offset: 0, limit: 100 },
        });
        const total = resp1.data.count;

        const resp2 = await axios.get(API.listFonctionAgent(), {
          params: { offset: 0, limit: total },
        });
        if (!isMounted) return;

        const uniqueBySlug = resp2.data.results
          .filter((f, idx, arr) => arr.findIndex((item) => item.slug === f.slug) === idx)
          .map((f) => ({ label: f.name, value: f.slug }));

        // Sauvegarde avec la date du fetch
        const cachePayload = {
          data: uniqueBySlug,
          lastFetch: Date.now(),
        };

        localStorage.setItem('fonctions', JSON.stringify(cachePayload));
        sessionStorage.setItem('fonctions', JSON.stringify(uniqueBySlug));

        setOptions(uniqueBySlug);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
        setLoadingOptions(false);
      }
    }

    fetchAllFonctions();
    return () => {
      isMounted = false;
    };
  }, []);

  const verifyPassports = async (employees, setValue) => {
    await Promise.all(
      employees.map(async (emp, idx) => {
        if (!emp.passport_number) return;

        try {
          const { data } = await axios.get(API.searchPassport(emp.passport_number));
          // S'il existe, on le note et on peut éventuellement verrouiller la ligne :
          const exists = !!data?.passport_number;
          setValue(`employees[${idx}].passportExists`, exists);
          if (exists) {
            setValue(`employees[${idx}].locked`, false); // optionnel
          }
        } catch (error) {
          // 404 = n'existe pas → false, les autres erreurs sont loguées
          if (error.response?.status === 404) {
            setValue(`employees[${idx}].passportExists`, false);
          } else {
            console.error('Erreur de vérification passeport', error);
          }
        }
      })
    );
  };

  const handleImportData = async (importedData) => {
    const mappedEmployees = importedData.map((row) => {
      const jobSlug = (() => {
        const findByValue = options.find((opt) => opt.value === row.Fonction);
        const findByLabel = options.find((opt) => opt.label === row.Fonction);

        if (!findByValue && !findByLabel && row.Fonction) {
          toast.warning(`Pas de correspondance trouvée pour la fonction "${row.Fonction}"`);
        }

        return findByValue?.value || findByLabel?.value || '';
      })();

      return {
        passport_number: row?.Numero || '',
        phone: row?.Telephone ? `+${String(row?.Telephone)}` : '',
        last: row?.Nom || '',
        first: row?.Prenom || '',
        job: jobSlug,
        type: 'new',
        reference: undefined,
        passportExists: false,
        locked: false,
        country: row?.Nationalite || '',
        address: row?.Adresse || '',
        email: row?.Email || '',
        sexe: row?.Sexe || '',
        birthday: row?.Date_Naissance || '',
        birth_place: row?.Lieu_Naissance || '',
        contract_duration: row?.Duree_Contrat || '',
        contract_starts_at: row?.Date_Debut_Contrat || '',
      };
    });

    reset({ employees: mappedEmployees });
    await new Promise((r) => setTimeout(r, 0));
    await verifyPassports(mappedEmployees, setValue);
  };

  useEffect(() => {
    if (formData?.length > 0 && options?.length > 0) {
      const importedData = formData.map((row) => ({
        Fonction: row?.Fonction?.trim() || '',
        Numero: row?.Numero || '',
        Nom: row?.Nom || '',
        Prenom: row?.Prenom || '',
        Telephone: row?.Telephone || '',
        Nationalite: row?.Nationalite || '',
        Adresse: row?.Adresse || '',
        Email: row?.Email || '',
        Sexe: row?.Sexe || '',
        Date_Naissance: row?.Date_Naissance || '',
        Lieu_Naissance: row?.Lieu_Naissance || '',
        Duree_Contrat: row?.Duree_Contrat || '',
        Date_Debut_Contrat: row?.Date_Debut_Contrat || '',
      }));

      handleImportData(importedData); // <-- appelle la fonction existante
    }
  }, [formData, options]);

  // Fonction debounced pour vérifier le numéro du passeport en temps réel
  const checkPassportExistence = async (numero, index) => {
    if (!numero) return;

    try {
      const { data } = await axios.get(API.searchPassport(numero));

      if (data?.passport_number) {
        setValue(`employees[${index}].passportExists`, true);
        toast.error(
          '❌ Ce numéro de passeport existe déjà. Cela devrait être un duplicata ou un renouvellement.'
        );
      } else {
        setValue(`employees[${index}].passportExists`, false);
        toast.success('✅ Passeport non trouvé, vous pouvez continuer.');
      }
    } catch (error) {
      if (error.detail) {
        setValue(`employees[${index}].passportExists`, false);
        toast.success('✅ Passeport non trouvé, vous pouvez continuer.');
      } else {
        console.error('Erreur lors de la recherche du passeport', error.detail);
      }
    }
  };

  // Handler pour le changement de la saisie du numéro de passeport
  const handlePassportChange = (e, index) => {
    const numero = e.target.value;
    setValue(`employees[${index}].passport_number`, numero);
    // Réinitialiser passportExists lorsque le numéro de passeport change
    setValue(`employees[${index}].passportExists`, false);
  };

  const handlePassportBlur = (e, index) => {
    const numero = e.target.value;
    if (numero) {
      // appel direct (ou debouncedPassportCheck si vous préférez laisser un très léger délai)
      checkPassportExistence(numero, index);
    }
  };

  const getJobOption = (jobValue) => options.find((option) => option.value === jobValue) || null;

  const getCountryOption = (slug) => countries.find((c) => c.slug === slug);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Informations Personnelles
      </Typography>

      <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
        {fields.map((item, index) => (
          <Stack key={item.id} alignItems="flex-end" spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: 1 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Autocomplete
                  size="small"
                  options={countries}
                  getOptionLabel={(option) => option.name}
                  value={getCountryOption(values.employees[index].country) || null}
                  filterOptions={(opts, state) =>
                    opts.filter((o) =>
                      o.name.toLowerCase().includes(state.inputValue.trim().toLowerCase())
                    )
                  }
                  onChange={(e, option) => {
                    if (option) {
                      setValue(`employees[${index}].country`, option.slug);
                    } else {
                      setValue(`employees[${index}].country`, '');
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
                      size="small"
                      label="Nationalité*"
                      placeholder="Choisissez une nationalité"
                      fullWidth
                      error={!!formState.errors?.employees?.[index]?.country}
                      helperText={formState.errors?.employees?.[index]?.country?.message || ''}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingCountries ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Box>

              <Field.Text
                size="small"
                disabled={values.employees[index].locked}
                name={`employees[${index}].passport_number`}
                label="Numéro Passeport *"
                inputlabelprops={{ shrink: true }}
                onChange={(e) => handlePassportChange(e, index)}
                onBlur={(e) => handlePassportBlur(e, index)}
                error={
                  values.employees[index].passportExists ||
                  !!formState.errors?.employees?.[index]?.passport_number
                } // true = duplication
                helperText={
                  formState.errors?.employees?.[index]?.passport_number?.message ||
                  (values.employees[index].passportExists
                    ? '❌ Ce numéro de passeport existe déjà. Cela devrait être un duplicata ou un renouvellement.'
                    : '')
                }
                FormHelperTextProps={{
                  sx: {
                    color:
                      formState.errors?.employees?.[index]?.passport_number ||
                      values.employees[index].passportExists
                        ? 'error.main'
                        : 'success.main',
                  },
                }}
                sx={{ flex: 1 }}
              />

              <Field.Text
                size="small"
                name={`employees[${index}].last`}
                label="Nom *"
                inputlabelprops={{ shrink: true }}
                disabled={values.employees[index].locked}
                sx={{ flex: 1 }}
              />
              <Field.Text
                size="small"
                name={`employees[${index}].first`}
                label="Prénom *"
                inputlabelprops={{ shrink: true }}
                disabled={values.employees[index].locked}
                sx={{ flex: 1 }}
              />

              <Field.Select
                size="small"
                name={`employees[${index}].sexe`}
                label="Genre"
                inputlabelprops={{ shrink: true }}
                disabled={values.employees[index].locked}
                sx={{ flex: 1 }}
              >
                {genders?.map((gender) => (
                  <MenuItem key={gender.value} value={String(gender?.value)}>
                    {gender?.label}
                  </MenuItem>
                ))}
              </Field.Select>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Field.DatePicker
                  size="small"
                  name={`employees[${index}].birthday`}
                  label="Date Naissance"
                  InputLabelProps={{ shrink: true }}
                  disabled={values.employees[index]?.locked}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Field.Text
                  size="small"
                  name={`employees[${index}].birth_place`}
                  label="Lieu de Naissance"
                  inputlabelprops={{ shrink: true }}
                  disabled={values.employees[index]?.locked}
                  sx={{ flex: 1 }}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: 1 }}>
              <Field.Text
                size="small"
                name={`employees[${index}].email`}
                label="Adresse Email"
                inputlabelprops={{ shrink: true }}
                disabled={values.employees[index].locked}
                sx={{ flex: 1 }}
              />
              <Field.Phone
                size="small"
                name={`employees[${index}].phone`}
                label="Numéro de Téléphone *"
                placeholder="Votre numéro de téléphone"
                sx={{ flex: 1 }}
                inputlabelprops={{ shrink: true }}
                disabled={values.employees[index].locked}
              />

              <Field.Text
                size="small"
                name={`employees[${index}].address`}
                label="Adresse "
                inputlabelprops={{ shrink: true }}
                disabled={values.employees[index].locked}
                sx={{ flex: 1 }}
              />

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Field.DatePicker
                  size="small"
                  name={`employees[${index}].contract_starts_at`}
                  label="Date début contrat"
                  InputLabelProps={{ shrink: true }}
                  disabled={values.employees[index]?.locked}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Box>

              <Field.Text
                size="small"
                type="number"
                name={`employees[${index}].contract_duration`}
                label="Durée Contrat (mois)"
                inputlabelprops={{ shrink: true }}
                disabled={values.employees[index].locked}
                sx={{ flex: 1 }}
              />

              <Autocomplete
                options={options}
                getOptionLabel={(opt) => opt.label}
                loading={loadingOptions}
                fullWidth
                value={getJobOption(values.employees[index].job) || null}
                filterOptions={(opts, state) =>
                  opts.filter((o) =>
                    o.label.toLowerCase().includes(state.inputValue.trim().toLowerCase())
                  )
                }
                onChange={(e, option) => {
                  if (option) {
                    setValue(`employees[${index}].job`, option.value);
                  } else {
                    setValue(`employees[${index}].job`, '');
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
                    size="small"
                    fullWidth
                    error={!!formState.errors?.employees?.[index]?.job}
                    helperText={formState.errors?.employees?.[index]?.job?.message || ''}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingOptions && <CircularProgress size={20} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                sx={{ flex: 1 }}
              />
            </Stack>

            <Button
              size="small"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => handleRemove(index)}
              sx={{ mt: 1 }}
            >
              Supprimer
            </Button>
          </Stack>
        ))}
      </Stack>

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Stack
        spacing={2}
        sx={{ mb: 2 }}
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-end', md: 'center' }}
      >
        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAdd}
          disabled={fields.length >= MAX_EMPLOYEES}
          sx={{ flexShrink: 0 }}
        >
          Nouveau
        </Button>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {fields.length} / {MAX_EMPLOYEES} employés ajoutés
        </Typography>
      </Stack>
    </Box>
  );
}
