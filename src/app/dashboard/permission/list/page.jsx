import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';
import { PermissionListView } from 'src/sections/administration/permissions/view';



// ----------------------------------------------------------------------

export const metadata = { title: `Permission list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return <PermissionGuard permission="can_view_profile"><PermissionListView /></PermissionGuard>;
}
