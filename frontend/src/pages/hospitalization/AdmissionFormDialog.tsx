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
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  LocalHospital,
  Person,
  MedicalServices,
  Hotel,
  AttachMoney,
  Warning,
} from '@mui/icons-material';
import { FormControlLabel, Checkbox } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { patientsService } from '@/services/patientsService';
import { roomsService } from '@/services/roomsService';
import { employeeService } from '@/services/employeeService';
import hospitalizationService from '@/services/hospitalizationService';
import { toast } from 'react-toastify';
import { Patient } from '@/types/patients.types';
import { Room } from '@/types/rooms.types';
import { Employee } from '@/types/employee.types';
import { admissionFormSchema, AdmissionFormValues } from '@/schemas/hospitalization.schemas';

interface AdmissionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Default values matching the schema
const defaultValues: AdmissionFormValues = {
  pacienteId: 0,
  habitacionId: 0,
  medicoTratanteId: 0,
  tipoIngreso: 'programado',
  diagnosticoIngreso: '',
  motivoIngreso: '',
  observaciones: '',
  requiereAislamiento: false,
  nivelCuidado: 'basico',
  autorizacionSeguro: '',
  contactoEmergencia: {
    nombre: '',
    telefono: '',
    relacion: ''
  }
};

const tiposIngreso = [
  { value: 'programado', label: 'Programado' },
  { value: 'urgencia', label: 'Urgencia' },
  { value: 'traslado', label: 'Traslado' },
];

const nivelesCuidado = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'intensivo', label: 'Intensivo' },
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
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [doctors, setDoctors] = useState<Employee[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AdmissionFormValues>({
    resolver: yupResolver(admissionFormSchema),
    defaultValues,
  });

  const watchedValues = watch();

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  // Cargar habitaciones disponibles según el nivel de cuidado
  useEffect(() => {
    if (watchedValues.nivelCuidado === 'intensivo' || watchedValues.requiereAislamiento) {
      loadAvailableRooms();
    }
  }, [watchedValues.nivelCuidado, watchedValues.requiereAislamiento]);

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

        // Filtrar por tipo según nivel de cuidado
        if (watchedValues.requiereAislamiento) {
          filteredRooms = filteredRooms.filter((room: Room) => 
            room.tipo === 'individual' || room.tipo === 'aislamiento'
          );
        }

        if (watchedValues.nivelCuidado === 'intensivo') {
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


  const handlePatientSelect = (patient: Patient | null) => {
    if (patient) {
      setSelectedPatient(patient);
      setValue('pacienteId', patient.id);
    } else {
      setSelectedPatient(null);
      setValue('pacienteId', 0);
    }
  };


  const onSubmit = async (data: AdmissionFormValues) => {
    setLoading(true);
    try {
      // Transform data to match the API expectations
      // Buscar especialidad del médico seleccionado
      const medicoSeleccionado = doctors.find(doc => doc.id === data.medicoTratanteId);
      
      await hospitalizationService.createAdmission({
        pacienteId: data.pacienteId,
        habitacionId: data.habitacionId,
        medicoTratanteId: data.medicoTratanteId,
        motivoIngreso: data.motivoIngreso,
        diagnosticoIngreso: data.diagnosticoIngreso,
        tipoHospitalizacion: data.tipoIngreso,
        especialidad: medicoSeleccionado?.especialidad || 'Medicina General',
        nivelCuidado: data.nivelCuidado,
        requiereAislamiento: data.requiereAislamiento,
        observacionesIngreso: data.observaciones,
        autorizacion: data.autorizacionSeguro,
        contactoEmergencia: data.contactoEmergencia,
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
    reset();
    setSelectedPatient(null);
    onClose();
  };


  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth closeAfterTransition={false}>
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
                <Controller
                  name="pacienteId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      options={patients}
                      getOptionLabel={(option) => 
                        `${option.numeroExpediente} - ${option.nombre} ${option.apellidoPaterno} ${option.apellidoMaterno}`
                      }
                      value={selectedPatient}
                      onChange={(_, newValue) => {
                        handlePatientSelect(newValue);
                        field.onChange(newValue?.id || 0);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar Paciente"
                          required
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
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
                <Controller
                  name="tipoIngreso"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth required error={!!fieldState.error}>
                      <InputLabel>Tipo de Ingreso</InputLabel>
                      <Select
                        {...field}
                        label="Tipo de Ingreso"
                      >
                        {tiposIngreso.map((tipo) => (
                          <MenuItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldState.error && (
                        <FormHelperText>{fieldState.error.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="nivelCuidado"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth required error={!!fieldState.error}>
                      <InputLabel>Nivel de Cuidado</InputLabel>
                      <Select
                        {...field}
                        label="Nivel de Cuidado"
                      >
                        {nivelesCuidado.map((nivel) => (
                          <MenuItem key={nivel.value} value={nivel.value}>
                            {nivel.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldState.error && (
                        <FormHelperText>{fieldState.error.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="requiereAislamiento"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...field}
                          checked={field.value}
                        />
                      }
                      label="Requiere Aislamiento"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="motivoIngreso"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      required
                      label="Motivo de Ingreso"
                      multiline
                      rows={2}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="diagnosticoIngreso"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      required
                      label="Diagnóstico de Ingreso"
                      multiline
                      rows={2}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="observaciones"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Observaciones de Ingreso"
                      multiline
                      rows={2}
                    />
                  )}
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
                <Controller
                  name="habitacionId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth required error={!!fieldState.error}>
                      <InputLabel>Habitación</InputLabel>
                      <Select
                        {...field}
                        value={field.value || ''}
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
                      {fieldState.error && (
                        <FormHelperText>{fieldState.error.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="medicoTratanteId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth required error={!!fieldState.error}>
                      <InputLabel>Médico Responsable</InputLabel>
                      <Select
                        {...field}
                        value={field.value || ''}
                        label="Médico Responsable"
                      >
                        {doctors.map((doctor) => (
                          <MenuItem key={doctor.id} value={doctor.id}>
                            Dr(a). {doctor.nombre} {doctor.apellidoPaterno} - {doctor.especialidad}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldState.error && (
                        <FormHelperText>{fieldState.error.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

            </Grid>
          </Box>

          {/* Sección: Información Administrativa y Contacto de Emergencia */}
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney /> Información Administrativa
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="autorizacionSeguro"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Número de Autorización del Seguro"
                    />
                  )}
                />
              </Grid>

              {/* Contacto de Emergencia */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Contacto de Emergencia
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Controller
                  name="contactoEmergencia.nombre"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      required
                      label="Nombre del Contacto"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Controller
                  name="contactoEmergencia.telefono"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      required
                      label="Teléfono"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Controller
                  name="contactoEmergencia.relacion"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      required
                      label="Relación"
                      placeholder="ej: Esposo(a), Hijo(a), Padre, etc."
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {watchedValues.nivelCuidado === 'intensivo' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <strong>Atención:</strong> Paciente requiere cuidados intensivos. Asegurar disponibilidad 
              de recursos y personal especializado.
            </Alert>
          )}

          {watchedValues.requiereAislamiento && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Precaución:</strong> Paciente requiere aislamiento. Verificar disponibilidad de habitación apropiada.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
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