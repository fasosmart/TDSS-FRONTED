'use client';
import { useState, useEffect } from 'react';

import { DashboardContent } from 'src/layouts/dashboard';

import { paths } from 'src/routes/paths';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DeclarationDetails } from '../declaration-detail';

import { DetailNotFoundView } from 'src/sections/error';

import API from 'src/utils/api';
import axios from 'src/utils/axios';

// ----------------------------------------------------------------------

export function DeclarationDetailsView({ slug }) {
  const [declaration, setDeclaration] = useState(null); // État pour stocker la déclaration
  const [employee, setEmployee] = useState([]); // État pour stocker les employés
  const [error, setError] = useState(null); // État pour gérer les erreurs
  const [notFound, setNotFound] = useState(false); // État pour gérer le 404
  const [loading, setLoading] = useState(true); // État pour gérer le chargement

 useEffect(() => {
  if (!slug) return; // On attend que slug soit défini

  const fetchDeclaration = async () => {
    try {
      const response = await axios.get(API.detailsDeclaration(slug));
      setDeclaration(response.data);
    } catch (error) {
      if (error?.status === 404) {
        setNotFound(true);
      } else {
        setError(error.message || 'Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  fetchDeclaration();
}, [slug]);



  useEffect(() => {
    const fetchAllEmployees = async () => {
      if (!declaration?.slug) return;
      setLoading(true);
      try {
        // 1. Premier appel : on récupère count + résultats paginés
        const { data: { count, results } } = await axios.get(
          API.Employe(declaration?.slug)
        );
        let allEmployees = results;
        // 2. Si on n’a pas tout, on refait un appel en demandant limit = count
        if (count > results.length) {
          const { data: { results: fullResults } } = await axios.get(
            API.Employe(declaration?.slug),
            { params: { limit: count, offset: 0 } }
          );
          allEmployees = fullResults;
        }
        setEmployee(allEmployees);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllEmployees();
  }, [declaration]);
  

  if (notFound) {
    return (
      <DashboardContent>
        <DetailNotFoundView title="Déclaration introuvable" href={paths.dashboard.declaration.list} />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`DÉCLARATION N° ${declaration?.number}`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Declarations', href: paths.dashboard.declaration.list },
          { name: `DÉCLARATION N° ${declaration?.number}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <DeclarationDetails declaration={declaration} employees={employee} />
    </DashboardContent>
  );
}