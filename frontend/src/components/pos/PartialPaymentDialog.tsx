// ABOUTME: Diálogo para registrar pagos parciales (abonos) en cuentas abiertas de pacientes
// Permite al cajero recibir pagos antes del cierre final de la cuenta
import React, { useState } from 'react';
import { useForm, Controller, Resolver } from 'react-hook-form';
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
} from '@mui/icons-material';

import { posService } from '@/services/posService';
import { PatientAccount } from '@/types/pos.types';

interface PartialPaymentDialogProps {
  open: boolean;
  account: PatientAccount | null;
  onClose: () => void;
  onPaymentRegistered: () => void;
}

interface PartialPaymentFormValues {
  monto: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  observaciones: string;
}

const partialPaymentSchema = yup.object().shape({
  monto: yup
    .number()
    .required('El monto es requerido')
    .positive('El monto debe ser mayor a cero')
    .typeError('Ingrese un monto válido'),
  metodoPago: yup
    .string()
    .required('El método de pago es requerido')
    .oneOf(['efectivo', 'tarjeta', 'transferencia'], 'Método de pago inválido'),
  observaciones: yup.string().max(500, 'Máximo 500 caracteres'),
});

const PartialPaymentDialog: React.FC<PartialPaymentDialogProps> = ({
  open,
  account,
  onClose,
  onPaymentRegistered,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartialPaymentFormValues>({
    resolver: yupResolver(partialPaymentSchema) as Resolver<PartialPaymentFormValues>,
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

  const onSubmit = async (data: PartialPaymentFormValues) => {
    if (!account) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validación P1.1: Pago parcial excesivo
    const saldoFuturo = (account.saldoPendiente || 0) + data.monto;
    const anticipo = account.anticipo || 0;

    // Si el saldo futuro supera el 150% del anticipo, mostrar advertencia
    if (saldoFuturo > anticipo * 1.5) {
      const exceso = saldoFuturo - anticipo;
      setError(
        `⚠️ Advertencia: Este pago generará un crédito excesivo a favor del paciente de $${exceso.toFixed(2)}. ` +
        `El saldo futuro será de $${saldoFuturo.toFixed(2)}, superando el anticipo inicial ($${anticipo.toFixed(2)}) en un 50%.`
      );
      setLoading(false);
      return;
    }

    try {
      const response = await posService.registerPartialPayment(account.id, {
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
        setError(response.message || 'Error al registrar el pago parcial');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar el pago parcial');
    } finally {
      setLoading(false);
    }
  };

  if (!account) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="partial-payment-dialog"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PaymentIcon color="primary" />
          <Typography variant="h6">Registrar Pago Parcial</Typography>
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
            ✅ Pago parcial registrado exitosamente
          </Alert>
        )}

        {/* Información de la cuenta */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Información de la cuenta
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Paciente:</strong>
              </Typography>
              <Typography variant="body2">
                {account.paciente?.nombre} {account.paciente?.apellidos}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Saldo Actual:</strong>
              </Typography>
              <Typography
                variant="body2"
                color={account.saldoPendiente >= 0 ? 'success.main' : 'error.main'}
              >
                ${account.saldoPendiente?.toFixed(2) || '0.00'}
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
                    helperText={errors.monto?.message}
                    inputProps={{
                      step: '0.01',
                      min: '0.01',
                      'data-testid': 'monto-pago',
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
                    <InputLabel id="metodo-pago-label">Método de Pago</InputLabel>
                    <Select
                      {...field}
                      labelId="metodo-pago-label"
                      label="Método de Pago"
                      data-testid="metodo-pago"
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
                    helperText={errors.observaciones?.message || 'Ej: Primer abono del paciente'}
                    inputProps={{
                      maxLength: 500,
                      'data-testid': 'observaciones-pago',
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
          data-testid="registrar-pago-button"
        >
          {loading ? 'Registrando...' : 'Registrar Pago'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PartialPaymentDialog;
