import { useState, useRef, useEffect, useCallback } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Autocomplete from '@mui/material/Autocomplete';
import OutlinedInput from '@mui/material/OutlinedInput';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Collapse from '@mui/material/Collapse';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import CheckIcon from '@mui/icons-material/Check';

const DEBOUNCE_DELAY = 1000;

// 2 DatePickers de 180px + le gap de 12px (gap: 1.5) qui les sépare
const DATE_RANGE_FILTER_MIN_WIDTH = 372;

export function CommonPersonFilters({
  filters,
  onFiltersChange,
  jobOptions,
  countryOptions,
  sexeOptions,
  statusOptions,
  permitTypeOptions,
  loading,
  isPermit = false,
  dateError,
  printedDateError,
}) {
  const [selectedFilter, setSelectedFilter] = useState('name');
  const [showOptions, setShowOptions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeAdvancedFilters, setActiveAdvancedFilters] = useState([]);
  const debounceTimers = useRef({});
  const inputRef = useRef(null);
  const filterMenuRef = useRef(null);

  // Définition de tous les filtres disponibles
  const AVAILABLE_FILTERS = [
    { key: 'permit_type', label: 'Type Permis' },
    { key: 'job', label: 'Fonction' },
    { key: 'nationality', label: 'Nationalité' },
    { key: 'sexe', label: 'Sexe' },
    ...(isPermit ? [{ key: 'status', label: 'Statut' }] : []),
    ...(isPermit ? [{ key: 'printed_at', label: "Date d'impression" }] : []),
  ];

  const getFilterOptions = () => {
    const baseOptions = [
      { key: 'name', label: 'Nom' },
      { key: 'passport', label: 'Passeport' },
      { key: 'reference', label: 'Référence' },
      { key: 'declaration_number', label: 'Déclaration' },
      { key: 'company', label: 'Entreprise' },
    ];

    if (isPermit) {
      baseOptions.splice(4, 0, { key: 'card_number', label: 'N° Permis' });
    }

    return baseOptions;
  };

  const FILTER_OPTIONS = getFilterOptions();

  const FILTER_PLACEHOLDERS = {
    passport: 'Rechercher par numéro de passeport...',
    reference: 'Rechercher par référence...',
    declaration_number: 'Rechercher par numéro de déclaration...',
    card_number: 'Rechercher par numéro de permis...',
    name: 'Rechercher par nom...',
    company: "Rechercher par nom de l'entreprise...",
  };

  const getFieldFromFilter = useCallback((filter) => {
    const fieldMap = {
      name: 'name',
      passport: 'passport',
      reference: 'reference',
      declaration_number: 'declaration_number',
      card_number: 'card_number',
      company: 'company',
    };
    return fieldMap[filter] || 'name';
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setInputValue(value);

      const field = getFieldFromFilter(selectedFilter);

      if (debounceTimers.current[field]) {
        clearTimeout(debounceTimers.current[field]);
      }

      debounceTimers.current[field] = setTimeout(() => {
        onFiltersChange({ [field]: value });
      }, DEBOUNCE_DELAY);
    },
    [selectedFilter, onFiltersChange, getFieldFromFilter]
  );

  const handlePaste = useCallback(
    (event) => {
      event.preventDefault();
      const pastedValue = event.clipboardData.getData('Text');
      setInputValue(pastedValue);

      const field = getFieldFromFilter(selectedFilter);
      onFiltersChange({ [field]: pastedValue });

      if (debounceTimers.current[field]) {
        clearTimeout(debounceTimers.current[field]);
        debounceTimers.current[field] = null;
      }
    },
    [selectedFilter, onFiltersChange, getFieldFromFilter]
  );

  const handleSelectFilter = useCallback(
    (filterType) => {
      const resetFields = {
        card_number: '',
        reference: '',
        declaration_number: '',
        passport: '',
        name: '',
        company: '',
      };
      onFiltersChange(resetFields);
      setSelectedFilter(filterType);
      setShowOptions(false);
      setInputValue('');
    },
    [onFiltersChange]
  );

  const handleToggleAdvancedFilter = (filterKey) => {
    if (activeAdvancedFilters.includes(filterKey)) {
      // Retirer le filtre
      setActiveAdvancedFilters(activeAdvancedFilters.filter((f) => f !== filterKey));

      // Réinitialiser la valeur
      const resetMap = {
        permit_type: { permit_type: 'all' },
        job: { job: null },
        nationality: { nationality: 'all' },
        sexe: { sexe: 'all' },
        status: { status: 'all' },
        printed_at: { printed_at_after: null, printed_at_before: null },
      };

      if (resetMap[filterKey]) {
        onFiltersChange(resetMap[filterKey]);
      }
    } else {
      // Ajouter le filtre
      setActiveAdvancedFilters([...activeAdvancedFilters, filterKey]);
    }
  };

  const handleClearAllFilters = () => {
    onFiltersChange({
      permit_type: 'all',
      job: null,
      nationality: 'all',
      sexe: 'all',
      created_on_after: null,
      created_on_before: null,
      printed_at_after: null,
      printed_at_before: null,
      status: 'all',
    });
    setActiveAdvancedFilters([]);
  };

  // Compte le nombre de filtres avec valeur
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.permit_type && filters.permit_type !== 'all') count++;
    if (filters.job) count++;
    if (filters.nationality && filters.nationality !== 'all') count++;
    if (filters.sexe && filters.sexe !== 'all') count++;
    if (filters.created_on_after) count++;
    if (filters.created_on_before) count++;
    if (filters.printed_at_after) count++;
    if (filters.printed_at_before) count++;
    if (filters.status && filters.status !== 'all') count++;
    return count;
  };

  const renderFilterComponent = (filterKey) => {
    switch (filterKey) {
      case 'status':
        return (
          <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 150 } }}>
            <InputLabel htmlFor="invoice-filter-status-select">Statut</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => onFiltersChange({ status: e.target.value })}
              input={<OutlinedInput label="Statut" />}
              inputProps={{ id: 'invoice-filter-status-select' }}
              sx={{ textTransform: 'capitalize' }}
            >
              <MenuItem value="all">Tous</MenuItem>
              {statusOptions.status.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'permit_type':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>Type Permis</InputLabel>
            <Select
              value={filters.permit_type || 'all'}
              onChange={(e) => onFiltersChange({ permit_type: e.target.value })}
              input={<OutlinedInput label="Type Permis" />}
              sx={{ bgcolor: 'background.paper', '&:hover': { boxShadow: 1 } }}
            >
              <MenuItem value="all">
                <em>Tous les types</em>
              </MenuItem>
              {permitTypeOptions?.map((option) => (
                <MenuItem key={option.slug} value={option.value}>
                  {option.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'job':
        return (
          <FormControl fullWidth size="small">
            <Autocomplete
              options={jobOptions || []}
              getOptionLabel={(option) => option.label || ''}
              isOptionEqualToValue={(opt, val) => opt.value === val.value}
              loading={loading}
              onChange={(e, value) => onFiltersChange({ job: value })}
              value={filters.job || null}
              renderOption={(props, option) => (
                <li {...props} key={option.value}>
                  {option.label}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Fonction"
                  placeholder="Sélectionner..."
                  sx={{
                    bgcolor: 'background.paper',
                    '& .MuiOutlinedInput-root:hover': { boxShadow: 1 },
                  }}
                />
              )}
            />
          </FormControl>
        );

      case 'nationality':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>Nationalité</InputLabel>
            <Select
              value={filters.nationality || 'all'}
              onChange={(e) => onFiltersChange({ nationality: e.target.value })}
              input={<OutlinedInput label="Nationalité" />}
              sx={{ bgcolor: 'background.paper', '&:hover': { boxShadow: 1 } }}
            >
              <MenuItem value="all">
                <em>Toutes nationalités</em>
              </MenuItem>
              {countryOptions?.map((option) => (
                <MenuItem key={option.slug} value={option.name}>
                  {option.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'sexe':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>Sexe</InputLabel>
            <Select
              value={filters.sexe || 'all'}
              onChange={(e) => onFiltersChange({ sexe: e.target.value })}
              input={<OutlinedInput label="Sexe" />}
              sx={{ bgcolor: 'background.paper', '&:hover': { boxShadow: 1 } }}
            >
              <MenuItem value="all">
                <em>Tous</em>
              </MenuItem>
              {sexeOptions?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'printed_at':
        return (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Impression début"
                value={filters.printed_at_after || null}
                onChange={(newValue) => onFiltersChange({ printed_at_after: newValue })}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    size: 'small',
                    error: printedDateError,
                    helperText: printedDateError ? 'Date invalide' : null,
                    sx: {
                      width: 180,
                      bgcolor: 'background.paper',
                      '& .MuiOutlinedInput-root:hover': { boxShadow: 1 },
                    },
                  },
                }}
              />
            </LocalizationProvider>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Impression fin"
                value={filters.printed_at_before || null}
                onChange={(newValue) => onFiltersChange({ printed_at_before: newValue })}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    size: 'small',
                    error: printedDateError,
                    helperText: printedDateError ? 'Date invalide' : null,
                    sx: {
                      width: 180,
                      bgcolor: 'background.paper',
                      '& .MuiOutlinedInput-root:hover': { boxShadow: 1 },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowOptions(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    };

    if (showOptions || showFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOptions, showFilterMenu]);

  useEffect(
    () => () => {
      Object.values(debounceTimers.current).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    },
    []
  );

  useEffect(() => {
    const currentField = getFieldFromFilter(selectedFilter);
    const currentValue = filters[currentField] || '';
    setInputValue(currentValue);
  }, [selectedFilter, filters, getFieldFromFilter]);

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Ligne des filtres avancés */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          flexWrap:
            activeAdvancedFilters.length > 3 || activeAdvancedFilters.includes('printed_at')
              ? 'wrap'
              : 'nowrap',
        }}
      >
        {/* Bouton Filtres avec menu */}
        <Box sx={{ position: 'relative' }} ref={filterMenuRef}>
          <Badge badgeContent={activeFiltersCount} color="primary">
            <Chip
              icon={<TuneIcon />}
              label="Filtres"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              color={showFilterMenu || activeAdvancedFilters.length > 0 ? 'primary' : 'default'}
              variant={showFilterMenu || activeAdvancedFilters.length > 0 ? 'filled' : 'outlined'}
              sx={{
                height: 40,
                px: 2,
                fontWeight: 500,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                },
              }}
            />
          </Badge>

          {/* Menu de sélection des filtres */}
          {showFilterMenu && (
            <Paper
              elevation={8}
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                mt: 1,
                zIndex: 1300,
                minWidth: 250,
                borderRadius: 2,
                overflow: 'hidden',
                animation: 'slideDown 0.2s ease-out',
                '@keyframes slideDown': {
                  from: { opacity: 0, transform: 'translateY(-8px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <Box sx={{ p: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{ px: 1, py: 0.5, color: 'text.secondary', fontWeight: 600 }}
                >
                  SÉLECTIONNER LES FILTRES
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {AVAILABLE_FILTERS.map((filter) => {
                  const isActive = activeAdvancedFilters.includes(filter.key);
                  return (
                    <Chip
                      key={filter.key}
                      label={filter.label}
                      icon={isActive ? <CheckIcon /> : undefined}
                      color={isActive ? 'primary' : 'default'}
                      onClick={() => handleToggleAdvancedFilter(filter.key)}
                      sx={{
                        justifyContent: 'flex-start',
                        px: 1.5,
                        height: 36,
                        '&:hover': {
                          bgcolor: isActive ? 'primary.main' : 'action.hover',
                        },
                      }}
                    />
                  );
                })}
              </Box>
              {activeFiltersCount > 0 && (
                <>
                  <Divider />
                  <Box sx={{ p: 1 }}>
                    <Chip
                      label="Réinitialiser tout"
                      size="small"
                      variant="outlined"
                      color="error"
                      deleteIcon={<CloseIcon />}
                      onDelete={handleClearAllFilters}
                      onClick={handleClearAllFilters}
                      sx={{ width: '100%', justifyContent: 'center' }}
                    />
                  </Box>
                </>
              )}
            </Paper>
          )}
        </Box>

        {/* Filtres actifs sur la même ligne */}
        {activeAdvancedFilters.map((filterKey) => {
          const isDateRange = filterKey === 'printed_at';
          return (
            <Box
              key={filterKey}
              sx={{
                minWidth: isDateRange ? DATE_RANGE_FILTER_MIN_WIDTH : 180,
                maxWidth: isDateRange ? 'none' : activeAdvancedFilters.length > 3 ? 200 : 250,
                flexGrow: isDateRange ? 0 : activeAdvancedFilters.length <= 3 ? 1 : 0,
              }}
            >
              {renderFilterComponent(filterKey)}
            </Box>
          );
        })}
      </Box>

      {/* Ligne des dates et recherche */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Dates */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date début"
            value={filters.created_on_after || null}
            onChange={(newValue) => onFiltersChange({ created_on_after: newValue })}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                size: 'small',
                sx: {
                  width: 180,
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
            value={filters.created_on_before || null}
            onChange={(newValue) => onFiltersChange({ created_on_before: newValue })}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                size: 'small',
                error: dateError,
                helperText: dateError ? 'Date invalide' : null,
                sx: {
                  width: 180,
                  bgcolor: 'background.paper',
                  '& .MuiOutlinedInput-root:hover': { boxShadow: 1 },
                },
              },
            }}
          />
        </LocalizationProvider>

        {/* Barre de recherche */}
        <Box sx={{ position: 'relative', flexGrow: 1, minWidth: 280 }} ref={inputRef}>
          <TextField
            fullWidth
            size="small"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setShowOptions(true)}
            onPaste={handlePaste}
            placeholder={FILTER_PLACEHOLDERS[selectedFilter]}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Chip
                      label={FILTER_OPTIONS.find((o) => o.key === selectedFilter)?.label}
                      size="small"
                      onClick={() => setShowOptions(true)}
                      sx={{
                        height: 24,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 1 },
                '&.Mui-focused': { boxShadow: 2 },
              },
            }}
          />

          {/* Menu type de recherche */}
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
        </Box>
      </Box>
    </Box>
  );
}
