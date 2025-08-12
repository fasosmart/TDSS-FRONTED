'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
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
export const employeSchema = zod.object({
  first: zod.string().min(1, { message: 'le prenom est obligatoire' }),
  last: zod.string().min(1, { message: 'le nom est obligatoire' }),
  passport_number: zod.string().min(1, { message: 'le numero de passeport est obligatoire' }),
  phone: schemaHelper.phoneNumber({ isValidPhoneNumber }),
  job: zod.string().min(1, { message: 'la fonction est requise!' }),
  type: zod.string().default('new'),
  reference: zod.string().optional(),
});

// Schéma global pour le formulaire qui attend un tableau d'employés
const formSchema = zod.object({
  employees: zod.array(employeSchema).min(1, { message: 'Veuillez ajouter au moins un employé.' }),
});

export function DeclarationAddEmployee({ declaration, open, onClose }) {
  const [allOptions, setAllOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [data, setData] = useState();
  const [passportInput, setPassportInput] = useState('');
  const [loadingRenew, setLoadingRenew] = useState(false);
  const router = useRouter();
  const loadingSend = useBoolean();
  const renewalModal = useBoolean();

  // Utilisation du schéma global pour la validation
  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(formSchema),
    defaultValues: {
      employees: [],
    },
  });

  const { watch, setValue } = methods;
  const values = watch();

  // useFieldArray pour gérer le tableau 'employees'
  const { fields, append, remove } = useFieldArray({ control: methods.control, name: 'employees' });
  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Charger toutes les fonctions au premier rendu
  useEffect(() => {
    let isMounted = true;

    async function fetchAllFonctions() {
      if (declaration?.status !== 'unsubmitted') return;

      setLoadingOptions(true);
      // Vérifier si on a déjà le cache en session
      const cached = sessionStorage.getItem('fonctions');
      if (cached) {
        const parsed = JSON.parse(cached);
        setAllOptions(parsed); // Affiche directement les données en cache
        setLoadingOptions(false);
        return; // Pas besoin d'appeler le serveur
      }

      try {
        // 1) Premier appel pour obtenir le count
        const resp1 = await axios.get(API.listFonctionAgent(), {
          params: { offset: 0, limit: 1 },
        });
        const total = resp1.data.count;

        // 2) Récupérer toutes les fonctions
        const resp2 = await axios.get(API.listFonctionAgent(), {
          params: { offset: 0, limit: total },
        });

        if (!isMounted) return;

        // Filtre pour n'avoir qu'un slug unique et créer les options pour l'Autocomplete
        const uniqueBySlug = resp2.data.results
          .filter((f, idx, arr) => arr.findIndex((item) => item.slug === f.slug) === idx)
          .map((f) => ({ label: f.name, value: f.slug }));

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

  const handleAddEmployee = handleSubmit(async (data) => {
    loadingSend.onTrue();
    try {
      // Simuler un délai d'une demi-seconde
      await new Promise((resolve) => setTimeout(resolve, 500));
      const { slug } = declaration;
      // On enveloppe les employés dans un objet, selon l'attente du backend
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
      window.location.reload(); // Recharger la page pour voir les changements
      router.push(paths.dashboard.declaration.details(declaration?.slug));
    } catch (error) {
      console.error("Erreur lors de l'envoi au backend:", error);
      if (error.response) {
        console.error('Erreur avec le serveur:', error.response.data);
        toast.error(
          `Erreur serveur: ${error.response.data?.message || 'Problème interne du serveur'}`
        );
      } else if (error.request) {
        console.error('Erreur avec la requête:', error.request);
        toast.error('Erreur de requête : Vérifiez votre connexion');
      } else {
        console.error('Erreur générale:', error.message);
        toast.error(`Erreur inconnue: ${error.message}`);
      }
    } finally {
      loadingSend.onFalse();
    }
  });

  // Ajoute un nouvel employé avec des valeurs par défaut
  const handleAdd = () => {
    append({
      passport_number: '',
      last: '',
      job: '',
      first: '',
      phone: '',
      locked: false,
      passportExists: false,
    });
  };

  const handleRemove = (index) => {
    remove(index);
  };

  const handleRenew = () => {
    renewalModal.onTrue(); // Ouvre la modale
  };

  const handleConfirmRenew = async () => {
    try {
      const response = await axios.get(API.searchPassport(passportInput));
      const { data } = response;

      if (!data) {
        toast.error('Aucun utilisateur trouvé pour ce passeport');
        return;
      }

      append({
        passport_number: data.passport_number,
        last: data.last,
        first: data.first,
        phone: data.phone,
        type: 'renewal',
        reference: data.reference,
        job: data.job.slug, // champ libre
        passportExists: true,
        locked: true,
      });
      setPassportInput('');
      renewalModal.onFalse(); // Ferme la modale
    } catch (err) {
      toast.error(err.details || 'Aucun employé trouvé pour ce passeport');
      // reset({employees: []}); // Réinitialise le formulaire
    }
  };

  // Exemple de vérification du numéro de passeport avec debounce
  const checkPassportExistence = async (numero, index) => {
    if (!numero) return;

    try {
      const { data } = await axios.get(API.searchPassport(numero));
      // s'il y a un passport_number dans la réponse, alors il existe
      setValue(`employees[${index}].passportExists`, !!data.passport_number);
    } catch (error) {
      if (error.response?.status === 404 || error.details) {
        // pas trouvé → passportExists = false
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
      // appel direct (ou debouncedPassportCheck si vous préférez laisser un très léger délai)
      checkPassportExistence(numero, index);
    }
  };

  // Gestion du changement pour le numéro de passeport
  const handlePassportChange = (e, index) => {
    const { value } = e.target;
    methods.setValue(`employees[${index}].passport_number`, value);
    methods.setValue(`employees[${index}].passportExists`, false); // Réinitialiser l'état d'existence du passeport
  };

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
        const findByValue = allOptions.find((opt) => opt.value === row.Fonction);
        const findByLabel = allOptions.find((opt) => opt.label === row.Fonction);
        return findByValue?.value || findByLabel?.value || '';
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
      };
    });

    reset({ employees: mappedEmployees });
    await new Promise((r) => setTimeout(r, 0));
    await verifyPassports(mappedEmployees, methods.setValue);
  };

  const handleCancelRenew = () => {
    setPassportInput('');
    renewalModal.onFalse();
  };

  // Fonction pour obtenir l'option correspondant à une valeur
  const getJobOption = (jobValue) => allOptions.find((option) => option.value === jobValue) || null;

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
              {fields.map((item, index) => (
                <Stack key={item.id} alignItems="flex-end" spacing={1.5}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: 1 }}>
                    <Field.Text
                      size="small"
                      name={`employees[${index}].passport_number`}
                      label="Numéro Passeport"
                      disabled={values.employees[index].locked}
                      inputlabelprops={{ shrink: true }}
                      onBlur={(e) => handlePassportBlur(e, index)}
                      onChange={(e) => handlePassportChange(e, index)}
                      error={
                        values.employees[index].passportExists && !values.employees[index].locked
                      }
                      helperText={
                        values.employees[index].passportExists
                          ? values.employees[index].locked
                            ? '✅ Ce passeport existe déjà, il est bien enregistré.'
                            : '❌ Ce numéro de passeport existe déjà. Cela devrait être un duplicata ou un renouvellement.'
                          : ''
                      }
                      FormHelperTextProps={{
                        sx: {
                          color: values.employees[index].locked ? 'success.main' : 'error.main',
                        },
                      }}
                    />
                    <Field.Phone
                      size="small"
                      name={`employees[${index}].phone`}
                      label="Numéro de Téléphone"
                      placeholder="votre numero de téléphone"
                      sx={{ width: '100%' }}
                      inputlabelprops={{ shrink: true }}
                      // disabled={values.employees[index].locked}
                    />
                    <Field.Text
                      size="small"
                      name={`employees[${index}].last`}
                      label="Nom"
                      inputlabelprops={{ shrink: true }}
                      disabled={values.employees[index].locked}
                    />
                    <Field.Text
                      size="small"
                      name={`employees[${index}].first`}
                      label="Prénom"
                      inputlabelprops={{ shrink: true }}
                      disabled={values.employees[index].locked}
                    />

                    {/* Remplacement du Field.Select par Autocomplete */}
                    <Box sx={{ minWidth: 160, maxWidth: { md: 200 } }}>
                      <Autocomplete
                        size="small"
                        options={allOptions}
                        getOptionLabel={(opt) => opt.label}
                        loading={loadingOptions}
                        fullWidth
                        value={getJobOption(values.employees[index]?.job)}
                        // disabled={values.employees[index]?.locked}
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
                        renderOption={(props, option, { index: optionIndex }) => (
                          <li {...props} key={`${option.value}-${optionIndex}`}>
                            {option.label}
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Fonction *"
                            size="small"
                            fullWidth
                            error={!!methods.formState.errors.employees?.[index]?.job}
                            helperText={methods.formState.errors?.employees?.[index]?.job?.message}
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
              ))}
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
