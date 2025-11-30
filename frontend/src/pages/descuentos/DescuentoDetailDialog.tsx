// ABOUTME: Diálogo para ver el detalle completo de un descuento
// ABOUTME: Muestra información de la cuenta, política, montos y estados

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
  LocalOffer as DescuentoIcon,
  Person,
  Receipt,
  CalendarToday,
  Check,
  Close,
} from '@mui/icons-material';

import { DescuentoAplicado, EstadoDescuento } from '@/services/descuentosService';
import { formatCurrency } from '@/utils/formatters';

interface DescuentoDetailDialogProps {
  open: boolean;
  onClose: () => void;
  descuento: DescuentoAplicado;
}

const DescuentoDetailDialog: React.FC<DescuentoDetailDialogProps> = ({
  open,
  onClose,
  descuento,
}) => {
  const getEstadoColor = (estado: EstadoDescuento): 'default' | 'warning' | 'success' | 'error' | 'info' => {
    const colors: Record<EstadoDescuento, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
      'pendiente': 'warning',
      'autorizado': 'success',
      'rechazado': 'error',
      'aplicado': 'info',
      'revertido': 'default'
    };
    return colors[estado] || 'default';
  };

  const getEstadoLabel = (estado: EstadoDescuento): string => {
    const labels: Record<EstadoDescuento, string> = {
      'pendiente': 'Pendiente',
      'autorizado': 'Autorizado',
      'rechazado': 'Rechazado',
      'aplicado': 'Aplicado',
      'revertido': 'Revertido'
    };
    return labels[estado] || estado;
  };

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DescuentoIcon color="primary" />
        Detalle de Descuento #{descuento.id}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Estado */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Estado:
            </Typography>
            <Chip
              label={getEstadoLabel(descuento.estado)}
              color={getEstadoColor(descuento.estado)}
              icon={descuento.estado === 'autorizado' || descuento.estado === 'aplicado' ? <Check /> : descuento.estado === 'rechazado' ? <Close /> : undefined}
            />
          </Box>

          <Divider />

          {/* Información de la cuenta */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Receipt fontSize="small" /> Cuenta
            </Typography>
            <Box sx={{ pl: 3 }}>
              <Typography>
                Cuenta #{descuento.cuentaId}
              </Typography>
              {descuento.cuenta?.paciente && (
                <Typography variant="body2" color="text.secondary">
                  Paciente: {descuento.cuenta.paciente.nombre} {descuento.cuenta.paciente.apellidoPaterno}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Política */}
          {descuento.politica && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Política Aplicada
              </Typography>
              <Box sx={{ pl: 3 }}>
                <Chip label={descuento.politica.nombre} color="primary" variant="outlined" />
              </Box>
            </Box>
          )}

          {/* Montos */}
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Tipo de Descuento
                </Typography>
                <Typography fontWeight="medium">
                  {getTipoLabel(descuento.tipo)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Tipo de Cálculo
                </Typography>
                <Typography fontWeight="medium">
                  {descuento.tipoCalculo === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
                </Typography>
              </Grid>
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
                  Valor del Descuento
                </Typography>
                <Typography fontWeight="medium">
                  {descuento.tipoCalculo === 'porcentaje'
                    ? `${descuento.valorDescuento}%`
                    : formatCurrency(descuento.valorDescuento)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Monto del Descuento
                </Typography>
                <Typography variant="h5" color="error.main" fontWeight="bold">
                  -{formatCurrency(descuento.montoDescuento)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Motivo */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Motivo de Solicitud
            </Typography>
            <Typography sx={{ pl: 1 }}>
              {descuento.motivoSolicitud || '-'}
            </Typography>
          </Box>

          {/* Motivo de rechazo (si aplica) */}
          {descuento.motivoRechazo && (
            <Box sx={{ bgcolor: 'error.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
                Motivo de Rechazo
              </Typography>
              <Typography color="error.dark">
                {descuento.motivoRechazo}
              </Typography>
            </Box>
          )}

          {/* Observaciones */}
          {descuento.observaciones && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Observaciones
              </Typography>
              <Typography sx={{ pl: 1 }}>
                {descuento.observaciones}
              </Typography>
            </Box>
          )}

          <Divider />

          {/* Información de personas */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Person fontSize="small" /> Información de Gestión
            </Typography>
            <Grid container spacing={2} sx={{ pl: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Solicitante
                </Typography>
                <Typography>
                  {descuento.solicitante?.nombre || descuento.solicitante?.username || '-'}
                </Typography>
              </Grid>
              {descuento.autorizador && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Autorizador
                  </Typography>
                  <Typography>
                    {descuento.autorizador.nombre || descuento.autorizador.username}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Fechas */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarToday fontSize="small" /> Fechas
            </Typography>
            <Grid container spacing={2} sx={{ pl: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Solicitud
                </Typography>
                <Typography>
                  {new Date(descuento.fechaSolicitud).toLocaleString()}
                </Typography>
              </Grid>
              {descuento.fechaAutorizacion && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Autorización
                  </Typography>
                  <Typography>
                    {new Date(descuento.fechaAutorizacion).toLocaleString()}
                  </Typography>
                </Grid>
              )}
              {descuento.fechaAplicacion && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Aplicación
                  </Typography>
                  <Typography>
                    {new Date(descuento.fechaAplicacion).toLocaleString()}
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

export default DescuentoDetailDialog;
