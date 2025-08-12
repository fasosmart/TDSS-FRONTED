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
import MenuItem from '@mui/material/MenuItem';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';
import { toast } from 'sonner';
import { z as zod } from 'zod';

import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { getRegions, getProfils, getUserTypes } from 'src/utils/options';

import API from 'src/utils/api';
import axios from 'src/utils/axios';

// ----------------------------------------------------------------------

export const UserQuickEditSchema = zod.object({
  name: zod.string().min(1, { message: 'le nom est obligatoire' }),
  email: zod
    .string()
    .min(1, { message: 'Email est obligatoire!' })
    .email({ message: 'Email doit etre un email valide !' }),
  // picture: schemaHelper.file({
  //   message: { required_error: 'televerser un image!' },
  // }),
  phone: zod.string().min(1, { message: "Entrez votre numero de téléphone " }),

  type: zod.string().min(1, { message: 'le type est requis!' }),
  profile: zod.string().min(1, { message: 'le profil est requis!' }),
  location: zod.string().min(1, { message: 'la région est réquise!' }),
  // agency: zod.string().min(1, { message: " l' agence est requis" }),
});

// ----------------------------------------------------------------------

export function UserQuickEditForm({ currentUser, open, onClose, onUpdateRow }) {
  const [regions, setRegions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [profils, setProfils] = useState([]);
  // const [agences, setAgences] = useState([]);

  const defaultValues = useMemo(() => {
    const currentRegion = regions?.find((region) => region.name === currentUser?.location);
    const currentRole = roles?.find((role) => role.name === currentUser?.type);
    const currentProfil = profils?.find((profil) => profil.name === currentUser?.profile);
    // const currentAgence = agences?.find(agence => agence.name === currentUser?.agency);

    return {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      picture: currentUser?.picture || '',
      phone: currentUser?.phone || '',
      type: currentRole ? currentRole.slug : currentUser.type || '',
      profile: currentProfil ? currentProfil.slug : currentUser.profile || '',
      location: currentRegion ? currentRegion.slug : currentUser.location || '',
      // agency: currentAgence ? currentAgence.slug : currentUser.agency || '',
    };
  }, [regions, roles, profils, currentUser]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(UserQuickEditSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const getModifiedFields = (originalData, newData) => {
    const modifiedFields = {};

    Object.keys(newData).forEach((key) => {
      if (newData[key] !== originalData[key]) {
        modifiedFields[key] = newData[key];
      }
    });

    return modifiedFields;
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const modifiedData = getModifiedFields(currentUser, data);

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
      const response = await axios.patch(API.updateUser(currentUser.slug), data);

      toast.success('Mise à jour réussie !');

      // Fusionner les données modifiées avec le client courant pour obtenir la version à jour
      const updatedUser = { ...currentUser, ...modifiedData };
      onUpdateRow(updatedUser);
      reset();
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour .');
      console.error('Erreur:', error.response?.data || error.message);
    }
  });

  useEffect(() => {
    getRegions().then((data) => setRegions(data));
    // getAgences().then(data => setAgences(data));
    getUserTypes().then((data) => setRoles(data));
    getProfils().then((data) => setProfils(data));
  }, []);

  // Pour mettre à jour les valeurs du formulaire dès que currentUser change
  useEffect(() => {
    reset(defaultValues);
  }, [currentUser, defaultValues, reset]);

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
            <Field.Text name="name" label="Nom complet" />
            <Field.Text name="email" label="Adresse mail" />
            <Field.Phone name="phone" label="Numéro de Téléphone" />

            <Field.Select name="profile" label="Profil">
              {profils.map((profil) => (
                <MenuItem key={profil?.slug} value={profil?.slug}>
                  {profil?.name}
                </MenuItem>
              ))}
            </Field.Select>
            <Field.Select name="location" label="Region">
              {regions.map((region) => (
                <MenuItem key={region?.slug} value={region?.slug}>
                  {region?.name}
                </MenuItem>
              ))}
            </Field.Select>
            {/* <Field.Select name="agency" label="Agence" >
              {agences.map((agence) => (
                <MenuItem key={agence?.slug} value={agence?.slug}>
                  {agence?.name}
                </MenuItem>
              ))
              }
            </Field.Select> */}
            <Field.Select name="type" label="Role" inputlabelprops={{ shrink: true }}>
              {roles?.map((role) => (
                <MenuItem key={role.slug} value={role.slug}>
                  {role?.name}
                </MenuItem>
              ))}
            </Field.Select>
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
