// ABOUTME: Diálogo para autorizar o rechazar una devolución
// ABOUTME: Solo disponible para administradores

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';

import { devolucionesService, Devolucion } from '@/services/devolucionesService';

interface AutorizarDevolucionDialogProps {
  open: boolean;
  devolucion: Devolucion | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const AutorizarDevolucionDialog: React.FC<AutorizarDevolucionDialogProps> = ({
  open,
  devolucion,
  onClose,
  onSuccess,
}) => {
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const handleAutorizar = async () => {
    if (!devolucion) return;

    setError(null);
    setLoading(true);

    try {
      const response = await devolucionesService.autorizar(devolucion.id, observaciones || undefined);

      if (response.success) {
        handleClose();
        onSuccess('Devolución autorizada correctamente');
      } else {
        setError(response.message || 'Error al autorizar');
      }
    } catch (err: any) {
      setError(err.message || 'Error al autorizar');
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!devolucion) return;

    if (!motivoRechazo.trim()) {
      setError('El motivo de rechazo es requerido');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await devolucionesService.rechazar(devolucion.id, motivoRechazo);

      if (response.success) {
        handleClose();
        onSuccess('Devolución rechazada');
      } else {
        setError(response.message || 'Error al rechazar');
      }
    } catch (err: any) {
      setError(err.message || 'Error al rechazar');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setObservaciones('');
    setMotivoRechazo('');
    setError(null);
    setShowReject(false);
    onClose();
  };

  if (!devolucion) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {showReject ? 'Rechazar Devolución' : 'Autorizar Devolución'}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Resumen de la devolución */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Resumen de Solicitud
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
            {devolucion.motivoDetalle && (
              <Typography variant="body2">
                <strong>Detalle:</strong> {devolucion.motivoDetalle}
              </Typography>
            )}
            <Typography variant="body2" color="error.main" fontWeight="bold">
              <strong>Monto a devolver:</strong> {formatCurrency(devolucion.montoDevolucion)}
            </Typography>
            <Typography variant="body2">
              <strong>Solicitado por:</strong>{' '}
              {devolucion.cajeroSolicita?.nombre || devolucion.cajeroSolicita?.username || '-'}
            </Typography>
          </Box>
        </Paper>

        <Divider sx={{ mb: 2 }} />

        {showReject ? (
          <TextField
            label="Motivo de Rechazo"
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
            autoFocus
            placeholder="Explica por qué se rechaza esta devolución"
          />
        ) : (
          <TextField
            label="Observaciones (opcional)"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="Notas adicionales sobre la autorización"
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Box>
          {!showReject && (
            <Button
              color="error"
              onClick={() => setShowReject(true)}
              disabled={loading}
            >
              Rechazar
            </Button>
          )}
          {showReject && (
            <Button onClick={() => setShowReject(false)} disabled={loading}>
              Volver
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          {showReject ? (
            <Button
              variant="contained"
              color="error"
              onClick={handleRechazar}
              disabled={loading || !motivoRechazo.trim()}
              startIcon={<RejectIcon />}
            >
              {loading ? 'Rechazando...' : 'Confirmar Rechazo'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleAutorizar}
              disabled={loading}
              startIcon={<ApproveIcon />}
            >
              {loading ? 'Autorizando...' : 'Autorizar'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AutorizarDevolucionDialog;
