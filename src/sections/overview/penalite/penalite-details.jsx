import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fNumber } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { Label } from 'src/components/label';

import { getPenaltyStatusLabel, getPenaltyTypeLabel } from './penalite-filter-options';
import { PenaliteToolbar } from './penalite-toolbar';

const STATUS_COLOR = {
  OPEN: 'warning',
  BILLED: 'success',
  PAID: 'success',
  CANCELLED: 'error',
  CANCELED: 'error',
  CLOSED: 'default',
};

function getDisplayValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const normalizedValues = value.map(getDisplayValue).filter((item) => item !== '-');
    return normalizedValues.length ? normalizedValues.join(', ') : '-';
  }

  if (typeof value === 'object') {
    const fullName = [value.first, value.last].filter(Boolean).join(' ');

    return (
      fullName ||
      value.label ||
      value.name ||
      value.sign ||
      value.reference ||
      value.number ||
      value.value ||
      '-'
    );
  }

  return String(value);
}

function formatPenaltyAmount(amount, currency) {
  if (amount === null || amount === undefined || amount === '') {
    return '-';
  }

  const parsedAmount = Number(amount);
  const currencyLabel = getDisplayValue(currency);
  const normalizedCurrency = currencyLabel === '-' ? '' : currencyLabel;

  if (Number.isNaN(parsedAmount)) {
    return [amount, normalizedCurrency].filter(Boolean).join(' ');
  }

  return [fNumber(parsedAmount), normalizedCurrency].filter(Boolean).join(' ');
}

function DetailLine({ label, value, href }) {
  const displayValue = getDisplayValue(value);

  return (
    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.primary', mb: 0.5 }}>
      <Typography
        component="span"
        sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
      >
        {label} :
      </Typography>{' '}
      {href && displayValue !== '-' ? (
        <Typography
          component={RouterLink}
          href={href}
          sx={{
            color: 'text.primary',
            textDecoration: 'none',
            fontSize: '0.85rem',
            '&:hover': {
              color: 'primary.main',
              textDecoration: 'underline',
            },
          }}
        >
          {displayValue}
        </Typography>
      ) : (
        displayValue
      )}
    </Typography>
  );
}

function DetailSection({ title, children, fullWidth = false }) {
  return (
    <Stack
      spacing={1}
      sx={{
        gridColumn: fullWidth ? { xs: '1', md: 'span 2' } : 'auto',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

export function PenaliteDetails({ penalite, onBill, onCancel, actionLoading = false }) {
  const status = penalite?.status?.toUpperCase() || '';
  const companyName = penalite?.company_name || penalite?.company || '-';
  const employeeName = [penalite?.employee?.first, penalite?.employee?.last]
    .filter(Boolean)
    .join(' ');
  const currencyDisplay = getDisplayValue(penalite?.currency_sign || penalite?.currency);
  const qrData = encodeURIComponent(
    `Penalite ${penalite?.reference || ''} - ${companyName} - ${getPenaltyTypeLabel(penalite?.type) || ''}`
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${qrData}&size=100x100`;
  const relatedSection =
    penalite?.type === 'EXPIRED_PERMIT' && penalite?.permit ? (
      <DetailSection title="Permis">
        <DetailLine
          label="Reference"
          value={penalite.permit.reference || 'Voir permis'}
          href={
            penalite.permit.slug ? paths.dashboard.permit.details(penalite.permit.slug) : undefined
          }
        />
        <DetailLine label="Employe" value={penalite.permit.employee_name} />
        <DetailLine label="Numero de carte" value={penalite.permit.card_number} />
        <DetailLine label="Date d'expiration" value={fDate(penalite.permit.card_expires_at)} />
      </DetailSection>
    ) : penalite?.type === 'LATE_PAYMENT' && penalite?.source_invoice ? (
      <DetailSection title="Facture source">
        <DetailLine
          label="Reference"
          value={penalite.source_invoice.reference || 'Voir la facture'}
          href={
            penalite.source_invoice.slug
              ? paths.dashboard.factures.details(penalite.source_invoice.slug)
              : undefined
          }
        />
        <DetailLine label="Numero" value={penalite.source_invoice.number} />
        <DetailLine
          label="Montant"
          value={formatPenaltyAmount(
            penalite.source_invoice.amount,
            penalite?.currency_sign || penalite?.currency
          )}
        />
      </DetailSection>
    ) : penalite?.employee ? (
      <DetailSection title="Employe">
        <DetailLine
          label="Reference"
          value={penalite.employee.reference || 'Voir employe'}
          href={
            penalite.employee.slug
              ? paths.dashboard.employee.details(penalite.employee.slug)
              : undefined
          }
        />
        <DetailLine label="Nom complet" value={employeeName} />
        <DetailLine label="Passeport" value={penalite.employee.passport_number} />
      </DetailSection>
    ) : null;

  return (
    <>
      <PenaliteToolbar
        penalite={penalite}
        onBill={onBill}
        onCancel={onCancel}
        actionLoading={actionLoading}
      />

      <Card sx={{ pt: 5, px: 5 }}>
        <Box
          rowGap={5}
          display="grid"
          alignItems="center"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
        >
          <Box
            component="img"
            alt="logo"
            src="/logo/logo-single.png"
            sx={{ width: 48, height: 48 }}
          />

          <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
            <Label variant="soft" color={STATUS_COLOR[status] || 'default'}>
              {getPenaltyStatusLabel(status) || '-'}
            </Label>

            <Typography variant="h6">{penalite?.reference || '-'}</Typography>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Date de creation : {fDate(penalite?.created_on) || '-'}
            </Typography>
          </Stack>

          <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-start' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              <strong>
                <u>ENTREPRISE :</u>
              </strong>
              <br />
              {companyName}
            </Typography>

            <Typography variant="body2">
              <strong>Type :</strong> {getPenaltyTypeLabel(penalite?.type) || '-'}
            </Typography>

            <Typography variant="body2">
              <strong>Date de l&apos;infraction :</strong> {fDate(penalite?.infraction_date) || '-'}
            </Typography>
          </Stack>

          <Stack
            sx={{
              typography: 'body2',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
            }}
          >
            <Box sx={{ width: 90, height: 90 }} component="img" alt="qrCode" src={qrUrl} />
          </Stack>

          <Box
            gridColumn={{ xs: '1', sm: 'span 2' }}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={3}
            flexWrap="wrap"
            gap={3}
          >
            <Stack sx={{ typography: 'body2' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Montant
              </Typography>
              {formatPenaltyAmount(penalite?.amount, penalite?.currency_sign || penalite?.currency)}
            </Stack>

            <Stack sx={{ typography: 'body2' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Devise
              </Typography>
              {currencyDisplay}
            </Stack>

            <Stack sx={{ typography: 'body2' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Cree le
              </Typography>
              {fDateTime(penalite?.created_on) || '-'}
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ mt: 5, borderStyle: 'dashed' }} mb={6} />

        <Box
          sx={{
            display: 'grid',
            gap: 4,
            mt: 3,
            gridTemplateColumns: {
              xs: '1fr',
              md: relatedSection ? 'repeat(2, minmax(0, 1fr))' : '1fr',
            },
          }}
        >
          <DetailSection title="Informations de la penalite">
            <DetailLine label="Reference" value={penalite?.reference} />
            <DetailLine label="Type" value={getPenaltyTypeLabel(penalite?.type) || '-'} />
            <DetailLine label="Statut" value={getPenaltyStatusLabel(status) || '-'} />
            <DetailLine label="Description" value={penalite?.description} />
            {penalite?.invoice_slug && (
              <DetailLine
                label="Facture generee"
                value="Voir la facture"
                href={paths.dashboard.factures.details(penalite.invoice_slug)}
              />
            )}
          </DetailSection>

          {relatedSection}
        </Box>

        <Divider sx={{ mt: 5, borderStyle: 'dashed' }} />
      </Card>
    </>
  );
}
