// ABOUTME: Diálogo para cerrar caja diaria
// ABOUTME: Muestra resumen y solicita conteo de efectivo para cierre

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
  Divider,
  Grid,
  Paper,
  Chip,
} from '@mui/material';
import {
  Lock as LockIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

import { cajaService, CajaDiaria, ResumenCaja, CerrarCajaData } from '@/services/cajaService';

interface CerrarCajaDialogProps {
  open: boolean;
  caja: CajaDiaria | null;
  resumen: ResumenCaja | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CerrarCajaDialog: React.FC<CerrarCajaDialogProps> = ({
  open,
  caja,
  resumen,
  onClose,
  onSuccess,
}) => {
  const [saldoContado, setSaldoContado] = useState<string>('');
  const [justificacion, setJustificacion] = useState('');
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

    if (Math.abs(diferencia) > 0 && !justificacion.trim()) {
      setError('Debes justificar la diferencia encontrada');
      return;
    }

    setLoading(true);

    try {
      const data: CerrarCajaData = {
        saldoFinalContado: saldoContadoNum,
        justificacionDif: justificacion || undefined,
        observaciones: observaciones || undefined,
      };

      const response = await cajaService.cerrarCaja(data);

      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Error al cerrar caja');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cerrar caja');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSaldoContado('');
    setJustificacion('');
    setObservaciones('');
    setError(null);
    onClose();
  };

  if (!caja || !resumen) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LockIcon color="warning" />
        Cerrar Caja #{caja.numero}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Resumen de la caja */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Resumen del Día
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Saldo Inicial</Typography>
              <Typography variant="h6">{formatCurrency(resumen.saldoInicial)}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Total Ingresos</Typography>
              <Typography variant="h6" color="success.main">
                +{formatCurrency(resumen.totalIngresos)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Total Egresos</Typography>
              <Typography variant="h6" color="error.main">
                -{formatCurrency(resumen.totalEgresos)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Saldo Esperado</Typography>
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                {formatCurrency(saldoEsperado)}
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Total de movimientos: {resumen.cantidadMovimientos}
          </Typography>
        </Paper>

        {/* Formulario de cierre */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Conteo de Efectivo
          </Typography>

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
            helperText="Ingresa el total de efectivo contado en caja"
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

          {/* Justificación requerida si hay diferencia */}
          {Math.abs(diferencia) > 0 && (
            <TextField
              label="Justificación de Diferencia"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              multiline
              rows={2}
              fullWidth
              required
              error={Math.abs(diferencia) > 0 && !justificacion.trim()}
              helperText="Explica la razón de la diferencia encontrada"
            />
          )}

          <TextField
            label="Observaciones (opcional)"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="Notas adicionales sobre el cierre de caja"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleSubmit}
          disabled={loading || !saldoContado || (Math.abs(diferencia) > 0 && !justificacion.trim())}
          startIcon={<LockIcon />}
        >
          {loading ? 'Cerrando...' : 'Cerrar Caja'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CerrarCajaDialog;
