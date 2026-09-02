import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { amountToWords } from 'src/utils/number-to-words';

import {
  formatFactureAmount,
  formatFacturePdfDate,
  getFactureCurrencyAmount,
  getFactureCurrencySign,
  parseFactureAmount,
} from './facture-utils';

const TEMPLATE_URL = '/pdf/facture-pdf.pdf';

function sanitize(text) {
  if (typeof text !== 'string') return text;

  return text
    .replace(/\u202F/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\u2009/g, ' ')
    .replace(/\u2007/g, ' ');
}

function wrapText(text, maxWidth, font, fontSize) {
  const normalizedText = String(text || '')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  const words = normalizedText.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export async function generateFacturePDFInit(facture, devise, { download = true } = {}) {
  const arrayBuffer = await fetch(TEMPLATE_URL).then((res) => {
    if (!res.ok) throw new Error(`Impossible de charger le template (${res.status})`);
    return res.arrayBuffer();
  });

  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.getPage(0);

  const invoiceTopGap = 110;
  const invoiceToClientGap = 30;
  const clientInfoLineGap = 16;
  const invoiceToDateGap = 35;
  const dateInfoLineGap = 16;
  const dateToSeparatorGap = 35;
  const separatorToHeaderGap = 20;
  const headerLineGap = 25;
  const dataLineGap = 24;
  const dataToTotalGap = 10;
  const totalBoxPadding = 8;
  const totalFontSize = 16;
  const totalToWordsGap = 70;
  const wordsToQrGap = 120;

  const baseSize = 12;
  const headerSize = 14;
  const black = rgb(0, 0, 0);
  const red = rgb(0.8, 0, 0);
  const pinkBg = rgb(0.95, 0.9, 0.9);

  const currency = getFactureCurrencySign(devise);
  const invoiceAmount = parseFactureAmount(facture?.amount);
  const invoiceCurrencyAmount = getFactureCurrencyAmount(invoiceAmount, currency);
  const permits = Array.isArray(facture?.permits) ? facture.permits : [];
  const formatMontant = (value) => sanitize(formatFactureAmount(value, devise));

  let cursorY = page.getHeight() - invoiceTopGap;
  const invoiceText = `FACTURE N° ${facture?.number || '-'}`;

  page.drawText(invoiceText, {
    x: 200,
    y: cursorY,
    size: headerSize,
    font: helveticaBold,
    color: black,
  });

  const invoiceWidth = helveticaBold.widthOfTextAtSize(invoiceText, headerSize);

  page.drawLine({
    start: { x: 200, y: cursorY - 2 },
    end: { x: 200 + invoiceWidth, y: cursorY - 2 },
    thickness: 1,
    color: black,
  });

  cursorY -= invoiceToClientGap;
  const leftX = 50;

  page.drawText('CLIENT', { x: leftX, y: cursorY, size: baseSize, font: helvetica, color: black });

  const clientHeaderWidth = helvetica.widthOfTextAtSize('CLIENT', baseSize);

  page.drawLine({
    start: { x: leftX, y: cursorY - 2 },
    end: { x: leftX + clientHeaderWidth, y: cursorY - 2 },
    thickness: 0.5,
    color: black,
  });

  cursorY -= clientInfoLineGap;

  const clientLines = [
    { text: facture?.client_name || '-', bold: true },
    { text: `Tel : ${facture?.client_contact || '-'}`, bold: false },
    ...wrapText(`Adresse : ${facture?.client_adresse || '-'}`, 250, helvetica, baseSize).map(
      (line) => ({
        text: line,
        bold: false,
      })
    ),
    { text: `Region : ${facture?.client_location || '-'}`, bold: false },
  ];

  clientLines.forEach((line) => {
    page.drawText(sanitize(line.text), {
      x: leftX,
      y: cursorY,
      size: baseSize,
      font: line.bold ? helveticaBold : helvetica,
      color: black,
    });
    cursorY -= clientInfoLineGap;
  });

  cursorY = page.getHeight() - invoiceTopGap - invoiceToDateGap;
  const rightX = 400;
  const dateEntries = [
    ['Date facture : ', facture?.created_on],
    ['Declaration N : ', facture?.declaration_number || facture?.declarations?.[0]?.number || '-'],
    [
      'Date declaration : ',
      facture?.declaration_date || facture?.declarations?.[0]?.created_on || null,
    ],
  ];

  dateEntries.forEach(([label, value]) => {
    const displayValue = label.includes('Date')
      ? formatFacturePdfDate(value)
      : sanitize(String(value || '-'));

    page.drawText(label, { x: rightX, y: cursorY, size: baseSize, font: helvetica, color: red });
    page.drawText(displayValue, {
      x: rightX + helvetica.widthOfTextAtSize(label, baseSize),
      y: cursorY,
      size: baseSize,
      font: helvetica,
      color: black,
    });
    cursorY -= dateInfoLineGap;
  });

  const lineY = cursorY - dateToSeparatorGap;

  page.drawLine({
    start: { x: 49, y: lineY },
    end: { x: 550, y: lineY },
    thickness: 0.5,
    color: black,
  });

  const headerY = lineY - separatorToHeaderGap;

  ['Categorie de permis', 'Quantite', 'Prix unitaire', 'Total'].forEach((label, index) => {
    page.drawText(label, {
      x: 55 + index * 140,
      y: headerY,
      size: baseSize,
      font: helvetica,
      color: red,
    });
  });

  page.drawLine({
    start: { x: 49, y: headerY - 6 },
    end: { x: 550, y: headerY - 6 },
    thickness: 1.5,
    color: black,
  });

  let rowY = headerY - headerLineGap;

  permits
    .filter((permit) => parseFactureAmount(permit?.count) > 0)
    .forEach((permit) => {
      page.drawText(`Permis ${permit?.type || ''}`, {
        x: 70,
        y: rowY,
        size: baseSize,
        font: helvetica,
        color: black,
      });
      page.drawText(`${parseFactureAmount(permit?.count)}`, {
        x: 210,
        y: rowY,
        size: baseSize,
        font: helvetica,
        color: black,
      });
      page.drawText(formatMontant(parseFactureAmount(permit?.price)), {
        x: 340,
        y: rowY,
        size: baseSize,
        font: helvetica,
        color: black,
      });
      page.drawText(formatMontant(parseFactureAmount(permit?.total_price)), {
        x: 480,
        y: rowY,
        size: baseSize,
        font: helvetica,
        color: black,
      });
      rowY -= dataLineGap;
    });

  rowY -= dataToTotalGap;

  page.drawRectangle({
    x: 49,
    y: rowY - totalBoxPadding,
    width: 510,
    height: totalFontSize + totalBoxPadding * 2,
    color: pinkBg,
  });

  page.drawText('TOTAL GENERAL', {
    x: 50,
    y: rowY,
    size: totalFontSize,
    font: helveticaBold,
    color: black,
  });

  page.drawText(formatMontant(invoiceAmount), {
    x: 450,
    y: rowY,
    size: totalFontSize,
    font: helveticaBold,
    color: black,
  });

  rowY -= totalToWordsGap;
  const amountLabel = 'Arrete la presente facture a la somme de : ';
  const words = sanitize(amountToWords(invoiceCurrencyAmount, currency));

  page.drawText(amountLabel, { x: 40, y: rowY, size: baseSize, font: helvetica, color: black });

  const amountLabelWidth = helvetica.widthOfTextAtSize(amountLabel, baseSize);

  page.drawText(words, {
    x: 40 + amountLabelWidth,
    y: rowY,
    size: baseSize,
    font: helveticaBold,
    color: black,
  });

  const fullLabelWidth = amountLabelWidth + helveticaBold.widthOfTextAtSize(words, baseSize);

  page.drawLine({
    start: { x: 40, y: rowY - 2 },
    end: { x: 40 + fullLabelWidth, y: rowY - 2 },
    thickness: 0.5,
    color: black,
  });

  rowY -= wordsToQrGap;
  const qrData = facture?.number || facture?.reference || 'facture';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=80x80`;
  const qrBytes = await fetch(qrUrl).then((response) => {
    if (!response.ok) throw new Error(`Erreur chargement QR (${response.status})`);
    return response.arrayBuffer();
  });

  const qrImg = await pdfDoc.embedPng(qrBytes);
  page.drawImage(qrImg, { x: 50, y: rowY, width: 100, height: 100 });

  const sign = 'LA DIRECTION';

  page.drawText(sign, { x: 450, y: rowY + 80, size: baseSize, font: helvetica, color: black });

  const signatureWidth = helvetica.widthOfTextAtSize(sign, baseSize);

  page.drawLine({
    start: { x: 450, y: rowY + 78 },
    end: { x: 450 + signatureWidth, y: rowY + 78 },
    thickness: 0.5,
    color: black,
  });

  const pdfBytes = await pdfDoc.save();

  if (download) {
    saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `Facture_${facture?.number}.pdf`);
  }

  return pdfBytes;
}
