// ABOUTME: Diálogo para ver el detalle completo de un depósito
// ABOUTME: Muestra información de cuenta, montos, estados y trazabilidad

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import {
  AccountBalance,
  Person,
  CalendarToday,
  Receipt,
} from '@mui/icons-material';

import { DepositoBancario, EstadoDeposito } from '@/services/bancosService';
import { formatCurrency } from '@/utils/formatters';

interface DepositoDetailDialogProps {
  open: boolean;
  onClose: () => void;
  deposito: DepositoBancario;
}

const DepositoDetailDialog: React.FC<DepositoDetailDialogProps> = ({
  open,
  onClose,
  deposito,
}) => {
  const getEstadoColor = (estado: EstadoDeposito): 'default' | 'warning' | 'success' | 'error' | 'info' => {
    const colors: Record<EstadoDeposito, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
      preparado: 'warning',
      depositado: 'info',
      confirmado: 'success',
      rechazado: 'error',
    };
    return colors[estado] || 'default';
  };

  const getEstadoLabel = (estado: EstadoDeposito): string => {
    const labels: Record<EstadoDeposito, string> = {
      preparado: 'Preparado',
      depositado: 'Depositado',
      confirmado: 'Confirmado',
      rechazado: 'Rechazado',
    };
    return labels[estado] || estado;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountBalance color="primary" />
        Detalle de Depósito {deposito.numero}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Estado */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Estado:
            </Typography>
            <Chip
              label={getEstadoLabel(deposito.estado)}
              color={getEstadoColor(deposito.estado)}
            />
          </Box>

          <Divider />

          {/* Información de la cuenta */}
          <Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
            >
              <AccountBalance fontSize="small" /> Cuenta Bancaria
            </Typography>
            <Box sx={{ pl: 3, bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              {deposito.cuentaBancaria ? (
                <>
                  <Typography fontWeight="medium">
                    {deposito.cuentaBancaria.alias}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {deposito.cuentaBancaria.banco} - {deposito.cuentaBancaria.numeroCuenta}
                  </Typography>
                  {deposito.cuentaBancaria.clabe && (
                    <Typography variant="body2" color="text.secondary">
                      CLABE: {deposito.cuentaBancaria.clabe}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography color="text.secondary">No disponible</Typography>
              )}
            </Box>
          </Box>

          {/* Montos */}
          <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Efectivo
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {formatCurrency(deposito.montoEfectivo)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Cheques
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {formatCurrency(deposito.montoCheques)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Total Depositado
                </Typography>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {formatCurrency(deposito.montoTotal)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Ficha bancaria (si confirmado) */}
          {deposito.numeroFicha && (
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <Receipt fontSize="small" /> Ficha Bancaria
              </Typography>
              <Box sx={{ pl: 3 }}>
                <Chip
                  label={deposito.numeroFicha}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Box>
          )}

          {/* Motivo de rechazo (si aplica) */}
          {deposito.motivoRechazo && (
            <Box sx={{ bgcolor: 'error.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
                Motivo de Rechazo
              </Typography>
              <Typography color="error.dark">{deposito.motivoRechazo}</Typography>
            </Box>
          )}

          {/* Observaciones */}
          {deposito.observaciones && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Observaciones
              </Typography>
              <Typography sx={{ pl: 1 }}>{deposito.observaciones}</Typography>
            </Box>
          )}

          <Divider />

          {/* Información de personas */}
          <Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
            >
              <Person fontSize="small" /> Trazabilidad
            </Typography>
            <Grid container spacing={2} sx={{ pl: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Preparado por
                </Typography>
                <Typography>
                  {deposito.preparadoPor?.nombre || deposito.preparadoPor?.username || '-'}
                </Typography>
              </Grid>
              {deposito.confirmadoPor && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Confirmado por
                  </Typography>
                  <Typography>
                    {deposito.confirmadoPor.nombre || deposito.confirmadoPor.username}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Fechas */}
          <Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
            >
              <CalendarToday fontSize="small" /> Fechas
            </Typography>
            <Grid container spacing={2} sx={{ pl: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Preparación
                </Typography>
                <Typography>
                  {new Date(deposito.fechaPreparacion).toLocaleString()}
                </Typography>
              </Grid>
              {deposito.fechaDeposito && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Depósito
                  </Typography>
                  <Typography>
                    {new Date(deposito.fechaDeposito).toLocaleString()}
                  </Typography>
                </Grid>
              )}
              {deposito.fechaConfirmacion && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Confirmación
                  </Typography>
                  <Typography>
                    {new Date(deposito.fechaConfirmacion).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepositoDetailDialog;
