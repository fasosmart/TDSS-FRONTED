import { CONFIG } from 'src/config-global';
import { ClientEditView } from 'src/sections/administration/client/view/client-edit-view';

export const metadata = { title: `Update Structure| Dashboard - ${CONFIG.appName}` }

export default async function Page({ params }) {
    const { slug } = await params;

    return (
        <ClientEditView slug={slug} />
    )
}
