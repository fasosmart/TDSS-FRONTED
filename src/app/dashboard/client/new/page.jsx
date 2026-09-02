import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';


import { ClientCreateView } from 'src/sections/administration/client/view';

// ----------------------------------------------------------------------

export const metadata = { title: `New Structure | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return <PermissionGuard permission="can_view_referentials"><ClientCreateView /></PermissionGuard>;
}
