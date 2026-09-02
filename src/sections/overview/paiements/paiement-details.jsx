import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import { Button, MenuItem } from '@mui/material';
import { Autocomplete } from '@mui/material';
import TextField from '@mui/material/TextField';
import { CircularProgress } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { useRef, useState, useEffect, useCallback } from 'react';
import { fCurrency, fGNF, fEuro } from 'src/utils/format-number';
import { Field } from 'src/components/hook-form';
import { useReactToPrint } from 'react-to-print';

import { PaiementToolbar } from './paiement-toolbar';
import API from 'src/utils/api';
import axios from 'src/utils/axios';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { toast } from 'sonner';
import { getDevises } from 'src/utils/options';
import { usePermissions } from 'src/auth/hooks';
import { DeviseSelector } from './composants/devise-selector';
import { UploadDocument } from './composants/upload-document';

// ----------------------------------------------------------------------

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  [`& .${tableCellClasses.root}`]: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(0.75, 1.5),
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  fontSize: '0.85rem',
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const Logo = styled('img')({
  height: 60,
  width: 'auto',
});

export function PaiementDetails({ payment, setPayment }) {
  const componentRef = useRef();
  const router = useRouter();
  const { isAdmin } = usePermissions();
  const [selectedFacture, setSelectedFacture] = useState([]);
  const [error, setError] = useState(null);
  const [loadFac, setLoadFac] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const [facturesToAdd, setFacturesToAdd] = useState([]);
  const [filteredFactures, setFilteredFactures] = useState([]);
  const [factures, setFactures] = useState([]);
  const [qrUrl, setQrUrl] = useState('');
  const [devises, setDevises] = useState([]);

  const confirm = useBoolean();
  const confirmRemove = useBoolean();
  const confirmUpload = useBoolean();

  const afficherMontant = (montant) => {
    if (payment?.devise.sign === 'GNF') {
      return fGNF(montant);
    } else if (payment?.devise.sign === '$') {
      return fCurrency(montant / 9200); // Exemple: 1 USD = 9200 GNF
    } else if (payment?.devise.sign === '€') {
      return fEuro(montant / 10000); // Exemple: 1 EUR = 10000 GNF
    }
  };

  useEffect(() => {
    if (payment?.reference) {
      // Préparation du QR code avec les informations du paiement
      const qrData = encodeURIComponent(
        `Paiement: ${payment.reference} - Facture: ${payment.facture_number || ''} - Montant: ${payment.amount || ''} ${payment.devise?.sign || 'GNF'}`
      );
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?data=${qrData}&size=100x100`);
    }
  }, [payment]);

  useEffect(() => {
    getDevises().then(setDevises);
  }, []);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  // Fonction pour formater les montants
  const formatAmount = (amount) => {
    if (!amount) return '0 GNF';
    return `${Number(amount).toLocaleString()} GNF`;
  };

  useEffect(() => {
    const fetchFactures = async () => {
      setLoadFac(true);
      try {
        // Premier appel (juste pour savoir s'il y a des factures et récupérer le count)
        const resp1 = await axios.get(API.listFactures(), {
          params: { offset: 0, limit: 5, company: payment?.client?.name, status: 'unpaid' },
        });

        const total = resp1?.data?.count || 0;

        // Si pas de factures -> rien à faire
        if (total === 0) {
          setFactures([]);
          setLoadFac(false);
          return;
        }

        // Si seulement une facture, pas besoin d’un 2ème appel
        if (total <= 5) {
          setFactures(resp1?.data?.results || []);
          setLoadFac(false);
          return;
        }

        // Si plusieurs factures, 2ème appel nécessaire
        const resp2 = await axios.get(API.listFactures(), {
          params: { offset: 0, limit: total, company: payment?.client?.name, status: 'unpaid' },
        });

        setFactures(resp2?.data?.results || []);
        setLoadFac(false);
      } catch (error) {
        toast.error('Erreur lors de la récupération des factures');
        setLoadFac(false);
      }
    };

    if (payment?.client?.name) {
      fetchFactures();
    }
  }, [payment]);

  const handleRemoveFacture = useCallback(async () => {
    try {
      const requestBody = {
        factures: selectedFacture,
      };
      const response = await axios.post(API.removeInvoiceFromPayment(payment?.slug), requestBody);

      if (response?.data || response?.status === 200) {
        toast.success('Factures retirées avec succès');
        setFilteredFactures((prevData) =>
          prevData.filter((facture) => !selectedFacture.includes(facture.slug))
        );
        // Mettre à jour seulement le montant dans l'état payment
        if (response.data?.amount !== undefined) {
          setPayment((prevPayment) => ({
            ...prevPayment,
            amount: response.data.amount,
          }));
        }
        setSelectedFacture([]);
      } else {
        toast.error('Erreur lors du retirement des factures');
      }
    } catch (error) {
      const data = error?.response?.data || error;
      const messages = [];
      if (data?.factures) {
        messages.push(...(Array.isArray(data.factures) ? data.factures : [data.factures]));
      }
      if (data?.message) {
        messages.push(data.message);
      }
      if (data?.detail) {
        messages.push(data.detail);
      }
      if (data?.error) {
        messages.push(data.error);
      }
      const errorMessage = messages.join('');
      setError(errorMessage);
      console.error('Erreur réseau ou serveur:', error);
      toast.error(errorMessage);
    }
  });

  const handleAddFacture = useCallback(async () => {
    try {
      const requestBody = {
        factures: facturesToAdd,
      };
      const response = await axios.post(API.addInvoiceToPayment(payment?.slug), requestBody);

      if (response?.data || response?.status === 200) {
        toast.success('Factures ajoutées avec succès');
        setPayment(response?.data);
        setFilteredFactures(response.data.factures);
        setFacturesToAdd([]);
      } else {
        toast.error("Erreur lors de l'ajout des factures");
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Erreur lors de l’ajout des factures.';
      setError(errorMessage);
      console.error('Erreur réseau ou serveur:', error);
      toast.error(errorMessage);
    }
  });

  const handleChange = (event, newValue) => {
    if (newValue) {
      setFacturesToAdd(newValue.map((item) => item.slug));
    }
  };

  useEffect(() => {
    if (payment?.factures) {
      setFilteredFactures(payment.factures);
    }
  }, [payment?.factures]);

  const methodsLabels = {
    transfer: 'Virement',
    cheque: 'Chèque',
    deposit: 'Espèces',
  };

  const formatDate = (ds) => {
    const d = new Date(ds);
    const j = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const a = d.getFullYear();
    return `${j}/${m}/${a}`;
  };

  const handleViewFactureDetails = (factureSlug) => {
    if (!factureSlug) {
      toast.error('Aucun slug de facture trouvé pour ce paiement');
      return;
    }
    router.push(paths.dashboard.factures.details(factureSlug));
  };

  const statusLabels = {
    pending: 'En attente',
    validated: 'Validée',
  };

  const handleChangeDevise = async (devise) => {
    try {
      const requestBody = { devise: devise.slug };

      const response = await axios.patch(API.updatepayment(payment?.slug), requestBody);

      if (response?.data || response?.status === 200) {
        toast.success('Devise mise a jour avec succès');
        setPayment((prevPayment) => ({
          ...prevPayment,
          devise: response.data.devise,
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour :', error);
    }
  };

  const updateDocument = useCallback((newDocument) => {
    setPayment((prevPayment) => ({
      ...prevPayment,
      document: newDocument,
    }));
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning.main';
      case 'validated':
        return 'success.main';
      default:
        return 'default';
    }
  };

  useEffect(() => {
    if (payment?.status) {
      setCurrentStatus(payment.status);
    }
  }, [payment?.status]);

  const handleOpenDocument = () => {
    if (payment?.document) {
      window.open(payment.document, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <PaiementToolbar
        payment={payment}
        componentRef={componentRef}
        currentStatus={currentStatus}
        onChangeStatus={(e) => {
          const value = typeof e === 'string' ? e : e.target.value;
          setCurrentStatus(value);
        }}
      />

      {currentStatus === 'pending' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: { xs: 2, md: 2 } }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => confirm.onTrue()}
            startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
            sx={{
              mb: { xs: 1, md: 1 },
              fontSize: '0.875rem',
              px: 2,
            }}
          >
            Ajouter une facture
          </Button>
        </Box>
      )}

      <Card sx={{ pt: 4, px: 4, borderRadius: 1 }} ref={componentRef}>
        <Box sx={{ mb: 5 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ width: '100%' }}>
                {/* Première ligne : logos symétriques */}
                <Grid container justifyContent="space-between" alignItems="center">
                  <Grid item size={{ xs: 4 }} display="flex" justifyContent="flex-start">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Logo
                        src="/logo/logo-single.png"
                        alt="TDSS Logo"
                        sx={{ height: 80, width: 80 }}
                      />
                      <Typography
                        variant="subtitle2"
                        align="center"
                        sx={{ fontSize: 10, lineHeight: 1.2, mt: 1 }}
                      >
                        TECH DATA SECURISATION & SYSTEMES
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid
                    item
                    size={{ xs: 4 }}
                    display="flex"
                    justifyContent="flex-end"
                    flexDirection="column"
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Logo
                        src="/logo/logo-single.png"
                        alt="TDSS Logo"
                        sx={{ height: 80, width: 80 }}
                      />
                      <Typography
                        variant="subtitle2"
                        align="center"
                        sx={{ fontSize: 10, lineHeight: 1.2, mt: 1 }}
                      >
                        TECH DATA SECURISATION & SYSTEMES
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Ligne horizontale */}
                <Divider sx={{ mt: 2, mb: 2, borderColor: 'white', borderWidth: 1 }} />

                {/* Titre centré */}
                <Box sx={{ position: 'relative', mb: 2, width: '100%' }}>
                  {/* Titre centré */}
                  <Typography
                    variant="h6"
                    align="center"
                    sx={{ fontWeight: 600, letterSpacing: 0.5 }}
                  >
                    RECU DE PAIEMENT N° {payment?.number || payment?.reference}
                  </Typography>
                </Box>

                {/* Ligne horizontale */}
                <Divider sx={{ mt: 1, mb: 2, borderColor: 'white', borderWidth: 1 }} />
              </Box>
              <Divider sx={{ mt: 2, borderStyle: 'solid', borderColor: 'divider', opacity: 0.7 }} />
            </Grid>

            <Grid item size={{ xs: 6 }} sx={{ mt: 2 }}>
              {payment?.facture_number && (
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.85rem', color: 'text.primary', fontWeight: 400 }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 700,
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                      fontSize: '0.85rem',
                    }}
                    onClick={() => handleViewFactureDetails(payment?.facture_slug)}
                  >
                    Facture N° :
                  </Typography>{' '}
                  {payment?.facture_number}
                </Typography>
              )}

              <>
                <Typography
                  variant="body2"
                  sx={{ mt: 0.75, fontSize: '0.85rem', color: 'text.primary', fontWeight: 400 }}
                >
                  <Typography
                    component="span"
                    sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                  >
                    Référence :
                  </Typography>{' '}
                  {payment?.reference}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mt: 0.75, fontSize: '0.85rem', color: 'text.primary', fontWeight: 400 }}
                >
                  <Typography
                    component="span"
                    sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                  >
                    Méthode de paiement :
                  </Typography>{' '}
                  {methodsLabels[payment?.payment_method]}
                </Typography>
                <DeviseSelector payment={payment} devises={devises} onClick={handleChangeDevise} />
                {payment?.document ? (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: 'text.primary', // couleur normale
                      cursor: 'pointer',
                      '&:hover': {
                        color: 'primary.main',
                        textDecoration: 'underline',
                      },
                    }}
                    onClick={handleOpenDocument}
                  >
                    Justificatif du paiement
                    <Iconify
                      icon="material-symbols:open-in-new"
                      width={18}
                      height={18}
                      sx={{ mr: 0.5 }}
                    />
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Aucun justificatif
                    </Typography>
                    <Button size="small" onClick={() => confirmUpload.onTrue()}>
                      Ajouter
                    </Button>
                  </Box>
                )}
              </>
            </Grid>

            <Grid item size={{ xs: 6 }} sx={{ mt: 2 }}>
              <Typography
                variant="body2"
                align="right"
                sx={{ fontSize: '0.85rem', color: 'text.primary', fontWeight: 400 }}
              >
                <Typography
                  component="span"
                  sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                >
                  Date :
                </Typography>{' '}
                {payment ? formatDate(payment.created_on) : ''}
              </Typography>

              {isAdmin && (
                <Typography
                  variant="body2"
                  align="right"
                  sx={{ mt: 0.75, fontSize: '0.85rem', color: 'text.primary', fontWeight: 400 }}
                >
                  <Typography
                    component="span"
                    sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                  >
                    Créé par :
                  </Typography>{' '}
                  {payment?.created_by?.name}
                </Typography>
              )}
              {/* QR Code à droite */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    p: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="QR Code"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <Typography variant="caption" align="center">
                      QR Code en cours de chargement...
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item size={{ xs: 6 }} sx={{ mt: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 500, fontSize: '0.9rem', letterSpacing: 0.25, mb: 1 }}
              >
                <Typography
                  component="span"
                  sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                >
                  CLIENT :{' '}
                </Typography>
                {payment?.client?.name}
              </Typography>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.85rem', color: 'text.primary', mb: 0.5 }}
                >
                  <Typography
                    component="span"
                    sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                  >
                    Nom :
                  </Typography>{' '}
                  {payment?.client?.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.85rem', color: 'text.primary', mb: 0.5 }}
                >
                  <Typography
                    component="span"
                    sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                  >
                    Tél :
                  </Typography>{' '}
                  {payment?.client?.contact}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.85rem', color: 'text.primary', mb: 0.5 }}
                >
                  <Typography
                    component="span"
                    sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                  >
                    Adresse :
                  </Typography>{' '}
                  {payment?.client?.adresse}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.primary' }}>
                  <Typography
                    component="span"
                    sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                  >
                    Région :
                  </Typography>{' '}
                  {payment?.client?.location}
                </Typography>
              </Box>
            </Grid>

            <Grid item size={{ xs: 6 }} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '0.85rem', color: 'text.primary', mb: 0.5 }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        fontSize: '0.85rem',
                      }}
                    >
                      INFORMATIONS DU PAYEUR :
                    </Typography>
                    {/* {payment?.payer.first} */}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ fontSize: '0.85rem', color: 'text.primary', mb: 0.5 }}
                  >
                    <Typography
                      component="span"
                      sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                    >
                      Nom :
                    </Typography>{' '}
                    {[payment?.payer?.last, payment?.payer?.first].filter(Boolean).join(' ')}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '0.85rem', color: 'text.primary', mb: 0.5 }}
                  >
                    <Typography
                      component="span"
                      sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                    >
                      Email :
                    </Typography>{' '}
                    {payment?.payer?.email}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '0.85rem', color: 'text.primary', mb: 0.5 }}
                  >
                    <Typography
                      component="span"
                      sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                    >
                      Tél :
                    </Typography>{' '}
                    {payment?.payer?.phone}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '0.85rem', color: 'text.primary', mb: 0.5 }}
                  >
                    <Typography
                      component="span"
                      sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                    >
                      Adresse :
                    </Typography>{' '}
                    {payment?.payer?.address}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
        {payment?.factures && payment?.factures.length < 0 ? (
          <Box sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell width="40%" sx={{ fontWeight: 700 }}>
                    Description
                  </StyledTableCell>
                  <StyledTableCell width="30%" align="center" sx={{ fontWeight: 700 }}>
                    Types de permis
                  </StyledTableCell>
                  <StyledTableCell width="30%" align="right" sx={{ fontWeight: 700 }}>
                    Montant
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payment?.permits
                  ?.filter((p) => p.count > 0)
                  .map((permit, index) => (
                    <TableRow key={index}>
                      <StyledTableCell sx={{ fontWeight: 500 }}>
                        Frais d'acquisition
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Typography component="span" sx={{ fontSize: '0.85rem' }}>
                          Permis {permit.type} ({permit.count})
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {afficherMontant(permit.total_price)}
                      </StyledTableCell>
                    </TableRow>
                  ))}
                <StyledTableRow>
                  <StyledTableCell
                    colSpan={2}
                    align="right"
                    sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    TOTAL TTC
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    {afficherMontant(payment?.amount)}
                  </StyledTableCell>
                </StyledTableRow>
              </TableBody>
            </Table>
            <Typography
              variant="body2"
              sx={{ fontSize: '0.85rem', color: 'text.primary', mt: 1.5 }}
            >
              <Typography
                component="span"
                sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
              >
                Commentaire :
              </Typography>{' '}
              {payment?.comment}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mb: 4 }}>
            {selectedFacture.length > 0 && currentStatus === 'pending' && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => confirmRemove.onTrue()}
                  startIcon={<Iconify icon="eva:trash-2-outline" />}
                  sx={{ mb: { xs: 1, md: 1 }, fontSize: '0.875rem', px: 2 }}
                >
                  Retirer
                </Button>
              </Box>
            )}
            <Table>
              <TableHead>
                <TableRow>
                  {currentStatus === 'pending' && (
                    <StyledTableCell width="5%" sx={{ fontWeight: 700 }}></StyledTableCell>
                  )}
                  <StyledTableCell width="40%" sx={{ fontWeight: 700 }}>
                    Factures
                  </StyledTableCell>
                  <StyledTableCell width="30%" align="center" sx={{ fontWeight: 700 }}>
                    Date de facturation
                  </StyledTableCell>
                  <StyledTableCell width="30%" align="right" sx={{ fontWeight: 700 }}>
                    Montant
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFactures?.map((facture, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: selectedFacture.includes(facture.number)
                        ? 'rgba(0, 171, 85, 0.08)'
                        : 'transparent',
                    }}
                  >
                    {currentStatus === 'pending' && (
                      <StyledTableCell>
                        <Checkbox
                          checked={selectedFacture.includes(facture.slug)}
                          onChange={(e) => {
                            const selected = [...selectedFacture];
                            if (e.target.checked) {
                              selected.push(facture.slug);
                            } else {
                              const index = selected.indexOf(facture.slug);
                              if (index > -1) {
                                selected.splice(index, 1);
                              }
                            }
                            setSelectedFacture(selected);
                          }}
                          inputProps={{
                            'aria-label': `Select facture ${index + 1}`,
                          }}
                        />
                      </StyledTableCell>
                    )}
                    <StyledTableCell sx={{ fontWeight: 500 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                          fontSize: '0.85rem',
                        }}
                        onClick={() => handleViewFactureDetails(facture?.slug)}
                      >
                        {facture?.number}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Typography component="span" sx={{ fontSize: '0.85rem' }}>
                        {formatDate(facture.created_on)}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {afficherMontant(facture?.amount)}
                    </StyledTableCell>
                  </TableRow>
                ))}
                <StyledTableRow>
                  {currentStatus === 'pending' && <StyledTableCell></StyledTableCell>}
                  <StyledTableCell
                    colSpan={2}
                    align="right"
                    sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    TOTAL TTC
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    {afficherMontant(payment?.amount)}
                  </StyledTableCell>
                </StyledTableRow>
              </TableBody>
            </Table>
            <Typography
              variant="body2"
              sx={{ fontSize: '0.85rem', color: 'text.primary', mt: 1.5 }}
            >
              <Typography
                component="span"
                sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
              >
                Commentaire :
              </Typography>{' '}
              {payment?.comment}
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 5, mb: 8 }}>
          <Grid container spacing={2}>
            <Grid item size={{ xs: 6 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold', textDecoration: 'underline' }}
                >
                  Le Client
                </Typography>
              </Box>
            </Grid>

            {/* Colonne Banque alignée en haut à droite */}
            <Grid item size={{ xs: 6 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  height: '100%',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold', textDecoration: 'underline' }}
                >
                  La Banque
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Ajouter des factures"
        content={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 2, mt: 3 }}>
            <Autocomplete
              multiple
              options={factures}
              getOptionLabel={(facture) => `${facture.number} - ${facture.client}`}
              loading={loadFac}
              onChange={handleChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Rechercher ou sélectionner une facture"
                  placeholder="Taper pour rechercher une facture"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadFac ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                  sx={{ width: '100%' }}
                />
              )}
            />
          </Box>
        }
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              handleAddFacture();
              confirm.onFalse();
            }}
            startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
          >
            Ajouter
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmRemove.value}
        onClose={confirmRemove.onFalse}
        title="Retirer des factures"
        content={
          <Typography>
            Êtes-vous sûr de vouloir retirer les factures sélectionnées du paiement ?
          </Typography>
        }
        action={
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              handleRemoveFacture();
              confirmRemove.onFalse();
            }}
            startIcon={<Iconify icon="eva:trash-2-outline" />}
          >
            Retirer
          </Button>
        }
      />

      <UploadDocument
        slug={payment?.slug}
        open={confirmUpload.value}
        onclose={confirmUpload.onFalse}
        onUpdate={updateDocument}
      />
    </>
  );
}
