// /src/app/dashboard/user/[id]/page.jsx
import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { EmployeeDetailsView } from 'src/sections/overview/employee/view';

export const metadata = { title: `Details Employé | Dashboard - ${CONFIG.appName}` };

export default async function Page({ params }) {
  const { slug } = await params;
  return <PermissionGuard permission="can_view_employee"><EmployeeDetailsView slug={slug} /></PermissionGuard>;
}
