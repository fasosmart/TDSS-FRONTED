'use client';

import { usePermissions } from './hooks/use-permissions';

// ----------------------------------------------------------------------
//
// Rendu conditionnel inline d'après les permissions granulaires.
//
//   <Can permission="can_edit_declaration"><EditButton /></Can>
//   <Can any={['can_validate_declaration', 'can_reject_declaration']}>...</Can>
//   <Can all={['can_view_facture', 'can_mark_facture_paid']}>...</Can>
//
// `fallback` (optionnel) est rendu quand la permission est refusée.
//
// ----------------------------------------------------------------------

export function Can({ permission, any, all, children, fallback = null }) {
  const { can, canAny, canAll } = usePermissions();

  let allowed = true;

  if (permission) allowed = allowed && can(permission);
  if (any) allowed = allowed && canAny(any);
  if (all) allowed = allowed && canAll(all);

  return allowed ? <>{children}</> : fallback;
}