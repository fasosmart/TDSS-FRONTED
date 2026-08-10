'use client';
import { useEffect, useState, useCallback } from 'react';
import API from 'src/utils/api';
import axios from 'src/utils/axios';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { useTabs } from 'src/hooks/use-tabs';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ProfileCover } from '../../user/profile-cover';
import { ProfileHome } from '../../user/profile-home';
import { ProfileUsers } from '../../user/profile-users';
import { ClientDocuments } from '../client-documents';
import { DetailNotFoundView } from 'src/sections/error';

// Définir les onglets pour chaque type
const TABS_ADMIN = [
  { value: 'profile', label: 'A propos', icon: <Iconify icon="solar:user-id-bold" width={24} /> },
  {
    value: 'users',
    label: 'Utilisateurs',
    icon: <Iconify icon="solar:users-group-rounded-bold" width={24} />,
  },
  {
    value: 'documents',
    label: 'Documents',
    icon: <Iconify icon="solar:document-add-bold" width={24} />,
  },
];

const TABS_BANQUE = [
  { value: 'profile', label: 'A propos', icon: <Iconify icon="solar:user-id-bold" width={24} /> },
  { value: 'agences', label: 'Agences', icon: <Iconify icon="mdi:office-building" width={24} /> },
  {
    value: 'utilisateurs',
    label: 'Utilisateurs',
    icon: <Iconify icon="solar:users-group-rounded-bold" width={24} />,
  },
  {
    value: 'banques',
    label: 'Paiements',
    icon: <Iconify icon="solar:card-transfer-bold" width={24} />,
  },
  {
    value: 'documents',
    label: 'Documents',
    icon: <Iconify icon="solar:document-add-bold" width={24} />,
  },
];

const TABS_ENTREPRISE = [
  { value: 'profile', label: 'A propos', icon: <Iconify icon="solar:user-id-bold" width={24} /> },
  { value: 'employee', label: 'Employés', icon: <Iconify icon="solar:bag-bold" width={24} /> },
  {
    value: 'declaration',
    label: 'Déclarations',
    icon: <Iconify icon="solar:document-add-bold" width={24} />,
  },
  {
    value: 'paiement',
    label: 'Paiements',
    icon: <Iconify icon="solar:card-transfer-bold" width={24} />,
  },
  { value: 'facture', label: 'Factures', icon: <Iconify icon="solar:bill-list-bold" width={24} /> },
  {
    value: 'penalite',
    label: 'Pénalités',
    icon: <Iconify icon="solar:shield-warning-bold" width={24} />,
  },
  {
    value: 'utilisateurs',
    label: 'Utilisateurs',
    icon: <Iconify icon="solar:users-group-rounded-bold" width={24} />,
  },
  {
    value: 'documents',
    label: 'Documents',
    icon: <Iconify icon="solar:document-add-bold" width={24} />,
  },
];

export function ClientDetailsView({ slug }) {
  const [profil, setProfil] = useState();
  const [user, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const router = useRouter();

  const handleEdit = useCallback(() => {
    router.push(paths.dashboard.client.edit(slug));
  }, [router, slug]);

  const tabs = useTabs('profile');

  useEffect(() => {
    // Récupération des données du profil
    const fetchProfil = async () => {
      try {
        const response = await axios.get(API.UpdateProfile(slug));
        setProfil(response.data);
      } catch (err) {
        if (err?.status === 404) {
          setNotFound(true);
        } else {
          setError(err.message || 'Erreur lors du chargement des données.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfil();
  }, [slug]);
  // recuperation des utilisateurs du profil
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(API.detailsProfile(slug));
        setUsers(response.data.users);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [slug]);
  // Sélectionner le tableau d'onglets en fonction du type
  let displayedTabs = [];
  if (profil?.type?.name === 'Banque') {
    displayedTabs = TABS_BANQUE;
  } else if (profil?.type?.name === 'Admin' || profil?.type?.name === 'Ministère') {
    displayedTabs = TABS_ADMIN;
  } else if (profil?.type?.name === 'Entreprise') {
    displayedTabs = TABS_ENTREPRISE;
  }

  if (loading) return <div>Chargement...</div>;
  if (notFound)
    return (
      <DashboardContent>
        <DetailNotFoundView title="Structure introuvable" href={paths.dashboard.client.root} />
      </DashboardContent>
    );
  if (error) return <div>{error}</div>;

  return (
    <DashboardContent>
      <Box sx={{ mb: { xs: 3, md: 5 } }}>
        <CustomBreadcrumbs
          heading="Détails de la structure"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Structure', href: paths.dashboard.client.root },
            { name: profil?.name },
          ]}
        />
        {/* Bouton d'édition sous les breadcrumbs */}
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
          <Tooltip title="Modifier">
            <IconButton onClick={handleEdit}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Card sx={{ mb: 3, height: 290, position: 'relative' }}>
        <ProfileCover
          role={profil?.type?.name}
          name={profil?.name}
          avatarUrl={profil?.picture}
          coverUrl={profil?.picture}
        />
        <Box
          display="flex"
          justifyContent={{ xs: 'center', md: 'flex-end' }}
          sx={{
            width: 1,
            bottom: 0,
            zIndex: 8,
            px: { md: 3 },
            position: 'absolute',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs value={tabs.value} onChange={tabs.onChange}>
            {displayedTabs.map((tab) => (
              <Tab key={tab.value} value={tab.value} icon={tab.icon} label={tab.label} />
            ))}
          </Tabs>
        </Box>
      </Card>

      {tabs.value === 'profile' && <ProfileHome info={profil} />}
      {(tabs.value === 'utilisateurs' || tabs.value === 'users') && (
        <ProfileUsers info={user} companySlug={slug} />
      )}
      {tabs.value === 'documents' && <ClientDocuments profileSlug={slug} profileName={profil?.name} />}
    </DashboardContent>
  );
}
