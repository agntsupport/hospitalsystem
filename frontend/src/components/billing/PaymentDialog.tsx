import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Receipt as InvoiceIcon
} from '@mui/icons-material';

import { billingService } from '@/services/billingService';
import { Invoice, CreatePaymentRequest, PAYMENT_METHODS } from '@/types/billing.types';

interface PaymentDialogProps {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  invoice,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePaymentRequest>({
    facturaId: 0,
    monto: 0,
    metodoPago: 'cash',
    fechaPago: new Date().toISOString().split('T')[0],
    referencia: '',
    banco: '',
    autorizacion: '',
    observaciones: ''
  });

  React.useEffect(() => {
    if (invoice && open) {
      setFormData({
        facturaId: invoice.id,
        monto: invoice.saldoPendiente,
        metodoPago: 'cash',
        fechaPago: new Date().toISOString().split('T')[0],
        referencia: '',
        banco: '',
        autorizacion: '',
        observaciones: ''
      });
      setError(null);
    }
  }, [invoice, open]);

  const handleClose = () => {
    setFormData({
      facturaId: 0,
      monto: 0,
      metodoPago: 'cash',
      fechaPago: new Date().toISOString().split('T')[0],
      referencia: '',
      banco: '',
      autorizacion: '',
      observaciones: ''
    });
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice) return;

    setLoading(true);
    setError(null);

    try {
      // Validar datos
      const validation = billingService.validatePaymentData(formData);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }

      const response = await billingService.createPayment(formData);

      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Error al registrar pago');
      }
    } catch (err: any) {
      setError('Error al registrar pago');
      console.error('Error creating payment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof CreatePaymentRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isCardPayment = formData.metodoPago === 'card';
  const isTransferPayment = formData.metodoPago === 'transfer';
  const isCheckPayment = formData.metodoPago === 'check';

  if (!invoice) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentIcon color="primary" />
        Registrar Pago
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Información de la factura */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InvoiceIcon fontSize="small" />
              Información de la Factura
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Folio:</Typography>
                <Typography variant="body1" fontWeight="medium">{invoice.folio}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Paciente:</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {invoice.paciente.nombre} {invoice.paciente.apellidoPaterno}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Total:</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {billingService.formatCurrency(invoice.total)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Pagado:</Typography>
                <Typography variant="body1" color="success.main" fontWeight="medium">
                  {billingService.formatCurrency(invoice.total - invoice.saldoPendiente)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Saldo Pendiente:</Typography>
                <Typography variant="body1" color="warning.main" fontWeight="medium">
                  {billingService.formatCurrency(invoice.saldoPendiente)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Datos del pago */}
          <Typography variant="h6" gutterBottom>
            Datos del Pago
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monto"
                type="number"
                value={formData.monto}
                onChange={(e) => handleFieldChange('monto', parseFloat(e.target.value) || 0)}
                required
                inputProps={{ 
                  min: 0.01, 
                  max: invoice.saldoPendiente,
                  step: 0.01 
                }}
                helperText={`Máximo: ${billingService.formatCurrency(invoice.saldoPendiente)}`}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={formData.metodoPago}
                  label="Método de Pago"
                  onChange={(e) => handleFieldChange('metodoPago', e.target.value)}
                >
                  {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Pago"
                type="date"
                value={formData.fechaPago}
                onChange={(e) => handleFieldChange('fechaPago', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* Campos específicos por método de pago */}
            {isCardPayment && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Banco"
                    value={formData.banco}
                    onChange={(e) => handleFieldChange('banco', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Código de Autorización"
                    value={formData.autorizacion}
                    onChange={(e) => handleFieldChange('autorizacion', e.target.value)}
                    required
                  />
                </Grid>
              </>
            )}

            {isTransferPayment && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Referencia Bancaria"
                  value={formData.referencia}
                  onChange={(e) => handleFieldChange('referencia', e.target.value)}
                  required
                />
              </Grid>
            )}

            {isCheckPayment && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número de Cheque"
                  value={formData.referencia}
                  onChange={(e) => handleFieldChange('referencia', e.target.value)}
                  required
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={2}
                value={formData.observaciones}
                onChange={(e) => handleFieldChange('observaciones', e.target.value)}
                placeholder="Observaciones adicionales sobre el pago..."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || formData.monto <= 0 || formData.monto > invoice.saldoPendiente}
            startIcon={<PaymentIcon />}
          >
            {loading ? 'Registrando...' : 'Registrar Pago'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentDialog;