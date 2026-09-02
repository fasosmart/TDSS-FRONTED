// /src/app/dashboard/user/[id]/page.jsx
import { CONFIG } from 'src/config-global';

import { PermissionGuard } from 'src/auth/guard';

// Fonction pour récupérer les données de l'utilisateur
import { UserDetailsView } from 'src/sections/administration/user/view';

export const metadata = { title: `Details User| Dashboard - ${CONFIG.appName}` }

export default async function UserDetails({ params }) {
  const { slug } = await params;

  return (
    <PermissionGuard permission="can_view_user">
      <UserDetailsView slug={slug} />
    </PermissionGuard>
  );
}
