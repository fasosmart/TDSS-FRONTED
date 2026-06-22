'use client';

import { m } from 'framer-motion';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { ForbiddenIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

import { usePermissions } from '../hooks/use-permissions';

// ----------------------------------------------------------------------
//
// Garde de page basée sur les permissions granulaires (remplace RoleBasedGuard).
//
//   <PermissionGuard permission="can_view_user"><UserListView /></PermissionGuard>
//   <PermissionGuard any={['can_view_facture']}>...</PermissionGuard>
//
// Par défaut, affiche un écran « accès refusé ». Avec `hasContent={false}`,
// ne rend rien quand l'accès est refusé.
//
// ----------------------------------------------------------------------

export function PermissionGuard({ permission, any, all, children, hasContent = true, sx }) {
  const { can, canAny, canAll } = usePermissions();

  let allowed = true;

  if (permission) allowed = allowed && can(permission);
  if (any) allowed = allowed && canAny(any);
  if (all) allowed = allowed && canAll(all);

  if (!allowed) {
    return hasContent ? (
      <Container component={MotionContainer} sx={{ textAlign: 'center', ...sx }}>
        <m.div variants={varBounce().in}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Permission refusée
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <Typography sx={{ color: 'text.secondary' }}>
            Vous n&apos;avez pas l&apos;autorisation d&apos;accéder à cette page.
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <ForbiddenIllustration sx={{ my: { xs: 5, sm: 10 } }} />
        </m.div>
      </Container>
    ) : null;
  }

  return <>{children}</>;
}