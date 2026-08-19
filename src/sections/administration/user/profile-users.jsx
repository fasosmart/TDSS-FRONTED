import React, { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingButton from '@mui/lab/LoadingButton';
import { Form } from 'src/components/hook-form';
import { useForm } from 'react-hook-form';
import { Iconify } from 'src/components/iconify';
import API from 'src/utils/api';
import axios from 'src/utils/axios';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';

export function ProfileUsers({ info, companySlug }) {
  const router = useRouter();
  const [showAddUser, setShowAddUser] = useState(false);
  const [users, setUsers] = useState([]);
  const [initialUsers, setInitialUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [entrepriseSlug, setEntrepriseSlug] = useState(null);

  const methods = useForm({
    mode: 'all',
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // 1. Récupérer le slug "entreprise" au montage du composant
  useEffect(() => {
    const fetchEntrepriseSlug = async () => {
      try {
        const response = await axios.get(API.listProfilesTypes());
        const entrepriseType = response.data.results.find((t) => t.code === 'entreprise');
        if (entrepriseType) {
          setEntrepriseSlug(entrepriseType.slug);
        } else {
          console.error('Type "entreprise" non trouvé');
          toast.error('Erreur: Type "entreprise" non trouvé');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du type entreprise:', error);
        toast.error('Erreur lors de la récupération du type entreprise');
      }
    };
    fetchEntrepriseSlug();
  }, []);

  // 2. Charger la liste initiale des utilisateurs avec le slug entreprise
  useEffect(() => {
    const loadInitialUsers = async () => {
      if (!entrepriseSlug) return;

      try {
        // console.log('Chargement des utilisateurs avec slug:', entrepriseSlug);
        const params = {
          type_profile: entrepriseSlug,
          limit: 50,
        };
        // console.log('Paramètres envoyés à listUsers:', params);
        const response = await axios.get(API.listUsers(params));
        // console.log('Réponse API utilisateurs:', response.data);
        const usersData = response.data.results || response.data || [];
        // console.log('Utilisateurs filtrés:', usersData.length, usersData);
        setInitialUsers(usersData);
        setUsers(usersData);
      } catch (error) {
        console.error('Erreur lors du chargement initial des utilisateurs:', error);
      }
    };
    loadInitialUsers();
  }, [entrepriseSlug]);

  // 3. Fonction de recherche avec debounce
  const debouncedSearch = useCallback(
    debounce(async (searchTerm) => {
      if (!searchTerm || searchTerm.length < 2 || !entrepriseSlug) {
        setUsers(initialUsers);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setSearchLoading(true);
      try {
        // console.log('Recherche avec terme:', searchTerm, 'et slug:', entrepriseSlug);
        const params = {
          type_profile: entrepriseSlug,
          name: searchTerm,
          limit: 50,
        };
        // console.log('Paramètres de recherche envoyés:', params);
        const response = await axios.get(API.listUsers(params));
        // console.log('Résultats de recherche:', response.data);
        const searchResults = response.data.results || response.data || [];
        // console.log('Utilisateurs trouvés:', searchResults.length);
        setUsers(searchResults);
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        setUsers(initialUsers);
      } finally {
        setSearchLoading(false);
      }
    }, 1000),
    [initialUsers, entrepriseSlug]
  );

  // Gestionnaire de changement de valeur de recherche
  const handleSearchChange = (event, newValue) => {
    setSearchValue(newValue);
  };

  // Gestionnaire pour la soumission de recherche (Entrée)
  const handleSearchSubmit = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      debouncedSearch(searchValue);
    }
  };

  // Fonction pour gérer le clic sur une ligne de la table
  const handleViewDetail = useCallback(
    (slug) => {
      router.push(paths.dashboard.user.details(slug));
    },
    [router]
  );

  // Fonction pour ajouter un utilisateur à l'entreprise
  const onSubmit = handleSubmit(async () => {
    try {
      // console.log('=== DÉBUT SOUMISSION ===');
      // console.log('selectedUser:', selectedUser);
      // console.log('Type de selectedUser:', typeof selectedUser);

      if (!selectedUser) {
        toast.error('Veuillez sélectionner un utilisateur.');
        return;
      }

      if (!selectedUser.slug) {
        console.error('selectedUser.slug est undefined:', selectedUser);
        toast.error('Erreur: Slug utilisateur manquant');
        return;
      }

      // console.log('Utilisateur sélectionné:', selectedUser);
      // console.log('Slug utilisateur:', selectedUser.slug);
      // console.log('Slug entreprise:', companySlug);

      const formData = {
        user: selectedUser.slug,
        profile: companySlug,
      };

      // console.log('Données envoyées:', formData);
      const response = await axios.post(API.addProfileToUser(), formData);

      if (response.status >= 200 && response.status < 300) {
        toast.success('Utilisateur ajouté avec succès !');
        setShowAddUser(false);
        setSelectedUser(null);
        setSearchValue('');
        setUsers(initialUsers);
        setIsSearching(false);
        // Recharger la page pour mettre à jour la liste
        window.location.reload();
      } else {
        throw new Error(response.data?.[0] || response.data?.message || "Échec de l'ajout.");
      }
    } catch (error) {
      console.error('Erreur complète:', error.response?.data || error.message);
      toast.error(
        error.response?.data?.[0] ||
          error.response?.data?.message ||
          error.message ||
          "Erreur lors de l'ajout."
      );
    }
  });

  return (
    <Card sx={{ overflow: 'visible' }}>
      <CardHeader
        title="Liste des utilisateurs"
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => setShowAddUser(!showAddUser)}
            disabled={!entrepriseSlug}
          >
            Ajouter un utilisateur
          </Button>
        }
        sx={{ textAlign: 'center', pb: 0 }}
      />

      {/* Formulaire d'ajout d'utilisateur */}
      {showAddUser && (
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Form methods={methods} fullWidth onSubmit={onSubmit}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Autocomplete
                sx={{ flex: 1 }}
                size="small"
                options={users}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  const fullName = `${option.name}`.trim();
                  return fullName || 'Nom non défini';
                }}
                getOptionKey={(option) =>
                  // console.log('Option pour key:', option);
                  // console.log('Slug pour key:', option?.slug);
                  option?.slug || ''
                }
                value={selectedUser}
                onChange={(event, newValue) => {
                  // console.log('Utilisateur sélectionné dans onChange:', newValue);
                  setSelectedUser(newValue);
                }}
                inputValue={searchValue}
                onInputChange={handleSearchChange}
                onKeyPress={handleSearchSubmit}
                loading={searchLoading}
                loadingText={isSearching ? 'Recherche en cours...' : 'Chargement...'}
                noOptionsText={
                  isSearching ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Rechercher un utilisateur"
                    placeholder="Tapez et appuyez sur Entrée pour rechercher"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  // console.log('Option dans renderOption:', option);
                  // console.log('Slug de l\'option:', option?.slug);

                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar
                          alt={`${option.name || ''}`}
                          src={option.picture}
                          sx={{ width: 32, height: 32 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {`${option.name || ''}`.trim() || 'Nom non défini'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.email || 'Email non défini'} •{' '}
                            {option.type || 'Rôle non défini'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  );
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => debouncedSearch(searchValue)}
                disabled={!searchValue || searchValue.length < 2}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                <Iconify icon="eva:search-fill" width={16} height={16} />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <LoadingButton
                type="submit"
                variant="contained"
                size="small"
                loading={isSubmitting}
                disabled={!selectedUser}
              >
                <Iconify
                  icon="eva:checkmark-circle-2-outline"
                  width={20}
                  height={20}
                  sx={{ mr: 1 }}
                />
                Ajouter
              </LoadingButton>
            </Box>
          </Form>
        </Box>
      )}

      {/* Description centrée en haut */}
      <Box sx={{ p: 3, textAlign: 'center', fontSize: '1.1rem', lineHeight: 1.6 }}>
        {info?.description}
      </Box>

      <Divider />

      {/* Table des utilisateurs */}
      <Box sx={{ p: 2 }}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 960 }}>
            <TableHead sx={{ bgcolor: 'background.neutral' }}>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Prénom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Téléphone</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {info?.map((user) => (
                <TableRow
                  key={user.slug}
                  onClick={() => handleViewDetail(user.slug)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <TableCell>{user.first_name}</TableCell>
                  <TableCell>{user.last_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Card>
  );
}
