// DeclarationPDF.jsx
import React, { useMemo } from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { fDate } from 'src/utils/format-time';
import { pdf } from '@react-pdf/renderer';


// Enregistrement de la police Roboto
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
});

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        page: {
          padding: 36,
          fontFamily: 'Roboto',
          fontSize: 10,
          backgroundColor: '#fff',
          paddingBottom: 60,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        },
        logo: {
          width: 60,
          height: 60,
        },
        companyInfo: {
          flex: 1,
          marginLeft: 12,
          alignItems: 'flex-end',
        },
        companyName: {
          fontSize: 16,
          fontWeight: 'bold',
        },
        companyDetails: {
          fontSize: 9,
          color: '#333',
          lineHeight: 1.4,
        },
        line: {
          borderBottomWidth: 1,
          borderColor: '#ccc',
          marginVertical: 8,
        },
        declarationTitle: {
          textAlign: 'center',
          fontSize: 18,
          fontWeight: 'bold',
          marginVertical: 4,
        },
        date: {
          textAlign: 'center',
          fontSize: 10,
        },
        statsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginVertical: 10,
        },
        statBox: {
          flex: 1,
          padding: 8,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 4,
          marginHorizontal: 4,
        },
        statLabel: {
          fontSize: 8,
          color: '#555',
        },
        statValue: {
          fontSize: 14,
          fontWeight: 'bold',
          marginTop: 2,
        },
        table: {
          width: '100%',
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 12,  
        },
        tableRow: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderColor: '#ddd',
        },
        tableHeader: {
          backgroundColor: '#e0e0e0',
        },
        headerCell: {
          flex: 1,
          padding: 6,
          fontSize: 9,
          fontWeight: 'bold',
          borderRightWidth: 1,
          borderColor: '#ddd',
        },
        cell: {
          flex: 1,
          padding: 6,
          fontSize: 9,
          borderRightWidth: 1,
          borderColor: '#ddd',
        },
        firtColumn: {
          flex: 0.5,
        },
        noBorderRight: {
          borderRightWidth: 0,
        },
        footerRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        signatureText: {
          fontSize: 11,
          fontWeight: 'bold',
        },
        qr: {
          width: 80,
          height: 80,
        },
      }),
    []
  );

  // Fonction pour générer un PDF sous forme de bytes
  export const generateDeclarationPDF = async (declaration, options = { download: false }) => {
    const { download } = options;
    const logoUrl = declaration?.company?.picture;
    const proxyBase = 'https://api.allorigins.win/raw?url=';
    const proxiedLogoUrl = logoUrl ? proxyBase + encodeURIComponent(logoUrl) : null;

    const pdfDoc = (
      <DeclarationPDF
        declaration={declaration}
        employees={declaration.employees}
        logoUrl={proxiedLogoUrl}
      />
    );

    const blob = await pdf(pdfDoc).toBlob();
    
    if (download) {
      saveAs(blob, `declaration-${declaration.number}.pdf`);
      return null;
    }

    const arrayBuffer = await blob.arrayBuffer();
    return arrayBuffer;
  };

export  function DeclarationPDF({ declaration, employees, logoUrl }) {
  const styles = useStyles();
  const { company, number, created_on, reference } = declaration;



  // Stats
  const total = employees?.length || 0;
  const cadres = employees?.filter(e => e?.job?.category === 'Cadre')?.length;
  const agents = employees?.filter(e => e?.job?.category === 'Agent de maitrise')?.length;
  const ouvriers = employees?.filter(e => e?.job?.category === 'Ouvrier')?.length;

  const qrData = encodeURIComponent(`Declaration- ${number} - ${total} personnes`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${qrData}&size=100x100`;

  const typeLabels = {
    new:      'Nouveau',
    renewal:  'Renouvellement',
    // ajoute d’autres cas si nécessaire
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          {logoUrl && <Image src={ logoUrl} style={styles.logo} />}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company?.name}</Text>
            <Text style={styles.companyDetails}>{company?.adresse}</Text>
            <Text style={styles.companyDetails}>{company?.location}</Text>
            <Text style={styles.companyDetails}>Tél : {company?.contact}</Text>
            <Text style={styles.companyDetails}>{company?.email}</Text>
          </View>
        </View>

        <View style={styles.line} />

        {/* Titre + date */}
        <Text style={styles.declarationTitle}>DÉCLARATION N° {number}</Text>
        <Text style={styles.date}>{fDate(created_on)}</Text>

        <View style={styles.line} />

        {/* Statistiques */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: total },
            { label: 'Cadres', value: cadres },
            { label: 'Agents', value: agents },
            { label: 'Ouvriers', value: ouvriers },
          ].map((stat, i) => (
            <View key={i} style={styles.statBox}>
              <Text style={styles.statLabel}>{stat?.label}</Text>
              <Text style={styles.statValue}>{stat?.value}</Text>
            </View>
          ))}
        </View>

        {/* Tableau */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]} >
            {['N°', 'Passeport', 'Nom', 'Prénom',  'Fonction', 'Catégorie', 'Type'].map((h, i) => (
              <Text
                key={i}
                style={[
                  styles.headerCell, 
                  i === 0 && styles.firtColumn,
                  i === 6 && styles.noBorderRight]}
              >
                {h}
              </Text>
            ))}
          </View>
          {employees?.map((emp, i) => (
            <View key={i} style={styles.tableRow} wrap={false} >
              <Text style={[styles.cell, styles.firtColumn]}>{i + 1}</Text>
              <Text style={styles.cell}>{emp?.passport_number}</Text>
              <Text style={styles.cell}>{emp?.first}</Text>
              <Text style={styles.cell}>{emp?.last}</Text>
              <Text style={styles.cell}>{emp?.job?.name}</Text>
              <Text style={styles.cell}>{emp?.job?.category}</Text>
              <Text style={[styles.cell, styles.noBorderRight]}>
                {typeLabels[emp?.type]}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.signatureText}>Signature de l'employeur</Text>
          <Image src={{ uri: qrUrl }} style={styles.qr} />
        </View>
      </Page>
    </Document>
  );
}
