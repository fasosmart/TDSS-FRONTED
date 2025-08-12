import PropTypes from 'prop-types';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { LoadingButton } from '@mui/lab';
import { useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ComptableInvoiceButton({ declarationId, onSuccess }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dueDate: '',
    paymentMethod: 'bank_transfer',
    notes: '',
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // console.log('Facture générée pour la déclaration:', declarationId, 'avec les données:', formData);
      
      // Appeler le callback de succès si fourni
      if (onSuccess) {
        onSuccess();
      }
      
      setLoading(false);
      handleClose();
    } catch (error) {
      console.error('Erreur lors de la génération de la facture:', error);
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Iconify icon="mdi:file-document-plus" />}
        onClick={handleOpen}
      >
        Générer facture
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Générer une facture</DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              fullWidth
              label="ID Déclaration"
              value={declarationId}
              disabled
            />
            
            <TextField
              fullWidth
              label="Date d'échéance"
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
            
            <FormControl fullWidth>
              <InputLabel id="payment-method-label">Méthode de paiement</InputLabel>
              <Select
                labelId="payment-method-label"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                label="Méthode de paiement"
              >
                <MenuItem value="bank_transfer">Virement bancaire</MenuItem>
                <MenuItem value="check">Chèque</MenuItem>
                <MenuItem value="cash">Espèces</MenuItem>
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Annuler
          </Button>
          
          <LoadingButton 
            loading={loading} 
            onClick={handleSubmit}
            variant="contained"
          >
            Générer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

ComptableInvoiceButton.propTypes = {
  declarationId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
};

// ----------------------------------------------------------------------

export function ComptablePaymentButton({ invoiceId, onSuccess }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paymentDate: '',
    paymentMethod: 'bank_transfer',
    reference: '',
    notes: '',
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Paiement enregistré pour la facture:', invoiceId, 'avec les données:', formData);
      
      // Appeler le callback de succès si fourni
      if (onSuccess) {
        onSuccess();
      }
      
      setLoading(false);
      handleClose();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du paiement:', error);
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="success"
        startIcon={<Iconify icon="mdi:check-circle" />}
        onClick={handleOpen}
      >
        Marquer payée
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Enregistrer un paiement</DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              fullWidth
              label="ID Facture"
              value={invoiceId}
              disabled
            />
            
            <TextField
              fullWidth
              label="Date de paiement"
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
            
            <FormControl fullWidth>
              <InputLabel id="payment-method-label">Méthode de paiement</InputLabel>
              <Select
                labelId="payment-method-label"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                label="Méthode de paiement"
              >
                <MenuItem value="bank_transfer">Virement bancaire</MenuItem>
                <MenuItem value="check">Chèque</MenuItem>
                <MenuItem value="cash">Espèces</MenuItem>
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Référence de paiement"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
            />
            
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Annuler
          </Button>
          
          <LoadingButton 
            loading={loading} 
            onClick={handleSubmit}
            variant="contained"
            color="success"
          >
            Enregistrer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

ComptablePaymentButton.propTypes = {
  invoiceId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
};

// ----------------------------------------------------------------------

export function ComptableReminderButton({ invoiceId, onSuccess }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reminderType: 'email',
    message: '',
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Rappel envoyé pour la facture:', invoiceId, 'avec les données:', formData);
      
      // Appeler le callback de succès si fourni
      if (onSuccess) {
        onSuccess();
      }
      
      setLoading(false);
      handleClose();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel:', error);
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="warning"
        startIcon={<Iconify icon="mdi:bell" />}
        onClick={handleOpen}
      >
        Envoyer rappel
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Envoyer un rappel de paiement</DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              fullWidth
              label="ID Facture"
              value={invoiceId}
              disabled
            />
            
            <FormControl fullWidth>
              <InputLabel id="reminder-type-label">Type de rappel</InputLabel>
              <Select
                labelId="reminder-type-label"
                name="reminderType"
                value={formData.reminderType}
                onChange={handleChange}
                label="Type de rappel"
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="both">Email et SMS</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Message personnalisé"
              name="message"
              value={formData.message}
              onChange={handleChange}
              multiline
              rows={4}
              placeholder="Ajoutez un message personnalisé au rappel standard..."
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Annuler
          </Button>
          
          <LoadingButton 
            loading={loading} 
            onClick={handleSubmit}
            variant="contained"
            color="warning"
          >
            Envoyer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

ComptableReminderButton.propTypes = {
  invoiceId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
};
