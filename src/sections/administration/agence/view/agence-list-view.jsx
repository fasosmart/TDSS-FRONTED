'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import axios from 'src/utils/axios';
import { useState, useEffect, useCallback } from 'react';
import { DashboardContent } from 'src/layouts/dashboard';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { orderBy } from 'src/utils/helper';
import API from 'src/utils/api';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { EmptyContent } from 'src/components/empty-content';
import { Iconify } from 'src/components/iconify';

// import { JobFiltersResult } from '../job - filters - result';
import { AgenceList } from '../agence-list';
import { AgenceSearch } from '../agence-search';
import { AgenceSort } from '../agence-sort';

// ----------------------------------------------------------------------


export const SORT_OPTIONS = [
  { label: 'Latest', value: 'latest' },
  { label: 'Popular', value: 'popular' },
  { label: 'Oldest', value: 'oldest' },
];
export function AgenceListView() {
  const openFilters = useBoolean();

  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tableData, setTableData] = useState([]);
  const [options, setOptions] = useState();
  const search = useSetState({ query: '', results: [] });

  useEffect(() => {
    const fetchFonctions = async () => {
      try {
        const response = await axios.get(API.listAgences()); // Remplacez par votre endpoint réel
        const agences = response.data.results || []; // Assurez-vous que c'est bien un tableau
        setTableData(agences);

        // Extraire uniquement les noms des fonctions
        const nomsAgences = agences.map(agence => agence.name);
        setOptions(nomsAgences);


      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    fetchFonctions();
  }, []);


  const filters = useSetState({
    name: ''
  }, { persistByPath: true });

  const dataFiltered = applyFilter({ inputData: tableData, filters: filters.state, sortBy });

  const notFound = !dataFiltered?.length;

  const handleSortBy = useCallback((newValue) => {
    setSortBy(newValue);
  }, []);

  const handleSearch = useCallback(
    (inputValue) => {
      search.setState({ query: inputValue });

      if (inputValue) {
        const results = tableData.filter((agence) =>
          agence.name.toLowerCase().includes(inputValue.toLowerCase())
        );

        search.setState({ results });
      }
    },
    [tableData, search]
  );

  const renderFilters = (
    <Stack
      spacing={3}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-end', sm: 'center' }}
      direction={{ xs: 'column', sm: 'row' }}
    >
      <AgenceSearch search={search} onSearch={handleSearch} />

      <Stack direction="row" spacing={1} flexShrink={0}>
        <AgenceSort sort={sortBy} onSort={handleSortBy} sortOptions={SORT_OPTIONS} />
      </Stack>
    </Stack>
  );

  // const renderResults = <JobFiltersResult totalResults={dataFiltered.length} / >;

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>{error}</div>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Listes des agences"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Agences', href: paths.dashboard.agence.root },
          { name: 'Listes des agences' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.agence.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Nouvelle Agence
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={2.5} sx={{ mb: { xs: 3, md: 5 } }}>
        {renderFilters}
        {/* {renderResults} */}
      </Stack>

      {notFound && <EmptyContent filled sx={{ py: 10 }} />}

      <AgenceList agences={dataFiltered} />
    </DashboardContent>
  );
}

const applyFilter = ({ inputData, sortBy }) => {

  // Sort by
  if (sortBy === 'latest') {
    inputData = orderBy(inputData, ['created_at'], ['desc']);
  } else if (sortBy === 'oldest') {
    inputData = orderBy(inputData, ['created_at'], ['asc']);
  }
  else if (sortBy === 'popular') {
    inputData = orderBy(inputData, ['number_person'], ['desc']);
  }
  return inputData;
};
