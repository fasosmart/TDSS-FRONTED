import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
// import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import axios from 'src/utils/axios';
import debounce from 'lodash.debounce';

import { useState, useEffect, useCallback } from 'react';
import { get, useFieldArray, useFormContext } from 'react-hook-form';
// import { Step, Modal, Stepper, StepLabel, IconButton } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
} from '@mui/material';

import API from 'src/utils/api';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { useBoolean } from 'src/hooks/use-boolean';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export function DeclarationNewEditDetails({ formData }) {
  const { control, setValue, watch, reset } = useFormContext();
  const DEFAULT_LIMIT = 100;
  const MAX_EMPLOYEES = 20;
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [nextUrl, setNextUrl] = useState(API.listFonctionAgent()); // première page
  const [previousUrl, setPreviousUrl] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openModalDoc, setOpenModalDoc] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState();
  const renewalModal = useBoolean();
  const [loadingRenew, setLoadingRenew] = useState(false);
  const [passportInput, setPassportInput] = useState('');
  const [params, setParams] = useState({
    offset: 0,
    limit: DEFAULT_LIMIT,
    name: '',
  });

  // const typedec = type?.trim();

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
      // type:'NEW',
      locked: false,
      passportExists: false,
      // On initialise les fichiers à null (ils seront mis à jour via le modal)
      // recto: null,
      // verso: null,
      // signature: null,
      // empreinte: null,
      // attestation: null,
      // certificat: null,
      // contrat: null,
      // dossierCriminel: null,
      // dossierMedical: null,
      // diplomes: null,
      // cv: null,
      // passeport: null,
      // planPanafricanisation: null,
    });
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

      renewalModal.onFalse(); // Ferme la modale
    } catch (err) {
      toast.error('Erreur lors de la récupération des données');
    }
  };

  const handleRemove = (index) => {
    remove(index);
  };

  // Ouvre le modal pour les données biométriques
  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleOpenModalDoc = () => {
    setOpenModalDoc(true);
  };

  const handleCloseModalDoc = () => {
    renewalModal.onFalse();
  };
  // Ferme le modal et réinitialise le stepper
  const handleCloseModal = () => {
    setOpenModal(false);
    setActiveStep(0);
  };

  // Passe à l'étape suivante (tant que l'étape active est inférieure à 3)
  const handleNext = () => {
    if (activeStep < 3) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  // Retour à l'étape précédente
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  // Handler générique pour gérer l'upload d'un fichier.
  // On passe le nom du champ à mettre à jour dans le formulaire.
  const handleImageUpload = (fieldName) => (event) => {
    const { files } = event.target;
    if (files && files.length > 0) {
      setValue(fieldName, files[0]);
    } else {
      console.log(`Aucun fichier sélectionné pour ${fieldName}`);
    }
  };

  const handleUploadDoc = (fieldName) => (event) => {
    const doc = event.target.files;
    if (doc && doc.length > 0) {
      setValue(fieldName, doc[0]);
    } else {
      console.log(`Aucun fichier sélectionné pour ${fieldName}`);
    }
  };

  // Exemple de fonction "finish" : ici, on ferme simplement le modal.
  // Vous pouvez ajouter d'autres traitements si besoin.
  const handleFinish = () => {
    handleCloseModal();
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchAllFonctions() {
      setLoadingOptions(true);
      try {
        // Vérifier si on a déjà le cache en session
        const cached = sessionStorage.getItem('fonctions');
        if (cached) {
          const parsed = JSON.parse(cached);
          setOptions(parsed); // Affiche directement les données en cache
          setLoadingOptions(false);
          return; // Pas besoin d'appeler le serveur
        }

        // 1) Premier appel pour count
        const resp1 = await axios.get(API.listFonctionAgent(), {
          params: { offset: 0, limit: 100 },
        });
        const total = resp1.data.count;

        const initialOptions = resp1.data.results
          .filter((f, idx, arr) => arr.findIndex((item) => item.slug === f.slug) === idx)
          .map((f) => ({ label: f.name, value: f.slug }));

        setOptions(initialOptions);

        // 2) Rapatrier tout
        const resp2 = await axios.get(API.listFonctionAgent(), {
          params: { offset: 0, limit: total },
        });
        if (!isMounted) return;

        // Filtre pour n'avoir qu'un slug unique
        const uniqueBySlug = resp2.data.results
          .filter((f, idx, arr) => arr.findIndex((item) => item.slug === f.slug) === idx)
          .map((f) => ({ label: f.name, value: f.slug }));

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
    await verifyPassports(mappedEmployees, setValue);
  };

  useEffect(() => {
    if (formData?.length > 0 && options?.length > 0) {
      const importedData = formData.map((row) => ({
        Fonction: row.Fonction?.trim() || '',
        Numero: row.Numero || '',
        Nom: row.Nom || '',
        Prenom: row.Prenom || '',
        Telephone: row.Telephone || '',
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

  // Création de la version debounce de la fonction
  // On utilise ici 500ms de délai après la dernière saisie
  const debouncedPassportCheck = useCallback(
    debounce((numero, index) => {
      checkPassportExistence(numero, index);
    }, 500),
    []
  );

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

  //  Créer la fonction qui vérifie l'identifier
  const checkIdentifier = async (identifier, index) => {
    if (!identifier) return;
    try {
      const response = await axios.get(API.searchIdentifier(identifier));
      const person = response.data.data;
      // Mise à jour dynamique des champs de l'item correspondant
      setValue(`employees[${index}].passport_number`, person.numero);
      setValue(`employees[${index}].last`, person.nom);
      setValue(`employees[${index}].first`, person.prenom);
      setValue(`employees[${index}].phone`, person.telephone);
      setValue(`employees[${index}].job`, person.fonction);
      // debouncedPassportCheck(person.numero, index);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  };

  //  Créer une version debounced pour éviter trop d'appels à l'API
  const debouncedIdentifierCheck = useCallback(
    debounce((identifier, index) => {
      checkIdentifier(identifier, index);
    }, 500),
    []
  );

  //  Créer le handler pour le champ identifier
  const handleIdentifierChange = (e, index) => {
    const identifier = e.target.value;
    setValue(`employees[${index}].identifier`, identifier);
    debouncedIdentifierCheck(identifier, index);
  };

  const allDocuments = [
    { label: "Déclaration d'attestation", key: 'attestation' },
    { label: 'Certificat de régulation sociale', key: 'certificat' },
    { label: 'Contrat de travail', key: 'contrat' },
    { label: 'Dossier criminel', key: 'dossierCriminel' },
    { label: 'Dossier médical (3 derniers mois)', key: 'dossierMedical' },
    { label: 'Copies des diplômes', key: 'diplomes' },
    { label: 'CV', key: 'cv' },
    { label: 'Passeport', key: 'passeport' },
    { label: 'Plan de panafricanisation', key: 'planPanafricanisation' },
  ];

  // Si le type est "Duplicata", on ne garde que "Certificat de perte" et "CV"
  // const filteredDocuments = typedec === "Duplicata"
  //   ? [{ label: "Certificat de perte", key: "certificatPerte" }, { label: "CV", key: "cv" }]
  //   : allDocuments;

  const getJobOption = (jobValue) => options.find((option) => option.value === jobValue) || null;

  return (
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
          <Button onClick={renewalModal.onFalse}>Annuler</Button>
          <LoadingButton onClick={handleConfirmRenew} loading={loadingRenew}>
            Valider
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
        {fields.map((item, index) => (
          <Stack key={item.id} alignItems="flex-end" spacing={1.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: 1 }}>
              {/* {typedec === 'Renouvellement' || typedec === 'Duplicata' && (
                <Field.Text
                  size="small"
                  name={`employees[${index}].identifier`}
                  label="Identifiant"
                  inputlabelprops={{ shrink: true }}
                  onChange={(e) => handleIdentifierChange(e, index)}
                />
              )} */}

              <Field.Text
                size="small"
                disabled={values.employees[index].locked}
                name={`employees[${index}].passport_number`}
                label="Numéro Passeport *"
                inputlabelprops={{ shrink: true }}
                onChange={(e) => handlePassportChange(e, index)}
                onBlur={(e) => handlePassportBlur(e, index)}
                error={values.employees[index].passportExists} // true = duplication
                helperText={
                  values.employees[index].passportExists
                    ? '❌ Ce numéro de passeport existe déjà. Cela devrait être un duplicata ou un renouvellement.'
                    : ''
                }
                FormHelperTextProps={{
                  sx: {
                    color: values.employees[index].passportExists
                      ? 'error.main' // bordure/texte en rouge si existe déjà
                      : 'success.main', // vert sinon
                  },
                }}
              />

              <Field.Phone
                size="small"
                name={`employees[${index}].phone`}
                label="Numéro de Téléphone *"
                placeholder="votre numero de téléphone  "
                sx={{ width: '100%' }}
                inputlabelprops={{ shrink: true }}
                disabled={values.employees[index].locked}
              />

              <Field.Text
                size="small"
                name={`employees[${index}].last`}
                label="Nom *"
                inputlabelprops={{ shrink: true }}
                disabled={values.employees[index].locked}
              />
              <Field.Text
                size="small"
                name={`employees[${index}].first`}
                label="Prénom *"
                inputlabelprops={{ shrink: true }}
                disabled={values.employees[index].locked}
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
                // On surcharge renderOption pour forcer une key unique
                renderOption={(props, option, { index }) => (
                  <li
                    {...props}
                    key={`${option.value}-${index}`} // utilisez le slug + index
                  >
                    {option.label}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Fonction *"
                    size="small"
                    fullWidth
                    // error={!!watch(`employees[${index}].job`)}
                    // helperText={watch(`employees[${index}].job`) ? '' : 'Fonction requise'}
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
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              {/* {typedec !== "Duplicata" && (
                <Button onClick={handleOpenModal} variant="outlined">
                  {typedec === "Renouvellement" ? "Ancien Permis" : "Données Biométriques"}
                </Button>
              )}

              <Button onClick={handleOpenModalDoc} variant="outlined">
                Joindre Documents
              </Button> */}
            </Stack>

            {/* Modal pour les documents */}
            {/* <Modal open={openModalDoc} onClose={handleCloseModalDoc}>
              <Box
                sx={{
                  width: '60%',
                  maxWidth: 600,
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'background.paper',
                  boxShadow: 24,
                  p: 3,
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" sx={{ mt: 3, textAlign: 'center' }}>Documents à joindre</Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {filteredDocuments.map((doc) => (
                    <Stack key={doc.key} direction="row" alignItems="center" spacing={2}>
                      <Typography variant="body1" sx={{ flexGrow: 1 }}>
                        {doc.label}
                      </Typography>
                      <IconButton
                        variant="outlined"
                        component="label"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: 1,
                          borderColor: 'primary.main',
                          '&:hover': {
                            borderColor: 'primary.dark',
                          },
                        }}
                      >
                        <Iconify icon="solar:attach-circle-bold" width={20} />
                        <input
                          type="file"
                          onChange={handleUploadDoc(`items[${index}].${doc.key}`)}
                        />
                      </IconButton> */}

            {/* Icône pour voir le fichier s'il est téléchargé */}
            {/* {watch(`items[${index}].${doc.key}`) && (
                        <IconButton
                          color="primary"
                          component="a"
                          href={URL.createObjectURL(watch(`items[${index}].${doc.key}`))}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Iconify icon="solar:eye-bold" width={24} />
                        </IconButton>
                      )}
                    </Stack>
                  ))}
                </Stack>

              </Box>
            </Modal> */}

            {/* Modal pour les données biométriques */}
            {/* <Modal open={openModal} onClose={handleCloseModal}>

              <Box
                sx={{
                  width: '60%',
                  maxWidth: 600,
                  margin: 'auto',
                  mt: 10,
                  p: 3,
                  bgcolor: 'background.paper',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(15%, 60%)',
                }}

              > */}
            {/* Condition : Si Renouvellement -> Upload seul, sinon Stepper */}
            {/* {typedec === "Renouvellement" ? (
                  <>
                    <Typography variant="h6" align="center" gutterBottom>
                      Upload de l'Ancien Permis
                    </Typography>
                    <Field.UploadAvatar
                      name="ancienPermis"
                      maxSize={3145728}
                      helperText={
                        <Typography variant="caption">
                          Formats autorisés : *.jpeg, *.jpg, *.png, *.gif
                        </Typography>
                      }
                      onChange={handleImageUpload("ancienPermis")}
                    />
                  </>
                ) : (
                  <>
                    <Stepper activeStep={activeStep} alternativeLabel>
                      {['Recto', 'Verso', 'Signature', 'Empreinte'].map((label, i) => (
                        <Step key={i}>
                          <StepLabel>{label}</StepLabel>
                        </Step>
                      ))}
                    </Stepper>

                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Button onClick={handleBack} disabled={activeStep === 0}>
                          Retour
                        </Button>
                        <Button onClick={activeStep === 3 ? handleFinish : handleNext}>
                          {activeStep === 3 ? 'Terminer' : 'Suivant'}
                        </Button>
                      </Stack>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" align="center">
                          {['Recto', 'Verso', 'Signature', 'Empreinte'][activeStep]}
                        </Typography> */}

            {/* Utilisation du composant UploadWithPreview pour chaque étape */}
            {/* {activeStep === 0 && (
                          <Field.UploadAvatar
                            name={`items[${index}].recto`}
                            maxSize={3145728}
                            helperText={
                              <Typography variant="caption">
                                Allowed *.jpeg, *.jpg, *.png, *.gif
                              </Typography>
                            }
                            onChange={handleImageUpload(`items[${index}].recto`)}
                          />
                        )}
                        {activeStep === 1 && (
                          <Field.UploadAvatar
                            name={`items[${index}].verso`}
                            maxSize={3145728}
                            helperText={
                              <Typography variant="caption">
                                Allowed *.jpeg, *.jpg, *.png, *.gif
                              </Typography>
                            }
                            onChange={handleImageUpload(`items[${index}].verso`)}
                          />
                        )}
                        {activeStep === 2 && (
                          <Field.UploadAvatar
                            name={`items[${index}].signature`}
                            type="file"
                            maxSize={3145728}
                            helperText={
                              <Typography variant="caption">
                                Allowed *.jpeg, *.jpg, *.png, *.gif
                              </Typography>
                            }
                            onChange={handleImageUpload(`items[${index}].signature`)}
                          />
                        )}
                        {activeStep === 3 && (
                          <Field.UploadAvatar
                            name={`items[${index}].empreinte`}
                            maxSize={3145728}
                            helperText={
                              <Typography variant="caption">
                                Allowed *.jpeg, *.jpg, *.png, *.gif
                              </Typography>
                            }
                            onChange={handleImageUpload(`items[${index}].empreinte`)}
                          />
                        )}
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Modal> */}
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

        {/* <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleRenew}
          sx={{ flexShrink: 0 }}
        >
          Renouvellement
        </Button> */}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {fields.length} / {MAX_EMPLOYEES} employés ajoutés
        </Typography>
      </Stack>
    </Box>
  );
}
