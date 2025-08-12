'use client';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { fCurrency, fGNF, fEuro } from 'src/utils/format-number';
import { amountToWords } from 'src/utils/number-to-words';
import { forwardRef } from 'react';


const TEMPLATE_URL = '/pdf/facture-pdf.pdf';

function sanitize(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\u202F/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\u2009/g, ' ')
    .replace(/\u2007/g, ' ');
}

export const FacturePrint = forwardRef(async ({ facture, devise }, ref) => {
  const arrayBuffer = await fetch(TEMPLATE_URL).then(res => {
    if (!res.ok) throw new Error(`Impossible de charger le template (${res.status})`);
    return res.arrayBuffer();
  });

  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.getPage(0);

  // Espacements spécifiques par section
  const invoiceTopGap = 110;         // espace du haut au titre facture
  const invoiceToClientGap = 30;     // gap entre facture et bloc client
  const clientInfoLineGap = 16;      // interligne infos client
  const invoiceToDateGap = 35;       // gap entre facture et bloc dates
  const dateInfoLineGap = 16;        // interligne infos dates
  const dateToSeparatorGap = 35;     // gap avant ligne séparatrice
  const separatorToHeaderGap = 20;   // gap ligne->header tableau
  const headerLineGap = 25;          // interligne header->lignes data
  const dataLineGap = 24;            // interligne des lignes de données
  const dataToTotalGap = 10;         // gap avant TOTAL GENERAL
  const totalBoxPadding = 8;         // padding haut/bas de la box total
  const totalFontSize = 16;          // taille police total
  const totalToWordsGap = 70;        // gap avant montant en lettres
  const wordsToQrGap = 120;           // gap avant QR/signature

  // Couleurs & tailles
  const baseSize = 12;
  const headerSize = 14;
  const black = rgb(0, 0, 0);
  const blue = rgb(0, 0, 0.8);
  const red = rgb(0.8, 0, 0);
  const pinkBg = rgb(0.95, 0.9, 0.9);

  // Formatage montants
  const formatMontant = value => sanitize(
    devise === 'GNF' ? fGNF(value)
    : devise === 'USD' ? fCurrency(value / 9200)
    : devise === 'EUR' ? fEuro(value / 10000)
    : String(value)
  );

  // 1. Titre facture
  let cursorY = page.getHeight() - invoiceTopGap;
  const invoiceText = `FACTURE N° ${facture.number}`;
  page.drawText(invoiceText, { x: 200, y: cursorY, size: headerSize, font: helveticaBold, color: black });
  const invW = helveticaBold.widthOfTextAtSize(invoiceText, headerSize);
  page.drawLine({ start: { x: 200, y: cursorY - 2 }, end: { x: 200 + invW, y: cursorY - 2 }, thickness: 1, color: black });

  // 2. Bloc CLIENT
  cursorY -= invoiceToClientGap;
  const leftX = 50;
  page.drawText('CLIENT', { x: leftX, y: cursorY, size: baseSize, font: helvetica, color: blue });
  const cW = helvetica.widthOfTextAtSize('CLIENT', baseSize);
  page.drawLine({ start: { x: leftX, y: cursorY - 2 }, end: { x: leftX + cW, y: cursorY - 2 }, thickness: 0.5, color: blue });

  cursorY -= clientInfoLineGap;
  [
    facture.client_name,
    `Tél : ${facture.client_contact}`,
    `Adresse : ${facture.client_adresse}`,
    `Région : ${facture.client_location}`
  ].forEach(line => {
    page.drawText(line, { x: leftX, y: cursorY, size: baseSize, font: helvetica, color: black });
    cursorY -= clientInfoLineGap;
  });

  // 3. Bloc Dates
  cursorY = page.getHeight() - invoiceTopGap - invoiceToDateGap;
  const rightX = 400;
  const formatDate = ds => {
    const d = new Date(ds);
    const j = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const a = d.getFullYear();
    return `${j}/${m}/${a}`;
  };
  [
    ['Date facture : ', facture.created_on],
    ['Declaration N : ', facture.declaration_number],
    ['Date declaration : ', facture.date_declaration]
  ].forEach(([label, val]) => {
    const displayVal = label.includes('Date') ? formatDate(val) : val;
    page.drawText(label, { x: rightX, y: cursorY, size: baseSize, font: helvetica, color: red });
    page.drawText(displayVal, { x: rightX + helvetica.widthOfTextAtSize(label, baseSize), y: cursorY, size: baseSize, font: helvetica, color: black });
    cursorY -= dateInfoLineGap;
  });

  // 4. Ligne séparatrice
  const lineY = cursorY - dateToSeparatorGap;
  page.drawLine({ start: { x: 49, y: lineY }, end: { x: 550, y: lineY }, thickness: 0.5, color: black });

  // 5. Headers tableau
  const headerY = lineY - separatorToHeaderGap;
  ['Catégorie de permis','Quantité','Prix unitaire','Total'].forEach((h, i) => {
    page.drawText(h, { x: 55 + i*140, y: headerY, size: baseSize, font: helvetica, color: red });
  });
  page.drawLine({ start: { x: 49, y: headerY - 6 }, end: { x: 550, y: headerY - 6 }, thickness: 1.5, color: black });

  // 6. Lignes de données
  let rowY = headerY - headerLineGap;
  facture.permits.filter(r => r.count > 0).forEach(r => {
    page.drawText(`Permis ${r.type}`, { x: 70, y: rowY, size: baseSize, font: helvetica, color: black });
    page.drawText(`${r.count}`, { x: 210, y: rowY, size: baseSize, font: helvetica, color: black });
    page.drawText(formatMontant(r.price), { x: 340, y: rowY, size: baseSize, font: helvetica, color: black });
    page.drawText(formatMontant(r.total_price), { x: 480, y: rowY, size: baseSize, font: helvetica, color: black });
    rowY -= dataLineGap;
  });

  // 7. TOTAL GENERAL
  rowY -= dataToTotalGap;
  page.drawRectangle({ x: 49, y: rowY - totalBoxPadding, width: 510, height: totalFontSize + totalBoxPadding*2, color: pinkBg });
  page.drawText('TOTAL GENERAL', { x: 50, y: rowY, size: totalFontSize, font: helveticaBold, color: black });
  page.drawText(formatMontant(facture.amount), { x: 450, y: rowY, size: totalFontSize, font: helveticaBold, color: black });

  // 8. Montant en lettres
  rowY -= totalToWordsGap;
  const phr = 'Arrêté la présente facture à la somme de : ';
  const formattedAmount = formatMontant(facture.amount);
  const numericAmount = Number(formattedAmount.replace(/[^0-9]/g, '').replace(/,/g, ''));
  const words = sanitize(amountToWords(numericAmount, devise));
  page.drawText(phr, { x: 40, y: rowY, size: baseSize, font: helvetica, color: black });
  const phrW = helvetica.widthOfTextAtSize(phr, baseSize);
  page.drawText(words, { x: 40 + phrW, y: rowY, size: baseSize, font: helveticaBold, color: black });
  const fullW = phrW + helveticaBold.widthOfTextAtSize(words, baseSize);
  page.drawLine({ start: { x: 40, y: rowY - 2 }, end: { x: 40 + fullW, y: rowY - 2 }, thickness: 0.5, color: black });

  // 9. QR & Signature
  rowY -= wordsToQrGap;
  const qrData = facture.number;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=100x100`;
  const qrBytes = await fetch(qrUrl).then(r => { if (!r.ok) throw new Error(`Erreur chargement QR (${r.status})`); return r.arrayBuffer(); });
  const qrImg = await pdfDoc.embedPng(qrBytes);
  page.drawImage(qrImg, { x: 50, y: rowY, width: 100, height: 100 });

  const sign = 'LE DIRECTEUR';
  page.drawText(sign, { x: 450, y: rowY + 80, size: baseSize, font: helvetica, color: black });
  const sW = helvetica.widthOfTextAtSize(sign, baseSize);
  page.drawLine({ start: { x: 450, y: rowY + 78 }, end: { x: 450 + sW, y: rowY + 78 }, thickness: 0.5, color: black });

  // Sauvegarde et téléchargement
  // const pdfBytes = await pdfDoc.save();
  // saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `Facture_${facture.number}.pdf`);
})