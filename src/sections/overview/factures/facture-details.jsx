
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useState, useEffect } from 'react';

import { fCurrency , fGNF , fEuro } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { usePopover } from 'src/components/custom-popover';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

import { FactureToolbar } from './facture-toolbar';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  [`& .${tableCellClasses.root}`]: {
    textAlign: 'right',
    borderBottom: 'none',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
}));


export function FactureDetails({ facture, user }) {
  const [currentStatus, setCurrentStatus] = useState('');
  const [devise, setDevise] = useState('GNF');

  // const currentStatus = facture?.status;

  const popover = usePopover();

 
const afficherMontant = (montant) => {
  if (devise === 'GNF') {
    return fGNF(montant);
  } else if (devise === 'USD') {
    return fCurrency(montant / 9200); // Exemple: 1 USD = 9200 GNF
  } else if (devise === 'EUR') {
    return fEuro(montant / 10000); // Exemple: 1 EUR = 10000 GNF
  }
};



  const renderFooter = (
    <Box gap={2} display="flex" alignItems="center" flexWrap="wrap" sx={{ py: 3 }}>
      <div>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          NOTES
        </Typography>
        <Typography variant="body2">
          We appreciate your business. Should you need us to add VAT or extra notes let us know!
        </Typography>
      </div>

      <Box flexGrow={{ md: 1 }} sx={{ textAlign: { md: 'right' } }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Have a question?
        </Typography>
        <Typography variant="body2">support@minimals.cc</Typography>
      </Box>
    </Box>
  );

  const renderTotal = (
    <StyledTableRow>
      <TableCell colSpan={3} />
      <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>
        <Box sx={{ mt: 2 }} />
        TOTAL
      </TableCell>
      <TableCell width={120} sx={{ typography: 'subtitle2' }}>
        <Box sx={{ mt: 2 }} />
        {afficherMontant(facture?.amount)}
      </TableCell>
      

    </StyledTableRow>
  );

  const CenteredTableCell = styled(TableCell)(({ theme }) => ({
    textAlign: 'center',
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.1),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  }));
  
 // Filtrer les permis avec count > 0
 const filteredPermits = facture?.permits.filter((item) => item.count > 0) || [];

  const renderList = (
    <Scrollbar sx={{ mt: 5 }}>
  <Table sx={{ minWidth: 960 }}>
    <TableHead>
      <TableRow>
        <CenteredTableCell width={40}>#</CenteredTableCell>
        <CenteredTableCell width={150}>Categorie de permis</CenteredTableCell>
        <CenteredTableCell width={150}>Quantité</CenteredTableCell>
        <CenteredTableCell width={150}>Prix Unitaire</CenteredTableCell>
        <CenteredTableCell width={150}>Total</CenteredTableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {filteredPermits.map((row, index) => (
        <TableRow key={index}>
          <CenteredTableCell>{index + 1}</CenteredTableCell>

          <CenteredTableCell>
            <Typography variant="subtitle2">{row.category}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
              Permis {row.type}
            </Typography>
          </CenteredTableCell>

          <CenteredTableCell>{row.count}</CenteredTableCell>

          <CenteredTableCell>{afficherMontant(row.price)}</CenteredTableCell>

          <CenteredTableCell>
            {afficherMontant(row.total_price)}
          </CenteredTableCell>
        </TableRow>
      ))}

      {/* Total général */}
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
    PAID: 'Payée',
    unpaid: 'En attente',
    
  }
  const getStatusColor = (status) => {
    switch (status) {
      case 'unpaid':
        return 'warning';
      case 'PAID':
        return 'success';
      default:
        return 'default';
    }
  }
 
useEffect(() => {
    if (facture?.status) {
      setCurrentStatus(facture?.status);
    }
  }, [facture?.status]);

  return (
    <>
      <FactureToolbar
        facture={facture}
        user={user}
        currentStatus={currentStatus || ''}
        onChangeStatus={(e) => {
          const value = typeof e === 'string' ? e : e.target.value;
          setCurrentStatus(value);
        }
      }
        devise={devise}
      />
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
                onChange={(e) => setDevise(e.target.value)}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  border: '1px solid #ccc',
                  backgroundColor: '#fff',
                  fontSize: 14,
                  minWidth: 80,
                }}
              >
                <option value="GNF">GNF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Box>
            </Box>

            <Label
              variant="soft"
              color={getStatusColor(currentStatus)}
            >
             {statusLabels[currentStatus] || 'Inconnue'}
 
            </Label>
            <Typography variant="h6"> {`FACTURE N° ${facture?.number}`}</Typography>
          </Stack>

          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              CLIENT
            </Typography>
            <br />
            <Typography variant='h6' >
              {facture?.client_name}
            </Typography>
            <br />
            Tél : {facture?.client_contact}
            <br />
            Adresse : {facture?.client_adresse}
            <br />
            Région : {facture?.client_location}
          </Stack>

          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Date facture :
              {fDate(facture?.created_on)}
            </Typography>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Declaration N :
              {facture?.declaration_number}
            </Typography>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Date declaration :
              {fDate(facture?.date_declaration)}
            </Typography>

          </Stack>
        </Box>
        <Divider sx={{ mt: 5, borderStyle: 'dashed' }} mb={4} />

        {renderList}

        <Divider sx={{ mt: 5, borderStyle: 'dashed' }} />
      </Card>
    </>
  );
}
