import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { DeclarationListView } from 'src/sections/overview/declaration/view';

// ----------------------------------------------------------------------


export const metadata = { title: `Listes des Declarations | - ${CONFIG.appName}` };


export default function Page() {
  return <PermissionGuard permission="can_view_declaration"><DeclarationListView /></PermissionGuard>;
}
