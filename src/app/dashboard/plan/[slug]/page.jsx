import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';
import { AfricanizationPlanDetails } from 'src/sections/overview/plan-africanisation/view';

export const metadata = { title: `Detail de plan de panafricanisation | -${CONFIG.appName}` };

export default async function Page({ params }) {
  const { slug } = await params;
  return <PermissionGuard permission="can_view_africanization_plan"><AfricanizationPlanDetails slug={slug} /></PermissionGuard>;
}
