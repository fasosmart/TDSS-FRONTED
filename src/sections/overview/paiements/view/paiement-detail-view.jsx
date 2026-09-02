'use client';
import { useState } from 'react';

import React, { useEffect } from 'react';
import { DashboardContent } from 'src/layouts/dashboard';

import { paths } from 'src/routes/paths';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PaiementDetails } from '../paiement-details';
import { DetailNotFoundView } from 'src/sections/error';
import axios from 'src/utils/axios';
import API from 'src/utils/api';
import { toast } from 'src/components/snackbar';
import { useMockedUser } from 'src/auth/hooks';

export function PaiementDetailsView({ slug }) {
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useMockedUser();

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await axios.get(API.detailsPaiement(slug));
        setPayment(response.data);
      } catch (error) {
        if (error?.status === 404) {
          setNotFound(true);
        } else {
          setError(error.message || error.details || error.error);
          toast.error(error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [slug]);

  if (notFound) {
    return (
      <DashboardContent>
        <DetailNotFoundView title="Paiement introuvable" href={paths.dashboard.paiements.list} />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`PAIEMENT N° ${payment?.number}`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Paiements', href: paths.dashboard.paiements.list },
          { name: `PAIEMENT N° ${payment?.number}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <PaiementDetails payment={payment} user={user} setPayment={setPayment} />
    </DashboardContent>
  );
}
