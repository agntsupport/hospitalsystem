import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  Alert,
  TextField,
  Stack,
  Badge
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  AccountBox as AccountIcon,
  LocalHospital as HospitalIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import solicitudesService, { 
  SolicitudProducto, 
  HistorialSolicitud, 
  EstadoSolicitud 
} from '../../services/solicitudesService';

interface SolicitudDetailDialogProps {
  open: boolean;
  onClose: () => void;
  solicitud: SolicitudProducto | null;
  onRefresh?: () => void;
}

const SolicitudDetailDialog: React.FC<SolicitudDetailDialogProps> = ({
  open,
  onClose,
  solicitud,
  onRefresh
}) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  // Estados para acciones
  const [loading, setLoading] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [showObservacionesInput, setShowObservacionesInput] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');

  // Resetear estados al abrir/cerrar
  useEffect(() => {
    if (open) {
      setObservaciones('');
      setShowObservacionesInput(false);
      setCurrentAction('');
    }
  }, [open, solicitud]);

  if (!solicitud) return null;

  const getEstadoIcon = (estado: EstadoSolicitud) => {
    const icons = {
      SOLICITADO: <TimeIcon />,
      EN_PREPARACION: <InventoryIcon />,
      ENTREGADO: <ShippingIcon />,
      COMPLETADO: <CheckIcon />,
      CANCELADO: <CancelIcon />
    };
    return icons[estado as keyof typeof icons];
  };

  const getEstadoColor = (estado: EstadoSolicitud) => {
    const colors = {
      SOLICITADO: 'warning',
      EN_PREPARACION: 'info',
      ENTREGADO: 'success',
      COMPLETADO: 'success',
      CANCELADO: 'error'
    } as const;
    return colors[estado as keyof typeof colors];
  };

  const getTimelineIcon = (estado: EstadoSolicitud) => {
    const icons = {
      SOLICITADO: <AssignmentIcon />,
      EN_PREPARACION: <InventoryIcon />,
      ENTREGADO: <ShippingIcon />,
      COMPLETADO: <CheckIcon />,
      CANCELADO: <CancelIcon />
    };
    return icons[estado as keyof typeof icons];
  };

  const getAccionesDisponibles = (): string[] => {
    return solicitudesService.getAccionesDisponibles(
      solicitud, 
      currentUser?.rol || '', 
      currentUser?.id || 0
    );
  };

  const handleAction = async (action: string) => {
    try {
      setLoading(true);
      
      switch (action) {
        case 'asignar':
          await solicitudesService.asignarSolicitud(solicitud.id);
          break;
        case 'entregar':
          await solicitudesService.entregarSolicitud(solicitud.id, observaciones);
          break;
        case 'confirmar':
          await solicitudesService.confirmarSolicitud(solicitud.id, observaciones);
          break;
      }
      
      if (onRefresh) {
        onRefresh();
      }
      onClose();
    } catch (error) {
      console.error(`Error en acción ${action}:`, error);
    } finally {
      setLoading(false);
      setShowObservacionesInput(false);
      setCurrentAction('');
      setObservaciones('');
    }
  };

  const showObservacionesDialog = (action: string) => {
    setCurrentAction(action);
    setShowObservacionesInput(true);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularTiempoTranscurrido = (fechaInicio: string, fechaFin?: string) => {
    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : new Date();
    const diferencia = fin.getTime() - inicio.getTime();
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  };

  const acciones = getAccionesDisponibles();

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssignmentIcon />
          <Box>
            <Typography variant="h6">
              Solicitud {solicitud.numero}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Creada el {formatearFecha(solicitud.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              icon={getEstadoIcon(solicitud.estado)}
              label={solicitudesService.getEstadoLabel(solicitud.estado)}
              color={getEstadoColor(solicitud.estado)}
              variant="filled"
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Información General */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon />
                  Información del Paciente
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {`${solicitud.paciente.nombre} ${solicitud.paciente.apellidoPaterno} ${solicitud.paciente.apellidoMaterno || ''}`}
                  </Typography>
                </Box>

                {solicitud.paciente.numeroExpediente && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Expediente:</Typography>
                    <Typography variant="body1">
                      {solicitud.paciente.numeroExpediente}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Tipo de Atención:</Typography>
                  <Chip 
                    label={solicitud.cuentaPaciente.tipoAtencion.replace('_', ' ').toUpperCase()} 
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">Estado de Cuenta:</Typography>
                  <Chip 
                    label={solicitud.cuentaPaciente.estado.toUpperCase()} 
                    size="small"
                    color={solicitud.cuentaPaciente.estado === 'abierta' ? 'success' : 'default'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountIcon />
                  Información de la Solicitud
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Solicitante:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {solicitud.solicitante.nombre || solicitud.solicitante.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {solicitud.solicitante.rol.replace('_', ' ')}
                  </Typography>
                </Box>

                {solicitud.almacenista && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Almacenista:</Typography>
                    <Typography variant="body1">
                      {solicitud.almacenista.nombre || solicitud.almacenista.username}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Prioridad:</Typography>
                  <Chip 
                    label={solicitudesService.getPrioridadLabel(solicitud.prioridad)}
                    size="small"
                    color={solicitud.prioridad === 'URGENTE' ? 'error' : 
                           solicitud.prioridad === 'ALTA' ? 'warning' : 'default'}
                    icon={solicitud.prioridad === 'URGENTE' ? <WarningIcon /> : undefined}
                  />
                </Box>

                {solicitud.observaciones && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Observaciones:</Typography>
                    <Typography variant="body2" sx={{ 
                      p: 1, 
                      bgcolor: 'grey.50', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200'
                    }}>
                      {solicitud.observaciones}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Fechas importantes */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon />
                  Cronología
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">Tiempo Total</Typography>
                      <Typography variant="h6">
                        {calcularTiempoTranscurrido(
                          solicitud.createdAt, 
                          solicitud.fechaConfirmacion || undefined
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {solicitud.fechaEntrega && (
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">Entregado</Typography>
                        <Typography variant="body2">
                          {formatearFecha(solicitud.fechaEntrega)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {solicitud.fechaConfirmacion && (
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">Confirmado</Typography>
                        <Typography variant="body2">
                          {formatearFecha(solicitud.fechaConfirmacion)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Productos solicitados */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon />
                  Productos Solicitados
                  <Badge badgeContent={solicitud.detalles.length} color="primary" />
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Código</TableCell>
                        <TableCell>Producto</TableCell>
                        <TableCell align="center">Cantidad</TableCell>
                        <TableCell align="center">Stock Actual</TableCell>
                        <TableCell>Observaciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {solicitud.detalles.map((detalle) => (
                        <TableRow key={detalle.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {detalle.producto.codigo}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {detalle.producto.nombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {detalle.producto.unidadMedida}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="medium">
                              {detalle.cantidadSolicitada}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                              <Typography variant="body2">
                                {detalle.producto.stockActual}
                              </Typography>
                              {detalle.producto.stockActual < detalle.cantidadSolicitada && (
                                <Chip
                                  icon={<WarningIcon />}
                                  label="Insuf."
                                  color="error"
                                  size="small"
                                />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {detalle.observaciones || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Historial */}
          {solicitud.historial && solicitud.historial.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Historial de Estados
                  </Typography>
                  
                  <Timeline>
                    {solicitud.historial.map((evento, index) => (
                      <TimelineItem key={evento.id}>
                        <TimelineSeparator>
                          <TimelineDot color={getEstadoColor(evento.estadoNuevo)}>
                            {getTimelineIcon(evento.estadoNuevo)}
                          </TimelineDot>
                          {index < solicitud.historial!.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {solicitudesService.getEstadoLabel(evento.estadoNuevo)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatearFecha(evento.createdAt)} por {evento.usuario.nombre || evento.usuario.username}
                            </Typography>
                          </Box>
                          {evento.observaciones && (
                            <Typography variant="body2" color="text.secondary">
                              {evento.observaciones}
                            </Typography>
                          )}
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Input para observaciones */}
        {showObservacionesInput && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agregar Observaciones
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder={`Observaciones para ${currentAction === 'entregar' ? 'la entrega' : 'la confirmación'}...`}
                sx={{ mb: 2 }}
              />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={() => handleAction(currentAction)}
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : 'Confirmar'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowObservacionesInput(false);
                    setCurrentAction('');
                    setObservaciones('');
                  }}
                >
                  Cancelar
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={1}>
          {acciones.includes('asignar') && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AssignmentIcon />}
              onClick={() => handleAction('asignar')}
              disabled={loading}
            >
              Asignar a Mí
            </Button>
          )}
          
          {acciones.includes('entregar') && (
            <Button
              variant="contained"
              color="success"
              startIcon={<ShippingIcon />}
              onClick={() => showObservacionesDialog('entregar')}
              disabled={loading}
            >
              Marcar Entregado
            </Button>
          )}
          
          {acciones.includes('confirmar') && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={() => showObservacionesDialog('confirmar')}
              disabled={loading}
            >
              Confirmar Recepción
            </Button>
          )}
          
          <Button onClick={onClose} color="inherit">
            Cerrar
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default SolicitudDetailDialog;