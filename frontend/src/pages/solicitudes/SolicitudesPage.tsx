// ABOUTME: Página de Solicitudes de Productos del sistema hospitalario
// ABOUTME: Gestiona las solicitudes de productos médicos y farmacéuticos

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  SelectChangeEvent,
  Stack,
  Badge,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  Visibility as ViewIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import StatCard, { StatCardsGrid } from '@/components/common/StatCard';
import { FullPageLoader } from '@/components/common/LoadingState';
import EmptyState from '@/components/common/EmptyState';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import solicitudesService, { 
  SolicitudProducto, 
  SolicitudStats, 
  EstadoSolicitud, 
  PrioridadSolicitud 
} from '../../services/solicitudesService';
import SolicitudFormDialog from './SolicitudFormDialog';
import SolicitudDetailDialog from './SolicitudDetailDialog';

const SolicitudesPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  // Estados principales
  const [solicitudes, setSolicitudes] = useState<SolicitudProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SolicitudStats | null>(null);
  
  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalSolicitudes, setTotalSolicitudes] = useState(0);
  
  // Diálogos
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudProducto | null>(null);
  
  // Menu de acciones
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuSolicitud, setMenuSolicitud] = useState<SolicitudProducto | null>(null);
  
  // Notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Verificar permisos
  useEffect(() => {
    if (!['administrador', 'enfermero', 'medico_especialista', 'medico_residente', 'almacenista'].includes(currentUser?.rol || '')) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Cargar datos iniciales
  useEffect(() => {
    loadSolicitudes();
    loadStats();
  }, [page, rowsPerPage, searchTerm, filterEstado, filterPrioridad]);

  const loadSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await solicitudesService.getSolicitudes({
        estado: filterEstado as EstadoSolicitud || undefined,
        prioridad: filterPrioridad as PrioridadSolicitud || undefined,
        page: page + 1,
        limit: rowsPerPage
      });
      
      setSolicitudes(response.data);
      setTotalSolicitudes(response.total);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      showNotification('Error al cargar solicitudes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await solicitudesService.getSolicitudStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, solicitud: SolicitudProducto) => {
    setAnchorEl(event.currentTarget);
    setMenuSolicitud(solicitud);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuSolicitud(null);
  };

  const handleViewSolicitud = (solicitud: SolicitudProducto) => {
    setSelectedSolicitud(solicitud);
    setOpenDetailDialog(true);
    handleCloseMenu();
  };

  const handleAsignarSolicitud = async (solicitud: SolicitudProducto) => {
    try {
      await solicitudesService.asignarSolicitud(solicitud.id);
      showNotification('Solicitud asignada exitosamente', 'success');
      loadSolicitudes();
      loadStats();
    } catch (error) {
      console.error('Error asignando solicitud:', error);
      showNotification('Error al asignar solicitud', 'error');
    }
    handleCloseMenu();
  };

  const handleMarcarListo = async (solicitud: SolicitudProducto) => {
    try {
      await solicitudesService.marcarListo(solicitud.id);
      showNotification('Pedido marcado como listo. Se ha notificado al solicitante.', 'success');
      loadSolicitudes();
      loadStats();
    } catch (error) {
      console.error('Error marcando como listo:', error);
      showNotification('Error al marcar como listo', 'error');
    }
    handleCloseMenu();
  };

  const handleEntregarSolicitud = async (solicitud: SolicitudProducto) => {
    try {
      await solicitudesService.entregarSolicitud(solicitud.id);
      showNotification('Solicitud marcada como entregada', 'success');
      loadSolicitudes();
      loadStats();
    } catch (error) {
      console.error('Error entregando solicitud:', error);
      showNotification('Error al entregar solicitud', 'error');
    }
    handleCloseMenu();
  };

  const handleConfirmarSolicitud = async (solicitud: SolicitudProducto) => {
    try {
      await solicitudesService.confirmarSolicitud(solicitud.id);
      showNotification('Recepción confirmada exitosamente', 'success');
      loadSolicitudes();
      loadStats();
    } catch (error) {
      console.error('Error confirmando solicitud:', error);
      showNotification('Error al confirmar recepción', 'error');
    }
    handleCloseMenu();
  };

  const handleFormSubmit = async () => {
    setOpenFormDialog(false);
    setSelectedSolicitud(null);
    await loadSolicitudes();
    await loadStats();
    showNotification('Solicitud creada exitosamente', 'success');
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({ open: true, message, severity });
  };

  const getEstadoIcon = (estado: EstadoSolicitud) => {
    const icons = {
      SOLICITADO: <TimeIcon fontSize="small" />,
      EN_PREPARACION: <InventoryIcon fontSize="small" />,
      ENTREGADO: <ShippingIcon fontSize="small" />,
      COMPLETADO: <CheckIcon fontSize="small" />,
      CANCELADO: <CancelIcon fontSize="small" />
    };
    return icons[estado as keyof typeof icons];
  };

  const getPrioridadIcon = (prioridad: PrioridadSolicitud) => {
    if (prioridad === 'URGENTE') return <WarningIcon fontSize="small" />;
    return null;
  };

  const getAccionesDisponibles = (solicitud: SolicitudProducto): string[] => {
    return solicitudesService.getAccionesDisponibles(
      solicitud, 
      currentUser?.rol || '', 
      currentUser?.id || 0
    );
  };

  const canCreateSolicitud = (): boolean => {
    return ['enfermero', 'medico_especialista', 'medico_residente'].includes(currentUser?.rol || '');
  };

  return (
    <Container maxWidth="xl">
      {/* Header unificado */}
      <PageHeader
        title="Solicitudes de Productos"
        subtitle="Gestiona las solicitudes de productos médicos y farmacéuticos"
        icon={<AssignmentIcon />}
        iconColor="primary"
      />

      {/* Estadísticas con StatCard unificado */}
      <StatCardsGrid sx={{ mb: 3 }}>
        <StatCard
          title="Total Solicitudes"
          value={stats?.totalSolicitudes || 0}
          icon={<AssignmentIcon />}
          color="primary"
          loading={!stats}
        />
        <StatCard
          title="Pendientes"
          value={stats?.solicitudesPorEstado?.find(s => s.estado === 'SOLICITADO')?.cantidad || 0}
          icon={<TimeIcon />}
          color="warning"
          loading={!stats}
        />
        <StatCard
          title="En Proceso"
          value={stats?.solicitudesPorEstado?.find(s => s.estado === ('EN_PREPARACION' as EstadoSolicitud))?.cantidad || 0}
          icon={<InventoryIcon />}
          color="info"
          loading={!stats}
        />
        <StatCard
          title="Completadas Hoy"
          value={stats?.solicitudesHoy || 0}
          icon={<CheckIcon />}
          color="success"
          loading={!stats}
        />
      </StatCardsGrid>

      {/* Filtros y acciones */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar por número, paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterEstado}
                label="Estado"
                onChange={(e: SelectChangeEvent) => setFilterEstado(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="SOLICITADO">Solicitado</MenuItem>
                <MenuItem value="NOTIFICADO">Notificado</MenuItem>
                <MenuItem value="PREPARANDO">En Preparación</MenuItem>
                <MenuItem value="LISTO_ENTREGA">Listo para Entrega</MenuItem>
                <MenuItem value="ENTREGADO">Entregado</MenuItem>
                <MenuItem value="RECIBIDO">Recibido</MenuItem>
                <MenuItem value="APLICADO">Aplicado</MenuItem>
                <MenuItem value="CANCELADO">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Prioridad</InputLabel>
              <Select
                value={filterPrioridad}
                label="Prioridad"
                onChange={(e: SelectChangeEvent) => setFilterPrioridad(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="BAJA">Baja</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="ALTA">Alta</MenuItem>
                <MenuItem value="URGENTE">Urgente</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              {canCreateSolicitud() && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedSolicitud(null);
                    setOpenFormDialog(true);
                  }}
                  fullWidth
                >
                  Nueva Solicitud
                </Button>
              )}
              <IconButton onClick={loadSolicitudes} color="primary">
                <RefreshIcon />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de solicitudes */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Paciente</TableCell>
                <TableCell>Solicitante</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Prioridad</TableCell>
                <TableCell>Productos</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : !solicitudes || solicitudes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron solicitudes
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                solicitudes.map((solicitud) => (
                  <TableRow key={solicitud.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {solicitud.numero}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {`${solicitud.paciente.nombre} ${solicitud.paciente.apellidoPaterno}`}
                        </Typography>
                        {solicitud.paciente.numeroExpediente && (
                          <Typography variant="caption" color="text.secondary">
                            Exp: {solicitud.paciente.numeroExpediente}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" />
                        <Box>
                          <Typography variant="body2">
                            {solicitud.solicitante.nombre || solicitud.solicitante.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {solicitudesService.getPrioridadLabel(solicitud.solicitante.rol as any)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getEstadoIcon(solicitud.estado)}
                        label={solicitudesService.getEstadoLabel(solicitud.estado)}
                        size="small"
                        sx={{
                          backgroundColor: solicitudesService.getEstadoColor(solicitud.estado),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getPrioridadIcon(solicitud.prioridad) || undefined}
                        label={solicitudesService.getPrioridadLabel(solicitud.prioridad)}
                        size="small"
                        color={solicitud.prioridad === 'URGENTE' ? 'error' :
                               solicitud.prioridad === 'ALTA' ? 'warning' : 'default'}
                        variant={solicitud.prioridad === 'NORMAL' || solicitud.prioridad === 'BAJA' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={solicitud.detalles.length} color="primary">
                        <InventoryIcon fontSize="small" />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(solicitud.createdAt).toLocaleDateString('es-MX')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(solicitud.createdAt).toLocaleTimeString('es-MX', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, solicitud)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalSolicitudes}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {menuSolicitud && getAccionesDisponibles(menuSolicitud).includes('ver') && (
          <MenuItem onClick={() => menuSolicitud && handleViewSolicitud(menuSolicitud)}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} />
            Ver Detalles
          </MenuItem>
        )}
        {menuSolicitud && getAccionesDisponibles(menuSolicitud).includes('asignar') && (
          <MenuItem onClick={() => menuSolicitud && handleAsignarSolicitud(menuSolicitud)}>
            <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
            Asignar a Mí
          </MenuItem>
        )}
        {menuSolicitud && getAccionesDisponibles(menuSolicitud).includes('listo') && (
          <MenuItem onClick={() => menuSolicitud && handleMarcarListo(menuSolicitud)}>
            <CheckIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
            Marcar como Listo
          </MenuItem>
        )}
        {menuSolicitud && getAccionesDisponibles(menuSolicitud).includes('entregar') && (
          <MenuItem onClick={() => menuSolicitud && handleEntregarSolicitud(menuSolicitud)}>
            <ShippingIcon fontSize="small" sx={{ mr: 1 }} />
            Marcar Entregado
          </MenuItem>
        )}
        {menuSolicitud && getAccionesDisponibles(menuSolicitud).includes('confirmar') && (
          <MenuItem onClick={() => menuSolicitud && handleConfirmarSolicitud(menuSolicitud)}>
            <CheckIcon fontSize="small" sx={{ mr: 1 }} />
            Confirmar Recepción
          </MenuItem>
        )}
      </Menu>

      {/* Diálogos */}
      <SolicitudFormDialog
        open={openFormDialog}
        onClose={() => {
          setOpenFormDialog(false);
          setSelectedSolicitud(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <SolicitudDetailDialog
        open={openDetailDialog}
        onClose={() => {
          setOpenDetailDialog(false);
          setSelectedSolicitud(null);
        }}
        solicitud={selectedSolicitud}
        onRefresh={loadSolicitudes}
      />

      {/* Notificaciones */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SolicitudesPage;