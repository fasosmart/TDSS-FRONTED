'use client';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useFormContext, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import axios from 'src/utils/axios';

import { Field } from 'src/components/hook-form';
import { usePermissions } from 'src/auth/hooks';
import API from 'src/utils/api';

// ----------------------------------------------------------------------

const formatTodayDigits = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');

  return `${year}${month}${day}`;
};

const buildDeclarationTitle = (sigle) => {
  if (!sigle) return '';
  return `${sigle}${formatTodayDigits()}`;
};

export function DeclarationEditStatusDate({ type }) {
  const { setValue, control } = useFormContext();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [open, setOpen] = useState(false);

  // Portée entité (entreprise) : l'utilisateur ne voit que sa propre entreprise,
  // on l'auto-sélectionne au lieu d'afficher la liste complète.
  const { hasEntityScope } = usePermissions();

  // Charger les entreprises initiales au chargement du composant (API réelle)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function fetchCompanies() {
      try {
        const resp1 = await axios.get(API.listEntreprises(), {
          params: { offset: 0, limit: 1 },
        });
        const total = resp1.data.count;

        const response = await axios.get(API.listEntreprises(), {
          params: { offset: 0, limit: total },
        });
        if (!isMounted) return;

        // Transformer les données pour le format attendu par l'autocomplete
        const initialCompanies = response.data.results.map((company) => ({
          value: company.slug,
          label: company.name,
          slug: company.slug,
          sigle: company.sigle,
        }));
        if (hasEntityScope) {
          const userCompany = initialCompanies[0];
          setValue('company', userCompany.value);
          setSelectedCompany(userCompany);
          const generatedTitle = buildDeclarationTitle(userCompany?.sigle);
          if (generatedTitle) {
            setValue('title', generatedTitle, { shouldValidate: true });
          }
        } else {
          setCompanies(initialCompanies);
        }
      } catch (error) {
        console.error('Erreur lors du chargement initial des entreprises:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
    return () => {
      isMounted = false; // Nettoyage pour éviter les fuites de mémoire
    };
  }, [hasEntityScope, setValue]);

  // Handler pour la sélection d'une entreprise
  const handleCompanyChange = (event, newValue) => {
    setSelectedCompany(newValue);
    // Fermer le menu après sélection
    setOpen(false);

    // Mettre à jour la valeur dans le formulaire
    if (newValue) {
      setValue('company', newValue.value);
      const generatedTitle = buildDeclarationTitle(newValue.sigle);
      if (generatedTitle) {
        setValue('title', generatedTitle, { shouldDirty: true, shouldValidate: true });
      }
    } else {
      setValue('company', '');
    }
  };

  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ p: 3, bgcolor: 'background.neutral' }}
    >
      {companies.length > 1 ? (
        <Controller
          name="company"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              {...field}
              fullWidth
              options={companies}
              loading={loading}
              value={selectedCompany}
              inputValue={inputValue}
              onChange={handleCompanyChange}
              onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
              open={open && companies.length > 0}
              onOpen={() => setOpen(true)}
              onClose={() => setOpen(false)}
              getOptionLabel={(option) => option.label || ''}
              isOptionEqualToValue={(option, value) => option.value === value?.value}
              filterOptions={(options, state) =>
                options.filter((option) =>
                  option.label.toLowerCase().includes(state.inputValue.toLowerCase())
                )
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Entreprise *"
                  placeholder="Rechercher une entreprise..."
                  error={!!error}
                  helperText={error?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <MenuItem {...props} key={option.slug} value={option.value}>
                  {option.label}
                </MenuItem>
              )}
              noOptionsText="Aucune entreprise trouvée"
              loadingText="Chargement..."
            />
          )}
        />
      ) : (
        <Field.Text
          name="company"
          label="Entreprise *"
          value={selectedCompany?.label || ''}
          InputLabelProps={{ shrink: true }}
          disabled
        />
      )}

      <Field.Select
        disabled
        fullWidth
        name="status"
        label="Status"
        InputLabelProps={{ shrink: true }}
      >
        {['rejettée', 'soumise', 'validée', 'brouillon'].map((option) => (
          <MenuItem key={option} value={option} sx={{ textTransform: 'capitalize' }}>
            {option}
          </MenuItem>
        ))}
      </Field.Select>

      <Field.Text
        name="title"
        label="Titre de la declaration *"
        InputLabelProps={{ shrink: true }}
      />
    </Stack>
  );
}
