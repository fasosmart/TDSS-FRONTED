// /src/app/dashboard/user/[id]/page.jsx
import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';
import React from 'react';
import { JobCategoryDetailsView } from 'src/sections/administration/JobCategory/view';

export const metadata = { title: `Details Job Category | Dashboard - ${CONFIG.appName}` };


export default async function JobCategoryDetails({ params }) {
    const { slug } = await params;
    return (
        <PermissionGuard permission="can_manage_jobs"><JobCategoryDetailsView slug={slug} /></PermissionGuard>
    );
}
