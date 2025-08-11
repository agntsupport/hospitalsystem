import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Divider,
  Alert,
  Autocomplete,
  Chip,
  FormHelperText,
} from '@mui/material';
import {
  LocalHospital,
  Person,
  MedicalServices,
  Hotel,
  AttachMoney,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { patientsService } from '@/services/patientsService';
import { roomsService } from '@/services/roomsService';
import { employeeService } from '@/services/employeeService';
import hospitalizationService from '@/services/hospitalizationService';
import { toast } from 'react-toastify';
import { Patient } from '@/types/patients.types';
import { Room } from '@/types/rooms.types';
import { Employee } from '@/types/employee.types';

interface AdmissionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  pacienteId: number | null;
  habitacionId: number | null;
  medicoTratanteId: number | null;
  motivoIngreso: string;
  diagnosticoIngreso: string;
  tipoHospitalizacion: 'programada' | 'urgencia' | 'emergencia';
  especialidad: string;
  estadoGeneral: 'estable' | 'critico' | 'grave' | 'regular';
  observacionesIngreso: string;
  aseguradora: string;
  numeroPoliza: string;
  autorizacion: string;
  restriccionesDieteticas: string[];
  cuidadosEspeciales: string[];
}

const initialFormData: FormData = {
  pacienteId: null,
  habitacionId: null,
  medicoTratanteId: null,
  motivoIngreso: '',
  diagnosticoIngreso: '',
  tipoHospitalizacion: 'programada',
  especialidad: '',
  estadoGeneral: 'estable',
  observacionesIngreso: '',
  aseguradora: '',
  numeroPoliza: '',
  autorizacion: '',
  restriccionesDieteticas: [],
  cuidadosEspeciales: [],
};

const tiposHospitalizacion = [
  { value: 'programada', label: 'Programada' },
  { value: 'urgencia', label: 'Urgencia' },
  { value: 'emergencia', label: 'Emergencia' },
];

const estadosGenerales = [
  { value: 'estable', label: 'Estable', color: 'success' },
  { value: 'regular', label: 'Regular', color: 'info' },
  { value: 'grave', label: 'Grave', color: 'warning' },
  { value: 'critico', label: 'Crítico', color: 'error' },
];

const especialidades = [
  'Medicina Interna',
  'Cirugía General',
  'Pediatría',
  'Ginecología',
  'Traumatología',
  'Cardiología',
  'Neurología',
  'Oncología',
  'UCI',
];

const AdmissionFormDialog: React.FC<AdmissionFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [doctors, setDoctors] = useState<Employee[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  // Cargar habitaciones disponibles según el tipo
  useEffect(() => {
    if (formData.especialidad === 'UCI' || formData.cuidadosEspeciales.includes('aislamiento')) {
      loadAvailableRooms();
    }
  }, [formData.especialidad, formData.cuidadosEspeciales]);

  const loadInitialData = async () => {
    try {
      // Cargar pacientes - corregido para usar response.data.items
      const patientsResponse = await patientsService.getPatients({ activo: true });
      console.log('Patients response:', patientsResponse);
      if (patientsResponse.success) {
        setPatients(patientsResponse.data?.items || []);
      }

      // Cargar médicos - corregido para usar response.data.items
      const employeesResponse = await employeeService.getEmployees({ limit: 100 });
      console.log('Employees response:', employeesResponse);
      if (employeesResponse.success) {
        // Filtrar solo médicos activos
        const allEmployees = Array.isArray(employeesResponse.data) ? employeesResponse.data : (employeesResponse.data?.items || []);
        const medicos = allEmployees.filter(
          (emp: any) => emp.activo && (emp.tipoEmpleado === 'medico_especialista' || emp.tipoEmpleado === 'medico_residente')
        ) || [];
        console.log('Filtered doctors:', medicos);
        setDoctors(medicos);
      }

      // Cargar habitaciones disponibles
      loadAvailableRooms();
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar datos iniciales');
    }
  };

  const loadAvailableRooms = async () => {
    try {
      const roomsResponse = await roomsService.getRooms({ estado: 'disponible' });
      console.log('Rooms response:', roomsResponse);
      
      if (roomsResponse.success) {
        let filteredRooms = roomsResponse.data?.rooms || [];

        // Filtrar por tipo si es necesario
        if (formData.cuidadosEspeciales.includes('aislamiento')) {
          filteredRooms = filteredRooms.filter((room: Room) => 
            room.tipo === 'individual' || room.tipo === 'aislamiento'
          );
        }

        if (formData.especialidad === 'UCI') {
          filteredRooms = filteredRooms.filter((room: Room) => 
            room.tipo === 'terapia_intensiva'
          );
        }

        setAvailableRooms(filteredRooms);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast.error('Error al cargar habitaciones');
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handlePatientSelect = (patient: Patient | null) => {
    if (patient) {
      setSelectedPatient(patient);
      handleInputChange('pacienteId', patient.id);
    } else {
      setSelectedPatient(null);
      handleInputChange('pacienteId', null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.pacienteId) {
      newErrors.pacienteId = 'Debe seleccionar un paciente';
    }

    if (!formData.habitacionId) {
      newErrors.habitacionId = 'Debe seleccionar una habitación';
    }

    if (!formData.medicoTratanteId) {
      newErrors.medicoTratanteId = 'Debe seleccionar un médico tratante';
    }

    if (!formData.motivoIngreso.trim()) {
      newErrors.motivoIngreso = 'El motivo de ingreso es requerido';
    }

    if (!formData.diagnosticoIngreso.trim()) {
      newErrors.diagnosticoIngreso = 'El diagnóstico es requerido';
    }

    if (!formData.especialidad) {
      newErrors.especialidad = 'Debe seleccionar una especialidad';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await hospitalizationService.createAdmission({
        pacienteId: formData.pacienteId!,
        habitacionId: formData.habitacionId!,
        medicoTratanteId: formData.medicoTratanteId!,
        motivoIngreso: formData.motivoIngreso,
        diagnosticoIngreso: formData.diagnosticoIngreso,
        tipoHospitalizacion: formData.tipoHospitalizacion,
        especialidad: formData.especialidad,
        estadoGeneral: formData.estadoGeneral,
        observacionesIngreso: formData.observacionesIngreso,
        aseguradora: formData.aseguradora,
        numeroPoliza: formData.numeroPoliza,
        autorizacion: formData.autorizacion,
        restriccionesDieteticas: formData.restriccionesDieteticas,
        cuidadosEspeciales: formData.cuidadosEspeciales,
      });

      toast.success('Ingreso hospitalario registrado exitosamente');
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar el ingreso');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setSelectedPatient(null);
    onClose();
  };

  const getEstadoColor = (estado: string) => {
    const estadoInfo = estadosGenerales.find(e => e.value === estado);
    return estadoInfo?.color || 'default';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LocalHospital color="primary" />
          <Typography variant="h6">Nuevo Ingreso Hospitalario</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Sección: Datos del Paciente */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person /> Datos del Paciente
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  options={patients}
                  getOptionLabel={(option) => 
                    `${option.numeroExpediente} - ${option.nombre} ${option.apellidoPaterno} ${option.apellidoMaterno}`
                  }
                  value={selectedPatient}
                  onChange={(_, newValue) => handlePatientSelect(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Buscar Paciente"
                      required
                      error={!!errors.pacienteId}
                      helperText={errors.pacienteId}
                    />
                  )}
                />
              </Grid>

              {selectedPatient && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Edad:</strong> {selectedPatient.edad} años | 
                      <strong> Tipo de Sangre:</strong> {selectedPatient.tipoSangre} | 
                      <strong> Alergias:</strong> {selectedPatient.alergias || 'Ninguna'}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Sección: Información de Ingreso */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedicalServices /> Información de Ingreso
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Hospitalización</InputLabel>
                  <Select
                    value={formData.tipoHospitalizacion}
                    onChange={(e) => handleInputChange('tipoHospitalizacion', e.target.value)}
                    label="Tipo de Hospitalización"
                  >
                    {tiposHospitalizacion.map((tipo) => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!errors.especialidad}>
                  <InputLabel>Especialidad</InputLabel>
                  <Select
                    value={formData.especialidad}
                    onChange={(e) => handleInputChange('especialidad', e.target.value)}
                    label="Especialidad"
                  >
                    {especialidades.map((esp) => (
                      <MenuItem key={esp} value={esp}>
                        {esp}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.especialidad && (
                    <FormHelperText>{errors.especialidad}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Estado General del Paciente</InputLabel>
                  <Select
                    value={formData.estadoGeneral}
                    onChange={(e) => handleInputChange('estadoGeneral', e.target.value)}
                    label="Estado General del Paciente"
                  >
                    {estadosGenerales.map((estado) => (
                      <MenuItem key={estado.value} value={estado.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip 
                            label={estado.label} 
                            size="small" 
                            color={estado.color as any}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Motivo de Ingreso"
                  multiline
                  rows={2}
                  value={formData.motivoIngreso}
                  onChange={(e) => handleInputChange('motivoIngreso', e.target.value)}
                  error={!!errors.motivoIngreso}
                  helperText={errors.motivoIngreso}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Diagnóstico de Ingreso"
                  multiline
                  rows={2}
                  value={formData.diagnosticoIngreso}
                  onChange={(e) => handleInputChange('diagnosticoIngreso', e.target.value)}
                  error={!!errors.diagnosticoIngreso}
                  helperText={errors.diagnosticoIngreso}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones de Ingreso"
                  multiline
                  rows={2}
                  value={formData.observacionesIngreso}
                  onChange={(e) => handleInputChange('observacionesIngreso', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Sección: Asignación de Habitación y Médico */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Hotel /> Asignación de Habitación y Médico
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!errors.habitacionId}>
                  <InputLabel>Habitación</InputLabel>
                  <Select
                    value={formData.habitacionId || ''}
                    onChange={(e) => handleInputChange('habitacionId', e.target.value)}
                    label="Habitación"
                  >
                    {availableRooms.map((room) => (
                      <MenuItem key={room.id} value={room.id}>
                        {room.numero} - {room.tipo} - Piso {room.piso}
                        {room.caracteristicas && (
                          <Chip 
                            label={room.caracteristicas} 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.habitacionId && (
                    <FormHelperText>{errors.habitacionId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!errors.medicoTratanteId}>
                  <InputLabel>Médico Tratante</InputLabel>
                  <Select
                    value={formData.medicoTratanteId || ''}
                    onChange={(e) => handleInputChange('medicoTratanteId', e.target.value)}
                    label="Médico Tratante"
                  >
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        Dr(a). {doctor.nombre} {doctor.apellidoPaterno} - {doctor.especialidad}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.medicoTratanteId && (
                    <FormHelperText>{errors.medicoTratanteId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cuidados Especiales"
                  multiline
                  rows={2}
                  value={formData.cuidadosEspeciales.join(', ')}
                  onChange={(e) => {
                    const cuidados = e.target.value
                      .split(',')
                      .map(c => c.trim())
                      .filter(c => c.length > 0);
                    handleInputChange('cuidadosEspeciales', cuidados);
                  }}
                  helperText="Separe con comas (ej: aislamiento, UCI, monitoreo cardiaco)"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Restricciones Dietéticas"
                  value={formData.restriccionesDieteticas.join(', ')}
                  onChange={(e) => {
                    const restricciones = e.target.value
                      .split(',')
                      .map(r => r.trim())
                      .filter(r => r.length > 0);
                    handleInputChange('restriccionesDieteticas', restricciones);
                  }}
                  helperText="Separe con comas (ej: sin sal, sin azúcar, ayuno)"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Sección: Información Administrativa */}
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney /> Información Administrativa
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Aseguradora"
                  value={formData.aseguradora}
                  onChange={(e) => handleInputChange('aseguradora', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Número de Póliza"
                  value={formData.numeroPoliza}
                  onChange={(e) => handleInputChange('numeroPoliza', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Número de Autorización"
                  value={formData.autorizacion}
                  onChange={(e) => handleInputChange('autorizacion', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>

          {formData.estadoGeneral === 'critico' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <strong>Atención:</strong> Paciente en estado crítico. Asegurar disponibilidad 
              de recursos y personal especializado.
            </Alert>
          )}

          {formData.estadoGeneral === 'grave' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Precaución:</strong> Paciente en estado grave. Requiere monitoreo constante.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={<LocalHospital />}
        >
          {loading ? 'Registrando...' : 'Registrar Ingreso'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdmissionFormDialog;