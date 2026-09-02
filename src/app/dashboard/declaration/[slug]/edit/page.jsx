import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';

import { DeclarationEditView } from 'src/sections/overview/declaration/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Modifier Declarations | Dashboard - ${CONFIG.appName}` };

export default async function Page({ params }) {
  const { slug } = await params;

  return <PermissionGuard permission="can_edit_declaration"><DeclarationEditView slug={slug} /></PermissionGuard>;
}

export const dynamic = 'force-dynamic';

/**
 * [2] Static exports
 * https://nextjs.org/docs/app/building-your-application/deploying/static-exports
 */
// export async function generateStaticParams() {
//   if (CONFIG.isStaticExport) {

//     return declarations.map((declaration) => ({ id: declaration.id }));

//   }
//   return [];
// }
