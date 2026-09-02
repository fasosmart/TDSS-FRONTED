import { useCallback, useEffect, useState } from 'react';

import { Autocomplete, CircularProgress } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { ConfirmDialog } from 'src/components/custom-dialog';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { toast } from 'src/components/snackbar';

import API from 'src/utils/api';
import axios from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';

import { getPenaltyTypeLabel } from '../penalite/penalite-filter-options';

import { FactureToolbar } from './facture-toolbar';
import {
  formatFactureAmount,
  getFactureCurrencySign,
  hasDeclarationFactureItems,
  isPenaltyFacture,
  parseFactureAmount,
} from './facture-utils';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  [`& .${tableCellClasses.root}`]: {
    textAlign: 'right',
    borderBottom: 'none',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
}));

const CenteredTableCell = styled(TableCell)(({ theme }) => ({
  textAlign: 'center',
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.1),
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
}));

export function FactureDetails({ facture, user, setFacture }) {
  const router = useRouter();
  const confirm = useBoolean();
  const confirmRemove = useBoolean();

  const [currentStatus, setCurrentStatus] = useState('');
  const [devise, setDevise] = useState('GNF');
  const [declarations, setDeclarations] = useState([]);
  const [selectedDeclarations, setSelectedDeclarations] = useState([]);
  const [declarationsToAdd, setDeclarationsToAdd] = useState([]);
  const [filteredDeclarations, setFilteredDeclarations] = useState([]);
  const [loadDec, setLoadDec] = useState(false);

  const isPenaltyInvoice = isPenaltyFacture(facture);
  const hasDeclarationItems = hasDeclarationFactureItems(facture);
  const penalty = facture?.penalty;
  const filteredPermits =
    facture?.permits?.filter((item) => parseFactureAmount(item?.count) > 0) || [];

  const afficherMontant = useCallback((montant) => formatFactureAmount(montant, devise), [devise]);

  useEffect(() => {
    if (facture?.status) {
      setCurrentStatus(facture.status);
    }
  }, [facture?.status]);

  useEffect(() => {
    setDevise(getFactureCurrencySign(facture?.devise));
  }, [facture?.devise]);

  useEffect(() => {
    setFilteredDeclarations(Array.isArray(facture?.declarations) ? facture.declarations : []);
  }, [facture?.declarations]);

  useEffect(() => {
    if (!facture?.client_name || isPenaltyInvoice || facture?.status !== 'unpaid') {
      setDeclarations([]);
      setLoadDec(false);
      return;
    }

    const fetchDeclarations = async () => {
      setLoadDec(true);

      try {
        const firstResponse = await axios.get(API.listDeclarations(), {
          params: { offset: 0, limit: 1, company: facture.client_name, status: 'validated' },
        });

        const total = firstResponse?.data?.count || 0;

        const secondResponse = await axios.get(API.listDeclarations(), {
          params: {
            offset: 0,
            limit: total || 1,
            company: facture.client_name,
            status: 'validated',
          },
        });

        setDeclarations(secondResponse?.data?.results || []);
      } catch (error) {
        toast.error('Erreur du chargement des declarations');
      } finally {
        setLoadDec(false);
      }
    };

    fetchDeclarations();
  }, [facture?.client_name, facture?.status, isPenaltyInvoice]);

  const handleAdd = useCallback(async () => {
    if (!declarationsToAdd.length) {
      toast.error('Veuillez selectionner au moins une declaration.');
      return;
    }

    try {
      const response = await axios.post(API.ajouterDeclaration(facture?.slug), {
        declarations: declarationsToAdd,
      });

      if (response.data || response.status === 200) {
        toast.success('Declaration ajoutee avec succes');

        setFacture((prev) => ({
          ...prev,
          declarations: response?.data?.declarations || [],
          amount: response?.data?.amount,
        }));

        setDeclarationsToAdd([]);
      } else {
        toast.error('Une erreur est survenue.');
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Erreur lors de la facturation.';
      toast.error(errorMessage);
    }
  }, [declarationsToAdd, facture?.slug, setFacture]);

  const handleRemove = useCallback(async () => {
    if (!selectedDeclarations.length) {
      toast.error('Veuillez selectionner au moins une declaration.');
      return;
    }

    try {
      const response = await axios.post(API.retirerDeclaration(facture?.slug), {
        declarations: selectedDeclarations,
      });

      if (response.data || response.status === 201) {
        toast.success('Declaration retiree avec succes');
        setSelectedDeclarations([]);
        setFilteredDeclarations((prevData) =>
          prevData.filter((item) => !selectedDeclarations.includes(item.slug))
        );
        setFacture((prev) => ({
          ...prev,
          declarations: response?.data?.declarations || [],
          amount: response?.data?.amount,
        }));
      } else {
        toast.error('Une erreur est survenue.');
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Erreur lors de la facturation.';
      toast.error(errorMessage);
    }
  }, [facture?.slug, selectedDeclarations, setFacture]);

  const handleChange = (event, newValue) => {
    setDeclarationsToAdd((newValue || []).map((item) => item?.slug).filter(Boolean));
  };

  const handleDetailsDeclaration = (declarationSlug) => {
    if (!declarationSlug) {
      toast.error('Le slug de la declaration est manquant.');
      return;
    }

    router.push(paths.dashboard.declaration.details(declarationSlug));
  };

  const handleDetailsPenalty = (penaltySlug) => {
    if (!penaltySlug) {
      toast.error('Le slug de la penalite est manquant.');
      return;
    }

    router.push(paths.dashboard.penalite.details(penaltySlug));
  };

  const qrData = encodeURIComponent(`Facture N° ${facture?.number} - ${facture?.amount} ${devise}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${qrData}&size=100x100`;

  const renderDeclarationList = (
    <Scrollbar sx={{ mt: 5 }}>
      <Table sx={{ minWidth: 960 }}>
        <TableHead>
          <TableRow>
            {currentStatus === 'unpaid' && <CenteredTableCell width={40}> </CenteredTableCell>}
            <CenteredTableCell width={40}>#</CenteredTableCell>
            <CenteredTableCell width={250}>Declarations</CenteredTableCell>
            <CenteredTableCell width={250}>Date declaration</CenteredTableCell>
            <CenteredTableCell width={250}>Montant</CenteredTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredDeclarations.map((row, index) => (
            <TableRow
              key={row?.slug || index}
              sx={{
                backgroundColor: selectedDeclarations.includes(row?.slug)
                  ? 'rgba(0, 171, 85, 0.08)'
                  : 'transparent',
              }}
            >
              {currentStatus === 'unpaid' && (
                <CenteredTableCell>
                  <Checkbox
                    checked={selectedDeclarations.includes(row?.slug)}
                    onChange={(event) => {
                      const selected = [...selectedDeclarations];

                      if (event.target.checked) {
                        selected.push(row?.slug);
                      } else {
                        const selectedIndex = selected.indexOf(row?.slug);
                        if (selectedIndex > -1) selected.splice(selectedIndex, 1);
                      }

                      setSelectedDeclarations(selected);
                    }}
                    inputProps={{ 'aria-label': `select declaration ${index + 1}` }}
                  />
                </CenteredTableCell>
              )}

              <CenteredTableCell>{index + 1}</CenteredTableCell>

              <CenteredTableCell>
                <Typography
                  variant="subtitle2"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                    fontSize: '0.85rem',
                  }}
                  onClick={() => handleDetailsDeclaration(row?.slug)}
                >
                  {row?.number || '-'}
                </Typography>
              </CenteredTableCell>

              <CenteredTableCell>{fDate(row?.created_on) || '-'}</CenteredTableCell>
              <CenteredTableCell>{afficherMontant(row?.montant)}</CenteredTableCell>
            </TableRow>
          ))}

          <StyledTableRow>
            <CenteredTableCell colSpan={currentStatus === 'unpaid' ? 3 : 2} />
            <CenteredTableCell sx={{ fontWeight: 'bold' }}>TOTAL</CenteredTableCell>
            <CenteredTableCell sx={{ fontWeight: 'bold' }}>
              {afficherMontant(facture?.amount)}
            </CenteredTableCell>
          </StyledTableRow>
        </TableBody>
      </Table>
    </Scrollbar>
  );

  const renderPenaltyList = (
    <Scrollbar sx={{ mt: 5 }}>
      <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <CenteredTableCell width="25%">Reference penalite</CenteredTableCell>
            <CenteredTableCell width="35%">Type</CenteredTableCell>
            <CenteredTableCell width="25%">Date infraction</CenteredTableCell>
            <CenteredTableCell width="15%">Montant</CenteredTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <CenteredTableCell>
              <Typography
                variant="subtitle2"
                sx={{
                  cursor: penalty?.slug ? 'pointer' : 'default',
                  '&:hover': penalty?.slug
                    ? { color: 'primary.main', textDecoration: 'underline' }
                    : undefined,
                }}
                onClick={() => handleDetailsPenalty(penalty?.slug)}
              >
                {penalty?.reference || '-'}
              </Typography>
            </CenteredTableCell>
            <CenteredTableCell>{getPenaltyTypeLabel(penalty?.type) || '-'}</CenteredTableCell>
            <CenteredTableCell>{fDate(penalty?.infraction_date) || '-'}</CenteredTableCell>
            <CenteredTableCell>{afficherMontant(facture?.amount)}</CenteredTableCell>
          </TableRow>
          <StyledTableRow>
            <CenteredTableCell colSpan={2} />
            <CenteredTableCell sx={{ fontWeight: 'bold' }}>TOTAL</CenteredTableCell>
            <CenteredTableCell sx={{ fontWeight: 'bold' }}>
              {afficherMontant(facture?.amount)}
            </CenteredTableCell>
          </StyledTableRow>
        </TableBody>
      </Table>
    </Scrollbar>
  );

  const renderPermitList = (
    <Scrollbar sx={{ mt: 5 }}>
      <Table sx={{ minWidth: 960 }}>
        <TableHead>
          <TableRow>
            <CenteredTableCell width={40}>#</CenteredTableCell>
            <CenteredTableCell width={150}>Categorie de permis</CenteredTableCell>
            <CenteredTableCell width={150}>Quantite</CenteredTableCell>
            <CenteredTableCell width={150}>Prix unitaire</CenteredTableCell>
            <CenteredTableCell width={150}>Total</CenteredTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPermits.map((row, index) => (
            <TableRow key={`${row?.category || 'permit'}-${index}`}>
              <CenteredTableCell>{index + 1}</CenteredTableCell>

              <CenteredTableCell>
                <Typography variant="subtitle2">{row?.category || '-'}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                  Permis {row?.type || '-'}
                </Typography>
              </CenteredTableCell>

              <CenteredTableCell>{parseFactureAmount(row?.count)}</CenteredTableCell>
              <CenteredTableCell>{afficherMontant(row?.price)}</CenteredTableCell>
              <CenteredTableCell>{afficherMontant(row?.total_price)}</CenteredTableCell>
            </TableRow>
          ))}

          <StyledTableRow>
            <CenteredTableCell colSpan={3} />
            <CenteredTableCell sx={{ fontWeight: 'bold' }}>TOTAL</CenteredTableCell>
            <CenteredTableCell sx={{ fontWeight: 'bold' }}>
              {afficherMontant(facture?.amount)}
            </CenteredTableCell>
          </StyledTableRow>
        </TableBody>
      </Table>
    </Scrollbar>
  );

  const statusLabels = {
    paid: 'Payee',
    unpaid: 'En attente',
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unpaid':
        return 'warning';
      case 'paid':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <>
      <FactureToolbar
        facture={facture}
        user={user}
        currentStatus={currentStatus || ''}
        onChangeStatus={(event) => {
          const value = typeof event === 'string' ? event : event.target.value;
          setCurrentStatus(value);
        }}
        devise={devise}
      />

      {currentStatus === 'unpaid' && !isPenaltyInvoice && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: { xs: 1, md: 2 } }}>
          <Button
            variant="contained"
            onClick={confirm.onTrue}
            startIcon={<Iconify icon="mingcute:add-line" />}
            sx={{
              mb: { xs: 1, md: 1 },
              fontSize: '0.875rem',
              px: 2,
            }}
          >
            Ajouter une nouvelle declaration
          </Button>
        </Box>
      )}

      <Card sx={{ pt: 5, px: 5 }}>
        <Box
          rowGap={5}
          display="grid"
          alignItems="center"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
        >
          <Box
            component="img"
            alt="logo"
            src="/logo/logo-single.png"
            sx={{ width: 48, height: 48 }}
          />

          <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Devise
              </Typography>
              <Box
                component="select"
                value={devise}
                onChange={(event) => setDevise(event.target.value)}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  border: '1px solid #ccc',
                  fontSize: 14,
                  minWidth: 80,
                }}
              >
                <option value="GNF">GNF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Box>
            </Box>

            <Label variant="soft" color={getStatusColor(currentStatus)}>
              {statusLabels[currentStatus] || 'Inconnue'}
            </Label>

            <Typography variant="h6">{`FACTURE N° ${facture?.number || '-'}`}</Typography>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Date facture : {fDate(facture?.created_on) || '-'}
            </Typography>

            {isPenaltyInvoice ? (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    cursor: penalty?.slug ? 'pointer' : 'default',
                    '&:hover': penalty?.slug
                      ? { color: 'primary.main', textDecoration: 'underline' }
                      : undefined,
                  }}
                  onClick={() => handleDetailsPenalty(penalty?.slug)}
                >
                  Penalite : {penalty?.reference || '-'}
                </Typography>
                {/* <Typography variant="subtitle2">
                  Type : {getPenaltyTypeLabel(penalty?.type) || '-'}
                </Typography> */}
                {/* <Typography variant="subtitle2">
                  Date infraction : {fDate(penalty?.infraction_date) || '-'}
                </Typography> */}
              </>
            ) : (
              facture?.declaration_number && (
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                  }}
                  onClick={() => handleDetailsDeclaration(facture?.declaration_slug)}
                >
                  Declaration N : {facture?.declaration_number}
                </Typography>
              )
            )}
          </Stack>

          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              CLIENT
            </Typography>
            <br />
            <Typography variant="h6">{facture?.client_name || '-'}</Typography>
            <br />
            Tel : {facture?.client_contact || '-'}
            <br />
            Adresse : {facture?.client_adresse || '-'}
            <br />
            Region : {facture?.client_location || '-'}
          </Stack>

          <Stack
            sx={{
              typography: 'body2',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
            }}
          >
            <Box sx={{ width: 90, height: 90 }} component="img" alt="qrCode" src={qrUrl} />
          </Stack>
        </Box>

        <Divider sx={{ mt: 5, borderStyle: 'dashed' }} mb={4} />

        {selectedDeclarations.length > 0 && currentStatus === 'unpaid' && hasDeclarationItems && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Iconify icon="mdi:trash-can-outline" />}
              onClick={confirmRemove.onTrue}
            >
              Retirer
            </Button>
          </Box>
        )}

        {isPenaltyInvoice
          ? renderPenaltyList
          : hasDeclarationItems
            ? renderDeclarationList
            : renderPermitList}

        <Divider sx={{ mt: 5, borderStyle: 'dashed' }} />
      </Card>

      {!isPenaltyInvoice && (
        <ConfirmDialog
          open={confirm.value}
          onClose={confirm.onFalse}
          title="Veuillez selectionner la declaration que vous voulez ajouter"
          content={
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 2, mt: 3 }}>
              <Autocomplete
                multiple
                options={declarations}
                getOptionLabel={(declaration) => declaration?.number || ''}
                loading={loadDec}
                onChange={handleChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Rechercher ou selectionner une declaration"
                    placeholder="Taper pour rechercher"
                    variant="outlined"
                    fullWidth
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadDec ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
                sx={{ width: '100%' }}
              />
            </Box>
          }
          action={
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                handleAdd();
                confirm.onFalse();
              }}
            >
              Ajouter
            </Button>
          }
        />
      )}

      <ConfirmDialog
        open={confirmRemove.value}
        onClose={confirmRemove.onFalse}
        title="Retirer des declarations"
        content={
          <>
            Etes vous sur de vouloir retirer <strong>{selectedDeclarations.length}</strong>{' '}
            declarations ?
          </>
        }
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              handleRemove();
              confirmRemove.onFalse();
            }}
          >
            Retirer
          </Button>
        }
      />
    </>
  );
}
