'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import axios from 'src/utils/axios';
import { useState, useEffect, useCallback } from 'react';
import { DashboardContent } from 'src/layouts/dashboard';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { orderBy } from 'src/utils/helper';
import API from 'src/utils/api';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { EmptyContent } from 'src/components/empty-content';
import { Iconify } from 'src/components/iconify';

// import { JobFiltersResult } from '../job - filters - result';
import { JobList } from '../job-list';
import { JobSearch } from '../job-search';
import { JobSort } from '../job-sort';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------


export const JOB_SORT_OPTIONS = [
  { label: 'Latest', value: 'latest' },
  { label: 'Popular', value: 'popular' },
  { label: 'Oldest', value: 'oldest' },
];
export function JobListView() {
  const openFilters = useBoolean();

  const router = useRouter();
  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tableData, setTableData] = useState([]);
  const [options, setOptions] = useState();
  const search = useSetState({ query: '', results: [] });
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    limit: 10,
  });


  const filters = useSetState({
    name: ''
  }, { persistByPath: true });


  useEffect(() => {
    const fetchFonctions = async () => {
      try {
        const params ={
          limit: pagination.limit,
          offset: (pagination.currentPage - 1) * pagination.limit,
          ...(filters.state.name && { name: filters.state.name }), // Ajoutez d'autres filtres si nécessaire
          ...(filters.state.name?.trim() && { name: filters.state.name.trim() }),

        }
        const response = await axios.get(API.listFonctions(), {params}); // Remplacez par votre endpoint réel
        const fonctions = response.data.results || []; // Assurez-vous que c'est bien un tableau
        setTableData(fonctions);
        setPagination((prev) => ({
                   ...prev,
                   count: response.data.count,
                    next: response.data.next,
                    previous: response.data.previous,
                    limit: response.data.limit || prev.limit,
                  }));
        // Extraire uniquement les noms des fonctions
        const nomsFonctions = fonctions.map(fonction => fonction.name);
        setOptions(nomsFonctions);


      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    fetchFonctions();
  }, [filters.state, pagination.currentPage, pagination.limit]);


  const dataFiltered = applyFilter({ inputData: tableData, filters: filters.state, sortBy });

  const notFound = !dataFiltered.length;

  const handleSortBy = useCallback((newValue) => {
    setSortBy(newValue);
  }, []);

  const handleSearch = useCallback(
    (inputValue) => {
      filters.setState({ name: inputValue });
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
     
    },
    [filters]
  );

  const handlePageChange = useCallback(
    async (event, page) => {
      const offset = (page - 1) * pagination.limit;
  
      try {
        // Build params object
        const params = {
          limit: pagination.limit,
          offset,
          // only include `name` if non-empty
          ...(filters.state.name?.trim() && { name: filters.state.name.trim() }),
        };
  
        // Axios will append ?limit=…&offset=…&name=… for you
        const response = await axios.get(API.listFonctions(), { params });
  
        setPagination((prev) => ({
          ...prev,
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          currentPage: page,
        }));
  
        setTableData(response.data.results);
      } catch (err) {
        console.error("Erreur lors du changement de page", err);
        toast.error('Erreur lors du chargement des données');
      }
  
      router.push(`${paths.dashboard.fonction.list}?page=${page}`);
    },
    [pagination.limit, filters.state.name, router]
  );
  

  const renderFilters = (
    <Stack
      spacing={3}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-end', sm: 'center' }}
      direction={{ xs: 'column', sm: 'row' }}
    >
      <JobSearch search={search} onSearch={handleSearch} />

      <Stack direction="row" spacing={1} flexShrink={0}>
        <JobSort sort={sortBy} onSort={handleSortBy} sortOptions={JOB_SORT_OPTIONS} />
      </Stack>
    </Stack>
  );

  // const renderResults = <JobFiltersResult totalResults={dataFiltered.length} / >;

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>{error}</div>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Listes des fonctions"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Fonction', href: paths.dashboard.fonction.root },
          { name: 'Listes des fonctions' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.fonction.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Nouvelle Fonction
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={2.5} sx={{ mb: { xs: 3, md: 5 } }}>
        {renderFilters}
        {/* {renderResults} */}
      </Stack>

      {notFound && <EmptyContent filled sx={{ py: 10 }} />}

      <JobList jobs={tableData} pagination={pagination} onChangePage={handlePageChange} />
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
