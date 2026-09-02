import { pdf, Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

import { fNumber } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';

import { getPenaltyStatusLabel, getPenaltyTypeLabel } from './penalite-filter-options';

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 56,
    height: 56,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  brandCaption: {
    marginTop: 4,
    fontSize: 9,
    color: '#4B5563',
  },
  titleBlock: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  titleMeta: {
    marginTop: 4,
    fontSize: 9,
    color: '#4B5563',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    marginVertical: 12,
  },
  topGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  topCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  section: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 5,
  },
  label: {
    width: '38%',
    fontWeight: 'bold',
    color: '#111827',
  },
  value: {
    width: '62%',
    color: '#1F2937',
    textAlign: 'right',
  },
  descriptionBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#F9FAFB',
  },
  descriptionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  descriptionValue: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
  },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 9,
    color: '#4B5563',
  },
  qr: {
    width: 72,
    height: 72,
  },
});

function getDisplayValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string' || typeof value === 'number') return String(value);

  if (Array.isArray(value)) {
    const values = value.map(getDisplayValue).filter((item) => item !== '-');
    return values.length ? values.join(', ') : '-';
  }

  if (typeof value === 'object') {
    return (
      [value.first, value.last].filter(Boolean).join(' ') ||
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

function formatAmount(amount, currency) {
  if (amount === null || amount === undefined || amount === '') return '-';

  const parsedAmount = Number(amount);
  const currencyDisplay = getDisplayValue(currency);

  if (Number.isNaN(parsedAmount)) {
    return [amount, currencyDisplay !== '-' ? currencyDisplay : ''].filter(Boolean).join(' ');
  }

  return [fNumber(parsedAmount), currencyDisplay !== '-' ? currencyDisplay : '']
    .filter(Boolean)
    .join(' ');
}

function buildRelatedSection(penalite) {
  if (penalite?.type === 'EXPIRED_PERMIT' && penalite?.permit) {
    return {
      title: 'Permis',
      rows: [
        ['Reference', penalite.permit.reference],
        ['Employe', penalite.permit.employee_name],
        ['Numero de carte', penalite.permit.card_number],
        ['Expiration', fDate(penalite.permit.card_expires_at)],
      ],
    };
  }

  if (penalite?.type === 'LATE_PAYMENT' && penalite?.source_invoice) {
    return {
      title: 'Facture source',
      rows: [
        ['Reference', penalite.source_invoice.reference],
        ['Numero', penalite.source_invoice.number],
        [
          'Montant',
          formatAmount(
            penalite.source_invoice.amount,
            penalite?.currency_sign || penalite?.currency
          ),
        ],
      ],
    };
  }

  if (penalite?.employee) {
    return {
      title: 'Employe',
      rows: [
        ['Reference', penalite.employee.reference],
        [
          'Nom complet',
          [penalite.employee.first, penalite.employee.last].filter(Boolean).join(' '),
        ],
        ['Passeport', penalite.employee.passport_number],
      ],
    };
  }

  return null;
}

export async function generatePenalitePDF(penalite) {
  const blob = await pdf(<PenalitePDF penalite={penalite} />).toBlob();
  return blob.arrayBuffer();
}

export function PenalitePDF({ penalite }) {
  const companyName = penalite?.company_name || penalite?.company || '-';
  const status = penalite?.status?.toUpperCase() || '';
  const currency = penalite?.currency_sign || penalite?.currency;
  const relatedSection = buildRelatedSection(penalite);
  const qrData = encodeURIComponent(
    `Penalite ${penalite?.reference || ''} - ${companyName} - ${getPenaltyTypeLabel(penalite?.type) || ''}`
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${qrData}&size=100x100`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.logoBlock}>
            <Image src="/logo/logo-single.png" style={styles.logo} />
            <View>
              <Text style={styles.brandTitle}>TECH DATA SECURISATION & SYSTEMES</Text>
              <Text style={styles.brandCaption}>Fiche detaillee de penalite</Text>
            </View>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>PENALITE</Text>
            <Text style={styles.titleMeta}>{penalite?.reference || '-'}</Text>
            <Text style={styles.titleMeta}>{fDate(penalite?.created_on) || '-'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.topGrid}>
          <View style={styles.topCard}>
            <Text style={styles.sectionTitle}>Entreprise</Text>
            <Text>{companyName}</Text>
          </View>

          <View style={styles.topCard}>
            <Text style={styles.sectionTitle}>Statut</Text>
            <Text>{getPenaltyStatusLabel(status) || '-'}</Text>
          </View>

          <View style={styles.topCard}>
            <Text style={styles.sectionTitle}>Montant</Text>
            <Text>{formatAmount(penalite?.amount, currency)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de la penalite</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{penalite?.reference || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{getPenaltyTypeLabel(penalite?.type) || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Statut</Text>
            <Text style={styles.value}>{getPenaltyStatusLabel(status) || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de l'infraction</Text>
            <Text style={styles.value}>{fDate(penalite?.infraction_date) || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Devise</Text>
            <Text style={styles.value}>{getDisplayValue(currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cree le</Text>
            <Text style={styles.value}>{fDateTime(penalite?.created_on) || '-'}</Text>
          </View>

          {penalite?.invoice_slug && (
            <View style={styles.row}>
              <Text style={styles.label}>Facture generee</Text>
              <Text style={styles.value}>{penalite?.invoice_slug}</Text>
            </View>
          )}

          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.descriptionValue}>{penalite?.description || '-'}</Text>
          </View>
        </View>

        {relatedSection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{relatedSection.title}</Text>
            {relatedSection.rows.map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{getDisplayValue(value)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Document genere le {fDateTime(new Date().toISOString())}
          </Text>
          <Image src={qrUrl} style={styles.qr} />
        </View>
      </Page>
    </Document>
  );
}
