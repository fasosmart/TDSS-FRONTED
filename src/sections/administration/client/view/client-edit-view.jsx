'use client';

import { useEffect, useState } from 'react'
import { DashboardContent } from "src/layouts/dashboard";
import { paths } from "src/routes/paths";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { ClientNewEditForm } from '../client-new';

import API from 'src/utils/api';
import axios from 'src/utils/axios';



export function ClientEditView({ slug }) {
    const [profil, setProfil] = useState();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Récupération des données du profil
        const fetchProfil = async () => {
            try {
                const response = await axios.get(API.UpdateProfile(slug));
                setProfil(response.data);
                
            } catch (err) {
                setError(err.message || 'Erreur lors du chargement des données.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfil();
    }, [slug]);

    return (
        <DashboardContent>
            <CustomBreadcrumbs
                heading="Modification des informations de la structure"
                links={[
                    { name: 'Dashboard', href: paths.dashboard.root },
                    { name: 'Structures', href: paths.dashboard.client.root },
                    { name:  ` ${profil?.name}` },	
                ]}
                sx={{ mb: { xs: 3, md: 5 } }}
            >



            </CustomBreadcrumbs>
            <ClientNewEditForm currentClient={profil} />
        </DashboardContent>
    );
} 