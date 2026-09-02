import Chip from '@mui/material/Chip';
import { useCallback } from 'react';

import { fDateRangeShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function DeclarationTableFiltersResult({ filters, totalResults, onResetPage, sx }) {
  const handleRemoveNumber = useCallback(() => {
    onResetPage();
    filters.setState({ number: '' });
  }, [filters, onResetPage]);

  const handleRemoveTitle = useCallback(() => {
    onResetPage();
    filters.setState({ title: '' });
  }, [filters, onResetPage]);

  const handleRemoveCompany = useCallback(() => {
    onResetPage();
    filters.setState({ company: '' });
  }, [filters, onResetPage]);

  const handleRemoveService = useCallback(
    (inputValue) => {
      const newValue = filters.state.fonction.filter((item) => item !== inputValue);

      onResetPage();
      filters.setState({ fonction: newValue });
    },
    [filters, onResetPage]
  );

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    filters.setState({ status: 'all' });
  }, [filters, onResetPage]);

  const handleRemoveDate = useCallback(() => {
    onResetPage();
    filters.setState({ starts_at: null, ends_at: null });
  }, [filters, onResetPage]);

  const handleRemovePassport = useCallback(() => {
    onResetPage();
    filters.setState({ passport_number: '' });
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
      <FiltersBlock label="type:" isShow={!!filters.state.fonction.length}>
        {filters.state.fonction.map((item) => (
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
        isShow={Boolean(filters.state.starts_at && filters.state.ends_at)}
      >
        <Chip
          {...chipProps}
          label={fDateRangeShortLabel(filters.state.starts_at, filters.state.ends_at)}
          onDelete={handleRemoveDate}
        />
      </FiltersBlock>

      <FiltersBlock label="N° Déclaration:" isShow={!!filters.state.number}>
        <Chip {...chipProps} label={filters.state.number} onDelete={handleRemoveNumber} />
      </FiltersBlock>

      <FiltersBlock label="Titre:" isShow={!!filters.state.title}>
        <Chip {...chipProps} label={filters.state.title} onDelete={handleRemoveTitle} />
      </FiltersBlock>

      <FiltersBlock label="Entreprise:" isShow={!!filters.state.company}>
        <Chip {...chipProps} label={filters.state.company} onDelete={handleRemoveCompany} />
      </FiltersBlock>

      <FiltersBlock label="Passeport:" isShow={!!filters.state.passport_number}>
        <Chip {...chipProps} label={filters.state.passport_number} onDelete={handleRemovePassport} />
      </FiltersBlock>
    </FiltersResult>
  );
}
