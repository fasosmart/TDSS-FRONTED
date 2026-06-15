'use client';

import { useMemo } from 'react';

import { useAuthContext } from './use-auth-context';
import { getDefaultPermissions } from '../permissions';


// Hook central de lecture des permissions granulaires.
//
// - Si `user.permissions` est peuplé (renvoyé par /api/users/my-assignments/),
//   on lit directement les booléens `can_*`.
// - Sinon (404 / pas d'assignment actif), on retombe sur la table de fallback
//   `ROLE_DEFAULT_PERMISSIONS` dérivée du `type_code` (migration progressive).

export function usePermissions() {
  const { user } = useAuthContext();

  return useMemo(() => {
    const real = user?.permissions;
    const permissions =
      real && Object.keys(real).length > 0 ? real : getDefaultPermissions(user);

    const can = (field) => Boolean(permissions?.[field]);
    const canAny = (fields = []) => fields.some((field) => can(field));
    const canAll = (fields = []) => fields.every((field) => can(field));

    return {
      permissions,
      can,
      canAny,
      canAll,
      isAdmin: Boolean(permissions?.is_admin),
      hasGlobalScope: Boolean(permissions?.has_global_scope),
      hasEntityScope: Boolean(permissions?.has_entity_scope),
    };
  }, [user]);
}