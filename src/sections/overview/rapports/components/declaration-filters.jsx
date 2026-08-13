import { useCallback, useMemo } from 'react';
import Chip from '@mui/material/Chip';
import { fDate, fDateRangeShortLabel } from 'src/utils/format-time';
import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

const STATUS_TRANSLATIONS = {
  submitted: 'Soumise',
  validated: 'Validée',
  rejected: 'Rejetée',
  billed: 'Facturée',
  unsubmitted: 'Non soumise',
  processing: 'En traitement',
  paid: 'Payée',
  unpaid: 'Non payée',
  pending: 'En attente',
};

const PAYMENT_METHOD_TRANSLATIONS = {
  transfer: 'Virement',
  cheque: 'Chèque',
  deposit: 'Dépôts',
};

const SEXE_TRANSLATIONS = {
  male: 'Homme',
  female: 'Femme',
};

export function DeclarationreportFilters({
  isDeclaration,
  isFacture,
  isPaiement,
  isPermit,
  isEmployee,
  filters,
  totalResults,
  sx,
}) {
  // Handler générique pour supprimer un filtre
  const handleRemoveFilter = useCallback(
    (key, defaultValue = '') => {
      filters.setState({ [key]: defaultValue });
    },
    [filters]
  );

  // Handlers spécifiques
  const handleRemoveDate = useCallback(() => {
    filters.setState({ created_on_before: null, created_on_after: null });
  }, [filters]);

  const handleRemovePrintedDate = useCallback(() => {
    filters.setState({ printed_at_before: null, printed_at_after: null });
  }, [filters]);

  const handleRemoveStatus = useCallback(() => {
    handleRemoveFilter('status', 'all');
  }, [handleRemoveFilter]);

  const handleRemovePaymentMethod = useCallback(() => {
    handleRemoveFilter('payment_method', 'all');
  }, [handleRemoveFilter]);

  const handleRemovePermitType = useCallback(() => {
    handleRemoveFilter('permit_type', 'all');
  }, [handleRemoveFilter]);

  const handleRemoveSexe = useCallback(() => {
    handleRemoveFilter('sexe', 'all');
  }, [handleRemoveFilter]);

  const handleRemoveJob = useCallback(() => {
    handleRemoveFilter('job', null);
  }, [handleRemoveFilter]);

  const handleRemoveCountry = useCallback(() => {
    handleRemoveFilter('nationality', 'all');
  }, [handleRemoveFilter]);

  const handleRemoveName = useCallback(() => {
    handleRemoveFilter('name', '');
  }, [handleRemoveFilter]);

  const handleRemoveReference = useCallback(() => {
    handleRemoveFilter('reference', '');
  }, [handleRemoveFilter]);

  const handleRemoveCardNumber = useCallback(() => {
    handleRemoveFilter('card_number', '');
  }, [handleRemoveFilter]);

  const handleRemoveDeclarationNumber = useCallback(() => {
    handleRemoveFilter('declaration_number', '');
  }, [handleRemoveFilter]);

  const handleRemovePassport = useCallback(() => {
    handleRemoveFilter('passport', '');
  }, [handleRemoveFilter]);

  const handleRemovePassportNumber = useCallback(() => {
    handleRemoveFilter('passport_number', '');
  }, [handleRemoveFilter]);

  const handleRemoveCompany = useCallback(() => {
    handleRemoveFilter('company', '');
  }, [handleRemoveFilter]);

  const handleRemoveClient = useCallback(() => {
    handleRemoveFilter('client', '');
  }, [handleRemoveFilter]);

  const handleRemoveNumber = useCallback(() => {
    handleRemoveFilter('number', '');
  }, [handleRemoveFilter]);

  // Conditions d'affichage mémorisées
  const showDateFilter = useMemo(
    () => Boolean(filters.state.created_on_after && filters.state.created_on_before),
    [filters.state.created_on_after, filters.state.created_on_before]
  );

  // La plage d'impression accepte une seule borne, contrairement à la plage de création
  const printedDateLabel = useMemo(() => {
    const after = filters.state.printed_at_after;
    const before = filters.state.printed_at_before;

    if (after && before) return fDateRangeShortLabel(after, before);
    if (after) return `Depuis le ${fDate(after)}`;
    if (before) return `Jusqu'au ${fDate(before)}`;
    return '';
  }, [filters.state.printed_at_after, filters.state.printed_at_before]);

  const showStatusFilter = useMemo(
    () => filters.state.status && filters.state.status !== 'all',
    [filters.state.status]
  );

  const showPaymentMethodFilter = useMemo(
    () => filters.state.payment_method && filters.state.payment_method !== 'all',
    [filters.state.payment_method]
  );

  const showPermitTypeFilter = useMemo(
    () => filters.state.permit_type && filters.state.permit_type !== 'all',
    [filters.state.permit_type]
  );

  const showSexeFilter = useMemo(
    () => filters.state.sexe && filters.state.sexe !== 'all',
    [filters.state.sexe]
  );

  const showNationalityFilter = useMemo(
    () => filters.state.nationality && filters.state.nationality !== 'all',
    [filters.state.nationality]
  );

  // Fonction utilitaire pour déterminer si un champ de passeport est actif
  const showPassportFilter = useMemo(() => {
    if (isPermit) {
      return !!filters.state.passport_number;
    }
    if (isEmployee) {
      return !!filters.state.passport;
    }
    return false;
  }, [isPermit, isEmployee, filters.state.passport_number, filters.state.passport]);

  // Fonction utilitaire pour obtenir la valeur du passeport
  const getPassportValue = useCallback(() => {
    if (isPermit) {
      return filters.state.passport_number;
    }
    if (isEmployee) {
      return filters.state.passport;
    }
    return '';
  }, [isPermit, isEmployee, filters.state.passport_number, filters.state.passport]);

  // Handler pour supprimer le filtre passeport selon le type
  const handleRemovePassportFilter = useCallback(() => {
    if (isPermit) {
      handleRemovePassportNumber();
    } else if (isEmployee) {
      handleRemovePassport();
    }
  }, [isPermit, isEmployee, handleRemovePassportNumber, handleRemovePassport]);

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
      {/* Filtre Date */}
      <FiltersBlock label="Date:" isShow={showDateFilter}>
        <Chip
          {...chipProps}
          label={fDateRangeShortLabel(
            filters.state.created_on_after,
            filters.state.created_on_before
          )}
          onDelete={handleRemoveDate}
        />
      </FiltersBlock>

      {/* Filtre Statut */}
      <FiltersBlock label="Statut:" isShow={showStatusFilter}>
        <Chip
          {...chipProps}
          label={STATUS_TRANSLATIONS[filters.state.status] || filters.state.status}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      {/* Filtres communs pour Permis et Employés */}
      {(isPermit || isEmployee) && (
        <>
          <FiltersBlock label="Type de permis:" isShow={showPermitTypeFilter}>
            <Chip
              {...chipProps}
              label={filters.state.permit_type}
              onDelete={handleRemovePermitType}
              sx={{ textTransform: 'capitalize' }}
            />
          </FiltersBlock>

          <FiltersBlock label="Sexe:" isShow={showSexeFilter}>
            <Chip
              {...chipProps}
              label={SEXE_TRANSLATIONS[filters.state.sexe] || filters.state.sexe}
              onDelete={handleRemoveSexe}
              sx={{ textTransform: 'capitalize' }}
            />
          </FiltersBlock>

          <FiltersBlock label="Nationalité:" isShow={showNationalityFilter}>
            <Chip
              {...chipProps}
              label={filters.state.nationality}
              onDelete={handleRemoveCountry}
              sx={{ textTransform: 'capitalize' }}
            />
          </FiltersBlock>

          <FiltersBlock label="Fonction:" isShow={!!filters.state.job}>
            <Chip
              {...chipProps}
              label={filters.state.job?.label || filters.state.job}
              onDelete={handleRemoveJob}
              sx={{ textTransform: 'capitalize' }}
            />
          </FiltersBlock>

          <FiltersBlock label="Nom:" isShow={!!filters.state.name}>
            <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveName} />
          </FiltersBlock>

          <FiltersBlock label="Référence:" isShow={!!filters.state.reference}>
            <Chip {...chipProps} label={filters.state.reference} onDelete={handleRemoveReference} />
          </FiltersBlock>

          <FiltersBlock label="Numéro de passeport:" isShow={showPassportFilter}>
            <Chip {...chipProps} label={getPassportValue()} onDelete={handleRemovePassportFilter} />
          </FiltersBlock>

          {/* Numéro de carte uniquement pour les permis */}
          {isPermit && (
            <FiltersBlock label="Numéro de carte:" isShow={!!filters.state.card_number}>
              <Chip
                {...chipProps}
                label={filters.state.card_number}
                onDelete={handleRemoveCardNumber}
              />
            </FiltersBlock>
          )}

          {/* Date d'impression uniquement pour les permis */}
          {isPermit && (
            <FiltersBlock label="Date d'impression:" isShow={!!printedDateLabel}>
              <Chip {...chipProps} label={printedDateLabel} onDelete={handleRemovePrintedDate} />
            </FiltersBlock>
          )}

          <FiltersBlock label="Numéro de déclaration:" isShow={!!filters.state.declaration_number}>
            <Chip
              {...chipProps}
              label={filters.state.declaration_number}
              onDelete={handleRemoveDeclarationNumber}
            />
          </FiltersBlock>

          <FiltersBlock label="Entreprise:" isShow={!!filters.state.company}>
            <Chip {...chipProps} label={filters.state.company} onDelete={handleRemoveCompany} />
          </FiltersBlock>
        </>
      )}

      {/* Filtre Méthode de paiement */}
      {isPaiement && (
        <FiltersBlock label="Méthode de paiement:" isShow={showPaymentMethodFilter}>
          <Chip
            {...chipProps}
            label={
              PAYMENT_METHOD_TRANSLATIONS[filters.state.payment_method] ||
              filters.state.payment_method
            }
            onDelete={handleRemovePaymentMethod}
            sx={{ textTransform: 'capitalize' }}
          />
        </FiltersBlock>
      )}

      {/* Filtre Entreprise pour Déclaration (si pas déjà affiché) */}
      {isDeclaration && !isPermit && !isEmployee && (
        <FiltersBlock label="Entreprise:" isShow={!!filters.state.company}>
          <Chip {...chipProps} label={filters.state.company} onDelete={handleRemoveCompany} />
        </FiltersBlock>
      )}

      {/* Filtre Client pour Facture et Paiement */}
      {(isFacture || isPaiement) && (
        <FiltersBlock label="Entreprise:" isShow={!!filters.state.client}>
          <Chip {...chipProps} label={filters.state.client} onDelete={handleRemoveClient} />
        </FiltersBlock>
      )}

      {/* Filtre Numéro (pour les autres types) */}
      {!isPermit && !isEmployee && (
        <FiltersBlock label="Numéro:" isShow={!!filters.state.number}>
          <Chip {...chipProps} label={filters.state.number} onDelete={handleRemoveNumber} />
        </FiltersBlock>
      )}
    </FiltersResult>
  );
}
