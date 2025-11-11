import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  LocalHospital as LocalHospitalIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ExitToApp as ExitToAppIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Hotel as HotelIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  History as HistoryIcon
} from '@mui/icons-material';

import hospitalizationService from '@/services/hospitalizationService';
import AdmissionFormDialog from './AdmissionFormDialog';
import MedicalNotesDialog from './MedicalNotesDialog';
import DischargeDialog from './DischargeDialog';
import AuditTrail from '@/components/common/AuditTrail';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  HospitalAdmission,
  HospitalizationStats,
  HospitalizationFilters
} from '@/types/hospitalization.types';

const HospitalizationPage: React.FC = () => {
  // Información del usuario actual
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Roles que pueden crear ingresos hospitalarios
  const rolesAutorizadosParaCrear = ['administrador', 'cajero', 'medico_residente', 'medico_especialista'];
  const rolesAutorizadosParaNotasSoap = ['administrador', 'enfermero', 'medico_residente', 'medico_especialista'];
  const rolesAutorizadosParaAlta = ['administrador', 'medico_residente', 'medico_especialista'];
  const puedeCrearIngreso = user && rolesAutorizadosParaCrear.includes(user.rol);
  const puedeVerNotasSoap = user && rolesAutorizadosParaNotasSoap.includes(user.rol);
  const puedeDarAlta = user && rolesAutorizadosParaAlta.includes(user.rol);
  
  // Estados principales
  const [admissions, setAdmissions] = useState<HospitalAdmission[]>([]);
  const [stats, setStats] = useState<HospitalizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros y búsqueda
  const [filters, setFilters] = useState<HospitalizationFilters>({
    pagina: 1,
    limite: 10
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedSpaceType, setSelectedSpaceType] = useState<string>('');

  // Estados de paginación
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Estados de diálogos
  const [admissionDialogOpen, setAdmissionDialogOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<HospitalAdmission | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [medicalNotesDialogOpen, setMedicalNotesDialogOpen] = useState(false);
  const [selectedAdmissionForNotes, setSelectedAdmissionForNotes] = useState<HospitalAdmission | null>(null);
  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false);
  const [selectedAdmissionForDischarge, setSelectedAdmissionForDischarge] = useState<HospitalAdmission | null>(null);
  const [auditTrailOpen, setAuditTrailOpen] = useState(false);
  const [auditEntityId, setAuditEntityId] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, [filters, selectedSpaceType]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar admisiones y estadísticas en paralelo
      const [admissionsResponse, statsResponse] = await Promise.all([
        hospitalizationService.getAdmissions(filters),
        hospitalizationService.getStats()
      ]);

      if (admissionsResponse.success && admissionsResponse.data) {
        let admissionsData = admissionsResponse.data?.items || [];

        // Aplicar filtro de tipo de espacio en el frontend
        if (selectedSpaceType) {
          admissionsData = admissionsData.filter((admission: any) => {
            if (selectedSpaceType === 'habitacion' && admission.habitacion) return true;
            if (selectedSpaceType === 'consultorio' && admission.consultorio) return true;
            if (selectedSpaceType === 'quirofano' && admission.quirofano) return true;
            return false;
          });
        }

        setAdmissions(admissionsData);
        setTotalItems(admissionsResponse.data?.pagination?.total || 0);
        setTotalPages(admissionsResponse.data?.pagination?.totalPages || 1);
      } else {
        setError(admissionsResponse.message || 'Error al cargar hospitalizaciones');
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos de hospitalización');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      busqueda: searchTerm || undefined,
      estado: selectedStatus ? [selectedStatus as any] : undefined,
      especialidades: selectedSpecialty ? [selectedSpecialty] : undefined,
      pagina: 1
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedSpecialty('');
    setSelectedSpaceType('');
    setFilters({
      pagina: 1,
      limite: 10
    });
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setFilters(prev => ({ ...prev, pagina: page }));
  };

  const handleViewDetails = (admission: HospitalAdmission) => {
    setSelectedAdmission(admission);
    setDetailDialogOpen(true);
  };

  const handleOpenMedicalNotes = (admission: HospitalAdmission) => {
    setSelectedAdmissionForNotes(admission);
    setMedicalNotesDialogOpen(true);
  };

  const handleOpenDischarge = (admission: HospitalAdmission) => {
    console.log('=== DEBUG handleOpenDischarge ===');
    console.log('Admission:', admission);
    console.log('User:', user);
    console.log('puedeDarAlta:', puedeDarAlta);
    setSelectedAdmissionForDischarge(admission);
    setDischargeDialogOpen(true);
    console.log('DischargeDialog should open now');
  };

  const handleViewPatientStatus = async (admission: HospitalAdmission) => {
    try {
      const response = await hospitalizationService.getPatientStatus(admission.id);
      if (response.success) {
        // Crear objeto compatible con el diálogo de detalle existente
        const patientData = {
          ...admission,
          // Enriquecer con datos del estado del paciente
          paciente: {
            ...admission.paciente,
            ...response.data.paciente
          },
          habitacion: response.data.habitacion || admission.habitacion,
          medicoTratante: response.data.medicoTratante || admission.medicoTratante,
          estado: response.data.hospitalizacion.estado || admission.estado,
          diagnosticoIngreso: response.data.hospitalizacion.diagnosticoIngreso || admission.diagnosticoIngreso,
          fechaIngreso: response.data.hospitalizacion.fechaIngreso || admission.fechaIngreso,
          fechaAlta: response.data.hospitalizacion.fechaAlta || admission.fechaAlta
        };
        
        setSelectedAdmission(patientData);
        setDetailDialogOpen(true);
      } else {
        toast.error(response.message || 'Error al obtener estado del paciente');
      }
    } catch (error) {
      console.error('Error al obtener estado del paciente:', error);
      toast.error('Error al obtener estado del paciente');
    }
  };

  const handleOpenAuditTrail = (admission: HospitalAdmission) => {
    setAuditEntityId(admission.id);
    setAuditTrailOpen(true);
  };

  const handleCloseAuditTrail = () => {
    setAuditTrailOpen(false);
    setAuditEntityId(0);
  };

  const getStatusChip = (status: string) => (
    <Chip
      label={hospitalizationService.formatAdmissionStatus(status)}
      color={hospitalizationService.getStatusColor(status)}
      size="small"
    />
  );

  const getGeneralStatusChip = (status: string) => (
    <Chip
      label={hospitalizationService.formatGeneralStatus(status)}
      color={hospitalizationService.getGeneralStatusColor(status)}
      size="small"
      variant="outlined"
    />
  );

  const renderStatsCards = () => {
    if (!stats) return null;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Total Camas
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalCamas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats.camasDisponibles} disponibles
                  </Typography>
                </Box>
                <HotelIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Ocupación
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.porcentajeOcupacion}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats.camasOcupadas} ocupadas
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Pacientes Hospitalizados
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.pacientesHospitalizados}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats.ingresosHoy} ingresos hoy
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Altas Hoy
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.altasHoy}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Estancia: {stats.estanciaPromedio} días
                  </Typography>
                </Box>
                <ExitToAppIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon />
          Filtros de Búsqueda
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar paciente, expediente o diagnóstico"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={selectedStatus}
                label="Estado"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="en_observacion">En Observación</MenuItem>
                <MenuItem value="estable">Estable</MenuItem>
                <MenuItem value="critico">Crítico</MenuItem>
                <MenuItem value="alta_medica">Alta Médica</MenuItem>
                <MenuItem value="alta_voluntaria">Alta Voluntaria</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Especialidad</InputLabel>
              <Select
                value={selectedSpecialty}
                label="Especialidad"
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="Cardiología">Cardiología</MenuItem>
                <MenuItem value="Ginecología">Ginecología y Obstetricia</MenuItem>
                <MenuItem value="Neumología">Neumología</MenuItem>
                <MenuItem value="Medicina Interna">Medicina Interna</MenuItem>
                <MenuItem value="Cirugía General">Cirugía General</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Espacio</InputLabel>
              <Select
                value={selectedSpaceType}
                label="Tipo de Espacio"
                onChange={(e) => setSelectedSpaceType(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="habitacion">🛏️ Habitaciones</MenuItem>
                <MenuItem value="consultorio">🏥 Consultorios</MenuItem>
                <MenuItem value="quirofano">⚕️ Quirófanos</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                fullWidth
              >
                Buscar
              </Button>
            </Box>
          </Grid>
        </Grid>

        {(searchTerm || selectedStatus || selectedSpecialty) && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
            >
              Limpiar Filtros
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderAdmissionsTable = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon />
            Pacientes Hospitalizados ({totalItems})
          </Typography>
          
          {puedeCrearIngreso && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAdmissionDialogOpen(true)}
              color="primary"
            >
              Nuevo Ingreso
            </Button>
          )}
          
          {!puedeCrearIngreso && user?.rol === 'enfermero' && (
            <Tooltip title="Solo administradores, cajeros y médicos pueden crear ingresos">
              <Box sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.875rem' }}>
                Vista de consulta - Rol: {user.rol}
              </Box>
            </Tooltip>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : admissions.length === 0 ? (
          <Alert severity="info">
            No se encontraron pacientes hospitalizados con los filtros seleccionados.
          </Alert>
        ) : (
          <>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Espacio Asignado</TableCell>
                    <TableCell>Diagnóstico</TableCell>
                    <TableCell>Médico Tratante</TableCell>
                    <TableCell>Ingreso</TableCell>
                    <TableCell>Estancia</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Estado General</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {admissions.map((admission) => {
                    // Determinar el espacio asignado y su icono
                    let espacioInfo = { numero: '', tipo: '', icono: '', detalles: '' };

                    if (admission.habitacion) {
                      espacioInfo = {
                        numero: admission.habitacion.numero,
                        tipo: 'Habitación',
                        icono: '🛏️',
                        detalles: `${admission.habitacion.tipo}${admission.habitacion.piso ? ` • Piso ${admission.habitacion.piso}` : ''}`
                      };
                    } else if (admission.consultorio) {
                      espacioInfo = {
                        numero: admission.consultorio.numero,
                        tipo: 'Consultorio',
                        icono: '🏥',
                        detalles: `${admission.consultorio.tipo}${admission.consultorio.especialidad ? ` • ${admission.consultorio.especialidad}` : ''}`
                      };
                    } else if (admission.quirofano) {
                      espacioInfo = {
                        numero: admission.quirofano.numero,
                        tipo: 'Quirófano',
                        icono: '⚕️',
                        detalles: `${admission.quirofano.tipo}${admission.quirofano.especialidad ? ` • ${admission.quirofano.especialidad}` : ''}`
                      };
                    }

                    return (
                      <TableRow key={admission.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {admission.paciente.nombre}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {admission.paciente.numeroExpediente} • {admission.numeroIngreso}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span style={{ fontSize: '1.2rem' }}>{espacioInfo.icono}</span>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {espacioInfo.numero}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {espacioInfo.tipo} • {espacioInfo.detalles}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {admission.diagnosticoIngreso}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {admission.especialidad}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {admission.medicoTratante.nombre}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {admission.medicoTratante.especialidad}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {hospitalizationService.formatDate(admission.fechaIngreso)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {admission.horaIngreso}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {admission.diasEstancia} días
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {hospitalizationService.formatAdmissionType(admission.tipoHospitalizacion)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {getStatusChip(admission.estado)}
                      </TableCell>

                      <TableCell>
                        {getGeneralStatusChip(admission.estadoGeneral)}
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Ver Detalle">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(admission)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          
                          {puedeVerNotasSoap ? (
                            <Tooltip title="Notas Médicas SOAP">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenMedicalNotes(admission)}
                                color="primary"
                              >
                                <AssignmentIcon />
                              </IconButton>
                            </Tooltip>
                          ) : user?.rol === 'cajero' ? (
                            <Tooltip title="Estado del Paciente (Solo consulta)">
                              <IconButton
                                size="small"
                                onClick={() => handleViewPatientStatus(admission)}
                                color="info"
                              >
                                <AssignmentIcon />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                          
                          {!admission.fechaAlta && (
                            <>
                              <Tooltip title="Editar">
                                <IconButton size="small">
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>

                              {puedeDarAlta ? (
                                <Tooltip title="Dar de Alta">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleOpenDischarge(admission)}
                                  >
                                    <ExitToAppIcon />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Solo médicos pueden dar de alta">
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled
                                    >
                                      <ExitToAppIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </>
                          )}
                          
                          <Tooltip title="Historial de cambios">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleOpenAuditTrail(admission)}
                            >
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={filters.pagina || 1}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LocalHospitalIcon sx={{ fontSize: 40 }} />
          Hospitalización
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Gestión integral de pacientes hospitalizados, ingresos y altas médicas
        </Typography>
      </Box>

      {/* Tarjetas de estadísticas */}
      {renderStatsCards()}

      {/* Filtros de búsqueda */}
      {renderFilters()}

      {/* Tabla de hospitalizaciones */}
      {renderAdmissionsTable()}

      {/* Diálogo de detalle de hospitalización */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        closeAfterTransition={false}
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6" component="div">
              Detalle de Hospitalización
            </Typography>
            {selectedAdmission && (
              <Typography variant="subtitle2" color="textSecondary">
                {selectedAdmission.paciente?.nombre || 'Paciente'} • {selectedAdmission.numeroIngreso}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAdmission && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Información del Paciente
                </Typography>
                <Typography><strong>Nombre:</strong> {selectedAdmission.paciente?.nombre || 'No especificado'}</Typography>
                <Typography><strong>Expediente:</strong> {selectedAdmission.paciente?.numeroExpediente || 'No especificado'}</Typography>
                <Typography><strong>Edad:</strong> {selectedAdmission.paciente?.edad ? `${selectedAdmission.paciente.edad} años` : 'No especificada'}</Typography>
                <Typography><strong>Género:</strong> {selectedAdmission.paciente?.genero || 'No especificado'}</Typography>
                <Typography><strong>Tipo de Sangre:</strong> {selectedAdmission.paciente?.tipoSangre || 'No especificado'}</Typography>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Contacto de Emergencia
                </Typography>
                <Typography><strong>Nombre:</strong> {selectedAdmission.paciente.contactoEmergencia?.nombre || 'No especificado'}</Typography>
                <Typography><strong>Teléfono:</strong> {selectedAdmission.paciente.contactoEmergencia?.telefono || 'No especificado'}</Typography>
                <Typography><strong>Relación:</strong> {selectedAdmission.paciente.contactoEmergencia?.relacion || 'No especificado'}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Información del Ingreso
                </Typography>
                <Typography><strong>Fecha de Ingreso:</strong> {selectedAdmission.fechaIngreso ? hospitalizationService.formatDateTime(selectedAdmission.fechaIngreso, selectedAdmission.horaIngreso || '00:00') : 'No especificada'}</Typography>
                <Typography><strong>Motivo:</strong> {selectedAdmission.motivoIngreso}</Typography>
                <Typography><strong>Diagnóstico:</strong> {selectedAdmission.diagnosticoIngreso}</Typography>
                <Typography><strong>Tipo:</strong> {hospitalizationService.formatAdmissionType(selectedAdmission.tipoHospitalizacion)}</Typography>
                <Typography><strong>Especialidad:</strong> {selectedAdmission.especialidad}</Typography>
                <Typography><strong>Estado General:</strong> {hospitalizationService.formatGeneralStatus(selectedAdmission.estadoGeneral)}</Typography>
                <Typography><strong>Días de Estancia:</strong> {selectedAdmission.diasEstancia}</Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Habitación y Médico
                </Typography>
                <Typography><strong>Habitación:</strong> {selectedAdmission.habitacion?.numero || 'No asignada'} {selectedAdmission.habitacion?.tipo ? `(${selectedAdmission.habitacion.tipo})` : ''}</Typography>
                <Typography><strong>Médico Tratante:</strong> {selectedAdmission.medicoTratante?.nombre || 'No asignado'}</Typography>
                <Typography><strong>Especialidad:</strong> {selectedAdmission.medicoTratante?.especialidad || 'No especificada'}</Typography>
              </Grid>

              {selectedAdmission.observacionesIngreso && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Observaciones
                  </Typography>
                  <Typography>{selectedAdmission.observacionesIngreso}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para nuevo ingreso */}
      <AdmissionFormDialog
        open={admissionDialogOpen}
        onClose={() => setAdmissionDialogOpen(false)}
        onSuccess={() => {
          setAdmissionDialogOpen(false);
          loadData(); // Recargar lista y estadísticas
        }}
      />

      {/* Diálogo para notas médicas SOAP */}
      <MedicalNotesDialog
        open={medicalNotesDialogOpen}
        onClose={() => {
          setMedicalNotesDialogOpen(false);
          setSelectedAdmissionForNotes(null);
        }}
        admission={selectedAdmissionForNotes}
        onSuccess={() => {
          // Las notas no afectan las estadísticas principales, solo refrescar si es necesario
          toast.success('Nota médica guardada exitosamente');
        }}
      />

      {/* Diálogo para alta hospitalaria */}
      <DischargeDialog
        open={dischargeDialogOpen}
        onClose={() => {
          setDischargeDialogOpen(false);
          setSelectedAdmissionForDischarge(null);
        }}
        admission={selectedAdmissionForDischarge}
        onSuccess={() => {
          setDischargeDialogOpen(false);
          setSelectedAdmissionForDischarge(null);
          loadData(); // Recargar lista y estadísticas después del alta
        }}
      />

      {/* Audit Trail Dialog */}
      <AuditTrail
        open={auditTrailOpen}
        onClose={handleCloseAuditTrail}
        entityType="hospitalizacion"
        entityId={auditEntityId}
        title="Historial de Cambios - Hospitalización"
      />
    </Box>
  );
};

export default HospitalizationPage;