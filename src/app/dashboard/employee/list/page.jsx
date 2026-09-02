import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';


import { EmployeeListView } from 'src/sections/overview/employee/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Empoyee | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return <PermissionGuard permission="can_view_employee"><EmployeeListView /></PermissionGuard>;
}
