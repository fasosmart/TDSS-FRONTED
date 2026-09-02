import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { DeclarationNewView } from 'src/sections/overview/declaration/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Renouvellement Déclaration | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return <PermissionGuard permission="can_create_declaration"><DeclarationNewView /></PermissionGuard>;
}
