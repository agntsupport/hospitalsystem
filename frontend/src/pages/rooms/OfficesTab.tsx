import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignIcon,
  ExitToApp as ReleaseIcon,
  Build as MaintenanceIcon,
  Refresh as RefreshIcon,
  MeetingRoom as OfficeIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  LocalHospital as SpecialtyIcon,
} from '@mui/icons-material';

import { roomsService } from '@/services/roomsService';
import { Office, OfficeFilters, OFFICE_TYPES, OFFICE_STATES } from '@/types/rooms.types';
import { toast } from 'react-toastify';
import OfficeFormDialog from './OfficeFormDialog';

interface OfficesTabProps {
  onStatsChange: () => void;
}

const OfficesTab: React.FC<OfficesTabProps> = ({ onStatsChange }) => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OfficeFilters>({});
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [officeFormOpen, setOfficeFormOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [observations, setObservations] = useState('');

  useEffect(() => {
    loadOffices();
  }, [filters]);

  const loadOffices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await roomsService.getOffices(filters);
      if (response.success) {
        // El servicio ya transforma la respuesta y devuelve los items en data
        setOffices(response.data || []);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error loading offices:', error);
      console.error('Error details:', {
        message: error?.message,
        error: error?.error,
        status: error?.status,
        fullError: error
      });
      const errorMessage = error?.message || error?.error || 'Error al cargar consultorios';
      setError(errorMessage);
      // Asegurar que offices siempre sea un array para evitar errores de renderizado
      setOffices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof OfficeFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  const handleAssignOffice = async () => {
    if (!selectedOffice || !doctorId) return;

    try {
      const response = await roomsService.assignOffice(selectedOffice.id, {
        medicoId: parseInt(doctorId),
        observaciones: observations || undefined
      });

      if (response.success) {
        toast.success('Consultorio asignado exitosamente');
        loadOffices();
        onStatsChange();
        handleCloseAssignDialog();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error assigning office:', error);
      const errorMessage = error?.message || error?.error || 'Error al asignar consultorio';
      toast.error(errorMessage);
    }
  };

  const handleReleaseOffice = async (office: Office) => {
    try {
      const response = await roomsService.releaseOffice(office.id);
      if (response.success) {
        toast.success('Consultorio liberado exitosamente');
        loadOffices();
        onStatsChange();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error releasing office:', error);
      const errorMessage = error?.message || error?.error || 'Error al liberar consultorio';
      toast.error(errorMessage);
    }
  };

  const handleSetMaintenance = async () => {
    if (!selectedOffice) return;

    try {
      const response = await roomsService.setOfficeMaintenance(selectedOffice.id, observations);
      if (response.success) {
        toast.success('Consultorio marcado en mantenimiento');
        loadOffices();
        onStatsChange();
        handleCloseMaintenanceDialog();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error setting maintenance:', error);
      const errorMessage = error?.message || error?.error || 'Error al marcar mantenimiento';
      toast.error(errorMessage);
    }
  };

  const handleOpenAssignDialog = (office: Office) => {
    setSelectedOffice(office);
    setDoctorId('');
    setObservations('');
    setAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedOffice(null);
    setDoctorId('');
    setObservations('');
  };

  const handleOpenMaintenanceDialog = (office: Office) => {
    setSelectedOffice(office);
    setObservations('');
    setMaintenanceDialogOpen(true);
  };

  const handleCloseMaintenanceDialog = () => {
    setMaintenanceDialogOpen(false);
    setSelectedOffice(null);
    setObservations('');
  };

  const handleCreateOffice = () => {
    setEditingOffice(null);
    setOfficeFormOpen(true);
  };

  const handleEditOffice = (office: Office) => {
    setEditingOffice(office);
    setOfficeFormOpen(true);
  };

  const handleDeleteOffice = async (office: Office) => {
    if (!window.confirm(`¿Está seguro de eliminar el consultorio #${office.numero}?`)) {
      return;
    }

    try {
      const response = await roomsService.deleteOffice(office.id);
      if (response.success) {
        toast.success('Consultorio eliminado exitosamente');
        loadOffices();
        onStatsChange();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error deleting office:', error);
      const errorMessage = error?.message || error?.error || 'Error al eliminar consultorio';
      toast.error(errorMessage);
    }
  };

  const handleOfficeFormClose = () => {
    setOfficeFormOpen(false);
    setEditingOffice(null);
  };

  const handleOfficeCreated = () => {
    loadOffices();
    onStatsChange();
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return 'success';
      case 'ocupado':
        return 'error';
      case 'mantenimiento':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <OfficeIcon />
          Gestión de Consultorios
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateOffice}
            disabled={loading}
            color="secondary"
          >
            Nuevo Consultorio
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadOffices}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Filtros de Búsqueda
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Buscar consultorio"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Consultorio</InputLabel>
                <Select
                  value={filters.tipo || ''}
                  label="Tipo de Consultorio"
                  onChange={(e) => handleFilterChange('tipo', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.entries(OFFICE_TYPES).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.estado || ''}
                  label="Estado"
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.entries(OFFICE_STATES).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Especialidad"
                value={filters.especialidad || ''}
                onChange={(e) => handleFilterChange('especialidad', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SpecialtyIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Offices Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Consultorio</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Especialidad</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Médico Asignado</TableCell>
              <TableCell>Fecha Asignación</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : !offices || offices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No se encontraron consultorios
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (offices || []).map((office) => (
                <TableRow key={office.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        #{office.numero}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {office.descripcion}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={OFFICE_TYPES[office.tipo]}
                      size="small"
                      variant="outlined"
                      color="secondary"
                    />
                  </TableCell>
                  <TableCell>
                    {office.especialidad ? (
                      <Chip
                        label={office.especialidad}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        General
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={OFFICE_STATES[office.estado]}
                      color={getStatusColor(office.estado) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {office.medicoAsignado ? (
                      <Box>
                        <Typography variant="body2">
                          Dr(a). {office.medicoAsignado.nombre} {office.medicoAsignado.apellidoPaterno}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {office.medicoAsignado.especialidad || 'General'}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin asignar
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(office.fechaAsignacion)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Editar consultorio">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleEditOffice(office)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {office.estado === 'disponible' && (
                        <Tooltip title="Asignar consultorio">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleOpenAssignDialog(office)}
                          >
                            <AssignIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {office.estado === 'ocupado' && (
                        <Tooltip title="Liberar consultorio">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleReleaseOffice(office)}
                          >
                            <ReleaseIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {office.estado !== 'mantenimiento' && (
                        <Tooltip title="Marcar en mantenimiento">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleOpenMaintenanceDialog(office)}
                          >
                            <MaintenanceIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Eliminar consultorio">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteOffice(office)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Assign Office Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Asignar Consultorio #{selectedOffice?.numero}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ID del Médico"
                type="number"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                required
                helperText="Ingrese el ID del médico al que asignar el consultorio"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observaciones adicionales sobre la asignación..."
              />
            </Grid>
            {selectedOffice && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Consultorio:</strong> {OFFICE_TYPES[selectedOffice.tipo]}
                    {selectedOffice.especialidad && (
                      <span> - <strong>Especialidad:</strong> {selectedOffice.especialidad}</span>
                    )}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleAssignOffice}
            disabled={!doctorId}
            startIcon={<AssignIcon />}
          >
            Asignar Consultorio
          </Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={maintenanceDialogOpen} onClose={handleCloseMaintenanceDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Marcar en Mantenimiento - Consultorio #{selectedOffice?.numero}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motivo del Mantenimiento"
                multiline
                rows={4}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Describa el motivo del mantenimiento..."
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMaintenanceDialog}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSetMaintenance}
            disabled={!observations}
            startIcon={<MaintenanceIcon />}
          >
            Marcar en Mantenimiento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Office Form Dialog */}
      <OfficeFormDialog
        open={officeFormOpen}
        onClose={handleOfficeFormClose}
        onOfficeCreated={handleOfficeCreated}
        editingOffice={editingOffice}
      />
    </Box>
  );
};

export default OfficesTab;