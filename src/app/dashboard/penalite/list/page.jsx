import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { PenaliteListView } from 'src/sections/overview/penalite/view';

// ----------------------------------------------------------------------


export const metadata = { title: `Penalités | Dashboard - ${CONFIG.appName}` };


export default function Page() {
  return <PermissionGuard permission="can_view_penalty"><PenaliteListView /></PermissionGuard>;
}
