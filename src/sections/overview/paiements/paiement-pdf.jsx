// Updated PaiementPDF component to fix formatting and duplicate receipt
import { Page, View, Text, Image, Document, StyleSheet } from '@react-pdf/renderer';
// import PropTypes from 'prop-types';


export function PaiementPDF({ payment }) {
  // Fonction pour formater les montants en GNF avec séparateurs de milliers
  const formatAmount = (amount, sign = 'GNF') => {
    if (amount == null) return `0 ${sign}`;
    return `${Number(amount).toLocaleString('en-US')} ${sign}`;
  };



  // Convertit le montant selon la devise
  const convertirMontant = (montant) => {
    const sign = payment?.devise?.sign;
    if (sign === 'GNF') return formatAmount(montant, 'GNF');
    if (sign === '$') return formatAmount(montant / 9200, '$');
    if (sign === '€') return formatAmount(montant / 10000, '€');
    return formatAmount(montant, sign);
  };

  const formatDate = ds => {
    const d = new Date(ds);
    const j = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const a = d.getFullYear();
    return `${j}/${m}/${a}`;
  };

  const styles = StyleSheet.create({
    page: { flexDirection: 'column', padding: 20, fontSize: 9, fontFamily: 'Helvetica', backgroundColor: '#FFF' },
    copyContainer: { flex: 1, marginBottom: 10 },
    separator: { borderBottomWidth: 1, borderColor: '#000', borderStyle: 'dashed', marginVertical: 10 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
    logoContainer: { alignItems: 'center', width: '33%' },
    logo: { width: 80, height: 50 },
    smallText: { fontSize: 3, textAlign: 'center', marginTop: 5, maxWidth: 100, lineHeight: 1.2 },
    title: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginVertical: 5 },
    divider: { borderBottomWidth: 1, borderColor: '#DDD', marginVertical: 5 },
    divider1: {
    borderBottomWidth: 1,
    borderColor: '#DDD',
    marginTop: 1,    // moins d’espace entre la date et la ligne
    marginBottom: 4, // espace suffisant avant les infos client
  },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    column: { flex: 1 },
    infoTable: { flexDirection: 'column' },
    infoTableRow: { flexDirection: 'row', marginBottom: 2  },
    infoTableRowNoMargin: { flexDirection: 'row', marginBottom: 0 },
    infoLabel: { fontWeight: 'bold' },
    infoValue: { marginLeft: 5 },
    table: { marginVertical: 8, borderWidth: 1, borderColor: '#DDD' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderBottomWidth: 1, borderBottomColor: '#DDD', paddingVertical: 4 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 4 },
    tableCell30: { width: '30%', paddingHorizontal: 10 },
    tableCell40: { width: '40%', paddingHorizontal: 10 },
    tableCellLast: { borderRightWidth: 0 },
    tableCellCenter: { textAlign: 'center' },
    tableCellRight: { textAlign: 'flex-end' },
    signatureSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    qrCode: { width: 50, height: 50  },
    signature: { textAlign: 'center', fontWeight: 'bold', fontSize: 9, textDecoration: 'underline' , marginTop: 5 },
  });

  // URL du QR code
  const qrData = encodeURIComponent(`Paiement: ${payment?.number} - Facture: ${payment?.facture_number || ''} - Montant: ${payment?.amount || ''} ${payment?.devise?.sign || 'GNF'}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${qrData}&size=100x100`;

  // Fonction pour rendre un reçu
  const renderReceipt = () => (
    <View style={styles.copyContainer}>
      <View style={styles.headerRow}>
        <View style={styles.logoContainer}>
          <Image src="/logo/logo-single.png" style={styles.logo} />
          <Text style={styles.smallText}>TECH DATA SECURISATION & SYSTEMES</Text>
        </View>
        <View />
        <View style={styles.logoContainer}>
          <Image src="/logo/logo-single.png" style={styles.logo} />
          <Text style={styles.smallText}>TECH DATA SECURISATION & SYSTEMES</Text>
        </View>
      </View>

      <View style={styles.divider} />
      <Text style={styles.title}>RECU DE PAIEMENT N° {payment?.number || payment?.reference}</Text>
      <View style={styles.divider} />

      {/* <View style={styles.row}> */}
      <View style={[styles.column, { flex: 0.5, marginBottom: 1 }]}>
      <View style={[styles.infoTableRowNoMargin, { flexDirection: 'row', justifyContent: 'flex-end' }]}>
        <Text style={[styles.infoLabel, styles.tableCellRight, { width: 100, textAlign: 'right', marginRight: 5 }]}>
          Facture N° :
        </Text>
        <Text style={[styles.infoValue, styles.tableCellRight]}>{payment?.facture_number}</Text>
      </View>
      <View style={[styles.infoTableRowNoMargin, { flexDirection: 'row', justifyContent: 'flex-end' }]}>
    <Text style={[styles.infoLabel, styles.tableCellRight, { width: 100, textAlign: 'right', marginRight: 5 }]}>
      Date :
    </Text>
    <Text style={[styles.infoValue, styles.tableCellRight]}>{formatDate(payment?.created_on)}</Text>
  </View>
    </View>

      {/* </View> */}

      <View style={styles.divider} />

     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
  {/* Bloc gauche : infos client */}
  <View style={{ flex: 1 }}>
    <View style={styles.infoTableRow}>
      <Text style={styles.infoLabel}>CLIENT :</Text>
      <Text style={styles.infoValue}>{payment?.payer?.employer}</Text>
    </View>
    <View style={styles.infoTableRow}>
      <Text style={styles.infoLabel}>Tél :</Text>
      <Text style={styles.infoValue}>{payment?.payer?.phone}</Text>
    </View>
    <View style={styles.infoTableRow}>
      <Text style={styles.infoLabel}>Adresse :</Text>
      <Text style={styles.infoValue}>{payment?.payer?.address}</Text>
    </View>
  </View>

  {/* Bloc droite : QR code */}
  <View>
    <Image src={qrUrl} style={styles.qrCode} />
  </View>
</View>


      <View style={styles.divider} />

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell30, styles.infoLabel]}>Description</Text>
          <Text style={[styles.tableCell40, styles.infoLabel, styles.tableCellCenter]}>Types de permis</Text>
          <Text style={[styles.tableCell30, styles.infoLabel, styles.tableCellRight, styles.tableCellLast]}>Montant</Text>
        </View>
        {payment?.permits?.filter(p => p?.count > 0).map((permit, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.tableCell30}>Frais d'acquisition</Text>
            <Text style={[styles.tableCell40, styles.tableCellCenter]}>Permis {permit.type} ({permit.count})</Text>
            <Text style={[styles.tableCell30, styles.tableCellRight, styles.tableCellLast]}>{convertirMontant(permit.total_price)}</Text>
          </View>
        ))}
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.tableCell40} />
          <Text style={[styles.tableCell30, styles.infoLabel, styles.tableCellRight]}>TOTAL TTC</Text>
          <Text style={[styles.tableCell30, styles.infoLabel, styles.tableCellRight, styles.tableCellLast]}>{convertirMontant(payment.amount)}</Text>
        </View>
      </View>
       <View style={styles.infoTableRow}>
        <Text style={styles.infoLabel}>Commentaire :</Text>
        <Text style={styles.infoValue}>{payment?.comment}</Text>
      </View>

      <View style={styles.signatureSection}>
        <View>
          <Text style={styles.signature}>Le Client</Text>
        </View>
        <View>
          <Text style={styles.signature}>La Banque</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {renderReceipt()}
        <View style={styles.separator} />
        {renderReceipt()}
      </Page>
    </Document>
  );
}

// PaiementPDF.propTypes = {
//   payment: PropTypes.shape({
//     reference: PropTypes.string,
//     number: PropTypes.string,
//     facture_number: PropTypes.string,
//     amount: PropTypes.number,
//     devise: PropTypes.shape({ sign: PropTypes.string }),
//     payer: PropTypes.object,
//     permits: PropTypes.arrayOf(PropTypes.object)
//   }).isRequired,
// };
