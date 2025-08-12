import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import { formHelperTextClasses } from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import { Box } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useCallback , useState, useRef } from 'react';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function PaiementTableToolbar({
  filters,
  options,
  dateError,
  onResetPage,
  selectedFilter,
  setSelectedFilter,
}) {
  const [inputValue, setInputValue] = useState(''); // État pour la valeur de recherche
  const [showOptions, setShowOptions] = useState(false); // État pour afficher les options de filtre
  const inputRef = useRef(); // Référence pour la barre de recherche

  // Gestion de l'affichage des options de filtre
  const handleFocus = () => {
    setShowOptions(true);
  };

  // Gestion de la sélection du filtre actif
  const handleSelectFilter = (filterType) => {
    console.log('Filter selected:', filterType); // Debug log
    onResetPage();
    filters.setState({ facture_number: '', number: '' , company:''}); // Réinitialise les autres filtres
    setSelectedFilter(filterType); // Définit le filtre actif
    setShowOptions(false); // Ferme les options
  };

  // Placeholder dynamique pour la barre de recherche
  const getPlaceholder = () => {
    switch (selectedFilter) {
      case 'facture_number':
        return 'Recherche par Numero de Facture';
      case 'number':
        return 'Recherche par Numero de Paiement';
      case 'company':
        return 'Recherche par Nom de la Société';
      default:
        return 'Recherche par Numero de Facture';
    }
  };

  // Gestion de la recherche (appui sur "Entrée")
  const handleFilterChange = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        onResetPage();
        filters.setState({
          facture_number: '',
          number: '',
          company: '',
          [selectedFilter]: inputValue, // Applique la recherche au filtre actif
        });
      }
    },
    [selectedFilter, filters, onResetPage, inputValue]
  );

  return (
    <Stack
        spacing={2}
        alignItems={{ xs: 'flex-end', md: 'center' }}
        direction={{ xs: 'column', md: 'row' }}
        sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
      >
        {/* Autres composants (FormControl, LocalizationProvider, etc.) */}
        <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 180 } }}>
          <InputLabel htmlFor="invoice-filter-service-select-label">Methode de Paiement</InputLabel>
          <Select
            multiple
            value={filters.state.payment_method}
            onChange={(event) => {
              const newValue =
                typeof event.target.value === 'string'
                  ? event.target.value.split(',')
                  : event.target.value;
              onResetPage();
              filters.setState({ payment_method: newValue });
            }}
            input={<OutlinedInput label="Methode Paiement" />}
            // renderValue={(selected) => selected.map((value) => value).join(', ')}
            inputProps={{ id: 'invoice-filter-service-select-label' }}
            sx={{ textTransform: 'capitalize' }}
          >
            {options?.payment_method?.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {/* <Checkbox
                  disableRipple
                  size="small"
                  checked={filters.state.payment_method.includes(option.label)}
                /> */}
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date debut"
            value={filters.state.date_before}
            onChange={(newValue) => {
              onResetPage();
              filters.setState({ date_before: newValue });
            }}
            slotProps={{ textField: { fullWidth: true } }}
            sx={{ maxWidth: { md: 180 } }}
          />
        </LocalizationProvider>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date fin"
            value={filters.state.date_after}
            onChange={(newValue) => {
              onResetPage();
              filters.setState({ date_after: newValue });
            }}
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
              maxWidth: { md: 180 },
              [`& .${formHelperTextClasses.root}`]: {
                bottom: { md: -40 },
                position: { md: 'absolute' },
              },
            }}
          />
        </LocalizationProvider>

        {/* Barre de recherche */}
        <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
          <Box sx={{ position: 'relative', flexGrow: 1 }} ref={inputRef}>
            <TextField
              fullWidth
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={handleFocus}
              onKeyDown={handleFilterChange}
              placeholder={getPlaceholder()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
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
                  label="Numero de Facture"
                  color={selectedFilter === 'facture_number' ? 'primary' : 'default'}
                  onClick={() => handleSelectFilter('facture_number')}
                />
                <Chip
                  label="Numero de Paiement"
                  color={selectedFilter === 'number' ? 'primary' : 'default'}
                  onClick={() => handleSelectFilter('number')}
                />
                 <Chip
                  label="Nom de l'entreprise"
                  color={selectedFilter === 'company' ? 'primary' : 'default'}
                  onClick={() => handleSelectFilter('company')}
                />
              </Paper>
            )}
          </Box>
        </Stack>
      </Stack>
  );
}