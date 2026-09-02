'use client';

import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { formHelperTextClasses } from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useCallback, useEffect, useState } from 'react';

import { Iconify } from 'src/components/iconify';

import { PENALITE_TYPE_OPTIONS } from './penalite-filter-options';

// ----------------------------------------------------------------------

export function PenaliteTableToolbar({
  filters,
  dateError,
  onResetPage,
  companies = [],
  loadingCompanies = false,
}) {
  const [companyInputValue, setCompanyInputValue] = useState(filters.state.company || '');

  useEffect(() => {
    setCompanyInputValue(filters.state.company || '');
  }, [filters.state.company]);

  const handleFilterCompany = useCallback(
    (event, newValue) => {
      onResetPage();
      filters.setState({ company: newValue?.label || '' });
      setCompanyInputValue(newValue?.label || '');
    },
    [filters, onResetPage]
  );

  const handleCompanyInputChange = useCallback(
    (event, newInputValue, reason) => {
      setCompanyInputValue(newInputValue);

      if (reason === 'clear') {
        onResetPage();
        filters.setState({ company: '' });
      }
    },
    [filters, onResetPage]
  );

  const handleFilterType = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ type: event.target.value });
    },
    [filters, onResetPage]
  );

  const handleFilterStartDate = useCallback(
    (newValue) => {
      onResetPage();
      filters.setState({ date_after: newValue });
    },
    [filters, onResetPage]
  );

  const handleFilterEndDate = useCallback(
    (newValue) => {
      onResetPage();
      filters.setState({ date_before: newValue });
    },
    [filters, onResetPage]
  );

  const selectedCompany =
    companies.find((option) => option.label === filters.state.company) || null;

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'stretch', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
    >
      <Autocomplete
        fullWidth
        options={companies}
        loading={loadingCompanies}
        value={selectedCompany}
        inputValue={companyInputValue}
        onChange={handleFilterCompany}
        onInputChange={handleCompanyInputChange}
        onClose={() => setCompanyInputValue(selectedCompany?.label || '')}
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
            label="Entreprise"
            placeholder="Rechercher une entreprise..."
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="mingcute:building-2-line" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loadingCompanies ? <CircularProgress color="inherit" size={20} /> : null}
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

      <TextField
        fullWidth
        select
        label="Type"
        value={filters.state.type}
        onChange={handleFilterType}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:tag-linear" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
      >
        {PENALITE_TYPE_OPTIONS.map((option) => (
          <MenuItem key={option.value || 'all-types'} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Date début"
          value={filters.state.date_after}
          onChange={handleFilterStartDate}
          slotProps={{ textField: { fullWidth: true } }}
          sx={{ minWidth: { md: 180 } }}
        />
      </LocalizationProvider>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Date fin"
          value={filters.state.date_before}
          onChange={handleFilterEndDate}
          slotProps={{
            textField: {
              fullWidth: true,
              error: dateError,
              helperText: dateError
                ? 'La date de fin doit être postérieure à la date de début.'
                : null,
            },
          }}
          sx={{
            minWidth: { md: 180 },
            [`& .${formHelperTextClasses.root}`]: {
              bottom: { md: -40 },
              position: { md: 'absolute' },
            },
          }}
        />
      </LocalizationProvider>
    </Stack>
  );
}
