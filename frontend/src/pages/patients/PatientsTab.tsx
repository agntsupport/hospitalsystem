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
  Avatar,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

import { patientsService } from '@/services/patientsService';
import { Patient, PatientFilters, GENDER_OPTIONS, CIVIL_STATUS_OPTIONS, BLOOD_TYPES } from '@/types/patients.types';
import { toast } from 'react-toastify';
import PatientFormDialog from './PatientFormDialog';

interface PatientsTabProps {
  onStatsChange: () => void;
  onPatientCreated: () => void;
}

const PatientsTab: React.FC<PatientsTabProps> = ({ onStatsChange, onPatientCreated }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PatientFilters>({});
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadPatients();
  }, [filters, page, rowsPerPage]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await patientsService.getPatients({
        ...filters,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      });
      
      if (response.success) {
        setPatients(response.data.items || []);
        setTotalCount(response.data.pagination?.total || 0);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error loading patients:', error);
      console.error('Error details:', {
        message: error?.message,
        error: error?.error,
        status: error?.status,
        fullError: error
      });
      const errorMessage = error?.message || error?.error || 'Error al cargar pacientes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof PatientFilters, value: string | number | boolean) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
    setPage(0); // Reset page when filters change
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;

    try {
      const response = await patientsService.deletePatient(selectedPatient.id);
      if (response.success) {
        toast.success('Paciente eliminado exitosamente');
        loadPatients();
        onStatsChange();
        handleCloseDeleteDialog();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      const errorMessage = error?.message || error?.error || 'Error al eliminar paciente';
      toast.error(errorMessage);
    }
  };

  const handleOpenViewDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedPatient(null);
  };

  const handleOpenDeleteDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedPatient(null);
  };

  const handleOpenEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedPatient(null);
  };

  const handlePatientUpdated = () => {
    loadPatients();
    onStatsChange();
    onPatientCreated(); // Notify parent to refresh
    handleCloseEditDialog();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'M':
        return <MaleIcon color="info" fontSize="small" />;
      case 'F':
        return <FemaleIcon color="secondary" fontSize="small" />;
      default:
        return <PersonIcon color="action" fontSize="small" />;
    }
  };

  const formatDate = (dateString: string) => {
    // Convertir fecha ISO a formato local seguro
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  };

  const formatPatientName = (patient: Patient) => {
    return `${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno || ''}`.trim();
  };

  const clearFilters = () => {
    setFilters({});
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          Lista de Pacientes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            color={showFilters ? 'primary' : 'inherit'}
          >
            Filtros
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPatients}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
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
                  label="Buscar paciente"
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
                  <InputLabel>Género</InputLabel>
                  <Select
                    value={filters.genero || ''}
                    label="Género"
                    onChange={(e) => handleFilterChange('genero', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {Object.entries(GENDER_OPTIONS).map(([key, label]) => (
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
                  label="Edad mínima"
                  type="number"
                  value={filters.edadMin || ''}
                  onChange={(e) => handleFilterChange('edadMin', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 120 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Edad máxima"
                  type="number"
                  value={filters.edadMax || ''}
                  onChange={(e) => handleFilterChange('edadMax', parseInt(e.target.value) || 120)}
                  inputProps={{ min: 0, max: 120 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Ciudad"
                  value={filters.ciudad || ''}
                  onChange={(e) => handleFilterChange('ciudad', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Sangre</InputLabel>
                  <Select
                    value={filters.tipoSangre || ''}
                    label="Tipo de Sangre"
                    onChange={(e) => handleFilterChange('tipoSangre', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {BLOOD_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.activo !== undefined ? filters.activo.toString() : ''}
                    label="Estado"
                    onChange={(e) => handleFilterChange('activo', e.target.value === '' ? undefined : e.target.value === 'true')}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="true">Activos</MenuItem>
                    <MenuItem value="false">Inactivos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={clearFilters}
                  size="small"
                >
                  Limpiar Filtros
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Patients Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Paciente</TableCell>
              <TableCell>Expediente</TableCell>
              <TableCell>Edad</TableCell>
              <TableCell>Género</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Ciudad</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (patients?.length || 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No se encontraron pacientes
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (patients || []).map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getGenderIcon(patient.genero)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {formatPatientName(patient)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {patient.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {patient.numeroExpediente}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {patient.edad} años
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(patient.fechaNacimiento)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={GENDER_OPTIONS[patient.genero]}
                      size="small"
                      variant="outlined"
                      icon={getGenderIcon(patient.genero)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      {patient.telefono && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon fontSize="small" />
                          {patient.telefono}
                        </Typography>
                      )}
                      {patient.email && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon fontSize="small" />
                          {patient.email}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {patient.ciudad || 'No especificada'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {patient.estado || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={patient.activo ? 'Activo' : 'Inactivo'}
                      color={patient.activo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleOpenViewDialog(patient)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar paciente">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEditDialog(patient)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar paciente">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(patient)}
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

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>

      {/* View Patient Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles del Paciente
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Nombre Completo</Typography>
                  <Typography variant="body1">{formatPatientName(selectedPatient)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Número de Expediente</Typography>
                  <Typography variant="body1">{selectedPatient.numeroExpediente}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Fecha de Nacimiento</Typography>
                  <Typography variant="body1">{formatDate(selectedPatient.fechaNacimiento)} ({selectedPatient.edad} años)</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Género</Typography>
                  <Typography variant="body1">{GENDER_OPTIONS[selectedPatient.genero]}</Typography>
                </Grid>
                {selectedPatient.tipoSangre && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Tipo de Sangre</Typography>
                    <Typography variant="body1">{selectedPatient.tipoSangre}</Typography>
                  </Grid>
                )}
                {selectedPatient.telefono && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Teléfono</Typography>
                    <Typography variant="body1">{selectedPatient.telefono}</Typography>
                  </Grid>
                )}
                {selectedPatient.email && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedPatient.email}</Typography>
                  </Grid>
                )}
                {selectedPatient.direccion && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Dirección</Typography>
                    <Typography variant="body1">{selectedPatient.direccion}</Typography>
                    {(selectedPatient.ciudad || selectedPatient.estado) && (
                      <Typography variant="body2" color="text.secondary">
                        {[selectedPatient.ciudad, selectedPatient.estado, selectedPatient.codigoPostal].filter(Boolean).join(', ')}
                      </Typography>
                    )}
                  </Grid>
                )}
                {selectedPatient.alergias && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Alergias</Typography>
                    <Typography variant="body1">{selectedPatient.alergias}</Typography>
                  </Grid>
                )}
                {selectedPatient.contactoEmergencia && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Contacto de Emergencia</Typography>
                    <Typography variant="body1">
                      {selectedPatient.contactoEmergencia.nombre} ({selectedPatient.contactoEmergencia.relacion})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedPatient.contactoEmergencia.telefono}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>
          Eliminar Paciente
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar al paciente <strong>{selectedPatient && formatPatientName(selectedPatient)}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción marcará al paciente como inactivo.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeletePatient}
            startIcon={<DeleteIcon />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Patient Dialog */}
      <PatientFormDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        onPatientCreated={handlePatientUpdated}
        editingPatient={selectedPatient}
      />
    </Box>
  );
};

export default PatientsTab;