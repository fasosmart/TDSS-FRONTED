'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { TextField, Autocomplete } from '@mui/material';
import debounce from 'lodash.debounce';
import { useState, useEffect, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useForm, useFieldArray } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';
import { useRouter } from 'src/routes/hooks';

import { paths } from 'src/routes/paths';
import { z as zod } from 'zod';

import { Form, Field, schemaHelper } from 'src/components/hook-form';

import API from 'src/utils/api';
import axios from 'src/utils/axios';
import { toast } from 'sonner';
import { Iconify } from 'src/components/iconify';
import { useBoolean } from 'src/hooks/use-boolean';

import { ImportFilesButton } from 'src/sections/overview/declaration/components/button-import-excel';

// Schéma pour un employé individuel
export const employeSchema = zod
  .object({
    first: zod.string().min(1, { message: 'le prenom est obligatoire' }),
    last: zod.string().min(1, { message: 'le nom est obligatoire' }),
    passport_number: zod.string().min(1, { message: 'le numero de passeport est obligatoire' }),
    phone: schemaHelper.phoneNumber({ isValidPhoneNumber }),
    email: zod
      .union([
        zod.string().length(0),
        zod.string().email({ message: 'Email doit etre un email valide !' }),
      ])
      .optional(),
    job: zod.string().min(1, { message: 'la fonction est requise!' }),
    type: zod.string().default('new'),
    reference: zod.string().optional(),
    country: zod.string().min(1, { message: 'Veuillez selectionner une nationalité' }),
    address: zod.string().optional(),
    sexe: zod.string().optional(),
    birthday: zod.union([zod.string().length(0), zod.string().date()]).optional(),

    contract_starts_at: zod.union([zod.string().length(0), zod.string().date()]).optional(),

    // ✅ Durée contrat : maximum 24 mois (validé individuellement)
    contract_duration: zod
      .union([zod.number(), zod.literal('')])
      .transform((val) => (val === '' ? 0 : val))
      .optional()
      .default(0)
      .superRefine((val, ctx) => {
        if (val && val > 24) {
          ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: 'La durée du contrat ne peut pas dépasser 24 mois.',
          });
        }
      }),
  })
  // ✅ Validation croisée : date_début + durée >= aujourd'hui
  .superRefine((data, ctx) => {
    const { contract_starts_at, contract_duration } = data;

    // On ne valide que si les deux champs sont renseignés
    if (!contract_starts_at || !contract_duration) return;

    const startDate = new Date(contract_starts_at);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Number(contract_duration));
    endDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (endDate < today) {
      const formattedEnd = endDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: `Ce contrat a expiré le ${formattedEnd}. Veuillez corriger la date ou la durée.`,
        path: ['contract_duration'], // affiché sous le champ "Durée"
      });
    }
  });

// Schéma global pour le formulaire qui attend un tableau d'employés
const formSchema = zod.object({
  employees: zod.array(employeSchema).min(1, { message: 'Veuillez ajouter au moins un employé.' }),
});

export function DeclarationAddEmployee({ declaration, open, onClose }) {
  const [allOptions, setAllOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [countries, setCountries] = useState([]);

  const [passportInput, setPassportInput] = useState('');
  const [loadingRenew, setLoadingRenew] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const router = useRouter();
  const loadingSend = useBoolean();
  const renewalModal = useBoolean();

  const genders = [
    { value: 'male', label: 'Homme' },
    { value: 'female', label: 'Femme' },
  ];

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(formSchema),
    defaultValues: {
      employees: [],
    },
  });

  const { watch, setValue } = methods;
  const values = watch();

  const { fields, append, remove } = useFieldArray({ control: methods.control, name: 'employees' });
  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    let isMounted = true;

    async function fetchAllFonctions() {
      if (declaration?.status !== 'unsubmitted') return;

      setLoadingOptions(true);
      const cachedSession = sessionStorage.getItem('fonctions');
      let optionsToUse = cachedSession ? JSON.parse(cachedSession) : null;

      if (!optionsToUse) {
        const cachedLocal = localStorage.getItem('fonctions');
        if (cachedLocal) {
          const parsedLocal = JSON.parse(cachedLocal);
          optionsToUse = parsedLocal.data;
          sessionStorage.setItem('fonctions', JSON.stringify(optionsToUse));
        }
      }

      if (optionsToUse) {
        setAllOptions(optionsToUse);
      }

      const cachedLocal = localStorage.getItem('fonctions');
      let shouldFetch = true;

      if (cachedLocal) {
        const parsedLocal = JSON.parse(cachedLocal);
        const lastFetch = parsedLocal.lastFetch || 0;
        const now = Date.now();
        if (now - lastFetch < 24 * 60 * 60 * 1000) {
          shouldFetch = false;
        }
      }

      if (!shouldFetch) {
        setLoadingOptions(false);
        return;
      }

      try {
        const resp1 = await axios.get(API.listFonctionAgent(), {
          params: { offset: 0, limit: 1 },
        });
        const total = resp1.data.count;

        const resp2 = await axios.get(API.listFonctionAgent(), {
          params: { offset: 0, limit: total },
        });

        if (!isMounted) return;

        const uniqueBySlug = resp2.data.results
          .filter((f, idx, arr) => arr.findIndex((item) => item.slug === f.slug) === idx)
          .map((f) => ({ label: f.name, value: f.slug }));

        const cachePayload = {
          data: uniqueBySlug,
          lastFetch: Date.now(),
        };

        localStorage.setItem('fonctions', JSON.stringify(cachePayload));
        sessionStorage.setItem('fonctions', JSON.stringify(uniqueBySlug));

        setAllOptions(uniqueBySlug);
      } catch (err) {
        console.error('Erreur lors du chargement des fonctions:', err);
        toast.error('Erreur lors du chargement des fonctions');
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }

    fetchAllFonctions();
    return () => {
      isMounted = false;
    };
  }, [declaration?.status]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCountries() {
      setLoadingCountries(true);
      try {
        const resp1 = await axios.get(API.listCountry(), {
          params: { offset: 0, limit: 100 },
        });

        const total = resp1.data.count;

        if (total > 100) {
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
  }, []);

  const handleAddEmployee = handleSubmit(async (data) => {
    loadingSend.onTrue();
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const { slug } = declaration;
      const employeesFiltered = data.employees.map((emp) => {
        if (emp.type === 'renewal') {
          return emp;
        }
        const { reference, ...rest } = emp;
        return rest;
      });
      const payload = employeesFiltered;
      const response = await axios.post(API.AddEmploye(slug), payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      toast.success('Employés ajoutés avec succès!');
      reset();
      onClose();
      window.location.reload();
      router.push(paths.dashboard.declaration.details(declaration?.slug));
    } catch (err) {
      const data = err.response?.data || err || err.message || err.details || err.messages;
      const messages = [];

      if (Array.isArray(data)) {
        data.forEach((errObj) => {
          Object.keys(errObj).forEach((key) => {
            const value = errObj[key];
            if (Array.isArray(value)) {
              messages.push(...value);
            } else {
              messages.push(value);
            }
          });
        });
      } else if (data.message) messages.push(data.message);
      else messages.push('Erreur inconnue');

      messages.forEach((msg) => toast.error(msg));
    } finally {
      loadingSend.onFalse();
    }
  });

  const handleAdd = () => {
    append({
      passport_number: '',
      last: '',
      job: '',
      first: '',
      phone: '',
      country: '',
      address: '',
      email: '',
      sexe: 'male',
      birthday: '',
      contract_starts_at: '',
      contract_duration: '',
      locked: false,
      passportExists: false,
    });
  };

  const handleRemove = (index) => {
    remove(index);
  };

  const handleRenew = () => {
    renewalModal.onTrue();
  };

  const mapCountryNameToSlug = (countryName) => {
    if (!countryName) return '';
    const foundByName = countries.find((c) => c.name?.toLowerCase() === countryName.toLowerCase());
    return foundByName?.slug || '';
  };

  const handleConfirmRenew = async () => {
    try {
      const response = await axios.get(API.searchPassport(passportInput));
      const { data } = response;

      if (!data) {
        toast.error('Aucun utilisateur trouvé pour ce passeport');
        return;
      }

      // Durée <= 12 : champs vidés, l'utilisateur saisit de nouvelles valeurs
      // Durée > 12  : champs pré-remplis avec les valeurs récupérées, modifiables
      const fetchedDuration = data?.contract_duration ?? 0;
      const keepContractValues = fetchedDuration > 12;

      append({
        passport_number: data.passport_number,
        last: data.last,
        first: data.first,
        phone: data.phone,
        type: 'renewal',
        reference: data?.employee_reference,
        job: data.job.slug,
        country: mapCountryNameToSlug(data?.country),
        sexe: data?.sexe,
        email: data?.email,
        birthday: data?.birthday,
        address: data?.address,
        contract_starts_at: keepContractValues ? (data?.contract_starts_at ?? '') : '',
        contract_duration: keepContractValues ? fetchedDuration : '',
        passportExists: true,
        locked: true,
      });
      setPassportInput('');
      renewalModal.onFalse();
    } catch (err) {
      toast.error(err.details || 'Aucun employé trouvé pour ce passeport');
    }
  };

  const checkPassportExistence = async (numero, index) => {
    if (!numero) return;

    try {
      const { data } = await axios.get(API.searchPassport(numero));
      setValue(`employees[${index}].passportExists`, !!data.passport_number);
    } catch (error) {
      if (error.response?.status === 404 || error.details) {
        setValue(`employees[${index}].passportExists`, false);
        toast.error('Aucun employé trouvé pour ce passeport');
      } else {
        console.error('Erreur lors de la recherche du passeport', error);
      }
    }
  };

  const debouncedPassportCheck = useCallback(
    debounce((numero) => {
      checkPassportExistence(numero);
    }, 5000),
    []
  );

  const handlePassportBlur = (e, index) => {
    const numero = e.target.value;
    if (numero) {
      checkPassportExistence(numero, index);
    }
  };

  const handlePassportChange = (e, index) => {
    const { value } = e.target;
    methods.setValue(`employees[${index}].passport_number`, value);
    methods.setValue(`employees[${index}].passportExists`, false);
  };

  const verifyPassports = async (employees, setValue) => {
    await Promise.all(
      employees.map(async (emp, idx) => {
        if (!emp.passport_number) return;

        try {
          const { data } = await axios.get(API.searchPassport(emp.passport_number));
          const exists = !!data?.passport_number;
          setValue(`employees[${idx}].passportExists`, exists);
          if (exists) {
            setValue(`employees[${idx}].locked`, false);
          }
        } catch (error) {
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
        const findByValue = allOptions.find((opt) => opt.value === row.Fonction);
        const findByLabel = allOptions.find((opt) => opt.label === row.Fonction);
        return findByValue?.value || findByLabel?.value || '';
      })();

      const countrySlug = (() => {
        const findByValue = countries.find((c) => c.slug === row.country);
        const findByLabel = countries.find((c) => c.name === row.country);
        return findByValue?.slug || findByLabel?.slug || '';
      })();

      return {
        passport_number: row.Numero || '',
        phone: row.Telephone ? `+${String(row.Telephone)}` : '',
        last: row.Nom || '',
        first: row.Prenom || '',
        job: jobSlug,
        type: 'new',
        reference: undefined,
        passportExists: false,
        locked: false,
        country: countrySlug || '',
        address: row?.Adresse || '',
        email: row?.Email || '',
        sexe: row?.Sexe || '',
        birthday: row?.Date_Naissance || '',
        contract_duration: row?.Duree_Contrat || '',
        contract_starts_at: row?.Date_Debut_Contrat || '',
      };
    });

    reset({ employees: mappedEmployees });
    await new Promise((r) => setTimeout(r, 0));
    await verifyPassports(mappedEmployees, methods.setValue);
  };

  // ✅ Recalcul automatique : dès que contract_starts_at ou contract_duration change,
  // on re-déclenche la validation sur les deux champs pour évaluer la date de fin.
  useEffect(() => {
    const contractFields = values.employees?.map((emp, i) => ({
      starts_at: emp.contract_starts_at,
      duration: emp.contract_duration,
      index: i,
    }));

    contractFields?.forEach(({ starts_at, duration, index }) => {
      if (starts_at || duration) {
        methods.trigger(`employees[${index}].contract_duration`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // On ne surveille que les valeurs des champs contrat, pas l'objet entier
    JSON.stringify(
      values.employees?.map((e) => ({
        s: e.contract_starts_at,
        d: e.contract_duration,
      }))
    ),
  ]);

  const handleCancelRenew = () => {
    setPassportInput('');
    renewalModal.onFalse();
  };

  const getJobOption = (jobValue) => allOptions.find((option) => option.value === jobValue) || null;

  const getCountryOption = (slug) => countries.find((c) => c.slug === slug);

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open}
      onClose={onClose}
      slotProps={{
        sx: {
          width: '70%',
          maxWidth: 800,
        },
      }}
    >
      <Form methods={methods} onSubmit={handleAddEmployee}>
        <DialogTitle>Ajout d'autres employés</DialogTitle>
        <div style={{ marginBottom: '20px', marginRight: '20px' }}>
          <ImportFilesButton onImport={handleImportData} />
        </div>
        <DialogContent>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
              Informations Personnelles
            </Typography>

            {/* Renewal Modal */}
            <Dialog open={renewalModal.value} onClose={renewalModal.off} fullWidth>
              <DialogTitle>Renouvellement – saisir le passeport</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Numéro de passeport"
                  fullWidth
                  value={passportInput}
                  onChange={(e) => setPassportInput(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCancelRenew}>Annuler</Button>
                <LoadingButton onClick={handleConfirmRenew} loading={loadingRenew}>
                  Valider
                </LoadingButton>
              </DialogActions>
            </Dialog>

            <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
              {fields.map((item, index) => {
                // ✅ Vrai si cet employé est de type renouvellement
                const isRenewal = values.employees[index]?.type === 'renewal';

                return (
                  <Stack key={item.id} alignItems="flex-end" spacing={2}>
                    {/* PREMIÈRE LIGNE */}
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
                              label="Nationalité"
                              placeholder="Choisissez une nationalité"
                              fullWidth
                              error={!!methods.formState.errors?.employees?.[index]?.country}
                              helperText={
                                methods.formState.errors?.employees?.[index]?.country?.message || ''
                              }
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

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Field.Text
                          size="small"
                          name={`employees[${index}].passport_number`}
                          label="Numéro Passeport"
                          disabled={values.employees[index]?.locked}
                          InputLabelProps={{ shrink: true }}
                          onBlur={(e) => handlePassportBlur(e, index)}
                          onChange={(e) => handlePassportChange(e, index)}
                          error={
                            values.employees[index]?.passportExists &&
                            !values.employees[index]?.locked
                          }
                          helperText={
                            values.employees[index]?.passportExists
                              ? values.employees[index]?.locked
                                ? '✅ Ce passeport existe déjà, il est bien enregistré.'
                                : '❌ Ce numéro de passeport existe déjà. Cela devrait être un duplicata ou un renouvellement.'
                              : ''
                          }
                          FormHelperTextProps={{
                            sx: {
                              color: values.employees[index]?.locked
                                ? 'success.main'
                                : 'error.main',
                            },
                          }}
                        />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Field.Text
                          size="small"
                          name={`employees[${index}].last`}
                          label="Nom"
                          InputLabelProps={{ shrink: true }}
                          disabled={values.employees[index]?.locked}
                        />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Field.Text
                          size="small"
                          name={`employees[${index}].first`}
                          label="Prénom"
                          InputLabelProps={{ shrink: true }}
                          disabled={values.employees[index]?.locked}
                        />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Field.Select
                          size="small"
                          name={`employees[${index}].sexe`}
                          label="Genre"
                          InputLabelProps={{ shrink: true }}
                        >
                          {genders?.map((gender) => (
                            <MenuItem key={gender.value} value={String(gender?.value)}>
                              {gender?.label}
                            </MenuItem>
                          ))}
                        </Field.Select>
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Field.DatePicker
                          size="small"
                          name={`employees[${index}].birthday`}
                          label="Date Naissance"
                          InputLabelProps={{ shrink: true }}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            },
                          }}
                        />
                      </Box>
                    </Stack>

                    {/* DEUXIÈME LIGNE */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Field.Text
                          size="small"
                          name={`employees[${index}].email`}
                          label="Adresse Email"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Field.Phone
                          size="small"
                          name={`employees[${index}].phone`}
                          label="Numéro de Téléphone"
                          placeholder="Votre numéro de téléphone"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Field.Text
                          size="small"
                          name={`employees[${index}].address`}
                          label="Adresse"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Field.DatePicker
                          size="small"
                          name={`employees[${index}].contract_starts_at`}
                          label="Date début contrat"
                          InputLabelProps={{ shrink: true }}
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
                          type="number"
                          name={`employees[${index}].contract_duration`}
                          label="Durée Contrat (mois)"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ min: 1, max: 24, step: 1 }}
                        />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Autocomplete
                          size="small"
                          options={allOptions}
                          getOptionLabel={(opt) => opt.label}
                          loading={loadingOptions}
                          fullWidth
                          value={getJobOption(values.employees[index]?.job)}
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
                          renderOption={(props, option) => {
                            const { key, ...otherProps } = props;
                            return (
                              <li key={`${option.value}-${option.label}`} {...otherProps}>
                                {option.label}
                              </li>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Fonction"
                              size="small"
                              fullWidth
                              error={!!methods.formState.errors.employees?.[index]?.job}
                              helperText={
                                methods.formState.errors?.employees?.[index]?.job?.message
                              }
                              InputLabelProps={{ shrink: true }}
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
                        />
                      </Box>
                    </Stack>

                    <Button
                      size="small"
                      color="error"
                      startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                      onClick={() => handleRemove(index)}
                    >
                      Supprimer
                    </Button>
                  </Stack>
                );
              })}
            </Stack>
            <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
            <Stack
              spacing={3}
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'flex-end', md: 'center' }}
            >
              <Button
                size="small"
                color="primary"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleAdd}
                sx={{ flexShrink: 0 }}
              >
                Nouveau
              </Button>

              <Button
                size="small"
                color="primary"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleRenew}
                sx={{ flexShrink: 0 }}
              >
                Renouvellement
              </Button>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Retour
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Ajouter
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
