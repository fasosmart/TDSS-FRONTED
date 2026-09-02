export const PENALITE_TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'NO_PERMIT', label: 'Travail sans permis' },
  { value: 'EXPIRED_PERMIT', label: 'Travail avec permis expire' },
  { value: 'LATE_PAYMENT', label: 'Retard de paiement de facture' },
];

export const PENALITE_STATUS_OPTIONS = [
  { value: 'all', label: 'Toutes', color: 'default' },
  { value: 'OPEN', label: 'Ouvertes', color: 'warning' },
  { value: 'BILLED', label: 'Facturees', color: 'success' },
  { value: 'PAID', label: 'Payees', color: 'success' },
  { value: 'CANCELLED', label: 'Annulees', color: 'error' },
  // { value: 'CLOSED', label: 'Cloturees', color: 'default' },
];

export function getPenaltyTypeLabel(value) {
  return PENALITE_TYPE_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function getPenaltyStatusLabel(value) {
  const normalizedValue = value === 'CANCELED' ? 'CANCELLED' : value;
  return (
    PENALITE_STATUS_OPTIONS.find((option) => option.value === normalizedValue)?.label ||
    normalizedValue
  );
}
