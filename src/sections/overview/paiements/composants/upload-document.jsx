'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  Button,
  MenuItem,
} from '@mui/material';

import { Form, Field, schemaHelper } from 'src/components/hook-form';
import API from 'src/utils/api';
import axios from 'src/utils/axios';
import { toast } from 'src/components/snackbar';
import Grid from '@mui/material/Grid2';

const SchemaDoc = z.object({
  document: z.any(),
});

export function UploadDocument({ slug, open, onclose, onUpdate }) {
  const defaultValues = useMemo(() => ({
    document: null,
  }));

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(SchemaDoc),
    defaultValues,
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
    setValue,
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const formData = new FormData();

      if (data.document instanceof File) {
        formData.append('document', data?.document);
      }
      const response = await axios.patch(API.updatepayment(slug), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data || response?.status === 200) {
        reset();
        toast.success('Document mis a jour avec succès');
        onUpdate?.(response?.data?.document);
        onclose?.();
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi au backend :", error);
      toast.error('Une erreur est survenue.');
    }
  });

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onclose}>
      <DialogTitle sx={{ color: 'text.disabled' }}>Uploader un nouveau document</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent dividers>
          <Grid item size={{ xs: 6, md: 6 }}>
            <Card
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: 3,
                borderRadius: 2,
                backgroundColor: 'background.paper',
              }}
            >
              <Field.Upload
                name="document"
                onDelete={() => setValue('document', null, { shouldValidate: true })}
              />
            </Card>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ pr: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => onclose()}>
            Retour
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Mettre a jour
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
