import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
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
  CircularProgress,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Stop as CompleteIcon,
  Schedule as ScheduleIcon,
  LocalHospital as SurgeryIcon,
  Person as DoctorIcon,
  Group as TeamIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import quirofanosService, { CirugiaQuirofano, EstadoCirugia } from '@/services/quirofanosService';
import CirugiaFormDialog from './CirugiaFormDialog';
import CirugiaDetailsDialog from './CirugiaDetailsDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const CirugiasPage: React.FC = () => {
  const { user } = useAuth();
  const [cirugias, setCirugias] = useState<CirugiaQuirofano[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Estados de diálogos
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedCirugia, setSelectedCirugia] = useState<CirugiaQuirofano | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [newStatus, setNewStatus] = useState<EstadoCirugia | ''>('');
  const [statusObservaciones, setStatusObservaciones] = useState('');
  
  // Filtros y paginación
  const [filters, setFilters] = useState({
    estado: '',
    quirofanoId: '',
    medicoId: '',
    fechaInicio: null as Date | null,
    fechaFin: null as Date | null,
    sortBy: 'fechaInicio',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  useEffect(() => {
    loadCirugias();
  }, [filters, pagination.page, tabValue]);

  const loadCirugias = async () => {
    try {
      setLoading(true);
      
      // Aplicar filtro según la pestaña activa
      let estadoFilter = '';
      switch (tabValue) {
        case 0: // Programadas
          estadoFilter = 'programada';
          break;
        case 1: // En progreso
          estadoFilter = 'en_progreso';
          break;
        case 2: // Completadas
          estadoFilter = 'completada';
          break;
        case 3: // Todas
          estadoFilter = '';
          break;
      }
      
      const response = await quirofanosService.getCirugias({
        ...filters,
        estado: estadoFilter || filters.estado,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit
      });

      if (response.success) {
        setCirugias(response.data.items || []);
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

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Funciones para manejar cirugías
  const handleCreateClick = () => {
    setSelectedCirugia(null);
    setFormDialogOpen(true);
  };

  const handleViewClick = (cirugia: CirugiaQuirofano) => {
    setSelectedCirugia(cirugia);
    setDetailsDialogOpen(true);
  };

  const handleCancelClick = (cirugia: CirugiaQuirofano) => {
    setSelectedCirugia(cirugia);
    setCancelMotivo('');
    setCancelDialogOpen(true);
  };

  const handleStatusClick = (cirugia: CirugiaQuirofano) => {
    setSelectedCirugia(cirugia);
    setNewStatus('');
    setStatusObservaciones('');
    setStatusDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedCirugia || !cancelMotivo) return;

    try {
      await quirofanosService.cancelarCirugia(selectedCirugia.id, cancelMotivo);
      setCancelDialogOpen(false);
      setSelectedCirugia(null);
      loadCirugias();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedCirugia || !newStatus) return;

    try {
      await quirofanosService.actualizarEstadoCirugia(
        selectedCirugia.id,
        newStatus,
        statusObservaciones,
        newStatus === 'cancelada' ? statusObservaciones : undefined
      );
      setStatusDialogOpen(false);
      setSelectedCirugia(null);
      loadCirugias();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleFormSuccess = () => {
    loadCirugias();
  };

  const getStatusIcon = (estado: EstadoCirugia) => {
    switch (estado) {
      case 'programada':
        return <ScheduleIcon color="info" />;
      case 'en_progreso':
        return <PlayArrow color="warning" />;
      case 'completada':
        return <CompleteIcon color="success" />;
      case 'cancelada':
        return <CancelIcon color="error" />;
      default:
        return <SurgeryIcon />;
    }
  };

  const getStatusColor = (estado: EstadoCirugia): any => {
    switch (estado) {
      case 'programada':
        return 'info';
      case 'en_progreso':
        return 'warning';
      case 'completada':
        return 'success';
      case 'cancelada':
        return 'error';
      default:
        return 'default';
    }
  };

  const canManage = ['administrador', 'medico_especialista'].includes(user?.rol || '');
  const canUpdateStatus = ['administrador', 'medico_especialista', 'enfermero'].includes(user?.rol || '');

  if (loading && cirugias.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            🏥 Gestión de Cirugías
          </Typography>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
            >
              Programar Cirugía
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha Inicio"
                  value={filters.fechaInicio}
                  onChange={(newValue) => handleFilterChange('fechaInicio', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha Fin"
                  value={filters.fechaFin}
                  onChange={(newValue) => handleFilterChange('fechaFin', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  label="Ordenar por"
                >
                  <MenuItem value="fechaInicio">Fecha de Cirugía</MenuItem>
                  <MenuItem value="createdAt">Fecha de Registro</MenuItem>
                  <MenuItem value="tipoIntervencion">Tipo de Intervención</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setFilters({
                    estado: '',
                    quirofanoId: '',
                    medicoId: '',
                    fechaInicio: null,
                    fechaFin: null,
                    sortBy: 'fechaInicio',
                    sortOrder: 'asc'
                  });
                }}
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs para filtrar por estado */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary">
            <Tab label="Programadas" icon={<ScheduleIcon />} iconPosition="start" />
            <Tab label="En Progreso" icon={<PlayArrow />} iconPosition="start" />
            <Tab label="Completadas" icon={<CompleteIcon />} iconPosition="start" />
            <Tab label="Todas" icon={<SurgeryIcon />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Tabla de Cirugías */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Fecha/Hora</strong></TableCell>
                <TableCell><strong>Quirófano</strong></TableCell>
                <TableCell><strong>Paciente</strong></TableCell>
                <TableCell><strong>Médico</strong></TableCell>
                <TableCell><strong>Tipo de Intervención</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cirugias.map((cirugia) => (
                <TableRow key={cirugia.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {format(new Date(cirugia.fechaInicio), 'dd/MM/yyyy')}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {format(new Date(cirugia.fechaInicio), 'HH:mm')} - 
                        {cirugia.fechaFin ? format(new Date(cirugia.fechaFin), 'HH:mm') : 'Por definir'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`Quirófano ${cirugia.quirofano?.numero}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {cirugia.paciente?.nombre} {cirugia.paciente?.apellidoPaterno}
                      </Typography>
                      {cirugia.paciente?.telefono && (
                        <Typography variant="caption" color="textSecondary">
                          📞 {cirugia.paciente.telefono}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <DoctorIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Box>
                        <Typography variant="body2">
                          Dr. {cirugia.medico?.nombre} {cirugia.medico?.apellidoPaterno}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {cirugia.medico?.especialidad}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{cirugia.tipoIntervencion}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {getStatusIcon(cirugia.estado)}
                      <Chip
                        label={cirugia.estado.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(cirugia.estado)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton 
                        size="small" 
                        color="info"
                        onClick={() => handleViewClick(cirugia)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {canUpdateStatus && cirugia.estado !== 'completada' && cirugia.estado !== 'cancelada' && (
                      <Tooltip title="Cambiar estado">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleStatusClick(cirugia)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {canManage && cirugia.estado === 'programada' && (
                      <Tooltip title="Cancelar cirugía">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleCancelClick(cirugia)}
                        >
                          <CancelIcon />
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

        {cirugias.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="textSecondary">
              No se encontraron cirugías
            </Typography>
            {canManage && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                onClick={handleCreateClick}
              >
                Programar Primera Cirugía
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Diálogos */}
      <CirugiaFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSuccess={handleFormSuccess}
        cirugia={selectedCirugia || undefined}
      />

      <CirugiaDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        cirugiaId={selectedCirugia?.id || null}
      />

      {/* Diálogo de cancelación */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          ❌ Cancelar Cirugía
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            ¿Está seguro que desea cancelar esta cirugía?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Motivo de cancelación"
            value={cancelMotivo}
            onChange={(e) => setCancelMotivo(e.target.value)}
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmCancel} 
            color="error" 
            variant="contained"
            disabled={!cancelMotivo}
          >
            Confirmar Cancelación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de cambio de estado */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          📝 Actualizar Estado de Cirugía
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Nuevo Estado</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as EstadoCirugia)}
              label="Nuevo Estado"
            >
              <MenuItem value="en_progreso">En Progreso</MenuItem>
              <MenuItem value="completada">Completada</MenuItem>
              <MenuItem value="cancelada">Cancelada</MenuItem>
              <MenuItem value="reprogramada">Reprogramada</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label={newStatus === 'cancelada' ? 'Motivo (requerido)' : 'Observaciones (opcional)'}
            value={statusObservaciones}
            onChange={(e) => setStatusObservaciones(e.target.value)}
            sx={{ mt: 2 }}
            required={newStatus === 'cancelada'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmStatusChange} 
            color="primary" 
            variant="contained"
            disabled={!newStatus || (newStatus === 'cancelada' && !statusObservaciones)}
          >
            Actualizar Estado
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CirugiasPage;