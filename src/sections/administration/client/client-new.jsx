'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'src/routes/hooks';
import { toast } from 'sonner';
import { fData } from 'src/utils/format-number';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import MenuItem from '@mui/material/MenuItem';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import axios from 'src/utils/axios';
import API from 'src/utils/api';
import { getRegions, getProfileTypes, getUserTypes } from 'src/utils/options';

// Schéma de validation global (profil + utilisateur)
export const NewClientSchema = zod.object({
    // Informations du profil client
    name: zod.string().min(1, { message: 'Le nom est requis !' }),
    description: zod.string(),
    adresse: zod.string().min(1, { message: "L'adresse est requise !" }),
    type: zod.union([
        zod.string().min(1, { message: 'Le type est requis et ne peut pas être vide !' }),
        zod.number()
    ]),
    location: zod.union([
        zod.string().min(1, { message: 'La région est requise et ne peut pas être vide !' }),
        zod.number()
    ]),
    email: zod
        .string()
        .min(1, { message: "L'email est obligatoire" })
        .email({ message: "L'email doit être un email valide !" }),
    contact: schemaHelper.phoneNumber({ isValidPhoneNumber }),
    picture: zod.any().optional(),

    // Informations de l'administrateur (utilisateur)
    user_first_name: zod.string().min(1, { message: 'Le prénom est obligatoire' }),
    user_last_name: zod.string().min(1, { message: 'Le nom est obligatoire' }),
    user_email: zod
        .string()
        .min(1, { message: 'Email est obligatoire !' })
        .email({ message: "L'email doit être un email valide !" }),
    user_picture: zod.any().optional(),
    user_phone: schemaHelper.phoneNumber({ isValidPhoneNumber }),
    user_type: zod.string().optional(),
    user_profile: zod.string().optional(),
    user_location: zod.string().optional()
});

export function ClientNewEditForm({ currentClient }) {
    const router = useRouter();

    // Gestion des étapes du formulaire
    const [step, setStep] = useState(1);
    const [roles, setRoles] = useState([]);
    const [regions, setRegions] = useState([]);
    const [types, setTypes] = useState([]);

    // Stockage du slug du profil créé et du slug de la région retourné par l'API
    const [profileSlug, setProfileSlug] = useState(null);
    const [regionslug, setRegionslug] = useState(null);

    // Valeurs par défaut pour la première étape
    const defaultValues = useMemo(() => {
        // Pour la région : trouver l'option dont le nom correspond à currentClient.location
        const currentRegion = regions.find(region => region.name === currentClient?.location?.name);
        // Pour le type de profil : pareil, on cherche l'option dont le nom correspond
        const currentType = types.find(type => type.name === currentClient?.type.name);

        return {
            name: currentClient?.name || '',
            type: currentType ? currentType.slug : currentClient?.type?.slug || '',
            description: currentClient?.description || '',
            email: currentClient?.email || '',
            contact: currentClient?.contact || '',
            adresse: currentClient?.adresse || '',
            location: currentRegion ? currentRegion.slug : currentClient?.location?.slug || '',
            picture: currentClient?.picture || '',
        };
    }, [currentClient, regions, types]);


    // Configuration du formulaire avec react-hook-form et Zod
    const methods = useForm({
        mode: 'all',
        resolver: zodResolver(NewClientSchema),
        defaultValues
    });

    const {
        reset,
        handleSubmit,
        formState: { isSubmitting }
    } = methods;

    // Réinitialisation du formulaire si les valeurs par défaut changent
    useEffect(() => {
        reset(defaultValues);
    }, [currentClient, defaultValues, reset]);

    // Récupération des options (régions, types de profil et rôles)
    useEffect(() => {
        getRegions().then(data => setRegions(data));
        getProfileTypes().then(data => setTypes(data));
       getUserTypes().then(data => {
    // On filtre pour ne garder que le rôle "admin"
        const adminRole = data.find(role => role.name.toLowerCase() === "admin");
        
        if (adminRole) {
        setRoles([adminRole]); // On ne garde que l'admin dans le tableau des rôles
        // setValue("user_type", adminRole.slug); // On préremplit le champ avec le slug d'admin
        }
    });
    }, []);

    const getModifiedFields = (originalData, newData) => {
        const modifiedFields = {};

        Object.keys(newData).forEach((key) => {
            if (newData[key] !== originalData[key]) {
                modifiedFields[key] = newData[key];
            }
        });

        return modifiedFields;
    };

    // Fonction pour la première étape : création du profil client
    const handleNext = async () => {
        try {
            const profileData = methods.getValues();
            const formData = new FormData();

            // Ajout des champs du profil
            ['name', 'description', 'type', 'email', 'contact', 'adresse', 'location', 'picture'].forEach(
                key => {
                    if (profileData[key]) {
                        formData.append(key, profileData[key]);
                    }
                }
            );

            // Ajout de l'image si présente
            if (profileData.picture instanceof File) {
                formData.append('picture', profileData.picture);
            }

            let response;
            if (currentClient) {
                const modifiededData = getModifiedFields(currentClient, profileData);
                if (Object.keys(modifiededData).length === 0) {
                    toast.info("Aucune modification détectée.");
                    return;
                }
                const newData = new FormData();
                Object.keys(modifiededData).forEach(key => {
                    newData.append(key, modifiededData[key]);
                });
                response = await axios.patch(API.UpdateProfile(currentClient.slug), newData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Mise à jour réussie !');
                reset();
                router.push(paths.dashboard.client.root);
            } else {
                // Envoi de la requête de création du profil
                response = await axios.post(API.createProfile(), formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });


                // Récupération du slug du profil et de la région
                setProfileSlug(response.data.slug);
                setRegionslug(response.data.location);

                // Passage à l'étape suivante
                setStep(2);
            }
        } catch (error) {
            toast.error('Erreur lors de la création du profil.');
            console.error('Erreur:', error.response?.data || error.message);
        }
    };

    // Soumission finale : création de l'utilisateur associé
    const onSubmit = handleSubmit(async (data) => {
        try {
            const formData = new FormData();

            // Construction du FormData avec les champs requis pour l'utilisateur
            formData.append('first_name', data.user_first_name);
            formData.append('last_name', data.user_last_name);
            formData.append('email', data.user_email);
            formData.append('phone', data.user_phone);
            formData.append('type', data.user_type || '');

            // On ajoute le slug du profil créé et celui de la région
            if (profileSlug) {
                formData.append('profile', profileSlug);
            }
            if (regionslug) {
                formData.append('location', regionslug);
            }

            // Ajout de l'image de l'utilisateur si présente
            if (data.user_picture instanceof File) {
                formData.append('picture', data.user_picture);
            }

            // Envoi de la requête de création d'utilisateur
            await axios.post(API.createUser(), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Création réussie avec succès !');
            reset();
            router.push(paths.dashboard.client.root);
        } catch (err) {

            const data = err.response?.data || err;


            const messages = [];


            if (data.phone) {
                messages.push(...(
                    Array.isArray(data.phone)
                        ? data.phone
                        : [data.phone]
                ));
            }
            if (data.email) {
                messages.push(...(
                    Array.isArray(data.email)
                        ? data.email
                        : [data.email]
                ));
            }

            if (data.details) messages.push(data.details);
            if (data.error) messages.push(data.error);
            if (data.message) messages.push(data.message);

            const errorMessage = messages.join(' ');
            toast.error(errorMessage);
        }

    });


    return (
        <Form methods={methods} onSubmit={step === 1 ? handleNext : onSubmit}>
            <Grid container spacing={4} sx={{ maxWidth: 1000, mx: 'auto' }}>
                {step === 1 && (
                    <>
                        {/* Card du logo */}
                        <Grid item size={{ xs: 12, md: 4 }}>
                            <Card
                                sx={{
                                    p: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    boxShadow: 3,
                                    borderRadius: 2,
                                    backgroundColor: 'background.paper'
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Logo *
                                </Typography>
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
                                                color: 'text.disabled'
                                            }}
                                        >
                                            Allowed *.jpeg, *.jpg, *.png, *.gif
                                            <br /> max size of {fData(3145728)}
                                        </Typography>
                                    }
                                />
                            </Card>
                        </Grid>

                        {/* Informations du Client */}
                        <Grid item size={{ xs: 12, md: 8 }}>
                            <Card
                                sx={{
                                    p: 3,
                                    boxShadow: 3,
                                    borderRadius: 2,
                                    backgroundColor: 'background.paper',
                                    maxWidth: 600,
                                    mx: 'auto'
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 3, textAlign: 'left', fontWeight: 'bold' }}>
                                    Informations de la Structure
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item size={{ xs: 8, md: 6 }}>
                                        <Field.Text name="name" label="Nom  *" fullWidth size="small" />
                                    </Grid>
                                    <Grid item size={{ xs: 8, md: 6 }}>
                                        <Field.Select name="type" label="Type de structure *" fullWidth size="small">
                                            {types.map((profiletype) => (
                                                <MenuItem key={profiletype.slug} value={profiletype.slug}>
                                                    {profiletype.name}
                                                </MenuItem>
                                            ))}
                                        </Field.Select>
                                    </Grid>
                                    <Grid item size={{ xs: 8, md: 12 }}>
                                        <Field.Text
                                            name="description"
                                            label="Description *"
                                            fullWidth
                                            multiline
                                            rows={3}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item size={{ xs: 8, md: 6 }}>
                                        <Field.Text name="email" label="Email *" fullWidth size="small" />
                                    </Grid>
                                    <Grid item size={{ xs: 8, md: 6 }}>
                                        <Field.Phone name="contact" label="Téléphone *" fullWidth size="small" />
                                    </Grid>
                                    <Grid item size={{ xs: 8, md: 6 }}>
                                        <Field.Select name="location" label="Région *" fullWidth size="small">
                                            {regions.map((region) => (
                                                <MenuItem key={region.slug} value={region.slug}>
                                                    {region.name}
                                                </MenuItem>
                                            ))}
                                        </Field.Select>
                                    </Grid>
                                    <Grid item size={{ xs: 8, md: 6 }}>
                                        <Field.Text name="adresse" label="Adresse *" fullWidth size="small" />
                                    </Grid>
                                </Grid>
                                <Box sx={{ textAlign: 'right', mt: 3 }}>
                                    <Button variant="contained" onClick={handleNext} loading={isSubmitting}>
                                        {!currentClient ? "Suivant" : 'Sauvegarder les changements'}

                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    </>
                )}

                {step === 2 && (
                    <>
                        {/* Card de la photo de l'administrateur */}
                        <Grid item size={{ xs: 12, md: 4 }}>
                            <Card
                                sx={{
                                    p: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    boxShadow: 3,
                                    borderRadius: 2,
                                    backgroundColor: 'background.paper'
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Photo de l'administrateur
                                </Typography>
                                <Field.UploadAvatar
                                    name="user_picture"
                                    maxSize={3145728}
                                    helperText={
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                mt: 3,
                                                mx: 'auto',
                                                display: 'block',
                                                textAlign: 'center',
                                                color: 'text.disabled'
                                            }}
                                        >
                                            Allowed *.jpeg, *.jpg, *.png, *.gif
                                            <br /> max size of {fData(3145728)}
                                        </Typography>
                                    }
                                />
                            </Card>
                        </Grid>

                        {/* Informations de l'Administrateur */}
                        <Grid item xs={12}>
                            <Card
                                sx={{
                                    p: 3,
                                    boxShadow: 3,
                                    borderRadius: 2,
                                    backgroundColor: 'background.paper',
                                    maxWidth: 600,
                                    mx: 'auto'
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
                                    Informations de l'Administrateur
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item size={{ xs: 12, md: 6 }}>
                                        <Field.Text name="user_last_name" label="Nom *" fullWidth size="small" />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 6 }}>
                                        <Field.Text name="user_first_name" label="Prénom *" fullWidth size="small" />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 6 }}>
                                        <Field.Text name="user_email" label="Email *" fullWidth size="small" />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 6 }}>
                                        <Field.Phone name="user_phone" label="Téléphone *" fullWidth size="small" />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Field.Select name="user_type" label="Role *" inputlabelprops={{ shrink: true }}>
                                            {roles?.map((role) => (
                                                <MenuItem key={role.slug} value={role.slug}>
                                                    {role?.name}
                                                </MenuItem>
                                            ))}
                                        </Field.Select>
                                    </Grid>
                                </Grid>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
                                    <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
                                        Créer
                                    </LoadingButton>
                                </Box>

                            </Card>
                        </Grid>
                    </>
                )}
            </Grid>
        </Form>
    );
}
