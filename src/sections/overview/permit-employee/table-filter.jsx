import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { useCallback, useState, useRef, useEffect } from 'react';
import Select from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const DEBOUNCE_DELAY = 2000;

export function TableToolbar({ filters, options, onResetPage, onOpenColumnSelector, dateError }) {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('name');
  const [inputValue, setInputValue] = useState('');
  const debounceTimers = useRef({});
  const inputRef = useRef(null);

  const TYPE_OPTIONS = [
    { key: 'all', label: 'Tous' },
    { key: 'new', label: 'Nouveau' },
    { key: 'renewal', label: 'Renouvellement' },
  ];

  const STATUS_OPTIONS = [
    { key: 'all', label: 'Tous' },
    { key: 'submitted', label: 'Soumis' },
    { key: 'validated', label: 'Validé' },
    { key: 'rejected', label: 'Rejeté' },
    { key: 'unsubmitted', label: 'Non soumis' },
    { key: 'processing', label: 'En traitement' },
    { key: 'pending', label: 'En attente' },
    { key: 'printed', label: 'Imprimée' },
    { key: 'delivered', label: 'Livrée' },
    { key: 'expired', label: 'Expiré' },
  ];

  const FILTER_OPTIONS = [
    { key: 'name', label: 'Nom Complet' },
    { key: 'passport_number', label: 'Numéro de passeport' },
    { key: 'reference', label: 'Référence' },
    { key: 'declaration', label: 'Numéro de déclaration' },
    { key: 'company', label: 'Entreprise' },
    { key: 'number', label: 'Numéro de permis' },
  ];

  const FILTER_PLACEHOLDERS = {
    passport_number: 'Recherche par Numéro de passeport',
    reference: 'Recherche par Référence',
    name: 'Recherche par Nom ou Prénom',
    declaration: 'Recherche par Numéro de déclaration',
    company: "Rechercher par nom de l'entreprise",
    number: 'Recherche par Numéro de permis',
  };

  const getFieldFromFilter = useCallback((filter) => filter || 'name', []);

  const handleInputChange = useCallback(
    (event) => {
      const value = event.target.value;
      setInputValue(value);

      const field = getFieldFromFilter(selectedFilter);

      if (debounceTimers.current[field]) {
        clearTimeout(debounceTimers.current[field]);
      }

      debounceTimers.current[field] = setTimeout(() => {
        filters?.setState({ [field]: value });
      }, DEBOUNCE_DELAY);
    },
    [selectedFilter, getFieldFromFilter]
  );

  const handlePaste = useCallback(
    (event) => {
      // Prevent native paste, otherwise we set the value and the browser pastes again.
      event.preventDefault();

      const pastedData = event.clipboardData.getData('text');
      const field = getFieldFromFilter(selectedFilter);
      const input = event.currentTarget;

      const currentValue = input?.value || '';
      const start = input?.selectionStart ?? currentValue.length;
      const end = input?.selectionEnd ?? currentValue.length;

      const newValue = `${currentValue.slice(0, start)}${pastedData}${currentValue.slice(end)}`;

      setInputValue(newValue);

      filters?.setState({ [field]: newValue });

      if (debounceTimers.current[field]) {
        clearTimeout(debounceTimers.current[field]);
        debounceTimers.current[field] = null;
      }
    },
    [selectedFilter, getFieldFromFilter]
  );

  const handleSelectFilter = useCallback(
    (filterType) => {
      const reset = {
        name: '',
        passport_number: '',
        reference: '',
        declaration: '',
        type: 'all',
        company: '',
        number: '',
      };

      filters?.setState(reset);
      setSelectedFilter(filterType);
      setShowOptions(false);
      setInputValue('');
    },
    [filters?.setState]
  );

  const handleFilterPermitType = useCallback(
    (event) => {
      // Type Permis → une seule valeur
      filters?.setState({ type: event.target.value });
    },
    [filters?.setState]
  );

  const handleFilterStartDate = useCallback(
    (newValue) => {
      filters?.setState({ created_on_after: newValue });
    },
    [filters?.setState]
  );

  const handleFilterEndDate = useCallback(
    (newValue) => {
      filters?.setState({ created_on_before: newValue });
    },
    [filters?.setState]
  );

  const handleFilterPermitStatus = useCallback(
    (event) => {
      filters?.setState({ status: event.target.value });
    },
    [filters?.setState]
  );

  useEffect(() => {
    const handler = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handler);
    }

    return () => document.removeEventListener('mousedown', handler);
  }, [showOptions]);

  useEffect(
    () => () => {
      Object.values(debounceTimers.current).forEach((t) => t && clearTimeout(t));
    },
    []
  );

  useEffect(() => {
    const field = getFieldFromFilter(selectedFilter);
    setInputValue(filters?.state?.[field] || '');
  }, [selectedFilter, filters, getFieldFromFilter]);

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
    >
      {/* Select Not Printed or not */}

      <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 150 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Checkbox
            checked={filters?.state?.not_printed || false}
            onChange={(event) => filters?.setState({ not_printed: !!event.target.checked })}
          />
          <Box> Non imprimés</Box>
        </Box>
      </FormControl>
      {/* Select Type Permis */}
      <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 150 } }}>
        <InputLabel>Type Permis</InputLabel>
        <Select
          value={filters?.state?.type || ''}
          onChange={handleFilterPermitType}
          input={<OutlinedInput label="Type Permis" />}
        >
          {TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.key} value={option.key}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Select Statut Permis */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Date debut"
          value={filters.state.created_on_after}
          onChange={handleFilterStartDate}
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              size: 'medium',
              sx: {
                width: 300,
                bgcolor: 'background.paper',
                '& .MuiOutlinedInput-root:hover': { boxShadow: 1 },
              },
            },
          }}
        />
      </LocalizationProvider>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Date fin"
          value={filters.state.created_on_before}
          onChange={handleFilterEndDate}
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              size: 'medium',
              error: dateError,
              helperText: dateError ? 'Date invalide' : null,
              sx: {
                width: 300,
                bgcolor: 'background.paper',
                '& .MuiOutlinedInput-root:hover': { boxShadow: 1 },
              },
            },
          }}
        />
      </LocalizationProvider>

      {/* Input + options */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        flexGrow={1}
        ref={inputRef}
        sx={{ width: 1, position: 'relative' }}
      >
        <TextField
          fullWidth
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowOptions(true)}
          onPaste={handlePaste}
          placeholder={FILTER_PLACEHOLDERS[selectedFilter]}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        {showOptions && (
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              width: '100%',
              mt: 1,
              zIndex: 1300,
              p: 1,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            {FILTER_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                color={selectedFilter === option.key ? 'primary' : 'default'}
                onClick={() => handleSelectFilter(option.key)}
              />
            ))}
            {selectedFilter !== 'name' && (
              <Chip label="✕" size="small" onClick={() => handleSelectFilter('name')} />
            )}
          </Paper>
        )}

        {/* Bouton Colonnes */}
        <Tooltip title="Afficher / Masquer les colonnes">
          <IconButton color="primary" onClick={onOpenColumnSelector}>
            <Iconify icon="solar:settings-bold" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
