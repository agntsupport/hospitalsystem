import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
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
  Divider,
  FormHelperText,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Receipt as InvoiceIcon
} from '@mui/icons-material';

import { billingService } from '@/services/billingService';
import { Invoice, CreatePaymentRequest, PAYMENT_METHODS } from '@/types/billing.types';
import { paymentFormSchema, PaymentFormValues } from '@/schemas/billing.schemas';

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
  // React Hook Form setup
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: yupResolver(paymentFormSchema),
    defaultValues: {
      facturaId: 0,
      monto: 0,
      metodoPago: 'cash',
      fechaPago: new Date().toISOString().split('T')[0],
      referencia: '',
      banco: '',
      autorizacion: '',
      observaciones: '',
    },
  });

  const watchedMetodoPago = watch('metodoPago');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (invoice && open) {
      reset({
        facturaId: invoice.id,
        monto: invoice.saldoPendiente,
        metodoPago: 'cash',
        fechaPago: new Date().toISOString().split('T')[0],
        referencia: '',
        banco: '',
        autorizacion: '',
        observaciones: '',
      });
      setError(null);
    }
  }, [invoice, open, reset]);

  const handleClose = () => {
    reset({
      facturaId: 0,
      monto: 0,
      metodoPago: 'cash',
      fechaPago: new Date().toISOString().split('T')[0],
      referencia: '',
      banco: '',
      autorizacion: '',
      observaciones: '',
    });
    setError(null);
    onClose();
  };

  const onSubmit = async (data: PaymentFormValues) => {
    if (!invoice) return;

    setLoading(true);
    setError(null);

    try {
      const paymentRequest: CreatePaymentRequest = {
        facturaId: data.facturaId,
        monto: data.monto,
        metodoPago: data.metodoPago,
        fechaPago: data.fechaPago,
        referencia: data.referencia || '',
        banco: data.banco || '',
        autorizacion: data.autorizacion || '',
        observaciones: data.observaciones || '',
      };

      const response = await billingService.createPayment(paymentRequest);

      if (response.success) {
        onSuccess();
        handleClose();
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

  const isCardPayment = watchedMetodoPago === 'card';
  const isTransferPayment = watchedMetodoPago === 'transfer';
  const isCheckPayment = watchedMetodoPago === 'check';

  if (!invoice) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth closeAfterTransition={false}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentIcon color="primary" />
        Registrar Pago
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
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
              <Controller
                name="monto"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Monto"
                    type="number"
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || `Máximo: ${billingService.formatCurrency(invoice.saldoPendiente)}`}
                    inputProps={{ 
                      min: 0.01, 
                      max: invoice.saldoPendiente,
                      step: 0.01 
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="metodoPago"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth required error={!!fieldState.error}>
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      {...field}
                      label="Método de Pago"
                    >
                      {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                        <MenuItem key={key} value={key}>{label}</MenuItem>
                      ))}
                    </Select>
                    {fieldState.error && (
                      <FormHelperText>{fieldState.error.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="fechaPago"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Fecha de Pago"
                    type="date"
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            {/* Campos específicos por método de pago */}
            {isCardPayment && (
              <>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="banco"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Banco"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="autorizacion"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Código de Autorización"
                        required
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {isTransferPayment && (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="referencia"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Referencia Bancaria"
                      required
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {isCheckPayment && (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="referencia"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Número de Cheque"
                      required
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Controller
                name="observaciones"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Observaciones"
                    multiline
                    rows={2}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    placeholder="Observaciones adicionales sobre el pago..."
                  />
                )}
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
              disabled={loading}
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