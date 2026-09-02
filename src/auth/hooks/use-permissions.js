'use client';

import { useMemo } from 'react';

import { useAuthContext } from './use-auth-context';


// Hook central de lecture des permissions granulaires.
export function usePermissions() {
  const { user } = useAuthContext();

  return useMemo(() => {
    const permissions = user?.permissions ?? {};

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