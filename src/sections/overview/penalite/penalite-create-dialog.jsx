'use client';

import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import LoadingButton from '@mui/lab/LoadingButton';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import API from 'src/utils/api';
import axios from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Field, Form } from 'src/components/hook-form';

import { PENALITE_TYPE_OPTIONS } from './penalite-filter-options';

const PENALITE_CREATE_TYPE_OPTIONS = PENALITE_TYPE_OPTIONS.filter((option) => !!option.value);
const EMPLOYEE_LOOKUP_DEFAULT_HELPER = "Saisissez l'email de l'employe pour le rechercher.";

const PenaliteCreateSchema = zod
  .object({
    company: zod.string().min(1, { message: "Veuillez selectionner l'entreprise." }),
    type: zod.enum(['NO_PERMIT', 'EXPIRED_PERMIT', 'LATE_PAYMENT'], {
      required_error: 'Le type est obligatoire.',
      invalid_type_error: 'Le type est obligatoire.',
    }),
    employee_email: zod.string(),
    employee: zod.string(),
    permit: zod.string(),
    source_invoice: zod.string(),
    description: zod.string(),
    infraction_date: zod
      .string()
      .min(1, { message: "La date de l'infraction est obligatoire." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "La date de l'infraction est invalide." }),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'NO_PERMIT') {
      if (!data.employee_email.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          path: ['employee_email'],
          message: "Veuillez saisir l'email de l'employe.",
        });
      } else if (!zod.string().email().safeParse(data.employee_email).success) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          path: ['employee_email'],
          message: "L'email de l'employe est invalide.",
        });
      } else if (!data.employee) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          path: ['employee_email'],
          message: "Aucun employe n'a ete trouve pour cet email.",
        });
      }
    }

    if (data.type === 'EXPIRED_PERMIT' && !data.permit) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ['permit'],
        message: 'Veuillez selectionner un permis.',
      });
    }

    if (data.type === 'LATE_PAYMENT' && !data.source_invoice) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ['source_invoice'],
        message: 'Veuillez selectionner une facture source.',
      });
    }
  });

const getDefaultValues = () => ({
  company: '',
  type: 'NO_PERMIT',
  employee_email: '',
  employee: '',
  permit: '',
  source_invoice: '',
  description: '',
  infraction_date: new Date().toISOString().slice(0, 10),
});

function extractErrorMessage(error) {
  const fallback = 'Erreur lors de la creation de la penalite.';
  const data = error?.response?.data;

  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.filter(Boolean).join(' ') || fallback;

  if (typeof data === 'object') {
    const messages = Object.entries(data).flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value.map((message) => `${field}: ${message}`);
      }

      return value ? [`${field}: ${value}`] : [];
    });

    return messages.join(' ') || fallback;
  }

  return fallback;
}

export function PenaliteCreateDialog({
  open,
  onClose,
  onCreated,
  companies = [],
  loadingCompanies = false,
}) {
  const employeeLookupRequestIdRef = useRef(0);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [permits, setPermits] = useState([]);
  const [loadingPermits, setLoadingPermits] = useState(false);
  const [loadingEmployeeLookup, setLoadingEmployeeLookup] = useState(false);
  const [employeeLookupHelper, setEmployeeLookupHelper] = useState(EMPLOYEE_LOOKUP_DEFAULT_HELPER);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(PenaliteCreateSchema),
    defaultValues: getDefaultValues(),
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    clearErrors,
    trigger,
    formState: { isSubmitting, errors },
  } = methods;

  useEffect(() => {
    if (!open) return;
    reset(getDefaultValues());
    clearErrors(['employee_email', 'employee']);
    setLoadingEmployeeLookup(false);
    setEmployeeLookupHelper(EMPLOYEE_LOOKUP_DEFAULT_HELPER);
  }, [clearErrors, open, reset]);

  const handleClose = () => {
    if (isSubmitting) return;
    reset(getDefaultValues());
    clearErrors(['employee_email', 'employee']);
    setEmployeeLookupHelper(EMPLOYEE_LOOKUP_DEFAULT_HELPER);
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { employee_email, ...payload } = data;

      await axios.post(API.createPenalty(), payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success('Penalite creee avec succes.');
      reset(getDefaultValues());
      clearErrors(['employee_email', 'employee']);
      setEmployeeLookupHelper(EMPLOYEE_LOOKUP_DEFAULT_HELPER);
      onClose();
      onCreated?.();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  });

  const selectedCompanySlug = watch('company');
  const selectedCompany =
    companies.find((company) => company.value === selectedCompanySlug) || null;
  const selectedType = watch('type');
  const employeeEmail = watch('employee_email');
  const selectedInvoiceSlug = watch('source_invoice');
  const selectedInvoice = invoices.find((invoice) => invoice.value === selectedInvoiceSlug) || null;

  useEffect(() => {
    if (!open) return;

    if (selectedType !== 'NO_PERMIT') {
      setValue('employee_email', '', { shouldValidate: true });
      setValue('employee', '', { shouldValidate: true });
      setLoadingEmployeeLookup(false);
      setEmployeeLookupHelper(EMPLOYEE_LOOKUP_DEFAULT_HELPER);
      clearErrors(['employee_email', 'employee']);
    }
  }, [clearErrors, open, selectedType, setValue]);

  useEffect(() => {
    let isMounted = true;

    const lookupEmployeeByEmail = async () => {
      if (!open || selectedType !== 'NO_PERMIT') return;

      const trimmedEmail = employeeEmail.trim();
      const isValidEmail = zod.string().email().safeParse(trimmedEmail).success;

      if (!trimmedEmail) {
        setValue('employee', '', { shouldValidate: false });
        clearErrors(['employee_email', 'employee']);
        setLoadingEmployeeLookup(false);
        setEmployeeLookupHelper(EMPLOYEE_LOOKUP_DEFAULT_HELPER);
        return;
      }

      if (!isValidEmail) {
        setValue('employee', '', { shouldValidate: false });
        clearErrors(['employee_email', 'employee']);
        setLoadingEmployeeLookup(false);
        setEmployeeLookupHelper(EMPLOYEE_LOOKUP_DEFAULT_HELPER);
        return;
      }

      const requestId = employeeLookupRequestIdRef.current + 1;
      employeeLookupRequestIdRef.current = requestId;

      setLoadingEmployeeLookup(true);
      clearErrors(['employee_email', 'employee']);
      setEmployeeLookupHelper("Recherche de l'employe...");

      try {
        const response = await axios.get(API.listEmployee(), {
          params: {
            offset: 0,
            limit: 1,
            email: trimmedEmail,
          },
        });

        if (!isMounted || requestId !== employeeLookupRequestIdRef.current) return;

        const employee = response?.data?.results?.[0];

        if (!employee?.slug) {
          setValue('employee', '', { shouldValidate: false });
          clearErrors(['employee_email', 'employee']);
          setEmployeeLookupHelper("Aucun employe n'a ete trouve pour cet email.");
          return;
        }

        setValue('employee', employee.slug, { shouldValidate: false });
        clearErrors(['employee_email', 'employee']);
        await trigger(['employee_email', 'employee']);
        setEmployeeLookupHelper(formatEmployeeLookupHelper(employee));
      } catch (error) {
        if (!isMounted || requestId !== employeeLookupRequestIdRef.current) return;

        console.error("Erreur lors de la recherche de l'employe:", error);
        setValue('employee', '', { shouldValidate: false });
        clearErrors(['employee_email', 'employee']);
        setEmployeeLookupHelper("Impossible de verifier cet email pour l'instant.");
      } finally {
        if (isMounted && requestId === employeeLookupRequestIdRef.current) {
          setLoadingEmployeeLookup(false);
        }
      }
    };

    lookupEmployeeByEmail();

    return () => {
      isMounted = false;
    };
  }, [clearErrors, employeeEmail, open, selectedType, setValue, trigger]);

  useEffect(() => {
    let isMounted = true;

    const loadPermits = async () => {
      if (!open) return;

      if (selectedType !== 'EXPIRED_PERMIT' || !selectedCompany?.label) {
        setPermits([]);
        setLoadingPermits(false);
        setValue('permit', '', { shouldValidate: true });
        return;
      }

      setLoadingPermits(true);

      try {
        const baseParams = {
          offset: 0,
          limit: 100,
          company: selectedCompany.label,
        };

        const firstResponse = await axios.get(API.listPermitsEmployees(), {
          params: baseParams,
        });

        if (!isMounted) return;

        const total = firstResponse?.data?.count || 0;
        const initialResults = firstResponse?.data?.results || [];

        if (total > initialResults.length) {
          const fullResponse = await axios.get(API.listPermitsEmployees(), {
            params: { ...baseParams, limit: total },
          });

          if (!isMounted) return;

          setPermits(mapPermitOptions(fullResponse?.data?.results || []));
        } else {
          setPermits(mapPermitOptions(initialResults));
        }

        setValue('permit', '', { shouldValidate: true });
      } catch (error) {
        if (!isMounted) return;

        console.error('Erreur lors du chargement des permis employes:', error);
        toast.error("Impossible de charger la liste des permis de l'entreprise.");
        setPermits([]);
        setValue('permit', '', { shouldValidate: true });
      } finally {
        if (isMounted) {
          setLoadingPermits(false);
        }
      }
    };

    loadPermits();

    return () => {
      isMounted = false;
    };
  }, [open, selectedCompany?.label, selectedType, setValue]);

  useEffect(() => {
    let isMounted = true;

    const loadInvoices = async () => {
      if (!open) return;

      if (selectedType !== 'LATE_PAYMENT' || !selectedCompany?.label) {
        setInvoices([]);
        setLoadingInvoices(false);
        setValue('source_invoice', '', { shouldValidate: true });
        return;
      }

      setLoadingInvoices(true);

      try {
        const baseParams = {
          offset: 0,
          limit: 100,
          company: selectedCompany.label,
        };

        const firstResponse = await axios.get(API.listFactures(), {
          params: baseParams,
        });

        if (!isMounted) return;

        const total = firstResponse?.data?.count || 0;
        const initialResults = firstResponse?.data?.results || [];

        if (total > initialResults.length) {
          const fullResponse = await axios.get(API.listFactures(), {
            params: { ...baseParams, limit: total },
          });

          if (!isMounted) return;

          setInvoices(mapInvoiceOptions(fullResponse?.data?.results || []));
        } else {
          setInvoices(mapInvoiceOptions(initialResults));
        }

        setValue('source_invoice', '', { shouldValidate: true });
      } catch (error) {
        if (!isMounted) return;

        console.error('Erreur lors du chargement des factures:', error);
        toast.error("Impossible de charger la liste des factures de l'entreprise.");
        setInvoices([]);
        setValue('source_invoice', '', { shouldValidate: true });
      } finally {
        if (isMounted) {
          setLoadingInvoices(false);
        }
      }
    };

    loadInvoices();

    return () => {
      isMounted = false;
    };
  }, [open, selectedCompany?.label, selectedType, setValue]);

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={handleClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Ajouter une penalite</DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              mt: 1,
              gap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <Autocomplete
              options={companies}
              loading={loadingCompanies}
              fullWidth
              value={selectedCompany}
              getOptionLabel={(option) => option?.label || ''}
              isOptionEqualToValue={(option, value) => option.value === value?.value}
              filterOptions={(options, state) =>
                options.filter((option) =>
                  option.label?.toLowerCase().includes(state.inputValue.trim().toLowerCase())
                )
              }
              onChange={(event, option) => {
                setValue('company', option?.value || '', { shouldValidate: true });
                setValue('employee_email', '', { shouldValidate: false });
                setValue('employee', '', { shouldValidate: false });
                setValue('permit', '', { shouldValidate: true });
                setValue('source_invoice', '', { shouldValidate: true });
                clearErrors(['employee_email', 'employee']);
                setEmployeeLookupHelper(EMPLOYEE_LOOKUP_DEFAULT_HELPER);
              }}
              renderOption={(props, option, { index }) => (
                <li {...props} key={`${option.value}-${index}`}>
                  {option.label}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Entreprise"
                  error={!!errors.company}
                  helperText={errors.company?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingCompanies ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText="Aucune entreprise trouvee"
              loadingText="Chargement..."
            />

            <Field.Select required name="type" label="Type">
              {PENALITE_CREATE_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>

            {selectedType === 'NO_PERMIT' && (
              <TextField
                fullWidth
                name="employee_email"
                label="Email de l'employe"
                type="email"
                value={employeeEmail}
                onChange={(event) => {
                  setValue('employee_email', event.target.value, { shouldValidate: false });
                  setValue('employee', '', { shouldValidate: false });
                  clearErrors(['employee_email', 'employee']);
                }}
                placeholder="exemple@entreprise.com"
                error={!!errors.employee_email}
                helperText={errors.employee_email?.message || employeeLookupHelper}
                InputProps={{
                  endAdornment: (
                    <>
                      {loadingEmployeeLookup ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                    </>
                  ),
                }}
              />
            )}

            {selectedType === 'EXPIRED_PERMIT' && (
              <TextField
                select
                fullWidth
                name="permit"
                label="Permis"
                value={watch('permit')}
                onChange={(event) => {
                  setValue('permit', event.target.value, { shouldValidate: true });
                }}
                error={!!errors.permit}
                helperText={
                  errors.permit?.message ||
                  (!selectedCompany
                    ? "Choisissez d'abord une entreprise."
                    : 'Selectionnez un permis.')
                }
                disabled={!selectedCompany || loadingPermits}
              >
                <MenuItem value="">Selectionner un permis</MenuItem>
                {permits.map((permit) => (
                  <MenuItem key={permit.value} value={permit.value}>
                    {permit.label}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {selectedType === 'LATE_PAYMENT' && (
              <Autocomplete
                options={invoices}
                loading={loadingInvoices}
                fullWidth
                disabled={!selectedCompany}
                value={selectedInvoice}
                getOptionLabel={(option) => option?.label || ''}
                isOptionEqualToValue={(option, value) => option.value === value?.value}
                filterOptions={(options, state) =>
                  options.filter((option) =>
                    option.label?.toLowerCase().includes(state.inputValue.trim().toLowerCase())
                  )
                }
                onChange={(event, option) => {
                  setValue('source_invoice', option?.value || '', { shouldValidate: true });
                }}
                renderOption={(props, option, { index }) => (
                  <li {...props} key={`${option.value}-${index}`}>
                    {option.label}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="Facture source"
                    placeholder={
                      selectedCompany
                        ? 'Selectionner une facture'
                        : "Choisissez d'abord une entreprise"
                    }
                    error={!!errors.source_invoice}
                    helperText={errors.source_invoice?.message}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingInvoices ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                noOptionsText="Aucune facture trouvee"
                loadingText="Chargement..."
              />
            )}

            <Field.DatePicker
              name="infraction_date"
              label="Date de l'infraction"
              slotProps={{
                textField: {
                  required: true,
                  fullWidth: true,
                },
              }}
            />

            <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
              <Field.Text name="description" label="Description" multiline rows={4} />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>
            Annuler
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Ajouter
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

function mapInvoiceOptions(items) {
  return items.map((invoice) => ({
    value: invoice.slug,
    label: [invoice.number, invoice.declaration_number, invoice.client || invoice.company]
      .filter(Boolean)
      .join(' - '),
    slug: invoice.slug,
  }));
}

function mapPermitOptions(items) {
  return items.map((permit) => ({
    value: permit.slug,
    label: [
      permit.job?.permit || permit.permit_type || permit.type_display,
      permit.first,
      permit.last,
      permit.passport_number,
    ]
      .filter(Boolean)
      .join(' - '),
    slug: permit.slug,
  }));
}

function formatEmployeeLookupHelper(employee) {
  const fullName = [employee?.first, employee?.last].filter(Boolean).join(' ').trim();

  return [
    fullName ? `Employe trouve : ${fullName}` : null,
    employee?.passport_number ? `Passeport: ${employee.passport_number}` : null,
    employee?.job ? `Fonction: ${employee.job}` : null,
  ]
    .filter(Boolean)
    .join(' | ');
}
