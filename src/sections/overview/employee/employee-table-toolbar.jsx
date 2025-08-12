'use client';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { useCallback, useRef, useState, useEffect } from 'react';

import { Iconify } from 'src/components/iconify';
import axios from 'src/utils/axios';
import API from 'src/utils/api';

// ----------------------------------------------------------------------

export function EmployeeTableToolbar({
  filters,
  onResetPage,
  onFilterChange,
  selectedFilter,
  setSelectedFilter,
  options,
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [jobSuggestions, setJobSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterBoxWidth, setFilterBoxWidth] = useState(null);
  const inputRef = useRef();

  const handleFocus = (event) => {
    setShowOptions(true);
  };

  // Ferme le menu des options
  const handleCloseOptions = () => {
    setShowOptions(false);
  };

  const handleSelectFilter = (filterType) => {
    onResetPage();
    filters.setState({ name: '', passport_number: '', reference: '' });
    setSelectedFilter(filterType);
    setShowOptions(false);
  };

  // Le placeholder du TextField change selon le filtre sélectionné
  const getPlaceholder = () => {
    switch (selectedFilter) {
      case 'passport_number':
        return 'Recherche par Numéro de passeport';
      case 'reference':
        return 'Recherche par Reference';
      default:
        return 'Recherche par Nom';
    }
  };

  // Charger les suggestions de fonctions
  const fetchJobSuggestions = useCallback(async (searchTerm = '') => {
    try {
      setLoading(true);
      const response = await axios.get(API.listFonctions(), {
        params: { search: searchTerm },
      });
      setJobSuggestions(response.data.results || []);
    } catch (error) {
      console.error('Erreur lors du chargement des fonctions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobSuggestions();
  }, [fetchJobSuggestions]);

  const handleFilterChange = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        onResetPage();
        filters.setState({
          name: '',
          passport_number: '',
          reference: '',
          [selectedFilter]: inputValue,
        });
      }
    },
    [selectedFilter, filters, onResetPage, inputValue]
  );

  // Gérer la sélection d'une fonction
  const handleJobSelect = (event, newValue) => {
    // console.log('Fonction sélectionnée:', newValue);
    onResetPage();
    filters.setState({
      ...filters.state,
      job: newValue ? [newValue] : [],
    });
    // console.log('Nouvel état des filtres:', { ...filters.state, job: newValue ? [newValue] : [] });
  };

  // Gérer la recherche lors de la saisie
  const handleJobInputChange = (event, newInputValue) => {
    // console.log('Recherche de fonction:', newInputValue);
    fetchJobSuggestions(newInputValue);
  };

  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      filters?.setState({ name: event.target.value });
    },
    [filters, onResetPage]
  );

  const handleFilterRole = useCallback(
    (event) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

      onResetPage();
      filters?.setState({ job: newValue });
    },
    [filters, onResetPage]
  );

  useEffect(() => {
    if (inputRef.current) {
      setFilterBoxWidth(inputRef.current.offsetWidth);
    }
  }, [showOptions]);

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
    >
      <Autocomplete
        options={jobSuggestions}
        getOptionLabel={(option) => option.name || ''}
        loading={loading}
        onChange={handleJobSelect}
        fullWidth
        onInputChange={handleJobInputChange}
        value={filters.state.job?.[0] || null}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Filtrer par fonction"
            variant="outlined"
            fullWidth
            placeholder="Tapez pour rechercher une fonction..."
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="mdi:briefcase" />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        noOptionsText="Aucune fonction trouvée"
        loadingText="Chargement..."
      />

      <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
        <Box sx={{ position: 'relative', flexGrow: 1, width: '100%' }} ref={inputRef}>
          <TextField
            fullWidth
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleFilterChange}
            placeholder={getPlaceholder()}
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
                left: 0,
                mt: 1,
                zIndex: 1300,
                width: '100%',
                backgroundColor: 'background.paper',
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 1,
                p: 1,
              }}
            >
              <Chip
                label="Nom"
                color={selectedFilter === 'name' ? 'primary' : 'default'}
                onClick={() => handleSelectFilter('name')}
              />
              <Chip
                label="Passport Number"
                color={selectedFilter === 'passport_number' ? 'primary' : 'default'}
                onClick={() => handleSelectFilter('passport_number')}
              />
              <Chip
                label="Reference"
                color={selectedFilter === 'reference' ? 'primary' : 'default'}
                onClick={() => handleSelectFilter('reference')}
              />
              {selectedFilter !== 'name' && (
                <Chip
                  label="X"
                  size="small"
                  onClick={() => {
                    setSelectedFilter('name');
                    filters.setState({ name: '', passport_number: '', reference: '' });
                    handleCloseOptions();
                  }}
                />
              )}
            </Paper>
          )}
        </Box>
      </Stack>
    </Stack>
  );
}
