// ABOUTME: Página de gestión de Quirófanos del hospital
// ABOUTME: CRUD de quirófanos con estados, filtros y estadísticas

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MedicalServices as MedicalIcon,
  Build as BuildIcon,
  CheckCircle as AvailableIcon,
  Cancel as OccupiedIcon,
  Warning as MaintenanceIcon,
  CleaningServices as CleaningIcon,
  LocalHospital as HospitalIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import StatCard, { StatCardsGrid } from '@/components/common/StatCard';
import { FullPageLoader } from '@/components/common/LoadingState';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import quirofanosService, { Quirofano, QuirofanoStats } from '@/services/quirofanosService';
import QuirofanoFormDialog from './QuirofanoFormDialog';
import QuirofanoDetailsDialog from './QuirofanoDetailsDialog';

const QuirofanosPage: React.FC = () => {
  const { user } = useAuth();
  const [quirofanos, setQuirofanos] = useState<Quirofano[]>([]);
  const [stats, setStats] = useState<QuirofanoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de diálogos
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuirofano, setSelectedQuirofano] = useState<Quirofano | null>(null);
  
  // Filtros y paginación
  const [filters, setFilters] = useState({
    estado: '',
    tipo: '',
    especialidad: '',
    sortBy: 'numero',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  useEffect(() => {
    loadQuirofanos();
    loadStats();
  }, [filters, pagination.page]);

  const loadQuirofanos = async () => {
    try {
      setLoading(true);
      const response = await quirofanosService.getQuirofanos({
        ...filters,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit
      });

      if (response.success) {
        setQuirofanos(response.data.items || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0
        }));
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await quirofanosService.getQuirofanosStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Funciones para manejar diálogos
  const handleCreateClick = () => {
    setSelectedQuirofano(null);
    setFormDialogOpen(true);
  };

  const handleEditClick = (quirofano: Quirofano) => {
    setSelectedQuirofano(quirofano);
    setFormDialogOpen(true);
  };

  const handleViewClick = (quirofano: Quirofano) => {
    setSelectedQuirofano(quirofano);
    setDetailsDialogOpen(true);
  };

  const handleDeleteClick = (quirofano: Quirofano) => {
    setSelectedQuirofano(quirofano);
    setDeleteDialogOpen(true);
  };

  const handleFormSuccess = () => {
    loadQuirofanos();
    loadStats();
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuirofano) return;

    try {
      await quirofanosService.deleteQuirofano(selectedQuirofano.id);
      setDeleteDialogOpen(false);
      setSelectedQuirofano(null);
      loadQuirofanos();
      loadStats();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <AvailableIcon color="success" />;
      case 'ocupado':
        return <OccupiedIcon color="error" />;
      case 'mantenimiento':
        return <MaintenanceIcon color="warning" />;
      default:
        return <BuildIcon color="info" />;
    }
  };

  const canEdit = user?.rol === 'administrador';
  const canMarkCleaningComplete = ['administrador', 'enfermero'].includes(user?.rol || '');

  const handleMarkCleaningComplete = async (quirofano: Quirofano) => {
    try {
      await quirofanosService.updateQuirofanoStatus(quirofano.id, 'disponible', 'Limpieza completada');
      loadQuirofanos();
      loadStats();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading && quirofanos.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <FullPageLoader message="Cargando quirófanos..." />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
        {/* Header unificado */}
        <PageHeader
          title="Gestión de Quirófanos"
          subtitle="Administra los quirófanos y su disponibilidad"
          icon={<HospitalIcon />}
          iconColor="primary"
          actions={canEdit ? [
            {
              label: 'Nuevo Quirófano',
              icon: <AddIcon />,
              onClick: handleCreateClick,
              variant: 'contained',
            }
          ] : undefined}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Estadísticas con StatCard unificado */}
        <StatCardsGrid sx={{ mb: 3 }}>
          <StatCard
            title="Total Quirófanos"
            value={stats?.resumen?.totalQuirofanos || 0}
            icon={<MedicalIcon />}
            color="primary"
            loading={!stats}
          />
          <StatCard
            title="Disponibles"
            value={stats?.resumen?.disponibles || 0}
            icon={<AvailableIcon />}
            color="success"
            loading={!stats}
          />
          <StatCard
            title="Ocupados"
            value={stats?.resumen?.ocupados || 0}
            icon={<OccupiedIcon />}
            color="error"
            loading={!stats}
          />
          <StatCard
            title="Cirugías Hoy"
            value={stats?.resumen?.cirugiasHoy || 0}
            icon={<MedicalIcon />}
            color="info"
            loading={!stats}
          />
        </StatCardsGrid>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.estado}
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="disponible">Disponible</MenuItem>
                  <MenuItem value="ocupado">Ocupado</MenuItem>
                  <MenuItem value="mantenimiento">Mantenimiento</MenuItem>
                  <MenuItem value="limpieza">En Limpieza</MenuItem>
                  <MenuItem value="preparacion">En Preparación</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filters.tipo}
                  onChange={(e) => handleFilterChange('tipo', e.target.value)}
                  label="Tipo"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="cirugia_general">Cirugía General</MenuItem>
                  <MenuItem value="cirugia_cardiaca">Cirugía Cardíaca</MenuItem>
                  <MenuItem value="cirugia_neurologica">Neurocirugía</MenuItem>
                  <MenuItem value="cirugia_ortopedica">Cirugía Ortopédica</MenuItem>
                  <MenuItem value="cirugia_ambulatoria">Cirugía Ambulatoria</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Especialidad"
                value={filters.especialidad}
                onChange={(e) => handleFilterChange('especialidad', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setFilters({
                    estado: '',
                    tipo: '',
                    especialidad: '',
                    sortBy: 'numero',
                    sortOrder: 'asc'
                  });
                }}
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabla de Quirófanos */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Número</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Especialidad</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Capacidad</strong></TableCell>
                <TableCell><strong>Precio/Hora</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quirofanos.map((quirofano) => (
                <TableRow key={quirofano.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {getStatusIcon(quirofano.estado)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {quirofano.numero}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {quirofanosService.getTipoLabel(quirofano.tipo)}
                  </TableCell>
                  <TableCell>{quirofano.especialidad || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={quirofanosService.getEstadoLabel(quirofano.estado)}
                      color={quirofanosService.getEstadoColor(quirofano.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{quirofano.capacidadEquipo} personas</TableCell>
                  <TableCell>
                    {quirofano.precioHora 
                      ? `$${quirofano.precioHora.toLocaleString()}`
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleViewClick(quirofano)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {canMarkCleaningComplete && quirofano.estado === 'limpieza' && (
                      <Tooltip title="Marcar limpieza completada">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleMarkCleaningComplete(quirofano)}
                        >
                          <CleaningIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canEdit && (
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditClick(quirofano)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canEdit && (
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(quirofano)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        {pagination.total > pagination.limit && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={Math.ceil(pagination.total / pagination.limit)}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}

        {quirofanos.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="textSecondary">
              No se encontraron quirófanos
            </Typography>
            {canEdit && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                onClick={handleCreateClick}
              >
                Crear Primer Quirófano
              </Button>
            )}
          </Box>
        )}

      {/* Diálogos */}
      <QuirofanoFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSuccess={handleFormSuccess}
        quirofano={selectedQuirofano || undefined}
      />

      <QuirofanoDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        quirofanoId={selectedQuirofano?.id || null}
        onEdit={(quirofano) => {
          setDetailsDialogOpen(false);
          setSelectedQuirofano(quirofano);
          setFormDialogOpen(true);
        }}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          🗑️ Eliminar Quirófano
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar el quirófano <strong>{selectedQuirofano?.numero}</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Esta acción marcará el quirófano como "fuera de servicio" y no podrá ser revertida.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuirofanosPage;