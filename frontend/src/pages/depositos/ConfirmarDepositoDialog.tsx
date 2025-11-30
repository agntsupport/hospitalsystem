// ABOUTME: Diálogo para confirmar o rechazar un depósito pendiente
// ABOUTME: Permite al administrador ingresar ficha bancaria o rechazar

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
} from '@mui/material';
import { Check, Close, AccountBalance } from '@mui/icons-material';

import { bancosService, DepositoBancario } from '@/services/bancosService';
import { formatCurrency } from '@/utils/formatters';

interface ConfirmarDepositoDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deposito: DepositoBancario;
}

const ConfirmarDepositoDialog: React.FC<ConfirmarDepositoDialogProps> = ({
  open,
  onClose,
  onSuccess,
  deposito,
}) => {
  const [numeroFicha, setNumeroFicha] = useState('');
  const [fechaDeposito, setFechaDeposito] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'confirmar' | 'rechazar' | null>(null);

  const handleConfirmar = async () => {
    if (!numeroFicha.trim()) {
      setError('El número de ficha bancaria es requerido');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await bancosService.confirmar(deposito.id, {
        numeroFicha: numeroFicha.trim(),
        fechaDeposito: fechaDeposito || undefined,
        observaciones: observaciones.trim() || undefined,
      });

      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Error al confirmar depósito');
      }
    } catch (err: any) {
      setError(err.message || 'Error al confirmar depósito');
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
      const response = await bancosService.rechazar(deposito.id, motivoRechazo.trim());

      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Error al rechazar depósito');
      }
    } catch (err: any) {
      setError(err.message || 'Error al rechazar depósito');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNumeroFicha('');
    setFechaDeposito('');
    setObservaciones('');
    setMotivoRechazo('');
    setError(null);
    setAction(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountBalance color="primary" />
        {action === 'rechazar' ? 'Rechazar Depósito' : 'Confirmar Depósito'}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Resumen del depósito */}
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Resumen del Depósito
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Número
                </Typography>
                <Typography fontWeight="medium">{deposito.numero}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Cuenta
                </Typography>
                <Typography fontWeight="medium">
                  {deposito.cuentaBancaria?.alias || '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Preparado Por
                </Typography>
                <Typography fontWeight="medium">
                  {deposito.preparadoPor?.nombre || deposito.preparadoPor?.username || '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {formatCurrency(deposito.montoTotal)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Formulario según acción */}
          {action === null ? (
            <Alert severity="info">
              Verifica la ficha bancaria y selecciona una acción: Confirmar o Rechazar
            </Alert>
          ) : action === 'confirmar' ? (
            <>
              <TextField
                label="Número de Ficha Bancaria"
                value={numeroFicha}
                onChange={(e) => setNumeroFicha(e.target.value)}
                fullWidth
                required
                placeholder="Ej: 1234567890"
                helperText="Número que aparece en el comprobante del banco"
              />

              <TextField
                type="date"
                label="Fecha de Depósito"
                value={fechaDeposito}
                onChange={(e) => setFechaDeposito(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Fecha que aparece en la ficha (opcional)"
              />

              <TextField
                label="Observaciones (opcional)"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                multiline
                rows={2}
                fullWidth
              />
            </>
          ) : (
            <TextField
              label="Motivo del Rechazo"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              multiline
              rows={3}
              fullWidth
              required
              placeholder="Explica por qué se rechaza este depósito"
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
                onClick={() => setAction('confirmar')}
              >
                Confirmar
              </Button>
            </>
          ) : action === 'confirmar' ? (
            <>
              <Button onClick={() => setAction(null)} disabled={loading}>
                Volver
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<Check />}
                onClick={handleConfirmar}
                disabled={loading || !numeroFicha.trim()}
              >
                {loading ? 'Confirmando...' : 'Confirmar Depósito'}
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

export default ConfirmarDepositoDialog;
