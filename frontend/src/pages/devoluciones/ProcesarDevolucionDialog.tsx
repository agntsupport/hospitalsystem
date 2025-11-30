// ABOUTME: Diálogo para procesar una devolución autorizada
// ABOUTME: Requiere caja abierta, permite seleccionar método de pago

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import {
  PlayArrow as ProcessIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { devolucionesService, Devolucion } from '@/services/devolucionesService';

interface ProcesarDevolucionDialogProps {
  open: boolean;
  devolucion: Devolucion | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const ProcesarDevolucionDialog: React.FC<ProcesarDevolucionDialogProps> = ({
  open,
  devolucion,
  onClose,
  onSuccess,
}) => {
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const handleProcesar = async () => {
    if (!devolucion) return;

    setError(null);
    setLoading(true);

    try {
      const response = await devolucionesService.procesar(devolucion.id, metodoPago);

      if (response.success) {
        handleClose();
        onSuccess(`Devolución procesada. Se devolvieron ${formatCurrency(devolucion.montoDevolucion)} en ${metodoPago}`);
      } else {
        setError(response.message || 'Error al procesar');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMetodoPago('efectivo');
    setError(null);
    onClose();
  };

  if (!devolucion) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ProcessIcon color="success" />
        Procesar Devolución
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <Typography variant="body2">
            <strong>Importante:</strong> Debes tener una caja abierta para procesar esta devolución.
            El monto se registrará como egreso en tu caja.
          </Typography>
        </Alert>

        {/* Resumen */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
          <Typography variant="h6" color="error.contrastText" align="center">
            Monto a devolver: {formatCurrency(devolucion.montoDevolucion)}
          </Typography>
        </Paper>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2">
            <strong>Número:</strong> {devolucion.numero}
          </Typography>
          <Typography variant="body2">
            <strong>Paciente:</strong>{' '}
            {devolucion.cuenta?.paciente
              ? `${devolucion.cuenta.paciente.nombre} ${devolucion.cuenta.paciente.apellidoPaterno}`
              : '-'}
          </Typography>
          <Typography variant="body2">
            <strong>Motivo:</strong> {devolucion.motivo?.descripcion || '-'}
          </Typography>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Método de Pago</InputLabel>
            <Select
              value={metodoPago}
              label="Método de Pago"
              onChange={(e) => setMetodoPago(e.target.value)}
            >
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="transferencia">Transferencia</MenuItem>
              <MenuItem value="cheque">Cheque</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleProcesar}
          disabled={loading}
          startIcon={<ProcessIcon />}
        >
          {loading ? 'Procesando...' : 'Procesar Devolución'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProcesarDevolucionDialog;
