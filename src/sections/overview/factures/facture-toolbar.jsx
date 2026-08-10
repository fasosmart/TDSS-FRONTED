'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { usePermissions } from 'src/auth/hooks';

import { PayeurForm } from './form-factures';
import { generateFactureDocument } from './facture-pdf-service';

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

function openPdfInNewTab(pdfBytes) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');

  if (!openedWindow) {
    URL.revokeObjectURL(url);
    throw new Error("Impossible d'ouvrir l'apercu PDF.");
  }
}

function openPrintWindow() {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    throw new Error("Impossible d'ouvrir la fenetre d'impression.");
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Impression facture</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #111827;
            color: #ffffff;
            font-family: Arial, sans-serif;
          }
          .loading {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          }
          iframe {
            border: 0;
            width: 100%;
            height: 100%;
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="loading">Preparation du document...</div>
        <iframe id="facture-print-frame" title="Impression facture"></iframe>
      </body>
    </html>
  `);
  printWindow.document.close();

  return printWindow;
}

function loadPdfInPrintWindow(printWindow, pdfBytes) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const frame = printWindow.document.getElementById('facture-print-frame');
  const loading = printWindow.document.querySelector('.loading');

  if (!frame) {
    URL.revokeObjectURL(url);
    throw new Error("Impossible de preparer l'impression du PDF.");
  }

  frame.onload = () => {
    if (loading) {
      loading.style.display = 'none';
    }

    frame.style.display = 'block';

    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  };

  frame.src = url;
}

export function FactureToolbar({ facture, user, currentStatus, onChangeStatus, devise }) {
  const payeurForm = useBoolean();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  const { can } = usePermissions();
  const canUsePdfActions = !!facture;

  const handlePreview = async () => {
    if (!facture) return;

    setPreviewLoading(true);

    try {
      const pdfBytes = await generateFactureDocument(facture, devise, { download: false });
      openPdfInNewTab(pdfBytes);
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Impossible d'afficher l'apercu PDF.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!facture) return;

    setDownloadLoading(true);

    try {
      await generateFactureDocument(facture, devise, { download: true });
    } catch (error) {
      toast.error(extractErrorMessage(error) || 'Impossible de telecharger la facture.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!facture) return;

    let printWindow;
    setPrintLoading(true);

    try {
      printWindow = openPrintWindow();
      const pdfBytes = await generateFactureDocument(facture, devise, { download: false });
      loadPdfInPrintWindow(printWindow, pdfBytes);
    } catch (error) {
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
      toast.error(extractErrorMessage(error) || "Impossible d'imprimer la facture.");
    } finally {
      setPrintLoading(false);
    }
  };

  return (
    <>
      <Stack
        spacing={3}
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-end', sm: 'center' }}
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <Stack direction="row" spacing={1} flexGrow={1} sx={{ width: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Apercu PDF">
            <span>
              <IconButton
                onClick={handlePreview}
                disabled={!canUsePdfActions || previewLoading || printLoading || downloadLoading}
              >
                {previewLoading ? <CircularProgress size={24} /> : <Iconify icon="eva:eye-fill" />}
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Telecharger">
            <span>
              <IconButton
                onClick={handleDownload}
                disabled={!canUsePdfActions || downloadLoading || previewLoading || printLoading}
              >
                {downloadLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Iconify icon="eva:cloud-download-fill" />
                )}
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Imprimer">
            <span>
              <IconButton
                onClick={handlePrint}
                disabled={!canUsePdfActions || printLoading || previewLoading || downloadLoading}
              >
                {printLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Iconify icon="solar:printer-minimalistic-bold" />
                )}
              </IconButton>
            </span>
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />

          {can('can_mark_facture_paid') && currentStatus === 'unpaid' && !facture?.has_payment && (
            <Tooltip title="Payer la facture">
              <IconButton onClick={payeurForm.onTrue}>
                <Iconify icon="mdi:credit-card" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <PayeurForm
        slug={[facture?.slug]}
        open={payeurForm.value}
        onclose={payeurForm.onFalse}
        onSuccess={() => {
          onChangeStatus('paid');
          payeurForm.onFalse();
        }}
      />
    </>
  );
}
