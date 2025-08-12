import Chip from '@mui/material/Chip';
import { useCallback } from 'react';

import { fDateRangeShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function PaiementTableFiltersResult({ filters, totalResults, onResetPage, sx , options }) {
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleRemoveService = useCallback(
    (inputValue) => {
      const newValue = filters.state.payment_method.filter((item) => item !== inputValue);

      onResetPage();
      filters.setState({ payment_method: newValue });
    },
    [filters, onResetPage]
  );

  const handleRemoveFactureNumber = useCallback(() => {
    onResetPage();
    filters.setState({ facture_number: '' });
  }, [filters, onResetPage]);

  const handleRemoveNumber = useCallback(() => {
    onResetPage();
    filters.setState({ number: '' });
  }, [filters, onResetPage]);

  const handleRemoveCompany = useCallback(() => {
    onResetPage();
    filters.setState({ company: '' });
  }, [filters, onResetPage]);

  const handleRemoveDate = useCallback(() => {
    onResetPage();
    filters.setState({ date_before: null, date_after: null });
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
      <FiltersBlock label="Méthode:" isShow={!!filters.state.payment_method.length}>
        {filters.state.payment_method.map((item) => (
          <Chip {...chipProps} 
          key={item} 
          label={
            options.payment_method.find((method) => method.id === item)?.label || item
          } 
          onDelete={() => handleRemoveService(item)} />
        ))}
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

      <FiltersBlock label="Keyword:" isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label="N° Facture:" isShow={!!filters.state.facture_number}>
        <Chip {...chipProps} label={filters.state.facture_number} onDelete={handleRemoveFactureNumber} />
      </FiltersBlock>

      <FiltersBlock label="N° Paiement:" isShow={!!filters.state.number}>
        <Chip {...chipProps} label={filters.state.number} onDelete={handleRemoveNumber} />
      </FiltersBlock>

      <FiltersBlock label="Entreprise:" isShow={!!filters.state.company}>
        <Chip {...chipProps} label={filters.state.company} onDelete={handleRemoveCompany} />
      </FiltersBlock>
    </FiltersResult>
  );
}
