'use client';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import { Iconify } from 'src/components/iconify';
import { CircularProgress } from '@mui/material';

export function EmployeeDeclarations({ declarations, loading, employee }) {
  // Affichage du loader pendant le chargement
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Chargement des déclarations...
        </Typography>
      </Box>
    );
  }

  // S'assurer que declarations est un tableau
  const declarationArray = Array.isArray(declarations) ? declarations : [];

  return (
    <>
      <Typography variant="h4" sx={{ my: 2 }}>
        Déclarations de {employee?.first} {employee?.last}
      </Typography>

      {declarationArray.length === 0 ? (
        <NoDeclarations employee={employee} />
      ) : declarationArray.length === 1 ? (
        <SingleDeclaration declaration={declarationArray[0]} />
      ) : (
        <MultipleDeclarations declarations={declarationArray} />
      )}
    </>
  );
}

// --- Composant pour aucune déclaration
function NoDeclarations({ employee }) {
  return (
    <Card sx={{ p: 4, textAlign: 'center' }}>
      <Iconify icon="solar:document-add-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>
        Aucune déclaration trouvée
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {employee?.first} {employee?.last} n'est rattaché(e) à aucune déclaration pour le moment.
      </Typography>
    </Card>
  );
}

// --- Version pour une seule déclaration
function SingleDeclaration({ declaration }) {
  const router = useRouter();

  if (!declaration) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { title, company, reference, status, slug, created_on } = declaration;

  // Mapping des statuts : Backend -> Frontend
  const statusMapping = {
    validated: { label: 'Validée', bg: 'success.main' },
    rejected: { label: 'Rejetée', bg: 'error.main' },
    billed: { label: 'Facturée', bg: 'info.main' },
    unsubmitted: { label: 'Non soumise', bg: 'warning.main' },
    submitted: { label: 'Soumise', bg: 'default.main' },
  };

  const statusDisplay = statusMapping[status] || { label: status, bg: 'grey.500' };

  const handleCardClick = () => {
    router.push(paths.dashboard.declaration.details(slug));
  };

  // Formatage de la date
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <Grid xs={12} md={12}>
      <Card onClick={handleCardClick} sx={{ overflow: 'visible', cursor: 'pointer' }}>
        <Box sx={{ p: 3 }}>
          {/* En-tête du card avec titre et statut */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" noWrap>
              {title}
            </Typography>
            <Box
              sx={{
                bgcolor: statusDisplay.bg,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 'bold' }}>
                {statusDisplay.label}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {/* Contenu détaillé de la déclaration */}
          <Box display="flex" alignItems="center" justifyContent="space-around" flexWrap="wrap">
            {/* Titre */}
            <Box display="flex" alignItems="center" mx={2}>
              <Iconify
                icon="solar:document-add-bold"
                width={28}
                sx={{ mr: 1, color: 'primary.main' }}
              />
              <Box>
                <Typography sx={{ fontWeight: 600 }}>Titre de la déclaration</Typography>
                <Link variant="body2" color="text.secondary">
                  {title}
                </Link>
              </Box>
            </Box>

            {/* Référence */}
            <Box display="flex" alignItems="center" mx={2}>
              <Iconify icon="mdi:barcode-scan" width={28} sx={{ mr: 1, color: 'primary.main' }} />
              <Box>
                <Typography sx={{ fontWeight: 600 }}>Référence</Typography>
                <Link variant="body2" color="text.secondary">
                  {reference}
                </Link>
              </Box>
            </Box>

            {/* Entreprise */}
            {/* <Box display="flex" alignItems="center" mx={2}>
              <Iconify
                icon="mdi:office-building"
                width={28}
                sx={{ mr: 1, color: 'primary.main' }}
              />
              <Box>
                <Typography sx={{ fontWeight: 600 }}>Entreprise</Typography>
                <Typography variant="body2" color="text.secondary">
                  {company}
                </Typography>
              </Box>
            </Box> */}

            {/* Date de création */}
            <Box display="flex" alignItems="center" mx={2}>
              <Iconify
                icon="solar:calendar-bold"
                width={28}
                sx={{ mr: 1, color: 'primary.main' }}
              />
              <Box>
                <Typography sx={{ fontWeight: 600 }}>Date de création</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(created_on)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Card>
    </Grid>
  );
}

// --- Version pour plusieurs déclarations
function MultipleDeclarations({ declarations }) {
  return (
    <>
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        {declarations.length} déclaration{declarations.length > 1 ? 's' : ''} trouvée
        {declarations.length > 1 ? 's' : ''}
      </Typography>
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
      >
        {declarations.map((declaration) => (
          <MultipleDeclarationItem key={declaration.slug} declaration={declaration} />
        ))}
      </Box>
    </>
  );
}

function MultipleDeclarationItem({ declaration }) {
  const router = useRouter();
  const { title, company, reference, status, slug, created_on } = declaration;

  const statusMapping = {
    validated: { label: 'Validée', bg: 'success.main' },
    rejected: { label: 'Rejetée', bg: 'error.main' },
    billed: { label: 'Facturée', bg: 'info.main' },
    unsubmitted: { label: 'Non soumise', bg: 'warning.main' },
    submitted: { label: 'Soumise', bg: 'default.main' },
  };

  const statusDisplay = statusMapping[status] || { label: status, bg: 'grey.500' };

  const handleCardClick = () => {
    router.push(paths.dashboard.declaration.details(slug));
  };

  // Formatage de la date
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        position: 'relative',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 3,
        },
        maxWidth: { xs: 350, sm: 400 },
      }}
    >
      {/* Statut en haut à droite */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: statusDisplay.bg,
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 'bold' }}>
          {statusDisplay.label}
        </Typography>
      </Box>

      <Typography variant="h6" sx={{ mb: 2, pr: 6 }} noWrap>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ mb: 1 }}>
        <strong>Référence :</strong> {reference}
      </Typography>
      {/* <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        <strong>Entreprise :</strong> {company}
      </Typography> */}
      <Typography variant="body2" color="text.secondary">
        <strong>Créée le :</strong> {formatDate(created_on)}
      </Typography>
    </Card>
  );
}
