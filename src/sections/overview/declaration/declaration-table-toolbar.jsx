'use client';

import { formHelperTextClasses } from '@mui/material/FormHelperText';

import InputAdornment from '@mui/material/InputAdornment';

import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useCallback, useState , useRef , useEffect } from 'react';

import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { Iconify } from 'src/components/iconify';
import { select } from '@nextui-org/react';

// ----------------------------------------------------------------------

export function DeclarationTableToolbar({ 
  filters, 
  options, 
  dateError, 
  onResetPage,
  selectedFilter,
  setSelectedFilter,
 }) {
  const popover = usePopover();
  const [showOptions, setShowOptions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [filterBoxWidth, setFilterBoxWidth] = useState(null);
  const [titleInput, setTitleInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [passportInput, setPassportInput] = useState('');
  const inputRef = useRef();


  const handleFocus = (event) => {
    setShowOptions(true);
  };  

  const handleCloseOptions = () => {
    setShowOptions(false);  
  };

const handleSelectFilter = (filterType) => {
    onResetPage();
    filters.setState({ title: '', number: '', company: '', passport_number: '' });
    setSelectedFilter(filterType);
    setShowOptions(false);
  };

  const getPlaceholder = () => {
    switch (selectedFilter) {
      case 'title':
        return 'Rechercher par titre de la déclaration';
      case 'number':
        return 'Rechercher par numéro de la déclaration';
      case 'company':
        return 'Rechercher par nom de l\'entreprise';
      case 'passport_number':
        return 'Rechercher par numéro de passeport';
      default:  
        return 'Rechecher par numéro de la déclaration';
    }
  };

const handleFilterChange = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        onResetPage();
        filters.setState({
          title: '',
          company: '',
          passport_number: '',
          number: '',
          [selectedFilter]: inputValue
        });
      }
    },
    [selectedFilter, filters, onResetPage, inputValue]
  );

  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ name: event.target.value });
    },
    [filters, onResetPage]
  );

  const handleTitleKeyUp = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        const { value } = event.target;
        if (filters.state.title !== value) {
          onResetPage();
          filters.setState({ title: event.target.value });
          // Mise à jour combinée du state : on réinitialise company et passport et met à jour title
          filters.setState((prev) => ({ ...prev, title: value, company: '', passport_number: '' }));
        }
      }
    },
    [filters, onResetPage]
  );

  const handleCompanyKeyUp = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        const { value } = event.target;
        if (filters.state.company !== value) {
          onResetPage();
          filters.setState({ company: event.target.value });
          // Mise à jour combinée du state : on réinitialise title et passport et met à jour company
          filters.setState((prev) => ({ ...prev, company: value, title: '', passport_number: '' }));
        }
      }
    },
    [filters, onResetPage]
  );

  const handlePassportKeyUp = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        const value = event.target.value;
        if (filters.state.passport_number !== value) {
          onResetPage();
          filters.setState({ passport_number: event.target.value });
          // Mise à jour combinée du state : on réinitialise title et company et met à jour passport
          filters.setState((prev) => ({ ...prev, passport_number: value, title: '', company: '' }));
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
      filters.setState({ fonction: newValue });
    },
    [filters, onResetPage]
  );

  const handleFilterStartDate = useCallback(
    (newValue) => {
      onResetPage();
      filters.setState({ starts_at: newValue });
    },
    [filters, onResetPage]
  );

  const handleFilterEndDate = useCallback(
    (newValue) => {
      onResetPage();
      filters.setState({ ends_at: newValue });
    },
    [filters, onResetPage]
  );

  useEffect(() => {
      if (inputRef.current) {
        setFilterBoxWidth(inputRef.current.offsetWidth);
      }
    }, [showOptions]);

  return (
    <>
      <Stack
        spacing={2}
        alignItems={{ xs: 'flex-end', md: 'center' }}
        direction={{ xs: 'column', md: 'row' }}
        sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
      >
        {/* <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 180 } }}>
          <InputLabel htmlFor="invoice-filter-service-select-label">Type</InputLabel>

          <Select
            multiple
            value={filters.state.fonction}
            onChange={handleFilterService}
            input={<OutlinedInput label="fonction" />}
            renderValue={(selected) => selected.map((value) => value).join(', ')}
            inputProps={{ id: 'invoice-filter-service-select-label' }}
            sx={{ textTransform: 'capitalize' }}
          >
            {options.fonctions.map((option) => (
              <MenuItem key={option} value={option}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={filters.state.fonction.includes(option)}
                />
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl> */}

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date debut"
            value={filters.state.starts_at}
            onChange={handleFilterStartDate}
            slotProps={{ textField: { fullWidth: true } }}
            sx={{ maxWidth: { md: 180 } }}
          />
        </LocalizationProvider>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date fin"
            value={filters.state.ends_at}
            onChange={handleFilterEndDate}
            slotProps={{
              textField: {
                fullWidth: true,
                error: dateError,
                helperText: dateError ? 'End date must be later than start date' : null,
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

        <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
          <Box sx={{ position: 'relative', flexGrow: 1, width: '100%' }} ref={inputRef}>
            <TextField
              fullWidth 
              value={inputValue}
              onChange = {(e) => setInputValue(e.target.value)}
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
                  label="Numéro"
                  color={selectedFilter === 'number' ? 'primary' : 'default'}
                  onClick={() => handleSelectFilter('number')}
                />
                <Chip
                  label="Titre"
                  color={selectedFilter === 'title' ? 'primary' : 'default'}
                  onClick={() => handleSelectFilter('title')}
                />
               
                <Chip
                  label="Entreprise"
                  color={selectedFilter === 'company' ? 'primary' : 'default'}
                  onClick={() => handleSelectFilter('company')}
                />
                <Chip
                  label="Numéro de passeport"
                  color={selectedFilter === 'passport_number' ? 'primary' : 'default'}
                  onClick={() => handleSelectFilter('passport_number')}
                />
                {selectedFilter !== 'number' && (
                  <Chip
                    label="x"
                    size="small"
                    onClick={() => {
                      setSelectedFilter('number');
                      filters.setState({ title: '', company: '', passport_number: '' });
                      handleCloseOptions();
                    }}
                  />
                )}
              </Paper>
            )}
          </Box>
        </Stack>

        {/* <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
          <Box sx={{ position: 'relative', flexGrow: 1, width: '100%' }}>
            <TextField
              fullWidth
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={handleTitleKeyUp}
              placeholder="Rechercher par titre de la déclaration"
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
          </Box>
        </Stack> */}

        {/* <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}> */}
          {/* <TextField
            fullWidth
            onChange={(e) => setCompanyInput(e.target.value)}
            placeholder="Rechercher par nom de l'entreprise"
            onKeyDown={handleCompanyKeyUp}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }
            }}
          /> */}
          
          {/* <TextField
            fullWidth
            value={passportInput}
            onChange={(e) => setPassportInput(e.target.value)}
            onKeyDown={handlePassportKeyUp}
            placeholder="Rechercher par numéro de passeport"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="mdi:passport" sx={{ color: 'text.disabled' }} />
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
