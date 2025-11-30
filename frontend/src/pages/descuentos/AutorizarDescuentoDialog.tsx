// ABOUTME: Diálogo para autorizar o rechazar un descuento pendiente
// ABOUTME: Permite al administrador revisar y decidir sobre descuentos solicitados

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  Divider,
  Grid,
  Chip,
} from '@mui/material';
import {
  Check,
  Close,
  LocalOffer as DescuentoIcon,
} from '@mui/icons-material';

import { descuentosService, DescuentoAplicado } from '@/services/descuentosService';
import { formatCurrency } from '@/utils/formatters';

interface AutorizarDescuentoDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  descuento: DescuentoAplicado;
}

const AutorizarDescuentoDialog: React.FC<AutorizarDescuentoDialogProps> = ({
  open,
  onClose,
  onSuccess,
  descuento,
}) => {
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'autorizar' | 'rechazar' | null>(null);

  const getTipoLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      'cortesia_medica': 'Cortesía Médica',
      'empleado_hospital': 'Empleado Hospital',
      'convenio_empresa': 'Convenio Empresa',
      'promocion_temporal': 'Promoción Temporal',
      'ajuste_precio': 'Ajuste de Precio',
      'redondeo': 'Redondeo',
      'otro': 'Otro'
    };
    return labels[tipo] || tipo;
  };

  const handleAutorizar = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await descuentosService.autorizar(descuento.id, observaciones.trim() || undefined);

      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Error al autorizar descuento');
      }
    } catch (err: any) {
      setError(err.message || 'Error al autorizar descuento');
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) {
      setError('Debes indicar el motivo del rechazo');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await descuentosService.rechazar(descuento.id, motivoRechazo.trim());

      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Error al rechazar descuento');
      }
    } catch (err: any) {
      setError(err.message || 'Error al rechazar descuento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setObservaciones('');
    setMotivoRechazo('');
    setError(null);
    setAction(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DescuentoIcon color="primary" />
        {action === 'rechazar' ? 'Rechazar Descuento' : 'Autorizar Descuento'}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Resumen del descuento */}
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Resumen de la Solicitud
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Cuenta
                </Typography>
                <Typography fontWeight="medium">
                  #{descuento.cuentaId}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Paciente
                </Typography>
                <Typography fontWeight="medium">
                  {descuento.cuenta?.paciente
                    ? `${descuento.cuenta.paciente.nombre} ${descuento.cuenta.paciente.apellidoPaterno}`
                    : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Tipo
                </Typography>
                <Chip label={getTipoLabel(descuento.tipo)} size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Política
                </Typography>
                <Typography fontWeight="medium">
                  {descuento.politica?.nombre || 'Sin política'}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Monto Base
                </Typography>
                <Typography fontWeight="medium">
                  {formatCurrency(descuento.montoBaseCalculo)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Descuento Solicitado
                </Typography>
                <Typography variant="h6" color="error.main" fontWeight="bold">
                  -{formatCurrency(descuento.montoDescuento)} ({descuento.valorDescuento}%)
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary">
              Motivo de Solicitud
            </Typography>
            <Typography sx={{ mt: 0.5 }}>
              {descuento.motivoSolicitud}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Solicitante
              </Typography>
              <Typography>
                {descuento.solicitante?.nombre || descuento.solicitante?.username || '-'}
              </Typography>
            </Box>
          </Box>

          {/* Formulario según acción */}
          {action === null ? (
            <Alert severity="info">
              Revisa la solicitud y selecciona una acción: Autorizar o Rechazar
            </Alert>
          ) : action === 'autorizar' ? (
            <TextField
              label="Observaciones (opcional)"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              multiline
              rows={2}
              fullWidth
              placeholder="Agrega observaciones si es necesario"
            />
          ) : (
            <TextField
              label="Motivo del Rechazo"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              multiline
              rows={3}
              fullWidth
              required
              placeholder="Explica por qué se rechaza este descuento"
              error={!motivoRechazo.trim() && action === 'rechazar'}
              helperText={!motivoRechazo.trim() && action === 'rechazar' ? 'El motivo es requerido' : ''}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {action === null ? (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Close />}
                onClick={() => setAction('rechazar')}
              >
                Rechazar
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<Check />}
                onClick={() => setAction('autorizar')}
              >
                Autorizar
              </Button>
            </>
          ) : action === 'autorizar' ? (
            <>
              <Button onClick={() => setAction(null)} disabled={loading}>
                Volver
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<Check />}
                onClick={handleAutorizar}
                disabled={loading}
              >
                {loading ? 'Autorizando...' : 'Confirmar Autorización'}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setAction(null)} disabled={loading}>
                Volver
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Close />}
                onClick={handleRechazar}
                disabled={loading || !motivoRechazo.trim()}
              >
                {loading ? 'Rechazando...' : 'Confirmar Rechazo'}
              </Button>
            </>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AutorizarDescuentoDialog;
