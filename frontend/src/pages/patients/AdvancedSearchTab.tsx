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
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  PersonSearch as PersonSearchIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MedicalServices as MedicalIcon,
  ContactPhone as ContactIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  FileDownload as ExportIcon,
  Save as SaveIcon,
  Bookmark as BookmarkIcon,
} from '@mui/icons-material';

import { patientsService } from '@/services/patientsService';
import { Patient, PatientFilters, GENDER_OPTIONS, CIVIL_STATUS_OPTIONS, BLOOD_TYPES } from '@/types/patients.types';
import { toast } from 'react-toastify';
import PatientFormDialog from './PatientFormDialog';

interface AdvancedSearchTabProps {
  onStatsChange: () => void;
  onPatientCreated: () => void;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: PatientFilters;
  createdAt: string;
}

const AdvancedSearchTab: React.FC<AdvancedSearchTabProps> = ({ onStatsChange, onPatientCreated }) => {
  // Estados principales
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Filtros avanzados
  const [filters, setFilters] = useState<PatientFilters>({});
  const [hasSearched, setHasSearched] = useState(false);
  
  // Estados de UI
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saveSearchDialogOpen, setSaveSearchDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  
  // Búsquedas guardadas
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Cargar búsquedas guardadas del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedPatientSearches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved searches:', error);
      }
    }
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const response = await patientsService.getPatients({
        ...filters,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      });
      
      if (response.success) {
        setPatients(response.data?.patients || []);
        setTotalCount(response.data.total);
        
        if (response.data?.patients || [].length === 0) {
          toast.info('No se encontraron pacientes con los criterios especificados');
        } else {
          toast.success(`Se encontraron ${response.data.total} paciente(s)`);
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error searching patients:', error);
      const errorMessage = error?.message || error?.error || 'Error al buscar pacientes';
      setError(errorMessage);
      toast.error(errorMessage);
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

  const clearFilters = () => {
    setFilters({});
    setPatients([]);
    setTotalCount(0);
    setHasSearched(false);
    setPage(0);
    setError(null);
  };

  const saveCurrentSearch = () => {
    if (!searchName.trim()) {
      toast.error('Por favor ingrese un nombre para la búsqueda');
      return;
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };

    const updatedSearches = [...savedSearches, newSearch];
    setSavedSearches(updatedSearches);
    localStorage.setItem('savedPatientSearches', JSON.stringify(updatedSearches));
    
    setSearchName('');
    setSaveSearchDialogOpen(false);
    toast.success('Búsqueda guardada exitosamente');
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters);
    toast.info(`Búsqueda "${savedSearch.name}" cargada`);
  };

  const deleteSavedSearch = (searchId: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== searchId);
    setSavedSearches(updatedSearches);
    localStorage.setItem('savedPatientSearches', JSON.stringify(updatedSearches));
    toast.success('Búsqueda eliminada');
  };

  const exportResults = () => {
    if (patients.length === 0) {
      toast.warning('No hay resultados para exportar');
      return;
    }

    const csvContent = [
      // Headers
      'Nombre,Apellidos,Expediente,Fecha Nacimiento,Edad,Género,Teléfono,Email,Ciudad,Estado,Código Postal',
      // Data
      ...patients.map(patient => [
        patient.nombre,
        `${patient.apellidoPaterno} ${patient.apellidoMaterno || ''}`.trim(),
        patient.numeroExpediente,
        patient.fechaNacimiento,
        patient.edad,
        GENDER_OPTIONS[patient.genero],
        patient.telefono || '',
        patient.email || '',
        patient.ciudad || '',
        patient.estado || '',
        patient.codigoPostal || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pacientes_busqueda_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Resultados exportados exitosamente');
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

  const handleOpenViewDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
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
    handleSearch(); // Re-ejecutar búsqueda para actualizar resultados
    onStatsChange();
    onPatientCreated();
    handleCloseEditDialog();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Re-ejecutar búsqueda cuando cambie la paginación
  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [page, rowsPerPage]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonSearchIcon />
          Búsqueda Avanzada de Pacientes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {hasSearched && patients.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={exportResults}
              size="small"
            >
              Exportar
            </Button>
          )}
          {Object.keys(filters).length > 0 && (
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => setSaveSearchDialogOpen(true)}
              size="small"
            >
              Guardar Búsqueda
            </Button>
          )}
        </Box>
      </Box>

      {/* Búsquedas Guardadas */}
      {savedSearches.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookmarkIcon />
              Búsquedas Guardadas
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {savedSearches.map((search) => (
                <Chip
                  key={search.id}
                  label={search.name}
                  onClick={() => loadSavedSearch(search)}
                  onDelete={() => deleteSavedSearch(search.id)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Formulario de Búsqueda Avanzada */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            Criterios de Búsqueda
          </Typography>

          {/* Búsqueda General */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Búsqueda General</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Buscar por nombre, apellido o expediente"
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="Ej: Juan Pérez, EXP-001"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
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
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
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
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Datos Demográficos */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Datos Demográficos</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Edad mínima"
                    type="number"
                    value={filters.edadMin || ''}
                    onChange={(e) => handleFilterChange('edadMin', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0, max: 120 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Edad máxima"
                    type="number"
                    value={filters.edadMax || ''}
                    onChange={(e) => handleFilterChange('edadMax', parseInt(e.target.value) || 120)}
                    inputProps={{ min: 0, max: 120 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Fecha nacimiento desde"
                    type="date"
                    value={filters.fechaNacimientoDesde || ''}
                    onChange={(e) => handleFilterChange('fechaNacimientoDesde', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Fecha nacimiento hasta"
                    type="date"
                    value={filters.fechaNacimientoHasta || ''}
                    onChange={(e) => handleFilterChange('fechaNacimientoHasta', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Estado Civil</InputLabel>
                    <Select
                      value={filters.estadoCivil || ''}
                      label="Estado Civil"
                      onChange={(e) => handleFilterChange('estadoCivil', e.target.value)}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {Object.entries(CIVIL_STATUS_OPTIONS).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Ocupación"
                    value={filters.ocupacion || ''}
                    onChange={(e) => handleFilterChange('ocupacion', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
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
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Información de Contacto */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Información de Contacto</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={filters.telefono || ''}
                    onChange={(e) => handleFilterChange('telefono', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={filters.email || ''}
                    onChange={(e) => handleFilterChange('email', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Código Postal"
                    value={filters.codigoPostal || ''}
                    onChange={(e) => handleFilterChange('codigoPostal', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Ciudad"
                    value={filters.ciudad || ''}
                    onChange={(e) => handleFilterChange('ciudad', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Estado"
                    value={filters.estado || ''}
                    onChange={(e) => handleFilterChange('estado', e.target.value)}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Información Médica */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Información Médica</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Alergias"
                    value={filters.alergias || ''}
                    onChange={(e) => handleFilterChange('alergias', e.target.value)}
                    placeholder="Buscar por tipo de alergia"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Medicamentos actuales"
                    value={filters.medicamentosActuales || ''}
                    onChange={(e) => handleFilterChange('medicamentosActuales', e.target.value)}
                    placeholder="Buscar por medicamento"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Antecedentes patológicos"
                    value={filters.antecedentesPatologicos || ''}
                    onChange={(e) => handleFilterChange('antecedentesPatologicos', e.target.value)}
                    placeholder="Buscar por enfermedad o condición"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Opciones Especiales */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Opciones Especiales</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.soloMenores === true}
                        onChange={(e) => handleFilterChange('soloMenores', e.target.checked)}
                      />
                    }
                    label="Solo pacientes menores de edad"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.conContactoEmergencia === true}
                        onChange={(e) => handleFilterChange('conContactoEmergencia', e.target.checked)}
                      />
                    }
                    label="Con contacto de emergencia registrado"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.conSeguroMedico === true}
                        onChange={(e) => handleFilterChange('conSeguroMedico', e.target.checked)}
                      />
                    }
                    label="Con seguro médico"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.conAlergias === true}
                        onChange={(e) => handleFilterChange('conAlergias', e.target.checked)}
                      />
                    }
                    label="Con alergias registradas"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Botones de Acción */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading || Object.keys(filters).length === 0}
            >
              {loading ? 'Buscando...' : 'Buscar Pacientes'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              disabled={loading}
            >
              Limpiar Filtros
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Resultados de Búsqueda */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {hasSearched && !loading && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Resultados de Búsqueda ({totalCount} encontrados)
              </Typography>
              {patients.length > 0 && (
                <Chip 
                  label={`${patients.length} de ${totalCount}`} 
                  color="primary" 
                  variant="outlined" 
                />
              )}
            </Box>

            {patients.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PersonSearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No se encontraron pacientes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Intenta modificar los criterios de búsqueda
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} elevation={1}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Paciente</TableCell>
                        <TableCell>Expediente</TableCell>
                        <TableCell>Edad</TableCell>
                        <TableCell>Género</TableCell>
                        <TableCell>Contacto</TableCell>
                        <TableCell>Ubicación</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patients.map((patient) => (
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
                              {patient.estado || ''} {patient.codigoPostal || ''}
                            </Typography>
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
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  component="div"
                  count={totalCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Resultados por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogo para Guardar Búsqueda */}
      <Dialog open={saveSearchDialogOpen} onClose={() => setSaveSearchDialogOpen(false)} closeAfterTransition={false}>
        <DialogTitle>Guardar Búsqueda</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nombre de la búsqueda"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Ej: Pacientes pediátricos con alergias"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveSearchDialogOpen(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={saveCurrentSearch}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Vista de Paciente */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth closeAfterTransition={false}>
        <DialogTitle>Detalles del Paciente</DialogTitle>
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
          <Button onClick={handleCloseViewDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Edición de Paciente */}
      <PatientFormDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        onPatientCreated={handlePatientUpdated}
        editingPatient={selectedPatient}
      />
    </Box>
  );
};

export default AdvancedSearchTab;