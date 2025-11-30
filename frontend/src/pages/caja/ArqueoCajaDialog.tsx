// ABOUTME: Diálogo para realizar arqueo (conteo parcial) de caja
// ABOUTME: Permite verificar efectivo durante el turno sin cerrar la caja

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Alert,
  Box,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

import { cajaService, CajaDiaria, ResumenCaja, ArqueoData } from '@/services/cajaService';

interface ArqueoCajaDialogProps {
  open: boolean;
  caja: CajaDiaria | null;
  resumen: ResumenCaja | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ArqueoCajaDialog: React.FC<ArqueoCajaDialogProps> = ({
  open,
  caja,
  resumen,
  onClose,
  onSuccess,
}) => {
  const [saldoContado, setSaldoContado] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saldoEsperado = resumen?.saldoEsperado || 0;
  const saldoContadoNum = parseFloat(saldoContado) || 0;
  const diferencia = saldoContadoNum - saldoEsperado;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!saldoContado || saldoContadoNum < 0) {
      setError('Ingresa el saldo contado');
      return;
    }

    setLoading(true);

    try {
      const data: ArqueoData = {
        saldoContado: saldoContadoNum,
        observaciones: observaciones || undefined,
      };

      const response = await cajaService.realizarArqueo(data);

      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Error al realizar arqueo');
      }
    } catch (err: any) {
      setError(err.message || 'Error al realizar arqueo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSaldoContado('');
    setObservaciones('');
    setError(null);
    onClose();
  };

  if (!caja || !resumen) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalculateIcon color="primary" />
        Arqueo de Caja
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          El arqueo permite verificar el efectivo en caja durante el turno sin cerrar la caja.
          Esta operación queda registrada en el historial.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Saldo Esperado (según sistema)
            </Typography>
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              {formatCurrency(saldoEsperado)}
            </Typography>
          </Paper>

          <TextField
            label="Saldo Contado"
            type="number"
            value={saldoContado}
            onChange={(e) => setSaldoContado(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 0.01 }}
            required
            fullWidth
            autoFocus
            helperText="Cuenta el efectivo físico en caja e ingresa el total"
          />

          {/* Diferencia */}
          {saldoContado && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: Math.abs(diferencia) > 0 ? 'warning.light' : 'success.light',
                borderColor: Math.abs(diferencia) > 0 ? 'warning.main' : 'success.main',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {Math.abs(diferencia) > 0 ? (
                  <WarningIcon color="warning" />
                ) : (
                  <CheckIcon color="success" />
                )}
                <Typography variant="subtitle1" fontWeight="bold">
                  Diferencia: {formatCurrency(diferencia)}
                </Typography>
                {diferencia > 0 && (
                  <Chip label="Sobrante" color="warning" size="small" />
                )}
                {diferencia < 0 && (
                  <Chip label="Faltante" color="error" size="small" />
                )}
                {diferencia === 0 && (
                  <Chip label="Cuadrado" color="success" size="small" />
                )}
              </Box>
            </Paper>
          )}

          <TextField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="Notas sobre el arqueo realizado"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !saldoContado}
          startIcon={<CalculateIcon />}
        >
          {loading ? 'Registrando...' : 'Registrar Arqueo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArqueoCajaDialog;
