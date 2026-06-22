import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';
import { JobCategoryEditView } from 'src/sections/administration/JobCategory/view';

export const metadata = { title: `Update Job Category| Dashboard - ${CONFIG.appName}` }

export default async function Page({ params }) {
    const { slug } = params;

    return (
        <PermissionGuard permission="can_manage_jobs"><JobCategoryEditView slug={slug} /></PermissionGuard>
    )
}
