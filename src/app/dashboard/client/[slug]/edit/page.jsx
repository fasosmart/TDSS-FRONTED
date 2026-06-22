import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';
import { ClientEditView } from 'src/sections/administration/client/view/client-edit-view';

export const metadata = { title: `Update Structure| Dashboard - ${CONFIG.appName}` }

export default async function Page({ params }) {
    const { slug } = await params;

    return (
        <PermissionGuard permission="can_view_referentials"><ClientEditView slug={slug} /></PermissionGuard>
    )
}
