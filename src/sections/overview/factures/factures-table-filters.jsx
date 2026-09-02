import Chip from '@mui/material/Chip';
import { useCallback } from 'react';

import { fDateRangeShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function FactureTableFilters({ filters, totalResults, onResetPage, sx }) {
  const handleRemoveNumber = useCallback(() => {
    onResetPage();
    filters.setState({ number: '' });
  }, [filters, onResetPage]);

  const handleRemoveNumberDec = useCallback(() => {
    onResetPage();
    filters.setState({ declaration_number: '' });
  }, [filters, onResetPage]);

  const handleRemoveCompany = useCallback(() => {
    onResetPage();
    filters.setState({ company: '' });
  }, [filters, onResetPage]);

  const handleRemoveService = useCallback(
    (inputValue) => {
      const newValue = filters.state.service.filter((item) => item !== inputValue);

      onResetPage();
      filters.setState({ service: newValue });
    },
    [filters, onResetPage]
  );

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    filters.setState({ status: 'all' });
  }, [filters, onResetPage]);

  const handleRemoveDate = useCallback(() => {
    onResetPage();
    filters.setState({ date_before: null, date_after: null });
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
      <FiltersBlock label="Service:" isShow={!!filters.state.service.length}>
        {filters.state.service.map((item) => (
          <Chip {...chipProps} key={item} label={item} onDelete={() => handleRemoveService(item)} />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Status:" isShow={filters.state.status !== 'all'}>
        <Chip
          {...chipProps}
          label={filters.state.status}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock
        label="Date:"
        isShow={Boolean(filters.state.date_before && filters.state.date_after)}
      >
        <Chip
          {...chipProps}
          label={fDateRangeShortLabel(filters.state.date_before, filters.state.date_after)}
          onDelete={handleRemoveDate}
        />
      </FiltersBlock>

      <FiltersBlock label="Numero Facture:" isShow={!!filters.state.number}>
        <Chip {...chipProps} label={filters.state.number} onDelete={handleRemoveNumber} />
      </FiltersBlock>
      <FiltersBlock label="Numero Declaration:" isShow={!!filters.state.declaration_number}>
        <Chip {...chipProps} label={filters.state.declaration_number} onDelete={handleRemoveNumberDec} />
      </FiltersBlock>

      <FiltersBlock label="Entreprise:" isShow={!!filters.state.company}>
        <Chip {...chipProps} label={filters.state.company} onDelete={handleRemoveCompany} />
      </FiltersBlock>
    </FiltersResult>
  );
}
