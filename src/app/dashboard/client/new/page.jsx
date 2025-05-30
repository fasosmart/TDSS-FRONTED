import { CONFIG } from 'src/config-global';


import { ClientCreateView } from 'src/sections/administration/client/view';

// ----------------------------------------------------------------------

export const metadata = { title: `New Structure | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return <ClientCreateView />;
}
