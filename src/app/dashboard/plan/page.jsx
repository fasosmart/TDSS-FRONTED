import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { ListPlanAfricanisationView } from 'src/sections/overview/plan-africanisation/view';

export const metadata = { title: `Liste des Plans d'Africanisation | - ${CONFIG.appName}` };

export default function Page() {
  return <PermissionGuard permission="can_view_africanization_plan"><ListPlanAfricanisationView /></PermissionGuard>;
}
