// ABOUTME: Diálogo para registrar pagos contra una cuenta por cobrar existente
// Valida que el monto no exceda el saldo pendiente y actualiza el estado de la CPC
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Divider,
  FormHelperText,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

import { posService } from '@/services/posService';
import { CuentaPorCobrar } from '@/types/pos.types';

interface CPCPaymentDialogProps {
  open: boolean;
  cuentaPorCobrar: CuentaPorCobrar | null;
  onClose: () => void;
  onPaymentRegistered: () => void;
}

interface CPCPaymentFormValues {
  monto: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  observaciones: string;
}

const CPCPaymentDialog: React.FC<CPCPaymentDialogProps> = ({
  open,
  cuentaPorCobrar,
  onClose,
  onPaymentRegistered,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Crear schema dinámico basado en el saldo pendiente
  const createPaymentSchema = (maxAmount: number) =>
    yup.object().shape({
      monto: yup
        .number()
        .required('El monto es requerido')
        .positive('El monto debe ser mayor a cero')
        .max(maxAmount, `El monto no puede ser mayor al saldo pendiente ($${maxAmount.toFixed(2)})`)
        .typeError('Ingrese un monto válido'),
      metodoPago: yup
        .string()
        .required('El método de pago es requerido')
        .oneOf(['efectivo', 'tarjeta', 'transferencia'], 'Método de pago inválido'),
      observaciones: yup.string().max(500, 'Máximo 500 caracteres'),
    });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CPCPaymentFormValues>({
    resolver: yupResolver(
      createPaymentSchema(cuentaPorCobrar?.saldoPendiente || 0)
    ),
    defaultValues: {
      monto: 0,
      metodoPago: 'efectivo',
      observaciones: '',
    },
  });

  const handleClose = () => {
    reset();
    setError(null);
    setSuccess(false);
    onClose();
  };

  const onSubmit = async (data: CPCPaymentFormValues) => {
    if (!cuentaPorCobrar) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await posService.registerCPCPayment(cuentaPorCobrar.id, {
        monto: data.monto,
        metodoPago: data.metodoPago,
        observaciones: data.observaciones || undefined,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onPaymentRegistered();
          handleClose();
        }, 1500);
      } else {
        setError(response.message || 'Error al registrar el pago');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  if (!cuentaPorCobrar) return null;

  const porcentajePagado = ((cuentaPorCobrar.montoPagado / cuentaPorCobrar.montoOriginal) * 100).toFixed(1);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="cpc-payment-dialog"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PaymentIcon color="primary" />
          <Typography variant="h6">Registrar Pago contra CPC</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
            ✅ Pago registrado exitosamente
          </Alert>
        )}

        {/* Información de la CPC */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Información de la Cuenta por Cobrar
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  <strong>Paciente:</strong> {cuentaPorCobrar.paciente?.nombre}{' '}
                  {cuentaPorCobrar.paciente?.apellidos}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Monto Original
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                ${cuentaPorCobrar.montoOriginal.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Monto Pagado
              </Typography>
              <Typography variant="body1" color="success.main">
                ${cuentaPorCobrar.montoPagado.toFixed(2)} ({porcentajePagado}%)
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Saldo Pendiente
              </Typography>
              <Typography variant="h6" color="error.main" fontWeight="bold">
                ${cuentaPorCobrar.saldoPendiente.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="monto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Monto del Pago"
                    type="number"
                    fullWidth
                    required
                    error={!!errors.monto}
                    helperText={
                      errors.monto?.message ||
                      `Máximo: $${cuentaPorCobrar.saldoPendiente.toFixed(2)}`
                    }
                    inputProps={{
                      step: '0.01',
                      min: '0.01',
                      max: cuentaPorCobrar.saldoPendiente,
                      'data-testid': 'monto-pago-cpc',
                    }}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="metodoPago"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.metodoPago}>
                    <InputLabel id="metodo-pago-cpc-label">Método de Pago</InputLabel>
                    <Select
                      {...field}
                      labelId="metodo-pago-cpc-label"
                      label="Método de Pago"
                      data-testid="metodo-pago-cpc"
                    >
                      <MenuItem value="efectivo">Efectivo</MenuItem>
                      <MenuItem value="tarjeta">Tarjeta</MenuItem>
                      <MenuItem value="transferencia">Transferencia</MenuItem>
                    </Select>
                    {errors.metodoPago && (
                      <FormHelperText>{errors.metodoPago.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Observaciones (opcional)"
                    multiline
                    rows={3}
                    fullWidth
                    error={!!errors.observaciones}
                    helperText={
                      errors.observaciones?.message || 'Ej: Pago parcial acordado con gerencia'
                    }
                    inputProps={{
                      maxLength: 500,
                      'data-testid': 'observaciones-pago-cpc',
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          color="primary"
          disabled={loading || success}
          startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
          data-testid="confirmar-pago-cpc-button"
        >
          {loading ? 'Registrando...' : 'Registrar Pago'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CPCPaymentDialog;
