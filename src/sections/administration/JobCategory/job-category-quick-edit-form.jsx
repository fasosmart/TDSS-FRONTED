"use client";
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import { toast } from 'sonner';
import { z as zod } from 'zod';
import { Form, Field } from 'src/components/hook-form';
import API from 'src/utils/api';
import axios from 'src/utils/axios';

import { getPermits } from 'src/utils/options';

// ----------------------------------------------------------------------
// Schéma de validation
export const JobCategoryQuickEditSchema = zod.object({
    name: zod.string().min(1, { message: 'Le nom est requis !' }),
    permit: zod.string().min(1, { message: "Le permit est requis !" }),
});

export function JobCategoryQuickEditForm({ currentJobCategory, open, onClose, onUpdateRow }) {
    const [permits, setPermits] = useState([]);
    // Définir les valeurs par défaut en s'assurant que les clés correspondent aux données du profil
    const defaultValues = useMemo(() => {
        const currentPermit = permits.find(permit => permit.name === currentJobCategory?.permit);
        return {
            name: currentJobCategory?.name || '',
            permit: currentPermit ? currentPermit?.slug : currentJobCategory?.permit || '',
        };
    }, [currentJobCategory, permits]);
    


    const methods = useForm({
        mode: 'all',
        resolver: zodResolver(JobCategoryQuickEditSchema),
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
            const modifiedData = getModifiedFields(currentJobCategory, data);

            if (Object.keys(modifiedData).length === 0) {
                toast.info("Aucune modification détectée.");
                return;
            }

            // Création d'un FormData et ajout des champs modifiés
            const formData = new FormData();
            Object.keys(modifiedData).forEach(key => {
                formData.append(key, modifiedData[key]);
            });

            // Ne pas définir manuellement le Content-Type pour laisser le navigateur gérer les délimitations
            const response = await axios.patch(API.editJobCategory(currentJobCategory.slug), formData);

            toast.success('Mise à jour réussie !');

            // Fusionner les données modifiées avec le client courant pour obtenir la version à jour
            const updatedJobCategory = { ...currentJobCategory, ...modifiedData };
            onUpdateRow(updatedJobCategory);
            reset();
            onClose();
        } catch (error) {
            toast.error('Erreur lors de la mise à jour du profil.');
            console.error('Erreur:', error.response?.data || error.message);
        }
    });
    // Récupérer les permits 
    useEffect(() => {
        getPermits().then(data => setPermits(data));
    }, []);
    // Pour mettre à jour les valeurs du formulaire dès que currentJobCategory change
    useEffect(() => {
        reset({
            name: currentJobCategory?.name || '',
            permit: permits.find(permit => permit.name === currentJobCategory?.permit)?.slug || currentJobCategory?.permit || '',
        });
    }, [currentJobCategory, permits, reset]);
    

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
                        display="grid"
                        gap={3}
                        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
                    >

                        <Field.Text name="name" label="Nom" fullWidth />
                        <Field.Select name="permit" label="Permis" fullWidth>
                            {permits.map((permit) => (
                                <MenuItem key={permit.slug} value={permit.slug}>
                                    {permit.name}
                                </MenuItem>
                            ))}
                        </Field.Select>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
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
