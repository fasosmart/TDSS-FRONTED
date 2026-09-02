import { fCurrency, fEuro, fGNF } from 'src/utils/format-number';

export function getFactureCurrencySign(devise) {
  if (!devise) return 'GNF';

  if (typeof devise === 'string') {
    return devise;
  }

  return devise?.sign || devise?.code || devise?.name || 'GNF';
}

export function parseFactureAmount(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (typeof value === 'object') {
    const parsed = Number(
      value?.parsedValue ?? value?.value ?? value?.source ?? value?.amount ?? value?.total ?? 0
    );

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function isPenaltyFacture(facture) {
  return Boolean(facture?.penalty);
}

export function hasDeclarationFactureItems(facture) {
  return Array.isArray(facture?.declarations) && facture.declarations.length > 0;
}

export function hasPermitFactureItems(facture) {
  return (
    Array.isArray(facture?.permits) &&
    facture.permits.some((item) => parseFactureAmount(item?.count) > 0)
  );
}

export function getFactureKind(facture) {
  if (isPenaltyFacture(facture)) {
    return 'penalty';
  }

  if (hasDeclarationFactureItems(facture)) {
    return 'declaration';
  }

  return 'permit';
}

export function formatFactureAmount(value, devise) {
  const currency = getFactureCurrencySign(devise);
  const amount = getFactureCurrencyAmount(value, currency);

  if (currency === 'USD') {
    return fCurrency(amount);
  }

  if (currency === 'EUR') {
    return fEuro(amount);
  }

  return fGNF(amount);
}

export function getFactureCurrencyAmount(value, devise) {
  const currency = getFactureCurrencySign(devise);
  const amount = parseFactureAmount(value);

  if (currency === 'USD') {
    return amount / 9200;
  }

  if (currency === 'EUR') {
    return amount / 10000;
  }

  return amount;
}

export function formatFacturePdfDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
