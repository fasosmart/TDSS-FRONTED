import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';
import { PermitDetailView } from 'src/sections/overview/permit-employee/view';

export const metadata = { title: `Details Permit | Dashboard - ${CONFIG.appName}` };

export default async function Page({ params }) {
  const { slug } = await params;
  return <PermissionGuard permission="can_view_declaration_employee"><PermitDetailView slug={slug} /></PermissionGuard>;
}
