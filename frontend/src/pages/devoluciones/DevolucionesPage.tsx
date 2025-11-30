// ABOUTME: Página principal del módulo de Devoluciones
// ABOUTME: Gestiona solicitudes, autorizaciones y procesamiento de devoluciones

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  PlayArrow as ProcessIcon,
  Refresh as RefreshIcon,
  AssignmentReturn as DevolucionIcon,
  PendingActions as PendingIcon,
  History as HistoryIcon,
  Assessment as StatsIcon,
} from '@mui/icons-material';

import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import {
  devolucionesService,
  Devolucion,
  EstadoDevolucion,
  EstadisticasDevolucion,
} from '@/services/devolucionesService';
import { useAuth } from '@/hooks/useAuth';
import NuevaDevolucionDialog from './NuevaDevolucionDialog';
import DevolucionDetailDialog from './DevolucionDetailDialog';
import AutorizarDevolucionDialog from './AutorizarDevolucionDialog';
import ProcesarDevolucionDialog from './ProcesarDevolucionDialog';

const DevolucionesPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Datos
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [pendientes, setPendientes] = useState<Devolucion[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasDevolucion | null>(null);

  // Dialogs
  const [nuevaDialogOpen, setNuevaDialogOpen] = useState(false);
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);
  const [autorizarDialogOpen, setAutorizarDialogOpen] = useState(false);
  const [procesarDialogOpen, setProcesarDialogOpen] = useState(false);
  const [selectedDevolucion, setSelectedDevolucion] = useState<Devolucion | null>(null);

  // Filtros
  const [currentTab, setCurrentTab] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState<EstadoDevolucion | ''>('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');

  const isAdmin = user?.rol === 'administrador';

  const loadDevoluciones = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = { limit: 50 };
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroFechaInicio) params.fechaInicio = filtroFechaInicio;
      if (filtroFechaFin) params.fechaFin = filtroFechaFin;

      const [devResponse, pendResponse] = await Promise.all([
        devolucionesService.getDevoluciones(params),
        isAdmin ? devolucionesService.getPendientes() : Promise.resolve({ success: true, data: [] }),
      ]);

      if (devResponse.success && devResponse.data) {
        setDevoluciones(devResponse.data.items || []);
      }

      if (isAdmin && pendResponse.success && pendResponse.data) {
        setPendientes(Array.isArray(pendResponse.data) ? pendResponse.data : []);
      }

      // Cargar estadísticas solo para admin
      if (isAdmin) {
        const statsResponse = await devolucionesService.getEstadisticas({
          fechaInicio: filtroFechaInicio || undefined,
          fechaFin: filtroFechaFin || undefined,
        });
        if (statsResponse.success && statsResponse.data) {
          setEstadisticas(statsResponse.data.data || statsResponse.data);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar devoluciones');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroFechaInicio, filtroFechaFin, isAdmin]);

  useEffect(() => {
    loadDevoluciones();
  }, [loadDevoluciones]);

  const handleViewDevolucion = (dev: Devolucion) => {
    setSelectedDevolucion(dev);
    setDetalleDialogOpen(true);
  };

  const handleAutorizar = (dev: Devolucion) => {
    setSelectedDevolucion(dev);
    setAutorizarDialogOpen(true);
  };

  const handleProcesar = (dev: Devolucion) => {
    setSelectedDevolucion(dev);
    setProcesarDialogOpen(true);
  };

  const handleSuccess = (message: string) => {
    setSuccess(message);
    setNuevaDialogOpen(false);
    setAutorizarDialogOpen(false);
    setProcesarDialogOpen(false);
    setSelectedDevolucion(null);
    loadDevoluciones();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      dateStyle: 'short',
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
      pendiente_autorizacion: 'Pendiente',
      autorizada: 'Autorizada',
      procesada: 'Procesada',
      rechazada: 'Rechazada',
      cancelada: 'Cancelada',
    };
    return labels[estado];
  };

  if (loading && devoluciones.length === 0) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Devoluciones"
        subtitle="Gestión de devoluciones y reembolsos"
        icon={<DevolucionIcon />}
        iconColor="primary"
        actions={[
          {
            label: 'Nueva Devolución',
            icon: <AddIcon />,
            onClick: () => setNuevaDialogOpen(true),
            variant: 'contained' as const,
          },
        ]}
      />

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Estadísticas (solo admin) */}
      {isAdmin && estadisticas && (
        <Grid container spacing={3} sx={{ mt: 1, mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Devoluciones"
              value={estadisticas.total.toString()}
              icon={<DevolucionIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Monto Devuelto"
              value={formatCurrency(estadisticas.montoTotalDevuelto)}
              icon={<StatsIcon />}
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pendientes"
              value={pendientes.length.toString()}
              icon={<PendingIcon />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Procesadas (Mes)"
              value={estadisticas.porEstado.find(e => e.estado === 'procesada')?.cantidad.toString() || '0'}
              icon={<ApproveIcon />}
              color="success"
            />
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Card>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<HistoryIcon />}
            label="Historial"
            iconPosition="start"
          />
          {isAdmin && (
            <Tab
              icon={
                <Badge badgeContent={pendientes.length} color="warning">
                  <PendingIcon />
                </Badge>
              }
              label="Pendientes de Autorización"
              iconPosition="start"
            />
          )}
        </Tabs>

        <CardContent>
          {currentTab === 0 && (
            <>
              {/* Filtros */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={filtroEstado}
                      label="Estado"
                      onChange={(e) => setFiltroEstado(e.target.value as EstadoDevolucion | '')}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="pendiente_autorizacion">Pendiente</MenuItem>
                      <MenuItem value="autorizada">Autorizada</MenuItem>
                      <MenuItem value="procesada">Procesada</MenuItem>
                      <MenuItem value="rechazada">Rechazada</MenuItem>
                      <MenuItem value="cancelada">Cancelada</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Fecha Inicio"
                    type="date"
                    size="small"
                    value={filtroFechaInicio}
                    onChange={(e) => setFiltroFechaInicio(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Fecha Fin"
                    type="date"
                    size="small"
                    value={filtroFechaFin}
                    onChange={(e) => setFiltroFechaFin(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Tooltip title="Actualizar">
                    <IconButton onClick={loadDevoluciones}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>

              {/* Tabla de devoluciones */}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Número</TableCell>
                      <TableCell>Paciente</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Motivo</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {devoluciones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="text.secondary" sx={{ py: 3 }}>
                            No se encontraron devoluciones
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      devoluciones.map((dev) => (
                        <TableRow key={dev.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {dev.numero}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {dev.cuenta?.paciente
                              ? `${dev.cuenta.paciente.nombre} ${dev.cuenta.paciente.apellidoPaterno}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={dev.tipo.replace('_', ' ').toUpperCase()}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{dev.motivo?.descripcion || '-'}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                            {formatCurrency(dev.montoDevolucion)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getEstadoLabel(dev.estado)}
                              color={getEstadoColor(dev.estado)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDateTime(dev.fechaSolicitud)}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ver detalle">
                              <IconButton size="small" onClick={() => handleViewDevolucion(dev)}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {dev.estado === 'autorizada' && (
                              <Tooltip title="Procesar devolución">
                                <IconButton size="small" color="success" onClick={() => handleProcesar(dev)}>
                                  <ProcessIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {currentTab === 1 && isAdmin && (
            <>
              <Typography variant="h6" gutterBottom>
                Devoluciones Pendientes de Autorización
              </Typography>

              {pendientes.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ApproveIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                  <Typography color="text.secondary">
                    No hay devoluciones pendientes de autorización
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Número</TableCell>
                        <TableCell>Paciente</TableCell>
                        <TableCell>Solicitado por</TableCell>
                        <TableCell>Motivo</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendientes.map((dev) => (
                        <TableRow key={dev.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {dev.numero}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {dev.cuenta?.paciente
                              ? `${dev.cuenta.paciente.nombre} ${dev.cuenta.paciente.apellidoPaterno}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {dev.cajeroSolicita?.nombre || dev.cajeroSolicita?.username || '-'}
                          </TableCell>
                          <TableCell>{dev.motivo?.descripcion || '-'}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                            {formatCurrency(dev.montoDevolucion)}
                          </TableCell>
                          <TableCell>{formatDateTime(dev.fechaSolicitud)}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ver detalle">
                              <IconButton size="small" onClick={() => handleViewDevolucion(dev)}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Autorizar">
                              <IconButton size="small" color="success" onClick={() => handleAutorizar(dev)}>
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NuevaDevolucionDialog
        open={nuevaDialogOpen}
        onClose={() => setNuevaDialogOpen(false)}
        onSuccess={() => handleSuccess('Solicitud de devolución creada correctamente')}
      />

      <DevolucionDetailDialog
        open={detalleDialogOpen}
        devolucion={selectedDevolucion}
        onClose={() => {
          setDetalleDialogOpen(false);
          setSelectedDevolucion(null);
        }}
      />

      <AutorizarDevolucionDialog
        open={autorizarDialogOpen}
        devolucion={selectedDevolucion}
        onClose={() => {
          setAutorizarDialogOpen(false);
          setSelectedDevolucion(null);
        }}
        onSuccess={handleSuccess}
      />

      <ProcesarDevolucionDialog
        open={procesarDialogOpen}
        devolucion={selectedDevolucion}
        onClose={() => {
          setProcesarDialogOpen(false);
          setSelectedDevolucion(null);
        }}
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

export default DevolucionesPage;
