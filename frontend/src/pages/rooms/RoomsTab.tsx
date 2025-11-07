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
  Hotel as RoomIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
} from '@mui/icons-material';

import { roomsService } from '@/services/roomsService';
import { Room, RoomFilters, ROOM_TYPES, ROOM_STATES } from '@/types/rooms.types';
import { toast } from 'react-toastify';
import RoomFormDialog from './RoomFormDialog';
import { useAuth } from '@/hooks/useAuth';

interface RoomsTabProps {
  onStatsChange: () => void;
}

const RoomsTab: React.FC<RoomsTabProps> = ({ onStatsChange }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RoomFilters>({});
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [roomFormOpen, setRoomFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [patientId, setPatientId] = useState('');
  const [observations, setObservations] = useState('');

  // Solo administradores pueden crear/editar/eliminar habitaciones
  const canEdit = user?.rol === 'administrador';

  useEffect(() => {
    loadRooms();
  }, [filters]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await roomsService.getRooms(filters);
      if (response.success) {
        setRooms(response.data?.rooms || []);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error loading rooms:', error);
      console.error('Error details:', {
        message: error?.message,
        error: error?.error,
        status: error?.status,
        fullError: error
      });
      const errorMessage = error?.message || error?.error || 'Error al cargar habitaciones';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof RoomFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  const handleAssignRoom = async () => {
    if (!selectedRoom || !patientId) return;

    try {
      const response = await roomsService.assignRoom(selectedRoom.id, {
        pacienteId: parseInt(patientId),
        observaciones: observations || undefined
      });

      if (response.success) {
        toast.success('Habitación asignada exitosamente');
        loadRooms();
        onStatsChange();
        handleCloseAssignDialog();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error assigning room:', error);
      const errorMessage = error?.message || error?.error || 'Error al asignar habitación';
      toast.error(errorMessage);
    }
  };

  const handleReleaseRoom = async (room: Room) => {
    try {
      const response = await roomsService.releaseRoom(room.id);
      if (response.success) {
        toast.success('Habitación liberada exitosamente');
        loadRooms();
        onStatsChange();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error releasing room:', error);
      const errorMessage = error?.message || error?.error || 'Error al liberar habitación';
      toast.error(errorMessage);
    }
  };

  const handleSetMaintenance = async () => {
    if (!selectedRoom) return;

    try {
      const response = await roomsService.setRoomMaintenance(selectedRoom.id, observations);
      if (response.success) {
        toast.success('Habitación marcada en mantenimiento');
        loadRooms();
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

  const handleOpenAssignDialog = (room: Room) => {
    setSelectedRoom(room);
    setPatientId('');
    setObservations('');
    setAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedRoom(null);
    setPatientId('');
    setObservations('');
  };

  const handleOpenMaintenanceDialog = (room: Room) => {
    setSelectedRoom(room);
    setObservations('');
    setMaintenanceDialogOpen(true);
  };

  const handleCloseMaintenanceDialog = () => {
    setMaintenanceDialogOpen(false);
    setSelectedRoom(null);
    setObservations('');
  };

  const handleCreateRoom = () => {
    setEditingRoom(null);
    setRoomFormOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomFormOpen(true);
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!window.confirm(`¿Está seguro de eliminar la habitación #${room.numero}?`)) {
      return;
    }

    try {
      const response = await roomsService.deleteRoom(room.id);
      if (response.success) {
        toast.success('Habitación eliminada exitosamente');
        loadRooms();
        onStatsChange();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error deleting room:', error);
      const errorMessage = error?.message || error?.error || 'Error al eliminar habitación';
      toast.error(errorMessage);
    }
  };

  const handleRoomFormClose = () => {
    setRoomFormOpen(false);
    setEditingRoom(null);
  };

  const handleRoomCreated = () => {
    loadRooms();
    onStatsChange();
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return 'success';
      case 'ocupada':
        return 'error';
      case 'mantenimiento':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
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
          <RoomIcon />
          Gestión de Habitaciones
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateRoom}
              disabled={loading}
            >
              Nueva Habitación
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadRooms}
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
                label="Buscar habitación"
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
                <InputLabel>Tipo de Habitación</InputLabel>
                <Select
                  value={filters.tipo || ''}
                  label="Tipo de Habitación"
                  onChange={(e) => handleFilterChange('tipo', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.entries(ROOM_TYPES).map(([key, label]) => (
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
                  {Object.entries(ROOM_STATES).map(([key, label]) => (
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
                label="Paciente"
                value={filters.paciente || ''}
                onChange={(e) => handleFilterChange('paciente', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon fontSize="small" />
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

      {/* Rooms Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Habitación</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Precio/Día</TableCell>
              <TableCell>Paciente Actual</TableCell>
              <TableCell>Fecha Ocupación</TableCell>
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
            ) : (rooms || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No se encontraron habitaciones
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (rooms || []).map((room) => (
                <TableRow key={room.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        #{room.numero}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {room.descripcion}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ROOM_TYPES[room.tipo]}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ROOM_STATES[room.estado]}
                      color={getStatusColor(room.estado) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(room.precioPorDia)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {room.pacienteActual ? (
                      <Box>
                        <Typography variant="body2">
                          {room.pacienteActual.nombre} {room.pacienteActual.apellidoPaterno}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {room.pacienteActual.id}
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
                      {formatDate(room.fechaOcupacion)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {canEdit && (
                        <Tooltip title="Editar habitación">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditRoom(room)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {room.estado === 'disponible' && (
                        <Tooltip title="Asignar habitación">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenAssignDialog(room)}
                          >
                            <AssignIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {room.estado === 'ocupada' && (
                        <Tooltip title="Liberar habitación">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleReleaseRoom(room)}
                          >
                            <ReleaseIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {room.estado !== 'mantenimiento' && (
                        <Tooltip title="Marcar en mantenimiento">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleOpenMaintenanceDialog(room)}
                          >
                            <MaintenanceIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canEdit && (
                        <Tooltip title="Eliminar habitación">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteRoom(room)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Assign Room Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth closeAfterTransition={false}>
        <DialogTitle>
          Asignar Habitación #{selectedRoom?.numero}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ID del Paciente"
                type="number"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                helperText="Ingrese el ID del paciente al que asignar la habitación"
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignRoom}
            disabled={!patientId}
            startIcon={<AssignIcon />}
          >
            Asignar Habitación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={maintenanceDialogOpen} onClose={handleCloseMaintenanceDialog} maxWidth="sm" fullWidth closeAfterTransition={false}>
        <DialogTitle>
          Marcar en Mantenimiento - Habitación #{selectedRoom?.numero}
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

      {/* Room Form Dialog */}
      <RoomFormDialog
        open={roomFormOpen}
        onClose={handleRoomFormClose}
        onRoomCreated={handleRoomCreated}
        editingRoom={editingRoom}
      />
    </Box>
  );
};

export default RoomsTab;