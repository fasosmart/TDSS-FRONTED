import Chip from '@mui/material/Chip';
import { useCallback } from 'react';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function EmployeeTableFiltersResult({ filters, onResetPage, totalResults, sx }) {
    const handleRemoveKeyword = useCallback(() => {
        onResetPage();
        filters?.setState({ name: '' });
    }, [filters, onResetPage]);

    const handleRemoveStatus = useCallback(() => {
        onResetPage();
        filters?.setState({ status: 'all' });
    }, [filters, onResetPage]);

    const handleRemoveRole = useCallback(
        (inputValue) => {
            const newValue = filters?.state?.job.filter((item) => 
                (typeof item === 'object' ? item.slug : item) !== (typeof inputValue === 'object' ? inputValue.slug : inputValue)
            );

            onResetPage();
            filters.setState({ job: newValue });
        },
        [filters, onResetPage]
    );

    const handleReset = useCallback(() => {
        onResetPage();
        filters.onResetState();
    }, [filters, onResetPage]);

    return (
        <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
            <FiltersBlock label="Status:" isShow={filters?.state?.status !== 'all'}>
                <Chip
                    {...chipProps}
                    label={filters?.state?.status}
                    onDelete={handleRemoveStatus}
                    sx={{ textTransform: 'capitalize' }}
                />
            </FiltersBlock>

            <FiltersBlock label="Fonction:" isShow={!!filters?.state?.job?.length}>
                {filters?.state?.job?.map((item) => (
                    <Chip 
                        {...chipProps} 
                        key={typeof item === 'object' ? item.slug : item} 
                        label={typeof item === 'object' ? item.name : item} 
                        onDelete={() => handleRemoveRole(item)} 
                    />
                ))}
            </FiltersBlock>

            <FiltersBlock label="Keyword:" isShow={!!filters?.state?.name}>
                <Chip {...chipProps} label={filters?.state?.name} onDelete={handleRemoveKeyword} />
            </FiltersBlock>
        </FiltersResult>
    );
}
