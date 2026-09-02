import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { DeclarationDetailsView } from 'src/sections/overview/declaration/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Déclaration details | Dashboard - ${CONFIG.appName}` };

export default async function Page({ params }) {
  const { slug } = await params;

  return <PermissionGuard permission="can_view_declaration"><DeclarationDetailsView slug={slug} /></PermissionGuard>;
}

// ----------------------------------------------------------------------

/**
 * [1] Default
 * Remove [1] and [2] if not using [2]
 */
export const dynamic = 'force-dynamic';

/**
 * [2] Static exports
 * https://nextjs.org/docs/app/building-your-application/deploying/static-exports
 */
// export async function generateStaticParams() {
//   if (CONFIG.isStaticExport) {

//     const response = await fetch(API.getAllDeclarations());
//     if (!response.ok) {
//       throw new Error(`Erreur lors de la récupération des déclarations: ${response.statusText}`);
//     }

//     const declarations = await response.json();

//     return declarations.map((declaration) => ({ id: declaration.id.toString() })); // Assurez-vous que `id` est une chaîne

//   }
//   return [];
// }
