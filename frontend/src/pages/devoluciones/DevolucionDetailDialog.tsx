// ABOUTME: Diálogo para ver detalle de una devolución
// ABOUTME: Muestra información completa, historial de estados y productos

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  AssignmentReturn as DevolucionIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

import { Devolucion, EstadoDevolucion } from '@/services/devolucionesService';

interface DevolucionDetailDialogProps {
  open: boolean;
  devolucion: Devolucion | null;
  onClose: () => void;
}

const DevolucionDetailDialog: React.FC<DevolucionDetailDialogProps> = ({
  open,
  devolucion,
  onClose,
}) => {
  if (!devolucion) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getEstadoColor = (estado: EstadoDevolucion) => {
    const colores: Record<EstadoDevolucion, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
      pendiente_autorizacion: 'warning',
      autorizada: 'info',
      procesada: 'success',
      rechazada: 'error',
      cancelada: 'default',
    };
    return colores[estado];
  };

  const getEstadoLabel = (estado: EstadoDevolucion) => {
    const labels: Record<EstadoDevolucion, string> = {
      pendiente_autorizacion: 'Pendiente de Autorización',
      autorizada: 'Autorizada',
      procesada: 'Procesada',
      rechazada: 'Rechazada',
      cancelada: 'Cancelada',
    };
    return labels[estado];
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DevolucionIcon color="primary" />
        Detalle de Devolución {devolucion.numero}
        <Box sx={{ ml: 'auto' }}>
          <Chip
            label={getEstadoLabel(devolucion.estado)}
            color={getEstadoColor(devolucion.estado)}
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Información general */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Información General
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Número:</strong> {devolucion.numero}
                </Typography>
                <Typography variant="body2">
                  <strong>Tipo:</strong> {devolucion.tipo.replace('_', ' ').toUpperCase()}
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
                  <strong>Monto:</strong> {formatCurrency(devolucion.montoDevolucion)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Información de cuenta/paciente */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon fontSize="small" />
                Paciente / Cuenta
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Paciente:</strong>{' '}
                  {devolucion.cuenta?.paciente
                    ? `${devolucion.cuenta.paciente.nombre} ${devolucion.cuenta.paciente.apellidoPaterno}`
                    : '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Cuenta #:</strong> {devolucion.cuenta?.numero || '-'}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Timeline/fechas */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Historial
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Solicitud
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(devolucion.fechaSolicitud)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Por: {devolucion.cajeroSolicita?.nombre || devolucion.cajeroSolicita?.username || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Autorización
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(devolucion.fechaAutorizacion)}
                  </Typography>
                  {devolucion.autorizador && (
                    <Typography variant="caption" color="text.secondary">
                      Por: {devolucion.autorizador.nombre || devolucion.autorizador.username}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Procesado
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(devolucion.fechaProceso)}
                  </Typography>
                  {devolucion.metodoPagoDevolucion && (
                    <Typography variant="caption" color="text.secondary">
                      Método: {devolucion.metodoPagoDevolucion}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Estado Actual
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={getEstadoLabel(devolucion.estado)}
                      color={getEstadoColor(devolucion.estado)}
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Productos devueltos */}
          {devolucion.productosDevueltos && devolucion.productosDevueltos.length > 0 && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon fontSize="small" />
                  Productos Devueltos
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell align="right">Cant. Original</TableCell>
                        <TableCell align="right">Cant. Devuelta</TableCell>
                        <TableCell align="right">Precio Unit.</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Regresa Inv.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {devolucion.productosDevueltos.map((prod) => (
                        <TableRow key={prod.id}>
                          <TableCell>
                            {prod.producto?.nombre || `Producto ${prod.productoId}`}
                          </TableCell>
                          <TableCell align="right">{prod.cantidadOriginal}</TableCell>
                          <TableCell align="right">{prod.cantidadDevuelta}</TableCell>
                          <TableCell align="right">{formatCurrency(prod.precioUnitario)}</TableCell>
                          <TableCell align="right">{formatCurrency(prod.subtotal)}</TableCell>
                          <TableCell>
                            <Chip
                              label={prod.estadoProducto}
                              size="small"
                              color={prod.estadoProducto === 'bueno' ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {prod.regresaInventario ? 'Sí' : 'No'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}

          {/* Observaciones */}
          {devolucion.observaciones && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Observaciones
                </Typography>
                <Typography variant="body2">
                  {devolucion.observaciones}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DevolucionDetailDialog;
