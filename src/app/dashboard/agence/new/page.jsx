import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { AgenceCreateView } from 'src/sections/administration/agence/view';

// ----------------------------------------------------------------------

export const metadata = { title: ` New Agency | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return <PermissionGuard permission="can_view_referentials"><AgenceCreateView /></PermissionGuard>;
}
