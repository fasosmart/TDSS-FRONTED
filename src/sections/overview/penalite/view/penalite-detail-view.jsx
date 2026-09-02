'use client';

import { useCallback, useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';

import axios from 'src/utils/axios';
import API from 'src/utils/api';
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { toast } from 'src/components/snackbar';

import { PenaliteDetails } from '../penalite-details';
import { DetailNotFoundView } from 'src/sections/error';

function extractErrorMessage(error) {
  if (!error) return 'Une erreur est survenue.';

  if (typeof error === 'string') return error;

  const responseData = error.response?.data;

  if (typeof responseData === 'string') return responseData;

  if (Array.isArray(responseData)) return responseData.join(' ');

  if (responseData && typeof responseData === 'object') {
    return (
      responseData.detail ||
      responseData.error ||
      responseData.message ||
      responseData.details ||
      responseData.non_field_errors?.join(' ') ||
      'Une erreur est survenue.'
    );
  }

  return error.message || 'Une erreur est survenue.';
}
export function PenaliteDetailsView({ slug }) {
  const [penalite, setPenalite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPenalite = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await axios.get(API.detailsPenalty(slug));
      setPenalite(response.data || null);
    } catch (err) {
      if (err?.status === 404) {
        setNotFound(true);
      } else {
        const message = extractErrorMessage(err);
        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPenalite();
  }, [fetchPenalite]);

  const runPenaltyAction = useCallback(
    async ({ requestFactory, successMessage }) => {
      setActionLoading(true);

      try {
        await requestFactory();
        toast.success(successMessage);
        await fetchPenalite();
      } catch (err) {
        const message = extractErrorMessage(err);
        toast.error(message);
      } finally {
        setActionLoading(false);
      }
    },
    [fetchPenalite]
  );

  const handleBillPenalty = useCallback(async () => {
    await runPenaltyAction({
      requestFactory: () => axios.post(API.billPenalty(slug), {}),
      successMessage: 'Penalite facturee avec succes.',
    });
  }, [runPenaltyAction, slug]);

  const handleCancelPenalty = useCallback(async () => {
    await runPenaltyAction({
      requestFactory: () => axios.post(API.cancelPenalty(slug), {}),
      successMessage: 'Penalite annulee avec succes.',
    });
  }, [runPenaltyAction, slug]);

  const heading = penalite?.reference ? `Penalite ${penalite.reference}` : 'Details penalite';

  if (notFound) {
    return (
      <DashboardContent maxWidth="xl">
        <DetailNotFoundView title="Pénalité introuvable" href={paths.dashboard.penalite.list} />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={heading}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Penalites', href: paths.dashboard.penalite.list },
          { name: penalite?.reference || 'Details' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {loading ? (
        <Card>
          <LoadingScreen sx={{ py: 10 }} />
        </Card>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !penalite ? (
        <Card>
          <EmptyContent
            filled
            title="Penalite introuvable"
            description="Les details de cette penalite n'ont pas pu etre recuperes."
            sx={{ py: 10 }}
          />
        </Card>
      ) : (
        <PenaliteDetails
          penalite={penalite}
          onBill={handleBillPenalty}
          onCancel={handleCancelPenalty}
          actionLoading={actionLoading}
        />
      )}
    </DashboardContent>
  );
}
