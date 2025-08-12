'use client';

import { formHelperTextClasses } from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { useCallback , useState , useRef } from 'react';


import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { Iconify } from 'src/components/iconify';
import { set } from 'nprogress';

// ----------------------------------------------------------------------

export function FactureTableToolbar({
   filters, 
   options, 
   dateError, 
   onResetPage,
   setSelectedFilter,
   selectedFilter
   }) {

  const popover = usePopover();
  const [inputValue, setInputValue] = useState(''); // État pour la valeur de recherche
  const [showOptions, setShowOptions] = useState(false); // État pour afficher les options de filtre
  const [numberInput, setNumberInput] = useState('');
  const [declarationInput, setDeclarationInput] = useState('');

  const inputRef = useRef(); // Référence pour la barre de recherche


  const handleNumberKeyUp = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        const { value } = event.target;
        if (filters.state.number !== value) {
          onResetPage();
          filters.setState({ number: event.target.value });
        }
      }
    },
    [filters, onResetPage]
  );

  const handleNumberDecKeyUp = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        const { value } = event.target;
        if (filters.state.declaration_number !== value) {
          onResetPage();
          filters.setState({ declaration_number: event.target.value });
        }
      }
    },
    [filters, onResetPage]
  );

  const handleCompanyKeyUp = useCallback(
    (event) => {
      if(event.key === 'Enter') {
        const value = event.target.value;
        if (filters.state.company !== value) {
          onResetPage();
          filters.setState({ company: event.target.value });
        }
      }
    },
    [filters, onResetPage]
  );

  const handleFilterService = useCallback(
    (event) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

      onResetPage();
      filters.setState({ service: newValue });
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

const handleFocus = (event) => {
  setShowOptions(true);
};

const handleCloseOptions = () => {
  setShowOptions(false);
};

const handleSelectFilter = (filterType) => {
  onResetPage();
  filters.setState({ number: '', declaration_number: '', company: '' }); // Réinitialise les autres filtres
  setSelectedFilter(filterType); // Définit le filtre actif
  setShowOptions(false); // Ferme les options
};

// Placeholder dynamique pour la barre de recherche
const getPlaceholder = () => {
  switch (selectedFilter) {
    case 'declaration_number':
      return 'Recherche par Numero de Declaration';
    case 'number':
      return 'Recherche par Numero de Facture';
    case 'company':
      return 'Rechercher par nom de l\'entreprise';
    default:
      return 'Recherche par Numero de Facture';
  }
};

const handleFilterChange = useCallback(
  (event) => {
    if (event.key === 'Enter') {
      onResetPage();
      filters.setState({
        number: '',
        declaration_number: '',
        company: '',
        [selectedFilter]: inputValue, // Applique la recherche au filtre actif
      });
    }
  },
  [selectedFilter, filters, onResetPage, inputValue]
);



  return (
    <>
      <Stack
        spacing={2}
        alignItems={{ xs: 'flex-end', md: 'center' }}
        direction={{ xs: 'column', md: 'row' }}
        sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
      >
        {/* <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 180 } }}>
          <InputLabel htmlFor="invoice-filter-service-select-label">Type Déclarations</InputLabel>

          <Select
            multiple
            value={filters.state.service} // Ajout de la prop `value`
            onChange={handleFilterService}
            input={<OutlinedInput label="service" />}
            renderValue={(selected) => selected.join(', ')}
            inputProps={{ id: 'invoice-filter-service-select-label' }}
            sx={{ textTransform: 'capitalize' }}
          >
            {options?.services?.map((option) => (
              <MenuItem key={option} value={option}>
                <Checkbox checked={filters.state.service.includes(option)} disableRipple />
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl> */}

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date debut"
            value={filters.state.date_after}
            onChange={handleFilterStartDate}
            slotProps={{ textField: { fullWidth: true } }}
            sx={{ maxWidth: { md: 180 } }}
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
              maxWidth: { md: 180 },
              [`& .${formHelperTextClasses.root}`]: {
                bottom: { md: -40 },
                position: { md: 'absolute' },
              },
            }}
          />
        </LocalizationProvider>

        <Stack direction='row' alignItems='center' spacing={2} flexGrow={1} sx={{ width: 1 }}>
          <Box sx={{ position: 'relative', flexGrow: 1, width: '100%' }} ref = {inputRef}>
            <TextField
              fullWidth
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleFilterChange}
              value={inputValue}
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
              onFocus={handleFocus}
              // onBlur={handleCloseOptions}
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
                  color={selectedFilter === 'number' ? 'primary' : 'default'}
                  onClick={() => handleSelectFilter('number')}
                />
                <Chip
                  label="Numero de Declaration"
                  color={selectedFilter === 'declaration_number' ? 'primary' : 'default'}
                  onClick={() => handleSelectFilter('declaration_number')}
                />
                <Chip
                  label="Nom de l'Entreprise"
                  color={selectedFilter === 'company' ? 'primary' : 'default'}
                  onClick={() => handleSelectFilter('company')}
                />
              </Paper>
            )}

          </Box>

        </Stack>

        {/* <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}> */}
          {/* <TextField
            fullWidth
            onChange={(e) => setNumberInput(e.target.value)}
            onKeyDown={handleNumberKeyUp}
            value={numberInput}
            placeholder="rechercher par numero de facture.."
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          /> */}
          {/* <TextField
            fullWidth
            onChange={(e) => setDeclarationInput(e.target.value)}
            onKeyDown={handleNumberDecKeyUp}
            value={declarationInput}
            placeholder="rechercher par numero de declaration.."
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
          <TextField
            fullWidth
            onChange={(e) => setCompanyInput(e.target.value)}
            onKeyDown={handleCompanyKeyUp}
            value={companyInput}
            placeholder="rechercher par nom de l'entreprise.."
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="mingcute:building-2-line" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }
            }}
          /> */}

          {/* <IconButton onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton> */}
        {/* </Stack> */}
      </Stack>
      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuList>
            <MenuItem
              onClick={() => {
                popover.onClose();
              }}
            >
              <Iconify icon="solar:printer-minimalistic-bold" />
              Imprimer
            </MenuItem>

            <MenuItem
              onClick={() => {
                popover.onClose();
              }}
            >
              <Iconify icon="solar:import-bold" />
              Importer
            </MenuItem>

            <MenuItem
              onClick={() => {
                popover.onClose();
              }}
            >
              <Iconify icon="solar:export-bold" />
              Exporter
            </MenuItem>
          </MenuList>
        </MenuList>
      </CustomPopover>
    </>
  );
}
