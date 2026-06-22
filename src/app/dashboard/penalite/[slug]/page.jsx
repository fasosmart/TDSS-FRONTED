import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';
import { PenaliteDetailsView } from 'src/sections/overview/penalite/view';

export const metadata = { title: `Details Penalite | Dashboard - ${CONFIG.appName}` };

export default async function Page({ params }) {
  const { slug } = await params;

  return <PermissionGuard permission="can_view_penalty"><PenaliteDetailsView slug={slug} /></PermissionGuard>;
}
