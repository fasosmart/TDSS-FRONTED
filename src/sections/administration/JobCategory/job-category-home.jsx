
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';

import Grid from '@mui/material/Grid2';
import CardHeader from '@mui/material/CardHeader';


import { Iconify } from 'src/components/iconify';
// ----------------------------------------------------------------------

export function JobCategoryHome({ info }) {

  const renderAbout = (
    <Card sx={{ overflow: 'visible' }}>
      <CardHeader
        title="Détails"
        sx={{ textAlign: 'center', pb: 0 }}
      />

      {/* Description centrée en haut */}
      <Box sx={{ p: 3, textAlign: 'center', fontSize: '1.1rem', lineHeight: 1.6 }}>
        {info.description}
      </Box>

      <Divider />

      {/* Infos en grille dynamique */}
      <Box sx={{ p: 3 }}>

        {/* Nom */}
        <Box display="flex" alignItems="center" justifyContent="space-around" flexWrap="wrap">

          <Box display="flex" alignItems="center" mx={2}>
            <Iconify icon="ic:baseline-person" width={28} sx={{ mr: 1, color: 'primary.main' }} />
            <Box>
              <Box sx={{ fontWeight: 600 }}>Nom</Box>
              <Link variant="body2" color="text.secondary">
                {info.name}
              </Link>
            </Box>
          </Box>


          {/* Permit */}

          <Box display="flex" alignItems="center" mx={2}>
            <Iconify icon="mdi:certificate" width={28} sx={{ mr: 1, color: 'primary.main' }} />
            <Box>
              <Box sx={{ fontWeight: 600 }}>Permis</Box>
              <Box variant="body2" color="text.secondary">
                {info.permit}
              </Box>
            </Box>
          </Box>


          {/* Comment */}

          <Box display="flex" alignItems="center" mx={2}>
            <Iconify icon="mdi:comment-text" width={28} sx={{ mr: 1, color: 'primary.main' }} />
            <Box>
              <Box sx={{ fontWeight: 600 }}>Commentaire</Box>
              <Box variant="body2" color="text.secondary">
                {info.comment}
              </Box>
            </Box>
          </Box>

        </Box>
      </Box>
    </Card>
  );


  return (

    <Grid size={{ xs: 12, md: 4 }}>
      <Stack spacing={3}>
        {renderAbout}


      </Stack>
    </Grid>

  );
}
