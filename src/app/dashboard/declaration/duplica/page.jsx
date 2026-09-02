import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { DeclarationNewView } from 'src/sections/overview/declaration/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Duplicata Déclaration | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return <PermissionGuard permission="can_duplicate_declaration"><DeclarationNewView /></PermissionGuard>;
}
