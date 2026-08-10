'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { m } from 'framer-motion';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { PageNotFoundIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

/**
 * Vue « ressource introuvable » destinée à être rendue à l'intérieur du
 * DashboardContent (garde la sidebar), contrairement à NotFoundView qui
 * s'affiche en pleine page.
 */
export function DetailNotFoundView({ href = paths.dashboard.root, title = 'Ressource introuvable' }) {
  return (
    <Box
      component={MotionContainer}
      sx={{
        py: { xs: 5, md: 10 },
        display: 'flex',
        textAlign: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <m.div variants={varBounce().in}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          {title}
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <Typography sx={{ color: 'text.secondary' }}>
          Désolé, nous n’avons pas trouvé l’élément demandé. Il a peut-être été supprimé ou l’adresse
          est incorrecte.
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <PageNotFoundIllustration sx={{ my: { xs: 5, sm: 10 } }} />
      </m.div>

      <Button component={RouterLink} href={href} size="large" variant="contained">
        Retour
      </Button>
    </Box>
  );
}
