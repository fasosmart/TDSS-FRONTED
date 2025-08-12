'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import LoadingButton from '@mui/lab/LoadingButton';
import { Grid2 } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import axios from 'src/utils/axios';
import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';
import { z as zod } from 'zod';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import API from 'src/utils/api';
import { fData } from 'src/utils/format-number';

import { Form, Field, schemaHelper } from 'src/components/hook-form';
import { toast } from 'src/components/snackbar';

import { getRegions, getAgences } from 'src/utils/options';

// ----------------------------------------------------------------------
// Le schéma de validation (nous n'incluons plus username car le backend s'appuie sur email)
export const NewUserSchema = zod.object({
  picture: zod.any().optional(),
  first_name: zod.string().min(1, { message: ' Le prénom est obligatoire' }),
  last_name: zod.string().min(1, { message: 'le nom est obligatoire' }),
  email: zod
    .string()
    .min(1, { message: 'Email est obligatoire!' })
    .email({ message: 'Email doit être valide!' }),



   phone: zod.string().min(1, { message: "Entrez votre numero de téléphone " }),

  type: zod.string().optional(),
  profile: zod
    .object({
      slug: zod.string(),
      name: zod.string(),
      type: zod.string(),
    })
    .optional(),
  location: zod.string().optional(),
  agency: zod.string().optional(),
});

// ----------------------------------------------------------------------
// Composant ajusté
export function UserNewEditForm({ currentUser, user }) {
  const router = useRouter();
  const password = useBoolean();

  const [eror, setError] = useState(null);
  const [regions, setRegions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [profils, setProfils] = useState([]);
  const [agences, setAgences] = useState([]);
  const [selectedProfil, setSelectedProfil] = useState('');
  const [typeProfil, setTypeProfil] = useState();

  const defaultValues = useMemo(() => {
    const currentRegion = regions?.find((region) => region.name === currentUser?.location?.name);
    const currentRole = roles?.find((role) => role.name === currentUser?.type?.name);
    const currentProfil = profils?.find((profil) => profil.name === currentUser?.profile?.name);
    const currentAgence = agences?.find((agence) => agence.name === currentUser?.agency?.name);

    return {
      first_name: currentUser?.first_name || '',
      last_name: currentUser?.last_name || '',
      email: currentUser?.email || '',
      picture: currentUser?.picture || '',
      phone: currentUser?.phone || '',
      type: currentRole ? currentRole.slug : currentUser?.type?.slug || '',
      profile: currentProfil || currentUser?.profile || '',
      location: currentRegion ? currentRegion.slug : currentUser?.location?.slug || '',
      agency: currentAgence ? currentAgence.slug : currentUser?.agency?.slug || '',
    };
  }, [currentUser]);

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const getModifiedFields = (originalData, newData) => {
    const modifiedFields = {};

    Object.keys(newData).forEach((key) => {
      if (newData[key] !== originalData[key]) {
        modifiedFields[key] = newData[key];
      }
    });

    return modifiedFields;
  };

  const getRolesProfile = async (profile_code) => {
    try {
      const response = await axios.get(API.getProfile(profile_code));
      const { data } = response;
      if (data) {
        setRoles(data?.results || []);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles pour le profil:', error);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Petite pause pour simuler le délai
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Créer un FormData pour gérer le multipart/form-data
      const formData = new FormData();

      // Ajouter tous les champs du formulaire sauf l'image
      Object.keys(data).forEach((key) => {
        if (key !== 'picture' && data[key] !== undefined) {
          formData.append(key, key === 'profile' ? data[key].slug : data[key]);
        }
      });
      // Si le champ picture est renseigné et de type File, on l'ajoute
      if (data.picture && data.picture instanceof File) {
        formData.append('picture', data.picture);
      }

      // Si currentUser est présent, on effectue une mise à jour, sinon une création
      let response;
      if (currentUser) {
        const modifiededData = getModifiedFields(currentUser, data);
        if (Object.keys(modifiededData).length === 0) {
          return;
        }
        const newData = new FormData();
        Object.keys(modifiededData).forEach((key) => {
          newData.append(key, modifiededData[key]);
        });
        // Appel à la route de mise à jour avec le slug
        response = await axios.put(API.updateUser(currentUser.slug), formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Appel à la route de création
        response = await axios.post(API.createUser(), formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      reset();
      toast.success(currentUser ? 'Mis à jour effectué!' : "Création d'un utilisateur réussie !");
      router.push(paths.dashboard.user.list);
      console.info('DATA', response);
    } catch (err) {
      const data = err.response?.data || err;

      const messages = [];

      if (data.phone) {
        messages.push(...(Array.isArray(data.phone) ? data.phone : [data.phone]));
      }
      if (data.email) {
        messages.push(...(Array.isArray(data.email) ? data.email : [data.email]));
      }

      if (data.details) messages.push(data.details);
      if (data.error) messages.push(data.error);
      if (data.message) messages.push(data.message);

      const errorMessage = messages.join(' ');

      console.error("Erreur lors de l'envoi au backend :", messages);
      toast.error(errorMessage);
    }
  });

  useEffect(() => {
    let isMounted = true;
    const fetchProfiles = async () => {
      try {
        const resp1 = await axios.get(API.listActiveProfile(), {
          params: { offset: 0, limit: 1 },
        });
        const total = resp1.data.count;

        const resp2 = await axios.get(API.listActiveProfile(), {
          params: { offset: 0, limit: total },
        });
        if (!isMounted) return;
        setProfils(resp2.data.results || resp2.data);
        if (currentUser?.profile?.type) {
          const typeLower = currentUser?.profile?.type.toLowerCase();
          setTypeProfil(typeLower);
          getRolesProfile(typeLower);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des profils:', error);
        setError('Erreur lors de la récupération des profils');
      }
    };
    fetchProfiles();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    getRegions().then((data) => setRegions(data));
    getAgences().then((data) => setAgences(data));
    //   getProfils().then(data => {
    //     setProfils(data);
    //   if (currentUser?.profile?.type) {
    //       const typeLower = currentUser?.profile?.type.toLowerCase();
    //       setTypeProfil(typeLower);
    //       getRolesProfile(typeLower);
    //   }
    // });
  }, [currentUser]);

  // Pour mettre à jour les valeurs du formulaire dès que currentClient change
  useEffect(() => {
    reset(defaultValues);
  }, [currentUser, reset]);

  const options = profils.filter(
    (profil, index, self) => index === self.findIndex((p) => p.name === profil.name)
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid2 container spacing={3}>
        <Grid2 size={{ xs: 6, md: 4 }}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {/* {currentUser && (
              <Label
                color={
                  (values.status === 'active' && 'success') ||
                  (values.status === 'banni' && 'error') ||
                  'warning'
                }
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.status}
              </Label>
            )} */}
            <Box sx={{ mb: 5 }}>
              <Field.UploadAvatar
                name="picture"
                maxSize={3145728}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(3145728)}
                  </Typography>
                }
              />
            </Box>

            {/* {currentUser && (
              <FormControlLabel
                labelPlacement="start"
                control={
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        {...field}
                        checked={field.value !== 'active'}
                        onChange={(event) =>
                          field.onChange(event.target.checked ? 'banned' : 'active')
                        }
                      />
                    )}
                  />
                }
                label={
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Banni
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Désactiver le compte
                    </Typography>
                  </>
                }
                sx={{
                  mx: 0,
                  mb: 3,
                  width: 1,
                  justifyContent: 'space-between',
                }}
              />
            )} */}

            {/* <Field.Switch
              name="reset_pwd"
              labelPlacement="start"
              label={
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Vérification du mail
                </Typography>
              }
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            /> */}

            {currentUser && (
              <Stack justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
                <Button variant="soft" sx={{ bgcolor: 'error.main' }}>
                  Desactiver ce compte
                </Button>
              </Stack>
            )}
          </Card>
        </Grid2>

        <Grid2 size={{ xs: 6, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              {/* On a retiré le champ username du formulaire affiché */}
              <Field.Text name="first_name" label="Prénom *" />
              <Field.Text name="last_name" label="Nom *" />
              <Field.Text name="email" label="Adresse Mail *" />
              <Field.Phone name="phone" label="Numéro de Téléphone *" />

              <Field.Autocomplete
                name="profile"
                label="Structure *"
                options={options}
                getOptionLabel={(option) => option.name || ''}
                isOptionEqualToValue={(option, value) => option.slug === value.slug}
                onCustomChange={(selectedProfil) => {
                  if (selectedProfil) {
                    const typeLower = selectedProfil?.type?.toLowerCase();
                    setTypeProfil(typeLower);
                    getRolesProfile(typeLower);
                    setValue('type', '');
                  }
                }}
              />

              <Field.Select name="location" label="Region *">
                {regions.map((region) => (
                  <MenuItem key={region?.slug} value={region?.slug}>
                    {region?.name}
                  </MenuItem>
                ))}
              </Field.Select>

              {typeProfil === 'tdss' && (
                <Field.Select name="agency" label="Agence *">
                  {agences.map((agence) => (
                    <MenuItem key={agence?.slug} value={agence?.slug}>
                      {agence?.name}
                    </MenuItem>
                  ))}
                </Field.Select>
              )}

              <Field.Select name="type" label="Role *" inputlabelprops={{ shrink: true }}>
                {roles?.map((role) => (
                  <MenuItem key={role.slug} value={role.slug}>
                    {role?.name}
                  </MenuItem>
                ))}
              </Field.Select>
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser ? "Créer l'utilisateur" : 'Sauvegarder les changements'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid2>
      </Grid2>
    </Form>
  );
}
