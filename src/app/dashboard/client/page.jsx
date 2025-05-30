import { CONFIG } from 'src/config-global';


import { ClientListView } from 'src/sections/administration/client/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Structure | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <ClientListView />;
}
