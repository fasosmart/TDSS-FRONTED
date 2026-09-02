'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'src/routes/hooks';
import { toast } from 'sonner';
import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import MenuItem from '@mui/material/MenuItem';

import axios from 'src/utils/axios';
import API from 'src/utils/api';
import { getPermits } from 'src/utils/options';

export const JobCategoryQuickEditSchema = zod.object({
    name: zod.string().min(1, { message: 'Le nom est requis !' }),
    permit: zod.string().min(1, { message: "Le permit est requis !" }),
    comment: zod.string().optional(),
});

export function JobCategoryNewEditForm({ currentJobCategory }) {
    const router = useRouter();
    const [permits, setPermit] = useState([]);

    const defaultValues = useMemo(() => {
        const currentPermit = permits.find(permit => permit.name === currentJobCategory?.permit);
        return {
            name: currentJobCategory?.name || '',
            permit: currentPermit ? currentPermit.slug : currentJobCategory?.permit || '',
            comment: currentJobCategory?.comment || '',
        };
    }, [currentJobCategory, permits]);

    const methods = useForm({
        mode: 'all',
        resolver: zodResolver(JobCategoryQuickEditSchema),
        defaultValues,
    });

    const { reset, handleSubmit, formState: { isSubmitting } } = methods;

    useEffect(() => {
        reset(defaultValues);
    }, [currentJobCategory, defaultValues, reset]);

    useEffect(() => {
        getPermits().then(data => setPermit(data));
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

    const onSubmit = handleSubmit(async (data) => {
        try {
            const formData = {
                name: data.name,
                permit: data.permit,
                comment: data.comment || '',
            };

            let response;
            if (currentJobCategory) {
                const modifiedData = getModifiedFields(currentJobCategory, formData);
                if (Object.keys(modifiedData).length === 0) {
                    toast.info("Aucune modification détectée.");
                    return;
                }
                response = await axios.patch(API.editJobCategory(currentJobCategory.slug), modifiedData);
                toast.success('Mise à jour réussie !');
                router.push(paths.dashboard.jobCategory.root);
            } else {
                response = await axios.post(API.createJobCategory(), formData);
                toast.success('Création réussie !');
                router.push(paths.dashboard.jobCategory.root);
            }
        } catch (error) {
            toast.error('Erreur lors de la création ou mise à jour.');
            console.error('Erreur:', error.response?.data || error.message);
        }
    });

    return (
        <Form methods={methods} onSubmit={onSubmit}>
            <Grid container sx={{ maxWidth: 1000, mx: 'auto' }}>
                <Grid item size={{ xs: 12, }}>
                    <Card sx={{ p: 3, boxShadow: 3, borderRadius: 2, backgroundColor: 'background.paper', maxWidth: 600, mx: 'auto' }}>
                        <Typography variant="h6" sx={{ mb: 3, textAlign: 'left', fontWeight: 'bold' }}>
                            Categorie de Fonction
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item size={{ xs: 8, md: 6 }}>
                                <Field.Text name="name" label="Libellé *" fullWidth size="small" />
                            </Grid>
                            <Grid item size={{ xs: 8, md: 6 }}>
                                <Field.Select name="permit" label="Permis *" fullWidth size="small">
                                    {permits.map((permit) => (
                                        <MenuItem key={permit.slug} value={permit.slug}>
                                            {permit.name}
                                        </MenuItem>
                                    ))}
                                </Field.Select>
                            </Grid>
                            <Grid item size={{ xs: 8, md: 12 }}>
                                <Field.Text
                                    name="comment"
                                    label="Commentaire"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                        <Box sx={{ textAlign: 'right', mt: 3 }}>
                            <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
                                {currentJobCategory ? 'Mettre à jour' : 'Créer'}
                            </LoadingButton>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Form>
    );
}
