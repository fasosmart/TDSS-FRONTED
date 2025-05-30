'use client';
import { useState } from 'react';

import React, { useEffect } from 'react';
import { DashboardContent } from 'src/layouts/dashboard';

import { paths } from 'src/routes/paths';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { FactureDetails } from '../facture-details';
import axios from 'src/utils/axios';
import API from 'src/utils/api';
import { toast } from 'src/components/snackbar';
import { useMockedUser } from 'src/auth/hooks';

export function FactureDetailsView({ slug }) {
  const [facture, setFacture] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user } = useMockedUser();

  useEffect(() => {
    const fetchFacture = async () => {
      try {
        const response = await axios.get(API.detailsFacture(slug));
        setFacture(response.data);
      } catch (error) {
        setError(error.message || error.details || error.error)
        toast.error(error);
      } finally {
        setLoading(false)
      }
    };
    fetchFacture();
  }, [slug]);


  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`FACTURE N° ${facture?.number}`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Factures', href: paths.dashboard.factures.list },
          { name: `FACTURE N° ${facture?.number}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <FactureDetails facture={facture} user={user} />

    </DashboardContent>
  );
}
