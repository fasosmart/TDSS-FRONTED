import { CONFIG } from 'src/config-global';
import { PermissionGuard } from 'src/auth/guard';
import { JobEditView } from 'src/sections/administration/fonction/view';


// ----------------------------------------------------------------------

export const metadata = { title: `Job edit | Dashboard - ${CONFIG.appName}` };


export default async function Page({ params }) {
    const { slug } = await params;

    return <PermissionGuard permission="can_manage_jobs"><JobEditView slug={slug} /></PermissionGuard>;
}

// ----------------------------------------------------------------------

// Gestion du mode dynamique ou statique
// const dynamic = CONFIG.isStaticExport ? 'auto' : 'force-dynamic';
// export { dynamic };

// // Génération des paramètres statiques pour le pré-rendu
// export async function generateStaticParams() {
//     try {
//         const res = await axios.get(API.listFonctions()); // Assurez-vous que cette API retourne une liste
//         const jobs = await res.json();

//         return jobs.map((job) => ({ id: job.id.toString() }));
//     } catch (error) {
//         console.error('Erreur lors de la récupération des jobs:', error);
//         return [];
//     }
// }
