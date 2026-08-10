// Installation requise : npm install jspdf jspdf-autotable xlsx jszip file-saver

import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { fDate } from './format-time';
import { fGNF } from './format-number';

/**
 * Exporte les données en format PDF
 *
 *
 */

const STATUS_TRANSLATIONS = {
  submitted: 'Soumise',
  validated: 'Validée',
  rejected: 'Rejetée',
  billed: 'Facturée',
  unsubmitted: 'Non soumise',
  processing: 'En traitement',
  printed: 'Imprimée',
  delivered: 'Delivrée',
  pending: 'En attente',
};
export const exportToPDF = async (data, filename = 'rapport-declarations.pdf') => {
  // ✅ Créer le document
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ✅ Titre
  doc.setFontSize(16);
  doc.text('Rapport des Déclarations', 14, 20);

  // ✅ Données du tableau
  const tableData = data.map((row) => [
    row.number || '-',
    row.company || '-',
    row.nber_employees ?? 0,
    row.created_on ? new Date(row.created_on).toLocaleDateString('fr-FR') : '-',
    STATUS_TRANSLATIONS[row.status] || row.status || '-',
  ]);

  // ✅ Appel direct de la méthode autoTable (elle est déjà injectée)
  autoTable(doc, {
    head: [['Numéro', 'Entreprise', 'Employés', 'Date', 'Statut']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 10 },
  });

  // ✅ Télécharger le fichier
  doc.save(filename);
};

/**
 * Exporte les données en format CSV
 */
export const exportToCSV = (data, filename = 'rapport-declarations.csv') => {
  const headers = ['Numéro', 'Entreprise', 'Employés', 'Date de Création', 'Statut'];

  // Créer le contenu CSV avec encodage UTF-8 BOM pour Excel
  const BOM = '\uFEFF';
  const csvContent =
    BOM +
    [
      headers.join(';'), // Utiliser ; pour Excel français
      ...data.map((row) =>
        [
          row.number || '',
          row.company || '',
          row.nber_employees || '0',
          new Date(row.created_on).toLocaleDateString('fr-FR'),
          STATUS_TRANSLATIONS[row.status] || row.status || '',
        ].join(';')
      ),
    ].join('\n');

  // Télécharger le fichier
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporte les données en format Excel
 */
export const exportToExcel = (data, filename = 'rapport-declarations.xlsx') => {
  // Préparer les données
  const worksheetData = [
    ['Numéro', 'Entreprise', 'Employés', 'Date de Création', 'Statut'],
    ...data.map((row) => [
      row.number || '-',
      row.company || '-',
      row.nber_employees || 0,
      new Date(row.created_on).toLocaleDateString('fr-FR'),
      STATUS_TRANSLATIONS[row.status] || row.status || '-',
    ]),
  ];

  // Créer le workbook et la worksheet
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Déclarations');

  // Définir la largeur des colonnes
  ws['!cols'] = [
    { wch: 15 }, // Numéro
    { wch: 25 }, // Entreprise
    { wch: 10 }, // Employés
    { wch: 15 }, // Date
    { wch: 15 }, // Statut
  ];

  // Télécharger le fichier
  XLSX.writeFile(wb, filename);
};

/**
 * Exporte les données dans un fichier ZIP contenant CSV, Excel et JSON
 */
export const exportToZip = async (data, filename = 'rapport-declarations.zip') => {
  const zip = new JSZip();

  // 1. Ajouter le fichier CSV
  const csvHeaders = ['Numéro', 'Entreprise', 'Employés', 'Date de Création', 'Statut'];
  const csvContent = [
    csvHeaders.join(';'),
    ...data.map((row) =>
      [
        row.number || '',
        row.company || '',
        row.nber_employees || '0',
        new Date(row.created_on).toLocaleDateString('fr-FR'),
        STATUS_TRANSLATIONS[row.status] || row.status || '',
      ].join(';')
    ),
  ].join('\n');
  zip.file('declarations.csv', `\uFEFF${csvContent}`);

  // 2. Ajouter le fichier Excel
  const worksheetData = [
    csvHeaders,
    ...data.map((row) => [
      row.number || '-',
      row.company || '-',
      row.nber_employees || 0,
      new Date(row.created_on).toLocaleDateString('fr-FR'),
      row.status || '-',
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Déclarations');
  const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  zip.file('declarations.xlsx', excelBuffer);

  // 3. Ajouter le fichier JSON
  zip.file('declarations.json', JSON.stringify(data, null, 2));

  // 4. Ajouter un README
  const readmeContent = `Rapport des Déclarations
========================

Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
Nombre de déclarations: ${data.length}

Contenu du fichier ZIP:
- declarations.csv: Données au format CSV
- declarations.xlsx: Données au format Excel
- declarations.json: Données brutes au format JSON
- README.txt: Ce fichier
`;
  zip.file('README.txt', readmeContent);

  // Générer et télécharger le ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, filename);
};

const formatAmountForPdf = (raw) => {
  if (raw === undefined || raw === null || raw === '') return '-';
  // extraire uniquement les chiffres et le signe décimal si présent
  const numeric = parseFloat(String(raw).replace(/[^0-9.-]+/g, ''));
  if (isNaN(numeric)) return '-';
  // format fr sans décimales pour GNF (crée souvent des \u00A0)
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
  // remplacer espace insécable par espace normal pour jspdf-autotable
  const safe = formatted.replace(/\u00A0/g, ' ');
  return `${safe} FG`; // ou ' F G' si tu veux
};

// Helper pour formater les valeurs
const formatCellValue = (value, column) => {
  if (value === null || value === undefined) return '-';

  // Appliquer la traduction si disponible
  if (column.translate && column.translate[value]) {
    return column.translate[value];
  }

  // Formater les dates
  if (column.isDate) {
    try {
      return new Date(value).toLocaleDateString('fr-FR');
    } catch {
      return value;
    }
  }

  // Formater les montants
  if (column.isCurrency) {
    const cleaned = String(value).replace(/[^\d.,]/g, '');
    const numberValue = parseFloat(cleaned.replace(',', '.'));
    return !isNaN(numberValue) ? `${numberValue.toLocaleString('fr-FR')} FG` : '-';
  }

  return value;
};
export const exportToPDFM = async (data, columns, filename) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.text(`Rapport ${filename} `, 14, 20);

  // Préparer les données du tableau
  const tableData = data.map((row) => columns.map((col) => formatCellValue(row[col.key], col)));

  autoTable(doc, {
    head: [columns.map((col) => col.label)],
    body: tableData,
    startY: 35,
    styles: { fontSize: 10 },
    didDrawPage: (data) => {
      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.text(
        `Page ${currentPage} sur ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    },
  });

  doc.save(filename);
};

export const exportToCSVM = (data, columns, filename = 'export.csv') => {
  const BOM = '\uFEFF';
  const csvContent =
    BOM +
    [
      columns.map((c) => c.label).join(';'),
      ...data.map((row) =>
        columns
          .map((col) => {
            let value = row[col.key] ?? '';
            if (col.translate) value = col.translate[value] ?? value;
            if (col.isDate) value = new Date(value).toLocaleDateString('fr-FR');

            return value;
          })
          .join(';')
      ),
    ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

export const exportToExcelM = (data, columns, filename = 'export.xlsx') => {
  const worksheetData = [
    columns.map((c) => c.label),
    ...data.map((row) =>
      columns.map((col) => {
        let value = row[col.key] ?? '-';
        if (col.translate) value = col.translate[value] ?? value;
        if (col.isDate) value = new Date(value).toLocaleDateString('fr-FR');
        return value;
      })
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Données');

  // Ajuster largeur colonnes
  ws['!cols'] = columns.map(() => ({ wch: 15 }));

  XLSX.writeFile(wb, filename);
};

export const exportToZipM = async (data, columns, filename = 'export.zip') => {
  const zip = new JSZip();

  // CSV
  const csvContent = [columns.map((c) => c.label).join(';')]
    .concat(
      data.map((row) =>
        columns
          .map((col) => {
            let value = row[col.key] ?? '';
            if (col.translate) value = col.translate[value] ?? value;
            if (col.isDate) value = fDate(value);
            return value;
          })
          .join(';')
      )
    )
    .join('\n');
  zip.file('data.csv', `\uFEFF${csvContent}`);

  // Excel
  const worksheetData = [
    columns.map((c) => c.label),
    ...data.map((row) =>
      columns.map((col) => {
        let value = row[col.key] ?? '-';
        if (col.translate) value = col.translate[value] ?? value;
        if (col.isDate) value = new Date(value).toLocaleDateString('fr-FR');
        return value;
      })
    ),
  ];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Données');
  const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  zip.file('data.xlsx', excelBuffer);

  // JSON
  zip.file('data.json', JSON.stringify(data, null, 2));

  // README
  const readmeContent = `Rapport généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
Nombre d'enregistrements: ${data.length}
Contenu du ZIP: CSV, Excel, JSON`;
  zip.file('README.txt', readmeContent);

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, filename);
};
