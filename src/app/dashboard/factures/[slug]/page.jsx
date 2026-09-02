
import { CONFIG } from 'src/config-global';

import { PermissionGuard } from 'src/auth/guard';

import { FactureDetailsView } from 'src/sections/overview/factures/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Facture details | Dashboard - ${CONFIG.appName}` };

export default async function Page({ params }) {
  const { slug } = await params;

  return (
    <PermissionGuard permission="can_view_facture">
      <FactureDetailsView slug={slug} />
    </PermissionGuard>
  );
}
// ----------------------------------------------------------------------

/**
 * [1] Default
 * Remove [1] and [2] if not using [2]
 */
// const dynamic = CONFIG.isStaticExport ? 'auto' : 'force-dynamic';

// export { dynamic };

// /**
//  * [2] Static exports
//  * https://nextjs.org/docs/app/building-your-application/deploying/static-exports
//  */
// export async function generateStaticParams() {
//   if (CONFIG.isStaticExport) {
//     const response = await fetch(API.getAllFactures());
//     if (!response.ok) {
//       throw new Error(`Erreur lors de la récupération des déclarations: ${response.statusText}`);
//     }

//     const factures = await response.json();

//     return factures.map((facture) => ({ id: facture.id.toString() })); // Assurez-vous que `id` est une chaîne
//   }
//   return [];
// }
