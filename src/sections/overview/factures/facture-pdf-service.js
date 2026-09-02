import { generateFacturePDF } from './facture-pdf';
import { generateFacturePDFInit } from './facture-pdf-init';
import { getFactureKind } from './facture-utils';

export function generateFactureDocument(facture, devise, options) {
  return getFactureKind(facture) === 'permit'
    ? generateFacturePDFInit(facture, devise, options)
    : generateFacturePDF(facture, devise, options);
}
