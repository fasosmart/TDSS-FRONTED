// /src/app/dashboard/user/[id]/page.jsx
import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';
import React from 'react';
import { ClientDetailsView } from 'src/sections/administration/client/view';

export const metadata = { title: `Details Structure | Dashboard - ${CONFIG.appName}` };


export default async function UserDetails({ params }) {
    const { slug } = await params;
    return (
        <PermissionGuard permission="can_view_referentials"><ClientDetailsView slug={slug} /></PermissionGuard>
    );
}
