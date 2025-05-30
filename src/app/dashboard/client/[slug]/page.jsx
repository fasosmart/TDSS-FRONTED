// /src/app/dashboard/user/[id]/page.jsx
import { CONFIG } from 'src/config-global';
import React from 'react';
import { ClientDetailsView } from 'src/sections/administration/client/view';

export const metadata = { title: `Details Structure | Dashboard - ${CONFIG.appName}` };


export default async function UserDetails({ params }) {
    const { slug } = await params;
    return (
        <ClientDetailsView slug={slug} />
    );
}
