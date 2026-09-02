'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { useBoolean } from 'src/hooks/use-boolean';

import { ConfirmDialog } from 'src/components/custom-dialog';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { generatePenalitePDF } from './penalite-pdf';

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

function openPdfInNewTab(pdfBytes, { print = false } = {}) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');

  if (!openedWindow) {
    URL.revokeObjectURL(url);
    throw new Error("Impossible d'ouvrir l'aperçu PDF.");
  }

  if (print) {
    window.setTimeout(() => {
      openedWindow.focus();
      openedWindow.print();
    }, 700);
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
        <title>Impression penalite</title>
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
        <iframe id="penalite-print-frame" title="Impression penalite"></iframe>
      </body>
    </html>
  `);
  printWindow.document.close();

  return printWindow;
}

function loadPdfInPrintWindow(printWindow, pdfBytes) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const frame = printWindow.document.getElementById('penalite-print-frame');
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

export function PenaliteToolbar({ penalite, onBill, onCancel, actionLoading = false }) {
  const billConfirm = useBoolean();
  const cancelConfirm = useBoolean();

  const [previewLoading, setPreviewLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  const status = penalite?.status?.toUpperCase() || '';
  const isOpen = status === 'OPEN';
  const isCancelled = ['CANCELLED', 'CANCELED'].includes(status);
  const isBilled = status === 'BILLED';
  const canBill = !!onBill && isOpen;
  const canCancel = !!onCancel && !isCancelled && !isBilled;
  const canUsePdfActions = !!penalite;

  const handlePreview = async () => {
    if (!penalite) return;

    setPreviewLoading(true);

    try {
      const pdfBytes = await generatePenalitePDF(penalite);
      openPdfInNewTab(pdfBytes);
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Impossible d'afficher l'aperçu PDF.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!penalite) return;

    let printWindow;

    setPrintLoading(true);

    try {
      printWindow = openPrintWindow();
      const pdfBytes = await generatePenalitePDF(penalite);
      loadPdfInPrintWindow(printWindow, pdfBytes);
    } catch (error) {
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
      toast.error(extractErrorMessage(error) || "Impossible d'imprimer le PDF.");
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
                disabled={!canUsePdfActions || previewLoading || printLoading}
              >
                {previewLoading ? <CircularProgress size={24} /> : <Iconify icon="eva:eye-fill" />}
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Imprimer">
            <span>
              <IconButton
                onClick={handlePrint}
                disabled={!canUsePdfActions || printLoading || previewLoading}
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

          {canBill && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:credit-card" />}
              onClick={billConfirm.onTrue}
              disabled={actionLoading}
            >
              Facturer
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Iconify icon="solar:close-circle-bold" />}
              onClick={cancelConfirm.onTrue}
              disabled={actionLoading}
            >
              Annuler
            </Button>
          )}
        </Stack>
      </Stack>

      <ConfirmDialog
        open={billConfirm.value}
        onClose={billConfirm.onFalse}
        title="Facturer"
        content="Voulez-vous vraiment facturer cette penalite ?"
        action={
          <Button
            variant="contained"
            onClick={async () => {
              await onBill?.();
              billConfirm.onFalse();
            }}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress color="inherit" size={20} /> : 'Facturer'}
          </Button>
        }
      />

      <ConfirmDialog
        open={cancelConfirm.value}
        onClose={cancelConfirm.onFalse}
        title="Annuler"
        content="Voulez-vous vraiment annuler cette penalite ?"
        action={
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              await onCancel?.();
              cancelConfirm.onFalse();
            }}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress color="inherit" size={20} /> : 'Annuler'}
          </Button>
        }
      />
    </>
  );
}
