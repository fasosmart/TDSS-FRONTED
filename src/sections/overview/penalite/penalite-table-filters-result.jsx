import Chip from '@mui/material/Chip';
import { useCallback } from 'react';

import { fDateRangeShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

import { getPenaltyStatusLabel, getPenaltyTypeLabel } from './penalite-filter-options';

// ----------------------------------------------------------------------

export function PenaliteTableFiltersResult({ filters, totalResults, onResetPage, sx }) {
  const handleRemoveCompany = useCallback(() => {
    onResetPage();
    filters.setState({ company: '' });
  }, [filters, onResetPage]);

  const handleRemoveType = useCallback(() => {
    onResetPage();
    filters.setState({ type: '' });
  }, [filters, onResetPage]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    filters.setState({ status: 'all' });
  }, [filters, onResetPage]);

  const handleRemoveDate = useCallback(() => {
    onResetPage();
    filters.setState({ date_after: null, date_before: null });
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
      <FiltersBlock label="Entreprise:" isShow={!!filters.state.company}>
        <Chip {...chipProps} label={filters.state.company} onDelete={handleRemoveCompany} />
      </FiltersBlock>

      <FiltersBlock label="Type:" isShow={!!filters.state.type}>
        <Chip
          {...chipProps}
          label={getPenaltyTypeLabel(filters.state.type)}
          onDelete={handleRemoveType}
        />
      </FiltersBlock>

      <FiltersBlock label="Statut:" isShow={filters.state.status !== 'all'}>
        <Chip
          {...chipProps}
          label={getPenaltyStatusLabel(filters.state.status)}
          onDelete={handleRemoveStatus}
        />
      </FiltersBlock>

      <FiltersBlock
        label="Période:"
        isShow={Boolean(filters.state.date_after && filters.state.date_before)}
      >
        <Chip
          {...chipProps}
          label={fDateRangeShortLabel(filters.state.date_after, filters.state.date_before)}
          onDelete={handleRemoveDate}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
